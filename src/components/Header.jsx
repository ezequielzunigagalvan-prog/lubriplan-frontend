import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();

  const linkStyle = (path) => ({
    textDecoration: "none",
    fontWeight: location.pathname === path ? "bold" : "normal",
    color: location.pathname === path ? "#ff7a00" : "#333",
  });

  return (
    <header
      style={{
        display: "flex",
        gap: 20,
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #ddd",
        marginBottom: 20,
      }}
    >
      <h2 style={{ margin: 0, marginRight: 30 }}>LubriPlan</h2>

      <Link to="/dashboard" style={linkStyle("/")}>Dashboard</Link>
      <Link to="/routes" style={linkStyle("/routes")}>Rutas</Link>
      <Link to="/calendar" style={linkStyle("/calendar")}>Calendario</Link>
    </header>
  );
}
