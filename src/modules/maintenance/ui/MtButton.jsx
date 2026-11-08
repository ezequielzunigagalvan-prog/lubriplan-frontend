import './tokens.css';

export default function MtButton({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  icon = null,
  ...props
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--mt-space-sm)',
    fontWeight: 'var(--mt-font-weight-heavy)',
    fontSize: size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px',
    border: 'none',
    borderRadius: 'var(--mt-radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    minHeight: size === 'sm' ? '36px' : size === 'lg' ? '48px' : '40px',
    paddingLeft: size === 'sm' ? '12px' : size === 'lg' ? '20px' : '16px',
    paddingRight: size === 'sm' ? '12px' : size === 'lg' ? '20px' : '16px',
    opacity: disabled || loading ? 0.6 : 1,
  };

  const variantStyle = {
    primary: {
      background: 'var(--mt-accent)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)',
      ':hover': {
        background: 'var(--mt-accent-strong)',
        boxShadow: '0 6px 20px rgba(56, 189, 248, 0.35)',
      },
    },
    secondary: {
      background: 'transparent',
      color: 'var(--mt-accent)',
      border: '1px solid var(--mt-border-hover)',
      ':hover': {
        background: 'rgba(56, 189, 248, 0.08)',
        borderColor: 'var(--mt-accent)',
      },
    },
    ghost: {
      background: 'transparent',
      color: 'var(--mt-text-secondary)',
      border: 'none',
      ':hover': {
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--mt-text-primary)',
      },
    },
    danger: {
      background: 'var(--mt-danger)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(248, 113, 113, 0.25)',
      ':hover': {
        background: 'var(--mt-danger-dark)',
        boxShadow: '0 6px 20px rgba(248, 113, 113, 0.35)',
      },
    },
  };

  const style = {
    ...baseStyle,
    ...(variantStyle[variant] || variantStyle.primary),
  };

  return (
    <button
      style={style}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'mt-spin 0.7s linear infinite',
            }}
          />
          {children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
