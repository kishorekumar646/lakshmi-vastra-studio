from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Customer
from customers.auth import hash_password, verify_password, create_customer_token, get_current_customer
import cloudinary
import cloudinary.uploader
import os
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)
import urllib.request
import urllib.parse
import json as _json

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
    return {"access_token": token, "token_type": "bearer", "customer": _customer_dict(customer)}


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email == body.email).first()
    if not customer or not verify_password(body.password, customer.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_customer_token(customer.id, customer.email)
    return {"access_token": token, "token_type": "bearer", "customer": _customer_dict(customer)}


class GoogleAuthBody(BaseModel):
    credential: str  # Google ID token


@router.post("/google")
def google_auth(body: GoogleAuthBody, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google login is not configured")

    try:
        qs = urllib.parse.urlencode({"id_token": body.credential})
        url = f"https://oauth2.googleapis.com/tokeninfo?{qs}"
        req = urllib.request.Request(url, headers={"User-Agent": "LVS-Backend/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Google token invalid or expired")
            info = _json.loads(resp.read().decode())
    except HTTPException:
        raise
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=401, detail="Google token invalid or expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google verification error: {str(e)}")

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
    return {"access_token": token, "token_type": "bearer", "customer": _customer_dict(customer)}


def _customer_dict(c: Customer):
    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone or "",
        "secondary_phone": c.secondary_phone or "",
        "address": c.address or "",
        "city": c.city or "",
        "state": c.state or "",
        "pincode": c.pincode or "",
        "created_at": c.created_at,
        "profile_image_url": c.profile_image_url or None,
    }


@router.get("/me")
def me(customer: Customer = Depends(get_current_customer)):
    return _customer_dict(customer)


class UpdateProfileBody(BaseModel):
    phone: str = ""
    secondary_phone: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""

    def validate(self):
        if self.pincode and (not self.pincode.isdigit() or len(self.pincode) != 6):
            raise ValueError("PIN code must be exactly 6 digits")


@router.put("/me")
def update_me(body: UpdateProfileBody, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if body.pincode and (not body.pincode.isdigit() or len(body.pincode) != 6):
        raise HTTPException(status_code=422, detail="PIN code must be exactly 6 digits")
    customer.phone = body.phone
    customer.secondary_phone = body.secondary_phone or None
    customer.address = body.address or None
    customer.city = body.city or None
    customer.state = body.state or None
    customer.pincode = body.pincode or None
    db.commit()
    db.refresh(customer)
    return _customer_dict(customer)


@router.put("/me/avatar")
async def update_avatar(
    profile_image: UploadFile = File(...),
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    result = cloudinary.uploader.upload(profile_image.file, folder="lakshmi-vastra/avatars")
    customer.profile_image_url = result["secure_url"]
    db.commit()
    db.refresh(customer)
    return _customer_dict(customer)
