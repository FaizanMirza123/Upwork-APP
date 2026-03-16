import { useState, useEffect, useCallback } from "react";
import { fetchOrders, fetchOrder, createOrder, updateOrder } from "./api";
import "./App.css";

function App() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders(filter || undefined);
      setOrders(data);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRowClick = async (id) => {
    try {
      const order = await fetchOrder(id);
      setSelectedOrder(order);
    } catch {
      alert("Failed to load order details");
    }
  };

  const handleStatusToggle = async (order) => {
    const newStatus = order.status === "Pending" ? "Completed" : "Pending";
    try {
      const updated = await updateOrder(order.id, { status: newStatus });
      setSelectedOrder(updated);
      loadOrders();
    } catch {
      alert("Failed to update order");
    }
  };

  const handleCreate = async (data) => {
    try {
      await createOrder(data);
      setShowCreate(false);
      loadOrders();
    } catch {
      alert("Failed to create order");
    }
  };

  return (
    <div className="app">
      <div className="header-row">
        <h1>Orders Dashboard</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Order"}
        </button>
      </div>

      {showCreate && <CreateOrderForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />}

      <div className="filter-bar">
        {["", "Pending", "Completed"].map((s) => (
          <button
            key={s}
            className={filter === s ? "active" : ""}
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading && <p className="loading">Loading orders...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="empty">No orders found.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} onClick={() => handleRowClick(order.id)}>
                <td>#{order.id}</td>
                <td>{order.customer_name}</td>
                <td>
                  <span className={`badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>${order.total_price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedOrder && (
        <div className="detail-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Order #{selectedOrder.id}</h2>
            <div className="meta">
              <div className="meta-item">
                <span className="meta-label">Customer</span>
                <span className="meta-value">{selectedOrder.customer_name}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-value">
                  <span className={`badge ${selectedOrder.status.toLowerCase()}`}>
                    {selectedOrder.status}
                  </span>
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Total</span>
                <span className="meta-value">${selectedOrder.total_price.toFixed(2)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created</span>
                <span className="meta-value">
                  {new Date(selectedOrder.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {selectedOrder.items.length > 0 && (
              <>
                <h3>Items</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="detail-actions">
              <button
                className={`btn ${selectedOrder.status === "Pending" ? "btn-success" : "btn-secondary"}`}
                onClick={() => handleStatusToggle(selectedOrder)}
              >
                Mark as {selectedOrder.status === "Pending" ? "Completed" : "Pending"}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateOrderForm({ onSubmit, onCancel }) {
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState([{ product_name: "", quantity: 1, price: 0 }]);

  const addItem = () => setItems([...items, { product_name: "", quantity: 1, price: 0 }]);

  const removeItem = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) return alert("Customer name is required");
    const validItems = items.filter((i) => i.product_name.trim());
    if (validItems.length === 0) return alert("Add at least one item");
    onSubmit({
      customer_name: customerName.trim(),
      items: validItems.map((i) => ({
        product_name: i.product_name.trim(),
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
      })),
    });
  };

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <h2>New Order</h2>
      <div className="form-row">
        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>
      <h3 style={{ marginBottom: 8 }}>Items</h3>
      {items.map((item, i) => (
        <div key={i} className="item-row">
          <input
            className="product-input"
            type="text"
            placeholder="Product name"
            value={item.product_name}
            onChange={(e) => updateItem(i, "product_name", e.target.value)}
          />
          <input
            className="qty-input"
            type="number"
            min="1"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => updateItem(i, "quantity", e.target.value)}
          />
          <input
            className="price-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={item.price}
            onChange={(e) => updateItem(i, "price", e.target.value)}
          />
          <button type="button" className="remove-item-btn" onClick={() => removeItem(i)}>
            &times;
          </button>
        </div>
      ))}
      <button type="button" className="add-item-link" onClick={addItem}>
        + Add another item
      </button>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Create Order</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default App;
