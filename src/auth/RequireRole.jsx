import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RequireRole({ allow = [], children }) {
  const { role } = useAuth();
  const loc = useLocation();

  if (!allow.includes(role)) {
    // te manda al dashboard si no tiene permiso
    return <Navigate to="/dashboard" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
