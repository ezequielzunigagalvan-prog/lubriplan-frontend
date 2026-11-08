import { MtCard, MtStat, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function Inventory() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mt-text-primary)' }}>Inventario</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MtStat label="Items en stock" value="247" color="var(--mt-accent)" icon={<MtIcon name="package" size="lg" />} />
        <MtStat label="Items bajos" value="12" color="var(--mt-warning)" icon={<MtIcon name="alertCircle" size="lg" />} />
        <MtStat label="Valor total" value="$125K" color="var(--mt-success)" icon={<MtIcon name="dashboard" size="lg" />} />
      </div>

      <MtCard elevated>
        <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
          Gestión de inventario en desarrollo
        </div>
      </MtCard>
    </div>
  );
}
