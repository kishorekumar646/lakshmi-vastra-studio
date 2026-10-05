from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import Optional, List
import cloudinary
import cloudinary.uploader
import os
from database import get_db
from models import ShopOwner, Product, ProductImage, Category, Order, OrderItem, OrderStatusHistory
from shops.auth import hash_password, verify_password, create_shop_owner_token, get_current_shop_owner
from orders.qr import generate_qr_base64

router = APIRouter(prefix="/api/shops", tags=["shops"])

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    name: str
    shop_name: str
    email: str
    phone: str = ""
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    if db.query(ShopOwner).filter(ShopOwner.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    owner = ShopOwner(
        name=body.name,
        shop_name=body.shop_name,
        email=body.email,
        phone=body.phone,
        hashed_password=hash_password(body.password),
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return {"message": "Registration successful. Awaiting admin approval.", "id": owner.id}


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    owner = db.query(ShopOwner).filter(ShopOwner.email == body.email).first()
    if not owner or not verify_password(body.password, owner.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not owner.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    if not owner.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")
    token = create_shop_owner_token(owner.id, owner.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "shop_owner": _owner_dict(owner),
    }


@router.get("/me")
def me(owner: ShopOwner = Depends(get_current_shop_owner)):
    return _owner_dict(owner)


@router.put("/me/avatar")
async def update_shop_avatar(
    profile_image: UploadFile = File(...),
    owner: ShopOwner = Depends(get_current_shop_owner),
    db: Session = Depends(get_db),
):
    result = cloudinary.uploader.upload(profile_image.file, folder="lakshmi-vastra/avatars")
    owner.profile_image_url = result["secure_url"]
    db.commit()
    db.refresh(owner)
    return _owner_dict(owner)


class UpdateMeBody(BaseModel):
    name: Optional[str] = None
    shop_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    gst_number: Optional[str] = None
    bank_account_holder: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_type: Optional[str] = None

class ChangePasswordBody(BaseModel):
    old_password: str
    new_password: str

@router.put("/me/password")
def change_password(
    body: ChangePasswordBody,
    owner: ShopOwner = Depends(get_current_shop_owner),
    db: Session = Depends(get_db),
):
    if not verify_password(body.old_password, owner.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=422, detail="New password must be at least 6 characters")
    owner.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.put("/me")
def update_me(
    body: UpdateMeBody,
    owner: ShopOwner = Depends(get_current_shop_owner),
    db: Session = Depends(get_db),
):
    if body.name is not None:
        owner.name = body.name.strip() or owner.name
    if body.shop_name is not None:
        owner.shop_name = body.shop_name.strip() or owner.shop_name
    if body.phone is not None:
        owner.phone = body.phone.strip() or None
    if body.address is not None:
        owner.address = body.address.strip() or None
    if body.city is not None:
        owner.city = body.city.strip() or None
    if body.state is not None:
        owner.state = body.state.strip() or None
    if body.pincode is not None:
        p = body.pincode.strip()
        if p and (not p.isdigit() or len(p) != 6):
            raise HTTPException(status_code=422, detail="PIN code must be exactly 6 digits")
        owner.pincode = p or None
    if body.gst_number is not None:
        owner.gst_number = body.gst_number.strip().upper() or None
    if body.bank_account_holder is not None:
        owner.bank_account_holder = body.bank_account_holder.strip() or None
    if body.bank_name is not None:
        owner.bank_name = body.bank_name.strip() or None
    if body.bank_account_number is not None:
        owner.bank_account_number = body.bank_account_number.strip() or None
    if body.bank_ifsc is not None:
        owner.bank_ifsc = body.bank_ifsc.strip().upper() or None
    if body.bank_account_type is not None:
        owner.bank_account_type = body.bank_account_type.strip() or None
    db.commit()
    db.refresh(owner)
    return _owner_dict(owner)


def _owner_dict(o: ShopOwner) -> dict:
    return {
        "id": o.id,
        "name": o.name,
        "shop_name": o.shop_name,
        "email": o.email,
        "phone": o.phone,
        "is_approved": o.is_approved,
        "is_active": o.is_active,
        "created_at": o.created_at,
        "profile_image_url": o.profile_image_url or None,
        "address": o.address or None,
        "city": o.city or None,
        "state": o.state or None,
        "pincode": o.pincode or None,
        "gst_number": o.gst_number or None,
        "bank_account_holder": o.bank_account_holder or None,
        "bank_name": o.bank_name or None,
        "bank_account_number": o.bank_account_number or None,
        "bank_ifsc": o.bank_ifsc or None,
        "bank_account_type": o.bank_account_type or None,
    }


# ── Products ──────────────────────────────────────────────────────────────────

def _upload(file: UploadFile) -> tuple[str, str]:
    result = cloudinary.uploader.upload(file.file, folder="lakshmi-vastra")
    return result["secure_url"], result["public_id"]


def _product_dict(p: Product) -> dict:
    db_images = [{"id": img.id, "url": img.image_url, "public_id": img.image_public_id} for img in p.images]
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "image_url": db_images[0]["url"] if db_images else p.image_url,
        "images": db_images,
        "category_id": p.category_id,
        "category_name": p.category.name if p.category else None,
        "is_featured": p.is_featured,
        "is_available": p.is_available,
        "is_handloom": p.is_handloom or False,
        "has_multiple_colours": p.has_multiple_colours or False,
        "custom_orders": p.custom_orders or False,
        "created_at": str(p.created_at),
    }


@router.get("/products")
def list_shop_products(
    owner: ShopOwner = Depends(get_current_shop_owner),
    db: Session = Depends(get_db),
):
    items = (
        db.query(Product)
        .filter(Product.shop_owner_id == owner.id)
        .options(joinedload(Product.category), selectinload(Product.images))
        .order_by(Product.created_at.desc())
        .all()
    )
    return [_product_dict(p) for p in items]


@router.post("/products")
def create_product(
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category_id: int = Form(...),
    is_featured: bool = Form(False),
    is_handloom: bool = Form(False),
    has_multiple_colours: bool = Form(False),
    custom_orders: bool = Form(False),
    images: Optional[List[UploadFile]] = File(None),
    owner: ShopOwner = Depends(get_current_shop_owner),
    db: Session = Depends(get_db),
):
    product = Product(
        name=name,
        description=description,
        price=price,
        category_id=category_id,
        shop_owner_id=owner.id,
        is_featured=is_featured,
        is_handloom=is_handloom,
        has_multiple_colours=has_multiple_colours,
        custom_orders=custom_orders,
    )
    db.add(product)
    db.flush()

    if images:
        for i, img in enumerate(images):
            if img.filename:
                url, public_id = _upload(img)
                db.add(ProductImage(product_id=product.id, image_url=url, image_public_id=public_id, sort_order=i))
                if i == 0:
                    product.image_url = url
                    product.image_public_id = public_id

    db.commit()
    db.refresh(product)
    return _product_dict(product)


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category_id: int = Form(...),
    is_featured: bool = Form(False),
    is_available: bool = Form(True),
    is_handloom: bool = Form(False),
    has_multiple_colours: bool = Form(False),
    custom_orders: bool = Form(False),
    images: Optional[List[UploadFile]] = File(None),
    owner: ShopOwner = Depends(get_current_shop_owner),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id, Product.shop_owner_id == owner.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name = name
    product.description = description
    product.price = price
    product.category_id = category_id
    product.is_featured = is_featured
    product.is_available = is_available
    product.is_handloom = is_handloom
    product.has_multiple_colours = has_multiple_colours
    product.custom_orders = custom_orders

    if images:
        existing_count = len(product.images)
        for i, img in enumerate(images):
            if img.filename:
                url, public_id = _upload(img)
                db.add(ProductImage(product_id=product.id, image_url=url, image_public_id=public_id, sort_order=existing_count + i))
        db.flush()
        db.refresh(product)
        if product.images:
            product.image_url = product.images[0].image_url
            product.image_public_id = product.images[0].image_public_id

    db.commit()
    db.refresh(product)
    return _product_dict(product)


@router.delete("/products/{product_id}/images/{image_id}")
def delete_product_image(
    product_id: int,
    image_id: int,
    owner: ShopOwner = Depends(get_current_shop_owner),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id, Product.shop_owner_id == owner.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

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


@router.delete("/products/{product_id}")
def delete_product(product_id: int, owner: ShopOwner = Depends(get_current_shop_owner), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.shop_owner_id == owner.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for img in product.images:
        if img.image_public_id:
            try:
                cloudinary.uploader.destroy(img.image_public_id)
            except Exception:
                pass
    db.delete(product)
    db.commit()
    return {"message": "Deleted"}


# ── Orders ────────────────────────────────────────────────────────────────────

def _order_dict(order: Order) -> dict:
    return {
        "id": order.id,
        "total": order.total,
        "status": order.status,
        "payment_method": order.payment_method,
        "delivery_address": order.delivery_address,
        "created_at": order.created_at,
        "customer": {
            "name": order.customer.name if order.customer else "",
            "email": order.customer.email if order.customer else "",
            "phone": order.customer.phone if order.customer else "",
        },
        "items": [
            {
                "product_id": item.product_id,
                "name": item.product.name if item.product else "",
                "quantity": item.quantity,
                "price": item.price,
            }
            for item in order.items
        ],
        "status_history": [
            {"status": h.status, "note": h.note, "created_at": h.created_at}
            for h in order.status_history
        ],
    }


@router.get("/orders")
def list_orders(owner: ShopOwner = Depends(get_current_shop_owner), db: Session = Depends(get_db)):
    # Use OrderItem.shop_owner_id snapshot; fall back to product join for old rows
    orders = (
        db.query(Order)
        .join(Order.items)
        .filter(
            (OrderItem.shop_owner_id == owner.id) |
            (
                (OrderItem.shop_owner_id == None) &
                (OrderItem.product_id == Product.id) &
                (Product.shop_owner_id == owner.id)
            )
        )
        .filter(Order.status.in_(["confirmed", "ready_for_delivery", "picked_up", "delivered"]))
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
            joinedload(Order.status_history),
        )
        .distinct()
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_order_dict(o) for o in orders]


@router.get("/orders/{order_id}/qr")
def get_order_qr(order_id: int, owner: ShopOwner = Depends(get_current_shop_owner), db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .join(Order.items)
        .join(OrderItem.product)
        .filter(Order.id == order_id, Product.shop_owner_id == owner.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order.qr_token:
        raise HTTPException(status_code=400, detail="QR code not available for this order")
    return {"qr_image": generate_qr_base64(order.qr_token), "qr_token": order.qr_token}


class ScanBody(BaseModel):
    qr_token: str


@router.post("/orders/scan")
def scan_qr_ready(body: ScanBody, owner: ShopOwner = Depends(get_current_shop_owner), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.qr_token == body.qr_token).first()
    if not order:
        raise HTTPException(status_code=404, detail="Invalid QR code")

    # Verify this order contains products from this shop
    has_item = (
        db.query(OrderItem)
        .join(OrderItem.product)
        .filter(OrderItem.order_id == order.id, Product.shop_owner_id == owner.id)
        .first()
    )
    if not has_item:
        raise HTTPException(status_code=403, detail="This order does not belong to your shop")

    if order.status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Order is in '{order.status}' status, cannot mark ready")

    order.status = "ready_for_delivery"
    db.add(OrderStatusHistory(order_id=order.id, status="ready_for_delivery", note=f"Marked ready by {owner.shop_name}"))
    db.commit()
    return {"success": True, "order_id": order.id, "status": order.status}
