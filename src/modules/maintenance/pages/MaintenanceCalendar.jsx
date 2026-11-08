import { MtCard, MtBadge } from '../ui';
import '../ui/tokens.css';

export default function MaintenanceCalendar() {
  const events = [
    { date: '2025-12-01', type: 'plan', title: 'Lubricación Motores' },
    { date: '2025-12-08', type: 'corrective', title: 'OT-000123 - Bomba' },
    { date: '2025-12-15', type: 'plan', title: 'Inspección Compresor' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px', color: 'var(--mt-text-primary)' }}>
        Calendario de Mantenimiento
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {events.map((event, i) => (
          <MtCard key={i} elevated>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-secondary)' }}>{event.date}</div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{event.title}</div>
              <MtBadge variant={event.type === 'plan' ? 'info' : 'warning'} size="sm">
                {event.type === 'plan' ? 'Plan' : 'Correctiva'}
              </MtBadge>
            </div>
          </MtCard>
        ))}
      </div>
    </div>
  );
}
