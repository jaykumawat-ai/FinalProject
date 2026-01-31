from fastapi import APIRouter, Query, HTTPException
import requests

from app.config import settings

router = APIRouter(prefix="/transport", tags=["Transport"])


@router.get("/route")
def get_route(
    o_lat: float = Query(...),
    o_lon: float = Query(...),
    d_lat: float = Query(...),
    d_lon: float = Query(...),
):
    if not settings.ors_api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTE_API_KEY is missing",
        )

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
        data = res.json()

        # 🔴 ORS error response (VERY IMPORTANT)
        if "routes" in data and len(data["routes"]) > 0:
            summary = data["routes"][0]["summary"]

            return {
                "status": "ok",
                "provider": "openrouteservice",
                "mode": "car",
                "distance_km": round(summary["distance"] / 1000, 2),
                "duration_hours": round(summary["duration"] / 3600, 2),
            }

        return {
            "status": "ok",
            "provider": "openrouteservice",
            "distance_km": round(summary["distance"] / 1000, 2),
            "duration_min": round(summary["duration"] / 60, 2),
            "mode": "car",
        }

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Transport API failed: {e}")
