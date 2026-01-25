from pydantic import BaseModel, Field

class AddMoney(BaseModel):
    amount: int = Field(..., gt=0)

class WalletResponse(BaseModel):
    balance: int
