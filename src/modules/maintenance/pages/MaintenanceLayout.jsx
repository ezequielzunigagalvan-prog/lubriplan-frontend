import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MtIcon } from '../ui';
import { useMaintenanceAccess } from '../hooks/useMaintenanceAccess';
import NotificationBell from '../components/NotificationBell';
import '../styles.css';

export default function MaintenanceLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hasAccess } = useMaintenanceAccess();

  useEffect(() => {
    if (hasAccess === false) {
      navigate('/maintenance/access-denied', { replace: true });
    }
  }, [hasAccess, navigate]);

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="mt-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: 'var(--mt-bg-surface)',
        borderBottom: '1px solid var(--mt-border)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: 1200, margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
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
            title="Volver a LubriPlan"
          >
            <MtIcon name="chevronLeft" size="sm" />
            LubriPlan
          </button>

          <nav style={{ display: 'flex', gap: '8px', flex: 1, overflowX: 'auto' }}>
            {[
              { path: '/maintenance/app', icon: 'dashboard', label: 'Dashboard' },
              { path: '/maintenance/app/work-orders', icon: 'clipboard', label: 'Órdenes' },
              { path: '/maintenance/app/report-failure', icon: 'alertCircle', label: 'Reportar Falla' },
              { path: '/maintenance/app/preventive-plans', icon: 'calendar', label: 'Planes' },
              { path: '/maintenance/app/planning-calendar', icon: 'calendarDays', label: 'Planificación' },
              { path: '/maintenance/app/maintenance-calendar', icon: 'calendar', label: 'Mantenimiento' },
              { path: '/maintenance/app/assets', icon: 'package', label: 'Activos' },
              { path: '/maintenance/app/personnel', icon: 'users', label: 'Personal' },
              { path: '/maintenance/app/history', icon: 'clock', label: 'Historial' },
              { path: '/maintenance/app/spare-parts', icon: 'wrench', label: 'Refacciones' },
              { path: '/maintenance/app/inventory', icon: 'box', label: 'Inventario' },
              { path: '/maintenance/app/failure-codes', icon: 'zap', label: 'Fallas' },
              { path: '/maintenance/app/indicators', icon: 'barChart3', label: 'Indicadores' },
              { path: '/maintenance/app/analytics', icon: 'trendingUp', label: 'Analítica' },
              { path: '/maintenance/app/notifications', icon: 'bell', label: 'Notificaciones' },
            ].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--mt-border)',
                  background: isActive(item.path) ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  color: isActive(item.path) ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  borderColor: isActive(item.path) ? 'var(--mt-accent)' : 'var(--mt-border)',
                }}
              >
                <MtIcon name={item.icon} size="sm" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NotificationBell />

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
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
            title="Salir"
          >
            <MtIcon name="logOut" size="sm" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
