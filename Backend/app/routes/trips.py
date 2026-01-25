from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId

from app.models.trip import TripInput
from app.database import (
    trips_collection,
    wallets_collection,
    transactions_collection
)
from app.core.security import get_current_user
from app.services.planner import smart_trip_planner

router = APIRouter()

# -------------------------------------------------
# Serializer (Mongo-safe)
# -------------------------------------------------
def serialize_trip(trip):
    return {
        "id": str(trip["_id"]),
        "source": trip.get("source"),
        "destination": trip.get("destination"),
        "budget": trip.get("budget"),
        "days": trip.get("days"),
        "people": trip.get("people"),
        "plan": trip.get("plan"),
        "status": trip.get("status"),
        "created_at": trip.get("created_at"),
        "confirmed_at": trip.get("confirmed_at"),
        "booked_at": trip.get("booked_at")
    }


# -------------------------------------------------
# Root check
# -------------------------------------------------
@router.get("/")
def trips_root():
    return {"message": "Trips API working"}


# -------------------------------------------------
# 1️⃣ PLAN TRIP (AI)
# -------------------------------------------------
@router.post("/plan")
def plan_trip(
    trip: TripInput,
    current_user: str = Depends(get_current_user)
):
    plan = smart_trip_planner(
        trip.source,
        trip.destination,
        trip.budget,
        trip.days,
        trip.people
    )

    trip_data = {
        "user": current_user,
        "source": trip.source,
        "destination": trip.destination,
        "budget": trip.budget,
        "days": trip.days,
        "people": trip.people,
        "plan": plan,
        "status": "planned",
        "created_at": datetime.utcnow(),
        "confirmed_at": None,
        "booked_at": None
    }

    result = trips_collection.insert_one(trip_data)

    return {
        "id": str(result.inserted_id),
        "status": "planned",
        "plan": plan
    }


# -------------------------------------------------
# 2️⃣ CONFIRM TRIP (price lock, no payment)
# -------------------------------------------------
@router.post("/confirm/{trip_id}")
def confirm_trip(
    trip_id: str,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["status"] != "planned":
        raise HTTPException(
            status_code=400,
            detail="Trip cannot be confirmed"
        )

    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {
            "status": "confirmed",
            "confirmed_at": datetime.utcnow()
        }}
    )

    return {
        "message": "Trip confirmed. Ready for payment.",
        "trip_id": trip_id
    }


# -------------------------------------------------
# 3️⃣ BOOK TRIP (wallet payment)
# -------------------------------------------------
@router.post("/book/{trip_id}")
def book_trip(
    trip_id: str,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["status"] != "confirmed":
        raise HTTPException(
            status_code=400,
            detail="Trip must be confirmed before booking"
        )

    cost = trip["plan"]["estimated_cost"]

    wallet = wallets_collection.find_one({"user": current_user})

    if not wallet or wallet["balance"] < cost:
        raise HTTPException(
            status_code=400,
            detail="Insufficient wallet balance"
        )

    # Deduct wallet balance
    wallets_collection.update_one(
        {"user": current_user},
        {"$inc": {"balance": -cost}}
    )

    # Save transaction
    transactions_collection.insert_one({
        "user": current_user,
        "type": "debit",
        "amount": cost,
        "reason": "Trip booking",
        "created_at": datetime.utcnow()
    })

    # Mark trip booked
    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {
            "status": "booked",
            "booked_at": datetime.utcnow()
        }}
    )

    updated_wallet = wallets_collection.find_one({"user": current_user})

    return {
        "message": "Trip booked successfully",
        "amount_paid": cost,
        "remaining_balance": updated_wallet["balance"]
    }


# -------------------------------------------------
# 4️⃣ USER TRIP HISTORY
# -------------------------------------------------
@router.get("/my-trips")
def my_trips(current_user: str = Depends(get_current_user)):
    trips = trips_collection.find({"user": current_user})
    return [serialize_trip(trip) for trip in trips]


# -------------------------------------------------
# 5️⃣ BOOKED TRIPS ONLY
# -------------------------------------------------
@router.get("/booked")
def booked_trips(current_user: str = Depends(get_current_user)):
    trips = trips_collection.find({
        "user": current_user,
        "status": "booked"
    })
    return [serialize_trip(trip) for trip in trips]
