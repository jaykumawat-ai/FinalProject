from fastapi import APIRouter, HTTPException
from app.models.user import UserRegister, UserLogin
from app.database import users_collection
from app.core.security import hash_password, verify_password, create_access_token
from app.core.security import get_current_user
from fastapi import Depends


router = APIRouter()


@router.post("/register")
def register(user: UserRegister):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password)
    })

    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user["email"]})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: str = Depends(get_current_user)):
    return {
        "email": current_user
    }
