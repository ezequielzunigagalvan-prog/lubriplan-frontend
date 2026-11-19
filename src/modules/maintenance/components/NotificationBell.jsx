import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { maintenanceApi } from '../services/maintenanceApi';
import { SEVERITY_COLOR, timeAgo, NOTIFICATIONS_CHANGED } from '../constants/notifications';

const POLL_MS = 60000;

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await maintenanceApi.getUnreadCount();
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      // silencioso: es un indicador secundario y se reintenta en el siguiente ciclo
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') loadUnreadCount();
    }, POLL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED, loadUnreadCount);
    return () => {
      clearInterval(id);
      window.removeEventListener(NOTIFICATIONS_CHANGED, loadUnreadCount);
    };
  }, [loadUnreadCount]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return undefined;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setIsOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isOpen]);

  const toggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) return;
    try {
      setLoading(true);
      setNotifications(await maintenanceApi.getNotifications(8));
    } catch {
      toast.error('Error cargando notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const open = async (notif) => {
    if (!notif.isRead) {
      try {
        await maintenanceApi.markNotificationAsRead(notif.id);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // si no se pudo marcar, igual se navega
      }
    }
    setIsOpen(false);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const markAll = async () => {
    try {
      await maintenanceApi.markAllNotificationsRead();
      setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error(err?.message || 'No se pudieron marcar como leídas');
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={toggle}
        aria-label={`Notificaciones${unreadCount ? ` (${unreadCount} sin leer)` : ''}`}
        style={{ position: 'relative', background: 'none', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '50%', color: 'var(--mt-text-primary)' }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--mt-danger)', color: '#fff', fontSize: '10px', fontWeight: 800, borderRadius: '999px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '44px', right: 0, width: '340px', background: 'var(--mt-bg-surface)', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-md)', boxShadow: 'var(--mt-shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--mt-border)' }}>
            <strong style={{ fontSize: '14px' }}>Notificaciones</strong>
            {unreadCount > 0 && (
              <button onClick={markAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mt-accent)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCheck size={14} /> Marcar todas
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {loading && <p style={{ margin: 0, padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Cargando...</p>}
            {!loading && notifications.length === 0 && (
              <p style={{ margin: 0, padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Sin notificaciones</p>
            )}
            {!loading && notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', border: 'none', borderBottom: '1px solid var(--mt-border)',
                  borderLeft: `3px solid ${SEVERITY_COLOR[n.severity] || 'var(--mt-border)'}`,
                  background: n.isRead ? 'transparent' : 'rgba(56,189,248,0.08)', padding: '10px 12px', cursor: 'pointer', color: 'var(--mt-text-primary)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: n.isRead ? 600 : 800 }}>{n.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '2px' }}>{n.message}</div>
                <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', marginTop: '4px' }}>{timeAgo(n.createdAt)}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => { setIsOpen(false); navigate('/maintenance/app/notifications'); }}
            style={{ display: 'block', width: '100%', padding: '10px', border: 'none', background: 'var(--mt-bg-surface-2)', color: 'var(--mt-accent)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
          >
            Ver todas →
          </button>
        </div>
      )}
    </div>
  );
}
