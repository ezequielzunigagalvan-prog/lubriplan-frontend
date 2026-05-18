export default function SkeletonRoute() {
  return (
    <div style={card}>
      <div className="skeleton" style={{ height: 16, width: "60%", borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 6, marginTop: 10 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <div className="skeleton" style={{ height: 24, width: 64, borderRadius: 999 }} />
        <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 999 }} />
      </div>
      <div className="skeleton" style={{ height: 12, width: "75%", borderRadius: 6, marginTop: 14 }} />
    </div>
  );
}

const card = {
  borderRadius: 16,
  padding: 20,
  background: "var(--lp-surface, #fff)",
  border: "1px solid var(--lp-border, #e2e8f0)",
  height: 130,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};
