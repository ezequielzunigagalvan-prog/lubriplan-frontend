export default function SkeletonActivity() {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: "55%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 11, width: "35%", borderRadius: 5 }} />
        </div>
        <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 999, flexShrink: 0 }} />
      </div>
    </div>
  );
}

const card = {
  borderRadius: 14,
  padding: "12px 14px",
  marginBottom: 10,
  background: "var(--lp-surface, #fff)",
  border: "1px solid var(--lp-border, #e2e8f0)",
};
