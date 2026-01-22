from pydantic import BaseModel
from datetime import datetime

class TripInput(BaseModel):
    source: str
    destination: str
    budget: int

class TripDB(TripInput):
    user: str
    status: str = "planned"
    created_at: datetime = datetime.utcnow()
