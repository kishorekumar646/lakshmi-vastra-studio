import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getProducts = (params) => api.get("/api/products", { params });
export const getProduct = (id) => api.get(`/api/products/${id}`);
export const createProduct = (data) => api.post("/api/products", data);
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

export const getCategories = () => api.get("/api/categories");
export const createCategory = (data) => api.post("/api/categories", data);
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);

export const submitInquiry = (data) => api.post("/api/inquiries", data);
export const getInquiries = () => api.get("/api/inquiries");
export const markInquiryRead = (id) => api.put(`/api/inquiries/${id}/read`);

export const adminLogin = (username, password) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  return api.post("/api/admin/login", params);
};

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";
export const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER || "+91 98765 43210";
