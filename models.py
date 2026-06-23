from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, Integer, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid
from database import Base

class User(Base):

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email = Column(String, unique=True, nullable=False, index=True)

    hashed_password = Column(String, nullable=True)

    is_verified = Column(Boolean, default=False)

    otp_code = Column(String, nullable=True)

    reset_token = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    points = Column(Integer, nullable=False, default=0)  # ← Add this line to track points

class MatchJob(Base):

    __tablename__ = "match_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_email = Column(String, nullable=False, index=True)

    file_url = Column(String)

    file_name = Column(String)

    file_type = Column(String)

    service_speed = Column(String, nullable=False)

    status = Column(String, default="queued")

    stripe_session_id = Column(String)

    price_paid = Column(Float)

    result_url = Column(String)

    notes = Column(Text)

    currency = Column(String, default="GBP")

    language = Column(String, default="en")

    created_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    updated_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    completed_at = Column(DateTime(timezone=True), nullable=True)

    failure_reason = Column(Text, nullable=True)

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    user_id = Column(String, nullable=True, index=True)
    user_name = Column(String, nullable=True)
    user_email = Column(String, nullable=True, index=True)
    job_id = Column(String, nullable=True, index=True)
    page = Column(String, nullable=True)
    language = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False, index=True)
    plan_key = Column(String, nullable=False)
    currency = Column(String, nullable=False, default="GBP")
    expected_amount_minor = Column(BigInteger, nullable=False)
    paid_amount_minor = Column(BigInteger, nullable=True)
    points_to_credit = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="pending", index=True)
    stripe_session_id = Column(String, nullable=True, unique=True, index=True)
    stripe_subscription_id = Column(String, nullable=True, index=True)
    stripe_invoice_id = Column(String, nullable=True, unique=True, index=True)  # ← Add this
    stripe_customer_id = Column(String, nullable=True, index=True)
    stripe_payment_intent = Column(String, nullable=True, index=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class PointLedger(Base):
    __tablename__ = "point_ledger"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False, index=True)
    delta = Column(Integer, nullable=False)           # negative = consumed, positive = credited
    reason = Column(String, nullable=False)           # "job_standard", "job_quick", "pack_purchase" etc.
    job_id = Column(String, nullable=True, index=True)
    payment_id = Column(Integer, nullable=True, index=True)
    balance_after = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

