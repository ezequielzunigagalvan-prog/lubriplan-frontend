import { useMemo } from "react";

export default function StatCard({ value, label, color, onClick }) {
  const borderColor = `var(--${color})`;

  const cardStyle = useMemo(
    () => ({
      padding: 20,
      borderRadius: 14,
      background: "var(--card)",
      color: "var(--text)",
      textAlign: "center",
      minWidth: 120,
      boxShadow: "var(--shadow)",
      cursor: "pointer",
      transition: "all 0.25s ease",
      borderTop: `5px solid ${borderColor}`,
    }),
    [borderColor]
  );

  const hoverHandlers = {
    onMouseEnter: (e) => {
      e.currentTarget.style.transform = "translateY(-6px)";
      e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.4)";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "var(--shadow)";
    },
  };

  return (
    <div style={cardStyle} {...hoverHandlers} onClick={onClick}>
      <h3 style={{ fontSize: "2rem", margin: 0 }}>{value}</h3>
      <p style={{ opacity: 0.75, marginTop: 6 }}>{label}</p>
    </div>
  );
}