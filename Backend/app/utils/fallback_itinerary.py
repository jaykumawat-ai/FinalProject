# app/utils/fallback_itinerary.py

def fallback_itinerary(destination: str, days: int, budget: str):
    days = int(days)
    itinerary = []

    for day in range(1, days + 1):
        itinerary.append({
            "day": day,
            "title": f"Day {day} in {destination}",
            "activities": [
                {"time": "09:00", "name": "Explore local attractions"},
                {"time": "13:00", "name": "Lunch at a popular restaurant"},
                {"time": "18:00", "name": "Evening leisure / sightseeing"}
            ]
        })

    return {
        "generated_by": "fallback",
        "destination": destination,
        "days": days,
        "budget": budget,
        "itinerary": itinerary
    }
