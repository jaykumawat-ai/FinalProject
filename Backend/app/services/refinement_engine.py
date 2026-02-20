import json
from app.services.groq_ai import generate_recommendations


def interpret_refinement(instruction: str):

    prompt = f"""
You are a travel AI system.

User refinement instruction:
"{instruction}"

Interpret what the user wants.

Return ONLY valid JSON:

{{
  "tag_weight": float,
  "popularity_weight": float,
  "ai_weight": float,
  "crowd_penalty": float
}}

Hard rules (must be obeyed):
- All weights (tag_weight, popularity_weight, ai_weight) must be between 0 and 1.
- The sum of tag_weight + popularity_weight + ai_weight should approximately equal 1 (you may slightly adjust to sum to 1).
- crowd_penalty must be between 0 and 0.5.
- Keep adjustments subtle and realistic (do not produce extreme jumps).
- Do NOT include extra fields.
- Return JSON only. No markdown, no explanation, no extra text.

Use the table below to map intents to adjustments:
- "less crowded", "avoid crowds" -> increase crowd_penalty
- "luxury", "premium", "high-end" -> increase popularity_weight
- "adventure", "thrill", "hiking", "nature" -> increase tag_weight
- "personalized", "curated", "insights" -> increase ai_weight

No explanation.
Only JSON.
"""

    ai_text = generate_recommendations(prompt)

    try:
        parsed = json.loads(ai_text)
    except:
        start = ai_text.find("{")
        end = ai_text.rfind("}")
        if start != -1 and end != -1:
            parsed = json.loads(ai_text[start:end+1])
        else:
            return None
        # Safety normalization
    for key in ["tag_weight", "popularity_weight", "ai_weight"]:
        parsed[key] = max(0, min(parsed.get(key, 0.3), 1))

    parsed["crowd_penalty"] = max(0, min(parsed.get("crowd_penalty", 0), 0.5))

    # Normalize main weights to sum to 1
    total = parsed["tag_weight"] + parsed["popularity_weight"] + parsed["ai_weight"]

    if total > 0:
        parsed["tag_weight"] /= total
        parsed["popularity_weight"] /= total
        parsed["ai_weight"] /= total

    return parsed