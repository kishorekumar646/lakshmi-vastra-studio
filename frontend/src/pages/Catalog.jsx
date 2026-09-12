import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../api";
import ProductCard from "../components/ProductCard";
import { Search } from "lucide-react";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get("category") ? parseInt(searchParams.get("category")) : null;

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedCategory ? { category_id: selectedCategory } : {};
    getProducts(params)
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const setCategory = (id) => {
    if (id) setSearchParams({ category: id });
    else setSearchParams({});
  };

  return (
    <div style={{ padding: "0 0 5rem" }}>
      <div className="container">
        <div className="catalog-header">
          <span className="section-tag">Explore our range</span>
          <h1 className="section-title" style={{ marginBottom: "0.75rem" }}>Our Collection</h1>
          <div className="section-divider" style={{ marginBottom: "1.5rem" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            Discover beautiful sarees and ethnic wear for every occasion
          </p>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6B5744" }} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.75rem", maxWidth: 420 }}
            />
          </div>
          <div className="cat-filter-scroll">
            <button
              onClick={() => setCategory(null)}
              style={{
                padding: "0.5rem 1.25rem",
                border: "1.5px solid",
                borderColor: selectedCategory === null ? "#8B1A1A" : "#ddd",
                borderRadius: 20,
                background: selectedCategory === null ? "#8B1A1A" : "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: selectedCategory === null ? "#fff" : "#6B5744",
                fontWeight: selectedCategory === null ? 600 : 400,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: "0.5rem 1.25rem",
                  border: "1.5px solid",
                  borderColor: selectedCategory === cat.id ? "#8B1A1A" : "#ddd",
                  borderRadius: 20,
                  background: selectedCategory === cat.id ? "#8B1A1A" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: selectedCategory === cat.id ? "#fff" : "#6B5744",
                  fontWeight: selectedCategory === cat.id ? 600 : 400,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "#6B5744", fontSize: "1.1rem" }}>
            Loading products...
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p style={{ color: "#6B5744", marginBottom: "1rem", fontSize: "0.9rem" }}>
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="catalog-grid">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "#6B5744", fontSize: "1.1rem" }}>
            <p>No products found. Try a different category or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
