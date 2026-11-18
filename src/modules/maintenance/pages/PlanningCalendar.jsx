import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle, Users } from 'lucide-react';
import { maintenanceApi } from '../services/maintenanceApi';
import { STATE_LABELS, PRIORITY_LABELS } from '../constants/maintenance';
import '../ui/tokens.css';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const KIND_STYLE = {
  CORRECTIVE: { label: 'Correctiva', color: '#EF4444' },
  PREVENTIVE: { label: 'Preventiva', color: '#38BDF8' },
  INSPECTION: { label: 'Inspección', color: '#8B5CF6' },
  PROJECTED: { label: 'Preventivo proyectado', color: '#94A3B8' },
};
const CLOSED = ['FINISHED', 'VALIDATED', 'REJECTED', 'CANCELLED'];

/** YYYY-MM-DD en hora local del navegador. */
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7)); // lunes
const woNumber = (n) => `OT-${String(n).padStart(5, '0')}`;
const fmtHours = (min) => `${Math.round((min / 60) * 10) / 10}h`;

function colorOf(item) {
  return item.kind === 'PROJECTED' ? KIND_STYLE.PROJECTED.color : (KIND_STYLE[item.type] || KIND_STYLE.PREVENTIVE).color;
}

function EventChip({ item, onClick, compact }) {
  const closed = item.status && CLOSED.includes(item.status);
  return (
    <button
      onClick={onClick}
      title={`${item.title}${item.technician ? ` · ${item.technician}` : ''}`}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: item.kind === 'PROJECTED' ? `1px dashed ${colorOf(item)}` : 'none',
        borderLeft: `3px solid ${colorOf(item)}`,
        background: item.kind === 'PROJECTED' ? 'transparent' : `${colorOf(item)}22`,
        color: 'var(--mt-text-primary)',
        borderRadius: '4px',
        padding: compact ? '2px 4px' : '6px 8px',
        fontSize: compact ? '11px' : '12px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        opacity: closed ? 0.55 : 1,
        textDecoration: item.status === 'CANCELLED' ? 'line-through' : 'none',
      }}
    >
      {item.overdue && '⚠ '}
      {item.kind === 'WORK_ORDER' ? `${woNumber(item.number)} ` : `${item.planCode} `}
      {item.title}
    </button>
  );
}

export default function PlanningCalendar() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [technicianId, setTechnicianId] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(() => ymd(new Date()));
  const [showProjected, setShowProjected] = useState(true);

  // Rango visible: mes completo en semanas (lun-dom) o la semana actual
  const range = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(cursor);
      return { start, end: addDays(start, 6) };
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const start = startOfWeek(first);
    return { start, end: addDays(startOfWeek(last), 6) };
  }, [cursor, viewMode]);

  useEffect(() => {
    maintenanceApi.getAssignableUsers().then((r) => setTechnicians(Array.isArray(r) ? r : r?.data || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await maintenanceApi.getCalendar({ from: ymd(range.start), to: ymd(range.end), technicianId: technicianId || undefined }));
    } catch (err) {
      console.error('[PlanningCalendar] Error loading calendar:', err);
      setError(err?.data?.error || err?.message || 'No se pudo cargar el calendario');
    } finally {
      setLoading(false);
    }
  }, [range, technicianId]);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => (data?.items || []).filter((i) => showProjected || i.kind !== 'PROJECTED'), [data, showProjected]);
  const byDay = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      if (!map.has(item.day)) map.set(item.day, []);
      map.get(item.day).push(item);
    }
    return map;
  }, [items]);
  const conflictDays = useMemo(() => new Set((data?.conflicts || []).map((c) => c.day)), [data]);

  const days = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) days.push(d);

  const move = (dir) => {
    setCursor((c) => (viewMode === 'week' ? addDays(c, 7 * dir) : new Date(c.getFullYear(), c.getMonth() + dir, 1)));
  };

  const openItem = (item) => {
    if (item.kind === 'WORK_ORDER') navigate(`/maintenance/app/work-orders/${item.workOrderId}`);
    else navigate('/maintenance/app/preventive-plans');
  };

  const today = ymd(new Date());
  const selectedItems = byDay.get(selectedDay) || [];
  const selectedLoad = (data?.load || []).filter((l) => l.day === selectedDay);
  const title = viewMode === 'week'
    ? `Semana del ${range.start.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al ${range.end.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : cursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  const stats = {
    orders: items.filter((i) => i.kind === 'WORK_ORDER').length,
    projected: (data?.items || []).filter((i) => i.kind === 'PROJECTED').length,
    overdue: items.filter((i) => i.overdue).length,
    conflicts: data?.conflicts?.length || 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-xl)' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>Planificación</h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            {stats.orders} OT programadas · {stats.projected} preventivos proyectados · {stats.overdue} atrasadas · {stats.conflicts} sobrecargas
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            aria-label="Técnico"
            style={{ padding: '8px 10px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface)', color: 'var(--mt-text-primary)' }}
          >
            <option value="">Todos los técnicos</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--mt-text-secondary)' }}>
            <input type="checkbox" checked={showProjected} onChange={(e) => setShowProjected(e.target.checked)} /> Proyectados
          </label>
          {['month', 'week'].map((m) => (
            <MtButton key={m} size="sm" variant={viewMode === m ? 'primary' : 'secondary'} onClick={() => setViewMode(m)}>
              {m === 'month' ? 'Mes' : 'Semana'}
            </MtButton>
          ))}
        </div>
      </div>

      {/* Navegación */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
        <MtButton size="sm" variant="secondary" onClick={() => move(-1)} aria-label="Anterior"><ChevronLeft size={16} /></MtButton>
        <MtButton size="sm" variant="secondary" onClick={() => { setCursor(new Date()); setSelectedDay(today); }}>Hoy</MtButton>
        <MtButton size="sm" variant="secondary" onClick={() => move(1)} aria-label="Siguiente"><ChevronRight size={16} /></MtButton>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'capitalize' }}>{title}</h2>
        {loading && <span style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Cargando...</span>}
      </div>

      {error && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--mt-danger)', fontWeight: 700 }}>{error}</span>
            <MtButton size="sm" onClick={load}>Reintentar</MtButton>
          </div>
        </MtCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(260px, 1fr)', gap: 'var(--mt-space-lg)', alignItems: 'start' }}>
        {/* Cuadrícula */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px' }}>
              {WEEKDAYS.map((w) => (
                <div key={w} style={{ fontSize: '11px', fontWeight: 700, textAlign: 'center', color: 'var(--mt-text-tertiary)', padding: '4px 0' }}>{w}</div>
              ))}
              {days.map((d) => {
                const key = ymd(d);
                const dayItems = byDay.get(key) || [];
                const outside = viewMode === 'month' && d.getMonth() !== cursor.getMonth();
                const maxShown = viewMode === 'week' ? 12 : 3;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    style={{
                      minHeight: viewMode === 'week' ? '280px' : '96px',
                      padding: '4px',
                      borderRadius: 'var(--mt-radius-sm)',
                      border: key === selectedDay ? '2px solid var(--mt-accent)' : '1px solid var(--mt-border)',
                      background: key === today ? 'rgba(56,189,248,0.08)' : 'var(--mt-bg-base)',
                      opacity: outside ? 0.45 : 1,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: key === today ? 900 : 600 }}>
                      <span>{d.getDate()}</span>
                      {conflictDays.has(key) && <AlertTriangle size={12} style={{ color: 'var(--mt-danger)' }} aria-label="Sobrecarga" />}
                    </div>
                    {dayItems.slice(0, maxShown).map((item) => (
                      <EventChip key={item.id} item={item} compact={viewMode === 'month'} onClick={(e) => { e.stopPropagation(); setSelectedDay(key); }} />
                    ))}
                    {dayItems.length > maxShown && (
                      <span style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>+{dayItems.length - maxShown} más</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 'var(--mt-space-md)', flexWrap: 'wrap', marginTop: 'var(--mt-space-md)', fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
              {Object.entries(KIND_STYLE).map(([k, v]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: v.color }} /> {v.label}
                </span>
              ))}
            </div>
          </div>
        </MtCard>

        {/* Detalle del día */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
              <CalendarIcon size={16} style={{ color: 'var(--mt-accent)' }} />
              {new Date(`${selectedDay}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>

            {selectedItems.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Sin trabajos programados.</p>}
            {selectedItems.map((item) => (
              <div key={item.id} style={{ borderLeft: `3px solid ${colorOf(item)}`, paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  onClick={() => openItem(item)}
                  style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--mt-text-primary)' }}
                >
                  {item.kind === 'WORK_ORDER' ? woNumber(item.number) : item.planCode} · {item.title}
                </button>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                  {item.asset ? `${item.asset.code} · ${item.asset.name}` : 'Sin activo'}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {item.kind === 'PROJECTED'
                    ? <MtBadge size="sm" variant="neutral">{item.tentative ? 'Proyectado (tentativo)' : 'Proyectado'}</MtBadge>
                    : <MtBadge size="sm" variant={item.overdue ? 'danger' : 'info'}>{item.overdue ? 'Atrasada · ' : ''}{STATE_LABELS[item.status] || item.status}</MtBadge>}
                  <MtBadge size="sm" variant="neutral">{PRIORITY_LABELS[item.priority] || item.priority}</MtBadge>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>
                  {item.technician || 'Sin técnico'}{item.estimatedMinutes ? ` · ${fmtHours(item.estimatedMinutes)} estimadas` : ''}
                </div>
              </div>
            ))}

            {selectedLoad.length > 0 && (
              <div style={{ borderTop: '1px solid var(--mt-border)', paddingTop: 'var(--mt-space-md)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} /> Carga del día
                </h4>
                {selectedLoad.map((l) => (
                  <div key={l.technicianId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0', color: l.overloaded ? 'var(--mt-danger)' : 'var(--mt-text-primary)' }}>
                    <span>{l.technician || `Técnico ${l.technicianId}`}</span>
                    <span>
                      {l.items} trabajo(s) · {fmtHours(l.minutes)}
                      {l.withoutEstimate > 0 && ` (+${l.withoutEstimate} sin estimar)`}
                      {l.overloaded && ' · sobrecarga'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MtCard>
      </div>
    </div>
  );
}
