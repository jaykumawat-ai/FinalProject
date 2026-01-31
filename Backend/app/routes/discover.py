from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.core.security import get_current_user
from app.database import trips_collection
from app.services.places import fetch_nearby_places

router = APIRouter(prefix="/discover", tags=["Discover"])


@router.get("/nearby")
def discover_nearby(
    trip_id: str | None = None,     # optional now
    radius: int = 5,
    category: str | None = None,
    lat: float | None = None,        # NEW
    lon: float | None = None,        # NEW
    current_user: str = Depends(get_current_user),
):
    """
    Discover nearby places.
    - Uses lat/lon if provided (Search this area)
    - Otherwise falls back to trip coordinates
    """

    # ===============================
    # 1️⃣ Determine search coordinates
    # ===============================
    if lat is not None and lon is not None:
        # 🔹 Search-this-area flow
        search_lat = lat
        search_lon = lon
    else:
        # 🔹 Trip-based flow (backward compatible)
        if not trip_id:
            raise HTTPException(
                status_code=400,
                detail="trip_id required unless lat/lon provided"
            )

        trip = trips_collection.find_one({
            "_id": ObjectId(trip_id),
            "user": current_user
        })

        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        search_lat = trip.get("lat") or trip.get("coordinates", {}).get("lat")
        search_lon = trip.get("lon") or trip.get("coordinates", {}).get("lon")

        if search_lat is None or search_lon is None:
            raise HTTPException(
                status_code=400,
                detail="Trip does not contain coordinates"
            )

    # ===============================
    # 2️⃣ Fetch nearby places
    # ===============================
    places = fetch_nearby_places(search_lat, search_lon, radius)

    # ===============================
    # 3️⃣ Category filter (multi-select)
    # ===============================
    if category:
        selected = [c.strip().lower() for c in category.split(",")]
        places = [
            p for p in places
            if p.get("type") and any(
                c in p["type"].lower() for c in selected
            )
        ]

    # ===============================
    # 4️⃣ Response
    # ===============================
    return {
        "trip_id": trip_id,
        "center": {
            "lat": search_lat,
            "lon": search_lon
        },
        "count": len(places),
        "places": places
    }
