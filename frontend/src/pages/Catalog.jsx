import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../api";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { Search } from "lucide-react";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [handloomOnly, setHandloomOnly] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get("category") ? parseInt(searchParams.get("category")) : null;

  useEffect(() => {
    document.title = "Collection | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

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

  const filtered = products
    .filter((p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))) &&
      (!handloomOnly || p.is_handloom)
    )
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return new Date(b.created_at) - new Date(a.created_at);
    });

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
          {/* Search + Sort row */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
              <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6B5744" }} />
              <input
                type="text"
                placeholder="Search sarees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.75rem", width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: "0.6rem 1rem", border: "1.5px solid #ddd", borderRadius: 8,
                fontSize: "0.875rem", color: "#6B5744", background: "#fff", cursor: "pointer",
              }}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer",
                            fontSize: "0.875rem", color: "#6B5744", fontWeight: 500, whiteSpace: "nowrap" }}>
              <input
                type="checkbox"
                checked={handloomOnly}
                onChange={(e) => setHandloomOnly(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#8B1A1A", cursor: "pointer" }}
              />
              Handloom Only
            </label>
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
          <div className="catalog-grid">
            {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
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
