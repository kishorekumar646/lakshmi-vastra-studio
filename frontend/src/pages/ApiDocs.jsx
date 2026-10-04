import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Colour palette per role ─────────────────────────────── */
const ROLES = {
  customer: { label: "Customer", color: "#7B1D45", light: "#FCE7F3", border: "#F9A8D4", emoji: "🛍️" },
  shop:     { label: "Shop Owner", color: "#1D4ED8", light: "#EFF6FF", border: "#BFDBFE", emoji: "🏪" },
  delivery: { label: "Delivery Person", color: "#065F46", light: "#D1FAE5", border: "#6EE7B7", emoji: "🚚" },
  admin:    { label: "Admin", color: "#92400E", light: "#FEF3C7", border: "#FCD34D", emoji: "⚙️" },
};

/* ── Workflow steps per role ──────────────────────────────── */
const WORKFLOWS = [
  {
    role: "customer",
    steps: [
      { icon: "👤", title: "Register / Login", desc: "Create account with email & password or continue with Google" },
      { icon: "🔍", title: "Browse Products", desc: "Filter by category, price range, handloom — instant SPA filtering" },
      { icon: "❤️", title: "Wishlist", desc: "Save favourite sarees for later" },
      { icon: "🛒", title: "Add to Cart", desc: "Add multiple products, adjust quantities" },
      { icon: "💳", title: "Checkout", desc: "Pay online via Razorpay or choose Cash on Delivery" },
      { icon: "📍", title: "Track Order", desc: "Real-time status timeline: Confirmed → Packed → Out for Delivery → Delivered" },
    ],
  },
  {
    role: "shop",
    steps: [
      { icon: "📝", title: "Register Shop", desc: "Submit shop name, contact details — awaits admin approval" },
      { icon: "✅", title: "Admin Approves", desc: "Admin reviews and activates the shop owner account" },
      { icon: "📦", title: "Manage Products", desc: "Add, edit or remove sarees with images, price, category" },
      { icon: "📋", title: "View Orders", desc: "See all orders assigned to this shop" },
      { icon: "📷", title: "Scan QR Code", desc: "Scan the order QR after packing — marks order as ready for pickup" },
      { icon: "🤝", title: "Handed Over", desc: "Admin assigns delivery person; shop hands off the parcel" },
    ],
  },
  {
    role: "delivery",
    steps: [
      { icon: "🔐", title: "Admin Creates Account", desc: "Admin sets up login credentials for the delivery person" },
      { icon: "📲", title: "Login", desc: "Access delivery dashboard with assigned orders" },
      { icon: "👀", title: "View Assignments", desc: "See orders assigned with customer address and contact" },
      { icon: "📷", title: "Scan QR at Pickup", desc: "Scan parcel QR from shop — marks order as picked up" },
      { icon: "🚴", title: "Out for Delivery", desc: "Order status updates to out for delivery in real time" },
      { icon: "✅", title: "Mark Delivered", desc: "Confirm delivery — customer notified, order closed" },
    ],
  },
  {
    role: "admin",
    steps: [
      { icon: "🔑", title: "Secure Login", desc: "Environment-variable credentials, JWT token — 7-day session" },
      { icon: "📊", title: "Dashboard Overview", desc: "Live counts: orders, revenue, customers, products" },
      { icon: "🏪", title: "Manage Shop Owners", desc: "Approve registrations, activate / deactivate accounts" },
      { icon: "🚚", title: "Manage Delivery", desc: "Create delivery persons, edit details, activate / deactivate" },
      { icon: "📦", title: "Process Orders", desc: "Confirm orders, assign delivery persons, monitor status" },
      { icon: "💰", title: "Payments Analytics", desc: "Total collected, monthly chart, per-order transaction table" },
    ],
  },
];

/* ── API endpoint groups ──────────────────────────────────── */
const ENDPOINTS = [
  {
    group: "Auth & Customers", color: "#7B1D45",
    items: [
      { method: "POST", path: "/api/auth/register", desc: "Register new customer" },
      { method: "POST", path: "/api/auth/login", desc: "Customer login → JWT" },
      { method: "POST", path: "/api/auth/google", desc: "Google OAuth login" },
      { method: "GET",  path: "/api/auth/me", desc: "Get current customer profile" },
      { method: "PUT",  path: "/api/auth/me", desc: "Update profile fields" },
    ],
  },
  {
    group: "Products & Categories", color: "#1D4ED8",
    items: [
      { method: "GET",    path: "/api/products", desc: "List all available products (with filters)" },
      { method: "GET",    path: "/api/products/{id}", desc: "Get single product detail" },
      { method: "POST",   path: "/api/products", desc: "Create product (admin)" },
      { method: "PUT",    path: "/api/products/{id}", desc: "Update product (admin)" },
      { method: "DELETE", path: "/api/products/{id}", desc: "Delete product (admin)" },
      { method: "GET",    path: "/api/categories", desc: "List all categories" },
    ],
  },
  {
    group: "Cart & Wishlist", color: "#065F46",
    items: [
      { method: "GET",    path: "/api/cart", desc: "Get customer cart" },
      { method: "POST",   path: "/api/cart", desc: "Add item to cart" },
      { method: "PUT",    path: "/api/cart/{id}", desc: "Update item quantity" },
      { method: "DELETE", path: "/api/cart/{id}", desc: "Remove item from cart" },
      { method: "GET",    path: "/api/wishlist", desc: "Get wishlist" },
      { method: "POST",   path: "/api/wishlist", desc: "Add to wishlist" },
      { method: "DELETE", path: "/api/wishlist/{id}", desc: "Remove from wishlist" },
    ],
  },
  {
    group: "Orders", color: "#6D28D9",
    items: [
      { method: "GET",  path: "/api/orders", desc: "List customer orders" },
      { method: "POST", path: "/api/orders/create", desc: "Create order (Razorpay / COD)" },
      { method: "POST", path: "/api/orders/verify", desc: "Verify Razorpay payment" },
      { method: "GET",  path: "/api/orders/{id}/track", desc: "Track order status timeline" },
      { method: "PUT",  path: "/api/orders/{id}/cancel", desc: "Cancel pending/confirmed order" },
    ],
  },
  {
    group: "Admin", color: "#92400E",
    items: [
      { method: "POST", path: "/api/admin/login", desc: "Admin login → JWT" },
      { method: "GET",  path: "/api/admin/dashboard", desc: "Overview stats" },
      { method: "GET",  path: "/api/admin/orders", desc: "Paginated order list with filters" },
      { method: "PUT",  path: "/api/admin/orders/{id}/confirm", desc: "Confirm order" },
      { method: "PUT",  path: "/api/admin/orders/{id}/assign-delivery", desc: "Assign delivery person" },
      { method: "GET",  path: "/api/admin/customers", desc: "All customers with details" },
      { method: "PUT",  path: "/api/admin/customers/{id}", desc: "Edit customer name/email" },
      { method: "GET",  path: "/api/admin/delivery-persons", desc: "List delivery persons" },
      { method: "POST", path: "/api/admin/delivery-persons", desc: "Create delivery person" },
      { method: "PUT",  path: "/api/admin/delivery-persons/{id}", desc: "Edit delivery person" },
      { method: "GET",  path: "/api/admin/payments", desc: "Payment analytics & transactions" },
    ],
  },
  {
    group: "Shop Owner", color: "#1D4ED8",
    items: [
      { method: "POST", path: "/api/shops/register", desc: "Register shop owner" },
      { method: "POST", path: "/api/shops/login", desc: "Shop owner login → JWT" },
      { method: "GET",  path: "/api/shops/orders", desc: "Orders for this shop" },
      { method: "GET",  path: "/api/shops/orders/{id}/qr", desc: "Generate QR for order" },
      { method: "POST", path: "/api/shops/orders/scan", desc: "Scan QR → mark ready for delivery" },
    ],
  },
  {
    group: "Delivery Person", color: "#065F46",
    items: [
      { method: "POST", path: "/api/delivery/login", desc: "Delivery person login → JWT" },
      { method: "GET",  path: "/api/delivery/orders", desc: "Assigned orders" },
      { method: "POST", path: "/api/delivery/orders/scan", desc: "Scan QR → mark picked up" },
      { method: "POST", path: "/api/delivery/orders/{id}/delivered", desc: "Mark order as delivered" },
    ],
  },
];

const METHOD_COLOR = {
  GET: { bg: "#D1FAE5", text: "#065F46" },
  POST: { bg: "#DBEAFE", text: "#1E40AF" },
  PUT: { bg: "#FEF3C7", text: "#92400E" },
  DELETE: { bg: "#FEE2E2", text: "#991B1B" },
};

/* ── Step node ────────────────────────────────────────────── */
function StepNode({ icon, title, color, index, active, done }) {
  const lit = active || done;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem",
      paddingTop: "0.75rem", /* room for badge */
    }}>
      {/* Circle */}
      <div style={{
        position: "relative",
        width: 62, height: 62,
      }}>
        {/* Outer glow ring — pulses when active */}
        {active && (
          <div style={{
            position: "absolute", inset: -6,
            borderRadius: "50%",
            background: `${color.color}22`,
            animation: "stepGlow 1.2s ease-in-out infinite",
          }} />
        )}
        <div style={{
          width: 62, height: 62, borderRadius: "50%",
          background: lit ? color.light : "#F1F5F9",
          border: `2.5px solid ${lit ? color.color : "#CBD5E1"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.55rem",
          boxShadow: active
            ? `0 0 0 4px ${color.color}30, 0 0 20px ${color.color}50`
            : done
            ? `0 0 0 3px ${color.color}20`
            : "none",
          transition: "all 0.5s ease",
          filter: lit ? "none" : "grayscale(0.6) opacity(0.5)",
        }}>
          {icon}
        </div>
        {/* Step number badge — outside the circle to avoid clipping */}
        <div style={{
          position: "absolute", top: -4, right: -4,
          width: 22, height: 22, borderRadius: "50%",
          background: lit ? color.color : "#94A3B8",
          color: "#fff", fontSize: "0.65rem", fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: lit ? `0 0 8px ${color.color}88` : "none",
          transition: "all 0.4s ease",
          border: "2px solid #fff",
          zIndex: 2,
        }}>{index + 1}</div>
      </div>
      <p style={{
        margin: 0, fontWeight: 700, fontSize: "0.78rem",
        color: lit ? "#0F172A" : "#94A3B8",
        textAlign: "center", maxWidth: 100,
        transition: "color 0.4s ease",
      }}>{title}</p>
    </div>
  );
}

/* ── Glowing connector ────────────────────────────────────── */
function GlowArrow({ color, lit }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", flexShrink: 0,
      marginTop: "0.75rem", /* align with circle centers */
    }}>
      {/* Line */}
      <div style={{
        position: "relative", width: 48, height: 3, borderRadius: 3, overflow: "hidden",
        background: lit ? `${color}44` : "#E2E8F0",
        transition: "background 0.4s ease",
      }}>
        {lit && (
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%", width: "100%",
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animation: "flowLight 1.4s ease-in-out infinite",
          }} />
        )}
      </div>
      {/* Arrowhead */}
      <div style={{
        width: 0, height: 0,
        borderTop: "6px solid transparent",
        borderBottom: "6px solid transparent",
        borderLeft: `9px solid ${lit ? color : "#E2E8F0"}`,
        filter: lit ? `drop-shadow(0 0 4px ${color}99)` : "none",
        transition: "border-left-color 0.4s ease, filter 0.4s ease",
      }} />
    </div>
  );
}

/* ── Tabbed workflow ──────────────────────────────────────── */
function WorkflowTabs() {
  const [activeRole, setActiveRole] = useState("customer");
  const [litStep, setLitStep] = useState(-1);

  useEffect(() => {
    const wf = WORKFLOWS.find((w) => w.role === activeRole);
    const total = wf.steps.length;
    setLitStep(-1);

    let step = 0;
    let tid;

    function next() {
      setLitStep(step);
      step++;
      if (step < total) {
        tid = setTimeout(next, 3000);
      } else {
        // pause then restart
        tid = setTimeout(() => {
          setLitStep(-1);
          step = 0;
          tid = setTimeout(next, 800);
        }, 3000);
      }
    }

    tid = setTimeout(next, 400);
    return () => clearTimeout(tid);
  }, [activeRole]);

  const wf = WORKFLOWS.find((w) => w.role === activeRole);
  const role = ROLES[activeRole];

  return (
    <div>
      {/* Tab pills */}
      <div style={{
        display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.75rem",
        background: "#F1F5F9", borderRadius: 14, padding: "0.4rem",
      }}>
        {WORKFLOWS.map((w) => {
          const r = ROLES[w.role];
          const active = activeRole === w.role;
          return (
            <button key={w.role} onClick={() => setActiveRole(w.role)} style={{
              flex: 1, minWidth: 110,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              padding: "0.55rem 0.75rem", borderRadius: 10, border: "none", cursor: "pointer",
              background: active ? "#fff" : "transparent",
              color: active ? r.color : "#64748B",
              fontWeight: active ? 800 : 600, fontSize: "0.82rem",
              boxShadow: active ? `0 2px 10px ${r.color}22, 0 1px 4px rgba(0,0,0,0.08)` : "none",
              borderBottom: active ? `3px solid ${r.color}` : "3px solid transparent",
              transition: "all 0.25s ease",
            }}>
              <span style={{ fontSize: "1rem" }}>{r.emoji}</span>
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "2rem",
        border: `1.5px solid ${role.border}`,
        boxShadow: `0 4px 28px ${role.color}18`,
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: role.light, border: `2px solid ${role.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
            boxShadow: `0 4px 12px ${role.color}20`,
          }}>{role.emoji}</div>
          <div>
            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: role.color }}>{role.label} Journey</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>{wf.steps.length} steps · watch the flow animate</p>
          </div>
          {/* Live step counter */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {wf.steps.map((_, i) => (
              <div key={i} style={{
                width: i === litStep ? 22 : 8,
                height: 8, borderRadius: 4,
                background: i <= litStep ? role.color : "#E2E8F0",
                boxShadow: i === litStep ? `0 0 8px ${role.color}88` : "none",
                transition: "all 0.4s ease",
              }} />
            ))}
          </div>
        </div>

        {/* Step flow row — scrollable */}
        <div style={{ overflowX: "auto", paddingBottom: "0.75rem", paddingTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", minWidth: "max-content" }}>
            {wf.steps.map((step, i) => (
              <div key={`${activeRole}-${i}`} style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 120, flexShrink: 0, overflow: "visible" }}>
                  <StepNode
                    {...step}
                    color={role}
                    index={i}
                    active={litStep === i}
                    done={litStep > i}
                  />
                </div>
                {i < wf.steps.length - 1 && (
                  <GlowArrow color={role.color} lit={litStep > i} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Description cards */}
        <div style={{ marginTop: "1.75rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.75rem" }}>
          {wf.steps.map((step, i) => {
            const lit = litStep >= i;
            return (
              <div key={i} style={{
                background: lit ? role.light : "#F8FAFC",
                borderRadius: 10, padding: "0.75rem 1rem",
                border: `1px solid ${lit ? role.border : "#E2E8F0"}`,
                boxShadow: lit ? `0 2px 10px ${role.color}15` : "none",
                transition: "all 0.5s ease",
              }}>
                <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.78rem", color: lit ? role.color : "#94A3B8", transition: "color 0.4s" }}>
                  {i + 1}. {step.title}
                </p>
                <p style={{ margin: 0, fontSize: "0.71rem", color: lit ? "#475569" : "#CBD5E1", lineHeight: 1.5, transition: "color 0.4s" }}>{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function ApiDocs() {
  const [visible, setVisible] = useState(false);
  const [activeEndpointGroup, setActiveEndpointGroup] = useState(0);

  useEffect(() => {
    document.title = "API Documentation | Lakshmi Vastra Studio";
    const t = setTimeout(() => setVisible(true), 100);
    return () => {
      clearTimeout(t);
      document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear";
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #0D0611 0%, #28092A 50%, #7B1D45 100%)",
        padding: "5rem 1.5rem 4rem", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: `${[300, 200, 150, 120, 80][i]}px`,
            height: `${[300, 200, 150, 120, 80][i]}px`,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.05)",
            top: `${[-60, 20, 60, -20, 40][i]}px`,
            left: `${[-80, "auto", 100, "auto", "auto"][i]}`,
            right: `${["auto", -60, "auto", 80, 200][i]}`,
            animation: `spin ${[40, 30, 25, 20, 15][i]}s linear infinite`,
          }} />
        ))}

        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 24, padding: "0.35rem 1rem", marginBottom: "1.5rem",
            fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.8)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", animation: "pulse 2s infinite", display: "inline-block" }} />
            API v1 · REST · JWT Auth
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, color: "#fff",
            margin: "0 0 1rem", letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>
            Lakshmi Vastra Studio
            <span style={{ display: "block", background: "linear-gradient(90deg, #F9A8D4, #FCD34D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              API Documentation
            </span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.05rem", lineHeight: 1.7, margin: "0 0 2rem", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            A full-stack saree e-commerce platform built with <strong style={{ color: "#fff" }}>React</strong> + <strong style={{ color: "#fff" }}>FastAPI</strong> + <strong style={{ color: "#fff" }}>PostgreSQL</strong>. Supports four distinct user roles — customers, shop owners, delivery persons, and admins — each with their own authentication and workflow.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "#fff", color: "#7B1D45", padding: "0.7rem 1.5rem",
              borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)", transition: "transform 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              📄 Swagger UI
            </a>
            <a href={`${API_URL}/redoc`} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(255,255,255,0.12)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.25)",
              padding: "0.7rem 1.5rem", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
              transition: "transform 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              📖 ReDoc
            </a>
          </div>
        </div>
      </div>

      {/* ── Tech Stack chips ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "FastAPI", color: "#059669" },
            { label: "PostgreSQL", color: "#2563EB" },
            { label: "SQLAlchemy", color: "#DC2626" },
            { label: "React 18", color: "#0EA5E9" },
            { label: "Vite", color: "#7C3AED" },
            { label: "JWT Auth", color: "#D97706" },
            { label: "Razorpay", color: "#2563EB" },
            { label: "Cloudinary", color: "#0284C7" },
            { label: "Render", color: "#10B981" },
            { label: "Supabase", color: "#3ECF8E" },
          ].map(({ label, color }) => (
            <span key={label} style={{
              padding: "0.3rem 0.85rem", borderRadius: 20,
              background: color + "18", color, border: `1px solid ${color}44`,
              fontSize: "0.8rem", fontWeight: 700,
            }}>{label}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* ── Overview cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "3.5rem" }}>
          {Object.entries(ROLES).map(([key, r], i) => (
            <div key={key} style={{
              background: "#fff", borderRadius: 12, padding: "1.5rem",
              border: `1px solid ${r.border}`,
              boxShadow: `0 2px 12px ${r.color}12`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{r.emoji}</div>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 800, fontSize: "1rem", color: r.color }}>{r.label}</p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748B" }}>
                {key === "customer" && "Browse, cart, checkout, track orders"}
                {key === "shop" && "Manage products, pack & scan orders"}
                {key === "delivery" && "Pick up & deliver assigned orders"}
                {key === "admin" && "Full control — users, orders, analytics"}
              </p>
            </div>
          ))}
        </div>

        {/* ── Workflow diagrams ── */}
        <div style={{ marginBottom: "3.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#7B1D45", textTransform: "uppercase", letterSpacing: "0.1em" }}>How it works</span>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", margin: "0.4rem 0 0.5rem" }}>User Workflow Architecture</h2>
            <p style={{ color: "#64748B", fontSize: "0.88rem", margin: 0 }}>Select a role to explore its step-by-step journey</p>
          </div>
          <WorkflowTabs />
        </div>

        {/* ── API Reference ── */}
        <div>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#7B1D45", textTransform: "uppercase", letterSpacing: "0.1em" }}>Reference</span>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", margin: "0.4rem 0 0.5rem" }}>API Endpoints</h2>
            <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Select a group — protected routes require a Bearer token.</p>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
              {ENDPOINTS.map((group, gi) => {
                const active = activeEndpointGroup === gi;
                return (
                  <button key={gi} onClick={() => setActiveEndpointGroup(gi)} style={{
                    flex: 1, padding: "0.85rem 0.75rem",
                    background: "none", border: "none", cursor: "pointer",
                    borderBottom: active ? `3px solid ${group.color}` : "3px solid transparent",
                    color: active ? group.color : "#64748B",
                    fontWeight: active ? 800 : 500, fontSize: "0.8rem",
                    whiteSpace: "nowrap", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? group.color : "#CBD5E1", flexShrink: 0, transition: "background 0.2s" }} />
                    {group.group}
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 20,
                      background: active ? group.color + "18" : "#E2E8F0",
                      color: active ? group.color : "#94A3B8", transition: "all 0.2s",
                    }}>{group.items.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Active group endpoint rows */}
            {(() => {
              const group = ENDPOINTS[activeEndpointGroup];
              return (
                <div>
                  {/* Group header */}
                  <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: "0.75rem", background: group.color + "08" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: group.color }} />
                    <span style={{ fontWeight: 800, fontSize: "0.95rem", color: group.color }}>{group.group}</span>
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{group.items.length} endpoints</span>
                  </div>

                  {group.items.map((ep, ei) => {
                    const mc = METHOD_COLOR[ep.method];
                    return (
                      <div key={ei} style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "0.85rem 1.5rem",
                        borderBottom: ei < group.items.length - 1 ? "1px solid #F8FAFC" : "none",
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{
                          minWidth: 56, textAlign: "center", padding: "0.25rem 0.5rem",
                          borderRadius: 6, fontSize: "0.7rem", fontWeight: 800,
                          background: mc.bg, color: mc.text, letterSpacing: "0.04em", flexShrink: 0,
                        }}>{ep.method}</span>
                        <code style={{
                          fontSize: "0.83rem", fontFamily: "monospace",
                          color: group.color, fontWeight: 600, flexShrink: 0,
                          background: group.color + "0D", padding: "0.2rem 0.5rem", borderRadius: 5,
                        }}>{ep.path}</code>
                        <span style={{ fontSize: "0.83rem", color: "#64748B", flex: 1 }}>{ep.desc}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Auth guide ── */}
        <div style={{ marginTop: "3rem", background: "#fff", borderRadius: 16, padding: "2rem", border: "1px solid #E2E8F0" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontWeight: 800, color: "#0F172A", fontSize: "1.1rem" }}>🔐 Authentication Guide</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {[
              { role: "Customer", token: "customer_token", header: "Bearer <token>", color: "#7B1D45" },
              { role: "Shop Owner", token: "shop_token", header: "Bearer <token>", color: "#1D4ED8" },
              { role: "Delivery", token: "delivery_token", header: "Bearer <token>", color: "#065F46" },
              { role: "Admin", token: "admin_token", header: "Bearer <token>", color: "#92400E" },
            ].map(({ role, token, header, color }) => (
              <div key={role} style={{ background: "#F8FAFC", borderRadius: 10, padding: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.85rem", color }}>{role}</p>
                <code style={{ fontSize: "0.75rem", color: "#475569", display: "block", marginBottom: "0.25rem" }}>localStorage: <strong>{token}</strong></code>
                <code style={{ fontSize: "0.75rem", color: "#475569" }}>Header: <strong>Authorization: {header}</strong></code>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: "#FEF3C7", borderRadius: 8, border: "1px solid #FCD34D", fontSize: "0.82rem", color: "#92400E" }}>
            <strong>Token expiry:</strong> All tokens are valid for <strong>7 days</strong>. The interceptor in <code>api.js</code> automatically attaches the correct token based on the request URL prefix (<code>/api/admin</code>, <code>/api/shops</code>, <code>/api/delivery</code>, or customer routes).
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", marginTop: "3rem", padding: "2rem 0", borderTop: "1px solid #E2E8F0", color: "#94A3B8", fontSize: "0.82rem" }}>
          <p style={{ margin: "0 0 0.5rem" }}>Built with ❤️ for <strong style={{ color: "#7B1D45" }}>Lakshmi Vastra Studio</strong></p>
          <p style={{ margin: 0 }}>
            <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" style={{ color: "#7B1D45", fontWeight: 600, textDecoration: "none" }}>Swagger UI</a>
            {" · "}
            <a href={`${API_URL}/redoc`} target="_blank" rel="noopener noreferrer" style={{ color: "#7B1D45", fontWeight: 600, textDecoration: "none" }}>ReDoc</a>
            {" · "}
            <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer" style={{ color: "#7B1D45", fontWeight: 600, textDecoration: "none" }}>Health Check</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes stepGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.18); opacity: 1; }
        }
        @keyframes flowLight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
