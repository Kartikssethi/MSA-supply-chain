"""
app/api/routes.py — Auth Service API routes.

POST /auth/google  → verify Google token, create/get user, return JWT
GET  /auth/me      → return current user from JWT
"""

import uuid

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.google import verify_google_token
from app.auth.jwt import create_access_token, decode_access_token
from app.auth.password import get_password_hash, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    GoogleLoginRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter()
bearer_scheme = HTTPBearer()


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------
@router.post("/register", response_model=TokenResponse)
async def register(body: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create a new user with email and password."""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered."
        )

    # Hash password and save user
    hashed_pw = get_password_hash(body.password)
    user = User(
        id=uuid.uuid4(),
        email=body.email,
        name=body.name,
        hashed_password=hashed_pw,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Issue JWT
    token = create_access_token(user_id=str(user.id), email=user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=TokenResponse)
async def login(body: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    # Issue JWT
    token = create_access_token(user_id=str(user.id), email=user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ---------------------------------------------------------------------------
# POST /auth/google
# ---------------------------------------------------------------------------
@router.post("/google", response_model=TokenResponse)
async def google_login(body: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    1. Frontend sends Google credential (ID token) after OAuth popup.
    2. We verify it with Google (server-side, secure).
    3. Create or update the user in our DB.
    4. Return our own JWT for subsequent requests.
    """
    # Step 1 — Verify the Google token
    try:
        google_payload = verify_google_token(body.credential)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    google_id: str = google_payload["sub"]
    email: str = google_payload["email"]
    name: str | None = google_payload.get("name")
    picture: str | None = google_payload.get("picture")

    # Step 2 — Find existing user or create new one
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if user is None:
        # New user — check if email already exists (edge case)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

    if user is None:
        # First time signing in — create user
        user = User(id=uuid.uuid4(), email=email, name=name, picture=picture, google_id=google_id)
        db.add(user)
    else:
        # Returning user — update profile fields
        user.name = name
        user.picture = picture
        if not user.google_id:
            user.google_id = google_id

    await db.commit()
    await db.refresh(user)

    # Step 3 — Issue our JWT
    token = create_access_token(user_id=str(user.id), email=user.email)

    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ---------------------------------------------------------------------------
# GET /auth/me  (protected — requires our JWT in Authorization header)
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Return the currently authenticated user."""
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return UserResponse.model_validate(user)
