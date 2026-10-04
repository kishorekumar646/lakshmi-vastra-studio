import json
import os

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_EMAIL = os.getenv("VAPID_CLAIMS_EMAIL", "admin@lakshmivastra.com")


def _send(endpoint: str, p256dh: str, auth: str, title: str, body: str, url: str):
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        return
    try:
        from pywebpush import webpush, WebPushException
        webpush(
            subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_EMAIL}"},
        )
    except Exception:
        pass


def notify(db, user_type: str, user_id, title: str, body: str, url: str = "/"):
    from models import PushSubscription
    q = db.query(PushSubscription).filter(PushSubscription.user_type == user_type)
    if user_id is not None:
        q = q.filter(PushSubscription.user_id == user_id)
    for sub in q.all():
        _send(sub.endpoint, sub.p256dh, sub.auth, title, body, url)
