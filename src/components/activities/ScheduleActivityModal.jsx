import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/lpIcons";
import { createManualExecution } from "../../services/executionsService";
import { getEquipment } from "../../services/equipmentService";
import { getTechnicians } from "../../services/techniciansService";

const toYMD = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

export default function ScheduleActivityModal({ open, onClose, onSaved, canAssignTech = true }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [equipments, setEquipments] = useState([]);
  const [techs, setTechs] = useState([]);
  const [eqQuery, setEqQuery] = useState("");
  const [evidencePreview, setEvidencePreview] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [form, setForm] = useState({
    equipmentId: "",
    manualTitle: "",
    manualInstructions: "",
    scheduledAt: toYMD(new Date()),
    technicianId: "",
    evidenceImage: "",
    evidenceNote: "",
  });

  useEffect(() => {
    if (!open) return;

    setErr("");
    setSaving(false);
    setEqQuery("");
    setEvidencePreview("");
    setEvidenceFileName("");
    setForm({
      equipmentId: "",
      manualTitle: "",
      manualInstructions: "",
      scheduledAt: toYMD(new Date()),
      technicianId: "",
      evidenceImage: "",
      evidenceNote: "",
    });

    (async () => {
      try {
        const eq = await getEquipment();
        setEquipments(Array.isArray(eq?.items) ? eq.items : Array.isArray(eq) ? eq : []);
      } catch {
        setEquipments([]);
      }
    })();

    (async () => {
      if (!canAssignTech) return;
      try {
        const t = await getTechnicians();
        setTechs(Array.isArray(t) ? t : Array.isArray(t?.items) ? t.items : []);
      } catch {
        setTechs([]);
      }
    })();
  }, [open, canAssignTech]);

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const filteredEquipments = useMemo(() => {
    const s = String(eqQuery || "").trim().toLowerCase();
    if (!s) return equipments;

    return (equipments || []).filter((eq) => {
      const code = String(eq?.code || "").toLowerCase();
      const name = String(eq?.name || "").toLowerCase();
      const loc = String(eq?.location || "").toLowerCase();
      return code.includes(s) || name.includes(s) || loc.includes(s);
    });
  }, [equipments, eqQuery]);

  const equipmentLabel = useMemo(() => {
    const id = Number(form.equipmentId);
    const eq = (equipments || []).find((x) => Number(x.id) === id);
    if (!eq) return "";
    return `${eq.name}${eq.code ? ` · ${eq.code}` : ""}${eq.location ? ` · ${eq.location}` : ""}`;
  }, [equipments, form.equipmentId]);

  const selectedTechnician = useMemo(() => {
    const id = Number(form.technicianId);
    return (techs || []).find((x) => Number(x.id) === id) || null;
  }, [techs, form.technicianId]);

  const handleEvidenceFile = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((p) => ({ ...p, evidenceImage: dataUrl }));
      setEvidencePreview(dataUrl);
      setEvidenceFileName(file.name || "Imagen adjunta");
    } catch (e) {
      setErr(e?.message || "No se pudo cargar la evidencia.");
    }
  };

  const clearEvidence = () => {
    setForm((p) => ({ ...p, evidenceImage: "" }));
    setEvidencePreview("");
    setEvidenceFileName("");
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const save = async (e) => {
    e.preventDefault();
    setErr("");

    const equipmentId = Number(form.equipmentId);
    if (!Number.isFinite(equipmentId)) return setErr("Selecciona un equipo.");

    const manualTitle = String(form.manualTitle || "").trim();
    if (!manualTitle) return setErr("Escribe el nombre de la actividad.");

    const scheduledAt = String(form.scheduledAt || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledAt)) return setErr("Fecha inválida.");

    const technicianId =
      form.technicianId === "" || form.technicianId == null ? null : Number(form.technicianId);

    if (technicianId !== null && !Number.isFinite(technicianId)) {
      return setErr("Técnico inválido.");
    }

    setSaving(true);
    try {
      await createManualExecution({
        origin: "MANUAL",
        equipmentId,
        manualTitle,
        manualInstructions: String(form.manualInstructions || "").trim() || null,
        scheduledAt,
        technicianId,
        evidenceImage: form.evidenceImage || null,
        evidenceNote: String(form.evidenceNote || "").trim() || null,
      });

      onClose?.();
      onSaved?.();
    } catch (e2) {
      setErr(e2?.message || "Error programando actividad");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="lpModalOverlay"
      onClick={(e) => {
        if (e.target.classList.contains("lpModalOverlay") && !saving) onClose?.();
      }}
    >
      <div className="lpModal" style={modalCard}>
        <div className="lpModalHeader" style={headerRow}>
          <div>
            <div style={kicker}>ACTIVIDAD ÚNICA</div>
            <div style={{ fontWeight: 980, fontSize: 18, color: "#0f172a" }}>Programar actividad</div>
            <div className="lpMuted" style={{ marginTop: 6 }}>
              Crea una actividad no recurrente y deja evidencia de referencia si hace falta.
            </div>
          </div>
          <button className="lpBtnGhost lpPress" type="button" onClick={onClose} title="Cerrar" disabled={saving}>
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
          <div style={sectionCard}>
            <div style={sectionTitle}>Contexto</div>

            <label className="lpModalLabel">
              Buscar equipo
              <input
                className="lpInput"
                value={eqQuery}
                onChange={(e) => setEqQuery(e.target.value)}
                placeholder="Buscar por TAG, nombre o ubicación"
                style={{ marginTop: 8, marginBottom: 8 }}
              />
            </label>

            <label className="lpModalLabel">
              Equipo *
              <select className="lpInput" value={form.equipmentId} onChange={onChange("equipmentId")} required>
                <option value="">Selecciona equipo</option>
                {filteredEquipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                    {eq.code ? ` · ${eq.code}` : ""}
                    {eq.location ? ` · ${eq.location}` : ""}
                  </option>
                ))}
              </select>
            </label>

            {equipmentLabel ? <div style={infoPill}>Equipo seleccionado: {equipmentLabel}</div> : null}

            <div style={grid2}>
              <label className="lpModalLabel">
                Fecha *
                <input className="lpInput" type="date" value={form.scheduledAt} onChange={onChange("scheduledAt")} required />
              </label>

              {canAssignTech ? (
                <label className="lpModalLabel">
                  Técnico
                  <select className="lpInput" value={form.technicianId} onChange={onChange("technicianId")}>
                    <option value="">Sin asignar</option>
                    {techs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.code ? ` · ${t.code}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {selectedTechnician ? (
              <div style={miniMeta}>Responsable sugerido: {selectedTechnician.name}{selectedTechnician.code ? ` (${selectedTechnician.code})` : ""}</div>
            ) : null}
          </div>

          <div style={sectionCard}>
            <div style={sectionTitle}>Actividad</div>

            <label className="lpModalLabel">
              Título *
              <input
                className="lpInput"
                value={form.manualTitle}
                onChange={onChange("manualTitle")}
                placeholder="Ej. Lubricar chumacera motor #2"
                required
              />
            </label>

            <label className="lpModalLabel">
              Instrucciones
              <textarea
                className="lpInput"
                value={form.manualInstructions}
                onChange={onChange("manualInstructions")}
                placeholder="Puntos, riesgos, EPP, secuencia, criterio de aceptación"
                style={{ minHeight: 110, resize: "vertical" }}
              />
            </label>
          </div>

          <div style={sectionCard}>
            <div style={sectionTitle}>Evidencia de referencia</div>
            <div className="lpMuted" style={{ marginTop: -4, marginBottom: 8 }}>
              Útil para dejar una foto del punto, orden de trabajo o condición previa. En móvil puedes tomarla al momento.
            </div>

            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleEvidenceFile(e.target.files?.[0] || null)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleEvidenceFile(e.target.files?.[0] || null)}
            />

            <div style={evidenceActions}>
              <button type="button" className="lpBtnGhost lpPress" onClick={() => uploadInputRef.current?.click()} disabled={saving}>
                <span style={btnRow}><Icon name="upload" size="sm" /> Subir imagen</span>
              </button>
              <button type="button" className="lpBtnGhost lpPress" onClick={() => cameraInputRef.current?.click()} disabled={saving}>
                <span style={btnRow}><Icon name="camera" size="sm" /> Tomar foto</span>
              </button>
              {form.evidenceImage ? (
                <button type="button" className="lpBtnGhost lpPress" onClick={clearEvidence} disabled={saving}>
                  <span style={btnRow}><Icon name="xCircle" size="sm" /> Quitar</span>
                </button>
              ) : null}
            </div>

            <label className="lpModalLabel">
              Nota de evidencia
              <textarea
                className="lpInput"
                value={form.evidenceNote}
                onChange={onChange("evidenceNote")}
                placeholder="Qué muestra la imagen o qué debe revisarse después"
                style={{ minHeight: 84, resize: "vertical" }}
              />
            </label>

            {evidencePreview ? (
              <div style={previewCard}>
                <div style={previewMeta}>Adjunto: {evidenceFileName || "Imagen"}</div>
                <img src={evidencePreview} alt="Evidencia" style={previewImg} />
              </div>
            ) : null}
          </div>

          {err ? <div className="lpModalError">{err}</div> : null}

          <div className="lpModalActions" style={{ flexWrap: "wrap" }}>
            <button type="button" className="lpBtnGhost lpPress" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="lpBtnPrimary lpPress" disabled={saving}>
              {saving ? "Guardando..." : "Programar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalCard = {
  width: "min(680px, calc(100vw - 24px))",
  maxHeight: "calc(100vh - 24px)",
  overflow: "auto",
};

const headerRow = {
  alignItems: "flex-start",
};

const kicker = {
  fontSize: 11,
  letterSpacing: "0.12em",
  fontWeight: 900,
  color: "#b45309",
};

const sectionCard = {
  display: "grid",
  gap: 12,
  padding: 14,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
};

const sectionTitle = {
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 14,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
  gap: 12,
};

const infoPill = {
  padding: "10px 12px",
  borderRadius: 12,
  background: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: 850,
  fontSize: 12,
};

const miniMeta = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
};

const evidenceActions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const btnRow = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const previewCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 10,
  background: "#fff",
};

const previewMeta = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
  marginBottom: 8,
};

const previewImg = {
  width: "100%",
  maxHeight: 220,
  objectFit: "cover",
  borderRadius: 12,
  display: "block",
};
