import requests
import json
from app.config import settings

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def generate_itinerary(destination: str, days: int, budget: str):
    if not settings.groq_api_key:
        return None

    prompt = f"""
Create a {days}-day travel itinerary for {destination}.

Total budget: ₹{budget} INR for {days} days.

Return ONLY valid JSON in this format:
{{
  "destination": "{destination}",
  "days": {days},
  "budget": "{budget}",
  "generated_by": "groq",
  "itinerary": [
    {{
      "day": 1,
      "title": "",
      "activities": [
        {{ "time": "", "name": "" }}
      ]
    }}
  ]
}}
"""

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    response = requests.post(
        GROQ_API_URL,
        json=payload,
        headers=headers,
        timeout=20
    )

    response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]

    try:
        return json.loads(content)
    except Exception:
        return None
