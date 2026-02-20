from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.MONGO_URI)
db = client.travelease

users_collection = db.users
trips_collection = db.trips 
wallets_collection = db["wallets"]
transactions_collection = db["transactions"]
explore_places_collection = db["explore_places"]
smart_destinations_collection = db["smart_destinations"]
trip_explanations_collection = db["trip_explanations"]