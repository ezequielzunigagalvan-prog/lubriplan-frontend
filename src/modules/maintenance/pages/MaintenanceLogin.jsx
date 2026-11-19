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
    <div style={{ background: 'var(--mt-bg-base)', minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.3, pointerEvents: 'none', zIndex: 0 }} className="mt-grid-pattern" />
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Left Panel - Features */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(139, 92, 246, 0.15))',
        padding: '60px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        borderRight: '1px solid var(--mt-border)',
      }}>
        <div style={{ maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--mt-accent)' }}>LubriPlan</div>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1.2, marginBottom: '24px', color: 'var(--mt-text-primary)' }}>
            Mantenimiento Industrial a tu alcance
          </h1>

          <p style={{ fontSize: '16px', color: 'var(--mt-text-secondary)', lineHeight: 1.6, marginBottom: '40px' }}>
            Controla cada aspecto del mantenimiento de tu planta industrial con una plataforma integral y moderna.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { icon: 'checkCircle2', title: 'Reporta en Campo', desc: 'Solicitudes rápidas desde cualquier ubicación' },
              { icon: 'zap', title: 'Ejecución Ágil', desc: 'Técnicos con información en tiempo real' },
              { icon: 'barChart3', title: 'Datos en Vivo', desc: 'Dashboards y analítica avanzada' },
              { icon: 'shield', title: 'Trazabilidad Total', desc: 'Historial inmutable de todas las acciones' },
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--mt-success)',
                }}>
                  <MtIcon name={feature.icon} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{feature.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid rgba(56, 189, 248, 0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mt-accent)', marginBottom: '4px' }}>247+</div>
              <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>Órdenes Mensuales</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mt-success)', marginBottom: '4px' }}>4.2h</div>
              <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>MTTR Promedio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--mt-accent)', marginBottom: '8px' }}>
              Accede Ahora
            </div>
            <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <MtInput
              label="Correo Electrónico"
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
                padding: '12px 16px',
                background: 'rgba(248, 113, 113, 0.15)',
                border: '1px solid var(--mt-danger)',
                borderRadius: '8px',
                color: 'var(--mt-danger)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}>
                <MtIcon name="alertCircle" size="sm" />
                {error}
              </div>
            )}

            <MtButton
              type="submit"
              disabled={loading}
              loading={loading}
              size="lg"
              style={{ width: '100%', marginTop: '12px' }}
            >
              <MtIcon name="login" size="sm" />
              Entrar
            </MtButton>
          </form>

          {/* Demo Accounts (Dev Only) */}
          {import.meta.env.DEV && demoAccounts.length > 0 && (
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--mt-border)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mt-text-tertiary)', marginBottom: '12px' }}>
                🧪 Cuentas Demo (Desarrollo)
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/maintenance')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--mt-accent)',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.7'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <MtIcon name="chevronLeft" size="sm" />
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
