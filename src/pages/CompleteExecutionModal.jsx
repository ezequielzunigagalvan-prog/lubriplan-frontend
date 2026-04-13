import { useEffect, useMemo, useRef, useState } from "react";
import { getExecutionById, completeExecution } from "../services/executionsService";
import { getTechnicians } from "../services/techniciansService";
import { getExecutionLubricants } from "../services/lubricantsService";
import { API_ASSETS_URL } from "../services/api";
import { Icon } from "../components/ui/lpIcons";
import { useAuth } from "../context/AuthContext";

/* =========================
   HELPERS
========================= */
const toLocalYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (!dt || Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isTechActive = (t) => {
  const st = String(t?.status || "").trim().toLowerCase();
  return st === "activo";
};

const API_BASE = String(API_ASSETS_URL || "http://localhost:3001").replace(/\/+$/, "");

const buildAssetUrl = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo procesar la imagen"));
    };
    img.src = url;
  });

const compressImageToDataUrl = async (file) => {
  const img = await loadImageFromFile(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen");

  ctx.drawImage(img, 0, 0, width, height);

  const mimeType = "image/jpeg";
  return canvas.toDataURL(mimeType, 0.82);
};

export default function CompleteExecutionModal({ open, executionId, onClose, onSaved }) {
  const [execution, setExecution] = useState(null);
  const [techs, setTechs] = useState([]);
  const [lubricants, setLubricants] = useState([]);
  const [lubeLoading, setLubeLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const aliveRef = useRef(true);
  const today = toLocalYMD(new Date());

  const { user } = useAuth();
const role = String(user?.role || "").toUpperCase();
const isTechUser = role === "TECHNICIAN";
const loggedTechId = user?.technicianId != null ? Number(user.technicianId) : null;

  // evidencia
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const resolveEvidencePreview = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const v = value.trim();

    if (
      v.startsWith("data:image/") ||
      v.startsWith("blob:") ||
      v.startsWith("http://") ||
      v.startsWith("https://")
    ) {
      return v;
    }

    if (v.startsWith("/")) {
      return `${API_BASE}${v}`;
    }

    return `${API_BASE}/${v}`;
  }

  if (value instanceof File || value instanceof Blob) {
    return URL.createObjectURL(value);
  }

  return "";
};

  // consumo opcional (MANUAL o CORRECTIVA)
  const [usedLubricant, setUsedLubricant] = useState(false);

  const [form, setForm] = useState({
    executedAt: "",
    technicianId: "",
    usedQuantity: "",
    usedUnit: "ml",
    usedLubricantId: "",
    condition: "BUENO",
    observations: "",
    evidenceImage: "",
    evidenceNote: "",
  });

  useEffect(() => {
    if (!open) return;
    aliveRef.current = true;

    async function load() {
      try {
        setErr("");
        setLoading(true);
        setLubeLoading(false);

        const [ex, technicians] = await Promise.all([
          getExecutionById(Number(executionId)),
          getTechnicians(),
        ]);

        if (!aliveRef.current) return;

        setExecution(ex);

        const techList = Array.isArray(technicians?.items)
          ? technicians.items
          : Array.isArray(technicians)
          ? technicians
          : [];
        setTechs(techList);

        const origin = String(ex?.origin || "ROUTE").toUpperCase();
        const isManualLoad = origin !== "ROUTE";

        const routeLubId = ex?.route?.lubricantId ?? null;
        const routeQty = Number(ex?.route?.quantity ?? 0);
        const isCorrectiveLikeLoad = !isManualLoad && (!routeLubId || routeQty <= 0);
        const usesOptionalConsumptionLoad = isManualLoad || isCorrectiveLikeLoad;

        let lubItems = [];

        if (usesOptionalConsumptionLoad) {
          setLubeLoading(true);
          try {
            const lubData = await getExecutionLubricants();
            if (!aliveRef.current) return;

            lubItems = Array.isArray(lubData?.items)
              ? lubData.items
              : Array.isArray(lubData)
              ? lubData
              : [];
          } catch (e) {
            console.error("Error cargando lubricantes:", e);
            lubItems = [];
          } finally {
            if (aliveRef.current) setLubeLoading(false);
          }
        }

        setLubricants(lubItems);

        const defaultExecutedAt = ex?.executedAt ? ex.executedAt.slice(0, 10) : today;
        const existingQty = ex?.usedQuantity != null ? String(ex.usedQuantity) : "";

        const shouldUseLube = usesOptionalConsumptionLoad ? Boolean(existingQty) : true;
        setUsedLubricant(shouldUseLube);

        const routeUnitNormLoad = String(ex?.route?.unit || "").trim().toUpperCase();
        const isPumpRouteLoad = !isManualLoad && routeUnitNormLoad === "BOMBAZOS";

        const defaultRouteUnit = isPumpRouteLoad
          ? "BOMBAZOS"
          : String(ex?.route?.unit || "ml").trim().toLowerCase() || "ml";

        const initialQty = usesOptionalConsumptionLoad
          ? existingQty
          : existingQty || String(ex?.route?.quantity ?? "");

       const defaultTechnicianId =
  isTechUser && Number.isFinite(loggedTechId)
    ? String(loggedTechId)
    : ex?.technicianId
    ? String(ex.technicianId)
    : "";

setForm((prev) => ({
  ...prev,
  technicianId: defaultTechnicianId,
  usedQuantity: initialQty,
  usedUnit: usesOptionalConsumptionLoad ? "ml" : defaultRouteUnit,
  usedLubricantId: "",
  condition: ex?.condition || "BUENO",
  observations:
  ex?.origin !== "ROUTE"
    ? ""
    : ex?.observations || "",
  executedAt: defaultExecutedAt,
  evidenceImage: ex?.evidenceImage || "",
  evidenceNote: ex?.evidenceNote || "",
}));
      } catch (e) {
        console.error(e);
        if (!aliveRef.current) return;
        setErr(e?.message || "Error cargando actividad");
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    }

    load();

    return () => {
      aliveRef.current = false;
    };
  }, [open, executionId, today]);

  const origin = String(execution?.origin || "ROUTE").toUpperCase();
  const isManual = origin !== "ROUTE";

  const routeLubricantId = execution?.route?.lubricantId ?? null;
  const routeQty = Number(execution?.route?.quantity ?? 0);
  const isCorrectiveLike = !isManual && (!routeLubricantId || routeQty <= 0);

  const usesOptionalConsumption = isManual || isCorrectiveLike;

  const equipment = isManual ? execution?.equipment : execution?.route?.equipment;
  const equipmentName = equipment?.name || "—";
  const equipmentTag = equipment?.code || equipment?.tag || "";
  const equipmentLocation = equipment?.location || "";

  const manualTitle = String(execution?.manualTitle || "").trim();
  const routeName = execution?.route?.name || "—";

  const instructions = isManual
    ? execution?.manualInstructions || "—"
    : execution?.route?.instructions || "—";

  const routeImg = !isManual ? execution?.route?.imageUrl || "" : "";

  const routeLubricantName =
    execution?.route?.lubricant?.name ||
    execution?.route?.lubricantName ||
    execution?.route?.lubricantType ||
    "—";

  const routeLubricantCode = execution?.route?.lubricant?.code || "";
  const lubricantType = execution?.route?.lubricantType || "—";
  const unit = execution?.route?.unit || "";
  const routeUnitNorm = String(execution?.route?.unit || "").trim().toUpperCase();
  const isPumpRoute = !isManual && routeUnitNorm === "BOMBAZOS";

  const pumpStrokeValue = execution?.route?.pumpStrokeValue ?? null;
  const pumpStrokeUnit = execution?.route?.pumpStrokeUnit ?? "";

  const points = Math.max(1, Number(execution?.route?.points || 1));

  const scheduledLabel = execution?.scheduledAt ? toLocalYMD(execution.scheduledAt) : "";
  const isFutureExecution = execution?.status !== "COMPLETED" && scheduledLabel && scheduledLabel > today;
  const isCompleted = execution?.status === "COMPLETED";

  const selectedTech = useMemo(() => {
  const currentId =
    form.technicianId && String(form.technicianId).trim() !== ""
      ? String(form.technicianId)
      : isTechUser && Number.isFinite(loggedTechId)
      ? String(loggedTechId)
      : "";

  if (!currentId) return null;
  return techs.find((t) => String(t.id) === currentId) || null;
}, [techs, form.technicianId, isTechUser, loggedTechId]);

  const selectedTechInactive = selectedTech ? !isTechActive(selectedTech) : false;

  const routePreviewUrl = useMemo(() => buildAssetUrl(routeImg), [routeImg]);
  const evidencePreviewUrl = useMemo(() => buildAssetUrl(form.evidenceImage), [form.evidenceImage]);

  const canSave = useMemo(() => {
    if (isFutureExecution) return false;
    if (isCompleted) return false;

    if (!form.executedAt || !form.technicianId || !form.condition) return false;
    if (selectedTechInactive) return false;

    if (usesOptionalConsumption) {
      if (usedLubricant) {
        if (!form.usedLubricantId) return false;
        if (form.usedQuantity === "") return false;
        if (!form.usedUnit) return false;
      }
    } else {
      if (form.usedQuantity === "") return false;
    }

    return true;
  }, [
    form.executedAt,
    form.technicianId,
    form.condition,
    form.usedQuantity,
    form.usedLubricantId,
    form.usedUnit,
    isFutureExecution,
    isCompleted,
    selectedTechInactive,
    usesOptionalConsumption,
    usedLubricant,
  ]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((p) => {
      const next = { ...p, [name]: value };

      if (name === "usedLubricantId") {
        const picked = lubricants.find((x) => String(x.id) === String(value));
        if (picked?.unit) next.usedUnit = String(picked.unit).trim().toLowerCase();
      }

      return next;
    });

    if (name === "technicianId") setErr("");
  };

  const onPickEvidence = async (file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setErr("Selecciona una imagen válida.");
      return;
    }

    try {
      setErr("");
      const dataUrl = await compressImageToDataUrl(file);
      setForm((p) => ({ ...p, evidenceImage: dataUrl }));
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar la imagen.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSave) {
      if (isFutureExecution) return setErr(`Esta actividad está programada para ${scheduledLabel}.`);
      if (selectedTechInactive) return setErr("No puedes asignar un técnico inactivo.");

      if (usesOptionalConsumption && usedLubricant) {
        if (!form.usedLubricantId) return setErr("Selecciona el lubricante utilizado.");
        if (form.usedQuantity === "") return setErr("Captura la cantidad utilizada.");
        if (!form.usedUnit) return setErr("Selecciona la unidad.");
      }

      if (!usesOptionalConsumption && form.usedQuantity === "") {
        return setErr(isPumpRoute ? "Captura los bombazos utilizados." : "Captura la cantidad utilizada.");
      }

      return setErr("Completa los campos obligatorios");
    }

    try {
      setErr("");
      setSaving(true);

      const qty =
        form.usedQuantity === "" || form.usedQuantity == null ? null : Number(form.usedQuantity);

      const payload = {
        executedAt: form.executedAt,
        technicianId:
  isTechUser && Number.isFinite(loggedTechId)
    ? loggedTechId
    : Number(form.technicianId),

        usedQuantity: usesOptionalConsumption ? (usedLubricant ? qty : null) : qty,

        usedLubricantId:
          usesOptionalConsumption && usedLubricant
            ? Number(form.usedLubricantId)
            : null,

        usedUnit:
          usesOptionalConsumption && usedLubricant
            ? String(form.usedUnit || "ml")
            : null,

        condition: form.condition,
        observations: form.observations,

        evidenceImage: form.evidenceImage || null,
        evidenceNote: form.evidenceNote?.trim() || null,
      };

      await completeExecution(Number(executionId), payload);

      const fresh = await getExecutionById(Number(executionId));
      setExecution(fresh);
      onSaved?.(fresh);
      onClose?.();
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || "Error completando actividad");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <div style={kicker}>COMPLETAR ACTIVIDAD</div>

            <h2 style={title}>
              {isManual ? (manualTitle || "Actividad programada") : "Completar actividad"}
            </h2>

            <div style={sub}>
              {usesOptionalConsumption
                ? "Registra ejecución real · consumo opcional"
                : "Registra ejecución real"}
            </div>

            {isCorrectiveLike ? (
              <div style={microWarn}>
                Actividad correctiva · consumo opcional
              </div>
            ) : null}

            {isPumpRoute ? (
              <div style={microPump}>
                Ruta por bombazos
              </div>
            ) : null}
          </div>

          <button
            style={xBtn}
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
            type="button"
          >
            <Icon name="close" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={body}>
          {err ? <div style={errorBox}>{err}</div> : null}

          {loading && <p style={{ margin: 0, fontWeight: 900, color: "#475569" }}>Cargando...</p>}
          {!loading && !execution && (
            <p style={{ margin: 0, fontWeight: 900, color: "#475569" }}>
              No se encontró la ejecución.
            </p>
          )}

          {!loading && execution && (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div style={metaGrid}>
                <MiniInfoCard
                  icon="settings"
                  label="Equipo"
                  value={equipmentName}
                  sub={
                    <>
                      {equipmentTag ? `TAG: ${equipmentTag}` : "Sin TAG"}
                      {equipmentLocation ? ` · ${equipmentLocation}` : ""}
                    </>
                  }
                />

                <MiniInfoCard
                  icon="drop"
                  label="Lubricante"
                  value={routeLubricantName}
                  sub={
                    routeLubricantCode
                      ? `${routeLubricantCode}${lubricantType && lubricantType !== routeLubricantName ? ` · ${lubricantType}` : ""}`
                      : lubricantType
                  }
                />

                <MiniInfoCard
                  icon="route"
                  label="Ruta"
                  value={isManual ? "Actividad programada" : routeName}
                  sub={isManual ? "Manual / Única" : "Ruta recurrente"}
                />

                <MiniInfoCard
                  icon="calendar"
                  label="Programada"
                  value={scheduledLabel || "—"}
                  sub={execution?.status === "COMPLETED" ? "Ya completada" : "Fecha objetivo"}
                />
              </div>

              {!isManual && routePreviewUrl ? (
                <div style={assetCard}>
                  <div style={assetHeader}>
                    <div style={assetTitleWrap}>
                      <span style={assetIconWrap}>
                        <Icon name="camera" style={{ width: 16, height: 16, color: "#0b1220" }} />
                      </span>
                      <div>
                        <div style={assetTitle}>Referencia visual del punto</div>
                        <div style={assetSub}>Imagen cargada al crear la ruta</div>
                      </div>
                    </div>
                  </div>

                  <div style={assetImageWrap}>
                    <img
                      src={routePreviewUrl}
                      alt="Referencia de la ruta"
                      style={routeReferenceImg}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {String(instructions || "").trim() && instructions !== "—" ? (
                <div style={instructionsHero}>
                  <div style={instructionsHeroHead}>
                    <span style={instructionsIconWrap}>
                      <Icon name="doc" style={{ width: 18, height: 18, color: "#052e16" }} />
                    </span>
                    <div>
                      <div style={instructionsHeroTitle}>Instrucciones de ejecución</div>
                      <div style={instructionsHeroSub}>Visible antes de registrar la actividad</div>
                    </div>
                  </div>

                  <div style={instructionsText}>
                    {instructions}
                  </div>
                </div>
              ) : null}

              {isFutureExecution ? (
                <div style={warnBox}>
                  <b>Programada para:</b> {scheduledLabel}. No se puede completar aún.
                </div>
              ) : null}

              <div style={formGrid2}>
                <Field label="Fecha de realización *">
                  <input
                    type="date"
                    name="executedAt"
                    value={form.executedAt}
                    onChange={handleChange}
                    max={today}
                    style={input}
                    disabled={saving || isCompleted}
                  />
                </Field>

                <Field label="Técnico responsable *">
                  <select
  name="technicianId"
  value={form.technicianId}
  onChange={handleChange}
  style={{
    ...input,
    ...(isTechUser ? inputLocked : null),
  }}
  disabled={saving || isCompleted || isTechUser}
>
  <option value="">Seleccionar técnico</option>
  {techs.map((t) => {
    const inactive = !isTechActive(t);
    return (
      <option key={t.id} value={t.id} disabled={inactive}>
        {t.name}
        {t.code ? ` (${t.code})` : ""}
        {inactive ? " — (Inactivo)" : ""}
      </option>
    );
  })}
</select>

                  {selectedTechInactive ? (
  <div style={errorHint}>Ese técnico está inactivo. Selecciona otro.</div>
) : isTechUser ? (
  <div style={hint}>
    Técnico detectado automáticamente desde tu sesión.
  </div>
) : (
  <div style={hint}>
    Los técnicos inactivos aparecen deshabilitados para conservar histórico.
  </div>
)}
                </Field>
              </div>

              {usesOptionalConsumption ? (
                <div style={miniCard}>
                  <div style={miniCardHead}>
                    <div>
                      <div style={miniCardTitle}>Consumo de lubricante</div>
                      <div style={miniCardSub}>Opcional para actividades manuales o correctivas</div>
                    </div>
                  </div>

                  <div style={toggleRow}>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !usedLubricant;
                        setUsedLubricant(next);
                        if (!next) {
                          setForm((p) => ({
                            ...p,
                            usedQuantity: "",
                            usedLubricantId: "",
                            usedUnit: "ml",
                          }));
                        }
                      }}
                      style={{
                        ...toggleBtn,
                        ...(usedLubricant ? toggleBtnOn : {}),
                      }}
                      disabled={saving || isCompleted}
                    >
                      {usedLubricant ? "Sí, se utiliza lubricante" : "No / No aplica"}
                    </button>

                    <div style={hintMini}>
                      Úsalo solo si realmente hubo consumo de inventario.
                    </div>
                  </div>

                  {usedLubricant ? (
                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                      <div>
                        <div style={fieldLabelSmall}>Lubricante (inventario) *</div>
                        <select
                          name="usedLubricantId"
                          value={form.usedLubricantId}
                          onChange={handleChange}
                          style={input}
                          disabled={saving || isCompleted}
                        >
                          <option value="">
                            {lubeLoading ? "Cargando" : "Seleccionar lubricante"}
                          </option>
                          {lubricants.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} {l.code ? `(${l.code})` : ""} · Stock:{" "}
                              {Number(l.stock ?? 0).toFixed(2)} {l.unit || "ml"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={formGridQty}>
                        <div>
                          <div style={fieldLabelSmall}>Cantidad utilizada *</div>
                          <input
                            type="number"
                            step="0.01"
                            name="usedQuantity"
                            value={form.usedQuantity}
                            onChange={handleChange}
                            style={input}
                            disabled={saving || isCompleted}
                            inputMode="decimal"
                          />
                        </div>

                        <div>
                          <div style={fieldLabelSmall}>Unidad *</div>
                          <select
                            name="usedUnit"
                            value={form.usedUnit}
                            onChange={handleChange}
                            style={input}
                            disabled={saving || isCompleted}
                          >
                            <option value="ml">ml</option>
                            <option value="l">L</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Field
                  label={
                    isPumpRoute
                      ? "Bombazos utilizados (por punto) *"
                      : `Cantidad utilizada (por punto) * ${unit ? `(unidad: ${unit})` : ""}`
                  }
                >
                  <input
                    type="number"
                    step="0.01"
                    name="usedQuantity"
                    value={form.usedQuantity}
                    onChange={handleChange}
                    style={input}
                    disabled={saving || isCompleted}
                    inputMode="decimal"
                  />

                  {isPumpRoute ? (
                    <div style={hint}>
                      Puntos: <b>{points}</b>. 1 bombazo = <b>{pumpStrokeValue || "—"}</b>{" "}
                      <b>{pumpStrokeUnit || ""}</b>. El sistema convierte automáticamente para
                      inventario e historial.
                    </div>
                  ) : (
                    <div style={hint}>
                      Puntos: <b>{points}</b>. El descuento final se calcula por punto al completar.
                    </div>
                  )}
                </Field>
              )}

              <div style={formGrid2}>
                <Field label="Condición del equipo *">
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                    style={input}
                    disabled={saving || isCompleted}
                  >
                    <option value="BUENO">Bueno</option>
                    <option value="REGULAR">Regular</option>
                    <option value="MALO">Malo</option>
                    <option value="CRITICO">Crítico</option>
                  </select>
                </Field>

                <Field label="Observaciones">
                  <textarea
                    name="observations"
                    value={form.observations}
                    onChange={handleChange}
                    rows={3}
                    style={textarea}
                    disabled={saving || isCompleted}
                  />
                </Field>
              </div>

              <div style={evidenceCard}>
                <div style={evidenceCardHead}>
                  <div>
                    <div style={evidenceCardTitle}>Evidencia fotográfica</div>
                    <div style={evidenceCardSub}>
                      Toma una foto en campo o sube una imagen existente
                    </div>
                  </div>
                </div>

                <div
                  style={{ ...dropZone, ...(dragOver ? dropZoneOn : {}) }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (saving || isCompleted) return;
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (saving || isCompleted) return;
                    const file = e.dataTransfer?.files?.[0];
                    await onPickEvidence(file);
                  }}
                >
                  <div style={dropMainIcon}>
                    <Icon name="camera" style={{ width: 24, height: 24, color: "#0b1220" }} />
                  </div>

                  <div style={dropTitle}>
                    Arrastra una imagen aquí o usa una de las opciones de abajo
                  </div>

                  <div style={dropHint}>
                    Formatos: JPG, PNG o WEBP · Ideal para evidencia clara del punto atendido
                  </div>

                  <div style={evidenceActions}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={evidencePrimaryBtn}
                      disabled={saving || isCompleted}
                    >
                      <Icon name="camera" style={{ width: 16, height: 16 }} />
                      Tomar foto
                    </button>

                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      style={evidenceGhostBtn}
                      disabled={saving || isCompleted}
                    >
                      <Icon name="plus" style={{ width: 16, height: 16 }} />
                      Subir foto
                    </button>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    disabled={saving || isCompleted}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      await onPickEvidence(file);
                      e.target.value = "";
                    }}
                  />

                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    disabled={saving || isCompleted}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      await onPickEvidence(file);
                      e.target.value = "";
                    }}
                  />
                </div>

                {form.evidenceImage ? (
  <div style={evidencePreviewBox}>
    <div style={evidenceTitleRow}>
      <div style={evidenceTitleOk}>
        <Icon name="camera" size="sm" />
        <span>Evidencia cargada</span>
      </div>

      <button
        type="button"
        onClick={() => setForm((p) => ({ ...p, evidenceImage: "" }))}
        style={miniBtnDanger}
        disabled={saving || isCompleted}
      >
        Quitar
      </button>
    </div>

    <div style={evidencePreviewFrame}>
      <img
        src={resolveEvidencePreview(form.evidenceImage)}
        alt="Vista previa"
        style={evidenceImg}
        onError={(e) => {
          console.error("No se pudo mostrar la evidencia:", form.evidenceImage);
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  </div>
) : null}

                <Field label="Nota de evidencia (opcional)">
                  <textarea
                    value={form.evidenceNote || ""}
                    onChange={(e) => setForm((p) => ({ ...p, evidenceNote: e.target.value }))}
                    rows={2}
                    style={textarea}
                    disabled={saving || isCompleted}
                  />
                </Field>
              </div>

              <div style={footer}>
                <button type="button" onClick={onClose} style={btnGhost} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" disabled={!canSave || saving} style={btnOrange}>
                  {saving ? "Guardando..." : "Completar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={fieldTopLabel}>{label}</div>
      {children}
    </div>
  );
}

function MiniInfoCard({ icon, label, value, sub }) {
  return (
    <div style={miniInfoCard}>
      <div style={miniInfoHead}>
        <span style={miniInfoIcon}>
          <Icon name={icon} style={{ width: 16, height: 16, color: "#0b1220" }} />
        </span>
        <span style={miniInfoLabel}>{label}</span>
      </div>
      <div style={miniInfoValue}>{value || "—"}</div>
      {sub ? <div style={miniInfoSub}>{sub}</div> : null}
    </div>
  );
}

/* =========================
   STYLES
========================= */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.58)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
  padding: 16,
};

const modal = {
  width: "min(1040px, 100%)",
  maxHeight: "92vh",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 26px 80px rgba(0,0,0,0.28)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const modalHeader = {
  padding: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  borderBottom: "1px solid #eef2f7",
  background: "linear-gradient(180deg, rgba(246,247,249,0.90) 0%, rgba(255,255,255,0.70) 100%)",
};

const kicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 1.2,
};

const title = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
};

const sub = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const microWarn = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(251,191,36,0.16)",
  border: "1px solid rgba(251,191,36,0.38)",
  color: "#92400e",
  fontWeight: 950,
  fontSize: 12,
};

const microPump = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(249,115,22,0.14)",
  border: "1px solid rgba(249,115,22,0.35)",
  color: "#9a3412",
  fontWeight: 950,
  fontSize: 12,
};

const xBtn = {
  width: 42,
  height: 42,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.78)",
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const body = {
  padding: 18,
  overflowY: "auto",
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
};

const errorBox = {
  marginBottom: 12,
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.30)",
  padding: 12,
  borderRadius: 14,
  color: "#991b1b",
  fontWeight: 850,
};

const metaGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 12,
};

const miniInfoCard = {
  borderRadius: 16,
  padding: 14,
  background: "rgba(255,255,255,0.86)",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const miniInfoHead = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const miniInfoIcon = {
  width: 30,
  height: 30,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.85)",
  boxShadow: "0 10px 20px rgba(249,115,22,0.14)",
};

const miniInfoLabel = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

const miniInfoValue = {
  marginTop: 12,
  fontSize: 15,
  color: "#0f172a",
  fontWeight: 950,
  lineHeight: 1.25,
};

const miniInfoSub = {
  marginTop: 6,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
  lineHeight: 1.3,
};

const assetCard = {
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.88)",
  overflow: "hidden",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const assetHeader = {
  padding: 14,
  borderBottom: "1px solid rgba(226,232,240,0.85)",
  background: "linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.85) 100%)",
};

const assetTitleWrap = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const assetIconWrap = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.85)",
};

const assetTitle = {
  fontWeight: 950,
  color: "#0f172a",
};

const assetSub = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
};

const assetImageWrap = {
  padding: 14,
};

const routeReferenceImg = {
  width: "100%",
  maxWidth: 560,
  display: "block",
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 12px 26px rgba(2,6,23,0.08)",
};

const instructionsHero = {
  borderRadius: 18,
  padding: 16,
  background: "linear-gradient(180deg, rgba(220,252,231,0.95) 0%, rgba(187,247,208,0.88) 100%)",
  border: "2px solid rgba(34,197,94,0.38)",
  boxShadow: "0 16px 30px rgba(34,197,94,0.10)",
};

const instructionsHeroHead = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

const instructionsIconWrap = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(34,197,94,0.20)",
  border: "1px solid rgba(22,163,74,0.35)",
};

const instructionsHeroTitle = {
  fontWeight: 980,
  color: "#14532d",
  fontSize: 15,
};

const instructionsHeroSub = {
  marginTop: 3,
  fontSize: 12,
  color: "#166534",
  fontWeight: 850,
};

const instructionsText = {
  whiteSpace: "pre-wrap",
  color: "#14532d",
  fontWeight: 900,
  lineHeight: 1.5,
  fontSize: 14,
};

const warnBox = {
  background: "rgba(255,247,237,0.92)",
  border: "1px solid rgba(251,146,60,0.38)",
  padding: 12,
  borderRadius: 14,
  color: "#9a3412",
  fontWeight: 900,
};

const formGrid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
};

const formGridQty = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const fieldTopLabel = {
  fontWeight: 950,
  color: "#0f172a",
  marginBottom: 6,
};

const input = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  fontWeight: 850,
  outline: "none",
  background: "#fff",
  color: "#0f172a",
  boxShadow: "0 8px 16px rgba(2,6,23,0.04)",
};

const textarea = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  resize: "vertical",
  fontWeight: 850,
  outline: "none",
  background: "#fff",
  color: "#0f172a",
  boxShadow: "0 8px 16px rgba(2,6,23,0.04)",
};

const hint = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
};

const errorHint = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 900,
  color: "#b91c1c",
};

const miniCard = {
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.88)",
  padding: 14,
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const miniCardHead = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
};

const miniCardTitle = {
  fontWeight: 950,
  color: "#0f172a",
};

const miniCardSub = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
};

const toggleRow = {
  marginTop: 12,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const toggleBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const toggleBtnOn = {
  border: "1px solid rgba(249,115,22,0.55)",
  background: "rgba(249,115,22,0.16)",
};

const hintMini = {
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
};

const fieldLabelSmall = {
  fontWeight: 950,
  color: "#0f172a",
  marginBottom: 6,
  fontSize: 12,
};

const evidenceCard = {
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.90)",
  padding: 14,
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const evidenceCardHead = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  marginBottom: 10,
};

const evidenceCardTitle = {
  fontWeight: 980,
  color: "#0f172a",
  fontSize: 15,
};

const evidenceCardSub = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
};

const dropZone = {
  borderRadius: 18,
  border: "2px dashed rgba(226,232,240,0.95)",
  background: "linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.92) 100%)",
  padding: 18,
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
};

const dropZoneOn = {
  borderColor: "rgba(249,115,22,0.65)",
  boxShadow: "0 14px 30px rgba(249,115,22,0.14)",
  transform: "translateY(-1px)",
};

const dropMainIcon = {
  width: 52,
  height: 52,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.85)",
  boxShadow: "0 14px 28px rgba(249,115,22,0.14)",
  marginBottom: 12,
};

const dropTitle = {
  fontWeight: 950,
  color: "#0f172a",
};

const dropHint = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
  lineHeight: 1.35,
};

const evidenceActions = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const evidencePrimaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(249,115,22,0.55)",
  background: "rgba(249,115,22,0.92)",
  color: "#0b1220",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 980,
  boxShadow: "0 14px 28px rgba(249,115,22,0.18)",
  justifyContent: "center",
  width: "100%",
};

const evidenceGhostBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  color: "#0f172a",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  justifyContent: "center",
  width: "100%",
};

const evidencePreviewBox = {
  marginTop: 12,
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.95)",
  padding: 12,
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const evidenceTitleRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  marginBottom: 10,
};

const evidenceTitleOk = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 950,
  color: "#166534",
};

const evidencePreviewFrame = {
  width: "100%",
  minHeight: 220,
  borderRadius: 16,
  overflow: "hidden",
  background: "rgba(248,250,252,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const evidenceImg = {
  width: "100%",
  maxHeight: 420,
  objectFit: "contain",
  display: "block",
  background: "#fff",
};


const miniBtnDanger = {
  border: "1px solid rgba(239,68,68,0.35)",
  background: "rgba(239,68,68,0.12)",
  color: "#7f1d1d",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
  justifyContent: "center",
  width: "100%",
};

const footer = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 4,
  flexWrap: "wrap",
};

const btnGhost = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  flex: "1 1 180px",
};

const btnOrange = {
  background: "#f97316",
  color: "#0b1220",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fb923c",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(249,115,22,0.22)",
  flex: "1 1 180px",
};

const inputLocked = {
  background: "rgba(241,245,249,0.95)",
  color: "#334155",
  cursor: "not-allowed",
  border: "1px solid rgba(148,163,184,0.35)",
};




