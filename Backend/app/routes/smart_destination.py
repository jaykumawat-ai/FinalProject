from fastapi import APIRouter
from datetime import datetime
from app.database import smart_destinations_collection
import random
import json
from app.services.groq_ai import generate_recommendations
from app.services.ai_ranking_service import rank_destinations
from app.services.personality_engine import detect_personality
from app.services.trip_explainer_service import generate_trip_explanation
from app.services.refinement_engine import interpret_refinement
from app.services.scoring_engine import compute_final_score

router = APIRouter(
    prefix="/smart-destination",
    tags=["Smart Destination"]
)

collection = smart_destinations_collection

def get_season_from_month(month: int):
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    else:
        return "autumn"
    

@router.post("/find")
def find_destinations(data: dict):

    # ---------- LAYER 1 ----------
    selected_tags = data.get("trip_tags", [])
    companion = data.get("companion")
    budget = data.get("budget")

    season = get_season_from_month(datetime.utcnow().month)

    query = {}

    if selected_tags:
        query["trip_tags"] = {"$all": selected_tags}

    if companion:
        query["companion_tags"] = {"$in": [companion]}

    if budget:
        query["budget_levels"] = {"$in": [budget]}

    if season:
        query["best_seasons"] = {"$in": [season]}

    print("TOTAL:", collection.count_documents({}))
    print("QUERY BEFORE FIND:", query)

    results = list(collection.find(query))
    print("RESULT COUNT BEFORE RELAX:", len(results))

    # Relax only if STRICT season filter fails
    if len(results) < 3:
        query.pop("best_seasons", None)
        results = list(collection.find(query))

    random.shuffle(results)

    results = sorted(
        results,
        key=lambda x: x.get("popularity_score", 0),
        reverse=True
    )

    final = []

    for r in results[:8]:
        final.append({
            "id": str(r["_id"]),
            "name": r["name"],
            "country": r["country"],
            "region": r["region"],
            "trip_tags": r["trip_tags"],
            "popularity_score": r.get("popularity_score", 0)
        })

    return {
        "season": season,
        "count": len(final),
        "destinations": final
    }



@router.post("/find-ai")
def find_destinations_ai(data: dict):

    # ---------- LAYER 1 ----------
    selected_tags = data.get("trip_tags", [])
    companion = data.get("companion")
    budget = data.get("budget")

    travel_month = data.get("travel_month")

    if travel_month:
        season = get_season_from_month(int(travel_month))
    else:
        season = get_season_from_month(datetime.utcnow().month)

    query = {}
    if selected_tags:
        query["trip_tags"] = {"$all": selected_tags}

    # direct match (Mongo matches array elements)
    if companion:
        query["companion_tags"] = companion

    if budget:
        query["budget_levels"] = budget

    if season:
        query["best_seasons"] = {"$in": [season]}

    results = list(collection.find(query))

    # Relax season if not enough variety
    if len(results) < 3:
        query.pop("best_seasons", None)
        results = list(collection.find(query))

    if len(results) == 0:
        return {"season": season, "count": 0, "destinations": []}

    # Call AI Ranking Service
    ranked = rank_destinations(
        selected_tags=selected_tags,
        companion=companion,
        budget=budget,
        season=season,
        db_results=results
    )

    print("CURRENT SEASON:", season)
    print("FINAL QUERY:", query)
    print("MATCH COUNT:", collection.count_documents(query))



    personality_profile = detect_personality(selected_tags, budget, companion)

    return {
        "season": season,
        "personality": personality_profile,
        "count": len(ranked),
        "destinations": ranked
    }


@router.post("/explain")
def explain_destination(data: dict):

    destination = data.get("destination")
    personality = data.get("personality")

    if not destination or not personality:
        return {"error": "destination and personality required"}

    result = generate_trip_explanation(destination, personality)

    return {
        "destination": destination,
        "personality": personality,
        "cached": result.get("cached", False),
        "explanation": result.get("explanation")
    }


@router.post("/refine")
def refine_destinations(data: dict):

    results = data.get("previous_results")
    instruction = data.get("instruction")

    if not results or not instruction:
        return {"error": "previous_results and instruction required"}

    adjustments = interpret_refinement(instruction)

    if not adjustments:
        return {"error": "AI refinement failed"}

    refined = []

    for r in results:
        new_score = compute_final_score(
            tag_score=r.get("tag_score", 0),
            popularity_score=r.get("popularity_score", 0),
            ai_score=r.get("ai_score", 0),
            weights=adjustments,
            crowd_factor = r.get("popularity_score", 5)
        )

        r["final_score"] = new_score
        refined.append(r)

    refined = sorted(refined, key=lambda x: x["final_score"], reverse=True)

    return {
        "instruction": instruction,
        "applied_adjustments": adjustments,
        "destinations": refined
    }


@router.get("/test-smart")
def test_smart_destinations():
    data = list(collection.find({}, {"_id": 0}))
    return {
        "count": len(data),
        "data": data
    }