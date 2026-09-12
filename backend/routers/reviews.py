from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional
from database import get_db
from models import Review, Product
from auth import verify_token

router = APIRouter(tags=["reviews"])


class ReviewCreate(BaseModel):
    reviewer_name: str
    rating: int
    comment: Optional[str] = None

    @validator("rating")
    def rating_range(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

    @validator("reviewer_name")
    def name_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Name is required")
        return v[:100]


def review_to_dict(r: Review):
    return {
        "id": r.id,
        "product_id": r.product_id,
        "product_name": r.product.name if r.product else None,
        "reviewer_name": r.reviewer_name,
        "rating": r.rating,
        "comment": r.comment,
        "is_visible": r.is_visible,
        "created_at": str(r.created_at),
    }


@router.get("/api/products/{product_id}/reviews")
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id, Review.is_visible == True)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [review_to_dict(r) for r in reviews]


@router.post("/api/products/{product_id}/reviews")
def create_review(product_id: int, data: ReviewCreate, db: Session = Depends(get_db)):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
    review = Review(
        product_id=product_id,
        reviewer_name=data.reviewer_name,
        rating=data.rating,
        comment=data.comment or None,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review_to_dict(review)


@router.get("/api/admin/reviews")
def get_all_reviews(db: Session = Depends(get_db), _: str = Depends(verify_token)):
    reviews = db.query(Review).order_by(Review.created_at.desc()).all()
    return [review_to_dict(r) for r in reviews]


@router.delete("/api/admin/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return {"message": "Deleted"}


@router.put("/api/admin/reviews/{review_id}/visibility")
def toggle_review_visibility(review_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_visible = not review.is_visible
    db.commit()
    return review_to_dict(review)
