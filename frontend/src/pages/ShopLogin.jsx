import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { shopLogin, shopRegister } from "../api";
import toast from "react-hot-toast";
import { Lock, Mail, User, Store } from "lucide-react";
import { stripPhone, phoneError } from "../utils/phone";

export default function ShopLogin() {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ name: "", shop_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #0D0611 0%, #28092A 45%, #7B1D45 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 8, padding: "2.5rem 2.25rem",
        width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.2rem" }}>
            Lakshmi Vastra Studio
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.8rem", color: "var(--gold)", letterSpacing: "0.15em" }}>
            Shop Owner Portal
          </p>
        </div>

        <div style={{ display: "flex", borderBottom: "2px solid #eee", marginBottom: "1.5rem" }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "0.6rem", background: "none", border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: "0.85rem", textTransform: "capitalize",
              borderBottom: mode === m ? "2px solid var(--primary)" : "2px solid transparent",
              color: mode === m ? "var(--primary)" : "#888", marginBottom: -2,
            }}>
              {m === "login" ? "Sign In" : "Register Shop"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {mode === "register" && (
            <>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                  <User size={13} /> Your Name
                </label>
                <input value={form.name} onChange={set("name")} placeholder="Full name" required />
              </div>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                  <Store size={13} /> Shop Name
                </label>
                <input value={form.shop_name} onChange={set("shop_name")} placeholder="Your shop name" required />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", marginBottom: "0.3rem", display: "block" }}>Phone</label>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #ddd", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                  <span style={{ padding: "0.6rem 0.75rem", background: "#f7f3ef", borderRight: "1px solid #ddd", fontSize: "0.875rem", fontWeight: 700, color: "#6B5744", whiteSpace: "nowrap" }}>+91</span>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: stripPhone(e.target.value) }))} placeholder="XXXXX XXXXX" maxLength={10} style={{ border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
                </div>
              </div>
            </>
          )}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
              <Mail size={13} /> Email
            </label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="shop@email.com" required />
          </div>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
              <Lock size={13} /> Password
            </label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="Password" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
