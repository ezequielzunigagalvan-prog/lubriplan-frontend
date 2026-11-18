import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import { Activity, AlertTriangle, CheckCircle2, Clock, DollarSign, Gauge, Wrench, ClipboardCheck } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { maintenanceApi } from '../services/maintenanceApi';
import { ASSET_CRITICALITY_INFO } from '../constants/maintenance';
import '../ui/tokens.css';

const PERIODS = [30, 90, 180, 365];
const COLORS = { accent: '#38BDF8', success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6' };
const RISK = {
  CRITICAL: { label: 'Crítico', badge: 'danger', color: 'var(--mt-danger)' },
  WARNING: { label: 'Atención', badge: 'warning', color: 'var(--mt-warning)' },
  OK: { label: 'Estable', badge: 'success', color: 'var(--mt-success)' },
};

const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0);
const orDash = (v, suffix = '') => (v == null ? '—' : `${v}${suffix}`);
const sectionTitle = { fontSize: '16px', fontWeight: '900', margin: '0 0 var(--mt-space-lg) 0' };
const chartTitle = { fontSize: '13px', fontWeight: '900', margin: '0 0 var(--mt-space-lg) 0' };

function Kpi({ icon: Icon, label, value, hint, color = 'var(--mt-text-primary)' }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Icon size={16} style={{ color }} />
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', textTransform: 'uppercase' }}>{label}</div>
        </div>
        <div style={{ fontSize: value === '—' ? '20px' : '26px', fontWeight: '900', color: value === '—' ? 'var(--mt-text-tertiary)' : color }}>{value}</div>
        {hint && <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>{hint}</div>}
      </div>
    </MtCard>
  );
}

function ChartCard({ title, children, empty }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <h3 style={chartTitle}>{title}</h3>
        {empty ? (
          <p style={{ margin: 0, height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>{empty}</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>{children}</ResponsiveContainer>
        )}
      </div>
    </MtCard>
  );
}

export default function EquipmentAnalytics() {
  const navigate = useNavigate();
  const [days, setDays] = useState(90);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filterCriticality, setFilterCriticality] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await maintenanceApi.getEquipmentAnalytics({ days }));
    } catch (err) {
      console.error('[EquipmentAnalytics] Error loading analytics:', err);
      setError(err?.data?.error || err?.message || 'No se pudo cargar la analítica');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const equipment = useMemo(
    () =>
      (data?.equipment || []).filter(
        (e) => (filterCriticality === 'all' || e.criticality === filterCriticality) && (filterRisk === 'all' || e.risk === filterRisk)
      ),
    [data, filterCriticality, filterRisk]
  );
  const selected = data?.equipment.find((e) => e.id === selectedId) || equipment[0] || null;

  if (loading && !data) {
    return (
      <MtCard elevated>
        <p style={{ padding: 'var(--mt-space-3xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-secondary)' }}>Calculando analítica...</p>
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

  const { summary, kpis, monthly } = data;
  const topFailures = [...data.equipment].filter((e) => e.failures > 0 || e.corrective > 0).slice(0, 8).map((e) => ({ name: e.code, Fallas: e.failures, Correctivas: e.corrective }));
  const hasMonthlyActivity = monthly.some((m) => m.orders > 0 || m.cost > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)', opacity: loading ? 0.6 : 1 }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>Analítica de Equipos</h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Confiabilidad, costos y fallas de {summary.equipmentCount} equipo(s) en los últimos {data.periodDays} días
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Periodo"
          style={{ padding: '8px 12px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface)', color: 'var(--mt-text-primary)' }}
        >
          {PERIODS.map((p) => <option key={p} value={p}>Últimos {p} días</option>)}
        </select>
      </div>

      {/* KPIs de planta */}
      <div>
        <h2 style={sectionTitle}>Indicadores de planta</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          <Kpi icon={Gauge} label="Disponibilidad" value={orDash(kpis.availability, '%')} hint="Descontando paros por correctivos" color={kpis.availability >= 95 ? 'var(--mt-success)' : 'var(--mt-warning)'} />
          <Kpi icon={Activity} label="MTBF" value={orDash(kpis.mtbf?.toLocaleString('es-MX'), 'h')} hint={kpis.failures ? `${kpis.failures} falla(s) cerradas` : 'Sin fallas cerradas'} />
          <Kpi icon={Clock} label="MTTR" value={orDash(kpis.mttr, 'h')} hint="Tiempo medio de reparación" />
          <Kpi icon={Wrench} label="% Preventivo" value={orDash(kpis.preventiveRatio, '%')} hint="De las órdenes terminadas" color="var(--mt-info)" />
          <Kpi icon={ClipboardCheck} label="Cumplimiento planes" value={orDash(kpis.planCompliance, '%')} hint="Preventivas a tiempo" color="var(--mt-success)" />
          <Kpi icon={DollarSign} label="Costo refacciones" value={money(summary.partsCost)} hint={`${summary.finishedOrders} OT terminadas`} />
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <Kpi icon={Wrench} label="Órdenes en el periodo" value={summary.totalOrders} hint={`${summary.preventive} preventivas · ${summary.corrective} correctivas`} />
        <Kpi icon={AlertTriangle} label="Órdenes abiertas" value={summary.openOrders} color="var(--mt-warning)" />
        <Kpi icon={Clock} label="Horas de paro" value={orDash(summary.downtimeHours, 'h')} color="var(--mt-danger)" />
        <Kpi icon={AlertTriangle} label="Equipos críticos" value={summary.risk.CRITICAL} hint={`${summary.risk.WARNING} en atención · ${summary.risk.OK} estables`} color={summary.risk.CRITICAL ? 'var(--mt-danger)' : 'var(--mt-success)'} />
      </div>

      {/* Gráficas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <ChartCard title="Órdenes por mes (preventivo vs correctivo)" empty={!hasMonthlyActivity && 'Sin órdenes en el periodo'}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="preventive" name="Preventivas" stackId="a" fill={COLORS.info} />
            <Bar dataKey="corrective" name="Correctivas" stackId="a" fill={COLORS.danger} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Costo de refacciones y horas de paro por mes" empty={!monthly.some((m) => m.cost > 0 || m.downtime > 0) && 'Sin costos ni paros registrados'}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis yAxisId="cost" fontSize={12} />
            <YAxis yAxisId="hours" orientation="right" fontSize={12} />
            <Tooltip formatter={(v, name) => (name === 'Costo' ? money(v) : `${v}h`)} />
            <Legend />
            <Line yAxisId="cost" type="monotone" dataKey="cost" name="Costo" stroke={COLORS.accent} strokeWidth={2} />
            <Line yAxisId="hours" type="monotone" dataKey="downtime" name="Paro (h)" stroke={COLORS.warning} strokeWidth={2} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Equipos con más correctivas" empty={topFailures.length === 0 && 'Sin correctivas en el periodo'}>
          <BarChart data={topFailures} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis type="number" allowDecimals={false} fontSize={12} />
            <YAxis type="category" dataKey="name" width={80} fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Correctivas" fill={COLORS.warning} />
            <Bar dataKey="Fallas" name="Fallas cerradas" fill={COLORS.danger} />
          </BarChart>
        </ChartCard>
      </div>

      {/* Equipos */}
      <div>
        <h2 style={sectionTitle}>Equipos</h2>
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', flexWrap: 'wrap', marginBottom: 'var(--mt-space-lg)' }}>
          {['all', 'A', 'B', 'C'].map((c) => (
            <MtButton key={c} size="sm" variant={filterCriticality === c ? 'primary' : 'secondary'} onClick={() => setFilterCriticality(c)}>
              {c === 'all' ? 'Toda criticidad' : ASSET_CRITICALITY_INFO[c].label}
            </MtButton>
          ))}
          {['all', 'CRITICAL', 'WARNING', 'OK'].map((r) => (
            <MtButton key={r} size="sm" variant={filterRisk === r ? 'primary' : 'secondary'} onClick={() => setFilterRisk(r)}>
              {r === 'all' ? 'Todo estado' : RISK[r].label}
            </MtButton>
          ))}
        </div>

        {equipment.length === 0 ? (
          <MtCard elevated>
            <p style={{ padding: 'var(--mt-space-xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-tertiary)' }}>
              {summary.equipmentCount === 0 ? 'Aún no hay equipos registrados.' : 'Ningún equipo coincide con los filtros.'}
            </p>
          </MtCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(320px, 2fr)', gap: 'var(--mt-space-lg)', alignItems: 'start' }}>
            {/* Lista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
              {equipment.map((e) => (
                <MtCard key={e.id} elevated interactive onClick={() => setSelectedId(e.id)}>
                  <div style={{ padding: 'var(--mt-space-md)', borderLeft: `4px solid ${RISK[e.risk].color}`, background: selected?.id === e.id ? 'rgba(56,189,248,0.08)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>{e.code} · {e.name}</strong>
                      <MtBadge size="sm" variant={RISK[e.risk].badge}>{RISK[e.risk].label}</MtBadge>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>
                      {e.totalOrders} OT · {e.corrective} correctivas · Disp. {orDash(e.availability, '%')}
                    </div>
                  </div>
                </MtCard>
              ))}
            </div>

            {/* Detalle */}
            {selected && (
              <MtCard elevated>
                <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--mt-space-md)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{selected.name}</h2>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                        {selected.code}{selected.location ? ` · ${selected.location}` : ''}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <MtBadge size="sm" variant={RISK[selected.risk].badge}>{RISK[selected.risk].label}</MtBadge>
                        {selected.criticality && <MtBadge size="sm" variant={ASSET_CRITICALITY_INFO[selected.criticality].badge}>{ASSET_CRITICALITY_INFO[selected.criticality].label}</MtBadge>}
                      </div>
                    </div>
                    <MtButton size="sm" variant="secondary" onClick={() => navigate(`/maintenance/app/assets/${selected.id}`)}>Ver expediente</MtButton>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--mt-space-md)' }}>
                    {[
                      ['Disponibilidad', orDash(selected.availability, '%')],
                      ['MTBF', orDash(selected.mtbf?.toLocaleString('es-MX'), 'h')],
                      ['MTTR', orDash(selected.mttr, 'h')],
                      ['Paro', orDash(selected.downtimeHours, 'h')],
                      ['Fallas (30d)', selected.failures30d],
                      ['OT abiertas', selected.openOrders],
                      ['Cumpl. planes', orDash(selected.planCompliance, '%')],
                      ['Refacciones', money(selected.partsCost)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>{label}</div>
                        <div style={{ fontSize: '16px', fontWeight: 900 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 style={chartTitle}>Tendencia mensual</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={selected.monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="preventive" name="Preventivas" stackId="a" fill={COLORS.info} />
                        <Bar dataKey="corrective" name="Correctivas" stackId="a" fill={COLORS.danger} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--mt-space-lg)' }}>
                    <div>
                      <h3 style={chartTitle}>Modos de falla</h3>
                      {selected.failureModes.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Sin correctivas en el periodo.</p>
                      ) : (
                        selected.failureModes.map((m) => (
                          <div key={m.mode} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                            <span>{m.mode}</span>
                            <strong>{m.count}</strong>
                          </div>
                        ))
                      )}
                    </div>
                    <div>
                      <h3 style={chartTitle}>Técnicos</h3>
                      {selected.technicians.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Sin trabajos terminados con técnico asignado.</p>
                      ) : (
                        selected.technicians.map((t) => (
                          <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                            <span>{t.name}</span>
                            <span><strong>{t.interventions}</strong> OT · {t.hours}h</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </MtCard>
            )}
          </div>
        )}
      </div>

      <p style={{ margin: 0, fontSize: '11px', color: 'var(--mt-text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <CheckCircle2 size={12} /> Calculado con órdenes reales. Disponibilidad y MTBF solo descuentan paros de correctivas cerradas; los costos incluyen solo refacciones.
      </p>
    </div>
  );
}
