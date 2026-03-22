import { Link } from "react-router-dom";

export default function EmptyState({
  title = "No hay actividades programadas",
  description = "Todo está al día. Excelente trabajo 🎉",
  actionLabel = "Ver calendario",
  actionTo = "/calendar",
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 40,
        textAlign: "center",
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        marginTop: 8,
      }}
    >
      {/* ICONO */}
      <div style={{ fontSize: 56, marginBottom: 16 }}>🛠️</div>

      {/* TEXTO */}
      <h3 style={{ margin: 0, marginBottom: 8 }}>{title}</h3>
      <p style={{ margin: 0, color: "#666" }}>{description}</p>

      {/* CTA */}
      <Link
        to={actionTo}
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: "10px 18px",
          background: "#ff7a00",
          color: "#fff",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 600,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#e66f00";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#ff7a00";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {actionLabel}
      </Link>
    </div>
  );
}