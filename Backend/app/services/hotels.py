# app/services/hotels.py
import requests
from app.config import settings

DEST_URL = "https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination"
HOTEL_URL = "https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels"


def get_headers():
    if not settings.rapidapi_key or not settings.rapidapi_host:
        raise RuntimeError("RapidAPI credentials missing")

    return {
        "x-rapidapi-key": settings.rapidapi_key,
        "x-rapidapi-host": settings.rapidapi_host,
    }


def get_destination_id(city: str):
    params = {"query": city}
    r = requests.get(
        DEST_URL,
        headers=get_headers(),
        params=params,
        timeout=15
    )
    r.raise_for_status()

    data = r.json()
    if not data.get("data"):
        return None

    return data["data"][0]["dest_id"]


def search_hotels(city: str, checkin: str, checkout: str, adults: int = 2):
    dest_id = get_destination_id(city)
    if not dest_id:
        return []

    params = {
        "dest_id": dest_id,
        "dest_type": "city",
        "checkin_date": checkin,
        "checkout_date": checkout,
        "adults_number": adults,
        "room_number": 1,
        "filter_by_currency": "INR",
        "order_by": "price",
        "locale": "en-gb"
    }

    r = requests.get(
        HOTEL_URL,
        headers=get_headers(),
        params=params,
        timeout=20
    )
    r.raise_for_status()

    data = r.json()
    hotels = []

    for h in data.get("data", [])[:10]:
        hotels.append({
            "name": h.get("hotel_name"),
            "price_per_night": h.get("min_total_price"),
            "rating": h.get("review_score"),
            "availability": True,
            "booking_url": h.get("url")
        })

    return hotels
