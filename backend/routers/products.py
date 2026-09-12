from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
import cloudinary
import cloudinary.uploader
import os
from database import get_db
from models import Product, ProductImage, Category
from auth import verify_token

router = APIRouter(prefix="/api/products", tags=["products"])

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


def product_to_dict(p: Product):
    db_images = [{"id": img.id, "url": img.image_url, "public_id": img.image_public_id} for img in p.images]
    primary_url = db_images[0]["url"] if db_images else p.image_url
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "image_url": primary_url,
        "images": db_images,
        "category_id": p.category_id,
        "category_name": p.category.name if p.category else None,
        "is_featured": p.is_featured,
        "is_available": p.is_available,
        "created_at": str(p.created_at),
    }


def upload_image(file: UploadFile) -> tuple[str, str]:
    result = cloudinary.uploader.upload(file.file, folder="lakshmi-vastra")
    return result["secure_url"], result["public_id"]


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
    items = (
        query
        .options(joinedload(Product.category), joinedload(Product.images))
        .order_by(Product.created_at.desc())
        .all()
    )
    return [product_to_dict(p) for p in items]


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.images))
        .filter(Product.id == product_id)
        .first()
    )
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
    images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(verify_token),
):
    product = Product(
        name=name,
        description=description,
        price=price,
        category_id=category_id,
        is_featured=is_featured,
    )
    db.add(product)
    db.flush()  # get product.id before committing

    if images:
        for i, img in enumerate(images):
            if img.filename:
                url, public_id = upload_image(img)
                db.add(ProductImage(
                    product_id=product.id,
                    image_url=url,
                    image_public_id=public_id,
                    sort_order=i,
                ))
                if i == 0:
                    product.image_url = url
                    product.image_public_id = public_id

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
    images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(verify_token),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name = name
    product.description = description
    product.price = price
    product.category_id = category_id
    product.is_featured = is_featured
    product.is_available = is_available

    if images:
        existing_count = len(product.images)
        for i, img in enumerate(images):
            if img.filename:
                url, public_id = upload_image(img)
                db.add(ProductImage(
                    product_id=product.id,
                    image_url=url,
                    image_public_id=public_id,
                    sort_order=existing_count + i,
                ))
        # Update primary image if we now have images in ProductImage table
        db.flush()
        db.refresh(product)
        if product.images:
            product.image_url = product.images[0].image_url
            product.image_public_id = product.images[0].image_public_id

    db.commit()
    db.refresh(product)
    return product_to_dict(product)


@router.delete("/{product_id}/images/{image_id}")
def delete_product_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_token),
):
    img = db.query(ProductImage).filter(
        ProductImage.id == image_id,
        ProductImage.product_id == product_id,
    ).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    if img.image_public_id:
        try:
            cloudinary.uploader.destroy(img.image_public_id)
        except Exception:
            pass

    db.delete(img)

    # Update product.image_url to the next remaining image
    product = db.query(Product).filter(Product.id == product_id).first()
    db.flush()
    db.refresh(product)
    if product.images:
        product.image_url = product.images[0].image_url
        product.image_public_id = product.images[0].image_public_id
    else:
        product.image_url = None
        product.image_public_id = None

    db.commit()
    return {"message": "Image deleted"}


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete all cloudinary images
    for img in product.images:
        if img.image_public_id:
            try:
                cloudinary.uploader.destroy(img.image_public_id)
            except Exception:
                pass
    if product.image_public_id and not product.images:
        try:
            cloudinary.uploader.destroy(product.image_public_id)
        except Exception:
            pass

    db.delete(product)
    db.commit()
    return {"message": "Deleted"}
