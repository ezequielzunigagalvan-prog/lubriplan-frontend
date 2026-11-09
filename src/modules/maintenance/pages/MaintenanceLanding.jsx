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
      {/* Gradient Background */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.3, pointerEvents: 'none', zIndex: 0 }} className="mt-grid-pattern" />
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--mt-border)', backdropFilter: 'blur(10px)', background: 'rgba(15, 23, 42, 0.5)' }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--mt-accent)' }}>
            LubriPlan
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', color: 'var(--mt-text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
              Características
            </button>
            <button onClick={() => scrollToSection('benefits')} style={{ background: 'none', border: 'none', color: 'var(--mt-text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
              Beneficios
            </button>
            <MtButton onClick={() => navigate('/maintenance/login')} size="sm">
              Entrar
            </MtButton>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{ padding: '120px 40px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '80px', alignItems: 'center' }}>
            {/* Left: Text */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '20px', marginBottom: '24px', width: 'fit-content' }}>
                <MtIcon name="sparkles" size="sm" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-accent)' }}>PLATAFORMA INDUSTRIAL</span>
              </div>

              <h1 style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', color: 'var(--mt-text-primary)', backgroundImage: 'linear-gradient(135deg, var(--mt-text-primary), var(--mt-accent))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Mantenimiento predictivo en tiempo real
              </h1>

              <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--mt-text-secondary)', marginBottom: '32px', lineHeight: 1.8 }}>
                Desde el reporte hasta el historial. Controla cada paso del mantenimiento industrial con precisión, trazabilidad y automatización inteligente.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <MtIcon name="checkCircle2" size="lg" style={{ color: 'var(--mt-success)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Trazabilidad Completa</div>
                    <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Historial inmutable de todas las acciones</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <MtIcon name="zap" size="lg" style={{ color: 'var(--mt-accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Ejecución Móvil</div>
                    <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Fotos, notas y datos en tiempo real</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <MtIcon name="barChart3" size="lg" style={{ color: 'var(--mt-success)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Análisis Avanzado</div>
                    <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Dashboards y KPIs en vivo</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <MtIcon name="shield" size="lg" style={{ color: 'var(--mt-accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Seguridad Empresarial</div>
                    <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Control de acceso y auditoría</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <MtButton onClick={() => navigate('/maintenance/login')} size="lg">
                  <MtIcon name="arrowRight" size="sm" />
                  Acceder Ahora
                </MtButton>
                <MtButton variant="secondary" onClick={() => scrollToSection('features')} size="lg">
                  Ver Demo
                </MtButton>
              </div>
            </div>

            {/* Right: Visual Stats */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Main Card */}
              <div style={{ position: 'relative', perspective: '1200px' }}>
                <div style={{
                  transform: 'rotateY(-12deg) rotateX(8deg)',
                  transformStyle: 'preserve-3d',
                  filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))',
                }}>
                  <MtCard elevated>
                    <div style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '28px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-accent)', textTransform: 'uppercase', marginBottom: '6px' }}>Orden de Trabajo</div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--mt-accent)' }}>OT-002847</div>
                        </div>
                        <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '6px', color: 'var(--mt-success)', fontSize: '12px', fontWeight: 700 }}>
                          EN EJECUCIÓN
                        </div>
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Revisión de bomba centrifuga</div>
                        <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', marginBottom: '12px' }}>Activo: Bomba Principal · Planta: Toluca</div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(248, 113, 113, 0.15)', color: 'var(--mt-danger)', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                            ● ALTA PRIORIDAD
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                            ● PREVENTIVO
                          </span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--mt-border)', paddingTop: '24px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-tertiary)', marginBottom: '12px', textTransform: 'uppercase' }}>Progreso</div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--mt-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '75%', background: 'linear-gradient(90deg, var(--mt-accent), var(--mt-success))', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-accent)' }}>75%</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                          <span>Reportado: 14/11 09:30</span>
                          <span>Actualizado: 14/11 14:15</span>
                        </div>
                      </div>
                    </div>
                  </MtCard>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <MtCard>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--mt-accent)', marginBottom: '4px' }}>247</div>
                    <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>Órdenes Completadas</div>
                  </div>
                </MtCard>
                <MtCard>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--mt-success)', marginBottom: '4px' }}>4.2h</div>
                    <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>MTTR Promedio</div>
                  </div>
                </MtCard>
              </div>
            </div>
          </div>
        </section>

        {/* 5-Step Workflow */}
        <section id="features" style={{ padding: '100px 40px', background: 'rgba(56, 189, 248, 0.02)', borderTop: '1px solid var(--mt-border)', borderBottom: '1px solid var(--mt-border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{ fontSize: '44px', fontWeight: 900, marginBottom: '16px' }}>Flujo de Trabajo Optimizado</h2>
              <p style={{ fontSize: '18px', color: 'var(--mt-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                Desde la identificación de la falla hasta el análisis histórico. Un proceso lineal que garantiza la trazabilidad en cada paso.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '32px', position: 'relative' }}>
              {[
                { icon: 'alertCircle', label: 'Reportar Falla', desc: 'Operador identifica problema' },
                { icon: 'checkCircle2', label: 'Evaluar', desc: 'Supervisor analiza' },
                { icon: 'wrench', label: 'Ejecutar', desc: 'Técnico interviene' },
                { icon: 'clipboardCheck', label: 'Validar', desc: 'Cierre de orden' },
                { icon: 'bookOpen', label: 'Archivar', desc: 'Registro histórico' },
              ].map((step, i) => (
                <div key={i} style={{ textAlign: 'center', animation: `mt-slide-up 0.6s ease backwards`, animationDelay: `${i * 80}ms` }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(139, 92, 246, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'var(--mt-accent)',
                    position: 'relative',
                    border: '2px solid rgba(56, 189, 248, 0.3)',
                  }}>
                    <MtIcon name={step.icon} size={32} />
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '-12px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--mt-accent)',
                      color: 'var(--mt-bg-base)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 900,
                    }}>
                      {i + 1}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{step.label}</div>
                  <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '100px 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{ fontSize: '44px', fontWeight: 900, marginBottom: '16px' }}>Características Principales</h2>
              <p style={{ fontSize: '18px', color: 'var(--mt-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                Herramientas completas para gestionar el ciclo de vida del mantenimiento industrial
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '28px', marginBottom: '80px' }}>
              {[
                { icon: 'package', title: 'Jerarquía de Activos', desc: 'Organiza equipos por planta y ubicación', status: 'Disponible', color: '#38BDF8' },
                { icon: 'clipboard', title: 'Gestión de Órdenes', desc: 'Reporta, asigna y valida trabajos', status: 'Disponible', color: '#10B981' },
                { icon: 'smartphone', title: 'Ejecución Móvil', desc: 'Fotos, notas y validación en campo', status: 'Disponible', color: '#F59E0B' },
                { icon: 'barChart3', title: 'Análisis Avanzado', desc: 'Dashboards de KPIs y tendencias', status: 'Disponible', color: '#8B5CF6' },
                { icon: 'history', title: 'Historial Completo', desc: 'Registro inmutable de todas las acciones', status: 'Disponible', color: '#EC4899' },
                { icon: 'box', title: 'Inventario Integrado', desc: 'Gestión de refacciones y stock', status: 'Disponible', color: '#06B6D4' },
              ].map((item, i) => (
                <MtCard key={i} elevated>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                      fontSize: '28px',
                    }}>
                      <MtIcon name={item.icon} size={28} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>{item.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', marginBottom: '12px' }}>{item.desc}</div>
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: 'var(--mt-success)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      width: 'fit-content',
                      marginTop: 'auto',
                    }}>
                      <MtIcon name="check" size="sm" />
                      {item.status}
                    </div>
                  </div>
                </MtCard>
              ))}
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.05)', borderRadius: '16px', padding: '48px 40px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '32px' }}>Próximas Características</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Mantenimiento Preventivo', icon: 'calendar' },
                  { label: 'Planificación Inteligente', icon: 'calendarDays' },
                  { label: 'Checklists Digitales', icon: 'checkSquare' },
                  { label: 'Contadores de Equipos', icon: 'tally' },
                  { label: 'Notificaciones Smart', icon: 'bell' },
                  { label: 'Reportes Personalizados', icon: 'fileText' },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '2px solid var(--mt-border)',
                    textAlign: 'center',
                    background: 'var(--mt-bg-surface)',
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '8px' }}>
                      <MtIcon name={item.icon} size={24} />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" style={{ padding: '100px 40px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)', borderTop: '1px solid var(--mt-border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{ fontSize: '44px', fontWeight: 900, marginBottom: '16px' }}>Beneficios para tu Operación</h2>
              <p style={{ fontSize: '18px', color: 'var(--mt-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                Mejora tus métricas operacionales y reduce costos de mantenimiento
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
              {[
                { icon: 'trendingDown', title: 'Reduce MTTR', desc: 'Disminuye el tiempo de resolución de problemas hasta 40%', metric: '-40%' },
                { icon: 'target', title: 'Mejora Disponibilidad', desc: 'Aumenta la disponibilidad de equipos con mantenimiento predictivo', metric: '+25%' },
                { icon: 'dollarSign', title: 'Optimiza Costos', desc: 'Reduce costos de mantenimiento no planificado significativamente', metric: '-35%' },
                { icon: 'clipboardCheck', title: 'Auditoría Completa', desc: 'Mantén un registro inmutable de todas las intervenciones', metric: '100%' },
              ].map((benefit, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--mt-accent)',
                    flexShrink: 0,
                  }}>
                    <MtIcon name={benefit.icon} size={28} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{benefit.title}</div>
                    <div style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', marginBottom: '8px' }}>{benefit.desc}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--mt-accent)' }}>{benefit.metric}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section style={{ padding: '100px 40px', borderTop: '1px solid var(--mt-border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{ fontSize: '44px', fontWeight: 900, marginBottom: '16px' }}>Para Cada Rol</h2>
              <p style={{ fontSize: '18px', color: 'var(--mt-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                Diseñado para adaptarse a la estructura de tu organización
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              {[
                { role: 'Operador de Planta', desc: 'Reporta fallas desde el terreno con fotos y ubicación', icon: 'hardhats', color: '#F59E0B' },
                { role: 'Técnico Especialista', desc: 'Ejecuta trabajo y registra actividades en tiempo real', icon: 'wrench', color: '#10B981' },
                { role: 'Supervisor', desc: 'Aprueba, asigna recursos y valida trabajos completados', icon: 'users', color: '#38BDF8' },
                { role: 'Gerente Mantenimiento', desc: 'Analiza datos, optimiza procesos y planifica preventivo', icon: 'trendingUp', color: '#8B5CF6' },
              ].map((r, i) => (
                <MtCard key={i} elevated>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: `${r.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: r.color,
                    }}>
                      <MtIcon name={r.icon} size={24} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{r.role}</div>
                    <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>{r.desc}</div>
                  </div>
                </MtCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section style={{ padding: '120px 40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', backgroundImage: 'linear-gradient(135deg, var(--mt-text-primary), var(--mt-accent))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Comienza Tu Transformación Digital
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--mt-text-secondary)', marginBottom: '48px', lineHeight: 1.8 }}>
              Optimiza tus procesos de mantenimiento industrial. Accede ahora y descubre cómo LubriPlan puede mejorar tu operación.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <MtButton onClick={() => navigate('/maintenance/login')} size="lg">
                <MtIcon name="login" size="sm" />
                Acceder Ahora
              </MtButton>
              <MtButton variant="secondary" onClick={() => navigate('/')} size="lg">
                Ir a LubriPlan Principal
              </MtButton>
            </div>

            <div style={{ marginTop: '48px', paddingTop: '48px', borderTop: '1px solid var(--mt-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--mt-accent)', marginBottom: '4px' }}>24/7</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>Disponibilidad</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--mt-success)', marginBottom: '4px' }}>99.9%</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>Uptime Garantizado</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--mt-accent)', marginBottom: '4px' }}>Ilimitado</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>Historial de Datos</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--mt-success)', marginBottom: '4px' }}>∞</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>Órdenes de Trabajo</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '60px 40px', borderTop: '1px solid var(--mt-border)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--mt-accent)', marginBottom: '16px' }}>LubriPlan</div>
                <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', lineHeight: 1.6 }}>
                  Plataforma integral para gestión de mantenimiento industrial. Desde el reporte hasta el análisis histórico.
                </p>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>Producto</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="#features" style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', textDecoration: 'none', transition: 'color 150ms ease' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>Características</a>
                  <a href="#benefits" style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', textDecoration: 'none', transition: 'color 150ms ease' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>Beneficios</a>
                  <a href="/maintenance/login" style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', textDecoration: 'none', transition: 'color 150ms ease' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>Iniciar Sesión</a>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>Empresa</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="/" style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', textDecoration: 'none', transition: 'color 150ms ease' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>LubriPlan Principal</a>
                  <a href="/" style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', textDecoration: 'none', transition: 'color 150ms ease' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>Acerca de</a>
                  <a href="/" style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', textDecoration: 'none', transition: 'color 150ms ease' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>Contacto</a>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--mt-border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--mt-text-tertiary)', fontSize: '12px', flexWrap: 'wrap', gap: '16px' }}>
              <p>© 2026 LubriPlan. Todos los derechos reservados. | Desarrollado por Hidrolub</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <a href="/" style={{ color: 'var(--mt-text-tertiary)', textDecoration: 'none' }}>Privacidad</a>
                <a href="/" style={{ color: 'var(--mt-text-tertiary)', textDecoration: 'none' }}>Términos</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
