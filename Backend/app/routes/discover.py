# app/routes/discover.py
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from app.core.security import get_current_user
from app.database import trips_collection
from app.services.places import fetch_nearby_places

router = APIRouter(prefix="/discover", tags=["Discover"])


@router.get("/nearby")
def discover_nearby(
    trip_id: str,
    radius: int = 5,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # ✅ Support BOTH schemas
    lat = trip.get("lat") or trip.get("coordinates", {}).get("lat")
    lon = trip.get("lon") or trip.get("coordinates", {}).get("lon")

    if lat is None or lon is None:
        raise HTTPException(
            status_code=400,
            detail="Trip does not contain coordinates"
        )

    places = fetch_nearby_places(lat, lon, radius)

    return {
        "trip_id": trip_id,
        "center": {"lat": lat, "lon": lon},
        "count": len(places),
        "places": places
    }
