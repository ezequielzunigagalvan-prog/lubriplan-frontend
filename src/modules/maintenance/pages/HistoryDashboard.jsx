import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import {
  Search, Clock, AlertCircle, Wrench, Package, CheckCircle2, CalendarClock, ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import { maintenanceApi } from '../services/maintenanceApi';
import { STATE_LABELS, PRIORITY_LABELS } from '../constants/maintenance';
import '../ui/tokens.css';

const PAGE_SIZE = 50;
const PERIODS = [7, 30, 90, 180, 365];
const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'WORK_ORDER', label: 'Órdenes correctivas' },
  { value: 'FAILURE', label: 'Fallas reportadas' },
  { value: 'PREVENTIVE_MAINTENANCE', label: 'Mantenimiento preventivo' },
  { value: 'SPARE_PARTS', label: 'Refacciones' },
];

const TYPE_INFO = {
  FAILURE_REPORTED: { label: 'Falla reportada', badge: 'danger', icon: AlertCircle },
  WORK_ORDER_CREATED: { label: 'OT creada', badge: 'info', icon: Wrench },
  WORK_ORDER_ASSIGNED: { label: 'OT asignada', badge: 'accent', icon: Wrench },
  WORK_ORDER_STARTED: { label: 'Trabajo iniciado', badge: 'warning', icon: Wrench },
  WORK_ORDER_FINISHED: { label: 'Trabajo terminado', badge: 'success', icon: CheckCircle2 },
  WORK_ORDER_VALIDATED: { label: 'OT validada', badge: 'success', icon: CheckCircle2 },
  WORK_ORDER_REJECTED: { label: 'OT rechazada', badge: 'danger', icon: AlertCircle },
  WORK_ORDER_CANCELLED: { label: 'OT cancelada', badge: 'neutral', icon: AlertCircle },
  WORK_ORDER_STATUS: { label: 'Cambio de estado', badge: 'neutral', icon: Wrench },
  SPARE_PART_USED: { label: 'Refacción usada', badge: 'info', icon: Package },
  PREVENTIVE_GENERATED: { label: 'Preventivo generado', badge: 'accent', icon: CalendarClock },
  PREVENTIVE_SKIPPED: { label: 'Ciclo omitido', badge: 'warning', icon: CalendarClock },
  PREVENTIVE_ERROR: { label: 'Error de generación', badge: 'danger', icon: AlertCircle },
};

const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
const fmtDateTime = (d) => new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
const woNumber = (n) => (typeof n === 'number' ? `OT-${String(n).padStart(5, '0')}` : n);
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 'var(--mt-radius-md)', fontSize: '14px', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface)', color: 'var(--mt-text-primary)', outline: 'none', boxSizing: 'border-box' };

function Stat({ icon: Icon, label, value, color }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Icon size={16} style={{ color }} />
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', textTransform: 'uppercase' }}>{label}</div>
        </div>
        <div style={{ fontSize: '28px', fontWeight: '900', color }}>{value}</div>
      </div>
    </MtCard>
  );
}

/** CSV del resultado filtrado actual (se descarga en el navegador). */
function exportCsv(items, days) {
  const header = ['Fecha', 'Tipo', 'Categoría', 'Título', 'Activo', 'OT', 'Usuario', 'Detalle'];
  const rows = items.map((i) => [
    fmtDateTime(i.timestamp),
    TYPE_INFO[i.type]?.label || i.type,
    CATEGORIES.find((c) => c.value === i.category)?.label || i.category,
    i.title,
    i.asset ? `${i.asset.code} ${i.asset.name}` : '',
    i.workOrder?.number ? woNumber(i.workOrder.number) : '',
    i.user || '',
    i.description || '',
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `historial-mantenimiento-${days}d.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryDashboard() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // cambiar filtros vuelve a la primera página
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(await maintenanceApi.getHistory({ days, category, search: debouncedSearch, page, limit: PAGE_SIZE }));
    } catch (err) {
      console.error('[HistoryDashboard] Error loading history:', err);
      setError(err?.data?.error || err?.message || 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [days, category, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    // Se exporta todo lo filtrado, no solo la página visible
    const all = await maintenanceApi.getHistory({ days, category, search: debouncedSearch, page: 1, limit: 200 });
    exportCsv(all.data || [], days);
  };

  const stats = result?.stats;
  const items = result?.data || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>Historial del Sistema</h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Órdenes de trabajo, fallas, preventivos y refacciones de los últimos {days} días
          </p>
        </div>
        <MtButton variant="secondary" onClick={handleExport} disabled={!items.length}>
          <Download size={16} /> Exportar CSV
        </MtButton>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          <Stat icon={Clock} label="Eventos" value={stats.total} color="var(--mt-accent)" />
          <Stat icon={CheckCircle2} label="Trabajos terminados" value={stats.ordersFinished} color="var(--mt-success)" />
          <Stat icon={AlertCircle} label="Fallas reportadas" value={stats.failuresReported} color="var(--mt-danger)" />
          <Stat icon={CalendarClock} label="Preventivos generados" value={stats.preventivesGenerated} color="var(--mt-warning)" />
          <Stat icon={Package} label="Refacciones" value={`${stats.partsUsed} · ${money(stats.partsCost)}`} color="var(--mt-info)" />
        </div>
      )}

      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 'var(--mt-space-lg)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar por activo, OT, usuario, descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '40px' }}
            />
          </div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={inputStyle} aria-label="Categoría">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={days} onChange={(e) => { setDays(Number(e.target.value)); setPage(1); }} style={inputStyle} aria-label="Periodo">
            {PERIODS.map((p) => <option key={p} value={p}>Últimos {p} días</option>)}
          </select>
        </div>
      </MtCard>

      {error && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <p style={{ margin: 0, color: 'var(--mt-danger)', fontWeight: 700 }}>{error}</p>
            <MtButton onClick={load}>Reintentar</MtButton>
          </div>
        </MtCard>
      )}

      {!error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)', opacity: loading ? 0.6 : 1 }}>
          {!loading && items.length === 0 && (
            <MtCard elevated>
              <p style={{ padding: 'var(--mt-space-xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-tertiary)' }}>
                No hay eventos con esos filtros en el periodo.
              </p>
            </MtCard>
          )}
          {items.map((item) => {
            const info = TYPE_INFO[item.type] || { label: item.type, badge: 'neutral', icon: Clock };
            const Icon = info.icon;
            const expanded = expandedId === item.id;
            const hasDetails = Boolean(item.description || Object.keys(item.details || {}).length || item.fromStatus);
            return (
              <MtCard key={item.id} elevated>
                <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', gap: 'var(--mt-space-md)', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--mt-radius-md)', background: 'var(--mt-bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} style={{ color: 'var(--mt-accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '4px' }}>
                      <MtBadge size="sm" variant={info.badge}>{info.label}</MtBadge>
                      {item.priority && <MtBadge size="sm" variant="neutral">{PRIORITY_LABELS[item.priority] || item.priority}</MtBadge>}
                      <span style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>{fmtDateTime(item.timestamp)}</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{item.title}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                      {item.asset ? `${item.asset.code} · ${item.asset.name}` : 'Sin activo'}
                      {item.workOrder?.number && (
                        <>
                          {' · '}
                          <button
                            onClick={() => navigate(`/maintenance/app/work-orders/${item.workOrder.id}`)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--mt-accent)', fontSize: '12px', fontWeight: 700 }}
                          >
                            {woNumber(item.workOrder.number)}
                          </button>
                        </>
                      )}
                      {item.user && ` · ${item.user}`}
                    </p>
                    {expanded && (
                      <div style={{ marginTop: 'var(--mt-space-sm)', fontSize: '13px', color: 'var(--mt-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.fromStatus && <div>{STATE_LABELS[item.fromStatus] || item.fromStatus} → {STATE_LABELS[item.toStatus] || item.toStatus}</div>}
                        {item.description && <div style={{ whiteSpace: 'pre-wrap' }}>{item.description}</div>}
                        {item.details?.assignedTo && <div>Asignada a: {item.details.assignedTo}</div>}
                        {item.details?.workDone && <div>Trabajo realizado: {item.details.workDone}</div>}
                        {item.details?.downtimeMinutes != null && <div>Tiempo de paro: {item.details.downtimeMinutes} min</div>}
                        {item.details?.totalCost != null && <div>Costo: {item.details.quantity} × {money(item.details.unitCost)} = {money(item.details.totalCost)}</div>}
                        {item.details?.missedCycles > 0 && <div>Ciclos perdidos: {item.details.missedCycles}</div>}
                      </div>
                    )}
                  </div>
                  {hasDetails && (
                    <button
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mt-text-tertiary)', padding: '4px' }}
                    >
                      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  )}
                </div>
              </MtCard>
            );
          })}
        </div>
      )}

      {result && result.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <MtButton size="sm" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Anterior</MtButton>
          <span style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Página {page} de {result.totalPages} · {result.total} eventos</span>
          <MtButton size="sm" variant="secondary" disabled={page >= result.totalPages || loading} onClick={() => setPage(page + 1)}>Siguiente</MtButton>
        </div>
      )}
    </div>
  );
}
