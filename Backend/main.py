from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db import engine, get_db, Base
from models import User, Order, OrderItem
from schemas import (
    LoginRequest, TokenResponse, UserOut,
    OrderCreate, OrderUpdate, OrderOut,
)
from auth import hash_password, verify_password, create_access_token, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Order Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Seed Data ────────────────────────────────────────────────
def seed_data(db: Session):
    # Seed default users
    if db.query(User).count() == 0:
        users = [
            User(
                username="admin",
                email="admin@orderapp.com",
                full_name="Admin User",
                hashed_password=hash_password("admin123"),
                role="admin",
            ),
            User(
                username="demo",
                email="demo@orderapp.com",
                full_name="Demo User",
                hashed_password=hash_password("demo123"),
                role="viewer",
            ),
        ]
        db.add_all(users)
        db.commit()

    # Seed sample orders
    if db.query(Order).count() == 0:
        sample_orders = [
            {"customer_name": "Alice Johnson", "status": "Completed", "items": [
                {"product_name": "Laptop", "quantity": 1, "price": 999.99},
                {"product_name": "Mouse", "quantity": 2, "price": 29.99},
            ]},
            {"customer_name": "Bob Smith", "status": "Pending", "items": [
                {"product_name": "Keyboard", "quantity": 1, "price": 79.99},
            ]},
            {"customer_name": "Carol White", "status": "Completed", "items": [
                {"product_name": "Monitor", "quantity": 1, "price": 349.99},
                {"product_name": "USB Cable", "quantity": 3, "price": 9.99},
            ]},
            {"customer_name": "David Brown", "status": "Pending", "items": [
                {"product_name": "Headphones", "quantity": 1, "price": 149.99},
                {"product_name": "Webcam", "quantity": 1, "price": 69.99},
            ]},
            {"customer_name": "Eva Martinez", "status": "Completed", "items": [
                {"product_name": "Tablet", "quantity": 1, "price": 499.99},
            ]},
        ]
        for data in sample_orders:
            items = data.pop("items")
            total = sum(i["price"] * i["quantity"] for i in items)
            order = Order(**data, total_price=total)
            for item in items:
                order.items.append(OrderItem(**item))
            db.add(order)
        db.commit()


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_data(db)
    finally:
        db.close()


# ── Auth Endpoints ───────────────────────────────────────────
@app.post("/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": user.username})
    return TokenResponse(access_token=token)


@app.get("/auth/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Order Endpoints (protected) ──────────────────────────────
@app.get("/orders", response_model=list[OrderOut])
def get_orders(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.id.desc()).all()


@app.get("/orders/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = sum(item.price * item.quantity for item in data.items)
    order = Order(
        customer_name=data.customer_name,
        status=data.status,
        total_price=total,
    )
    for item in data.items:
        order.items.append(OrderItem(**item.model_dump()))
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@app.patch("/orders/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return order


@app.delete("/orders/{order_id}", status_code=204)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
