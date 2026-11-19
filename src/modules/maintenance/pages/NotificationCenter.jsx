import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, CheckCheck, RefreshCw, Settings } from 'lucide-react';
import { MtCard, MtBadge, MtButton } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { useAuth } from '../../../context/AuthContext';
import { NOTIFICATION_TYPES, SEVERITY_COLOR, timeAgo, announceNotificationsChanged } from '../constants/notifications';

const errorMessage = (err, fallback) => err?.data?.error || err?.message || fallback;

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { isAdmin, isSupervisor } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread | <type>
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const filters = filter === 'unread' ? { unread: true } : filter !== 'all' ? { type: filter } : {};
      setNotifications(await maintenanceApi.getNotifications(200, filters));
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron cargar las notificaciones'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (n) => {
    if (n.isRead) return;
    try {
      await maintenanceApi.markNotificationAsRead(n.id);
      setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true, readAt: new Date().toISOString() } : x)));
      announceNotificationsChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo marcar como leída'));
    }
  };

  const open = async (n) => {
    await markRead(n);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const markAll = async () => {
    try {
      const r = await maintenanceApi.markAllNotificationsRead();
      toast.success(`${r?.updated ?? 0} notificación(es) marcadas como leídas`);
      announceNotificationsChanged();
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudieron marcar como leídas'));
    }
  };

  const checkNow = async () => {
    try {
      setChecking(true);
      const r = await maintenanceApi.checkAlerts();
      toast.success(r?.total ? `${r.total} alerta(s) nuevas` : 'Sin alertas nuevas');
      announceNotificationsChanged();
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudieron revisar las alertas'));
    } finally {
      setChecking(false);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;
  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'unread', label: 'Sin leer' },
    ...Object.entries(NOTIFICATION_TYPES).map(([id, t]) => ({ id, label: t.label })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, marginBottom: 'var(--mt-space-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={28} style={{ color: 'var(--mt-accent)' }} /> Notificaciones
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--mt-text-secondary)' }}>
            {unread} sin leer · las alertas se generan automáticamente y se guardan {30} días
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', flexWrap: 'wrap' }}>
          {(isAdmin || isSupervisor) && (
            <MtButton variant="secondary" onClick={checkNow} disabled={checking}>
              <RefreshCw size={16} /> {checking ? 'Revisando...' : 'Revisar alertas ahora'}
            </MtButton>
          )}
          <MtButton variant="secondary" onClick={markAll} disabled={unread === 0}>
            <CheckCheck size={16} /> Marcar todas como leídas
          </MtButton>
          <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/notifications/preferences')}>
            <Settings size={16} /> Preferencias
          </MtButton>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <MtButton key={f.id} size="sm" variant={filter === f.id ? 'primary' : 'secondary'} onClick={() => setFilter(f.id)}>
            {f.label}
          </MtButton>
        ))}
      </div>

      {error && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--mt-danger)', fontWeight: 700 }}>{error}</span>
            <MtButton size="sm" onClick={load}>Reintentar</MtButton>
          </div>
        </MtCard>
      )}

      {!error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
          {loading && <p style={{ color: 'var(--mt-text-secondary)' }}>Cargando...</p>}
          {!loading && notifications.length === 0 && (
            <MtCard elevated>
              <p style={{ padding: 'var(--mt-space-xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-tertiary)' }}>
                {filter === 'all' ? 'No tienes notificaciones.' : 'No hay notificaciones con este filtro.'}
              </p>
            </MtCard>
          )}
          {notifications.map((n) => {
            const type = NOTIFICATION_TYPES[n.type];
            return (
              <MtCard key={n.id} elevated>
                <div style={{ padding: 'var(--mt-space-md) var(--mt-space-lg)', display: 'flex', gap: 'var(--mt-space-md)', alignItems: 'flex-start', borderLeft: `4px solid ${SEVERITY_COLOR[n.severity] || 'var(--mt-border)'}`, background: n.isRead ? undefined : 'rgba(56,189,248,0.06)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {type && <MtBadge size="sm" variant={type.badge}>{type.label}</MtBadge>}
                      {!n.isRead && <MtBadge size="sm" variant="accent">Nueva</MtBadge>}
                      <span style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }} title={new Date(n.createdAt).toLocaleString('es-MX')}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: n.isRead ? 600 : 800 }}>{n.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', marginTop: '2px' }}>{n.message}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {n.actionUrl && <MtButton size="sm" onClick={() => open(n)}>{n.actionLabel || 'Abrir'}</MtButton>}
                    {!n.isRead && <MtButton size="sm" variant="secondary" onClick={() => markRead(n)}>Leída</MtButton>}
                  </div>
                </div>
              </MtCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
