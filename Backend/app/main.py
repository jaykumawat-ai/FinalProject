from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.routes.wallet import router as wallet_router
from app.routes.auth import router as auth_router
from app.routes.trips import router as trips_router
from app.routes.discover import router as discover_router
from app.routes import trip_places
from app.routes.transport import router as transport_router
from app.routes.hotels import router as hotels_router
from app.routes import weather



import requests

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(wallet_router, prefix="/wallet")
app.include_router(trips_router)
app.include_router(discover_router)
app.include_router(trip_places.router)
app.include_router(transport_router)
app.include_router(hotels_router)



# Root route
@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.get("/search")
def search_place(q: str = Query(...)):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "json",
        "limit": 5
    }
    headers = {
        "User-Agent": "TravelEaseApp/1.0 (contact@email.com)"
    }
    r = requests.get(url, params=params, headers=headers)
    return r.json()