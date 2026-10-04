from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, Query
from pydantic import BaseModel
import os
import math
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, extract
from database import get_db
from models import Product, Order, OrderItem, OrderStatusHistory, DeliveryPerson, ShopOwner, Customer, Review, Inquiry, WishlistItem, ShopProduct
from admins.auth import create_access_token, verify_token
from products.router import product_to_dict
from delivery.auth import hash_password as delivery_hash_password
from datetime import datetime, timedelta

load_dotenv(Path(__file__).parent.parent / ".env")

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "changeme123")
    if form_data.username != admin_username or form_data.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}


# ── Products ──────────────────────────────────────────────────────────────────

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
        .options(joinedload(Product.category), selectinload(Product.images))
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
            "id": order.customer.id if order.customer else None,
            "name": order.customer.name if order.customer else "",
            "email": order.customer.email if order.customer else "",
            "phone": order.customer.phone if order.customer else "",
        },
        "delivery_person": {
            "id": order.delivery_person.id,
            "name": order.delivery_person.name,
            "phone": order.delivery_person.phone,
        } if order.delivery_person else None,
        "items": [
            {
                "product_id": item.product_id,
                "name": item.product.name if item.product else "",
                "quantity": item.quantity,
                "price": item.price,
                "image_url": item.product.image_url if item.product else None,
                "shop_name": item.shop_owner.shop_name if item.shop_owner else None,
                "shop_owner_id": item.shop_owner_id,
            }
            for item in order.items
        ],
        "status_history": [
            {"status": h.status, "note": h.note, "created_at": h.created_at}
            for h in order.status_history
        ],
    }


@router.get("/orders")
def list_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    db: Session = Depends(get_db),
    _: str = Depends(verify_token),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    total = query.count()
    orders = (
        query
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.shop_owner),
            joinedload(Order.delivery_person),
            joinedload(Order.status_history),
        )
        .order_by(Order.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "items": [_order_dict(o) for o in orders],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total > 0 else 1,
    }


@router.put("/orders/{order_id}/confirm")
def confirm_order(order_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail=f"Order is already '{order.status}'")
    order.status = "confirmed"
    db.add(OrderStatusHistory(order_id=order.id, status="confirmed", note="Confirmed by admin"))
    db.commit()
    return {"success": True, "order_id": order.id, "status": order.status}


class AssignDeliveryBody(BaseModel):
    delivery_person_id: int


@router.put("/orders/{order_id}/assign-delivery")
def assign_delivery(order_id: int, body: AssignDeliveryBody, background: BackgroundTasks, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    person = db.query(DeliveryPerson).filter(DeliveryPerson.id == body.delivery_person_id, DeliveryPerson.is_active == True).first()
    if not person:
        raise HTTPException(status_code=404, detail="Delivery person not found")

    order.delivery_person_id = body.delivery_person_id
    db.add(OrderStatusHistory(order_id=order.id, status=order.status, note=f"Delivery assigned to {person.name}"))
    db.commit()

    from notifications.push import notify
    background.add_task(notify, db, "delivery_person", person.id,
        "New Delivery Assigned", f"Order #{order.id} has been assigned to you. Check the app.", "/delivery/dashboard")

    return {"success": True, "order_id": order.id, "delivery_person": person.name}


# ── Delivery Persons ──────────────────────────────────────────────────────────

class CreateDeliveryPersonBody(BaseModel):
    name: str
    email: str
    phone: str = ""
    password: str


@router.post("/delivery-persons")
def create_delivery_person(body: CreateDeliveryPersonBody, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    if db.query(DeliveryPerson).filter(DeliveryPerson.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    person = DeliveryPerson(
        name=body.name,
        email=body.email,
        phone=body.phone,
        hashed_password=delivery_hash_password(body.password),
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return {"id": person.id, "name": person.name, "email": person.email, "phone": person.phone}


@router.get("/delivery-persons")
def list_delivery_persons(db: Session = Depends(get_db), _: str = Depends(verify_token)):
    persons = db.query(DeliveryPerson).order_by(DeliveryPerson.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "phone": p.phone or "",
            "is_active": p.is_active,
            "total_deliveries": len(p.assigned_orders),
            "created_at": p.created_at,
        }
        for p in persons
    ]


class UpdateDeliveryPersonBody(BaseModel):
    name: str
    email: str
    phone: str = ""


@router.put("/delivery-persons/{person_id}")
def update_delivery_person(person_id: int, body: UpdateDeliveryPersonBody, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    person = db.query(DeliveryPerson).filter(DeliveryPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Delivery person not found")
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not body.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    existing = db.query(DeliveryPerson).filter(DeliveryPerson.email == body.email, DeliveryPerson.id != person_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    person.name = body.name.strip()
    person.email = body.email.strip()
    person.phone = body.phone.strip()
    db.commit()
    return {"id": person.id, "name": person.name, "email": person.email, "phone": person.phone}


@router.put("/delivery-persons/{person_id}/toggle-active")
def toggle_delivery_person(person_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    person = db.query(DeliveryPerson).filter(DeliveryPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Delivery person not found")
    person.is_active = not person.is_active
    db.commit()
    return {"id": person.id, "is_active": person.is_active}


# ── Shop Owners ───────────────────────────────────────────────────────────────

@router.get("/shop-owners")
def list_shop_owners(db: Session = Depends(get_db), _: str = Depends(verify_token)):
    owners = db.query(ShopOwner).order_by(ShopOwner.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "name": o.name,
            "shop_name": o.shop_name,
            "email": o.email,
            "phone": o.phone,
            "is_approved": o.is_approved,
            "is_active": o.is_active,
            "created_at": o.created_at,
        }
        for o in owners
    ]


@router.put("/shop-owners/{owner_id}/approve")
def approve_shop_owner(owner_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    owner = db.query(ShopOwner).filter(ShopOwner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Shop owner not found")
    owner.is_approved = True
    db.commit()
    return {"id": owner.id, "shop_name": owner.shop_name, "is_approved": True}


@router.put("/shop-owners/{owner_id}/toggle-active")
def toggle_shop_owner(owner_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    owner = db.query(ShopOwner).filter(ShopOwner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Shop owner not found")
    owner.is_active = not owner.is_active
    db.commit()
    return {"id": owner.id, "is_active": owner.is_active}


# ── Customers ─────────────────────────────────────────────────────────────────

@router.get("/customers")
def list_customers(db: Session = Depends(get_db), _: str = Depends(verify_token)):
    customers = db.query(Customer).order_by(Customer.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone or "",
            "secondary_phone": c.secondary_phone or "",
            "address": c.address or "",
            "city": c.city or "",
            "state": c.state or "",
            "pincode": c.pincode or "",
            "total_orders": len(c.orders),
            "created_at": c.created_at,
        }
        for c in customers
    ]


class UpdateCustomerBody(BaseModel):
    name: str
    email: str


@router.put("/customers/{customer_id}")
def update_customer(customer_id: int, body: UpdateCustomerBody, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    name = body.name.strip()
    email = body.email.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if not email:
        raise HTTPException(status_code=400, detail="Email cannot be empty")
    # Check email uniqueness if changed
    if email != customer.email:
        existing = db.query(Customer).filter(Customer.email == email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use by another account")
    customer.name = name
    customer.email = email
    db.commit()
    db.refresh(customer)
    return {"id": customer.id, "name": customer.name, "email": customer.email}


# ── Payments ──────────────────────────────────────────────────────────────────

@router.get("/payments")
def payments_report(db: Session = Depends(get_db), _: str = Depends(verify_token)):
    paid_statuses = ["confirmed", "ready_for_delivery", "picked_up", "delivered"]

    # ── Summary ────────────────────────────────────────────────────────────────
    total_collected   = db.query(func.sum(Order.total)).filter(Order.status.in_(paid_statuses)).scalar() or 0
    total_orders      = db.query(func.count(Order.id)).scalar() or 0
    paid_count        = db.query(func.count(Order.id)).filter(Order.status.in_(paid_statuses)).scalar() or 0
    cancelled_count   = db.query(func.count(Order.id)).filter(Order.status == "cancelled").scalar() or 0
    cancelled_value   = db.query(func.sum(Order.total)).filter(Order.status == "cancelled").scalar() or 0
    pending_count     = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar() or 0
    pending_value     = db.query(func.sum(Order.total)).filter(Order.status == "pending").scalar() or 0

    # ── By payment method ──────────────────────────────────────────────────────
    online_collected  = db.query(func.sum(Order.total)).filter(Order.payment_method == "razorpay", Order.status.in_(paid_statuses)).scalar() or 0
    cod_collected     = db.query(func.sum(Order.total)).filter(Order.payment_method == "cod", Order.status.in_(paid_statuses)).scalar() or 0
    online_count      = db.query(func.count(Order.id)).filter(Order.payment_method == "razorpay").scalar() or 0
    cod_count         = db.query(func.count(Order.id)).filter(Order.payment_method == "cod").scalar() or 0

    # ── Monthly collections — last 6 months ───────────────────────────────────
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    yr_expr = extract("year", Order.created_at)
    mo_expr = extract("month", Order.created_at)
    monthly_rows = (
        db.query(yr_expr.label("yr"), mo_expr.label("mo"),
                 func.sum(Order.total).label("collected"),
                 func.count(Order.id).label("orders"))
        .filter(Order.created_at >= six_months_ago, Order.status.in_(paid_statuses))
        .group_by(yr_expr, mo_expr)
        .order_by(yr_expr, mo_expr)
        .all()
    )
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly = [
        {"month": month_names[int(mo) - 1], "collected": round(float(collected or 0), 2), "orders": int(orders or 0)}
        for yr, mo, collected, orders in monthly_rows
    ]

    # ── Recent orders with payment detail ─────────────────────────────────────
    recent = (
        db.query(Order)
        .options(joinedload(Order.customer))
        .order_by(Order.created_at.desc())
        .limit(50)
        .all()
    )
    orders_list = [
        {
            "id": o.id,
            "customer": o.customer.name if o.customer else "Guest",
            "email": o.customer.email if o.customer else "",
            "total": float(o.total),
            "payment_method": o.payment_method or "razorpay",
            "status": o.status,
            "razorpay_payment_id": o.razorpay_payment_id or "",
            "created_at": o.created_at,
        }
        for o in recent
    ]

    return {
        "summary": {
            "total_collected": round(float(total_collected), 2),
            "total_orders": total_orders,
            "paid_count": paid_count,
            "cancelled_count": cancelled_count,
            "cancelled_value": round(float(cancelled_value), 2),
            "pending_count": pending_count,
            "pending_value": round(float(pending_value), 2),
            "online_collected": round(float(online_collected), 2),
            "cod_collected": round(float(cod_collected), 2),
            "online_count": online_count,
            "cod_count": cod_count,
        },
        "monthly": monthly,
        "orders": orders_list,
    }


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _: str = Depends(verify_token)):
    # ── Summary counts ────────────────────────────────────────────────────────
    paid_statuses = ["confirmed", "ready_for_delivery", "picked_up", "delivered"]
    total_orders     = db.query(func.count(Order.id)).scalar() or 0
    total_revenue    = db.query(func.sum(Order.total)).filter(Order.status.in_(paid_statuses)).scalar() or 0
    total_customers  = db.query(func.count(Customer.id)).scalar() or 0
    total_products   = db.query(func.count(Product.id)).scalar() or 0
    pending_orders   = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar() or 0
    delivered_orders = db.query(func.count(Order.id)).filter(Order.status == "delivered").scalar() or 0
    total_reviews    = db.query(func.count(Review.id)).scalar() or 0
    avg_rating       = db.query(func.avg(Review.rating)).scalar() or 0
    unread_inquiries = db.query(func.count(Inquiry.id)).filter(Inquiry.is_read == False).scalar() or 0

    # ── Orders by status ──────────────────────────────────────────────────────
    status_rows = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    orders_by_status = [{"status": s, "count": c} for s, c in status_rows]

    # ── Top 6 products by units sold ──────────────────────────────────────────
    top_products_rows = (
        db.query(
            Product.name,
            func.sum(OrderItem.quantity).label("units"),
            func.sum(OrderItem.price * OrderItem.quantity).label("revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status.in_(paid_statuses))
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(6)
        .all()
    )
    top_products = [
        {"name": name[:22] + "…" if len(name) > 22 else name, "units": int(units or 0), "revenue": float(revenue or 0)}
        for name, units, revenue in top_products_rows
    ]

    # ── Monthly revenue & orders — last 6 months ──────────────────────────────
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    yr_expr = extract("year", Order.created_at)
    mo_expr = extract("month", Order.created_at)
    monthly_rows = (
        db.query(
            yr_expr.label("yr"),
            mo_expr.label("mo"),
            func.sum(Order.total).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .filter(Order.created_at >= six_months_ago, Order.status.in_(paid_statuses))
        .group_by(yr_expr, mo_expr)
        .order_by(yr_expr, mo_expr)
        .all()
    )
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_revenue = [
        {"month": month_names[int(mo) - 1], "revenue": float(revenue or 0), "orders": int(orders or 0)}
        for yr, mo, revenue, orders in monthly_rows
    ]

    # ── Rating distribution ───────────────────────────────────────────────────
    rating_rows = db.query(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
    rating_dist = {r: c for r, c in rating_rows}

    # ── Recent orders ─────────────────────────────────────────────────────────
    recent = (
        db.query(Order)
        .options(joinedload(Order.customer))
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )
    recent_orders = [
        {
            "id": o.id,
            "customer": o.customer.name if o.customer else "Guest",
            "total": o.total,
            "status": o.status,
            "payment_method": o.payment_method,
            "created_at": o.created_at,
        }
        for o in recent
    ]

    # ── Payment method split ──────────────────────────────────────────────────
    cod_count    = db.query(func.count(Order.id)).filter(Order.payment_method == "cod").scalar() or 0
    online_count = db.query(func.count(Order.id)).filter(Order.payment_method == "razorpay").scalar() or 0

    return {
        "summary": {
            "total_orders": total_orders,
            "total_revenue": round(float(total_revenue), 2),
            "total_customers": total_customers,
            "total_products": total_products,
            "pending_orders": pending_orders,
            "delivered_orders": delivered_orders,
            "total_reviews": total_reviews,
            "avg_rating": round(float(avg_rating), 1),
            "unread_inquiries": unread_inquiries,
        },
        "orders_by_status": orders_by_status,
        "top_products": top_products,
        "monthly_revenue": monthly_revenue,
        "rating_distribution": [{"stars": s, "count": rating_dist.get(s, 0)} for s in range(5, 0, -1)],
        "recent_orders": recent_orders,
        "payment_split": {"cod": cod_count, "online": online_count},
    }


# ── Shop-Product assignments ──────────────────────────────────────────────────

@router.get("/shop-products")
def list_shop_products(
    product_id: int = Query(None),
    shop_owner_id: int = Query(None),
    db: Session = Depends(get_db),
    _: str = Depends(verify_token),
):
    """List which shops carry which products."""
    q = db.query(ShopProduct).options(
        joinedload(ShopProduct.shop_owner),
        joinedload(ShopProduct.product),
    )
    if product_id:
        q = q.filter(ShopProduct.product_id == product_id)
    if shop_owner_id:
        q = q.filter(ShopProduct.shop_owner_id == shop_owner_id)
    rows = q.all()
    return [
        {
            "id": r.id,
            "product_id": r.product_id,
            "product_name": r.product.name if r.product else "",
            "shop_owner_id": r.shop_owner_id,
            "shop_name": r.shop_owner.shop_name if r.shop_owner else "",
            "price_override": r.price_override,
            "is_available": r.is_available,
        }
        for r in rows
    ]


class AssignShopProductBody(BaseModel):
    product_id: int
    shop_owner_id: int
    price_override: float = None


@router.post("/shop-products")
def assign_product_to_shop(body: AssignShopProductBody, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    """Assign a product to a shop (creates ShopProduct entry)."""
    existing = db.query(ShopProduct).filter(
        ShopProduct.product_id == body.product_id,
        ShopProduct.shop_owner_id == body.shop_owner_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This product is already assigned to this shop")

    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    shop = db.query(ShopOwner).filter(ShopOwner.id == body.shop_owner_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    sp = ShopProduct(
        product_id=body.product_id,
        shop_owner_id=body.shop_owner_id,
        price_override=body.price_override,
        is_available=True,
    )
    db.add(sp)
    # Also set as primary shop on product if product has no shop yet
    if not product.shop_owner_id:
        product.shop_owner_id = body.shop_owner_id
    db.commit()
    db.refresh(sp)
    return {"id": sp.id, "product_id": sp.product_id, "shop_owner_id": sp.shop_owner_id, "shop_name": shop.shop_name}


@router.delete("/shop-products/{sp_id}")
def unassign_product_from_shop(sp_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    """Remove a shop's assignment to a product."""
    sp = db.query(ShopProduct).filter(ShopProduct.id == sp_id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(sp)
    db.commit()
    return {"success": True}
