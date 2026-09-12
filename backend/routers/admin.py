from fastapi import APIRouter, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, Query
import os
import math
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Product
from auth import create_access_token, verify_token
from routers.products import product_to_dict

load_dotenv(Path(__file__).parent.parent / ".env")

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "changeme123")

    if form_data.username != admin_username or form_data.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/products")
def admin_list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(verify_token),
):
    base = db.query(Product)
    total = base.count()
    offset = (page - 1) * per_page
    items = (
        base
        .options(joinedload(Product.category), joinedload(Product.images))
        .order_by(Product.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )
    return {
        "items": [product_to_dict(p) for p in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total > 0 else 1,
    }
