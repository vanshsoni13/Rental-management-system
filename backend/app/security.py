from datetime import datetime, timedelta, timezone
import os
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import jwt_expiry_seconds, required_setting

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("ascii")


def verify_password(password: str, encoded: str | None) -> bool:
    if not encoded:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), encoded.encode("ascii"))
    except (ValueError, TypeError):
        return False


def create_token(user: dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": int(user["user_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "iat": now,
        "exp": now + timedelta(seconds=jwt_expiry_seconds()),
    }
    return jwt.encode(payload, required_setting("JWT_SECRET"), algorithm="HS256")


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication failed: No token provided")
    try:
        return jwt.decode(
            credentials.credentials,
            required_setting("JWT_SECRET"),
            algorithms=["HS256"],
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed: Invalid or expired token",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Authentication is not configured") from exc


def optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict[str, Any] | None:
    if credentials is None:
        return None
    return current_user(credentials)


def require_roles(*roles: str):
    def role_dependency(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Access denied: insufficient permissions")
        return user

    return role_dependency


def seller_approved(user: dict[str, Any] = Depends(require_roles("seller"))) -> dict[str, Any]:
    from .database import fetch_one

    profile = fetch_one(
        "SELECT status FROM seller_profiles WHERE user_id = %s",
        (user["user_id"],),
    )
    if not profile or profile["status"] != "approved":
        raise HTTPException(status_code=403, detail="Seller account is not approved")
    return user
