import { useEffect, useMemo, useState } from "react";
import { createCorrectiveExecution } from "../../services/conditionReportsService";

const box = {
  position: "fixed", inset: 0, background: "rgba(2,6,23,0.55)",
  display: "grid", placeItems: "center", padding: 16, zIndex: 50,
};
const card = {
  width: "min(680px, 100%)",
  background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
  boxShadow: "0 20px 60px rgba(2,6,23,0.25)", padding: 14,
  borderTop: "4px solid #f97316", overflow: "hidden",
};
const cHeader = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  margin: "-14px -14px 12px",
  padding: "14px 14px",
  borderRadius: "14px 14px 0 0",
  borderLeft: "3px solid rgba(249,115,22,0.55)",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "flex-start",
};
const cKicker = { fontSize: 11, fontWeight: 950, color: "rgba(249,115,22,0.90)", letterSpacing: 1.2, marginBottom: 6 };
const cBtnX = { border: "1px solid rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.10)", borderRadius: 12, padding: "8px 10px", cursor: "pointer", fontWeight: 950, color: "#fff" };
const row = { display: "grid", gap: 6, marginTop: 10 };
const lbl = { fontSize: 12, fontWeight: 900, color: "#64748b" };
const inp = { border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", fontWeight: 900 };
const btn = { borderRadius: 12, padding: "10px 12px", fontWeight: 950, cursor: "pointer", border: "1px solid #e5e7eb" };

export default function ScheduleCorrectiveModal({
  open,
  onClose,
  report,
  technicians = [],
  onSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const defaultDateTime = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  const [scheduledAt, setScheduledAt] = useState(defaultDateTime);
  const [technicianId, setTechnicianId] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    setSaving(false);
    setTechnicianId("");
    setScheduledAt(defaultDateTime);

    const eq = report?.equipment;
    const base = [
      "Acción correctiva por condición anormal.",
      eq?.name ? `Equipo: ${eq.name}${eq.code ? ` (${eq.code})` : ""}` : null,
      report?.description ? `Reporte: ${report.description}` : null,
    ].filter(Boolean).join("\n");

    setInstructions(base);
  }, [open, report, defaultDateTime]);

  if (!open) return null;

  const eq = report?.equipment || {};

  const save = async () => {
    try {
      setErr("");
      setSaving(true);

      await createCorrectiveExecution(report.id, {
  scheduledAt,
  technicianId: technicianId || null,
  instructions,
});

      onSaved?.();
    } catch (e) {
      console.error(e);
      setErr(e?.error || e?.message || "Error guardando acción correctiva");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={box} onMouseDown={(e) => (e.target === e.currentTarget ? onClose?.() : null)}>
      <div style={card}>
        <div style={cHeader}>
          <div>
            <div style={cKicker}>CONDICIÓN · CORRECTIVO</div>
            <div style={{ fontWeight: 950, color: "#fff", fontSize: 18 }}>Programar acción correctiva</div>
            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.65)", fontWeight: 850, fontSize: 12 }}>
              Se creará una actividad ligada al reporte y el reporte pasará a <b style={{ color: "rgba(249,115,22,0.90)" }}>IN_PROGRESS</b>.
            </div>
          </div>
          <button style={cBtnX} onClick={onClose} disabled={saving}>✕</button>
        </div>

        {err ? (
          <div style={{ marginTop: 10, background: "#fee2e2", border: "1px solid #fecaca", padding: 10, borderRadius: 12, color: "#991b1b", fontWeight: 900 }}>
            {err}
          </div>
        ) : null}

        <div style={row}>
          <div style={lbl}>Equipo (default)</div>
          <div style={{ fontWeight: 950, color: "#0f172a" }}>
            {eq?.name || "—"} {eq?.code ? `(${eq.code})` : ""} {eq?.location ? `· ${eq.location}` : ""}
          </div>
        </div>

        <div style={row}>
          <div style={lbl}>Fecha programada</div>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={inp} />
        </div>

        <div style={row}>
          <div style={lbl}>Asignar técnico (opcional)</div>
          <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} style={inp}>
            <option value="">Sin asignar</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={row}>
          <div style={lbl}>Instrucciones</div>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} style={{ ...inp, minHeight: 140, fontWeight: 850 }} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button style={btn} onClick={onClose} disabled={saving}>Cancelar</button>
          <button
            style={{ ...btn, background: "#0f172a", color: "#fff", border: "1px solid #0f172a" }}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Crear actividad"}
          </button>
        </div>
      </div>
    </div>
  );
}