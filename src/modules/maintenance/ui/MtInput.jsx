import './tokens.css';
import { useState } from 'react';

export default function MtInput({
  label = null,
  error = null,
  hint = null,
  icon = null,
  type = 'text',
  required = false,
  showPassword = false,
  onTogglePassword = null,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: 'var(--mt-space-md) var(--mt-space-lg)',
    paddingLeft: icon ? '44px' : 'var(--mt-space-lg)',
    background: 'var(--mt-bg-surface)',
    border: `1px solid ${error ? 'var(--mt-danger)' : focused ? 'var(--mt-accent)' : 'var(--mt-border)'}`,
    borderRadius: 'var(--mt-radius-md)',
    color: 'var(--mt-text-primary)',
    fontSize: '14px',
    fontWeight: 'var(--mt-font-weight-medium)',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: focused ? `var(--mt-shadow-focus)` : 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const containerStyle = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label style={{
          fontSize: '12px',
          fontWeight: 'var(--mt-font-weight-bold)',
          color: 'var(--mt-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label} {required && <span style={{ color: 'var(--mt-danger)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: 'var(--mt-space-lg)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--mt-text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {icon}
          </div>
        )}
        <input
          type={showPassword ? 'text' : type}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {type === 'password' && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            style={{
              position: 'absolute',
              right: 'var(--mt-space-lg)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--mt-text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>
      {error && (
        <div style={{
          fontSize: '12px',
          color: 'var(--mt-danger)',
          fontWeight: 'var(--mt-font-weight-medium)',
        }}>
          {error}
        </div>
      )}
      {hint && !error && (
        <div style={{
          fontSize: '11px',
          color: 'var(--mt-text-tertiary)',
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}
