import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { deliveryLogin } from "../api";
import toast from "react-hot-toast";
import { Lock, Mail } from "lucide-react";

export default function DeliveryLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #0a1628 0%, #0d2240 45%, #1a4080 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 8, padding: "2.5rem 2.25rem",
        width: "100%", maxWidth: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#1a4080", marginBottom: "0.2rem" }}>
            Lakshmi Vastra Studio
          </p>
          <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "#555", letterSpacing: "0.1em" }}>
            Delivery Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
              <Mail size={13} /> Email
            </label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" required />
          </div>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
              <Lock size={13} /> Password
            </label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="Password" required />
          </div>
          <button type="submit" disabled={loading}
            style={{
              width: "100%", marginTop: "0.5rem", padding: "0.75rem",
              background: "#1a4080", color: "#fff", border: "none", borderRadius: 6,
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
