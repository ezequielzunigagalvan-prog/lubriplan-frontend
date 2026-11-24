// src/pages/ExportPage.jsx
// Exportar (Excel / PDF) e importar catálogos desde Excel con validación previa.
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { usePlant } from "../context/PlantContext";
import { downloadExport, downloadCatalog, downloadImportTemplate, previewImport, commitImport } from "../services/exportService";
import "./TechniciansPage.css";
import "./AnalysisPage.css";
import "./reports/MonthlyReport.css";
import "./ExportPage.css";

const RECORDS = [
  { key: "executions", label: "Actividades", desc: "Programadas y ejecutadas: estado, técnico, consumo, condición y retraso." },
  { key: "movements", label: "Movimientos de inventario", desc: "Entradas, salidas y ajustes con stock antes y después." },
  { key: "failures", label: "Hallazgos", desc: "Actividades con condición mala o crítica." },
  { key: "emergents", label: "Emergencias", desc: "Actividades de emergencia registradas." },
  { key: "condition_reports", label: "Reportes de condición", desc: "Hallazgos levantados, su estado y la correctiva." },
];
const CATALOGS = [
  { key: "equipment", label: "Equipos", desc: "Código, área, criticidad, estado, marca y modelo." },
  { key: "routes", label: "Rutas", desc: "Lubricante, cantidad, frecuencia, técnico, última y próxima fecha." },
  { key: "lubricants", label: "Inventario", desc: "Stock, mínimo, estado y valor en stock." },
  { key: "technicians", label: "Técnicos", desc: "Código, especialidad, estado y rutas asignadas." },
];
const DATED = new Set(RECORDS.map((r) => r.key));
const SHEET_LABEL = { equipos: "Equipos", lubricantes: "Lubricantes", tecnicos: "Técnicos", rutas: "Rutas" };

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function presetRange(key) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (key === "month") return { from: ymd(new Date(y, m, 1)), to: ymd(now) };
  if (key === "prev") return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
  if (key === "year") return { from: ymd(new Date(y, 0, 1)), to: ymd(now) };
  const days = Number(key);
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));
  return { from: ymd(from), to: ymd(now) };
}
const PRESETS = [["30", "30 días"], ["90", "90 días"], ["month", "Este mes"], ["prev", "Mes anterior"], ["year", "Este año"]];

export default function ExportPage() {
  const { currentPlantId, currentPlant } = usePlant();
  const [tab, setTab] = useState("export");

  return (
    <MainLayout>
      <div className="tch xp lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Datos{currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">Exportar e importar</h1>
            <div className="tch-sub">Descarga información en Excel o PDF, o carga equipos, lubricantes, técnicos y rutas desde Excel.</div>
          </div>
        </header>
        <div className="tch-tabs xp-tabs" role="tablist">
          <button type="button" role="tab" className="tch-tab" aria-pressed={tab === "export"} aria-selected={tab === "export"} onClick={() => setTab("export")}>
            <Icon name="download" size="sm" /> Exportar
          </button>
          <button type="button" role="tab" className="tch-tab" aria-pressed={tab === "import"} aria-selected={tab === "import"} onClick={() => setTab("import")}>
            <Icon name="upload" size="sm" /> Importar
          </button>
        </div>
        {tab === "export" ? <ExportTab plantId={currentPlantId} /> : <ImportTab plantId={currentPlantId} />}
      </div>
    </MainLayout>
  );
}

/* ================= Exportar ================= */

function ExportTab({ plantId }) {
  const [selected, setSelected] = useState(["executions"]);
  const [preset, setPreset] = useState("90");
  const [range, setRange] = useState(presetRange("90"));
  const [format, setFormat] = useState("xlsx");
  const [filters, setFilters] = useState({ status: "", type: "", severity: "", reportStatus: "", reportCondition: "", reportCategory: "" });
  const [busy, setBusy] = useState(false);
  const [catalogBusy, setCatalogBusy] = useState(false);

  const toggle = (key) => setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  const hasDated = selected.some((k) => DATED.has(k));
  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const applyPreset = (k) => {
    setPreset(k);
    setRange(presetRange(k));
  };
  const rangeError = hasDated && (!range.from || !range.to ? "Indica el periodo." : range.from > range.to ? "La fecha inicial es posterior a la final." : "");

  const download = async () => {
    if (!selected.length || rangeError) return;
    setBusy(true);
    try {
      const params = { ...(hasDated ? range : {}) };
      if (selected.includes("executions")) params.status = filters.status;
      if (selected.includes("movements")) params.type = filters.type;
      if (selected.includes("failures")) params.severity = filters.severity;
      if (selected.includes("condition_reports")) Object.assign(params, { reportStatus: filters.reportStatus, reportCondition: filters.reportCondition, reportCategory: filters.reportCategory });
      const name = await downloadExport(format, selected, params, plantId);
      toast.success(`Descargado: ${name}`);
    } catch (e) {
      toast.error(e?.message || "No se pudo exportar");
    } finally {
      setBusy(false);
    }
  };

  const catalog = async () => {
    setCatalogBusy(true);
    try {
      const name = await downloadCatalog(plantId);
      toast.success(`Descargado: ${name}`);
    } catch (e) {
      toast.error(e?.message || "No se pudo descargar el catálogo");
    } finally {
      setCatalogBusy(false);
    }
  };

  return (
    <div className="xp-layout">
      <div className="xp-main">
        <section className="an-panel">
          <div className="an-panel-head">
            <h2>1 · ¿Qué quieres exportar?</h2>
            <p>Puedes elegir varios: se genera un solo archivo con una hoja por cada uno.</p>
          </div>
          <div className="xp-group-title">Registros del periodo</div>
          <div className="xp-options">
            {RECORDS.map((r) => <Option key={r.key} item={r} checked={selected.includes(r.key)} onToggle={() => toggle(r.key)} />)}
          </div>
          <div className="xp-group-title">Catálogos (estado actual)</div>
          <div className="xp-options">
            {CATALOGS.map((r) => <Option key={r.key} item={r} checked={selected.includes(r.key)} onToggle={() => toggle(r.key)} />)}
          </div>
        </section>

        {hasDated ? (
          <section className="an-panel">
            <div className="an-panel-head"><h2>2 · Periodo</h2><p>Aplica a los registros; los catálogos salen completos.</p></div>
            <div className="an-presets">
              {PRESETS.map(([k, l]) => (
                <button key={k} type="button" className="an-preset" aria-pressed={preset === k} onClick={() => applyPreset(k)}>{l}</button>
              ))}
            </div>
            <div className="an-dates">
              <label><span>Desde</span><input type="date" className="tch-input" value={range.from} max={range.to} onChange={(e) => { setPreset(""); setRange((r) => ({ ...r, from: e.target.value })); }} /></label>
              <label><span>Hasta</span><input type="date" className="tch-input" value={range.to} min={range.from} onChange={(e) => { setPreset(""); setRange((r) => ({ ...r, to: e.target.value })); }} /></label>
            </div>
            {rangeError ? <div className="tch-error">{rangeError}</div> : null}

            <div className="xp-filters">
              {selected.includes("executions") ? (
                <Select label="Actividades" value={filters.status} onChange={setF("status")} options={[["", "Todas"], ["COMPLETED", "Completadas"], ["PENDING", "Pendientes en tiempo"], ["OVERDUE", "Vencidas"]]} />
              ) : null}
              {selected.includes("movements") ? (
                <Select label="Movimientos" value={filters.type} onChange={setF("type")} options={[["", "Todos"], ["IN", "Entradas"], ["OUT", "Salidas"], ["ADJUST", "Ajustes"]]} />
              ) : null}
              {selected.includes("failures") ? (
                <Select label="Hallazgos" value={filters.severity} onChange={setF("severity")} options={[["", "Mala y crítica"], ["CRITICO", "Solo crítica"], ["MALO", "Solo mala"]]} />
              ) : null}
              {selected.includes("condition_reports") ? (
                <>
                  <Select label="Estado del reporte" value={filters.reportStatus} onChange={setF("reportStatus")} options={[["", "Todos"], ["OPEN", "Abiertos"], ["IN_PROGRESS", "En corrección"], ["RESOLVED", "Resueltos"], ["DISMISSED", "Descartados"]]} />
                  <Select label="Condición" value={filters.reportCondition} onChange={setF("reportCondition")} options={[["", "Todas"], ["REGULAR", "Regular"], ["MALO", "Mala"], ["CRITICO", "Crítica"]]} />
                  <Select label="Categoría" value={filters.reportCategory} onChange={setF("reportCategory")} options={[["", "Todas"], ["FUGA", "Fuga"], ["RUIDO", "Ruido"], ["VIBRACION", "Vibración"], ["TEMPERATURA", "Temperatura"], ["CONTAMINACION", "Contaminación"], ["OTRO", "Otro"]]} />
                </>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="xp-side">
        <section className="an-panel">
          <div className="an-panel-head"><h2>{hasDated ? "3" : "2"} · Formato</h2></div>
          <div className="xp-formats">
            <button type="button" className="xp-format" aria-pressed={format === "xlsx"} onClick={() => setFormat("xlsx")}>
              <strong>Excel</strong><span>Para filtrar y analizar. Incluye todo el detalle.</span>
            </button>
            <button type="button" className="xp-format" aria-pressed={format === "pdf"} onClick={() => setFormat("pdf")}>
              <strong>PDF</strong><span>Para imprimir o compartir como evidencia.</span>
            </button>
          </div>
          <button type="button" className="tch-btn tch-btn-primary xp-go" disabled={busy || !selected.length || !!rangeError} onClick={download}>
            <Icon name="download" size="sm" /> {busy ? "Generando…" : `Descargar ${selected.length > 1 ? `${selected.length} conjuntos` : ""}`.trim()}
          </button>
          {!selected.length ? <p className="tch-hint">Elige al menos un conjunto de datos.</p> : null}
        </section>

        <section className="an-panel">
          <div className="an-panel-head">
            <h2>Respaldo del catálogo</h2>
            <p>Equipos, lubricantes, técnicos y rutas en el mismo formato de importación. Úsalo como respaldo o para copiarlos a otra planta.</p>
          </div>
          <button type="button" className="tch-btn tch-btn-ghost" disabled={catalogBusy} onClick={catalog}>
            <Icon name="copy" size="sm" /> {catalogBusy ? "Generando…" : "Descargar catálogo"}
          </button>
        </section>
      </aside>
    </div>
  );
}

function Option({ item, checked, onToggle }) {
  return (
    <label className={`xp-option${checked ? " is-on" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span>
        <strong>{item.label}</strong>
        <small>{item.desc}</small>
      </span>
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="xp-select">
      <span>{label}</span>
      <select className="eq-select tch-input" value={value} onChange={onChange}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

/* ================= Importar ================= */

function ImportTab({ plantId }) {
  const confirm = useConfirm();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [state, setState] = useState("idle"); // idle | validating | ready | importing | done
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  const summary = useMemo(() => preview?.summary || {}, [preview]);
  const totals = useMemo(() => {
    const t = { ok: 0, errors: 0, skipped: 0 };
    for (const s of Object.values(summary)) {
      t.ok += s.ok || 0;
      t.errors += s.errors || 0;
      t.skipped += s.skipped || 0;
    }
    return t;
  }, [summary]);

  const pick = async (f) => {
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) {
      setError("El archivo debe ser Excel .xlsx (no .xls ni .csv).");
      return;
    }
    setFile(f);
    setPreview(null);
    setResult(null);
    setError("");
    setState("validating");
    try {
      const p = await previewImport(f, plantId);
      setPreview(p);
      setState("ready");
    } catch (e) {
      setError(e?.message || "No se pudo validar el archivo");
      setState("idle");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setState("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const doImport = async () => {
    const parts = Object.entries(summary).filter(([, s]) => s.ok).map(([k, s]) => `${s.ok} ${SHEET_LABEL[k].toLowerCase()}`);
    const ok = await confirm(`Se crearán ${parts.join(", ")}. Los registros que ya existen se omiten. Esta acción no se puede deshacer desde aquí.`, {
      title: "Confirmar importación",
      confirmLabel: "Importar",
    });
    if (!ok) return;
    setState("importing");
    setError("");
    try {
      const r = await commitImport(file, plantId);
      setResult(r);
      setState("done");
      toast.success("Importación completada");
    } catch (e) {
      // Si el archivo cambió o alguien creó lo mismo mientras tanto, el servidor devuelve la nueva validación.
      if (e?.data?.summary) setPreview({ summary: e.data.summary, sheets: e.data.sheets, warnings: e.data.warnings || [] });
      setError(e?.message || "No se pudo importar");
      setState("ready");
    }
  };

  const template = async () => {
    try {
      await downloadImportTemplate(plantId);
    } catch (e) {
      toast.error(e?.message || "No se pudo descargar la plantilla");
    }
  };

  if (state === "done" && result) {
    const c = result.created || {};
    return (
      <section className="an-panel xp-done">
        <div className="xp-done-icon"><Icon name="checkCircle" size="xl" /></div>
        <h2>Importación completada</h2>
        <div className="mr-stats xp-done-stats">
          <div className="an-mini"><span className="an-kpi-label">Equipos</span><strong>{c.equipos || 0}</strong></div>
          <div className="an-mini"><span className="an-kpi-label">Lubricantes</span><strong>{c.lubricantes || 0}</strong></div>
          <div className="an-mini"><span className="an-kpi-label">Técnicos</span><strong>{c.tecnicos || 0}</strong></div>
          <div className="an-mini"><span className="an-kpi-label">Rutas</span><strong>{c.rutas || 0}</strong></div>
        </div>
        {c.actividades ? <p className="tch-hint">Se programaron {c.actividades} actividades (una por ruta nueva).</p> : null}
        {result.warnings?.length ? <Warnings items={result.warnings} /> : null}
        <div className="xp-done-links">
          {c.equipos ? <Link className="tch-btn tch-btn-ghost" to="/equipments">Ver equipos</Link> : null}
          {c.lubricantes ? <Link className="tch-btn tch-btn-ghost" to="/inventory">Ver inventario</Link> : null}
          {c.tecnicos ? <Link className="tch-btn tch-btn-ghost" to="/technicians">Ver técnicos</Link> : null}
          {c.rutas ? <Link className="tch-btn tch-btn-ghost" to="/routes">Ver rutas</Link> : null}
          <button type="button" className="tch-btn tch-btn-primary" onClick={reset}><Icon name="upload" size="sm" /> Importar otro archivo</button>
        </div>
      </section>
    );
  }

  return (
    <div className="xp-import">
      <section className="an-panel xp-step">
        <div className="xp-step-n">1</div>
        <div>
          <h2>Prepara el archivo</h2>
          <p className="tch-hint">Usa la plantilla: hojas equipos, lubricantes, tecnicos y rutas. Las columnas obligatorias vienen en naranja. Las rutas pueden usar equipos, lubricantes y técnicos que vengan en el mismo archivo.</p>
          <button type="button" className="tch-btn tch-btn-ghost" onClick={template}><Icon name="download" size="sm" /> Descargar plantilla</button>
        </div>
      </section>

      <section className="an-panel xp-step">
        <div className="xp-step-n">2</div>
        <div>
          <h2>Sube y valida</h2>
          <p className="tch-hint">Se revisa todo el archivo antes de guardar nada. No se crea ningún registro en este paso.</p>
          <label
            className={`xp-drop${drag ? " is-drag" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
          >
            <input ref={inputRef} type="file" accept=".xlsx" onChange={(e) => pick(e.target.files?.[0])} hidden />
            <Icon name="upload" size="lg" />
            <strong>{file ? file.name : "Arrastra aquí el archivo o haz clic para elegirlo"}</strong>
            <span>{state === "validating" ? "Validando…" : file ? `${Math.round(file.size / 1024)} KB · clic para cambiar` : "Excel .xlsx, máximo 8 MB"}</span>
          </label>
          {error ? <div className="tch-error" role="alert">{error}</div> : null}
        </div>
      </section>

      {preview ? (
        <section className="an-panel xp-step">
          <div className="xp-step-n">3</div>
          <div>
            <h2>Revisa el resultado</h2>
            <div className="xp-sheets">
              {Object.entries(SHEET_LABEL).map(([k, label]) => {
                const s = summary[k] || {};
                return (
                  <div key={k} className={`xp-sheet${s.errors ? " has-errors" : ""}`}>
                    <strong>{label}</strong>
                    <span className="xp-n is-ok">{s.ok || 0} nuevos</span>
                    {s.skipped ? <span className="xp-n is-skip">{s.skipped} ya existen</span> : null}
                    {s.errors ? <span className="xp-n is-err">{s.errors} con error</span> : null}
                  </div>
                );
              })}
            </div>
            {preview.warnings?.length ? <Warnings items={preview.warnings} /> : null}
            {totals.errors ? <IssueTable title="Errores a corregir" sheets={preview.sheets} field="errors" tone="err" /> : null}
            {totals.skipped ? <IssueTable title="Registros que ya existen (se omiten)" sheets={preview.sheets} field="skipped" tone="skip" collapsed /> : null}

            <div className="xp-actions">
              {totals.errors ? (
                <p className="xp-block"><Icon name="alert" size="sm" /> Corrige los errores en el archivo y vuelve a subirlo. No se importa nada mientras haya errores.</p>
              ) : totals.ok ? (
                <button type="button" className="tch-btn tch-btn-primary" disabled={state === "importing"} onClick={doImport}>
                  <Icon name="check" size="sm" /> {state === "importing" ? "Importando…" : `Importar ${totals.ok} registro${totals.ok === 1 ? "" : "s"} nuevo${totals.ok === 1 ? "" : "s"}`}
                </button>
              ) : (
                <p className="xp-block">No hay registros nuevos en el archivo.</p>
              )}
              <button type="button" className="tch-btn tch-btn-ghost" onClick={reset}>Cancelar</button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Warnings({ items }) {
  return (
    <ul className="xp-warn">
      {items.map((w) => <li key={w}><Icon name="warn" size="sm" /> {w}</li>)}
    </ul>
  );
}

function IssueTable({ title, sheets, field, tone, collapsed = false }) {
  const rows = Object.entries(sheets || {}).flatMap(([k, s]) => (s?.[field] || []).map((e) => ({ sheet: SHEET_LABEL[k] || k, ...e })));
  const content = (
    <div className="an-table-wrap xp-issues">
      <table className="an-table">
        <thead><tr><th>Hoja</th><th>Fila</th><th>Detalle</th></tr></thead>
        <tbody>
          {rows.slice(0, 500).map((e, i) => (
            <tr key={`${e.sheet}-${e.row}-${i}`}>
              <td>{e.sheet}</td><td>{e.row}</td><td className={`xp-msg is-${tone}`}>{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 500 ? <p className="tch-hint">Se muestran 500 de {rows.length}.</p> : null}
    </div>
  );
  return collapsed ? (
    <details className="xp-details"><summary>{title} · {rows.length}</summary>{content}</details>
  ) : (
    <div className="xp-details"><div className="xp-details-title">{title} · {rows.length}</div>{content}</div>
  );
}
