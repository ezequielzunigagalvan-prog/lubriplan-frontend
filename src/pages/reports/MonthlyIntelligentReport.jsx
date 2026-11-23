// src/pages/reports/MonthlyIntelligentReport.jsx
// Reporte mensual de lubricación: mismos cálculos verificados que Análisis, listo para imprimir o guardar en PDF.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MainLayout from "../../layouts/MainLayout";
import { Icon } from "../../components/ui/lpIcons";
import { useAuth } from "../../context/AuthContext";
import { usePlant } from "../../context/PlantContext";
import { getMonthlyReport } from "../../services/analysisService";
import { getAiSummary } from "../../services/aiService";
import { getSettings } from "../../services/settingsService";
import { monthLabel, fmtNum, fmtPct, fmtMoney, fmtDateTime, delta, CATEGORY_LABEL, critText } from "../../utils/analysis";
import "../TechniciansPage.css";
import "../AnalysisPage.css";
import "./MonthlyReport.css";

const C = { onTime: "#0ca30c", late: "#fab219", overdue: "#d03b3b" };

const ymNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const addMonths = (ym, n) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const longMonth = (ym) => {
  const [y, m] = String(ym).split("-").map(Number);
  if (!m) return ym;
  const s = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function MonthlyIntelligentReport() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();
  const urlMonth = /^\d{4}-\d{2}$/.test(params.get("month") || "") ? params.get("month") : null;
  const month = urlMonth || addMonths(ymNow(), new Date().getDate() <= 5 ? -1 : 0);
  const isCurrent = month === ymNow();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ai, setAi] = useState({ state: "idle", data: null, error: "" });
  const [aiEnabled, setAiEnabled] = useState(true);
  const reqRef = useRef(0);

  const setMonth = (m) => {
    if (!/^\d{4}-\d{2}$/.test(m) || m > ymNow()) return;
    setParams({ month: m });
  };

  const load = useCallback(async () => {
    if (!currentPlantId) return;
    const id = ++reqRef.current;
    setLoading(true);
    setError("");
    setAi({ state: "idle", data: null, error: "" });
    try {
      const res = await getMonthlyReport(month);
      if (id === reqRef.current) setData(res);
    } catch (e) {
      if (id === reqRef.current) setError(e?.message || "No se pudo generar el reporte");
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [currentPlantId, month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!currentPlantId) return;
    getSettings()
      .then((r) => setAiEnabled((r?.settings ?? r)?.aiSummaryEnabled !== false))
      .catch(() => {});
  }, [currentPlantId]);

  const loadAi = async () => {
    setAi({ state: "loading", data: null, error: "" });
    try {
      const res = await getAiSummary({ period: month, plantId: currentPlantId, lang: "es" });
      if (res?.disabled) setAi({ state: "error", data: null, error: "La IA está desactivada para esta planta." });
      else setAi({ state: "done", data: res, error: "" });
    } catch (e) {
      setAi({ state: "error", data: null, error: e?.message || "No se pudo generar la lectura con IA" });
    }
  };

  const c = data?.compliance;
  const cond = data?.condition;
  const cons = data?.consumption;
  const n = data?.narrative;
  const trend = (data?.months || []).filter((m) => m.month <= month).slice(-6);

  return (
    <MainLayout>
      <div className="tch an mr lp-fade-in">
        {/* Barra de control (no se imprime) */}
        <div className="mr-toolbar mr-noprint">
          <div className="mr-month">
            <button type="button" className="tch-icon-btn" aria-label="Mes anterior" onClick={() => setMonth(addMonths(month, -1))}>
              <Icon name="chevronLeft" size="sm" />
            </button>
            <input type="month" className="tch-input" value={month} max={ymNow()} onChange={(e) => setMonth(e.target.value)} aria-label="Mes del reporte" />
            <button type="button" className="tch-icon-btn" aria-label="Mes siguiente" disabled={isCurrent} onClick={() => setMonth(addMonths(month, 1))}>
              <Icon name="chevronRight" size="sm" />
            </button>
          </div>
          <div className="tch-head-actions">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load} disabled={loading}>
              <Icon name="refresh" size="sm" /> Actualizar
            </button>
            <button type="button" className="tch-btn tch-btn-primary" onClick={() => window.print()} disabled={!data || loading}>
              <Icon name="download" size="sm" /> Imprimir / guardar PDF
            </button>
          </div>
        </div>

        {error ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudo generar el reporte</h3>
            <p>{error}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load}><Icon name="refresh" size="sm" /> Reintentar</button>
          </div>
        ) : !data ? (
          <div className="an-skeleton" aria-busy="true" />
        ) : (
          <article className={`mr-doc${loading ? " is-refreshing" : ""}`}>
            {/* Portada */}
            <header className="mr-cover">
              <div>
                <div className="tch-kicker">Reporte mensual de lubricación</div>
                <h1 className="mr-title">{longMonth(month)}</h1>
                <div className="mr-meta">
                  <span><Icon name="building" size="sm" /> {data.plant?.name || currentPlant?.name}</span>
                  <span>Generado {fmtDateTime(data.generatedAt)}{user?.name ? ` por ${user.name}` : ""}</span>
                  {isCurrent ? <span className="mr-tag">Mes en curso: cifras parciales</span> : null}
                </div>
              </div>
              <div className="mr-headline">{n?.headline}</div>
            </header>

            {/* Indicadores */}
            <section className="an-kpis" aria-label="Indicadores del mes">
              <Kpi label="Cumplimiento" value={fmtPct(c.complianceRate)} detail={`${c.completed} de ${c.due} exigibles`} d={delta(c.complianceRate, c.prev.complianceRate, { kind: "pts" })} />
              <Kpi label="Puntualidad" value={fmtPct(c.onTimeRate)} detail={`${c.onTime} a tiempo · ${c.late} con retraso`} d={delta(c.onTimeRate, c.prev.onTimeRate, { kind: "pts" })} />
              <Kpi label="Vencidas" value={fmtNum(c.overdue, 0)} tone={c.overdue ? "bad" : ""} detail={c.criticalOverdue ? `${c.criticalOverdue} en equipos críticos` : "Sin completar al cierre"} />
              <Kpi label="Condición normal" value={fmtPct(cond.normalRate)} detail={`${cond.abnormal} hallazgos en ${data.executed.total} ejecutadas`} d={delta(cond.normalRate, cond.prev.normalRate, { kind: "pts" })} />
              <Kpi label="Costo de lubricante" value={fmtMoney(cons.cost)} detail={`${fmtNum(cons.oilL)} L · ${fmtNum(cons.greaseKg, 2)} kg`} d={delta(cons.cost, cons.prev.cost, { higherIsBetter: false })} />
              <Kpi label="Índice OLE" value={fmtPct(data.ole.value)} detail="Cumplimiento × Puntualidad × Condición" d={delta(data.ole.value, data.ole.prev, { kind: "pts" })} />
            </section>
            <p className="mr-note">Las flechas comparan contra {longMonth(addMonths(month, -1)).toLowerCase()}.</p>

            {/* Resumen ejecutivo */}
            <section className="an-panel mr-section">
              <div className="an-panel-head"><h2>Resumen ejecutivo</h2></div>
              <div className="mr-text">
                {n?.paragraphs?.map((p) => <p key={p}>{p}</p>)}
              </div>
              <div className="an-two">
                {n?.highlights?.length ? (
                  <div className="mr-list">
                    <h3>Puntos clave</h3>
                    <ul>{n.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
                  </div>
                ) : null}
                {n?.actions?.length ? (
                  <div className="mr-list is-actions">
                    <h3>Acciones sugeridas</h3>
                    <ol>{n.actions.map((a) => <li key={a}>{a}</li>)}</ol>
                  </div>
                ) : null}
              </div>
              {aiEnabled ? <AiReading ai={ai} onLoad={loadAi} /> : null}
            </section>

            {/* Tendencia */}
            <section className="an-panel mr-section">
              <div className="an-panel-head">
                <h2>Cumplimiento de los últimos 6 meses</h2>
                <p>Actividades programadas en cada mes, según cómo se cerraron.</p>
              </div>
              <div className="an-legend">
                <span><i style={{ background: C.onTime }} /> <Icon name="check" size="sm" /> A tiempo</span>
                <span><i style={{ background: C.late }} /> <Icon name="clock" size="sm" /> Con retraso</span>
                <span><i style={{ background: C.overdue }} /> <Icon name="alert" size="sm" /> Vencidas</span>
              </div>
              <div className="an-two mr-trend">
                <div className="an-chart">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="30%">
                      <CartesianGrid vertical={false} stroke="var(--tch-border)" />
                      <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: "var(--tch-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--tch-muted)" }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "var(--tch-surface-2)" }} labelFormatter={monthLabel} />
                      <Bar isAnimationActive={false} dataKey="onTime" name="A tiempo" stackId="a" fill={C.onTime} stroke="var(--tch-surface)" strokeWidth={2} />
                      <Bar isAnimationActive={false} dataKey="late" name="Con retraso" stackId="a" fill={C.late} stroke="var(--tch-surface)" strokeWidth={2} />
                      <Bar isAnimationActive={false} dataKey="overdue" name="Vencidas" stackId="a" fill={C.overdue} stroke="var(--tch-surface)" strokeWidth={2} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead><tr><th>Mes</th><th>Exigibles</th><th>Cumpl.</th><th>Puntual.</th><th>Vencidas</th></tr></thead>
                    <tbody>
                      {trend.map((m) => (
                        <tr key={m.month} className={m.month === month ? "mr-current" : ""}>
                          <td>{monthLabel(m.month)}</td><td>{m.due}</td><td>{fmtPct(m.complianceRate)}</td><td>{fmtPct(m.onTimeRate)}</td><td>{m.overdue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Técnicos */}
            <section className="an-panel mr-section">
              <div className="an-panel-head"><h2>Desempeño por técnico</h2></div>
              {data.technicians.length ? (
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead>
                      <tr><th>Técnico</th><th>Exigibles</th><th>Completadas</th><th>A tiempo</th><th>Con retraso</th><th>Vencidas</th><th>Cumplimiento</th><th>Puntualidad</th><th>Hallazgos</th></tr>
                    </thead>
                    <tbody>
                      {data.technicians.map((r) => (
                        <tr key={r.technicianId ?? "none"} className={r.technicianId == null ? "is-muted" : ""}>
                          <td className="an-name">{r.name}</td>
                          <td>{r.due}</td><td>{r.completed}</td><td>{r.onTime}</td><td>{r.late}</td>
                          <td className={r.overdue ? "is-bad" : ""}>{r.overdue}</td>
                          <td>{fmtPct(r.complianceRate)}</td><td>{fmtPct(r.onTimeRate)}</td><td>{r.findings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="an-empty">Sin actividades asignadas en el mes.</p>}
            </section>

            <div className="an-two">
              {/* Condición y reportes */}
              <section className="an-panel mr-section">
                <div className="an-panel-head"><h2>Condición encontrada</h2><p>{data.executed.total} actividades ejecutadas</p></div>
                <div className="mr-stats">
                  <Stat label="Buena" value={cond.BUENO} />
                  <Stat label="Regular" value={cond.REGULAR} />
                  <Stat label="Mala" value={cond.MALO} tone={cond.MALO ? "warn" : ""} />
                  <Stat label="Crítica" value={cond.CRITICO} tone={cond.CRITICO ? "bad" : ""} />
                </div>
              </section>
              <section className="an-panel mr-section">
                <div className="an-panel-head"><h2>Reportes de condición</h2></div>
                <div className="mr-stats">
                  <Stat label="Levantados" value={data.reports.total} />
                  <Stat label="Resueltos" value={data.reports.byStatus.RESOLVED} />
                  <Stat label="Abiertos hoy" value={data.reports.openNow} tone={data.reports.openNow ? "warn" : ""} />
                  <Stat
                    label="Atención prom."
                    value={data.reports.avgResolutionHours == null ? "—" : data.reports.avgResolutionHours >= 48 ? `${fmtNum(data.reports.avgResolutionHours / 24)} d` : `${fmtNum(data.reports.avgResolutionHours)} h`}
                  />
                </div>
                {data.reports.byCategory.length ? (
                  <div className="an-cats">
                    {data.reports.byCategory.map((x) => (
                      <span key={x.category} className="tch-chip">{CATEGORY_LABEL[x.category] || x.category} <strong>{x.count}</strong></span>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>

            {/* Equipos con hallazgos */}
            {data.failures.length ? (
              <section className="an-panel mr-section">
                <div className="an-panel-head"><h2>Equipos con hallazgos</h2></div>
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead><tr><th>Equipo</th><th>Criticidad</th><th>Críticas</th><th>Malas</th><th>Mes anterior</th><th>Reportes</th></tr></thead>
                    <tbody>
                      {data.failures.map((r) => (
                        <tr key={r.equipmentId} className="is-link" onClick={() => navigate(`/equipments/${r.equipmentId}`)}>
                          <td className="an-name">{r.name}{r.code ? <span className="an-code"> · {r.code}</span> : null}</td>
                          <td>{critText(r.criticality)}</td>
                          <td className={r.critico ? "is-bad" : ""}>{r.critico}</td><td>{r.malo}</td><td>{r.prevTotal}</td><td>{r.reports}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {/* Consumo */}
            <section className="an-panel mr-section">
              <div className="an-panel-head"><h2>Consumo y costo de lubricante</h2><p>Salidas reales de inventario del mes.</p></div>
              {cons.byLubricant.length ? (
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead><tr><th>Lubricante</th><th>Cantidad</th><th>Salidas</th><th>Costo</th></tr></thead>
                    <tbody>
                      {cons.byLubricant.map((l) => (
                        <tr key={l.lubricantId}>
                          <td className="an-name">{l.name}</td><td>{fmtNum(l.qty, 2)} {l.unit}</td><td>{l.moves}</td>
                          <td>{l.cost == null ? <span className="an-muted">sin costo</span> : fmtMoney(l.cost)}</td>
                        </tr>
                      ))}
                      <tr className="mr-total"><td>Total</td><td>{fmtNum(cons.oilL)} L · {fmtNum(cons.greaseKg, 2)} kg</td><td /><td>{fmtMoney(cons.cost)}</td></tr>
                    </tbody>
                  </table>
                </div>
              ) : <p className="an-empty">Sin salidas de inventario en el mes.</p>}
            </section>

            {/* Anexo: vencidas */}
            <section className="an-panel mr-section mr-annex">
              <div className="an-panel-head">
                <h2>Anexo · Actividades vencidas del mes</h2>
                <p>Programadas en {longMonth(month).toLowerCase()} que siguen sin completarse.</p>
              </div>
              {data.overdueList?.length ? (
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead><tr><th>Folio</th><th>Programada</th><th>Días de atraso</th><th>Actividad</th><th>Equipo</th><th>Criticidad</th><th>Técnico</th></tr></thead>
                    <tbody>
                      {data.overdueList.map((x) => (
                        <tr key={x.id}>
                          <td>#{x.id}</td><td>{x.scheduled}</td><td className="is-bad">{x.daysLate}</td>
                          <td className="an-name">{x.activity}</td>
                          <td>{x.equipment || "—"}{x.equipmentCode ? <span className="an-code"> · {x.equipmentCode}</span> : null}</td>
                          <td>{critText(x.criticality)}</td><td>{x.technician || <span className="an-muted">Sin técnico</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="an-empty">No quedaron actividades vencidas de este mes.</p>}
            </section>

            <footer className="mr-footer">
              LubriPlan · {data.plant?.name} · Reporte de {longMonth(month).toLowerCase()} · Las fechas se cuentan en la hora de la planta ({data.plant?.timezone}).
              Cumplimiento = completadas ÷ exigibles; puntualidad = completadas a más tardar el día programado ÷ exigibles.
            </footer>
          </article>
        )}
      </div>
    </MainLayout>
  );
}

function Kpi({ label, value, detail, d, tone = "" }) {
  return (
    <div className={`an-kpi${tone ? ` is-${tone}` : ""}`}>
      <div className="an-kpi-label">{label}</div>
      <div className="an-kpi-value">{value}</div>
      {d ? <span className={`an-delta is-${d.tone}`}>{d.text}</span> : null}
      <div className="an-kpi-detail">{detail}</div>
    </div>
  );
}

function Stat({ label, value, tone = "" }) {
  return (
    <div className={`an-mini${tone ? ` mr-${tone}` : ""}`}>
      <span className="an-kpi-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AiReading({ ai, onLoad }) {
  const s = ai.data?.summary;
  return (
    <div className="mr-ai">
      {ai.state === "idle" ? (
        <button type="button" className="tch-btn tch-btn-ghost mr-noprint" onClick={onLoad}>
          <Icon name="spark" size="sm" /> Agregar lectura con IA
        </button>
      ) : ai.state === "loading" ? (
        <p className="an-muted">Generando lectura con IA…</p>
      ) : ai.state === "error" ? (
        <p className="an-muted mr-noprint">{ai.error}</p>
      ) : s ? (
        <>
          <h3><Icon name="spark" size="sm" /> Lectura con IA</h3>
          <p>{s.executiveSummary}</p>
          {Array.isArray(s.recommendations) && s.recommendations.length ? (
            <ul>{s.recommendations.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>
          ) : null}
          <p className="mr-ai-note">Generada con los mismos números de este reporte. Revísala antes de compartirla.</p>
        </>
      ) : null}
    </div>
  );
}
