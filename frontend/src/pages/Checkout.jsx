import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag, MapPin, CreditCard, Check,
  ChevronLeft, ChevronRight, Minus, Plus, Trash2,
  CheckCircle, Package,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createOrder, verifyPayment, updateProfile } from "../api";
import { formatPhone } from "../utils/phone";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

function openRazorpay(options) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) { reject(new Error("Razorpay not loaded")); return; }
    const rzp = new window.Razorpay({
      ...options,
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("dismissed")) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r.error?.description || "Payment failed")));
    rzp.open();
  });
}

const STEPS = [
  { id: 1, label: "Review Order",      icon: ShoppingBag },
  { id: 2, label: "Delivery Address",  icon: MapPin      },
  { id: 3, label: "Payment",           icon: CreditCard  },
];

function StepBar({ current }) {
  return (
    <div className="checkout-stepbar">
      {STEPS.map((step, idx) => {
        const done    = current > step.id;
        const active  = current === step.id;
        const Icon    = step.icon;
        return (
          <div key={step.id} className="checkout-step-item">
            <div className={`checkout-step-circle ${done ? "done" : active ? "active" : ""}`}>
              {done ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
            </div>
            <span className={`checkout-step-label ${active ? "active" : done ? "done" : ""}`}>
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={`checkout-step-line ${done ? "done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { customer, setCustomer, loading: authLoading } = useAuth();
  const { items, updateItem, removeItem, clearCartLocal, cartTotal } = useCart();
  const [step, setStep]       = useState(1);
  const [placing, setPlacing] = useState(false);
  const [paid, setPaid]       = useState(false);
  const [address, setAddress] = useState({
    name: "", phone: "", address: "", city: "", state: "", pincode: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    document.title = "Checkout | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  useEffect(() => {
    if (!authLoading && customer) {
      setAddress({
        name:    customer.name    || "",
        phone:   customer.phone   || "",
        address: customer.address || "",
        city:    customer.city    || "",
        state:   customer.state   || "",
        pincode: customer.pincode || "",
      });
    }
  }, [customer, authLoading]);

  if (authLoading) return null;

  if (!customer) {
    return (
      <div style={{ padding: "6rem 0", textAlign: "center", background: "var(--cream)", minHeight: "70vh" }}>
        <div className="container">
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Please log in to checkout.</p>
          <Link to="/account" className="btn-primary">Login / Register</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !paid) {
    navigate("/cart", { replace: true });
    return null;
  }

  const set = (k) => (e) => {
    setAddress((a) => ({ ...a, [k]: e.target.value }));
    if (fieldErrors[k]) setFieldErrors((prev) => ({ ...prev, [k]: "" }));
  };

  const validateAddress = () => {
    const errors = {};
    if (!address.address.trim()) errors.address = "Street address is required";
    if (!address.city.trim()) errors.city = "City is required";
    if (!address.state.trim()) errors.state = "State is required";
    if (!/^[0-9]{6}$/.test(address.pincode)) errors.pincode = "Enter a valid 6-digit PIN code";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePay = async () => {
    if (placing) return;
    setPlacing(true);
    const fullAddress = [address.name, address.phone, address.address, address.city, address.state, address.pincode]
      .filter(Boolean).join(", ");
    try {
      const { data: order } = await createOrder(fullAddress);
      const payment = await openRazorpay({
        key:         order.key_id || RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency || "INR",
        name:        "Lakshmi Vastra Studio",
        description: `Order #${order.order_id}`,
        order_id:    order.razorpay_order_id,
        prefill:     { name: address.name, contact: address.phone, email: customer.email },
        theme:       { color: "#7B1D45" },
        modal:       { escape: false },
      });
      await verifyPayment({
        order_id:             order.order_id,
        razorpay_order_id:    payment.razorpay_order_id,
        razorpay_payment_id:  payment.razorpay_payment_id,
        razorpay_signature:   payment.razorpay_signature,
      });
      // Mark paid BEFORE clearing cart so the empty-cart guard doesn't redirect
      setPaid(true);
      clearCartLocal();
      try {
        const { data: updated } = await updateProfile({
          phone:           customer.phone || "",
          secondary_phone: customer.secondary_phone || "",
          address:         address.address,
          city:            address.city,
          state:           address.state,
          pincode:         address.pincode,
        });
        setCustomer(updated);
      } catch { /* non-critical */ }
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

  /* ── Order success screen ── */
  if (paid) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-body">
            <div className="checkout-card checkout-animate checkout-success-card">
              <div className="checkout-success-icon">
                <CheckCircle size={52} strokeWidth={1.5} />
              </div>
              <h2 className="checkout-success-title">Order Confirmed!</h2>
              <p className="checkout-success-sub">
                Thank you for shopping with us. Your order has been placed successfully and is being processed.
              </p>
              <div className="checkout-success-actions">
                <button
                  className="btn-primary checkout-success-btn"
                  onClick={() => navigate("/account?tab=orders", { replace: true })}
                >
                  <Package size={16} /> View My Orders
                </button>
                <Link to="/shop" className="checkout-success-continue">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="checkout-breadcrumb">
          <Link to="/cart"><ChevronLeft size={14} /> Back to Cart</Link>
        </div>

        <h1 className="checkout-heading">Checkout</h1>

        <StepBar current={step} />

        <div className="checkout-layout">
          {/* ─── Main content area ─── */}
          <div className="checkout-main">

            {/* ─── Step 1: Review Order ─── */}
            {step === 1 && (
              <div className="checkout-card checkout-animate">
                <h2 className="checkout-section-title">Review Your Order</h2>
                <div className="checkout-items-list">
                  {items.map((item) => (
                    <div key={item.id} className="checkout-item-row">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="checkout-item-img" />
                      )}
                      <div className="checkout-item-info">
                        <p className="checkout-item-name">{item.name}</p>
                        <p className="checkout-item-price">₹{item.price.toLocaleString("en-IN")} each</p>
                        <div className="checkout-qty-control">
                          <button onClick={() => updateItem(item.id, item.quantity - 1)} className="checkout-qty-btn">
                            <Minus size={12} />
                          </button>
                          <span className="checkout-qty-val">{item.quantity}</span>
                          <button onClick={() => updateItem(item.id, item.quantity + 1)} className="checkout-qty-btn">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="checkout-item-right">
                        <p className="checkout-item-total">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                        <button onClick={() => removeItem(item.id)} className="checkout-remove-btn">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-primary checkout-next-btn" onClick={() => setStep(2)}>
                  Continue to Delivery <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* ─── Step 2: Delivery Address ─── */}
            {step === 2 && (
              <div className="checkout-card checkout-animate">
                <h2 className="checkout-section-title">Delivery Address</h2>

                <div className="checkout-readonly-row">
                  <div className="checkout-readonly-field">
                    <label>Full Name</label>
                    <div className="checkout-readonly-val">{address.name || "—"}</div>
                  </div>
                  <div className="checkout-readonly-field">
                    <label>Phone</label>
                    <div className="checkout-readonly-val">{address.phone ? formatPhone(address.phone) : "—"}</div>
                  </div>
                </div>
                <p className="checkout-hint">
                  To update name or phone, visit <Link to="/account">Account Settings</Link>.
                </p>

                <div className="checkout-field">
                  <label>Street Address *</label>
                  <input
                    value={address.address} onChange={set("address")}
                    placeholder="House no., Street, Area, Landmark"
                    autoComplete="street-address"
                    className={fieldErrors.address ? "input-error" : ""}
                  />
                  {fieldErrors.address && <span className="checkout-field-error">{fieldErrors.address}</span>}
                </div>
                <div className="checkout-field-row">
                  <div className="checkout-field">
                    <label>City *</label>
                    <input
                      value={address.city} onChange={set("city")} placeholder="Chennai"
                      autoComplete="address-level2"
                      className={fieldErrors.city ? "input-error" : ""}
                    />
                    {fieldErrors.city && <span className="checkout-field-error">{fieldErrors.city}</span>}
                  </div>
                  <div className="checkout-field">
                    <label>State *</label>
                    <input
                      value={address.state} onChange={set("state")} placeholder="Tamil Nadu"
                      autoComplete="address-level1"
                      className={fieldErrors.state ? "input-error" : ""}
                    />
                    {fieldErrors.state && <span className="checkout-field-error">{fieldErrors.state}</span>}
                  </div>
                  <div className="checkout-field checkout-field--pincode">
                    <label>PIN Code *</label>
                    <input
                      value={address.pincode} onChange={set("pincode")} placeholder="600001"
                      maxLength={6} autoComplete="postal-code"
                      className={fieldErrors.pincode ? "input-error" : ""}
                    />
                    {fieldErrors.pincode && <span className="checkout-field-error">{fieldErrors.pincode}</span>}
                  </div>
                </div>

                <div className="checkout-btn-row">
                  <button className="checkout-back-btn" onClick={() => setStep(1)}>
                    <ChevronLeft size={16} /> Review Order
                  </button>
                  <button
                    className="btn-primary checkout-next-btn"
                    onClick={() => { if (validateAddress()) setStep(3); }}
                  >
                    Continue to Payment <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 3: Payment ─── */}
            {step === 3 && (
              <div className="checkout-card checkout-animate">
                <h2 className="checkout-section-title">Payment</h2>

                {/* Address recap */}
                <div className="checkout-address-recap">
                  <MapPin size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="checkout-recap-name">{address.name} · {address.phone ? formatPhone(address.phone) : ""}</p>
                    <p className="checkout-recap-addr">
                      {[address.address, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <button className="checkout-edit-link" onClick={() => setStep(2)}>Edit</button>
                </div>

                <div className="checkout-razorpay-badge">
                  Secured by <strong>Razorpay</strong> — UPI · Cards · Net Banking · Wallets
                </div>

                <div className="checkout-btn-row">
                  <button className="checkout-back-btn" onClick={() => setStep(2)}>
                    <ChevronLeft size={16} /> Edit Address
                  </button>
                  <button
                    className="btn-primary checkout-pay-btn"
                    onClick={handlePay}
                    disabled={placing}
                  >
                    {placing ? (
                      <><span className="checkout-spinner" /> Processing...</>
                    ) : (
                      <><CreditCard size={16} /> Pay ₹{cartTotal.toLocaleString("en-IN")}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Sidebar: Order Summary ─── */}
          <div className="checkout-sidebar">
            <div className="checkout-summary-widget">
              <h3 className="checkout-summary-widget-title">Order Summary</h3>
              <div className="checkout-summary-items">
                {items.map((item) => (
                  <div key={item.id} className="checkout-summary-item">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="checkout-summary-item-img" />
                    )}
                    <div className="checkout-summary-item-info">
                      <p className="checkout-summary-item-name">{item.name}</p>
                      <p className="checkout-summary-item-qty">Qty: {item.quantity}</p>
                    </div>
                    <span className="checkout-summary-item-price">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-summary-divider" />
              <div className="checkout-summary-row">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="checkout-summary-row free">
                <span>Delivery</span><span>Free</span>
              </div>
              <div className="checkout-summary-total">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="checkout-sidebar-trust">
                <span>🔒 100% Secure Payments</span>
                <span>🚚 Free Delivery</span>
                <span>↩️ Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
