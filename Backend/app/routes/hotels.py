# app/routes/hotels.py
from fastapi import APIRouter, Query, HTTPException
from app.services.hotels import search_hotels

router = APIRouter(prefix="/hotels", tags=["Hotels"])

@router.get("/search")
def search(
    city: str = Query(...),
    checkin: str = Query(...),
    checkout: str = Query(...),
    guests: int = Query(1),
):
    try:
        hotels = search_hotels(city, checkin, checkout, guests)
        return {
            "status": "ok",
            "city": city,
            "hotels": hotels
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
