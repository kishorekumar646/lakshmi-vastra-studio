import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getCategories, getShopProducts, createShopProduct, updateShopProduct, deleteShopProduct,
  getShopOrders, getShopOrderQr, shopScanQr,
} from "../api";
import { LogOut, Plus, Trash2, Edit2, Package, ShoppingBag, QrCode, ScanLine, X, ImagePlus, Download } from "lucide-react";
import QrScanner from "../components/QrScanner";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { usePwaInstall } from "../hooks/usePwaInstall";

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
  const { canInstall, install } = usePwaInstall();
  usePushNotifications("shop_owner", owner.id, localStorage.getItem("shop_token"));

  // Products
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

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

  const openAdd = () => { setEditing(null); setForm(EMPTY); setNewImages([]); setPreviews([]); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || "", price: p.price, category_id: p.category_id, is_featured: p.is_featured, is_handloom: p.is_handloom, has_multiple_colours: p.has_multiple_colours, custom_orders: p.custom_orders });
    setNewImages([]); setPreviews([]); setShowForm(true);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      newImages.forEach((img) => fd.append("images", img));
      if (editing) {
        await updateShopProduct(editing.id, fd);
        toast.success("Product updated");
      } else {
        await createShopProduct(fd);
        toast.success("Product added");
      }
      setShowForm(false);
      loadProducts();
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

        {/* Products Tab */}
        {tab === "products" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--primary)", fontSize: "1.2rem" }}>My Products</h2>
              <button onClick={openAdd} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                <Plus size={15} /> Add Product
              </button>
            </div>

            {/* Product form modal */}
            {showForm && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                <div style={{ background: "#fff", borderRadius: 10, padding: "1.75rem", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--primary)" }}>{editing ? "Edit Product" : "Add Product"}</h3>
                    <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                  </div>
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div><label style={{ fontSize: "0.8rem" }}>Product Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                    <div><label style={{ fontSize: "0.8rem" }}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: "100%", borderRadius: 6, border: "1px solid #ddd", padding: "0.5rem" }} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div><label style={{ fontSize: "0.8rem" }}>Price (₹) *</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                      <div>
                        <label style={{ fontSize: "0.8rem" }}>Category *</label>
                        <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ddd" }}>
                          <option value="">Select...</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      {[["is_featured", "Featured"], ["is_handloom", "Handloom"], ["has_multiple_colours", "Multi-colour"], ["custom_orders", "Custom Orders"]].map(([k, label]) => (
                        <label key={k} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", cursor: "pointer" }}>
                          <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", padding: "0.6rem", border: "1px dashed #ccc", borderRadius: 6 }}>
                        <ImagePlus size={15} /> Add Images
                      </label>
                      <input type="file" multiple accept="image/*" ref={fileRef} onChange={handleImages} style={{ display: "none" }} />
                      <button type="button" onClick={() => fileRef.current?.click()} style={{ display: "none" }} />
                      <label onClick={() => fileRef.current?.click()} style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", padding: "0.6rem", border: "1px dashed #ccc", borderRadius: 6, marginTop: "0.5rem" }}>
                        <ImagePlus size={15} /> {newImages.length ? `${newImages.length} image(s) selected` : "Choose images"}
                      </label>
                      <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: "none" }} ref={fileRef} />
                      {previews.length > 0 && (
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                          {previews.map((p, i) => <img key={i} src={p} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }} />)}
                        </div>
                      )}
                    </div>
                    <button type="submit" className="btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? "Saving..." : editing ? "Update Product" : "Add Product"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>
                <Package size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No products yet. Add your first product!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {products.map((p) => (
                  <div key={p.id} style={{ ...S.card, display: "flex", gap: "1rem", alignItems: "center" }}>
                    {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>{p.category_name} · ₹{p.price.toLocaleString("en-IN")}</p>
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
    </div>
  );
}
