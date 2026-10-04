from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import PushSubscription
from notifications.push import VAPID_PUBLIC_KEY

router = APIRouter(prefix="/api/push", tags=["push"])


@router.get("/vapid-public-key")
def get_vapid_key():
    return {"public_key": VAPID_PUBLIC_KEY}


class SubscribeBody(BaseModel):
    endpoint: str
    p256dh: str
    auth: str
    user_type: str          # admin | shop_owner | delivery_person | customer
    user_id: Optional[int] = None


@router.post("/subscribe")
def subscribe(body: SubscribeBody, db: Session = Depends(get_db)):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == body.endpoint).first()
    if existing:
        existing.user_type = body.user_type
        existing.user_id = body.user_id
        existing.p256dh = body.p256dh
        existing.auth = body.auth
    else:
        db.add(PushSubscription(
            endpoint=body.endpoint, p256dh=body.p256dh, auth=body.auth,
            user_type=body.user_type, user_id=body.user_id,
        ))
    db.commit()
    return {"success": True}


@router.delete("/unsubscribe")
def unsubscribe(endpoint: str, db: Session = Depends(get_db)):
    db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).delete()
    db.commit()
    return {"success": True}
