import { useAuth } from "../../../context/AuthContext";
import { useLocation, Navigate } from "react-router-dom";
import { useMaintenanceAccess } from "./useMaintenanceAccess";

function ProtectedRouteLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function MaintenanceProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const { hasAccess, loading } = useMaintenanceAccess();
  const location = useLocation();

  if (loading) {
    return <ProtectedRouteLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/maintenance/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (hasAccess === false) {
    return <Navigate to="/maintenance/access-denied" replace />;
  }

  return children;
}
