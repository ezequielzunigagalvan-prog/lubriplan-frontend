import { useEffect, useState, Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MtIcon } from '../ui';
import {
  LayoutDashboard, ClipboardList, AlertOctagon, CalendarCheck, CalendarRange, CalendarClock, Factory, Users, History,
  Boxes, BarChart3, Bell, Menu, X, MoreHorizontal,
} from 'lucide-react';
import { useMaintenanceAccess } from '../hooks/useMaintenanceAccess';
import { useAuth } from '../../../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import '../styles.css';

// Cada módulo con su ícono
const MENU_ITEMS = [
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

// Barra inferior en el celular: lo que más se usa en planta
const BOTTOM_ITEMS = [
  { path: '/maintenance/app', Icon: LayoutDashboard, label: 'Inicio', exact: true },
  { path: '/maintenance/app/work-orders', Icon: ClipboardList, label: 'Órdenes' },
  { path: '/maintenance/app/report-failure', Icon: AlertOctagon, label: 'Falla' },
  { path: '/maintenance/app/preventive-plans', Icon: CalendarCheck, label: 'Planes' },
];

export default function MaintenanceLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hasAccess } = useMaintenanceAccess();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Bloquea el scroll del fondo mientras el menú móvil está abierto; Escape lo cierra
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // El Dashboard (/maintenance/app) es prefijo de todas las rutas: solo se marca con coincidencia exacta
  const isActive = (path, exact = false) => pathname === path || (!exact && pathname.startsWith(`${path}/`));
  const inBottomBar = BOTTOM_ITEMS.some((i) => isActive(i.path, i.exact));

  return (
    <div className="mt-root mt-shell">
      <header className="mt-shell-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button
            type="button"
            className="mt-shell-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>
          {/* Maintenance es un sistema independiente: sin acceso directo a LubriPlan */}
          <span style={{ fontWeight: 900, fontSize: '15px', color: 'var(--mt-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            LubriPlan <span style={{ color: 'var(--mt-accent)' }}>Maintenance</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NotificationBell />
          <button type="button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="mt-shell-icon-btn">
            <MtIcon name="logOut" size="sm" />
          </button>
        </div>
      </header>

      <div className="mt-shell-body">
        {/* Fondo del menú móvil */}
        {menuOpen && <div className="mt-shell-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

        <aside className={`mt-shell-aside${menuOpen ? ' open' : ''}`} aria-label="Menú principal">
          <div className="mt-shell-aside-head">
            <span style={{ fontWeight: 900, fontSize: '15px' }}>Menú</span>
            <button type="button" className="mt-shell-icon-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
              <X size={18} />
            </button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {MENU_ITEMS.map((item) => {
              const active = isActive(item.path, item.exact);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className="mt-shell-link"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    border: active ? '1px solid var(--mt-accent)' : '1px solid transparent',
                    background: active ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    color: active ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
                    fontWeight: active ? 700 : 600,
                  }}
                  title={item.label}
                >
                  <item.Icon size={18} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="mt-shell-main">
          {/* Las páginas se cargan en diferido: solo esta área espera, sin desmontar el layout */}
          <Suspense fallback={<p style={{ color: 'var(--mt-text-secondary)', fontSize: '14px' }}>Cargando...</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Barra inferior (solo celular) */}
      <nav className="mt-shell-bottom" aria-label="Accesos rápidos">
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <NavLink key={item.path} to={item.path} end={item.exact} className={`mt-shell-tab${active ? ' active' : ''}`}>
              <item.Icon size={21} strokeWidth={2.2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button type="button" className={`mt-shell-tab${!inBottomBar ? ' active' : ''}`} onClick={() => setMenuOpen(true)}>
          <MoreHorizontal size={21} strokeWidth={2.2} />
          <span>Más</span>
        </button>
      </nav>
    </div>
  );
}
