from typing import Dict


def detect_personality(trip_tags: list, budget: str, companion: str) -> Dict:
    """
    Detect user travel personality based on inputs.
    Returns personality profile.
    """

    personality = "Balanced Traveler"
    confidence = 0.5

    if "romantic" in trip_tags and companion == "couples":
        personality = "Romantic Explorer"
        confidence = 0.85

    elif "adventure" in trip_tags:
        personality = "Adventure Junkie"
        confidence = 0.8

    elif budget == "premium":
        personality = "Luxury Traveler"
        confidence = 0.75

    elif budget == "low":
        personality = "Budget Backpacker"
        confidence = 0.8

    elif companion == "family":
        personality = "Family Planner"
        confidence = 0.85

    weight_adjustments = get_weight_adjustments(personality)

    return {
        "type": personality,
        "confidence": confidence,
        "weight_adjustments": weight_adjustments
    }


def get_weight_adjustments(personality: str) -> Dict:
    """
    Adjust scoring weights dynamically based on personality.
    """

    if personality == "Luxury Traveler":
        return {
            "tag_weight": 0.3,
            "popularity_weight": 0.4,
            "ai_weight": 0.3
        }

    if personality == "Adventure Junkie":
        return {
            "tag_weight": 0.5,
            "popularity_weight": 0.2,
            "ai_weight": 0.3
        }

    if personality == "Romantic Explorer":
        return {
            "tag_weight": 0.4,
            "popularity_weight": 0.2,
            "ai_weight": 0.4
        }

    return {
        "tag_weight": 0.4,
        "popularity_weight": 0.3,
        "ai_weight": 0.3
    }