"""One-time migration: add missing indexes for product listing performance."""
from database import engine
from sqlalchemy import text

INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_products_deleted_at ON products (deleted_at);",
    "CREATE INDEX IF NOT EXISTS ix_products_is_available ON products (is_available);",
    "CREATE INDEX IF NOT EXISTS ix_products_created_at ON products (created_at);",
    "CREATE INDEX IF NOT EXISTS ix_products_is_featured ON products (is_featured);",
    "CREATE INDEX IF NOT EXISTS ix_products_is_handloom ON products (is_handloom);",
    "CREATE INDEX IF NOT EXISTS ix_products_has_multiple_colours ON products (has_multiple_colours);",
    "CREATE INDEX IF NOT EXISTS ix_products_custom_orders ON products (custom_orders);",
    "CREATE INDEX IF NOT EXISTS ix_product_images_product_id ON product_images (product_id);",
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for sql in INDEXES:
            conn.execute(text(sql))
            print(f"OK: {sql}")
        conn.commit()
    print("Done.")
