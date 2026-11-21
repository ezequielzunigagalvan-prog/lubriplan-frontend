import { MtCard, MtStat, MtBadge, MtButton, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function AssetDetail() {
  const asset = {
    name: 'Bomba Principal',
    code: 'BPA-001',
    location: 'Zona A - Línea 1',
    status: 'operational',
    type: 'Centrifugal Pump',
    model: 'ISO 2858',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--mt-accent)', marginBottom: '4px' }}>
            {asset.code}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mt-text-primary)' }}>{asset.name}</h1>
          <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>{asset.location}</p>
        </div>
        <MtBadge variant="success" dot size="lg">Operacional</MtBadge>
      </div>

      {/* Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '16px' }}>
        <MtStat label="Estado" value="Operacional" color="var(--mt-success)" icon={<MtIcon name="checkCircle" size="lg" />} />
        <MtStat label="Órdenes (30d)" value="3" color="var(--mt-accent)" icon={<MtIcon name="clipboard" size="lg" />} />
        <MtStat label="MTBF" value="720h" color="var(--mt-info)" icon={<MtIcon name="clock" size="lg" />} />
      </div>

      {/* Details */}
      <MtCard elevated>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>Tipo</div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{asset.type}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>Modelo</div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{asset.model}</div>
          </div>
        </div>
      </MtCard>

      {/* History */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '12px', color: 'var(--mt-text-primary)' }}>Historial reciente</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { date: '2025-11-28', type: 'Reportada', priority: 'HIGH' },
            { date: '2025-11-25', type: 'Mantenimiento', priority: 'MEDIUM' },
            { date: '2025-11-20', type: 'Inspección', priority: 'LOW' },
          ].map((item, i) => (
            <MtCard key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.type}</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>{item.date}</div>
              </div>
            </MtCard>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <MtButton size="lg"><MtIcon name="plus" size="md" /> Reportar problema</MtButton>
        <MtButton variant="secondary" size="lg">Ver historial</MtButton>
      </div>
    </div>
  );
}
