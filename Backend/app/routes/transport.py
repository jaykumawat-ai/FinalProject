# app/routes/transport.py

from fastapi import APIRouter, Query, HTTPException
import requests

from app.config import settings
from app.services.transport_decision import decide_transport

router = APIRouter(prefix="/transport", tags=["Transport"])


@router.get("/options")
def transport_options(
    o_lat: float = Query(...),
    o_lon: float = Query(...),
    d_lat: float = Query(...),
    d_lon: float = Query(...),
    days: int | None = None,
    people: int | None = None,
    budget: str | None = None,
):
    if not settings.ors_api_key:
        raise HTTPException(status_code=500, detail="ORS API key missing")

    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {
        "Authorization": settings.ors_api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "coordinates": [
            [o_lon, o_lat],
            [d_lon, d_lat],
        ]
    }

    try:
        res = requests.post(url, json=payload, headers=headers, timeout=15)
        res.raise_for_status()
        data = res.json()

        summary = data["routes"][0]["summary"]
        distance_km = round(summary["distance"] / 1000, 2)
        duration_hours = round(summary["duration"] / 3600, 2)

        decision = decide_transport(
            distance_km=distance_km,
            days=days,
            people=people,
            budget=budget
        )

        return {
            "status": "ok",
            "distance_km": distance_km,
            "car_duration_hours": duration_hours,
            "recommended": decision["recommended"],
            "options": decision["options"]
        }

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
