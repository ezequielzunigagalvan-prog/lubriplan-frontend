export default function MetricCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 32, color }}>{value}</h2>
      <p style={{ margin: 0, color: "#666", fontWeight: 500 }}>{title}</p>
    </div>
  );
}