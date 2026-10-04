import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Mail, Phone, LogOut, ShoppingBag, Eye, EyeOff, ArrowRight, Package, MapPin, Edit2, Check, X, Truck, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getOrders, cancelOrder, updateProfile } from "../api";
import GoogleSignInButton from "../components/GoogleSignInButton";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
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
      <InputField label="Phone (optional)" icon={Phone} value={form.phone} onChange={set("phone")}
        placeholder="+91 XXXXX XXXXX" autoComplete="tel" />
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
  pending:            { bg: "#FEF9C3", color: "#854D0E", label: "Pending" },
  confirmed:          { bg: "#DBEAFE", color: "#1E40AF", label: "Confirmed" },
  ready_for_delivery: { bg: "#D1FAE5", color: "#065F46", label: "Packed & Ready" },
  picked_up:          { bg: "#EDE9FE", color: "#5B21B6", label: "Out for Delivery" },
  delivered:          { bg: "#D1FAE5", color: "#065F46", label: "Delivered" },
  cancelled:          { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
};

const CANCELLABLE = ["pending", "confirmed"];

function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const load = () => {
    getOrders()
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
        const canCancel = CANCELLABLE.includes(order.status);
        const canTrack = order.status !== "cancelled";
        return (
          <div
            key={order.id}
            style={{
              background: "#fff", borderRadius: 10, padding: "1.5rem",
              border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              animation: `slideUp 0.3s ease ${idx * 0.06}s both`,
            }}
          >
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={17} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.92rem", margin: 0 }}>Order #{order.id}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.76rem", marginTop: "0.1rem", margin: 0 }}>
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}{order.payment_method === "cod" ? "Cash on Delivery" : "Paid Online"}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-block", padding: "0.22rem 0.8rem", borderRadius: 20, background: st.bg, color: st.color, fontSize: "0.72rem", fontWeight: 700 }}>
                  {st.label}
                </span>
                <p style={{ fontWeight: 700, color: "var(--text)", marginTop: "0.35rem", fontSize: "1.05rem", margin: "0.35rem 0 0" }}>
                  ₹{order.total.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Items */}
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.83rem", color: "var(--text-muted)" }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-light)", flexWrap: "wrap" }}>
              {canTrack && (
                <button
                  onClick={() => navigate(`/track/${order.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <Truck size={14} /> Track Order
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={cancelling === order.id}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", background: "#fff", color: "#c0392b", border: "1px solid #fca5a5", borderRadius: 7, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, opacity: cancelling === order.id ? 0.6 : 1 }}
                >
                  <XCircle size={14} /> {cancelling === order.id ? "Cancelling…" : "Cancel Order"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Profile section (editable) ─────────────────────────── */
function ProfileSection({ customer }) {
  const { setCustomer } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-light)" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--text)", margin: 0 }}>Profile Details</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.45rem 0.9rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)" }}
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
              <div style={{ position: "relative" }}>
                <Phone size={15} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#9B7B6A", pointerEvents: "none" }} />
                <input value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" autoComplete="tel" style={{ paddingLeft: "2.5rem" }} />
              </div>
            </div>
            <div style={inputWrap}>
              <label style={labelSt}>Secondary Phone <span style={{ fontWeight: 400, textTransform: "none", fontSize: "0.7rem" }}>(optional)</span></label>
              <div style={{ position: "relative" }}>
                <Phone size={15} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#9B7B6A", pointerEvents: "none" }} />
                <input value={form.secondary_phone} onChange={set("secondary_phone")} placeholder="Alternate number" style={{ paddingLeft: "2.5rem" }} />
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem" }}>
            <div style={inputWrap}>
              <label style={labelSt}>City</label>
              <input value={form.city} onChange={set("city")} placeholder="Chennai" />
            </div>
            <div style={inputWrap}>
              <label style={labelSt}>State</label>
              <input value={form.state} onChange={set("state")} placeholder="Tamil Nadu" />
            </div>
            <div style={{ ...inputWrap, minWidth: 120 }}>
              <label style={labelSt}>PIN Code</label>
              <input value={form.pincode} onChange={set("pincode")} placeholder="600001" maxLength={6} />
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
          <ReadonlyField label="Phone Number" value={customer.phone || "Not provided"} Icon={Phone} />
          <ReadonlyField label="Secondary Phone" value={customer.secondary_phone || "Not provided"} Icon={Phone} />
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
  const [tab, setTab] = useState("login");
  const [activeSection, setActiveSection] = useState("profile");

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
              padding: "2.25rem 2.5rem",
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

        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Sidebar */}
          <aside style={{
            flex: "0 0 230px",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--border-light)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
            animation: "fadeIn 0.4s ease",
          }}>
            {/* Avatar header */}
            <div style={{ background: "linear-gradient(135deg, #0D0611, #7B1D45)", padding: "1.75rem 1.5rem" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(201,168,76,0.25)",
                border: "2px solid var(--gold)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--gold)", fontWeight: 700, fontSize: "1.3rem",
                marginBottom: "0.75rem",
              }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{customer.name}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", marginTop: "0.15rem" }}>{customer.email}</p>
            </div>

            {/* Nav items */}
            <div style={{ padding: "0.75rem 0" }}>
              {[["profile", "Profile", User], ["orders", "My Orders", Package]].map(([s, label, Icon]) => (
                <button key={s} onClick={() => setActiveSection(s)} style={{
                  display: "flex", alignItems: "center", gap: "0.65rem",
                  width: "100%", textAlign: "left",
                  padding: "0.7rem 1.25rem",
                  background: activeSection === s ? "var(--cream)" : "none",
                  border: "none",
                  borderLeft: activeSection === s ? "3px solid var(--primary)" : "3px solid transparent",
                  cursor: "pointer",
                  color: activeSection === s ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: activeSection === s ? 700 : 400,
                  fontSize: "0.87rem",
                  transition: "all 0.18s",
                }}>
                  <Icon size={15} />
                  {label}
                </button>
              ))}

              <div style={{ height: 1, background: "var(--border-light)", margin: "0.5rem 1.25rem" }} />

              <button
                onClick={() => { logout(); navigate("/"); toast.success("Signed out"); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.65rem",
                  width: "100%", textAlign: "left",
                  padding: "0.7rem 1.25rem",
                  background: "none", border: "none",
                  borderLeft: "3px solid transparent",
                  cursor: "pointer",
                  color: "#c0392b", fontWeight: 500, fontSize: "0.87rem",
                  transition: "background 0.15s",
                }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </aside>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0, animation: "fadeIn 0.4s ease" }}>
            {activeSection === "profile" && (
              <ProfileSection customer={customer} />
            )}

            {activeSection === "orders" && (
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--text)", marginBottom: "1.5rem" }}>
                  Order History
                </h2>
                <OrderHistory />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
