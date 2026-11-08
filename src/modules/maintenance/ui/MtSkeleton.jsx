import './tokens.css';

export default function MtSkeleton({
  type = 'card',
  count = 1,
  ...props
}) {
  const shimmerStyle = {
    background: 'linear-gradient(90deg, var(--mt-bg-surface) 0%, var(--mt-bg-surface-2) 50%, var(--mt-bg-surface) 100%)',
    backgroundSize: '1000px 100%',
    animation: 'mt-shimmer 2s infinite',
  };

  if (type === 'card') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)', ...props }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ ...shimmerStyle, height: '120px', borderRadius: 'var(--mt-radius-lg)' }} />
        ))}
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)', ...props }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ ...shimmerStyle, height: '12px', borderRadius: 'var(--mt-radius-sm)' }} />
        ))}
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-md)', ...props }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ ...shimmerStyle, height: '100px', borderRadius: 'var(--mt-radius-lg)' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ ...shimmerStyle, height: '40px', borderRadius: 'var(--mt-radius-md)', ...props }} />
  );
}
