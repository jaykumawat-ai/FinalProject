from fastapi import FastAPI

app = FastAPI(title="TravelEase API")

@app.get("/")
def root():
    return {"message": "TravelEase backend is running"}
