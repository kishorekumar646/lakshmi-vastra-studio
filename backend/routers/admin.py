from fastapi import APIRouter, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
import os
from pathlib import Path
from dotenv import load_dotenv
from auth import create_access_token

load_dotenv(Path(__file__).parent.parent / ".env")

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "changeme123")

    if form_data.username != admin_username or form_data.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}
