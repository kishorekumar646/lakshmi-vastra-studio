from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import ssl
import os

load_dotenv(Path(__file__).parent / ".env")

# On local dev (Infosys laptop) the corporate network does SSL inspection,
# causing SSLCertVerificationError on Cloudinary/Google calls. Skip only locally.
if not os.getenv("RENDER"):
    ssl._create_default_https_context = ssl._create_unverified_context

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
        ("delivery_persons", "vehicle_type", "TEXT"),
        ("delivery_persons", "vehicle_number", "TEXT"),
        ("delivery_persons", "licence_number", "TEXT"),
        ("delivery_persons", "pan_card", "TEXT"),
        ("delivery_persons", "licence_image_url", "TEXT"),
        ("delivery_persons", "pan_image_url", "TEXT"),
        ("delivery_persons", "profile_complete", "BOOLEAN DEFAULT FALSE"),
        ("customers", "secondary_phone", "TEXT"),
        ("customers", "address", "TEXT"),
        ("customers", "city", "TEXT"),
        ("customers", "state", "TEXT"),
        ("customers", "pincode", "TEXT"),
        ("customers", "profile_image_url", "TEXT"),
        ("shop_owners", "profile_image_url", "TEXT"),
        ("shop_owners", "address", "TEXT"),
        ("shop_owners", "city", "TEXT"),
        ("shop_owners", "state", "TEXT"),
        ("shop_owners", "pincode", "TEXT"),
        ("shop_owners", "gst_number", "TEXT"),
        ("shop_owners", "bank_account_holder", "TEXT"),
        ("shop_owners", "bank_name", "TEXT"),
        ("shop_owners", "bank_account_number", "TEXT"),
        ("shop_owners", "bank_ifsc", "TEXT"),
        ("shop_owners", "bank_account_type", "TEXT"),
        ("delivery_persons", "profile_image_url", "TEXT"),
        ("delivery_persons", "bank_account_holder", "TEXT"),
        ("delivery_persons", "bank_name", "TEXT"),
        ("delivery_persons", "bank_account_number", "TEXT"),
        ("delivery_persons", "bank_ifsc", "TEXT"),
        ("delivery_persons", "bank_account_type", "TEXT"),
        ("order_items", "shop_owner_id", "INTEGER REFERENCES shop_owners(id)"),
        ("orders", "return_status", "TEXT"),
        ("orders", "return_reason", "TEXT"),
        ("orders", "return_note", "TEXT"),
        ("orders", "return_requested_at", "TIMESTAMP"),
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

        # Backfill order_items.shop_owner_id from the product's shop_owner_id
        try:
            conn.execute(text("""
                UPDATE order_items
                SET shop_owner_id = (
                    SELECT p.shop_owner_id FROM products p WHERE p.id = order_items.product_id
                )
                WHERE shop_owner_id IS NULL
            """))
            conn.commit()
        except Exception:
            conn.rollback()

        # Seed shop_products from existing products that already have a shop_owner_id
        try:
            conn.execute(text("""
                INSERT INTO shop_products (shop_owner_id, product_id, is_available)
                SELECT shop_owner_id, id, TRUE
                FROM products
                WHERE shop_owner_id IS NOT NULL
                ON CONFLICT DO NOTHING
            """))
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
