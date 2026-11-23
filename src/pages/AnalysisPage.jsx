// src/pages/AnalysisPage.jsx
// Análisis de lubricación con indicadores verificables (ver definiciones al final de la página).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";
import { usePlant } from "../context/PlantContext";
import { getAnalysisOverview } from "../services/analysisService";
import {
  monthLabel,
  fmtNum,
  fmtPct,
  fmtMoney,
  fmtDay,
  fmtDateTime,
  delta,
  PRESETS,
  presetParams,
  CATEGORY_LABEL,
  critText,
} from "../utils/analysis";
import "./TechniciansPage.css";
import "./EquipmentsPage.css";
import "./AnalysisPage.css";

// Colores de estado (fijos) y de serie; siempre acompañados de leyenda y tabla.
const C = { onTime: "#0ca30c", late: "#fab219", overdue: "#d03b3b", oil: "#2a78d6", grease: "#eb6834" };

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { currentPlantId, currentPlant } = usePlant();
  const [preset, setPreset] = useState("90");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reqRef = useRef(0);

  const params = useMemo(
    () => (preset === "custom" ? (custom.from && custom.to ? custom : null) : presetParams(preset)),
    [preset, custom]
  );

  const load = useCallback(async () => {
    if (!currentPlantId || !params) return;
    const id = ++reqRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await getAnalysisOverview(params);
      if (id === reqRef.current) setData(res);
    } catch (e) {
      if (id === reqRef.current) setError(e?.message || "No se pudo calcular el análisis");
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [currentPlantId, params]);

  useEffect(() => {
    load();
  }, [load]);

  const cmp = data?.compliance;
  const cond = data?.condition;
  const cons = data?.consumption;

  return (
    <MainLayout>
      <div className="tch an lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Análisis{currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">Análisis de lubricación</h1>
            <div className="tch-sub">
              Cumplimiento, puntualidad, condición de los equipos, consumo y costo. Calculado con los registros reales en la hora de la planta.
            </div>
          </div>
          <div className="tch-head-actions">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load} disabled={loading}>
              <Icon name="refresh" size="sm" /> Actualizar
            </button>
          </div>
        </header>

        <section className="an-period" aria-label="Periodo">
          <div className="an-presets" role="group" aria-label="Periodo">
            {PRESETS.map((p) => (
              <button key={p.key} type="button" className="an-preset" aria-pressed={preset === p.key} onClick={() => setPreset(p.key)}>
                {p.label}
              </button>
            ))}
            <button type="button" className="an-preset" aria-pressed={preset === "custom"} onClick={() => setPreset("custom")}>
              Personalizado
            </button>
          </div>
          {preset === "custom" ? (
            <div className="an-dates">
              <label>
                <span>Desde</span>
                <input type="date" className="tch-input" value={custom.from} max={custom.to || undefined} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
              </label>
              <label>
                <span>Hasta</span>
                <input type="date" className="tch-input" value={custom.to} min={custom.from || undefined} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
              </label>
            </div>
          ) : null}
          {data?.period ? (
            <div className="an-period-info">
              <strong>
                <Icon name="calendar" size="sm" /> {fmtDay(data.period.from)} – {fmtDay(data.period.to)}
              </strong>
              <span>
                Comparado con {fmtDay(data.period.prevFrom)} – {fmtDay(data.period.prevTo)} · Calculado {fmtDateTime(data.generatedAt)}
              </span>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudo calcular el análisis</h3>
            <p>{error}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load}>
              <Icon name="refresh" size="sm" /> Reintentar
            </button>
          </div>
        ) : !data ? (
          <div className="an-skeleton" aria-busy="true" />
        ) : (
          <div className={`an-body${loading ? " is-refreshing" : ""}`}>
            {/* ===== Indicadores clave ===== */}
            <section className="an-kpis" aria-label="Indicadores clave">
              <Kpi
                label="Cumplimiento"
                value={fmtPct(cmp.complianceRate)}
                detail={`${cmp.completed} de ${cmp.due} actividades exigibles`}
                d={delta(cmp.complianceRate, cmp.prev.complianceRate, { kind: "pts" })}
              />
              <Kpi
                label="Puntualidad"
                value={fmtPct(cmp.onTimeRate)}
                detail={cmp.late ? `${cmp.onTime} a tiempo · ${cmp.late} con retraso (prom. ${fmtNum(cmp.avgLateDays)} días)` : `${cmp.onTime} a tiempo`}
                d={delta(cmp.onTimeRate, cmp.prev.onTimeRate, { kind: "pts" })}
              />
              <Kpi
                label="Vencidas"
                value={fmtNum(cmp.overdue, 0)}
                tone={cmp.overdue ? "bad" : ""}
                detail={cmp.criticalOverdue ? `${cmp.criticalOverdue} en equipos de criticidad alta o crítica` : "Programadas sin completar"}
                onClick={cmp.overdue ? () => navigate("/activities?filter=overdue") : undefined}
              />
              <Kpi
                label="Condición normal"
                value={fmtPct(cond.normalRate)}
                detail={`${cond.abnormal} hallazgo${cond.abnormal === 1 ? "" : "s"} (mala o crítica) en ${data.executed.total} ejecutadas`}
                d={delta(cond.normalRate, cond.prev.normalRate, { kind: "pts" })}
              />
              <Kpi
                label="Costo de lubricante"
                value={fmtMoney(cons.cost)}
                detail={`${fmtNum(cons.oilL)} L de aceite · ${fmtNum(cons.greaseKg, 2)} kg de grasa`}
                d={delta(cons.cost, cons.prev.cost, { higherIsBetter: false })}
              />
              <Kpi
                label="Índice OLE"
                value={fmtPct(data.ole.value)}
                detail={data.ole.formula}
                d={delta(data.ole.value, data.ole.prev, { kind: "pts" })}
              />
            </section>

            {/* ===== Calidad de datos ===== */}
            <DataQuality q={data.quality} />

            {/* ===== Cumplimiento mensual ===== */}
            <Panel
              title="Cumplimiento por mes"
              subtitle="Actividades programadas en cada mes, según cómo se cerraron. Últimos 12 meses."
            >
              <ComplianceChart months={data.months} />
            </Panel>

            {/* ===== Técnicos ===== */}
            <Panel title="Desempeño por técnico" subtitle="Actividades asignadas que vencían en el periodo y trabajo ejecutado.">
              <TechTable rows={data.technicians} />
            </Panel>

            <div className="an-two">
              {/* ===== Condición ===== */}
              <Panel title="Condición encontrada" subtitle={`${data.executed.total} actividades ejecutadas en el periodo`}>
                <ConditionBar c={cond} />
                <div className="an-kinds">
                  <span>Rutas: <strong>{data.executed.byKind.ROUTE}</strong></span>
                  <span>Manuales: <strong>{data.executed.byKind.MANUAL}</strong></span>
                  <span>Emergencias: <strong>{data.executed.byKind.EMERGENCY}</strong></span>
                </div>
              </Panel>

              {/* ===== Reportes ===== */}
              <Panel title="Reportes de condición" subtitle="Hallazgos levantados en el periodo.">
                <ReportsSummary r={data.reports} />
              </Panel>
            </div>

            {/* ===== Fallas por equipo ===== */}
            <Panel title="Equipos con hallazgos" subtitle="Condición mala o crítica en actividades ejecutadas y reportes de condición del periodo.">
              <FailuresTable rows={data.failures} onOpen={(id) => navigate(`/equipments/${id}`)} />
            </Panel>

            {/* ===== Consumo ===== */}
            <Panel title="Consumo de lubricante" subtitle="Salidas reales de inventario (lo que se descontó), en litros y kilos.">
              <div className="an-cons-kpis">
                <MiniStat label="Aceite" value={`${fmtNum(cons.oilL)} L`} d={delta(cons.oilL, cons.prev.oilL, { higherIsBetter: false })} />
                <MiniStat label="Grasa" value={`${fmtNum(cons.greaseKg, 2)} kg`} d={delta(cons.greaseKg, cons.prev.greaseKg, { higherIsBetter: false })} />
                <MiniStat label="Costo" value={fmtMoney(cons.cost)} d={delta(cons.cost, cons.prev.cost, { higherIsBetter: false })} />
              </div>
              <div className="an-two">
                <ConsumptionChart months={cons.months} dataKey="oilL" unit="L" color={C.oil} title="Aceite por mes (L)" />
                <ConsumptionChart months={cons.months} dataKey="greaseKg" unit="kg" color={C.grease} title="Grasa por mes (kg)" />
              </div>
              <div className="an-two">
                <LubricantTable rows={cons.byLubricant} />
                <EquipmentConsumptionTable rows={cons.byEquipment} onOpen={(id) => navigate(`/equipments/${id}`)} />
              </div>
            </Panel>

            <Definitions tz={data.plant?.timezone} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

/* ================= Componentes ================= */

function Panel({ title, subtitle, children }) {
  return (
    <section className="an-panel">
      <div className="an-panel-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Delta({ d }) {
  if (!d) return null;
  return <span className={`an-delta is-${d.tone}`} title="Contra el periodo anterior">{d.text}</span>;
}

function Kpi({ label, value, detail, d, tone = "", onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={`an-kpi${tone ? ` is-${tone}` : ""}${onClick ? " is-link" : ""}`} onClick={onClick}>
      <div className="an-kpi-label">{label}</div>
      <div className="an-kpi-value">{value}</div>
      <Delta d={d} />
      <div className="an-kpi-detail">{detail}</div>
    </Tag>
  );
}

function MiniStat({ label, value, d }) {
  return (
    <div className="an-mini">
      <span className="an-kpi-label">{label}</span>
      <strong>{value}</strong>
      <Delta d={d} />
    </div>
  );
}

function DataQuality({ q }) {
  const items = [
    q.completedWithoutInventoryDeduction
      ? `${q.completedWithoutInventoryDeduction} actividad${q.completedWithoutInventoryDeduction === 1 ? "" : "es"} con lubricante asignado no descontaron inventario (sin cantidad o sin stock): su consumo no aparece.`
      : null,
    q.completedWithoutCondition ? `${q.completedWithoutCondition} actividad${q.completedWithoutCondition === 1 ? "" : "es"} sin condición registrada.` : null,
    q.completedWithoutTechnician ? `${q.completedWithoutTechnician} actividad${q.completedWithoutTechnician === 1 ? "" : "es"} completada${q.completedWithoutTechnician === 1 ? "" : "s"} sin técnico.` : null,
    q.overdueWithoutTechnician ? `${q.overdueWithoutTechnician} vencida${q.overdueWithoutTechnician === 1 ? "" : "s"} sin técnico asignado.` : null,
    q.lubricantsWithoutCost?.length ? `Sin costo unitario: ${q.lubricantsWithoutCost.join(", ")} (no suman al costo).` : null,
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="an-quality" role="note">
      <div className="an-quality-title">
        <Icon name="info" size="sm" /> Calidad de los datos del periodo
      </div>
      <ul>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tip">
      <div className="an-tip-title">{monthLabel(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="an-tip-row">
          <span className="an-swatch" style={{ background: p.color }} />
          {p.name}: <strong>{fmtNum(p.value, 2)}{unit ? ` ${unit}` : ""}</strong>
        </div>
      ))}
    </div>
  );
}

function ComplianceChart({ months }) {
  const [table, setTable] = useState(false);
  const hasData = months.some((m) => m.due);
  if (!hasData) return <p className="an-empty">No hay actividades programadas en los últimos 12 meses.</p>;
  return (
    <>
      <div className="an-legend">
        <span><i style={{ background: C.onTime }} /> <Icon name="check" size="sm" /> A tiempo</span>
        <span><i style={{ background: C.late }} /> <Icon name="clock" size="sm" /> Con retraso</span>
        <span><i style={{ background: C.overdue }} /> <Icon name="alert" size="sm" /> Vencidas</span>
        <button type="button" className="an-link" onClick={() => setTable((v) => !v)}>
          {table ? "Ver gráfica" : "Ver tabla"}
        </button>
      </div>
      {table ? (
        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr><th>Mes</th><th>Exigibles</th><th>A tiempo</th><th>Con retraso</th><th>Vencidas</th><th>Cumplimiento</th><th>Puntualidad</th></tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month}>
                  <td>{monthLabel(m.month)}</td><td>{m.due}</td><td>{m.onTime}</td><td>{m.late}</td><td>{m.overdue}</td>
                  <td>{fmtPct(m.complianceRate)}</td><td>{fmtPct(m.onTimeRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="an-chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--tch-border)" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: "var(--tch-muted)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--tch-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--tch-surface-2)" }} />
              <Bar isAnimationActive={false} dataKey="onTime" name="A tiempo" stackId="a" fill={C.onTime} stroke="var(--tch-surface)" strokeWidth={2} />
              <Bar isAnimationActive={false} dataKey="late" name="Con retraso" stackId="a" fill={C.late} stroke="var(--tch-surface)" strokeWidth={2} />
              <Bar isAnimationActive={false} dataKey="overdue" name="Vencidas" stackId="a" fill={C.overdue} stroke="var(--tch-surface)" strokeWidth={2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

function ConsumptionChart({ months, dataKey, unit, color, title }) {
  const has = months.some((m) => m[dataKey] > 0);
  return (
    <div className="an-subchart">
      <div className="an-subchart-title">{title}</div>
      {has ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="var(--tch-border)" />
            <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 10, fill: "var(--tch-muted)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "var(--tch-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "var(--tch-surface-2)" }} />
            <Bar isAnimationActive={false} dataKey={dataKey} name={unit === "L" ? "Aceite" : "Grasa"} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="an-empty">Sin consumo registrado en los últimos 12 meses.</p>
      )}
    </div>
  );
}

function Rate({ value }) {
  if (value == null) return <span className="an-muted">—</span>;
  const tone = value >= 90 ? "good" : value >= 75 ? "warn" : "bad";
  return (
    <span className="an-rate">
      <span className="an-rate-bar"><span className={`is-${tone}`} style={{ width: `${Math.min(100, value)}%` }} /></span>
      {fmtPct(value)}
    </span>
  );
}

function TechTable({ rows }) {
  if (!rows.length) return <p className="an-empty">Sin actividades asignadas ni ejecutadas en el periodo.</p>;
  return (
    <div className="an-table-wrap">
      <table className="an-table">
        <thead>
          <tr>
            <th>Técnico</th><th>Exigibles</th><th>Completadas</th><th>A tiempo</th><th>Con retraso</th><th>Vencidas</th>
            <th>Cumplimiento</th><th>Puntualidad</th><th title="Actividades ejecutadas en el periodo (incluye manuales y emergencias)">Ejecutadas</th><th title="Condición mala o crítica reportada">Hallazgos</th><th>Última</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.technicianId ?? "none"} className={r.technicianId == null ? "is-muted" : ""}>
              <td className="an-name">
                {r.name}
                {r.code ? <span className="an-code"> · {r.code}</span> : null}
                {r.inactive ? <span className="an-tag">eliminado</span> : null}
              </td>
              <td>{r.due}</td><td>{r.completed}</td><td>{r.onTime}</td><td>{r.late}</td>
              <td className={r.overdue ? "is-bad" : ""}>{r.overdue}</td>
              <td><Rate value={r.complianceRate} /></td>
              <td><Rate value={r.onTimeRate} /></td>
              <td>{r.executed}</td><td>{r.findings}</td>
              <td className="an-muted">{r.lastExecutedAt ? fmtDateTime(r.lastExecutedAt) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConditionBar({ c }) {
  const parts = [
    ["BUENO", "Buena", "is-good", "checkCircle"],
    ["REGULAR", "Regular", "is-reg", "dot"],
    ["MALO", "Mala", "is-warn", "warn"],
    ["CRITICO", "Crítica", "is-bad", "alert"],
  ];
  const total = c.withData || 0;
  if (!c.total) return <p className="an-empty">Sin actividades ejecutadas en el periodo.</p>;
  return (
    <>
      <div className="an-segbar" role="img" aria-label="Distribución de condición">
        {parts.map(([k, , cls]) => (c[k] ? <span key={k} className={cls} style={{ flexGrow: c[k] }} /> : null))}
      </div>
      <div className="an-cond-list">
        {parts.map(([k, label, cls, icon]) => (
          <div key={k} className="an-cond">
            <span className={`an-cond-icon ${cls}`}><Icon name={icon} size="sm" /></span>
            <span>{label}</span>
            <strong>{c[k]}</strong>
            <span className="an-muted">{total ? fmtPct((c[k] / total) * 100) : "—"}</span>
          </div>
        ))}
        {c.SIN_DATO ? (
          <div className="an-cond">
            <span className="an-cond-icon"><Icon name="info" size="sm" /></span>
            <span>Sin dato</span>
            <strong>{c.SIN_DATO}</strong>
            <span />
          </div>
        ) : null}
      </div>
    </>
  );
}

function ReportsSummary({ r }) {
  return (
    <div className="an-reports">
      <div className="an-report-grid">
        <MiniStat label="Levantados" value={r.total} />
        <MiniStat label="Resueltos" value={r.byStatus.RESOLVED} />
        <MiniStat label="Abiertos hoy" value={r.openNow} />
        <MiniStat label="Atención promedio" value={r.avgResolutionHours == null ? "—" : r.avgResolutionHours >= 48 ? `${fmtNum(r.avgResolutionHours / 24)} días` : `${fmtNum(r.avgResolutionHours)} h`} />
      </div>
      <div className="an-muted an-small">
        {r.openNow ? `Los abiertos llevan en promedio ${fmtNum(r.openAvgAgeDays)} días sin cerrarse. ` : ""}
        En curso: {r.byStatus.IN_PROGRESS} · Descartados: {r.byStatus.DISMISSED}
      </div>
      {r.byCategory.length ? (
        <div className="an-cats">
          {r.byCategory.map((c) => (
            <span key={c.category} className="tch-chip">
              {CATEGORY_LABEL[c.category] || c.category} <strong>{c.count}</strong>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FailuresTable({ rows, onOpen }) {
  if (!rows.length) return <p className="an-empty">Sin condiciones malas o críticas en el periodo.</p>;
  return (
    <div className="an-table-wrap">
      <table className="an-table">
        <thead>
          <tr><th>Equipo</th><th>Área</th><th>Criticidad</th><th>Críticas</th><th>Malas</th><th>Periodo anterior</th><th>Reportes</th><th>Último hallazgo</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.equipmentId} className="is-link" onClick={() => onOpen(r.equipmentId)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(r.equipmentId)}>
              <td className="an-name">{r.name}{r.code ? <span className="an-code"> · {r.code}</span> : null}</td>
              <td>{r.area || "—"}</td>
              <td>{critText(r.criticality)}</td>
              <td className={r.critico ? "is-bad" : ""}>{r.critico}</td>
              <td>{r.malo}</td>
              <td className="an-muted">{r.prevTotal}</td>
              <td>{r.reports}</td>
              <td className="an-muted">{r.lastAt ? fmtDateTime(r.lastAt) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LubricantTable({ rows }) {
  return (
    <div className="an-subchart">
      <div className="an-subchart-title">Por lubricante</div>
      {rows.length ? (
        <div className="an-table-wrap">
          <table className="an-table">
            <thead><tr><th>Lubricante</th><th>Cantidad</th><th>Salidas</th><th>Costo</th></tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.lubricantId}>
                  <td className="an-name">{l.name}{l.code ? <span className="an-code"> · {l.code}</span> : null}</td>
                  <td>{fmtNum(l.qty, 2)} {l.unit}</td>
                  <td>{l.moves}</td>
                  <td>{l.cost == null ? <span className="an-muted">sin costo</span> : fmtMoney(l.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="an-empty">Sin salidas de inventario en el periodo.</p>
      )}
    </div>
  );
}

function EquipmentConsumptionTable({ rows, onOpen }) {
  return (
    <div className="an-subchart">
      <div className="an-subchart-title">Equipos con mayor consumo</div>
      {rows.length ? (
        <div className="an-table-wrap">
          <table className="an-table">
            <thead><tr><th>Equipo</th><th>Aceite</th><th>Grasa</th><th>Costo</th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr
                  key={e.equipmentId ?? "manual"}
                  className={e.equipmentId ? "is-link" : "is-muted"}
                  onClick={e.equipmentId ? () => onOpen(e.equipmentId) : undefined}
                >
                  <td className="an-name">{e.name}{e.code ? <span className="an-code"> · {e.code}</span> : null}</td>
                  <td>{e.ACEITE ? `${fmtNum(e.ACEITE, 2)} L` : "—"}</td>
                  <td>{e.GRASA ? `${fmtNum(e.GRASA, 2)} kg` : "—"}</td>
                  <td>{fmtMoney(e.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="an-empty">Sin consumo por equipo en el periodo.</p>
      )}
    </div>
  );
}

function Definitions({ tz }) {
  return (
    <details className="an-defs">
      <summary>
        <Icon name="info" size="sm" /> Cómo se calcula cada indicador
      </summary>
      <dl>
        <dt>Actividades exigibles</dt>
        <dd>Las programadas dentro del periodo y hasta hoy. Las de hoy que aún no se hacen no cuentan todavía (siguen en tiempo).</dd>
        <dt>Cumplimiento</dt>
        <dd>Completadas ÷ exigibles.</dd>
        <dt>Puntualidad</dt>
        <dd>Completadas a más tardar el día programado ÷ exigibles. Una actividad hecha un día después cuenta como "con retraso".</dd>
        <dt>Vencidas</dt>
        <dd>Exigibles que siguen sin completarse.</dd>
        <dt>Condición normal</dt>
        <dd>Actividades ejecutadas en el periodo con condición Buena o Regular ÷ las que tienen condición registrada.</dd>
        <dt>Índice OLE</dt>
        <dd>Cumplimiento × Puntualidad × Condición normal. Un valor bajo indica en cuál de los tres está el problema.</dd>
        <dt>Consumo y costo</dt>
        <dd>Salidas de inventario registradas (lo realmente descontado), convertidas a litros o kilos. Costo = cantidad × costo unitario del lubricante.</dd>
        <dt>Comparación</dt>
        <dd>Cada flecha compara contra el periodo anterior de la misma duración. En porcentajes la diferencia es en puntos.</dd>
        <dt>Fechas</dt>
        <dd>Todos los días se cuentan en la hora de la planta{tz ? ` (${tz})` : ""}.</dd>
      </dl>
    </details>
  );
}
