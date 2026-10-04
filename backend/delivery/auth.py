from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt as _bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import hashlib
import os

SECRET_KEY = os.getenv("SECRET_KEY", "changeme-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/delivery/login", auto_error=False)


def _prepare(password: str) -> bytes:
    return hashlib.sha256(password.encode()).hexdigest().encode("utf-8")


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(_prepare(password), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(_prepare(plain), hashed.encode("utf-8"))
    except Exception:
        return False


def create_delivery_token(delivery_person_id: int, email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": email, "id": delivery_person_id, "type": "delivery_person", "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_delivery_person(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from models import DeliveryPerson
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "delivery_person":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        delivery_person_id = payload.get("id")
        if delivery_person_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    person = db.query(DeliveryPerson).filter(DeliveryPerson.id == delivery_person_id).first()
    if not person:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Delivery person not found")
    if not person.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    return person
