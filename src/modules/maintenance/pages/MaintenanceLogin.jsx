import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, Wrench, Activity, CalendarCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { GearCluster } from './IndustrialArt';
import './industrial.css';

/** Cuentas demo solo en desarrollo (VITE_MAINTENANCE_DEMO_ACCOUNTS = JSON [{ label, email, password }]). */
function getDemoAccounts() {
  if (!import.meta.env.DEV) return [];
  try {
    return JSON.parse(import.meta.env.VITE_MAINTENANCE_DEMO_ACCOUNTS || '[]');
  } catch {
    return [];
  }
}

const HIGHLIGHTS = [
  { Icon: Wrench, title: 'Órdenes de trabajo', text: 'Del reporte de falla a la validación, con checklist y evidencia.' },
  { Icon: CalendarCheck, title: 'Preventivo automático', text: 'Planes que generan sus órdenes a tiempo, sin duplicados.' },
  { Icon: Activity, title: 'Confiabilidad', text: 'Disponibilidad, MTBF, MTTR y Pareto de fallas en tiempo real.' },
  { Icon: AlertTriangle, title: 'Alertas de atraso', text: 'Avisos de órdenes atrasadas, stock bajo y planes vencidos.' },
];

export default function MaintenanceLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const demoAccounts = getDemoAccounts();

  useEffect(() => { document.title = 'Iniciar sesión | LubriPlan Maintenance'; }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/maintenance/app', { replace: true });
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
      navigate(location.state?.from || '/maintenance/app', { replace: true });
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('401') || msg.includes('inválid') || msg.includes('incorrect')) setError('Email o contraseña incorrecta');
      else if (msg.includes('403') || msg.includes('inactive')) setError('Usuario inactivo, contacta al administrador');
      else if (msg.includes('network') || msg.includes('fetch')) setError('Error de conexión, intenta de nuevo');
      else setError(msg || 'Error inesperado');
      setLoading(false);
    }
  };

  return (
    <div className="ind-root">
      <div className="ind-login-grid">
        {/* Panel visual */}
        <aside className="ind-login-showcase" style={{ position: 'relative', overflow: 'hidden', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid var(--ind-line)', background: 'radial-gradient(ellipse at 20% 20%, rgba(56,189,248,0.12), transparent 60%), #0b1220' }}>
          <div className="ind-blueprint" />
          <div className="ind-glow" style={{ width: 380, height: 380, background: '#0ea5e9', top: -120, right: -80 }} />
          <div className="ind-glow" style={{ width: 300, height: 300, background: '#f59e0b', bottom: -120, left: -80, opacity: 0.18 }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={22} color="#111827" />
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '0.02em' }}>
              LubriPlan <span style={{ color: 'var(--ind-sky)' }}>Maintenance</span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <span className="ind-chip ind-fade-up"><span className="ind-live-dot" /> Sistema de gestión de mantenimiento</span>
            <h1 className="ind-fade-up ind-delay-1" style={{ fontSize: 'clamp(30px, 3.4vw, 46px)', lineHeight: 1.08, fontWeight: 900, margin: '18px 0 14px' }}>
              Mantén tu planta <span style={{ color: 'var(--ind-amber)' }}>operando</span>.<br />Sin paros sorpresa.
            </h1>
            <p className="ind-fade-up ind-delay-2" style={{ color: 'var(--ind-muted)', fontSize: 16, maxWidth: 520, margin: 0 }}>
              Órdenes de trabajo, preventivos, inventario y confiabilidad de tus equipos en un solo lugar.
            </p>
            <div className="ind-fade-up ind-delay-3" style={{ margin: '24px 0 0', opacity: 0.95 }}>
              <GearCluster width={380} height={290} />
            </div>
          </div>

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            {HIGHLIGHTS.map(({ Icon, title, text }) => (
              <div key={title} className="ind-card" style={{ padding: '14px', display: 'flex', gap: '10px', boxShadow: 'none' }}>
                <Icon size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{title}</div>
                  <div style={{ color: 'var(--ind-muted)', fontSize: 12, marginTop: 2 }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Formulario */}
        <main style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div className="ind-hazard" />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
              <Link to="/maintenance" style={{ color: 'var(--ind-muted)', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
                <ArrowLeft size={14} /> Volver al inicio
              </Link>

              <div className="ind-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <ShieldCheck size={22} color="#f59e0b" />
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Iniciar sesión</h2>
                </div>
                <p style={{ margin: '0 0 24px', color: 'var(--ind-muted)', fontSize: 14 }}>Accede con tu cuenta de la planta.</p>

                <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700 }}>
                    Correo electrónico
                    <span className="ind-input-wrap">
                      <Mail size={18} color="#94a3b8" />
                      <input type="email" autoComplete="email" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    </span>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 700 }}>
                    Contraseña
                    <span className="ind-input-wrap">
                      <Lock size={18} color="#94a3b8" />
                      <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4 }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </span>
                  </label>

                  {error && (
                    <div role="alert" style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <AlertTriangle size={16} /> {error}
                    </div>
                  )}

                  <button type="submit" className="ind-btn ind-btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
                    {loading ? <><span className="ind-spinner" /> Entrando...</> : <>Entrar <ArrowRight size={18} /></>}
                  </button>
                </form>

                {demoAccounts.length > 0 && (
                  <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px dashed var(--ind-line)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ind-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Cuentas demo (solo desarrollo)</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {demoAccounts.map((acc) => (
                        <button key={acc.email} type="button" className="ind-btn ind-btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => { setEmail(acc.email); setPassword(acc.password); }}>
                          {acc.label || acc.email}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p style={{ textAlign: 'center', color: 'var(--ind-muted)', fontSize: 12, marginTop: 20 }}>
                ¿Sin acceso? Pide a tu administrador que habilite tu usuario en la planta.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
