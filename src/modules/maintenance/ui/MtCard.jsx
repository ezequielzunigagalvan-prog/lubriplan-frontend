import './tokens.css';

export default function MtCard({
  children,
  elevated = false,
  interactive = false,
  onClick = null,
  ...props
}) {
  const style = {
    background: 'var(--mt-bg-surface)',
    border: '1px solid var(--mt-border)',
    borderRadius: 'var(--mt-radius-lg)',
    padding: 'var(--mt-space-lg)',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: interactive || onClick ? 'pointer' : 'default',
    ...(elevated && {
      boxShadow: 'var(--mt-shadow-md)',
    }),
    ...(interactive && {
      ':hover': {
        borderColor: 'var(--mt-border-hover)',
        boxShadow: 'var(--mt-shadow-lg)',
        transform: 'translateY(-2px)',
      },
    }),
  };

  return (
    <div style={style} onClick={onClick} {...props}>
      {children}
    </div>
  );
}
