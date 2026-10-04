import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingCart, X, ArrowRight, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createOrder, verifyPayment } from "../api";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

function openRazorpay(options) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) { reject(new Error("Razorpay not loaded")); return; }
    const rzp = new window.Razorpay({
      ...options,
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("dismissed")) },
    });
    rzp.on("payment.failed", (resp) => reject(new Error(resp.error?.description || "Payment failed")));
    rzp.open();
  });
}

const labelSt = { fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "0.3rem" };

export default function Cart() {
  const { customer, loading: authLoading } = useAuth();
  const { items, updateItem, removeItem, clearCartLocal, cartTotal } = useCart();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });

  const openCheckout = () => {
    setAddress({
      name:    customer?.name    || "",
      phone:   customer?.phone   || "",
      address: customer?.address || "",
      city:    customer?.city    || "",
      state:   customer?.state   || "",
      pincode: customer?.pincode || "",
    });
    setShowCheckout(true);
  };

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

  const handleCheckout = async (e) => {
    e.preventDefault();
    setPlacing(true);

    const fullAddress = [address.name, address.phone, address.address, address.city, address.state, address.pincode].filter(Boolean).join(", ");

    try {
      // Step 1: create order on backend (calls Razorpay API)
      const { data: order } = await createOrder(fullAddress);

      // Step 2: open Razorpay payment modal
      const payment = await openRazorpay({
        key: order.key_id || RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Lakshmi Vastra Studio",
        description: `Order #${order.order_id}`,
        order_id: order.razorpay_order_id,
        prefill: {
          name: address.name,
          contact: address.phone,
          email: customer.email,
        },
        theme: { color: "#7B1D45" },
        modal: { escape: false },
      });

      // Step 3: verify payment signature on backend
      await verifyPayment({
        order_id: order.order_id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });

      clearCartLocal();
      setShowCheckout(false);
      toast.success("Payment successful! Your order is confirmed.");
      navigate("/account");

    } catch (err) {
      if (err.message === "dismissed") {
        toast("Payment cancelled.", { icon: "ℹ️" });
      } else {
        toast.error(err.response?.data?.detail || err.message || "Payment failed. Please try again.");
      }
    } finally {
      setPlacing(false);
    }
  };

  const set = (k) => (e) => setAddress({ ...address, [k]: e.target.value });

  return (
    <div style={{ padding: "2.5rem 0 6rem", background: "var(--cream)", minHeight: "70vh" }}>
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
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Items list */}
            <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {items.map((item) => (
                <div key={item.id} style={{
                  background: "#fff", borderRadius: 10, padding: "1rem 1.25rem",
                  border: "1px solid var(--border-light)", display: "flex", gap: "1rem", alignItems: "center",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name}
                      style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.95rem", marginBottom: "0.2rem" }}>{item.name}</p>
                    <p style={{ color: "var(--gold)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.6rem" }}>
                      ₹{item.price.toLocaleString("en-IN")} each
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button onClick={() => updateItem(item.id, item.quantity - 1)}
                        style={{ width: 30, height: 30, border: "1.5px solid var(--border-light)", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.15s" }}>
                        <Minus size={13} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: 28, textAlign: "center", fontSize: "0.95rem" }}>{item.quantity}</span>
                      <button onClick={() => updateItem(item.id, item.quantity + 1)}
                        style={{ width: 30, height: 30, border: "1.5px solid var(--border-light)", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.15s" }}>
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontWeight: 700, color: "var(--text)", fontSize: "1rem", marginBottom: "0.6rem" }}>
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                    <button onClick={() => removeItem(item.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", padding: "0.25rem", borderRadius: 4, transition: "background 0.15s" }}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div style={{
              flex: "0 0 300px", background: "#fff", borderRadius: 12, padding: "1.75rem",
              border: "1px solid var(--border-light)", position: "sticky", top: 88,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: "var(--text)", marginBottom: "1.25rem" }}>
                Order Summary
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.7rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                <span>{items.reduce((s, i) => s + i.quantity, 0)} item{items.length !== 1 ? "s" : ""}</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <span>Delivery</span>
                <span style={{ color: "#1a7a4a", fontWeight: 600 }}>Free</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: "1.5rem" }}>
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>

              {/* Razorpay badge */}
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "1rem" }}>
                Secured by <strong>Razorpay</strong> — UPI, Cards, Net Banking
              </p>

              <button
                className="btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                onClick={openCheckout}
              >
                Proceed to Pay <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCheckout(false); }}>
          <div style={{
            background: "#fff", borderRadius: 14, padding: "2rem 2.25rem",
            width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            animation: "slideUp 0.25s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--text)" }}>Delivery Details</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>You'll be redirected to Razorpay to pay</p>
              </div>
              <button onClick={() => setShowCheckout(false)}
                style={{ background: "var(--cream)", border: "none", cursor: "pointer", borderRadius: 8, padding: "0.4rem", display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCheckout} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelSt}>Full Name</label>
                <input value={address.name} onChange={set("name")} placeholder="As per delivery address" required autoComplete="name" style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={labelSt}>Phone Number</label>
                <input value={address.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" required autoComplete="tel" style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={labelSt}>Street Address</label>
                <input value={address.address} onChange={set("address")} placeholder="House no., Street, Area" required autoComplete="street-address" style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelSt}>City</label>
                  <input value={address.city} onChange={set("city")} placeholder="Chennai" required autoComplete="address-level2" style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelSt}>State</label>
                  <input value={address.state} onChange={set("state")} placeholder="Tamil Nadu" required autoComplete="address-level1" style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: "0 0 100px" }}>
                  <label style={labelSt}>PIN Code</label>
                  <input value={address.pincode} onChange={set("pincode")} placeholder="600001" required pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ background: "var(--cream)", borderRadius: 8, padding: "1rem 1.25rem", marginTop: "0.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                  <span>Subtotal</span><span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#1a7a4a", fontWeight: 600, marginBottom: "0.75rem" }}>
                  <span>Delivery</span><span>Free</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem", color: "var(--text)", borderTop: "1px solid var(--border-light)", paddingTop: "0.65rem" }}>
                  <span>Total to pay</span><span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={placing}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: placing ? 0.75 : 1, marginTop: "0.25rem" }}
              >
                {placing
                  ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Opening Razorpay...</>
                  : <><CheckCircle size={16} /> Pay ₹{cartTotal.toLocaleString("en-IN")}</>
                }
              </button>

              <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                UPI · Credit/Debit Cards · Net Banking · Wallets
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
