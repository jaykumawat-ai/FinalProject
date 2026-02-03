from fastapi import APIRouter, Query, HTTPException
import os
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

router = APIRouter(prefix="/weather", tags=["Weather"])

API_KEY = os.getenv("OPENWEATHER_API_KEY")

@router.get("/forecast")
def get_weather_forecast(
    city: str = Query(...),
    start_date: str = Query(...),  # YYYY-MM-DD
    end_date: str = Query(...)     # YYYY-MM-DD
):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Weather API key missing")

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }

    res = requests.get(url, params=params)
    data = res.json()

    if res.status_code != 200:
        raise HTTPException(status_code=400, detail=data.get("message"))

    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)

    forecast = []

    for item in data["list"]:
        dt = datetime.fromtimestamp(item["dt"])
        if start.date() <= dt.date() <= end.date() and dt.hour == 12:
            forecast.append({
                "date": dt.date().isoformat(),
                "temp": item["main"]["temp"],
                "condition": item["weather"][0]["description"],
                "icon": item["weather"][0]["icon"]
            })

    return {
        "city": city,
        "days": forecast
    }
