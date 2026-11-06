from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lakshmi_vastra.db")

# Supabase uses postgres://, SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    # Enable WAL mode for better concurrent read/write performance
    # Add connection pooling with recycle to handle SQLite locking
    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False,
            "journal_mode": "WAL",
        },
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
    )
else:
    # Add sslmode in URL directly — more reliable than connect_args
    if "sslmode" not in DATABASE_URL:
        DATABASE_URL += "?sslmode=require"
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create scoped session for thread-safe access
db_session = scoped_session(sessionmaker(bind=engine))


def get_db():
    db = db_session()
    try:
        yield db
    finally:
        db.remove()
