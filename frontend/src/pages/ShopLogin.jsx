import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { shopLogin, shopRegister } from "../api";
import toast from "react-hot-toast";
import { Lock, Mail, User, Store, CheckCircle } from "lucide-react";
import { stripPhone, phoneError } from "../utils/phone";

const BULLETS = [
  "Product listing & inventory",
  "Order fulfilment & QR scan",
  "Return & payment tracking",
];

export default function ShopLogin() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", shop_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("shop_token")) {
      navigate("/shop/dashboard", { replace: true });
    }
  }, [navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "register") {
      const pErr = phoneError(form.phone);
      if (pErr) { toast.error(pErr); return; }
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await shopLogin({ email: form.email, password: form.password });
        localStorage.setItem("shop_token", res.data.access_token);
        localStorage.setItem("shop_owner", JSON.stringify(res.data.shop_owner));
        navigate("/shop/dashboard");
      } else {
        await shopRegister(form);
        toast.success("Registration submitted! Awaiting admin approval.");
        setMode("login");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const GOLD = "#B8892A";

  const inputStyle = (field) => ({
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: `1.5px solid ${focusedField === field ? GOLD : "rgba(255,255,255,0.12)"}`,
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
      background: "linear-gradient(150deg, #0D0A00 0%, #1A1200 50%, #2A1E00 100%)",
      display: "flex",
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @media (max-width: 899px) { .shop-left-panel { display: none !important; } }
        ::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* ── Left brand panel ── */}
      <div
        className="shop-left-panel"
        style={{
          width: "45%",
          background: "rgba(184,137,42,0.12)",
          borderRight: "1px solid rgba(184,137,42,0.15)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem 3.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Store
          size={320}
          strokeWidth={0.4}
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "-80px",
            color: "rgba(184,137,42,0.07)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
            <Store size={22} color={GOLD} strokeWidth={1.5} />
            <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: GOLD }}>
              Shop Owner Portal
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
            Your gateway to manage inventory and orders
          </p>

          <div style={{ width: 48, height: 1.5, background: `linear-gradient(90deg, ${GOLD}, transparent)`, marginBottom: "2.5rem" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {BULLETS.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <CheckCircle size={15} color={GOLD} strokeWidth={2} style={{ flexShrink: 0 }} />
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
        <div style={{ width: "100%", maxWidth: 440 }}>
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.75rem" }}>
              <span style={{
                background: "rgba(184,137,42,0.15)",
                color: GOLD,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                padding: "0.4rem 1.2rem",
                borderRadius: 9999,
                border: `1px solid rgba(184,137,42,0.25)`,
              }}>
                Shop Owner Portal
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", marginBottom: "1.75rem", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.25rem" }}>
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "0.55rem",
                    background: mode === m ? GOLD : "transparent",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    letterSpacing: "0.06em",
                    color: mode === m ? "#0D0611" : "rgba(255,255,255,0.4)",
                    transition: "all 0.2s",
                  }}
                >
                  {m === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {mode === "register" && (
                <>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                      <User size={11} /> Your Name
                    </label>
                    <input value={form.name} onChange={set("name")} placeholder="Full name" required style={inputStyle("name")} onFocus={focus("name")} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                      <Store size={11} /> Shop Name
                    </label>
                    <input value={form.shop_name} onChange={set("shop_name")} placeholder="Your shop name" required style={inputStyle("shop_name")} onFocus={focus("shop_name")} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem", display: "block" }}>
                      Phone
                    </label>
                    <div style={{ display: "flex", alignItems: "stretch", border: `1.5px solid ${focusedField === "phone" ? GOLD : "rgba(255,255,255,0.12)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
                      <span style={{ padding: "0.8rem 0.85rem", background: "rgba(184,137,42,0.15)", borderRight: "1px solid rgba(255,255,255,0.08)", fontSize: "0.82rem", fontWeight: 700, color: GOLD, whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>+91</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: stripPhone(e.target.value) }))}
                        placeholder="XXXXX XXXXX"
                        maxLength={10}
                        style={{ ...inputStyle("phone"), border: "none", borderRadius: 0, flex: 1 }}
                        onFocus={focus("phone")}
                        onBlur={blur}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  <Mail size={11} /> Email
                </label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="shop@email.com" required style={inputStyle("email")} onFocus={focus("email")} onBlur={blur} />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  <Lock size={11} /> Password
                </label>
                <input type="password" value={form.password} onChange={set("password")} placeholder="Password" required style={inputStyle("password")} onFocus={focus("password")} onBlur={blur} />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.95rem",
                  borderRadius: 9999,
                  background: GOLD,
                  color: "#0D0611",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
              >
                {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Register Shop"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.2)" }}>
            Lakshmi Vastra Studio · Shop Owner Portal
          </p>
        </div>
      </div>
    </div>
  );
}
