import { MtCard, MtBadge, MtPriorityBadge, MtButton, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function WorkOrderDetail() {
  const order = {
    id: '000123',
    title: 'Ruido anormal en bomba',
    asset: 'Bomba Principal',
    priority: 'HIGH',
    state: 'IN_PROGRESS',
    createdAt: '2025-11-28',
    description: 'Se detectó ruido anormal en la bomba principal. Requiere inspección urgente.',
    assignedTo: 'Juan Pérez',
    timeline: [
      { date: '2025-11-28 09:15', event: 'Reportada', icon: 'alertCircle' },
      { date: '2025-11-28 10:30', event: 'Aprobada', icon: 'checkCircle' },
      { date: '2025-11-28 11:00', event: 'Asignada a Juan', icon: 'user' },
      { date: '2025-11-28 14:00', event: 'En ejecución', icon: 'wrench' },
    ],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--mt-accent)', marginBottom: '4px' }}>
              OT-{order.id}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mt-text-primary)' }}>{order.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <MtPriorityBadge priority={order.priority} />
            <MtBadge variant="info" dot>{order.state}</MtBadge>
          </div>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
          {order.asset} • Creada {order.createdAt} • Asignada: {order.assignedTo}
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Description */}
        <MtCard elevated>
          <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-secondary)' }}>
            Descripción
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mt-text-primary)', lineHeight: 1.6 }}>
            {order.description}
          </div>
        </MtCard>

        {/* Photos */}
        <MtCard elevated>
          <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-secondary)' }}>
            Fotos (3)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{ aspectRatio: '1', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                📷
              </div>
            ))}
          </div>
        </MtCard>
      </div>

      {/* Timeline */}
      <MtCard elevated>
        <div style={{ marginBottom: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-secondary)' }}>
          Línea de tiempo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {order.timeline.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mt-accent)', flexShrink: 0 }}>
                <MtIcon name={item.icon} size="sm" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-primary)' }}>{item.event}</div>
                <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </MtCard>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <MtButton size="lg"><MtIcon name="wrench" size="md" /> Ejecutar</MtButton>
        <MtButton variant="secondary" size="lg">Comentar</MtButton>
        <MtButton variant="ghost" size="lg">Más opciones</MtButton>
      </div>
    </div>
  );
}
