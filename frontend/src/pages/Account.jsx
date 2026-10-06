import { useEffect, useState, useCallback, useRef } from "react";

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { User, Lock, Mail, Phone, LogOut, ShoppingBag, Eye, EyeOff, ArrowRight, Package, MapPin, Edit2, Check, X, Truck, XCircle, Camera, CreditCard, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getOrders, cancelOrder, requestReturn, updateProfile, uploadCustomerAvatar, retryPayment, verifyPayment } from "../api";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { stripPhone, formatPhone, phoneError } from "../utils/phone";

/* ── Shared styles ─────────────────────────────────────── */
const PANEL_LEFT = {
  background: "linear-gradient(150deg, #0D0611 0%, #28092A 45%, #7B1D45 100%)",
  flex: "0 0 420px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "3.5rem 3rem",
  minHeight: "100vh",
};

const inputWrap = { display: "flex", flexDirection: "column", gap: "0.3rem" };

const labelSt = {
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#6B5744",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};

function InputField({ label, icon: Icon, type = "text", value, onChange, placeholder, required, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;

  return (
    <div style={inputWrap}>
      <label style={labelSt}>{label}</label>
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon size={15} style={{
            position: "absolute", left: "0.9rem", top: "50%",
            transform: "translateY(-50%)", color: "#9B7B6A", pointerEvents: "none",
          }} />
        )}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          style={{
            width: "100%", boxSizing: "border-box",
            paddingLeft: Icon ? "2.5rem" : "0.9rem",
            paddingRight: isPassword ? "2.75rem" : "0.9rem",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: "absolute", right: "0.9rem", top: "50%",
              transform: "translateY(-50%)", background: "none", border: "none",
              cursor: "pointer", color: "#9B7B6A", display: "flex",
            }}
            tabIndex={-1}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Divider ─────────────────────────────────────────────── */
function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.25rem 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.04em" }}>OR</span>
      <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
    </div>
  );
}

/* ── Login form ──────────────────────────────────────────── */
function LoginForm({ onSwitch, onGoogleSuccess }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      navigate("/account");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem", animation: "formFadeIn 0.3s ease" }}>
      <InputField label="Email" icon={Mail} type="email" value={form.email} onChange={set("email")}
        placeholder="you@example.com" required autoComplete="email" />
      <InputField label="Password" icon={Lock} type="password" value={form.password} onChange={set("password")}
        placeholder="Your password" required autoComplete="current-password" />

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
        style={{ width: "100%", marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: loading ? 0.75 : 1 }}
      >
        {loading
          ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Signing in...</>
          : <><ArrowRight size={16} /> Sign In</>
        }
      </button>

      <p style={{ textAlign: "center", fontSize: "0.83rem", color: "#9B7B6A", marginTop: "0.25rem" }}>
        New here?{" "}
        <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontSize: "0.83rem" }}>
          Create an account
        </button>
      </p>

      <OrDivider />
      <GoogleSignInButton onCredential={onGoogleSuccess} />
    </form>
  );
}

/* ── Register form ───────────────────────────────────────── */
function RegisterForm({ onSwitch, onGoogleSuccess }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setPhone = (e) => setForm({ ...form, phone: stripPhone(e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const pErr = phoneError(form.phone);
    if (pErr) { toast.error(pErr); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success("Account created! Welcome.");
      navigate("/account");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "formFadeIn 0.3s ease" }}>
      <InputField label="Full Name" icon={User} value={form.name} onChange={set("name")}
        placeholder="Your full name" required autoComplete="name" />
      <InputField label="Email" icon={Mail} type="email" value={form.email} onChange={set("email")}
        placeholder="you@example.com" required autoComplete="email" />
      <div>
        <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem", display: "block" }}>Phone <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
        <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border-light)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
          <span style={{ padding: "0.6rem 0.75rem", background: "var(--cream)", borderRight: "1px solid var(--border-light)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>+91</span>
          <input type="tel" value={form.phone} onChange={setPhone} placeholder="XXXXX XXXXX" maxLength={10} autoComplete="tel" style={{ border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
        </div>
      </div>
      <InputField label="Password" icon={Lock} type="password" value={form.password} onChange={set("password")}
        placeholder="Min. 6 characters" required autoComplete="new-password" />
      <InputField label="Confirm Password" icon={Lock} type="password" value={form.confirm} onChange={set("confirm")}
        placeholder="Repeat your password" required autoComplete="new-password" />

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
        style={{ width: "100%", marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: loading ? 0.75 : 1 }}
      >
        {loading
          ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Creating account...</>
          : <><ArrowRight size={16} /> Create Account</>
        }
      </button>

      <p style={{ textAlign: "center", fontSize: "0.83rem", color: "#9B7B6A", marginTop: "0.25rem" }}>
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontSize: "0.83rem" }}>
          Sign in
        </button>
      </p>

      <OrDivider />
      <GoogleSignInButton onCredential={onGoogleSuccess} />
    </form>
  );
}

/* ── Order history ───────────────────────────────────────── */
const STATUS_STYLE = {
  awaiting_payment:   { bg: "#FFF7ED", color: "#C2410C", label: "Awaiting Payment" },
  pending:            { bg: "#D1FAE5", color: "#065F46", label: "Order Placed" },
  confirmed:          { bg: "#DBEAFE", color: "#1E40AF", label: "Confirmed by Shop" },
  ready_for_delivery: { bg: "#D1FAE5", color: "#065F46", label: "Packed & Ready" },
  picked_up:          { bg: "#EDE9FE", color: "#5B21B6", label: "Out for Delivery" },
  delivered:          { bg: "#D1FAE5", color: "#065F46", label: "Delivered" },
  cancelled:          { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
  return_requested:   { bg: "#EDE9FE", color: "#5B21B6", label: "Return Requested" },
  return_accepted:    { bg: "#D1FAE5", color: "#065F46", label: "Return Accepted" },
  return_rejected:    { bg: "#FEE2E2", color: "#991B1B", label: "Return Rejected" },
  return_returned:    { bg: "#DCFCE7", color: "#15803D", label: "Return Completed" },
};

const CANCELLABLE = ["pending", "confirmed"];
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

function openRazorpayModal(options) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) { reject(new Error("Razorpay not loaded")); return; }
    const rzp = new window.Razorpay({
      ...options,
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("dismissed")) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r.error?.description || "Payment failed")));
    rzp.open();
  });
}

function OrderHistory() {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [retrying, setRetrying] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [returnModal, setReturnModal] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returning, setReturning] = useState(null);

  const load = () => {
    getOrders()
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cannot cancel this order");
    } finally {
      setCancelling(null);
    }
  };

  const handleRetryPayment = async (order) => {
    setRetrying(order.id);
    try {
      const { data } = await retryPayment(order.id);
      const payment = await openRazorpayModal({
        key:         data.key_id || RAZORPAY_KEY_ID,
        amount:      data.amount,
        currency:    data.currency || "INR",
        name:        "Lakshmi Vastra Studio",
        description: `Order #${order.id}`,
        order_id:    data.razorpay_order_id,
        prefill:     { name: customer?.name || "", email: customer?.email || "" },
        theme:       { color: "#7B1D45" },
        modal:       { escape: false },
      });
      await verifyPayment({
        order_id:             order.id,
        razorpay_order_id:    payment.razorpay_order_id,
        razorpay_payment_id:  payment.razorpay_payment_id,
        razorpay_signature:   payment.razorpay_signature,
      });
      toast.success("Payment successful! Order confirmed.");
      load();
    } catch (err) {
      if (err.message === "dismissed") {
        toast("Payment cancelled.", { icon: "ℹ️" });
      } else {
        toast.error(err.response?.data?.detail || err.message || "Payment failed. Please try again.");
      }
    } finally {
      setRetrying(null);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnReason.trim()) { toast.error("Please describe the reason for return"); return; }
    setReturning(returnModal);
    try {
      await requestReturn(returnModal, returnReason.trim());
      toast.success("Return request submitted! The shop will review it.");
      setReturnModal(null);
      setReturnReason("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit return request");
    } finally {
      setReturning(null);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "1.5rem", border: "1px solid var(--border-light)" }}>
          <span className="skeleton" style={{ height: 14, width: "40%", marginBottom: "0.5rem" }} />
          <span className="skeleton" style={{ height: 12, width: "25%" }} />
        </div>
      ))}
    </div>
  );

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <ShoppingBag size={48} style={{ color: "var(--border-light)", marginBottom: "1.25rem" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "1.5rem" }}>No orders yet.</p>
        <Link to="/shop" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          Start Shopping <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {orders.map((order, idx) => {
        const st = STATUS_STYLE[order.status] || { bg: "#F1F5F9", color: "#64748B", label: order.status };
        const returnSt = order.return_status ? (STATUS_STYLE[`return_${order.return_status}`] || null) : null;
        const displaySt = returnSt || st;
        const canCancel = CANCELLABLE.includes(order.status);
        const canTrack  = !["cancelled", "awaiting_payment"].includes(order.status);
        const isAwaiting = order.status === "awaiting_payment";
        const showHistory = expanded[order.id];

        return (
          <div
            key={order.id}
            style={{
              background: "#fff", borderRadius: 12, padding: "1.4rem 1.5rem",
              border: isAwaiting ? "1.5px solid #FED7AA" : "1px solid var(--border-light)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              animation: `slideUp 0.3s ease ${idx * 0.06}s both`,
            }}
          >
            {/* Awaiting payment banner */}
            {isAwaiting && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "0.55rem 0.85rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#C2410C", fontWeight: 600 }}>
                <CreditCard size={14} />
                Payment not completed — complete payment to confirm your order.
              </div>
            )}

            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={17} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.92rem", margin: 0 }}>Order #{order.id}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.76rem", margin: "0.1rem 0 0" }}>
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}{order.payment_method === "cod" ? "Cash on Delivery" : "Paid Online"}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-block", padding: "0.22rem 0.8rem", borderRadius: 20, background: displaySt.bg, color: displaySt.color, fontSize: "0.72rem", fontWeight: 700 }}>
                  {displaySt.label}
                </span>
                <p style={{ fontWeight: 700, color: "var(--text)", fontSize: "1.05rem", margin: "0.35rem 0 0" }}>
                  ₹{order.total.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Items */}
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.83rem" }}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1, color: "var(--text)", fontWeight: 500 }}>{item.name}</span>
                  <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>× {item.quantity}</span>
                  <span style={{ color: "var(--text)", fontWeight: 600, whiteSpace: "nowrap" }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            {/* Return status note */}
            {order.return_status && (
              <div style={{ marginTop: "0.65rem", background: (order.return_status === "accepted" || order.return_status === "returned") ? "#F0FDF4" : order.return_status === "rejected" ? "#FEF2F2" : "#FAF5FF", border: `1px solid ${(order.return_status === "accepted" || order.return_status === "returned") ? "#86EFAC" : order.return_status === "rejected" ? "#FCA5A5" : "#C4B5FD"}`, borderRadius: 8, padding: "0.65rem 0.85rem", fontSize: "0.8rem" }}>
                <p style={{ margin: "0 0 0.2rem", fontWeight: 700, color: (order.return_status === "accepted" || order.return_status === "returned") ? "#15803D" : order.return_status === "rejected" ? "#991B1B" : "#5B21B6" }}>
                  {order.return_status === "pending" ? "⏳ Return request under review" : order.return_status === "accepted" ? "✅ Return accepted — item being collected" : order.return_status === "returned" ? "📦 Return completed — item back at shop" : "❌ Return rejected"}
                </p>
                {order.return_reason && <p style={{ margin: "0.15rem 0 0", color: "#64748B" }}>Reason: {order.return_reason}</p>}
                {order.return_note && <p style={{ margin: "0.15rem 0 0", color: "#475569", fontWeight: 600 }}>Shop note: {order.return_note}</p>}
              </div>
            )}

            {/* Refund status — only for returned online-paid orders */}
            {order.return_status === "returned" && order.payment_method !== "cod" && (
              <div style={{ marginTop: "0.55rem", background: order.refund_status === "refunded" ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${order.refund_status === "refunded" ? "#86EFAC" : "#FED7AA"}`, borderRadius: 8, padding: "0.6rem 0.85rem" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8rem", color: order.refund_status === "refunded" ? "#15803D" : "#92400E" }}>
                  {order.refund_status === "refunded" ? "✅ Refund Sent" : "⏳ Refund Pending"}
                </p>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>
                  {order.refund_status === "refunded"
                    ? `₹${order.total.toLocaleString("en-IN")} has been refunded. Check your bank/UPI within 3–5 business days.`
                    : `₹${order.total.toLocaleString("en-IN")} refund is being processed by the shop. You'll be notified once sent.`}
                </p>
              </div>
            )}

            {/* Status timeline (collapsible) */}
            {order.status_history?.length > 0 && (
              <div style={{ marginTop: "0.85rem" }}>
                <button
                  onClick={() => setExpanded(e => ({ ...e, [order.id]: !e[order.id] }))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: "0.78rem", fontWeight: 700, padding: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}
                >
                  {showHistory ? "Hide" : "View"} Order History
                </button>
                {showHistory && (
                  <div style={{ marginTop: "0.75rem", paddingLeft: "0.5rem", borderLeft: "2px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {[...(order.status !== "awaiting_payment"
                      ? order.status_history.filter(h => h.status !== "awaiting_payment")
                      : order.status_history
                    )].reverse().map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "var(--primary)" : "var(--border)", marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                            {STATUS_STYLE[h.status]?.label || h.status}
                          </p>
                          {h.note && <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: "0.1rem 0 0" }}>{h.note}</p>}
                          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.1rem 0 0" }}>
                            {new Date(h.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-light)", flexWrap: "wrap" }}>
              {isAwaiting && (
                <button
                  onClick={() => handleRetryPayment(order)}
                  disabled={retrying === order.id}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.1rem", background: "#C2410C", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, opacity: retrying === order.id ? 0.7 : 1 }}
                >
                  <CreditCard size={14} /> {retrying === order.id ? "Opening…" : "Complete Payment"}
                </button>
              )}
              {canTrack && (
                <button
                  onClick={() => navigate(`/track/${order.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.1rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <Truck size={14} /> Track Order
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={cancelling === order.id}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.1rem", background: "#fff", color: "#c0392b", border: "1px solid #fca5a5", borderRadius: 7, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, opacity: cancelling === order.id ? 0.6 : 1 }}
                >
                  <XCircle size={14} /> {cancelling === order.id ? "Cancelling…" : "Cancel Order"}
                </button>
              )}
              {order.status === "delivered" && !order.return_status && (() => {
                const daysSince = (Date.now() - new Date(order.created_at)) / 86400000;
                return daysSince <= 7;
              })() && (
                <button
                  onClick={() => { setReturnModal(order.id); setReturnReason(""); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.1rem", background: "#fff", color: "#7c3aed", border: "1px solid #c4b5fd", borderRadius: 7, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <RotateCcw size={14} /> Request Return
                </button>
              )}
            </div>
          </div>
        );
      })}
      {returnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem 1.5rem", maxWidth: 400, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>Request Return</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.83rem", color: "#64748B", lineHeight: 1.5 }}>
              Please describe why you want to return this order. The shop owner will review your request within 1–2 business days.
            </p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Wrong colour received, damaged product, size doesn't fit…"
              rows={4}
              style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: "0.85rem", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
            <p style={{ margin: "0.4rem 0 1.25rem", fontSize: "0.72rem", color: "#94A3B8" }}>
              Returns accepted within 7 days of delivery for unused, undamaged products.
            </p>
            <div style={{ display: "flex", gap: "0.65rem" }}>
              <button onClick={() => setReturnModal(null)} style={{ flex: 1, padding: "0.7rem", border: "1.5px solid #E2E8F0", borderRadius: 10, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: "#475569" }}>
                Cancel
              </button>
              <button
                onClick={handleRequestReturn}
                disabled={!!returning}
                style={{ flex: 2, padding: "0.7rem", border: "none", borderRadius: 10, background: returning ? "#C4B5FD" : "#7c3aed", color: "#fff", cursor: returning ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.88rem" }}
              >
                {returning ? "Submitting…" : "Submit Return Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Profile section (editable) ─────────────────────────── */
function ProfileSection({ customer }) {
  const { setCustomer } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [form, setForm] = useState({
    phone: customer.phone || "",
    secondary_phone: customer.secondary_phone || "",
    address: customer.address || "",
    city: customer.city || "",
    state: customer.state || "",
    pincode: customer.pincode || "",
  });

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const pErr = phoneError(form.phone);
    if (pErr) { toast.error(pErr); return; }
    const spErr = phoneError(form.secondary_phone);
    if (spErr) { toast.error("Secondary phone: " + spErr); return; }
    setSaving(true);
    try {
      const { data } = await updateProfile(form);
      setCustomer(data);
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ phone: customer.phone || "", secondary_phone: customer.secondary_phone || "", address: customer.address || "", city: customer.city || "", state: customer.state || "", pincode: customer.pincode || "" });
    setEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("profile_image", file);
      const { data } = await uploadCustomerAvatar(fd);
      setCustomer(data);
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const ReadonlyField = ({ label, value, Icon }) => (
    <div style={{ background: "var(--cream)", borderRadius: 10, padding: "1.1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color="var(--primary)" />
      </div>
      <div>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.3rem" }}>{label}</p>
        <p style={{ color: "var(--text)", fontSize: "0.92rem", fontWeight: 500 }}>{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "2rem 2.25rem", border: "1px solid var(--border-light)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
      {/* Avatar upload */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.75rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid var(--border-light)", position: "relative" }}
          >
            {customer.profile_image_url ? (
              <img src={customer.profile_image_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0D0611, #7B1D45)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontWeight: 700, fontSize: "1.4rem" }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
            )}
            {avatarUploading && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              </div>
            )}
          </div>
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff" }}
          >
            <Camera size={11} color="#fff" />
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: "var(--text)", margin: "0 0 0.2rem" }}>{customer.name}</h2>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Tap the photo to change your profile picture</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.45rem 0.9rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}
          >
            <Edit2 size={13} /> Edit
          </button>
        )}
      </div>

      {/* Always read-only: name and email */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        <ReadonlyField label="Full Name" value={customer.name} Icon={User} />
        <ReadonlyField label="Email Address" value={customer.email} Icon={Mail} />
      </div>

      {editing ? (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={inputWrap}>
              <label style={labelSt}>Phone Number</label>
              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border-light)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <span style={{ padding: "0.55rem 0.75rem", background: "var(--cream)", borderRight: "1px solid var(--border-light)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>+91</span>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: stripPhone(e.target.value) })} placeholder="XXXXX XXXXX" maxLength={10} autoComplete="tel" style={{ border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
              </div>
            </div>
            <div style={inputWrap}>
              <label style={labelSt}>Secondary Phone <span style={{ fontWeight: 400, textTransform: "none", fontSize: "0.7rem" }}>(optional)</span></label>
              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border-light)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <span style={{ padding: "0.55rem 0.75rem", background: "var(--cream)", borderRight: "1px solid var(--border-light)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>+91</span>
                <input type="tel" value={form.secondary_phone} onChange={(e) => setForm({ ...form, secondary_phone: stripPhone(e.target.value) })} placeholder="XXXXX XXXXX" maxLength={10} autoComplete="tel" style={{ border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
              </div>
            </div>
          </div>
          <div style={inputWrap}>
            <label style={labelSt}>Delivery Address</label>
            <div style={{ position: "relative" }}>
              <MapPin size={15} style={{ position: "absolute", left: "0.9rem", top: "0.85rem", color: "#9B7B6A", pointerEvents: "none" }} />
              <textarea
                value={form.address}
                onChange={set("address")}
                placeholder="House / Flat no., Street / Area"
                rows={2}
                style={{ paddingLeft: "2.5rem", resize: "vertical" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
            <div style={inputWrap}>
              <label style={labelSt}>City</label>
              <input value={form.city} onChange={set("city")} placeholder="e.g. Gooty RS" />
            </div>
            <div style={inputWrap}>
              <label style={labelSt}>State</label>
              <input value={form.state} onChange={set("state")} placeholder="e.g. Andhra Pradesh" />
            </div>
            <div style={{ ...inputWrap, minWidth: 120 }}>
              <label style={labelSt}>PIN Code</label>
              <input value={form.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setForm(p => ({ ...p, pincode: v })); }} placeholder="e.g. 515402" maxLength={6} inputMode="numeric" pattern="[0-9]*" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: saving ? 0.7 : 1 }}>
              <Check size={14} /> {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={handleCancel} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", border: "1px solid var(--border)", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <ReadonlyField label="Phone Number" value={customer.phone ? formatPhone(customer.phone) : "Not provided"} Icon={Phone} />
          <ReadonlyField label="Secondary Phone" value={customer.secondary_phone ? formatPhone(customer.secondary_phone) : "Not provided"} Icon={Phone} />
          <div style={{ gridColumn: "1 / -1", background: "var(--cream)", borderRadius: 10, padding: "1.1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MapPin size={15} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.3rem" }}>Delivery Address</p>
              {customer.address || customer.city ? (
                <div style={{ fontSize: "0.92rem", fontWeight: 500, lineHeight: 1.65, color: "var(--text)" }}>
                  {customer.address && <p style={{ margin: 0 }}>{customer.address}</p>}
                  {(customer.city || customer.state || customer.pincode) && (
                    <p style={{ margin: 0 }}>
                      {[customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", fontWeight: 500 }}>Not provided — click Edit to add</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function Account() {
  const { customer, logout, googleAuth, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("login");
  const [activeSection, setActiveSection] = useState(
    searchParams.get("tab") === "orders" ? "orders" : "profile"
  );

  const handleGoogleCredential = useCallback(async (credential) => {
    try {
      await googleAuth(credential);
      toast.success("Signed in with Google!");
      navigate("/account");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Google sign-in failed");
    }
  }, [googleAuth, navigate]);

  useEffect(() => {
    document.title = "Account | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  if (authLoading) return null;

  /* ── Not logged in: full-screen auth page ── */
  if (!customer) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Left panel — visible on large screens */}
        <div style={{ ...PANEL_LEFT, display: "none" }} className="auth-left-panel">
          <div style={{ textAlign: "center", animation: "fadeInUp 0.8s ease" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem", lineHeight: 1.2 }}>
              Lakshmi Vastra Studio
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1rem", color: "var(--gold-light, #C9A84C)", letterSpacing: "0.1em", marginBottom: "2.5rem" }}>
              Tradition woven in every thread
            </p>
            <div style={{ width: 48, height: 1, background: "var(--gold, #C9A84C)", margin: "0 auto 2.5rem", opacity: 0.5 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: "left" }}>
              {["Authentic handloom sarees", "500+ happy customers", "Curated for every occasion", "Personal styling guidance"].map((f, i) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem", animation: `slideUp 0.4s ease ${0.3 + i * 0.1}s both` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold, #C9A84C)", flexShrink: 0 }} />
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{
          flex: 1,
          background: "linear-gradient(160deg, #fdf8f5 0%, #f5ede6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1.5rem",
          minHeight: "100vh",
        }}>
          <div style={{ width: "100%", maxWidth: 420, animation: "fadeInUp 0.5s ease" }}>
            {/* Brand mark — shown on mobile where left panel is hidden */}
            <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
                Lakshmi Vastra Studio
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.8rem", color: "var(--gold)", letterSpacing: "0.15em", marginTop: "0.2rem" }}>
                {tab === "login" ? "Welcome back" : "Join us today"}
              </p>
            </div>

            {/* Card */}
            <div style={{
              background: "#fff",
              borderRadius: 16,
              padding: isMobile ? "1.5rem 1.1rem" : "2.25rem 2.5rem",
              boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06)",
              border: "1px solid rgba(255,255,255,0.8)",
            }}>
              {/* Tab switcher */}
              <div style={{
                display: "flex",
                background: "var(--cream)",
                borderRadius: 10,
                padding: "0.2rem",
                marginBottom: "1.75rem",
              }}>
                {[["login", "Sign In"], ["register", "Register"]].map(([t, label]) => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flex: 1,
                    padding: "0.55rem 0",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: tab === t ? 700 : 500,
                    color: tab === t ? "var(--primary)" : "var(--text-muted)",
                    background: tab === t ? "#fff" : "transparent",
                    boxShadow: tab === t ? "0 1px 8px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s",
                  }}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === "login"
                ? <LoginForm onSwitch={() => setTab("register")} onGoogleSuccess={handleGoogleCredential} />
                : <RegisterForm onSwitch={() => setTab("login")} onGoogleSuccess={handleGoogleCredential} />
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Logged in: account dashboard ── */
  return (
    <div style={{ padding: "2.5rem 0 6rem", background: "var(--cream)", minHeight: "80vh" }}>
      <div className="container">
        <span className="section-tag">My account</span>
        <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>Account</h1>
        <div className="section-divider" style={{ marginBottom: "2.5rem" }} />

        {isMobile ? (
          /* ── Mobile layout: avatar strip + horizontal tabs ── */
          <div>
            {/* Avatar strip */}
            <div style={{
              background: "linear-gradient(135deg, #0D0611, #7B1D45)",
              borderRadius: 12, padding: "1.25rem 1.25rem",
              display: "flex", alignItems: "center", gap: "1rem",
              marginBottom: "1rem",
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                border: "2px solid var(--gold)", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {customer.profile_image_url ? (
                  <img src={customer.profile_image_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontWeight: 700, fontSize: "1.2rem" }}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.92rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.73rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.email}</p>
              </div>
              <button
                onClick={() => { logout(); navigate("/"); toast.success("Signed out"); }}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}
              >
                <LogOut size={13} /> Out
              </button>
            </div>

            {/* Horizontal tab bar */}
            <div style={{ display: "flex", background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-light)", marginBottom: "1.25rem" }}>
              {[["profile", "Profile", User], ["orders", "My Orders", Package]].map(([s, label, Icon]) => (
                <button key={s} onClick={() => setActiveSection(s)} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                  padding: "0.75rem 0.5rem", border: "none", cursor: "pointer",
                  background: activeSection === s ? "var(--primary)" : "#fff",
                  color: activeSection === s ? "#fff" : "var(--text-muted)",
                  fontWeight: activeSection === s ? 700 : 500, fontSize: "0.84rem",
                  borderBottom: activeSection === s ? "none" : "none",
                  transition: "all 0.2s",
                }}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {activeSection === "profile" && <ProfileSection customer={customer} />}
              {activeSection === "orders" && (
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "var(--text)", marginBottom: "1.25rem" }}>Order History</h2>
                  <OrderHistory />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Desktop layout: sidebar + content ── */
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            {/* Sidebar */}
            <aside style={{
              flex: "0 0 230px",
              background: "#fff", borderRadius: 12, overflow: "hidden",
              border: "1px solid var(--border-light)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
              animation: "fadeIn 0.4s ease",
            }}>
              <div style={{ background: "linear-gradient(135deg, #0D0611, #7B1D45)", padding: "1.75rem 1.5rem" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  border: "2px solid var(--gold)", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "0.75rem",
                }}>
                  {customer.profile_image_url ? (
                    <img src={customer.profile_image_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontWeight: 700, fontSize: "1.3rem" }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{customer.name}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", marginTop: "0.15rem" }}>{customer.email}</p>
              </div>
              <div style={{ padding: "0.75rem 0" }}>
                {[["profile", "Profile", User], ["orders", "My Orders", Package]].map(([s, label, Icon]) => (
                  <button key={s} onClick={() => setActiveSection(s)} style={{
                    display: "flex", alignItems: "center", gap: "0.65rem",
                    width: "100%", textAlign: "left", padding: "0.7rem 1.25rem",
                    background: activeSection === s ? "var(--cream)" : "none", border: "none",
                    borderLeft: activeSection === s ? "3px solid var(--primary)" : "3px solid transparent",
                    cursor: "pointer",
                    color: activeSection === s ? "var(--primary)" : "var(--text-muted)",
                    fontWeight: activeSection === s ? 700 : 400, fontSize: "0.87rem",
                    transition: "all 0.18s",
                  }}>
                    <Icon size={15} /> {label}
                  </button>
                ))}
                <div style={{ height: 1, background: "var(--border-light)", margin: "0.5rem 1.25rem" }} />
                <button
                  onClick={() => { logout(); navigate("/"); toast.success("Signed out"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.65rem",
                    width: "100%", textAlign: "left", padding: "0.7rem 1.25rem",
                    background: "none", border: "none", borderLeft: "3px solid transparent",
                    cursor: "pointer", color: "#c0392b", fontWeight: 500, fontSize: "0.87rem",
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </aside>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, animation: "fadeIn 0.4s ease" }}>
              {activeSection === "profile" && <ProfileSection customer={customer} />}
              {activeSection === "orders" && (
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--text)", marginBottom: "1.5rem" }}>Order History</h2>
                  <OrderHistory />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
