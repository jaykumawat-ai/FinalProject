import json
from typing import List, Dict
from app.services.groq_ai import generate_recommendations
from app.services.scoring_engine import compute_tag_match_score, compute_final_score
from app.services.personality_engine import detect_personality

def rank_destinations(
    selected_tags: List[str],
    companion: str,
    budget: str,
    season: str,
    db_results: List[Dict]
) -> List[Dict]:

    if not db_results:
        return []
    
    # 🧠 Personality Engine
    personality_profile = detect_personality(selected_tags, budget, companion)
    weights = personality_profile["weight_adjustments"]

    # Prepare structured data for AI
    simplified = [
        {
            "name": r["name"],
            "popularity_score": r.get("popularity_score", 0),
            "trip_tags": r.get("trip_tags", [])
        }
        for r in db_results
    ]

    prompt = f"""
You are a travel ranking engine.

STRICT RULES (MUST FOLLOW):
- Rank ONLY from the provided list.
- Use EXACT names.
- Do NOT invent new places.
- You MUST rank ALL provided destinations.
- The number of ranked items MUST equal the number of provided destinations.
- Do NOT skip any destination.
- Return JSON only.
- No markdown.
- No explanation.

Personality Type: {personality_profile['type']}
Confidence: {personality_profile['confidence']}

User preferences:
Trip tags: {selected_tags}
Companion: {companion}
Budget: {budget}
Season: {season}

Available destinations:
{json.dumps(simplified, indent=2)}

Return JSON:

{{
  "ranked": [
    {{
      "name": "",
      "reason": "",
      "ai_score": 0
    }}
  ]
}}

The "ranked" array length MUST match the number of provided destinations.

ai_score must be between 0 and 10.
"""

    raw = generate_recommendations(prompt)

    if not raw:
        return []

    try:
        parsed = json.loads(raw)
    except:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1:
            try:
                parsed = json.loads(raw[start:end+1])
            except:
                print("AI JSON parse failed:", raw)
                return []
        else:
            print("AI returned invalid format:", raw)
            return []
        
    db_map = {r["name"]: r for r in db_results}
    final_results = []

    for item in parsed.get("ranked", []):
        name = item.get("name")
        ai_score = float(item.get("ai_score", 5))
        reason = item.get("reason", "")

        if name in db_map:
            r = db_map[name]

            tag_score = compute_tag_match_score(selected_tags, r["trip_tags"])
            popularity_score = r.get("popularity_score", 0)

            final_score = compute_final_score(tag_score, popularity_score, ai_score, weights)

            final_results.append({
                "name": r["name"],
                "country": r["country"],
                "region": r["region"],
                "trip_tags": r["trip_tags"],
                "popularity_score": popularity_score,
                "ai_score": ai_score,
                "tag_score": tag_score,
                "final_score": final_score,
                "reason": reason
            })

    # Sort by final_score descending
    final_results.sort(key=lambda x: x["final_score"], reverse=True)

    return final_results