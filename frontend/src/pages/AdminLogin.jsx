import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api";
import toast from "react-hot-toast";
import { Lock, User } from "lucide-react";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin(form.username, form.password);
      localStorage.setItem("admin_token", res.data.access_token);
      navigate("/admin");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #0D0611 0%, #28092A 45%, #7B1D45 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 6,
        padding: "2.75rem 2.5rem",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--primary)",
            marginBottom: "0.2rem",
          }}>
            Lakshmi Vastra Studio
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: "var(--gold)",
            letterSpacing: "0.15em",
          }}>
            Admin Portal
          </p>
        </div>

        <div style={{ width: 40, height: 1, background: "var(--gold)", margin: "0 auto 2rem", opacity: 0.5 }} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <User size={13} /> Username
            </label>
            <input
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Lock size={13} /> Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
