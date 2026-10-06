from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Order, OrderItem, CartItem, Customer, Product, OrderStatusHistory
from customers.auth import get_current_customer
from orders.qr import generate_qr_base64
import urllib.request
import base64
import json
import hmac
import hashlib
import secrets
import os
from fastapi import BackgroundTasks

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


def _order_dict(order: Order) -> dict:
    return {
        "id": order.id,
        "total": order.total,
        "status": order.status,
        "payment_method": order.payment_method,
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
        "status_history": [
            {"status": h.status, "note": h.note, "created_at": h.created_at}
            for h in order.status_history
        ],
    }


@router.get("")
def get_orders(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.customer_id == customer.id)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.status_history),
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_order_dict(o) for o in orders]


@router.get("/{order_id}/track")
def track_order(order_id: int, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.customer_id == customer.id)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.status_history),
            joinedload(Order.delivery_person),
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    result = _order_dict(order)
    if order.delivery_person:
        result["delivery_person"] = {"name": order.delivery_person.name, "phone": order.delivery_person.phone}
    if order.status == "picked_up" and order.delivery_otp:
        result["delivery_otp"] = order.delivery_otp
    return result


class CreateOrderBody(BaseModel):
    delivery_address: str
    payment_method: str = "razorpay"  # razorpay | cod


class VerifyPaymentBody(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create")
def create_order(body: CreateOrderBody, background: BackgroundTasks, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if body.payment_method not in ("razorpay", "cod"):
        raise HTTPException(status_code=400, detail="Invalid payment method")

    if body.payment_method == "razorpay" and (not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET):
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
    qr_token = secrets.token_urlsafe(32)

    if body.payment_method == "razorpay":
        rzp_order = _razorpay_create_order(total, f"cust_{customer.id}")
        # Status is 'awaiting_payment' — cart is NOT cleared yet.
        # Cart is only cleared after payment is verified successfully.
        order = Order(
            customer_id=customer.id,
            total=total,
            status="awaiting_payment",
            payment_method="razorpay",
            razorpay_order_id=rzp_order["id"],
            delivery_address=body.delivery_address,
            qr_token=qr_token,
        )
    else:
        # COD: confirm immediately and clear cart
        order = Order(
            customer_id=customer.id,
            total=total,
            status="pending",
            payment_method="cod",
            delivery_address=body.delivery_address,
            qr_token=qr_token,
        )

    db.add(order)
    db.flush()

    for item in cart_items:
        if item.product:
            db.add(OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                shop_owner_id=item.product.shop_owner_id,
                quantity=item.quantity,
                price=item.product.price,
            ))

    if body.payment_method == "razorpay":
        db.add(OrderStatusHistory(order_id=order.id, status="awaiting_payment", note="Payment initiated — awaiting confirmation"))
        # Cart stays intact until payment verified
    else:
        db.add(OrderStatusHistory(order_id=order.id, status="pending", note="Order placed (Cash on Delivery)"))
        db.query(CartItem).filter(CartItem.customer_id == customer.id).delete()

    db.commit()
    db.refresh(order)

    if body.payment_method == "cod":
        # Notify for COD orders immediately
        _send_order_notifications(background, db, order, customer)

    if body.payment_method == "razorpay":
        return {
            "order_id": order.id,
            "razorpay_order_id": rzp_order["id"],
            "amount": rzp_order["amount"],
            "currency": rzp_order["currency"],
            "key_id": RAZORPAY_KEY_ID,
        }
    return {"order_id": order.id, "status": "pending", "payment_method": "cod"}


def _send_order_notifications(background: BackgroundTasks, db: Session, order, customer):
    from notifications.push import notify
    from models import OrderItem as OI, Product as P
    items_q = db.query(OI).filter(OI.order_id == order.id).all()
    shop_owner_ids = set(
        db.query(P.shop_owner_id).filter(P.id.in_([i.product_id for i in items_q]), P.shop_owner_id.isnot(None)).all()
    )
    def _notify():
        notify(db, "admin", None, "New Order", f"Order #{order.id} placed by {customer.name} · ₹{order.total:,.0f}", "/admin/dashboard")
        for (sid,) in shop_owner_ids:
            notify(db, "shop_owner", sid, "New Order for Your Shop", f"Order #{order.id} includes your products · ₹{order.total:,.0f}", "/shop/dashboard")
    background.add_task(_notify)


@router.post("/verify")
def verify_payment(body: VerifyPaymentBody, background: BackgroundTasks, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if not _verify_signature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    order = db.query(Order).filter(Order.id == body.order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status not in ("awaiting_payment",):
        raise HTTPException(status_code=400, detail="Order is not awaiting payment")

    order.status = "pending"
    order.razorpay_payment_id = body.razorpay_payment_id
    db.add(OrderStatusHistory(order_id=order.id, status="pending", note="Payment received via Razorpay — order placed"))

    # Now it is safe to clear the customer's cart
    db.query(CartItem).filter(CartItem.customer_id == customer.id).delete()

    db.commit()

    _send_order_notifications(background, db, order, customer)

    return {"success": True, "order_id": order.id, "status": "pending"}


@router.post("/{order_id}/retry-payment")
def retry_payment(order_id: int, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    """Create a fresh Razorpay order for an existing awaiting_payment order."""
    order = db.query(Order).filter(Order.id == order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "awaiting_payment":
        raise HTTPException(status_code=400, detail="Order is not awaiting payment")

    rzp_order = _razorpay_create_order(order.total, f"retry_{order.id}")
    order.razorpay_order_id = rzp_order["id"]
    db.commit()

    return {
        "order_id": order.id,
        "razorpay_order_id": rzp_order["id"],
        "amount": rzp_order["amount"],
        "currency": rzp_order["currency"],
        "key_id": RAZORPAY_KEY_ID,
        "delivery_address": order.delivery_address,
        "total": order.total,
    }


@router.get("/{order_id}/qr")
def get_order_qr(order_id: int, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order.qr_token:
        raise HTTPException(status_code=400, detail="QR code not available")
    return {"qr_image": generate_qr_base64(order.qr_token)}


@router.put("/{order_id}/cancel")
def cancel_order(order_id: int, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="Order cannot be cancelled after it has been packed")
    order.status = "cancelled"
    db.add(OrderStatusHistory(order_id=order.id, status="cancelled", note="Cancelled by customer"))
    db.commit()
    return {"order_id": order.id, "status": "cancelled"}
