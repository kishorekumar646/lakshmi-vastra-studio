import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProduct, getReviews, submitReview, checkPincode, WHATSAPP_NUMBER, PHONE_NUMBER } from "../api";
import { ArrowLeft, Phone, ChevronLeft, ChevronRight, Share2, ShoppingCart, Zap, Minus, Plus, Check, Heart, MapPin, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { ProductDetailSkeleton } from "../components/Skeleton";
import Lightbox from "../components/Lightbox";
import MagnifierImage from "../components/MagnifierImage";
import StarRating from "../components/StarRating";
import RelatedProducts from "../components/RelatedProducts";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

const WA_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.12 1.523 5.854L.057 23.893c-.072.303.197.571.499.499l6.086-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.213-3.724.899.916-3.635-.234-.373A9.818 9.818 0 1112 21.818z"/>
  </svg>
);

const EMPTY_REVIEW = { reviewer_name: "", rating: 0, comment: "" };

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { customer } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Pincode checker
  const [pinInput, setPinInput] = useState("");
  const [pinResult, setPinResult] = useState(null); // null | {serviceable, city, state}
  const [pinChecking, setPinChecking] = useState(false);

  const handlePinCheck = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinInput)) { toast.error("Enter a valid 6-digit PIN code"); return; }
    setPinChecking(true);
    try {
      const { data } = await checkPincode(pinInput);
      setPinResult(data);
    } catch {
      setPinResult({ serviceable: false, city: "", state: "" });
    } finally {
      setPinChecking(false);
    }
  };

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((r) => {
        setProduct(r.data);
        setActiveImg(0);
        document.title = `${r.data.name} | Lakshmi Vastra Studio`;
      })
      .finally(() => setLoading(false));
    getReviews(id).then((r) => setReviews(r.data)).catch(() => {});
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, [id]);

  const wishlisted = product ? isWishlisted(product.id) : false;

  const handleWishlist = () => {
    if (!customer) { navigate("/account"); return; }
    toggle(product.id);
  };

  const handleAddToCart = async () => {
    if (adding || added) return;
    setAdding(true);
    try {
      await addItem(product, qty);
      setAdded(true);
      toast.success(`"${product.name}" added to cart`);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  async function handleShareProduct() {
    const url = window.location.href;
    const text = product ? `Check out "${product.name}" ₹${product.price.toLocaleString("en-IN")} at Lakshmi Vastra Studio` : "Check out this saree at Lakshmi Vastra Studio";
    if (navigator.share) {
      try { await navigator.share({ title: product?.name, text, url }); } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(url); alert("Link copied to clipboard!"); } catch (_) {}
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewError("");
    if (!reviewForm.reviewer_name.trim()) { setReviewError("Please enter your name."); return; }
    if (reviewForm.rating === 0) { setReviewError("Please select a star rating."); return; }
    setSubmittingReview(true);
    try {
      const r = await submitReview(id, reviewForm);
      setReviews((prev) => [r.data, ...prev]);
      setReviewForm(EMPTY_REVIEW);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch {
      setReviewError("Failed to submit. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  }

  // Build images list — must be before early returns (hooks must not come after conditionals)
  const images = product
    ? (product.images && product.images.length > 0)
      ? product.images.map((img) => img.url)
      : (product.image_url ? [product.image_url] : [])
    : [];

  // Auto-slide every 3s; pause when lightbox open or user manually navigated
  useEffect(() => {
    if (images.length <= 1 || lightboxOpen || userInteracted) return;
    const timer = setInterval(() => {
      setActiveImg((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length, lightboxOpen, userInteracted]);

  // Resume auto-slide 5s after user manually taps an arrow/thumbnail
  useEffect(() => {
    if (!userInteracted) return;
    const t = setTimeout(() => setUserInteracted(false), 5000);
    return () => clearTimeout(t);
  }, [userInteracted]);

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "4rem 1.5rem", background: "var(--cream)" }}>
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--gold)", fontSize: "1.1rem", letterSpacing: "0.1em", marginBottom: "0.75rem", display: "block" }}>Oops</span>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "var(--text)", fontWeight: 700, marginBottom: "0.75rem" }}>Product Not Found</h2>
      <div style={{ width: 60, height: 1, background: "var(--gold)", margin: "0 auto 1.5rem", opacity: 0.6 }} />
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.75 }}>This product may have been removed or is no longer available.</p>
      <Link to="/catalog" className="btn-primary">Browse Collection</Link>
    </div>
  );

  const waMsg = `Hello%2C%20I%20am%20interested%20in%20%22${encodeURIComponent(product.name)}%22%20(%E2%82%B9${product.price}).%20Please%20share%20more%20details.`;

  const goToImg = (i) => { setActiveImg(i); setUserInteracted(true); };

  const canPrev = activeImg > 0;
  const canNext = activeImg < images.length - 1;

  return (
    <>
    <div style={{ padding: "2.5rem 0 5.5rem", background: "var(--cream)" }}>
      <div className="container">
        {/* Breadcrumb */}
        <nav style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <Link to="/" style={{ color: "var(--text-muted)", textDecoration: "none" }} onMouseOver={(e) => e.target.style.color = "var(--primary)"} onMouseOut={(e) => e.target.style.color = "var(--text-muted)"}>Home</Link>
          <span>›</span>
          <Link to="/catalog" style={{ color: "var(--text-muted)", textDecoration: "none" }} onMouseOver={(e) => e.target.style.color = "var(--primary)"} onMouseOut={(e) => e.target.style.color = "var(--text-muted)"}>Collection</Link>
          {product.category_name && (
            <>
              <span>›</span>
              <Link to={`/catalog?category=${product.category_id}`} style={{ color: "var(--text-muted)", textDecoration: "none" }} onMouseOver={(e) => e.target.style.color = "var(--primary)"} onMouseOut={(e) => e.target.style.color = "var(--text-muted)"}>{product.category_name}</Link>
            </>
          )}
          <span>›</span>
          <span style={{ color: "var(--text)", fontWeight: 500 }}>{product.name}</span>
        </nav>

        <Link to="/catalog" style={styles.back}>
          <ArrowLeft size={16} /> Back to Collection
        </Link>

        <div className="product-detail-grid">
          {/* Image Gallery */}
          <div>
            {/* Main image */}
            <div style={styles.mainImgWrap}>
              {images.length > 0 ? (
                <MagnifierImage
                  key={activeImg}
                  src={images[activeImg]}
                  alt={product.name}
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <div style={styles.placeholder}>No Image Available</div>
              )}

              {/* Arrow nav (only if >1 image) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => goToImg(activeImg - 1)}
                    disabled={!canPrev}
                    style={{ ...styles.imgArrow, left: 10, opacity: canPrev ? 1 : 0.35 }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => goToImg(activeImg + 1)}
                    disabled={!canNext}
                    style={{ ...styles.imgArrow, right: 10, opacity: canNext ? 1 : 0.35 }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div style={styles.thumbStrip}>
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => goToImg(i)}
                    style={{
                      ...styles.thumbBtn,
                      ...(i === activeImg ? styles.thumbBtnActive : {}),
                    }}
                  >
                    <img src={url} alt="" style={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div style={styles.info}>
            <p style={styles.category}>{product.category_name}</p>
            <h1 style={styles.name}>{product.name}</h1>
            <div style={{ width: 40, height: 1, background: "var(--gold)", marginBottom: "1.25rem", opacity: 0.6 }} />
            <p style={styles.price}>₹{product.price.toLocaleString("en-IN")}</p>
            {product.description && <p style={styles.desc}>{product.description}</p>}

            {/* Quantity + Wishlist row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Qty</span>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border-light)", borderRadius: 6, overflow: "hidden" }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 36, height: 36, border: "none", background: "var(--cream)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ minWidth: 36, textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} style={{ width: 36, height: 36, border: "none", background: "var(--cream)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <button
                onClick={handleWishlist}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: wishlisted ? "var(--primary)" : "var(--text-muted)", fontWeight: 600, fontSize: "0.82rem", padding: "0.4rem 0.5rem", borderRadius: 4, transition: "color 0.2s" }}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={17} fill={wishlisted ? "var(--primary)" : "none"} color={wishlisted ? "var(--primary)" : "var(--text-muted)"} />
                {wishlisted ? "Wishlisted" : "Wishlist"}
              </button>
            </div>

            {/* Primary CTAs */}
            <div style={{ display: "flex", gap: "0.65rem", marginBottom: "0.65rem" }}>
              <button
                onClick={handleBuyNow}
                disabled={adding}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", padding: "0.95rem 1rem", background: "var(--primary)", color: "#fff", border: "2px solid var(--primary)", borderRadius: 6, cursor: adding ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.04em", textTransform: "uppercase", opacity: adding ? 0.7 : 1, transition: "opacity 0.2s" }}
              >
                <Zap size={16} /> Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", padding: "0.95rem 1rem", background: added ? "#1a7a4a" : "#fff", color: added ? "#fff" : "var(--primary)", border: `2px solid ${added ? "#1a7a4a" : "var(--primary)"}`, borderRadius: 6, cursor: adding ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.04em", textTransform: "uppercase", transition: "all 0.25s" }}
              >
                {added ? <><Check size={16} /> Added</> : <><ShoppingCart size={16} /> Add to Cart</>}
              </button>
            </div>

            {/* Contact row */}
            <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1.5rem" }}>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`} target="_blank" rel="noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", padding: "0.7rem 1rem", background: "#25D366", color: "#fff", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.03em" }}>
                {WA_ICON} WhatsApp
              </a>
              <a href={`tel:${PHONE_NUMBER}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", padding: "0.7rem 1rem", background: "#fff", color: "var(--primary)", border: "2px solid var(--primary)", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.03em" }}>
                <Phone size={15} /> Call Us
              </a>
              <button onClick={handleShareProduct}
                style={{ width: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "2px solid var(--border-light)", borderRadius: 6, cursor: "pointer", color: "var(--text-muted)" }}>
                <Share2 size={16} />
              </button>
            </div>

            {/* Trust badges: 3-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {[
                { icon: "🔒", label: "Secure Pay" },
                { icon: "🚚", label: "Cash on Delivery" },
                { icon: "↩️", label: "Easy Returns" },
                { icon: "🏆", label: "100% Genuine" },
                { icon: "📞", label: "Live Support" },
                { icon: "✅", label: "GST Verified" },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.6rem", background: "#fff", border: "1px solid var(--border-light)", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  <span style={{ fontSize: "0.9rem" }}>{icon}</span> {label}
                </div>
              ))}
            </div>

            {(product.is_handloom || product.has_multiple_colours || product.custom_orders) && (
              <div style={styles.note}>
                {product.is_handloom && (
                  <p style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "var(--gold)", fontWeight: 700 }}>✓</span> Genuine handloom product
                  </p>
                )}
                {product.has_multiple_colours && (
                  <p style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "var(--gold)", fontWeight: 700 }}>✓</span> Available in multiple colours
                  </p>
                )}
                {product.custom_orders && (
                  <p style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "var(--gold)", fontWeight: 700 }}>✓</span> Contact us for custom orders
                  </p>
                )}
              </div>
            )}

            {/* ── PIN Code delivery checker ── */}
            <div style={{ marginTop: "1.5rem", padding: "1.1rem 1.25rem", background: "var(--cream)", borderRadius: 10, border: "1px solid var(--border-light)" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.65rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <MapPin size={14} color="var(--primary)" /> Check Delivery Availability
              </p>
              <form onSubmit={handlePinCheck} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinResult(null); }}
                  placeholder="Enter 6-digit PIN code"
                  maxLength={6}
                  style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid var(--border)", fontSize: "0.88rem", fontFamily: "monospace", letterSpacing: "0.1em" }}
                />
                <button
                  type="submit"
                  disabled={pinChecking || pinInput.length !== 6}
                  style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: pinInput.length === 6 ? "pointer" : "not-allowed", fontSize: "0.85rem", fontWeight: 700, opacity: pinInput.length !== 6 ? 0.5 : 1, whiteSpace: "nowrap" }}
                >
                  {pinChecking ? "Checking…" : "Check"}
                </button>
              </form>
              {pinResult && (
                <div style={{ marginTop: "0.65rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.84rem", fontWeight: 600, color: pinResult.serviceable ? "#16a34a" : "#dc2626" }}>
                  {pinResult.serviceable
                    ? <><CheckCircle size={15} /> Delivery available{pinResult.city ? ` in ${pinResult.city}${pinResult.state ? `, ${pinResult.state}` : ""}` : ""}!</>
                    : <><XCircle size={15} /> Sorry, we don't deliver to PIN {pinInput} yet.</>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {lightboxOpen && (
      <Lightbox
        images={images}
        startIndex={activeImg}
        onClose={() => setLightboxOpen(false)}
      />
    )}

    {/* Reviews Section */}
    <section style={{ background: "var(--cream)", padding: "3rem 0 4rem", borderTop: "1px solid var(--border-light)" }}>
      <div className="container" style={{ maxWidth: 780 }}>
        {/* Header with avg rating */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.3rem,4vw,1.8rem)", color: "var(--text)", fontWeight: 700 }}>
            Customer Reviews
          </h2>
          {reviews.length > 0 && (
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.2rem" }}>
              {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} / 5 · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {reviews.length > 0 && (
          <StarRating value={Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)} size={22} />
        )}
        <div className="section-divider" style={{ margin: "1rem 0 2rem" }} />

        {/* Review list */}
        {reviews.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic", marginBottom: "2rem" }}>
            No reviews yet — be the first to share your experience!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ background: "#fff", borderRadius: 8, padding: "1.25rem 1.5rem", border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.95rem" }}>{r.reviewer_name}</span>
                  <StarRating value={r.rating} size={16} />
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "auto" }}>
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {r.comment && <p style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: "0.92rem", margin: 0 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Write a review form */}
        <div style={{ background: "#fff", borderRadius: 8, padding: "1.75rem", border: "1px solid var(--border-light)" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: "var(--text)", marginBottom: "1.25rem", fontWeight: 700 }}>
            Write a Review
          </h3>
          {reviewSuccess && (
            <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#2e7d32", fontSize: "0.9rem" }}>
              ✓ Thank you for your review!
            </div>
          )}
          <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Your Name *</label>
              <input
                type="text"
                placeholder="e.g. Priya S."
                value={reviewForm.reviewer_name}
                onChange={(e) => setReviewForm((f) => ({ ...f, reviewer_name: e.target.value }))}
                style={{ maxWidth: 320 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Rating *</label>
              <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} size={28} interactive />
            </div>
            <div>
              <label style={labelStyle}>Comment (optional)</label>
              <textarea
                placeholder="Share your experience with this product..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                rows={3}
                style={{ resize: "vertical", minHeight: 80 }}
              />
            </div>
            {reviewError && <p style={{ color: "#c0392b", fontSize: "0.85rem", margin: 0 }}>{reviewError}</p>}
            <div>
              <button type="submit" className="btn-primary" disabled={submittingReview} style={{ opacity: submittingReview ? 0.6 : 1 }}>
                {submittingReview ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    {/* Related Products */}
    <RelatedProducts categoryId={product.category_id} excludeId={product.id} />
    </>
  );
}

const styles = {
  loading: { textAlign: "center", padding: "5rem 0", color: "var(--text-muted)", fontSize: "1.1rem" },
  back: { display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--primary)", textDecoration: "none", marginBottom: "2rem", fontWeight: 500, fontSize: "0.85rem", letterSpacing: "0.04em", textTransform: "uppercase" },
  mainImgWrap: { position: "relative", borderRadius: 6, overflow: "hidden", background: "#fff", border: "1px solid var(--border-light)", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  mainImg: { width: "100%", display: "block", objectFit: "cover", maxHeight: 520 },
  placeholder: { width: "100%", minHeight: 400, background: "var(--cream-deep)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: "1rem" },
  imgArrow: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "1px solid var(--border-light)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "opacity 0.2s" },
  thumbStrip: { display: "flex", gap: "0.6rem", marginTop: "0.75rem", flexWrap: "wrap" },
  thumbBtn: { width: 72, height: 72, borderRadius: 4, overflow: "hidden", border: "2px solid var(--border-light)", cursor: "pointer", background: "none", padding: 0, transition: "border-color 0.2s" },
  thumbBtnActive: { borderColor: "var(--primary)" },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  info: { paddingTop: "0.5rem" },
  category: { fontSize: "0.7rem", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "0.5rem", fontWeight: 700 },
  name: { fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "var(--text)", marginBottom: "0.75rem", fontWeight: 700, lineHeight: 1.15 },
  price: { fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: 700, color: "var(--primary)", marginBottom: "1.5rem" },
  desc: { color: "var(--text-muted)", lineHeight: 1.85, fontSize: "0.975rem", marginBottom: "2rem" },
  note: { background: "#fff", borderRadius: 4, padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.65rem", color: "var(--text-muted)", fontSize: "0.875rem", border: "1px solid var(--border-light)" },
};

const labelStyle = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" };
