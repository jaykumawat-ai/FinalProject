from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    openweather_api_key: str
    razorpay_key_id: str
    razorpay_key_secret: str

    class Config:
        env_file = ".env"

settings = Settings()