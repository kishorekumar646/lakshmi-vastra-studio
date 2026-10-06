import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const url = config.url || "";
  let token;
  if (url.startsWith("/api/admin")) {
    token = localStorage.getItem("admin_token");
  } else if (url.startsWith("/api/shops")) {
    token = localStorage.getItem("shop_token");
  } else if (url.startsWith("/api/delivery")) {
    token = localStorage.getItem("delivery_token");
  } else {
    // customer endpoints: /api/auth, /api/cart, /api/wishlist, /api/orders, /api/push, etc.
    token = localStorage.getItem("customer_token");
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = (params) => api.get("/api/products", { params });
export const getAdminProducts = (page = 1, perPage = 10) =>
  api.get("/api/admin/products", { params: { page, per_page: perPage } });
export const getProduct = (id) => api.get(`/api/products/${id}`);
// Admin-specific product CRUD (uses /api/admin/* so admin_token is sent correctly)
export const createProduct = (data) => api.post("/api/admin/products", data);
export const updateProduct = (id, data) => api.put(`/api/admin/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/api/admin/products/${id}`);
export const deleteProductImage = (productId, imageId) => api.delete(`/api/admin/products/${productId}/images/${imageId}`);

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () => api.get("/api/categories");
export const createCategory = (data) => api.post("/api/categories", data);
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);

// ── Inquiries ─────────────────────────────────────────────────────────────────
export const submitInquiry = (data) => api.post("/api/inquiries", data);
export const getInquiries = () => api.get("/api/inquiries");
export const markInquiryRead = (id) => api.put(`/api/inquiries/${id}/read`);

// ── Reviews ───────────────────────────────────────────────────────────────────
export const getRecentReviews = (limit = 6) => api.get("/api/reviews/recent", { params: { limit } });
export const getReviews = (productId) => api.get(`/api/products/${productId}/reviews`);
export const submitReview = (productId, data) => api.post(`/api/products/${productId}/reviews`, data);
export const getAdminReviews = () => api.get("/api/admin/reviews");
export const deleteReview = (id) => api.delete(`/api/admin/reviews/${id}`);
export const toggleReviewVisibility = (id) => api.put(`/api/admin/reviews/${id}/visibility`);

// ── Admin Auth ────────────────────────────────────────────────────────────────
export const adminLogin = (username, password) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  return api.post("/api/admin/login", params);
};

// ── Admin Orders ──────────────────────────────────────────────────────────────
export const getAdminOrders = (page = 1, perPage = 20, status = "") =>
  api.get("/api/admin/orders", { params: { page, per_page: perPage, status: status || undefined } });
export const getAdminDashboard = () => api.get("/api/admin/dashboard");

// ── Pincodes ──────────────────────────────────────────────────────────────────
export const checkPincode = (pincode) => api.get("/api/pincodes/check", { params: { pincode } });
export const getAdminPincodes = () => api.get("/api/admin/pincodes");
export const addPincode = (data) => api.post("/api/admin/pincodes", data);
export const deletePincode = (id) => api.delete(`/api/admin/pincodes/${id}`);
export const togglePincode = (id) => api.put(`/api/admin/pincodes/${id}/toggle`);
export const confirmOrder = (id) => api.put(`/api/admin/orders/${id}/confirm`);
export const assignDelivery = (orderId, deliveryPersonId) =>
  api.put(`/api/admin/orders/${orderId}/assign-delivery`, { delivery_person_id: deliveryPersonId });
export const deleteOrders = (orderIds) => api.delete("/api/admin/orders", { data: { order_ids: orderIds } });

// ── Admin Delivery Persons ────────────────────────────────────────────────────
export const getDeliveryPersons = () => api.get("/api/admin/delivery-persons");
export const createDeliveryPerson = (data) => api.post("/api/admin/delivery-persons", data);
export const toggleDeliveryPerson = (id) => api.put(`/api/admin/delivery-persons/${id}/toggle-active`);

// ── Admin Shop Owners ─────────────────────────────────────────────────────────
export const getShopOwners = () => api.get("/api/admin/shop-owners");
export const approveShopOwner = (id) => api.put(`/api/admin/shop-owners/${id}/approve`);
export const toggleShopOwner = (id) => api.put(`/api/admin/shop-owners/${id}/toggle-active`);
export const updateShopOwner = (id, data) => api.put(`/api/admin/shop-owners/${id}`, data);
export const resetShopOwnerPassword = (id, newPassword) => api.put(`/api/admin/shop-owners/${id}/reset-password`, { new_password: newPassword });
export const resetDeliveryPassword = (id, newPassword) => api.put(`/api/admin/delivery-persons/${id}/reset-password`, { new_password: newPassword });
export const getAdminShopProducts = (params) => api.get("/api/admin/shop-products", { params });
export const assignProductToShop = (data) => api.post("/api/admin/shop-products", data);
export const unassignProductFromShop = (id) => api.delete(`/api/admin/shop-products/${id}`);

// ── Admin Delivery Persons (edit) ─────────────────────────────────────────────
export const updateDeliveryPerson = (id, data) => api.put(`/api/admin/delivery-persons/${id}`, data);

// ── Admin Customers ───────────────────────────────────────────────────────────
export const getAdminCustomers = () => api.get("/api/admin/customers");
export const getAdminPayments = () => api.get("/api/admin/payments");
export const updateAdminCustomer = (id, data) => api.put(`/api/admin/customers/${id}`, data);

// ── Customer Auth ─────────────────────────────────────────────────────────────
export const customerRegister = (data) => api.post("/api/auth/register", data);
export const customerLogin = (data) => api.post("/api/auth/login", data);
export const customerGoogleAuth = (credential) => api.post("/api/auth/google", { credential });
export const getMe = () => api.get("/api/auth/me");
export const updateProfile = (data) => api.put("/api/auth/me", data);

// ── Cart ──────────────────────────────────────────────────────────────────────
export const getCart = () => api.get("/api/cart");
export const addToCart = (product_id, quantity = 1) => api.post("/api/cart", { product_id, quantity });
export const updateCartItem = (item_id, quantity) => api.put(`/api/cart/${item_id}`, { quantity });
export const removeCartItem = (item_id) => api.delete(`/api/cart/${item_id}`);
export const clearCart = () => api.delete("/api/cart");

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const getWishlist = () => api.get("/api/wishlist");
export const addToWishlist = (product_id) => api.post("/api/wishlist", { product_id });
export const removeFromWishlist = (product_id) => api.delete(`/api/wishlist/${product_id}`);

// ── Orders (Customer) ─────────────────────────────────────────────────────────
export const getOrders = () => api.get("/api/orders");
export const createOrder = (delivery_address, payment_method = "razorpay") =>
  api.post("/api/orders/create", { delivery_address, payment_method });
export const verifyPayment = (data) => api.post("/api/orders/verify", data);
export const retryPayment  = (orderId) => api.post(`/api/orders/${orderId}/retry-payment`);
export const trackOrder = (orderId) => api.get(`/api/orders/${orderId}/track`);
export const adminTrackOrder = (orderId) => api.get(`/api/admin/orders/${orderId}/track`);
export const cancelOrder = (orderId) => api.put(`/api/orders/${orderId}/cancel`);
export const requestReturn = (orderId, reason) => api.post(`/api/orders/${orderId}/request-return`, { reason });
export const shopAcceptReturn = (orderId, note) => api.put(`/api/shops/orders/${orderId}/return/accept`, { note });
export const shopRejectReturn = (orderId, note) => api.put(`/api/shops/orders/${orderId}/return/reject`, { note });

// ── Shop Owner ────────────────────────────────────────────────────────────────
export const shopRegister = (data) => api.post("/api/shops/register", data);
export const shopLogin = (data) => api.post("/api/shops/login", data);
export const getShopMe = () => api.get("/api/shops/me");
export const getShopProducts = () => api.get("/api/shops/products");
export const createShopProduct = (data) => api.post("/api/shops/products", data);
export const updateShopProduct = (id, data) => api.put(`/api/shops/products/${id}`, data);
export const deleteShopProduct = (id) => api.delete(`/api/shops/products/${id}`);
export const deleteShopProductImage = (productId, imageId) => api.delete(`/api/shops/products/${productId}/images/${imageId}`);
export const getShopOrders = () => api.get("/api/shops/orders");
export const getShopOrderQr = (orderId) => api.get(`/api/shops/orders/${orderId}/qr`);
export const shopScanQr = (qr_token) => api.post("/api/shops/orders/scan", { qr_token });
export const shopConfirmOrder = (orderId) => api.put(`/api/shops/orders/${orderId}/confirm`);
export const getPublicProduct = (id) => api.get(`/api/products/${id}`);

// ── Delivery Person ───────────────────────────────────────────────────────────
export const deliveryLogin = (data) => api.post("/api/delivery/login", data);
export const getDeliveryMe = () => api.get("/api/delivery/me");
export const getDeliveryOrders = () => api.get("/api/delivery/orders");
export const getAvailableDeliveryOrders = () => api.get("/api/delivery/orders/available");
export const acceptDeliveryOrder = (orderId) => api.post(`/api/delivery/orders/${orderId}/accept`);
export const getDeliveryStats = () => api.get("/api/delivery/stats");
export const getCompletedDeliveries = () => api.get("/api/delivery/orders/completed");
export const deliveryScanQr = (qr_token) => api.post("/api/delivery/orders/scan", { qr_token });
export const markDelivered = (orderId, otp) => api.post(`/api/delivery/orders/${orderId}/delivered`, { otp });
export const shopMarkOrderReady = (orderId) => api.put(`/api/shops/orders/${orderId}/mark-ready`);
export const deliveryMarkPickedUp = (orderId) => api.put(`/api/delivery/orders/${orderId}/mark-picked-up`);
export const getAvailableReturnOrders = () => api.get("/api/delivery/return-orders/available");
export const acceptReturnOrder = (orderId) => api.post(`/api/delivery/return-orders/${orderId}/accept`);
export const getMyReturnOrders = () => api.get("/api/delivery/return-orders");
export const markReturnPickedUp = (orderId) => api.put(`/api/delivery/return-orders/${orderId}/picked-up`);
export const markReturnedToShop = (orderId) => api.put(`/api/delivery/return-orders/${orderId}/returned`);
export const updateDeliveryProfile = (formData) => api.put("/api/delivery/profile", formData);
export const uploadCustomerAvatar = (formData) => api.put("/api/auth/me/avatar", formData);
export const uploadShopAvatar = (formData) => api.put("/api/shops/me/avatar", formData);
export const updateShopMe = (data) => api.put("/api/shops/me", data);
export const changeShopPassword = (data) => api.put("/api/shops/me/password", data);
export const changeDeliveryPassword = (data) => api.put("/api/delivery/me/password", data);

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";
export const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER || "+91 98765 43210";
