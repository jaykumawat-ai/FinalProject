from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from app.database import user_collection

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/signup")
def signup(user: dict):
    if user_collection.find_one({"email": user["email"]}):
        raise HTTPException(status_code=400, detail="User already exists")

    user["password"] = pwd_context.hash(user["password"])
    user["wallet"] = 0.0
    user_collection.insert_one(user)
    return {"message": "Signup successful"}

@router.post("/login")
def login(user: dict):
    db_user = user_collection.find_one({"email": user["email"]})
    if not db_user or not pwd_context.verify(user["password"], db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"message": "Login successful"}
