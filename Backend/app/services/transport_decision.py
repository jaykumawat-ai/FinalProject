# app/services/transport_decision.py

def decide_transport(distance_km: float, days: int | None = None, people: int | None = None, budget: str | None = None):
    options = []

    # --- CAR (real data already computed by ORS) ---
    car_hours = round(distance_km / 60, 2)  # avg 60 km/h
    options.append({
        "mode": "car",
        "duration_hours": car_hours,
        "estimated_cost": round(distance_km * 8),  # ₹8/km avg fuel
        "reason": "Flexible but slow for long distances"
    })

    # --- TRAIN (estimated, safe for MVP) ---
    train_hours = round(distance_km / 50, 2)
    options.append({
        "mode": "train",
        "duration_hours": train_hours,
        "estimated_cost": round(distance_km * 2),
        "reason": "Affordable and reliable for medium distances"
    })

    # --- FLIGHT (estimated) ---
    flight_hours = round((distance_km / 700) + 1.5, 2)  # flight + airport time
    options.append({
        "mode": "flight",
        "duration_hours": flight_hours,
        "estimated_cost": round(distance_km * 6),
        "reason": "Fastest for long distances"
    })

    # --- Recommendation Logic ---
    if distance_km <= 300:
        recommended = "car"
    elif distance_km <= 800:
        recommended = "train"
    else:
        recommended = "flight"

    # Budget overrides
    if budget == "low":
        recommended = "train"
    if days is not None and days <= 2:
        recommended = "flight"
    if people is not None and people >= 4:
        recommended = "car"

    return {
        "recommended": recommended,
        "options": options
    }
