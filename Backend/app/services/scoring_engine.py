from app.config import settings


def compute_tag_match_score(selected_tags: list, destination_tags: list) -> float:
    """
    Score between 0 and 10 based on tag overlap.
    """
    if not selected_tags:
        return 5.0  # neutral score

    matches = len(set(selected_tags) & set(destination_tags))
    ratio = matches / len(selected_tags)

    return round(ratio * 10, 2)


def compute_final_score(
    tag_score: float,
    popularity_score: float,
    ai_score: float,
    weights: dict,
    crowd_factor: float = 0
) -> float:

    tag_weight = weights.get("tag_weight", 0.4)
    popularity_weight = weights.get("popularity_weight", 0.3)
    ai_weight = weights.get("ai_weight", 0.3)
    crowd_penalty = weights.get("crowd_penalty", 0)

    final = (
        tag_weight * tag_score +
        popularity_weight * popularity_score +
        ai_weight * ai_score -
        crowd_penalty * crowd_factor
    )

    return round(final, 2)