import './tokens.css';

export default function MtBadge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  ...props
}) {
  const variantMap = {
    neutral: {
      bg: 'rgba(255, 255, 255, 0.08)',
      text: 'var(--mt-text-secondary)',
    },
    success: {
      bg: 'rgba(52, 211, 153, 0.15)',
      text: 'var(--mt-success)',
    },
    warning: {
      bg: 'rgba(251, 191, 36, 0.15)',
      text: 'var(--mt-warning)',
    },
    danger: {
      bg: 'rgba(248, 113, 113, 0.15)',
      text: 'var(--mt-danger)',
    },
    info: {
      bg: 'rgba(96, 165, 250, 0.15)',
      text: 'var(--mt-info)',
    },
    accent: {
      bg: 'rgba(56, 189, 248, 0.15)',
      text: 'var(--mt-accent)',
    },
  };

  const colors = variantMap[variant] || variantMap.neutral;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'sm' ? '4px' : '6px',
    padding: size === 'sm' ? '4px 8px' : size === 'lg' ? '8px 12px' : '6px 10px',
    borderRadius: 'var(--mt-radius-full)',
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: size === 'sm' ? '11px' : size === 'lg' ? '13px' : '12px',
    fontWeight: 'var(--mt-font-weight-bold)',
    whiteSpace: 'nowrap',
  };

  return (
    <span style={style} {...props}>
      {dot && (
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: colors.text,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
