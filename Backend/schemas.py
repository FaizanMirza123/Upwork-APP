from pydantic import BaseModel
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str

    model_config = {"from_attributes": True}


# ── Orders ───────────────────────────────────────────────────
class OrderItemBase(BaseModel):
    product_name: str
    quantity: int
    price: float


class OrderItemOut(OrderItemBase):
    id: int

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_name: str
    status: str = "Pending"
    items: list[OrderItemBase] = []


class OrderUpdate(BaseModel):
    customer_name: str | None = None
    status: str | None = None


class OrderOut(BaseModel):
    id: int
    customer_name: str
    status: str
    total_price: float
    created_at: datetime
    items: list[OrderItemOut] = []

    model_config = {"from_attributes": True}
