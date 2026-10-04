from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import DeliveryPincode
from admins.auth import verify_token

router = APIRouter(tags=["pincodes"])


def _pincode_dict(p: DeliveryPincode) -> dict:
    return {
        "id": p.id,
        "pincode": p.pincode,
        "city": p.city or "",
        "state": p.state or "",
        "is_active": p.is_active,
        "created_at": p.created_at,
    }


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("/api/pincodes/check")
def check_pincode(pincode: str = Query(..., min_length=6, max_length=6), db: Session = Depends(get_db)):
    """Returns whether a pincode is serviceable."""
    record = db.query(DeliveryPincode).filter(
        DeliveryPincode.pincode == pincode.strip(),
        DeliveryPincode.is_active == True,
    ).first()
    if record:
        return {"serviceable": True, "city": record.city or "", "state": record.state or ""}
    return {"serviceable": False, "city": "", "state": ""}


@router.get("/api/pincodes")
def list_active_pincodes(db: Session = Depends(get_db)):
    """Returns all active pincodes (for customer reference)."""
    rows = db.query(DeliveryPincode).filter(DeliveryPincode.is_active == True).order_by(DeliveryPincode.pincode).all()
    return [{"pincode": r.pincode, "city": r.city or "", "state": r.state or ""} for r in rows]


# ── Admin ─────────────────────────────────────────────────────────────────────

class PincodeBody(BaseModel):
    pincode: str
    city: str = ""
    state: str = ""


@router.get("/api/admin/pincodes")
def admin_list_pincodes(db: Session = Depends(get_db), _: str = Depends(verify_token)):
    rows = db.query(DeliveryPincode).order_by(DeliveryPincode.pincode).all()
    return [_pincode_dict(r) for r in rows]


@router.post("/api/admin/pincodes")
def admin_add_pincode(body: PincodeBody, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    pincode = body.pincode.strip()
    if not pincode.isdigit() or len(pincode) != 6:
        raise HTTPException(status_code=400, detail="Pincode must be exactly 6 digits")
    existing = db.query(DeliveryPincode).filter(DeliveryPincode.pincode == pincode).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Pincode {pincode} already exists")
    row = DeliveryPincode(pincode=pincode, city=body.city.strip(), state=body.state.strip())
    db.add(row)
    db.commit()
    db.refresh(row)
    return _pincode_dict(row)


@router.delete("/api/admin/pincodes/{pincode_id}")
def admin_delete_pincode(pincode_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    row = db.query(DeliveryPincode).filter(DeliveryPincode.id == pincode_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Pincode not found")
    db.delete(row)
    db.commit()
    return {"deleted": True}


@router.put("/api/admin/pincodes/{pincode_id}/toggle")
def admin_toggle_pincode(pincode_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    row = db.query(DeliveryPincode).filter(DeliveryPincode.id == pincode_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Pincode not found")
    row.is_active = not row.is_active
    db.commit()
    return _pincode_dict(row)
