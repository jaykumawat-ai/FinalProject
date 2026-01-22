from fastapi import APIRouter, Depends
from app.models.trip import TripInput
from app.database import trips_collection
from app.core.security import get_current_user
from datetime import datetime

router = APIRouter()

def serialize_trip(trip):
    return {
        "id": str(trip["_id"]),
        "source": trip["source"],
        "destination": trip["destination"],
        "budget": trip["budget"],
        "status": trip["status"],
        "created_at": trip.get("created_at")  # 👈 FIX
    }


@router.get("/")
def trips_root():
    return {"message": "Trips API working"}

@router.post("/plan")
def plan_trip(
    trip: TripInput,
    current_user: str = Depends(get_current_user)
):
    trip_data = {
        "user": current_user,
        "source": trip.source,
        "destination": trip.destination,
        "budget": trip.budget,
        "status": "planned",
        "created_at": datetime.utcnow()
    }

    trips_collection.insert_one(trip_data)

    return {
        "message": "Trip planned successfully",
        **trip_data
    }

@router.get("/my-trips")
def get_my_trips(current_user: str = Depends(get_current_user)):
    trips = trips_collection.find({"user": current_user})
    return [serialize_trip(trip) for trip in trips]
