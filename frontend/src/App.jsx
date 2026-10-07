import { useState, useCallback, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ShopLogin from "./pages/ShopLogin";
import ShopDashboard from "./pages/ShopDashboard";
import DeliveryLogin from "./pages/DeliveryLogin";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import OrderTracking from "./pages/OrderTracking";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import Shop from "./pages/Shop";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import ApiDocs from "./pages/ApiDocs";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import CookiePolicy from "./pages/CookiePolicy";
import About from "./pages/About";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";
import BackToTop from "./components/BackToTop";
import BottomNav from "./components/BottomNav";
import CookieBanner from "./components/CookieBanner";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

const splashKey = "lvs_splashed";
const PORTAL = import.meta.env.VITE_PORTAL; // "shop" | "delivery" | undefined

function ShopProtectedRoute({ children }) {
  const token = localStorage.getItem("shop_token");
  return token ? children : <Navigate to="/shop/login" replace />;
}

function DeliveryProtectedRoute({ children }) {
  const token = localStorage.getItem("delivery_token");
  return token ? children : <Navigate to="/delivery/login" replace />;
}

// ── Shop-only standalone build ──────────────────────────────────────
function ShopApp() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/shop/login" element={<ShopLogin />} />
        <Route path="/shop/dashboard/*" element={<ShopProtectedRoute><ShopDashboard /></ShopProtectedRoute>} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="*" element={<Navigate to="/shop/login" replace />} />
      </Routes>
      <CookieBanner />
    </>
  );
}

// ── Delivery-only standalone build ──────────────────────────────────
function DeliveryApp() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/delivery/login" element={<DeliveryLogin />} />
        <Route path="/delivery/dashboard" element={<DeliveryProtectedRoute><DeliveryDashboard /></DeliveryProtectedRoute>} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="*" element={<Navigate to="/delivery/login" replace />} />
      </Routes>
      <CookieBanner />
    </>
  );
}

// ── Admin-only standalone build ──────────────────────────────────────
function AdminApp() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/track/:orderId" element={<OrderTracking />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      <CookieBanner />
    </>
  );
}

// Customer shell — hides Navbar/Footer on home so the luxury layout can own the full page
function CustomerLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      {!isHome && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/account" element={<Account />} />
          <Route path="/about" element={<About />} />
          <Route path="/track/:orderId" element={<OrderTracking />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isHome && <Footer />}
      <BackToTop />
      <BottomNav />
      <CookieBanner />
    </>
  );
}

export default function App() {
  // Portal-specific standalone builds — minimal, no customer shell
  if (PORTAL === "shop") return <ShopApp />;
  if (PORTAL === "delivery") return <DeliveryApp />;
  if (PORTAL === "admin") return <AdminApp />;

  const [showSplash, setShowSplash] = useState(() => sessionStorage.getItem(splashKey) !== "1");
  const onSplashDone = useCallback(() => {
    sessionStorage.setItem(splashKey, "1");
    setShowSplash(false);
  }, []);

  useEffect(() => {
    const block = (e) => { if (e.target.tagName === "IMG") e.preventDefault(); };
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col">
            {showSplash && <SplashScreen onDone={onSplashDone} />}
            <ScrollToTop />
            <Routes>
              {/* Standalone portals — no Navbar/Footer */}
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/install" element={<Install />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/shop/login" element={<ShopLogin />} />
              <Route path="/shop/dashboard/*" element={<ShopProtectedRoute><ShopDashboard /></ShopProtectedRoute>} />
              <Route path="/delivery/login" element={<DeliveryLogin />} />
              <Route path="/delivery/dashboard" element={<DeliveryProtectedRoute><DeliveryDashboard /></DeliveryProtectedRoute>} />

              {/* Customer-facing pages — with Navbar/Footer */}
              <Route path="*" element={<CustomerLayout />} />
            </Routes>
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
