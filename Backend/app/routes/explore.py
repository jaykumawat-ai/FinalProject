from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId

from app.core.security import get_current_user
from app.database import explore_places_collection

router = APIRouter(prefix="/explore", tags=["Explore"])

@router.post("/save")
def save_explore_place(
    data: dict,
    current_user: str = Depends(get_current_user)
):
    place = {
        "user": current_user,
        "name": data.get("name"),
        "lat": data.get("lat"),
        "lon": data.get("lon"),
        "type": data.get("type"),
        "created_at": datetime.utcnow()
    }

    # prevent duplicate saves
    exists = explore_places_collection.find_one({
        "user": current_user,
        "name": place["name"]
    })

    if exists:
        return {"message": "Already saved"}

    explore_places_collection.insert_one(place)

    return {"message": "Place saved"}



@router.get("/saved")
def get_saved_places(
    current_user: str = Depends(get_current_user)
):
    places = explore_places_collection.find({
        "user": current_user
    })

    result = []

    for p in places:
        result.append({
            "id": str(p["_id"]),
            "name": p["name"],
            "lat": p["lat"],
            "lon": p["lon"],
            "type": p["type"]
        })

    return result



@router.delete("/saved")
def delete_saved_place(
    name: str,
    current_user: str = Depends(get_current_user)
):
    explore_places_collection.delete_one({
        "user": current_user,
        "name": name
    })

    return {"message": "Removed"}
