import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import TrustBadges from "../components/TrustBadges";

export default function Cart() {
  const { customer, loading: authLoading } = useAuth();
  const { items, updateItem, removeItem, cartTotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Cart | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  if (authLoading) return null;

  if (!customer) {
    return (
      <div style={{ padding: "6rem 0", background: "var(--cream)", minHeight: "70vh", textAlign: "center" }}>
        <div className="container">
          <ShoppingCart size={48} color="var(--primary)" style={{ marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", color: "var(--text)", marginBottom: "0.75rem" }}>Your Cart</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem" }}>Please log in to view your cart.</p>
          <Link to="/account" className="btn-primary">Login / Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrap">
      <div className="container">
        <span className="section-tag">Review your items</span>
        <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>Cart</h1>
        <div className="section-divider" style={{ marginBottom: "2rem" }} />

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <ShoppingCart size={48} color="var(--border-light)" style={{ marginBottom: "1rem" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginBottom: "1.5rem" }}>Your cart is empty.</p>
            <Link to="/shop" className="btn-primary">Browse Shop</Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items list */}
            <div className="cart-items-col">
              {items.map((item) => (
                <div key={item.id} className="cart-item-card">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="cart-item-img" />
                  )}
                  <div className="cart-item-body">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">₹{item.price.toLocaleString("en-IN")} each</p>
                    <div className="cart-qty-row">
                      <button onClick={() => updateItem(item.id, item.quantity - 1)} className="cart-qty-btn">
                        <Minus size={13} />
                      </button>
                      <span className="cart-qty-val">{item.quantity}</span>
                      <button onClick={() => updateItem(item.id, item.quantity + 1)} className="cart-qty-btn">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-right">
                    <p className="cart-item-total">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                    <button onClick={() => removeItem(item.id)} className="cart-remove-btn">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="cart-summary-card">
              <h3 className="cart-summary-title">Order Summary</h3>

              <div className="cart-summary-row">
                <span>{items.reduce((s, i) => s + i.quantity, 0)} item{items.length !== 1 ? "s" : ""}</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="cart-summary-row">
                <span>Delivery</span>
                <span className="cart-summary-free">Free</span>
              </div>
              <div className="cart-summary-total">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>

              <TrustBadges compact />

              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "1rem", marginTop: "0.5rem" }}>
                Secured by <strong>Razorpay</strong> — UPI · Cards · Net Banking
              </p>

              <button
                className="btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
