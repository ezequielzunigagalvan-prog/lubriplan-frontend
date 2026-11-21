import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtButton, MtBadge } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Wrench, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';

const REFRESH_MS = 5 * 60 * 1000;
const PERIODS = [30, 90, 180];
const SPECIALTY_COLORS = ['#38BDF8', '#FBBF24', '#22C55E', '#F44152', '#A78BFA', '#FB923C', '#94A3B8'];

const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n || 0);

const pct = (value, max) => (max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);

const getKpiColor = (value, thresholds) => {
  if (value == null) return 'var(--mt-text-tertiary)';
  if (value >= thresholds.good) return 'var(--mt-success)';
  if (value >= thresholds.warning) return 'var(--mt-warning)';
  return 'var(--mt-danger)';
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: 'var(--mt-font-weight-bold)',
  textTransform: 'uppercase',
  color: 'var(--mt-text-tertiary)',
  margin: 0,
};
const hintStyle = { fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginTop: '4px' };
const titleStyle = { fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' };

function NoData({ text = 'Sin datos en el periodo' }) {
  return <p style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', margin: 0 }}>{text}</p>;
}

const woNumber = (n) => `OT-${String(n).padStart(5, '0')}`;
const fmtDay = (d) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

/** Aviso de atrasos: OTs preventivas/correctivas atrasadas y planes vencidos sin OT generada. */
function DelayAlerts({ data }) {
  const navigate = useNavigate();
  const overdue = data.overdueList || [];
  const plansDue = data.plans?.dueWithoutOrder || [];
  if (overdue.length === 0 && plansDue.length === 0) return null;

  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 0', borderTop: '1px solid rgba(244,65,82,0.15)' };
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)', borderLeft: '4px solid var(--mt-danger)', background: 'rgba(244, 65, 82, 0.05)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong style={{ color: 'var(--mt-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={18} />
            {overdue.length > 0 && `${overdue.length} orden(es) atrasada(s): ${data.overdueBreakdown.corrective} correctiva(s), ${data.overdueBreakdown.preventive} preventiva(s)`}
            {overdue.length > 0 && plansDue.length > 0 && ' · '}
            {plansDue.length > 0 && `${plansDue.length} plan(es) vencido(s) sin OT`}
          </strong>
          <div style={{ display: 'flex', gap: '6px' }}>
            {overdue.length > 0 && <MtButton size="sm" variant="secondary" onClick={() => navigate('/maintenance/app/work-orders?filter=overdue')}>Ver atrasadas</MtButton>}
            {plansDue.length > 0 && <MtButton size="sm" onClick={() => navigate('/maintenance/app/preventive-plans')}>Generar OTs en Planes</MtButton>}
          </div>
        </div>
        {overdue.slice(0, 5).map((o) => (
          <div key={`wo-${o.id}`} style={row}>
            <button onClick={() => navigate(`/maintenance/app/work-orders/${o.id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'var(--mt-text-primary)', fontSize: '13px' }}>
              <strong>{woNumber(o.number)}</strong> · {o.title}{o.asset ? ` · ${o.asset.code}` : ''}
            </button>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <MtBadge size="sm" variant={o.type === 'CORRECTIVE' ? 'danger' : 'info'}>{o.type === 'CORRECTIVE' ? 'Correctiva' : 'Preventiva'}</MtBadge>
              <span style={{ color: 'var(--mt-danger)', fontWeight: 800 }}>{o.daysOverdue} día(s)</span>
            </span>
          </div>
        ))}
        {plansDue.map((p) => (
          <div key={`plan-${p.id}`} style={row}>
            <span><strong>{p.code}</strong> · {p.title}{p.asset ? ` · ${p.asset.code}` : ''}</span>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <MtBadge size="sm" variant="warning">Plan sin OT</MtBadge>
              <span style={{ color: p.daysOverdue > 0 ? 'var(--mt-danger)' : 'var(--mt-warning)', fontWeight: 800 }}>
                {p.daysOverdue > 0 ? `${p.daysOverdue} día(s)` : 'vence hoy'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </MtCard>
  );
}

function CountCard({ icon: Icon, label, value, color, tint, note, accentBorder }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)', ...(accentBorder && { borderLeft: `4px solid ${color}` }) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
          <div style={{ width: '40px', height: '40px', background: tint, borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} style={{ color }} />
          </div>
          <p style={labelStyle}>{label}</p>
        </div>
        <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color }}>{value}</p>
        {note && <p style={{ fontSize: '11px', color, margin: 0, marginTop: '4px', fontWeight: 'var(--mt-font-weight-bold)' }}>{note}</p>}
      </div>
    </MtCard>
  );
}

function PercentCard({ label, value, thresholds, hint }) {
  const color = getKpiColor(value, thresholds);
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <p style={{ ...labelStyle, marginBottom: 'var(--mt-space-md)' }}>{label}</p>
        <p style={{ fontSize: value == null ? '20px' : '32px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, marginBottom: 'var(--mt-space-sm)', color }}>
          {value == null ? 'Sin datos' : `${value}%`}
        </p>
        <Bar value={value ?? 0} max={100} color={color} />
        {hint && <p style={hintStyle}>{hint}</p>}
      </div>
    </MtCard>
  );
}

function ValueCard({ label, value, hint, color }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <p style={{ ...labelStyle, marginBottom: 'var(--mt-space-md)' }}>{label}</p>
        <p style={{ fontSize: value == null ? '20px' : '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: value == null ? 'var(--mt-text-tertiary)' : color }}>
          {value == null ? 'Sin datos' : value}
        </p>
        {hint && <p style={hintStyle}>{hint}</p>}
      </div>
    </MtCard>
  );
}

function Bar({ value, max, color, height = '6px' }) {
  return (
    <div style={{ width: '100%', height, background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
      <div style={{ height: '100%', background: color, width: `${pct(value, max)}%`, transition: 'width 300ms ease' }} />
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <h3 style={titleStyle}>{title}</h3>
        {children}
      </div>
    </MtCard>
  );
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await maintenanceApi.getExecutiveDashboard({ days });
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Error loading executive dashboard:', err);
      setError(err?.message || 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando dashboard ejecutivo...</p>
        </div>
      </MtCard>
    );
  }

  if (!data) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <p style={{ color: 'var(--mt-danger)', margin: 0, fontWeight: 'var(--mt-font-weight-bold)' }}>Error cargando el dashboard</p>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0, fontSize: '13px' }}>{error}</p>
          <MtButton onClick={() => load()}>Reintentar</MtButton>
        </div>
      </MtCard>
    );
  }

  const cvp = data.correctiveVsPreventive;
  const cvpMax = Math.max(cvp.corrective, cvp.preventive, 1);
  const plantMax = Math.max(...data.maintenanceByPlant.map((p) => p.orders), 1);
  const downtimeMax = Math.max(...data.equipmentDowntime.map((e) => e.hours), 1);
  const costMax = Math.max(...data.monthlyCosts.map((m) => m.cost), 0);
  const updatedAt = new Date(data.generatedAt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--mt-space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={28} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
              Dashboard Ejecutivo
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              Indicadores de los últimos {data.periodDays} días · {data.activeAssets} activos registrados
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)' }}>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Periodo"
            style={{ height: '36px', padding: '0 10px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface)', color: 'var(--mt-text-primary)', fontSize: '13px' }}
          >
            {PERIODS.map((p) => <option key={p} value={p}>Últimos {p} días</option>)}
          </select>
          <MtButton size="sm" variant="secondary" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} /> Actualizar
          </MtButton>
        </div>
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-warning)' }}>
          No se pudo actualizar ({error}). Se muestran los datos de las {updatedAt.toLocaleTimeString('es-MX')}.
        </p>
      )}

      <DelayAlerts data={data} />

      {/* KPI Row 1: Órdenes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <CountCard icon={AlertCircle} label="Abiertas" value={data.openOrders} color="var(--mt-accent)" tint="rgba(56, 189, 248, 0.1)" />
        <CountCard icon={AlertTriangle} label="Correctivas" value={data.correctivePending} color="var(--mt-danger)" tint="rgba(244, 65, 82, 0.1)" />
        <CountCard
          icon={Wrench}
          label="Preventivas"
          value={data.preventivePending}
          color="var(--mt-warning)"
          tint="rgba(251, 191, 36, 0.1)"
          note={
            data.plans?.dueWithoutOrder?.length
              ? `+${data.plans.dueWithoutOrder.length} plan(es) vencidos sin OT`
              : `${data.plans?.active ?? 0} plan(es) activo(s)${data.plans?.next ? ` · próximo ${data.plans.next.code} ${fmtDay(data.plans.next.nextDueAt)}` : ''}`
          }
        />
        <CountCard
          icon={Clock}
          label="Atrasadas"
          value={data.overdueOrders}
          color={data.overdueOrders > 0 ? 'var(--mt-danger)' : 'var(--mt-success)'}
          tint="rgba(244, 65, 82, 0.15)"
          note={data.overdueOrders > 0 ? `${data.overdueBreakdown?.corrective ?? 0} correctivas · ${data.overdueBreakdown?.preventive ?? 0} preventivas` : 'Al día'}
          accentBorder
        />
        <CountCard icon={CheckCircle} label={`Completadas (${data.periodDays}d)`} value={data.completedOrders} color="var(--mt-success)" tint="rgba(34, 197, 94, 0.1)" />
      </div>

      {/* KPI Row 2: Métricas Operacionales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <PercentCard
          label="Cumplimiento Preventivo"
          value={data.preventiveCompliance}
          thresholds={{ good: 85, warning: 70 }}
          hint={
            data.preventiveDueCount
              ? `${data.preventiveDueCount} preventiva(s) con fecha en el periodo`
              : data.plans?.active
                ? `${data.plans.active} plan(es) activo(s)${data.plans.next ? ` · próximo ${data.plans.next.code} el ${fmtDay(data.plans.next.nextDueAt)}` : ''} · aún sin órdenes vencidas que medir`
                : 'No hay planes preventivos activos'
          }
        />
        <PercentCard
          label="Disponibilidad Operacional"
          value={data.operationalAvailability}
          thresholds={{ good: 95, warning: 90 }}
          hint={data.activeAssets ? 'Descontando paros por correctivos' : 'Sin activos registrados'}
        />
        <ValueCard label="MTTR (Horas)" value={data.mttr == null ? null : `${data.mttr}h`} hint="Tiempo promedio de reparación" />
        <ValueCard
          label="MTBF (Horas)"
          value={data.mtbf == null ? null : `${data.mtbf.toLocaleString('es-MX')}h`}
          hint={data.correctiveFailures ? `Tiempo entre fallas · ${data.correctiveFailures} fallas` : 'Sin fallas en el periodo'}
        />
        <ValueCard
          label="Backlog"
          value={data.maintenanceBacklog}
          color={data.maintenanceBacklog > 10 ? 'var(--mt-warning)' : 'var(--mt-success)'}
          hint="Órdenes pendientes sin iniciar"
        />
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ ...labelStyle, marginBottom: 'var(--mt-space-md)' }}>Costo del Mes</p>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>{money(data.maintenanceCosts)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              {data.costsTrend == null ? (
                <span style={hintStyle}>Refacciones consumidas · sin mes previo para comparar</span>
              ) : data.costsTrend <= 0 ? (
                <>
                  <TrendingDown size={14} style={{ color: 'var(--mt-success)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--mt-success)', fontWeight: 'var(--mt-font-weight-bold)' }}>
                    {Math.abs(data.costsTrend)}% vs mes anterior
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp size={14} style={{ color: 'var(--mt-danger)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--mt-danger)', fontWeight: 'var(--mt-font-weight-bold)' }}>
                    +{data.costsTrend}% vs mes anterior
                  </span>
                </>
              )}
            </div>
          </div>
        </MtCard>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <ChartCard title="Correctivos vs Preventivos (abiertas)">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--mt-space-lg)', height: '150px' }}>
            {[
              { key: 'corrective', label: 'Correctivos', color: 'var(--mt-danger)', gradient: 'linear-gradient(180deg, var(--mt-danger), var(--mt-warning))' },
              { key: 'preventive', label: 'Preventivos', color: 'var(--mt-info)', gradient: 'linear-gradient(180deg, var(--mt-info), var(--mt-accent))' },
            ].map((b) => (
              <div key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '60px', height: `${Math.max(4, (cvp[b.key] / cvpMax) * 100)}px`, background: b.gradient, borderRadius: 'var(--mt-radius-md)', marginBottom: 'var(--mt-space-md)' }} />
                <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>{b.label}</p>
                <p style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: b.color }}>{cvp[b.key]}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Mantenimiento por Planta">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {data.maintenanceByPlant.length === 0 && <NoData text="Sin plantas con Maintenance habilitado" />}
            {data.maintenanceByPlant.map((plant) => (
              <div key={plant.plantId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                    {plant.plant}{plant.current ? ' (actual)' : ''}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, whiteSpace: 'nowrap' }}>
                    {plant.orders} abiertas · {money(plant.cost)} este mes
                  </p>
                </div>
                <Bar value={plant.orders} max={plantMax} color="linear-gradient(90deg, var(--mt-accent), var(--mt-info))" />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Fallas por Equipo (Top 5)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
            {data.failuresByEquipment.length === 0 && <NoData text="Sin correctivos cerrados en el periodo" />}
            {data.failuresByEquipment.map((item) => (
              <div key={item.assetId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '12px', margin: 0, color: 'var(--mt-text-secondary)' }}>{item.equipment}</p>
                <span style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-danger)' }}>{item.failures}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Mayor Tiempo de Paro">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
            {data.equipmentDowntime.length === 0 && <NoData text="Sin paros registrados en el periodo" />}
            {data.equipmentDowntime.map((item) => (
              <div key={item.assetId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{item.equipment}</p>
                  <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-warning)', margin: 0 }}>{item.hours}h</p>
                </div>
                <Bar value={item.hours} max={downtimeMax} color="var(--mt-warning)" height="4px" />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Costo de Refacciones (6 meses)">
          {costMax === 0 ? (
            <NoData text="Sin refacciones consumidas en OTs cerradas" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', gap: '8px' }}>
              {data.monthlyCosts.map((item) => (
                <div key={`${item.year}-${item.month}`} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ height: `${Math.max(2, (item.cost / costMax) * 80)}px`, background: 'linear-gradient(180deg, var(--mt-accent), var(--mt-accent-strong))', borderRadius: 'var(--mt-radius-sm)', marginBottom: '8px' }} />
                  <p style={{ fontSize: '11px', margin: 0, color: 'var(--mt-text-secondary)' }}>{item.month}</p>
                  <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{money(item.cost)}</p>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Cumplimiento por Plan (menor primero)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {data.maintenanceCompliance.length === 0 && <NoData text="Sin preventivas de planes vencidas en el periodo" />}
            {data.maintenanceCompliance.map((item) => {
              const color = item.compliance >= 85 ? 'var(--mt-success)' : item.compliance >= 75 ? 'var(--mt-warning)' : 'var(--mt-danger)';
              return (
                <div key={item.planId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{item.plan}</p>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, whiteSpace: 'nowrap' }}>
                      {item.compliance}% <span style={{ color: 'var(--mt-text-tertiary)', fontWeight: 'normal' }}>({item.orders})</span>
                    </p>
                  </div>
                  <Bar value={item.compliance} max={100} color={color} />
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Órdenes Abiertas por Especialidad">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {data.ordersBySpecialty.length === 0 && <NoData text="Sin órdenes abiertas" />}
            {data.ordersBySpecialty.map((item, idx) => (
              <div key={item.specialty} style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
                <div style={{ width: '12px', height: '12px', background: SPECIALTY_COLORS[idx % SPECIALTY_COLORS.length], borderRadius: '2px' }} />
                <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, flex: 1 }}>{item.specialty}</p>
                <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>{item.orders}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Footer */}
      <div style={{ padding: 'var(--mt-space-lg)', background: 'var(--mt-bg-surface)', borderRadius: 'var(--mt-radius-md)', marginTop: 'var(--mt-space-xl)' }}>
        <p style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', margin: 0, textAlign: 'center' }}>
          Se actualiza automáticamente cada 5 minutos. Último update: {updatedAt.toLocaleString('es-MX')}
        </p>
      </div>
    </div>
  );
}
