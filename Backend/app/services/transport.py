# app/services/transport.py
import math
import requests
from typing import Dict, Any, Optional
from app.config import settings

ORS_URL_BASE = "https://api.openrouteservice.org/v2/directions"

def get_route(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float, profile: str = "driving-car") -> Dict[str, Any]:
    """
    Calls OpenRouteService directions API and returns a normalized summary.

    Returns a dict:
    {
      "status": "ok" | "no_route",
      "provider": "openrouteservice",
      "mode": profile,
      "distance_km": float,
      "duration_min": float,
      "duration_hours": float,
      "raw_summary": {...}   # optional
    }
    """
    if not settings.ors_api_key:
        raise RuntimeError("OPENROUTESERVICE API key (ors_api_key) is missing in settings")

    url = f"{ORS_URL_BASE}/{profile}"
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

    try:
        resp = requests.post(url, json=body, headers=headers, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        return {
            "status": "no_route",
            "provider": "openrouteservice",
            "mode": profile,
            "error": str(e),
        }

    # Extract summary (handle both "routes" and GeoJSON "features")
    summary = None
    if isinstance(data, dict):
        if "routes" in data and isinstance(data["routes"], list) and len(data["routes"]) > 0:
            summary = data["routes"][0].get("summary", {})
        elif "features" in data and isinstance(data["features"], list) and len(data["features"]) > 0:
            summary = data["features"][0].get("properties", {}).get("summary", {})
        # else: leave summary None to let the caller handle raw_response

    if not summary:
        return {
            "status": "no_route",
            "provider": "openrouteservice",
            "mode": profile,
            "raw_response": data
        }

    distance_m = summary.get("distance", 0)  # meters
    duration_s = summary.get("duration", 0)  # seconds

    return {
        "status": "ok",
        "provider": "openrouteservice",
        "mode": profile,
        "distance_km": round(distance_m / 1000.0, 2),
        "duration_min": round(duration_s / 60.0, 2),
        "duration_hours": round(duration_s / 3600.0, 2),
        "raw_summary": summary,
    }


def _cost_estimates(distance_km: float, budget_level):
    """
    Supports both numeric budget and string budget.
    Returns estimated costs for car/train/flight.
    """

    # Normalize budget
    if isinstance(budget_level, (int, float)):
        if budget_level < 5000:
            level = "low"
        elif budget_level < 15000:
            level = "medium"
        else:
            level = "high"
    else:
        level = str(budget_level).lower()

    # Base per-km rates
    rates = {
        "car": 8,
        "train": 2,
        "flight": 6
    }

    costs = {
        "car": int(distance_km * rates["car"]),
        "train": int(distance_km * rates["train"]),
        "flight": int(distance_km * rates["flight"])
    }

    # Budget tuning
    if level == "low":
        costs["flight"] *= 1.2
    elif level == "high":
        costs["flight"] *= 0.9

    return costs


def get_transport_options(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float, days: Optional[int] = None, budget: Optional[str] = None) -> Dict[str, Any]:
    """
    Compute and return transport options given origin/destination coordinates.

    Returns:
    {
        "distance_km": float,
        "recommended": "car"|"train"|"flight",
        "options": [
            {"mode": "car", "duration_hours": x.x, "estimated_cost": n, "reason": "..."},
            ...
        ]
    }

    This function calls get_route to get driving distance/duration and uses simple rules to propose options.
    """
    # 1) Get driving route summary (best-effort)
    route = get_route(origin_lat, origin_lon, dest_lat, dest_lon, profile="driving-car")

    # If ORS gave a usable distance, use it. Otherwise fall back to great-circle estimate.
    if route.get("status") == "ok" and route.get("distance_km") is not None:
        distance_km = float(route["distance_km"])
        driving_hours = float(route.get("duration_hours", max(0.1, distance_km / 50.0)))
    else:
        # Fallback: compute great-circle distance (Haversine)
        def _haversine_km(lat1, lon1, lat2, lon2):
            R = 6371.0
            from math import radians, sin, cos, sqrt, atan2
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            return R * c

        distance_km = round(_haversine_km(origin_lat, origin_lon, dest_lat, dest_lon), 2)
        driving_hours = round(distance_km / 60.0, 2)  # assume faster highways

    # 2) Build options with sensible thresholds
    options = []
    costs = _cost_estimates(distance_km, budget_level=budget)

    # Car option: available for nearly all distances (but may be impractical for very long)
    options.append({
        "mode": "car",
        "duration_hours": round(driving_hours, 2),
        "estimated_cost": int(costs["car"]),
        "reason": "Door-to-door flexibility; best for short-to-medium distances"
    })

    # Train option: useful for medium distances (and cheaper)
    # estimated train speed assumption: 50 km/h (includes stops)
    train_hours = round(distance_km / 50.0, 2) if distance_km > 0 else None
    if distance_km >= 50:  # only meaningful above ~50km
        options.append({
            "mode": "train",
            "duration_hours": round(train_hours, 2),
            "estimated_cost": int(costs["train"]),
            "reason": "Affordable and comfortable for medium/long distances"
        })

    # Flight option: for longer trips
    # flight duration: 1h base + distance/800 km cruise time (plus ground time not included)
    if distance_km >= 300:
        flight_hours = round(1.0 + (distance_km / 800.0), 2)
        options.append({
            "mode": "flight",
            "duration_hours": flight_hours,
            "estimated_cost": int(costs["flight"]),
            "reason": "Fastest for long distances (includes approximate ticket cost)"
        })

    # If options is somehow empty (shouldn't happen) re-add car
    if not options:
        options.append({
            "mode": "car",
            "duration_hours": round(driving_hours, 2),
            "estimated_cost": int(costs["car"]),
            "reason": "Fallback option"
        })

    # 3) Choose recommended mode - default: minimize duration, but factor budget lightly
    # Build a scoring: lower duration preferred; apply budget bias (if budget string present)
    def _score(opt):
        # Smaller score = better
        duration_score = float(opt.get("duration_hours", 999))
        cost_score = float(opt.get("estimated_cost", 999999)) / max(1, distance_km or 1)
        weight_duration = 0.7
        weight_cost = 0.3
        return duration_score * weight_duration + cost_score * weight_cost

    recommended_mode = sorted(options, key=_score)[0]["mode"]

    return {
        "distance_km": round(distance_km, 2),
        "recommended": recommended_mode,
        "options": options,
        "raw_route": route if route.get("status") != "ok" else None
    }
