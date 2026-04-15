"""
app/auth/google.py — Verifies Google ID tokens server-side.

The frontend receives a credential (Google ID token) after OAuth.
We send it here to verify it's genuinely from Google — not forged.
"""

import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


def verify_google_token(credential: str) -> dict:
    """
    Verify a Google ID token and return the decoded payload.

    Returns dict with: sub, email, name, picture, email_verified
    Raises ValueError if the token is invalid or expired.
    """
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("GOOGLE_CLIENT_ID is not set in auth-service/.env")

    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
        if not idinfo.get("email_verified"):
            raise ValueError("Google email is not verified.")
        return idinfo
    except Exception as exc:
        raise ValueError(f"Invalid Google token: {exc}") from exc
