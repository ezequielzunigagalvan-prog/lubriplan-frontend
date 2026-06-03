import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { httpGet } from "../services/http";

export default function PreventiveOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === "new";

  const [equipments, setEquipments] = useState([]);
  const [formData, setFormData] = useState({
    equipmentId: "",
    scheduledDate: "",
    title: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEquipments();
    if (!isNew) {
      loadOrder();
    }
  }, [id, isNew]);

  async function loadEquipments() {
    try {
      const data = await httpGet("/equipment");
      setEquipments(data?.data || []);
    } catch (err) {
      console.error("Error loading equipments:", err);
    }
  }

  async function loadOrder() {
    setLoading(true);
    try {
      const order = await preventiveOrdersService.get(Number(id));
      setFormData({
        equipmentId: order.equipmentId,
        scheduledDate: order.scheduledDate.slice(0, 10),
        title: order.title,
        notes: order.notes || "",
      });
    } catch (err) {
      setError("No se pudo cargar la orden");
    } finally {
      setLoading(false);
    }
  }

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

      if (isNew) {
        const result = await preventiveOrdersService.create(
          Number(formData.equipmentId),
          formData.scheduledDate,
          formData.title,
          formData.notes
        );
        navigate(`/preventive-orders/${result.id}`);
      } else {
        await preventiveOrdersService.update(Number(id), formData);
        navigate(`/preventive-orders/${id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error guardando la orden");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !isNew) {
    return <div style={{ padding: 20, textAlign: "center" }}>Cargando…</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 30 }}>
        {isNew ? "Nueva Orden" : "Editar Orden"}
      </h1>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "#dc2626", marginBottom: 20, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
            Equipo *
          </label>
          <select
            value={formData.equipmentId}
            onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          >
            <option value="">Selecciona un equipo</option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} {eq.code && `(${eq.code})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
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
              border: "1px solid #cbd5e1",
              fontSize: 14,
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
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
              border: "1px solid #cbd5e1",
              fontSize: 14,
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
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
              border: "1px solid #cbd5e1",
              fontSize: 14,
              fontFamily: "inherit",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate("/preventive-orders")}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "white",
              color: "#475569",
              fontWeight: 700,
              cursor: "pointer",
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
              background: loading ? "#cbd5e1" : "#f97316",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
