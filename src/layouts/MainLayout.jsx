// src/layouts/MainLayout.jsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import useDashboardAlerts from "../hooks/useDashboardAlerts";
import { useAuth } from "../context/AuthContext";
import useNotifications from "../hooks/useNotifications";
import useRealtimeAlerts from "../hooks/useRealtimeAlerts";
import { Icon } from "../components/ui/lpIcons";
import PlantSwitcher from "../components/plants/PlantSwitcher";
import lubriPlanMark from "../assets/lubriplan-logo.png.png";
import { usePlant } from "../context/PlantContext";
import useInstallPrompt from "../hooks/useInstallPrompt";

const EXEC_DISPLAY_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EXEC_TEXT_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function MainLayout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentPlant, currentPlantId } = usePlant();

  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const displayName = String(user?.name || "?").trim();
  const roleText = roleLabel(role);
  const showRoleText = displayName.localeCompare(roleText, "es", { sensitivity: "base" }) !== 0;
  const canSeeAlerts = role === "ADMIN" || role === "SUPERVISOR";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 820 : false
  );

  const month = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const onLogout = () => {
    logout();
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);

      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const {
    items,
    unreadCount,
    loading: notifLoading,
    error: notifError,
    refresh: refreshNotif,
    refreshSoon: refreshNotifSoon,
    markRead,
    markAllRead,
  } = useNotifications({ enabled: true, limit: 10 });

  useRealtimeAlerts({ enabled: true });

  useEffect(() => {
    const onSSE = (e) => {
      const { eventName, payload } = e.detail || {};
      if (!eventName) return;

      const payloadPlantId = payload?.plantId != null ? String(payload.plantId) : "";
      const activePlantId = currentPlantId != null ? String(currentPlantId) : "";
      const samePlant = !payloadPlantId || !activePlantId || payloadPlantId === activePlantId;
      if (!samePlant) return;

      if (
        eventName === "notification.created" ||
        eventName === "execution.critical" ||
        eventName === "condition-report.created" ||
        eventName === "condition-report.corrective-scheduled" ||
        eventName === "condition-report.dismissed" ||
        eventName === "condition-report.resolved" ||
        eventName === "inventory.low-stock"
      ) {
        (refreshNotifSoon || refreshNotif)?.();
      }
    };

    window.addEventListener("lubriplan:sse", onSSE);
    return () => window.removeEventListener("lubriplan:sse", onSSE);
  }, [currentPlantId, refreshNotif, refreshNotifSoon]);

  const [openNotif, setOpenNotif] = useState(false);
  const [bellPulse, setBellPulse] = useState(false);
  const notifRef = useRef(null);
  const prevUnreadRef = useRef(Number(unreadCount || 0));

  useEffect(() => {
    const nextUnread = Number(unreadCount || 0);
    const prevUnread = Number(prevUnreadRef.current || 0);

    if (nextUnread > 0 && nextUnread > prevUnread) {
      setBellPulse(true);
      const timer = window.setTimeout(() => setBellPulse(false), 1800);
      prevUnreadRef.current = nextUnread;
      return () => window.clearTimeout(timer);
    }

    if (nextUnread === 0) setBellPulse(false);
    prevUnreadRef.current = nextUnread;
  }, [unreadCount]);

  useEffect(() => {
    const onDoc = (ev) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(ev.target)) setOpenNotif(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const { alerts: rawAlerts } = useDashboardAlerts({
    month,
    enabled: canSeeAlerts,
  });

  const alerts = canSeeAlerts ? rawAlerts || {} : {};

  const can = {
    dashboard: true,
    equipments: true,
    routes: true,
    activities: true,
    history: true,

    technicians: role === "ADMIN" || role === "SUPERVISOR",
    inventory: role === "ADMIN" || role === "SUPERVISOR",
    analysis: role === "ADMIN" || role === "SUPERVISOR",
    export: role === "ADMIN" || role === "SUPERVISOR",
    reports: role === "ADMIN" || role === "SUPERVISOR",

    users: role === "ADMIN",
    links: role === "ADMIN",

    settings: role === "ADMIN",
    notifications: true,
  };

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navLinkStyle = (path) => ({
    ...sideItem,
    ...(isActive(path) ? sideItemActive : null),
  });

  const navIconStyle = (path) => ({
    ...sideIcon,
    ...(isActive(path) ? sideIconActive : null),
  });

  return (
    <div className="lpExecRoot" style={app}>
      <style>{`
        .lpExecRoot {
          font-family: ${EXEC_TEXT_FONT};
          color: #0f172a;
        }

        .lpExecRoot button,
        .lpExecRoot input,
        .lpExecRoot select,
        .lpExecRoot textarea {
          font: inherit;
        }

        .lpExecRoot h1,
        .lpExecRoot h2,
        .lpExecRoot h3,
        .lpExecRoot h4,
        .lpExecRoot h5,
        .lpExecRoot h6,
        .lpExecRoot .lpExecDisplay {
          font-family: ${EXEC_DISPLAY_FONT};
          letter-spacing: -0.02em;
        }

        .lpSideLink {
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border 140ms ease;
        }

        .lpSideLink:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(2,6,23,0.08);
          background: rgba(248,250,252,0.92);
          border: 1px solid rgba(226,232,240,0.95);
        }

        .lpBellBtn {
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 160ms ease, color 160ms ease;
        }

        .lpBellBtn--alert {
          border-color: rgba(220, 38, 38, 0.55) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12), 0 12px 26px rgba(220, 38, 38, 0.12);
          color: #b91c1c;
        }

        .lpBellBtn--pulse {
          animation: lpBellPulse 1.2s ease-in-out 2;
        }

        .lpBellBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(2,6,23,0.08);
          background: rgba(248,250,252,0.92);
        }

        .lpTopPlantWrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: 14px;
          background: rgba(255,255,255,0.84);
          border: 1px solid rgba(226,232,240,0.95);
          box-shadow: 0 8px 18px rgba(2,6,23,0.04);
        }

        .lpTopPlantWrap:hover {
          box-shadow: 0 12px 24px rgba(2,6,23,0.06);
        }

        @keyframes lpPop {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes lpBellPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.22); }
          35% { transform: scale(1.06); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.12); }
          70% { transform: scale(0.98); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @media (max-width: 820px) {
          .lpTopPlantText {
            display: none !important;
          }
        }
      `}</style>

      {isMobile && mobileMenuOpen ? (
        <div
          style={mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className="lpSidebar"
        style={{
          ...sidebar,
          ...(isMobile ? sidebarMobile : sidebarDesktop),
          ...(isMobile && mobileMenuOpen ? sidebarMobileOpen : {}),
        }}
      >
        <div style={brand}>
          <img src={lubriPlanMark} alt="LubriPlan" style={brandLogoImg} />

          <div style={{ minWidth: 0 }}>
            <div style={brandTitle}>LubriPlan</div>
            <div style={brandSub}>Gestión de lubricación</div>
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileCloseBtn}
              title="Cerrar menú"
            >
              <Icon name="close" />
            </button>
          ) : null}
        </div>

        <div style={who}>
          <div style={{ minWidth: 0 }}>
            <div style={whoName}>{displayName}</div>
            {showRoleText ? <div style={whoRole}>{roleText}</div> : null}
          </div>

          <span
            style={{
              ...roleChip,
              background:
                role === "ADMIN"
                  ? "#fee2e2"
                  : role === "SUPERVISOR"
                  ? "#dbeafe"
                  : "#dcfce7",
              color:
                role === "ADMIN"
                  ? "#991b1b"
                  : role === "SUPERVISOR"
                  ? "#1d4ed8"
                  : "#166534",
              border:
                role === "ADMIN"
                  ? "1px solid #fecaca"
                  : role === "SUPERVISOR"
                  ? "1px solid #bfdbfe"
                  : "1px solid #bbf7d0",
            }}
            title={`Rol: ${role}`}
          >
            {role}
          </span>
        </div>

            <div style={sideSection}>MENÚ</div>

        <nav style={sideNav}>
          {can.dashboard && (
            <NavLink className="lpSideLink" to="/dashboard" style={navLinkStyle("/dashboard")}>
              <span style={sideRow}>
                <span style={navIconStyle("/dashboard")}>
                  <Icon name="tool" />
                </span>
                <span style={sideText}>Panel</span>
              </span>
            </NavLink>
          )}

          {can.routes && (
            <NavLink className="lpSideLink" to="/routes" style={navLinkStyle("/routes")}>
              <span style={sideRow}>
                <span style={navIconStyle("/routes")}>
                  <Icon name="route" />
                </span>
                <span style={sideText}>Rutas</span>
              </span>
            </NavLink>
          )}

          {can.equipments && (
            <NavLink className="lpSideLink" to="/equipments" style={navLinkStyle("/equipments")}>
              <span style={sideRow}>
                <span style={navIconStyle("/equipments")}>
                  <Icon name="equipment" />
                </span>
                <span style={sideText}>Equipos</span>
                {canSeeAlerts && Number(alerts.badConditionCount || 0) > 0 ? (
                  <span style={badgeRed}>{alerts.badConditionCount}</span>
                ) : null}
              </span>
            </NavLink>
          )}

          {can.inventory && (
            <NavLink className="lpSideLink" to="/inventory" style={navLinkStyle("/inventory")}>
              <span style={sideRow}>
                <span style={navIconStyle("/inventory")}>
                  <Icon name="drop" />
                </span>
                <span style={sideText}>Inventario</span>
                {canSeeAlerts && Number(alerts.lowStockCount || 0) > 0 ? (
                  <span style={badgeAmber}>{alerts.lowStockCount}</span>
                ) : null}
              </span>
            </NavLink>
          )}

          {can.technicians && (
            <NavLink className="lpSideLink" to="/technicians" style={navLinkStyle("/technicians")}>
              <span style={sideRow}>
                <span style={navIconStyle("/technicians")}>
                  <Icon name="user" />
                </span>
                <span style={sideText}>Técnicos</span>
              </span>
            </NavLink>
          )}

          {can.activities && (
            <NavLink className="lpSideLink" to="/activities" style={navLinkStyle("/activities")}>
              <span style={sideRow}>
                <span style={navIconStyle("/activities")}>
                  <Icon name="calendar" />
                </span>
                <span style={sideText}>Actividades</span>
                {canSeeAlerts && Number(alerts.overdueActivities || 0) > 0 ? (
                  <span style={badgeRed}>{alerts.overdueActivities}</span>
                ) : null}
              </span>
            </NavLink>
          )}

          {can.history && (
            <NavLink className="lpSideLink" to="/history" style={navLinkStyle("/history")}>
              <span style={sideRow}>
                <span style={navIconStyle("/history")}>
                  <Icon name="history" />
                </span>
                <span style={sideText}>Historial</span>
              </span>
            </NavLink>
          )}

          {can.notifications && (
            <NavLink className="lpSideLink" to="/notifications" style={navLinkStyle("/notifications")}>
              <span style={sideRow}>
                <span style={navIconStyle("/notifications")}>
                  <Icon name="bell" />
                </span>
                <span style={sideText}>Notificaciones</span>
                {unreadCount > 0 ? (
                  <span style={badgeRed}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </span>
            </NavLink>
          )}

          {can.analysis && (
            <NavLink className="lpSideLink" to="/analysis" style={navLinkStyle("/analysis")}>
              <span style={sideRow}>
                <span style={navIconStyle("/analysis")}>
                  <Icon name="settings" />
                </span>
                <span style={sideText}>Análisis</span>
              </span>
            </NavLink>
          )}

          {can.reports && (
            <NavLink className="lpSideLink" to="/reports/monthly" style={navLinkStyle("/reports/monthly")}>
              <span style={sideRow}>
                <span style={navIconStyle("/reports/monthly")}>
                  <Icon name="calendar" />
                </span>
                <span style={sideText}>Reporte mensual</span>
              </span>
            </NavLink>
          )}

          {can.export && (
            <NavLink className="lpSideLink" to="/export" style={navLinkStyle("/export")}>
              <span style={sideRow}>
                <span style={navIconStyle("/export")}>
                  <Icon name="settings" />
                </span>
                <span style={sideText}>Exportar/Importar</span>
              </span>
            </NavLink>
          )}

          {can.users && (
            <NavLink className="lpSideLink" to="/users" style={navLinkStyle("/users")}>
              <span style={sideRow}>
                <span style={navIconStyle("/users")}>
                  <Icon name="user" />
                </span>
                <span style={sideText}>Usuarios</span>
              </span>
            </NavLink>
          )}

          {can.settings && (
            <NavLink className="lpSideLink" to="/settings" style={navLinkStyle("/settings")}>
              <span style={sideRow}>
                <span style={navIconStyle("/settings")}>
                  <Icon name="settings" />
                </span>
                <span style={sideText}>Ajustes</span>
              </span>
            </NavLink>
          )}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={sideFooter}>
          <button onClick={onLogout} style={logoutBtn} title="Cerrar sesión" type="button">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div style={{ ...main, ...(isMobile ? mainMobile : {}) }}>
        <header style={{ ...topbar, ...(isMobile ? topbarMobile : {}) }}>
          <div style={topbarAccent} />

          <div style={topbarLeft}>
            {isMobile ? (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                style={menuBtn}
                title="Abrir menú"
              >
                <Icon name="menu" />
              </button>
            ) : null}

            <div style={pageTitle}>{pageTitleFromPath(pathname)}</div>

            {currentPlant?.name ? (
              <div className="lpTopPlantText" style={topbarPlantName}>
                {currentPlant.name}
              </div>
            ) : null}
          </div>

          <div style={topbarRight}>
            {isInstalled ? (
              <span
                style={{
                  ...installChip,
                  background: "rgba(34,197,94,0.14)",
                  border: "1px solid rgba(34,197,94,0.28)",
                  color: "#166534",
                }}
                title="LubriPlan ya está instalado en este dispositivo"
              >
                <Icon name="checkCircle" size="sm" />
                {!isMobile ? <span>App instalada</span> : null}
              </span>
            ) : null}

            {!isOnline ? (
              <span
                style={{
                  ...installChip,
                  background: "rgba(245,158,11,0.14)",
                  border: "1px solid rgba(245,158,11,0.28)",
                  color: "#92400e",
                }}
                title="Sin conexión"
              >
                <Icon name="warn" size="sm" />
                {!isMobile ? <span>Sin conexión</span> : null}
              </span>
            ) : null}

            {canInstall ? (
              <button
                type="button"
                onClick={promptInstall}
                style={{ ...btnGhost, padding: isMobile ? "8px 10px" : "8px 12px" }}
                title="Instalar LubriPlan"
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="download" size="sm" />
                  {!isMobile ? <span>Instalar</span> : null}
                </span>
              </button>
            ) : null}

            <div className="lpTopPlantWrap">
              <div style={plantDot} />
              <PlantSwitcher compact />
            </div>

            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                className={`lpBellBtn${unreadCount > 0 ? " lpBellBtn--alert" : ""}${bellPulse ? " lpBellBtn--pulse" : ""}`}
                type="button"
                onClick={() => setOpenNotif((v) => !v)}
                style={{
                  ...btnGhost,
                  padding: "8px 10px",
                  position: "relative",
                  border: unreadCount > 0 ? "1px solid rgba(220,38,38,0.35)" : btnGhost.border,
                  color: unreadCount > 0 ? "#b91c1c" : btnGhost.color,
                }}
                title="Notificaciones"
              >
                <Icon name="bell" size="md" />
                {unreadCount > 0 ? (
                  <span style={bellBadge} title={`${unreadCount} sin leer`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {openNotif ? (
                <div style={notifDrop}>
                  <div style={notifTop}>
                    <div>
                      <div style={{ fontWeight: 1000, color: "#0f172a" }}>Notificaciones</div>
                      <div style={{ marginTop: 2, fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
                    {notifLoading ? "Actualizando" : unreadCount ? `${unreadCount} sin leer` : "Todo al día"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => (refreshNotifSoon || refreshNotif)?.()}
                        style={notifMiniBtn}
                        disabled={notifLoading}
                        title="Actualizar"
                        type="button"
                      >
                    {notifLoading ? "…" : "↻"}
                      </button>

                      <button
                        onClick={async () => {
                          await markAllRead();
                          (refreshNotifSoon || refreshNotif)?.();
                        }}
                        style={notifMiniBtn}
                        disabled={!unreadCount}
                        type="button"
                      title="Marcar todas como leídas"
                      >
                        Marcar
                      </button>
                    </div>
                  </div>

                  {notifError ? <div style={notifErr}>{notifError}</div> : null}

                  {items.length === 0 ? (
                    <div style={notifEmpty}>Sin notificaciones</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8, maxHeight: 360, overflow: "auto", paddingRight: 2 }}>
                      {items.slice(0, 12).map((n) => (
                        <button
                          key={n.id}
                          style={{
                            ...notifItem,
                            opacity: n.readAt ? 0.65 : 1,
                            border: n.readAt
                              ? "1px solid rgba(226,232,240,0.70)"
                              : "1px solid rgba(249,115,22,0.40)",
                          }}
                          onClick={async () => {
                            setOpenNotif(false);
                            if (!n.readAt) await markRead(n.id);
                            if (n.link) navigate(n.link);
                          }}
                          title={n?.message || ""}
                          type="button"
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>{n.title || "Notificación"}</div>
                            {!n.readAt ? <span style={dotLive} /> : null}
                          </div>

                          {n.message ? <div style={notifMsg}>{n.message}</div> : null}

                          <div style={notifMeta}>
                            {n.createdAt ? new Date(n.createdAt).toLocaleString("es-MX") : ""}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={notifFoot}>
                    <button
                      onClick={() => {
                        setOpenNotif(false);
                        navigate("/notifications");
                      }}
                      style={seeAll}
                      type="button"
                    >
                      Ver todas ?
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {!isMobile ? (
              <span style={userName} title={user?.email || ""}>
                {user?.name || "?"}
              </span>
            ) : null}
          </div>
        </header>

        <main style={{ ...content, ...(isMobile ? contentMobile : {}) }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function roleLabel(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN") return "Administrador";
  if (r === "SUPERVISOR") return "Supervisor";
  if (r === "TECHNICIAN") return "Técnico";
  return "Usuario";
}

function pageTitleFromPath(pathname) {
  if (pathname === "/") return "Panel";
  if (pathname.startsWith("/routes")) return "Rutas";
  if (pathname.startsWith("/equipments")) return "Equipos";
  if (pathname.startsWith("/inventory")) return "Inventario";
  if (pathname.startsWith("/technicians")) return "Técnicos";
  if (pathname.startsWith("/activities")) return "Actividades";
  if (pathname.startsWith("/history")) return "Historial";
  if (pathname.startsWith("/analysis")) return "Análisis";
  if (pathname.startsWith("/export")) return "Exportar/Importar";
  if (pathname.startsWith("/reports/monthly")) return "Reporte mensual";
  if (pathname.startsWith("/users")) return "Usuarios";
  if (pathname.startsWith("/admin/links")) return "Vínculos";
  if (pathname.startsWith("/settings")) return "Ajustes";
  if (pathname.startsWith("/notifications")) return "Notificaciones";
  return "LubriPlan";
}

const app = {
  minHeight: "100vh",
  display: "flex",
  background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
  overflowX: "hidden",
  fontFamily: EXEC_TEXT_FONT,
};

const sidebar = {
  paddingTop: 14,
  paddingRight: 14,
  paddingBottom: 14,
  paddingLeft: 14,
  borderRight: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.94) 100%)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  overflowX: "hidden",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  zIndex: 200,
};

const sidebarDesktop = {
  width: 260,
  position: "sticky",
  top: 0,
  height: "100vh",
  flexShrink: 0,
};

const sidebarMobile = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: 280,
  maxWidth: "85vw",
  height: "100dvh",
  maxHeight: "100dvh",
  paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
  overscrollBehavior: "contain",
  transform: "translateX(-100%)",
  transition: "transform 0.28s ease",
  boxShadow: "0 20px 50px rgba(2,6,23,0.25)",
  zIndex: 300,
};

const sidebarMobileOpen = {
  transform: "translateX(0)",
};

const mobileOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.48)",
  zIndex: 250,
};

const brand = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const brandLogo = {
  width: 38,
  height: 38,
  borderRadius: 12,
};

const brandLogoImg = {
  width: 56,
  height: 56,
  display: "block",
  objectFit: "contain",
};

const brandTitle = {
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1.05,
  letterSpacing: "-0.03em",
  fontSize: 18,
};

const brandSub = {
  marginTop: 2,
  fontSize: 11,
  fontWeight: 850,
  color: "#64748b",
};

const mobileCloseBtn = {
  marginLeft: "auto",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  width: 34,
  height: 34,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const who = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.80)",
  boxShadow: "0 12px 28px rgba(2,6,23,0.05)",
};

const whoName = {
  fontWeight: 700,
  color: "#0f172a",
  maxWidth: 150,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: EXEC_DISPLAY_FONT,
  letterSpacing: "-0.02em",
};

const whoRole = {
  marginTop: 2,
  fontSize: 11,
  fontWeight: 900,
  color: "#64748b",
  letterSpacing: ".04em",
  textTransform: "uppercase",
};

const roleChip = {
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 950,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const sideSection = {
  marginTop: 4,
  padding: "0 8px",
  fontSize: 11,
  fontWeight: 950,
  color: "#94a3b8",
  letterSpacing: 0.6,
};

const sideNav = {
  display: "grid",
  gap: 10,
};

const sideItem = {
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 950,
  borderRadius: 14,
  padding: "10px 10px",
  border: "1px solid transparent",
  background: "transparent",
};

const sideItemActive = {
  background: "linear-gradient(180deg, rgba(249,115,22,0.20) 0%, rgba(251,146,60,0.15) 100%)",
  border: "1px solid rgba(249,115,22,0.46)",
  boxShadow: "0 12px 24px rgba(249,115,22,0.12)",
};

const sideRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const sideIcon = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.04)",
  flex: "0 0 auto",
};

const sideIconActive = {
  background: "rgba(249,115,22,0.95)",
  border: "1px solid rgba(249,115,22,0.65)",
  color: "#0b1220",
  boxShadow: "0 12px 24px rgba(249,115,22,0.20)",
};

const sideText = { flex: 1, minWidth: 0 };

const badgeBase = {
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  lineHeight: "18px",
  border: "1px solid rgba(0,0,0,0.06)",
  whiteSpace: "nowrap",
};

const badgeRed = {
  ...badgeBase,
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
};

const badgeAmber = {
  ...badgeBase,
  background: "#fef3c7",
  color: "#92400e",
  border: "1px solid #fde68a",
};

const sideFooter = {
  paddingTop: 10,
  borderTop: "1px solid rgba(226,232,240,0.75)",
};

const logoutBtn = {
  width: "100%",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 14,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const main = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
};

const mainMobile = {
  width: "100%",
};

const topbar = {
  height: 68,
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 18px",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const topbarMobile = {
  height: 60,
  padding: "0 12px",
};

const topbarAccent = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 5,
  background: "linear-gradient(90deg, rgba(249,115,22,0.96) 0%, rgba(251,146,60,0.66) 58%, rgba(255,255,255,0) 100%)",
};

const topbarLeft = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const topbarRight = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "nowrap",
  minWidth: 0,
};

const menuBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.88)",
  borderRadius: 12,
  width: 40,
  height: 40,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  display: "grid",
  placeItems: "center",
};

const pageTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#0f172a",
  whiteSpace: "nowrap",
  fontFamily: EXEC_DISPLAY_FONT,
  letterSpacing: "-0.02em",
};

const installChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const topbarPlantName = {
  fontSize: 12,
  fontWeight: 900,
  color: "#64748b",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(248,250,252,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  maxWidth: 260,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const plantDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "rgba(249,115,22,0.95)",
  boxShadow: "0 0 0 4px rgba(249,115,22,0.12)",
  flex: "0 0 auto",
};

const content = {
  padding: 16,
  maxWidth: 1200,
  width: "100%",
  margin: "0 auto",
};

const contentMobile = {
  padding: 12,
  maxWidth: "100%",
};

const userName = {
  fontSize: 12,
  fontWeight: 950,
  color: "#475569",
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const btnGhost = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 12,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const bellBadge = {
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 18,
  height: 18,
  padding: "0 6px",
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  fontSize: 11,
  fontWeight: 950,
  boxShadow: "0 10px 22px rgba(2,6,23,0.10)",
  animation: "lpPop 140ms ease-out",
};

const dotLive = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "rgba(249,115,22,0.95)",
  border: "1px solid rgba(251,146,60,0.85)",
  boxShadow: "0 10px 22px rgba(249,115,22,0.18)",
  flex: "0 0 auto",
};

const notifDrop = {
  position: "absolute",
  right: 0,
  top: 44,
  width: 390,
  maxWidth: "85vw",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  boxShadow: "0 18px 40px rgba(2,6,23,0.12)",
  padding: 10,
  zIndex: 999,
  overflow: "hidden",
};

const notifTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  paddingBottom: 8,
  marginBottom: 8,
  borderBottom: "1px solid rgba(226,232,240,0.65)",
};

const notifMiniBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.90)",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 900,
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const notifItem = {
  textAlign: "left",
  border: "1px solid rgba(226,232,240,0.70)",
  background: "rgba(248,250,252,0.85)",
  borderRadius: 12,
  padding: 10,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(2,6,23,0.03)",
};

const notifMsg = { marginTop: 4, fontSize: 12, fontWeight: 800, color: "#475569" };
const notifMeta = { marginTop: 6, fontSize: 11, fontWeight: 800, color: "#94a3b8" };
const notifEmpty = { padding: 12, color: "#64748b", fontWeight: 850 };

const notifErr = {
  marginBottom: 8,
  background: "#fff1f2",
  border: "1px solid #fecaca",
  padding: 10,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 900,
  fontSize: 12,
};

const notifFoot = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: "1px solid rgba(226,232,240,0.65)",
};

const seeAll = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};









