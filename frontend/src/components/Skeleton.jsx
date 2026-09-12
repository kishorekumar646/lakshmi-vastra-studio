// Shimmer skeleton components — shapes match the real ProductCard and ProductDetail layouts

export function ProductCardSkeleton() {
  return (
    <div className="product-card" style={{ overflow: "hidden", pointerEvents: "none" }}>
      <span className="skeleton skeleton-card-img" style={{ height: 260, borderRadius: 0 }} />
      <div style={{ padding: "1.2rem 1.25rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        <span className="skeleton" style={{ height: 10, width: "42%" }} />
        <span className="skeleton" style={{ height: 17, width: "92%" }} />
        <span className="skeleton" style={{ height: 17, width: "62%" }} />
        <span className="skeleton" style={{ height: 22, width: "38%", marginTop: "0.1rem" }} />
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.3rem" }}>
          <span className="skeleton" style={{ flex: 1, height: 34, borderRadius: 2 }} />
          <span className="skeleton" style={{ flex: 1, height: 34, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div style={{ padding: "2.5rem 0 5.5rem", background: "var(--cream)" }}>
      <div className="container">
        <span className="skeleton" style={{ height: 13, width: 148, marginBottom: "2rem" }} />

        <div className="product-detail-grid">
          {/* Left — image + thumbnails */}
          <div>
            <span className="skeleton" style={{ height: 460, borderRadius: 6 }} />
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="skeleton" style={{ width: 72, height: 72, borderRadius: 4 }} />
              ))}
            </div>
          </div>

          {/* Right — product info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "0.5rem" }}>
            <span className="skeleton" style={{ height: 11, width: "28%" }} />
            <span className="skeleton" style={{ height: 38, width: "88%" }} />
            <span className="skeleton" style={{ height: 38, width: "58%" }} />
            <span className="skeleton" style={{ height: 1, width: 40, opacity: 0.5 }} />
            <span className="skeleton" style={{ height: 32, width: "34%" }} />
            <span className="skeleton" style={{ height: 14, width: "100%" }} />
            <span className="skeleton" style={{ height: 14, width: "88%" }} />
            <span className="skeleton" style={{ height: 14, width: "72%" }} />
            <div style={{ display: "flex", gap: "0.875rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <span className="skeleton" style={{ height: 48, width: 196, borderRadius: 2 }} />
              <span className="skeleton" style={{ height: 48, width: 124, borderRadius: 2 }} />
            </div>
            <div style={{ background: "#fff", borderRadius: 4, padding: "1.25rem 1.5rem", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <span className="skeleton" style={{ height: 13, width: "68%" }} />
              <span className="skeleton" style={{ height: 13, width: "54%" }} />
              <span className="skeleton" style={{ height: 13, width: "62%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
