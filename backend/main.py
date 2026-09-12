from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from database import engine, Base
from routers import products, categories, inquiries, admin

Base.metadata.create_all(bind=engine)

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
