import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getAdminProducts, createProduct, updateProduct, deleteProduct, deleteProductImage,
  getCategories, createCategory, deleteCategory,
  getInquiries, markInquiryRead,
} from "../api";
import {
  LogOut, Plus, Trash2, Edit2, Package, Tag, MessageSquare,
  Menu, X, ImagePlus, Check, ChevronLeft, ChevronRight,
} from "lucide-react";

const EMPTY_FORM = { name: "", description: "", price: "", category_id: "", is_featured: false };
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
  const [tab, setTab] = useState("products");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Products with pagination
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productPages, setProductPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [catForm, setCatForm] = useState({ name: "", slug: "" });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const loadProducts = (page = productPage) => {
    getAdminProducts(page, PER_PAGE).then((r) => {
      setProducts(r.data.items);
      setProductTotal(r.data.total);
      setProductPages(r.data.pages);
      setProductPage(r.data.page);
    });
  };

  const loadAll = () => {
    loadProducts(1);
    getCategories().then((r) => setCategories(r.data));
    getInquiries().then((r) => setInquiries(r.data));
  };

  useEffect(() => { loadAll(); }, []);

  const goToPage = (page) => {
    if (page < 1 || page > productPages) return;
    loadProducts(page);
  };

  const logout = () => { localStorage.removeItem("admin_token"); navigate("/admin/login"); };

  const openAddForm = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setNewImages([]);
    setImagePreviews([]);
    setShowForm(true);
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description || "", price: p.price, category_id: p.category_id, is_featured: p.is_featured });
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
    newImages.forEach((img) => fd.append("images", img));

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

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    toast.success("Deleted");
    // If we deleted the last item on this page, go back one page
    const remaining = products.length - 1;
    const targetPage = remaining === 0 && productPage > 1 ? productPage - 1 : productPage;
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

  const NAV_ITEMS = [
    { key: "products", label: "Products", icon: <Package size={17} />, badge: productTotal || null },
    { key: "categories", label: "Categories", icon: <Tag size={17} />, badge: categories.length },
    { key: "inquiries", label: "Inquiries", icon: <MessageSquare size={17} />, badge: unread || null, badgeRed: true },
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
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Photos</th>
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
              {products.length === 0 && (
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
      </main>
    </div>
  );
}
