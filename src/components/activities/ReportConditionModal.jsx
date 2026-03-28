import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/lpIcons";
import { getEquipment } from "../../services/equipmentService";
import { createConditionReport } from "../../services/conditionReportsService";

const toYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (!dt || Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function ReportConditionModal({ open, onClose, onSaved, defaultEquipmentId }) {
  const initial = useMemo(
    () => ({
      equipmentId: defaultEquipmentId ? String(defaultEquipmentId) : "",
      detectedAt: toYMD(new Date()),
      condition: "REGULAR",
      category: "OTRO",
      description: "",
    }),
    [defaultEquipmentId]
  );

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [equipments, setEquipments] = useState([]);
  const [loadingEq, setLoadingEq] = useState(false);
  const [eqQuery, setEqQuery] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    setForm(initial);
    setSaving(false);
    setErr("");
    setEqQuery("");
    setFile(null);
    setPreview("");
    setFileName("");

    (async () => {
      try {
        setLoadingEq(true);
        const resp = await getEquipment();
        const items = Array.isArray(resp?.items) ? resp.items : Array.isArray(resp) ? resp : [];
        setEquipments(items);
      } catch (e) {
        console.error("Error cargando equipos:", e);
        setEquipments([]);
      } finally {
        setLoadingEq(false);
      }
    })();
  }, [open, initial]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const filteredEquipments = useMemo(() => {
    const q = normalizeText(eqQuery);
    if (!q) return Array.isArray(equipments) ? equipments : [];

    return (equipments || []).filter((e) => {
      const name = normalizeText(e?.name);
      const code = normalizeText(e?.code);
      const tag = normalizeText(e?.tag);
      const location = normalizeText(e?.location);
      return name.includes(q) || code.includes(q) || tag.includes(q) || location.includes(q);
    });
  }, [equipments, eqQuery]);

  const equipmentOptions = useMemo(
    () =>
      filteredEquipments.map((e) => ({
        value: String(e.id),
      label: `${e.name || "Equipo"}${e.code ? ` ? ${e.code}` : ""}${e.location ? ` ? ${e.location}` : ""}`,
      })),
    [filteredEquipments]
  );

  const selectedEquipment = useMemo(
    () => (equipments || []).find((e) => String(e.id) === String(form.equipmentId)) || null,
    [equipments, form.equipmentId]
  );

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onPickFile = (selectedFile) => {
    const nextFile = selectedFile || null;
    setFile(nextFile);
    setFileName(nextFile?.name || "");

    if (preview) URL.revokeObjectURL(preview);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : "");
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setFile(null);
    setFileName("");
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const save = async () => {
    try {
      setErr("");
      const payload = {
        equipmentId: Number(form.equipmentId),
        detectedAt: form.detectedAt,
        condition: String(form.condition || "REGULAR").toUpperCase(),
        category: form.category ? String(form.category).toUpperCase() : null,
        description: form.description?.trim(),
      };

      if (!payload.equipmentId) return setErr("Falta: Equipo");
      if (!payload.detectedAt) return setErr("Falta: Fecha de detecciÃ³n");
      if (!payload.description) return setErr("Falta: DescripciÃ³n");

      const fd = new FormData();
      fd.append("equipmentId", String(payload.equipmentId));
      fd.append("detectedAt", String(payload.detectedAt));
      fd.append("condition", payload.condition);
      if (payload.category) fd.append("category", payload.category);
      fd.append("description", payload.description);
      if (file) fd.append("evidence", file);

      setSaving(true);
      await createConditionReport(fd);
      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Error reportando condiciÃ³n");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={overlay} onMouseDown={saving ? undefined : onClose} role="dialog" aria-modal="true" aria-label="Reporte de condiciÃ³n">
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={headerIcon} aria-hidden>
              <Icon name="alert" size="lg" weight="bold" />
            </div>
            <div>
              <div style={kicker}>REPORTE DE CONDICIÃ“N</div>
              <h2 style={modalTitle}>Reportar condiciÃ³n anormal</h2>
              <div style={modalSub}>Registra el hallazgo y, si puedes, deja evidencia visual para seguimiento.</div>
            </div>
          </div>
          <button style={xBtn} onClick={onClose} disabled={saving} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>

        {err ? <div style={errorBox}>{err}</div> : null}

        <div style={body}>
          <div style={sectionBox}>
            <div style={sectionTitle}>Equipo y severidad</div>

            <div style={field}>
              <label style={label}>Buscar equipo / TAG</label>
              <input
                value={eqQuery}
                onChange={(e) => setEqQuery(e.target.value)}
                placeholder="Ej: bomba, EQ-102, reductor, molino..."
                style={input}
                disabled={saving}
              />
              <div style={helperText}>
                {eqQuery.trim() ? `${equipmentOptions.length} resultado(s)` : `${equipmentOptions.length} equipo(s) disponibles`}
              </div>
            </div>

            <div style={field}>
              <label style={label}>Equipo *</label>
              <select name="equipmentId" value={form.equipmentId} onChange={handleChange} style={input} disabled={saving}>
                <option value="">{loadingEq ? "Cargando equipos..." : "Seleccionar equipo"}</option>
                {equipmentOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {selectedEquipment ? (
              <div style={helperCard}>
                <span style={helperCardLabel}>Equipo:</span> {selectedEquipment.name || "-"}
                {selectedEquipment.code ? ` Â· ${selectedEquipment.code}` : ""}
                {selectedEquipment.location ? ` Â· ${selectedEquipment.location}` : ""}
              </div>
            ) : null}

            <div style={row2}>
              <div style={{ ...field, flex: 1, minWidth: 220 }}>
                <label style={label}>Fecha de detecciÃ³n *</label>
                <input type="date" name="detectedAt" value={form.detectedAt} onChange={handleChange} style={input} disabled={saving} />
              </div>
              <div style={{ ...field, flex: 1, minWidth: 220 }}>
                <label style={label}>Nivel de condiciÃ³n *</label>
                <select name="condition" value={form.condition} onChange={handleChange} style={input} disabled={saving}>
                  <option value="BUENO">Bueno</option>
                  <option value="REGULAR">Regular</option>
                  <option value="MALO">Malo</option>
                  <option value="CRITICO">CrÃ­tico</option>
                </select>
              </div>
            </div>

            <div style={field}>
              <label style={label}>CategorÃ­a</label>
              <select name="category" value={form.category} onChange={handleChange} style={input} disabled={saving}>
                <option value="FUGA">Fuga</option>
                <option value="RUIDO">Ruido</option>
                <option value="VIBRACION">VibraciÃ³n</option>
                <option value="TEMPERATURA">Temperatura</option>
                <option value="CONTAMINACION">ContaminaciÃ³n</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <div style={sectionBox}>
            <div style={sectionTitle}>Hallazgo</div>
            <div style={field}>
              <label style={label}>DescripciÃ³n *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="QuÃ© viste, dÃ³nde, quÃ© tan severo es, quÃ© riesgo representa y quÃ© sugieres revisar."
                style={{ ...input, minHeight: 120, resize: "vertical" }}
                disabled={saving}
              />
            </div>
          </div>

          <div style={sectionBox}>
            <div style={sectionTitle}>Evidencia visual</div>
            <div style={helperText}>En mÃ³vil puedes tomar la foto directamente. Si no tienes evidencia, puedes guardar el reporte sin adjunto.</div>

            <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onPickFile(e.target.files?.[0] || null)} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => onPickFile(e.target.files?.[0] || null)} />

            <div style={fileRow}>
              <button type="button" onClick={() => cameraInputRef.current?.click()} style={btnPrimarySmall} disabled={saving}>
                <span style={btnRow}><Icon name="camera" size="sm" /> Tomar foto</span>
              </button>
              <button type="button" onClick={() => uploadInputRef.current?.click()} style={btnGhostSmall} disabled={saving}>
                <span style={btnRow}><Icon name="upload" size="sm" /> Subir imagen</span>
              </button>
              {file ? (
                <button type="button" onClick={clearFile} style={btnGhostSmall} disabled={saving}>
                  <span style={btnRow}><Icon name="xCircle" size="sm" /> Quitar</span>
                </button>
              ) : null}
            </div>

            {fileName ? <div style={helperText}>Archivo: {fileName}</div> : null}

            {preview ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 6 }}>Vista previa</div>
                <img src={preview} alt="Evidencia" style={evidenceImg} loading="lazy" />
              </div>
            ) : null}
          </div>
        </div>

        <div style={actions}>
          <button style={btnGhost} onClick={onClose} disabled={saving}>Cancelar</button>
          <button style={btnPrimary} onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar reporte"}</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(2,6,23,0.56)", display: "grid", placeItems: "center", padding: 14, zIndex: 60 };
const modal = { width: "min(720px, calc(100vw - 24px))", maxHeight: "calc(100vh - 24px)", overflow: "auto", background: "rgba(255,255,255,0.97)", borderRadius: 24, border: "1px solid rgba(226,232,240,0.95)", boxShadow: "0 24px 60px rgba(2,6,23,0.25)", backdropFilter: "blur(8px)" };
const modalHeader = { position: "sticky", top: 0, zIndex: 1, background: "rgba(255,255,255,0.96)", borderBottom: "1px solid #eef2f7", padding: 14, display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" };
const headerIcon = { width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg, #fee2e2, #ffedd5)", display: "grid", placeItems: "center", color: "#b91c1c", border: "1px solid rgba(248,113,113,0.18)" };
const kicker = { fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#92400e" };
const modalTitle = { margin: "2px 0 0", fontSize: 20, fontWeight: 980, color: "#0f172a" };
const modalSub = { marginTop: 6, color: "#64748b", fontWeight: 850, fontSize: 13 };
const xBtn = { border: "1px solid rgba(226,232,240,0.95)", background: "rgba(255,255,255,0.9)", borderRadius: 12, width: 40, height: 40, display: "grid", placeItems: "center", cursor: "pointer" };
const body = { padding: 14, display: "grid", gap: 14 };
const sectionBox = { display: "grid", gap: 12, padding: 14, borderRadius: 18, border: "1px solid #e5e7eb", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))" };
const sectionTitle = { fontWeight: 950, color: "#0f172a", fontSize: 14 };
const field = { display: "grid", gap: 6 };
const label = { fontSize: 12, fontWeight: 900, color: "#64748b" };
const input = { width: "100%", border: "1px solid rgba(226,232,240,0.95)", borderRadius: 12, padding: "11px 12px", background: "rgba(255,255,255,0.95)", color: "#0f172a", fontWeight: 900, outline: "none" };
const helperText = { fontSize: 12, color: "#64748b", fontWeight: 850 };
const helperCard = { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 12, padding: "10px 12px", fontSize: 12, fontWeight: 850 };
const helperCardLabel = { fontWeight: 950, marginRight: 6 };
const row2 = { display: "flex", gap: 12, flexWrap: "wrap" };
const fileRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 10 };
const btnGhostSmall = { border: "1px solid #e5e7eb", background: "#fff", color: "#0f172a", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: "pointer", width: "100%", justifyContent: "center" };
const btnPrimarySmall = { border: "1px solid rgba(249,115,22,0.55)", background: "rgba(249,115,22,0.92)", color: "#0b1220", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: "pointer", width: "100%", justifyContent: "center", boxShadow: "0 14px 28px rgba(249,115,22,0.18)" };
const btnRow = { display: "inline-flex", gap: 8, alignItems: "center" };
const evidenceImg = { width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 14, border: "1px solid #e5e7eb", display: "block" };
const actions = { padding: 16, borderTop: "1px solid #eef2f7", background: "rgba(255,255,255,0.9)", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" };
const btnGhost = { border: "1px solid #e5e7eb", background: "rgba(255,255,255,0.88)", borderRadius: 12, padding: "11px 14px", cursor: "pointer", fontWeight: 950 };
const btnPrimary = { border: "none", background: "#0f172a", color: "#fff", borderRadius: 12, padding: "11px 14px", cursor: "pointer", fontWeight: 950 };
const errorBox = { margin: "16px 16px 0", background: "#fee2e2", border: "1px solid #fecaca", padding: 12, borderRadius: 12, color: "#991b1b", fontWeight: 900 };

