import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid3x3 } from 'lucide-react';
import { MtCard, MtBadge, MtButton } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import '../ui/tokens.css';

const PERIODS = [
  { value: 90, label: 'Últimos 3 meses' },
  { value: 180, label: 'Últimos 6 meses' },
  { value: 365, label: 'Último año' },
  { value: 730, label: 'Últimos 2 años' },
];

const SPECIALTY_LABELS = {
  MECHANIC: 'Mecánica', ELECTRICAL: 'Eléctrica', INSTRUMENTS: 'Instrumentación', WELDING: 'Soldadura',
  LUBRICATION: 'Lubricación', SUPERVISOR: 'Supervisor', MANAGER: 'Jefe de Mantenimiento',
};
const specialtyLabel = (v) => SPECIALTY_LABELS[v] || v;

/** Intensidad del color según cuántas OTs terminó el técnico en el equipo (respecto al máximo). */
function cellStyle(orders, max) {
  if (!orders) return { background: 'transparent', color: 'var(--mt-text-tertiary)' };
  const ratio = max > 0 ? orders / max : 0;
  return { background: `rgba(56, 189, 248, ${0.15 + ratio * 0.65})`, color: ratio > 0.5 ? '#fff' : 'var(--mt-text-primary)', fontWeight: 700 };
}

export default function SkillsMatrix() {
  const navigate = useNavigate();
  const [days, setDays] = useState(365);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlyWithExperience, setOnlyWithExperience] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await maintenanceApi.getExperienceMatrix({ days }));
    } catch (err) {
      console.error('[SkillsMatrix] Error loading matrix:', err);
      setError(err?.data?.error || err?.message || 'No se pudo cargar la matriz');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => (data?.technicians || []).filter((t) => !onlyWithExperience || t.totals.orders > 0), [data, onlyWithExperience]);
  const max = useMemo(() => Math.max(0, ...rows.flatMap((t) => Object.values(t.byAsset).map((c) => c.orders))), [rows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/maintenance/app/personnel')} aria-label="Volver" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft size={20} style={{ color: 'var(--mt-text-secondary)' }} />
        </button>
        <Grid3x3 size={28} style={{ color: 'var(--mt-accent)' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>Matriz de experiencia</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
            Órdenes terminadas por cada técnico en cada equipo. Se calcula con el historial real, no con autoevaluaciones.
          </p>
        </div>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--mt-text-secondary)' }}>
          <input type="checkbox" checked={onlyWithExperience} onChange={(e) => setOnlyWithExperience(e.target.checked)} /> Solo con experiencia
        </label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Periodo"
          style={{ padding: '8px 12px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface)', color: 'var(--mt-text-primary)' }}
        >
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {error && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--mt-danger)', fontWeight: 700 }}>{error}</span>
            <MtButton size="sm" onClick={load}>Reintentar</MtButton>
          </div>
        </MtCard>
      )}

      {loading && !data && <p style={{ color: 'var(--mt-text-secondary)' }}>Calculando...</p>}

      {data && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', overflowX: 'auto', opacity: loading ? 0.6 : 1 }}>
            {rows.length === 0 ? (
              <p style={{ margin: 0, textAlign: 'center', color: 'var(--mt-text-tertiary)' }}>No hay técnicos activos con esos filtros.</p>
            ) : data.assets.length === 0 ? (
              <>
                <p style={{ margin: '0 0 var(--mt-space-md)', color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>
                  Todavía no hay órdenes terminadas con técnico asignado en el periodo. La matriz se llenará conforme se cierren órdenes.
                </p>
                {rows.map((t) => (
                  <div key={t.id} style={{ padding: '6px 0', borderTop: '1px solid var(--mt-border)', fontSize: '13px' }}>
                    <strong>{t.name}</strong> · {specialtyLabel(t.specialty)}
                    {t.certifications.length > 0 && ` · ${t.certifications.join(', ')}`}
                  </div>
                ))}
              </>
            ) : (
              <table style={{ borderCollapse: 'separate', borderSpacing: '3px', fontSize: '12px', minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px', position: 'sticky', left: 0, background: 'var(--mt-bg-surface)' }}>Técnico</th>
                    {data.assets.map((a) => (
                      <th key={a.id} title={a.name} style={{ padding: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>{a.code}</th>
                    ))}
                    <th style={{ padding: '6px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td style={{ padding: '6px', position: 'sticky', left: 0, background: 'var(--mt-bg-surface)', minWidth: '180px' }}>
                        <button onClick={() => navigate(`/maintenance/app/personnel/${t.id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: 'var(--mt-accent)', fontSize: '13px' }}>
                          {t.name}
                        </button>
                        <div style={{ color: 'var(--mt-text-tertiary)' }}>{specialtyLabel(t.specialty)}</div>
                        {t.certifications.length > 0 && (
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
                            {t.certifications.map((c, i) => <MtBadge key={`${c}-${i}`} size="sm" variant="accent">{c}</MtBadge>)}
                          </div>
                        )}
                      </td>
                      {data.assets.map((a) => {
                        const cell = t.byAsset[a.id];
                        return (
                          <td
                            key={a.id}
                            title={cell ? `${a.code} · ${a.name}\n${cell.orders} OT (${cell.corrective} correctivas, ${cell.preventive} preventivas) · ${cell.hours}h` : `${a.code} · sin experiencia`}
                            style={{ textAlign: 'center', padding: '8px', borderRadius: '4px', minWidth: '52px', ...cellStyle(cell?.orders, max) }}
                          >
                            {cell ? cell.orders : '·'}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', padding: '8px', fontWeight: 900 }} title={`${t.totals.hours}h trabajadas`}>
                        {t.totals.orders}
                        <div style={{ fontSize: '10px', fontWeight: 400, color: 'var(--mt-text-tertiary)' }}>{t.totals.hours}h</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </MtCard>
      )}
    </div>
  );
}
