import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { AlertTriangle, ClipboardCheck, Clock, Library, Plus } from 'lucide-react';
import { MtCard, MtBadge, MtButton } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { useAuth } from '../../../context/AuthContext';

const PERIODS = [
  { value: 90, label: 'Últimos 3 meses' },
  { value: 180, label: 'Últimos 6 meses' },
  { value: 365, label: 'Último año' },
];
const CATEGORIES = [
  { value: 'FAILURE_MODE', label: 'Modos de falla', hint: 'Qué se observó (fuga, ruido, vibración…)' },
  { value: 'MECHANISM', label: 'Mecanismos', hint: 'Cómo ocurrió (desgaste, fatiga, corrosión…)' },
  { value: 'ROOT_CAUSE', label: 'Causas raíz', hint: 'Por qué ocurrió (lubricación, operación, diseño…)' },
];
const EFFECTS = { TOTAL_STOP: 'Paro total', PARTIAL_STOP: 'Paro parcial', NO_EFFECT: 'Sin efecto', UNKNOWN: 'No registrado' };
const errorMessage = (err, fallback) => err?.data?.error || err?.message || fallback;
const inputStyle = { padding: '8px 10px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', fontSize: '13px' };

function Kpi({ icon: Icon, label, value, hint, color = 'var(--mt-text-primary)' }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Icon size={16} style={{ color }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mt-text-tertiary)', textTransform: 'uppercase' }}>{label}</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color }}>{value}</div>
        {hint && <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>{hint}</div>}
      </div>
    </MtCard>
  );
}

/** Pareto: barras = cantidad de fallas, línea = % acumulado. */
function ParetoCard({ title, rows }) {
  const data = rows.map((r) => ({ name: r.code || 'Sin clasif.', label: r.name, Fallas: r.count, Acumulado: r.cumulative, horas: r.downtimeHours }));
  const onlyUnclassified = rows.length === 1 && !rows[0].id;
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <h3 style={{ margin: '0 0 var(--mt-space-md)', fontSize: '13px', fontWeight: 900 }}>{title}</h3>
        {rows.length === 0 ? (
          <p style={{ margin: 0, height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>Sin correctivas en el periodo</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis yAxisId="c" allowDecimals={false} fontSize={11} />
                <YAxis yAxisId="p" orientation="right" domain={[0, 100]} unit="%" fontSize={11} />
                <Tooltip formatter={(v, n) => (n === 'Acumulado' ? `${v}%` : v)} labelFormatter={(_, p) => p?.[0]?.payload?.label || ''} />
                <Bar yAxisId="c" dataKey="Fallas" fill="#EF4444" />
                <Line yAxisId="p" type="monotone" dataKey="Acumulado" stroke="#38BDF8" strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
            {onlyUnclassified && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--mt-warning)' }}>
                Ninguna correctiva está clasificada todavía: clasifícalas en el detalle de cada OT para ver el Pareto real.
              </p>
            )}
          </>
        )}
      </div>
    </MtCard>
  );
}

function CatalogColumn({ category, codes, canEdit, onCreate, onToggle }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return toast.error('Código y nombre son requeridos');
    setSaving(true);
    const ok = await onCreate({ code: code.trim(), name: name.trim(), category: category.value });
    setSaving(false);
    if (ok) {
      setCode('');
      setName('');
    }
  };

  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900 }}>{category.label} ({codes.filter((c) => c.status === 'ACTIVE').length})</h3>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>{category.hint}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
          {codes.length === 0 && <em style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Sin códigos</em>}
          {codes.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: c.status === 'ACTIVE' ? 1 : 0.5 }}>
              <span>
                <code style={{ color: 'var(--mt-accent)', fontWeight: 700 }}>{c.code}</code> {c.name}
                {c.isBaseCode && <MtBadge size="sm" variant="neutral">ISO</MtBadge>}
              </span>
              {canEdit && (
                <button
                  onClick={() => onToggle(c)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.status === 'ACTIVE' ? 'var(--mt-text-tertiary)' : 'var(--mt-success)', fontSize: '11px', fontWeight: 700 }}
                >
                  {c.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                </button>
              )}
            </div>
          ))}
        </div>
        {canEdit && (
          <form onSubmit={submit} style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--mt-border)', paddingTop: '8px' }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código" style={{ ...inputStyle, width: '90px' }} aria-label={`Código de ${category.label}`} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" style={{ ...inputStyle, flex: 1, minWidth: 0 }} aria-label={`Nombre de ${category.label}`} />
            <MtButton type="submit" size="sm" disabled={saving} aria-label="Agregar código"><Plus size={14} /></MtButton>
          </form>
        )}
      </div>
    </MtCard>
  );
}

/** Pestaña "Fallas" de Analítica: análisis de Pareto + catálogo de códigos ISO 14224. */
export default function FailureAnalysisPanel() {
  const { isAdmin, isSupervisor } = useAuth();
  const canEdit = isAdmin || isSupervisor;
  const [days, setDays] = useState(180);
  const [analysis, setAnalysis] = useState(null);
  const [catalog, setCatalog] = useState({ FAILURE_MODE: [], MECHANISM: [], ROOT_CAUSE: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [a, codes] = await Promise.all([
        maintenanceApi.getFailureAnalysis({ days }),
        maintenanceApi.getFailureCodes({ status: 'ALL' }),
      ]);
      setAnalysis(a);
      setCatalog({ FAILURE_MODE: [], MECHANISM: [], ROOT_CAUSE: [], ...codes });
    } catch (err) {
      console.error('[FailureAnalysisPanel] Error loading:', err);
      setError(errorMessage(err, 'No se pudo cargar el análisis de fallas'));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const createCode = async (data) => {
    try {
      await maintenanceApi.createFailureCode(data);
      toast.success(`Código ${data.code.toUpperCase()} agregado`);
      await load();
      return true;
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo crear el código'));
      return false;
    }
  };

  const toggleCode = async (code) => {
    try {
      await maintenanceApi.updateFailureCode(code.id, { status: code.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo actualizar el código'));
    }
  };

  const seed = async () => {
    try {
      setSeeding(true);
      const r = await maintenanceApi.seedFailureCodes();
      toast.success(`Catálogo base cargado: ${r?.created ?? 0} código(s) nuevos`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo cargar el catálogo base'));
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !analysis) return <p style={{ color: 'var(--mt-text-secondary)' }}>Cargando análisis de fallas...</p>;
  if (error) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--mt-danger)', fontWeight: 700 }}>{error}</span>
          <MtButton size="sm" onClick={load}>Reintentar</MtButton>
        </div>
      </MtCard>
    );
  }

  const { summary } = analysis;
  const catalogEmpty = summary.catalogSize === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-xl)', opacity: loading ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
          Órdenes correctivas creadas en el periodo, clasificadas con los códigos ISO 14224 de la planta.
        </p>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Periodo de fallas" style={inputStyle}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <Kpi icon={AlertTriangle} label="Correctivas" value={summary.correctives} hint={`${summary.closed} cerradas`} color="var(--mt-danger)" />
        <Kpi
          icon={ClipboardCheck}
          label="Clasificadas"
          value={summary.classifiedPercent == null ? '—' : `${summary.classifiedPercent}%`}
          hint={`${summary.unclassified} sin modo de falla`}
          color={summary.classifiedPercent >= 80 ? 'var(--mt-success)' : 'var(--mt-warning)'}
        />
        <Kpi icon={Clock} label="Horas de paro" value={`${summary.downtimeHours}h`} color="var(--mt-warning)" />
        <Kpi icon={Library} label="Códigos en catálogo" value={summary.catalogSize} color="var(--mt-accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 'var(--mt-space-lg)' }}>
        <ParetoCard title="Pareto de modos de falla" rows={analysis.modes} />
        <ParetoCard title="Pareto de causas raíz" rows={analysis.rootCauses} />
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ margin: '0 0 var(--mt-space-md)', fontSize: '13px', fontWeight: 900 }}>Equipos con más correctivas</h3>
            {analysis.assets.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Sin correctivas en el periodo</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analysis.assets.map((a) => ({ name: a.code, label: `${a.name}${a.topMode ? ` · modo principal: ${a.topMode}` : ''}`, Correctivas: a.count }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={80} fontSize={11} />
                  <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.label || ''} />
                  <Bar dataKey="Correctivas" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {analysis.productionEffects.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {analysis.productionEffects.map((e) => (
                  <MtBadge key={e.effect} size="sm" variant={e.effect === 'TOTAL_STOP' ? 'danger' : e.effect === 'PARTIAL_STOP' ? 'warning' : 'neutral'}>
                    {EFFECTS[e.effect] || e.effect}: {e.count}
                  </MtBadge>
                ))}
              </div>
            )}
          </div>
        </MtCard>
      </div>

      {/* Catálogo */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Catálogo de códigos de falla</h2>
          {isAdmin && (
            <MtButton size="sm" variant={catalogEmpty ? 'primary' : 'secondary'} disabled={seeding} onClick={seed}>
              {seeding ? 'Cargando...' : catalogEmpty ? 'Cargar catálogo base ISO 14224' : 'Completar catálogo base'}
            </MtButton>
          )}
        </div>
        {catalogEmpty && (
          <p style={{ margin: '0 0 var(--mt-space-md)', fontSize: '13px', color: 'var(--mt-warning)' }}>
            La planta todavía no tiene códigos de falla, así que las OT no se pueden clasificar.
            {isAdmin ? ' Carga el catálogo base o agrega tus propios códigos.' : ' Pide a un administrador que cargue el catálogo base.'}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 'var(--mt-space-lg)' }}>
          {CATEGORIES.map((c) => (
            <CatalogColumn key={c.value} category={c} codes={catalog[c.value] || []} canEdit={canEdit} onCreate={createCode} onToggle={toggleCode} />
          ))}
        </div>
      </div>
    </div>
  );
}
