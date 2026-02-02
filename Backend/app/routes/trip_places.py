from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database import trips_collection
from app.core.security import get_current_user
from bson.errors import InvalidId

router = APIRouter(prefix="/trips", tags=["Trip Places"])


@router.post("/{trip_id}/places")
def save_place(
    trip_id: str,
    place: dict,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    saved = trip.get("saved_places", [])

    # prevent duplicates
    if any(p["name"] == place["name"] for p in saved):
        return {"message": "Place already saved"}

    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$push": {"saved_places": place}}
    )

    return {"message": "Place saved successfully"}


@router.get("/{trip_id}/places")
def get_saved_places(
    trip_id: str,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return trip.get("saved_places", [])


@router.delete("/{trip_id}/places")
def remove_place(
    trip_id: str,
    name: str,
    current_user: str = Depends(get_current_user)
):
    # ✅ Validate ObjectId properly
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")

    result = trips_collection.update_one(
        {"_id": ObjectId(trip_id), "user": current_user},
        {"$pull": {"saved_places": {"name": name}}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")

    return {"message": "Place removed"}
