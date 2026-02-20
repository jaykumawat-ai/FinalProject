from datetime import datetime
import json
from app.database import trip_explanations_collection
from app.services.groq_ai import generate_recommendations


def generate_trip_explanation(destination: str, personality: str):

    # 1️⃣ Check Cache
    existing = trip_explanations_collection.find_one({
        "destination_name": destination,
        "personality_type": personality
    })

    if existing:
        return {
            "cached": True,
            "explanation": existing["explanation"]
        }

    # 2️⃣ Build Prompt
    prompt = f"""
You are a premium travel consultant.

User personality type: {personality}
Selected destination: {destination}

Generate:

1. Why this destination perfectly fits this personality
2. Best 3 activities
3. Best 2 months to visit
4. 2 hidden travel tips

Return ONLY valid JSON:

{{
  "why_fit": "",
  "best_activities": [],
  "best_months": [],
  "hidden_tips": []
}}

No markdown.
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
            return {"error": "AI parsing failed"}

    # 3️⃣ Store In DB
    trip_explanations_collection.insert_one({
        "destination_name": destination,
        "personality_type": personality,
        "generated_at": datetime.utcnow(),
        "explanation": parsed
    })

    return {
        "cached": False,
        "explanation": parsed
    }