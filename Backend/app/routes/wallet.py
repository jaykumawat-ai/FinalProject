from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.database import wallets_collection, transactions_collection
from app.core.security import get_current_user
from app.services.razorpay_client import razorpay_client


router = APIRouter(tags=["Wallet"])


# -------------------------------------------------
# Serializer (Mongo-safe)
# -------------------------------------------------
def serialize_transaction(txn):
    return {
        "id": str(txn["_id"]),
        "type": txn.get("type"),
        "amount": txn.get("amount"),
        "reason": txn.get("reason", "N/A"),
        "created_at": txn.get("created_at")
    }


# -------------------------------------------------
# GET Wallet Balance
# -------------------------------------------------
@router.get("/")
def get_wallet(current_user: str = Depends(get_current_user)):
    wallet = wallets_collection.find_one({"user": current_user})

    if not wallet:
        wallet = {
            "user": current_user,
            "balance": 0,
            "created_at": datetime.utcnow()
        }
        wallets_collection.insert_one(wallet)

    return {
        "user": current_user,
        "balance": wallet["balance"]
    }


# -------------------------------------------------
# ADD Money (Manual / Testing)
# -------------------------------------------------
@router.post("/add")
def add_money(
    data: dict,
    current_user: str = Depends(get_current_user)
):
    amount = data.get("amount")

    if not isinstance(amount, int) or amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    wallets_collection.update_one(
        {"user": current_user},
        {
            "$inc": {"balance": amount},
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )

    transactions_collection.insert_one({
        "user": current_user,
        "type": "credit",
        "amount": amount,
        "reason": "Wallet top-up",
        "created_at": datetime.utcnow()
    })

    wallet = wallets_collection.find_one({"user": current_user})

    return {
        "message": "Money added successfully",
        "new_balance": wallet["balance"]
    }


# -------------------------------------------------
# TRANSACTION HISTORY
# -------------------------------------------------
@router.get("/transactions")
def wallet_transactions(current_user: str = Depends(get_current_user)):
    txns = transactions_collection.find(
        {"user": current_user}
    ).sort("created_at", -1)

    return [serialize_transaction(txn) for txn in txns]


# -------------------------------------------------
# RAZORPAY ORDER CREATION
# -------------------------------------------------
@router.post("/create-order")
def create_payment_order(
    amount: int,
    current_user: str = Depends(get_current_user)
):
    """
    Create Razorpay order
    Amount is in rupees
    """

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    order = razorpay_client.order.create({
        "amount": amount * 100,  # Razorpay uses paise
        "currency": "INR",
        "payment_capture": 1
    })

    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": "INR",
        "razorpay_key": razorpay_client.auth[0]
    }

@router.post("/verify-payment")
def verify_payment(
    data: dict,
    current_user: str = Depends(get_current_user)
):
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")
    amount = data.get("amount")

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, amount]):
        raise HTTPException(status_code=400, detail="Invalid payment data")

    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed")

    # Credit wallet
    wallets_collection.update_one(
        {"user": current_user},
        {
            "$inc": {"balance": amount},
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )

    # Save transaction
    transactions_collection.insert_one({
        "user": current_user,
        "type": "credit",
        "amount": amount,
        "reason": "Razorpay top-up",
        "created_at": datetime.utcnow()
    })

    wallet = wallets_collection.find_one({"user": current_user})

    return {
        "message": "Payment verified & wallet credited",
        "new_balance": wallet["balance"]
    }
