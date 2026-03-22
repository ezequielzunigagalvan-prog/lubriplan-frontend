// src/pages/Unauthorized.jsx
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Acceso restringido</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
      <Link to="/dashboard">? Volver al dashboard</Link>
    </div>
  );
}
