import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../api";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useSilkReveal } from "../hooks/useSilkReveal";
import PageBanner from "../components/luxury/PageBanner";

function FilterPanel({ sort, setSort, categories, selectedCategory, setCategory, handloomOnly, setHandloomOnly, priceMin, setPriceMin, priceMax, setPriceMax, onClear }) {
  const fieldLabel = {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: "0.6rem",
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Sort */}
      <div>
        <span style={fieldLabel}>Sort By</span>
        <div style={{ position: "relative" }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem 2.2rem 0.65rem 0.85rem",
              border: "1.5px solid var(--border-light)",
              borderRadius: 10,
              fontSize: "0.875rem",
              color: "var(--text)",
              background: "#fff",
              appearance: "none",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Category */}
      <div>
        <span style={fieldLabel}>Category</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {[{ id: null, name: "All" }, ...categories].map((cat) => (
            <label
              key={cat.id ?? "all"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                cursor: "pointer",
                padding: "0.45rem 0.75rem",
                borderRadius: 8,
                background: selectedCategory === cat.id ? "var(--cream-deep)" : "transparent",
                transition: "background 0.18s",
              }}
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat.id}
                onChange={() => setCategory(cat.id)}
                style={{ accentColor: "var(--primary)", width: 14, height: 14, flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "0.87rem",
                  color: selectedCategory === cat.id ? "var(--primary)" : "var(--text)",
                  fontWeight: selectedCategory === cat.id ? 700 : 400,
                }}
              >
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <span style={fieldLabel}>Price Range (₹)</span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            style={{
              width: "50%",
              padding: "0.55rem 0.7rem",
              border: "1.5px solid var(--border-light)",
              borderRadius: 10,
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", flexShrink: 0 }}>–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            style={{
              width: "50%",
              padding: "0.55rem 0.7rem",
              border: "1.5px solid var(--border-light)",
              borderRadius: 10,
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Handloom toggle */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          cursor: "pointer",
          padding: "0.55rem 0.75rem",
          borderRadius: 10,
          border: "1.5px solid",
          borderColor: handloomOnly ? "var(--gold)" : "var(--border-light)",
          background: handloomOnly ? "rgba(184,137,42,0.06)" : "#fff",
          transition: "all 0.18s",
        }}
      >
        <input
          type="checkbox"
          checked={handloomOnly}
          onChange={(e) => setHandloomOnly(e.target.checked)}
          style={{ accentColor: "var(--gold)", width: 15, height: 15 }}
        />
        <span style={{ fontSize: "0.87rem", color: "var(--text)", fontWeight: handloomOnly ? 700 : 400 }}>
          Handloom Only
        </span>
      </label>

      {/* Clear */}
      <button
        onClick={onClear}
        style={{
          background: "none",
          border: "1.5px solid var(--border-light)",
          borderRadius: 10,
          padding: "0.55rem",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          cursor: "pointer",
          transition: "border-color 0.18s, color 0.18s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        Clear All Filters
      </button>
    </div>
  );
}

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
  const gridRef = useSilkReveal(true);

  const selectedCategory = searchParams.get("category")
    ? parseInt(searchParams.get("category"))
    : null;

  useEffect(() => {
    document.title = "Shop | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  useEffect(() => { getCategories().then((r) => setCategories(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    getProducts().then((r) => setProducts(r.data)).finally(() => setLoading(false));
  }, []);

  const setCategory = (id) => {
    if (id) setSearchParams({ category: id });
    else setSearchParams({});
  };

  const handleClear = () => {
    setCategory(null);
    setSort("newest");
    setHandloomOnly(false);
    setPriceMin("");
    setPriceMax("");
    setSearch("");
  };

  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        (p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))) &&
        (!selectedCategory || p.category_id === selectedCategory) &&
        (!handloomOnly || p.is_handloom) &&
        (priceMin === "" || p.price >= parseFloat(priceMin)) &&
        (priceMax === "" || p.price <= parseFloat(priceMax))
      );
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div style={{ background: "#FAFAF7", minHeight: "80vh" }}>
      <PageBanner eyebrow="Browse our full range" title="Shop" subtitle="Discover handpicked sarees for every occasion and season." />

      <div className="container" style={{ paddingTop: "3.5rem", paddingBottom: "6rem" }}>
        {/* Search + mobile filter toggle */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2.5rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={17}
              style={{ position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            />
            <input
              type="text"
              placeholder="Search sarees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: "2.85rem",
                width: "100%",
                boxSizing: "border-box",
                padding: "0.8rem 1rem 0.8rem 2.85rem",
                border: "1.5px solid var(--border-light)",
                borderRadius: "9999px",
                fontSize: "0.9rem",
                background: "#fff",
                outline: "none",
                color: "var(--text)",
              }}
            />
          </div>
          <button
            className="shop-filter-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.8rem 1.35rem",
              borderRadius: "9999px",
              border: "1.5px solid var(--border-light)",
              background: "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {/* Mobile filter drawer */}
        {drawerOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
            <div
              style={{ flex: 1, background: "rgba(13,6,17,0.55)", backdropFilter: "blur(4px)" }}
              onClick={() => setDrawerOpen(false)}
            />
            <div
              style={{
                width: 300,
                background: "#fff",
                padding: "1.75rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                boxShadow: "-16px 0 60px rgba(0,0,0,0.22)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.05rem", color: "var(--text)" }}>
                  Filters
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>
              <FilterPanel
                sort={sort} setSort={setSort}
                categories={categories} selectedCategory={selectedCategory} setCategory={setCategory}
                handloomOnly={handloomOnly} setHandloomOnly={setHandloomOnly}
                priceMin={priceMin} setPriceMin={setPriceMin}
                priceMax={priceMax} setPriceMax={setPriceMax}
                onClear={handleClear}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start" }}>
          {/* Sidebar */}
          <aside
            className="shop-sidebar"
            style={{
              width: 240,
              flexShrink: 0,
              background: "#fff",
              borderRadius: 16,
              padding: "1.75rem",
              border: "1px solid var(--border-light)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              position: "sticky",
              top: 88,
            }}
          >
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)", marginBottom: "1.5rem" }}>
              Refine
            </p>
            <FilterPanel
              sort={sort} setSort={setSort}
              categories={categories} selectedCategory={selectedCategory} setCategory={setCategory}
              handloomOnly={handloomOnly} setHandloomOnly={setHandloomOnly}
              priceMin={priceMin} setPriceMin={setPriceMin}
              priceMax={priceMax} setPriceMax={setPriceMax}
              onClear={handleClear}
            />
          </aside>

          {/* Product grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!loading && (
              <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem", fontSize: "0.85rem", letterSpacing: "0.04em" }}>
                <span style={{ color: "var(--gold)", fontWeight: 700 }}>{filtered.length}</span>{" "}
                product{filtered.length !== 1 ? "s" : ""} found
              </p>
            )}
            {loading ? (
              <div className="catalog-grid">
                {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filtered.length > 0 ? (
              <div ref={gridRef} className="catalog-grid">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "6rem 0" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.3rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                  No products match your filters.
                </p>
                <button
                  onClick={handleClear}
                  style={{ padding: "0.8rem 2rem", borderRadius: "9999px", background: "var(--gold)", color: "#0D0611", fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer" }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .shop-sidebar { display: none !important; } }
        @media (min-width: 769px) { .shop-filter-btn { display: none !important; } }
      `}</style>
    </div>
  );
}
