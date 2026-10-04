import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trackOrder } from "../api";
import { Package, CheckCircle, Truck, MapPin, Clock, ArrowLeft } from "lucide-react";

const STEPS = [
  { key: "pending",              label: "Order Placed",           icon: Package },
  { key: "confirmed",            label: "Confirmed",              icon: CheckCircle },
  { key: "ready_for_delivery",   label: "Ready for Delivery",     icon: Package },
  { key: "picked_up",            label: "Picked Up",              icon: Truck },
  { key: "delivered",            label: "Delivered",              icon: MapPin },
];

function stepIndex(status) {
  const i = STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    trackOrder(orderId)
      .then((r) => setOrder(r.data))
      .catch((err) => setError(err.response?.data?.detail || "Order not found"))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888" }}>Loading order...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
      <p style={{ color: "#c00" }}>{error}</p>
      <button onClick={() => navigate("/account")} className="btn-primary">Go to Account</button>
    </div>
  );

  const current = stepIndex(order.status);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button onClick={() => navigate("/account")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 600, marginBottom: "1.5rem" }}>
          <ArrowLeft size={16} /> Back to Orders
        </button>

        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--primary)", marginBottom: "0.25rem" }}>
          Order #{order.id}
        </h2>
        <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          {order.payment_method === "cod" ? "Cash on Delivery" : "Paid via Razorpay"} · ₹{order.total.toLocaleString("en-IN")}
        </p>

        {/* Status timeline */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "1.5rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1.5rem", color: "#333" }}>Tracking Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((step, i) => {
              const done = i <= current;
              const active = i === current;
              const Icon = step.icon;
              return (
                <div key={step.key} style={{ display: "flex", gap: "1rem", position: "relative" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? "var(--primary)" : "#e5e5e5",
                      color: done ? "#fff" : "#aaa",
                      flexShrink: 0,
                      boxShadow: active ? "0 0 0 4px rgba(123,29,69,0.15)" : "none",
                      transition: "all 0.2s",
                    }}>
                      <Icon size={16} />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ width: 2, flexGrow: 1, background: done && i < current ? "var(--primary)" : "#e5e5e5", minHeight: 32, margin: "2px 0" }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < STEPS.length - 1 ? "1.5rem" : 0, paddingTop: "0.4rem" }}>
                    <p style={{ margin: 0, fontWeight: active ? 700 : 500, color: done ? "#222" : "#aaa", fontSize: "0.9rem" }}>
                      {step.label}
                    </p>
                    {order.status_history?.filter((h) => h.status === step.key).map((h, j) => (
                      <p key={j} style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#888" }}>
                        <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                        {new Date(h.created_at).toLocaleString("en-IN")}
                        {h.note && ` · ${h.note}`}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery person */}
        {order.delivery_person && (
          <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "#333" }}>Delivery Person</h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{order.delivery_person.name}</p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>{order.delivery_person.phone}</p>
          </div>
        )}

        {/* Delivery address */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "#333" }}>Delivery Address</h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>{order.delivery_address}</p>
        </div>

        {/* Order items */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem", color: "#333" }}>Items</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} />}
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "0.9rem" }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>Qty: {item.quantity}</p>
                  </div>
                </div>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--primary)" }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #eee", marginTop: "1rem", paddingTop: "1rem", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontWeight: 700, color: "var(--primary)" }}>₹{order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
