from pymongo import MongoClient
from app.config import MONGO_URL

client = MongoClient(MONGO_URL)

db = client["travelease"]

user_collection = db["users"]
trip_collection = db["trips"]
