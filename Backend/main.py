from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db import engine, get_db, Base
from models import Order, OrderItem
from schemas import OrderCreate, OrderUpdate, OrderOut

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Order Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_data(db: Session):
    if db.query(Order).count() > 0:
        return
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


@app.get("/orders", response_model=list[OrderOut])
def get_orders(status: str | None = Query(None), db: Session = Depends(get_db)):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.id.desc()).all()


@app.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
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
def update_order(order_id: int, data: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return order
