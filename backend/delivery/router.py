import random
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
import cloudinary
import cloudinary.uploader
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)
from database import get_db
from models import DeliveryPerson, Order, OrderItem, OrderStatusHistory, Product, ShopOwner
from delivery.auth import hash_password, verify_password, create_delivery_token, get_current_delivery_person

router = APIRouter(prefix="/api/delivery", tags=["delivery"])


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    person = db.query(DeliveryPerson).filter(DeliveryPerson.email == body.email).first()
    if not person or not verify_password(body.password, person.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not person.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    token = create_delivery_token(person.id, person.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "delivery_person": _person_dict(person),
    }


@router.get("/me")
def me(person: DeliveryPerson = Depends(get_current_delivery_person)):
    return _person_dict(person)


def _person_dict(p: DeliveryPerson) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "email": p.email,
        "phone": p.phone,
        "earning_per_delivery": p.earning_per_delivery or 50.0,
        "vehicle_type": p.vehicle_type,
        "vehicle_number": p.vehicle_number,
        "licence_number": p.licence_number,
        "pan_card": p.pan_card,
        "licence_image_url": p.licence_image_url,
        "pan_image_url": p.pan_image_url,
        "profile_image_url": p.profile_image_url or None,
        "profile_complete": bool(p.profile_complete),
        "bank_account_holder": p.bank_account_holder or None,
        "bank_name": p.bank_name or None,
        "bank_account_number": p.bank_account_number or None,
        "bank_ifsc": p.bank_ifsc or None,
        "bank_account_type": p.bank_account_type or None,
    }


def _upload_doc(file: UploadFile) -> str:
    result = cloudinary.uploader.upload(file.file, folder="lakshmi-vastra/delivery-docs")
    return result["secure_url"]


class ChangePasswordBody(BaseModel):
    old_password: str
    new_password: str

@router.put("/me/password")
def change_password(
    body: ChangePasswordBody,
    person: DeliveryPerson = Depends(get_current_delivery_person),
    db: Session = Depends(get_db),
):
    if not verify_password(body.old_password, person.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=422, detail="New password must be at least 6 characters")
    person.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.put("/profile")
async def update_profile(
    vehicle_type: Optional[str] = Form(None),
    vehicle_number: Optional[str] = Form(None),
    licence_number: Optional[str] = Form(None),
    pan_card: Optional[str] = Form(None),
    bank_account_holder: Optional[str] = Form(None),
    bank_name: Optional[str] = Form(None),
    bank_account_number: Optional[str] = Form(None),
    bank_ifsc: Optional[str] = Form(None),
    bank_account_type: Optional[str] = Form(None),
    licence_image: Optional[UploadFile] = File(None),
    pan_image: Optional[UploadFile] = File(None),
    profile_image: Optional[UploadFile] = File(None),
    person: DeliveryPerson = Depends(get_current_delivery_person),
    db: Session = Depends(get_db),
):
    if vehicle_type is not None:
        person.vehicle_type = vehicle_type.strip() or None
    if vehicle_number is not None:
        person.vehicle_number = vehicle_number.strip().upper() or None
    if licence_number is not None:
        person.licence_number = licence_number.strip().upper() or None
    if pan_card is not None:
        person.pan_card = pan_card.strip().upper() or None
    if bank_account_holder is not None:
        person.bank_account_holder = bank_account_holder.strip() or None
    if bank_name is not None:
        person.bank_name = bank_name.strip() or None
    if bank_account_number is not None:
        person.bank_account_number = bank_account_number.strip() or None
    if bank_ifsc is not None:
        person.bank_ifsc = bank_ifsc.strip().upper() or None
    if bank_account_type is not None:
        person.bank_account_type = bank_account_type.strip() or None

    if licence_image and licence_image.filename:
        person.licence_image_url = _upload_doc(licence_image)
    if pan_image and pan_image.filename:
        person.pan_image_url = _upload_doc(pan_image)
    if profile_image and profile_image.filename:
        person.profile_image_url = _upload_doc(profile_image)

    person.profile_complete = bool(
        person.vehicle_type and person.vehicle_number
        and person.licence_number and person.pan_card
        and person.licence_image_url and person.pan_image_url
    )
    db.commit()
    db.refresh(person)
    return _person_dict(person)


def _order_dict(order: Order) -> dict:
    shop = order.items[0].shop_owner if order.items else None
    shop_parts = [p for p in [getattr(shop, "address", None), getattr(shop, "city", None)] if p]
    return {
        "id": order.id,
        "total": order.total,
        "status": order.status,
        "payment_method": order.payment_method,
        "delivery_address": order.delivery_address,
        "delivery_otp": order.delivery_otp,
        "created_at": order.created_at,
        "shop_name": shop.shop_name if shop else None,
        "shop_address": ", ".join(shop_parts) if shop_parts else None,
        "customer": {
            "name": order.customer.name if order.customer else "",
            "phone": order.customer.phone if order.customer else "",
        },
        "items": [
            {
                "product_id": item.product_id,
                "name": item.product.name if item.product else "",
                "quantity": item.quantity,
                "price": item.price,
                "image_url": item.product.image_url if item.product else None,
            }
            for item in order.items
        ],
        "status_history": [
            {"status": h.status, "note": h.note, "created_at": h.created_at}
            for h in order.status_history
        ],
    }


def _earning_rate(person: DeliveryPerson) -> float:
    return person.earning_per_delivery or 50.0


@router.get("/stats")
def get_stats(person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=6)

    all_delivered = (
        db.query(Order)
        .filter(Order.delivery_person_id == person.id, Order.status == "delivered")
        .options(joinedload(Order.status_history))
        .all()
    )

    # Build a date → count map using status_history "delivered" timestamps
    day_map = {(today_start - timedelta(days=i)).date(): 0 for i in range(6, -1, -1)}
    today_count = 0
    week_count = 0
    total_value = 0.0

    for order in all_delivered:
        delivered_entry = next(
            (h for h in order.status_history if h.status == "delivered"), None
        )
        ts = delivered_entry.created_at if delivered_entry else order.created_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        total_value += order.total
        if ts >= week_start:
            week_count += 1
            day = ts.date()
            if day in day_map:
                day_map[day] += 1
        if ts >= today_start:
            today_count += 1

    active = (
        db.query(Order)
        .filter(Order.delivery_person_id == person.id, Order.status.in_(["ready_for_delivery", "picked_up"]))
        .count()
    )

    rate = _earning_rate(person)
    total_count = len(all_delivered)

    return {
        "total_delivered": total_count,
        "today": today_count,
        "this_week": week_count,
        "active": active,
        "total_value": round(total_value, 2),
        "total_earned": round(total_count * rate, 2),
        "today_earned": round(today_count * rate, 2),
        "week_earned": round(week_count * rate, 2),
        "earning_per_delivery": rate,
        "daily": [{"date": str(d), "count": c, "earned": round(c * rate, 2)} for d, c in day_map.items()],
    }


@router.get("/orders/available")
def list_available_orders(person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    """Returns unassigned ready_for_delivery orders visible to all delivery persons."""
    orders = (
        db.query(Order)
        .filter(Order.status == "ready_for_delivery", Order.delivery_person_id.is_(None))
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.shop_owner),
            joinedload(Order.customer),
            joinedload(Order.status_history),
        )
        .order_by(Order.created_at.asc())
        .all()
    )
    return [_order_dict(o) for o in orders]


@router.post("/orders/{order_id}/accept")
def accept_order(order_id: int, person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    """Atomically claim an available order. Returns 409 if already taken."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.status == "ready_for_delivery", Order.delivery_person_id.is_(None))
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=409, detail="Order already taken by another delivery person")
    order.delivery_person_id = person.id
    db.add(OrderStatusHistory(order_id=order.id, status="ready_for_delivery", note=f"Accepted for delivery by {person.name}"))
    db.commit()
    return {"success": True, "order_id": order.id, "status": order.status}


@router.get("/orders")
def list_assigned_orders(person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.delivery_person_id == person.id)
        .filter(Order.status.in_(["ready_for_delivery", "picked_up"]))
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.shop_owner),
            joinedload(Order.customer),
            joinedload(Order.status_history),
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_order_dict(o) for o in orders]


@router.get("/orders/completed")
def list_completed_orders(person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(
            or_(
                and_(Order.delivery_person_id == person.id, Order.status == "delivered"),
                and_(Order.return_delivery_person_id == person.id, Order.return_delivery_status == "returned_to_shop"),
            )
        )
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.shop_owner),
            joinedload(Order.customer),
            joinedload(Order.status_history),
        )
        .order_by(Order.created_at.desc())
        .limit(50)
        .all()
    )
    return [_return_order_dict(o) for o in orders]


class ScanBody(BaseModel):
    qr_token: str


@router.post("/orders/scan")
def scan_qr_pickup(body: ScanBody, person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.qr_token == body.qr_token).first()
    if not order:
        raise HTTPException(status_code=404, detail="Invalid QR code")
    if order.delivery_person_id != person.id:
        raise HTTPException(status_code=403, detail="This order is not assigned to you")
    if order.status != "ready_for_delivery":
        raise HTTPException(status_code=400, detail=f"Order is in '{order.status}' status, cannot mark picked up")

    otp = str(random.randint(1000, 9999))
    order.status = "picked_up"
    order.delivery_otp = otp
    db.add(OrderStatusHistory(order_id=order.id, status="picked_up", note=f"Picked up by {person.name}"))
    db.commit()
    return {"success": True, "order_id": order.id, "status": order.status, "delivery_otp": otp}


class DeliverBody(BaseModel):
    otp: str


@router.post("/orders/{order_id}/delivered")
def mark_delivered(order_id: int, body: DeliverBody, person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.delivery_person_id == person.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "picked_up":
        raise HTTPException(status_code=400, detail=f"Order is in '{order.status}' status, cannot mark delivered")
    if not order.delivery_otp or body.otp.strip() != order.delivery_otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP. Ask the customer for the 4-digit code.")

    order.status = "delivered"
    order.delivery_otp = None
    db.add(OrderStatusHistory(order_id=order.id, status="delivered", note=f"Delivered by {person.name} — OTP verified"))
    db.commit()
    return {"success": True, "order_id": order.id, "status": order.status}


@router.put("/orders/{order_id}/mark-picked-up")
def mark_picked_up(order_id: int, person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.delivery_person_id == person.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or not assigned to you")
    if order.status != "ready_for_delivery":
        raise HTTPException(status_code=400, detail=f"Order is already '{order.status}'")
    otp = str(random.randint(1000, 9999))
    order.status = "picked_up"
    order.delivery_otp = otp
    db.add(OrderStatusHistory(order_id=order.id, status="picked_up", note=f"Picked up by {person.name}"))
    db.commit()
    return {"success": True, "order_id": order.id, "status": order.status, "delivery_otp": otp}


# ── Return pickups ────────────────────────────────────────────────────────────

def _return_order_dict(order: Order) -> dict:
    d = _order_dict(order)
    shop = order.items[0].shop_owner if order.items else None
    shop_parts = [p for p in [getattr(shop, "address", None), getattr(shop, "city", None)] if p]
    d.update({
        "return_status": order.return_status,
        "return_delivery_status": order.return_delivery_status,
        "return_reason": order.return_reason,
        "return_note": order.return_note,
        "return_requested_at": order.return_requested_at,
        "shop_name": shop.shop_name if shop else None,
        "shop_address": ", ".join(shop_parts) if shop_parts else None,
    })
    return d


@router.get("/return-orders/available")
def list_available_return_orders(person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    """Shop-accepted returns not yet claimed by any delivery person."""
    orders = (
        db.query(Order)
        .filter(Order.return_status == "accepted", Order.return_delivery_person_id.is_(None))
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.shop_owner),
            joinedload(Order.customer),
            joinedload(Order.status_history),
        )
        .order_by(Order.return_requested_at.asc())
        .all()
    )
    return [_return_order_dict(o) for o in orders]


@router.post("/return-orders/{order_id}/accept")
def accept_return_order(order_id: int, person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    """Atomically claim a return pickup. Returns 409 if already taken."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.return_status == "accepted", Order.return_delivery_person_id.is_(None))
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=409, detail="Return already claimed by another delivery person")
    order.return_delivery_person_id = person.id
    order.return_delivery_status = "pickup_accepted"
    db.add(OrderStatusHistory(order_id=order.id, status="return_pickup_accepted", note=f"Return pickup accepted by {person.name}"))
    db.commit()
    return {"success": True, "order_id": order.id}


@router.get("/return-orders")
def list_my_return_orders(person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    """Returns actively assigned to this delivery person (not yet returned to shop)."""
    orders = (
        db.query(Order)
        .filter(
            Order.return_delivery_person_id == person.id,
            Order.return_delivery_status.in_(["pickup_accepted", "picked_up_from_customer"]),
        )
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.shop_owner),
            joinedload(Order.customer),
            joinedload(Order.status_history),
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_return_order_dict(o) for o in orders]


@router.put("/return-orders/{order_id}/picked-up")
def mark_return_picked_up(order_id: int, background: BackgroundTasks, person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    """Delivery person has collected the item from the customer."""
    order = db.query(Order).filter(Order.id == order_id, Order.return_delivery_person_id == person.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Return order not found")
    if order.return_delivery_status != "pickup_accepted":
        raise HTTPException(status_code=400, detail=f"Return is already '{order.return_delivery_status}'")
    order.return_delivery_status = "picked_up_from_customer"
    db.add(OrderStatusHistory(order_id=order.id, status="return_picked_up", note=f"Item collected from customer by {person.name}"))
    db.commit()
    shop_ids = list({item.shop_owner_id for item in order.items if item.shop_owner_id})
    pname = person.name
    oid = order.id
    def _notify():
        from notifications.push import notify
        for sid in shop_ids:
            notify(db, "shop_owner", sid, "Return Item Collected", f"Order #{oid} — {pname} collected the item from customer and is heading to your shop.", "/shop/dashboard")
    background.add_task(_notify)
    return {"success": True, "order_id": order.id}


@router.put("/return-orders/{order_id}/returned")
def mark_returned_to_shop(order_id: int, background: BackgroundTasks, person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    """Delivery person has dropped the item back at the shop."""
    order = db.query(Order).filter(Order.id == order_id, Order.return_delivery_person_id == person.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Return order not found")
    if order.return_delivery_status != "picked_up_from_customer":
        raise HTTPException(status_code=400, detail=f"Return is already '{order.return_delivery_status}'")
    order.return_delivery_status = "returned_to_shop"
    order.return_status = "returned"
    db.add(OrderStatusHistory(order_id=order.id, status="return_completed", note=f"Item returned to shop by {person.name}"))
    db.commit()
    shop_ids = list({item.shop_owner_id for item in order.items if item.shop_owner_id})
    cid = order.customer_id
    pname = person.name
    oid = order.id
    def _notify():
        from notifications.push import notify
        for sid in shop_ids:
            notify(db, "shop_owner", sid, "Return Completed ✓", f"Order #{oid} — {pname} has returned the item to your shop.", "/shop/dashboard")
        notify(db, "customer", cid, "Return Completed ✓", f"Order #{oid} — your item has been returned to the shop. Return process complete.", "/account")
    background.add_task(_notify)
    return {"success": True, "order_id": order.id}
