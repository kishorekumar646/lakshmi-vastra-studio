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
    <div style={{ padding: "2rem 0 5rem" }}>
      <div className="container">
        <div style={styles.header}>
          <h1 style={styles.title}>Our Collection</h1>
          <p style={styles.subtitle}>Discover beautiful sarees and ethnic wear for every occasion</p>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.searchWrap}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.catFilters}>
            <button
              onClick={() => setCategory(null)}
              style={{ ...styles.catBtn, ...(selectedCategory === null ? styles.catBtnActive : {}) }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{ ...styles.catBtn, ...(selectedCategory === cat.id ? styles.catBtnActive : {}) }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading products...</div>
        ) : filtered.length > 0 ? (
          <>
            <p style={styles.count}>{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>
            <div style={styles.grid}>
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        ) : (
          <div style={styles.empty}>
            <p>No products found. Try a different category or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: { textAlign: "center", padding: "2rem 0 3rem" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", color: "#8B1A1A", marginBottom: "0.75rem" },
  subtitle: { color: "#6B5744", fontSize: "1.1rem" },
  filters: { marginBottom: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem" },
  searchWrap: { position: "relative" },
  searchIcon: { position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6B5744" },
  searchInput: { paddingLeft: "2.75rem", width: "100%", maxWidth: 400 },
  catFilters: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  catBtn: { padding: "0.5rem 1.25rem", border: "1px solid #ddd", borderRadius: 20, background: "#fff", cursor: "pointer", fontSize: "0.875rem", color: "#6B5744", transition: "all 0.2s" },
  catBtnActive: { background: "#8B1A1A", color: "#fff", borderColor: "#8B1A1A" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" },
  loading: { textAlign: "center", padding: "5rem 0", color: "#6B5744", fontSize: "1.1rem" },
  empty: { textAlign: "center", padding: "5rem 0", color: "#6B5744", fontSize: "1.1rem" },
  count: { color: "#6B5744", marginBottom: "1rem", fontSize: "0.9rem" },
};
