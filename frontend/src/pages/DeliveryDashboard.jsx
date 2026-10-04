import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getDeliveryOrders, getDeliveryStats, getCompletedDeliveries,
  deliveryScanQr, markDelivered,
} from "../api";
import {
  LogOut, Truck, ScanLine, CheckCircle, MapPin, Package,
  TrendingUp, Star, LayoutDashboard, ListChecks, History,
} from "lucide-react";
import QrScanner from "../components/QrScanner";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { usePwaInstall } from "../hooks/usePwaInstall";
import InstallGuideSheet from "../components/InstallGuideSheet";

/* ── helpers ─────────────────────────────────────────────── */
const STATUS_LABEL = { ready_for_delivery: "Ready for Pickup", picked_up: "Picked Up", delivered: "Delivered" };
const STATUS_COLOR = { ready_for_delivery: "#d97706", picked_up: "#7c3aed", delivered: "#16a34a" };

function fmt(n) { return Number(n || 0).toLocaleString("en-IN"); }
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ── StatCard ────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "1.1rem 1.1rem",
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: `1px solid ${accent}22`,
      display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "1.55rem", fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</p>
        <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        {sub && <p style={{ margin: "0.15rem 0 0", fontSize: "0.65rem", color: "#94A3B8" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Tab bar ─────────────────────────────────────────────── */
function TabBar({ active, onChange, counts }) {
  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "active",    label: "Active",    icon: ListChecks,  badge: counts.active },
    { key: "completed", label: "Completed", icon: History,     badge: counts.completed },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      display: "flex", background: "#fff",
      borderTop: "1px solid #E2E8F0",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "0.25rem", padding: "0.7rem 0.5rem", border: "none", background: "none", cursor: "pointer",
            color: isActive ? "#1a4080" : "#94A3B8", transition: "color 0.18s", position: "relative",
          }}>
            <div style={{ position: "relative" }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              {t.badge > 0 && (
                <span style={{
                  position: "absolute", top: -5, right: -8,
                  background: "#1a4080", color: "#fff", borderRadius: 20,
                  fontSize: "0.55rem", fontWeight: 900, padding: "0.1rem 0.35rem", minWidth: 14, textAlign: "center",
                }}>
                  {t.badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.65rem", fontWeight: isActive ? 800 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Active order card ───────────────────────────────────── */
function ActiveOrderCard({ o, otpInputs, setOtpInputs, delivering, onDeliver }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      borderLeft: `4px solid ${STATUS_COLOR[o.status] || "#888"}`,
    }}>
      {/* Order header */}
      <div style={{ padding: "1rem 1.1rem 0.75rem", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.97rem", color: "#0F172A" }}>Order #{o.id}</p>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>
              {o.customer?.name} · {o.payment_method === "cod" ? "💵 COD" : "✅ Paid Online"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{
              display: "inline-block", padding: "0.22rem 0.7rem", borderRadius: 20,
              fontSize: "0.68rem", fontWeight: 700,
              background: (STATUS_COLOR[o.status] || "#888") + "18",
              color: STATUS_COLOR[o.status] || "#888",
            }}>{STATUS_LABEL[o.status] || o.status}</span>
            <p style={{ margin: "0.3rem 0 0", fontWeight: 800, color: "#0F172A", fontSize: "1rem" }}>₹{fmt(o.total)}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0.75rem 1.1rem" }}>
        {/* Address */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.6rem" }}>
          <MapPin size={13} style={{ color: "#94A3B8", marginTop: 2, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.5 }}>{o.delivery_address}</p>
        </div>

        {/* Phone */}
        <a href={`tel:+91${o.customer?.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 700, color: "#1a4080", textDecoration: "none", marginBottom: "0.75rem" }}>
          📞 {o.customer?.phone || "—"}
        </a>

        {/* Items */}
        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "0.5rem 0.75rem", marginBottom: "0.75rem" }}>
          {o.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#475569", padding: "0.15rem 0" }}>
              <span>{item.name} ×{item.quantity}</span>
              <span style={{ fontWeight: 600 }}>₹{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* OTP confirm */}
        {o.status === "picked_up" && (
          <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: "0.85rem 1rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 700, color: "#15803D" }}>
              🔐 Enter 4-digit OTP from customer to confirm delivery
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number" placeholder="_ _ _ _"
                value={otpInputs[o.id] || ""}
                onChange={(e) => setOtpInputs((p) => ({ ...p, [o.id]: e.target.value.slice(0, 4) }))}
                style={{ flex: 1, padding: "0.6rem 0.75rem", border: "1.5px solid #86EFAC", borderRadius: 8, fontSize: "1.2rem", fontWeight: 800, letterSpacing: "0.3em", textAlign: "center", outline: "none" }}
              />
              <button
                onClick={() => onDeliver(o.id)}
                disabled={delivering[o.id]}
                style={{ padding: "0.6rem 1rem", background: delivering[o.id] ? "#86EFAC" : "#16A34A", color: "#fff", border: "none", borderRadius: 8, cursor: delivering[o.id] ? "not-allowed" : "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
              >
                <CheckCircle size={14} /> {delivering[o.id] ? "Verifying…" : "Confirm"}
              </button>
            </div>
          </div>
        )}

        {o.status === "ready_for_delivery" && (
          <div style={{ background: "#FFFBEB", border: "1.5px solid #FCD34D", borderRadius: 10, padding: "0.65rem 0.9rem", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400E", fontWeight: 700 }}>
              📦 Go to shop → Scan QR to confirm pickup
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Completed order card ────────────────────────────────── */
function CompletedOrderCard({ o, earningPerDelivery }) {
  const deliveredEntry = o.status_history?.find((h) => h.status === "delivered");
  const earned = earningPerDelivery || 50;
  return (
    <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: "4px solid #16a34a" }}>
      <div style={{ padding: "0.9rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <CheckCircle size={14} color="#16a34a" />
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.92rem", color: "#0F172A" }}>Order #{o.id}</p>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>{o.customer?.name}</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "#94A3B8" }}>
            {deliveredEntry ? fmtDate(deliveredEntry.created_at) : fmtDate(o.created_at)}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: 900, color: "#1a4080", fontSize: "1rem" }}>₹{fmt(earned)}</p>
          <p style={{ margin: "0.1rem 0 0", fontSize: "0.65rem", color: "#94A3B8" }}>Order ₹{fmt(o.total)}</p>
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#16a34a", background: "#D1FAE5", padding: "0.15rem 0.55rem", borderRadius: 20, display: "inline-block", marginTop: "0.25rem" }}>
            Delivered
          </span>
        </div>
      </div>
      <div style={{ padding: "0 1.1rem 0.75rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
          <MapPin size={11} style={{ color: "#94A3B8", marginTop: 2, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "0.73rem", color: "#94A3B8" }}>{o.delivery_address}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export default function DeliveryDashboard() {
  const [tab, setTab] = useState("dashboard");
  const switchTab = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: "instant" }); };
  const [orders, setOrders] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedDay, setSelectedDay] = useState(6); // default = today (last index)
  const [loading, setLoading] = useState(true);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedLoaded, setCompletedLoaded] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [otpInputs, setOtpInputs] = useState({});
  const [delivering, setDelivering] = useState({});
  const [person] = useState(() => JSON.parse(localStorage.getItem("delivery_person") || "{}"));
  const navigate = useNavigate();
  const { canInstall, install, nativeInstall, hasNativePrompt, installing, installed: appInstalled, guideOpen, closeGuide } = usePwaInstall();
  usePushNotifications("delivery_person", person.id, localStorage.getItem("delivery_token"));

  useEffect(() => { loadCore(); }, []);

  // Lazy-load completed orders only when that tab is first opened
  useEffect(() => {
    if (tab === "completed" && !completedLoaded) {
      setCompletedLoading(true);
      getCompletedDeliveries()
        .then((r) => { setCompleted(r.data); setCompletedLoaded(true); })
        .catch(() => {})
        .finally(() => setCompletedLoading(false));
    }
  }, [tab, completedLoaded]);

  const loadCore = () => {
    setLoading(true);
    Promise.all([
      getDeliveryOrders().then((r) => setOrders(r.data)).catch(() => {}),
      getDeliveryStats().then((r) => setStats(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
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
      loadCore();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Scan failed");
    }
  };

  const handleDeliver = async (orderId) => {
    const otp = (otpInputs[orderId] || "").trim();
    if (!otp || otp.length !== 4) { toast.error("Enter the 4-digit OTP from the customer"); return; }
    setDelivering((p) => ({ ...p, [orderId]: true }));
    try {
      await markDelivered(orderId, otp);
      toast.success("Order delivered successfully!");
      setCompletedLoaded(false); // force reload on next visit to completed tab
      loadCore();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setDelivering((p) => ({ ...p, [orderId]: false }));
    }
  };

  const readyCount  = orders.filter((o) => o.status === "ready_for_delivery").length;
  const pickedCount = orders.filter((o) => o.status === "picked_up").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: "linear-gradient(135deg, #0f2460 0%, #1a4080 100%)", color: "#fff", paddingBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem 0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem" }}>
              {person.name?.[0]?.toUpperCase() || "D"}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem" }}>{person.name || "Delivery"}</p>
              <p style={{ margin: 0, fontSize: "0.68rem", opacity: 0.6 }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {canInstall && (
              <button onClick={install} title="Install Delivery App" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "0.38rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 700 }}>
                <span style={{ fontSize: "0.95rem" }}>🚚</span> Install App
              </button>
            )}
            <button onClick={logout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", borderRadius: 8, padding: "0.38rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600 }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        {/* Active tab quick pills */}
        {tab === "active" && orders.length > 0 && (
          <div style={{ display: "flex", gap: "0.6rem", padding: "0.5rem 1.25rem 0" }}>
            {readyCount > 0 && (
              <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "0.4rem 0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Package size={13} style={{ opacity: 0.7 }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{readyCount} awaiting pickup</span>
              </div>
            )}
            {pickedCount > 0 && (
              <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "0.4rem 0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Truck size={13} style={{ opacity: 0.7 }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{pickedCount} out for delivery</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: "1.1rem 1.1rem 6rem", width: "100%", boxSizing: "border-box" }}>

        {/* ════ DASHBOARD TAB ════ */}
        {tab === "dashboard" && (
          <div>
            {/* Day filters */}
            {stats?.daily && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "0.85rem 1rem", marginBottom: "1.1rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <p style={{ margin: "0 0 0.55rem", fontSize: "0.68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Filter by Day — Last 7 Days
                </p>
                <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.1rem" }}>
                  {stats.daily.map((d, i) => {
                    const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const dayLabel = DAY_SHORT[new Date(d.date).getDay()];
                    const isToday = i === stats.daily.length - 1;
                    const isActive = selectedDay === i;
                    return (
                      <button key={i} onClick={() => setSelectedDay(i)} style={{
                        flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
                        gap: "0.1rem", padding: "0.5rem 0.75rem", borderRadius: 10, border: "none",
                        cursor: "pointer", transition: "all 0.18s",
                        background: isActive ? "#1a4080" : "#F1F5F9",
                        color: isActive ? "#fff" : "#475569",
                        boxShadow: isActive ? "0 2px 8px rgba(26,64,128,0.25)" : "none",
                      }}>
                        <span style={{ fontSize: "1rem", fontWeight: 900 }}>{d.count}</span>
                        <span style={{ fontSize: "0.6rem", fontWeight: isToday ? 800 : 500, whiteSpace: "nowrap" }}>
                          {isToday ? "Today" : dayLabel}
                        </span>
                        {isToday && !isActive && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#1a4080", marginTop: 1 }} />}
                      </button>
                    );
                  })}
                </div>
                {/* Selected day detail */}
                {stats.daily[selectedDay] && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.65rem", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CheckCircle size={14} color="#16a34a" />
                      <span style={{ fontSize: "0.82rem", color: "#334155" }}>
                        <strong style={{ color: "#16a34a" }}>{stats.daily[selectedDay].count} {stats.daily[selectedDay].count === 1 ? "delivery" : "deliveries"}</strong>
                        {" · "}
                        {new Date(stats.daily[selectedDay].date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a4080" }}>
                      ₹{fmt(stats.daily[selectedDay].earned ?? 0)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Stat grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <StatCard icon={<CheckCircle size={18} color="#16a34a" />} label="Today" value={stats?.today ?? "—"} accent="#16a34a" />
              <StatCard icon={<TrendingUp size={18} color="#7c3aed" />} label="This Week" value={stats?.this_week ?? "—"} accent="#7c3aed" />
              <StatCard icon={<Star size={18} color="#d97706" />} label="Total Delivered" value={stats?.total_delivered ?? "—"} sub="All time" accent="#d97706" />
              <StatCard icon={<Package size={18} color="#1a4080" />} label="You Earned" value={stats ? `₹${fmt(stats.total_earned ?? 0)}` : "—"} sub="All time" accent="#1a4080" />
            </div>

            {/* Active summary */}
            {orders.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "1rem 1.1rem", marginBottom: "1.25rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.8rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Now</p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {readyCount > 0 && (
                    <button onClick={() => switchTab("active")} style={{ flex: 1, background: "#FFFBEB", border: "1.5px solid #FCD34D", borderRadius: 10, padding: "0.75rem", textAlign: "center", cursor: "pointer" }}>
                      <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#92400E" }}>{readyCount}</p>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.68rem", fontWeight: 700, color: "#B45309" }}>Awaiting Pickup</p>
                    </button>
                  )}
                  {pickedCount > 0 && (
                    <button onClick={() => switchTab("active")} style={{ flex: 1, background: "#EDE9FE", border: "1.5px solid #C4B5FD", borderRadius: 10, padding: "0.75rem", textAlign: "center", cursor: "pointer" }}>
                      <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#5B21B6" }}>{pickedCount}</p>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.68rem", fontWeight: 700, color: "#6D28D9" }}>Out for Delivery</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* All-clear empty */}
            {orders.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 1rem 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <CheckCircle size={28} color="#16a34a" />
                </div>
                <p style={{ fontWeight: 700, color: "#0F172A", fontSize: "1rem", margin: "0 0 0.25rem" }}>All clear!</p>
                <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>No active orders right now.</p>
                {stats?.total_delivered > 0 && (
                  <p style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#16a34a", fontWeight: 700 }}>
                    🎉 {stats.total_delivered} total deliveries completed
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════ ACTIVE ORDERS TAB ════ */}
        {tab === "active" && (
          <div>
            <button onClick={() => setShowScanner(true)} style={{
              width: "100%", padding: "0.85rem", background: "linear-gradient(135deg, #0f2460, #1a4080)", color: "#fff",
              border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
              marginBottom: "1.1rem", boxShadow: "0 4px 14px rgba(26,64,128,0.3)",
            }}>
              <ScanLine size={18} /> Scan QR to Pick Up Order
            </button>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, height: 140, animation: "pulse 1.5s ease-in-out infinite" }} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <Truck size={44} style={{ color: "#CBD5E1", marginBottom: "1rem" }} />
                <p style={{ fontWeight: 700, color: "#334155", margin: "0 0 0.35rem" }}>No active orders</p>
                <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>New assignments will appear here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {orders.map((o) => (
                  <ActiveOrderCard
                    key={o.id} o={o}
                    otpInputs={otpInputs} setOtpInputs={setOtpInputs}
                    delivering={delivering} onDeliver={handleDeliver}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ COMPLETED ORDERS TAB ════ */}
        {tab === "completed" && (
          <div>
            {/* Summary strip */}
            {stats && (
              <div style={{ background: "linear-gradient(135deg, #064e3b, #16a34a)", borderRadius: 14, padding: "1.1rem 1.25rem", marginBottom: "1.1rem", display: "flex", gap: "1.5rem", color: "#fff" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900 }}>{stats.total_delivered}</p>
                  <p style={{ margin: 0, fontSize: "0.68rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Delivered</p>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900 }}>₹{fmt(stats.total_earned ?? 0)}</p>
                  <p style={{ margin: 0, fontSize: "0.68rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em" }}>You Earned</p>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900 }}>₹{fmt(stats.week_earned ?? 0)}</p>
                  <p style={{ margin: 0, fontSize: "0.68rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em" }}>This Week</p>
                </div>
              </div>
            )}

            {completedLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, height: 100, animation: "pulse 1.5s ease-in-out infinite" }} />
                ))}
              </div>
            ) : completed.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <History size={44} style={{ color: "#CBD5E1", marginBottom: "1rem" }} />
                <p style={{ fontWeight: 700, color: "#334155", margin: "0 0 0.35rem" }}>No deliveries yet</p>
                <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Completed orders will appear here.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Showing last {completed.length} deliveries
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {completed.map((o) => <CompletedOrderCard key={o.id} o={o} earningPerDelivery={stats?.earning_per_delivery} />)}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <TabBar
        active={tab}
        onChange={switchTab}
        counts={{ active: orders.length, completed: completed.length }}
      />

      {showScanner && <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* PWA Install Guide */}
      <InstallGuideSheet
        open={guideOpen}
        onClose={closeGuide}
        appName="Delivery Portal"
        iconEmoji="🚚"
        iconSrc="/icon-delivery.png"
        themeColor="#1a4080"
        tagline="LV Studio — Delivery Partner App"
        features={[
          { icon: "📦", text: "View and pick up assigned orders" },
          { icon: "📍", text: "Navigate deliveries with ease" },
          { icon: "💰", text: "Track your daily earnings" },
          { icon: "⚡", text: "Works offline, opens like a native app" },
        ]}
        hasNativePrompt={hasNativePrompt}
        onNativeInstall={nativeInstall}
        installing={installing}
        installed={appInstalled}
      />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}
