import { useEffect, useState } from "react";
import { getAdminDashboard } from "../api";
import {
  ShoppingBag, Users, Package, TrendingUp,
  Clock, CheckCircle, Star, MessageSquare, CreditCard, Banknote,
} from "lucide-react";

// ── Tiny SVG bar chart ────────────────────────────────────────────────────────
function BarChart({ data, valueKey = "value", labelKey = "label", color = "#7B1D45", height = 160 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const W = 560, H = height, PAD_L = 8, PAD_B = 28, BAR_GAP = 6;
  const barW = Math.floor((W - PAD_L - BAR_GAP * (data.length - 1)) / data.length);

  return (
    <svg viewBox={`0 0 ${W} ${H + PAD_B}`} style={{ width: "100%", display: "block", overflow: "visible" }}>
      {data.map((d, i) => {
        const barH = Math.max(4, ((d[valueKey] / max) * H));
        const x = PAD_L + i * (barW + BAR_GAP);
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} fillOpacity={0.85} />
            <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize={9.5} fill="#888" fontFamily="sans-serif">
              {String(d[labelKey]).slice(0, 12)}
            </text>
            <title>{d[labelKey]}: {d[valueKey]}</title>
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG line / area chart ─────────────────────────────────────────────────────
function LineChart({ data, valueKey = "value", labelKey = "label", color = "#7B1D45" }) {
  if (data.length < 2) return (
    <div style={{ textAlign: "center", padding: "2rem", color: "#bbb", fontSize: "0.85rem" }}>Not enough data yet</div>
  );
  const W = 560, H = 130, PAD = { t: 10, r: 10, b: 28, l: 44 };
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r),
    y: PAD.t + (1 - d[valueKey] / max) * (H - PAD.t - PAD.b),
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${pts[pts.length - 1].x.toFixed(1)},${H - PAD.b} L${pts[0].x.toFixed(1)},${H - PAD.b} Z`;

  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => ({
    val: Math.round((max * i) / tickCount),
    y: PAD.t + (1 - i / tickCount) * (H - PAD.t - PAD.b),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={t.y} x2={W - PAD.r} y2={t.y} stroke="#eee" strokeWidth={1} />
          <text x={PAD.l - 5} y={t.y + 4} textAnchor="end" fontSize={9} fill="#aaa" fontFamily="sans-serif">
            {t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
          </text>
        </g>
      ))}
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill={color} />
          <text x={p.x} y={H - PAD.b + 16} textAnchor="middle" fontSize={9.5} fill="#888" fontFamily="sans-serif">
            {data[i][labelKey]}
          </text>
          <title>{data[i][labelKey]}: ₹{data[i][valueKey].toLocaleString("en-IN")}</title>
        </g>
      ))}
    </svg>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <div style={{ textAlign: "center", padding: "2rem", color: "#bbb", fontSize: "0.85rem" }}>No orders yet</div>;
  const CX = 80, CY = 80, R = 64, r = 38;
  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const start = angle;
    const sweep = (d.count / total) * 2 * Math.PI;
    angle += sweep;
    const x1 = CX + R * Math.cos(start), y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(start + sweep), y2 = CY + R * Math.sin(start + sweep);
    const xi1 = CX + r * Math.cos(start), yi1 = CY + r * Math.sin(start);
    const xi2 = CX + r * Math.cos(start + sweep), yi2 = CY + r * Math.sin(start + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${xi2},${yi2} A${r},${r} 0 ${large} 0 ${xi1},${yi1} Z`;
    return { ...d, path };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
      <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} style={{ width: 130, flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color}><title>{s.label}: {s.count}</title></path>)}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ color: "#555" }}>{d.label}</span>
            <span style={{ fontWeight: 700, color: "#333", marginLeft: "auto", paddingLeft: "0.75rem" }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color = "#7B1D45", accent = "#fff0f5" }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem 1.4rem", border: "1px solid var(--border-light)", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{label}</p>
        <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "0.25rem" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, children, style }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "1.4rem 1.6rem", border: "1px solid var(--border-light)", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", ...style }}>
      <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#333", marginBottom: "1.25rem", letterSpacing: "0.01em" }}>{title}</p>
      {children}
    </div>
  );
}

const STATUS_COLORS = {
  pending:            "#f59e0b",
  confirmed:          "#3b82f6",
  ready_for_delivery: "#8b5cf6",
  picked_up:          "#ec4899",
  delivered:          "#10b981",
};

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function AdminDashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboard()
      .then((r) => setData(r.data))
      .catch((err) => {
        const detail = err.response?.data?.detail || err.message || "Unknown error";
        setError(detail);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "1.4rem", height: 90, border: "1px solid var(--border-light)" }}>
          <span className="skeleton" style={{ height: 12, width: "40%", display: "block", marginBottom: "0.75rem" }} />
          <span className="skeleton" style={{ height: 24, width: "60%", display: "block" }} />
        </div>
      ))}
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
      <TrendingUp size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
      <p style={{ marginBottom: "0.5rem" }}>Could not load dashboard data.</p>
      {error && (
        <p style={{ fontSize: "0.8rem", color: "#e55", background: "#fff5f5", border: "1px solid #fcc", borderRadius: 6, padding: "0.5rem 1rem", display: "inline-block", marginTop: "0.5rem", fontFamily: "monospace" }}>
          {error}
        </p>
      )}
    </div>
  );

  const { summary, orders_by_status, top_products, monthly_revenue, rating_distribution, recent_orders, payment_split } = data;

  const donutData = orders_by_status.map((d) => ({
    label: d.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    count: d.count,
    color: STATUS_COLORS[d.status] || "#ccc",
  }));

  const ratingTotal = rating_distribution.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        <StatCard label="Total Revenue" value={fmt(summary.total_revenue)} sub="From confirmed+ orders" icon={TrendingUp} color="#7B1D45" accent="#fff0f5" />
        <StatCard label="Total Orders" value={summary.total_orders} sub={`${summary.pending_orders} pending`} icon={ShoppingBag} color="#3b82f6" accent="#eff6ff" />
        <StatCard label="Delivered" value={summary.delivered_orders} sub="Successfully delivered" icon={CheckCircle} color="#10b981" accent="#ecfdf5" />
        <StatCard label="Customers" value={summary.total_customers} sub="Registered accounts" icon={Users} color="#8b5cf6" accent="#f5f3ff" />
        <StatCard label="Products" value={summary.total_products} sub="In catalogue" icon={Package} color="#f59e0b" accent="#fffbeb" />
        <StatCard label="Avg Rating" value={`${summary.avg_rating} ★`} sub={`${summary.total_reviews} reviews`} icon={Star} color="#f59e0b" accent="#fffbeb" />
        <StatCard label="Unread Inquiries" value={summary.unread_inquiries} sub="Need your response" icon={MessageSquare} color="#ec4899" accent="#fdf2f8" />
        <StatCard label="Pending Orders" value={summary.pending_orders} sub="Awaiting confirmation" icon={Clock} color="#ef4444" accent="#fef2f2" />
      </div>

      {/* ── Revenue line chart + Donut ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
        <ChartCard title="Monthly Revenue (last 6 months)">
          {monthly_revenue.length >= 2 ? (
            <>
              <LineChart data={monthly_revenue} valueKey="revenue" labelKey="month" color="#7B1D45" />
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                {monthly_revenue.map((m, i) => (
                  <div key={i} style={{ fontSize: "0.75rem", color: "#888" }}>
                    <span style={{ fontWeight: 700, color: "#333" }}>{m.month}</span>
                    <br />{fmt(m.revenue)}<br />{m.orders} orders
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "2.5rem", color: "#bbb", fontSize: "0.85rem" }}>
              Revenue data will appear once orders are placed and confirmed.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Orders by Status" style={{ minWidth: 260 }}>
          <DonutChart data={donutData} />
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #f0f0f0" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Payment Method</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                <CreditCard size={13} color="#3b82f6" />
                <span style={{ color: "#555" }}>Online:</span>
                <strong>{payment_split.online}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                <Banknote size={13} color="#10b981" />
                <span style={{ color: "#555" }}>COD:</span>
                <strong>{payment_split.cod}</strong>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Top products bar chart + Rating distribution ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1rem", alignItems: "start" }}>
        <ChartCard title="Top Products by Units Sold">
          {top_products.length ? (
            <>
              <BarChart data={top_products} valueKey="units" labelKey="name" color="#7B1D45" height={140} />
              <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {top_products.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#666" }}>
                    <span>{i + 1}. {p.name}</span>
                    <span style={{ fontWeight: 600, color: "#333" }}>{p.units} units · {fmt(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "2.5rem", color: "#bbb", fontSize: "0.85rem" }}>
              Top products appear once orders are placed.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Rating Distribution">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {rating_distribution.map((d) => (
              <div key={d.stars} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "0.78rem", color: "#666", width: 36, flexShrink: 0 }}>{d.stars} ★</span>
                <div style={{ flex: 1, background: "#f5f5f5", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${(d.count / ratingTotal) * 100}%`, height: "100%", background: d.stars >= 4 ? "#10b981" : d.stars === 3 ? "#f59e0b" : "#ef4444", borderRadius: 4, transition: "width 0.5s ease" }} />
                </div>
                <span style={{ fontSize: "0.75rem", color: "#aaa", width: 24, textAlign: "right", flexShrink: 0 }}>{d.count}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Star size={16} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#333" }}>{summary.avg_rating}</span>
            <span style={{ fontSize: "0.78rem", color: "#aaa" }}>avg from {summary.total_reviews} reviews</span>
          </div>
        </ChartCard>
      </div>

      {/* ── Recent orders table ── */}
      <ChartCard title="Recent Orders">
        {recent_orders.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                  {["Order", "Customer", "Amount", "Payment", "Status", "Date"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#aaa", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent_orders.map((o) => {
                  const sc = STATUS_COLORS[o.status] || "#888";
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={{ padding: "0.7rem 0.75rem", fontWeight: 700, color: "#333" }}>#{o.id}</td>
                      <td style={{ padding: "0.7rem 0.75rem", color: "#555" }}>{o.customer}</td>
                      <td style={{ padding: "0.7rem 0.75rem", fontWeight: 600, color: "#7B1D45" }}>{fmt(o.total)}</td>
                      <td style={{ padding: "0.7rem 0.75rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#666" }}>
                          {o.payment_method === "cod" ? <><Banknote size={12} /> COD</> : <><CreditCard size={12} /> Online</>}
                        </span>
                      </td>
                      <td style={{ padding: "0.7rem 0.75rem" }}>
                        <span style={{ background: sc + "18", color: sc, padding: "0.2rem 0.6rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ padding: "0.7rem 0.75rem", color: "#aaa", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                        {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "#bbb", fontSize: "0.85rem" }}>No orders yet.</div>
        )}
      </ChartCard>
    </div>
  );
}
