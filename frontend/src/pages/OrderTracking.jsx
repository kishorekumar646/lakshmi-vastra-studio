import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trackOrder } from "../api";
import { Package, CheckCircle, Truck, MapPin, Clock, ArrowLeft, ShoppingBag, Star } from "lucide-react";
import { formatPhone } from "../utils/phone";

const STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    icon: ShoppingBag,
    desc: "Your order has been received and is awaiting confirmation.",
  },
  {
    key: "confirmed",
    label: "Order Confirmed",
    icon: CheckCircle,
    desc: "Payment confirmed. The shop is now preparing your package.",
  },
  {
    key: "ready_for_delivery",
    label: "Packed & Ready",
    icon: Package,
    desc: "Your order is packed and waiting to be picked up by delivery.",
  },
  {
    key: "picked_up",
    label: "Out for Delivery",
    icon: Truck,
    desc: "Your package is on the way!",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: Star,
    desc: "Your order has been delivered. Enjoy your saree!",
  },
];

const STATUS_BANNER = {
  pending: { bg: "#FEF9C3", color: "#854D0E", border: "#FDE047", emoji: "🕐", msg: "Waiting for confirmation" },
  confirmed: { bg: "#DBEAFE", color: "#1E40AF", border: "#93C5FD", emoji: "📦", msg: "Shop is packing your order" },
  ready_for_delivery: { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7", emoji: "✅", msg: "Packed & waiting for pickup" },
  picked_up: { bg: "#EDE9FE", color: "#5B21B6", border: "#C4B5FD", emoji: "🚚", msg: "Out for delivery" },
  delivered: { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7", emoji: "🎉", msg: "Delivered successfully!" },
};

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
      <p style={{ color: "#888" }}>Loading order…</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
      <p style={{ color: "#c00" }}>{error}</p>
      <button onClick={() => navigate("/account")} className="btn-primary">Go to Account</button>
    </div>
  );

  const current = stepIndex(order.status);
  const banner = STATUS_BANNER[order.status] || STATUS_BANNER.pending;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        <button onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 600, marginBottom: "1.5rem" }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--primary)", margin: "0 0 0.2rem" }}>
            Order #{order.id}
          </h2>
          <p style={{ color: "#888", fontSize: "0.85rem", margin: 0 }}>
            {order.payment_method === "cod" ? "Cash on Delivery" : "Paid via Razorpay"} · ₹{order.total.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Current status banner */}
        <div style={{ background: banner.bg, border: `1px solid ${banner.border}`, borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{banner.emoji}</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: banner.color, fontSize: "0.95rem" }}>{banner.msg}</p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: banner.color, opacity: 0.75 }}>
              {STEPS[current].desc}
            </p>
          </div>
        </div>

        {/* OTP card — shown to customer when order is out for delivery */}
        {order.status === "picked_up" && order.delivery_otp && (
          <div style={{
            background: "linear-gradient(135deg, #1a4080 0%, #2563eb 100%)",
            borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
            boxShadow: "0 4px 20px rgba(26,64,128,0.3)",
          }}>
            <p style={{ margin: "0 0 0.5rem", color: "rgba(255,255,255,0.75)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              🔐 Delivery OTP — share with your delivery person
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {order.delivery_otp.split("").map((digit, i) => (
                  <div key={i} style={{
                    width: 48, height: 56, borderRadius: 10,
                    background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: "1.6rem", fontWeight: 900, letterSpacing: 0,
                  }}>{digit}</div>
                ))}
              </div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.78rem", lineHeight: 1.5, flex: 1 }}>
                Give this 4-digit code to the delivery person when they arrive at your door.
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "1.5rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "1.5rem", color: "#333", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tracking Timeline</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((step, i) => {
              const done = i <= current;
              const active = i === current;
              const future = i > current;
              const Icon = step.icon;
              const historyEntry = order.status_history?.find((h) => h.status === step.key);
              return (
                <div key={step.key} style={{ display: "flex", gap: "1rem", position: "relative" }}>
                  {/* Icon column */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: active ? "var(--primary)" : done ? "#4CAF50" : "#e5e5e5",
                      color: done || active ? "#fff" : "#bbb",
                      flexShrink: 0,
                      boxShadow: active ? "0 0 0 5px rgba(123,29,69,0.12)" : "none",
                      transition: "all 0.2s",
                    }}>
                      <Icon size={16} />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        width: 2, flexGrow: 1,
                        background: i < current ? "#4CAF50" : "#e5e5e5",
                        minHeight: 36, margin: "3px 0",
                      }} />
                    )}
                  </div>

                  {/* Text column */}
                  <div style={{ paddingBottom: i < STEPS.length - 1 ? "1.75rem" : 0, paddingTop: "0.35rem", flex: 1 }}>
                    <p style={{
                      margin: 0,
                      fontWeight: active ? 700 : done ? 600 : 400,
                      color: active ? "var(--primary)" : done ? "#222" : "#bbb",
                      fontSize: "0.92rem",
                    }}>
                      {step.label}
                      {active && <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "var(--primary)", color: "#fff", padding: "0.1rem 0.45rem", borderRadius: 20, verticalAlign: "middle", fontWeight: 700 }}>NOW</span>}
                    </p>
                    {historyEntry ? (
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#888", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={10} />
                        {new Date(historyEntry.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {historyEntry.note && ` · ${historyEntry.note}`}
                      </p>
                    ) : future ? (
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#ccc" }}>{step.desc}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery person */}
        {order.delivery_person && (
          <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>{order.delivery_person.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Delivery Person</p>
              <p style={{ margin: "0.1rem 0 0", fontWeight: 700, fontSize: "0.95rem", color: "#222" }}>{order.delivery_person.name}</p>
              {order.delivery_person.phone && (
                <a href={`tel:+91${order.delivery_person.phone.replace(/\D/g, "")}`} style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>{formatPhone(order.delivery_person.phone)}</a>
              )}
            </div>
          </div>
        )}

        {/* Delivery address */}
        {order.delivery_address && (
          <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <MapPin size={14} color="var(--primary)" />
              <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Delivery Address</h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#555", lineHeight: 1.55 }}>{order.delivery_address}</p>
          </div>
        )}

        {/* Order items */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 1rem" }}>Items Ordered</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 6 }} />}
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#222" }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#888" }}>Qty: {item.quantity}</p>
                  </div>
                </div>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--primary)" }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #eee", marginTop: "1rem", paddingTop: "1rem", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--primary)" }}>₹{order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
