import requests
import math

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


# -----------------------------
# Distance (Haversine)
# -----------------------------
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


# -----------------------------
# Nearby places via OSM
# -----------------------------
def fetch_nearby_places(lat, lon, radius_km=5):
    radius_m = radius_km * 1000

    query = f"""
    [out:json][timeout:25];
    (
      node["tourism"](around:{radius_m},{lat},{lon});
      node["amenity"="restaurant"](around:{radius_m},{lat},{lon});
      node["amenity"="cafe"](around:{radius_m},{lat},{lon});
      node["historic"](around:{radius_m},{lat},{lon});
      way["tourism"](around:{radius_m},{lat},{lon});
    );
    out center;
    """

    try:
        response = requests.post(
            OVERPASS_URL,
            data=query,
            headers={"User-Agent": "TravelEase/1.0"},
            timeout=30
        )
    except Exception:
        return []

    if response.status_code != 200 or not response.text.strip():
        return []

    try:
        data = response.json()
    except Exception:
        return []

    places = []

    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue

        plat = el.get("lat") or el.get("center", {}).get("lat")
        plon = el.get("lon") or el.get("center", {}).get("lon")

        if plat is None or plon is None:
            continue

        places.append({
            "name": name,
            "type": (
                tags.get("tourism")
                or tags.get("amenity")
                or tags.get("historic")
                or "place"
            ),
            "lat": plat,
            "lon": plon,
            "distance_km": calculate_distance(lat, lon, plat, plon)
        })

    return sorted(places, key=lambda x: x["distance_km"])
