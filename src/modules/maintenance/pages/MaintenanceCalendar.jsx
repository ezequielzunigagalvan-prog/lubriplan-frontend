import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import { Calendar, AlertTriangle, Clock, CheckCircle2, PauseCircle } from 'lucide-react';
import { maintenanceApi } from '../services/maintenanceApi';
import { STATE_LABELS, PRIORITY_LABELS } from '../constants/maintenance';
import '../ui/tokens.css';

const PERIODS = [7, 30, 60, 90];
const woNumber = (n) => `OT-${String(n).padStart(5, '0')}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

function daysUntil(date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - start) / (24 * 60 * 60 * 1000));
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Icon size={16} style={{ color }} />
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', textTransform: 'uppercase' }}>{label}</div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: '900', color }}>{value}</div>
      </div>
    </MtCard>
  );
}

export default function MaintenanceCalendar() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [viewMode, setViewMode] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await maintenanceApi.getPreventiveSchedule({ days }));
    } catch (err) {
      console.error('[MaintenanceCalendar] Error loading schedule:', err);
      setError(err?.data?.error || err?.message || 'No se pudo cargar el cronograma');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <MtCard elevated>
        <p style={{ padding: 'var(--mt-space-3xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-secondary)' }}>Cargando cronograma...</p>
      </MtCard>
    );
  }

  if (error) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <p style={{ margin: 0, color: 'var(--mt-danger)', fontWeight: 700 }}>{error}</p>
          <MtButton onClick={load}>Reintentar</MtButton>
        </div>
      </MtCard>
    );
  }

  const { overdue, upcoming, stats } = data;
  const rows = [
    ...(viewMode !== 'upcoming' ? overdue.map((i) => ({ ...i, bucket: 'overdue' })) : []),
    ...(viewMode !== 'overdue' ? upcoming.map((i) => ({ ...i, bucket: 'upcoming' })) : []),
  ];

  const openRow = (row) => {
    if (row.kind === 'WORK_ORDER') navigate(`/maintenance/app/work-orders/${row.workOrderId}`);
    else navigate('/maintenance/app/preventive-plans');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)', opacity: loading ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--mt-radius-md)', background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={28} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>Calendario de Mantenimiento</h1>
            <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>Cronograma de mantenimiento preventivo de la planta</p>
          </div>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Periodo"
          style={{ padding: '8px 12px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface)', color: 'var(--mt-text-primary)' }}
        >
          {PERIODS.map((p) => <option key={p} value={p}>Próximos {p} días</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <Stat icon={AlertTriangle} label="Vencidas" value={stats.overdue} color="var(--mt-danger)" />
        <Stat icon={Clock} label="Próximos 7 días" value={stats.next7Days} color="var(--mt-warning)" />
        <Stat icon={Calendar} label={`Próximos ${data.days} días`} value={stats.nextPeriod} color="var(--mt-accent)" />
        <Stat icon={CheckCircle2} label="Planes activos" value={stats.activePlans} color="var(--mt-success)" />
        <Stat icon={PauseCircle} label="Planes pausados" value={stats.pausedPlans} color="var(--mt-text-secondary)" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', flexWrap: 'wrap' }}>
        {[
          ['all', 'Todo'],
          ['overdue', `Vencidas (${overdue.length})`],
          ['upcoming', `Próximas (${upcoming.length})`],
        ].map(([mode, label]) => (
          <MtButton key={mode} size="sm" variant={viewMode === mode ? 'primary' : 'secondary'} onClick={() => setViewMode(mode)}>{label}</MtButton>
        ))}
      </div>

      {rows.length === 0 ? (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-xl)', textAlign: 'center', color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>
            {stats.activePlans === 0
              ? 'No hay planes preventivos activos. Créalos en Planes para ver aquí su cronograma.'
              : 'Nada pendiente en este periodo.'}
          </div>
        </MtCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
          {rows.map((row) => {
            const until = daysUntil(row.date);
            const isOverdue = row.bucket === 'overdue';
            return (
              <MtCard key={`${row.bucket}-${row.id}`} elevated interactive onClick={() => openRow(row)}>
                <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--mt-space-md)', borderLeft: `4px solid ${isOverdue ? 'var(--mt-danger)' : until <= 7 ? 'var(--mt-warning)' : 'var(--mt-accent)'}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px' }}>
                        {row.kind === 'WORK_ORDER' ? woNumber(row.number) : row.planCode} · {row.title}
                      </strong>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                      {row.asset ? `${row.asset.code} · ${row.asset.name}` : 'Sin activo'} · {row.technician || 'Sin técnico'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {row.kind === 'WORK_ORDER'
                        ? <MtBadge size="sm" variant="info">{STATE_LABELS[row.status] || row.status}</MtBadge>
                        : <MtBadge size="sm" variant="neutral">{row.tentative ? 'Proyectado (tentativo)' : 'Proyectado'}</MtBadge>}
                      <MtBadge size="sm" variant="neutral">Prioridad {PRIORITY_LABELS[row.priority] || row.priority}</MtBadge>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'capitalize' }}>{fmtDate(row.date)}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isOverdue ? 'var(--mt-danger)' : until <= 7 ? 'var(--mt-warning)' : 'var(--mt-text-tertiary)' }}>
                      {isOverdue ? `Vencida hace ${row.daysOverdue} día(s)` : until === 0 ? 'Hoy' : until === 1 ? 'Mañana' : `En ${until} días`}
                    </div>
                  </div>
                </div>
              </MtCard>
            );
          })}
        </div>
      )}

      {stats.meterPlans > 0 && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>
          {stats.meterPlans} plan(es) por contador no aparecen aquí porque dependen de lecturas, no de fechas.
        </p>
      )}
    </div>
  );
}
