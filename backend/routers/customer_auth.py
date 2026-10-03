from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Customer
from customer_auth import hash_password, verify_password, create_customer_token, get_current_customer
import urllib.request
import urllib.parse
import json
import os

router = APIRouter(prefix="/api/auth", tags=["customer-auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


class RegisterBody(BaseModel):
    name: str
    email: str
    phone: str = ""
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    customer = Customer(
        name=body.name,
        email=body.email,
        phone=body.phone,
        hashed_password=hash_password(body.password),
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    token = create_customer_token(customer.id, customer.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": {"id": customer.id, "name": customer.name, "email": customer.email, "phone": customer.phone},
    }


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email == body.email).first()
    if not customer or not verify_password(body.password, customer.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_customer_token(customer.id, customer.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": {"id": customer.id, "name": customer.name, "email": customer.email, "phone": customer.phone},
    }


class GoogleAuthBody(BaseModel):
    credential: str  # Google ID token


@router.post("/google")
def google_auth(body: GoogleAuthBody, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google login is not configured")

    # Verify the ID token with Google's tokeninfo endpoint
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(body.credential)}"
        with urllib.request.urlopen(url, timeout=10) as resp:
            info = json.loads(resp.read().decode())
    except Exception:
        raise HTTPException(status_code=401, detail="Google token verification failed")

    if info.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Token audience mismatch")
    if info.get("email_verified") != "true":
        raise HTTPException(status_code=401, detail="Google email not verified")

    email = info["email"]
    name = info.get("name") or email.split("@")[0]

    customer = db.query(Customer).filter(Customer.email == email).first()
    if not customer:
        customer = Customer(
            email=email,
            name=name,
            phone="",
            hashed_password="__GOOGLE_OAUTH__",
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    token = create_customer_token(customer.id, customer.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": {"id": customer.id, "name": customer.name, "email": customer.email, "phone": customer.phone},
    }


@router.get("/me")
def me(customer: Customer = Depends(get_current_customer)):
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "created_at": customer.created_at,
    }
