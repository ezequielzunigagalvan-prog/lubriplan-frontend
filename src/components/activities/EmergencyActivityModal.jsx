import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Icon } from "../ui/lpIcons";
import { getEquipment } from "../../services/equipmentService";
import { getLubricants } from "../../services/lubricantsService";
import { createEmergencyActivity } from "../../services/emergencyActivitiesService";
import { getTechnicians } from "../../services/techniciansService";

const toYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (!dt || Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const num = (v) => {
  const s = String(v ?? "").trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

const normalizeText = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

export default function EmergencyActivityModal({ open, onClose, onSaved }) {
  const { user } = useAuth();
  const role = String(user.role || "").toUpperCase();
  const isTech = role === "TECHNICIAN";
  const myTechId = user.technicianId != null ? String(user.technicianId) : "";
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const initial = useMemo(
    () => ({
      equipmentId: "",
      emergencyReason: "",
      executedAt: toYMD(new Date()),
      technicianId: isTech ? myTechId : "",
      lubricantId: "",
      quantity: "",
      unit: "ml",
      condition: "BUENO",
      observations: "",
      evidenceImage: "",
      evidenceNote: "",
    }),
    [isTech, myTechId]
  );

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [equipments, setEquipments] = useState([]);
  const [lubricants, setLubricants] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(initial);
    setErr("");
    setEquipmentSearch("");
    setEvidenceFileName("");
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const [eq, lub, tech] = await Promise.all([
          getEquipment().catch(() => []),
          getLubricants().catch(() => []),
          getTechnicians().catch(() => []),
        ]);
        setEquipments(Array.isArray(eq?.items) ? eq.items : Array.isArray(eq) ? eq : []);
        setLubricants(Array.isArray(lub?.items) ? lub.items : Array.isArray(lub) ? lub : []);
        setTechnicians(Array.isArray(tech?.items) ? tech.items : Array.isArray(tech) ? tech : []);
      } catch {
        setEquipments([]);
        setLubricants([]);
        setTechnicians([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!form.lubricantId) return;
    const selected = (lubricants || []).find((l) => String(l.id) === String(form.lubricantId));
    if (selected?.unit) setForm((p) => ({ ...p, unit: selected.unit }));
  }, [form.lubricantId, lubricants]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const filteredEquipments = useMemo(() => {
    const q = normalizeText(equipmentSearch);
    if (!q) return Array.isArray(equipments) ? equipments : [];
    return (equipments || []).filter((e) => {
      const name = normalizeText(e?.name);
      const code = normalizeText(e?.code);
      const tag = normalizeText(e?.tag);
      const location = normalizeText(e?.location);
      return name.includes(q) || code.includes(q) || tag.includes(q) || location.includes(q);
    });
  }, [equipments, equipmentSearch]);

  const equipmentOptions = useMemo(
    () => filteredEquipments.map((e) => ({ value: String(e.id), label: `${e.name || "Equipo"}${e.code ? ` ? ${e.code}` : ""}${e.location ? ` ? ${e.location}` : ""}` })),
    [filteredEquipments]
  );

  const selectedEquipment = useMemo(
    () => (equipments || []).find((e) => String(e.id) === String(form.equipmentId)) || null,
    [equipments, form.equipmentId]
  );

  const lubricantOptions = useMemo(
    () => (lubricants || []).map((l) => ({ value: String(l.id), label: `${l.name}${l.code ? ` ? ${l.code}` : ""}${l.unit ? ` (${l.unit})` : ""}` })),
    [lubricants]
  );

  const technicianOptions = useMemo(
    () => (technicians || []).map((t) => ({ value: String(t.id), label: `${t.name || t.fullName || `Técnico #${t.id}`}${t.code ? ` · ${t.code}` : ""}` })),
    [technicians]
  );

  const selectedLubricant = useMemo(
    () => (lubricants || []).find((l) => String(l.id) === String(form.lubricantId)) || null,
    [lubricants, form.lubricantId]
  );

  const handleEvidenceFile = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((p) => ({ ...p, evidenceImage: dataUrl }));
      setEvidenceFileName(file.name || "Imagen adjunta");
    } catch (e) {
      setErr(e?.message || "No se pudo cargar la evidencia.");
    }
  };

  const clearEvidence = () => {
    setForm((p) => ({ ...p, evidenceImage: "" }));
    setEvidenceFileName("");
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const save = async () => {
    try {
      setErr("");
      if (!form.equipmentId) return setErr("Falta: Equipo");
      if (!form.emergencyReason?.trim()) return setErr("Falta: Motivo de la emergencia");
      if (!form.executedAt) return setErr("Falta: Fecha de realización");
      if (!form.lubricantId) return setErr("Falta: Lubricante (inventario)");
      if (!form.technicianId && !isTech) return setErr("Falta: Técnico responsable");

      const payload = {
        equipmentId: Number(form.equipmentId),
        technicianId: form.technicianId ? Number(form.technicianId) : null,
        emergencyReason: form.emergencyReason.trim(),
        executedAt: form.executedAt,
        lubricantId: Number(form.lubricantId),
        quantity: num(form.quantity),
        unit: form.unit || "ml",
        condition: form.condition || "BUENO",
        observations: form.observations?.trim() || null,
        evidenceImage: form.evidenceImage || null,
        evidenceNote: form.evidenceNote?.trim() || null,
      };

      if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
        return setErr("Cantidad inválida");
      }

      if (!payload.technicianId) {
        return setErr("Falta: Técnico responsable");
      }

      setSaving(true);
      await createEmergencyActivity(payload);
      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Error guardando actividad emergente");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={overlay} onMouseDown={saving ? undefined : onClose}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <div style={kicker}>ACTIVIDAD EMERGENTE</div>
            <h2 style={modalTitle}>Registrar actividad emergente</h2>
            <div style={modalSub}>Trabajos no programados: fuga, ajuste urgente, reabastecimiento o atención inmediata.</div>
          </div>
          <button style={xBtn} onClick={onClose} disabled={saving} aria-label="Cerrar">?</button>
        </div>

        {err ? <div style={errorBox}>{err}</div> : null}

        <div style={body}>
          <div style={sectionBox}>
            <div style={sectionTitle}>Equipo y ejecución</div>

            <div style={field}>
              <label style={label}>Buscar equipo / código</label>
              <input value={equipmentSearch} onChange={(e) => setEquipmentSearch(e.target.value)} placeholder="Ej: bomba, EQ-102, reductor, molino..." style={input} disabled={saving} />
              <div style={helperText}>{equipmentSearch.trim() ? `${equipmentOptions.length} resultado(s)` : `${equipmentOptions.length} equipo(s) disponibles`}</div>
            </div>

            <div style={field}>
              <label style={label}>Equipo *</label>
              <select name="equipmentId" value={form.equipmentId} onChange={handleChange} style={input} disabled={saving}>
                <option value="">{equipmentSearch.trim() ? "Seleccionar equipo filtrado" : "Seleccionar equipo"}</option>
                {equipmentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {selectedEquipment ? (
              <div style={helperCard}><span style={helperCardLabel}>Equipo:</span> {selectedEquipment.name || "-"}{selectedEquipment.code ? ` ? ${selectedEquipment.code}` : ""}{selectedEquipment.location ? ` ? ${selectedEquipment.location}` : ""}</div>
            ) : null}

            <div style={row2}>
              <div style={{ ...field, flex: 1, minWidth: 220 }}>
                <label style={label}>Fecha realizada *</label>
                <input type="date" name="executedAt" value={form.executedAt} onChange={handleChange} style={input} disabled={saving} />
              </div>
              <div style={{ ...field, flex: 1, minWidth: 220 }}>
                <label style={label}>Técnico responsable *</label>
                <select name="technicianId" value={form.technicianId} onChange={handleChange} style={input} disabled={saving || isTech} title={isTech ? "Asignado automáticamente a tu usuario" : "Selecciona técnico"}>
                  <option value="">{isTech ? "Mi usuario" : "Seleccionar técnico"}</option>
                  {technicianOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {isTech && !myTechId ? <div style={warnMini}>Tu usuario no tiene técnico asociado.</div> : null}
              </div>
            </div>

            <div style={field}>
              <label style={label}>Motivo de la emergencia *</label>
              <textarea name="emergencyReason" value={form.emergencyReason} onChange={handleChange} placeholder="Qué pasó, por qué fue urgente y qué se atendió." style={{ ...input, minHeight: 100, resize: "vertical" }} disabled={saving} />
            </div>
          </div>

          <div style={sectionBox}>
            <div style={sectionTitle}>Lubricante aplicado</div>
            <div style={field}>
              <label style={label}>Lubricante utilizado (inventario) *</label>
              <select name="lubricantId" value={form.lubricantId} onChange={handleChange} style={input} disabled={saving}>
                <option value="">Seleccionar lubricante</option>
                {lubricantOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {selectedLubricant ? (
              <div style={helperCard}><span style={helperCardLabel}>Lubricante:</span> {selectedLubricant.name || "-"}{selectedLubricant.code ? ` ? ${selectedLubricant.code}` : ""}{selectedLubricant.unit ? ` ? Unidad base: ${selectedLubricant.unit}` : ""}</div>
            ) : null}

            <div style={row2}>
              <div style={{ ...field, flex: 1, minWidth: 220 }}>
                <label style={label}>Cantidad utilizada *</label>
                <input name="quantity" value={form.quantity} onChange={handleChange} inputMode="decimal" placeholder="0.00" style={input} disabled={saving} />
              </div>
              <div style={{ ...field, flex: 1, minWidth: 220 }}>
                <label style={label}>Unidad capturada</label>
                <select name="unit" value={form.unit} onChange={handleChange} style={input} disabled={saving}>
                  <option value="ml">ml</option>
                  <option value="l">L</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
          </div>

          <div style={sectionBox}>
            <div style={sectionTitle}>Resultado y evidencia</div>

            <div style={field}>
              <label style={label}>Condición del equipo</label>
              <select name="condition" value={form.condition} onChange={handleChange} style={input} disabled={saving}>
                <option value="BUENO">Bueno</option>
                <option value="REGULAR">Regular</option>
                <option value="MALO">Malo</option>
                <option value="CRITICO">Cr?tico</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Observaciones</label>
              <textarea name="observations" value={form.observations} onChange={handleChange} placeholder="Trabajo realizado, hallazgos, recomendaciones o seguimiento" style={{ ...input, minHeight: 110, resize: "vertical" }} disabled={saving} />
            </div>

            <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleEvidenceFile(e.target.files?.[0] || null)} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handleEvidenceFile(e.target.files?.[0] || null)} />

            <div style={field}>
              <label style={label}>Evidencia visual</label>
              <div style={helperText}>Puedes adjuntar una imagen del punto atendido o tomar una foto desde el m?vil.</div>
              <div style={fileRow}>
                <button type="button" onClick={() => cameraInputRef.current?.click()} style={btnPrimarySmall} disabled={saving}><span style={btnRow}><Icon name="camera" size="sm" /> Tomar foto</span></button>
                <button type="button" onClick={() => uploadInputRef.current?.click()} style={btnGhostSmall} disabled={saving}><span style={btnRow}><Icon name="upload" size="sm" /> Subir imagen</span></button>
                {form.evidenceImage ? <button type="button" onClick={clearEvidence} style={btnGhostSmall} disabled={saving}><span style={btnRow}><Icon name="xCircle" size="sm" /> Quitar</span></button> : null}
              </div>
              {evidenceFileName ? <div style={helperText}>Archivo: {evidenceFileName}</div> : null}
              {form.evidenceImage ? <img src={form.evidenceImage} alt="Evidencia" style={evidenceImg} /> : null}
            </div>

            <div style={field}>
              <label style={label}>Nota de evidencia</label>
              <textarea name="evidenceNote" value={form.evidenceNote} onChange={handleChange} placeholder="Qué muestra la imagen o qué debe revisarse después" style={{ ...input, minHeight: 84, resize: "vertical" }} disabled={saving} />
            </div>
          </div>
        </div>

        <div style={actions}>
          <button style={btnGhost} onClick={onClose} disabled={saving}>Cancelar</button>
          <button style={btnPrimary} onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar emergencia"}</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(2,6,23,0.6)", display: "grid", placeItems: "center", padding: 14, zIndex: 60 };
const modal = { width: "min(920px, 100%)", maxHeight: "92vh", overflow: "auto", background: "rgba(255,255,255,0.97)", borderRadius: 24, border: "1px solid rgba(226,232,240,0.95)", boxShadow: "0 24px 60px rgba(2,6,23,0.25)", backdropFilter: "blur(8px)" };
const modalHeader = { position: "sticky", top: 0, zIndex: 1, background: "rgba(255,255,255,0.96)", borderBottom: "1px solid #eef2f7", padding: 16, display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" };
const kicker = { fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#b45309" };
const modalTitle = { margin: "2px 0 0", fontSize: 20, fontWeight: 980, color: "#0f172a" };
const modalSub = { marginTop: 6, color: "#64748b", fontWeight: 850, fontSize: 13 };
const xBtn = { border: "1px solid rgba(226,232,240,0.95)", background: "rgba(255,255,255,0.9)", borderRadius: 12, width: 40, height: 40, display: "grid", placeItems: "center", cursor: "pointer" };
const errorBox = { margin: "16px 16px 0", background: "#fee2e2", border: "1px solid #fecaca", padding: 12, borderRadius: 12, color: "#991b1b", fontWeight: 900 };
const body = { padding: 16, display: "grid", gap: 14 };
const sectionBox = { display: "grid", gap: 12, padding: 14, borderRadius: 18, border: "1px solid #e5e7eb", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))" };
const sectionTitle = { fontWeight: 950, color: "#0f172a", fontSize: 14 };
const field = { display: "grid", gap: 6 };
const label = { fontSize: 12, fontWeight: 900, color: "#64748b" };
const input = { width: "100%", border: "1px solid rgba(226,232,240,0.95)", borderRadius: 12, padding: "11px 12px", background: "rgba(255,255,255,0.95)", color: "#0f172a", fontWeight: 900, outline: "none" };
const helperText = { fontSize: 12, color: "#64748b", fontWeight: 850 };
const helperCard = { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 12, padding: "10px 12px", fontSize: 12, fontWeight: 850 };
const helperCardLabel = { fontWeight: 950, marginRight: 6 };
const warnMini = { fontSize: 12, color: "#b91c1c", fontWeight: 900 };
const row2 = { display: "flex", gap: 12, flexWrap: "wrap" };
const fileRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 10 };
const btnGhostSmall = { border: "1px solid #e5e7eb", background: "#fff", color: "#0f172a", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: "pointer", width: "100%", justifyContent: "center" };
const btnPrimarySmall = { border: "1px solid rgba(249,115,22,0.55)", background: "rgba(249,115,22,0.92)", color: "#0b1220", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: "pointer", width: "100%", justifyContent: "center", boxShadow: "0 14px 28px rgba(249,115,22,0.18)" };
const btnRow = { display: "inline-flex", gap: 8, alignItems: "center" };
const evidenceImg = { width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 14, border: "1px solid #e5e7eb", display: "block" };
const actions = { padding: 16, borderTop: "1px solid #eef2f7", background: "rgba(255,255,255,0.9)", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" };
const btnGhost = { border: "1px solid #e5e7eb", background: "rgba(255,255,255,0.88)", borderRadius: 12, padding: "11px 14px", cursor: "pointer", fontWeight: 950 };
const btnPrimary = { border: "none", background: "#0f172a", color: "#fff", borderRadius: 12, padding: "11px 14px", cursor: "pointer", fontWeight: 950 };




