// StarRating — two modes:
//   display: shows filled/half stars (non-interactive)
//   interactive: clickable stars for a form
export default function StarRating({ value = 0, onChange, size = 20, interactive = false }) {
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={interactive ? () => onChange(star) : undefined}
          style={{
            fontSize: size,
            color: star <= value ? "#D4A94A" : "#ddd",
            cursor: interactive ? "pointer" : "default",
            lineHeight: 1,
            transition: "color 0.15s",
            userSelect: "none",
          }}
          title={interactive ? `${star} star${star > 1 ? "s" : ""}` : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}
