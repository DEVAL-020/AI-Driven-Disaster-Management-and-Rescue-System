import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request
from bson import ObjectId

JWT_ALGORITHM = "HS256"
ACCESS_MIN = 60 * 24
REFRESH_DAYS = 7

ROLES = {"admin", "rescue_team", "citizen"}


def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "sentinel-ai-fallback-secret-key-2026")


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_MIN),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def _cookie_opts() -> dict:
    return {
        "httponly": True,
        "secure": os.environ.get("COOKIE_SECURE", "true").lower() == "true",
        "samesite": os.environ.get("COOKIE_SAMESITE", "lax").lower(),
        "path": "/",
    }


def set_auth_cookies(response, access_token: str, refresh_token: str):
    response.set_cookie("access_token", access_token, max_age=ACCESS_MIN * 60, **_cookie_opts())
    response.set_cookie("refresh_token", refresh_token, max_age=REFRESH_DAYS * 86400, **_cookie_opts())


def clear_auth_cookies(response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


async def get_current_user(request: Request, db) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        try:
            user_oid = ObjectId(payload["sub"])
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"_id": user_oid})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
