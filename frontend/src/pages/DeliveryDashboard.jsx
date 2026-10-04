import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getDeliveryOrders, deliveryScanQr, markDelivered } from "../api";
import { LogOut, Truck, ScanLine, CheckCircle, MapPin } from "lucide-react";
import QrScanner from "../components/QrScanner";
import { usePushNotifications } from "../hooks/usePushNotifications";

const STATUS_LABEL = { ready_for_delivery: "Ready for Pickup", picked_up: "Picked Up" };
const STATUS_COLOR = { ready_for_delivery: "#d97706", picked_up: "#7c3aed" };

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [person] = useState(() => JSON.parse(localStorage.getItem("delivery_person") || "{}"));
  const navigate = useNavigate();
  usePushNotifications("delivery_person", person.id, localStorage.getItem("delivery_token"));

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = () => {
    setLoading(true);
    getDeliveryOrders().then((r) => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const logout = () => {
    localStorage.removeItem("delivery_token");
    localStorage.removeItem("delivery_person");
    navigate("/delivery/login");
  };

  const handleScan = async (token) => {
    setShowScanner(false);
    try {
      await deliveryScanQr(token);
      toast.success("Order marked as Picked Up!");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Scan failed");
    }
  };

  const handleDeliver = async (orderId) => {
    if (!confirm("Mark this order as Delivered?")) return;
    try {
      await markDelivered(orderId);
      toast.success("Order marked as Delivered!");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const badge = (status) => ({
    display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20,
    fontSize: "0.72rem", fontWeight: 600,
    background: (STATUS_COLOR[status] || "#888") + "18",
    color: STATUS_COLOR[status] || "#888",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "#1a4080", color: "#fff", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem" }}>{person.name || "Delivery"}</p>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.75 }}>Delivery Portal</p>
        </div>
        <button onClick={logout} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, padding: "0.4rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
          <LogOut size={14} /> Logout
        </button>
      </header>

      <div style={{ flex: 1, padding: "1.25rem", maxWidth: 700, margin: "0 auto", width: "100%" }}>
        {/* Scan button */}
        <button onClick={() => setShowScanner(true)} style={{
          width: "100%", padding: "1rem", background: "#1a4080", color: "#fff",
          border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "1rem",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
          marginBottom: "1.5rem", boxShadow: "0 4px 12px rgba(26,64,128,0.3)",
        }}>
          <ScanLine size={20} /> Scan QR to Pick Up Order
        </button>

        <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#1a4080", marginBottom: "1rem" }}>
          Assigned Orders ({orders.length})
        </h2>

        {loading ? (
          <p style={{ color: "#888", textAlign: "center", padding: "2rem" }}>Loading...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>
            <Truck size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <p>No assigned orders at the moment.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {orders.map((o) => (
              <div key={o.id} style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>Order #{o.id}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>
                      {o.customer?.name} · {o.payment_method === "cod" ? "COD" : "Paid"} · ₹{o.total.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span style={badge(o.status)}>{STATUS_LABEL[o.status] || o.status}</span>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginBottom: "0.75rem" }}>
                  <MapPin size={14} style={{ color: "#888", marginTop: 2, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#555" }}>{o.delivery_address}</p>
                </div>

                <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#666" }}>
                  📞 {o.customer?.phone || "—"}
                </p>

                <div style={{ fontSize: "0.82rem", color: "#555", marginBottom: "0.75rem" }}>
                  {o.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{item.name} ×{item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                {o.status === "picked_up" && (
                  <button onClick={() => handleDeliver(o.id)} style={{
                    width: "100%", padding: "0.65rem", background: "#16a34a", color: "#fff",
                    border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.9rem",
                  }}>
                    <CheckCircle size={16} /> Mark as Delivered
                  </button>
                )}

                {o.status === "ready_for_delivery" && (
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#d97706", fontWeight: 600, textAlign: "center" }}>
                    Scan QR code above to confirm pickup
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showScanner && <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
