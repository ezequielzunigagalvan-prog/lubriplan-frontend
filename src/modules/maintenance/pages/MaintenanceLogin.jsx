import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { MtButton, MtInput, MtCard, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function MaintenanceLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load demo accounts in dev mode (lazy initialization)
  const getDemoAccounts = () => {
    if (!import.meta.env.DEV) return [];
    const envAccounts = import.meta.env.VITE_MAINTENANCE_DEMO_ACCOUNTS;
    if (envAccounts) {
      try {
        return JSON.parse(envAccounts);
      } catch (e) {
        console.error('Error parsing demo accounts:', e);
        return [];
      }
    }
    return [];
  };

  const demoAccounts = getDemoAccounts();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/maintenance/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      const from = location.state?.from || '/maintenance/app';
      navigate(from, { replace: true });
    } catch (err) {
      if (err?.message?.includes('401') || err?.message?.includes('inválid') || err?.message?.includes('incorrect')) {
        setError('Email o contraseña incorrecta');
      } else if (err?.message?.includes('403') || err?.message?.includes('inactive')) {
        setError('Usuario inactivo, contacta al administrador');
      } else if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
        setError('Error de conexión, intenta de nuevo');
      } else {
        setError(err?.message || 'Error inesperado');
      }
      setLoading(false);
    }
  };

  const fillDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div style={{ background: 'var(--mt-bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} className="mt-grid-pattern" />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 900 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
          {/* Right Panel - Form */}
          <div>
            <MtCard elevated>
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--mt-accent)', marginBottom: '4px' }}>
                    Maintenance
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
                    Accede a tu cuenta
                  </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <MtInput
                    label="Email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />

                  <MtInput
                    label="Contraseña"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    required
                  />

                  {error && (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(248, 113, 113, 0.15)',
                      border: '1px solid var(--mt-danger)',
                      borderRadius: '8px',
                      color: 'var(--mt-danger)',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '16px' }}>⚠️</span>
                      {error}
                    </div>
                  )}

                  <MtButton
                    type="submit"
                    disabled={loading}
                    loading={loading}
                    size="lg"
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    Entrar
                  </MtButton>
                </form>

                {/* Demo Accounts (Dev Only) */}
                {import.meta.env.DEV && demoAccounts.length > 0 && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--mt-border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mt-text-tertiary)', marginBottom: '12px' }}>
                      👨‍💻 Cuentas de demo (desarrollo)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {demoAccounts.map((acc, i) => (
                        <MtButton
                          key={i}
                          variant="secondary"
                          size="sm"
                          onClick={() => fillDemoAccount(acc)}
                          style={{ width: '100%', fontSize: '12px' }}
                        >
                          {acc.label}
                        </MtButton>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Links */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/maintenance')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--mt-accent)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    ← Volver al inicio
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--mt-accent)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Ir a LubriPlan
                  </button>
                </div>
              </div>
            </MtCard>
          </div>
        </div>
      </div>
    </div>
  );
}
