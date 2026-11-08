import { MtCard, MtBadge } from '../ui';
import '../ui/tokens.css';

export default function FailureCodes() {
  const codes = [
    { code: 'F001', desc: 'Ruido anormal', severity: 'HIGH' },
    { code: 'F002', desc: 'Vibración excesiva', severity: 'CRITICAL' },
    { code: 'F003', desc: 'Fuga de aceite', severity: 'MEDIUM' },
    { code: 'F004', desc: 'Temperatura alta', severity: 'HIGH' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px', color: 'var(--mt-text-primary)' }}>
        Códigos de Falla
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {codes.map((item) => (
          <MtCard key={item.code} elevated>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 900, color: 'var(--mt-accent)' }}>
                {item.code}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.desc}</div>
              <MtBadge variant={item.severity === 'CRITICAL' ? 'danger' : item.severity === 'HIGH' ? 'warning' : 'info'} size="sm">
                {item.severity}
              </MtBadge>
            </div>
          </MtCard>
        ))}
      </div>
    </div>
  );
}
