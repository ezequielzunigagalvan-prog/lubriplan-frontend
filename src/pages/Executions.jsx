// src/pages/Executions.jsx
import { useEffect, useMemo, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { httpGet, httpPut } from "../services/http";

function Executions() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [technicianFilter, setTechnicianFilter] = useState("ALL");
  const [equipmentFilter, setEquipmentFilter] = useState("ALL");

  // ================================
  // Cargar ejecuciones
  // ================================
  const loadExecutions = async () => {
    try {
      setLoading(true);

      // ✅ ahora pasa por http.js (manda token y maneja 401/timeout)
      const data = await httpGet("/executions", 30000);

      setExecutions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando ejecuciones:", error);
      setExecutions([]);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Completar ejecución
  // ================================
  const completeExecution = async (id) => {
    try {
      // ✅ usa httpPut (manda token)
      await httpPut(`/executions/${id}/complete`, {}, 30000);

      await loadExecutions();
    } catch (error) {
      console.error("Error completando ejecución:", error);
      alert(error?.message || "Error completando ejecución");
    }
  };

  useEffect(() => {
    loadExecutions();
  }, []);

  const filteredExecutions = useMemo(() => {
    return executions.filter((e) => {
      const statusOk = statusFilter === "ALL" || e.status === statusFilter;

      const techName = e?.technician?.name || "—";
      const technicianOk = technicianFilter === "ALL" || techName === technicianFilter;

      const equipName = e?.route?.equipment?.name || "—";
      const equipmentOk = equipmentFilter === "ALL" || equipName === equipmentFilter;

      return statusOk && technicianOk && equipmentOk;
    });
  }, [executions, statusFilter, technicianFilter, equipmentFilter]);

  const technicianOptions = useMemo(() => {
    const names = executions.map((e) => e?.technician?.name || "—");
    return [...new Set(names)];
  }, [executions]);

  const equipmentOptions = useMemo(() => {
    const names = executions.map((e) => e?.route?.equipment?.name || "—");
    return [...new Set(names)];
  }, [executions]);

  if (loading) return <p>Cargando ejecuciones...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Ejecuciones</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="COMPLETED">Completado</option>
          <option value="OVERDUE">Vencido</option>
        </select>

        <select value={technicianFilter} onChange={(e) => setTechnicianFilter(e.target.value)}>
          <option value="ALL">Todos los técnicos</option>
          {technicianOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)}>
          <option value="ALL">Todos los equipos</option>
          {equipmentOptions.map((eq) => (
            <option key={eq} value={eq}>
              {eq}
            </option>
          ))}
        </select>
      </div>

      {filteredExecutions.length === 0 && <p>No hay ejecuciones registradas</p>}

      {filteredExecutions.map((e) => {
        const equipName = e?.route?.equipment?.name || "—";
        const routeName = e?.route?.name || "—";
        const techName = e?.technician?.name || "—";

        const dateStr = e?.executedAt
          ? new Date(e.executedAt).toLocaleString()
          : e?.scheduledAt
            ? new Date(e.scheduledAt).toLocaleString()
            : "—";

        return (
          <div
            key={e.id}
            style={{
              padding: 15,
              marginBottom: 12,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          >
            <p>
              <strong>Equipo:</strong> {equipName}
            </p>
            <p>
              <strong>Ruta:</strong> {routeName}
            </p>
            <p>
              <strong>Técnico:</strong> {techName}
            </p>
            <p>
              <strong>Fecha:</strong> {dateStr}
            </p>
            <p>
              <strong>Estado:</strong> <StatusBadge status={e.status} />
            </p>

            {e.status === "PENDING" && (
              <button
                onClick={() => completeExecution(e.id)}
                style={{ marginTop: 10, padding: "6px 12px", cursor: "pointer" }}
              >
                Completar ejecución
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Executions;