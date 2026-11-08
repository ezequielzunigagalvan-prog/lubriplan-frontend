import './tokens.css';
import MtButton from './MtButton';

export default function MtEmpty({
  icon = null,
  title = 'Sin datos',
  description = 'No hay elementos para mostrar',
  action = null,
  actionLabel = 'Crear',
  ...props
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--mt-space-3xl)',
        background: 'var(--mt-bg-surface)',
        border: '1px solid var(--mt-border)',
        borderRadius: 'var(--mt-radius-lg)',
        textAlign: 'center',
        gap: 'var(--mt-space-lg)',
        minHeight: '200px',
      }}
      {...props}
    >
      {icon && (
        <div style={{ fontSize: '40px', opacity: 0.4 }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{
          fontSize: '15px',
          fontWeight: 'var(--mt-font-weight-bold)',
          color: 'var(--mt-text-primary)',
          marginBottom: '4px',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--mt-text-secondary)',
        }}>
          {description}
        </div>
      </div>
      {action && (
        <MtButton onClick={action} size="md">
          {actionLabel}
        </MtButton>
      )}
    </div>
  );
}
