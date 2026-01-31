import requests
from app.config import settings

def get_route(origin_lat, origin_lon, dest_lat, dest_lon):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {
        "Authorization": settings.ors_api_key,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [
            [origin_lon, origin_lat],
            [dest_lon, dest_lat]
        ]
    }

    r = requests.post(url, json=body, headers=headers, timeout=20)
    r.raise_for_status()
    data = r.json()

    summary = data["features"][0]["properties"]["summary"]

    return {
        "distance_km": round(summary["distance"] / 1000, 2),
        "duration_min": round(summary["duration"] / 60),
        "mode": "car"
    }
