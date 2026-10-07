import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getCategories, getShopProducts, createShopProduct, updateShopProduct, deleteShopProduct,
  deleteShopProductImage,
  getShopOrders, getShopOrderQr, shopScanQr, shopMarkOrderReady, shopConfirmOrder, getPublicProduct,
  uploadShopAvatar, getShopMe, updateShopMe, changeShopPassword, shopAcceptReturn, shopRejectReturn, shopMarkRefundSent,
} from "../api";
import { LogOut, Plus, Trash2, Edit2, Package, ShoppingBag, QrCode, ScanLine, X, ImagePlus, ChevronLeft, Check, Menu, Camera, UserCircle, HelpCircle, CheckCircle, Bell, Eye, ChevronRight } from "lucide-react";
import QrScanner from "../components/QrScanner";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { usePwaInstall } from "../hooks/usePwaInstall";
import InstallGuideSheet from "../components/InstallGuideSheet";

const EMPTY = { name: "", description: "", price: "", category_id: "", is_featured: false, is_handloom: false, has_multiple_colours: false, custom_orders: false };

const INDIAN_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "Indian Bank", "Bank of India", "IDBI Bank", "Kotak Mahindra Bank",
  "Yes Bank", "IndusInd Bank", "Federal Bank", "South Indian Bank",
  "RBL Bank", "Bandhan Bank", "UCO Bank", "Central Bank of India",
  "Indian Overseas Bank", "Punjab & Sind Bank", "Karnataka Bank",
  "Karur Vysya Bank", "City Union Bank", "Tamilnad Mercantile Bank",
  "Dhanlaxmi Bank", "Nainital Bank", "Saraswat Bank", "Other",
];

const STATUS_LABEL = {
  awaiting_payment: "Awaiting Payment",
  pending: "Order Placed", confirmed: "Confirmed",
  ready_for_delivery: "Ready for Delivery", picked_up: "Picked Up", delivered: "Delivered",
  return_completed: "Return Completed",
};
const STATUS_COLOR = {
  awaiting_payment: "#C2410C",
  pending: "#16a34a", confirmed: "#2563eb",
  ready_for_delivery: "#d97706", picked_up: "#7c3aed", delivered: "#16a34a",
};

export default function ShopDashboard() {
  const [tab, setTab] = useState("products");
  const mainRef = useRef(null);
  const scrollToTop = () => { mainRef.current?.scrollTo({ top: 0, behavior: "instant" }); };
  const switchTab = (t) => { setTab(t); scrollToTop(); };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("shop_sidebar_collapsed") === "true");
  const toggleCollapse = () => setSidebarCollapsed((v) => { localStorage.setItem("shop_sidebar_collapsed", !v); return !v; });
  const [owner, setOwner] = useState(() => JSON.parse(localStorage.getItem("shop_owner") || "{}"));
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
  const shopAvatarRef = useRef();
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Orders
  const [orders, setOrders] = useState([]);
  const [qrModal, setQrModal] = useState(null); // { orderId, qrImage }
  const [showScanner, setShowScanner] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(null); // { orderId }
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [productModal, setProductModal] = useState(null); // { item, product }
  const [productModalImg, setProductModalImg] = useState(0);
  const [productModalUserInteracted, setProductModalUserInteracted] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState({});
  const [returningOrder, setReturningOrder] = useState({});
  const [refundingOrder, setRefundingOrder] = useState({});
  const [returnNoteModal, setReturnNoteModal] = useState(null);
  const [returnNote, setReturnNote] = useState("");

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(() => {});
    loadProducts();
  }, []);

  useEffect(() => {
    if (tab === "orders") loadOrders();
    if (tab === "products") loadProducts();
    if (tab === "account") {
      getShopMe().then(({ data }) => {
        const updated = { ...owner, ...data };
        setOwner(updated);
        localStorage.setItem("shop_owner", JSON.stringify(updated));
        setAccountForm({
          name: data.name || "", shop_name: data.shop_name || "", phone: data.phone || "",
          address: data.address || "", city: data.city || "", state: data.state || "",
          pincode: data.pincode || "", gst_number: data.gst_number || "",
          bank_account_holder: data.bank_account_holder || "", bank_name: data.bank_name || "",
          bank_account_number: data.bank_account_number || "", bank_ifsc: data.bank_ifsc || "",
          bank_account_type: data.bank_account_type || "",
        });
      }).catch(() => {});
    }
  }, [tab]);

  // Re-fetch when user returns to this browser tab
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) { if (tab === "products") loadProducts(); else if (tab === "orders") loadOrders(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [tab]);

  // Auto-refresh orders every 15s when on orders tab
  useEffect(() => {
    if (tab !== "orders") return;
    const prev = { count: orders.length };
    const iv = setInterval(async () => {
      try {
        const { data } = await getShopOrders();
        if (data.length > prev.count) {
          const newCount = data.length - prev.count;
          toast.success(`${newCount} new order${newCount > 1 ? "s" : ""}!`);
        }
        prev.count = data.length;
        setOrders(data);
      } catch {}
    }, 15000);
    return () => clearInterval(iv);
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("profile_image", file);
      const { data } = await uploadShopAvatar(fd);
      const updated = { ...owner, ...data };
      setOwner(updated);
      localStorage.setItem("shop_owner", JSON.stringify(updated));
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  // ── Products ─────────────────────────────────────────────────────────────────

  const clearImageState = () => {
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    additionalPreviews.forEach((u) => URL.revokeObjectURL(u));
    setPrimaryFile(null); setPrimaryPreview(null);
    setAdditionalFiles([]); setAdditionalPreviews([]);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); clearImageState(); setSavedProductName(null); setShowForm(true); scrollToTop(); };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY); clearImageState(); setSavedProductName(null); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || "", price: p.price, category_id: p.category_id, is_featured: p.is_featured, is_handloom: p.is_handloom, has_multiple_colours: p.has_multiple_colours, custom_orders: p.custom_orders });
    clearImageState(); setSavedProductName(null); setShowForm(true); scrollToTop();
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
        scrollToTop();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteShopProduct(deleteModal.id);
      toast.success("Product deleted");
      loadProducts();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed to delete"); }
    setDeleteModal(null);
  };

  // ── Orders ────────────────────────────────────────────────────────────────────

  const showQr = async (orderId, orderStatus) => {
    try {
      const res = await getShopOrderQr(orderId);
      setQrModal({ orderId, qrImage: res.data.qr_image, orderStatus });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not load QR");
    }
  };

  const handleScan = async (token) => {
    setShowScanner(false);
    try {
      const { data } = await shopScanQr(token);
      setScanSuccess({ orderId: data.order_id });
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Scan failed");
    }
  };

  const [markingReady, setMarkingReady] = useState({});
  const handleMarkReady = async (orderId) => {
    setMarkingReady((p) => ({ ...p, [orderId]: true }));
    try {
      const { data } = await shopMarkOrderReady(orderId);
      setScanSuccess({ orderId: data.order_id });
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update status");
    } finally {
      setMarkingReady((p) => ({ ...p, [orderId]: false }));
    }
  };

  const handleConfirmOrder = async (orderId) => {
    setConfirmingOrder((p) => ({ ...p, [orderId]: true }));
    try {
      await shopConfirmOrder(orderId);
      toast.success("Order confirmed!");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to confirm order");
    } finally {
      setConfirmingOrder((p) => ({ ...p, [orderId]: false }));
    }
  };

  const handleReturnDecision = async () => {
    if (!returnNoteModal) return;
    const { orderId, action } = returnNoteModal;
    setReturningOrder((p) => ({ ...p, [orderId]: true }));
    try {
      if (action === "accept") await shopAcceptReturn(orderId, returnNote);
      else await shopRejectReturn(orderId, returnNote);
      toast.success(action === "accept" ? "Return accepted" : "Return rejected");
      setReturnNoteModal(null);
      setReturnNote("");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setReturningOrder((p) => ({ ...p, [orderId]: false }));
    }
  };

  const handleMarkRefundSent = async (orderId) => {
    if (!window.confirm("Confirm you have sent the refund to the customer?")) return;
    setRefundingOrder((p) => ({ ...p, [orderId]: true }));
    try {
      await shopMarkRefundSent(orderId);
      toast.success("Refund marked as sent");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setRefundingOrder((p) => ({ ...p, [orderId]: false }));
    }
  };

  const openProductModal = async (item) => {
    setProductModalImg(0);
    const local = products.find((p) => String(p.id) === String(item.product_id)) || null;
    setProductModal({ item, product: local });
    if (item.product_id) {
      try {
        const { data } = await getPublicProduct(item.product_id);
        setProductModal((prev) => prev ? { ...prev, product: data } : null);
      } catch {}
    }
  };

  // Lock body scroll while product modal is open; reset image index on open
  useEffect(() => {
    if (productModal) {
      setProductModalImg(0);
      setProductModalUserInteracted(false);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [productModal]);

  // Auto-slide product modal images every 3s
  useEffect(() => {
    if (!productModal) return;
    const images = productModal.product?.images?.length
      ? productModal.product.images.map(img => img.url)
      : (productModal.item?.image_url ? [productModal.item.image_url] : []);
    if (images.length <= 1 || productModalUserInteracted) return;
    const timer = setInterval(() => {
      setProductModalImg((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [productModal, productModalUserInteracted]);

  // Resume auto-slide 5s after user manually taps arrow/dot in product modal
  useEffect(() => {
    if (!productModalUserInteracted) return;
    const t = setTimeout(() => setProductModalUserInteracted(false), 5000);
    return () => clearTimeout(t);
  }, [productModalUserInteracted]);

  const S = { // inline style helpers
    card: { background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "1.25rem", border: "1px solid rgba(184,137,42,0.12)", marginBottom: "0.75rem" },
    badge: (status) => ({ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, background: STATUS_COLOR[status] + "28", color: STATUS_COLOR[status] }),
  };

  // Account form state
  const [accountForm, setAccountForm] = useState({ name: owner.name || "", shop_name: owner.shop_name || "", phone: owner.phone || "", address: owner.address || "", city: owner.city || "", state: owner.state || "", pincode: owner.pincode || "", gst_number: owner.gst_number || "", bank_account_holder: owner.bank_account_holder || "", bank_name: owner.bank_name || "", bank_account_number: owner.bank_account_number || "", bank_ifsc: owner.bank_ifsc || "", bank_account_type: owner.bank_account_type || "" });
  const [accountSaving, setAccountSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const handlePasswordChange = async () => {
    if (!pwForm.old_password || !pwForm.new_password) return toast.error("All password fields are required");
    if (pwForm.new_password.length < 6) return toast.error("New password must be at least 6 characters");
    if (pwForm.new_password !== pwForm.confirm) return toast.error("Passwords do not match");
    setPwSaving(true);
    try {
      await changeShopPassword({ old_password: pwForm.old_password, new_password: pwForm.new_password });
      toast.success("Password changed successfully!");
      setPwForm({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const handleAccountSave = async () => {
    setAccountSaving(true);
    try {
      // Only send fields that have a value — same pattern as delivery app — prevents accidentally clearing saved fields
      const payload = Object.fromEntries(Object.entries(accountForm).filter(([, v]) => v !== ""));
      const { data } = await updateShopMe(payload);
      const updated = { ...owner, ...data };
      setOwner(updated);
      // Re-sync form so saved values are reflected
      setAccountForm({
        name: data.name || "", shop_name: data.shop_name || "", phone: data.phone || "",
        address: data.address || "", city: data.city || "", state: data.state || "",
        pincode: data.pincode || "", gst_number: data.gst_number || "",
        bank_account_holder: data.bank_account_holder || "", bank_name: data.bank_name || "",
        bank_account_number: data.bank_account_number || "", bank_ifsc: data.bank_ifsc || "",
        bank_account_type: data.bank_account_type || "",
      });
      localStorage.setItem("shop_owner", JSON.stringify(updated));
      toast.success("Shop details updated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    } finally {
      setAccountSaving(false);
    }
  };

  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.return_status === "pending").length;
  const SHOP_NAV = [
    { key: "products", label: "Products", icon: <Package size={17} />, badge: products.length || null },
    { key: "orders",   label: "Orders",   icon: <ShoppingBag size={17} />, badge: pendingCount || null },
    { key: "account",  label: "Account",  icon: <UserCircle size={17} /> },
  ];

  return (
    <div className="portal-page">

      {/* ── Product Detail Modal ── */}
      {productModal && (() => {
        const { item, product } = productModal;
        const images = product?.images?.length
          ? product.images.map(img => img.url)
          : (item.image_url ? [item.image_url] : []);
        const mainSrc = images[productModalImg] || item.image_url;
        const name = product?.name || item.name;
        const price = Number(product?.price ?? item.price);
        const totalPrice = Number(item.price) * item.quantity;
        /* touch-target constant: 44px per iOS HIG */
        const TAP = 44;
        return (
          <div
            onClick={() => setProductModal(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9000,
              background: "rgba(15,23,42,0.7)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              /* small phones: 0.5rem so modal gets full width */
              padding: "clamp(0.5rem, 4vw, 1.25rem)",
              boxSizing: "border-box",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(135deg, #150A1F, #1A0D24)",
                border: "1px solid rgba(184,137,42,0.2)",
                borderRadius: 20,
                /* fills screen on narrow phones; caps at 440px on larger */
                width: "100%", maxWidth: 440,
                /* adaptive height: leave room for keyboard / nav bars */
                maxHeight: "min(90vh, 700px)",
                display: "flex", flexDirection: "column",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)",
                overflow: "hidden",
                /* prevent the modal's own scroll from bubbling to page */
                overscrollBehavior: "contain",
              }}
            >

              {/* ── Image zone — height adapts to viewport ── */}
              <div style={{
                position: "relative", flexShrink: 0, background: "rgba(255,255,255,0.06)",
                /* clamp: 160px on tiny landscape, 260px max on tall phones */
                height: "clamp(160px, 30vh, 260px)",
              }}>
                {mainSrc ? (
                  <img
                    src={mainSrc} alt={name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={48} color="rgba(255,255,255,0.2)" />
                  </div>
                )}

                {/* ── Price badge — bottom-left ── */}
                <div style={{
                  position: "absolute", bottom: 10, left: 12,
                  background: "linear-gradient(135deg,#7B1D45,#a82257)",
                  color: "#fff", borderRadius: 10,
                  padding: "0.28rem 0.8rem",
                  fontSize: "0.97rem", fontWeight: 900,
                  boxShadow: "0 4px 14px rgba(123,29,69,0.4)",
                  lineHeight: 1.3,
                }}>
                  ₹{price.toLocaleString("en-IN")}
                </div>

                {/* ── Prev / Next arrows ── */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => { setProductModalImg((i) => (i - 1 + images.length) % images.length); setProductModalUserInteracted(true); }}
                      style={{
                        position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%",
                        width: TAP, height: TAP, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.18)", touchAction: "manipulation",
                      }}
                    >
                      <ChevronLeft size={20} color="#0F172A" />
                    </button>
                    <button
                      onClick={() => { setProductModalImg((i) => (i + 1) % images.length); setProductModalUserInteracted(true); }}
                      style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%",
                        width: TAP, height: TAP, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.18)", touchAction: "manipulation",
                      }}
                    >
                      <ChevronRight size={20} color="#0F172A" />
                    </button>
                    {/* dot indicators — bottom center */}
                    <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: "0.3rem" }}>
                      {images.map((_, i) => (
                        <div
                          key={i} onClick={() => { setProductModalImg(i); setProductModalUserInteracted(true); }}
                          style={{
                            width: i === productModalImg ? 18 : 6, height: 6, borderRadius: 3,
                            background: i === productModalImg ? "#fff" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", transition: "all 0.2s",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* ── Close button — top-right, 44×44 tap target ── */}
                <button
                  onClick={() => setProductModal(null)}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                    border: "none", borderRadius: "50%",
                    width: TAP, height: TAP,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                    touchAction: "manipulation",
                  }}
                >
                  <X size={18} color="#334155" />
                </button>
              </div>

              {/* ── Thumbnail strip ── */}
              {images.length > 1 && (
                <div style={{
                  display: "flex", gap: "0.4rem",
                  padding: "0.55rem 1rem",
                  overflowX: "auto", WebkitOverflowScrolling: "touch",
                  borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
                  /* hide scrollbar but keep scroll */
                  scrollbarWidth: "none",
                }}>
                  {images.map((src, i) => (
                    <img
                      key={i} src={src} alt="" onClick={() => setProductModalImg(i)}
                      style={{
                        width: 50, height: 50, objectFit: "cover", borderRadius: 9, flexShrink: 0,
                        border: `2.5px solid ${i === productModalImg ? "#7B1D45" : "rgba(255,255,255,0.15)"}`,
                        cursor: "pointer", opacity: i === productModalImg ? 1 : 0.58,
                        transition: "all 0.18s", touchAction: "manipulation",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* ── Scrollable content ── */}
              <div style={{
                overflowY: "auto", flex: 1,
                WebkitOverflowScrolling: "touch",
                padding: "1rem 1.1rem",
                /* safe area for iPhone home indicator */
                paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
              }}>

                {/* Name */}
                <p style={{ margin: "0 0 0.3rem", fontWeight: 800, fontSize: "1.05rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.35 }}>
                  {name}
                </p>

                {/* Category chip */}
                {product?.category_name && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.2rem",
                    fontSize: "0.71rem", fontWeight: 700,
                    background: "rgba(184,137,42,0.15)", color: "#D4A94A",
                    borderRadius: 20, padding: "0.2rem 0.6rem", marginBottom: "0.8rem",
                  }}>
                    🏷️ {product.category_name}
                  </span>
                )}

                {/* Description */}
                {product?.description && (
                  <div style={{ marginBottom: "0.9rem" }}>
                    <p style={{ margin: "0 0 0.3rem", fontSize: "0.68rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Description
                    </p>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Attribute badges */}
                {(product?.is_handloom || product?.has_multiple_colours || product?.custom_orders || product?.is_featured) && (
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
                    {product.is_featured      && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", fontWeight: 700, background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: 20, padding: "0.22rem 0.6rem" }}>⭐ Featured</span>}
                    {product.is_handloom      && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", fontWeight: 700, background: "rgba(34,197,94,0.15)", color: "#4ade80", borderRadius: 20, padding: "0.22rem 0.6rem" }}>🧵 Handloom</span>}
                    {product.has_multiple_colours && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", fontWeight: 700, background: "rgba(59,130,246,0.15)", color: "#93c5fd", borderRadius: 20, padding: "0.22rem 0.6rem" }}>🎨 Multi-colour</span>}
                    {product.custom_orders    && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", fontWeight: 700, background: "rgba(124,58,237,0.15)", color: "#c4b5fd", borderRadius: 20, padding: "0.22rem 0.6rem" }}>✂️ Custom Orders</span>}
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0.2rem 0 0.9rem" }} />

                {/* Order summary */}
                <div style={{ background: "rgba(184,137,42,0.08)", border: "1.5px solid rgba(184,137,42,0.3)", borderRadius: 14, padding: "0.85rem 1rem" }}>
                  <p style={{ margin: "0 0 0.6rem", fontSize: "0.67rem", fontWeight: 800, color: "#D4A94A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    📦 Order Summary
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.5)" }}>Unit price</span>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.55rem" }}>
                    <span style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.5)" }}>Quantity</span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "#7B1D45", color: "#fff",
                      borderRadius: 8, padding: "0.15rem 0.65rem",
                      fontSize: "0.83rem", fontWeight: 800,
                    }}>
                      ×{item.quantity}
                    </span>
                  </div>
                  <div style={{ height: 1, background: "rgba(184,137,42,0.3)", marginBottom: "0.55rem" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#D4A94A" }}>Total</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#B8892A" }}>
                      ₹{totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Sidebar overlay (mobile) */}
      <div className={`portal-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="portal-mobile-header" style={{ background: "#B8892A" }}>
        <span className="portal-mobile-title">{owner.shop_name || "My Shop"}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setNotifOpen(v => !v)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
            <Bell size={18} color="#fff" />
            {pendingCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, minWidth: 17, height: 17, background: "#fbbf24", borderRadius: 10, border: "1.5px solid #B8892A", fontSize: "0.62rem", fontWeight: 800, color: "#7c2d12", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
          <button className="portal-mobile-menu-btn" onClick={() => setSidebarOpen((v) => !v)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Notification modal */}
      {notifOpen && (
        <div
          onClick={() => setNotifOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(135deg, #150A1F, #1A0D24)", border: "1px solid rgba(184,137,42,0.2)", borderRadius: 20, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #B8892A, #7B1D45)", padding: "1.1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={17} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>Notifications</p>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>{owner.shop_name || "My Shop"}</p>
                </div>
              </div>
              <button onClick={() => setNotifOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                <X size={15} />
              </button>
            </div>

            {/* Items */}
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.65rem", maxHeight: 320, overflowY: "auto" }}>
              {pendingCount > 0 ? (
                <>
                  {orders.filter(o => o.status === "pending" || o.status === "confirmed").length > 0 && (
                    <div onClick={() => { switchTab("orders"); setNotifOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", borderRadius: 12, background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.25)", cursor: "pointer" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(217,119,6,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem" }}>🛒</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#fbbf24" }}>
                          {orders.filter(o => o.status === "pending" || o.status === "confirmed").length} Order{orders.filter(o => o.status === "pending" || o.status === "confirmed").length > 1 ? "s" : ""} Need Action
                        </p>
                        <p style={{ margin: "0.15rem 0 0", fontSize: "0.73rem", color: "rgba(255,255,255,0.5)" }}>Tap to view orders →</p>
                      </div>
                    </div>
                  )}
                  {orders.filter(o => o.return_status === "pending").length > 0 && (
                    <div onClick={() => { switchTab("orders"); setNotifOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", borderRadius: 12, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", cursor: "pointer" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem" }}>↩</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#c4b5fd" }}>
                          {orders.filter(o => o.return_status === "pending").length} Return Request{orders.filter(o => o.return_status === "pending").length > 1 ? "s" : ""}
                        </p>
                        <p style={{ margin: "0.15rem 0 0", fontSize: "0.73rem", color: "rgba(255,255,255,0.5)" }}>Waiting for your decision →</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "1.75rem 1rem", color: "rgba(255,255,255,0.4)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                    <Bell size={22} style={{ opacity: 0.35 }} />
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>All caught up!</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem" }}>No pending actions right now.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
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
                  setNotifOpen(false);
                }}
                style={{ width: "100%", padding: "0.55rem", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 10, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
              >
                <Bell size={13} /> Enable Push Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar-wrap">
      <aside className={`portal-sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`} style={{ background: "#1A0812" }}>
        <div className="portal-sidebar-logo">
          {/* Clickable avatar */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: "0.6rem" }}>
            <div
              onClick={() => shopAvatarRef.current?.click()}
              style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)" }}
            >
              {owner.profile_image_url ? (
                <img src={owner.profile_image_url} alt="Shop" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "rgba(255,255,255,0.7)" }}>{(owner.shop_name || "S")[0].toUpperCase()}</span>
              )}
              {avatarUploading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /></div>}
            </div>
            <div onClick={() => shopAvatarRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "#B8892A", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #1A0812" }}>
              <Camera size={10} color="#fff" />
            </div>
            <input ref={shopAvatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </div>
          <p className="portal-sidebar-title">{owner.shop_name || "My Shop"}</p>
          <p className="portal-sidebar-sub">Shop Owner Portal · Lakshmi Vastra Studio</p>
        </div>
        <nav className="portal-nav">
          {SHOP_NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => { switchTab(item.key); setShowForm(false); setSidebarOpen(false); }}
              className={`portal-nav-btn ${tab === item.key ? "active" : ""}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              <span className="pnb-label" style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? <span className="portal-nav-badge">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        {canInstall && (
          <button onClick={install} className="portal-install-btn">
            <span style={{ fontSize: "1rem" }}>🏪</span> Install App
          </button>
        )}
        <button
          onClick={() => setNotifOpen(v => !v)}
          className="portal-nav-btn"
          title={sidebarCollapsed ? "Notifications" : undefined}
          style={{ position: "relative" }}
        >
          <Bell size={17} />
          {pendingCount > 0 && (
            <span style={{ position: "absolute", top: 4, left: 22, minWidth: 17, height: 17, background: "#fbbf24", borderRadius: 10, border: "1.5px solid #1A0812", fontSize: "0.62rem", fontWeight: 800, color: "#7c2d12", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
          <span className="pnb-label"> Notifications</span>
        </button>
        <a href="/help?app=shop" className="portal-nav-btn" title={sidebarCollapsed ? "Help Center" : undefined} style={{ textDecoration: "none" }}>
          <HelpCircle size={17} /><span className="pnb-label"> Help Center</span>
        </a>
        <button onClick={logout} className="portal-logout-btn" title={sidebarCollapsed ? "Logout" : undefined}>
          <LogOut size={14} /><span className="pnb-label"> Logout</span>
        </button>
        {/* Sidebar footer branding */}
        <div className="sidebar-footer">
          <p className="sidebar-footer-product">Lakshmi Vastra Studio</p>
          <p className="sidebar-footer-cloud">Shop Owner Portal</p>
          <p className="sidebar-footer-copy">© Copyright 2026 Lakshmi Vastra Studio</p>
        </div>
      </aside>
      {/* External collapse tab */}
      <button onClick={toggleCollapse} className="sidebar-toggle-tab" style={{ background: "#1A0812" }} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <span className={`sidebar-tri ${sidebarCollapsed ? "right" : "left"}`} />
      </button>
      </div>

      {/* Main content */}
      <main className="portal-main" ref={mainRef}>

        {/* Products Tab — list */}
        {tab === "products" && !showForm && (() => {
          const filteredProducts = products.filter((p) => {
            const q = productSearch.trim().toLowerCase();
            if (q && !p.name.toLowerCase().includes(q)) return false;
            if (productCategoryFilter !== "all" && String(p.category_id) !== productCategoryFilter) return false;
            return true;
          });
          return (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#D4A94A", fontSize: "1.2rem" }}>My Products</h2>
                <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{products.length} product{products.length !== 1 ? "s" : ""} total</p>
              </div>
              <button onClick={openAdd} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                <Plus size={15} /> Add Product
              </button>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "0.65rem" }}>
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name…"
                style={{ width: "100%", padding: "0.6rem 0.9rem 0.6rem 2.2rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: "0.83rem", outline: "none", background: "rgba(255,255,255,0.07)", boxSizing: "border-box", color: "#fff" }}
              />
              <span style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none", fontSize: "0.85rem" }}>🔍</span>
            </div>

            {/* Category filter pills */}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {[{ id: "all", name: "All" }, ...categories].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setProductCategoryFilter(String(c.id))}
                  style={{ padding: "0.3rem 0.75rem", borderRadius: 20, border: "1px solid", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", background: productCategoryFilter === String(c.id) ? "#B8892A" : "rgba(255,255,255,0.06)", color: productCategoryFilter === String(c.id) ? "#0D0611" : "rgba(255,255,255,0.6)", borderColor: productCategoryFilter === String(c.id) ? "#B8892A" : "rgba(255,255,255,0.12)", transition: "all 0.15s" }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.4)" }}>
                <Package size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p>No products yet. Add your first product!</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.45)" }}>
                <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>No products match your filter</p>
                <button onClick={() => { setProductSearch(""); setProductCategoryFilter("all"); }} style={{ fontSize: "0.8rem", color: "#D4A94A", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear filters</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {filteredProducts.map((p) => (
                  <div key={p.id} style={{ ...S.card, display: "flex", gap: "0.85rem", alignItems: "center" }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }} />
                      : <div style={{ width: 72, height: 72, borderRadius: 10, background: "rgba(255,255,255,0.06)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)" }}><Package size={22} style={{ opacity: 0.3 }} /></div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.93rem", color: "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ margin: "0.15rem 0 0.35rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                        {p.category_name} · <span style={{ fontWeight: 700, color: "#D4A94A" }}>₹{p.price.toLocaleString("en-IN")}</span>
                      </p>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                        {p.is_featured && <span style={{ fontSize: "0.62rem", fontWeight: 700, background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: 20, padding: "0.1rem 0.45rem" }}>Featured</span>}
                        {p.is_handloom && <span style={{ fontSize: "0.62rem", fontWeight: 700, background: "rgba(34,197,94,0.15)", color: "#4ade80", borderRadius: 20, padding: "0.1rem 0.45rem" }}>Handloom</span>}
                        {p.has_multiple_colours && <span style={{ fontSize: "0.62rem", fontWeight: 700, background: "rgba(59,130,246,0.15)", color: "#93c5fd", borderRadius: 20, padding: "0.1rem 0.45rem" }}>Multi-colour</span>}
                        {p.custom_orders && <span style={{ fontSize: "0.62rem", fontWeight: 700, background: "rgba(124,58,237,0.15)", color: "#c4b5fd", borderRadius: 20, padding: "0.1rem 0.45rem" }}>Custom</span>}
                        {p.images?.length > 0 && <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>{p.images.length} photo{p.images.length !== 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flexShrink: 0 }}>
                      <button onClick={() => openEdit(p)} style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 8, padding: "0.45rem 0.55rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, color: "#93c5fd" }}><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteModal({ id: p.id, name: p.name })} style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, padding: "0.45rem 0.55rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, color: "#fca5a5" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
          );
        })()}

        {/* Products Tab — add / edit page (same layout as admin) */}
        {tab === "products" && showForm && (
          <>
            {/* Page action bar */}
            <div className="form-top-bar">
              <button type="button" onClick={closeForm} className="form-back-btn">
                <ChevronLeft size={14} /> Back
              </button>
              <h2 style={{ color: "#D4A94A" }}>{editing ? "Edit Product" : "Add Product"}</h2>
              <div className="form-top-actions">
                <button type="button" className="admin-cancel-btn" onClick={closeForm}>Cancel</button>
                <button type="button" onClick={() => shopFormRef.current?.requestSubmit()} className="btn-primary" disabled={submitting} style={{ display: "flex", alignItems: "center", gap: "0.35rem", opacity: submitting ? 0.7 : 1 }}>
                  <Check size={13} /> {submitting ? "Saving…" : (editing ? "Update Product" : "Save Product")}
                </button>
              </div>
            </div>

            {/* Success banner */}
            {savedProductName && (
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "0.9rem 1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                  <Check size={15} style={{ color: "#4ade80", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.85rem", color: "#4ade80", fontWeight: 600 }}>"{savedProductName}" added!</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={() => setSavedProductName(null)} className="btn-primary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                    <Plus size={12} /> Add Another
                  </button>
                  <button type="button" onClick={closeForm} style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", flex: 1, background: "none", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, color: "#4ade80", cursor: "pointer", fontWeight: 500 }}>
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
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "1.25rem", border: "1px solid rgba(184,137,42,0.12)" }}>
                    <p style={{ margin: "0 0 1rem", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#D4A94A" }}>Product Details</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      <div>
                        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.35rem" }}>Product Name *</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kanjivaram Silk Saree" required style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div className="form-field-row">
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.35rem" }}>Price (₹) *</label>
                          <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="5500" required style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box", outline: "none" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.35rem" }}>Category *</label>
                          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(30,15,50,0.9)", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box", outline: "none" }}>
                            <option value="">Select…</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "0.35rem" }}>Description</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Fabric, weave, occasion, care instructions…" style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box", resize: "vertical", outline: "none" }} />
                      </div>
                    </div>
                  </div>

                  {/* Attributes & Visibility */}
                  <div className="admin-card">
                    <h3 className="admin-card-title" style={{ marginBottom: "0.25rem" }}>Attributes &amp; Visibility</h3>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.1rem" }}>Checked attributes appear as trust badges on the product page.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[
                        { id: "is_featured", label: "Mark as Featured", hint: "Shows in featured section on home page" },
                        { id: "is_handloom", label: "Genuine Handloom Product", hint: "Displays handloom trust badge" },
                        { id: "has_multiple_colours", label: "Available in Multiple Colours", hint: "Customer can contact for colour options" },
                        { id: "custom_orders", label: "Accepts Custom Orders", hint: "Displays 'Contact Us' badge on product" },
                      ].map(({ id, label, hint }) => (
                        <div key={id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.65rem 0.85rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: form[id] ? "rgba(184,137,42,0.1)" : "transparent", transition: "background 0.15s" }}>
                          <input
                            type="checkbox"
                            id={`shop-${id}`}
                            checked={form[id]}
                            onChange={(e) => setForm({ ...form, [id]: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: "#B8892A", flexShrink: 0, marginTop: 2 }}
                          />
                          <div>
                            <label htmlFor={`shop-${id}`} style={{ marginBottom: 0, textTransform: "none", fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", cursor: "pointer" }}>{label}</label>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "rgba(255,255,255,0.45)" }}>{hint}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── Right column — Images ── */}
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "1.25rem", border: "1px solid rgba(184,137,42,0.12)" }}>
                  <p style={{ margin: "0 0 1.1rem", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#D4A94A" }}>Product Images</p>

                  {/* Primary Image */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#D4A94A" }}>Primary Image</span>
                      <span style={{ fontSize: "0.69rem", color: "rgba(255,255,255,0.4)" }}>· 1 only</span>
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.65rem" }}>Main photo shown in listings</p>

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
                      <button type="button" onClick={() => primaryFileRef.current?.click()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", width: "100%", padding: "1.25rem 1rem", border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 10, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500 }}>
                        <ImagePlus size={16} /> Upload Primary Photo
                      </button>
                    )}
                    {(editing?.images?.[0] || primaryPreview) && !primaryPreview && (
                      <button type="button" onClick={() => primaryFileRef.current?.click()} style={{ display: "block", fontSize: "0.75rem", color: "#D4A94A", background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "0.3rem 0.75rem", cursor: "pointer", marginTop: "0.4rem" }}>
                        Replace Primary
                      </button>
                    )}
                    <input ref={primaryFileRef} type="file" accept="image/*" onChange={handlePrimarySelect} style={{ display: "none" }} />
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 0 1.1rem" }} />

                  {/* Additional Images */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)" }}>Additional Images</span>
                      <span style={{ fontSize: "0.69rem", color: "rgba(255,255,255,0.4)" }}>· multiple allowed</span>
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.65rem" }}>Gallery photos on product detail page</p>

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
                    <button type="button" onClick={() => additionalFileRef.current?.click()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", width: "100%", padding: "1rem", border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 10, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500 }}>
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
        {tab === "orders" && (() => {
          const filtered = orders.filter((o) => {
            const matchStatus = orderStatusFilter === "all"
              || (orderStatusFilter === "return_completed" ? o.return_status === "returned" : o.status === orderStatusFilter);
            const q = orderSearch.trim().toLowerCase();
            const matchSearch = !q || String(o.id).includes(q) || (o.customer?.name || "").toLowerCase().includes(q);
            return matchStatus && matchSearch;
          });
          return (
          <>
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#D4A94A", fontSize: "1.2rem" }}>Orders</h2>
              <button onClick={() => setShowScanner(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#B8892A", color: "#fff", border: "none", borderRadius: 6, padding: "0.5rem 1rem", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                <ScanLine size={15} /> Scan QR
              </button>
            </div>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textAlign: "right" }}>
              Scan customer's QR from their Order Tracking page to mark order ready
            </p>

            {/* Search input */}
            <div style={{ position: "relative", marginBottom: "0.65rem" }}>
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by order ID or customer name…"
                style={{ width: "100%", padding: "0.6rem 0.9rem 0.6rem 2.2rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: "0.83rem", outline: "none", background: "rgba(255,255,255,0.07)", boxSizing: "border-box", color: "#fff" }}
              />
              <span style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none", fontSize: "0.85rem" }}>🔍</span>
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {[["all", "All"], ...Object.entries(STATUS_LABEL)].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setOrderStatusFilter(key)}
                  style={{ padding: "0.3rem 0.75rem", borderRadius: 20, border: "1px solid", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", background: orderStatusFilter === key ? "#B8892A" : "rgba(255,255,255,0.06)", color: orderStatusFilter === key ? "#0D0611" : "rgba(255,255,255,0.6)", borderColor: orderStatusFilter === key ? "#B8892A" : "rgba(255,255,255,0.12)", transition: "all 0.15s" }}
                >
                  {label}
                </button>
              ))}
            </div>

            {ordersLoading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <span style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#B8892A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "0.75rem", fontSize: "0.88rem" }}>Checking for new orders…</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.4)" }}>
                <ShoppingBag size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)", margin: "0 0 0.3rem" }}>No orders received yet</p>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>When customers place orders from your shop, they'll appear here.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.45)" }}>
                <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>No orders match your filter</p>
                <button onClick={() => { setOrderSearch(""); setOrderStatusFilter("all"); }} style={{ fontSize: "0.8rem", color: "#D4A94A", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear filters</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filtered.map((o) => (
                  <div key={o.id} style={S.card}>
                    {/* Order header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "rgba(255,255,255,0.9)" }}>Order #{o.id}</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>{o.customer?.name} · {o.payment_method === "cod" ? "COD" : "Paid"} · ₹{o.total.toLocaleString("en-IN")}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                        {o.return_status === "returned" ? (
                          <span style={{ display: "inline-block", padding: "0.25rem 0.7rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: "rgba(22,163,74,0.15)", color: "#86EFAC" }}>📦 Return Completed</span>
                        ) : (
                          <span style={S.badge(o.status)}>{STATUS_LABEL[o.status] || o.status}</span>
                        )}
                        {o.return_status === "pending" && (
                          <span style={{ display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: "rgba(109,40,217,0.2)", color: "#C4B5FD" }}>↩ Return Requested</span>
                        )}
                        {o.return_status === "accepted" && (
                          <span style={{ display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: "rgba(22,163,74,0.15)", color: "#86EFAC" }}>✓ Return Accepted</span>
                        )}
                        {o.return_status === "rejected" && (
                          <span style={{ display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: "rgba(220,38,38,0.15)", color: "#FCA5A5" }}>✗ Return Rejected</span>
                        )}
                      </div>
                    </div>

                    {/* Product image cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "0.75rem" }}>
                      {o.items.map((item, i) => (
                        <div key={i}
                          onClick={() => openProductModal(item)}
                          style={{ display: "flex", alignItems: "center", gap: "0.65rem", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "0.45rem 0.6rem", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name}
                              style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 46, height: 46, borderRadius: 6, background: "rgba(255,255,255,0.06)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Package size={18} color="rgba(255,255,255,0.3)" />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                            <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Qty {item.quantity} · ₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                          </div>
                          <Eye size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>

                    <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>📍 {o.delivery_address}</p>

                    {/* Pending → shop confirms the order */}
                    {o.status === "pending" && (
                      <div style={{ marginTop: "0.75rem", background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: 10, padding: "0.65rem 0.85rem", textAlign: "center" }}>
                        <p style={{ margin: "0 0 0.5rem", fontSize: "0.76rem", color: "#fbbf24", fontWeight: 600 }}>
                          🛒 New order — confirm to start preparing
                        </p>
                        <button
                          onClick={() => handleConfirmOrder(o.id)}
                          disabled={confirmingOrder[o.id]}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: confirmingOrder[o.id] ? "#FED7AA" : "#D97706", color: "#fff", border: "none", borderRadius: 20, padding: "0.48rem 1.5rem", cursor: confirmingOrder[o.id] ? "not-allowed" : "pointer", fontSize: "0.8rem", fontWeight: 700, boxShadow: confirmingOrder[o.id] ? "none" : "0 3px 10px rgba(217,119,6,0.3)" }}
                        >
                          <CheckCircle size={13} />
                          {confirmingOrder[o.id] ? "Confirming…" : "Accept & Confirm Order"}
                        </button>
                      </div>
                    )}

                    {/* Confirmed → shop packs and marks ready */}
                    {o.status === "confirmed" && (
                      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleMarkReady(o.id)}
                          disabled={markingReady[o.id]}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: markingReady[o.id] ? "#86EFAC" : "#16A34A", color: "#fff", border: "none", borderRadius: 20, padding: "0.48rem 1.5rem", cursor: markingReady[o.id] ? "not-allowed" : "pointer", fontSize: "0.8rem", fontWeight: 700, boxShadow: markingReady[o.id] ? "none" : "0 3px 10px rgba(22,163,74,0.3)" }}
                        >
                          <CheckCircle size={13} />
                          {markingReady[o.id] ? "Updating…" : "Packed & Ready"}
                        </button>
                        <button
                          onClick={() => showQr(o.id, o.status)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "0.48rem 1rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                        >
                          <QrCode size={13} /> QR
                        </button>
                      </div>
                    )}

                    {/* Ready for delivery → show QR for delivery partner pickup */}
                    {o.status === "ready_for_delivery" && (
                      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "center" }}>
                        <button onClick={() => showQr(o.id, o.status)} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#0f2460", color: "#fff", border: "none", borderRadius: 20, padding: "0.48rem 1.5rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, boxShadow: "0 3px 10px rgba(15,36,96,0.3)" }}>
                          <QrCode size={13} /> Show QR for Pickup
                        </button>
                      </div>
                    )}

                    {/* Pending return → accept or reject */}
                    {o.return_status === "pending" && (
                      <div style={{ marginTop: "0.75rem", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, padding: "0.65rem 0.85rem" }}>
                        <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "#c4b5fd", fontWeight: 700 }}>↩ Customer requested a return</p>
                        <p style={{ margin: "0 0 0.55rem", fontSize: "0.76rem", color: "rgba(196,181,253,0.75)" }}>Reason: {o.return_reason || "—"}</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem" }}>
                          <button
                            onClick={() => { setReturnNoteModal({ orderId: o.id, action: "accept" }); setReturnNote(""); }}
                            disabled={returningOrder[o.id]}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: returningOrder[o.id] ? "#86EFAC" : "#16A34A", color: "#fff", border: "none", borderRadius: 20, padding: "0.45rem 1.25rem", cursor: returningOrder[o.id] ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 700 }}
                          >✓ Accept</button>
                          <button
                            onClick={() => { setReturnNoteModal({ orderId: o.id, action: "reject" }); setReturnNote(""); }}
                            disabled={returningOrder[o.id]}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: returningOrder[o.id] ? "#FCA5A5" : "#DC2626", color: "#fff", border: "none", borderRadius: 20, padding: "0.45rem 1.25rem", cursor: returningOrder[o.id] ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 700 }}
                          >✗ Reject</button>
                        </div>
                      </div>
                    )}

                    {/* Accepted/rejected return note */}
                    {(o.return_status === "accepted" || o.return_status === "rejected" || o.return_status === "returned") && o.return_note && (
                      <p style={{ margin: "0.55rem 0 0", fontSize: "0.76rem", color: "rgba(255,255,255,0.45)" }}>
                        Note: {o.return_note}
                      </p>
                    )}

                    {/* Return delivery progress — shown once accepted or returned */}
                    {(o.return_status === "accepted" || o.return_status === "returned") && (() => {
                      const rds = o.return_delivery_status;
                      const rdp = o.return_delivery_person;
                      const statusLabel = !rds ? "Waiting for delivery person" : rds === "pickup_accepted" ? "Delivery person on the way to customer" : rds === "picked_up_from_customer" ? "Item collected — heading to shop" : rds === "returned_to_shop" ? "Returned to shop ✓" : rds;
                      const statusColor = rds === "returned_to_shop" ? "#4ade80" : rds ? "#c4b5fd" : "rgba(255,255,255,0.45)";
                      const statusBg = rds === "returned_to_shop" ? "rgba(34,197,94,0.08)" : rds ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.04)";
                      return (
                        <div style={{ marginTop: "0.6rem", background: statusBg, border: `1px solid ${rds === "returned_to_shop" ? "rgba(74,222,128,0.3)" : rds ? "rgba(196,181,253,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "0.55rem 0.75rem" }}>
                          <p style={{ margin: 0, fontSize: "0.73rem", fontWeight: 700, color: statusColor }}>↩ {statusLabel}</p>
                          {rdp && (
                            <p style={{ margin: "0.2rem 0 0", fontSize: "0.71rem", color: "rgba(255,255,255,0.45)" }}>
                              Delivery: {rdp.name}{rdp.phone ? ` · ${rdp.phone}` : ""}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Refund section — shown when item is returned and payment was online */}
                    {o.return_status === "returned" && o.payment_method !== "cod" && (
                      <div style={{ marginTop: "0.65rem", background: o.refund_status === "refunded" ? "rgba(34,197,94,0.08)" : "rgba(217,119,6,0.08)", border: `1px solid ${o.refund_status === "refunded" ? "rgba(74,222,128,0.25)" : "rgba(217,119,6,0.25)"}`, borderRadius: 8, padding: "0.6rem 0.85rem" }}>
                        <p style={{ margin: "0 0 0.25rem", fontSize: "0.73rem", fontWeight: 700, color: o.refund_status === "refunded" ? "#4ade80" : "#fbbf24" }}>
                          {o.refund_status === "refunded" ? "✓ Refund Sent" : "💰 Refund Pending"}
                        </p>
                        <p style={{ margin: "0 0 0.4rem", fontSize: "0.71rem", color: "rgba(255,255,255,0.45)" }}>
                          {o.refund_status === "refunded"
                            ? `₹${o.total.toLocaleString("en-IN")} refund marked as sent to customer.`
                            : `₹${o.total.toLocaleString("en-IN")} — process refund via Razorpay/bank and mark below.`}
                        </p>
                        {o.refund_status !== "refunded" && (
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <button
                              onClick={() => handleMarkRefundSent(o.id)}
                              disabled={refundingOrder[o.id]}
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 1.25rem", border: "none", borderRadius: 20, cursor: refundingOrder[o.id] ? "not-allowed" : "pointer", background: refundingOrder[o.id] ? "#FED7AA" : "#D97706", color: "#fff", fontWeight: 700, fontSize: "0.78rem", boxShadow: refundingOrder[o.id] ? "none" : "0 3px 10px rgba(217,119,6,0.25)" }}
                            >
                              {refundingOrder[o.id] ? "Updating…" : "✓ Mark Refund as Sent"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {o.return_status === "returned" && o.payment_method === "cod" && (
                      <p style={{ margin: "0.5rem 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "0.4rem 0.6rem" }}>
                        💵 Cash on Delivery — no refund needed.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
          );
        })()}
        {/* ════ ACCOUNT TAB ════ */}
        {tab === "account" && (() => {
          const SL = ({ children }) => (
            <p style={{ margin: "1.35rem 0 0.5rem", fontSize: "0.68rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{children}</p>
          );
          const InfoRow = ({ label, value, last }) => (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.82rem 1.1rem", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value || "—"}</span>
            </div>
          );
          const totalProducts  = products.length;
          const totalOrders    = orders.length;
          const pendingOrders  = orders.filter((o) => o.status === "confirmed").length;
          const totalRevenue   = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
          return (
            <div style={{ paddingBottom: "1.5rem" }}>

              {/* ── Profile banner ── */}
              <div style={{ background: "linear-gradient(145deg, #1A0812 0%, #4a0d27 100%)", borderRadius: 16, padding: "1.5rem 1.25rem", boxShadow: "0 6px 24px rgba(26,8,18,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {/* Clickable avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div onClick={() => shopAvatarRef.current?.click()} style={{ width: 58, height: 58, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", position: "relative" }}>
                      {owner.profile_image_url
                        ? <img src={owner.profile_image_url} alt="Shop" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "rgba(255,255,255,0.7)" }}>{(owner.shop_name || "S")[0].toUpperCase()}</span>}
                      {avatarUploading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /></div>}
                    </div>
                    <div onClick={() => shopAvatarRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "#7B1D45", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #1A0812" }}>
                      <Camera size={10} color="#fff" />
                    </div>
                  </div>
                  {/* Name + role */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{owner.shop_name || "My Shop"}</p>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{owner.name || "Shop Owner"}</p>
                  </div>
                  {/* Status badge */}
                  <div style={{ flexShrink: 0, padding: "0.3rem 0.65rem", borderRadius: 20, background: owner.is_approved ? "rgba(22,163,74,0.2)" : "rgba(217,119,6,0.2)", border: `1px solid ${owner.is_approved ? "rgba(74,222,128,0.4)" : "rgba(252,211,77,0.4)"}`, fontSize: "0.67rem", fontWeight: 800, color: owner.is_approved ? "#4ade80" : "#fcd34d", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    {owner.is_approved ? <><Check size={9} /> Approved</> : "⏳ Pending"}
                  </div>
                </div>

                {/* Stats strip */}
                <div className="stats-grid-4" style={{ marginTop: "1.1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  {[
                    { label: "Products", value: totalProducts },
                    { label: "Orders",   value: totalOrders },
                    { label: "Pending",  value: pendingOrders },
                    { label: "Revenue",  value: `₹${totalRevenue.toLocaleString("en-IN")}`, small: true },
                  ].map(({ label, value, small }) => (
                    <div key={label}>
                      <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
                      <p style={{ margin: "0.15rem 0 0", fontSize: small ? "0.8rem" : "1.1rem", fontWeight: 900, color: "#fff" }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ SECTION: PERSONAL INFORMATION ═══ */}
              <SL>Personal Information</SL>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(184,137,42,0.12)" }}>
                <InfoRow label="Owner Name"   value={owner.name} />
                <InfoRow label="Email"        value={owner.email} />
                <InfoRow label="Phone"        value={owner.phone} />
                <InfoRow label="Member Since" value={owner.created_at ? new Date(owner.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.82rem 1.1rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Account Status</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 12, background: owner.is_active !== false ? "rgba(22,163,74,0.15)" : "rgba(239,68,68,0.15)", color: owner.is_active !== false ? "#4ade80" : "#fca5a5" }}>
                    {owner.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* ═══ SECTION: SHOP DETAILS (editable) ═══ */}
              <SL>Shop Details</SL>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(184,137,42,0.12)" }}>
                {[
                  { label: "Shop Name",  key: "shop_name",  placeholder: "Your shop name" },
                  { label: "Owner Name", key: "name",       placeholder: "Your full name" },
                  { label: "Phone",      key: "phone",      placeholder: "+91 XXXXX XXXXX" },
                ].map(({ label, key, placeholder }, i, arr) => (
                  <div key={key} style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                    <input type="text" value={accountForm[key]} onChange={(e) => setAccountForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }} />
                  </div>
                ))}
                <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shop Address</p>
                  <input type="text" value={accountForm.address} onChange={(e) => setAccountForm((p) => ({ ...p, address: e.target.value }))} placeholder="Street / Area" style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <div style={{ padding: "0.85rem 0.9rem 0.85rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>City</p>
                    <input type="text" value={accountForm.city} onChange={(e) => setAccountForm((p) => ({ ...p, city: e.target.value }))} placeholder="e.g. Gooty RS" style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0.85rem 1.1rem 0.85rem 0.9rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>State</p>
                    <input type="text" value={accountForm.state} onChange={(e) => setAccountForm((p) => ({ ...p, state: e.target.value }))} placeholder="e.g. Andhra Pradesh" style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <div style={{ padding: "0.85rem 0.9rem 0.85rem 1.1rem", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>PIN Code</p>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={accountForm.pincode} onChange={(e) => setAccountForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "") }))} placeholder="e.g. 515402" style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ padding: "0.85rem 1.1rem 0.85rem 0.9rem" }}>
                    <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>GST Number</p>
                    <input type="text" value={accountForm.gst_number} onChange={(e) => setAccountForm((p) => ({ ...p, gst_number: e.target.value.toUpperCase() }))} placeholder="e.g. 37AAAAA0000A1Z5" maxLength={15} style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>

              {/* ═══ SECTION: BANK DETAILS (editable) ═══ */}
              <SL>Bank Details</SL>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(184,137,42,0.12)" }}>
                {/* Account Holder Name */}
                <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Holder Name</p>
                  <input
                    type="text"
                    value={accountForm.bank_account_holder}
                    onChange={(e) => setAccountForm((p) => ({ ...p, bank_account_holder: e.target.value.toUpperCase() }))}
                    placeholder="AS PER BANK RECORDS"
                    style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }}
                  />
                </div>
                {/* Bank Name */}
                <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bank Name</p>
                  <select
                    value={accountForm.bank_name}
                    onChange={(e) => setAccountForm((p) => ({ ...p, bank_name: e.target.value }))}
                    style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(20,10,35,0.8)", fontSize: "0.88rem", fontWeight: 600, color: accountForm.bank_name ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box", cursor: "pointer" }}
                  >
                    <option value="">Select bank…</option>
                    {INDIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                {/* Account Number */}
                <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Number</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={accountForm.bank_account_number}
                    onChange={(e) => setAccountForm((p) => ({ ...p, bank_account_number: e.target.value.replace(/\D/g, "") }))}
                    placeholder="XXXXXXXXXXXX"
                    style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }}
                  />
                </div>
                {/* IFSC */}
                <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>IFSC Code</p>
                  <input
                    type="text"
                    value={accountForm.bank_ifsc}
                    onChange={(e) => setAccountForm((p) => ({ ...p, bank_ifsc: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SBIN0001234"
                    style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }}
                  />
                </div>
                {/* Account Type */}
                <div style={{ padding: "0.85rem 1.1rem" }}>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Type</p>
                  <div style={{ display: "flex", gap: "0.65rem" }}>
                    {["Savings", "Current"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountForm((p) => ({ ...p, bank_account_type: type }))}
                        style={{ padding: "0.35rem 1rem", borderRadius: 20, border: "1px solid", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: accountForm.bank_account_type === type ? "#B8892A" : "rgba(255,255,255,0.06)", color: accountForm.bank_account_type === type ? "#0D0611" : "rgba(255,255,255,0.6)", borderColor: accountForm.bank_account_type === type ? "#B8892A" : "rgba(255,255,255,0.12)", transition: "all 0.15s" }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Save button (after Bank Details) ── */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.35rem" }}>
                <button
                  onClick={handleAccountSave}
                  disabled={accountSaving}
                  style={{ padding: "0.75rem 1.75rem", border: "none", borderRadius: 10, cursor: accountSaving ? "not-allowed" : "pointer", background: accountSaving ? "#D1D5DB" : "linear-gradient(135deg, #1A0812, #7B1D45)", color: "#fff", fontWeight: 700, fontSize: "0.88rem", boxShadow: accountSaving ? "none" : "0 4px 14px rgba(123,29,69,0.35)", display: "flex", alignItems: "center", gap: "0.45rem" }}
                >
                  <Check size={15} />
                  {accountSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>

              {/* ═══ SECTION: CHANGE PASSWORD ═══ */}
              <SL>Change Password</SL>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(184,137,42,0.12)" }}>
                {[
                  { label: "Current Password", key: "old_password" },
                  { label: "New Password",     key: "new_password" },
                  { label: "Confirm New Password", key: "confirm" },
                ].map(({ label, key }, i, arr) => (
                  <div key={key} style={{ padding: "0.85rem 1.1rem", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                    <input
                      type="password"
                      value={pwForm[key]}
                      onChange={(e) => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••"
                      style={{ width: "100%", border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", outline: "none", padding: "0 0 0.4rem", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  onClick={handlePasswordChange}
                  disabled={pwSaving}
                  style={{ padding: "0.75rem 1.75rem", border: "none", borderRadius: 10, cursor: pwSaving ? "not-allowed" : "pointer", background: pwSaving ? "#D1D5DB" : "linear-gradient(135deg, #1A0812, #7B1D45)", color: "#fff", fontWeight: 700, fontSize: "0.88rem", boxShadow: pwSaving ? "none" : "0 4px 14px rgba(123,29,69,0.35)", display: "flex", alignItems: "center", gap: "0.45rem" }}
                >
                  <Check size={15} />
                  {pwSaving ? "Updating…" : "Update Password"}
                </button>
              </div>

            </div>
          );
        })()}
      </main>

      {/* Bottom nav (mobile only) */}
      <nav className="portal-bottom-nav">
        {SHOP_NAV.map(({ key, icon, label, badge }) => (
          <button
            key={key}
            onClick={() => { switchTab(key); setShowForm(false); setSidebarOpen(false); }}
            className={`portal-bottom-tab ${tab === key ? "active" : ""}`}
            style={{ color: tab === key ? "#D4A94A" : "rgba(255,255,255,0.4)" }}
          >
            <div style={{ position: "relative" }}>
              {icon}
              {badge ? (
                <span style={{ position: "absolute", top: -6, right: -10, background: "#B8892A", color: "#fff", borderRadius: 20, fontSize: "0.62rem", fontWeight: 900, padding: "0.15rem 0.4rem", minWidth: 16, textAlign: "center", lineHeight: 1.2, zIndex: 10 }}>{badge}</span>
              ) : null}
            </div>
            <span className="pbt-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Return Decision Modal */}
      {returnNoteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "linear-gradient(135deg, #150A1F, #1A0D24)", border: "1px solid rgba(184,137,42,0.2)", borderRadius: 14, padding: "1.5rem", maxWidth: 360, width: "100%" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: returnNoteModal.action === "accept" ? "#4ade80" : "#fca5a5" }}>
              {returnNoteModal.action === "accept" ? "Accept Return" : "Reject Return"}
            </h3>
            <p style={{ margin: "0 0 0.85rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>
              {returnNoteModal.action === "accept"
                ? "Add a note for the customer (optional) — e.g. refund timeline or pickup instructions."
                : "Let the customer know why their return was rejected (optional)."}
            </p>
            <textarea
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Note (optional)…"
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#fff", padding: "0.6rem 0.75rem", fontSize: "0.84rem", resize: "vertical", outline: "none" }}
            />
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
              <button
                onClick={() => { setReturnNoteModal(null); setReturnNote(""); }}
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.55rem", cursor: "pointer", fontSize: "0.84rem", fontWeight: 600 }}
              >Cancel</button>
              <button
                onClick={handleReturnDecision}
                disabled={returningOrder[returnNoteModal.orderId]}
                style={{ flex: 1, background: returnNoteModal.action === "accept" ? "#16A34A" : "#DC2626", color: "#fff", border: "none", borderRadius: 8, padding: "0.55rem", cursor: returningOrder[returnNoteModal.orderId] ? "not-allowed" : "pointer", fontSize: "0.84rem", fontWeight: 700 }}
              >
                {returningOrder[returnNoteModal.orderId] ? "Processing…" : returnNoteModal.action === "accept" ? "Confirm Accept" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (() => {
        const isReady = qrModal.orderStatus === "ready_for_delivery";
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "linear-gradient(135deg, #150A1F, #1A0D24)", border: "1px solid rgba(184,137,42,0.2)", borderRadius: 14, padding: "1.75rem", maxWidth: 320, width: "100%", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: isReady ? "#93c5fd" : "#D4A94A", fontSize: "1rem" }}>
                  Order #{qrModal.orderId}
                </h3>
                <button onClick={() => setQrModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}><X size={20} /></button>
              </div>

              {/* Context banner */}
              <div style={{ background: isReady ? "rgba(59,130,246,0.1)" : "rgba(217,119,6,0.1)", border: `1.5px solid ${isReady ? "rgba(59,130,246,0.25)" : "rgba(217,119,6,0.25)"}`, borderRadius: 10, padding: "0.65rem 0.85rem", marginBottom: "1rem", textAlign: "left" }}>
                {isReady ? (
                  <>
                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "#93c5fd" }}>🚚 For Delivery Partner</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(147,197,253,0.75)", lineHeight: 1.5 }}>
                      Show this QR to the delivery partner — they scan it from the <strong>LV Delivery app</strong> to confirm pickup.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "#fbbf24" }}>📦 Mark Order as Ready</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(251,191,36,0.75)", lineHeight: 1.5 }}>
                      Tap <strong>Scan QR</strong> above and scan the customer's QR from their Order Tracking page — or scan this code directly.
                    </p>
                  </>
                )}
              </div>

              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "1rem", display: "inline-block" }}>
                <img src={qrModal.qrImage} alt="QR Code" style={{ width: 180, height: 180, display: "block", borderRadius: 6 }} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* QR Scanner */}
      {showScanner && <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* Scan Success Popup */}
      {scanSuccess && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "linear-gradient(135deg, #0A1A0A, #0D2010)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16, padding: "2rem 1.75rem", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            {/* Success icon */}
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "2px solid rgba(74,222,128,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "2rem" }}>
              ✅
            </div>
            <h3 style={{ margin: "0 0 0.4rem", fontFamily: "'Playfair Display', serif", color: "#4ade80", fontSize: "1.3rem" }}>
              QR Scanned!
            </h3>
            <p style={{ margin: "0 0 0.5rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", fontSize: "0.95rem" }}>
              Order #{scanSuccess.orderId} is Ready for Delivery
            </p>
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1.5px solid rgba(74,222,128,0.25)", borderRadius: 10, padding: "0.85rem 1rem", margin: "1rem 0 1.5rem", textAlign: "left" }}>
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "#4ade80" }}>Next Step</p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(74,222,128,0.75)", lineHeight: 1.55 }}>
                🚚 The delivery partner will come to your shop to pick up this order. They will scan the QR code to confirm pickup.
              </p>
            </div>
            <button
              onClick={() => setScanSuccess(null)}
              style={{ width: "100%", padding: "0.8rem", background: "linear-gradient(135deg, #B8892A, #a83060)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.92rem", boxShadow: "0 4px 14px rgba(123,29,69,0.3)" }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "linear-gradient(135deg, #150A1F, #1A0D24)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 16, padding: "1.75rem 1.5rem", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(220,38,38,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.1rem", fontSize: "1.5rem" }}>🗑️</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>Delete Product?</h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              "<strong>{deleteModal.name}</strong>" will be permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setDeleteModal(null)} style={{ flex: 1, padding: "0.75rem", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 10, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: "rgba(255,255,255,0.6)" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "0.75rem", border: "none", borderRadius: 10, background: "rgba(220,38,38,0.8)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.88rem" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

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
