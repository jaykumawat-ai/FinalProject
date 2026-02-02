# app/services/planner.py
from typing import Any, Dict

from app.services.transport import get_transport_options
from app.services.groq_ai import generate_itinerary
from app.services.geocode import geocode_city
from app.utils.fallback_itinerary import fallback_itinerary


def smart_trip_planner(
    source: str,
    destination: str,
    budget: int,
    days: int,
    people: int
) -> Dict[str, Any]:
    """
    Smart Trip Planner (Numeric Budget)

    - Uses numeric budget (INR)
    - Generates AI itinerary (Groq → fallback)
    - Fetches transport options via ORS
    - Estimates total cost
    - Returns a single, stable plan object
    """

    # -----------------------------
    # 1️⃣ AI Itinerary (Groq → fallback)
    # -----------------------------
    try:
        ai_result = generate_itinerary(destination, days, budget)
        if isinstance(ai_result, dict) and "itinerary" in ai_result:
            itinerary = ai_result["itinerary"]
        else:
            itinerary = fallback_itinerary(destination, days, budget)["itinerary"]
    except Exception:
        itinerary = fallback_itinerary(destination, days, budget)["itinerary"]

    # -----------------------------
    # 2️⃣ Geocode source & destination
    # -----------------------------
    origin_coords = geocode_city(source)
    dest_coords = geocode_city(destination)

    transport = None

    # -----------------------------
    # 3️⃣ Transport options (ORS)
    # -----------------------------
    if origin_coords and dest_coords:
        try:
            transport = get_transport_options(
                origin_coords["lat"],
                origin_coords["lon"],
                dest_coords["lat"],
                dest_coords["lon"],
                days=days,
                budget=budget,
            )
        except Exception:
            transport = None

    # -----------------------------
    # 4️⃣ Transport fallback (heuristic)
    # -----------------------------
    if not transport:
        if budget < 5000:
            recommended = "train"
            options = [
                {
                    "mode": "train",
                    "duration_hours": days * 6,
                    "estimated_cost": int(budget * 0.25),
                    "reason": "Lowest cost option for small budget",
                }
            ]
        elif budget < 12000:
            recommended = "train"
            options = [
                {
                    "mode": "train",
                    "duration_hours": days * 4,
                    "estimated_cost": int(budget * 0.3),
                    "reason": "Balanced cost vs comfort",
                },
                {
                    "mode": "flight",
                    "duration_hours": days * 1.5,
                    "estimated_cost": int(budget * 0.6),
                    "reason": "Faster but more expensive",
                },
            ]
        else:
            recommended = "flight"
            options = [
                {
                    "mode": "flight",
                    "duration_hours": days * 1.0,
                    "estimated_cost": int(budget * 0.55),
                    "reason": "Fastest and most comfortable",
                },
                {
                    "mode": "train",
                    "duration_hours": days * 3,
                    "estimated_cost": int(budget * 0.25),
                    "reason": "Cheaper backup option",
                },
            ]

        transport = {
            "distance_km": None,
            "recommended": recommended,
            "options": options,
            "raw_route": None,
        }

    # -----------------------------
    # 5️⃣ Hotel decision (numeric)
    # -----------------------------
    if budget < 6000:
        hotel = "Hostel / Budget Stay"
    elif budget < 15000:
        hotel = "3-Star Hotel"
    else:
        hotel = "4-Star Hotel"

    # -----------------------------
    # 6️⃣ Cost estimation
    # -----------------------------
    cheapest_transport = min(
        transport["options"], key=lambda x: x.get("estimated_cost", 10**9)
    )

    per_day_cost = 1000  # food + local travel (per person)
    estimated_per_person = (
        cheapest_transport["estimated_cost"] + (per_day_cost * days)
    )

    total_estimated_cost = int(estimated_per_person * people)

    # -----------------------------
    # 7️⃣ Confidence score
    # -----------------------------
    confidence = 0.7 if transport.get("distance_km") else 0.5

    # -----------------------------
    # 8️⃣ FINAL RESPONSE
    # -----------------------------
    return {
        "source": source,
        "destination": destination,
        "days": days,
        "people": people,
        "budget": budget,
        "hotel": hotel,
        "itinerary": itinerary,
        "transport": transport,
        "estimated_cost": total_estimated_cost,
        "confidence": round(confidence, 2),
        "reason": "Numeric-budget optimized plan using AI + transport intelligence",
    }
