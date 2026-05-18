export default function MetricCard({ title, value, color = "#f97316" }) {
  return (
    <div style={card}>
      <div style={{ ...valueStyle, color }}>{value}</div>
      <div style={labelStyle}>{title}</div>
    </div>
  );
}

const card = {
  background: "var(--lp-surface, #fff)",
  borderRadius: 16,
  padding: "20px 24px",
  border: "1px solid var(--lp-border, #e2e8f0)",
  boxShadow: "0 2px 8px rgba(2,6,23,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const valueStyle = {
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: "-0.04em",
  lineHeight: 1,
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--lp-text-muted, #64748b)",
};
