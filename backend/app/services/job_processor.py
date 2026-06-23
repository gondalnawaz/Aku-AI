import asyncio
import json
import logging
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.request import urlopen

from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.services.detection_service import detection_service
from models import MatchJob, PointLedger

# ── Path setup ────────────────────────────────────────────────────────────────
_backend_root = Path(__file__).resolve().parents[2]
_detection_module_path = _backend_root / "detection_module"
if str(_detection_module_path) not in sys.path:
    sys.path.insert(0, str(_detection_module_path))

logger = logging.getLogger(__name__)

# Quick jobs processed before standard (lower number = higher priority)
SERVICE_PRIORITY = {"quick": 0, "standard": 1, "trial": 2}

TRIAL_MAX_BYTES = 100 * 1024 * 1024


class JobProcessor:
    def __init__(
        self,
        session_factory: sessionmaker,
        poll_interval_sec: int = 5,
        max_workers: int = 2,
    ):
        # Guard: catch misconfiguration immediately
        if not callable(session_factory):
            raise TypeError(
                f"session_factory must be a callable sessionmaker, "
                f"got {type(session_factory).__name__} instead. "
                f"Pass SessionLocal, not a Session instance."
            )
        self.session_factory = session_factory
        self.poll_interval = poll_interval_sec
        self.max_workers = max_workers
        self.active_tasks: dict[str, asyncio.Task] = {}
        self.is_running = False

    def _new_db(self) -> Session:
        """Fresh session per job — prevents stale state."""
        return self.session_factory()

    async def process_job(self, job_id: str):
        db: Session = self._new_db()
        try:
            # Lock row to avoid double-processing
            job = (
                db.execute(
                    text("""
                        SELECT * FROM match_jobs
                        WHERE id = :id AND status = 'queued'
                        FOR UPDATE SKIP LOCKED
                    """),
                    {"id": job_id},
                ).fetchone()
            )

            if not job:
                logger.warning(f"[Job {job_id}] Not found or already taken")
                return

            # Mark processing
            db.execute(
                text("UPDATE match_jobs SET status = 'processing' WHERE id = :id"),
                {"id": job_id},
            )
            db.commit()

            # logger.info(f"[Job {job_id}] Reading file: {job.file_url}")
            # file_bytes = self._read_file(job.file_url)
            # if not file_bytes:
            #     raise ValueError(f"Could not read file: {job.file_url}")

            logger.info(f"[Job {job_id}] Running detection...")
            detection_result = detection_service.run(job.file_url, job.file_name or "video")

            if detection_result.error:
                raise ValueError(f"Detection error: {detection_result.error}")

            _, result_url = self._save_result(job_id, detection_result)

            db.execute(
                text("""
                    UPDATE match_jobs
                    SET status = 'completed',
                        result_url = :url,
                        completed_at = :now
                    WHERE id = :id
                """),
                {
                    "url": result_url,
                    "now": datetime.now(timezone.utc),
                    "id": job_id,
                },
            )
            db.commit()
            logger.info(f"[Job {job_id}] ✓ Completed")

        except Exception as e:
            logger.error(f"[Job {job_id}] ✗ Failed: {e}")
            try:
                db.rollback()
                db.execute(
                    text("""
                        UPDATE match_jobs
                        SET status = 'failed',
                            failure_reason = :reason,
                            completed_at = :now
                        WHERE id = :id
                    """),
                    {
                        "reason": str(e)[:500],
                        "now": datetime.now(timezone.utc),
                        "id": job_id,
                    },
                )
                db.commit()
            except Exception as db_err:
                logger.error(f"[Job {job_id}] Could not mark failed: {db_err}")
        finally:
            db.close()

    def _read_file(self, file_path: str) -> Optional[bytes]:
        try:
            if file_path.startswith(("http://", "https://")):
                with urlopen(file_path, timeout=300) as resp:
                    return resp.read()
            return Path(file_path).read_bytes()
        except Exception as e:
            logger.error(f"Failed to read file {file_path}: {e}")
            return None

    def _save_result(self, job_id: str, detection_result):
        result_dir = Path(settings.UPLOAD_DIR) / "results"
        result_dir.mkdir(parents=True, exist_ok=True)
        result_file = result_dir / f"{job_id}_result.json"
        result_file.write_text(
            json.dumps(detection_result.model_dump(), indent=2),
            encoding="utf-8",
        )
        backend_base = getattr(settings, "BACKEND_BASE_URL", "http://localhost:8000")
        result_url = f"{backend_base.rstrip('/')}/files/results/{result_file.name}"
        return result_file, result_url

    async def poll_for_jobs(self):
        logger.info("Job processor polling started")
        self.is_running = True

        while self.is_running:
            try:
                # Clean up completed tasks
                done = [jid for jid, t in self.active_tasks.items() if t.done()]
                for jid in done:
                    try:
                        self.active_tasks[jid].result()
                    except Exception as e:
                        logger.error(f"Task {jid} raised: {e}")
                    del self.active_tasks[jid]

                if len(self.active_tasks) < self.max_workers:
                    db = self._new_db()
                    try:
                        # Priority order: quick → standard → trial, then oldest first
                        row = db.execute(
                            text("""
                                SELECT id FROM match_jobs
                                WHERE status = 'queued'
                                ORDER BY
                                    CASE service_speed
                                        WHEN 'quick'    THEN 0
                                        WHEN 'standard' THEN 1
                                        ELSE 2
                                    END ASC,
                                    created_date ASC
                                LIMIT 1
                            """)
                        ).fetchone()
                    finally:
                        db.close()

                    if row:
                        job_id = str(row[0])
                        if job_id not in self.active_tasks:
                            logger.info(f"Dispatching job: {job_id}")
                            task = asyncio.create_task(self.process_job(job_id))
                            self.active_tasks[job_id] = task

            except Exception as e:
                logger.error(f"Polling loop error: {e}")

            await asyncio.sleep(self.poll_interval)

    def start(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self.poll_for_jobs())
        finally:
            loop.close()

    def stop(self):
        self.is_running = False
        logger.info("Job processor stopped")


_processor_lock = threading.Lock()
_job_processor: Optional[JobProcessor] = None


def start_job_processor(session_factory: sessionmaker) -> JobProcessor:
    global _job_processor
    with _processor_lock:
        if not callable(session_factory):
            raise TypeError(
                f"start_job_processor requires a sessionmaker factory, "
                f"got {type(session_factory).__name__}. "
                f"Pass SessionLocal from database.py."
            )
        if _job_processor is None:
            _job_processor = JobProcessor(
                session_factory=session_factory,
                poll_interval_sec=5,
                max_workers=2,
            )
            thread = threading.Thread(
                target=_job_processor.start,
                daemon=True,
                name="job-processor",
            )
            thread.start()
            logger.info("Job processor thread started")
    return _job_processor

