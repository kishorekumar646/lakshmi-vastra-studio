import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api";
import toast from "react-hot-toast";

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
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.sub}>Lakshmi Vastra Studio</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label>Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#FDF8F0", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { background: "#fff", borderRadius: 12, padding: "2.5rem", width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.1)" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", color: "#8B1A1A", marginBottom: "0.25rem" },
  sub: { color: "#6B5744", fontSize: "0.9rem", marginBottom: "2rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
};
