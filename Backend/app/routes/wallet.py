from fastapi import APIRouter, Depends, HTTPException
from app.database import wallets_collection
from app.core.security import get_current_user
from app.models.wallet import AddMoney

router = APIRouter()

@router.get("/")
def get_wallet(current_user: str = Depends(get_current_user)):
    wallet = wallets_collection.find_one({"user": current_user})

    if not wallet:
        wallet = {
            "user": current_user,
            "balance": 0
        }
        wallets_collection.insert_one(wallet)

    return {
        "user": current_user,
        "balance": wallet["balance"]
    }


@router.post("/add")
def add_money(
    data: AddMoney,
    current_user: str = Depends(get_current_user)
):
    wallets_collection.update_one(
        {"user": current_user},
        {"$inc": {"balance": data.amount}},
        upsert=True
    )

    wallet = wallets_collection.find_one({"user": current_user})

    return {
        "message": "Money added successfully",
        "balance": wallet["balance"]
    }
