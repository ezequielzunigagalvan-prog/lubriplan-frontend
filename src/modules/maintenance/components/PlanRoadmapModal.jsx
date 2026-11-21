import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Users, Package, Printer, X, Factory, CalendarClock, Clock, Gauge, History, AlertCircle } from 'lucide-react';
import { MtBadge, MtButton } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { STATE_LABELS, PRIORITY_LABELS } from '../constants/maintenance';

const KIND_LABELS = { CHECK: 'Verificación', MEASURE: 'Medición', TEXT: 'Registro' };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const woNumber = (n) => `OT-${String(n).padStart(5, '0')}`;
const rangeOf = (t) =>
  t.minValue != null || t.maxValue != null
    ? `${t.minValue ?? '−∞'} – ${t.maxValue ?? '∞'}${t.unit ? ` ${t.unit}` : ''}`
    : t.unit || '';

const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Abre una versión imprimible (formato de campo, con casillas para marcar a mano). */
function printRoadmap(r) {
  const rows = r.checklist
    .map((t) => `<tr><td>${t.order}</td><td>${escapeHtml(t.description)}${t.required ? ' *' : ''}</td><td>${KIND_LABELS[t.type] || t.type}</td><td>${escapeHtml(rangeOf(t))}</td><td class="box"></td><td class="box"></td></tr>`)
    .join('');
  const techs = r.assignedTechnicians.map((t) => escapeHtml(t.name)).join(', ') || '—';
  const spares = r.requiredSpares.map((s) => `${escapeHtml(s.code)} ${escapeHtml(s.name)} × ${Number(s.quantity)}`).join('<br>') || '—';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Hoja de ruta ${escapeHtml(r.plan.code)}</title>
<style>body{font-family:Arial,sans-serif;margin:24px;color:#0f172a}h1{margin:0;font-size:20px}h2{font-size:14px;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.05em}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 16px;font-size:12px;margin-top:10px}table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #94a3b8;padding:6px;text-align:left;vertical-align:top}th{background:#e2e8f0}.box{width:70px}.sign{display:flex;gap:40px;margin-top:40px;font-size:12px}.sign div{flex:1;border-top:1px solid #0f172a;padding-top:4px}</style></head>
<body><h1>Hoja de ruta · ${escapeHtml(r.plan.code)} · ${escapeHtml(r.plan.title)}</h1>
<div class="meta"><div><b>Activo:</b> ${escapeHtml(r.asset?.code)} ${escapeHtml(r.asset?.name)}</div><div><b>Ubicación:</b> ${escapeHtml(r.asset?.location || '—')}</div><div><b>Frecuencia:</b> ${escapeHtml(r.plan.frequency)}</div>
<div><b>Próxima:</b> ${fmtDate(r.plan.nextDue)}</div><div><b>Duración estimada:</b> ${r.plan.estimatedMinutes ? `${r.plan.estimatedMinutes} min` : '—'}</div><div><b>Prioridad:</b> ${PRIORITY_LABELS[r.plan.priority] || r.plan.priority}</div></div>
<h2>Actividades</h2><table><tr><th>#</th><th>Actividad</th><th>Tipo</th><th>Rango</th><th>Resultado</th><th>OK</th></tr>${rows || '<tr><td colspan="6">Sin actividades</td></tr>'}</table>
<h2>Técnicos</h2><div style="font-size:12px">${techs}</div><h2>Refacciones</h2><div style="font-size:12px">${spares}</div>
<div class="sign"><div>Ejecutó (nombre y firma)</div><div>Fecha / hora</div><div>Validó</div></div>
<script>window.onload=()=>{window.print()}</script></body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mt-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={16} style={{ color: 'var(--mt-accent)' }} /> {title}{count != null ? ` (${count})` : ''}
      </h3>
      {children}
    </section>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color: 'var(--mt-accent)' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>{label}</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mt-text-primary)' }}>{value || '—'}</div>
      </div>
    </div>
  );
}

const box = { border: '1px solid var(--mt-border)', borderRadius: '10px', background: 'var(--mt-bg-base)' };

export default function PlanRoadmapModal({ isOpen, onClose, plan }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!plan?.id) return;
    try {
      setLoading(true);
      setError(null);
      setRoadmap(await maintenanceApi.getPlanRoadmap(plan.id));
    } catch (err) {
      console.error('[PlanRoadmapModal] Error loading roadmap:', err);
      setError(err?.data?.error || err?.message || 'No se pudo cargar la hoja de ruta');
    } finally {
      setLoading(false);
    }
  }, [plan?.id]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hoja de ruta del plan"
        onClick={(e) => e.stopPropagation()}
        // Fondo sólido explícito: antes usaba MtCard con style propio y perdía su fondo (quedaba transparente)
        style={{ width: '100%', maxWidth: '860px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: 'var(--mt-bg-surface)', border: '1px solid var(--mt-border)', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', overflow: 'hidden' }}
      >
        {/* Encabezado */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c4a6e 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClipboardList size={14} /> Hoja de ruta
            </div>
            <h2 style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: 900, color: '#f8fafc' }}>
              {roadmap?.plan ? `${roadmap.plan.code} · ${roadmap.plan.title}` : plan?.title || 'Plan preventivo'}
            </h2>
            {roadmap?.plan && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                <MtBadge size="sm" variant={roadmap.plan.active ? 'success' : 'neutral'}>{roadmap.plan.active ? 'Activo' : 'Pausado'}</MtBadge>
                <MtBadge size="sm" variant="warning">Prioridad {PRIORITY_LABELS[roadmap.plan.priority] || roadmap.plan.priority}</MtBadge>
                {roadmap.plan.scheduleMode === 'FLOATING' && <MtBadge size="sm" variant="info">Flotante</MtBadge>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {roadmap && (
              <button onClick={() => printRoadmap(roadmap)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                <Printer size={16} /> Imprimir
              </button>
            )}
            <button onClick={onClose} aria-label="Cerrar" style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading && <p style={{ margin: 0, padding: '40px', textAlign: 'center', color: 'var(--mt-text-secondary)' }}>Cargando hoja de ruta...</p>}

          {!loading && error && (
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(244,65,82,0.1)', border: '1px solid var(--mt-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--mt-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={18} /> {error}</span>
              <MtButton size="sm" onClick={load}>Reintentar</MtButton>
            </div>
          )}

          {!loading && roadmap && (
            <>
              <div style={{ ...box, padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                <Fact icon={Factory} label="Activo" value={roadmap.asset ? `${roadmap.asset.code} · ${roadmap.asset.name}` : null} />
                <Fact icon={Factory} label="Ubicación" value={roadmap.asset?.location} />
                <Fact icon={CalendarClock} label="Frecuencia" value={roadmap.plan.frequency} />
                <Fact icon={CalendarClock} label="Próxima" value={fmtDate(roadmap.plan.nextDue)} />
                <Fact icon={History} label="Última realización" value={roadmap.plan.lastCompleted ? fmtDate(roadmap.plan.lastCompleted) : 'Nunca'} />
                <Fact icon={Clock} label="Duración estimada" value={roadmap.plan.estimatedMinutes ? `${roadmap.plan.estimatedMinutes} min` : null} />
              </div>

              {roadmap.plan.description && (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-secondary)', whiteSpace: 'pre-wrap' }}>{roadmap.plan.description}</p>
              )}

              <Section icon={ClipboardList} title="Actividades" count={roadmap.checklist.length}>
                {roadmap.checklist.length === 0 ? (
                  <em style={{ fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Este plan no tiene actividades definidas.</em>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {roadmap.checklist.map((t) => (
                      <div key={t.order} style={{ ...box, padding: '10px 12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--mt-accent)', color: '#fff', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {t.order}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700 }}>{t.description}{t.required && <span style={{ color: 'var(--mt-danger)' }}> *</span>}</div>
                          {rangeOf(t) && (
                            <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Gauge size={12} /> {t.minValue != null || t.maxValue != null ? `Rango ${rangeOf(t)}` : `Unidad: ${rangeOf(t)}`}
                            </div>
                          )}
                        </div>
                        <MtBadge size="sm" variant={t.type === 'MEASURE' ? 'info' : t.type === 'TEXT' ? 'neutral' : 'accent'}>{KIND_LABELS[t.type] || t.type}</MtBadge>
                      </div>
                    ))}
                    <span style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>* Obligatoria para poder terminar la orden.</span>
                  </div>
                )}
              </Section>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '16px' }}>
                <Section icon={Users} title="Técnicos" count={roadmap.assignedTechnicians.length}>
                  {roadmap.assignedTechnicians.length === 0 ? (
                    <em style={{ fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Sin técnicos asignados.</em>
                  ) : (
                    roadmap.assignedTechnicians.map((t) => (
                      <div key={t.id} style={{ ...box, padding: '8px 12px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{t.name}</strong>
                        <span style={{ color: 'var(--mt-text-tertiary)' }}>{t.code}</span>
                      </div>
                    ))
                  )}
                </Section>
                <Section icon={Package} title="Refacciones" count={roadmap.requiredSpares.length}>
                  {roadmap.requiredSpares.length === 0 ? (
                    <em style={{ fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>No requiere refacciones.</em>
                  ) : (
                    roadmap.requiredSpares.map((s) => (
                      <div key={s.id} style={{ ...box, padding: '8px 12px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <span><strong>{s.code}</strong> · {s.name}</span>
                        <strong>× {Number(s.quantity)}</strong>
                      </div>
                    ))
                  )}
                </Section>
              </div>

              <Section icon={History} title="Órdenes recientes del plan" count={roadmap.recentWorkOrders?.length ?? 0}>
                {!roadmap.recentWorkOrders?.length ? (
                  <em style={{ fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Todavía no se han generado órdenes de este plan.</em>
                ) : (
                  roadmap.recentWorkOrders.map((o) => (
                    <Link key={o.id} to={`/maintenance/app/work-orders/${o.id}`} onClick={onClose} style={{ ...box, padding: '8px 12px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'var(--mt-text-primary)' }}>
                      <span><strong>{woNumber(o.number)}</strong> · vence {fmtDate(o.dueAt)}</span>
                      <span style={{ color: 'var(--mt-text-secondary)' }}>{STATE_LABELS[o.status] || o.status}{o.finishedAt ? ` · ${fmtDate(o.finishedAt)}` : ''}</span>
                    </Link>
                  ))
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
