import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../api";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { Search } from "lucide-react";
import PageBanner from "../components/luxury/PageBanner";

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
    getProducts()
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
    const onVisible = () => { if (!document.hidden) getProducts().then((r) => setProducts(r.data)).catch(() => {}); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const filtered = products
    .filter((p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))) &&
      (!selectedCategory || p.category_id === selectedCategory) &&
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

  const chipBase = {
    padding: "0.45rem 1.1rem",
    borderRadius: 9999,
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "1.5px solid",
    transition: "all 0.18s",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ paddingBottom: "5rem" }}>
      <PageBanner
        eyebrow="Lakshmi Vastra Studio"
        title="The Collection"
        subtitle="Handcrafted sarees & ethnic wear for every occasion"
      />

      <div className="container" style={{ paddingTop: "2.5rem" }}>
        {/* Search + Sort + Handloom row */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
            <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search sarees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.6rem", width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              border: "1.5px solid var(--border-light)",
              borderRadius: 10,
              fontSize: "0.875rem",
              color: "var(--text)",
              background: "rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              checked={handloomOnly}
              onChange={(e) => setHandloomOnly(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }}
            />
            Handloom Only
          </label>
        </div>

        {/* Category chips */}
        <div className="cat-filter-scroll" style={{ marginBottom: "2.5rem" }}>
          {[{ id: null, name: "All" }, ...categories].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id ?? "all"}
                onClick={() => setCategory(cat.id)}
                style={{
                  ...chipBase,
                  borderColor: active ? "var(--primary)" : "var(--border-light)",
                  background: active ? "var(--primary)" : "transparent",
                  color: active ? "#fff" : "var(--text-muted)",
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="catalog-grid">
            {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem", fontSize: "0.88rem" }}>
              {filtered.length} piece{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="catalog-grid">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)", fontSize: "1.05rem" }}>
            <p>No products match your search. Try a different category or term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
