from datetime import datetime
from pydantic import BaseModel

class TripInput(BaseModel):
    source: str
    destination: str
    budget: int
    days: int
    people: int

class TripDB(TripInput):
    user: str
    status: str = "planned"
    created_at: datetime = datetime.utcnow()
