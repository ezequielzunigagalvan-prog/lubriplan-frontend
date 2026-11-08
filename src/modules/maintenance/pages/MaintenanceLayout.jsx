import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../../../components/ui/lpIcons";
import { useTheme } from "../../../context/ThemeContext";
import { useMaintenanceAccess } from "../hooks/useMaintenanceAccess";
import { MAINTENANCE_ACCENT } from "../constants/maintenance";

export default function MaintenanceLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { hasAccess } = useMaintenanceAccess();
  const isDark = theme === "dark";

  // Check access and redirect if disabled
  useEffect(() => {
    if (hasAccess === false) {
      navigate("/maintenance/access-denied", { replace: true });
    }
  }, [hasAccess, navigate]);

  const isActive = (path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navLinkStyle = (path) => ({
    ...navItem,
    color: isDark ? "#e2e8f0" : navItem.color,
    ...(isActive(path) ? navItemActive : null),
  });

  return (
    <div style={mainContainer}>
      <style>{`
        @media (max-width: 820px) {
          .mntHeaderNav {
            flex-direction: column;
            gap: 8px;
          }
        }

        [data-theme="dark"] .mntHeader {
          background: linear-gradient(180deg, #111827 0%, #0f1629 100%) !important;
          border-bottom-color: rgba(255,255,255,0.07) !important;
        }

        [data-theme="dark"] .mntNavLink:not([data-active="true"]):hover {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
      `}</style>

      <header className="mntHeader" style={header}>
        <div style={headerTop}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={backButton}
            title="Volver a LubriPlan"
          >
            <Icon name="chevronLeft" size="md" />
            <span>LubriPlan</span>
          </button>
        </div>

        <nav className="mntHeaderNav" style={headerNav}>
          <NavLink
            to="/maintenance/app"
            style={navLinkStyle("/maintenance/app")}
            className="mntNavLink"
          >
            <span style={navItemLabel}>
              <Icon name="gauge" size="sm" />
              Dashboard
            </span>
          </NavLink>

          <NavLink
            to="/maintenance/app/work-orders"
            style={navLinkStyle("/maintenance/app/work-orders")}
            className="mntNavLink"
          >
            <span style={navItemLabel}>
              <Icon name="clipboard" size="sm" />
              Órdenes
            </span>
          </NavLink>

          <NavLink
            to="/maintenance/app/assets"
            style={navLinkStyle("/maintenance/app/assets")}
            className="mntNavLink"
          >
            <span style={navItemLabel}>
              <Icon name="package" size="sm" />
              Activos
            </span>
          </NavLink>
        </nav>
      </header>

      <main style={mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

const mainContainer = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  background: "transparent",
};

const header = {
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  padding: "12px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  position: "sticky",
  top: 0,
  zIndex: 50,
};

const headerTop = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const backButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 13,
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  transition: "all 140ms ease",
};

const headerNav = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const navItem = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid transparent",
  background: "transparent",
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 13,
  textDecoration: "none",
  cursor: "pointer",
  transition: "all 140ms ease",
  whiteSpace: "nowrap",
};

const navItemActive = {
  background: `linear-gradient(180deg, rgba(56,189,248,0.20) 0%, rgba(56,189,248,0.15) 100%)`,
  border: `1px solid rgba(56,189,248,0.46)`,
  color: "#0c4a6e",
  boxShadow: `0 12px 24px rgba(56,189,248,0.12)`,
};

const navItemLabel = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const mainContent = {
  flex: 1,
  padding: 16,
  maxWidth: 1200,
  width: "100%",
  margin: "0 auto",
};
