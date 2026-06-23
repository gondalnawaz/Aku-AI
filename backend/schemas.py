from pydantic import BaseModel, EmailStr

from typing import Optional

from datetime import datetime

import uuid

class LoginRequest(BaseModel):

    email: EmailStr

    password: str

class RegisterRequest(BaseModel):

    email: EmailStr

    password: str

class VerifyOtpRequest(BaseModel):

    email: EmailStr

    otp_code: str

class ResendOtpRequest(BaseModel):

    email: EmailStr

class ForgotPasswordRequest(BaseModel):

    email: EmailStr

class ResetPasswordRequest(BaseModel):

    reset_token: str

    new_password: str

class TokenResponse(BaseModel):

    access_token: str

    token_type: str = "bearer"

class UserOut(BaseModel):

    id: uuid.UUID

    email: str

    is_verified: bool

    created_at: datetime

    model_config = {"from_attributes": True}

class MatchJobCreate(BaseModel):

    user_email: EmailStr

    file_url: Optional[str] = None

    file_name: Optional[str] = None

    file_type: Optional[str] = None

    service_speed: str

    notes: Optional[str] = None

    currency: Optional[str] = "GBP"

    language: Optional[str] = "en"

class MatchJobUpdate(BaseModel):

    stripe_session_id: Optional[str] = None

    status: Optional[str] = None

    price_paid: Optional[float] = None

    result_url: Optional[str] = None

class MatchJobOut(BaseModel):

    id: uuid.UUID

    user_email: str

    file_url: Optional[str]

    file_name: Optional[str]

    file_type: Optional[str]

    service_speed: str

    status: str

    stripe_session_id: Optional[str]

    price_paid: Optional[float]

    result_url: Optional[str]

    notes: Optional[str]

    currency: str

    language: str

    created_date: datetime

    updated_date: datetime

    model_config = {"from_attributes": True}

class CheckoutRequest(BaseModel):

    plan: str

    email: EmailStr

    job_id: Optional[str] = None

    currency: Optional[str] = "GBP"

class CheckoutResponse(BaseModel):

    url: str

    session_id: str

