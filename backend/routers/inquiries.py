from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Inquiry
from auth import verify_token

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])


class InquiryCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    message: str


@router.post("")
def create_inquiry(data: InquiryCreate, db: Session = Depends(get_db)):
    inquiry = Inquiry(**data.model_dump())
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return {"message": "Inquiry submitted successfully", "id": inquiry.id}


@router.get("")
def list_inquiries(db: Session = Depends(get_db), _: str = Depends(verify_token)):
    inquiries = db.query(Inquiry).order_by(Inquiry.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "phone": i.phone,
            "email": i.email,
            "message": i.message,
            "is_read": i.is_read,
            "created_at": str(i.created_at),
        }
        for i in inquiries
    ]


@router.put("/{inquiry_id}/read")
def mark_read(inquiry_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if inquiry:
        inquiry.is_read = True
        db.commit()
    return {"message": "Marked as read"}
