import { useNavigate } from 'react-router-dom';
import { MtButton, MtCard, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function MaintenanceLanding() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div style={{ background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', minHeight: '100vh' }}>
      {/* Grid Background */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} className="mt-grid-pattern" />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <section style={{ padding: '80px 20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
            {/* Left: Text */}
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', color: 'var(--mt-text-primary)' }}>
                Mantenimiento industrial, de la solicitud al historial
              </h1>
              <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--mt-text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
                Reporta fallas, asigna técnicos, ejecuta en campo y valida sin dejar rastro.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--mt-text-tertiary)', marginBottom: '40px', fontStyle: 'italic' }}>
                Pensado para plantas industriales
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <MtButton onClick={() => navigate('/maintenance/login')} size="lg">
                  <MtIcon name="arrowRight" size="md" />
                  Ingresar
                </MtButton>
                <MtButton variant="secondary" onClick={() => scrollToSection('features')} size="lg">
                  Ver cómo funciona
                </MtButton>
              </div>
            </div>

            {/* Right: Mockup Card */}
            <div style={{ position: 'relative' }}>
              <div style={{
                transform: 'rotateY(-15deg) rotateX(5deg)',
                perspective: '1000px',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
              }}>
                <MtCard elevated>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                      Datos de ejemplo
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mt-accent)', marginBottom: '16px', textTransform: 'uppercase' }}>
                      OT-000123
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Ruido anormal en bomba</div>
                      <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginBottom: '12px' }}>Activo: Bomba Principal</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'rgba(248, 113, 113, 0.15)', color: 'var(--mt-danger)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          ● ALTA
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'rgba(52, 211, 153, 0.15)', color: 'var(--mt-success)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          ● EN EJECUCIÓN
                        </span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--mt-border)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', marginBottom: '8px' }}>Línea de tiempo</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--mt-accent)' }} />
                        <span style={{ color: 'var(--mt-text-secondary)' }}>Reportada hace 2h</span>
                      </div>
                    </div>
                  </div>
                </MtCard>
              </div>
            </div>
          </div>
        </section>

        {/* 5-Step Workflow */}
        <section id="features" style={{ padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--mt-border)', borderBottom: '1px solid var(--mt-border)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '12px' }}>Flujo en 5 pasos</h2>
              <p style={{ fontSize: '16px', color: 'var(--mt-text-secondary)' }}>Del reporte a la historia</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '24px', position: 'relative' }}>
              {[
                { icon: 'alertCircle', label: 'Reportar falla', desc: 'Solicitud rápida desde campo' },
                { icon: 'checkCircle', label: 'Aprobar', desc: 'Supervisor valida' },
                { icon: 'wrench', label: 'Ejecutar', desc: 'Técnico en campo' },
                { icon: 'check', label: 'Validar', desc: 'Cierre de orden' },
                { icon: 'history', label: 'Historial', desc: 'Registro inmutable' },
              ].map((step, i) => (
                <div key={i} style={{ textAlign: 'center', animation: `mt-slide-up 0.6s ease backwards`, animationDelay: `${i * 80}ms` }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: 'var(--mt-accent)',
                    fontSize: '28px',
                  }}>
                    <MtIcon name={step.icon} size={28} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{step.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '80px 20px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '60px', textAlign: 'center' }}>Qué incluye hoy</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', marginBottom: '60px' }}>
              {[
                { icon: 'package', title: 'Activos', desc: 'Jerarquía de equipos', status: 'Disponible' },
                { icon: 'clipboard', title: 'Órdenes', desc: 'Reportar y asignar', status: 'Disponible' },
                { icon: 'wrench', title: 'Ejecución móvil', desc: 'Fotos en campo', status: 'Disponible' },
                { icon: 'history', title: 'Historial', desc: 'Trazabilidad completa', status: 'Disponible' },
                { icon: 'dashboard', title: 'Tablero', desc: 'KPIs y métricas', status: 'Disponible' },
              ].map((item, i) => (
                <MtCard key={i} elevated>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '28px', color: 'var(--mt-accent)' }}>
                      <MtIcon name={item.icon} size={28} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>{item.desc}</div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: 'var(--mt-success)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      width: 'fit-content',
                    }}>
                      ✓ {item.status}
                    </div>
                  </div>
                </MtCard>
              ))}
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--mt-text-secondary)' }}>En desarrollo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                {[
                  'Planes preventivos',
                  'Calendario',
                  'Checklists',
                  'Contadores',
                  'Cumplimiento PM',
                  'Refacciones',
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '2px dashed var(--mt-border)',
                    textAlign: 'center',
                    opacity: 0.6,
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>{item}</div>
                    <div style={{ fontSize: '10px', color: 'var(--mt-text-tertiary)', fontStyle: 'italic' }}>En desarrollo</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section style={{ padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--mt-border)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '60px', textAlign: 'center' }}>Roles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px' }}>
              {[
                { role: 'Operador', desc: 'Reporta fallas desde campo' },
                { role: 'Técnico', desc: 'Ejecuta y completa órdenes' },
                { role: 'Supervisor', desc: 'Aprueba, asigna y valida' },
                { role: 'Administrador', desc: 'Gestiona sistema y permisos' },
              ].map((r, i) => (
                <MtCard key={i} elevated>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>{r.role}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>{r.desc}</div>
                </MtCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '20px' }}>¿Listo para empezar?</h2>
            <p style={{ fontSize: '16px', color: 'var(--mt-text-secondary)', marginBottom: '40px' }}>
              Accede a tu cuenta o conoce más sobre el módulo de Maintenance.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <MtButton onClick={() => navigate('/maintenance/login')} size="lg">
                Ingresar
              </MtButton>
              <MtButton variant="secondary" onClick={() => navigate('/')} size="lg">
                Ir a LubriPlan
              </MtButton>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '40px 20px', borderTop: '1px solid var(--mt-border)', textAlign: 'center', color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <p style={{ marginBottom: '12px' }}>
              Parte del ecosistema{' '}
              <a href="/" style={{ color: 'var(--mt-accent)', textDecoration: 'none', fontWeight: 700 }}>
                LubriPlan
              </a>
            </p>
            <p>Desarrollado por Hidrolub</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
