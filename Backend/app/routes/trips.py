from fastapi import APIRouter
from app.database import trip_collection

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)

@router.post("/")
def create_trip(trip: dict):
    trip_collection.insert_one(trip)
    return {"message": "Trip created"}
