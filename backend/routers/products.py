from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import cloudinary
import cloudinary.uploader
import os
from database import get_db
from models import Product, Category
from auth import verify_token

router = APIRouter(prefix="/api/products", tags=["products"])

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


def product_to_dict(p: Product):
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "image_url": p.image_url,
        "category_id": p.category_id,
        "category_name": p.category.name if p.category else None,
        "is_featured": p.is_featured,
        "is_available": p.is_available,
        "created_at": str(p.created_at),
    }


@router.get("")
def list_products(
    category_id: Optional[int] = None,
    featured: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.is_available == True)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if featured is not None:
        query = query.filter(Product.is_featured == featured)
    return [product_to_dict(p) for p in query.order_by(Product.created_at.desc()).all()]


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_dict(p)


@router.post("")
def create_product(
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category_id: int = Form(...),
    is_featured: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(verify_token),
):
    image_url = None
    image_public_id = None

    if image:
        result = cloudinary.uploader.upload(image.file, folder="lakshmi-vastra")
        image_url = result["secure_url"]
        image_public_id = result["public_id"]

    product = Product(
        name=name,
        description=description,
        price=price,
        category_id=category_id,
        is_featured=is_featured,
        image_url=image_url,
        image_public_id=image_public_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_dict(product)


@router.put("/{product_id}")
def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category_id: int = Form(...),
    is_featured: bool = Form(False),
    is_available: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(verify_token),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if image:
        if product.image_public_id:
            cloudinary.uploader.destroy(product.image_public_id)
        result = cloudinary.uploader.upload(image.file, folder="lakshmi-vastra")
        product.image_url = result["secure_url"]
        product.image_public_id = result["public_id"]

    product.name = name
    product.description = description
    product.price = price
    product.category_id = category_id
    product.is_featured = is_featured
    product.is_available = is_available
    db.commit()
    db.refresh(product)
    return product_to_dict(product)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.image_public_id:
        cloudinary.uploader.destroy(product.image_public_id)
    db.delete(product)
    db.commit()
    return {"message": "Deleted"}
