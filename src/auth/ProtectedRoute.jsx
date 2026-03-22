// src/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles = [], children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const role = String(user?.role || "").toUpperCase();
  const allowedRoles = Array.isArray(roles)
    ? roles.map((r) => String(r).toUpperCase())
    : [];

  // ✅ sesión inválida aunque exista flag auth
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search || ""}` }}
      />
    );
  }

  // ✅ si la ruta requiere roles específicos y no coincide
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}