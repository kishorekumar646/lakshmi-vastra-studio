import random
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import DeliveryPerson, Order, OrderItem, OrderStatusHistory, Product
from delivery.auth import verify_password, create_delivery_token, get_current_delivery_person

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
    return {"id": p.id, "name": p.name, "email": p.email, "phone": p.phone}


def _order_dict(order: Order) -> dict:
    return {
        "id": order.id,
        "total": order.total,
        "status": order.status,
        "payment_method": order.payment_method,
        "delivery_address": order.delivery_address,
        "delivery_otp": order.delivery_otp,
        "created_at": order.created_at,
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


@router.get("/orders")
def list_assigned_orders(person: DeliveryPerson = Depends(get_current_delivery_person), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.delivery_person_id == person.id)
        .filter(Order.status.in_(["ready_for_delivery", "picked_up"]))
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
            joinedload(Order.status_history),
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_order_dict(o) for o in orders]


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
