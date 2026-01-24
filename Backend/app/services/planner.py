def smart_trip_planner(source, destination, budget, days, people):
    score = 0
    plan = {}

    # Transport logic
    if budget < 3000:
        transport = "Bus"
        score += 0.2
    elif budget < 7000:
        transport = "Train (Sleeper)"
        score += 0.4
    else:
        transport = "Flight (Economy)"
        score += 0.6

    # Hotel logic
    if budget < 4000:
        hotel = "Budget Hotel"
        score += 0.2
    elif budget < 8000:
        hotel = "3-Star Hotel"
        score += 0.4
    else:
        hotel = "4-Star Hotel"
        score += 0.6

    # Cost estimation
    estimated_cost = int(budget * 0.95)

    # Confidence
    confidence = min(round(score / 1.2, 2), 1.0)

    return {
        "source": source,
        "destination": destination,
        "transport": transport,
        "hotel": hotel,
        "days": days,
        "people": people,
        "estimated_cost": estimated_cost,
        "confidence": confidence,
        "reason": "Optimized for comfort and cost efficiency"
    }
