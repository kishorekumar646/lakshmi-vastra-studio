import { useState } from "react";
import { BookOpen, HelpCircle, PlayCircle, Headphones, ExternalLink, Search, ChevronDown, ChevronUp, X, ArrowLeft } from "lucide-react";

const _buildPortal = import.meta.env.VITE_PORTAL;

function detectPortal() {
  const urlPortal = new URLSearchParams(window.location.search).get("app");
  if (urlPortal) return urlPortal;
  if (_buildPortal) return _buildPortal;
  if (localStorage.getItem("admin_token"))    return "admin";
  if (localStorage.getItem("shop_token"))     return "shop";
  if (localStorage.getItem("delivery_token")) return "delivery";
  return "customer";
}

// ── Portal config ─────────────────────────────────────────────────────────────
const PORTAL_CONFIG = {
  shop: {
    label: "Shop Owner Portal",
    heading: "Shop Owner Help Center",
    sub: "Guides for managing your shop, products, orders, and account settings.",
    faqCategories: ["Shop Owners", "Account & Security"],
    accent: "#7B1D45",
    gradient: "linear-gradient(160deg, #1A0812 0%, #5a1030 50%, #3a0820 100%)",
  },
  delivery: {
    label: "Delivery Portal",
    heading: "Delivery Partner Help Center",
    sub: "Guides for pickups, deliveries, earnings, and profile setup.",
    faqCategories: ["Delivery Partners", "Account & Security"],
    accent: "#0f2460",
    gradient: "linear-gradient(160deg, #0A1628 0%, #0f2460 60%, #091020 100%)",
  },
  admin: {
    label: "Admin Portal",
    heading: "Admin Help Center",
    sub: "Platform management, shop approvals, orders, and reporting.",
    faqCategories: ["Orders", "Shop Owners", "Delivery Partners", "Account & Security"],
    accent: "#1A0812",
    gradient: "linear-gradient(160deg, #0F080D 0%, #2a1020 60%, #1A0812 100%)",
  },
  customer: {
    label: "Customer Support",
    heading: "How can we help you?",
    sub: "Search guides and FAQs for orders, payments, tracking, and your account.",
    faqCategories: ["Orders", "Account & Security"],
    accent: "#7B1D45",
    gradient: "linear-gradient(160deg, #1A0812 0%, #5a1030 50%, #3a0820 100%)",
  },
};

// cfg, resources and faq are derived inside the component (see below)

// ── All FAQ data ───────────────────────────────────────────────────────────────
const ALL_FAQ = [
  {
    category: "Orders",
    items: [
      { q: "How do I place an order?", a: "Browse products in the Shop section, add items to your cart, and proceed to checkout. You can pay via Razorpay (UPI, cards, net banking, wallets) or Cash on Delivery." },
      { q: "How do I track my order?", a: "Go to My Account → Orders, or use the Track Order page with your order ID. You'll see real-time status updates from confirmation through delivery." },
      { q: "Can I cancel my order?", a: "Orders can be cancelled before they are marked 'Ready for Delivery'. Once picked up by a delivery partner, cancellation is not possible. Contact support for assistance." },
      { q: "What payment methods are accepted?", a: "We accept Razorpay (UPI, cards, net banking, wallets) and Cash on Delivery (COD) for eligible pincodes." },
      { q: "Why was my payment debited but order not placed?", a: "This can happen due to a network interruption. The amount is automatically refunded within 5–7 business days. Contact support with your transaction ID if it doesn't appear." },
    ],
  },
  {
    category: "Shop Owners",
    items: [
      { q: "How do I register as a shop owner?", a: "Click 'Register' on the Shop Login page, fill in your details, and submit. An admin will review and approve your account within 24 hours." },
      { q: "How do I add products to my shop?", a: "In your Shop Dashboard, go to the Products tab and click 'Add Product'. Upload multiple images, set price, category, and attributes like handloom or custom orders." },
      { q: "How do I mark an order as ready for pickup?", a: "In the Orders tab, click 'View QR Code' on a confirmed order. Show the QR to the delivery partner to scan — this marks the order as Ready for Delivery." },
      { q: "How do I update my bank details for payments?", a: "Go to Account → Bank Details section. Enter your account holder name, bank name, account number, IFSC code, and account type, then click Save Changes." },
      { q: "Can I search or filter my orders?", a: "Yes. In the Orders tab, use the search bar to find by order ID or customer name, and use the status filter pills to view specific order statuses." },
      { q: "Can I change my shop name or contact details?", a: "Yes. Go to Account → Shop Details, update the fields, and click Save Changes. Changes take effect immediately." },
    ],
  },
  {
    category: "Delivery Partners",
    items: [
      { q: "How do I complete my profile to start receiving orders?", a: "Log in to the Delivery Portal, go to Account, and fill in Vehicle Details, KYC Documents (Driving Licence + PAN with images), and Bank Details. Your profile completion percentage shows what's still missing." },
      { q: "How do I pick up an order?", a: "When an order is assigned, go to the Orders tab. Ask the shop owner to show their QR code, then tap 'Scan QR'. This marks the order as Picked Up and generates a delivery OTP." },
      { q: "How do I confirm delivery?", a: "After pickup, ask the customer for the 4-digit OTP shown in their app. Enter it in the Deliver Order screen to mark the delivery complete." },
      { q: "How are my earnings calculated?", a: "You earn a fixed amount per successfully delivered order. Your Account tab shows today's, this week's, and total earnings in real time." },
      { q: "What if I can't deliver an order?", a: "Contact your admin immediately with the order ID. Do not mark an order as delivered without OTP confirmation. Unauthorized changes may affect your account." },
      { q: "How do I update my vehicle or KYC documents?", a: "Go to Account → Vehicle Details or KYC Documents. Update fields and/or upload new document images, then click Save Changes." },
    ],
  },
  {
    category: "Account & Security",
    items: [
      { q: "How do I change my password?", a: "Go to Account → Change Password. Enter your current password, then a new password (minimum 6 characters), and click Update Password." },
      { q: "Is my bank information secure?", a: "Yes. Bank details are stored securely and used only for payment settlement. We never share your financial data with third parties." },
      { q: "How do I update my profile photo?", a: "On the Account page, tap your profile photo and select a new image. It uploads automatically to our secure cloud storage." },
      { q: "What should I do if I forget my password?", a: "Contact your admin to reset your password. Shop owners and delivery partners can have passwords reset by the platform administrator." },
    ],
  },
];

// ── Resources per portal ───────────────────────────────────────────────────────
const ALL_RESOURCES = {
  shop: [
    { icon: <HelpCircle size={22} strokeWidth={1.8} />, color: "#7B1D45", bg: "rgba(123,29,69,0.1)", title: "FAQ", desc: "Answers for product management, order workflows, QR scanning, and account settings.", linkLabel: "Browse FAQ", scroll: true },
    { icon: <BookOpen size={22} strokeWidth={1.8} />, color: "#0f2460", bg: "rgba(15,36,96,0.1)", title: "Shop Setup Guide", desc: "Step-by-step guide to registering, adding products, and managing your online shop.", linkLabel: "Open Guide", href: "#docs" },
    { icon: <PlayCircle size={22} strokeWidth={1.8} />, color: "#0e7490", bg: "rgba(14,116,144,0.1)", title: "Video Tutorials", desc: "Watch how-to videos: adding products, scanning QR codes, and managing orders.", linkLabel: "Watch Videos", href: "#tutorials" },
    { icon: <Headphones size={22} strokeWidth={1.8} />, color: "#7c3aed", bg: "rgba(124,58,237,0.1)", title: "Contact Support", desc: "Reach our team via WhatsApp. We respond within 24 hours on business days.", linkLabel: "Open WhatsApp", href: `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210"}`, external: true },
  ],
  delivery: [
    { icon: <HelpCircle size={22} strokeWidth={1.8} />, color: "#0f2460", bg: "rgba(15,36,96,0.1)", title: "FAQ", desc: "Answers for pickups, deliveries, OTP confirmation, earnings, and KYC setup.", linkLabel: "Browse FAQ", scroll: true },
    { icon: <BookOpen size={22} strokeWidth={1.8} />, color: "#0e7490", bg: "rgba(14,116,144,0.1)", title: "Getting Started Guide", desc: "How to complete your profile, get assigned orders, and start earning.", linkLabel: "Open Guide", href: "#docs" },
    { icon: <PlayCircle size={22} strokeWidth={1.8} />, color: "#7c3aed", bg: "rgba(124,58,237,0.1)", title: "Video Tutorials", desc: "Watch step-by-step: QR scan at pickup, OTP delivery confirmation, earnings dashboard.", linkLabel: "Watch Videos", href: "#tutorials" },
    { icon: <Headphones size={22} strokeWidth={1.8} />, color: "#16a34a", bg: "rgba(22,163,74,0.1)", title: "Contact Support", desc: "Reach our team via WhatsApp. We respond within 24 hours on business days.", linkLabel: "Open WhatsApp", href: `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210"}`, external: true },
  ],
  admin: [
    { icon: <HelpCircle size={22} strokeWidth={1.8} />, color: "#1A0812", bg: "rgba(26,8,18,0.08)", title: "FAQ", desc: "Answers covering shop approvals, order management, delivery assignment, and analytics.", linkLabel: "Browse FAQ", scroll: true },
    { icon: <BookOpen size={22} strokeWidth={1.8} />, color: "#0f2460", bg: "rgba(15,36,96,0.1)", title: "Admin Guide", desc: "Full documentation for managing shops, delivery partners, pincodes, and payments.", linkLabel: "Open Guide", href: "#docs" },
    { icon: <PlayCircle size={22} strokeWidth={1.8} />, color: "#0e7490", bg: "rgba(14,116,144,0.1)", title: "Video Tutorials", desc: "Watch how-to videos for the admin panel: approvals, assignments, and reporting.", linkLabel: "Watch Videos", href: "#tutorials" },
    { icon: <Headphones size={22} strokeWidth={1.8} />, color: "#7c3aed", bg: "rgba(124,58,237,0.1)", title: "Contact Support", desc: "Reach our engineering team for platform-level issues and feature requests.", linkLabel: "Open WhatsApp", href: `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210"}`, external: true },
  ],
  customer: [
    { icon: <HelpCircle size={22} strokeWidth={1.8} />, color: "#7B1D45", bg: "rgba(123,29,69,0.1)", title: "FAQ", desc: "Answers for placing orders, tracking, payments, returns, and account management.", linkLabel: "Browse FAQ", scroll: true },
    { icon: <BookOpen size={22} strokeWidth={1.8} />, color: "#0f2460", bg: "rgba(15,36,96,0.1)", title: "How to Order", desc: "Step-by-step guide to browsing products, adding to cart, and completing checkout.", linkLabel: "Read Guide", href: "#docs" },
    { icon: <PlayCircle size={22} strokeWidth={1.8} />, color: "#0e7490", bg: "rgba(14,116,144,0.1)", title: "Video Tutorials", desc: "Watch videos on order tracking, wishlist, cart management, and account setup.", linkLabel: "Watch Videos", href: "#tutorials" },
    { icon: <Headphones size={22} strokeWidth={1.8} />, color: "#7c3aed", bg: "rgba(124,58,237,0.1)", title: "Contact Support", desc: "Reach us via WhatsApp for order issues, payment queries, and feedback.", linkLabel: "Open WhatsApp", href: `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210"}`, external: true },
  ],
};

// resources and faq derived inside component

// ── Sub-components ─────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "1rem" }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#0F172A", flex: 1, lineHeight: 1.5 }}>{q}</span>
        {open ? <ChevronUp size={15} color="#94A3B8" style={{ flexShrink: 0 }} /> : <ChevronDown size={15} color="#94A3B8" style={{ flexShrink: 0 }} />}
      </button>
      {open && <p style={{ margin: 0, padding: "0 1.25rem 1rem", fontSize: "0.83rem", color: "#475569", lineHeight: 1.75 }}>{a}</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Re-detect on every render so URL param is always fresh
  const PORTAL = detectPortal();
  const cfg       = PORTAL_CONFIG[PORTAL] || PORTAL_CONFIG.customer;
  const resources = ALL_RESOURCES[PORTAL]  || ALL_RESOURCES.customer;
  const faq       = ALL_FAQ.filter((f) => cfg.faqCategories.includes(f.category));

  const categories = ["All", ...faq.map((f) => f.category)];
  const isSearching = search.trim().length > 0;

  const filteredByCategory = activeCategory === "All" ? faq : faq.filter((f) => f.category === activeCategory);
  const filteredItems = filteredByCategory.flatMap((cat) =>
    cat.items
      .filter((item) => {
        const q = search.toLowerCase();
        return !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      })
      .map((item) => ({ ...item, category: cat.category }))
  );

  const backHref = PORTAL === "shop" ? "/shop/dashboard" : PORTAL === "delivery" ? "/delivery/dashboard" : PORTAL === "admin" ? "/admin/dashboard" : "/";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>

      {/* ── Top bar ── */}
      <div style={{ background: "#1A0812", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0.85rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <a href={backHref} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
        >
          <ArrowLeft size={14} /> Back to {cfg.label}
        </a>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>Help Center</span>
        {PORTAL && (
          <>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: cfg.accent === "#0f2460" ? "#60a5fa" : "#f0abca", background: "rgba(255,255,255,0.06)", padding: "0.2rem 0.6rem", borderRadius: 6 }}>{cfg.label}</span>
          </>
        )}
      </div>

      {/* ── Hero ── */}
      <div style={{ background: cfg.gradient, padding: "3rem 2rem 3.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.68rem", fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
            Lakshmi Vastra Studio — {cfg.label}
          </p>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(1.5rem, 3.5vw, 2.1rem)", fontWeight: 900, color: "#fff", fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
            {cfg.heading}
          </h1>
          <p style={{ margin: "0 0 2rem", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", maxWidth: 480 }}>
            {cfg.sub}
          </p>
          <div style={{ position: "relative", maxWidth: 540 }}>
            <Search size={17} color="#94A3B8" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${cfg.label} help…`}
              style={{ width: "100%", padding: "0.85rem 2.6rem 0.85rem 2.6rem", borderRadius: 10, border: "none", fontSize: "0.86rem", outline: "none", boxSizing: "border-box", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", color: "#0F172A" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem 5rem" }}>

        {/* Resource cards */}
        {!isSearching && (
          <section style={{ marginBottom: "3rem" }}>
            <p style={{ margin: "0 0 1rem", fontSize: "0.7rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Browse by resource</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {resources.map((r) => (
                <a
                  key={r.title}
                  href={r.href || "#faq"}
                  target={r.external ? "_blank" : undefined}
                  rel={r.external ? "noopener noreferrer" : undefined}
                  onClick={r.scroll ? (e) => { e.preventDefault(); document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }); } : undefined}
                  style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: 12, padding: "1.4rem 1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid #EEF2F7", textDecoration: "none", transition: "box-shadow 0.18s, border-color 0.18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = "#EEF2F7"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", color: r.color, marginBottom: "0.85rem" }}>
                    {r.icon}
                  </div>
                  <p style={{ margin: "0 0 0.35rem", fontWeight: 800, fontSize: "0.93rem", color: "#0F172A" }}>{r.title}</p>
                  <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", color: "#64748B", lineHeight: 1.65, flex: 1 }}>{r.desc}</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 700, color: r.color }}>
                    {r.linkLabel} {r.external && <ExternalLink size={12} />}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* FAQ section */}
        <section id="faq">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {isSearching ? `Search results — "${search}"` : "Frequently Asked Questions"}
            </p>
            {isSearching && (
              <button onClick={() => setSearch("")} style={{ fontSize: "0.75rem", color: cfg.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600, textDecoration: "underline", padding: 0 }}>
                Clear search
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isSearching || categories.length <= 2 ? "1fr" : "190px 1fr", gap: "1.5rem", alignItems: "start" }}>

            {/* Category sidebar — only when not searching and more than one category */}
            {!isSearching && categories.length > 2 && (
              <nav style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid #EEF2F7", position: "sticky", top: "1.5rem" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      display: "block", width: "100%", padding: "0.75rem 1.1rem",
                      textAlign: "left", border: "none",
                      borderLeft: `3px solid ${activeCategory === cat ? cfg.accent : "transparent"}`,
                      background: activeCategory === cat ? `${cfg.accent}0d` : "transparent",
                      fontSize: "0.82rem", fontWeight: activeCategory === cat ? 700 : 500,
                      color: activeCategory === cat ? cfg.accent : "#475569",
                      cursor: "pointer", transition: "all 0.15s",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
            )}

            {/* FAQ list */}
            <div>
              {filteredItems.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 12, padding: "2.5rem 1.5rem", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid #EEF2F7" }}>
                  <p style={{ fontWeight: 700, color: "#475569", margin: "0 0 0.35rem", fontSize: "0.9rem" }}>No results found</p>
                  <p style={{ fontSize: "0.8rem", color: "#94A3B8", margin: 0 }}>Try different keywords or browse by category.</p>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid #EEF2F7" }}>
                  {filteredItems.map((item, i) => {
                    const showLabel = isSearching && (i === 0 || filteredItems[i - 1].category !== item.category);
                    return (
                      <div key={i}>
                        {showLabel && (
                          <p style={{ margin: 0, padding: "0.55rem 1.25rem", fontSize: "0.65rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                            {item.category}
                          </p>
                        )}
                        <FAQItem q={item.q} a={item.a} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid #E2E8F0", background: "#fff", padding: "1.25rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>
            <span style={{ color: "#7B1D45", fontWeight: 800 }}>Lakshmi Vastra Studio</span>
            {"  —  "}© {new Date().getFullYear()} All Rights Reserved
          </p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[["Terms of Use", "/terms"], ["Privacy Policy", "/privacy"], ["Cookie Policy", "/cookies"]].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: "0.73rem", color: "#64748B", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#7B1D45"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#64748B"}
              >{label}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
