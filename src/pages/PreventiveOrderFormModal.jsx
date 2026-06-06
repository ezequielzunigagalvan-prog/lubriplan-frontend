import { useEffect, useState } from "react";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { getEquipment } from "../services/equipmentService";
import { httpGet } from "../services/http";

export default function PreventiveOrderFormModal({ onClose }) {
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [formData, setFormData] = useState({
    equipmentId: "",
    scheduledDate: "",
    title: "",
    notes: "",
    assignedTo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEquipments();
    loadTechnicians();
  }, []);

  async function loadEquipments() {
    try {
      const data = await getEquipment();
      setEquipments(data?.data || data || []);
    } catch (err) {
      console.error("Error loading equipments:", err);
    }
  }

  async function loadTechnicians() {
    try {
      const data = await httpGet("/technicians");
      setTechnicians(data?.data || []);
    } catch (err) {
      console.error("Error loading technicians:", err);
    }
  }

  const filteredEquipments = equipments.filter(eq =>
    eq.name?.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.code?.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.equipmentId || !formData.scheduledDate) {
        setError("Equipo y fecha son requeridos");
        setLoading(false);
        return;
      }

      const order = await preventiveOrdersService.create(
        Number(formData.equipmentId),
        formData.scheduledDate,
        formData.title,
        formData.notes
      );

      // Si se seleccionó técnico, asignarlo y cambiar estado a IN_PROGRESS
      if (formData.assignedTo) {
        await preventiveOrdersService.start(order.id, Number(formData.assignedTo));
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Error guardando la orden");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1f26",
          borderRadius: 12,
          border: "1px solid #334155",
          maxWidth: 560,
          width: "calc(100% - 40px)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>
            Nueva Orden de Lubricación
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              color: "#94a3b8",
              cursor: "pointer",
              padding: 0,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#7f1d1d",
              color: "#fecaca",
              marginBottom: 20,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: 6,
              }}
            >
              Equipo *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Buscar equipo por nombre o código..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #334155",
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "#242b35",
                  color: "#f1f5f9",
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />
              <select
                value={formData.equipmentId}
                onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #334155",
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "#242b35",
                  color: "#f1f5f9",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Selecciona un equipo</option>
                {filteredEquipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.code ? `[${eq.code}] ` : ""}{eq.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: 6,
              }}
            >
              Fecha Programada *
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #334155",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "#242b35",
                color: "#f1f5f9",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: 6,
              }}
            >
              Técnico Asignado (Opcional)
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #334155",
                fontSize: 14,
                fontFamily: "inherit",
                background: "#242b35",
                color: "#f1f5f9",
              }}
            >
              <option value="">Selecciona un técnico (opcional)</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: 6,
              }}
            >
              Título (Opcional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Mantenimiento preventivo Q2"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #334155",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "#242b35",
                color: "#f1f5f9",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: 6,
              }}
            >
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instrucciones adicionales o observaciones…"
              rows={4}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #334155",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "#242b35",
                color: "#f1f5f9",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #334155",
                background: "transparent",
                color: "#cbd5e1",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#475569";
                e.currentTarget.style.color = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#92400e" : "#f97316",
                color: "white",
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#ea580c";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#f97316";
              }}
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
