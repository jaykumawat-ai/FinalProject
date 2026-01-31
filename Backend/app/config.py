from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import Optional

class Settings(BaseSettings):
    MONGO_URI: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    openweather_api_key: str
    razorpay_key_id: str
    razorpay_key_secret: str
    gemini_api_key: str | None = None
    ors_api_key: str | None = None
    

    class Config:
        env_file = ".env"
        extra = "forbid"

settings = Settings()