import { useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";

const splashKey = "lvs_splashed";

export default function App() {
  const [showSplash, setShowSplash] = useState(() => sessionStorage.getItem(splashKey) !== "1");
  const onSplashDone = useCallback(() => {
    sessionStorage.setItem(splashKey, "1");
    setShowSplash(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {showSplash && <SplashScreen onDone={onSplashDone} />}
      <ScrollToTop />
      <Routes>
        <Route path="/install" element={<Install />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <WhatsAppButton />
            </>
          }
        />
      </Routes>
    </div>
  );
}
