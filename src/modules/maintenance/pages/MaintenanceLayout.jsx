import { useEffect, Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MtIcon } from '../ui';
import {
  LayoutDashboard, ClipboardList, AlertOctagon, CalendarCheck, CalendarRange, CalendarClock, Factory, Users, History,
  Boxes, BarChart3, Bell,
} from 'lucide-react';
import { useMaintenanceAccess } from '../hooks/useMaintenanceAccess';
import { useAuth } from '../../../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import '../styles.css';

export default function MaintenanceLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hasAccess } = useMaintenanceAccess();
  const { logout } = useAuth();

  // "Salir" cierra la sesión (antes solo navegaba a LubriPlan sin cerrarla)
  const handleLogout = () => {
    logout();
    navigate('/maintenance/login', { replace: true });
  };

  useEffect(() => { document.title = 'LubriPlan Maintenance'; }, []);

  useEffect(() => {
    if (hasAccess === false) {
      navigate('/maintenance/access-denied', { replace: true });
    }
  }, [hasAccess, navigate]);

  // El Dashboard (/maintenance/app) es prefijo de todas las rutas: solo se marca con coincidencia exacta
  const isActive = (path, exact = false) => pathname === path || (!exact && pathname.startsWith(`${path}/`));

  // Cada módulo con su ícono (antes varios nombres no existían en MtIcon y se veían sin ícono)
  const menuItems = [
    { path: '/maintenance/app', Icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/maintenance/app/work-orders', Icon: ClipboardList, label: 'Órdenes' },
    { path: '/maintenance/app/report-failure', Icon: AlertOctagon, label: 'Reportar Falla' },
    { path: '/maintenance/app/preventive-plans', Icon: CalendarCheck, label: 'Planes' },
    { path: '/maintenance/app/planning-calendar', Icon: CalendarRange, label: 'Planificación' },
    { path: '/maintenance/app/maintenance-calendar', Icon: CalendarClock, label: 'Mantenimiento' },
    { path: '/maintenance/app/assets', Icon: Factory, label: 'Activos' },
    { path: '/maintenance/app/personnel', Icon: Users, label: 'Personal' },
    { path: '/maintenance/app/history', Icon: History, label: 'Historial' },
    { path: '/maintenance/app/inventory', Icon: Boxes, label: 'Inventario & Refacciones' },
    { path: '/maintenance/app/analytics', Icon: BarChart3, label: 'Analítica' },
    { path: '/maintenance/app/notifications', Icon: Bell, label: 'Notificaciones' },
  ];

  return (
    <div className="mt-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header - Minimal */}
      <header style={{
        background: 'var(--mt-bg-surface)',
        borderBottom: '1px solid var(--mt-border)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Maintenance es un sistema independiente: sin acceso directo a LubriPlan */}
          <span style={{ fontWeight: 900, fontSize: '15px', color: 'var(--mt-text-primary)' }}>
            LubriPlan <span style={{ color: 'var(--mt-accent)' }}>Maintenance</span>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NotificationBell />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--mt-border)',
                background: 'transparent',
                color: 'var(--mt-text-secondary)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                transition: 'all 150ms ease',
              }}
              title="Cerrar sesión"
            >
              <MtIcon name="logOut" size="sm" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout - Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Navigation */}
        <aside style={{
          width: '240px',
          background: 'var(--mt-bg-surface)',
          borderRight: '1px solid var(--mt-border)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: 'var(--mt-space-lg)',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isActive(item.path, item.exact) ? '1px solid var(--mt-accent)' : '1px solid transparent',
                  background: isActive(item.path, item.exact) ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  color: isActive(item.path, item.exact) ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
                  textDecoration: 'none',
                  fontWeight: isActive(item.path, item.exact) ? 700 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={item.label}
              >
                <item.Icon size={17} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          padding: '24px 32px',
          overflow: 'auto',
          maxWidth: '100%'
        }}>
          {/* Las páginas se cargan en diferido: solo esta área espera, sin desmontar el layout */}
          <Suspense fallback={<p style={{ color: 'var(--mt-text-secondary)', fontSize: '14px' }}>Cargando...</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
