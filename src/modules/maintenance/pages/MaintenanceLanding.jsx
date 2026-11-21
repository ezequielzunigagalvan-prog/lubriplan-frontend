import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, ArrowRight, LayoutDashboard, ClipboardList, AlertOctagon, CalendarCheck, CalendarRange,
  Factory, Users, History, Boxes, BarChart3, Bell, Megaphone, UserCheck, Hammer, BadgeCheck,
  LineChart, ShieldCheck, Gauge, TimerReset, HardHat,
} from 'lucide-react';
import { GearCluster } from './IndustrialArt';
import './industrial.css';

const MODULES = [
  { Icon: LayoutDashboard, title: 'Dashboard ejecutivo', text: 'Cumplimiento preventivo, órdenes abiertas, atrasos y backlog de un vistazo.' },
  { Icon: ClipboardList, title: 'Órdenes de trabajo', text: 'Preventivas y correctivas con checklist, tiempos, refacciones y evidencia.' },
  { Icon: AlertOctagon, title: 'Reporte de fallas', text: 'Cualquier operador reporta una falla y se convierte en orden en segundos.' },
  { Icon: CalendarCheck, title: 'Planes preventivos', text: 'Frecuencias fijas o flotantes que generan sus órdenes sin duplicados.' },
  { Icon: CalendarRange, title: 'Calendarios', text: 'Carga de trabajo por semana y por técnico para planear sin choques.' },
  { Icon: Factory, title: 'Activos', text: 'Jerarquía de equipos, criticidad, ubicación e historial completo.' },
  { Icon: Users, title: 'Personal', text: 'Técnicos, especialidades y matriz de experiencia por tipo de equipo.' },
  { Icon: Boxes, title: 'Inventario', text: 'Refacciones con stock mínimo, consumos por orden y alertas de reorden.' },
  { Icon: History, title: 'Historial', text: 'Toda la trazabilidad de lo que se hizo, cuándo y quién lo hizo.' },
  { Icon: BarChart3, title: 'Análisis', text: 'Disponibilidad, MTBF, MTTR y Pareto de códigos de falla.' },
  { Icon: Bell, title: 'Notificaciones', text: 'Alertas de atraso, stock bajo y asignaciones para cada rol.' },
  { Icon: HardHat, title: 'Vista del técnico', text: 'Su trabajo del día, ordenado por prioridad y listo para ejecutar.' },
];

const FLOW = [
  { Icon: Megaphone, title: 'Reporta', text: 'Falla o plan vencido' },
  { Icon: UserCheck, title: 'Asigna', text: 'Al técnico adecuado' },
  { Icon: Hammer, title: 'Ejecuta', text: 'Checklist y refacciones' },
  { Icon: BadgeCheck, title: 'Valida', text: 'Supervisor cierra' },
  { Icon: LineChart, title: 'Analiza', text: 'KPIs y mejora' },
];

const STATS = [
  { Icon: Gauge, value: 'Disponibilidad', label: 'por equipo y por planta' },
  { Icon: TimerReset, value: 'MTBF · MTTR', label: 'calculados con cada orden' },
  { Icon: CalendarCheck, value: 'Preventivo', label: 'cumplimiento a tiempo' },
  { Icon: ShieldCheck, value: 'Trazabilidad', label: 'de cada intervención' },
];

const TICKER = ['OT-0142 · Compresor C-2 · Preventiva completada', 'Stock bajo · Rodamiento 6205', 'OT-0143 · Bomba B-7 · Falla reportada', 'Plan PM-COMP · próxima en 3 días', 'OT-0139 · Validada por supervisor', 'Disponibilidad semanal · 97.4 %'];

const BARS = [62, 78, 55, 90, 72, 84, 96];

function MockDashboard() {
  return (
    <div className="ind-card ind-fade-up ind-delay-2" style={{ padding: 20, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>Panel de planta</div>
        <span className="ind-chip" style={{ fontSize: 10 }}><span className="ind-live-dot" /> En vivo</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[{ k: 'Abiertas', v: '12', c: '#38bdf8' }, { k: 'Atrasadas', v: '2', c: '#ef4444' }, { k: 'Preventivo', v: '94%', c: '#22c55e' }].map((x) => (
          <div key={x.k} style={{ background: '#0b1220', border: '1px solid var(--ind-line)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--ind-muted)', fontWeight: 700 }}>{x.k}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ind-muted)', fontWeight: 700, marginBottom: 8 }}>Órdenes completadas por día</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110, padding: '0 4px', borderBottom: '1px solid var(--ind-line)' }}>
        {BARS.map((h, i) => (
          <div key={i} className="ind-bar" style={{ flex: 1, height: `${h}%`, animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {[{ t: 'OT-0143 · Bomba B-7', s: 'Crítica', c: '#ef4444' }, { t: 'OT-0142 · Compresor C-2', s: 'En curso', c: '#f59e0b' }].map((r) => (
          <div key={r.t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, background: '#0b1220', border: '1px solid var(--ind-line)', borderRadius: 8, padding: '8px 10px' }}>
            <span style={{ fontWeight: 700 }}>{r.t}</span>
            <span style={{ color: r.c, fontWeight: 800 }}>{r.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const sectionTitle = { fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 900, margin: '12px 0 10px', lineHeight: 1.15 };
const container = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

export default function MaintenanceLanding() {
  useEffect(() => { document.title = 'LubriPlan Maintenance | Gestión de mantenimiento industrial'; }, []);

  return (
    <div className="ind-root">
      {/* Navegación */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(12px)', background: 'rgba(10,15,26,0.75)', borderBottom: '1px solid var(--ind-line)' }}>
        <div style={{ ...container, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={19} color="#111827" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 17 }}>LubriPlan <span style={{ color: 'var(--ind-sky)' }}>Maintenance</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <a href="#modulos" className="ind-hide-mobile" style={{ color: 'var(--ind-muted)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Módulos</a>
            <a href="#flujo" className="ind-hide-mobile" style={{ color: 'var(--ind-muted)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Flujo</a>
            <Link to="/maintenance/login" className="ind-btn ind-btn-primary" style={{ padding: '10px 18px', fontSize: 14 }}>Iniciar sesión <ArrowRight size={16} /></Link>
          </div>
        </div>
      </nav>

      {/* Héroe */}
      <header style={{ position: 'relative', overflow: 'hidden', padding: '80px 0 70px' }}>
        <div className="ind-blueprint" />
        <div className="ind-glow" style={{ width: 520, height: 520, background: '#0ea5e9', top: -200, left: -160 }} />
        <div className="ind-glow" style={{ width: 420, height: 420, background: '#f59e0b', bottom: -220, right: -120, opacity: 0.2 }} />
        <div className="ind-hide-mobile" style={{ position: 'absolute', right: -60, top: 30, opacity: 0.18, pointerEvents: 'none' }}>
          <GearCluster width={520} height={400} />
        </div>

        <div className="ind-hero-grid" style={{ ...container, position: 'relative' }}>
          <div>
            <span className="ind-chip ind-fade-up"><span className="ind-live-dot" /> Gestión de mantenimiento industrial</span>
            <h1 className="ind-fade-up ind-delay-1" style={{ fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.04, fontWeight: 900, margin: '20px 0 18px' }}>
              Menos paros.<br />Más <span style={{ color: 'var(--ind-amber)' }}>producción</span>.
            </h1>
            <p className="ind-fade-up ind-delay-2" style={{ color: 'var(--ind-muted)', fontSize: 18, maxWidth: 540, margin: '0 0 30px', lineHeight: 1.55 }}>
              Controla órdenes de trabajo, planes preventivos, refacciones y la confiabilidad de tus equipos desde una sola plataforma, en planta y en tiempo real.
            </p>
            <div className="ind-fade-up ind-delay-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/maintenance/login" className="ind-btn ind-btn-primary">Entrar a la plataforma <ArrowRight size={18} /></Link>
              <a href="#modulos" className="ind-btn ind-btn-ghost">Ver módulos</a>
            </div>
          </div>
          <MockDashboard />
        </div>
      </header>

      <div className="ind-hazard" />

      {/* Ticker de actividad */}
      <div style={{ overflow: 'hidden', borderBottom: '1px solid var(--ind-line)', background: '#0b1220', padding: '12px 0' }} aria-hidden="true">
        <div className="ind-ticker">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} style={{ color: 'var(--ind-muted)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: i % 3 === 1 ? '#f59e0b' : '#38bdf8' }} /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Indicadores */}
      <section style={{ ...container, padding: '56px 24px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {STATS.map(({ Icon, value, label }) => (
            <div key={value} className="ind-card ind-card-hover" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 17 }}>{value}</div>
                <div style={{ color: 'var(--ind-muted)', fontSize: 13 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" style={{ ...container, padding: '70px 24px', scrollMarginTop: 70 }}>
        <span className="ind-chip">Módulos</span>
        <h2 style={sectionTitle}>Todo tu mantenimiento, conectado</h2>
        <p style={{ color: 'var(--ind-muted)', maxWidth: 640, margin: '0 0 34px', fontSize: 16 }}>Cada módulo comparte la misma información: una falla reportada termina en una orden, consume refacciones y alimenta tus indicadores.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {MODULES.map(({ Icon, title, text }, i) => (
            <div key={title} className="ind-card ind-card-hover" style={{ padding: 22 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, background: i % 4 === 1 ? 'rgba(245,158,11,0.14)' : 'rgba(56,189,248,0.12)' }}>
                <Icon size={22} color={i % 4 === 1 ? '#f59e0b' : '#38bdf8'} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{title}</div>
              <div style={{ color: 'var(--ind-muted)', fontSize: 14, lineHeight: 1.5 }}>{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Flujo */}
      <section id="flujo" style={{ position: 'relative', overflow: 'hidden', padding: '70px 0', background: '#0b1220', borderTop: '1px solid var(--ind-line)', borderBottom: '1px solid var(--ind-line)', scrollMarginTop: 70 }}>
        <div className="ind-blueprint" />
        <div style={{ ...container, position: 'relative' }}>
          <span className="ind-chip">Flujo de trabajo</span>
          <h2 style={sectionTitle}>De la falla al indicador, sin papeles</h2>
          <div style={{ position: 'relative', marginTop: 40 }}>
            <div className="ind-flow-line ind-hide-mobile" style={{ position: 'absolute', top: 34, left: '10%', right: '10%' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 18, position: 'relative' }}>
              {FLOW.map(({ Icon, title, text }, i) => (
                <div key={title} className="ind-fade-up" style={{ textAlign: 'center', animationDelay: `${i * 120}ms` }}>
                  <div style={{ width: 68, height: 68, margin: '0 auto 14px', borderRadius: '50%', background: 'var(--ind-panel-2)', border: '2px solid rgba(56,189,248,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 6px #0b1220' }}>
                    <Icon size={28} color={i === FLOW.length - 1 ? '#f59e0b' : '#38bdf8'} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ind-amber)', fontWeight: 900, letterSpacing: '0.1em' }}>PASO {i + 1}</div>
                  <div style={{ fontWeight: 900, fontSize: 18, margin: '4px 0' }}>{title}</div>
                  <div style={{ color: 'var(--ind-muted)', fontSize: 13 }}>{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Llamado a la acción */}
      <section style={{ ...container, padding: '80px 24px' }}>
        <div className="ind-card" style={{ position: 'relative', overflow: 'hidden', padding: '48px 36px', textAlign: 'center', background: 'linear-gradient(135deg, #1a2333, #0f172a)' }}>
          <div className="ind-glow" style={{ width: 360, height: 360, background: '#f59e0b', top: -180, left: '40%', opacity: 0.18 }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ ...sectionTitle, marginTop: 0 }}>¿Listo para tomar el control de tu planta?</h2>
            <p style={{ color: 'var(--ind-muted)', fontSize: 16, margin: '0 auto 26px', maxWidth: 560 }}>Entra con tu cuenta y empieza a registrar órdenes, planes y activos hoy mismo.</p>
            <Link to="/maintenance/login" className="ind-btn ind-btn-primary">Iniciar sesión <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      <div className="ind-hazard" />
      <footer style={{ ...container, padding: '28px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, color: 'var(--ind-muted)', fontSize: 13 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Wrench size={15} color="#f59e0b" /> LubriPlan Maintenance</span>
        <span>© {new Date().getFullYear()} · Desarrollado por Hidrolub</span>
      </footer>
    </div>
  );
}
