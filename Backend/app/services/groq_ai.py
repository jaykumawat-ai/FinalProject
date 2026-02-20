import re
import json
import requests
from typing import Optional, Dict, Any
from app.config import settings

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def _safe_parse_json(content: str) -> Optional[Dict[str, Any]]:
    """
    Try to parse JSON from `content`. If direct json.loads fails,
    attempt to extract the substring from first '{' to last '}' and parse that.
    Returns a dict on success or None on failure.
    """
    try:
        return json.loads(content)
    except Exception:
        # attempt to extract {...} block
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(content[start : end + 1])
            except Exception:
                return None
        return None


def generate_itinerary(destination: str, days: int, budget: str) -> Optional[Dict[str, Any]]:
    """
    Call Groq chat completions to generate a JSON itinerary.
    Returns parsed JSON dict on success, or None on failure.
    """
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
        "Content-Type": "application/json",
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
    }

    try:
        resp = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        # network or HTTP error
        print("Groq itinerary request error:", e)
        return None

    try:
        body = resp.json()
    except Exception as e:
        print("Failed to decode JSON response:", e)
        return None

    # attempt to read content robustly
    choices = body.get("choices") or []
    if not choices:
        print("No choices in Groq response")
        return None

    # many chat-style APIs put the text at choices[0].message.content or choices[0].text
    content = None
    first = choices[0]
    if isinstance(first, dict):
        # prefer message.content
        message = first.get("message") or {}
        content = message.get("content") or first.get("text") or first.get("message", {}).get("content")
    else:
        content = None

    if not content:
        print("No message content found in Groq response")
        return None

    parsed = _safe_parse_json(content)
    if parsed is None:
        print("Failed to parse itinerary JSON from model output")
    return parsed


def generate_recommendations(prompt: str) -> str:
    """
    Ask the Groq model for recommendations. Returns the raw text content (string).
    On failure, returns a user-friendly error string.
    """
    if not settings.groq_api_key:
        return "Groq API key not configured."

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
            "role": "system",
            "content": "You are a strict JSON generator. Always return valid JSON only. No markdown. No explanation."
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.5,
    }

    try:
        resp = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        print("Groq recommendation request error:", e)
        return "Unable to generate recommendations at the moment."

    try:
        body = resp.json()
    except Exception as e:
        print("Failed to decode Groq response JSON:", e)
        return "Unable to generate recommendations at the moment."

    choices = body.get("choices") or []
    if not choices:
        return "No recommendations returned by the model."

    first = choices[0]
    # extract text from likely locations
    content = None
    if isinstance(first, dict):
        content = (first.get("message") or {}).get("content") or first.get("text")
    if not content:
        return "Unable to extract recommendation text."

    # Optionally strip leading/trailing whitespace
    return content.strip()


# Example usage (comment out in production)
# if __name__ == "__main__":
#     it = generate_itinerary("Jaipur", 3, "20000")
#     print("Itinerary:", it)
#     rec = generate_recommendations("Tips for Jaipur, 3 days, budget 20000")
#     print("Recommendations:", rec)
