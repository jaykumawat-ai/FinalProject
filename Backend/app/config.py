from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import Optional

class Settings(BaseSettings):
    MONGO_URI: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    openweather_api_key: str | None = None
    razorpay_key_id: str
    razorpay_key_secret: str
    gemini_api_key: str | None = None
    ors_api_key: str | None = None
    groq_api_key: str | None = None
    rapidapi_key: str | None = None
    rapidapi_host: str | None = None


        # AI Ranking Weights (must sum to 1.0 ideally)
    AI_TAG_WEIGHT: float = 0.4
    AI_POPULARITY_WEIGHT: float = 0.3
    AI_SUITABILITY_WEIGHT: float = 0.3

    

    class Config:
        env_file = ".env"
        extra = "forbid"

settings = Settings()