import base64
import binascii
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User


bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    iterations = settings.auth_password_iterations
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return (
        f"pbkdf2_sha256${iterations}${salt}$"
        f"{base64.urlsafe_b64encode(hashed).decode('utf-8')}"
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_text, salt, stored_hash = password_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    try:
        iterations = int(iterations_text)
    except ValueError:
        return False

    candidate_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    expected = base64.urlsafe_b64encode(candidate_hash).decode("utf-8")
    return hmac.compare_digest(expected, stored_hash)


def create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.auth_token_expire_minutes
    )
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": int(expires_at.timestamp()),
    }
    return encode_jwt(payload, settings.auth_secret_key)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
        )

    payload = decode_jwt(credentials.credentials, settings.auth_secret_key)
    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    try:
        parsed_user_id = int(str(user_id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        ) from exc

    user = db.scalar(select(User).where(User.id == parsed_user_id))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user was not found.",
        )

    return user


def encode_jwt(payload: dict[str, object], secret_key: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = _encode_segment(header)
    encoded_payload = _encode_segment(payload)
    signature = hmac.new(
        secret_key.encode("utf-8"),
        f"{encoded_header}.{encoded_payload}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=").decode("utf-8")
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_jwt(token: str, secret_key: str) -> dict[str, object]:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
    except ValueError as exc:
        raise unauthorized_error() from exc

    expected_signature = hmac.new(
        secret_key.encode("utf-8"),
        f"{encoded_header}.{encoded_payload}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    actual_signature = _decode_base64_segment(encoded_signature)

    if not hmac.compare_digest(expected_signature, actual_signature):
        raise unauthorized_error()

    payload = json.loads(_decode_base64_segment(encoded_payload).decode("utf-8"))
    expires_at = payload.get("exp")

    if not isinstance(expires_at, int):
        raise unauthorized_error()

    if datetime.now(timezone.utc).timestamp() >= expires_at:
        raise unauthorized_error("Authentication token has expired.")

    return payload


def unauthorized_error(detail: str = "Invalid authentication token.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def _encode_segment(value: dict[str, object]) -> str:
    raw = json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")


def _decode_base64_segment(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    try:
        return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))
    except (binascii.Error, ValueError) as exc:
        raise unauthorized_error() from exc
