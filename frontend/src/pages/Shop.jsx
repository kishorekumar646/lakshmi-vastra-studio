import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../api";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [handloomOnly, setHandloomOnly] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get("category") ? parseInt(searchParams.get("category")) : null;

  useEffect(() => {
    document.title = "Shop | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts()
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  }, []);

  const setCategory = (id) => {
    if (id) setSearchParams({ category: id });
    else setSearchParams({});
  };

  const filtered = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = !selectedCategory || p.category_id === selectedCategory;
      const matchHandloom = !handloomOnly || p.is_handloom;
      const matchMin = priceMin === "" || p.price >= parseFloat(priceMin);
      const matchMax = priceMax === "" || p.price <= parseFloat(priceMax);
      return matchSearch && matchCategory && matchHandloom && matchMin && matchMax;
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const FilterPanel = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Sort */}
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sort By</p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ width: "100%", padding: "0.55rem 0.75rem", border: "1.5px solid var(--border-light)", borderRadius: 6, fontSize: "0.875rem", color: "var(--text)", background: "#fff" }}
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {[{ id: null, name: "All" }, ...categories].map((cat) => (
            <label key={cat.id ?? "all"} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--text)" }}>
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat.id}
                onChange={() => setCategory(cat.id)}
                style={{ accentColor: "var(--primary)", width: 15, height: 15 }}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Price Range (₹)</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            style={{ width: "50%", padding: "0.5rem", border: "1.5px solid var(--border-light)", borderRadius: 6, fontSize: "0.875rem" }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            style={{ width: "50%", padding: "0.5rem", border: "1.5px solid var(--border-light)", borderRadius: 6, fontSize: "0.875rem" }}
          />
        </div>
      </div>

      {/* Handloom */}
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--text)" }}>
        <input
          type="checkbox"
          checked={handloomOnly}
          onChange={(e) => setHandloomOnly(e.target.checked)}
          style={{ accentColor: "var(--primary)", width: 15, height: 15 }}
        />
        Handloom Only
      </label>

      {/* Clear */}
      <button
        onClick={() => { setCategory(null); setSort("newest"); setHandloomOnly(false); setPriceMin(""); setPriceMax(""); setSearch(""); }}
        style={{ background: "none", border: "1.5px solid var(--border-light)", borderRadius: 6, padding: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", cursor: "pointer" }}
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <div style={{ padding: "0 0 5rem", background: "var(--cream)", minHeight: "80vh" }}>
      <div className="container">
        <div className="catalog-header">
          <span className="section-tag">Browse our full range</span>
          <h1 className="section-title" style={{ marginBottom: "0.75rem" }}>Shop</h1>
          <div className="section-divider" style={{ marginBottom: "1.5rem" }} />
        </div>

        {/* Search + mobile filter toggle */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search sarees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.75rem", width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <button
            className="nav-menu-btn"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1rem", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600 }}
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {/* Mobile filter drawer */}
        {drawerOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
            <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={() => setDrawerOpen(false)} />
            <div style={{ width: 300, background: "#fff", padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>Filters</span>
                <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
          {/* Sidebar (desktop) */}
          <aside style={{ width: 240, flexShrink: 0, background: "#fff", borderRadius: 8, padding: "1.5rem", border: "1px solid var(--border-light)", position: "sticky", top: 80 }}
            className="shop-sidebar">
            <FilterPanel />
          </aside>

          {/* Products */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!loading && (
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem", fontSize: "0.9rem" }}>
                {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
              </p>
            )}
            {loading ? (
              <div className="catalog-grid">
                {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filtered.length > 0 ? (
              <div className="catalog-grid">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)", fontSize: "1.05rem" }}>
                No products found. Try adjusting your filters.
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .shop-sidebar { display: none !important; }
        }
        @media (min-width: 769px) {
          .nav-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
