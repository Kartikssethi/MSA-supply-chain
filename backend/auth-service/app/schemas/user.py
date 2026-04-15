"""
app/schemas/user.py — Pydantic schemas for request/response validation.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    """Body sent by the frontend after Google OAuth popup."""
    credential: str  # The raw Google ID token (JWT)


class UserResponse(BaseModel):
    """User object returned in API responses."""
    id: UUID
    email: str
    name: str | None
    picture: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Returned after successful login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
