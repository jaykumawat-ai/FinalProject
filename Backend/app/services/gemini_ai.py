# app/services/gemini_ai.py
import json
from typing import Dict, Any

import requests
from app.config import settings


# ------------------------------
# Fallback (always works)
# ------------------------------
def _fallback_itinerary(destination: str, days: int, budget: str) -> Dict[str, Any]:
    days = max(1, int(days))
    itinerary = []

    for d in range(1, days + 1):
        itinerary.append({
            "day": d,
            "title": f"Day {d} in {destination}",
            "activities": [
                {"time": "09:00", "name": f"Explore local area in {destination}"},
                {"time": "13:00", "name": "Lunch at popular restaurant"},
                {"time": "18:00", "name": "Evening leisure / sightseeing"},
            ],
        })

    return {
        "destination": destination,
        "days": days,
        "budget": budget,
        "generated_by": "fallback",
        "itinerary": itinerary,
    }


# ------------------------------
# Gemini call (best effort)
# ------------------------------
def _call_gemini(destination: str, days: int, budget: str):
    if not settings.gemini_api_key:
        return None

    # NOTE:
    # Google Gemini APIs change frequently.
    # This endpoint may require adjustment depending on your key access.
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"

    prompt = (
        f"Create a {days}-day travel itinerary for {destination} with a {budget} budget. "
        "Return STRICT JSON with keys: destination, days, budget, itinerary "
        "(each day having title and activities)."
    )

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        response = requests.post(
            url,
            params={"key": settings.gemini_api_key},
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()

        # Extract text output safely
        text = (
            data["candidates"][0]["content"]["parts"][0]["text"]
            if "candidates" in data
            else ""
        )

        # Try parsing JSON from Gemini
        try:
            return json.loads(text)
        except Exception:
            return {
                "destination": destination,
                "days": days,
                "budget": budget,
                "generated_by": "gemini",
                "raw": text,
            }

    except Exception as e:
        return {"error": f"Gemini failed: {str(e)}"}


# ------------------------------
# Main entry point
# ------------------------------
def generate_itinerary(destination: str, days: int, budget: str):
    """
    Priority:
    1) Gemini (if API key exists and works)
    2) Fallback deterministic itinerary
    """

    gemini_result = _call_gemini(destination, days, budget)
    if gemini_result and "error" not in gemini_result:
        return gemini_result

    # Always return something usable
    return _fallback_itinerary(destination, days, budget)
