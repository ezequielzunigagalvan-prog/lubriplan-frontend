import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const linkStyle = (path) => ({
    padding: "12px 16px",
    display: "block",
    textDecoration: "none",
    color: location.pathname === path ? "#fff" : "#ddd",
    background: location.pathname === path ? "#ff7a00" : "transparent",
    borderRadius: 6,
    marginBottom: 8,
  });

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#1e1e1e",
        padding: 20,
      }}
    >
      <h2 style={{ color: "#ff7a00", marginBottom: 30 }}>LubriPlan</h2>

      <nav>
        {/* Dashboard real es "/" */}
        <Link to="/dashboard" style={linkStyle("/")}>
          Dashboard
        </Link>

        {/* Si NO tienes esta página aún, quítala */}
        {/* <Link to="/activities" style={linkStyle("/activities")}>Actividades</Link> */}

        {/* Rutas correctas */}
        <Link to="/routes" style={linkStyle("/routes")}>
          Rutas
        </Link>

        {/* Equipos correcto */}
        <Link to="/equipments" style={linkStyle("/equipments")}>
          Equipos
        </Link>

        {/* Técnicos correcto */}
        <Link to="/technicians" style={linkStyle("/technicians")}>
          Técnicos
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
