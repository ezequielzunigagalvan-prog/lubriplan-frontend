// Tipos de notificación de Maintenance (deben coincidir con el backend)
export const NOTIFICATION_TYPES = {
  CRITICAL_FAILURE: { label: 'Falla crítica', badge: 'danger' },
  OVERDUE_WO: { label: 'OT vencida', badge: 'danger' },
  WO_ASSIGNED: { label: 'OT asignada', badge: 'accent' },
  LOW_STOCK: { label: 'Stock bajo', badge: 'warning' },
  TECHNICIAN_OVERLOAD: { label: 'Sobrecarga', badge: 'warning' },
  PREVENTIVE_SOON: { label: 'Preventivo próximo', badge: 'info' },
};

export const SEVERITY_COLOR = {
  CRITICAL: 'var(--mt-danger)',
  WARNING: 'var(--mt-warning)',
  INFO: 'var(--mt-info)',
};

/** "hace 5 min", "hace 3 h", "hace 2 d" */
export function timeAgo(date) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

/** Evento para que la campanita se actualice al momento (al leer o generar notificaciones en otra pantalla). */
export const NOTIFICATIONS_CHANGED = 'mt:notifications-changed';
export const announceNotificationsChanged = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
