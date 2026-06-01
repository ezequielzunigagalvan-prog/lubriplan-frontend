// src/components/LubricationCard/SyncFromRoutesModal.jsx
import { useEffect, useState, useCallback } from "react";
import { getSyncPreview } from "../../services/lubricationCardService";

const FREQ_LABEL  = { DAILY: "Diaria", WEEKLY: "Semanal", MONTHLY: "Mensual", QUARTERLY: "Trimestral", ANNUAL: "Anual" };
const FREQ_COLOR  = { DAILY: "#dc2626", WEEKLY: "#f97316", MONTHLY: "#d97706", QUARTERLY: "#16a34a", ANNUAL: "#2563eb" };
const METH_LABEL  = { MANUAL: "Manual", AUTO: "Automático", GREASE_GUN: "Pistola", OIL_CAN: "Aceitera" };

export default function SyncFromRoutesModal({ equipmentId, onSync, onClose }) {
  const [preview, setPreview]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [error, setError]         = useState("");
  const [selected, setSelected]   = useState(new Set());

  useEffect(() => {
    getSyncPreview(equipmentId)
      .then((data) => {
        const rows = data?.preview ?? [];
        setPreview(rows);
        // Pre-selecciona las que NO están sincronizadas
        setSelected(new Set(rows.filter((r) => !r.alreadySynced).map((r) => r.routeId)));
      })
      .catch(() => setError("No se pudo cargar el preview"))
      .finally(() => setLoading(false));
  }, [equipmentId]);

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSync = async () => {
    if (!selected.size) return;
    setSyncing(true);
    try {
      const result = await onSync([...selected]);
      onClose?.();
      return result;
    } catch {
      setError("Error al sincronizar. Intenta de nuevo.");
    } finally {
      setSyncing(false);
    }
  };

  const newCount = [...selected].filter(
    (id) => !preview.find((r) => r.routeId === id)?.alreadySynced
  ).length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1200,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
        maxHeight: "85dvh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(15,23,42,0.2)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(249,115,22,0.1)", display: "grid", placeItems: "center", fontSize: 18 }}>
              ⚡
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>Sincronizar desde Rutas</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                Crea puntos en la carta a partir de las rutas del equipo
              </div>
            </div>
            <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8", lineHeight: 1 }}>×</button>
          </div>
          {!loading && preview.length > 0 && (
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "#f8fafc", fontSize: 12, fontWeight: 600, color: "#475569" }}>
              💡 Los puntos se crearán en posiciones automáticas. Después arrastra cada uno a su lugar en el diagrama.
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {loading && (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: 32, fontWeight: 700 }}>Cargando rutas…</div>
          )}
          {!loading && error && (
            <div style={{ color: "#dc2626", fontWeight: 700, textAlign: "center", padding: 24 }}>{error}</div>
          )}
          {!loading && !error && preview.length === 0 && (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#475569" }}>Sin rutas para este equipo</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Crea rutas de lubricación primero para poder sincronizarlas.</div>
            </div>
          )}
          {!loading && preview.map((r) => (
            <label
              key={r.routeId}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 12px",
                borderRadius: 12, marginBottom: 8, cursor: r.alreadySynced ? "default" : "pointer",
                border: `1.5px solid ${selected.has(r.routeId) ? "#f97316" : "#e2e8f0"}`,
                background: selected.has(r.routeId) ? "rgba(249,115,22,0.04)" : "#fff",
                opacity: r.alreadySynced ? 0.6 : 1,
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(r.routeId)}
                disabled={r.alreadySynced}
                onChange={() => !r.alreadySynced && toggle(r.routeId)}
                style={{ marginTop: 2, accentColor: "#f97316", width: 15, height: 15, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 900, fontSize: 13, color: "#0f172a" }}>{r.routeName}</span>
                  {r.alreadySynced && (
                    <span style={{ fontSize: 10, fontWeight: 800, background: "#dcfce7", color: "#15803d", borderRadius: 20, padding: "1px 8px" }}>Ya sincronizado</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {r.lubricant && (
                    <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>🛢 {r.lubricant}</span>
                  )}
                  {r.quantity != null && (
                    <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>⚖ {r.quantity} {r.unit}</span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, color: FREQ_COLOR[r.frequency] || "#64748b" }}>
                    🔄 {FREQ_LABEL[r.frequency] || r.frequency}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                    🔧 {METH_LABEL[r.method] || r.method}
                  </span>
                </div>
                {r.notes && (
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, fontStyle: "italic" }}>{r.notes}</div>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        {!loading && preview.length > 0 && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", flex: 1 }}>
              {selected.size} ruta{selected.size !== 1 ? "s" : ""} seleccionada{selected.size !== 1 ? "s" : ""}
              {newCount > 0 && ` · ${newCount} nueva${newCount !== 1 ? "s" : ""}`}
            </span>
            <button
              onClick={onClose}
              style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#475569" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSync}
              disabled={!selected.size || syncing}
              style={{
                padding: "9px 18px", borderRadius: 10, border: "none",
                background: selected.size && !syncing ? "#f97316" : "#e2e8f0",
                color: selected.size && !syncing ? "#fff" : "#94a3b8",
                fontSize: 13, fontWeight: 800, cursor: selected.size ? "pointer" : "default",
                transition: "background 0.15s",
              }}
            >
              {syncing ? "Creando puntos…" : `⚡ Crear ${newCount} punto${newCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
