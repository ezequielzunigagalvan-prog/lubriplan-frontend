function StatCardSkeleton() {
  return (
    <div style={cardStyle}>
      <div style={shine} />
    </div>
  );
}

const cardStyle = {
  height: 95,
  borderRadius: 14,
  background: "var(--card)",
  boxShadow: "var(--shadow)",
  position: "relative",
  overflow: "hidden",
};

const shine = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.08) 45%, transparent 60%)",
  animation: "shine 1.3s infinite",
};

export default StatCardSkeleton;