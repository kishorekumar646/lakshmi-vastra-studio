import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { useEffect } from "react";

export default function Wishlist() {
  const { customer, loading: authLoading } = useAuth();
  const { fullItems, wishlistCount } = useWishlist();

  useEffect(() => {
    document.title = "Wishlist | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  if (authLoading) {
    return (
      <div style={{ padding: "4rem 0 6rem", background: "var(--cream)", minHeight: "70vh" }}>
        <div className="container">
          <div className="product-grid">
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: "6rem 0", background: "var(--cream)", minHeight: "70vh", textAlign: "center" }}>
        <div className="container">
          <Heart size={48} color="var(--primary)" style={{ marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", color: "var(--text)", marginBottom: "0.75rem" }}>
            Your Wishlist
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem" }}>
            Please log in to view and save your wishlist.
          </p>
          <Link to="/account" className="btn-primary">Login / Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2.5rem 0 6rem", background: "var(--cream)", minHeight: "70vh" }}>
      <div className="container">
        <span className="section-tag">Your saved items</span>
        <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>Wishlist</h1>
        <div className="section-divider" style={{ marginBottom: "2rem" }} />

        {fullItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <Heart size={48} color="var(--border-light)" style={{ marginBottom: "1rem" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginBottom: "1.5rem" }}>
              Your wishlist is empty.
            </p>
            <Link to="/shop" className="btn-primary">Browse Shop</Link>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
              {wishlistCount} saved item{wishlistCount !== 1 ? "s" : ""}
            </p>
            <div className="product-grid">
              {fullItems.map((item) => (
                <ProductCard
                  key={item.product_id}
                  product={{
                    id: item.product_id,
                    name: item.name,
                    price: item.price,
                    image_url: item.image_url,
                    category_name: item.category_name,
                    is_featured: item.is_featured,
                    created_at: item.created_at,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
