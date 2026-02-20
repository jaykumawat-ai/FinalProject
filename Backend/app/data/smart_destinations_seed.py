# app/data/smart_destinations_seed.py

from app.database import db

collection = db.smart_destinations

destinations = [
    
    
    {
    "name": "Shimla",
    "country": "India",
    "region": "Himachal Pradesh",
    "trip_tags": ["nature","snow","romantic","family"],
    "best_seasons": ["winter","spring"],
    "budget_levels": ["medium"],
    "companion_tags": ["couples","family"],
    "popularity_score": 8.7
    },

    {
    "name": "Munnar",
    "country": "India",
    "region": "Kerala",
    "trip_tags": ["nature","relaxation","romantic","mountains"],
    "best_seasons": ["winter","spring"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["couples","family"],
    "popularity_score": 8.6
    },

    {
    "name": "Coorg",
    "country": "India",
    "region": "Karnataka",
    "trip_tags": ["nature","relaxation","adventure"],
    "best_seasons": ["spring","summer"],
    "budget_levels": ["low","medium"],
    "companion_tags": ["friends","couples"],
    "popularity_score": 8.2
    },

    {
    "name": "Varanasi",
    "country": "India",
    "region": "Uttar Pradesh",
    "trip_tags": ["historical","spiritual","urban"],
    "best_seasons": ["winter"],
    "budget_levels": ["low","medium"],
    "companion_tags": ["family","solo"],
    "popularity_score": 8.8
    },

    {
    "name": "Jaisalmer",
    "country": "India",
    "region": "Rajasthan",
    "trip_tags": ["desert","historical","romantic"],
    "best_seasons": ["winter"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["couples","friends"],
    "popularity_score": 8.4
    },

    {
    "name": "Darjeeling",
    "country": "India",
    "region": "West Bengal",
    "trip_tags": ["nature","mountains","relaxation"],
    "best_seasons": ["spring","summer"],
    "budget_levels": ["medium"],
    "companion_tags": ["family","couples"],
    "popularity_score": 8.5
    },

    {
    "name": "Hampi",
    "country": "India",
    "region": "Karnataka",
    "trip_tags": ["historical","adventure","nature"],
    "best_seasons": ["winter"],
    "budget_levels": ["low"],
    "companion_tags": ["friends","solo"],
    "popularity_score": 7.9
    },

    {
    "name": "Alleppey",
    "country": "India",
    "region": "Kerala",
    "trip_tags": ["beach","relaxation","romantic"],
    "best_seasons": ["winter"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["couples","family"],
    "popularity_score": 8.3
    },

    {
    "name": "Kaziranga",
    "country": "India",
    "region": "Assam",
    "trip_tags": ["wildlife","nature","adventure"],
    "best_seasons": ["winter"],
    "budget_levels": ["medium"],
    "companion_tags": ["family","friends"],
    "popularity_score": 8.1
    },

    {
    "name": "Ooty",
    "country": "India",
    "region": "Tamil Nadu",
    "trip_tags": ["nature","mountains","romantic"],
    "best_seasons": ["spring","summer"],
    "budget_levels": ["low","medium"],
    "companion_tags": ["couples","family"],
    "popularity_score": 8.0
    },

    {
    "name": "Rome",
    "country": "Italy",
    "region": "Lazio",
    "trip_tags": ["historical","urban","romantic","food"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["premium","luxury"],
    "companion_tags": ["couples","family"],
    "popularity_score": 9.5
    },

    {
    "name": "Barcelona",
    "country": "Spain",
    "region": "Catalonia",
    "trip_tags": ["urban","beach","food","fun"],
    "best_seasons": ["spring","summer"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["friends","couples"],
    "popularity_score": 9.1
    },

    {
    "name": "Sydney",
    "country": "Australia",
    "region": "New South Wales",
    "trip_tags": ["beach","urban","nature"],
    "best_seasons": ["summer"],
    "budget_levels": ["premium"],
    "companion_tags": ["friends","family"],
    "popularity_score": 9.2
    },

    {
    "name": "Banff",
    "country": "Canada",
    "region": "Alberta",
    "trip_tags": ["snow","nature","adventure","mountains"],
    "best_seasons": ["winter","summer"],
    "budget_levels": ["premium"],
    "companion_tags": ["friends","couples"],
    "popularity_score": 8.9
    },

    {
    "name": "Kyoto",
    "country": "Japan",
    "region": "Kyoto",
    "trip_tags": ["historical","romantic","nature"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["premium"],
    "companion_tags": ["couples","family"],
    "popularity_score": 9.0
    },

    {
    "name": "Venice",
    "country": "Italy",
    "region": "Veneto",
    "trip_tags": ["romantic","historical","urban"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["premium","luxury"],
    "companion_tags": ["couples"],
    "popularity_score": 9.4
    },

    {
    "name": "Machu Picchu",
    "country": "Peru",
    "region": "Cusco",
    "trip_tags": ["adventure","historical","nature"],
    "best_seasons": ["summer"],
    "budget_levels": ["premium"],
    "companion_tags": ["friends","solo"],
    "popularity_score": 9.3
    },

    {
    "name": "Serengeti",
    "country": "Tanzania",
    "region": "Serengeti",
    "trip_tags": ["wildlife","adventure","nature"],
    "best_seasons": ["summer"],
    "budget_levels": ["premium","luxury"],
    "companion_tags": ["family","friends"],
    "popularity_score": 8.8
    },

    {
    "name": "Petra",
    "country": "Jordan",
    "region": "Ma'an",
    "trip_tags": ["historical","desert","adventure"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["friends","family"],
    "popularity_score": 8.6
    },

    {
    "name": "Hawaii",
    "country": "USA",
    "region": "Hawaii",
    "trip_tags": ["beach","nature","romantic","island"],
    "best_seasons": ["summer","spring"],
    "budget_levels": ["premium","luxury"],
    "companion_tags": ["couples","family"],
    "popularity_score": 9.6
    },

    {
    "name": "Prague",
    "country": "Czech Republic",
    "region": "Bohemia",
    "trip_tags": ["historical","romantic","urban"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["couples","friends"],
    "popularity_score": 8.9
    },

    {
    "name": "Istanbul",
    "country": "Turkey",
    "region": "Marmara",
    "trip_tags": ["historical","urban","food"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["medium"],
    "companion_tags": ["family","friends"],
    "popularity_score": 8.7
    },

    {
    "name": "Bora Bora",
    "country": "French Polynesia",
    "region": "Society Islands",
    "trip_tags": ["island","luxury","romantic","beach"],
    "best_seasons": ["summer"],
    "budget_levels": ["luxury"],
    "companion_tags": ["couples"],
    "popularity_score": 9.9
    },

    {
    "name": "Reykjavik",
    "country": "Iceland",
    "region": "Capital Region",
    "trip_tags": ["snow","nature","adventure"],
    "best_seasons": ["winter"],
    "budget_levels": ["premium"],
    "companion_tags": ["couples","friends"],
    "popularity_score": 8.5
    },

    {
    "name": "Zurich",
    "country": "Switzerland",
    "region": "Zurich",
    "trip_tags": ["urban","luxury","nature"],
    "best_seasons": ["spring","summer"],
    "budget_levels": ["luxury"],
    "companion_tags": ["family","couples"],
    "popularity_score": 8.8
    },

    {
    "name": "Manali",
    "country": "India",
    "region": "Himachal Pradesh",
    "trip_tags": ["adventure","nature","romantic","snow","family"],
    "best_seasons": ["winter","spring"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["couples","friends","family"],
    "popularity_score": 9.3
    },

    {
    "name": "Goa",
    "country": "India",
    "region": "Goa",
    "trip_tags": ["beach","fun","relaxation","romantic"],
    "best_seasons": ["winter","spring"],
    "budget_levels": ["low","medium","premium"],
    "companion_tags": ["friends","couples","solo"],
    "popularity_score": 9.5
    },

    {
    "name": "Udaipur",
    "country": "India",
    "region": "Rajasthan",
    "trip_tags": ["historical","romantic","relaxation"],
    "best_seasons": ["winter","autumn"],
    "budget_levels": ["medium","premium","luxury"],
    "companion_tags": ["couples","family"],
    "popularity_score": 9.0
    },

    {
    "name": "Rishikesh",
    "country": "India",
    "region": "Uttarakhand",
    "trip_tags": ["adventure","nature","relaxation"],
    "best_seasons": ["spring","summer"],
    "budget_levels": ["low","medium"],
    "companion_tags": ["friends","solo"],
    "popularity_score": 8.5
    },

    {
    "name": "Leh Ladakh",
    "country": "India",
    "region": "Ladakh",
    "trip_tags": ["adventure","nature","snow"],
    "best_seasons": ["summer"],
    "budget_levels": ["premium"],
    "companion_tags": ["friends","solo"],
    "popularity_score": 8.9
    },

    {
    "name": "Andaman Islands",
    "country": "India",
    "region": "Andaman",
    "trip_tags": ["beach","nature","relaxation"],
    "best_seasons": ["winter","spring"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["couples","family"],
    "popularity_score": 8.7
    },

    {
    "name": "Jaipur",
    "country": "India",
    "region": "Rajasthan",
    "trip_tags": ["historical","urban","romantic"],
    "best_seasons": ["winter"],
    "budget_levels": ["low","medium","premium"],
    "companion_tags": ["family","couples"],
    "popularity_score": 8.6
    },

    # ---------- INTERNATIONAL ----------

    {
    "name": "Bali",
    "country": "Indonesia",
    "region": "Bali",
    "trip_tags": ["beach","romantic","nature","fun"],
    "best_seasons": ["summer","spring"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["couples","friends"],
    "popularity_score": 9.6
    },

    {
    "name": "Paris",
    "country": "France",
    "region": "Île-de-France",
    "trip_tags": ["romantic","historical","urban"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["premium","luxury"],
    "companion_tags": ["couples","family"],
    "popularity_score": 9.7
    },

    {
    "name": "Dubai",
    "country": "UAE",
    "region": "Dubai",
    "trip_tags": ["urban","fun","luxury"],
    "best_seasons": ["winter"],
    "budget_levels": ["premium","luxury"],
    "companion_tags": ["friends","family","couples"],
    "popularity_score": 9.2
    },

    {
    "name": "Swiss Alps",
    "country": "Switzerland",
    "region": "Alps",
    "trip_tags": ["snow","romantic","nature","adventure"],
    "best_seasons": ["winter"],
    "budget_levels": ["luxury"],
    "companion_tags": ["couples","family"],
    "popularity_score": 9.8
    },

    {
    "name": "Tokyo",
    "country": "Japan",
    "region": "Tokyo",
    "trip_tags": ["urban","fun","technology","food"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["premium"],
    "companion_tags": ["friends","solo"],
    "popularity_score": 9.1
    },

    {
    "name": "Santorini",
    "country": "Greece",
    "region": "Cyclades",
    "trip_tags": ["romantic","beach","relaxation"],
    "best_seasons": ["summer"],
    "budget_levels": ["premium","luxury"],
    "companion_tags": ["couples"],
    "popularity_score": 9.4
    },

    {
    "name": "Phuket",
    "country": "Thailand",
    "region": "Phuket",
    "trip_tags": ["beach","fun","relaxation"],
    "best_seasons": ["winter","summer"],
    "budget_levels": ["low","medium"],
    "companion_tags": ["friends","couples"],
    "popularity_score": 8.4
    },

    {
    "name": "New York",
    "country": "USA",
    "region": "New York",
    "trip_tags": ["urban","fun","food"],
    "best_seasons": ["spring","autumn"],
    "budget_levels": ["premium","luxury"],
    "companion_tags": ["friends","family"],
    "popularity_score": 9.3
    },

    {
    "name": "Cape Town",
    "country": "South Africa",
    "region": "Western Cape",
    "trip_tags": ["nature","adventure","beach"],
    "best_seasons": ["summer"],
    "budget_levels": ["medium","premium"],
    "companion_tags": ["friends","couples"],
    "popularity_score": 8.3
    },

    {
    "name": "Maldives",
    "country": "Maldives",
    "region": "Indian Ocean",
    "trip_tags": ["beach","romantic","luxury","relaxation"],
    "best_seasons": ["winter","spring"],
    "budget_levels": ["luxury"],
    "companion_tags": ["couples"],
    "popularity_score": 9.7
    }



]

def seed():
    collection.delete_many({})
    collection.insert_many(destinations)
    print("✅ Smart destinations inserted successfully")


if __name__ == "__main__":
    seed()
