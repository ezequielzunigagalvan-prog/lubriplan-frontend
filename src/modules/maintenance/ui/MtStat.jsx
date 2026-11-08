import './tokens.css';
import MtCard from './MtCard';

export default function MtStat({
  label,
  value,
  icon = null,
  color = 'var(--mt-accent)',
  trend = null,
  onClick = null,
  ...props
}) {
  return (
    <MtCard interactive={!!onClick} onClick={onClick} elevated {...props}>
      <div style={{ display: 'flex', gap: 'var(--mt-space-lg)' }}>
        {icon && (
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 'var(--mt-radius-lg)',
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--mt-text-secondary)', fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-text-primary)' }}>
              {value}
            </div>
            {trend && (
              <div style={{
                fontSize: '12px',
                fontWeight: 'var(--mt-font-weight-bold)',
                color: trend.type === 'up' ? 'var(--mt-danger)' : trend.type === 'down' ? 'var(--mt-success)' : 'var(--mt-text-secondary)',
              }}>
                {trend.type === 'up' ? '↑' : trend.type === 'down' ? '↓' : '→'} {trend.label}
              </div>
            )}
          </div>
        </div>
      </div>
    </MtCard>
  );
}
