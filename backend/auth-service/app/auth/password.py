import hashlib
import base64
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _pre_hash(password: str) -> str:
    """Pre-hash password with SHA-256 and base64 encode to fit into bcrypt's 72-byte limit."""
    # This allowed passwords of any length to be securely hashed by bcrypt.
    sha_hash = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(sha_hash).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if the provided plain password matches the stored hash. Uses pre-hashing."""
    return pwd_context.verify(_pre_hash(plain_password), hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of the plain password. Uses pre-hashing."""
    return pwd_context.hash(_pre_hash(password))
