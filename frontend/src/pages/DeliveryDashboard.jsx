import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getDeliveryOrders, getDeliveryStats, getCompletedDeliveries,
  deliveryScanQr, markDelivered, deliveryMarkPickedUp, updateDeliveryProfile, changeDeliveryPassword,
  getAvailableDeliveryOrders, acceptDeliveryOrder,
  getAvailableReturnOrders, acceptReturnOrder, getMyReturnOrders, markReturnPickedUp, markReturnedToShop,
} from "../api";
import {
  LogOut, Truck, ScanLine, CheckCircle, MapPin, Package,
  TrendingUp, Star, LayoutDashboard, ListChecks, History, UserCircle,
  Upload, AlertTriangle, Menu, X, Camera, HelpCircle, Bell, RotateCcw,
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

/* ── Vehicle number formatter: AP 39 KB 8104 ─────────────── */
function formatVehicleNumber(raw) {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 10);
  const parts = [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6), clean.slice(6, 10)];
  return parts.filter(Boolean).join(" ");
}

const INDIAN_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "Indian Bank", "Bank of India", "IDBI Bank", "Kotak Mahindra Bank",
  "Yes Bank", "IndusInd Bank", "Federal Bank", "South Indian Bank",
  "RBL Bank", "Bandhan Bank", "UCO Bank", "Central Bank of India",
  "Indian Overseas Bank", "Punjab & Sind Bank", "Karnataka Bank",
  "Karur Vysya Bank", "City Union Bank", "Tamilnad Mercantile Bank",
  "Dhanlaxmi Bank", "Nainital Bank", "Saraswat Bank", "Other",
];

/* ── Profile helpers ─────────────────────────────────────── */
const profileLabelStyle = {
  display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569",
  marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em",
};
const profileInputStyle = {
  width: "100%", padding: "0.65rem 0.85rem", border: "1.5px solid #E2E8F0",
  borderRadius: 9, fontSize: "0.88rem", color: "#0F172A", outline: "none",
  background: "#F8FAFC", marginBottom: "1rem", boxSizing: "border-box",
};

function DocUploadBox({ label, file, existingUrl, onChange }) {
  const preview = file ? URL.createObjectURL(file) : existingUrl;
  return (
    <label style={{ display: "block", cursor: "pointer" }}>
      <input type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) onChange(e.target.files[0]); }} />
      {preview ? (
        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `2px solid ${file ? "#3B82F6" : "#6EE7B7"}` }}>
          <img src={preview} alt={label} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0.4rem 0.6rem", background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#fff" }}>
              {file ? "✓ New photo" : "✓ Uploaded"}
            </span>
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.35)", padding: "0.15rem 0.4rem", borderRadius: 4 }}>
              Tap to change
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          border: "2px dashed #CBD5E1", borderRadius: 8, padding: "1.25rem 1rem",
          textAlign: "center", background: "#fff",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Upload size={18} color="#94A3B8" />
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Upload {label} Photo</p>
          <p style={{ margin: 0, fontSize: "0.63rem", color: "#94A3B8" }}>JPG or PNG</p>
        </div>
      )}
    </label>
  );
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
    { key: "account",   label: "Account",   icon: UserCircle,  badge: counts.profileWarning ? "!" : 0 },
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
              {(t.badge > 0 || t.badge === "!") && (
                <span style={{
                  position: "absolute", top: -5, right: -8,
                  background: t.badge === "!" ? "#D97706" : "#1a4080",
                  color: "#fff", borderRadius: 20,
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
function ActiveOrderCard({ o, otpInputs, setOtpInputs, delivering, onDeliver, pickingUp, onPickup }) {
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
        {/* Address with Maps link — show SHOP address before pickup, CUSTOMER address after */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.6rem" }}>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(o.status === "ready_for_delivery" ? (o.shop_address || o.shop_name || o.delivery_address) : o.delivery_address)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", textDecoration: "none", flex: 1 }}
          >
            <div style={{ background: o.status === "ready_for_delivery" ? "#FEF3C7" : "#DBEAFE", borderRadius: 6, padding: "0.2rem 0.35rem", display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, marginTop: 1 }}>
              <MapPin size={12} style={{ color: o.status === "ready_for_delivery" ? "#D97706" : "#1D4ED8" }} />
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: o.status === "ready_for_delivery" ? "#D97706" : "#1D4ED8", whiteSpace: "nowrap" }}>
                {o.status === "ready_for_delivery" ? "Shop Address" : "Customer Address"}
              </span>
            </div>
            <div>
              {o.status === "ready_for_delivery" && o.shop_name && (
                <p style={{ margin: "0 0 0.1rem", fontSize: "0.75rem", fontWeight: 700, color: "#92400E" }}>{o.shop_name}</p>
              )}
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.5 }}>
                {o.status === "ready_for_delivery" ? (o.shop_address || "Shop address not set — contact shop") : o.delivery_address}
              </p>
            </div>
          </a>
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
          <div style={{ background: "#FFFBEB", border: "1.5px solid #FCD34D", borderRadius: 10, padding: "0.75rem 0.9rem" }}>
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", color: "#92400E", fontWeight: 700 }}>
              📦 Order is packed and ready at the shop
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => onPickup(o.id)}
                disabled={pickingUp?.[o.id]}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: pickingUp?.[o.id] ? "#FCD34D" : "#D97706", color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 0.75rem", cursor: pickingUp?.[o.id] ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.82rem" }}
              >
                <Truck size={14} /> {pickingUp?.[o.id] ? "Updating…" : "Confirm Pickup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Completed order card ────────────────────────────────── */
function CompletedOrderCard({ o, earningPerDelivery }) {
  const isReturn = o.return_delivery_status === "returned_to_shop";
  const completedEntry = o.status_history?.find((h) => h.status === (isReturn ? "return_completed" : "delivered"));
  const earned = earningPerDelivery || 50;
  return (
    <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${isReturn ? "#7C3AED" : "#16a34a"}` }}>
      <div style={{ padding: "0.9rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <CheckCircle size={14} color={isReturn ? "#7C3AED" : "#16a34a"} />
            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.92rem", color: "#0F172A" }}>Order #{o.id}</p>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>{o.customer?.name}</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "#94A3B8" }}>
            {completedEntry ? fmtDate(completedEntry.created_at) : fmtDate(o.created_at)}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: 900, color: "#1a4080", fontSize: "1rem" }}>₹{fmt(earned)}</p>
          <p style={{ margin: "0.1rem 0 0", fontSize: "0.65rem", color: "#94A3B8" }}>Order ₹{fmt(o.total)}</p>
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: isReturn ? "#7C3AED" : "#16a34a", background: isReturn ? "#EDE9FE" : "#D1FAE5", padding: "0.15rem 0.55rem", borderRadius: 20, display: "inline-block", marginTop: "0.25rem" }}>
            {isReturn ? "↩ Return Done" : "Delivered"}
          </span>
        </div>
      </div>
      <div style={{ padding: "0 1.1rem 0.75rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <Package size={11} style={{ color: "#94A3B8", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "0.73rem", color: "#94A3B8" }}>
            {isReturn ? `Item returned to ${o.shop_name || "shop"}` : `${o.items?.length || 1} item${(o.items?.length || 1) !== 1 ? "s" : ""} delivered`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export default function DeliveryDashboard() {
  const [tab, setTab] = useState("dashboard");
  const mainRef = useRef(null);
  const switchTab = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: "instant" }); };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("delivery_sidebar_collapsed") === "true");
  const toggleCollapse = () => setSidebarCollapsed((v) => { localStorage.setItem("delivery_sidebar_collapsed", !v); return !v; });
  const [orders, setOrders] = useState([]);
  const [available, setAvailable] = useState([]);
  const [availableReturns, setAvailableReturns] = useState([]);
  const [myReturns, setMyReturns] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedDay, setSelectedDay] = useState(6); // default = today (last index)
  const [loading, setLoading] = useState(true);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedLoaded, setCompletedLoaded] = useState(false);
  const [completedTypeFilter, setCompletedTypeFilter] = useState("all");
  const [showScanner, setShowScanner] = useState(false);
  const [otpInputs, setOtpInputs] = useState({});
  const [delivering, setDelivering] = useState({});
  const [person, setPerson] = useState(() => JSON.parse(localStorage.getItem("delivery_person") || "{}"));
  const navigate = useNavigate();
  const { canInstall, install, nativeInstall, hasNativePrompt, installing, installed: appInstalled, guideOpen, closeGuide } = usePwaInstall();
  usePushNotifications("delivery_person", person.id, localStorage.getItem("delivery_token"));
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => { loadCore(); }, []);

  // Auto-refresh active orders every 15s
  useEffect(() => {
    const prev = { count: 0 };
    const iv = setInterval(async () => {
      try {
        const { data } = await getDeliveryOrders();
        if (data.length > prev.count) {
          toast.success("New order assigned to you!");
        }
        prev.count = data.length;
        setOrders(data);
      } catch {}
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  // Poll available (unassigned) orders every 10s so accepted orders vanish from all apps
  useEffect(() => {
    const loadAvailable = async () => {
      try {
        const { data } = await getAvailableDeliveryOrders();
        setAvailable(data);
      } catch {}
    };
    loadAvailable();
    const iv = setInterval(loadAvailable, 10000);
    return () => clearInterval(iv);
  }, []);

  // Poll available return pickups every 10s
  useEffect(() => {
    const loadReturns = async () => {
      try {
        const [ar, mr] = await Promise.all([getAvailableReturnOrders(), getMyReturnOrders()]);
        setAvailableReturns(ar.data);
        setMyReturns(mr.data);
      } catch {}
    };
    loadReturns();
    const iv = setInterval(loadReturns, 10000);
    return () => clearInterval(iv);
  }, []);

  // Load completed orders when tab is opened; poll every 60s while active
  useEffect(() => {
    if (tab !== "completed") return;
    const fetchCompleted = () => {
      if (!completedLoaded) setCompletedLoading(true);
      getCompletedDeliveries()
        .then((r) => { setCompleted(r.data); setCompletedLoaded(true); })
        .catch(() => {})
        .finally(() => setCompletedLoading(false));
    };
    fetchCompleted();
    const iv = setInterval(fetchCompleted, 60000);
    return () => clearInterval(iv);
  }, [tab]);

  const loadCore = () => {
    setLoading(true);
    Promise.all([
      getDeliveryOrders().then((r) => setOrders(r.data)).catch(() => {}),
      getDeliveryStats().then((r) => setStats(r.data)).catch(() => {}),
      getAvailableDeliveryOrders().then((r) => setAvailable(r.data)).catch(() => {}),
      getAvailableReturnOrders().then((r) => setAvailableReturns(r.data)).catch(() => {}),
      getMyReturnOrders().then((r) => setMyReturns(r.data)).catch(() => {}),
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

  const [pickingUp, setPickingUp] = useState({});
  const handlePickup = async (orderId) => {
    setPickingUp((p) => ({ ...p, [orderId]: true }));
    try {
      await deliveryMarkPickedUp(orderId);
      toast.success("Order marked as Picked Up!");
      loadCore();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setPickingUp((p) => ({ ...p, [orderId]: false }));
    }
  };

  const [accepting, setAccepting] = useState({});
  const handleAccept = async (orderId) => {
    setAccepting((p) => ({ ...p, [orderId]: true }));
    try {
      await acceptDeliveryOrder(orderId);
      toast.success("Order accepted! Check your Active orders.");
      loadCore();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to accept order";
      toast.error(msg);
      // Refresh available list so the taken order disappears
      getAvailableDeliveryOrders().then((r) => setAvailable(r.data)).catch(() => {});
    } finally {
      setAccepting((p) => ({ ...p, [orderId]: false }));
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

  // ── Account / Profile ──────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    vehicle_type: person.vehicle_type || "",
    vehicle_number: person.vehicle_number || "",
    licence_number: person.licence_number || "",
    pan_card: person.pan_card || "",
    bank_account_holder: person.bank_account_holder || "",
    bank_name: person.bank_name || "",
    bank_account_number: person.bank_account_number || "",
    bank_ifsc: person.bank_ifsc || "",
    bank_account_type: person.bank_account_type || "",
  });
  const [licenceFile, setLicenceFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const handlePasswordChange = async () => {
    if (!pwForm.old_password || !pwForm.new_password) return toast.error("All password fields are required");
    if (pwForm.new_password.length < 6) return toast.error("New password must be at least 6 characters");
    if (pwForm.new_password !== pwForm.confirm) return toast.error("Passwords do not match");
    setPwSaving(true);
    try {
      await changeDeliveryPassword({ old_password: pwForm.old_password, new_password: pwForm.new_password });
      toast.success("Password changed successfully!");
      setPwForm({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };
  const avatarInputRef = useRef();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("profile_image", file);
      const { data } = await updateDeliveryProfile(fd);
      setPerson(data);
      localStorage.setItem("delivery_person", JSON.stringify(data));
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const fd = new FormData();
      Object.entries(profileForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (licenceFile) fd.append("licence_image", licenceFile);
      if (panFile) fd.append("pan_image", panFile);
      const { data } = await updateDeliveryProfile(fd);
      setPerson(data);
      localStorage.setItem("delivery_person", JSON.stringify(data));
      toast.success("Profile updated!");
      setLicenceFile(null);
      setPanFile(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const [acceptingReturn, setAcceptingReturn] = useState({});
  const handleAcceptReturn = async (orderId) => {
    setAcceptingReturn((p) => ({ ...p, [orderId]: true }));
    try {
      await acceptReturnOrder(orderId);
      toast.success("Return pickup accepted!");
      loadCore();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Already claimed by another delivery person");
      getAvailableReturnOrders().then((r) => setAvailableReturns(r.data)).catch(() => {});
    } finally {
      setAcceptingReturn((p) => ({ ...p, [orderId]: false }));
    }
  };

  const [returningPickup, setReturningPickup] = useState({});
  const handleReturnPickedUp = async (orderId) => {
    setReturningPickup((p) => ({ ...p, [orderId]: "picking" }));
    try {
      await markReturnPickedUp(orderId);
      toast.success("Marked: item collected from customer");
      loadCore();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setReturningPickup((p) => ({ ...p, [orderId]: false }));
    }
  };

  const handleReturnedToShop = async (orderId) => {
    setReturningPickup((p) => ({ ...p, [orderId]: "returning" }));
    try {
      await markReturnedToShop(orderId);
      toast.success("Return completed — item back at shop!");
      setCompletedLoaded(false); // force reload so it appears in Completed tab
      loadCore();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setReturningPickup((p) => ({ ...p, [orderId]: false }));
    }
  };

  const readyCount  = orders.filter((o) => o.status === "ready_for_delivery").length;
  const pickedCount = orders.filter((o) => o.status === "picked_up").length;

  const DEL_NAV = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { key: "active",    label: "Active",    icon: <ListChecks size={17} />,  badge: (orders.length + available.length + availableReturns.length + myReturns.length) || null },
    { key: "completed", label: "Completed", icon: <History size={17} />,     badge: completed.length || null },
    { key: "account",   label: "Account",   icon: <UserCircle size={17} />,  warn: !person.profile_complete },
  ];

  return (
    <div className="portal-page" style={{ fontFamily: "system-ui, sans-serif", background: "#F1F5F9" }}>

      {/* Sidebar overlay (mobile) */}
      <div className={`portal-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="portal-mobile-header" style={{ background: "#0f2460" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
            {person.profile_image_url ? (
              <img src={person.profile_image_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              person.name?.[0]?.toUpperCase() || "D"
            )}
          </div>
          <span className="portal-mobile-title">{person.name || "Delivery"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setNotifOpen(v => !v)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
            <Bell size={18} color="#fff" />
            {(orders.length > 0 || available.length > 0) && <span style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, background: "#fbbf24", borderRadius: "50%", border: "1.5px solid #0f2460" }} />}
          </button>
          <button className="portal-mobile-menu-btn" onClick={() => setSidebarOpen((v) => !v)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Delivery notification panel */}
      {notifOpen && (
        <div style={{ position: "fixed", top: 52, right: 8, zIndex: 2500, background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", width: 300, maxHeight: 380, overflow: "auto", border: "1px solid #E2E8F0" }}>
          <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>Notifications</span>
            <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={16} /></button>
          </div>
          {(orders.length > 0 || available.length > 0) ? (
            <div style={{ padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {available.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.65rem 0.85rem", borderRadius: 10, background: "#F0FDF4", border: "1px solid #86EFAC" }}>
                  <span style={{ fontSize: "1.2rem" }}>🟢</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#15803D" }}>{available.length} Order{available.length > 1 ? "s" : ""} Ready to Accept</p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#166534" }}>Go to Active tab to claim</p>
                  </div>
                </div>
              )}
              {orders.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.65rem 0.85rem", borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <span style={{ fontSize: "1.2rem" }}>📦</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#1E40AF" }}>{orders.length} Active Order{orders.length > 1 ? "s" : ""}</p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#1E3A8A" }}>Deliveries assigned to you</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#94A3B8" }}>
              <Bell size={28} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontSize: "0.82rem" }}>No active assignments</p>
            </div>
          )}
          <div style={{ padding: "0.6rem 1rem", borderTop: "1px solid #F1F5F9" }}>
            <button
              onClick={async () => {
                try {
                  const reg = await navigator.serviceWorker?.ready;
                  if (reg) {
                    const perm = await Notification.requestPermission();
                    if (perm === "granted") toast.success("Push notifications enabled!");
                    else toast.error("Notification permission denied");
                  }
                } catch { toast.error("Could not enable notifications"); }
                setNotifOpen(false);
              }}
              style={{ width: "100%", padding: "0.55rem", border: "1px solid #E2E8F0", borderRadius: 8, background: "#F8FAFC", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}
            >
              🔔 Enable Push Notifications
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar-wrap">
      <aside className={`portal-sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`} style={{ background: "#0A1628" }}>
        <div className="portal-sidebar-logo">
          <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem", background: "rgba(255,255,255,0.1)" }}>
            {person.profile_image_url ? (
              <img src={person.profile_image_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "rgba(255,255,255,0.7)" }}>{person.name?.[0]?.toUpperCase() || "D"}</span>
            )}
          </div>
          <p className="portal-sidebar-title">{person.name || "Delivery Partner"}</p>
          <p className="portal-sidebar-sub">Delivery Portal · Lakshmi Vastra Studio</p>
        </div>
        <nav className="portal-nav">
          {DEL_NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => { switchTab(item.key); setSidebarOpen(false); }}
              className={`portal-nav-btn ${tab === item.key ? "active" : ""}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              <span className="pnb-label" style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? <span className="portal-nav-badge">{item.badge}</span> : null}
              {item.warn ? <span className="portal-nav-badge warn">!</span> : null}
            </button>
          ))}
        </nav>
        {canInstall && (
          <button onClick={install} className="portal-install-btn">
            <span style={{ fontSize: "1rem" }}>🚚</span> Install App
          </button>
        )}
        <button
          onClick={() => setNotifOpen(v => !v)}
          className="portal-nav-btn"
          title={sidebarCollapsed ? "Notifications" : undefined}
          style={{ position: "relative" }}
        >
          <Bell size={17} />
          {(orders.length > 0 || available.length > 0) && <span style={{ position: "absolute", top: 6, left: 22, width: 8, height: 8, background: "#fbbf24", borderRadius: "50%", border: "1.5px solid #0A1628" }} />}
          <span className="pnb-label"> Notifications{(orders.length + available.length) > 0 ? ` (${orders.length + available.length})` : ""}</span>
        </button>
        <a href="/help?app=delivery" className="portal-nav-btn" title={sidebarCollapsed ? "Help Center" : undefined} style={{ textDecoration: "none" }}>
          <HelpCircle size={17} /><span className="pnb-label"> Help Center</span>
        </a>
        <button onClick={logout} className="portal-logout-btn" title={sidebarCollapsed ? "Logout" : undefined}>
          <LogOut size={14} /><span className="pnb-label"> Logout</span>
        </button>
        {/* Sidebar footer branding */}
        <div className="sidebar-footer">
          <p className="sidebar-footer-product">Lakshmi Vastra Studio</p>
          <p className="sidebar-footer-cloud">Delivery Portal</p>
          <p className="sidebar-footer-copy">© Copyright 2026 Lakshmi Vastra Studio</p>
        </div>
      </aside>
      {/* External collapse tab */}
      <button onClick={toggleCollapse} className="sidebar-toggle-tab" style={{ background: "#0A1628" }} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <span className={`sidebar-tri ${sidebarCollapsed ? "right" : "left"}`} />
      </button>
      </div>

      {/* Main content */}
      <main className="portal-main" ref={mainRef} style={{ background: "#F1F5F9" }}>

        {/* Active tab quick pills — now inside main */}
        {tab === "active" && person.profile_complete && orders.length > 0 && (
          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {readyCount > 0 && (
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "0.4rem 0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Package size={13} style={{ color: "#d97706" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A" }}>{readyCount} awaiting pickup</span>
              </div>
            )}
            {pickedCount > 0 && (
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "0.4rem 0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Truck size={13} style={{ color: "#7c3aed" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A" }}>{pickedCount} out for delivery</span>
              </div>
            )}
          </div>
        )}

        {/* ════ PROFILE INCOMPLETE GATE ════ */}
        {!person.profile_complete && tab !== "account" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "2rem 1rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF3C7", border: "2px solid #FCD34D", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", fontSize: "1.75rem" }}>
              🔒
            </div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", fontWeight: 800, color: "#1E293B" }}>Complete Your Profile First</h2>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: "#64748B", maxWidth: 320, lineHeight: 1.6 }}>
              You need to complete your profile — including uploading your licence and PAN card — before you can view orders or delivery data.
            </p>
            <button
              onClick={() => switchTab("account")}
              style={{ padding: "0.75rem 2rem", background: "linear-gradient(135deg, #0f2460, #1a4080)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <UserCircle size={16} /> Go to Profile
            </button>
          </div>
        )}

        {/* ════ DASHBOARD TAB ════ */}
        {tab === "dashboard" && person.profile_complete && (
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
            {(orders.length > 0 || available.length > 0) && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "1rem 1.1rem", marginBottom: "1.25rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.8rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Now</p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {available.length > 0 && (
                    <button onClick={() => switchTab("active")} style={{ flex: 1, background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: "0.75rem", textAlign: "center", cursor: "pointer" }}>
                      <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#15803D" }}>{available.length}</p>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.68rem", fontWeight: 700, color: "#166534" }}>Ready to Accept</p>
                    </button>
                  )}
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
            {orders.length === 0 && available.length === 0 && (
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
        {tab === "active" && person.profile_complete && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1a4080", fontSize: "1.2rem" }}>Active Orders</h2>
              <button onClick={() => setShowScanner(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#1a4080", color: "#fff", border: "none", borderRadius: 6, padding: "0.5rem 1rem", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                <ScanLine size={15} /> Scan QR
              </button>
            </div>

            {/* ── Available Orders (unassigned, broadcast to all delivery persons) ── */}
            {available.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.78rem", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Available — {available.length} Order{available.length > 1 ? "s" : ""} Ready for Pickup
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {available.map((o) => (
                    <div key={o.id} style={{
                      background: "#fff", borderRadius: 14, overflow: "hidden",
                      boxShadow: "0 2px 16px rgba(22,163,74,0.12)",
                      border: "1.5px solid #86EFAC",
                    }}>
                      <div style={{ padding: "0.9rem 1.1rem 0.6rem", borderBottom: "1px solid #F0FDF4" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.97rem", color: "#0F172A" }}>Order #{o.id}</p>
                            <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>
                              {o.customer?.name} · {o.payment_method === "cod" ? "💵 COD" : "✅ Paid Online"}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ display: "inline-block", padding: "0.22rem 0.7rem", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700, background: "#DCFCE7", color: "#15803D" }}>
                              Ready for Pickup
                            </span>
                            <p style={{ margin: "0.3rem 0 0", fontWeight: 800, color: "#0F172A", fontSize: "1rem" }}>₹{Number(o.total || 0).toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: "0.65rem 1.1rem 0.9rem" }}>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(o.shop_address || o.shop_name || o.delivery_address)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", textDecoration: "none", marginBottom: "0.55rem" }}
                        >
                          <div style={{ background: "#FEF3C7", borderRadius: 6, padding: "0.2rem 0.35rem", display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, marginTop: 2 }}>
                            <MapPin size={12} style={{ color: "#D97706" }} />
                            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#D97706", whiteSpace: "nowrap" }}>Shop Address</span>
                          </div>
                          <div>
                            {o.shop_name && <p style={{ margin: "0 0 0.1rem", fontSize: "0.75rem", fontWeight: 700, color: "#92400E" }}>{o.shop_name}</p>}
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.5 }}>
                              {o.shop_address || "Shop address not set — contact shop"}
                            </p>
                          </div>
                        </a>
                        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "0.4rem 0.7rem", marginBottom: "0.75rem" }}>
                          {o.items?.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "#64748B", padding: "0.1rem 0" }}>
                              <span>{item.name} ×{item.quantity}</span>
                              <span style={{ fontWeight: 600 }}>₹{Number(item.price * item.quantity).toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleAccept(o.id)}
                          disabled={accepting[o.id]}
                          style={{
                            width: "100%", padding: "0.7rem", border: "none", borderRadius: 10, cursor: accepting[o.id] ? "not-allowed" : "pointer",
                            background: accepting[o.id] ? "#86EFAC" : "linear-gradient(135deg, #16a34a, #15803d)",
                            color: "#fff", fontWeight: 800, fontSize: "0.9rem",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                            boxShadow: accepting[o.id] ? "none" : "0 4px 14px rgba(22,163,74,0.3)",
                          }}
                        >
                          <Truck size={16} />
                          {accepting[o.id] ? "Accepting…" : "Accept & Deliver"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Available Return Pickups ── */}
            {availableReturns.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.78rem", color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Return Pickups — {availableReturns.length} Available
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {availableReturns.map((o) => (
                    <div key={o.id} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 16px rgba(124,58,237,0.12)", border: "1.5px solid #C4B5FD" }}>
                      <div style={{ background: "#FAF5FF", padding: "0.6rem 1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #EDE9FE" }}>
                        <RotateCcw size={13} color="#7C3AED" />
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.06em" }}>Return Pickup</span>
                      </div>
                      <div style={{ padding: "0.9rem 1.1rem 0.6rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.97rem", color: "#0F172A" }}>Order #{o.id}</p>
                            <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>{o.customer?.name}</p>
                          </div>
                          <p style={{ margin: 0, fontWeight: 800, color: "#0F172A", fontSize: "1rem" }}>₹{Number(o.total || 0).toLocaleString("en-IN")}</p>
                        </div>
                        {o.return_reason && (
                          <p style={{ margin: "0 0 0.5rem", fontSize: "0.76rem", color: "#7C3AED", background: "#EDE9FE", borderRadius: 6, padding: "0.3rem 0.6rem" }}>
                            Return reason: {o.return_reason}
                          </p>
                        )}
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(o.delivery_address)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", textDecoration: "none", marginBottom: "0.75rem" }}
                        >
                          <div style={{ background: "#EDE9FE", borderRadius: 6, padding: "0.2rem 0.35rem", display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, marginTop: 2 }}>
                            <MapPin size={12} style={{ color: "#7C3AED" }} />
                            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#7C3AED", whiteSpace: "nowrap" }}>Collect from</span>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.5 }}>{o.delivery_address}</p>
                        </a>
                        <button
                          onClick={() => handleAcceptReturn(o.id)}
                          disabled={acceptingReturn[o.id]}
                          style={{ width: "100%", padding: "0.7rem", border: "none", borderRadius: 10, cursor: acceptingReturn[o.id] ? "not-allowed" : "pointer", background: acceptingReturn[o.id] ? "#C4B5FD" : "linear-gradient(135deg, #7C3AED, #5B21B6)", color: "#fff", fontWeight: 800, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                        >
                          <RotateCcw size={15} />
                          {acceptingReturn[o.id] ? "Accepting…" : "Accept Return Pickup"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── My Active Return Pickups ── */}
            {myReturns.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ margin: "0 0 0.65rem", fontWeight: 800, fontSize: "0.75rem", color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  My Return Pickups
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {myReturns.map((o) => {
                    const isCollected = o.return_delivery_status === "picked_up_from_customer";
                    const busy = returningPickup[o.id];
                    return (
                      <div key={o.id} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(124,58,237,0.1)", border: "1.5px solid #C4B5FD" }}>
                        <div style={{ background: isCollected ? "#EDE9FE" : "#FAF5FF", padding: "0.6rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #EDE9FE" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <RotateCcw size={13} color="#7C3AED" />
                            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {isCollected ? "Heading to Shop" : "Collect from Customer"}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, background: isCollected ? "#7C3AED" : "#EDE9FE", color: isCollected ? "#fff" : "#7C3AED", borderRadius: 20, padding: "0.15rem 0.55rem" }}>
                            {isCollected ? "Collected" : "Pending Pickup"}
                          </span>
                        </div>
                        <div style={{ padding: "0.9rem 1.1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: "0.97rem", color: "#0F172A" }}>Order #{o.id}</p>
                              <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>{o.customer?.name} · {o.customer?.phone}</p>
                            </div>
                            <p style={{ margin: 0, fontWeight: 800, color: "#0F172A" }}>₹{Number(o.total || 0).toLocaleString("en-IN")}</p>
                          </div>
                          {o.return_reason && (
                            <p style={{ margin: "0 0 0.6rem", fontSize: "0.76rem", color: "#7C3AED", background: "#EDE9FE", borderRadius: 6, padding: "0.3rem 0.6rem" }}>
                              Return reason: {o.return_reason}
                            </p>
                          )}
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(isCollected ? (o.shop_address || o.shop_name || "") : o.delivery_address)}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", textDecoration: "none", marginBottom: "0.85rem" }}
                          >
                            <div style={{ background: "#EDE9FE", borderRadius: 6, padding: "0.2rem 0.35rem", display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, marginTop: 2 }}>
                              <MapPin size={12} style={{ color: "#7C3AED" }} />
                              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#7C3AED", whiteSpace: "nowrap" }}>{isCollected ? "Drop at shop" : "Collect from"}</span>
                            </div>
                            <div>
                              {isCollected && o.shop_name && <p style={{ margin: "0 0 0.1rem", fontSize: "0.75rem", fontWeight: 700, color: "#5B21B6" }}>{o.shop_name}</p>}
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.5 }}>
                                {isCollected ? (o.shop_address || "Shop address not set — contact admin") : o.delivery_address}
                              </p>
                            </div>
                          </a>
                          {!isCollected ? (
                            <button
                              onClick={() => handleReturnPickedUp(o.id)}
                              disabled={!!busy}
                              style={{ width: "100%", padding: "0.7rem", border: "none", borderRadius: 10, cursor: busy ? "not-allowed" : "pointer", background: busy ? "#C4B5FD" : "linear-gradient(135deg, #7C3AED, #5B21B6)", color: "#fff", fontWeight: 800, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                            >
                              <Package size={15} />
                              {busy === "picking" ? "Updating…" : "Mark Collected from Customer"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReturnedToShop(o.id)}
                              disabled={!!busy}
                              style={{ width: "100%", padding: "0.7rem", border: "none", borderRadius: 10, cursor: busy ? "not-allowed" : "pointer", background: busy ? "#C4B5FD" : "linear-gradient(135deg, #15803D, #166534)", color: "#fff", fontWeight: 800, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                            >
                              <CheckCircle size={15} />
                              {busy === "returning" ? "Completing…" : "Mark Returned to Shop"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── My Assigned Orders ── */}
            {orders.length > 0 && (
              <>
                <p style={{ margin: "0 0 0.65rem", fontWeight: 800, fontSize: "0.75rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  My Assigned Orders
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "1rem" }}>
                  <div style={{ background: "#FFFBEB", border: "1.5px solid #FCD34D", borderRadius: 12, padding: "0.85rem 1rem", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#92400E" }}>{readyCount}</p>
                    <p style={{ margin: "0.1rem 0 0", fontSize: "0.7rem", fontWeight: 700, color: "#B45309" }}>Awaiting Pickup</p>
                  </div>
                  <div style={{ background: "#EDE9FE", border: "1.5px solid #C4B5FD", borderRadius: 12, padding: "0.85rem 1rem", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#5B21B6" }}>{pickedCount}</p>
                    <p style={{ margin: "0.1rem 0 0", fontSize: "0.7rem", fontWeight: 700, color: "#6D28D9" }}>Out for Delivery</p>
                  </div>
                </div>
              </>
            )}

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, height: 140, animation: "pulse 1.5s ease-in-out infinite" }} />
                ))}
              </div>
            ) : orders.length === 0 && available.length === 0 && availableReturns.length === 0 && myReturns.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <Truck size={44} style={{ color: "#CBD5E1", marginBottom: "1rem" }} />
                <p style={{ fontWeight: 700, color: "#334155", margin: "0 0 0.35rem" }}>No active orders</p>
                <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Ready orders from the shop will appear here.</p>
              </div>
            ) : orders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {orders.map((o) => (
                  <ActiveOrderCard
                    key={o.id} o={o}
                    otpInputs={otpInputs} setOtpInputs={setOtpInputs}
                    delivering={delivering} onDeliver={handleDeliver}
                    pickingUp={pickingUp} onPickup={handlePickup}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* ════ ACCOUNT TAB ════ */}
        {tab === "account" && (() => {
          const SectionLabel = ({ children }) => (
            <p style={{ margin: "1.35rem 0 0.5rem", fontSize: "0.68rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {children}
            </p>
          );
          const InfoRow = ({ label, value, last }) => (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.82rem 1.1rem", borderBottom: last ? "none" : "1px solid #F1F5F9" }}>
              <span style={{ fontSize: "0.82rem", color: "#94A3B8", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: "0.82rem", color: "#0F172A", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value || "—"}</span>
            </div>
          );
          const completionFields = [
            { label: "Name",           value: person.name },
            { label: "Email",          value: person.email },
            { label: "Phone",          value: person.phone },
            { label: "Profile Photo",  value: person.profile_image_url },
            { label: "Vehicle Type",   value: person.vehicle_type },
            { label: "Vehicle Number", value: person.vehicle_number },
            { label: "Licence No.",    value: person.licence_number },
            { label: "PAN Card",       value: person.pan_card },
            { label: "Licence Image",  value: person.licence_image_url },
            { label: "PAN Image",      value: person.pan_image_url },
            { label: "Bank Holder",    value: person.bank_account_holder },
            { label: "Bank Name",      value: person.bank_name },
            { label: "Account No.",    value: person.bank_account_number },
            { label: "IFSC Code",      value: person.bank_ifsc },
            { label: "Account Type",   value: person.bank_account_type },
          ];
          const filledCount = completionFields.filter((f) => !!f.value).length;
          const completionPct = Math.round((filledCount / completionFields.length) * 100);
          const missingFields = completionFields.filter((f) => !f.value).map((f) => f.label);
          const pctColor = completionPct === 100 ? "#4ade80" : completionPct >= 70 ? "#60a5fa" : completionPct >= 40 ? "#fcd34d" : "#f87171";
          const pctBg   = completionPct === 100 ? "rgba(22,163,74,0.2)" : completionPct >= 70 ? "rgba(59,130,246,0.2)" : completionPct >= 40 ? "rgba(217,119,6,0.2)" : "rgba(239,68,68,0.2)";
          const pctBorder = completionPct === 100 ? "rgba(74,222,128,0.4)" : completionPct >= 70 ? "rgba(96,165,250,0.4)" : completionPct >= 40 ? "rgba(252,211,77,0.4)" : "rgba(248,113,113,0.4)";
          const barColor  = completionPct === 100 ? "#16a34a" : completionPct >= 70 ? "#3b82f6" : completionPct >= 40 ? "#f59e0b" : "#ef4444";

          return (
            <div style={{ paddingBottom: "1.5rem" }}>

              {/* ── Profile banner ── */}
              <div style={{
                background: "linear-gradient(145deg, #0A1628 0%, #0f2460 100%)",
                borderRadius: 16, padding: "1.5rem 1.25rem",
                boxShadow: "0 6px 24px rgba(10,22,40,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {/* Clickable avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      style={{ width: 58, height: 58, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", position: "relative" }}
                    >
                      {person.profile_image_url ? (
                        <img src={person.profile_image_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "#fff" }}>{person.name?.[0]?.toUpperCase() || "D"}</span>
                      )}
                      {avatarUploading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /></div>}
                    </div>
                    <div onClick={() => avatarInputRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid rgba(15,36,96,0.3)" }}>
                      <Camera size={10} color="#0f2460" />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {person.name}
                    </p>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Delivery Partner</p>
                  </div>
                  {/* Completion % badge */}
                  <div style={{ flexShrink: 0, padding: "0.3rem 0.65rem", borderRadius: 20, background: pctBg, border: `1px solid ${pctBorder}`, display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.67rem", fontWeight: 800, color: pctColor }}>
                    {completionPct === 100 ? <><CheckCircle size={10} /> Verified</> : <>{completionPct}% Done</>}
                  </div>
                </div>

                {/* ── Progress bar ── */}
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Profile Completion</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 900, color: pctColor }}>{completionPct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${completionPct}%`, borderRadius: 999, background: barColor, transition: "width 0.4s ease" }} />
                  </div>
                  {missingFields.length > 0 && (
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                      Missing: {missingFields.join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Stats strip (only when verified) ── */}
              {person.profile_complete && stats && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginTop: "1rem" }}>
                  {[
                    { label: "Today", value: stats.today ?? 0, color: "#16a34a" },
                    { label: "This Week", value: stats.this_week ?? 0, color: "#7c3aed" },
                    { label: "Total", value: stats.total_delivered ?? 0, color: "#1a4080" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "0.75rem 0.6rem", textAlign: "center", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                      <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: s.color }}>{s.value}</p>
                      <p style={{ margin: "0.1rem 0 0", fontSize: "0.62rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ SECTION: PERSONAL INFORMATION ═══ */}
              <SectionLabel>Personal Information</SectionLabel>
              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                <InfoRow label="Name" value={person.name} />
                <InfoRow label="Email" value={person.email} />
                <InfoRow label="Phone" value={person.phone} last />
              </div>

              {/* ═══ SECTION: VEHICLE DETAILS ═══ */}
              <SectionLabel>Vehicle Details</SectionLabel>
              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid #F1F5F9" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.72rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Vehicle Type</p>
                  <select
                    value={profileForm.vehicle_type}
                    onChange={(e) => setProfileForm((p) => ({ ...p, vehicle_type: e.target.value }))}
                    style={{ width: "100%", border: "none", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "#0F172A", outline: "none", padding: 0, cursor: "pointer" }}
                  >
                    <option value="">Select vehicle type…</option>
                    <option value="Bike">Bike / Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Auto">Auto Rickshaw</option>
                    <option value="Car">Car</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ padding: "0.85rem 1.1rem" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.72rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Registration Number</p>
                  <input
                    type="text" placeholder="e.g. AP 39 KB 8104"
                    value={profileForm.vehicle_number}
                    onChange={(e) => setProfileForm((p) => ({ ...p, vehicle_number: formatVehicleNumber(e.target.value) }))}
                    style={{ width: "100%", border: "none", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "#0F172A", outline: "none", padding: 0, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* ═══ SECTION: KYC DOCUMENTS ═══ */}
              <SectionLabel>KYC Documents</SectionLabel>

              {/* Two-column document cards */}
              <div className="kyc-grid">
                {/* Driving Licence */}
                <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid #F1F5F9" }}>
                    <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Driving Licence</p>
                  </div>
                  <div style={{ padding: "0.75rem 0.85rem" }}>
                    <input
                      type="text" placeholder="Licence No."
                      value={profileForm.licence_number}
                      onChange={(e) => setProfileForm((p) => ({ ...p, licence_number: e.target.value }))}
                      style={{ width: "100%", border: "none", borderBottom: "1.5px solid #E2E8F0", background: "transparent", fontSize: "0.78rem", fontWeight: 600, color: "#0F172A", outline: "none", padding: "0 0 0.5rem", marginBottom: "0.75rem", boxSizing: "border-box" }}
                    />
                    <DocUploadBox
                      label="Licence"
                      file={licenceFile}
                      existingUrl={person.licence_image_url}
                      onChange={(f) => setLicenceFile(f)}
                    />
                  </div>
                </div>

                {/* PAN Card */}
                <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid #F1F5F9" }}>
                    <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>PAN Card</p>
                  </div>
                  <div style={{ padding: "0.75rem 0.85rem" }}>
                    <input
                      type="text" placeholder="PAN Number" maxLength={10}
                      value={profileForm.pan_card}
                      onChange={(e) => setProfileForm((p) => ({ ...p, pan_card: e.target.value.toUpperCase() }))}
                      style={{ width: "100%", border: "none", borderBottom: "1.5px solid #E2E8F0", background: "transparent", fontSize: "0.78rem", fontWeight: 600, color: "#0F172A", outline: "none", padding: "0 0 0.5rem", marginBottom: "0.75rem", boxSizing: "border-box" }}
                    />
                    <DocUploadBox
                      label="PAN Card"
                      file={panFile}
                      existingUrl={person.pan_image_url}
                      onChange={(f) => setPanFile(f)}
                    />
                  </div>
                </div>
              </div>

              {/* ═══ SECTION: BANK DETAILS ═══ */}
              {(() => {
                const SL2 = ({ children }) => (
                  <p style={{ margin: "1.35rem 0 0.5rem", fontSize: "0.68rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{children}</p>
                );
                return (
                  <>
                    <SL2>Bank Details</SL2>
                    <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                      {/* Account Holder Name */}
                      <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid #F1F5F9" }}>
                        <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Holder Name</p>
                        <input
                          type="text"
                          value={profileForm.bank_account_holder}
                          onChange={(e) => setProfileForm((p) => ({ ...p, bank_account_holder: e.target.value.toUpperCase() }))}
                          placeholder="AS PER BANK RECORDS"
                          style={{ width: "100%", border: "none", borderBottom: "1.5px solid #E2E8F0", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "#0F172A", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }}
                        />
                      </div>
                      {/* Bank Name dropdown */}
                      <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid #F1F5F9" }}>
                        <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bank Name</p>
                        <select
                          value={profileForm.bank_name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, bank_name: e.target.value }))}
                          style={{ width: "100%", border: "none", borderBottom: "1.5px solid #E2E8F0", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: profileForm.bank_name ? "#0F172A" : "#94A3B8", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box", cursor: "pointer" }}
                        >
                          <option value="">Select bank…</option>
                          {INDIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      {/* Account Number */}
                      <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid #F1F5F9" }}>
                        <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Number</p>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={profileForm.bank_account_number}
                          onChange={(e) => setProfileForm((p) => ({ ...p, bank_account_number: e.target.value.replace(/\D/g, "") }))}
                          placeholder="XXXXXXXXXXXX"
                          style={{ width: "100%", border: "none", borderBottom: "1.5px solid #E2E8F0", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "#0F172A", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }}
                        />
                      </div>
                      {/* IFSC */}
                      <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid #F1F5F9" }}>
                        <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>IFSC Code</p>
                        <input
                          type="text"
                          value={profileForm.bank_ifsc}
                          onChange={(e) => setProfileForm((p) => ({ ...p, bank_ifsc: e.target.value.toUpperCase() }))}
                          placeholder="e.g. SBIN0001234"
                          style={{ width: "100%", border: "none", borderBottom: "1.5px solid #E2E8F0", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "#0F172A", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }}
                        />
                      </div>
                      <div style={{ padding: "0.85rem 1.1rem" }}>
                        <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Type</p>
                        <div style={{ display: "flex", gap: "0.65rem" }}>
                          {["Savings", "Current"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setProfileForm((p) => ({ ...p, bank_account_type: type }))}
                              style={{ padding: "0.35rem 1rem", borderRadius: 20, border: "1px solid", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: profileForm.bank_account_type === type ? "#0A1628" : "#fff", color: profileForm.bank_account_type === type ? "#fff" : "#64748B", borderColor: profileForm.bank_account_type === type ? "#0A1628" : "#E2E8F0", transition: "all 0.15s" }}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* ── Save button (after Bank Details) ── */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.35rem" }}>
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  style={{ padding: "0.75rem 1.75rem", border: "none", borderRadius: 10, cursor: profileSaving ? "not-allowed" : "pointer", background: profileSaving ? "#93C5FD" : "linear-gradient(135deg, #0f2460, #1a4080)", color: "#fff", fontWeight: 700, fontSize: "0.88rem", boxShadow: profileSaving ? "none" : "0 4px 14px rgba(26,64,128,0.28)", display: "flex", alignItems: "center", gap: "0.45rem" }}
                >
                  <CheckCircle size={15} />
                  {profileSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>

              {/* ═══ SECTION: CHANGE PASSWORD ═══ */}
              {(() => {
                const SL2 = ({ children }) => (
                  <p style={{ margin: "1.35rem 0 0.5rem", fontSize: "0.68rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{children}</p>
                );
                return (
                  <>
                    <SL2>Change Password</SL2>
                    <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                      {[
                        { label: "Current Password",     key: "old_password" },
                        { label: "New Password",         key: "new_password" },
                        { label: "Confirm New Password", key: "confirm" },
                      ].map(({ label, key }, i, arr) => (
                        <div key={key} style={{ padding: "0.85rem 1.1rem", borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                          <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                          <input
                            type="password"
                            value={pwForm[key]}
                            onChange={(e) => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                            placeholder="••••••••"
                            style={{ width: "100%", border: "none", borderBottom: "1.5px solid #E2E8F0", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "#0F172A", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                      <button
                        onClick={handlePasswordChange}
                        disabled={pwSaving}
                        style={{ padding: "0.75rem 1.75rem", border: "none", borderRadius: 10, cursor: pwSaving ? "not-allowed" : "pointer", background: pwSaving ? "#93C5FD" : "linear-gradient(135deg, #0f2460, #1a4080)", color: "#fff", fontWeight: 700, fontSize: "0.88rem", boxShadow: pwSaving ? "none" : "0 4px 14px rgba(26,64,128,0.28)", display: "flex", alignItems: "center", gap: "0.45rem" }}
                      >
                        <CheckCircle size={15} />
                        {pwSaving ? "Updating…" : "Update Password"}
                      </button>
                    </div>
                  </>
                );
              })()}

            </div>
          );
        })()}

        {/* ════ COMPLETED ORDERS TAB ════ */}
        {tab === "completed" && person.profile_complete && (
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
            ) : (() => {
              const filteredCompleted = completed.filter((o) => {
                if (completedTypeFilter === "deliveries") return o.return_delivery_status !== "returned_to_shop";
                if (completedTypeFilter === "returns") return o.return_delivery_status === "returned_to_shop";
                return true;
              });
              return (
                <>
                  {/* Type filter pills */}
                  <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.85rem" }}>
                    {[["all", "All"], ["deliveries", "Deliveries"], ["returns", "Returns"]].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setCompletedTypeFilter(key)}
                        style={{ padding: "0.28rem 0.75rem", borderRadius: 20, border: "1px solid", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", background: completedTypeFilter === key ? "#1a4080" : "#fff", color: completedTypeFilter === key ? "#fff" : "#64748B", borderColor: completedTypeFilter === key ? "#1a4080" : "#E2E8F0", transition: "all 0.15s" }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, marginBottom: "0.75rem" }}>
                    Showing {filteredCompleted.length} of {completed.length} completed
                  </p>
                  {filteredCompleted.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "#fff", borderRadius: 14 }}>
                      <p style={{ color: "#94A3B8", fontWeight: 600 }}>No {completedTypeFilter} found</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      {filteredCompleted.map((o) => <CompletedOrderCard key={o.id} o={o} earningPerDelivery={stats?.earning_per_delivery} />)}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </main>

      {/* Bottom nav (mobile only) */}
      <nav className="portal-bottom-nav">
        {DEL_NAV.map(({ key, icon, label, badge, warn }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`portal-bottom-tab ${tab === key ? "active" : ""}`}
            style={{ color: tab === key ? "#1a4080" : "#94A3B8" }}
          >
            <div style={{ position: "relative" }}>
              {icon}
              {(badge > 0 || warn) && (
                <span style={{ position: "absolute", top: -6, right: -10, background: warn ? "#D97706" : "#1a4080", color: "#fff", borderRadius: 20, fontSize: "0.62rem", fontWeight: 900, padding: "0.15rem 0.4rem", minWidth: 16, textAlign: "center", lineHeight: 1.2, zIndex: 10 }}>
                  {warn ? "!" : badge}
                </span>
              )}
            </div>
            <span className="pbt-label">{label}</span>
          </button>
        ))}
      </nav>

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
