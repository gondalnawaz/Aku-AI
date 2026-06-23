from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from models import Review
from database import get_db

router = APIRouter()


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=1000)
    user_id: str | None = None
    user_name: str | None = None
    user_email: str | None = None
    job_id: str | None = None
    page: str | None = "dashboard"
    language: str | None = "en"


@router.post("")
def create_review(body: ReviewCreate, request: Request, db: Session = Depends(get_db)):
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
        request.client.host if request.client else None
    )
    user_agent = request.headers.get("user-agent")

    review = Review(
        rating=body.rating,
        comment=body.comment.strip(),
        user_id=body.user_id,
        user_name=body.user_name,
        user_email=body.user_email,
        job_id=body.job_id,
        page=body.page,
        language=body.language,
        ip=ip,
        user_agent=user_agent,
        created_at=datetime.now(timezone.utc),
    )

    try:
        db.add(review)
        db.commit()
        db.refresh(review)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save review: {str(e)}")

    return {"ok": True, "id": review.id}