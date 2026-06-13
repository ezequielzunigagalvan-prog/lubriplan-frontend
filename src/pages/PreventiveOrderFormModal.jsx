import { useEffect, useState } from "react";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { getEquipment } from "../services/equipmentService";
import { httpGet } from "../services/http";
import { Icon } from "../components/ui/lpIcons";

export default function PreventiveOrderFormModal({ onClose }) {
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const equipData = await getEquipment();
      setEquipments(equipData?.data || equipData || []);

      const techData = await httpGet("/technicians");
      const techs = techData?.data || techData?.technicians || techData || [];
      setTechnicians(Array.isArray(techs) ? techs : []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }

  const filteredEquipments = equipments.filter((eq) =>
    (eq.name?.toLowerCase() || "").includes(equipmentSearch.toLowerCase()) ||
    (eq.code?.toLowerCase() || "").includes(equipmentSearch.toLowerCase())
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedEquipment || !scheduledDate) {
      setError("Equipo y fecha son requeridos");
      return;
    }

    setLoading(true);
    try {
      await preventiveOrdersService.create(
        selectedEquipment.id,
        scheduledDate,
        title || undefined,
        notes || undefined,
        selectedTechnician ? Number(selectedTechnician) : null
      );

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err?.message || "Error al guardar la orden");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: 12, padding: 24, width: "90%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1e293b" }}>Nueva Orden Preventiva</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#94a3b8",
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
              background: "#fee2e2",
              color: "#991b1b",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Equipo */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Equipo *
            </label>
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowEquipmentDropdown(!showEquipmentDropdown)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: selectedEquipment ? "#1e293b" : "#94a3b8" }}>
                  {selectedEquipment ? selectedEquipment.name : "Selecciona un equipo"}
                </span>
                <Icon name={showEquipmentDropdown ? "chevronUp" : "chevronDown"} size="sm" />
              </div>

              {showEquipmentDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    maxHeight: 300,
                    overflowY: "auto",
                    zIndex: 10,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Buscar equipo..."
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 8,
                      borderBottom: "1px solid #e2e8f0",
                      fontSize: 13,
                      boxSizing: "border-box",
                      border: "none",
                      outline: "none",
                    }}
                  />
                  {filteredEquipments.map((eq) => (
                    <div
                      key={eq.id}
                      onClick={() => {
                        setSelectedEquipment(eq);
                        setEquipmentSearch("");
                        setShowEquipmentDropdown(false);
                      }}
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        fontSize: 13,
                        color: "#1e293b",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      {eq.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Fecha Programada *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          {/* Técnico */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Técnico (Opcional)
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            >
              <option value="">Selecciona un técnico</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Título (Opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Mantenimiento preventivo Q2"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Notas */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones adicionales..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                boxSizing: "border-box",
                minHeight: 80,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#334155",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
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
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#ea580c";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#f97316";
              }}
            >
              {loading ? "Guardando..." : "Crear Orden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
