import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, deleteCategory,
  getInquiries, markInquiryRead,
} from "../api";
import { LogOut, Plus, Trash2, Edit, Package, Tag, MessageSquare } from "lucide-react";

export default function AdminDashboard() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", description: "", price: "", category_id: "", is_featured: false, image: null });
  const [catForm, setCatForm] = useState({ name: "", slug: "" });

  const loadAll = () => {
    getProducts({}).then((r) => setProducts(r.data));
    getCategories().then((r) => setCategories(r.data));
    getInquiries().then((r) => setInquiries(r.data));
  };

  useEffect(() => { loadAll(); }, []);

  const logout = () => { localStorage.removeItem("admin_token"); navigate("/admin/login"); };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("price", form.price);
    fd.append("category_id", form.category_id);
    fd.append("is_featured", form.is_featured);
    if (form.image) fd.append("image", form.image);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, fd);
        toast.success("Product updated!");
      } else {
        await createProduct(fd);
        toast.success("Product added!");
      }
      setShowForm(false);
      setEditingProduct(null);
      setForm({ name: "", description: "", price: "", category_id: "", is_featured: false, image: null });
      loadAll();
    } catch {
      toast.error("Failed to save product.");
    }
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description || "", price: p.price, category_id: p.category_id, is_featured: p.is_featured, image: null });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    toast.success("Deleted");
    loadAll();
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

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <h2 style={styles.sidebarTitle}>Admin Panel</h2>
          <p style={styles.sidebarSub}>Lakshmi Vastra Studio</p>
        </div>
        <nav style={styles.nav}>
          {[
            { key: "products", label: "Products", icon: <Package size={18} /> },
            { key: "categories", label: "Categories", icon: <Tag size={18} /> },
            { key: "inquiries", label: `Inquiries${unread > 0 ? ` (${unread})` : ""}`, icon: <MessageSquare size={18} /> },
          ].map((item) => (
            <button key={item.key} onClick={() => { setTab(item.key); setShowForm(false); }} style={{ ...styles.navBtn, ...(tab === item.key ? styles.navBtnActive : {}) }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button onClick={logout} style={styles.logoutBtn}><LogOut size={16} /> Logout</button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* Products Tab */}
        {tab === "products" && (
          <div>
            <div style={styles.tabHeader}>
              <h2 style={styles.tabTitle}>Products</h2>
              <button onClick={() => { setShowForm(!showForm); setEditingProduct(null); setForm({ name: "", description: "", price: "", category_id: "", is_featured: false, image: null }); }} className="btn-primary">
                <Plus size={16} style={{ display: "inline", marginRight: 6 }} />Add Product
              </button>
            </div>

            {showForm && (
              <div style={styles.formCard}>
                <h3 style={styles.formTitle}>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <form onSubmit={handleProductSubmit} style={styles.form}>
                  <div style={styles.formGrid}>
                    <div><label>Product Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                    <div><label>Price (₹) *</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                    <div>
                      <label>Category *</label>
                      <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                        <option value="">Select category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
                      <input type="checkbox" id="featured" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} style={{ width: "auto" }} />
                      <label htmlFor="featured" style={{ marginBottom: 0 }}>Mark as Featured</label>
                    </div>
                  </div>
                  <div><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                  <div><label>Product Image</label><input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} /></div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="submit" className="btn-primary">{editingProduct ? "Update Product" : "Add Product"}</button>
                    <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} style={styles.cancelBtn}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div style={styles.table}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={styles.th}>
                  <th style={styles.thCell}>Image</th>
                  <th style={styles.thCell}>Name</th>
                  <th style={styles.thCell}>Category</th>
                  <th style={styles.thCell}>Price</th>
                  <th style={styles.thCell}>Featured</th>
                  <th style={styles.thCell}>Actions</th>
                </tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}>{p.image_url ? <img src={p.image_url} alt="" style={styles.thumb} /> : <div style={styles.noImg}>—</div>}</td>
                      <td style={styles.td}><strong>{p.name}</strong></td>
                      <td style={styles.td}>{p.category_name}</td>
                      <td style={styles.td}>₹{p.price.toLocaleString("en-IN")}</td>
                      <td style={styles.td}>{p.is_featured ? "✓" : "—"}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => handleEdit(p)} style={styles.editBtn}><Edit size={15} /></button>
                          <button onClick={() => handleDelete(p.id)} style={styles.deleteBtn}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <p style={styles.empty}>No products yet. Add your first product above.</p>}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {tab === "categories" && (
          <div>
            <h2 style={styles.tabTitle}>Categories</h2>
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>Add Category</h3>
              <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}><label>Name *</label><input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} required /></div>
                <div style={{ flex: 1, minWidth: 180 }}><label>Slug *</label><input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} required /></div>
                <button type="submit" className="btn-primary" style={{ marginBottom: "0.1rem" }}>Add</button>
              </form>
            </div>
            <div style={styles.catList}>
              {categories.map((c) => (
                <div key={c.id} style={styles.catItem}>
                  <div><strong>{c.name}</strong><span style={styles.slug}>{c.slug}</span></div>
                  <button onClick={() => handleDeleteCat(c.id)} style={styles.deleteBtn}><Trash2 size={15} /></button>
                </div>
              ))}
              {categories.length === 0 && <p style={styles.empty}>No categories yet.</p>}
            </div>
          </div>
        )}

        {/* Inquiries Tab */}
        {tab === "inquiries" && (
          <div>
            <h2 style={styles.tabTitle}>Customer Inquiries</h2>
            <div style={styles.inquiryList}>
              {inquiries.map((i) => (
                <div key={i.id} style={{ ...styles.inquiryCard, background: i.is_read ? "#fff" : "#FDF8F0", borderLeft: i.is_read ? "4px solid #ddd" : "4px solid #8B1A1A" }}>
                  <div style={styles.inquiryHeader}>
                    <div>
                      <strong>{i.name}</strong>
                      <span style={styles.inqPhone}>{i.phone}</span>
                      {i.email && <span style={styles.inqEmail}>{i.email}</span>}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <span style={styles.inqDate}>{new Date(i.created_at).toLocaleDateString("en-IN")}</span>
                      {!i.is_read && <button onClick={() => markInquiryRead(i.id).then(loadAll)} style={styles.readBtn}>Mark Read</button>}
                    </div>
                  </div>
                  <p style={styles.inqMsg}>{i.message}</p>
                  <a href={`https://wa.me/${i.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={styles.replyBtn}>Reply on WhatsApp</a>
                </div>
              ))}
              {inquiries.length === 0 && <p style={styles.empty}>No inquiries yet.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh", background: "#F8F4EF" },
  sidebar: { width: 240, background: "#2C1810", display: "flex", flexDirection: "column", padding: "1.5rem 0" },
  sidebarLogo: { padding: "0 1.5rem 1.5rem", borderBottom: "1px solid #4A2C1C" },
  sidebarTitle: { fontFamily: "'Playfair Display', serif", color: "#C9A84C", fontSize: "1.1rem" },
  sidebarSub: { color: "#B0927E", fontSize: "0.75rem", marginTop: "0.25rem" },
  nav: { padding: "1rem 0", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.875rem 1.5rem", background: "none", border: "none", color: "#E8D5C4", cursor: "pointer", fontSize: "0.9rem", textAlign: "left", transition: "background 0.2s" },
  navBtnActive: { background: "rgba(201,168,76,0.15)", color: "#C9A84C" },
  logoutBtn: { display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 1rem", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid #4A2C1C", color: "#B0927E", borderRadius: 6, cursor: "pointer", fontSize: "0.875rem" },
  main: { flex: 1, padding: "2rem", overflowY: "auto" },
  tabHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  tabTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", color: "#8B1A1A" },
  formCard: { background: "#fff", borderRadius: 10, padding: "1.75rem", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  formTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#2C1810", marginBottom: "1.25rem" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" },
  cancelBtn: { padding: "0.75rem 1.5rem", border: "1px solid #ddd", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: "1rem" },
  table: { background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  th: { background: "#8B1A1A", color: "#fff" },
  thCell: { padding: "0.875rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.85rem" },
  tr: { borderBottom: "1px solid #F0EAE0" },
  td: { padding: "0.875rem 1rem", fontSize: "0.9rem", verticalAlign: "middle" },
  thumb: { width: 48, height: 48, objectFit: "cover", borderRadius: 4 },
  noImg: { width: 48, height: 48, background: "#f0f0f0", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" },
  editBtn: { background: "#F0E8D8", border: "none", borderRadius: 4, padding: "0.4rem 0.6rem", cursor: "pointer", color: "#8B1A1A" },
  deleteBtn: { background: "#FEE2E2", border: "none", borderRadius: 4, padding: "0.4rem 0.6rem", cursor: "pointer", color: "#DC2626" },
  empty: { textAlign: "center", padding: "3rem", color: "#6B5744" },
  catList: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  catItem: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "1rem 1.25rem", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  slug: { marginLeft: "0.75rem", fontSize: "0.8rem", color: "#999", fontFamily: "monospace" },
  inquiryList: { display: "flex", flexDirection: "column", gap: "1rem" },
  inquiryCard: { borderRadius: 8, padding: "1.25rem 1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  inquiryHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" },
  inqPhone: { marginLeft: "0.75rem", color: "#8B1A1A", fontSize: "0.875rem" },
  inqEmail: { marginLeft: "0.75rem", color: "#6B5744", fontSize: "0.875rem" },
  inqDate: { fontSize: "0.8rem", color: "#999" },
  inqMsg: { color: "#2C1810", lineHeight: 1.6, marginBottom: "0.75rem" },
  readBtn: { background: "#F0E8D8", border: "none", borderRadius: 4, padding: "0.35rem 0.75rem", cursor: "pointer", color: "#8B1A1A", fontSize: "0.8rem" },
  replyBtn: { display: "inline-block", background: "#25D366", color: "#fff", padding: "0.4rem 1rem", borderRadius: 4, textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 },
};
