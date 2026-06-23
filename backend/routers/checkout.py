import os
import logging
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import Payment

router = APIRouter(prefix="/checkout", tags=["checkout"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

FX_RATES = {"GBP": 1.0, "EUR": 1.17, "USD": 1.27}

# Annual plan credits 40 points/month billed yearly => 480 points per successful yearly invoice.
SUBSCRIPTION_PLANS = {
    "monthly": {
        "name": "Monthly 40 Points",
        "gbp": 125,
        "points": 40,
        "interval": "month",
    },
    "annual": {
        "name": "Annual 40 Points",
        "gbp": 1250,
        "points": 480,
        "interval": "year",
    },
}


class CheckoutCreateRequest(BaseModel):
    plan: str
    email: EmailStr
    currency: str = "GBP"


def _expected_amount_minor(plan_key: str, currency: str) -> tuple[int, dict]:
    currency = (currency or "GBP").upper()
    if plan_key not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
    if currency not in FX_RATES:
        currency = "GBP"

    plan = SUBSCRIPTION_PLANS[plan_key]
    amount_minor = int(round(plan["gbp"] * FX_RATES[currency] * 100))
    return amount_minor, {**plan, "currency": currency}


def _credit_user_points(db: Session, email: str, points: int) -> None:
    result = db.execute(
        text("""
            UPDATE users
            SET points = COALESCE(points, 0) + :points
            WHERE email = :email
        """),
        {"points": points, "email": email},
    )
    if result.rowcount != 1:
        raise HTTPException(status_code=404, detail="User not found")


@router.post("")
def create_subscription_checkout(body: CheckoutCreateRequest, db: Session = Depends(get_db)):
    amount_minor, plan = _expected_amount_minor(body.plan, body.currency)

    payment = Payment(
        user_email=body.email,
        plan_key=body.plan,
        currency=plan["currency"],
        expected_amount_minor=amount_minor,
        paid_amount_minor=None,
        points_to_credit=plan["points"],
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer_email=body.email,
            success_url=f"{FRONTEND_URL}/dashboard?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/pricing?checkout=cancelled",
            line_items=[
                {
                    "quantity": 1,
                    "price_data": {
                        "currency": plan["currency"].lower(),
                        "unit_amount": amount_minor,
                        "recurring": {"interval": plan["interval"]},
                        "product_data": {"name": plan["name"]},
                    },
                }
            ],
            metadata={
                "payment_id": str(payment.id),
                "plan": body.plan,
                "user_email": body.email,
                "points": str(plan["points"]),
            },
            subscription_data={
                "metadata": {
                    "payment_id": str(payment.id),
                    "plan": body.plan,
                    "user_email": body.email,
                    "points": str(plan["points"]),
                }
            },
        )

        payment.stripe_session_id = session.id
        db.commit()

        return {"url": session.url, "session_id": session.id, "payment_id": payment.id}
    except Exception as e:
        payment.status = "failed"
        payment.failure_reason = f"session_create_failed: {str(e)}"
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to create Stripe subscription checkout session")


logger = logging.getLogger(__name__)

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not WEBHOOK_SECRET:
        logger.error("Stripe webhook misconfigured: STRIPE_WEBHOOK_SECRET is empty")
        raise HTTPException(status_code=500, detail="Webhook not configured")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except ValueError as e:
        logger.warning(
            "Stripe webhook invalid payload: len=%s, has_signature=%s, error=%s",
            len(payload),
            bool(sig_header),
            str(e),
        )
        raise HTTPException(status_code=400, detail="Invalid webhook payload")
    except stripe.error.SignatureVerificationError as e:
        logger.warning(
            "Stripe webhook signature verification failed: len=%s, has_signature=%s, secret_prefix=%s, error=%s",
            len(payload),
            bool(sig_header),
            WEBHOOK_SECRET[:6] if WEBHOOK_SECRET else "none",
            str(e),
        )
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception as e:
        logger.exception("Stripe webhook unexpected verification error: %s", str(e))
        raise HTTPException(status_code=400, detail="Webhook verification failed")

    event_type = event["type"]

    # 1) Checkout session completed: attach subscription/customer ids to the pending payment row.
    if event_type == "checkout.session.completed":
        session_obj = event["data"]["object"]
        payment_id = (session_obj.get("metadata") or {}).get("payment_id")
        subscription_id = session_obj.get("subscription")
        customer_id = session_obj.get("customer")

        payment = None
        if payment_id:
            payment = db.query(Payment).filter(Payment.id == int(payment_id)).first()
        if not payment and session_obj.get("id"):
            payment = db.query(Payment).filter(Payment.stripe_session_id == session_obj["id"]).first()

        if not payment:
            return {"ok": True, "ignored": "payment_not_found"}

        payment.stripe_subscription_id = subscription_id
        payment.stripe_customer_id = customer_id
        payment.status = "pending"
        db.commit()
        return {"ok": True}

    # 2) Successful invoice payment: credit points.
    if event_type == "invoice.paid":
        invoice = event["data"]["object"]
        invoice_id = invoice.get("id")
        subscription_id = invoice.get("subscription")
        customer_id = invoice.get("customer")
        amount_paid = int(invoice.get("amount_paid") or 0)
        currency = (invoice.get("currency") or "").upper()

        # Idempotency: if this invoice already exists as success, do nothing.
        existing = db.query(Payment).filter(Payment.stripe_invoice_id == invoice_id).first()
        if existing and existing.status == "success":
            return {"ok": True, "idempotent": True}

        if not subscription_id:
            return {"ok": True, "ignored": "no_subscription"}

        subscription = stripe.Subscription.retrieve(subscription_id)
        metadata = subscription.get("metadata") or {}
        email = metadata.get("user_email")
        plan_key = metadata.get("plan")
        points = int(metadata.get("points") or 0)

        if plan_key not in SUBSCRIPTION_PLANS:
            return {"ok": True, "ignored": "invalid_plan"}

        expected_amount_minor, plan = _expected_amount_minor(plan_key, currency or metadata.get("currency", "GBP"))
        if amount_paid != expected_amount_minor:
            payment = existing or Payment(
                user_email=email,
                plan_key=plan_key,
                currency=currency or plan["currency"],
                expected_amount_minor=expected_amount_minor,
                points_to_credit=points,
            )
            payment.stripe_invoice_id = invoice_id
            payment.stripe_subscription_id = subscription_id
            payment.stripe_customer_id = customer_id
            payment.paid_amount_minor = amount_paid
            payment.status = "failed"
            payment.failure_reason = f"amount_mismatch expected={expected_amount_minor} paid={amount_paid}"
            db.add(payment)
            db.commit()
            return {"ok": True, "marked_failed": "amount_mismatch"}

        payment = existing or Payment(
            user_email=email,
            plan_key=plan_key,
            currency=currency or plan["currency"],
            expected_amount_minor=expected_amount_minor,
            points_to_credit=points,
        )
        payment.stripe_invoice_id = invoice_id
        payment.stripe_subscription_id = subscription_id
        payment.stripe_customer_id = customer_id
        payment.paid_amount_minor = amount_paid
        payment.status = "success"
        payment.failure_reason = None
        db.add(payment)

        if not email:
            db.commit()
            return {"ok": True, "ignored": "missing_email"}

        _credit_user_points(db, email, points)
        db.commit()
        return {"ok": True}

    # 3) Failed invoice payment: mark failed.
    if event_type in {"invoice.payment_failed", "invoice.finalization_failed"}:
        invoice = event["data"]["object"]
        invoice_id = invoice.get("id")
        subscription_id = invoice.get("subscription")
        customer_id = invoice.get("customer")

        subscription = None
        email = None
        plan_key = None
        points = 0
        expected_amount_minor = 0
        currency = (invoice.get("currency") or "GBP").upper()

        if subscription_id:
            subscription = stripe.Subscription.retrieve(subscription_id)
            metadata = subscription.get("metadata") or {}
            email = metadata.get("user_email")
            plan_key = metadata.get("plan")
            points = int(metadata.get("points") or 0)
            if plan_key in SUBSCRIPTION_PLANS:
                expected_amount_minor, plan = _expected_amount_minor(plan_key, currency)
                currency = plan["currency"]

        payment = db.query(Payment).filter(Payment.stripe_invoice_id == invoice_id).first()
        if not payment:
            payment = Payment(
                user_email=email or "unknown",
                plan_key=plan_key or "unknown",
                currency=currency,
                expected_amount_minor=expected_amount_minor,
                points_to_credit=points,
            )

        payment.stripe_invoice_id = invoice_id
        payment.stripe_subscription_id = subscription_id
        payment.stripe_customer_id = customer_id
        payment.status = "failed"
        payment.failure_reason = event_type
        db.add(payment)
        db.commit()
        return {"ok": True}

    return {"ok": True, "ignored": event_type}

