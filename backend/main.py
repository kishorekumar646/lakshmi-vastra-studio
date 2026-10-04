from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from sqlalchemy import text
from database import engine, Base
from products import router as products_router
from products import categories as categories_router
from admins import router as admin_router
from admins import inquiries as inquiries_router
from customers import router as customer_auth_router
from carts import router as cart_router
from orders import router as orders_router
from reviews import router as reviews_router
from wishlist import router as wishlist_router
from shops import router as shops_router
from delivery import router as delivery_router
from notifications import router as push_router
from pincodes import router as pincodes_router

Base.metadata.create_all(bind=engine)


def _run_migrations():
    new_cols = [
        ("products", "is_available", "BOOLEAN DEFAULT TRUE"),
        ("products", "is_featured", "BOOLEAN DEFAULT FALSE"),
        ("products", "is_handloom", "BOOLEAN DEFAULT FALSE"),
        ("products", "has_multiple_colours", "BOOLEAN DEFAULT FALSE"),
        ("products", "custom_orders", "BOOLEAN DEFAULT FALSE"),
        ("products", "shop_owner_id", "INTEGER REFERENCES shop_owners(id)"),
        ("orders", "payment_method", "TEXT DEFAULT 'razorpay'"),
        ("orders", "razorpay_order_id", "TEXT"),
        ("orders", "razorpay_payment_id", "TEXT"),
        ("orders", "delivery_person_id", "INTEGER REFERENCES delivery_persons(id)"),
        ("orders", "qr_token", "TEXT"),
        ("orders", "delivery_otp", "TEXT"),
        ("delivery_persons", "earning_per_delivery", "REAL DEFAULT 50.0"),
        ("customers", "secondary_phone", "TEXT"),
        ("customers", "address", "TEXT"),
        ("customers", "city", "TEXT"),
        ("customers", "state", "TEXT"),
        ("customers", "pincode", "TEXT"),
    ]
    with engine.connect() as conn:
        for table, col, col_def in new_cols:
            if col_def is None:
                continue
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
                conn.commit()
            except Exception:
                conn.rollback()  # column already exists — safe to skip

        # Backfill NULLs — old rows predating the column addition
        try:
            conn.execute(text("UPDATE products SET is_available = TRUE WHERE is_available IS NULL"))
            conn.execute(text("UPDATE products SET is_featured = FALSE WHERE is_featured IS NULL"))
            conn.execute(text("UPDATE orders SET payment_method = 'razorpay' WHERE payment_method IS NULL"))
            conn.commit()
        except Exception:
            conn.rollback()


_run_migrations()

app = FastAPI(title="Lakshmi Vastra Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router.router)
app.include_router(categories_router.router)
app.include_router(admin_router.router)
app.include_router(inquiries_router.router)
app.include_router(reviews_router.router)
app.include_router(customer_auth_router.router)
app.include_router(cart_router.router)
app.include_router(wishlist_router.router)
app.include_router(orders_router.router)
app.include_router(shops_router.router)
app.include_router(delivery_router.router)
app.include_router(push_router.router)
app.include_router(pincodes_router.router)


@app.get("/")
def root():
    return {"message": "Lakshmi Vastra Studio API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
