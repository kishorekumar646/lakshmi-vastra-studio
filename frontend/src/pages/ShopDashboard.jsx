import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getCategories, getShopProducts, createShopProduct, updateShopProduct, deleteShopProduct,
  deleteShopProductImage,
  getShopOrders, getShopOrderQr, shopScanQr,
} from "../api";
import { LogOut, Plus, Trash2, Edit2, Package, ShoppingBag, QrCode, ScanLine, X, ImagePlus, ChevronLeft, Check } from "lucide-react";
import QrScanner from "../components/QrScanner";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { usePwaInstall } from "../hooks/usePwaInstall";
import InstallGuideSheet from "../components/InstallGuideSheet";

const EMPTY = { name: "", description: "", price: "", category_id: "", is_featured: false, is_handloom: false, has_multiple_colours: false, custom_orders: false };

const STATUS_LABEL = {
  pending: "Pending", confirmed: "Confirmed",
  ready_for_delivery: "Ready for Delivery", picked_up: "Picked Up", delivered: "Delivered",
};
const STATUS_COLOR = {
  pending: "#888", confirmed: "#2563eb",
  ready_for_delivery: "#d97706", picked_up: "#7c3aed", delivered: "#16a34a",
};

export default function ShopDashboard() {
  const [tab, setTab] = useState("products");
  const switchTab = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: "instant" }); };
  const [owner] = useState(() => JSON.parse(localStorage.getItem("shop_owner") || "{}"));
  const navigate = useNavigate();
  const { canInstall, install, nativeInstall, hasNativePrompt, installing, installed: appInstalled, guideOpen, closeGuide } = usePwaInstall();
  usePushNotifications("shop_owner", owner.id, localStorage.getItem("shop_token"));

  // Products
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [primaryFile, setPrimaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [savedProductName, setSavedProductName] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const primaryFileRef = useRef();
  const additionalFileRef = useRef();
  const shopFormRef = useRef();

  // Orders
  const [orders, setOrders] = useState([]);
  const [qrModal, setQrModal] = useState(null); // { orderId, qrImage }
  const [showScanner, setShowScanner] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(() => {});
    loadProducts();
  }, []);

  useEffect(() => {
    if (tab === "orders") loadOrders();
  }, [tab]);

  const loadProducts = () =>
    getShopProducts().then((r) => setProducts(r.data)).catch(() => {});

  const loadOrders = () => {
    setOrdersLoading(true);
    getShopOrders().then((r) => setOrders(r.data)).catch(() => {}).finally(() => setOrdersLoading(false));
  };

  const logout = () => {
    localStorage.removeItem("shop_token");
    localStorage.removeItem("shop_owner");
    navigate("/shop/login");
  };

  // ── Products ─────────────────────────────────────────────────────────────────

  const clearImageState = () => {
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    additionalPreviews.forEach((u) => URL.revokeObjectURL(u));
    setPrimaryFile(null); setPrimaryPreview(null);
    setAdditionalFiles([]); setAdditionalPreviews([]);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); clearImageState(); setSavedProductName(null); setShowForm(true); window.scrollTo({ top: 0, behavior: "instant" }); };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY); clearImageState(); setSavedProductName(null); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || "", price: p.price, category_id: p.category_id, is_featured: p.is_featured, is_handloom: p.is_handloom, has_multiple_colours: p.has_multiple_colours, custom_orders: p.custom_orders });
    clearImageState(); setSavedProductName(null); setShowForm(true); window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handlePrimarySelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    setPrimaryFile(file); setPrimaryPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removePrimary = () => {
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    setPrimaryFile(null); setPrimaryPreview(null);
  };

  const handleAdditionalSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setAdditionalFiles((prev) => [...prev, ...files]);
    setAdditionalPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeAdditional = (index) => {
    URL.revokeObjectURL(additionalPreviews[index]);
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!editing) return;
    try {
      await deleteShopProductImage(editing.id, imageId);
      setEditing((prev) => ({ ...prev, images: prev.images.filter((img) => img.id !== imageId) }));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (primaryFile) fd.append("images", primaryFile);
      additionalFiles.forEach((img) => fd.append("images", img));
      if (editing) {
        await updateShopProduct(editing.id, fd);
        toast.success("Product updated");
        loadProducts();
        closeForm();
      } else {
        await createShopProduct(fd);
        const addedName = form.name;
        loadProducts();
        setSavedProductName(addedName);
        setForm(EMPTY);
        clearImageState();
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteShopProduct(id);
      toast.success("Deleted");
      loadProducts();
    } catch { toast.error("Failed to delete"); }
  };

  // ── Orders ────────────────────────────────────────────────────────────────────

  const showQr = async (orderId) => {
    try {
      const res = await getShopOrderQr(orderId);
      setQrModal({ orderId, qrImage: res.data.qr_image });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not load QR");
    }
  };

  const handleScan = async (token) => {
    setShowScanner(false);
    try {
      await shopScanQr(token);
      toast.success("Order marked as Ready for Delivery!");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Scan failed");
    }
  };

  const S = { // inline style helpers
    card: { background: "#fff", borderRadius: 10, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "0.75rem" },
    badge: (status) => ({ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, background: STATUS_COLOR[status] + "18", color: STATUS_COLOR[status] }),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "var(--primary)", color: "#fff", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700 }}>{owner.shop_name || "My Shop"}</p>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.75 }}>Shop Owner Portal</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {canInstall && (
            <button onClick={install} title="Install Shop Portal App" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "0.4rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 600 }}>
              <span style={{ fontSize: "1rem" }}>🏪</span> Install App
            </button>
          )}
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, padding: "0.4rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", background: "#fff",
        borderTop: "1px solid #E2E8F0",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {[{ key: "products", icon: Package, label: "Products" }, { key: "orders", icon: ShoppingBag, label: "Orders" }].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => switchTab(key)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "0.25rem", padding: "0.7rem 0.5rem", border: "none", background: "none", cursor: "pointer",
            color: tab === key ? "var(--primary)" : "#94A3B8",
            transition: "color 0.18s",
          }}>
            <Icon size={20} strokeWidth={tab === key ? 2.5 : 1.8} />
            <span style={{ fontSize: "0.65rem", fontWeight: tab === key ? 800 : 500 }}>{label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "1.25rem 1.25rem 6rem", width: "100%", boxSizing: "border-box" }}>

        {/* Products Tab — list */}
        {tab === "products" && !showForm && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--primary)", fontSize: "1.2rem" }}>My Products</h2>
              <button onClick={openAdd} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                <Plus size={15} /> Add Product
              </button>
            </div>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>
                <Package size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No products yet. Add your first product!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {products.map((p) => (
                  <div key={p.id} style={{ ...S.card, display: "flex", gap: "1rem", alignItems: "center" }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                      : <div style={{ width: 60, height: 60, borderRadius: 6, background: "#f0f0f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={20} style={{ opacity: 0.3 }} /></div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>{p.category_name} · ₹{p.price.toLocaleString("en-IN")}</p>
                      {p.images?.length > 0 && <p style={{ margin: 0, fontSize: "0.72rem", color: "#aaa" }}>{p.images.length} photo{p.images.length !== 1 ? "s" : ""}</p>}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button onClick={() => openEdit(p)} style={{ background: "#f0f0f0", border: "none", borderRadius: 6, padding: "0.4rem", cursor: "pointer" }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: "#fff0f0", border: "none", borderRadius: 6, padding: "0.4rem", cursor: "pointer", color: "#c00" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Products Tab — add / edit page (same layout as admin) */}
        {tab === "products" && showForm && (
          <>
            {/* Page action bar */}
            <div className="form-top-bar">
              <button type="button" onClick={closeForm} className="form-back-btn">
                <ChevronLeft size={14} /> Back
              </button>
              <h2 style={{ color: "var(--primary)" }}>{editing ? "Edit Product" : "Add Product"}</h2>
              <div className="form-top-actions">
                <button type="button" className="admin-cancel-btn" onClick={closeForm}>Cancel</button>
                <button type="button" onClick={() => shopFormRef.current?.requestSubmit()} className="btn-primary" disabled={submitting} style={{ display: "flex", alignItems: "center", gap: "0.35rem", opacity: submitting ? 0.7 : 1 }}>
                  <Check size={13} /> {submitting ? "Saving…" : (editing ? "Update Product" : "Save Product")}
                </button>
              </div>
            </div>

            {/* Success banner */}
            {savedProductName && (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "0.9rem 1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                  <Check size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 600 }}>"{savedProductName}" added!</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={() => setSavedProductName(null)} className="btn-primary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                    <Plus size={12} /> Add Another
                  </button>
                  <button type="button" onClick={closeForm} style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", flex: 1, background: "none", border: "1px solid #BBF7D0", borderRadius: 6, color: "#166534", cursor: "pointer", fontWeight: 500 }}>
                    Back to List
                  </button>
                </div>
              </div>
            )}

            <form ref={shopFormRef} onSubmit={handleSubmit}>
              <div className="product-form-cols">

                {/* ── Left column ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* Product Details */}
                  <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <p style={{ margin: "0 0 1rem", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)" }}>Product Details</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      <div>
                        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#444", display: "block", marginBottom: "0.35rem" }}>Product Name *</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kanjivaram Silk Saree" required style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.9rem", boxSizing: "border-box" }} />
                      </div>
                      <div className="form-field-row">
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#444", display: "block", marginBottom: "0.35rem" }}>Price (₹) *</label>
                          <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="5500" required style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.9rem", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#444", display: "block", marginBottom: "0.35rem" }}>Category *</label>
                          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.9rem", boxSizing: "border-box", background: "#fff" }}>
                            <option value="">Select…</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#444", display: "block", marginBottom: "0.35rem" }}>Description</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Fabric, weave, occasion, care instructions…" style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.9rem", boxSizing: "border-box", resize: "vertical" }} />
                      </div>
                    </div>
                  </div>

                  {/* Attributes & Visibility */}
                  <div className="admin-card">
                    <h3 className="admin-card-title" style={{ marginBottom: "0.25rem" }}>Attributes &amp; Visibility</h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.1rem" }}>Checked attributes appear as trust badges on the product page.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[
                        { id: "is_featured", label: "Mark as Featured", hint: "Shows in featured section on home page" },
                        { id: "is_handloom", label: "Genuine Handloom Product", hint: "Displays handloom trust badge" },
                        { id: "has_multiple_colours", label: "Available in Multiple Colours", hint: "Customer can contact for colour options" },
                        { id: "custom_orders", label: "Accepts Custom Orders", hint: "Displays 'Contact Us' badge on product" },
                      ].map(({ id, label, hint }) => (
                        <div key={id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.65rem 0.85rem", borderRadius: 6, border: "1px solid var(--border)", background: form[id] ? "#FDF8F0" : "transparent", transition: "background 0.15s" }}>
                          <input
                            type="checkbox"
                            id={`shop-${id}`}
                            checked={form[id]}
                            onChange={(e) => setForm({ ...form, [id]: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: "var(--primary)", flexShrink: 0, marginTop: 2 }}
                          />
                          <div>
                            <label htmlFor={`shop-${id}`} style={{ marginBottom: 0, textTransform: "none", fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>{label}</label>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--text-muted)" }}>{hint}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── Right column — Images ── */}
                <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <p style={{ margin: "0 0 1.1rem", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)" }}>Product Images</p>

                  {/* Primary Image */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)" }}>Primary Image</span>
                      <span style={{ fontSize: "0.69rem", color: "#aaa" }}>· 1 only</span>
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "#aaa", marginBottom: "0.65rem" }}>Main photo shown in listings</p>

                    {editing?.images?.[0] && (
                      <div style={{ position: "relative", display: "inline-block", marginBottom: "0.5rem" }}>
                        <img src={editing.images[0].url} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, display: "block" }} />
                        <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "0.58rem", textAlign: "center", borderRadius: "0 0 8px 8px", padding: "2px 0" }}>Primary</span>
                        <button type="button" onClick={() => handleDeleteExistingImage(editing.images[0].id)} style={{ position: "absolute", top: -6, right: -6, background: "#c00", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, fontSize: 13 }}>×</button>
                      </div>
                    )}
                    {primaryPreview && (
                      <div style={{ position: "relative", display: "inline-block", marginBottom: "0.5rem" }}>
                        <img src={primaryPreview} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, display: "block" }} />
                        <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(123,29,69,0.8)", color: "#fff", fontSize: "0.58rem", textAlign: "center", borderRadius: "0 0 8px 8px", padding: "2px 0" }}>New</span>
                        <button type="button" onClick={removePrimary} style={{ position: "absolute", top: -6, right: -6, background: "#c00", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, fontSize: 13 }}>×</button>
                      </div>
                    )}
                    {!editing?.images?.[0] && !primaryPreview && (
                      <button type="button" onClick={() => primaryFileRef.current?.click()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", width: "100%", padding: "1.25rem 1rem", border: "2px dashed #e2e8f0", borderRadius: 10, background: "#fafaf8", color: "#aaa", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500 }}>
                        <ImagePlus size={16} /> Upload Primary Photo
                      </button>
                    )}
                    {(editing?.images?.[0] || primaryPreview) && !primaryPreview && (
                      <button type="button" onClick={() => primaryFileRef.current?.click()} style={{ display: "block", fontSize: "0.75rem", color: "var(--primary)", background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.3rem 0.75rem", cursor: "pointer", marginTop: "0.4rem" }}>
                        Replace Primary
                      </button>
                    )}
                    <input ref={primaryFileRef} type="file" accept="image/*" onChange={handlePrimarySelect} style={{ display: "none" }} />
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "0 0 1.1rem" }} />

                  {/* Additional Images */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B" }}>Additional Images</span>
                      <span style={{ fontSize: "0.69rem", color: "#aaa" }}>· multiple allowed</span>
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "#aaa", marginBottom: "0.65rem" }}>Gallery photos on product detail page</p>

                    {editing?.images?.length > 1 && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.65rem" }}>
                        {editing.images.slice(1).map((img) => (
                          <div key={img.id} style={{ position: "relative" }}>
                            <img src={img.url} alt="" style={{ width: 66, height: 66, objectFit: "cover", borderRadius: 8 }} />
                            <button type="button" onClick={() => handleDeleteExistingImage(img.id)} style={{ position: "absolute", top: -5, right: -5, background: "#c00", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, fontSize: 12 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {additionalPreviews.length > 0 && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.65rem" }}>
                        {additionalPreviews.map((url, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <img src={url} alt="" style={{ width: 66, height: 66, objectFit: "cover", borderRadius: 8 }} />
                            <button type="button" onClick={() => removeAdditional(i)} style={{ position: "absolute", top: -5, right: -5, background: "#c00", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, fontSize: 12 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => additionalFileRef.current?.click()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", width: "100%", padding: "1rem", border: "1.5px dashed #e2e8f0", borderRadius: 10, background: "#fafaf8", color: "#aaa", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500 }}>
                      <ImagePlus size={15} /> {additionalPreviews.length > 0 ? "Add More" : "Add Additional Photos"}
                    </button>
                    <input ref={additionalFileRef} type="file" accept="image/*" multiple onChange={handleAdditionalSelect} style={{ display: "none" }} />
                  </div>
                </div>

              </div>

              {/* Bottom action bar */}
              <div className="form-bottom-bar">
                <button type="button" className="admin-cancel-btn" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: submitting ? 0.7 : 1 }}>
                  <Check size={15} />
                  {submitting ? "Saving…" : (editing ? "Update Product" : "Save Product")}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--primary)", fontSize: "1.2rem" }}>Orders</h2>
              <button onClick={() => setShowScanner(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, padding: "0.5rem 1rem", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                <ScanLine size={15} /> Scan QR
              </button>
            </div>

            {ordersLoading ? (
              <p style={{ color: "#888", textAlign: "center", padding: "2rem" }}>Loading orders...</p>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>
                <ShoppingBag size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No confirmed orders yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {orders.map((o) => (
                  <div key={o.id} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>Order #{o.id}</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>{o.customer?.name} · {o.payment_method === "cod" ? "COD" : "Paid"} · ₹{o.total.toLocaleString("en-IN")}</p>
                      </div>
                      <span style={S.badge(o.status)}>{STATUS_LABEL[o.status] || o.status}</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#555", marginBottom: "0.75rem" }}>
                      {o.items.map((item, i) => (
                        <span key={i}>{item.name} ×{item.quantity}{i < o.items.length - 1 ? ", " : ""}</span>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#888" }}>📍 {o.delivery_address}</p>
                    {o.status === "confirmed" && (
                      <button onClick={() => showQr(o.id)} style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, padding: "0.45rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
                        <QrCode size={14} /> View QR Code
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.75rem", maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--primary)" }}>Order #{qrModal.orderId}</h3>
              <button onClick={() => setQrModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "1rem" }}>Scan this QR code to mark order as Ready for Delivery</p>
            <img src={qrModal.qrImage} alt="QR Code" style={{ width: "100%", maxWidth: 220, borderRadius: 8 }} />
          </div>
        </div>
      )}

      {/* QR Scanner */}
      {showScanner && <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* PWA Install Guide */}
      <InstallGuideSheet
        open={guideOpen}
        onClose={closeGuide}
        appName="Shop Owner Portal"
        iconEmoji="🏪"
        iconSrc="/icon-shop.png"
        themeColor="#7B1D45"
        tagline="Manage products, orders & deliveries"
        features={[
          { icon: "📦", text: "Manage products and inventory" },
          { icon: "🛒", text: "Track orders in real time" },
          { icon: "🚚", text: "Coordinate deliveries easily" },
          { icon: "⚡", text: "Works offline, no browser bar" },
        ]}
        hasNativePrompt={hasNativePrompt}
        onNativeInstall={nativeInstall}
        installing={installing}
        installed={appInstalled}
      />
    </div>
  );
}
