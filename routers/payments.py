from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Payment
from routers.auth import get_current_user  # adjust if your auth dependency differs

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("")
def list_payments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    payments = (
        db.query(Payment)
        .filter(Payment.user_email == current_user.email)
        .order_by(Payment.created_at.desc())
        .all()
    )

    return [
        {
            "id":               p.id,
            "plan_key":         p.plan_key,
            "points_credited":  p.points_to_credit,
            "expected_amount":  round(p.expected_amount_minor / 100, 2) if p.expected_amount_minor else None,
            "paid_amount":      round(p.paid_amount_minor / 100, 2) if p.paid_amount_minor else None,
            "currency":         p.currency,
            "status":           p.status,
            "stripe_session_id":p.stripe_session_id,
            "created_at":       p.created_at.isoformat(),
        }
        for p in payments
    ]