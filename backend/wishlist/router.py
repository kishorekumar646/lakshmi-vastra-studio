from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import WishlistItem, Customer, Product
from customers.auth import get_current_customer

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


class AddWishlistBody(BaseModel):
    product_id: int


def wishlist_item_dict(item: WishlistItem) -> dict:
    p = item.product
    return {
        "id": item.id,
        "product_id": item.product_id,
        "name": p.name if p else "",
        "price": p.price if p else 0,
        "image_url": p.image_url if p else None,
        "category_name": p.category.name if p and p.category else "",
        "is_featured": p.is_featured if p else False,
        "created_at": item.created_at,
    }


@router.get("")
def get_wishlist(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    items = (
        db.query(WishlistItem)
        .filter(WishlistItem.customer_id == customer.id)
        .options(joinedload(WishlistItem.product).joinedload(Product.category))
        .all()
    )
    return [wishlist_item_dict(i) for i in items]


@router.post("")
def add_to_wishlist(body: AddWishlistBody, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.query(WishlistItem).filter(
        WishlistItem.customer_id == customer.id,
        WishlistItem.product_id == body.product_id,
    ).first()
    if existing:
        return wishlist_item_dict(existing)
    item = WishlistItem(customer_id=customer.id, product_id=body.product_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    db.refresh(item, ["product"])
    return wishlist_item_dict(item)


@router.delete("/{product_id}")
def remove_from_wishlist(product_id: int, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    item = db.query(WishlistItem).filter(
        WishlistItem.customer_id == customer.id,
        WishlistItem.product_id == product_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}
