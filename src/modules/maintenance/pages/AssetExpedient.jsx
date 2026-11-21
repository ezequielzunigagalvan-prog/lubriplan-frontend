import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { MtCard, MtBadge, MtButton } from '../ui';
import { ArrowLeft, FileText, Wrench, AlertCircle, DollarSign, Clock, CalendarCheck, ChevronRight } from 'lucide-react';
import {
  STATE_LABELS,
  PRIORITY_LABELS,
  ASSET_LEVEL_LABELS,
  ASSET_STATUS_INFO,
  ASSET_CRITICALITY_INFO,
} from '../constants/maintenance';

const TYPE_INFO = {
  CORRECTIVE: { label: 'Correctiva', badge: 'danger' },
  PREVENTIVE: { label: 'Preventiva', badge: 'info' },
  INSPECTION: { label: 'Inspección', badge: 'accent' },
};
const FREQ_LABELS = { DAY: 'día(s)', WEEK: 'semana(s)', MONTH: 'mes(es)', YEAR: 'año(s)' };
const PRODUCTION_EFFECT = { TOTAL_STOP: 'Paro total', PARTIAL_STOP: 'Paro parcial', NO_EFFECT: 'Sin efecto' };

const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const woNumber = (n) => `OT-${String(n).padStart(5, '0')}`;

const labelStyle = { fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' };
const valueStyle = { fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 };

function Field({ label, value }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={{ ...valueStyle, color: value ? 'var(--mt-text-primary)' : 'var(--mt-text-tertiary)' }}>{value || '—'}</p>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-md)' }}>
          <Icon size={16} style={{ color }} />
          <p style={{ ...labelStyle, marginBottom: 0 }}>{label}</p>
        </div>
        <p style={{ fontSize: '22px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color }}>{value}</p>
      </div>
    </MtCard>
  );
}

function Empty({ text }) {
  return (
    <MtCard elevated>
      <p style={{ padding: 'var(--mt-space-xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>{text}</p>
    </MtCard>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{children}</h3>;
}

export default function AssetExpedient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await maintenanceApi.getAssetExpedient(id));
    } catch (err) {
      console.error('[AssetExpedient] Error loading expedient:', err);
      setError(err?.status === 404 ? 'El activo no existe o fue eliminado' : err?.message || 'No se pudo cargar el expediente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setActiveTab('overview');
    load();
  }, [load]);

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando expediente...</p>
        </div>
      </MtCard>
    );
  }

  if (error || !data) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <p style={{ color: 'var(--mt-danger)', margin: 0, fontWeight: 'var(--mt-font-weight-bold)' }}>{error || 'Sin datos'}</p>
          <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
            <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/assets')}>Volver a activos</MtButton>
            <MtButton onClick={load}>Reintentar</MtButton>
          </div>
        </div>
      </MtCard>
    );
  }

  const { asset, kpis, children, plans, maintenanceOrders, failureHistory, spareParts, photos, monthlyCosts } = data;
  const statusInfo = ASSET_STATUS_INFO[asset.status];
  const critInfo = ASSET_CRITICALITY_INFO[asset.criticality];
  const breadcrumb = [asset.plantName, ...asset.path.map((p) => `${p.code} · ${p.name}`)].filter(Boolean);
  const maxMonthCost = Math.max(...monthlyCosts.map((m) => m.cost), 0);
  const openWo = (woId) => navigate(`/maintenance/app/work-orders/${woId}`);

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'maintenance', label: `Órdenes (${maintenanceOrders.length})` },
    { id: 'failures', label: `Fallas (${failureHistory.length})` },
    { id: 'spareparts', label: `Refacciones (${spareParts.length})` },
    { id: 'costs', label: 'Costos' },
    { id: 'photos', label: `Fotos (${photos.length})` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', borderRadius: 'var(--mt-radius-md)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--mt-text-secondary)' }} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>{asset.name}</h1>
          <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            {asset.code} · {ASSET_LEVEL_LABELS[asset.level] || asset.level}
            {breadcrumb.length > 0 && ` · ${breadcrumb.join(' → ')}`}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--mt-space-sm)' }}>
          {critInfo && <MtBadge variant={critInfo.badge} size="sm">{critInfo.label}</MtBadge>}
          {statusInfo && <MtBadge variant={statusInfo.badge} size="sm">{statusInfo.label}</MtBadge>}
        </div>
      </div>

      {/* Ficha técnica */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          <Field label="Fabricante" value={asset.manufacturer} />
          <Field label="Modelo" value={asset.model} />
          <Field label="Número de serie" value={asset.serialNumber} />
          <Field label="Instalado" value={asset.installedAt ? fmtDate(asset.installedAt) : null} />
          <Field label="Ubicación" value={asset.location} />
          <Field label="Última intervención" value={kpis.lastIntervention ? fmtDate(kpis.lastIntervention) : null} />
        </div>
        {asset.notes && (
          <p style={{ margin: 0, padding: '0 var(--mt-space-lg) var(--mt-space-lg)', fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
            <strong>Notas:</strong> {asset.notes}
          </p>
        )}
      </MtCard>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <Kpi icon={FileText} label="Órdenes totales" value={kpis.totalWorkOrders} color="var(--mt-accent)" />
        <Kpi icon={AlertCircle} label="Abiertas" value={kpis.openWorkOrders} color={kpis.openWorkOrders ? 'var(--mt-warning)' : 'var(--mt-success)'} />
        <Kpi icon={Wrench} label="Preventivas" value={kpis.preventiveOrders} color="var(--mt-info)" />
        <Kpi icon={AlertCircle} label="Correctivas" value={kpis.correctiveOrders} color="var(--mt-danger)" />
        <Kpi icon={Clock} label="Paro total" value={`${kpis.totalDowntimeHours}h`} color="var(--mt-text-primary)" />
        <Kpi icon={DollarSign} label="Costo refacciones" value={money(kpis.accumulatedPartsCost)} color="var(--mt-success)" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', borderBottom: '1px solid var(--mt-border)', overflowX: 'auto', paddingBottom: 'var(--mt-space-md)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--mt-accent)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--mt-text-secondary)',
              cursor: 'pointer',
              borderRadius: 'var(--mt-radius-md)',
              fontWeight: 'var(--mt-font-weight-bold)',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 'var(--mt-space-lg)' }}>
          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
              <SectionTitle>Planes de mantenimiento ({plans.length})</SectionTitle>
              {plans.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Este activo no tiene planes preventivos.</p>}
              {plans.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <p style={{ ...valueStyle, fontSize: '13px' }}>{p.code} · {p.title}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>
                      {p.frequencyEvery && p.frequencyUnit ? `Cada ${p.frequencyEvery} ${FREQ_LABELS[p.frequencyUnit] || p.frequencyUnit}` : 'Sin frecuencia'}
                      {' · '}Próxima: {fmtDate(p.nextDueAt)}
                    </p>
                  </div>
                  <MtBadge variant={p.active ? 'success' : 'neutral'} size="sm">{p.active ? 'Activo' : 'Inactivo'}</MtBadge>
                </div>
              ))}
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
              <SectionTitle>Componentes / activos hijos ({children.length})</SectionTitle>
              {children.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>No tiene activos hijos registrados.</p>}
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/maintenance/app/assets/${c.id}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)' }}>
                    {c.code} · {c.name}{' '}
                    <span style={{ fontWeight: 'normal', color: 'var(--mt-text-tertiary)' }}>({ASSET_LEVEL_LABELS[c.level] || c.level})</span>
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--mt-text-tertiary)' }} />
                </button>
              ))}
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
              <SectionTitle>Órdenes recientes</SectionTitle>
              {maintenanceOrders.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Sin órdenes de trabajo.</p>}
              {maintenanceOrders.slice(0, 5).map((o) => (
                <button
                  key={o.id}
                  onClick={() => openWo(o.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                >
                  <span style={{ fontSize: '13px' }}>
                    <strong>{woNumber(o.number)}</strong> · {o.title}
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>
                      {fmtDate(o.createdAt)} · {STATE_LABELS[o.status] || o.status}
                    </span>
                  </span>
                  <MtBadge variant={TYPE_INFO[o.type]?.badge} size="sm">{TYPE_INFO[o.type]?.label || o.type}</MtBadge>
                </button>
              ))}
            </div>
          </MtCard>
        </div>
      )}

      {/* Órdenes */}
      {activeTab === 'maintenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          {maintenanceOrders.length === 0 && <Empty text="Este activo todavía no tiene órdenes de trabajo." />}
          {maintenanceOrders.map((order) => (
            <MtCard key={order.id} elevated interactive onClick={() => openWo(order.id)}>
              <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--mt-space-md)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', alignItems: 'center', marginBottom: 'var(--mt-space-sm)', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>{woNumber(order.number)}</p>
                    <MtBadge variant={TYPE_INFO[order.type]?.badge} size="sm">{TYPE_INFO[order.type]?.label || order.type}</MtBadge>
                    <MtBadge variant="neutral" size="sm">{STATE_LABELS[order.status] || order.status}</MtBadge>
                    <MtBadge variant="neutral" size="sm">Prioridad {PRIORITY_LABELS[order.priority] || order.priority}</MtBadge>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>{order.title}</p>
                  {order.description && <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>{order.description}</p>}
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                    Creada {fmtDate(order.createdAt)}
                    {order.finishedAt && ` · Terminada ${fmtDate(order.finishedAt)}`}
                    {' · '}Técnico: {order.technician || 'Sin asignar'}
                    {order.downtimeHours > 0 && ` · Paro ${order.downtimeHours}h`}
                  </p>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)', whiteSpace: 'nowrap' }}>
                  {money(order.partsCost)}
                </p>
              </div>
            </MtCard>
          ))}
        </div>
      )}

      {/* Fallas */}
      {activeTab === 'failures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          {failureHistory.length === 0 && <Empty text="Sin órdenes correctivas registradas para este activo." />}
          {failureHistory.map((f) => (
            <MtCard key={f.id} elevated interactive onClick={() => openWo(f.workOrderId)}>
              <div style={{ padding: 'var(--mt-space-lg)', borderLeft: `4px solid ${['CRITICAL', 'HIGH'].includes(f.priority) ? 'var(--mt-danger)' : 'var(--mt-warning)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--mt-space-sm)', gap: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>
                      {f.mode ? `${f.mode.code} · ${f.mode.name}` : f.title}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {woNumber(f.number)} · {fmtDate(f.date)} · {STATE_LABELS[f.status] || f.status}
                    </p>
                  </div>
                  <MtBadge variant={['CRITICAL', 'HIGH'].includes(f.priority) ? 'danger' : 'warning'} size="sm">
                    {PRIORITY_LABELS[f.priority] || f.priority}
                  </MtBadge>
                </div>
                {f.mechanism && <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}><strong>Mecanismo:</strong> {f.mechanism.code} · {f.mechanism.name}</p>}
                {(f.rootCause || f.cause) && (
                  <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                    <strong>Causa:</strong> {f.rootCause ? `${f.rootCause.code} · ${f.rootCause.name}` : f.cause}
                  </p>
                )}
                {f.diagnosis && <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}><strong>Diagnóstico:</strong> {f.diagnosis}</p>}
                <div style={{ display: 'flex', gap: 'var(--mt-space-lg)', fontSize: '12px', marginTop: 'var(--mt-space-sm)', color: 'var(--mt-text-secondary)', flexWrap: 'wrap' }}>
                  <span>Paro: {f.downtimeHours}h</span>
                  {f.productionEffect && <span>Efecto: {PRODUCTION_EFFECT[f.productionEffect] || f.productionEffect}</span>}
                  <span>Refacciones: {money(f.partsCost)}</span>
                </div>
              </div>
            </MtCard>
          ))}
        </div>
      )}

      {/* Refacciones */}
      {activeTab === 'spareparts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          {spareParts.length === 0 && <Empty text="No se han consumido refacciones en las órdenes de este activo." />}
          {spareParts.map((part) => (
            <MtCard key={part.id} elevated>
              <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>{part.code} · {part.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                    {part.quantity} {part.unit || 'pza'} × {money(part.unitCost)} · {woNumber(part.workOrderNumber)} · {fmtDate(part.date)}
                  </p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)' }}>{money(part.total)}</p>
              </div>
            </MtCard>
          ))}
        </div>
      )}

      {/* Costos */}
      {activeTab === 'costs' && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <SectionTitle>Costo de refacciones por mes (últimos 12 meses)</SectionTitle>
            {maxMonthCost === 0 ? (
              <p style={{ margin: 'var(--mt-space-lg) 0 0', fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>
                Sin costos registrados: las refacciones consumidas en órdenes terminadas aparecerán aquí.
              </p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px', marginTop: 'var(--mt-space-lg)' }}>
                {monthlyCosts.map((m) => (
                  <div key={`${m.year}-${m.month}`} style={{ flex: 1, textAlign: 'center' }} title={`${m.month} ${m.year}: ${money(m.cost)} (${m.orders} OT)`}>
                    <div style={{ height: `${Math.max(2, (m.cost / maxMonthCost) * 120)}px`, background: 'linear-gradient(180deg, var(--mt-accent), var(--mt-accent-strong))', borderRadius: 'var(--mt-radius-sm)', marginBottom: '6px' }} />
                    <p style={{ fontSize: '10px', margin: 0, color: 'var(--mt-text-secondary)' }}>{m.month}</p>
                  </div>
                ))}
              </div>
            )}
            <p style={{ margin: 'var(--mt-space-md) 0 0', fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>
              Solo incluye refacciones; la mano de obra todavía no se registra en las órdenes.
            </p>
          </div>
        </MtCard>
      )}

      {/* Fotos */}
      {activeTab === 'photos' && (
        photos.length === 0 ? (
          <Empty text="Sin fotografías: las fotos que se suban a las órdenes de este activo aparecerán aquí." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--mt-space-lg)' }}>
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                style={{ background: 'var(--mt-bg-surface)', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}
              >
                <img src={photo.url} alt={photo.title} loading="lazy" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: 'var(--mt-space-sm)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{woNumber(photo.workOrderNumber)} · {photo.kind}</p>
                  <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0 }}>{fmtDate(photo.date)}</p>
                </div>
              </a>
            ))}
          </div>
        )
      )}
    </div>
  );
}
