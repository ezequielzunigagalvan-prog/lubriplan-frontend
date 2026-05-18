function StatCardSkeleton() {
  return (
    <div style={cardStyle}>
      <div className="skeleton" style={innerTop} />
      <div className="skeleton" style={innerLabel} />
    </div>
  );
}

const cardStyle = {
  height: 96,
  borderRadius: 16,
  background: "var(--lp-surface, #fff)",
  border: "1px solid var(--lp-border, #e2e8f0)",
  borderTop: "4px solid var(--lp-border, #e2e8f0)",
  padding: "20px 20px 16px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
};

const innerTop = {
  width: 56,
  height: 28,
  borderRadius: 8,
};

const innerLabel = {
  width: 80,
  height: 14,
  borderRadius: 6,
};

export default StatCardSkeleton;
