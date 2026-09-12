from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from sqlalchemy import text
from database import engine, Base
from routers import products, categories, inquiries, admin

Base.metadata.create_all(bind=engine)

# Add new columns to existing tables without Alembic
def _run_migrations():
    new_cols = [
        ("products", "is_handloom", "BOOLEAN DEFAULT FALSE"),
        ("products", "has_multiple_colours", "BOOLEAN DEFAULT FALSE"),
        ("products", "custom_orders", "BOOLEAN DEFAULT FALSE"),
    ]
    with engine.connect() as conn:
        for table, col, col_def in new_cols:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
                conn.commit()
            except Exception:
                pass  # column already exists

_run_migrations()

app = FastAPI(title="Lakshmi Vastra Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(categories.router)
app.include_router(inquiries.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Lakshmi Vastra Studio API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
