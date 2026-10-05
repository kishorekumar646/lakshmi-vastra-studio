import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { stripPhone, formatPhone, phoneError } from "../utils/phone";
import {
  getProducts, getAdminProducts, createProduct, updateProduct, deleteProduct, deleteProductImage,
  getCategories, createCategory, deleteCategory,
  getInquiries, markInquiryRead,
  getAdminReviews, deleteReview, toggleReviewVisibility,
  getAdminOrders, confirmOrder, assignDelivery, deleteOrders,
  getDeliveryPersons, createDeliveryPerson, toggleDeliveryPerson, updateDeliveryPerson,
  getShopOwners, approveShopOwner, toggleShopOwner, updateShopOwner, resetShopOwnerPassword, resetDeliveryPassword,
  getAdminShopProducts, assignProductToShop, unassignProductFromShop,
  getAdminPincodes, addPincode, deletePincode, togglePincode,
  getAdminCustomers,
  updateAdminCustomer,
  getAdminPayments,
  adminTrackOrder,
} from "../api";
import {
  LogOut, Plus, Trash2, Edit2, Package, Tag, MessageSquare,
  Menu, X, ImagePlus, Check, ChevronLeft, ChevronRight, Star,
  ShoppingBag, Truck, Store, Users, CheckCircle, TrendingUp, MapPin,
  CreditCard, Banknote, XCircle, Clock, AlertCircle, Mail, Phone, Calendar, Search, HelpCircle, Bell,
} from "lucide-react";
import StarRating from "../components/StarRating";
import { usePushNotifications } from "../hooks/usePushNotifications";
import AdminDashboardTab from "../components/AdminDashboardTab";
import { usePwaInstall } from "../hooks/usePwaInstall";
import InstallGuideSheet from "../components/InstallGuideSheet";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("admin_sidebar_collapsed") === "true");
  const toggleCollapse = () => setSidebarCollapsed((v) => { localStorage.setItem("admin_sidebar_collapsed", !v); return !v; });

  // Products — all fetched, paginated client-side
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStatusFilter, setProductStatusFilter] = useState("all");
  const [adminDeleteModal, setAdminDeleteModal] = useState(null);
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productPages, setProductPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [primaryFile, setPrimaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [savedProductName, setSavedProductName] = useState(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "" });
  const [submitting, setSubmitting] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const primaryFileRef = useRef();
  const additionalFileRef = useRef();
  const productFormRef = useRef();
  const navigate = useNavigate();

  // Orders tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { orderId }
  const [assignDpId, setAssignDpId] = useState("");
  const [trackModal, setTrackModal] = useState(null); // order data
  const [trackLoading, setTrackLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [deleteOrdersModal, setDeleteOrdersModal] = useState(false);
  const [deletingOrders, setDeletingOrders] = useState(false);

  // Delivery Persons tab
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [dpLoading, setDpLoading] = useState(false);
  const [showDpForm, setShowDpForm] = useState(false);
  const [dpForm, setDpForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [dpSubmitting, setDpSubmitting] = useState(false);

  // Shop Owners tab
  const [shopOwners, setShopOwners] = useState([]);
  const [shopOwnersLoading, setShopOwnersLoading] = useState(false);
  const [shopSearch, setShopSearch] = useState("");

  // Shop-Product assignments
  const [shopAssignments, setShopAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ product_id: "", shop_owner_id: "" });
  const [assigning, setAssigning] = useState(false);
  const loadShopAssignments = () =>
    getAdminShopProducts().then((r) => setShopAssignments(r.data)).catch(() => {});

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
  // Shop owner expand / edit
  const [expandedShopOwner, setExpandedShopOwner] = useState(null);
  const [editingShopOwner, setEditingShopOwner] = useState(null); // { id, name, shop_name, email, phone }
  const [shopOwnerSaving, setShopOwnerSaving] = useState(false);
  // Reset password modal: { type: "shop"|"delivery", id, name }
  const [resetPwModal, setResetPwModal] = useState(null);
  const [resetPwInput, setResetPwInput] = useState("");
  const [resetPwShow, setResetPwShow] = useState(false);
  const [resetPwLoading, setResetPwLoading] = useState(false);

  // Push notifications for admin
  usePushNotifications("admin", null, localStorage.getItem("admin_token"));
  const { canInstall, install, nativeInstall, hasNativePrompt, installing, installed: appInstalled, guideOpen, closeGuide } = usePwaInstall();

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

  const handleDeleteOrders = async () => {
    if (!selectedOrders.size) return;
    setDeletingOrders(true);
    try {
      const { data } = await deleteOrders([...selectedOrders]);
      toast.success(`${data.deleted} order${data.deleted !== 1 ? "s" : ""} deleted`);
      setSelectedOrders(new Set());
      setDeleteOrdersModal(false);
      loadOrders(orderStatusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete orders");
    } finally {
      setDeletingOrders(false);
    }
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
    loadShopAssignments();
    // Flat product list for assignment dropdown
    getAdminProducts(1, 200).then((r) => setAllProducts(r.data.items || [])).catch(() => {});
  };

  useEffect(() => { loadAll(); }, []);

  // Re-fetch relevant data when switching tabs
  useEffect(() => {
    if (tab === "products") loadProducts(1);
    else if (tab === "orders") loadOrders(orderStatusFilter);
    else if (tab === "delivery") loadDeliveryPersons();
    else if (tab === "shopowners") loadShopOwners();
    else if (tab === "customers") loadCustomers();
  }, [tab]);

  // Re-fetch when user returns to this browser tab
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      if (tab === "products") loadProducts(1);
      else if (tab === "orders") loadOrders(orderStatusFilter);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [tab, orderStatusFilter]);

  // Auto-refresh orders every 30s
  useEffect(() => {
    const prev = { pending: 0 };
    const iv = setInterval(async () => {
      try {
        const { data } = await getAdminOrders(1, 100, "");
        const items = data.items ?? data;
        const newPending = items.filter(o => o.status === "pending").length;
        if (newPending > prev.pending) {
          toast.success(`${newPending - prev.pending} new order(s) received!`);
        }
        prev.pending = newPending;
        setOrders(items);
      } catch {}
    }, 30000);
    return () => clearInterval(iv);
  }, []);

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

  const clearImageState = () => {
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    additionalPreviews.forEach((u) => URL.revokeObjectURL(u));
    setPrimaryFile(null);
    setPrimaryPreview(null);
    setAdditionalFiles([]);
    setAdditionalPreviews([]);
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    clearImageState();
    setSavedProductName(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    clearImageState();
    setSavedProductName(null);
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description || "", price: p.price, category_id: p.category_id, is_featured: p.is_featured, is_handloom: p.is_handloom || false, has_multiple_colours: p.has_multiple_colours || false, custom_orders: p.custom_orders || false });
    clearImageState();
    setSavedProductName(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrimarySelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    setPrimaryFile(file);
    setPrimaryPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removePrimary = () => {
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    setPrimaryFile(null);
    setPrimaryPreview(null);
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
    // Primary image first (sort_order=0), then additional images
    if (primaryFile) fd.append("images", primaryFile);
    additionalFiles.forEach((img) => fd.append("images", img));

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, fd);
        toast.success("Product updated!");
        loadProducts(productPage);
        setShowForm(false);
        setEditingProduct(null);
        setForm(EMPTY_FORM);
        clearImageState();
      } else {
        await createProduct(fd);
        const addedName = form.name;
        loadProducts(1);
        setSavedProductName(addedName);
        setForm(EMPTY_FORM);
        clearImageState();
      }
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

  const handleDelete = async () => {
    if (!adminDeleteModal) return;
    try {
      await deleteProduct(adminDeleteModal.id);
      toast.success("Deleted");
      const remaining = productTotal - 1;
      const targetPage = remaining > 0 && (productPage - 1) * PER_PAGE >= remaining
        ? productPage - 1
        : productPage;
      loadProducts(targetPage);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete");
    }
    setAdminDeleteModal(null);
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setAdminNotifOpen(v => !v)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
            <Bell size={18} color="#fff" />
            {pendingOrders > 0 && <span style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, background: "#fbbf24", borderRadius: "50%", border: "1.5px solid #1e0a15" }} />}
          </button>
          <button className="admin-mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Admin notification panel */}
      {adminNotifOpen && (
        <div style={{ position: "fixed", top: 52, right: 8, zIndex: 2500, background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", width: 300, maxHeight: 380, overflow: "auto", border: "1px solid #E2E8F0" }}>
          <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>Notifications</span>
            <button onClick={() => setAdminNotifOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={16} /></button>
          </div>
          {pendingOrders > 0 ? (
            <div style={{ padding: "0.85rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.65rem 0.85rem", borderRadius: 10, background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                <span style={{ fontSize: "1.2rem" }}>🛒</span>
                <div>
                  <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#C2410C" }}>{pendingOrders} Pending Order{pendingOrders > 1 ? "s" : ""}</p>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#9A3412" }}>Orders awaiting confirmation</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#94A3B8" }}>
              <Bell size={28} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontSize: "0.82rem" }}>No new notifications</p>
            </div>
          )}
          <div style={{ padding: "0.6rem 1rem", borderTop: "1px solid #F1F5F9" }}>
            <button
              onClick={async () => {
                try {
                  const reg = await navigator.serviceWorker?.ready;
                  if (reg) {
                    const perm = await Notification.requestPermission();
                    if (perm === "granted") toast.success("Push notifications enabled!");
                    else toast.error("Notification permission denied");
                  }
                } catch { toast.error("Could not enable notifications"); }
                setAdminNotifOpen(false);
              }}
              style={{ width: "100%", padding: "0.55rem", border: "1px solid #E2E8F0", borderRadius: 8, background: "#F8FAFC", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}
            >
              🔔 Enable Push Notifications
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar-wrap">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
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
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              <span className="anb-label" style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && (
                <span className="anb-label" style={{
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
        {canInstall && !sidebarCollapsed && (
          <button
            onClick={install}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              margin: "0 1rem 0.6rem", padding: "0.65rem 1rem",
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#F59E0B", borderRadius: 6, cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, width: "calc(100% - 2rem)",
            }}
          >
            <span style={{ fontSize: "1rem" }}>📲</span> Install App
          </button>
        )}
        <a href="/help?app=admin" className="admin-nav-btn" title={sidebarCollapsed ? "Help Center" : undefined} style={{ textDecoration: "none" }}>
          <HelpCircle size={17} /><span className="anb-label"> Help Center</span>
        </a>
        <button onClick={logout} className="admin-logout-btn" title={sidebarCollapsed ? "Logout" : undefined}>
          <LogOut size={14} /><span className="anb-label"> Logout</span>
        </button>
        {/* Sidebar footer branding */}
        <div className="sidebar-footer">
          <p className="sidebar-footer-product">Lakshmi Vastra Studio</p>
          <p className="sidebar-footer-cloud">Admin Portal</p>
          <p className="sidebar-footer-copy">© Copyright 2026 Lakshmi Vastra Studio</p>
        </div>
      </aside>
      {/* External collapse tab */}
      <button onClick={toggleCollapse} className="sidebar-toggle-tab" style={{ background: "#0F080D" }} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <span className={`sidebar-tri ${sidebarCollapsed ? "right" : "left"}`} />
      </button>
      </div>

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

        {/* ── Products Tab — list view ───── */}
        {tab === "products" && !showForm && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Products</h2>
              <button onClick={openAddForm} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Plus size={16} /> Add Product
              </button>
            </div>

            {/* Filter bar */}
            <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search by product name…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.55rem 0.85rem 0.55rem 2.2rem", border: "1.5px solid var(--border-light)", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box", background: "#fff" }}
                />
                <Search size={15} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              </div>
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                style={{ padding: "0.55rem 0.85rem", border: "1.5px solid var(--border-light)", borderRadius: 8, fontSize: "0.85rem", background: "#fff", cursor: "pointer", outline: "none" }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                style={{ padding: "0.55rem 0.85rem", border: "1.5px solid var(--border-light)", borderRadius: 8, fontSize: "0.85rem", background: "#fff", cursor: "pointer", outline: "none" }}
              >
                <option value="all">All Status</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="featured">Featured</option>
              </select>
              {(productSearch || productCategoryFilter !== "all" || productStatusFilter !== "all") && (
                <button
                  onClick={() => { setProductSearch(""); setProductCategoryFilter("all"); setProductStatusFilter("all"); }}
                  style={{ padding: "0.55rem 0.9rem", border: "1.5px solid var(--border-light)", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: "0.82rem", color: "#64748B", fontWeight: 600 }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="admin-table-wrap" style={{ opacity: productsLoading ? 0.5 : 1, transition: "opacity 0.2s" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Shop Owner</th>
                    <th>Price</th>
                    <th>Photos</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredProducts = products.filter((p) => {
                      if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false;
                      if (productCategoryFilter !== "all" && String(p.category_id) !== productCategoryFilter) return false;
                      if (productStatusFilter === "visible" && !p.is_available) return false;
                      if (productStatusFilter === "hidden" && p.is_available) return false;
                      if (productStatusFilter === "featured" && !p.is_featured) return false;
                      return true;
                    });
                    return filteredProducts;
                  })().map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.image_url
                          ? <img src={p.image_url} alt="" className="admin-thumb" />
                          : <div className="admin-thumb-placeholder">No img</div>
                        }
                      </td>
                      <td><strong style={{ color: "var(--text)" }}>{p.name}</strong></td>
                      <td style={{ color: "var(--text-muted)" }}>{p.category_name}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {p.shop_owner_name
                          ? <span style={{ background: "#F0F4FF", color: "#3B4F9E", borderRadius: 100, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>{p.shop_owner_name}</span>
                          : <span style={{ color: "var(--border)" }}>—</span>
                        }
                      </td>
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
                            border: "none", borderRadius: 100, padding: "3px 10px",
                            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                            letterSpacing: "0.03em", transition: "opacity 0.15s",
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
                          <button onClick={() => setAdminDeleteModal({ id: p.id, name: p.name })} className="admin-delete-btn" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productsLoading && products.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading products…</div>
              )}
              {!productsLoading && products.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No products yet. Add your first product.</div>
              )}
            </div>

            {productTotal > 0 && (
              <div className="pagination">
                <p className="pagination-info">
                  Showing {(productPage - 1) * PER_PAGE + 1}–{Math.min(productPage * PER_PAGE, productTotal)} of {productTotal} product{productTotal !== 1 ? "s" : ""}
                </p>
                <div className="pagination-controls">
                  <button className="page-btn" onClick={() => goToPage(productPage - 1)} disabled={productPage === 1} title="Previous page"><ChevronLeft size={15} /></button>
                  {getPageNumbers(productPage, productPages).map((p, i) =>
                    p === "…"
                      ? <span key={`ellipsis-${i}`} style={{ padding: "0 0.25rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>…</span>
                      : <button key={p} className={`page-btn ${p === productPage ? "active" : ""}`} onClick={() => goToPage(p)}>{p}</button>
                  )}
                  <button className="page-btn" onClick={() => goToPage(productPage + 1)} disabled={productPage === productPages} title="Next page"><ChevronRight size={15} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Products Tab — add / edit page ── */}
        {tab === "products" && showForm && (
          <div>
            {/* Page header bar */}
            <div className="form-top-bar">
              <button type="button" onClick={closeForm} className="form-back-btn">
                <ChevronLeft size={15} /> Back to Products
              </button>
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <div className="form-top-actions">
                <button type="button" className="admin-cancel-btn" onClick={closeForm}>Cancel</button>
                <button
                  type="button"
                  onClick={() => productFormRef.current?.requestSubmit()}
                  className="btn-primary"
                  disabled={submitting}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: submitting ? 0.7 : 1 }}
                >
                  <Check size={15} />
                  {submitting ? "Saving…" : (editingProduct ? "Update Product" : "Save Product")}
                </button>
              </div>
            </div>

            {/* Success banner — shown after adding a product */}
            {savedProductName && (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Check size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9rem", color: "#166534", fontWeight: 500 }}>
                    <strong>"{savedProductName}"</strong> added successfully!
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    onClick={() => setSavedProductName(null)}
                    className="btn-primary"
                    style={{ fontSize: "0.82rem", padding: "0.4rem 0.9rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <Plus size={13} /> Add Another
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    style={{ fontSize: "0.82rem", padding: "0.4rem 0.9rem", background: "none", border: "1px solid #BBF7D0", borderRadius: 6, color: "#166534", cursor: "pointer", fontWeight: 500 }}
                  >
                    Back to List
                  </button>
                </div>
              </div>
            )}

            {/* Two-column form */}
            <form ref={productFormRef} onSubmit={handleProductSubmit}>
              <div className="product-form-cols">

                {/* ── Left column ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                  {/* Product Details card */}
                  <div className="admin-card">
                    <h3 className="admin-card-title" style={{ marginBottom: "1.25rem" }}>Product Details</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                      <div>
                        <label>Product Name *</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kanjivaram Silk Saree" required />
                      </div>
                      <div className="form-field-row">
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
                      </div>
                      <div>
                        <label>Description</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe the saree — fabric, weave, occasion, care instructions…" style={{ resize: "vertical" }} />
                      </div>
                    </div>
                  </div>

                  {/* Attributes card */}
                  <div className="admin-card">
                    <h3 className="admin-card-title" style={{ marginBottom: "0.25rem" }}>Attributes & Visibility</h3>
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
                            id={id}
                            checked={form[id]}
                            onChange={(e) => setForm({ ...form, [id]: e.target.checked })}
                            style={{ width: "auto", minHeight: "auto", height: 16, width: 16, accentColor: "var(--primary)", flexShrink: 0, marginTop: 2 }}
                          />
                          <div>
                            <label htmlFor={id} style={{ marginBottom: 0, textTransform: "none", fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>{label}</label>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--text-muted)" }}>{hint}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── Right column — Images ── */}
                <div className="admin-card" style={{ position: "sticky", top: "1rem" }}>
                  <h3 className="admin-card-title" style={{ marginBottom: "1.25rem" }}>Product Images</h3>

                  {/* ── Primary Image (one only) ── */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)" }}>Primary Image</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>· 1 image only</span>
                    </div>
                    <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Main product photo shown in listings and search results.</p>

                    {/* Existing primary (edit mode) */}
                    {editingProduct?.images?.[0] && (
                      <div className="img-preview-item" style={{ marginBottom: "0.6rem" }}>
                        <img src={editingProduct.images[0].url} alt="" />
                        <span className="img-preview-label">Primary</span>
                        <button type="button" className="img-preview-remove" onClick={() => handleDeleteExistingImage(editingProduct.id, editingProduct.images[0].id)} title="Remove primary image">×</button>
                      </div>
                    )}

                    {/* New primary preview */}
                    {primaryPreview && (
                      <div className="img-preview-item" style={{ marginBottom: "0.6rem" }}>
                        <img src={primaryPreview} alt="" />
                        <span className="img-preview-label">New Primary</span>
                        <button type="button" className="img-preview-remove" onClick={removePrimary}>×</button>
                      </div>
                    )}

                    {/* Upload primary button — hidden when one is already set */}
                    {!editingProduct?.images?.[0] && !primaryPreview && (
                      <>
                        <input ref={primaryFileRef} type="file" accept="image/*" onChange={handlePrimarySelect} style={{ display: "none" }} />
                        <button
                          type="button"
                          onClick={() => primaryFileRef.current?.click()}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                            width: "100%", padding: "1.5rem 1rem",
                            border: "2px dashed var(--border)", borderRadius: 8,
                            background: "#FAFAF8", color: "var(--text-muted)",
                            cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
                            transition: "border-color 0.2s, color 0.2s, background 0.2s",
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.background = "#FDF8F0"; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "#FAFAF8"; }}
                        >
                          <ImagePlus size={18} /> Upload Primary Image
                        </button>
                      </>
                    )}
                    {/* Replace button when primary exists */}
                    {(editingProduct?.images?.[0] || primaryPreview) && !primaryPreview && (
                      <>
                        <input ref={primaryFileRef} type="file" accept="image/*" onChange={handlePrimarySelect} style={{ display: "none" }} />
                        <button type="button" onClick={() => primaryFileRef.current?.click()} style={{ fontSize: "0.78rem", color: "var(--primary)", background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.3rem 0.75rem", cursor: "pointer", marginTop: "0.4rem" }}>
                          Replace Primary
                        </button>
                      </>
                    )}
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0 0 1.25rem" }} />

                  {/* ── Additional Images (multiple) ── */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B" }}>Additional Images</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>· multiple allowed</span>
                    </div>
                    <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Extra photos shown in the product gallery.</p>

                    {/* Existing secondary images */}
                    {editingProduct?.images?.length > 1 && (
                      <div className="img-preview-grid" style={{ marginBottom: "0.75rem" }}>
                        {editingProduct.images.slice(1).map((img) => (
                          <div key={img.id} className="img-preview-item">
                            <img src={img.url} alt="" />
                            <button type="button" className="img-preview-remove" onClick={() => handleDeleteExistingImage(editingProduct.id, img.id)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New additional previews */}
                    {additionalPreviews.length > 0 && (
                      <div className="img-preview-grid" style={{ marginBottom: "0.75rem" }}>
                        {additionalPreviews.map((url, i) => (
                          <div key={i} className="img-preview-item">
                            <img src={url} alt="" />
                            <button type="button" className="img-preview-remove" onClick={() => removeAdditional(i)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input ref={additionalFileRef} type="file" accept="image/*" multiple onChange={handleAdditionalSelect} style={{ display: "none" }} />
                    <button
                      type="button"
                      onClick={() => additionalFileRef.current?.click()}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                        width: "100%", padding: "1rem",
                        border: "1.5px dashed var(--border)", borderRadius: 8,
                        background: "#FAFAF8", color: "var(--text-muted)",
                        cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
                        transition: "border-color 0.2s, color 0.2s",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = "#64748B"; e.currentTarget.style.color = "#64748B"; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      <ImagePlus size={16} />
                      <span>{additionalPreviews.length > 0 ? "Add More" : "Add Additional Images"}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom action bar */}
              <div className="form-bottom-bar">
                <button type="button" className="admin-cancel-btn" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: submitting ? 0.7 : 1 }}>
                  <Check size={15} />
                  {submitting ? "Saving…" : (editingProduct ? "Update Product" : "Save Product")}
                </button>
              </div>
            </form>
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
        {tab === "orders" && (() => {
          const ORDER_STATUS = {
            pending:              { bg: "#FEF3C7", color: "#92400E",  border: "#FDE047", label: "Pending",            dot: "#F59E0B" },
            confirmed:            { bg: "#DBEAFE", color: "#1E40AF",  border: "#93C5FD", label: "Confirmed",          dot: "#3B82F6" },
            ready_for_delivery:   { bg: "#D1FAE5", color: "#065F46",  border: "#6EE7B7", label: "Ready for Delivery", dot: "#10B981" },
            picked_up:            { bg: "#EDE9FE", color: "#5B21B6",  border: "#C4B5FD", label: "Picked Up",          dot: "#7C3AED" },
            delivered:            { bg: "#DCFCE7", color: "#166534",  border: "#86EFAC", label: "Delivered",          dot: "#16A34A" },
          };
          const STATUS_STEPS = ["pending", "confirmed", "ready_for_delivery", "picked_up", "delivered"];

          // Client-side filtering (search + payment)
          const filtered = orders.filter((o) => {
            const q = orderSearch.toLowerCase();
            if (q) {
              const match =
                String(o.id).includes(q) ||
                o.customer?.name?.toLowerCase().includes(q) ||
                o.customer?.phone?.includes(q) ||
                o.delivery_address?.toLowerCase().includes(q);
              if (!match) return false;
            }
            if (orderPaymentFilter !== "all" && o.payment_method !== orderPaymentFilter) return false;
            return true;
          });

          // Summary counts (from full list, not filtered)
          const counts = STATUS_STEPS.reduce((acc, s) => { acc[s] = orders.filter((o) => o.status === s).length; return acc; }, {});

          return (
            <div>
              {/* ── Status summary strip ── */}
              <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem", marginBottom: "1.25rem" }}>
                {[["all", "All", orders.length, "#64748B"], ...STATUS_STEPS.map((s) => [s, ORDER_STATUS[s]?.label, counts[s], ORDER_STATUS[s]?.dot])].map(([key, label, count, dotColor]) => (
                  <button
                    key={key}
                    onClick={() => { setOrderStatusFilter(key); setSelectedOrders(new Set()); loadOrders(key === "all" ? "all" : key); }}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: "0.4rem",
                      padding: "0.45rem 0.9rem", borderRadius: 8, border: "none", cursor: "pointer",
                      fontWeight: 700, fontSize: "0.8rem", transition: "all 0.15s",
                      background: orderStatusFilter === key ? "var(--primary)" : "#fff",
                      color: orderStatusFilter === key ? "#fff" : "#475569",
                      boxShadow: orderStatusFilter === key ? "0 2px 8px rgba(123,29,69,0.25)" : "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: orderStatusFilter === key ? "rgba(255,255,255,0.8)" : dotColor, flexShrink: 0 }} />
                    {label}
                    <span style={{ background: orderStatusFilter === key ? "rgba(255,255,255,0.2)" : "#F1F5F9", borderRadius: 20, padding: "0.05rem 0.45rem", fontSize: "0.72rem" }}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* ── Search + filter bar ── */}
              <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1.1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px", position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search by order #, customer name, phone, address…"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.85rem 0.55rem 2.2rem", border: "1.5px solid var(--border-light)", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box", background: "#fff" }}
                  />
                  <span style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}>🔍</span>
                </div>
                <select
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  style={{ padding: "0.55rem 0.85rem", border: "1.5px solid var(--border-light)", borderRadius: 8, fontSize: "0.85rem", background: "#fff", cursor: "pointer", outline: "none" }}
                >
                  <option value="all">All Payments</option>
                  <option value="cod">💵 COD</option>
                  <option value="razorpay">💳 Online</option>
                </select>
                <button
                  onClick={() => { setOrderSearch(""); setOrderPaymentFilter("all"); setOrderStatusFilter("all"); setSelectedOrders(new Set()); loadOrders("all"); }}
                  style={{ padding: "0.55rem 0.9rem", border: "1.5px solid var(--border-light)", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: "0.82rem", color: "#64748B", fontWeight: 600 }}
                >
                  Clear
                </button>
                <button
                  onClick={() => loadOrders(orderStatusFilter)}
                  style={{ padding: "0.55rem 0.9rem", border: "none", borderRadius: 8, background: "var(--primary)", color: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  ↻ Refresh
                </button>
              </div>

              {/* Bulk-action toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", minHeight: 36 }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "#475569", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((o) => selectedOrders.has(o.id))}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedOrders(new Set(filtered.map((o) => o.id)));
                      else setSelectedOrders(new Set());
                    }}
                    style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }}
                  />
                  Select all
                </label>
                <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                  {selectedOrders.size > 0 ? `${selectedOrders.size} selected` : `${filtered.length} of ${orders.length} orders`}
                </span>
                {selectedOrders.size > 0 && (
                  <button
                    onClick={() => setDeleteOrdersModal(true)}
                    style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", background: "#EF4444", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: "0.82rem" }}
                  >
                    <Trash2 size={14} /> Delete {selectedOrders.size} order{selectedOrders.size !== 1 ? "s" : ""}
                  </button>
                )}
              </div>

              {ordersLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, height: 110, animation: "pulse 1.5s ease-in-out infinite", border: "1px solid var(--border-light)" }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 12, border: "1px solid var(--border-light)" }}>
                  <ShoppingBag size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No orders found</p>
                  <p style={{ margin: "0.35rem 0 0", fontSize: "0.83rem" }}>Try a different filter or search term</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {filtered.map((o) => {
                    const sc = ORDER_STATUS[o.status] || { bg: "#F1F5F9", color: "#64748B", border: "#E2E8F0", label: o.status, dot: "#94A3B8" };
                    const stepIdx = STATUS_STEPS.indexOf(o.status);
                    const isExpanded = expandedOrder === o.id;
                    return (
                      <div key={o.id} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${selectedOrders.has(o.id) ? "var(--primary)" : sc.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden", transition: "border-color 0.15s" }}>
                        {/* ── Order header row ── */}
                        <div
                          onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                          style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(o.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const next = new Set(selectedOrders);
                              if (e.target.checked) next.add(o.id); else next.delete(o.id);
                              setSelectedOrders(next);
                            }}
                            style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer", flexShrink: 0 }}
                          />
                          {/* Status dot */}
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />

                          {/* Order ID */}
                          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text)", minWidth: 80 }}>#{o.id}</span>

                          {/* Customer */}
                          <div style={{ flex: "1 1 160px" }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>{o.customer?.name || "—"}</p>
                            <p style={{ margin: 0, fontSize: "0.73rem", color: "#94A3B8" }}>{o.customer?.phone}</p>
                          </div>

                          {/* Amount + payment */}
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "var(--primary)" }}>₹{o.total?.toLocaleString("en-IN")}</p>
                            <p style={{ margin: 0, fontSize: "0.7rem", color: "#94A3B8" }}>{o.payment_method === "cod" ? "💵 COD" : "💳 Paid"}</p>
                          </div>

                          {/* Status badge */}
                          <span style={{
                            padding: "0.3rem 0.8rem", borderRadius: 20, fontSize: "0.73rem", fontWeight: 700,
                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: "nowrap", flexShrink: 0,
                          }}>
                            {sc.label}
                          </span>

                          {/* Chevron */}
                          <span style={{ color: "#94A3B8", fontSize: "0.8rem", marginLeft: "auto" }}>{isExpanded ? "▲" : "▼"}</span>
                        </div>

                        {/* ── Progress bar ── */}
                        <div style={{ padding: "0 1.25rem", display: "flex", alignItems: "center", gap: 0, marginBottom: "0.1rem" }}>
                          {STATUS_STEPS.map((s, i) => {
                            const done = i <= stepIdx;
                            const active = i === stepIdx;
                            return (
                              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STATUS_STEPS.length - 1 ? 1 : 0 }}>
                                <div style={{
                                  width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                                  background: active ? sc.dot : done ? "#10B981" : "#E2E8F0",
                                  border: active ? `2px solid ${sc.dot}` : "none",
                                  boxShadow: active ? `0 0 0 3px ${sc.bg}` : "none",
                                }} />
                                {i < STATUS_STEPS.length - 1 && (
                                  <div style={{ flex: 1, height: 2, background: i < stepIdx ? "#10B981" : "#E2E8F0", margin: "0 1px" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* ── Expanded detail ── */}
                        {isExpanded && (
                          <div style={{ borderTop: `1px solid ${sc.border}`, padding: "1rem 1.25rem", background: "#FAFBFC" }}>
                            {/* Items with shop badges */}
                            <div style={{ marginBottom: "0.9rem" }}>
                              <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Items</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                {o.items?.map((item, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#fff", borderRadius: 8, padding: "0.45rem 0.75rem", border: "1px solid #E2E8F0" }}>
                                    {item.image_url && <img src={item.image_url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} />}
                                    <span style={{ fontWeight: 600, fontSize: "0.85rem", flex: 1 }}>{item.name}</span>
                                    <span style={{ fontSize: "0.78rem", color: "#64748B" }}>×{item.quantity}</span>
                                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)" }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                                    {item.shop_name && (
                                      <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#EEF2FF", color: "#4338CA", padding: "0.15rem 0.55rem", borderRadius: 20, whiteSpace: "nowrap", border: "1px solid #C7D2FE" }}>
                                        🏪 {item.shop_name}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Delivery address */}
                            <div style={{ marginBottom: "0.9rem", display: "flex", gap: "0.5rem" }}>
                              <span style={{ fontSize: "0.85rem" }}>📍</span>
                              <p style={{ margin: 0, fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>{o.delivery_address}</p>
                            </div>

                            {/* Delivery person */}
                            {o.delivery_person && (
                              <div style={{ marginBottom: "0.9rem", background: "#EFF6FF", borderRadius: 8, padding: "0.55rem 0.85rem", display: "flex", alignItems: "center", gap: "0.55rem" }}>
                                <Truck size={14} color="#1a4080" />
                                <p style={{ margin: 0, fontSize: "0.82rem", color: "#1a4080", fontWeight: 700 }}>
                                  {o.delivery_person.name} · {o.delivery_person.phone}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              {o.status === "pending" && o.payment_method === "cod" && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try { await confirmOrder(o.id); toast.success("Order confirmed!"); loadOrders(orderStatusFilter); }
                                    catch { toast.error("Failed to confirm"); }
                                  }}
                                  style={{ padding: "0.4rem 0.9rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}
                                >
                                  <CheckCircle size={13} /> Confirm COD
                                </button>
                              )}
                              {o.status === "confirmed" && !o.delivery_person && (
                                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", background: "#FEF9C3", color: "#854D0E", borderRadius: 6, fontSize: "0.82rem", fontWeight: 600, border: "1px solid #FDE047" }}>
                                  ⏳ Waiting for shop to pack
                                </span>
                              )}
                              {o.status === "ready_for_delivery" && !o.delivery_person && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAssignModal({ orderId: o.id }); setAssignDpId(""); }}
                                  style={{ padding: "0.4rem 0.9rem", background: "#1a4080", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}
                                >
                                  <Truck size={13} /> Assign Delivery
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrackLoading(true);
                                  adminTrackOrder(o.id)
                                    .then((r) => setTrackModal(r.data))
                                    .catch(() => toast.error("Failed to load tracking info"))
                                    .finally(() => setTrackLoading(false));
                                }}
                                style={{ padding: "0.4rem 0.9rem", background: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0", borderRadius: 6, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}
                              >
                                {trackLoading ? "…" : "📍 Track"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Admin Track Order Modal */}
              {trackModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setTrackModal(null)}>
                  <div style={{ background: "#fff", borderRadius: 14, padding: "1.75rem", maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                      <div>
                        <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1a4080", fontSize: "1.15rem" }}>Order #{trackModal.id} — Admin Track</h3>
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#888" }}>
                          {trackModal.payment_method === "cod" ? "Cash on Delivery" : "Paid via Razorpay"} · ₹{trackModal.total?.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <button onClick={() => setTrackModal(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "#888", lineHeight: 1 }}>×</button>
                    </div>

                    {/* Customer info */}
                    <div style={{ background: "#F0F7FF", borderRadius: 10, padding: "0.9rem 1.1rem", marginBottom: "1rem" }}>
                      <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#1a4080", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>Customer</p>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#222" }}>{trackModal.customer?.name || "—"}</p>
                      <p style={{ margin: "0.1rem 0 0", fontSize: "0.83rem", color: "#555" }}>{trackModal.customer?.email}</p>
                      {trackModal.customer?.phone && <p style={{ margin: "0.1rem 0 0", fontSize: "0.83rem", color: "#1a4080", fontWeight: 600 }}>📞 {trackModal.customer.phone}</p>}
                    </div>

                    {/* Delivery address */}
                    {trackModal.delivery_address && (
                      <div style={{ background: "#f8f7f5", borderRadius: 10, padding: "0.9rem 1.1rem", marginBottom: "1rem" }}>
                        <p style={{ margin: "0 0 0.3rem", fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Delivery Address</p>
                        <p style={{ margin: 0, fontSize: "0.88rem", color: "#555" }}>{trackModal.delivery_address}</p>
                      </div>
                    )}

                    {/* Delivery OTP — always visible to admin */}
                    {trackModal.delivery_otp && (
                      <div style={{ background: "linear-gradient(135deg, #1a4080 0%, #2563eb 100%)", borderRadius: 10, padding: "0.9rem 1.1rem", marginBottom: "1rem" }}>
                        <p style={{ margin: "0 0 0.4rem", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.06em" }}>🔐 Delivery OTP</p>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {trackModal.delivery_otp.split("").map((d, i) => (
                            <div key={i} style={{ width: 40, height: 46, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.4rem", fontWeight: 900 }}>{d}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery person */}
                    {trackModal.delivery_person && (
                      <div style={{ background: "#f8f7f5", borderRadius: 10, padding: "0.9rem 1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1a4080", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#fff", fontWeight: 700 }}>{trackModal.delivery_person.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Delivery Person</p>
                          <p style={{ margin: "0.1rem 0 0", fontWeight: 700, fontSize: "0.9rem", color: "#222" }}>{trackModal.delivery_person.name}</p>
                          {trackModal.delivery_person.phone && <p style={{ margin: 0, fontSize: "0.83rem", color: "#1a4080", fontWeight: 600 }}>📞 {trackModal.delivery_person.phone}</p>}
                        </div>
                      </div>
                    )}

                    {/* Status timeline */}
                    <div style={{ background: "#f8f7f5", borderRadius: 10, padding: "0.9rem 1.1rem", marginBottom: "1rem" }}>
                      <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status History</p>
                      {trackModal.status_history?.length ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                          {[...trackModal.status_history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((h, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a4080", flexShrink: 0, marginTop: "0.35rem" }} />
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#222", textTransform: "capitalize" }}>{h.status.replace(/_/g, " ")}</p>
                                {h.note && <p style={{ margin: "0.1rem 0 0", fontSize: "0.78rem", color: "#555" }}>{h.note}</p>}
                                <p style={{ margin: "0.1rem 0 0", fontSize: "0.73rem", color: "#aaa" }}>
                                  {new Date(h.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p style={{ margin: 0, fontSize: "0.83rem", color: "#bbb" }}>No history yet</p>}
                    </div>

                    {/* Items */}
                    <div style={{ background: "#f8f7f5", borderRadius: 10, padding: "0.9rem 1.1rem" }}>
                      <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Items</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {trackModal.items?.map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />}
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "#222" }}>{item.name}</p>
                                <p style={{ margin: 0, fontSize: "0.75rem", color: "#888" }}>
                                  Qty: {item.quantity}
                                  {item.shop_name && <span style={{ marginLeft: "0.5rem", background: "#EFF6FF", color: "#1a4080", padding: "0.1rem 0.4rem", borderRadius: 4, fontWeight: 600 }}>🏪 {item.shop_name}</span>}
                                </p>
                              </div>
                            </div>
                            <p style={{ margin: 0, fontWeight: 700, color: "#1a4080", fontSize: "0.88rem" }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ borderTop: "1px solid #e5e5e5", marginTop: "0.75rem", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Total</span>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a4080" }}>₹{trackModal.total?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assign Delivery Modal */}
              {/* Delete orders confirm modal */}
              {deleteOrdersModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setDeleteOrdersModal(false)}>
                  <div style={{ background: "#fff", borderRadius: 14, padding: "1.75rem", maxWidth: 400, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                      <Trash2 size={22} color="#EF4444" />
                    </div>
                    <h3 style={{ textAlign: "center", margin: "0 0 0.5rem", fontSize: "1.05rem", color: "#0F172A" }}>Delete {selectedOrders.size} Order{selectedOrders.size !== 1 ? "s" : ""}?</h3>
                    <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#64748B", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
                      This will permanently remove the selected order{selectedOrders.size !== 1 ? "s" : ""} and all associated data. This cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={() => setDeleteOrdersModal(false)}
                        style={{ flex: 1, padding: "0.75rem", border: "1.5px solid #E2E8F0", borderRadius: 10, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: "#475569" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteOrders}
                        disabled={deletingOrders}
                        style={{ flex: 1, padding: "0.75rem", border: "none", borderRadius: 10, background: "#EF4444", color: "#fff", cursor: deletingOrders ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.88rem", opacity: deletingOrders ? 0.7 : 1 }}
                      >
                        {deletingOrders ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
          );
        })()}

        {/* ── Shop Owners Tab ────────────── */}
        {tab === "shopowners" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Stats row */}
            <div className="stats-grid-4" style={{ gap: "0.75rem" }}>
              {[
                { label: "Total Shops", value: shopOwners.length, color: "#1E293B", bg: "#F1F5F9", icon: <Store size={18} /> },
                { label: "Approved", value: shopOwners.filter(s => s.is_approved).length, color: "#065F46", bg: "#D1FAE5", icon: <CheckCircle size={18} /> },
                { label: "Pending", value: shopOwners.filter(s => !s.is_approved).length, color: "#92400E", bg: "#FEF3C7", icon: <AlertCircle size={18} /> },
                { label: "Active Now", value: shopOwners.filter(s => s.is_active).length, color: "#1D4ED8", bg: "#DBEAFE", icon: <TrendingUp size={18} /> },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                    <span style={{ background: bg, color, borderRadius: 8, padding: "0.3rem", display: "flex", alignItems: "center" }}>{icon}</span>
                  </div>
                  <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Header + search */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <h2 className="admin-section-title" style={{ margin: 0, flex: 1 }}>Shop Owners</h2>
              <div style={{ position: "relative", minWidth: 220 }}>
                <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  value={shopSearch}
                  onChange={e => setShopSearch(e.target.value)}
                  placeholder="Search by name or shop…"
                  style={{ paddingLeft: "2rem", paddingRight: "0.75rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", border: "1.5px solid var(--border-light)", borderRadius: 8, fontSize: "0.85rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                />
              </div>
            </div>

            {/* Content */}
            {shopOwnersLoading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading…</div>
            ) : shopOwners.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#fff", borderRadius: 12, border: "1px solid var(--border-light)" }}>
                <Store size={40} style={{ opacity: 0.25, marginBottom: "0.75rem" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No shop owners registered yet.</p>
              </div>
            ) : (() => {
              const q = shopSearch.toLowerCase();
              const filtered = shopOwners.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.shop_name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q)
              );
              return filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", background: "#fff", borderRadius: 12, border: "1px solid var(--border-light)" }}>
                  No results for "<strong>{shopSearch}</strong>"
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {filtered.map((s) => {
                    const initials = s.shop_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                    const statusColor = s.is_approved ? "#065F46" : "#92400E";
                    const statusBg   = s.is_approved ? "#D1FAE5" : "#FEF3C7";
                    const isExpanded = expandedShopOwner === s.id;
                    return (
                      <div key={s.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid var(--border-light)", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                        {/* Clickable header row */}
                        <div
                          onClick={() => setExpandedShopOwner(isExpanded ? null : s.id)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", cursor: "pointer", gap: "0.75rem" }}
                        >
                          <div style={{ display: "flex", gap: "0.85rem", alignItems: "center", flex: 1, minWidth: 0 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg, #7B1D45, #1a4080)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem", fontFamily: "'Playfair Display', serif" }}>{initials}</span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 700, color: "var(--text)", fontSize: "0.97rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.shop_name}</p>
                              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name} · {s.email}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                            <span style={{ padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: statusBg, color: statusColor }}>
                              {s.is_approved ? "Approved" : "Pending"}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", fontWeight: 600, color: s.is_active ? "#065F46" : "#94a3b8", background: s.is_active ? "#F0FDF4" : "#F8FAFC", border: `1px solid ${s.is_active ? "#BBF7D0" : "#E2E8F0"}`, borderRadius: 20, padding: "0.2rem 0.55rem" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.is_active ? "#16a34a" : "#CBD5E1", display: "inline-block" }} />
                              {s.is_active ? "Active" : "Inactive"}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{isExpanded ? "▲" : "▼"}</span>
                          </div>
                        </div>

                        {/* Expandable panel */}
                        {isExpanded && (
                          <div style={{ borderTop: "1px solid var(--border-light)", padding: "1rem 1.25rem", background: "var(--cream)" }}>
                            {editingShopOwner?.id === s.id ? (
                              /* ── Edit form ── */
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  setShopOwnerSaving(true);
                                  try {
                                    await updateShopOwner(s.id, {
                                      name: editingShopOwner.name,
                                      shop_name: editingShopOwner.shop_name,
                                      email: editingShopOwner.email,
                                      phone: editingShopOwner.phone,
                                    });
                                    toast.success("Shop owner updated!");
                                    setEditingShopOwner(null);
                                    loadShopOwners();
                                  } catch (err) {
                                    toast.error(err.response?.data?.detail || "Failed to update");
                                  } finally {
                                    setShopOwnerSaving(false);
                                  }
                                }}
                                style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
                              >
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                                  <div>
                                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem", display: "block" }}>Owner Name *</label>
                                    <input value={editingShopOwner.name} onChange={(e) => setEditingShopOwner({ ...editingShopOwner, name: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem", display: "block" }}>Shop Name *</label>
                                    <input value={editingShopOwner.shop_name} onChange={(e) => setEditingShopOwner({ ...editingShopOwner, shop_name: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem", display: "block" }}>Email *</label>
                                    <input type="email" value={editingShopOwner.email} onChange={(e) => setEditingShopOwner({ ...editingShopOwner, email: e.target.value })} required style={{ width: "100%", boxSizing: "border-box" }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem", display: "block" }}>Phone</label>
                                    <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border-light)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                                      <span style={{ padding: "0.55rem 0.75rem", background: "var(--cream)", borderRight: "1px solid var(--border-light)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>+91</span>
                                      <input type="tel" value={editingShopOwner.phone} onChange={(e) => setEditingShopOwner({ ...editingShopOwner, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="XXXXX XXXXX" maxLength={10} style={{ border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.6rem" }}>
                                  <button type="submit" className="btn-primary" disabled={shopOwnerSaving} style={{ padding: "0.45rem 1.1rem", fontSize: "0.82rem", opacity: shopOwnerSaving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                    <Check size={13} /> {shopOwnerSaving ? "Saving…" : "Save Changes"}
                                  </button>
                                  <button type="button" onClick={() => setEditingShopOwner(null)} style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", background: "#fff", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "var(--text-muted)" }}>
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              /* ── Read-only + actions ── */
                              <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem", marginBottom: "0.85rem" }}>
                                  {[
                                    { label: "Owner Name", value: s.name },
                                    { label: "Shop Name", value: s.shop_name },
                                    { label: "Email", value: s.email },
                                    { label: "Phone", value: s.phone ? `+91 ${s.phone}` : "—" },
                                    { label: "Joined", value: s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                                  ].map(({ label, value }) => (
                                    <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "0.55rem 0.85rem" }}>
                                      <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.2rem" }}>{label}</p>
                                      <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", margin: 0, wordBreak: "break-all" }}>{value}</p>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                  <button
                                    onClick={() => setEditingShopOwner({ id: s.id, name: s.name, shop_name: s.shop_name, email: s.email, phone: s.phone || "" })}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, padding: "0.4rem 0.9rem", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 7, cursor: "pointer" }}
                                  >
                                    <Edit2 size={12} /> Edit Details
                                  </button>
                                  {!s.is_approved && (
                                    <button
                                      onClick={async () => {
                                        try { await approveShopOwner(s.id); toast.success(`${s.shop_name} approved!`); loadShopOwners(); }
                                        catch { toast.error("Failed"); }
                                      }}
                                      style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, padding: "0.4rem 0.9rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer" }}
                                    >
                                      <Check size={12} /> Approve
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      try { await toggleShopOwner(s.id); toast.success("Status updated"); loadShopOwners(); }
                                      catch { toast.error("Failed"); }
                                    }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, padding: "0.4rem 0.9rem", background: s.is_active ? "#FEF2F2" : "#F0FDF4", color: s.is_active ? "#DC2626" : "#16a34a", border: `1px solid ${s.is_active ? "#FECACA" : "#BBF7D0"}`, borderRadius: 7, cursor: "pointer" }}
                                  >
                                    {s.is_active ? "Deactivate" : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => { setResetPwModal({ type: "shop", id: s.id, name: s.shop_name }); setResetPwInput(""); setResetPwShow(false); }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, padding: "0.4rem 0.9rem", background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE", borderRadius: 7, cursor: "pointer" }}
                                  >
                                    🔑 Reset Password
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                      className="dp-card-header"
                      onClick={() => setExpandedDelivery(expandedDelivery === dp.id ? null : dp.id)}
                    >
                      <div className="dp-card-info">
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: dp.is_active ? "var(--primary)" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>{dp.name?.[0]?.toUpperCase() || "?"}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: "var(--text)", fontSize: "0.97rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dp.name}</p>
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>{dp.phone ? formatPhone(dp.phone) : dp.email}</p>
                        </div>
                      </div>
                      <div className="dp-card-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDelivery({ id: dp.id, name: dp.name, email: dp.email, phone: dp.phone || "" });
                            setExpandedDelivery(dp.id);
                          }}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.75rem", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try { await toggleDeliveryPerson(dp.id); toast.success("Status updated"); loadDeliveryPersons(); }
                            catch { toast.error("Failed"); }
                          }}
                          style={{ padding: "0.3rem 0.75rem", background: dp.is_active ? "#fee2e2" : "#D1FAE5", color: dp.is_active ? "#c0392b" : "#065F46", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}
                        >
                          {dp.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setResetPwModal({ type: "delivery", id: dp.id, name: dp.name }); setResetPwInput(""); setResetPwShow(false); }}
                          style={{ padding: "0.3rem 0.75rem", background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}
                        >
                          🔑 Reset
                        </button>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.15rem" }}>{expandedDelivery === dp.id ? "▲" : "▼"}</span>
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
                    placeholder="515402"
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
                    placeholder="Gooty RS"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1, minWidth: 140 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>State</label>
                  <input
                    value={pincodeForm.state}
                    onChange={(e) => setPincodeForm({ ...pincodeForm, state: e.target.value })}
                    placeholder="Andhra Pradesh"
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
                        className="customer-card-row"
                        onClick={() => setExpandedCustomer(expandedCustomer === c.id ? null : c.id)}
                      >
                        <div className="customer-card-info">
                          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{c.name?.[0]?.toUpperCase() || "?"}</span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</p>
                          </div>
                        </div>
                        <div className="customer-card-meta">
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Orders</p>
                            <p style={{ fontWeight: 700, fontSize: "0.97rem", color: "var(--primary)", margin: 0 }}>{c.total_orders}</p>
                          </div>
                          <span className="customer-date">
                            {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
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
                  <div className="chart-grid">

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
                      <input value={paymentSearch} onChange={(e) => setPaymentSearch(e.target.value)} placeholder="Search customer or order ID…" style={{ width: "100%", maxWidth: 240, fontSize: "0.82rem" }} />
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

      {/* ── Reset Password Modal ────────────────────── */}
      {resetPwModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "1.75rem", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>🔑</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "#1E293B" }}>Reset Password</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748B" }}>{resetPwModal.name}</p>
              </div>
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>New Password</label>
              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                <input
                  type={resetPwShow ? "text" : "password"}
                  value={resetPwInput}
                  onChange={(e) => setResetPwInput(e.target.value)}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  autoFocus
                  style={{ flex: 1, padding: "0.65rem 0.85rem", border: "none", fontSize: "0.95rem", outline: "none", background: "#F8FAFC" }}
                />
                <button
                  type="button"
                  onClick={() => setResetPwShow(v => !v)}
                  style={{ padding: "0.65rem 0.85rem", background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {resetPwShow ? "Hide" : "Show"}
                </button>
              </div>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.72rem", color: "#94A3B8" }}>This replaces the current password immediately.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setResetPwModal(null)}
                style={{ flex: 1, padding: "0.65rem", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetPwLoading || resetPwInput.length < 6}
                onClick={async () => {
                  setResetPwLoading(true);
                  try {
                    if (resetPwModal.type === "shop") {
                      await resetShopOwnerPassword(resetPwModal.id, resetPwInput);
                    } else {
                      await resetDeliveryPassword(resetPwModal.id, resetPwInput);
                    }
                    toast.success(`Password reset for ${resetPwModal.name}`);
                    setResetPwModal(null);
                    setResetPwInput("");
                  } catch (err) {
                    toast.error(err.response?.data?.detail || "Failed to reset password");
                  } finally {
                    setResetPwLoading(false);
                  }
                }}
                style={{ flex: 1, padding: "0.65rem", background: resetPwInput.length < 6 ? "#E2E8F0" : "#6D28D9", color: resetPwInput.length < 6 ? "#94A3B8" : "#fff", border: "none", borderRadius: 8, cursor: resetPwInput.length < 6 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.875rem", opacity: resetPwLoading ? 0.7 : 1, transition: "background 0.2s" }}
              >
                {resetPwLoading ? "Resetting…" : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {adminDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem 1.5rem", maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.1rem", fontSize: "1.5rem" }}>🗑️</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 800, color: "#0F172A" }}>Delete Product?</h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: "#64748B", lineHeight: 1.5 }}>
              "<strong>{adminDeleteModal.name}</strong>" will be permanently deleted and cannot be recovered.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setAdminDeleteModal(null)} style={{ flex: 1, padding: "0.75rem", border: "1.5px solid #E2E8F0", borderRadius: 10, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: "#475569" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "0.75rem", border: "none", borderRadius: 10, background: "#EF4444", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.88rem" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <InstallGuideSheet
        open={guideOpen}
        onClose={closeGuide}
        appName="Admin Panel"
        iconEmoji="🛡️"
        iconSrc="/icon-admin.png"
        themeColor="#1E293B"
        tagline="LV Studio — Admin Dashboard"
        features={[
          { icon: "📦", text: "Manage products, orders & categories" },
          { icon: "🏪", text: "Approve shop owners & manage delivery" },
          { icon: "📊", text: "View payments & customer insights" },
          { icon: "⚡", text: "Works offline, opens like a native app" },
        ]}
        hasNativePrompt={hasNativePrompt}
        onNativeInstall={nativeInstall}
        installing={installing}
        installed={appInstalled}
      />
    </div>
  );
}
