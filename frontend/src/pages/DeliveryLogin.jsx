import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { deliveryLogin } from "../api";
import toast from "react-hot-toast";
import { Lock, Mail, Truck, CheckCircle } from "lucide-react";

const BULLETS = [
  "View assigned deliveries",
  "QR scan & OTP confirmation",
  "Real-time status updates",
];

export default function DeliveryLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("delivery_token")) {
      navigate("/delivery/dashboard", { replace: true });
    }
  }, [navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await deliveryLogin(form);
      localStorage.setItem("delivery_token", res.data.access_token);
      localStorage.setItem("delivery_person", JSON.stringify(res.data.delivery_person));
      navigate("/delivery/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const ACCENT = "#4A90D9";
  const GOLD = "#B8892A";

  const inputStyle = (field) => ({
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: `1.5px solid ${focusedField === field ? ACCENT : "rgba(255,255,255,0.12)"}`,
    color: "#fff",
    borderRadius: 10,
    padding: "0.8rem 1rem",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  });

  const focus = (f) => () => setFocusedField(f);
  const blur = () => setFocusedField(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #030812 0%, #080E2A 50%, #0A1640 100%)",
      display: "flex",
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @media (max-width: 899px) { .delivery-left-panel { display: none !important; } }
        ::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* ── Left brand panel ── */}
      <div
        className="delivery-left-panel"
        style={{
          width: "45%",
          background: "rgba(26,64,128,0.35)",
          borderRight: "1px solid rgba(74,144,217,0.15)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem 3.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Truck
          size={320}
          strokeWidth={0.4}
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "-80px",
            color: "rgba(74,144,217,0.07)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
            <Truck size={22} color={ACCENT} strokeWidth={1.5} />
            <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: ACCENT }}>
              Delivery Portal
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.15,
            marginBottom: "0.75rem",
          }}>
            Lakshmi<br />Vastra Studio
          </h1>

          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "1.05rem",
            color: "rgba(255,255,255,0.45)",
            marginBottom: "2rem",
          }}>
            Track, pickup and deliver with precision
          </p>

          <div style={{ width: 48, height: 1.5, background: `linear-gradient(90deg, ${ACCENT}, transparent)`, marginBottom: "2.5rem" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {BULLETS.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <CheckCircle size={15} color={ACCENT} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background: "rgba(0,0,0,0.3)",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile brand */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
              Lakshmi Vastra Studio
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: "2.5rem 2.25rem",
            backdropFilter: "blur(12px)",
          }}>
            {/* Badge */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
              <span style={{
                background: "rgba(74,144,217,0.15)",
                color: ACCENT,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                padding: "0.4rem 1.2rem",
                borderRadius: 9999,
                border: `1px solid rgba(74,144,217,0.25)`,
              }}>
                Delivery Portal
              </span>
            </div>

            <h2 style={{ textAlign: "center", fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.4rem" }}>
              Sign In
            </h2>
            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: "2rem" }}>
              Enter your delivery credentials to continue
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  <Mail size={11} /> Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="your@email.com"
                  required
                  style={inputStyle("email")}
                  onFocus={focus("email")}
                  onBlur={blur}
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  <Lock size={11} /> Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Password"
                  required
                  style={inputStyle("password")}
                  onFocus={focus("password")}
                  onBlur={blur}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.95rem",
                  borderRadius: 9999,
                  background: `linear-gradient(90deg, #1a4080, #2d6abf)`,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.2s, transform 0.2s",
                  boxShadow: "0 4px 20px rgba(26,64,128,0.4)",
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.2)" }}>
            Lakshmi Vastra Studio · Delivery Portal
          </p>
        </div>
      </div>
    </div>
  );
}
