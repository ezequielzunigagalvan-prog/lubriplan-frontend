import { MtCard, MtBadge, MtEmpty } from '../ui';
import '../ui/tokens.css';

export default function SpareParts() {
  const parts = [
    { id: 1, code: 'SP-001', name: 'Sello mecánico bomba', qty: 5, unit: 'pz', supplier: 'Hidrolub' },
    { id: 2, code: 'SP-002', name: 'Correa trapecial', qty: 12, unit: 'm', supplier: 'Industrial' },
    { id: 3, code: 'SP-003', name: 'Aceite ISO 68', qty: 100, unit: 'L', supplier: 'Castrol' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px', color: 'var(--mt-text-primary)' }}>Refacciones</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {parts.length === 0 ? (
          <MtEmpty icon="🔧" title="Sin refacciones" description="Crea tu catálogo" />
        ) : (
          parts.map((part) => (
            <MtCard key={part.id} interactive elevated>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--mt-accent)' }}>{part.code}</div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{part.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                  Stock: <strong>{part.qty} {part.unit}</strong>
                </div>
                <MtBadge variant="neutral" size="sm">{part.supplier}</MtBadge>
              </div>
            </MtCard>
          ))
        )}
      </div>
    </div>
  );
}
