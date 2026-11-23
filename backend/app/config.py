import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


def required_setting(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} must be set in backend/.env")
    if name == "JWT_SECRET" and (len(value) < 32 or value.lower().startswith("replace-this")):
        raise RuntimeError("JWT_SECRET must be replaced with a unique random value of at least 32 characters")
    return value


def cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def jwt_expiry_seconds() -> int:
    value = os.getenv("JWT_EXPIRES_IN", "7d").strip().lower()
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    try:
        if value[-1:] in units:
            return int(value[:-1]) * units[value[-1]]
        return int(value)
    except (ValueError, IndexError) as exc:
        raise RuntimeError("JWT_EXPIRES_IN must be seconds or a value such as 7d") from exc
