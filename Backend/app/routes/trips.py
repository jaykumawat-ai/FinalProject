from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def trips_root():
    return {"message": "Trips route working"}
