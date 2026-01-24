from fastapi import APIRouter, Depends
from datetime import datetime
from app.models.trip import TripInput
from app.database import trips_collection
from app.core.security import get_current_user
from app.services.planner import smart_trip_planner

router = APIRouter()

# ---------- Serializer ----------
def serialize_trip(trip):
    return {
        "id": str(trip["_id"]),
        "user": trip["user"],
        "source": trip["source"],
        "destination": trip["destination"],
        "budget": trip["budget"],
        "days": trip["days"],
        "people": trip["people"],
        "plan": trip.get("plan"),
        "status": trip["status"],
        "created_at": trip["created_at"].isoformat()
    }


# ---------- Root ----------
@router.get("/")
def trips_root():
    return {"message": "Trips API working"}


# ---------- AI Trip Planner ----------
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
        "created_at": datetime.utcnow()
    }

    result = trips_collection.insert_one(trip_data)

    return {
        "id": str(result.inserted_id),
        "user": current_user,
        "plan": plan,
        "status": "Trip planned successfully"
    }


# ---------- User Trip History ----------
@router.get("/my-trips")
def get_my_trips(current_user: str = Depends(get_current_user)):
    trips = trips_collection.find({"user": current_user})
    return [serialize_trip(trip) for trip in trips]
