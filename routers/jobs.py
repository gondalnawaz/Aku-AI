from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session
import uuid

from database import get_db
from models import MatchJob, PointLedger, User
from routers.auth import get_current_user, get_optional_current_user
from typing import List

router = APIRouter(prefix="/jobs", tags=["jobs"])

TRIAL_MAX_BYTES = 100 * 1024 * 1024  # 100 MB

SERVICE_POINTS = {
    "trial": 0,
    "standard": 3,
    "quick": 4,
}

from schemas import MatchJobCreate, MatchJobUpdate, MatchJobOut

class JobCreateRequest(BaseModel):
    user_email: EmailStr
    file_url: str
    file_name: str
    file_type: str
    file_size_bytes: int = 0
    service_speed: str = "standard"
    notes: str = ""
    currency: str = "GBP"
    language: str = "en"


@router.post("")
def create_job(
    body: JobCreateRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    service = body.service_speed.lower()

    if service not in SERVICE_POINTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid service plan '{service}'. Must be one of: {list(SERVICE_POINTS.keys())}",
        )

    if service != "trial":
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        if current_user.email != body.user_email:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user and current_user.email != body.user_email:
        raise HTTPException(status_code=403, detail="Forbidden")

    # ── Trial: enforce 100 MB cap ──────────────────────────────────────────────
    if service == "trial":
        if body.file_size_bytes > TRIAL_MAX_BYTES:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Trial plan allows files up to 100 MB. "
                    f"Uploaded file is {round(body.file_size_bytes / 1024 / 1024, 1)} MB."
                ),
            )

    # ── Non-trial: atomic point check + deduction ──────────────────────────────
    if service != "trial":
        required_points = SERVICE_POINTS[service]

        try:
            # Lock the user row to prevent race conditions
            user_row = db.execute(
                text("SELECT points FROM users WHERE email = :email FOR UPDATE"),
                {"email": body.user_email},
            ).fetchone()

            if user_row is None:
                raise HTTPException(
                    status_code=404,
                    detail="User not found.",
                )

            available_points = int(user_row[0] or 0)

            if available_points < required_points:
                raise HTTPException(
                    status_code=402,
                    detail=(
                        f"Insufficient points. "
                        f"Required: {required_points}, "
                        f"Available: {available_points}."
                    ),
                )

            # Deduct points atomically
            db.execute(
                text("""
                    UPDATE users
                    SET points = points - :required
                    WHERE email = :email
                      AND points >= :required
                """),
                {"required": required_points, "email": body.user_email},
            )

            balance_after = available_points - required_points

            # ── Create job ─────────────────────────────────────────────────────
            job = MatchJob(
                id=uuid.uuid4(),
                user_email=body.user_email,
                file_url=body.file_url,
                file_name=body.file_name,
                file_type=body.file_type,
                service_speed=service,
                notes=body.notes,
                currency=body.currency,
                language=body.language,
                status="queued",
                created_date=datetime.now(timezone.utc),
            )
            db.add(job)

            # ── Ledger entry ───────────────────────────────────────────────────
            ledger = PointLedger(
                user_email=body.user_email,
                delta=-required_points,
                reason=f"job_{service}",
                job_id=job.id,
                balance_after=balance_after,
            )
            db.add(ledger)

            db.commit()
            db.refresh(job)
            return job

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Job creation failed: {str(e)}")

    # ── Trial job: no points needed ────────────────────────────────────────────
    try:
        job = MatchJob(
            id=uuid.uuid4(),
            user_email=body.user_email,
            file_url=body.file_url,
            file_name=body.file_name,
            file_type=body.file_type,
            service_speed=service,
            notes=body.notes,
            currency=body.currency,
            language=body.language,
            status="queued",
            created_date=datetime.now(timezone.utc),
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Trial job creation failed: {str(e)}")


@router.get("", response_model=List[MatchJobOut])

def list_jobs(email: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    lookup_email = email or current_user.email

    if lookup_email != current_user.email:

        raise HTTPException(status_code=403, detail="Forbidden")

    return db.query(MatchJob).filter(MatchJob.user_email == lookup_email).order_by(MatchJob.created_date.desc()).all()

@router.get("/{job_id}", response_model=MatchJobOut)

def get_job(job_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    job = db.query(MatchJob).filter(MatchJob.id == job_id).first()

    if not job:

        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_email != current_user.email:

        raise HTTPException(status_code=403, detail="Forbidden")

    return job

@router.patch("/{job_id}", response_model=MatchJobOut)

def update_job(job_id: uuid.UUID, updates: MatchJobUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    job = db.query(MatchJob).filter(MatchJob.id == job_id).first()

    if not job:

        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_email != current_user.email:

        raise HTTPException(status_code=403, detail="Forbidden")

    for field, value in updates.model_dump(exclude_unset=True).items():

        setattr(job, field, value)

    db.commit()

    db.refresh(job)

    return job
