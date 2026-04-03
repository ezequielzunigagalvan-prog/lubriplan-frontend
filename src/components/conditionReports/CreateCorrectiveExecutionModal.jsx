import { useEffect, useMemo, useState } from "react";
import { createCorrectiveExecution } from "../../services/conditionReportsService";
import { getTechnicians } from "../../services/techniciansService";
import { Icon } from "../ui/lpIcons";

function toLocalDatetimeInputValue(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function CreateCorrectiveExecutionModal({ open, onClose, report, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [techLoading, setTechLoading] = useState(false);
  const [techs, setTechs] = useState([]);

  const equipmentLabel = useMemo(() => {
    const eq = report?.equipment || {};
    const code = eq?.code ? ` (${eq.code})` : "";
    const loc = eq?.location ? `  ${eq.location}` : "";
    return `${eq?.name || ""}${code}${loc}`;
  }, [report]);

  const evidenceImage = report?.evidenceImage || "";
  const condition = String(report?.condition || "").toUpperCase();
  const status = String(report?.status || "").toUpperCase();

  useEffect(() => {
    if (!open) return;

    setErr("");
    setSaving(false);
    setScheduledAt(toLocalDatetimeInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));
    setTechnicianId("");

    const eq = report?.equipment || {};
    const base = [
      "Acción correctiva por condición anormal.",
      eq?.name ? `Equipo: ${eq.name}${eq.code ? ` (${eq.code})` : ""}` : null,
      report?.description ? `Hallazgo: ${report.description}` : null,
      "Define seguridad, puntos a intervenir y criterio de cierre.",
    ]
      .filter(Boolean)
      .join("\n");

    setInstructions(base);

    (async () => {
      try {
        setTechLoading(true);
        const data = await getTechnicians();
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setTechs(items);
      } catch (e) {
        console.error(e);
        setTechs([]);
      } finally {
        setTechLoading(false);
      }
    })();
  }, [open, report]);

  if (!open) return null;

  const onSubmit = async () => {
    try {
      setErr("");
      if (!report?.id) return setErr("Reporte inválido");
      if (!scheduledAt) return setErr("Selecciona fecha programada");
      if (!instructions.trim()) return setErr("Escribe instrucciones");

      setSaving(true);

      await createCorrectiveExecution(report.id, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        technicianId: technicianId ? Number(technicianId) : null,
        instructions: instructions.trim(),
      });

      onSaved?.();
    } catch (e) {
      console.error(e);
      setErr(e?.error || e?.message || "Error creando acción correctiva");
      setSaving(false);
    }
  };

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={head}>
          <div>
            <div style={kicker}>SEGUIMIENTO CORRECTIVO</div>
            <div style={title}>Programar acción correctiva</div>
            <div style={sub}>Se crear una actividad ligada al reporte y el reporte pasar a IN_PROGRESS.</div>
          </div>
          <button onClick={onClose} style={xBtn} title="Cerrar" disabled={saving}>?</button>
        </div>

        {err ? <div style={errorBox}>{err}</div> : null}

        <div style={shell}>
          <div style={summaryCard}>
            <div style={summaryHead}>
              <div style={summaryTitleRow}>
                <span style={summaryIcon}><Icon name="tool" size="sm" /></span>
                <div>
                  <div style={summaryTitle}>{equipmentLabel}</div>
                  <div style={summaryMeta}>Reporte #{report?.id || ""}</div>
                </div>
              </div>
              <div style={badgesWrap}>
                {condition ? <span style={conditionBadge(condition)}>{condition}</span> : null}
                {status ? <span style={statusBadge}>{status}</span> : null}
              </div>
            </div>

            {report?.description ? <div style={description}>{report.description}</div> : null}

            {evidenceImage ? (
              <a href={evidenceImage} target="_blank" rel="noreferrer" style={evidenceLink}>
                <img src={evidenceImage} alt="Evidencia del reporte" style={evidenceImg} />
              </a>
            ) : null}
          </div>

          <div style={formCard}>
            <div style={grid2}>
              <label style={field}>
                <span style={lbl}>Fecha programada</span>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  style={inp}
                />
              </label>

              <label style={field}>
                <span style={lbl}>Asignar tecnico</span>
                <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} style={inp}>
                  <option value="">{techLoading ? "Cargando" : "Sin asignar"}</option>
                  {techs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || `Técnico ${t.id}`}
                      {t.code ? `  ${t.code}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={field}>
              <span style={lbl}>Instrucciones</span>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                style={ta}
                placeholder="Describe qué hacer, riesgos, bloqueo-etiquetado, puntos a revisar y criterio de cierre."
                rows={7}
              />
            </label>
          </div>
        </div>

        <div style={foot}>
          <button onClick={onClose} style={btnGhost} disabled={saving}>Cancelar</button>
          <button onClick={onSubmit} style={btnPrimary} disabled={saving}>
            {saving ? "Guardando" : "Crear acción"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateCorrectiveExecutionModal;

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.55)",
  display: "grid",
  placeItems: "center",
  padding: 14,
  zIndex: 60,
};

const modal = {
  width: "min(860px, 100%)",
  background: "rgba(255,255,255,0.97)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 20,
  padding: 16,
  boxShadow: "0 24px 60px rgba(2,6,23,0.25)",
  backdropFilter: "blur(6px)",
};

const head = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" };
const kicker = { fontSize: 11, letterSpacing: "0.12em", fontWeight: 900, color: "#92400e" };
const title = { marginTop: 2, fontWeight: 980, color: "#0f172a", fontSize: 18 };
const sub = { marginTop: 5, color: "#64748b", fontWeight: 850, fontSize: 12, maxWidth: 580 };

const xBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
};

const shell = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
  gap: 14,
};

const summaryCard = {
  display: "grid",
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "linear-gradient(180deg, rgba(255,251,235,0.98), rgba(255,255,255,0.98))",
};

const formCard = {
  display: "grid",
  gap: 14,
  padding: 14,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
};

const summaryHead = { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" };
const summaryTitleRow = { display: "flex", gap: 10, alignItems: "flex-start" };
const summaryIcon = { width: 34, height: 34, borderRadius: 12, background: "#fff", border: "1px solid #f3e8ff", display: "grid", placeItems: "center", color: "#92400e" };
const summaryTitle = { fontWeight: 950, color: "#0f172a" };
const summaryMeta = { marginTop: 4, fontSize: 12, color: "#64748b", fontWeight: 850 };
const badgesWrap = { display: "flex", gap: 8, flexWrap: "wrap" };
const description = { fontSize: 13, lineHeight: 1.5, color: "#334155", whiteSpace: "pre-wrap" };
const evidenceLink = { display: "inline-block", textDecoration: "none" };
const evidenceImg = { width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 14, border: "1px solid #e5e7eb" };

const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const field = { display: "grid", gap: 6 };
const lbl = { fontSize: 12, fontWeight: 900, color: "#64748b" };
const inp = { border: "1px solid rgba(226,232,240,0.95)", borderRadius: 12, padding: "10px 12px", fontWeight: 900, background: "rgba(255,255,255,0.95)", outline: "none" };
const ta = { ...inp, fontWeight: 850, resize: "vertical", minHeight: 150 };

const foot = { marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" };
const btnPrimary = { border: "none", background: "#0f172a", color: "#fff", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 950 };
const btnGhost = { border: "1px solid #e5e7eb", background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 950 };
const errorBox = { marginTop: 12, background: "#fee2e2", border: "1px solid #fecaca", padding: 12, borderRadius: 12, color: "#991b1b", fontWeight: 900 };
const statusBadge = { display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "6px 10px", background: "#e2e8f0", color: "#334155", fontWeight: 900, fontSize: 11 };
const conditionBadge = (condition) => ({ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "6px 10px", background: condition === "CRITICO" ? "#fee2e2" : condition === "MALO" ? "#ffedd5" : condition === "REGULAR" ? "#fef3c7" : "#dcfce7", color: condition === "CRITICO" ? "#991b1b" : condition === "MALO" ? "#9a3412" : condition === "REGULAR" ? "#92400e" : "#166534", fontWeight: 900, fontSize: 11 });

