import os
import hashlib
import hmac
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db

SECRET_KEY = os.getenv("JWT_SECRET", "venturebridge_hackathon_super_secret_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    iterations = 100_000
    hash_bytes = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2:sha256:{iterations}${salt}${hash_bytes.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        algo_info, salt, hash_hex = parts
        _, _, iterations_str = algo_info.split(":")
        iterations = int(iterations_str)
        test_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(test_hash.hex(), hash_hex)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please login again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )

def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict | None:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, role, full_name, location, profile_image, bio, is_verified, created_at FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            return user
    except HTTPException:
        return None
    except Exception:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role, full_name, location, profile_image, bio, is_verified, created_at FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account no longer exists."
            )
        return user

def require_role(*allowed_roles):
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: this action requires one of the following roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
