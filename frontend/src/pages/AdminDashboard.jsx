import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { stripPhone, formatPhone, phoneError } from "../utils/phone";
import {
  getProducts, getAdminProducts, createProduct, updateProduct, deleteProduct, deleteProductImage,
  getCategories, createCategory, deleteCategory,
  getInquiries, markInquiryRead,
  getAdminReviews, deleteReview, toggleReviewVisibility,
  getAdminOrders, confirmOrder, assignDelivery,
  getDeliveryPersons, createDeliveryPerson, toggleDeliveryPerson, updateDeliveryPerson,
  getShopOwners, approveShopOwner, toggleShopOwner,
  getAdminPincodes, addPincode, deletePincode, togglePincode,
  getAdminCustomers,
  updateAdminCustomer,
  getAdminPayments,
} from "../api";
import {
  LogOut, Plus, Trash2, Edit2, Package, Tag, MessageSquare,
  Menu, X, ImagePlus, Check, ChevronLeft, ChevronRight, Star,
  ShoppingBag, Truck, Store, Users, CheckCircle, TrendingUp, MapPin,
  CreditCard, Banknote, XCircle, Clock,
} from "lucide-react";
import StarRating from "../components/StarRating";
import { usePushNotifications } from "../hooks/usePushNotifications";
import AdminDashboardTab from "../components/AdminDashboardTab";

const EMPTY_FORM = { name: "", description: "", price: "", category_id: "", is_featured: false, is_handloom: false, has_multiple_colours: false, custom_orders: false };
const PER_PAGE = 10;

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = [];
  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, "…", totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages);
  }
  return pages;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Products — all fetched, paginated client-side
  const [allProducts, setAllProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productPages, setProductPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [catForm, setCatForm] = useState({ name: "", slug: "" });
  const [submitting, setSubmitting] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Orders tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [assignModal, setAssignModal] = useState(null); // { orderId }
  const [assignDpId, setAssignDpId] = useState("");

  // Delivery Persons tab
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [dpLoading, setDpLoading] = useState(false);
  const [showDpForm, setShowDpForm] = useState(false);
  const [dpForm, setDpForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [dpSubmitting, setDpSubmitting] = useState(false);

  // Shop Owners tab
  const [shopOwners, setShopOwners] = useState([]);
  const [shopOwnersLoading, setShopOwnersLoading] = useState(false);

  // Pincodes tab
  const [pincodes, setPincodes] = useState([]);
  const [pincodesLoading, setPincodesLoading] = useState(false);
  const [pincodeForm, setPincodeForm] = useState({ pincode: "", city: "", state: "" });
  const [pincodeSubmitting, setPincodeSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentsData, setPaymentsData] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [expandedDelivery, setExpandedDelivery] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null); // { id, name, email, phone }
  const [deliverySaving, setDeliverySaving] = useState(false);

  // Push notifications for admin
  usePushNotifications("admin", null, localStorage.getItem("admin_token"));

  const applyPage = (sorted, page) => {
    const total = sorted.length;
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const p = Math.min(page, pages);
    setAllProducts(sorted);
    setProductTotal(total);
    setProductPages(pages);
    setProductPage(p);
  };

  const loadProducts = (page = 1) => {
    setProductsLoading(true);
    // Try the new admin endpoint first; if unavailable fall back to public endpoint
    getAdminProducts(page, PER_PAGE)
      .then((r) => {
        setAllProducts(r.data.items);
        setProductTotal(r.data.total);
        setProductPages(r.data.pages);
        setProductPage(r.data.page);
      })
      .catch(() => {
        // Backend not yet redeployed — use public endpoint + client-side pagination
        getProducts({})
          .then((r) => {
            const sorted = [...r.data].sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            applyPage(sorted, page);
          })
          .catch(() => toast.error("Failed to load products. Please refresh."));
      })
      .finally(() => setProductsLoading(false));
  };

  const loadOrders = (status = "all") => {
    setOrdersLoading(true);
    getAdminOrders(1, 100, status === "all" ? "" : status)
      .then((r) => setOrders(r.data.items ?? r.data))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  };

  const loadDeliveryPersons = () => {
    setDpLoading(true);
    getDeliveryPersons().then((r) => setDeliveryPersons(r.data)).catch(() => {}).finally(() => setDpLoading(false));
  };

  const loadShopOwners = () => {
    setShopOwnersLoading(true);
    getShopOwners().then((r) => setShopOwners(r.data)).catch(() => {}).finally(() => setShopOwnersLoading(false));
  };

  const loadPincodes = () => {
    setPincodesLoading(true);
    getAdminPincodes().then((r) => setPincodes(r.data)).catch(() => {}).finally(() => setPincodesLoading(false));
  };

  const loadCustomers = () => {
    setCustomersLoading(true);
    getAdminCustomers().then((r) => setCustomers(r.data)).catch(() => {}).finally(() => setCustomersLoading(false));
  };

  const loadPayments = () => {
    setPaymentsLoading(true);
    getAdminPayments().then((r) => setPaymentsData(r.data)).catch(() => {}).finally(() => setPaymentsLoading(false));
  };

  const loadAll = () => {
    loadProducts(1);
    getCategories().then((r) => setCategories(r.data));
    getInquiries().then((r) => setInquiries(r.data));
    getAdminReviews().then((r) => setAdminReviews(r.data)).catch(() => {});
    loadOrders();
    loadDeliveryPersons();
    loadShopOwners();
    loadPincodes();
    loadCustomers();
    loadPayments();
  };

  useEffect(() => { loadAll(); }, []);

  const goToPage = (page) => {
    if (page < 1 || page > productPages) return;
    // If we have all products in memory (fallback mode), just update the page number
    if (allProducts.length === productTotal) {
      setProductPage(page);
    } else {
      loadProducts(page);
    }
  };

  const logout = () => { localStorage.removeItem("admin_token"); navigate("/admin"); };

  const openAddForm = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setNewImages([]);
    setImagePreviews([]);
    setShowForm(true);
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description || "", price: p.price, category_id: p.category_id, is_featured: p.is_featured, is_handloom: p.is_handloom || false, has_multiple_colours: p.has_multiple_colours || false, custom_orders: p.custom_orders || false });
    setNewImages([]);
    setImagePreviews([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const previews = files.map((f) => ({ url: URL.createObjectURL(f), file: f }));
    setNewImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index].url);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (productId, imageId) => {
    if (!confirm("Delete this image?")) return;
    try {
      await deleteProductImage(productId, imageId);
      setEditingProduct((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
      toast.success("Image deleted");
      loadAll();
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("price", form.price);
    fd.append("category_id", form.category_id);
    fd.append("is_featured", form.is_featured);
    fd.append("is_handloom", form.is_handloom);
    fd.append("has_multiple_colours", form.has_multiple_colours);
    fd.append("custom_orders", form.custom_orders);
    newImages.forEach((img) => fd.append("images", img));
    if (newImages.length > 0) fd.append("image", newImages[0]); // compat: old backend expects "image" (singular)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, fd);
        toast.success("Product updated!");
        loadProducts(productPage);
      } else {
        await createProduct(fd);
        toast.success("Product added!");
        loadProducts(1); // go to first page to see the new product
      }
      setShowForm(false);
      setEditingProduct(null);
      setForm(EMPTY_FORM);
      setNewImages([]);
      setImagePreviews([]);
    } catch {
      toast.error("Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (p) => {
    const fd = new FormData();
    fd.append("name", p.name);
    fd.append("description", p.description || "");
    fd.append("price", p.price);
    fd.append("category_id", p.category_id);
    fd.append("is_featured", p.is_featured);
    fd.append("is_available", !p.is_available);
    fd.append("is_handloom", p.is_handloom || false);
    fd.append("has_multiple_colours", p.has_multiple_colours || false);
    fd.append("custom_orders", p.custom_orders || false);
    try {
      await updateProduct(p.id, fd);
      toast.success(p.is_available ? "Product hidden from store" : "Product now visible");
      loadProducts(productPage);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    toast.success("Deleted");
    const remaining = productTotal - 1;
    const targetPage = remaining > 0 && (productPage - 1) * PER_PAGE >= remaining
      ? productPage - 1
      : productPage;
    loadProducts(targetPage);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(catForm);
      toast.success("Category added!");
      setCatForm({ name: "", slug: "" });
      loadAll();
    } catch {
      toast.error("Category already exists.");
    }
  };

  const handleDeleteCat = async (id) => {
    if (!confirm("Delete this category?")) return;
    await deleteCategory(id);
    toast.success("Deleted");
    loadAll();
  };

  const unread = inquiries.filter((i) => !i.is_read).length;

  // Slice for current page (works in both server-paginated and client-paginated modes)
  const products = allProducts.length === productTotal
    ? allProducts.slice((productPage - 1) * PER_PAGE, productPage * PER_PAGE)
    : allProducts;

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const pendingApprovals = shopOwners.filter((s) => !s.is_approved).length;

  const NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", icon: <TrendingUp size={17} /> },
    { key: "products", label: "Products", icon: <Package size={17} />, badge: productTotal || null },
    { key: "categories", label: "Categories", icon: <Tag size={17} />, badge: categories.length },
    { key: "inquiries", label: "Inquiries", icon: <MessageSquare size={17} />, badge: unread || null, badgeRed: true },
    { key: "reviews", label: "Reviews", icon: <Star size={17} />, badge: adminReviews.length || null },
    { key: "orders", label: "Orders", icon: <ShoppingBag size={17} />, badge: pendingOrders || null, badgeRed: true },
    { key: "shopowners", label: "Shop Owners", icon: <Store size={17} />, badge: pendingApprovals || null, badgeRed: true },
    { key: "delivery", label: "Delivery", icon: <Truck size={17} />, badge: deliveryPersons.length || null },
    { key: "pincodes", label: "Delivery Zones", icon: <MapPin size={17} />, badge: pincodes.length || null },
    { key: "customers", label: "Customers", icon: <Users size={17} />, badge: customers.length || null },
    { key: "payments", label: "Payments", icon: <CreditCard size={17} /> },
  ];

  return (
    <div className="admin-page">
      {/* Sidebar overlay on mobile */}
      <div className={`admin-sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="admin-mobile-header">
        <span className="admin-mobile-title">Admin Panel</span>
        <button className="admin-mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-logo">
          <p className="admin-sidebar-title">Admin Panel</p>
          <p className="admin-sidebar-sub">Lakshmi Vastra Studio</p>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setShowForm(false); setSidebarOpen(false); }}
              className={`admin-nav-btn ${tab === item.key ? "active" : ""}`}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && (
                <span style={{
                  background: item.badgeRed ? "var(--primary)" : "rgba(255,255,255,0.1)",
                  color: "#fff",
                  borderRadius: 100,
                  padding: "1px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  minWidth: 20,
                  textAlign: "center",
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button onClick={logout} className="admin-logout-btn">
          <LogOut size={14} /> Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-main">

        {/* ── Dashboard Tab ──────────────── */}
        {tab === "dashboard" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Dashboard</h2>
            </div>
            <AdminDashboardTab />
          </div>
        )}

        {/* ── Products Tab ───────────────── */}
        {tab === "products" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Products</h2>
              {!showForm && (
                <button onClick={openAddForm} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Plus size={16} /> Add Product
                </button>
              )}
            </div>

            {/* Product form */}
            {showForm && (
              <div className="admin-card">
                <h3 className="admin-card-title">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <form onSubmit={handleProductSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="admin-form-grid">
                    <div>
                      <label>Product Name *</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kanjivaram Silk Saree" required />
                    </div>
                    <div>
                      <label>Price (₹) *</label>
                      <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 5500" required />
                    </div>
                    <div>
                      <label>Category *</label>
                      <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                        <option value="">Select category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "1.5rem" }}>
                      <input
                        type="checkbox"
                        id="featured"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                        style={{ width: "auto", minHeight: "auto", height: 18, width: 18, accentColor: "var(--primary)" }}
                      />
                      <label htmlFor="featured" style={{ marginBottom: 0, textTransform: "none", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                        Mark as Featured
                      </label>
                    </div>
                  </div>

                  {/* Product attributes */}
                  <div>
                    <label style={{ marginBottom: "0.65rem", display: "block" }}>Product Attributes</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {[
                        { id: "is_handloom", label: "Genuine Handloom Product" },
                        { id: "has_multiple_colours", label: "Available in Multiple Colours" },
                        { id: "custom_orders", label: "Contact Us for Custom Orders" },
                      ].map(({ id, label }) => (
                        <div key={id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <input
                            type="checkbox"
                            id={id}
                            checked={form[id]}
                            onChange={(e) => setForm({ ...form, [id]: e.target.checked })}
                            style={{ width: "auto", minHeight: "auto", height: 17, width: 17, accentColor: "var(--primary)", flexShrink: 0 }}
                          />
                          <label htmlFor={id} style={{ marginBottom: 0, textTransform: "none", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                      Checked attributes appear as trust badges on the product page.
                    </p>
                  </div>

                  <div>
                    <label>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the saree — fabric, weave, occasion, etc." />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label>Product Images</label>

                    {/* Existing images (edit mode) */}
                    {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Current images:</p>
                        <div className="img-preview-grid">
                          {editingProduct.images.map((img, i) => (
                            <div key={img.id} className="img-preview-item">
                              <img src={img.url} alt="" />
                              {i === 0 && <span className="img-preview-label">Primary</span>}
                              <button
                                type="button"
                                className="img-preview-remove"
                                onClick={() => handleDeleteExistingImage(editingProduct.id, img.id)}
                                title="Delete image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New image previews */}
                    {imagePreviews.length > 0 && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>New images to upload:</p>
                        <div className="img-preview-grid">
                          {imagePreviews.map((prev, i) => (
                            <div key={i} className="img-preview-item">
                              <img src={prev.url} alt="" />
                              {i === 0 && !editingProduct?.images?.length && (
                                <span className="img-preview-label">Primary</span>
                              )}
                              <button type="button" className="img-preview-remove" onClick={() => removeNewImage(i)}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.65rem 1.25rem",
                        border: "1.5px dashed var(--border)",
                        borderRadius: 4,
                        background: "var(--cream)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        transition: "border-color 0.2s, color 0.2s",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      <ImagePlus size={16} />
                      {imagePreviews.length > 0 ? "Add More Images" : "Select Images"}
                    </button>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                      Select multiple images. First image will be the primary display photo.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button type="submit" className="btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Check size={15} />
                      {submitting ? "Saving..." : (editingProduct ? "Update Product" : "Add Product")}
                    </button>
                    <button type="button" className="admin-cancel-btn" onClick={() => { setShowForm(false); setEditingProduct(null); setNewImages([]); setImagePreviews([]); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products table */}
            <div className="admin-table-wrap" style={{ opacity: productsLoading ? 0.5 : 1, transition: "opacity 0.2s" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Photos</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.image_url
                          ? <img src={p.image_url} alt="" className="admin-thumb" />
                          : <div className="admin-thumb-placeholder">No img</div>
                        }
                      </td>
                      <td><strong style={{ color: "var(--text)" }}>{p.name}</strong></td>
                      <td style={{ color: "var(--text-muted)" }}>{p.category_name}</td>
                      <td style={{ fontWeight: 600, color: "var(--primary)", fontFamily: "'Playfair Display', serif" }}>
                        ₹{p.price.toLocaleString("en-IN")}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {p.images?.length || (p.image_url ? 1 : 0)}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleAvailability(p)}
                          title={p.is_available ? "Click to hide from store" : "Click to show in store"}
                          style={{
                            background: p.is_available ? "#DCFCE7" : "#F1F5F9",
                            color: p.is_available ? "#166534" : "#64748B",
                            border: "none",
                            borderRadius: 100,
                            padding: "3px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            letterSpacing: "0.03em",
                            transition: "opacity 0.15s",
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = "0.75"}
                          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                        >
                          {p.is_available ? "Visible" : "Hidden"}
                        </button>
                      </td>
                      <td>
                        {p.is_featured
                          ? <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 100, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>Featured</span>
                          : <span style={{ color: "var(--border)", fontSize: "0.8rem" }}>—</span>
                        }
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => handleEdit(p)} className="admin-edit-btn" title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(p.id)} className="admin-delete-btn" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productsLoading && products.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  Loading products…
                </div>
              )}
              {!productsLoading && products.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  No products yet. Add your first product above.
                </div>
              )}
            </div>

            {/* Pagination */}
            {productTotal > 0 && (
              <div className="pagination">
                <p className="pagination-info">
                  Showing {(productPage - 1) * PER_PAGE + 1}–{Math.min(productPage * PER_PAGE, productTotal)} of {productTotal} product{productTotal !== 1 ? "s" : ""}
                </p>
                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    onClick={() => goToPage(productPage - 1)}
                    disabled={productPage === 1}
                    title="Previous page"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {getPageNumbers(productPage, productPages).map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} style={{ padding: "0 0.25rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        className={`page-btn ${p === productPage ? "active" : ""}`}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    className="page-btn"
                    onClick={() => goToPage(productPage + 1)}
                    disabled={productPage === productPages}
                    title="Next page"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Categories Tab ─────────────── */}
        {tab === "categories" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Categories</h2>
            </div>

            <div className="admin-card">
              <h3 className="admin-card-title">Add Category</h3>
              <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label>Name *</label>
                  <input
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="e.g. Kanjivaram"
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label>Slug *</label>
                  <input
                    value={catForm.slug}
                    onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                    placeholder="e.g. kanjivaram"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ marginBottom: "0.05rem" }}>
                  <Plus size={15} /> Add
                </button>
              </form>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {categories.map((c) => (
                <div key={c.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff",
                  padding: "1rem 1.25rem",
                  borderRadius: 6,
                  border: "1px solid var(--border-light)",
                }}>
                  <div>
                    <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>{c.name}</strong>
                    <span style={{ marginLeft: "0.75rem", fontSize: "0.78rem", color: "var(--border)", fontFamily: "monospace", background: "var(--cream)", padding: "2px 8px", borderRadius: 3 }}>{c.slug}</span>
                  </div>
                  <button onClick={() => handleDeleteCat(c.id)} className="admin-delete-btn"><Trash2 size={14} /></button>
                </div>
              ))}
              {categories.length === 0 && (
                <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", background: "#fff", borderRadius: 6, border: "1px solid var(--border-light)" }}>
                  No categories yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Inquiries Tab ──────────────── */}
        {tab === "inquiries" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Customer Inquiries</h2>
              {unread > 0 && (
                <span style={{ background: "var(--primary)", color: "#fff", borderRadius: 100, padding: "0.25rem 0.9rem", fontSize: "0.78rem", fontWeight: 700 }}>
                  {unread} unread
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {inquiries.map((inq) => (
                <div key={inq.id} className={`inquiry-card ${!inq.is_read ? "unread" : ""}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <strong style={{ color: "var(--text)", fontSize: "1rem" }}>{inq.name}</strong>
                      <span style={{ marginLeft: "0.75rem", color: "var(--primary)", fontSize: "0.875rem", fontWeight: 500 }}>{inq.phone}</span>
                      {inq.email && <span style={{ marginLeft: "0.75rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>{inq.email}</span>}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {new Date(inq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {!inq.is_read && (
                        <button
                          onClick={() => markInquiryRead(inq.id).then(loadAll)}
                          style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "var(--cream-deep)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.3rem 0.75rem", cursor: "pointer", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}
                        >
                          <Check size={12} /> Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ color: "var(--text)", lineHeight: 1.65, marginBottom: "0.875rem", fontSize: "0.9rem" }}>{inq.message}</p>
                  <a
                    href={`https://wa.me/${inq.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#25D366", color: "#fff", padding: "0.45rem 1rem", borderRadius: 4, textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}
                  >
                    Reply on WhatsApp
                  </a>
                </div>
              ))}
              {inquiries.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 6, border: "1px solid var(--border-light)" }}>
                  No inquiries yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Reviews Tab ───────────────── */}
        {tab === "reviews" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2 className="admin-section-title">Customer Reviews ({adminReviews.length})</h2>
            </div>

            {adminReviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 6, border: "1px solid var(--border-light)" }}>
                No reviews yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {adminReviews.map((r) => (
                  <div key={r.id} style={{
                    background: "#fff", borderRadius: 8, padding: "1.1rem 1.25rem",
                    border: "1px solid var(--border-light)",
                    opacity: r.is_visible ? 1 : 0.55,
                    display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap",
                  }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.95rem" }}>{r.reviewer_name}</span>
                        <StarRating value={r.rating} size={15} />
                        {!r.is_visible && (
                          <span style={{ background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 100, padding: "1px 8px", fontSize: "0.7rem", color: "#999", fontWeight: 600 }}>Hidden</span>
                        )}
                      </div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                        on <strong style={{ color: "var(--primary)" }}>{r.product_name}</strong> · {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {r.comment && <p style={{ color: "var(--text)", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        onClick={() => toggleReviewVisibility(r.id).then(loadAll).catch(() => toast.error("Failed"))}
                        style={{ padding: "0.35rem 0.75rem", border: "1px solid var(--border-light)", borderRadius: 4, background: "var(--cream)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}
                      >
                        {r.is_visible ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => { if (!confirm("Delete this review?")) return; deleteReview(r.id).then(loadAll).catch(() => toast.error("Failed")); }}
                        style={{ padding: "0.35rem 0.75rem", border: "none", borderRadius: 4, background: "#fee2e2", cursor: "pointer", color: "#c0392b", fontWeight: 600, fontSize: "0.78rem" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ── Orders Tab ─────────────────── */}
        {tab === "orders" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Orders ({orders.length})</h2>
              <select
                value={orderStatusFilter}
                onChange={(e) => { setOrderStatusFilter(e.target.value); loadOrders(e.target.value); }}
                style={{ padding: "0.45rem 0.75rem", borderRadius: 6, border: "1px solid var(--border)", fontSize: "0.85rem", background: "#fff", cursor: "pointer" }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="ready_for_delivery">Ready for Delivery</option>
                <option value="picked_up">Picked Up</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            {ordersLoading ? (
              <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>Loading orders…</p>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                <ShoppingBag size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No orders found.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {orders.map((o) => {
                  const statusColors = {
                    pending: { bg: "#FEF3C7", color: "#92400E" },
                    confirmed: { bg: "#DBEAFE", color: "#1E40AF" },
                    ready_for_delivery: { bg: "#D1FAE5", color: "#065F46" },
                    picked_up: { bg: "#EDE9FE", color: "#5B21B6" },
                    delivered: { bg: "#DCFCE7", color: "#166534" },
                  };
                  const sc = statusColors[o.status] || { bg: "#F1F5F9", color: "#64748B" };
                  return (
                    <div key={o.id} style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", border: "1px solid var(--border-light)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>Order #{o.id}</p>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {o.customer?.name} · {o.payment_method === "cod" ? "💵 COD" : "💳 Paid"} · ₹{o.total?.toLocaleString("en-IN")}
                          </p>
                          <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>{o.delivery_address}</p>
                        </div>
                        <span style={{ padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, background: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>
                          {o.status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                        {o.items?.map((item, i) => (
                          <span key={i}>{item.name} ×{item.quantity}{i < o.items.length - 1 ? ", " : ""}</span>
                        ))}
                      </div>

                      {o.delivery_person && (
                        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#1a4080", fontWeight: 600 }}>
                          Delivery: {o.delivery_person.name} ({o.delivery_person.phone})
                        </p>
                      )}

                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {o.status === "pending" && o.payment_method === "cod" && (
                          <button
                            onClick={async () => {
                              try { await confirmOrder(o.id); toast.success("Order confirmed!"); loadOrders(orderStatusFilter); }
                              catch { toast.error("Failed to confirm"); }
                            }}
                            style={{ padding: "0.4rem 0.9rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}
                          >
                            <CheckCircle size={14} /> Confirm COD
                          </button>
                        )}
                        {o.status === "confirmed" && !o.delivery_person_id && (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", background: "#FEF9C3", color: "#854D0E", borderRadius: 6, fontSize: "0.82rem", fontWeight: 600, border: "1px solid #FDE047" }}>
                            <span style={{ fontSize: "0.9rem" }}>⏳</span> Waiting for shop to pack
                          </span>
                        )}
                        {o.status === "ready_for_delivery" && !o.delivery_person_id && (
                          <button
                            onClick={() => { setAssignModal({ orderId: o.id }); setAssignDpId(""); }}
                            style={{ padding: "0.4rem 0.9rem", background: "#1a4080", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}
                          >
                            <Truck size={14} /> Assign Delivery
                          </button>
                        )}
                        <a
                          href={`/track/${o.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: "0.4rem 0.9rem", background: "var(--cream)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}
                        >
                          Track
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Assign Delivery Modal */}
            {assignModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                <div style={{ background: "#fff", borderRadius: 12, padding: "1.75rem", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1.25rem", fontSize: "1rem", color: "var(--text)" }}>Assign Delivery Person</h3>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Select Delivery Person</label>
                  <select
                    value={assignDpId}
                    onChange={(e) => setAssignDpId(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 6, border: "1px solid var(--border)", fontSize: "0.9rem", marginBottom: "1.25rem" }}
                  >
                    <option value="">-- Select --</option>
                    {deliveryPersons.filter((dp) => dp.is_active).map((dp) => (
                      <option key={dp.id} value={dp.id}>{dp.name} ({dp.phone})</option>
                    ))}
                  </select>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      disabled={!assignDpId}
                      onClick={async () => {
                        try {
                          await assignDelivery(assignModal.orderId, parseInt(assignDpId));
                          toast.success("Delivery person assigned!");
                          setAssignModal(null);
                          loadOrders(orderStatusFilter);
                        } catch { toast.error("Failed to assign"); }
                      }}
                      style={{ flex: 1, padding: "0.6rem", background: "#1a4080", color: "#fff", border: "none", borderRadius: 6, cursor: assignDpId ? "pointer" : "not-allowed", fontWeight: 700, opacity: assignDpId ? 1 : 0.5 }}
                    >
                      Assign
                    </button>
                    <button onClick={() => setAssignModal(null)} style={{ flex: 1, padding: "0.6rem", background: "var(--cream)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Shop Owners Tab ────────────── */}
        {tab === "shopowners" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Shop Owners ({shopOwners.length})</h2>
              {pendingApprovals > 0 && (
                <span style={{ background: "var(--primary)", color: "#fff", borderRadius: 100, padding: "0.25rem 0.9rem", fontSize: "0.78rem", fontWeight: 700 }}>
                  {pendingApprovals} pending
                </span>
              )}
            </div>

            {shopOwnersLoading ? (
              <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>Loading…</p>
            ) : shopOwners.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                <Store size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No shop owners registered yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {shopOwners.map((s) => (
                  <div key={s.id} style={{ background: "#fff", borderRadius: 10, padding: "1.1rem 1.25rem", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--text)", fontSize: "0.95rem" }}>{s.name}</p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.shop_name} · {s.email} · {s.phone}</p>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Joined {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: s.is_approved ? "#D1FAE5" : "#FEF3C7", color: s.is_approved ? "#065F46" : "#92400E" }}>
                        {s.is_approved ? "Approved" : "Pending"}
                      </span>
                      {!s.is_approved && (
                        <button
                          onClick={async () => {
                            try { await approveShopOwner(s.id); toast.success(`${s.name} approved!`); loadShopOwners(); }
                            catch { toast.error("Failed"); }
                          }}
                          style={{ padding: "0.35rem 0.8rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}
                        >
                          <Check size={13} /> Approve
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          try { await toggleShopOwner(s.id); toast.success("Status updated"); loadShopOwners(); }
                          catch { toast.error("Failed"); }
                        }}
                        style={{ padding: "0.35rem 0.8rem", background: s.is_active ? "#fee2e2" : "#D1FAE5", color: s.is_active ? "#c0392b" : "#065F46", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Delivery Persons Tab ────────── */}
        {tab === "delivery" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Delivery Persons ({deliveryPersons.length})</h2>
              <button onClick={() => setShowDpForm((v) => !v)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Plus size={16} /> Add Person
              </button>
            </div>

            {showDpForm && (
              <div className="admin-card">
                <h3 className="admin-card-title">Add Delivery Person</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const pErr = phoneError(dpForm.phone, true);
                    if (pErr) { toast.error(pErr); return; }
                    setDpSubmitting(true);
                    try {
                      await createDeliveryPerson(dpForm);
                      toast.success("Delivery person created!");
                      setDpForm({ name: "", email: "", phone: "", password: "" });
                      setShowDpForm(false);
                      loadDeliveryPersons();
                    } catch (err) {
                      toast.error(err.response?.data?.detail || "Failed to create");
                    } finally {
                      setDpSubmitting(false);
                    }
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                  <div className="admin-form-grid">
                    <div>
                      <label>Name *</label>
                      <input value={dpForm.name} onChange={(e) => setDpForm({ ...dpForm, name: e.target.value })} placeholder="Full name" required />
                    </div>
                    <div>
                      <label>Email *</label>
                      <input type="email" value={dpForm.email} onChange={(e) => setDpForm({ ...dpForm, email: e.target.value })} placeholder="email@example.com" required />
                    </div>
                    <div>
                      <label>Phone *</label>
                      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border-light)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                        <span style={{ padding: "0.55rem 0.75rem", background: "var(--cream)", borderRight: "1px solid var(--border-light)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>+91</span>
                        <input type="tel" value={dpForm.phone} onChange={(e) => setDpForm({ ...dpForm, phone: stripPhone(e.target.value) })} placeholder="XXXXX XXXXX" maxLength={10} required style={{ border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
                      </div>
                    </div>
                    <div>
                      <label>Password *</label>
                      <input type="password" value={dpForm.password} onChange={(e) => setDpForm({ ...dpForm, password: e.target.value })} placeholder="Temporary password" required minLength={6} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="submit" className="btn-primary" disabled={dpSubmitting} style={{ opacity: dpSubmitting ? 0.7 : 1 }}>
                      {dpSubmitting ? "Creating…" : "Create"}
                    </button>
                    <button type="button" className="admin-cancel-btn" onClick={() => setShowDpForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {dpLoading ? (
              <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>Loading…</p>
            ) : deliveryPersons.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                <Truck size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No delivery persons yet. Add one above.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {deliveryPersons.map((dp) => (
                  <div key={dp.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                    {/* Clickable header row */}
                    <div
                      onClick={() => setExpandedDelivery(expandedDelivery === dp.id ? null : dp.id)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", cursor: "pointer", gap: "0.75rem" }}
                    >
                      <div style={{ display: "flex", gap: "0.85rem", alignItems: "center", flex: 1, minWidth: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: dp.is_active ? "var(--primary)" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>{dp.name?.[0]?.toUpperCase() || "?"}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: "var(--text)", fontSize: "0.97rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dp.name}</p>
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>{dp.email}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexShrink: 0 }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try { await toggleDeliveryPerson(dp.id); toast.success("Status updated"); loadDeliveryPersons(); }
                            catch { toast.error("Failed"); }
                          }}
                          style={{ padding: "0.3rem 0.85rem", background: dp.is_active ? "#fee2e2" : "#D1FAE5", color: dp.is_active ? "#c0392b" : "#065F46", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}
                        >
                          {dp.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{expandedDelivery === dp.id ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {/* Expandable detail panel */}
                    {expandedDelivery === dp.id && (
                      <div style={{ borderTop: "1px solid var(--border-light)", padding: "1rem 1.25rem", background: "var(--cream)" }}>
                        {editingDelivery?.id === dp.id ? (
                          /* ── Edit form ── */
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const pErr = phoneError(editingDelivery.phone);
                              if (pErr) { toast.error(pErr); return; }
                              setDeliverySaving(true);
                              try {
                                await updateDeliveryPerson(dp.id, {
                                  name: editingDelivery.name,
                                  email: editingDelivery.email,
                                  phone: editingDelivery.phone,
                                });
                                toast.success("Delivery person updated!");
                                setEditingDelivery(null);
                                loadDeliveryPersons();
                              } catch (err) {
                                toast.error(err.response?.data?.detail || "Failed to update");
                              } finally {
                                setDeliverySaving(false);
                              }
                            }}
                            style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
                          >
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                              <div>
                                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem", display: "block" }}>Name *</label>
                                <input value={editingDelivery.name} onChange={(e) => setEditingDelivery({ ...editingDelivery, name: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                              </div>
                              <div>
                                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem", display: "block" }}>Email *</label>
                                <input type="email" value={editingDelivery.email} onChange={(e) => setEditingDelivery({ ...editingDelivery, email: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                              </div>
                              <div>
                                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem", display: "block" }}>Phone</label>
                                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border-light)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                                  <span style={{ padding: "0.55rem 0.75rem", background: "var(--cream)", borderRight: "1px solid var(--border-light)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>+91</span>
                                  <input type="tel" value={editingDelivery.phone} onChange={(e) => setEditingDelivery({ ...editingDelivery, phone: stripPhone(e.target.value) })} placeholder="XXXXX XXXXX" maxLength={10} style={{ border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.6rem" }}>
                              <button type="submit" className="btn-primary" disabled={deliverySaving} style={{ padding: "0.45rem 1.1rem", fontSize: "0.82rem", opacity: deliverySaving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <Check size={13} /> {deliverySaving ? "Saving…" : "Save"}
                              </button>
                              <button type="button" onClick={() => setEditingDelivery(null)} style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", background: "#fff", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "var(--text-muted)" }}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* ── Read-only view ── */
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem", marginBottom: "0.75rem" }}>
                              {[
                                { label: "Phone", value: dp.phone ? formatPhone(dp.phone) : "—" },
                                { label: "Email", value: dp.email },
                                { label: "Total Deliveries", value: dp.total_deliveries ?? "—" },
                                { label: "Added On", value: dp.created_at ? new Date(dp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                              ].map(({ label, value }) => (
                                <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "0.55rem 0.85rem" }}>
                                  <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.2rem" }}>{label}</p>
                                  <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", margin: 0, wordBreak: "break-all" }}>{value}</p>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => setEditingDelivery({ id: dp.id, name: dp.name, email: dp.email, phone: dp.phone || "" })}
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600, padding: "0.38rem 0.9rem", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 7, cursor: "pointer" }}
                            >
                              <Edit2 size={12} /> Edit Details
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Delivery Zones (Pincodes) Tab ── */}
        {tab === "pincodes" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Delivery Zones — PIN Codes</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {pincodes.filter(p => p.is_active).length} active · {pincodes.length} total
              </span>
            </div>

            {/* Add form */}
            <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
              <h3 className="admin-card-title">Add PIN Code</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (pincodeForm.pincode.length !== 6 || !/^\d{6}$/.test(pincodeForm.pincode)) {
                    toast.error("PIN code must be exactly 6 digits");
                    return;
                  }
                  setPincodeSubmitting(true);
                  try {
                    await addPincode(pincodeForm);
                    toast.success(`PIN ${pincodeForm.pincode} added!`);
                    setPincodeForm({ pincode: "", city: "", state: "" });
                    loadPincodes();
                  } catch (err) {
                    toast.error(err.response?.data?.detail || "Failed to add pincode");
                  } finally {
                    setPincodeSubmitting(false);
                  }
                }}
                style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: 110 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>PIN Code *</label>
                  <input
                    value={pincodeForm.pincode}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="600001"
                    maxLength={6}
                    required
                    style={{ width: 110 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1, minWidth: 140 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>City</label>
                  <input
                    value={pincodeForm.city}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, city: e.target.value })}
                    placeholder="Chennai"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1, minWidth: 140 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>State</label>
                  <input
                    value={pincodeForm.state}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, state: e.target.value })}
                    placeholder="Tamil Nadu"
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={pincodeSubmitting} style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: pincodeSubmitting ? 0.7 : 1 }}>
                  <Plus size={15} /> {pincodeSubmitting ? "Adding…" : "Add PIN"}
                </button>
              </form>
            </div>

            {/* Pincodes list */}
            {pincodesLoading ? (
              <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>Loading…</p>
            ) : pincodes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                <MapPin size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No PIN codes added yet.</p>
                <p style={{ fontSize: "0.82rem", marginTop: "0.4rem" }}>Add PIN codes above — customers will see delivery availability on every product page.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>PIN Code</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Status</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pincodes.map((p) => (
                      <tr key={p.id}>
                        <td><strong style={{ fontFamily: "monospace", fontSize: "1rem", color: "var(--primary)", letterSpacing: "0.05em" }}>{p.pincode}</strong></td>
                        <td style={{ color: "var(--text)" }}>{p.city || "—"}</td>
                        <td style={{ color: "var(--text-muted)" }}>{p.state || "—"}</td>
                        <td>
                          <button
                            onClick={async () => {
                              try { await togglePincode(p.id); loadPincodes(); }
                              catch { toast.error("Failed"); }
                            }}
                            style={{
                              background: p.is_active ? "#DCFCE7" : "#F1F5F9",
                              color: p.is_active ? "#166534" : "#64748B",
                              border: "none", borderRadius: 100, padding: "3px 10px",
                              fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                            }}
                          >
                            {p.is_active ? "Active" : "Paused"}
                          </button>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          <button
                            onClick={async () => {
                              if (!confirm(`Remove PIN code ${p.pincode}?`)) return;
                              try { await deletePincode(p.id); toast.success("Removed"); loadPincodes(); }
                              catch { toast.error("Failed"); }
                            }}
                            className="admin-delete-btn"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "customers" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Customers</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{customers.length} registered</span>
            </div>

            {/* Search */}
            <div style={{ marginBottom: "1rem" }}>
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, email or phone…"
                style={{ width: "100%", maxWidth: 400 }}
              />
            </div>

            {customersLoading ? (
              <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>Loading…</p>
            ) : customers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                <Users size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No customers registered yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {customers
                  .filter((c) => {
                    const q = customerSearch.toLowerCase();
                    return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
                  })
                  .map((c) => (
                    <div key={c.id} className="admin-card" style={{ padding: "1rem 1.25rem" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "1rem" }}
                        onClick={() => setExpandedCustomer(expandedCustomer === c.id ? null : c.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1, minWidth: 0 }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{c.name?.[0]?.toUpperCase() || "?"}</span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{c.email}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Orders</p>
                            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--primary)", margin: 0 }}>{c.total_orders}</p>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{expandedCustomer === c.id ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {expandedCustomer === c.id && (
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-light)" }}>

                          {/* Editable: Name & Email */}
                          {editingCustomer?.id === c.id ? (
                            <div style={{ background: "#EFF6FF", borderRadius: 8, padding: "1rem", marginBottom: "0.75rem", border: "1px solid #BFDBFE" }}>
                              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.75rem" }}>Edit Name & Email</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                <div>
                                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Full Name</label>
                                  <input
                                    value={editingCustomer.name}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Email Address</label>
                                  <input
                                    type="email"
                                    value={editingCustomer.email}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                  />
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                                  <button
                                    onClick={async () => {
                                      setCustomerSaving(true);
                                      try {
                                        await updateAdminCustomer(c.id, { name: editingCustomer.name, email: editingCustomer.email });
                                        toast.success("Customer updated");
                                        setEditingCustomer(null);
                                        loadCustomers();
                                      } catch (err) {
                                        toast.error(err.response?.data?.detail || "Failed to update");
                                      } finally {
                                        setCustomerSaving(false);
                                      }
                                    }}
                                    disabled={customerSaving}
                                    style={{ padding: "0.4rem 1rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, opacity: customerSaving ? 0.7 : 1 }}
                                  >
                                    {customerSaving ? "Saving…" : "Save"}
                                  </button>
                                  <button
                                    onClick={() => setEditingCustomer(null)}
                                    style={{ padding: "0.4rem 0.9rem", background: "#fff", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
                              {[{ label: "Full Name", value: c.name }, { label: "Email Address", value: c.email }].map(({ label, value }) => (
                                <div key={label} style={{ background: "var(--cream)", borderRadius: 8, padding: "0.6rem 0.85rem" }}>
                                  <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.2rem" }}>{label}</p>
                                  <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", margin: 0, wordBreak: "break-all" }}>{value}</p>
                                </div>
                              ))}
                              <div style={{ gridColumn: "1 / -1" }}>
                                <button
                                  onClick={() => setEditingCustomer({ id: c.id, name: c.name, email: c.email })}
                                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.38rem 0.85rem", background: "#fff", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}
                                >
                                  <Edit2 size={13} /> Edit Name & Email
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Read-only contact & address details */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem" }}>
                            {[
                              { label: "Phone", value: c.phone ? formatPhone(c.phone) : "—" },
                              { label: "Secondary Phone", value: c.secondary_phone ? formatPhone(c.secondary_phone) : "—" },
                              { label: "City", value: c.city || "—" },
                              { label: "State", value: c.state || "—" },
                              { label: "PIN Code", value: c.pincode || "—" },
                            ].map(({ label, value }) => (
                              <div key={label} style={{ background: "var(--cream)", borderRadius: 8, padding: "0.6rem 0.85rem" }}>
                                <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.2rem" }}>{label}</p>
                                <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>{value}</p>
                              </div>
                            ))}
                            {c.address && (
                              <div style={{ gridColumn: "1 / -1", background: "var(--cream)", borderRadius: 8, padding: "0.6rem 0.85rem" }}>
                                <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.2rem" }}>Delivery Address</p>
                                <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>{c.address}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {tab === "payments" && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Payments Overview</h2>
              <button onClick={loadPayments} style={{ fontSize: "0.8rem", padding: "0.35rem 0.8rem", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Refresh</button>
            </div>

            {paymentsLoading || !paymentsData ? (
              <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>{paymentsLoading ? "Loading…" : "No data"}</p>
            ) : (() => {
              const s = paymentsData.summary;
              const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

              // Bar chart data for monthly collections
              const monthly = paymentsData.monthly;
              const maxVal = Math.max(...monthly.map((m) => m.collected), 1);

              // Payment status breakdown for donut
              const statusCounts = {};
              paymentsData.orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

              const PAYMENT_STATUS_COLOR = {
                confirmed: "#3B82F6", ready_for_delivery: "#10B981", picked_up: "#8B5CF6",
                delivered: "#22C55E", pending: "#F59E0B", cancelled: "#EF4444",
              };

              return (
                <>
                  {/* Stat cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    {[
                      { label: "Total Collected", value: fmt(s.total_collected), icon: <TrendingUp size={18} />, bg: "#D1FAE5", color: "#065F46" },
                      { label: "Online (Razorpay)", value: fmt(s.online_collected), sub: `${s.online_count} orders`, icon: <CreditCard size={18} />, bg: "#DBEAFE", color: "#1E40AF" },
                      { label: "Cash on Delivery", value: fmt(s.cod_collected), sub: `${s.cod_count} orders`, icon: <Banknote size={18} />, bg: "#FEF9C3", color: "#854D0E" },
                      { label: "Cancelled Orders", value: fmt(s.cancelled_value), sub: `${s.cancelled_count} orders`, icon: <XCircle size={18} />, bg: "#FEE2E2", color: "#991B1B" },
                      { label: "Pending / Unconfirmed", value: fmt(s.pending_value), sub: `${s.pending_count} orders`, icon: <Clock size={18} />, bg: "#FEF3C7", color: "#92400E" },
                      { label: "Paid Orders", value: s.paid_count, sub: `of ${s.total_orders} total`, icon: <CheckCircle size={18} />, bg: "#D1FAE5", color: "#065F46" },
                    ].map(({ label, value, sub, icon, bg, color }) => (
                      <div key={label} style={{ background: "#fff", borderRadius: 10, padding: "1.1rem 1.25rem", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.6rem", color }}>{icon}</div>
                        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.25rem" }}>{label}</p>
                        <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>{value}</p>
                        {sub && <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.1rem 0 0" }}>{sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>

                    {/* Monthly bar chart */}
                    <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", border: "1px solid var(--border-light)" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)", margin: "0 0 1.25rem" }}>Monthly Collections (Last 6 Months)</p>
                      {monthly.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>No data yet</p>
                      ) : (
                        <svg viewBox={`0 0 ${monthly.length * 60} 140`} style={{ width: "100%", maxHeight: 160, overflow: "visible", display: "block", margin: "0 auto" }}>
                          {monthly.map((m, i) => {
                            const barH = maxVal > 0 ? Math.max(4, (m.collected / maxVal) * 100) : 4;
                            const x = i * 60 + 10;
                            return (
                              <g key={i}>
                                <rect x={x} y={110 - barH} width={40} height={barH} rx={4} fill="#7B1D45" opacity="0.85" />
                                <text x={x + 20} y={108 - barH} textAnchor="middle" fontSize="8" fill="#555">{`₹${Math.round(m.collected / 1000)}k`}</text>
                                <text x={x + 20} y={126} textAnchor="middle" fontSize="9" fill="#888">{m.month}</text>
                                <text x={x + 20} y={137} textAnchor="middle" fontSize="8" fill="#aaa">{m.orders} ord</text>
                              </g>
                            );
                          })}
                        </svg>
                      )}
                    </div>

                    {/* Payment method donut */}
                    <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", border: "1px solid var(--border-light)" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)", margin: "0 0 1rem" }}>Payment Method Split</p>
                      {(() => {
                        const total = s.online_count + s.cod_count || 1;
                        const onlinePct = Math.round((s.online_count / total) * 100);
                        const codPct = 100 - onlinePct;
                        const r = 40, cx = 70, cy = 70;
                        const onlineAngle = (s.online_count / total) * 2 * Math.PI;
                        const x1 = cx + r * Math.sin(onlineAngle), y1 = cy - r * Math.cos(onlineAngle);
                        const large = onlineAngle > Math.PI ? 1 : 0;
                        return (
                          <>
                            <svg viewBox="0 0 140 140" style={{ width: "100%", maxWidth: 160, display: "block", margin: "0 auto" }}>
                              {s.online_count > 0 && s.cod_count > 0 ? (
                                <>
                                  <path d={`M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 ${large},1 ${x1},${y1} Z`} fill="#3B82F6" />
                                  <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${1 - large},1 ${cx},${cy - r} Z`} fill="#F59E0B" />
                                </>
                              ) : (
                                <circle cx={cx} cy={cy} r={r} fill={s.online_count > 0 ? "#3B82F6" : "#F59E0B"} />
                              )}
                              <circle cx={cx} cy={cy} r={22} fill="#fff" />
                              <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#333">{total}</text>
                            </svg>
                            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "0.75rem" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "#555" }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#3B82F6", display: "inline-block" }} />Online {onlinePct}%</span>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "#555" }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#F59E0B", display: "inline-block" }} />COD {codPct}%</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Orders payment table */}
                  <div style={{ background: "#fff", borderRadius: 10, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", margin: 0 }}>Recent Transactions (Last 50)</p>
                      <input value={paymentSearch} onChange={(e) => setPaymentSearch(e.target.value)} placeholder="Search customer or order ID…" style={{ width: 240, fontSize: "0.82rem" }} />
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                        <thead>
                          <tr style={{ background: "var(--cream)" }}>
                            {["Order ID", "Customer", "Amount", "Method", "Status", "Payment ID", "Date"].map((h) => (
                              <th key={h} style={{ padding: "0.65rem 1rem", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paymentsData.orders
                            .filter((o) => {
                              const q = paymentSearch.toLowerCase();
                              return !q || o.customer?.toLowerCase().includes(q) || String(o.id).includes(q) || o.email?.toLowerCase().includes(q);
                            })
                            .map((o, i) => {
                              const color = PAYMENT_STATUS_COLOR[o.status] || "#64748B";
                              const isPaid = ["confirmed", "ready_for_delivery", "picked_up", "delivered"].includes(o.status);
                              return (
                                <tr key={o.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-light)", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                                  <td style={{ padding: "0.7rem 1rem", fontWeight: 700, color: "var(--primary)" }}>#{o.id}</td>
                                  <td style={{ padding: "0.7rem 1rem" }}>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{o.customer}</p>
                                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>{o.email}</p>
                                  </td>
                                  <td style={{ padding: "0.7rem 1rem", fontWeight: 700, color: isPaid ? "#065F46" : o.status === "cancelled" ? "#991B1B" : "var(--text)" }}>
                                    {fmt(o.total)}
                                  </td>
                                  <td style={{ padding: "0.7rem 1rem" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.18rem 0.6rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: o.payment_method === "razorpay" ? "#DBEAFE" : "#FEF9C3", color: o.payment_method === "razorpay" ? "#1E40AF" : "#854D0E" }}>
                                      {o.payment_method === "razorpay" ? <><CreditCard size={10} /> Online</> : <><Banknote size={10} /> COD</>}
                                    </span>
                                  </td>
                                  <td style={{ padding: "0.7rem 1rem" }}>
                                    <span style={{ padding: "0.18rem 0.6rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: color + "22", color }}>{o.status.replace(/_/g, " ")}</span>
                                  </td>
                                  <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                                    {o.razorpay_payment_id || (o.payment_method === "cod" ? "COD" : "—")}
                                  </td>
                                  <td style={{ padding: "0.7rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                    {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </main>
    </div>
  );
}
