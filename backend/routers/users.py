from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models import User
from routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/points")
def get_user_points(
    email: EmailStr | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lookup_email = email or current_user.email
    if lookup_email != current_user.email:
        raise HTTPException(status_code=403, detail="Forbidden")

    user = db.query(User).filter(User.email == lookup_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": user.email, "points": user.points or 0}