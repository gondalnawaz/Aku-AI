from fastapi import FastAPI, UploadFile, File

from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from dotenv import load_dotenv

import uvicorn

import shutil

import uuid

import os

import logging

import asyncio

import signal

from pathlib import Path

logging.basicConfig(

    level=logging.INFO,

    format="[%(asctime)s] %(name)s - %(levelname)s - %(message)s"

)

logger = logging.getLogger(__name__)

env_path = Path(__file__).parent.parent.parent / ".env"

if not env_path.exists():

    env_path = Path(__file__).parent / ".env"

load_dotenv(env_path)

from database import SessionLocal, engine, Base

from routers import jobs, checkout, auth, locale, reviews, users, payments

from app.services.job_processor import start_job_processor

from app.core.config import settings

UPLOAD_DIR = settings.UPLOAD_DIR

os.makedirs(UPLOAD_DIR, exist_ok=True)

job_processor_instance = None

@asynccontextmanager

async def lifespan(app: FastAPI):

    print("Server starting...")

    global job_processor_instance

    

    Base.metadata.create_all(bind=engine)

    logger.info("Database initialized")

    try:

        job_processor_instance = start_job_processor(session_factory=SessionLocal)

        logger.info("Background job processor started")

    except Exception as e:

        logger.error(f"Failed to start job processor: {e}")

    yield

    print("Server shutting down...")

    if job_processor_instance:

        job_processor_instance.stop()

        logger.info("Background job processor stopped")

async def cleanup_resources():

    """Gracefully close all pending resources"""

    tasks = asyncio.all_tasks()

    for task in tasks:

        task.cancel()

    await asyncio.gather(*tasks, return_exceptions=True)

app = FastAPI(title="BG Analysis API", version="1.0.0", lifespan=lifespan)

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=False,

    allow_methods=["*"],

    allow_headers=["*"],

)

app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

app.include_router(auth.router, tags=["auth"])

app.include_router(jobs.router)

app.include_router(checkout.router)

app.include_router(locale.router, prefix="/locale", tags=["locale"])

app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])

app.include_router(users.router)
app.include_router(payments.router)

@app.post("/upload")

async def upload_file(file: UploadFile = File(...)):

    ext = os.path.splitext(file.filename)[1]

    filename = f"{uuid.uuid4()}{ext}"

    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:

        shutil.copyfileobj(file.file, f)

    file_url = os.path.abspath(path)

    return {"file_url": file_url, "file_name": file.filename}

@app.get("/health")

def health():

    return {"status": "ok"}

if __name__ == "__main__":

    try:

        uvicorn.run(

            "main:app",

            host="0.0.0.0",

            port=8000,

            reload=False,

        )

    except KeyboardInterrupt:

        print("\nShutting down gracefully...")

        asyncio.run(cleanup_resources())

