export default function Card({ children, style, hoverable = false, className = "" }) {
  return (
    <div
      className={hoverable ? `lp-card-hover ${className}` : className}
      style={{
        background: "var(--lp-surface, #fff)",
        borderRadius: "var(--radius-lg, 16px)",
        padding: 16,
        border: "1px solid var(--lp-border, #e2e8f0)",
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
