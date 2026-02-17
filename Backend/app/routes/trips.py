from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from fastapi import Query
import json

from app.services.groq_ai import generate_itinerary ,generate_recommendations
from app.utils.fallback_itinerary import fallback_itinerary
from app.services.geocode import geocode_city
from app.models.trip import TripInput
from app.database import (
    trips_collection,
    wallets_collection,
    transactions_collection
)
from app.core.security import get_current_user
from app.services.planner import smart_trip_planner
from app.services.trip_summary import generate_trip_summary

router = APIRouter(prefix="/trips", tags=["Trips"])

# -------------------------------------------------
# Serializer (Mongo-safe)
# -------------------------------------------------
def serialize_trip(trip):
    return {
        "id": str(trip["_id"]),
        "source": trip.get("source"),
        "destination": trip.get("destination"),
        "budget": trip.get("budget"),
        "days": trip.get("days"),
        "people": trip.get("people"),
        "plan": trip.get("plan"),
        "lat": trip.get("lat"),
        "lon": trip.get("lon"),
        "status": trip.get("status"),
        "created_at": trip.get("created_at"),
        "confirmed_at": trip.get("confirmed_at"),
        "booked_at": trip.get("booked_at"),
        "selected_transport": trip.get("selected_transport"),
        "final_cost": trip.get("final_cost"),
        "saved_food": trip.get("saved_food", []),
        "saved_places": trip.get("saved_places", []),
    }


# -------------------------------------------------
# Root check
# -------------------------------------------------
@router.get("/")
def trips_root():
    return {"message": "Trips API working"}


# -------------------------------------------------
# 1️⃣ PLAN TRIP (AI + GEO)
# -------------------------------------------------
@router.post("/plan")
def plan_trip(
    trip: TripInput,
    current_user: str = Depends(get_current_user)
):
    plan = smart_trip_planner(
        trip.source,
        trip.destination,
        trip.budget,
        trip.days,
        trip.people
    )

    coords = geocode_city(trip.destination)
    if not coords:
        raise HTTPException(
            status_code=400,
            detail="Unable to locate destination city"
        )

    trip_data = {
        "user": current_user,
        "source": trip.source,
        "destination": trip.destination,
        "budget": trip.budget,
        "days": trip.days,
        "people": trip.people,
        "plan": plan,
        "lat": coords["lat"],
        "lon": coords["lon"],
        "coordinates": coords,
        "status": "planned",
        "created_at": datetime.utcnow(),
        "confirmed_at": None,
        "booked_at": None,
        "saved_food": [],
        "saved_places": []
    }

    result = trips_collection.insert_one(trip_data)

    return {
        "id": str(result.inserted_id),
        "status": "planned",
        "destination": trip.destination,
        "coordinates": coords,
        "plan": plan
    }


# -------------------------------------------------
# 2️⃣ CONFIRM TRIP (with transport selection)
# -------------------------------------------------
@router.post("/confirm/{trip_id}")
def confirm_trip(
    trip_id: str,
    data: dict,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["status"] != "planned":
        raise HTTPException(status_code=400, detail="Trip cannot be confirmed")

    selected_mode = data.get("selected_transport")

    if not selected_mode:
        raise HTTPException(status_code=400, detail="Transport selection required")

    # Find selected transport option
    transport_options = trip["plan"]["transport"]["options"]
    selected_option = next(
        (opt for opt in transport_options if opt["mode"] == selected_mode["mode"]),
        None
    )

    if not selected_option:
        raise HTTPException(status_code=400, detail="Invalid transport option")

    # Recalculate total cost
    per_day_cost = 1000
    days = trip["days"]
    people = trip["people"]

    total_cost = (
        selected_option["estimated_cost"] +
        (per_day_cost * days)
    ) * people

    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {
            "status": "confirmed",
            "selected_transport": selected_option,
            "final_cost": int(total_cost),
            "confirmed_at": datetime.utcnow()
        }}
    )

    return {
        "message": "Trip confirmed",
        "trip_id": trip_id,
        "final_cost": int(total_cost)
    }



# -------------------------------------------------
# 3️⃣ BOOK TRIP (Wallet)
# -------------------------------------------------
@router.post("/book/{trip_id}")
def book_trip(
    trip_id: str,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Confirm trip before booking")

    cost = trip.get("final_cost")
    if not cost:
        raise HTTPException(status_code=400, detail="Trip cost not finalized")

    


    wallet = wallets_collection.find_one({"user": current_user})
    if not wallet or wallet["balance"] < cost:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    wallets_collection.update_one(
        {"user": current_user},
        {"$inc": {"balance": -cost}}
    )

    transactions_collection.insert_one({
        "user": current_user,
        "type": "debit",
        "amount": cost,
        "reason": "Trip booking",
        "created_at": datetime.utcnow()
    })

    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {
            "status": "booked",
            "booked_at": datetime.utcnow()
        }}
    )

    wallet = wallets_collection.find_one({"user": current_user})

    return {
        "message": "Trip booked successfully",
        "amount_paid": cost,
        "remaining_balance": wallet["balance"]
    }


# -------------------------------------------------
# 4️⃣ USER TRIPS
# -------------------------------------------------
@router.get("/my-trips")
def my_trips(current_user: str = Depends(get_current_user)):
    trips = trips_collection.find({"user": current_user})
    return [serialize_trip(t) for t in trips]


# -------------------------------------------------
# 5️⃣ BOOKED TRIPS
# -------------------------------------------------
@router.get("/booked")
def booked_trips(current_user: str = Depends(get_current_user)):
    trips = trips_collection.find({
        "user": current_user,
        "status": "booked"
    })
    return [serialize_trip(t) for t in trips]


# -------------------------------------------------
# 6️⃣ AI-ONLY TRIP PLANNING (Groq + Fallback)
# -------------------------------------------------
@router.post("/ai/plan-trip")
def ai_plan_trip(data: dict):
    destination = data.get("destination")
    days = data.get("days")
    budget = data.get("budget")

    if not destination or not days or not budget:
        raise HTTPException(
            status_code=400,
            detail="Missing trip parameters"
        )

    ai_result = generate_itinerary(destination, days, budget)

    if not ai_result:
        ai_result = fallback_itinerary(destination, days, budget)

    return {
        "destination": destination,
        "days": days,
        "budget": budget,
        "itinerary": ai_result
    }

# -------------------------------------------------
# 7️⃣ TRIP SUMMARY (Phase 6B)  — return trip + summary
# -------------------------------------------------
@router.get("/summary/{trip_id}")
def trip_summary(
    trip_id: str,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    summary = generate_trip_summary(trip)

    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {
            "summary": summary,
            "summary_created_at": datetime.utcnow()
        }}
    )

    # Build a trip object that matches serialize_trip (and attach summary)
    trip_obj = serialize_trip(trip)
    trip_obj["summary"] = summary
    # include final_cost if present in DB (useful for UI)
    if "final_cost" in trip:
        trip_obj["final_cost"] = trip.get("final_cost")

    return trip_obj




# -------------------------------------------------
# 7️⃣ SMART PERSONALIZED AI RECOMMENDATIONS
# -------------------------------------------------
# trips.py — replace the /{trip_id}/recommendations endpoint with this



@router.post("/{trip_id}/recommendations")
def trip_recommendations(
    trip_id: str,
    companions: str = Query("family", description="family|friends|couples|solo"),
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    saved_places = list(
        trips_collection.database.places.find({
            "trip_id": trip_id
        })
    )

    companion_context = {
        "family": "Focus on safe, kid-friendly, relaxed attractions.",
        "friends": "Focus on fun, nightlife, adventure, group activities.",
        "couples": "Focus on romantic, scenic, sunset, intimate experiences.",
        "solo": "Focus on cultural exploration, flexibility, local immersion."
    }.get(companions, "Balanced travel style.")

    prompt = f"""
You are an advanced travel optimization AI.

You MUST behave like a structured reasoning engine.
You MUST calculate numbers precisely.
You MUST NOT invent random prices.
You MUST use ONLY the provided Trip Data.
You MUST infer destination style (beach, metro city, island, mountain, desert, cultural, etc.) silently.
You MUST adapt recommendations to geography and companion type.

Companion Type: {companions}
Companion Context: {companion_context}

Trip Data:
Destination: {trip.get("destination")}
Budget: {trip.get("budget")}
Final Cost: {trip.get("final_cost")}
Days: {trip.get("days")}
People: {trip.get("people")}
Selected Transport: {trip.get("selected_transport")}
Saved Places Count: {len(saved_places)}
Itinerary: {trip.get("plan", {}).get("itinerary")}

Strict Rules:
- Use real numeric values from Trip Data.
- Budget Difference = Budget - Final Cost.
- Overloaded day = 6 or more activities.
- Underutilized day = 3 or fewer activities.
- Estimated savings MUST relate to real difference or transport cost.
- Nearby recommendations must:
  - Include a specific activity format (e.g., sunset yacht cruise, guided street food crawl, ATV jungle ride).
  - Include a realistic venue type (e.g., marina, night market, rooftop bar, beach shack, heritage district).
  - Match geography.
  - Match companion energy level.
  - Food recommendations must:
  - Suggest 3 popular local foods.
  - Include REAL restaurant examples.
  - Match the destination.
  - Feel authentic.
  - Avoid generic phrases like “try local food”.


Tasks:
1. Return exact numeric budget analysis.
2. Detect overloaded and underutilized days.
3. Suggest ONE logical cost optimization.
4. Suggest ONE itinerary restructuring.
5. Suggest 3 highly contextual experiences.
6. Suggest 3 popular local foods with real restaurant examples.

Return ONLY valid JSON in this exact format:

{{
  "budget_analysis": {{
    "budget": 0,
    "final_cost": 0,
    "difference": 0,
    "status": ""
  }},
  "activity_analysis": {{
    "overloaded_days": [],
    "underutilized_days": []
  }},
  "cost_optimization": {{
    "suggestion": "",
    "estimated_savings": 0,
    "reason": ""
  }},
  "itinerary_optimization": {{
    "day": "",
    "adjustment": "",
    "reason": ""
  }},
  "nearby_recommendations": [
    {{
      "name": "",
      "category": "",
      "reason": ""
    }}
   ],
   "food_recommendations": [
    {{
      "dish": "",
      "restaurant": "",
      "area": "",
      "reason": ""
    }}
  ]
}}

No markdown.
No explanations.
Only JSON.
"""

    ai_text = generate_recommendations(prompt)

    try:
        parsed = json.loads(ai_text)
    except:
        start = ai_text.find("{")
        end = ai_text.rfind("}")
        if start != -1 and end != -1:
            try:
                parsed = json.loads(ai_text[start:end+1])
            except:
                return {"error": "AI output parsing failed"}
        else:
            return {"error": "AI output parsing failed"}

    # 🔥 FORCE ALL MAIN FIELDS TO STRING
  

    return parsed






# -------------------------------------------------
# ADD FOOD TO TRIP
# -------------------------------------------------
@router.post("/{trip_id}/food/add")
def add_food_to_trip(
    trip_id: str,
    data: dict,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    food = data.get("food")

    if not food:
        raise HTTPException(status_code=400, detail="Food data required")

    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$push": {"saved_food": food}}
    )

    return {"message": "Food saved successfully"}







# -------------------------------------------------
# 8️⃣ ADD PLACE TO ITINERARY (Correct Version)
# -------------------------------------------------
@router.post("/{trip_id}/itinerary/add-place")
def add_place_to_itinerary(
    trip_id: str,
    data: dict,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    day_number = data.get("day")
    place = data.get("place")

    if not day_number or not place:
        raise HTTPException(status_code=400, detail="Day and place required")

    itinerary = trip["plan"]["itinerary"]

    for day in itinerary:
        if day["day"] == day_number:
            day["activities"].append({
                "time": "Flexible",
                "name": place["name"],
                "lat": place["lat"],
                "lon": place["lon"],
                "type": place["type"]
            })
            break
    else:
        raise HTTPException(status_code=400, detail="Invalid day number")

    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {"plan.itinerary": itinerary}}
    )

    return {"message": "Place added to itinerary successfully"}







# -------------------------------------------------
# DELETE TRIP
# -------------------------------------------------
@router.delete("/{trip_id}")
def delete_trip(
    trip_id: str,
    current_user: str = Depends(get_current_user)
):
    trip = trips_collection.find_one({
        "_id": ObjectId(trip_id),
        "user": current_user
    })

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trips_collection.delete_one({
        "_id": ObjectId(trip_id)
    })

    return {"message": "Trip deleted successfully"}
