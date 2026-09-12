from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Category
from auth import verify_token

router = APIRouter(prefix="/api/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    name: str
    slug: str


@router.get("")
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in cats]


@router.post("")
def create_category(data: CategoryCreate, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    existing = db.query(Category).filter(Category.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this slug already exists")
    cat = Category(name=data.name, slug=data.slug)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "name": cat.name, "slug": cat.slug}


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), _: str = Depends(verify_token)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"message": "Deleted"}
