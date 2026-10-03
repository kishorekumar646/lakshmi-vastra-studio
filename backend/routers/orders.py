from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Order, OrderItem, CartItem, Customer, Product
from customer_auth import get_current_customer
import urllib.request
import base64
import json
import hmac
import hashlib
import os

router = APIRouter(prefix="/api/orders", tags=["orders"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")


def _razorpay_create_order(amount_inr: float, receipt: str) -> dict:
    amount_paise = int(round(amount_inr * 100))
    payload = json.dumps({"amount": amount_paise, "currency": "INR", "receipt": receipt}).encode()
    credentials = base64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
    req = urllib.request.Request(
        "https://api.razorpay.com/v1/orders",
        data=payload,
        headers={"Authorization": f"Basic {credentials}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay error: {str(e)}")


def _verify_signature(razorpay_order_id: str, razorpay_payment_id: str, signature: str) -> bool:
    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
    expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


class CreateOrderBody(BaseModel):
    delivery_address: str


class VerifyPaymentBody(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


def order_dict(order: Order) -> dict:
    return {
        "id": order.id,
        "total": order.total,
        "status": order.status,
        "razorpay_order_id": order.razorpay_order_id,
        "delivery_address": order.delivery_address,
        "created_at": order.created_at,
        "items": [
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,
                "name": item.product.name if item.product else "",
                "image_url": item.product.image_url if item.product else None,
            }
            for item in order.items
        ],
    }


@router.get("")
def get_orders(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.customer_id == customer.id)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [order_dict(o) for o in orders]


@router.post("/create")
def create_order(body: CreateOrderBody, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    cart_items = (
        db.query(CartItem)
        .filter(CartItem.customer_id == customer.id)
        .options(joinedload(CartItem.product))
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = sum(item.product.price * item.quantity for item in cart_items if item.product)

    # Create Razorpay order first
    rzp_order = _razorpay_create_order(total, f"cust_{customer.id}")

    # Persist our order record
    order = Order(
        customer_id=customer.id,
        total=total,
        status="pending",
        razorpay_order_id=rzp_order["id"],
        delivery_address=body.delivery_address,
    )
    db.add(order)
    db.flush()

    for item in cart_items:
        if item.product:
            db.add(OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.product.price,
            ))

    # Clear cart only after successful order creation
    db.query(CartItem).filter(CartItem.customer_id == customer.id).delete()
    db.commit()
    db.refresh(order)

    return {
        "order_id": order.id,
        "razorpay_order_id": rzp_order["id"],
        "amount": rzp_order["amount"],          # in paise
        "currency": rzp_order["currency"],
        "key_id": RAZORPAY_KEY_ID,
    }


@router.post("/verify")
def verify_payment(body: VerifyPaymentBody, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if not _verify_signature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    order = db.query(Order).filter(Order.id == body.order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = "paid"
    order.razorpay_payment_id = body.razorpay_payment_id
    db.commit()

    return {"success": True, "order_id": order.id, "status": "paid"}
