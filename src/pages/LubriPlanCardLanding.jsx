import { useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import EquipoSVG from '../components/EquipoSVG'
import CardChatWidget from '../components/chat/CardChatWidget'
import DemoRequestModal from '../components/landing/DemoRequestModal'

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const LUBRIPLAN_URL = 'https://app.lubriplan.com'

// ─── Demo equipo ─────────────────────────────────────────────────────────
const DEMO_PUNTOS = [
  { id: 1, x: 26, y: 38, nombre: 'Cojinete delantero rotor macho', lubricante: 'Shell Omala S2 G 220', cantidad: '5 ml', metodo: 'Engrasador manual', frecuencia: 'Diario', freqColor: '#EF4444', freqBg: '#3F1010' },
  { id: 2, x: 68, y: 38, nombre: 'Cojinete trasero rotor hembra', lubricante: 'Mobilux EP 2', cantidad: '8 ml', metodo: 'Engrasador manual', frecuencia: 'Semanal', freqColor: '#F97316', freqBg: '#3F1E08' },
  { id: 3, x: 50, y: 65, nombre: 'Caja de engranajes', lubricante: 'Mobil SHC 630', cantidad: '2.5 L', metodo: 'Sistema circulación', frecuencia: 'Mensual', freqColor: '#EAB308', freqBg: '#3A3006' },
  { id: 4, x: 82, y: 52, nombre: 'Cojinete motor eléctrico DE', lubricante: 'Klüber Isoflex NBU 15', cantidad: '3 ml', metodo: 'Engrasador manual', frecuencia: 'Trimestral', freqColor: '#22C55E', freqBg: '#0A2E18' },
]

// ─── SVG Icons ────────────────────────────────────────────────────────────
function IconPhone() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="7" y="2" width="14" height="24" rx="3" stroke="#818cf8" strokeWidth="1.5" />
      <rect x="10" y="5" width="8" height="12" rx="1" fill="rgba(99,102,241,0.12)" stroke="#818cf8" strokeWidth="1" />
      <circle cx="14" cy="21" r="1.5" fill="#818cf8" />
    </svg>
  )
}
function IconCard() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="6" width="22" height="16" rx="2.5" stroke="#818cf8" strokeWidth="1.5" />
      <path d="M7 12h6M7 16h4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="14" r="3" stroke="#818cf8" strokeWidth="1.3" />
    </svg>
  )
}
function IconCheck({ size = 28, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="11" stroke={color} strokeWidth="1.5" />
      <path d="M9 14l4 4 6-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconQR({ size = 24, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="8" height="8" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="14" y="2" width="8" height="8" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="2" y="14" width="8" height="8" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill={color} />
      <rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill={color} />
      <rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill={color} />
      <path d="M14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill={color} />
    </svg>
  )
}
function IconGlobe({ size = 24, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="3.5" ry="9" stroke={color} strokeWidth="1.3" />
      <path d="M3 12h18" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3.5 8h17M3.5 16h17" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}
function IconCamera({ size = 24, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2.5" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="14" r="3.5" stroke={color} strokeWidth="1.5" />
      <path d="M9 7l1.5-3h3L15 7" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="18" cy="10" r="1" fill={color} />
    </svg>
  )
}
function IconPalette({ size = 24, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <circle cx="8" cy="10" r="1.5" fill="#EF4444" />
      <circle cx="12" cy="8" r="1.5" fill="#22C55E" />
      <circle cx="16" cy="10" r="1.5" fill="#6366f1" />
      <circle cx="16" cy="14.5" r="1.5" fill="#EAB308" />
      <path d="M14 17.5a3 3 0 0 1-4 0" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function IconUsers({ size = 24, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth="1.5" />
      <path d="M2 20c0-4 3-6 7-6s7 2 7 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="8" r="2.5" stroke={color} strokeWidth="1.3" />
      <path d="M20 18c0-2.5-1.5-4-3.5-4.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function IconTag({ size = 24, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3H5a2 2 0 0 0-2 2v7l9.5 9.5a2 2 0 0 0 2.83 0l5.67-5.67a2 2 0 0 0 0-2.83L12 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7.5" cy="8.5" r="1.5" fill={color} />
    </svg>
  )
}
function IconBolt({ size = 24, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
function IconWrench({ size = 16, color = '#818cf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M14.5 3.5a3 3 0 0 1-3.5 4.5L6 13a2 2 0 1 1-1.5-1.5l5-5a3 3 0 0 1 4.5-3.5l-2 2 1.5 1.5 2-2z" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Check ───────────────────────────────────────────────────────────────
function CheckIcon({ color = '#818cf8' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="8" cy="8" r="7" fill={color + '20'} />
      <path d="M4.5 8L7 10.5L11.5 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Demo interactivo ─────────────────────────────────────────────────────
function DemoEquipo() {
  const [activeId, setActiveId] = useState(null)
  const activePunto = DEMO_PUNTOS.find(p => p.id === activeId)

  return (
    <section style={{ padding: '80px 5%', background: '#0f0a2e' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#818cf8', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
            Demo interactivo
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#f1f5f9', marginBottom: 12 }}>
            Así ve el técnico la ficha
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
            Pasa el cursor sobre los puntos numerados para ver los datos de lubricación de cada uno
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}>
          {/* Imagen con puntos */}
          <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.16)', borderRadius: 20, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(99,102,241,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: FONT }}>
                  Compresor de tornillo
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  <span style={{ color: '#818cf8', fontFamily: 'monospace', fontSize: 10, background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>CMP-001</span>
                  Sala de compresores
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {DEMO_PUNTOS.map(p => (
                  <div key={p.id} style={{ width: 8, height: 8, borderRadius: '50%', background: p.freqColor, opacity: activeId === p.id ? 1 : 0.4 }} />
                ))}
              </div>
            </div>

            {/* SVG + puntos */}
            <div style={{ padding: '24px 24px 20px' }}>
              <div style={{ width: '100%', aspectRatio: '16/9', minHeight: 160, position: 'relative' }}>
                <EquipoSVG tipo="compresor" showName={false} />
                {DEMO_PUNTOS.map(p => (
                  <button
                    key={p.id}
                    onMouseEnter={() => setActiveId(p.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onClick={() => setActiveId(activeId === p.id ? null : p.id)}
                    style={{
                      position: 'absolute',
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: activeId === p.id ? 38 : 32,
                      height: activeId === p.id ? 38 : 32,
                      borderRadius: '50%',
                      background: p.freqColor,
                      border: activeId === p.id ? '3px solid #fff' : '2.5px solid rgba(255,255,255,0.35)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: FONT, fontSize: 13, fontWeight: 900,
                      color: '#0a0a1a',
                      zIndex: 10,
                      animation: activeId === p.id ? 'none' : 'pulse-dot 2.4s ease-in-out infinite',
                      boxShadow: activeId === p.id
                        ? `0 0 0 6px ${p.freqColor}35, 0 2px 16px rgba(0,0,0,0.6)`
                        : `0 0 14px ${p.freqColor}90`,
                      transition: 'width 0.15s, height 0.15s, box-shadow 0.15s',
                      padding: 0,
                    }}
                  >
                    {p.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Leyenda frecuencias */}
            <div style={{ padding: '0 18px 16px', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {DEMO_PUNTOS.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.freqColor }} />
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: FONT }}>{p.frecuencia}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel de detalle */}
          <div>
            {activePunto ? (
              <div style={{ background: 'rgba(99,102,241,0.04)', border: `1px solid ${activePunto.freqColor}40`, borderRadius: 20, overflow: 'hidden', animation: 'fade-in 0.15s ease-out' }}>
                {/* Header punto */}
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: activePunto.freqColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 18, fontWeight: 900, color: '#0a0a1a', flexShrink: 0 }}>
                      {activePunto.id}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', fontFamily: FONT, lineHeight: 1.3 }}>
                        {activePunto.nombre}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: activePunto.freqBg, border: `1px solid ${activePunto.freqColor}30`, borderRadius: 8, padding: '3px 10px', marginTop: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: activePunto.freqColor }} />
                        <span style={{ color: activePunto.freqColor, fontSize: 11, fontWeight: 700 }}>{activePunto.frecuencia}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filas de datos */}
                {[
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9C3 6 6 3 9 3s6 3 6 6-3 6-6 6-6-3-6-6z" stroke="#818cf8" strokeWidth="1.4" /><path d="M9 6v4M9 12h.01" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round" /></svg>,
                    label: 'Lubricante', value: activePunto.lubricante,
                  },
                  {
                    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L13 8H5L9 2Z" stroke="#818cf8" strokeWidth="1.4" strokeLinejoin="round" /><rect x="6" y="8" width="6" height="8" rx="1" stroke="#818cf8" strokeWidth="1.4" /></svg>,
                    label: 'Cantidad', value: activePunto.cantidad,
                  },
                  {
                    icon: <IconWrench />,
                    label: 'Método', value: activePunto.metodo,
                  },
                ].map((row, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(99,102,241,0.10)' : 'none' }}>
                    <div style={{ width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{row.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500, fontFamily: FONT }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 20, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconBolt size={26} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
                  Selecciona un punto
                </div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, maxWidth: 220 }}>
                  Pasa el cursor sobre los círculos numerados en la imagen del equipo para ver los datos de lubricación
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, width: '100%' }}>
                  {DEMO_PUNTOS.map(p => (
                    <button
                      key={p.id}
                      onMouseEnter={() => setActiveId(p.id)}
                      onMouseLeave={() => setActiveId(null)}
                      onClick={() => setActiveId(activeId === p.id ? null : p.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: p.freqColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 13, fontWeight: 900, color: '#0a0a1a', flexShrink: 0 }}>
                        {p.id}
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: FONT }}>{p.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── LandingPage ──────────────────────────────────────────────────────────
export default function LubriPlanCardLanding() {
  const navigate = useNavigate()
  const infoRef = useRef(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const closeInfo = useCallback(() => setInfoOpen(false), [])

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const openChat = () => document.getElementById('lp-card-fab')?.click()

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden',
      background: '#0c0a1e', fontFamily: FONT, zIndex: 1,
    }}>
      <style>{`
        @keyframes pulse-dot {
          0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%,-50%) scale(1.15); opacity: 0.85; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardGlowPulse {
          0%,100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(12,10,30,0.95)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.30)', display: 'grid', placeItems: 'center' }}>
            <img src="/lubriplan-card-logo.jpeg" alt="LubriPlan Card" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.02em' }}>LubriPlan Card</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginTop: 1 }}>Ficha digital de lubricación</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '8px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.20)', borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: FONT, fontWeight: 500, transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.50)'; e.currentTarget.style.color = '#a5b4fc' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.20)'; e.currentTarget.style.color = '#94a3b8' }}
          >
            ← Volver a LubriPlan
          </button>
          <button
            onClick={() => scrollTo(infoRef)}
            style={{ padding: '8px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.20)', borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: FONT, fontWeight: 500, transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.50)'; e.currentTarget.style.color = '#a5b4fc' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.20)'; e.currentTarget.style.color = '#94a3b8' }}
          >
            Información
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 4px 14px rgba(99,102,241,0.35)', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Entrar
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 5% 60px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 420, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none', animation: 'cardGlowPulse 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(129,140,248,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: '6px 16px', marginBottom: 28, fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.10em', position: 'relative' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          FICHA DIGITAL · CÓDIGO QR · VISUALIZACIÓN INDUSTRIAL
        </div>

        <h1 style={{ fontWeight: 900, fontSize: 'clamp(38px, 7vw, 80px)', letterSpacing: '-0.03em', color: '#f1f5f9', lineHeight: 1.05, marginBottom: 12, maxWidth: 860, position: 'relative' }}>
          Cartas de lubricación<br />
          <span style={{ color: '#818cf8' }}>siempre disponibles</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#94a3b8', maxWidth: 560, lineHeight: 1.75, marginBottom: 40, position: 'relative' }}>
          El técnico escanea el QR del equipo y accede instantáneamente a su ficha de lubricación.
          Sin apps, sin contraseñas, sin demoras.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
          <button
            onClick={() => scrollTo(infoRef)}
            style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 13, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.40)', transition: 'transform 0.15s, opacity 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1' }}
          >
            Solicitar información
          </button>
          <button
            onClick={openChat}
            style={{ padding: '14px 32px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.30)', borderRadius: 13, color: '#a5b4fc', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)'; e.currentTarget.style.background = 'rgba(99,102,241,0.10)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)' }}
          >
            Consultar asistente
          </button>
        </div>

        {/* 3 pasos */}
        <div style={{ marginTop: 64, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
          {[
            { label: 'Escanea el QR', icon: <IconPhone />, desc: 'Con la cámara del celular' },
            { label: 'Accede a la ficha', icon: <IconCard />, desc: 'Sin apps ni registro' },
            { label: 'Lubrica correctamente', icon: <IconCheck size={28} />, desc: 'Información precisa siempre' },
          ].map((step, i) => (
            <div key={i} style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.16)', borderRadius: 16, padding: '20px 24px', textAlign: 'center', minWidth: 160, maxWidth: 200, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              {step.icon}
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{step.label}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUÉ ES ── */}
      <section style={{ padding: '80px 5%', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#818cf8', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
            ¿Qué es LubriPlan Card?
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.02em', color: '#f1f5f9', lineHeight: 1.15, marginBottom: 20 }}>
            La ficha técnica de tus equipos,{' '}
            <span style={{ color: '#818cf8' }}>siempre a mano</span>
          </h2>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8, marginBottom: 24 }}>
            LubriPlan Card es una herramienta de <strong style={{ color: '#f1f5f9' }}>visualización de cartas de lubricación industrial</strong>.
            No reemplaza tu sistema de gestión — lo complementa en el piso de planta.
          </p>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 28, background: 'rgba(99,102,241,0.06)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(99,102,241,0.16)' }}>
            LubriPlan Card es visualización pura. No incluye historial, rutas ni alertas.
            Para esas funciones existe la integración con <span style={{ color: '#818cf8', fontWeight: 600 }}>LubriPlan</span>.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'El técnico solo necesita su celular',
              'El admin carga y actualiza la información',
              'Cada equipo tiene su QR único',
              'Disponible en toda la planta, sin Internet requerido*',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckIcon />
                <span style={{ fontSize: 14, color: '#a5b4fc' }}>{item}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#334155', marginTop: 10 }}>* Una vez cargada la ficha, funciona offline en el navegador.</p>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { title: 'QR por equipo', desc: 'Código único por máquina', icon: <IconQR /> },
            { title: 'Sin apps', desc: 'Acceso desde el navegador', icon: <IconGlobe /> },
            { title: 'Imágenes técnicas', desc: 'Fotos con puntos marcados', icon: <IconCamera /> },
            { title: 'Código por color', desc: 'Frecuencias al instante', icon: <IconPalette /> },
            { title: 'Multi-técnico', desc: 'Acceso para todo tu equipo', icon: <IconUsers /> },
            { title: 'Placa metálica', desc: 'QR físico resistente (opcional)', icon: <IconTag /> },
          ].map((f, i) => (
            <div key={i} style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 14, padding: '18px 16px', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.32)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.14)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
            >
              <div style={{ marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEMO ── */}
      <DemoEquipo />

      {/* ── SOLICITAR INFORMACIÓN ── (sin precios: la propuesta se arma por caso) */}
      <section ref={infoRef} style={{ padding: '80px 5%' }}>
        <div style={{
          maxWidth: 880, margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(160deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))',
          border: '1px solid rgba(99,102,241,0.28)', borderRadius: 24, padding: 'clamp(32px, 5vw, 56px)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#818cf8', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
            Solicita información
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.02em', color: '#f1f5f9', lineHeight: 1.1, marginBottom: 16 }}>
            Una propuesta a la medida<br />
            <span style={{ color: '#818cf8' }}>de tu planta</span>
          </h2>
          <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.7 }}>
            El alcance depende del número de equipos, las plantas y si lo usarás junto con LubriPlan.
            Déjanos tu nombre, el nombre de tu empresa y tu teléfono, y te contactamos.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setInfoOpen(true)}
              style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 13, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.40)', fontFamily: FONT }}
            >
              Solicitar información
            </button>
            <button
              onClick={openChat}
              style={{ padding: '14px 32px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.30)', borderRadius: 13, color: '#a5b4fc', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
            >
              Preguntar al asistente
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '36px 5%', borderTop: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'grid', placeItems: 'center' }}>
            <img src="/logo.jpeg" alt="LubriPlan Card" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 14, color: '#f1f5f9', letterSpacing: '-0.02em' }}>LubriPlan Card</span>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <button onClick={() => scrollTo(infoRef)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: FONT, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'} onMouseLeave={e => e.currentTarget.style.color = '#475569'}>Información</button>
          <button onClick={openChat} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: FONT, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'} onMouseLeave={e => e.currentTarget.style.color = '#475569'}>Asistente</button>
          <button onClick={() => navigate('/admin/login')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: FONT, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'} onMouseLeave={e => e.currentTarget.style.color = '#475569'}>Admin</button>
        </div>
        <div style={{ fontSize: 12, color: '#334155' }}>© {new Date().getFullYear()} LubriPlan Card</div>
      </footer>

      {/* ── FAB CHAT ── */}
      <CardChatWidget />
      <DemoRequestModal open={infoOpen} onClose={closeInfo} source="card" />
    </div>
  )
}
