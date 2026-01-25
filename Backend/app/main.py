from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.wallet import router as wallet_router
from app.routes.auth import router as auth_router
from app.routes.trips import router as trips_router

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
app.include_router(wallet_router, prefix="/wallet", tags=["Wallet"])
app.include_router(trips_router, prefix="/trips", tags=["Trips"])

# Root route
@app.get("/")
def root():
    return {"message": "Backend is running"}
