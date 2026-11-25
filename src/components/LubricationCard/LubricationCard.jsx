import { useRef, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { btnPrimary, btnGhost } from "../ui/styles";
import { Icon } from "../ui/lpIcons";
import PointMarker from "./PointMarker";
import PointDetailPanel from "./PointDetailPanel";
import SyncFromRoutesModal from "./SyncFromRoutesModal";
import { getLubricants } from "../../services/lubricantsService";
import { useConfirm } from "../ui/ConfirmDialog";
import { qrDataUrl } from "../../utils/equipmentQr";
import "./LubricationCardUi.css";

const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"];
const FREQ_LABEL  = { DAILY: "Diaria", WEEKLY: "Semanal", MONTHLY: "Mensual", QUARTERLY: "Trimestral", ANNUAL: "Anual" };
const FREQ_COLOR  = { DAILY: "#dc2626", WEEKLY: "#f97316", MONTHLY: "#d97706", QUARTERLY: "#16a34a", ANNUAL: "#2563eb" };
const METHODS     = ["MANUAL", "AUTO", "GREASE_GUN", "OIL_CAN"];
const METHOD_LABEL= { MANUAL: "Manual", AUTO: "Automático", GREASE_GUN: "Pistola de grasa", OIL_CAN: "Aceitera" };
const UNITS       = ["ml", "L", "g", "kg", "oz", "bombazos"];
// Grupos de color de la leyenda (la frecuencia exacta de cada punto va en la lista).
const LEGEND_LABEL = { DAILY: "Diaria", WEEKLY: "Semanal", MONTHLY: "Mensual", QUARTERLY: "2 a 4 meses", ANNUAL: "6 meses o más" };
const freqText    = (p) => p?.frequencyLabel || FREQ_LABEL[p?.frequency] || p?.frequency || "—";
const EMPTY_FORM  = { label: "", lubricant: "", quantity: "", unit: "ml", frequency: "MONTHLY", method: "MANUAL", notes: "" };

export default function LubricationCard({
  card,
  isEditing,
  canEdit = false,
  equipmentId,
  equipmentName = "Equipo",
  equipment = null,
  qrToken = "",
  onToggleEdit,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onUploadImage,
  onAddSectionImage,
  onRenameSectionImage,
  onRemoveSectionImage,
  onSyncRoutes,
}) {
  const confirm = useConfirm();
  const containerRef   = useRef(null);
  const fileInputRef   = useRef(null);
  const secFileInputRef = useRef(null);
  const exportRef      = useRef(null);
  const pointerDownRef = useRef(null);

  const setRefs = useCallback((node) => {
    containerRef.current = node;
    exportRef.current = node;
  }, []);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Imagen activa (null = principal, number = imageId sección adicional) ──
  const [activeImageId, setActiveImageId] = useState(null);

  // ── Estado de punto ───────────────────────────────────────────────────────
  const [selectedPoint, setSelectedPoint]   = useState(null);
  const [pendingPos, setPendingPos]         = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [formError, setFormError]           = useState("");
  const [saving, setSaving]                 = useState(false);
  const [editingPoint, setEditingPoint]     = useState(null);
  const [draggingId, setDraggingId]         = useState(null);
  const [localPoints, setLocalPoints]       = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [exportingPdf, setExportingPdf]     = useState(false);

  // ── Lubricantes ───────────────────────────────────────────────────────────
  const [lubricants, setLubricants]             = useState([]);
  const [lubricantMode, setLubricantMode]       = useState("select");
  const [selectedLubricantId, setSelectedLubricantId] = useState("");

  // ── Modales ───────────────────────────────────────────────────────────────
  const [showSync, setShowSync]                 = useState(false);
  const [addingSection, setAddingSection]       = useState(false);
  const [newSectionLabel, setNewSectionLabel]   = useState("");

  // Imagen activa
  const activeImage = activeImageId == null
    ? null
    : (card?.images ?? []).find((i) => i.id === activeImageId) ?? null;

  const currentImageUrl = activeImageId == null
    ? card?.imageUrl
    : activeImage?.imageUrl;

  // Puntos de la imagen activa
  const allPoints = localPoints ?? card?.points ?? [];
  const points = allPoints.filter((p) =>
    activeImageId == null ? p.imageId == null : p.imageId === activeImageId
  );

  // Lubricantes al entrar en modo edición
  useEffect(() => {
    if (!isEditing) return;
    getLubricants()
      .then((data) => setLubricants(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []))
      .catch(() => setLubricantMode("manual"));
  }, [isEditing]);

  // ── Lubricante ────────────────────────────────────────────────────────────
  const handleLubricantSelect = useCallback((e) => {
    const val = e.target.value;
    if (val === "__manual__") {
      setLubricantMode("manual");
      setSelectedLubricantId("__manual__");
      setForm((f) => ({ ...f, lubricant: "" }));
      return;
    }
    setSelectedLubricantId(val);
    if (!val) { setForm((f) => ({ ...f, lubricant: "" })); return; }
    const found = lubricants.find((l) => String(l.id) === val);
    if (found) setForm((f) => ({ ...f, lubricant: found.name, unit: found.unit || "ml" }));
  }, [lubricants]);

  const resetLubricantState = useCallback(() => {
    setLubricantMode("select");
    setSelectedLubricantId("");
  }, []);

  // ── Duplicar punto ────────────────────────────────────────────────────────
  const handleDuplicatePoint = useCallback(async (point) => {
    try {
      await onAddPoint?.({
        x: parseFloat(Math.min(100, point.x + 3).toFixed(2)),
        y: parseFloat(Math.min(100, point.y + 3).toFixed(2)),
        label: `${point.label} (copia)`,
        lubricant: point.lubricant, quantity: point.quantity,
        unit: point.unit, frequency: point.frequency,
        method: point.method, notes: point.notes,
        imageId: point.imageId,
      });
      setSelectedPoint(null);
    } catch (err) { toast.error(err?.message || "No se pudo duplicar el punto"); }
  }, [onAddPoint]);

  // ── Click en imagen → agregar punto ─────────────────────────────────────
  const handleContainerClick = useCallback((e) => {
    if (!isEditing || draggingId) return;
    if (e.target.closest("[data-point-marker]")) return;
    if (!currentImageUrl) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPos({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
    setForm(EMPTY_FORM);
    setFormError("");
    setEditingPoint(null);
  }, [isEditing, draggingId, currentImageUrl]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handlePointPointerDown = useCallback((e, pointId) => {
    if (!isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    pointerDownRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    setDraggingId(pointId);
    setLocalPoints(allPoints.map((p) => ({ ...p })));
    containerRef.current?.setPointerCapture?.(e.pointerId);
  }, [isEditing, allPoints]);

  const handleContainerPointerMove = useCallback((e) => {
    if (!draggingId || !isEditing) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = parseFloat(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)).toFixed(2));
    const y = parseFloat(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)).toFixed(2));
    setLocalPoints((prev) => prev.map((p) => (p.id === draggingId ? { ...p, x, y } : p)));
  }, [draggingId, isEditing]);

  const handleContainerPointerUp = useCallback(async (e) => {
    if (!draggingId) return;
    const down = pointerDownRef.current;
    const isTap = down && Math.abs(e.clientX - down.x) < 8 && Math.abs(e.clientY - down.y) < 8 && Date.now() - down.t < 400;
    if (isTap) {
      const tapped = (card?.points ?? []).find((p) => p.id === draggingId);
      if (tapped) setSelectedPoint(tapped);
    } else {
      const moved = (localPoints ?? []).find((p) => p.id === draggingId);
      if (moved) {
        try { await onUpdatePoint?.(draggingId, { x: moved.x, y: moved.y }); } catch (err) { toast.error(err?.message || "No se pudo mover el punto"); }
      }
    }
    pointerDownRef.current = null;
    setDraggingId(null);
    setLocalPoints(null);
  }, [draggingId, localPoints, onUpdatePoint, card?.points]);

  // ── Formulario agregar/editar ─────────────────────────────────────────────
  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.label.trim()) { setFormError("El nombre del punto es obligatorio."); return; }
    setSaving(true);
    setFormError("");
    try {
      if (editingPoint) {
        await onUpdatePoint?.(editingPoint.id, { ...form, quantity: form.quantity ? parseFloat(form.quantity) : null });
        setEditingPoint(null);
      } else {
        await onAddPoint?.({
          ...pendingPos, ...form,
          quantity: form.quantity ? parseFloat(form.quantity) : null,
          imageId: activeImageId,
        });
        setPendingPos(null);
      }
      setForm(EMPTY_FORM);
      setSelectedPoint(null);
    } catch (err) {
      setFormError(err?.message || "Error guardando punto.");
    } finally {
      setSaving(false);
    }
  }, [form, editingPoint, pendingPos, activeImageId, onAddPoint, onUpdatePoint]);

  const handleEditPoint = useCallback((point) => {
    setEditingPoint(point);
    if (point.lubricant) {
      const found = lubricants.find((l) => l.name === point.lubricant);
      if (found) { setLubricantMode("select"); setSelectedLubricantId(String(found.id)); }
      else { setLubricantMode("manual"); setSelectedLubricantId("__manual__"); }
    } else { setLubricantMode("select"); setSelectedLubricantId(""); }
    setForm({
      label: point.label || "", lubricant: point.lubricant || "",
      quantity: point.quantity != null ? String(point.quantity) : "",
      unit: point.unit || "ml", frequency: point.frequency || "MONTHLY",
      method: point.method || "MANUAL", notes: point.notes || "",
    });
    setFormError("");
    setSelectedPoint(null);
    setPendingPos({ x: point.x, y: point.y });
  }, [lubricants]);

  const handleDeletePoint = useCallback(async (pointId) => {
    const ok = await confirm("¿Eliminar este punto de lubricación?", { title: "Eliminar punto", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    try { await onDeletePoint?.(pointId); setSelectedPoint(null); } catch (err) { toast.error(err?.message || "No se pudo eliminar el punto"); }
  }, [onDeletePoint, confirm]);

  // ── Upload imagen ─────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try { await onUploadImage?.(file); } catch (err) { toast.error(err?.message || "No se pudo subir la imagen"); }
    finally { setUploadingImage(false); e.target.value = ""; }
  }, [onUploadImage]);

  // ── Upload imagen adicional (sección) ─────────────────────────────────────
  const handleSectionFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddingSection(true);
    try {
      const img = await onAddSectionImage?.(file, newSectionLabel || "Sección");
      if (img) setActiveImageId(img.id);
      setNewSectionLabel("");
      toast.success("Sección agregada");
    } catch {
      toast.error("Error subiendo sección");
    } finally {
      setAddingSection(false);
      e.target.value = "";
    }
  }, [onAddSectionImage, newSectionLabel]);

  // ── Eliminar sección ─────────────────────────────────────────────────────
  const handleDeleteSection = useCallback(async (imageId) => {
    const ok = await confirm("¿Eliminar esta sección? Los puntos asociados pasarán a la imagen principal.", { title: "Eliminar sección", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    await onRemoveSectionImage?.(imageId);
    setActiveImageId(null);
    toast.success("Sección eliminada");
  }, [onRemoveSectionImage, confirm]);

  // ── Sync desde rutas ─────────────────────────────────────────────────────
  const handleSync = useCallback(async (routeIds, options) => {
    const result = await onSyncRoutes?.(routeIds, options);
    if (result?.created > 0 || result?.updated > 0) {
      toast.success(result.message);
      // Con puntos nuevos entra a edición para arrastrarlos a su lugar en la foto
      if (result.created > 0 && !isEditing) onToggleEdit?.();
    } else {
      toast.info(result?.message || "Sin cambios");
    }
    return result;
  }, [onSyncRoutes, isEditing, onToggleEdit]);

  // ── PDF export ─────────────────────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const pdf = new jsPDF("landscape", "pt", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 30;
      // Encabezado: equipo + QR
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pw, 64, "F");
      pdf.setFillColor(249, 115, 22);
      pdf.rect(0, 64, pw, 4, "F");
      pdf.setTextColor(253, 186, 116); pdf.setFont("helvetica", "bold"); pdf.setFontSize(9);
      pdf.text("CARTA DE LUBRICACIÓN · LUBRIPLAN", margin, 22);
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(18);
      pdf.text(String(equipmentName).slice(0, 60), margin, 44);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
      pdf.text([equipment?.code, equipment?.location, equipment?.plant?.name, new Date().toLocaleDateString("es-MX")].filter(Boolean).join("  ·  "), margin, 58);
      let topY = 80;
      if (qrToken) {
        try {
          const q = await qrDataUrl(qrToken, 240);
          pdf.setFillColor(255, 255, 255);
          pdf.addImage(q, "PNG", pw - margin - 92, 74, 92, 92);
          pdf.setTextColor(100, 116, 139); pdf.setFontSize(7);
          pdf.text("Escanea para abrir la carta", pw - margin - 46, 174, { align: "center" });
        } catch { /* sin QR en el PDF */ }
      }
      const imgAreaW = pw - margin * 2 - (qrToken ? 110 : 0);
      let clampedH = 0;
      if (currentImageUrl) {
        const canvas = await html2canvas(exportRef.current, { useCORS: true, scale: 2, backgroundColor: "#fff" });
        const imgData = canvas.toDataURL("image/png");
        let imgW = imgAreaW;
        let imgH = (canvas.height * imgW) / canvas.width;
        const maxH = ph * 0.5;
        if (imgH > maxH) { imgW = (imgW * maxH) / imgH; imgH = maxH; }
        pdf.addImage(imgData, "PNG", margin, topY, imgW, imgH);
        clampedH = imgH;
      }
      const tableY = Math.max(topY + clampedH + 18, qrToken ? 196 : topY + 10);
      pdf.setTextColor(15, 23, 42); pdf.setFontSize(10); pdf.setFont("helvetica", "bold");
      pdf.text(`Puntos de lubricación (${(card?.points ?? []).length})`, margin, tableY);
      const headers = ["#", "Punto", "Lubricante", "Cantidad", "Frecuencia", "Método", "Notas"];
      const colWidths = [22, 150, 120, 80, 110, 90, 210];
      let curX = margin, curY = tableY + 14;
      pdf.setFillColor(15, 23, 42);
      pdf.rect(margin, curY - 10, pw - margin * 2, 14, "F");
      pdf.setTextColor(255, 255, 255);
      headers.forEach((h, i) => { pdf.text(h, curX + 3, curY); curX += colWidths[i]; });
      pdf.setTextColor(30, 30, 30); pdf.setFont("helvetica", "normal");
      const exportPoints = card?.points ?? [];
      exportPoints.forEach((p, idx) => {
        curY += 14;
        if (curY > ph - margin) { pdf.addPage(); curY = margin + 14; }
        if (idx % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(margin, curY - 10, pw - margin * 2, 14, "F"); }
        curX = margin;
        const row = [String(idx + 1), p.label, p.lubricant || "—", p.quantity != null ? `${p.quantity} ${p.unit}` : "—", freqText(p), METHOD_LABEL[p.method] || p.method, p.notes || "—"];
        row.forEach((cell, i) => { const ml = Math.floor(colWidths[i] / 5.2); const t = String(cell).length > ml ? String(cell).slice(0, ml - 1) + "…" : String(cell); pdf.text(t, curX + 3, curY); curX += colWidths[i]; });
      });
      pdf.save(`carta-lubricacion-${equipmentName.replace(/[^a-zA-Z0-9\-_]/g, "_").slice(0, 30)}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      toast.error("Error generando PDF: " + (err?.message || "intenta de nuevo"));
    } finally { setExportingPdf(false); }
  }, [card?.points, equipmentName, equipment, qrToken, currentImageUrl]);

  // ── Estilos ───────────────────────────────────────────────────────────────
  const inp = { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#0f172a", background: "#fff", fontWeight: 700, boxSizing: "border-box", outline: "none", transition: "border-color 0.15s" };

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(15,23,42,0.07)", overflow: "hidden" }}>

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div style={{ padding: isMobile ? "10px 12px" : "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "#f8fafc" }}>
          <span style={{ fontSize: 13, fontWeight: 950, color: "#0f172a", flex: 1 }}>
            Carta de Lubricación
            {isEditing && <span style={{ marginLeft: 8, fontSize: 11, color: "#f97316", fontWeight: 850 }}>— Modo edición</span>}
          </span>

          {/* Sincronizar desde rutas */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowSync(true)}
              title="Crear los puntos a partir de las rutas del equipo"
              style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", fontSize: 12 }}
            >
              <Icon name="route" size="sm" /> {!isMobile && "Cargar rutas"}
            </button>
          )}

          <button
            type="button"
            style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", fontSize: 12 }}
            onClick={handleExportPdf}
            disabled={exportingPdf || !(card?.points ?? []).length}
            title={!(card?.points ?? []).length ? "Agrega puntos primero" : "Descargar la carta en PDF (con QR)"}
          >
            <Icon name="download" size="sm" />
            {!isMobile && (exportingPdf ? "Generando…" : "PDF")}
          </button>

          {canEdit && (
            <button
              type="button"
              style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", fontSize: 12 }}
              onClick={onToggleEdit}
            >
              <Icon name={isEditing ? "check" : "edit"} size="sm" />
              {!isMobile && (isEditing ? "Finalizar" : "Editar carta")}
            </button>
          )}
        </div>

        {/* ── Tabs de imágenes ─────────────────────────────────────────────── */}
        {((card?.images ?? []).length > 0 || isEditing) && (
          <div style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: "1px solid #e2e8f0", overflowX: "auto", background: "#fafafa", paddingRight: 8 }}>

            {/* Tab imagen principal */}
            <button
              onClick={() => setActiveImageId(null)}
              style={{
                padding: "9px 16px", fontSize: 12, fontWeight: activeImageId == null ? 900 : 700,
                color: activeImageId == null ? "#f97316" : "#64748b",
                background: "none", border: "none", borderBottom: activeImageId == null ? "2px solid #f97316" : "2px solid transparent",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              Principal
            </button>

            {/* Tabs de secciones adicionales */}
            {(card?.images ?? []).map((img) => (
              <div key={img.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <button
                  onClick={() => setActiveImageId(img.id)}
                  style={{
                    padding: "9px 14px", fontSize: 12, fontWeight: activeImageId === img.id ? 900 : 700,
                    color: activeImageId === img.id ? "#f97316" : "#64748b",
                    background: "none", border: "none", borderBottom: activeImageId === img.id ? "2px solid #f97316" : "2px solid transparent",
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {img.label}
                </button>
                {isEditing && (
                  <button
                    onClick={() => handleDeleteSection(img.id)}
                    title="Eliminar sección"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, padding: "4px 2px", lineHeight: 1 }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Botón agregar sección */}
            {isEditing && (
              <>
                <input ref={secFileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSectionFileChange} />
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", flexShrink: 0 }}>
                  <input
                    value={newSectionLabel}
                    onChange={(e) => setNewSectionLabel(e.target.value)}
                    placeholder="Nombre sección"
                    style={{ ...inp, width: 120, padding: "5px 8px", fontSize: 11, height: 30 }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); secFileInputRef.current?.click(); } }}
                  />
                  <button
                    type="button"
                    onClick={() => secFileInputRef.current?.click()}
                    disabled={addingSection}
                    style={{ ...btnGhost, padding: "5px 10px", fontSize: 11, whiteSpace: "nowrap", height: 30 }}
                    title="Agregar sección con nueva imagen"
                  >
                    {addingSection ? "…" : "+ Sección"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Guía rápida: carta nueva ─────────────────────────────────────── */}
        {canEdit && !currentImageUrl && activeImageId == null && !(card?.points ?? []).length && (
          <div className="lc-steps">
            <div className="lc-step">
              <span className="lc-step-n">1</span>
              <b>Sube una foto del equipo</b>
              <span>Una foto clara de frente donde se vean los puntos a lubricar.</span>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              <button type="button" className="lc-btn is-primary" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                <Icon name="camera" size="sm" /> {uploadingImage ? "Subiendo…" : "Subir foto"}
              </button>
            </div>
            <div className="lc-step">
              <span className="lc-step-n">2</span>
              <b>Carga las rutas</b>
              <span>Cada ruta se convierte en un punto con lubricante, cantidad y frecuencia.</span>
              <button type="button" className="lc-btn is-dark" onClick={() => setShowSync(true)}>
                <Icon name="route" size="sm" /> Cargar rutas
              </button>
            </div>
            <div className="lc-step">
              <span className="lc-step-n">3</span>
              <b>Acomoda e imprime</b>
              <span>Arrastra cada punto a su lugar en la foto y descarga el PDF con el QR del equipo.</span>
            </div>
          </div>
        )}

        {/* ── Área de imagen + puntos ──────────────────────────────────────── */}
        <div
          ref={setRefs}
          style={{ position: "relative", width: "100%", minHeight: 260, background: "#f1f5f9", cursor: isEditing ? "crosshair" : "default", userSelect: "none", touchAction: "none", overflow: "hidden" }}
          onClick={handleContainerClick}
          onPointerMove={handleContainerPointerMove}
          onPointerUp={handleContainerPointerUp}
        >
          {currentImageUrl ? (
            <img src={currentImageUrl} alt="Equipo" style={{ width: "100%", display: "block", pointerEvents: "none" }} draggable={false} crossOrigin="anonymous" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 260, color: "#94a3b8", padding: 32, textAlign: "center" }}>
              <Icon name="camera" size="xl" />
              <div style={{ fontSize: 14, fontWeight: 850 }}>
                {isEditing ? "Sube una foto del equipo para comenzar" : "Sin imagen de equipo"}
              </div>
              {!isEditing && <div style={{ fontSize: 12 }}>Activa el modo edición para agregar una imagen</div>}
            </div>
          )}

          {/* Marcadores */}
          {points.map((point, idx) => (
            <div key={point.id} data-point-marker="true">
              <PointMarker
                point={point}
                index={idx}
                isEditing={isEditing}
                onPointerDown={handlePointPointerDown}
                onClick={(_, p) => setSelectedPoint(p)}
              />
            </div>
          ))}

          {/* Punto pendiente */}
          {pendingPos && (
            <div style={{ position: "absolute", left: `${pendingPos.x}%`, top: `${pendingPos.y}%`, transform: "translate(-50%,-50%)", width: 28, height: 28, borderRadius: "50%", background: "#0f172a", border: "2.5px solid #fff", boxShadow: "0 0 0 3px #0f172a55", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 900, zIndex: 20, pointerEvents: "none" }}>
              +
            </div>
          )}

          {/* Hint edición */}
          {isEditing && currentImageUrl && (
            <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.75)", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 850, pointerEvents: "none", whiteSpace: "nowrap", maxWidth: "calc(100% - 24px)", textAlign: "center" }}>
              {isMobile ? "Toca para agregar · Arrastra para mover" : "Toca la imagen para agregar un punto · Arrastra para mover"}
            </div>
          )}
        </div>

        {/* ── Upload imagen (modo edición) ─────────────────────────────────── */}
        {isEditing && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            <button
              type="button"
              style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "7px 12px" }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              <Icon name="camera" size="sm" />
              {uploadingImage ? "Subiendo…" : activeImageId == null
                ? (card?.imageUrl ? "Cambiar imagen principal" : "Subir imagen del equipo")
                : "Cambiar imagen de esta sección"
              }
            </button>
          </div>
        )}

        {/* ── Formulario agregar/editar punto (REDISEÑADO) ────────────────── */}
        {(pendingPos || editingPoint) && isEditing && (
          <div style={{ padding: 18, borderTop: "2px solid #f97316", background: "linear-gradient(135deg,rgba(249,115,22,0.04) 0%,#fff 100%)" }}>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(249,115,22,0.1)", display: "grid", placeItems: "center", fontSize: 15 }}>
                {editingPoint ? "✏️" : "📍"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 950, color: "#0f172a" }}>
                  {editingPoint ? "Editar punto" : "Nuevo punto de lubricación"}
                </div>
                {!editingPoint && (
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                    Pos. {pendingPos?.x?.toFixed(1)}%, {pendingPos?.y?.toFixed(1)}%
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setPendingPos(null); setEditingPoint(null); setForm(EMPTY_FORM); resetLubricantState(); }}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>

                {/* Nombre */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", display: "block", marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>Nombre del punto *</label>
                  <input
                    style={inp}
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Ej: Rodamiento principal, Cadena de transmisión…"
                    autoFocus
                  />
                </div>

                {/* Lubricante */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", display: "block", marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>Lubricante</label>
                  {lubricantMode === "select" ? (
                    <select style={inp} value={selectedLubricantId} onChange={handleLubricantSelect}>
                      <option value="">Sin especificar</option>
                      {lubricants.map((l) => (
                        <option key={l.id} value={String(l.id)}>{l.name}{l.brand ? ` · ${l.brand}` : ""}</option>
                      ))}
                      <option value="__manual__">✏️ Ingresar manualmente</option>
                    </select>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        style={{ ...inp, flex: 1 }}
                        value={form.lubricant}
                        onChange={(e) => setForm((f) => ({ ...f, lubricant: e.target.value }))}
                        placeholder="Nombre del lubricante"
                        autoFocus
                      />
                      <button
                        type="button"
                        style={{ ...btnGhost, padding: "8px 12px", fontSize: 12, whiteSpace: "nowrap" }}
                        onClick={() => { const found = lubricants.find((l) => l.name === form.lubricant); setLubricantMode("select"); setSelectedLubricantId(found ? String(found.id) : ""); }}
                      >
                        ← Lista
                      </button>
                    </div>
                  )}
                </div>

                {/* Cantidad + Unidad */}
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", display: "block", marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>Cantidad</label>
                    <input style={inp} type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="0" />
                  </div>
                  <div style={{ width: 90 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", display: "block", marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>Unidad</label>
                    <select style={inp} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                      {UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {/* Método */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", display: "block", marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>Método</label>
                  <select style={inp} value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
                    {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
                  </select>
                </div>

                {/* Frecuencia — chips visuales con color */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", display: "block", marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>Frecuencia</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, frequency: f }))}
                        style={{
                          padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: "pointer",
                          border: `2px solid ${form.frequency === f ? FREQ_COLOR[f] : "#e2e8f0"}`,
                          background: form.frequency === f ? FREQ_COLOR[f] : "#fff",
                          color: form.frequency === f ? "#fff" : "#64748b",
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: 5,
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: form.frequency === f ? "rgba(255,255,255,0.7)" : FREQ_COLOR[f], display: "inline-block" }} />
                        {FREQ_LABEL[f]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", display: "block", marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>Notas</label>
                  <textarea
                    style={{ ...inp, resize: "vertical", minHeight: 60, fontFamily: "inherit" }}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Instrucciones, advertencias, observaciones…"
                  />
                </div>
              </div>

              {formError && <div style={{ color: "#dc2626", fontSize: 12, margin: "10px 0 0", fontWeight: 800 }}>{formError}</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ ...btnPrimary, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, padding: "11px 16px" }}
                >
                  <Icon name="check" size="sm" />
                  {saving ? "Guardando…" : editingPoint ? "Actualizar punto" : "Agregar punto"}
                </button>
                <button
                  type="button"
                  style={{ ...btnGhost, padding: "11px 14px" }}
                  onClick={() => { setPendingPos(null); setEditingPoint(null); setForm(EMPTY_FORM); resetLubricantState(); }}
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Leyenda ──────────────────────────────────────────────────────── */}
        {(card?.points ?? []).length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {FREQUENCIES.map((f) => {
              const count = (card?.points ?? []).filter((p) => p.frequency === f).length;
              if (!count) return null;
              return (
                <span key={f} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 850 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: FREQ_COLOR[f], display: "inline-block" }} />
                  {LEGEND_LABEL[f]} ({count})
                </span>
              );
            })}
            <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>
              {(card?.points ?? []).length} punto{(card?.points ?? []).length !== 1 ? "s" : ""} · {(card?.images ?? []).length + (card?.imageUrl ? 1 : 0)} imagen{(card?.images ?? []).length + (card?.imageUrl ? 1 : 0) !== 1 ? "es" : ""}
            </span>
          </div>
        )}

        {/* ── Lista de puntos de la imagen activa ──────────────────────────── */}
        {points.length > 0 && (
          <div className="lc-points">
            <div className="lc-points-head">
              <span>Puntos {activeImageId == null ? "de la imagen principal" : `de ${activeImage?.label || "la sección"}`} ({points.length})</span>
              {isEditing ? <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 800, color: "#94a3b8" }}>Toca un punto para editarlo</span> : null}
            </div>
            {points.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`lc-point-row ${selectedPoint?.id === p.id ? "is-active" : ""}`}
                onClick={() => setSelectedPoint(p)}
              >
                <span className="lc-pn" style={{ background: FREQ_COLOR[p.frequency] || "#64748b" }}>{i + 1}</span>
                <span className="lc-pc">
                  <b>{p.label}</b>
                  <span>{p.lubricant || "Sin lubricante"}</span>
                </span>
                <span className="lc-pc">
                  <b>{freqText(p)}</b>
                  <span>{METHOD_LABEL[p.method] || p.method}</span>
                </span>
                <span className="lc-pc">
                  <b>{p.quantity != null ? `${p.quantity} ${p.unit || ""}` : "—"}</b>
                  <span>cantidad</span>
                </span>
                <span className="lc-pc lc-hide-sm">
                  {p.routeId ? <span className="lc-tag"><Icon name="route" size="sm" /> De ruta</span> : <span className="lc-tag">Manual</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Panel detalle de punto ───────────────────────────────────────── */}
        {selectedPoint && (
          <PointDetailPanel
            point={selectedPoint}
            index={points.findIndex((p) => p.id === selectedPoint.id)}
            isEditing={isEditing}
            onEdit={handleEditPoint}
            onDelete={handleDeletePoint}
            onDuplicate={handleDuplicatePoint}
            onClose={() => setSelectedPoint(null)}
          />
        )}
      </div>

      {/* Modal de sync desde rutas */}
      {showSync && (
        <SyncFromRoutesModal
          equipmentId={equipmentId}
          onSync={handleSync}
          onClose={() => setShowSync(false)}
        />
      )}
    </>
  );
}
