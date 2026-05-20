import { useRef, useState, useCallback } from "react";
import { btnPrimary, btnGhost } from "../ui/styles";
import { Icon } from "../ui/lpIcons";
import PointMarker from "./PointMarker";
import PointDetailPanel from "./PointDetailPanel";

const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"];
const FREQ_LABEL = { DAILY: "Diaria", WEEKLY: "Semanal", MONTHLY: "Mensual", QUARTERLY: "Trimestral", ANNUAL: "Anual" };
const FREQ_COLOR = { DAILY: "#dc2626", WEEKLY: "#f97316", MONTHLY: "#d97706", QUARTERLY: "#16a34a", ANNUAL: "#2563eb" };
const METHODS = ["MANUAL", "AUTO", "GREASE_GUN", "OIL_CAN"];
const METHOD_LABEL = { MANUAL: "Manual", AUTO: "Automático", GREASE_GUN: "Pistola de grasa", OIL_CAN: "Aceitera" };
const UNITS = ["ml", "g", "oz", "L"];

const EMPTY_FORM = { label: "", lubricant: "", quantity: "", unit: "ml", frequency: "MONTHLY", method: "MANUAL", notes: "" };

export default function LubricationCard({
  card,
  isEditing,
  equipmentName = "Equipo",
  onToggleEdit,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onUploadImage,
}) {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const exportRef = useRef(null);

  const setRefs = useCallback((node) => {
    containerRef.current = node;
    exportRef.current = node;
  }, []);

  const [selectedPoint, setSelectedPoint] = useState(null);
  const [pendingPos, setPendingPos] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);

  const [draggingId, setDraggingId] = useState(null);
  const [localPoints, setLocalPoints] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const points = localPoints ?? card?.points ?? [];

  // ── Image click → add point in edit mode ────────────────────────────────
  const handleContainerClick = useCallback((e) => {
    if (!isEditing || draggingId) return;
    if (e.target.closest("[data-point-marker]")) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPos({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
    setForm(EMPTY_FORM);
    setFormError("");
    setEditingPoint(null);
  }, [isEditing, draggingId]);

  // ── Drag ─────────────────────────────────────────────────────────────────
  const handlePointPointerDown = useCallback((e, pointId) => {
    if (!isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(pointId);
    setLocalPoints(points.map((p) => ({ ...p })));
    containerRef.current?.setPointerCapture?.(e.pointerId);
  }, [isEditing, points]);

  const handleContainerPointerMove = useCallback((e) => {
    if (!draggingId || !isEditing) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = parseFloat(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)).toFixed(2));
    const y = parseFloat(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)).toFixed(2));
    setLocalPoints((prev) => prev.map((p) => (p.id === draggingId ? { ...p, x, y } : p)));
  }, [draggingId, isEditing]);

  const handleContainerPointerUp = useCallback(async () => {
    if (!draggingId) return;
    const moved = (localPoints ?? []).find((p) => p.id === draggingId);
    if (moved) {
      try { await onUpdatePoint?.(draggingId, { x: moved.x, y: moved.y }); } catch {}
    }
    setDraggingId(null);
    setLocalPoints(null);
  }, [draggingId, localPoints, onUpdatePoint]);

  // ── Add / Edit form submit ────────────────────────────────────────────────
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
        await onAddPoint?.({ ...pendingPos, ...form, quantity: form.quantity ? parseFloat(form.quantity) : null });
        setPendingPos(null);
      }
      setForm(EMPTY_FORM);
      setSelectedPoint(null);
    } catch (err) {
      setFormError(err?.message || "Error guardando punto.");
    } finally {
      setSaving(false);
    }
  }, [form, editingPoint, pendingPos, onAddPoint, onUpdatePoint]);

  const handleEditPoint = useCallback((point) => {
    setEditingPoint(point);
    setForm({
      label: point.label || "",
      lubricant: point.lubricant || "",
      quantity: point.quantity != null ? String(point.quantity) : "",
      unit: point.unit || "ml",
      frequency: point.frequency || "MONTHLY",
      method: point.method || "MANUAL",
      notes: point.notes || "",
    });
    setFormError("");
    setSelectedPoint(null);
    setPendingPos({ x: point.x, y: point.y });
  }, []);

  const handleDeletePoint = useCallback(async (pointId) => {
    if (!window.confirm("¿Eliminar este punto?")) return;
    try { await onDeletePoint?.(pointId); setSelectedPoint(null); } catch {}
  }, [onDeletePoint]);

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try { await onUploadImage?.(file); } catch {}
    finally { setUploadingImage(false); e.target.value = ""; }
  }, [onUploadImage]);

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(exportRef.current, { useCORS: true, scale: 2, backgroundColor: "#fff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("landscape", "pt", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 30;

      const imgW = pw - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const clampedH = Math.min(imgH, ph * 0.55);

      pdf.addImage(imgData, "PNG", margin, margin, imgW, clampedH);

      // Table
      const tableY = margin + clampedH + 16;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Carta de Lubricación — ${equipmentName}`, margin, tableY);
      pdf.text(new Date().toLocaleDateString("es-MX"), pw - margin, tableY, { align: "right" });

      const headers = ["#", "Punto", "Lubricante", "Cantidad", "Frecuencia", "Método", "Notas"];
      const colWidths = [20, 110, 100, 70, 80, 90, 130];
      let curX = margin;
      let curY = tableY + 14;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(margin, curY - 10, pw - margin * 2, 14, "F");
      pdf.setTextColor(255, 255, 255);
      headers.forEach((h, i) => {
        pdf.text(h, curX + 3, curY);
        curX += colWidths[i];
      });

      pdf.setTextColor(30, 30, 30);
      pdf.setFont("helvetica", "normal");
      points.forEach((p, idx) => {
        curY += 14;
        if (curY > ph - margin) { pdf.addPage(); curY = margin + 14; }
        if (idx % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(margin, curY - 10, pw - margin * 2, 14, "F"); }
        curX = margin;
        const row = [
          String(idx + 1),
          p.label,
          p.lubricant || "—",
          p.quantity != null ? `${p.quantity} ${p.unit}` : "—",
          FREQ_LABEL[p.frequency] || p.frequency,
          METHOD_LABEL[p.method] || p.method,
          p.notes || "—",
        ];
        row.forEach((cell, i) => {
          const maxLen = Math.floor(colWidths[i] / 5.2);
          const txt = String(cell).length > maxLen ? String(cell).slice(0, maxLen - 1) + "…" : String(cell);
          pdf.text(txt, curX + 3, curY);
          curX += colWidths[i];
        });
      });

      const date = new Date().toISOString().slice(0, 10);
      const safeName = equipmentName.replace(/[^a-zA-Z0-9\-_]/g, "_").slice(0, 30);
      pdf.save(`carta-lubricacion-${safeName}-${date}.pdf`);
    } catch (err) {
      alert("Error generando PDF: " + (err?.message || "intenta de nuevo"));
    } finally {
      setExportingPdf(false);
    }
  }, [points, equipmentName]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const cardShell = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
    overflow: "hidden",
  };

  const toolbar = {
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    background: "#f8fafc",
  };

  const imageArea = {
    position: "relative",
    width: "100%",
    minHeight: 260,
    background: "#f1f5f9",
    cursor: isEditing ? "crosshair" : "default",
    userSelect: "none",
    overflow: "hidden",
  };

  const placeholder = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 260,
    color: "#94a3b8",
    padding: 32,
    textAlign: "center",
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
    fontWeight: 800,
    boxSizing: "border-box",
  };

  const selectStyle = { ...inputStyle };

  return (
    <div style={cardShell}>
      {/* Toolbar */}
      <div style={toolbar}>
        <span style={{ fontSize: 13, fontWeight: 950, color: "#0f172a", flex: 1 }}>
          Carta de Lubricación
          {isEditing && <span style={{ marginLeft: 8, fontSize: 11, color: "#f97316", fontWeight: 850 }}>— Modo edición</span>}
        </span>

        <button
          type="button"
          style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", fontSize: 12 }}
          onClick={handleExportPdf}
          disabled={exportingPdf || !card?.imageUrl}
          title={!card?.imageUrl ? "Sube una imagen primero" : ""}
        >
          <Icon name="download" size="sm" />
          {exportingPdf ? "Generando…" : "Exportar PDF"}
        </button>

        <button
          type="button"
          style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", fontSize: 12 }}
          onClick={onToggleEdit}
        >
          <Icon name={isEditing ? "check" : "edit"} size="sm" />
          {isEditing ? "Finalizar edición" : "Editar carta"}
        </button>
      </div>

      {/* Image area with point markers */}
      <div
        ref={setRefs}
        style={imageArea}
        onClick={handleContainerClick}
        onPointerMove={handleContainerPointerMove}
        onPointerUp={handleContainerPointerUp}
      >
        {card?.imageUrl ? (
          <img
            src={card.imageUrl}
            alt="Equipo"
            style={{ width: "100%", display: "block", pointerEvents: "none" }}
            draggable={false}
            crossOrigin="anonymous"
          />
        ) : (
          <div style={placeholder}>
            <Icon name="camera" size="xl" />
            <div style={{ fontSize: 14, fontWeight: 850 }}>
              {isEditing ? "Sube una foto del equipo para comenzar" : "Sin imagen de equipo"}
            </div>
            {!isEditing && <div style={{ fontSize: 12 }}>Activa el modo edición para agregar una imagen</div>}
          </div>
        )}

        {/* Point markers */}
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

        {/* Pending point indicator */}
        {pendingPos && (
          <div style={{
            position: "absolute",
            left: `${pendingPos.x}%`,
            top: `${pendingPos.y}%`,
            transform: "translate(-50%,-50%)",
            width: 28, height: 28, borderRadius: "50%",
            background: "#0f172a",
            border: "2.5px solid #fff",
            boxShadow: "0 0 0 3px #0f172a55",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 12, fontWeight: 900, zIndex: 20,
            pointerEvents: "none",
          }}>
            +
          </div>
        )}

        {/* Edit hint */}
        {isEditing && card?.imageUrl && (
          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            background: "rgba(15,23,42,0.75)", color: "#fff",
            borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 850,
            pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            Toca la imagen para agregar un punto · Arrastra para mover
          </div>
        )}
      </div>

      {/* Upload image button (edit mode) */}
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
            {uploadingImage ? "Subiendo…" : card?.imageUrl ? "Cambiar imagen" : "Subir imagen del equipo"}
          </button>
        </div>
      )}

      {/* Add/Edit point form */}
      {(pendingPos || editingPoint) && isEditing && (
        <div style={{ padding: 16, borderTop: "1px solid #e2e8f0", background: "#fafafa" }}>
          <div style={{ fontSize: 13, fontWeight: 950, color: "#0f172a", marginBottom: 12 }}>
            {editingPoint ? "Editar punto" : `Nuevo punto en (${pendingPos.x.toFixed(1)}%, ${pendingPos.y.toFixed(1)}%)`}
          </div>

          <form onSubmit={handleFormSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 11, fontWeight: 850, color: "#64748b", display: "block", marginBottom: 3 }}>Nombre del punto *</label>
                <input style={inputStyle} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Ej: Rodamiento principal" />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 850, color: "#64748b", display: "block", marginBottom: 3 }}>Lubricante</label>
                <input style={inputStyle} value={form.lubricant} onChange={(e) => setForm((f) => ({ ...f, lubricant: e.target.value }))} placeholder="Ej: Grasa SKF LGEP 2" />
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 850, color: "#64748b", display: "block", marginBottom: 3 }}>Cantidad</label>
                  <input style={inputStyle} type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="0" />
                </div>
                <div style={{ width: 68 }}>
                  <label style={{ fontSize: 11, fontWeight: 850, color: "#64748b", display: "block", marginBottom: 3 }}>Unidad</label>
                  <select style={selectStyle} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 850, color: "#64748b", display: "block", marginBottom: 3 }}>Frecuencia</label>
                <select style={selectStyle} value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 850, color: "#64748b", display: "block", marginBottom: 3 }}>Método</label>
                <select style={selectStyle} value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
                  {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 11, fontWeight: 850, color: "#64748b", display: "block", marginBottom: 3 }}>Notas</label>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 56 }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Observaciones opcionales…" />
              </div>
            </div>

            {formError && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 8, fontWeight: 850 }}>{formError}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={{ ...btnPrimary, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }} disabled={saving}>
                <Icon name="check" size="sm" />{saving ? "Guardando…" : editingPoint ? "Actualizar" : "Agregar punto"}
              </button>
              <button type="button" style={{ ...btnGhost, padding: "10px 14px" }} onClick={() => { setPendingPos(null); setEditingPoint(null); setForm(EMPTY_FORM); }}>
                <Icon name="close" size="sm" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Legend */}
      {points.length > 0 && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {FREQUENCIES.map((f) => {
            const count = points.filter((p) => p.frequency === f).length;
            if (!count) return null;
            return (
              <span key={f} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 850 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: FREQ_COLOR[f], display: "inline-block" }} />
                {FREQ_LABEL[f]} ({count})
              </span>
            );
          })}
          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>{points.length} punto{points.length !== 1 ? "s" : ""} total</span>
        </div>
      )}

      {/* Point detail panel */}
      {selectedPoint && (
        <PointDetailPanel
          point={selectedPoint}
          index={points.findIndex((p) => p.id === selectedPoint.id)}
          isEditing={isEditing}
          onEdit={handleEditPoint}
          onDelete={handleDeletePoint}
          onClose={() => setSelectedPoint(null)}
        />
      )}
    </div>
  );
}
