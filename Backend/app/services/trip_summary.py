# app/services/trip_summary.py
from datetime import datetime
from typing import Dict, Any

from app.database import trips_collection
from app.services.transport import get_transport_options
from app.services.hotels import search_hotels
from app.services.geocode import geocode_city
from datetime import timedelta

TRANSPORT_BOOKING_LINKS = {
    "flight": "https://www.google.com/travel/flights",
    "train": "https://www.irctc.co.in",
    "bus": "https://www.redbus.in",
    "car": "https://www.google.com/maps"
}


def generate_trip_summary(trip: Dict[str, Any]) -> Dict[str, Any]:
    source = trip.get("source")
    destination = trip.get("destination")
    days = trip.get("days", 1)
    people = trip.get("people", 1)
    budget = trip.get("budget")

    # 1️⃣ Geocode
    origin = geocode_city(source)
    dest = geocode_city(destination)

    transport_data = None
    if origin and dest:
        transport_data = get_transport_options(
            origin["lat"],
            origin["lon"],
            dest["lat"],
            dest["lon"],
            days=days,
            budget=budget
        )

        # attach booking links
        for opt in transport_data.get("options", []):
            opt["booking_link"] = TRANSPORT_BOOKING_LINKS.get(
                opt["mode"], "https://www.google.com"
            )

    # 2️⃣ Hotels (basic date logic)
    today = datetime.utcnow().date()
    checkin = today.isoformat()
    checkout = (today + timedelta(days=max(1, days))).isoformat()

    hotels = []
    try:
        hotels = search_hotels(
            city=destination,
            checkin=checkin,
            checkout=checkout,
            adults=people
        )
    except Exception:
        hotels = []

    # normalize hotel booking links
    for h in hotels:
        if not h.get("booking_url"):
            h["booking_url"] = "https://www.booking.com"

    # 3️⃣ Cost estimation
    estimated_cost = trip.get("plan", {}).get("estimated_cost")
    if not estimated_cost and transport_data:
        cheapest = min(
            transport_data["options"],
            key=lambda o: o.get("estimated_cost", 999999)
        )
        estimated_cost = cheapest.get("estimated_cost", 0) + (days * 1200)

    summary = {
        "route": {
    "source": source,
    "destination": destination,
    "distance_km": transport_data.get("distance_km") if transport_data else None
}
,
        "transport": transport_data,
        "hotels": hotels[:5],
        "itinerary": trip.get("plan", {}).get("itinerary"),
        "estimated_total_cost": int(estimated_cost or 0),
        "confidence": trip.get("plan", {}).get("confidence", 0.6),
        "generated_at": datetime.utcnow()
    }

    return summary
