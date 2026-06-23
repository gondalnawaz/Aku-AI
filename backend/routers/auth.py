import os

import base64

import hashlib

import hmac

import secrets

from typing import Optional

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Header

from sqlalchemy.orm import Session

from sqlalchemy.exc import IntegrityError

from passlib.context import CryptContext

from jose import JWTError, jwt

from random import randint

import smtplib

from email.mime.text import MIMEText

from email.mime.multipart import MIMEMultipart

from database import get_db

from models import User

from schemas import (

    LoginRequest, RegisterRequest, TokenResponse, UserOut,

    VerifyOtpRequest, ResendOtpRequest, ForgotPasswordRequest, ResetPasswordRequest

)

router = APIRouter()

SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')

ALGORITHM = 'HS256'

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))

SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')

SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))

SMTP_USER = os.getenv('SMTP_USER', '')

SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')

SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', 'noreply@example.com')

APP_ENV = os.getenv('APP_ENV', os.getenv('ENVIRONMENT', 'development')).lower()

IS_PRODUCTION = APP_ENV == 'production'

pwd_context = CryptContext(schemes=['bcrypt_sha256', 'bcrypt'], deprecated='auto')

PBKDF2_PREFIX = 'pbkdf2_sha256'

PBKDF2_ITERATIONS = 390000

def hash_password(password: str) -> str:

    salt = secrets.token_bytes(16)

    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, PBKDF2_ITERATIONS)

    salt_b64 = base64.b64encode(salt).decode('ascii')

    digest_b64 = base64.b64encode(digest).decode('ascii')

    return f'{PBKDF2_PREFIX}${PBKDF2_ITERATIONS}${salt_b64}${digest_b64}'

def verify_password(plain: str, hashed: str) -> bool:

    if hashed.startswith(f'{PBKDF2_PREFIX}$'):

        try:

            _, iterations_str, salt_b64, digest_b64 = hashed.split('$', 3)

            iterations = int(iterations_str)

            salt = base64.b64decode(salt_b64.encode('ascii'))

            expected = base64.b64decode(digest_b64.encode('ascii'))

            actual = hashlib.pbkdf2_hmac('sha256', plain.encode('utf-8'), salt, iterations)

            return hmac.compare_digest(actual, expected)

        except (ValueError, TypeError):

            return False

    try:

        return pwd_context.verify(plain, hashed)

    except Exception:

        return False

def create_access_token(user_id: str, email: str, expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:

    expires = datetime.now(timezone.utc) + timedelta(minutes=expires_in)

    payload = {'sub': str(user_id), 'email': email, 'exp': expires}

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):

    

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get('sub')

        if not user_id:

            raise HTTPException(status_code=401, detail='Invalid token')

        return payload

    except JWTError:

        raise HTTPException(status_code=401, detail='Invalid token')

def _resolve_user_from_authorization(authorization: Optional[str], db: Session) -> User:

    if not authorization:

        raise HTTPException(status_code=401, detail='Not authenticated')

    parts = authorization.split()

    if len(parts) != 2 or parts[0].lower() != 'bearer':

        raise HTTPException(status_code=401, detail='Invalid authorization header')

    payload = verify_token(parts[1])

    user_id = payload.get('sub')

    user = db.query(User).filter(User.id == user_id).first()

    if not user:

        raise HTTPException(status_code=401, detail='User not found')

    return user

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:

    

    return _resolve_user_from_authorization(authorization, db)

def get_optional_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:

    if not authorization:

        return None

    return _resolve_user_from_authorization(authorization, db)

def generate_otp() -> str:

    

    return str(randint(100000, 999999))

def send_email(to_email: str, subject: str, body: str, html: Optional[str] = None) -> bool:

    

    if not SMTP_USER or not SMTP_PASSWORD:

        print(f"Email to {to_email}: {subject}\n{body}")

        return False

    

    try:

        msg = MIMEMultipart('alternative')

        msg['Subject'] = subject

        msg['From'] = SMTP_FROM_EMAIL

        msg['To'] = to_email

        

        msg.attach(MIMEText(body, 'plain'))

        if html:

            msg.attach(MIMEText(html, 'html'))

        

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            server.login(SMTP_USER, SMTP_PASSWORD)

            server.send_message(msg)

        return True

    except Exception as e:

        print(f"Failed to send email: {e}")

        return False

@router.post('/auth/register', response_model=dict)

def register(req: RegisterRequest, db: Session = Depends(get_db)):

    

    print(f"Attempting to register user with email: {req.email}")

    existing = db.query(User).filter(User.email == req.email).first()

    if existing:

        if existing.is_verified:

            raise HTTPException(status_code=400, detail='Email already registered')

        otp = generate_otp()

        existing.hashed_password = hash_password(req.password)

        existing.otp_code = otp

        db.commit()

        email_sent = send_email(

            req.email,

            'Verify your email',

            f'Your verification code is: {otp}',

            f'<p>Your verification code is: <strong>{otp}</strong></p>'

        )

        response = {

            'detail': 'Account already exists but is not verified. We sent a new OTP.' if email_sent else 'Account already exists but is not verified. Email delivery failed; use the OTP below for local development.',

            'email_sent': email_sent,

            'requires_verification': True,

        }

        if not email_sent and not IS_PRODUCTION:

            response['debug_otp'] = otp

        return response

    

    otp = generate_otp()

    user = User(

        email=req.email,

        hashed_password=hash_password(req.password),

        otp_code=otp,

        is_verified=False

    )

    db.add(user)

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(status_code=400, detail='Email already registered')

    

    email_sent = send_email(

        req.email,

        'Verify your email',

        f'Your verification code is: {otp}',

        f'<p>Your verification code is: <strong>{otp}</strong></p>'

    )

    response = {

        'detail': 'Registration successful. Check your email for the OTP.' if email_sent else 'Registration successful. Email delivery failed; use the OTP below for local development.',

        'email_sent': email_sent,

    }

    if not email_sent and not IS_PRODUCTION:

        response['debug_otp'] = otp

    return response

@router.post('/auth/verify-otp', response_model=TokenResponse)

def verify_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):

    

    user = db.query(User).filter(User.email == req.email).first()

    if not user:

        raise HTTPException(status_code=404, detail='User not found')

    

    if user.otp_code != req.otp_code:

        raise HTTPException(status_code=400, detail='Invalid OTP code')

    

    user.is_verified = True

    user.otp_code = None

    db.commit()

    

    token = create_access_token(str(user.id), user.email)

    return {'access_token': token}

@router.post('/auth/resend-otp')

def resend_otp(req: ResendOtpRequest, db: Session = Depends(get_db)):

    

    user = db.query(User).filter(User.email == req.email).first()

    if not user:

        return {'detail': 'If email exists, you will receive an OTP.'}

    

    otp = generate_otp()

    user.otp_code = otp

    db.commit()

    

    email_sent = send_email(

        req.email,

        'Your new verification code',

        f'Your verification code is: {otp}',

        f'<p>Your verification code is: <strong>{otp}</strong></p>'

    )

    response = {

        'detail': 'OTP sent to your email' if email_sent else 'Email delivery failed; use the OTP below for local development.',

        'email_sent': email_sent,

    }

    if not email_sent and not IS_PRODUCTION:

        response['debug_otp'] = otp

    return response

@router.post('/auth/login', response_model=TokenResponse)

def login(req: LoginRequest, db: Session = Depends(get_db)):

    

    user = db.query(User).filter(User.email == req.email).first()

    if not user or not verify_password(req.password, user.hashed_password or ''):

        raise HTTPException(status_code=401, detail='Invalid email or password')

    

    if not user.is_verified:

        raise HTTPException(status_code=403, detail='Email not verified. Please verify your email first.')

    

    token = create_access_token(str(user.id), user.email)

    return {'access_token': token}

@router.post('/auth/forgot-password')

def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):

    

    user = db.query(User).filter(User.email == req.email).first()

    if not user:

        return {'detail': 'If email exists, you will receive a password reset link.'}

    

    reset_token = jwt.encode(

        {'sub': str(user.id), 'exp': datetime.now(timezone.utc) + timedelta(hours=1), 'type': 'reset'},

        SECRET_KEY,

        algorithm=ALGORITHM

    )

    user.reset_token = reset_token

    db.commit()

    

    reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token={reset_token}"

    send_email(

        req.email,

        'Reset your password',

        f'Click here to reset your password: {reset_url}',

        f'<p><a href="{reset_url}">Click here to reset your password</a></p>'

    )

    

    return {'detail': 'Password reset link sent to your email'}

@router.post('/auth/reset-password')

def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):

    

    try:

        payload = jwt.decode(req.reset_token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get('type') != 'reset':

            raise HTTPException(status_code=400, detail='Invalid reset token')

        user_id = payload.get('sub')

    except JWTError:

        raise HTTPException(status_code=400, detail='Invalid or expired reset token')

    

    user = db.query(User).filter(User.id == user_id).first()

    if not user or user.reset_token != req.reset_token:

        raise HTTPException(status_code=400, detail='Invalid reset token')

    

    user.hashed_password = hash_password(req.new_password)

    user.reset_token = None

    db.commit()

    

    return {'detail': 'Password reset successful'}

@router.get('/auth/me', response_model=UserOut)

def get_current_user_info(current_user: User = Depends(get_current_user)):

    

    return current_user

