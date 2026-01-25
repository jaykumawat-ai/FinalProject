from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.MONGO_URI)
db = client.travelease

users_collection = db.users
trips_collection = db.trips 
wallets_collection = db["wallets"]
transactions_collection = db["transactions"]
