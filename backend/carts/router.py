from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import CartItem, Customer, Product
from customers.auth import get_current_customer

router = APIRouter(prefix="/api/cart", tags=["cart"])


class AddCartBody(BaseModel):
    product_id: int
    quantity: int = 1


class UpdateCartBody(BaseModel):
    quantity: int


def cart_item_dict(item: CartItem) -> dict:
    p = item.product
    return {
        "id": item.id,
        "product_id": item.product_id,
        "quantity": item.quantity,
        "name": p.name if p else "",
        "price": p.price if p else 0,
        "image_url": p.image_url if p else None,
        "category_name": p.category.name if p and p.category else "",
    }


@router.get("")
def get_cart(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    items = (
        db.query(CartItem)
        .filter(CartItem.customer_id == customer.id)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .all()
    )
    return [cart_item_dict(i) for i in items]


@router.post("")
def add_to_cart(body: AddCartBody, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.query(CartItem).filter(
        CartItem.customer_id == customer.id,
        CartItem.product_id == body.product_id,
    ).first()
    if existing:
        existing.quantity += body.quantity
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = CartItem(customer_id=customer.id, product_id=body.product_id, quantity=body.quantity)
        db.add(item)
        db.commit()
        db.refresh(item)
    db.refresh(item, ["product"])
    return cart_item_dict(item)


@router.put("/{item_id}")
def update_cart_item(item_id: int, body: UpdateCartBody, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.customer_id == customer.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if body.quantity <= 0:
        db.delete(item)
        db.commit()
        return {"deleted": True}
    item.quantity = body.quantity
    db.commit()
    db.refresh(item, ["product"])
    return cart_item_dict(item)


@router.delete("/{item_id}")
def remove_cart_item(item_id: int, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.customer_id == customer.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}


@router.delete("")
def clear_cart(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.customer_id == customer.id).delete()
    db.commit()
    return {"cleared": True}
