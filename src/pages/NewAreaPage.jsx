// src/pages/NewAreaPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { createEquipmentArea } from "../services/equipmentAreasService";

export default function NewAreaPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const nameTrim = String(name || "").trim();
  const descTrim = String(description || "").trim();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nameTrim) {
      setErr("El nombre del área es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      // ✅ Preferido: objeto (como ya lo usas en EquipmentsPage)
      // Si tu service SOLO acepta string, cambia el service para aceptar objeto también.
      await createEquipmentArea({ name: nameTrim, description: descTrim || null });

      navigate("/equipments");
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || "Error creando área");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div style={pageShell}>
        {/* TOP */}
        <div style={topBar}>
          <div>
            <div style={kicker}>LUBRIPLAN · EQUIPOS</div>
            <h1 style={title}>Nueva área</h1>
            <div style={subtitle}>Registra una nueva área de planta para organizar equipos y reportes.</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => navigate("/equipments")} style={btnGhost} disabled={saving}>
              ← Volver
            </button>
          </div>
        </div>

        <div style={grid}>
          {/* FORM */}
          <form onSubmit={handleSubmit} style={card}>
            <div style={cardHeader}>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>Datos del área</div>
              <div style={cardHint}>Los campos con * son obligatorios.</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nombre del área *</label>
              <input
                type="text"
                placeholder="Ej: Planta 1 · Línea A · Producción"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (err) setErr("");
                }}
                style={input}
                autoFocus
              />
              <small style={hint}>Usa nombres consistentes para filtros, reportes y KPIs.</small>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Descripción</label>
              <textarea
                placeholder="Descripción del área (opcional)…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...input, minHeight: 100, resize: "vertical" }}
              />
              <small style={hint}>Opcional. Útil para contexto (líneas, máquinas, turnos, etc.).</small>
            </div>

            {err ? <div style={errorBox}>{err}</div> : null}

            <div style={actionsRow}>
              <button type="button" onClick={() => navigate("/equipments")} style={btnSecondary} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" style={btnPrimary} disabled={saving || !nameTrim}>
                {saving ? "Creando..." : "Crear área"}
              </button>
            </div>
          </form>

          {/* SIDE */}
          <div style={side}>
            <div style={sideCard}>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>Buenas prácticas</div>
              <ul style={sideList}>
                <li><b>Unifica criterios</b>: Planta, Línea, Proceso.</li>
                <li><b>Evita duplicados</b>: “Planta 1” vs “Planta1”.</li>
                <li><b>Piensa en filtros</b>: te servirá en Reportes y Alertas.</li>
              </ul>
            </div>

            <div style={sideCard}>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>Tip</div>
              <div style={sideText}>
                Si tienes varias líneas, crea áreas por <b>planta</b> y luego usa “Ubicación” del equipo para el detalle.
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

/* ================= STYLES (match EquipmentsPage) ================= */

const pageShell = {
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  paddingBottom: 12,
  borderBottom: "1px solid #e5e7eb",
};

const kicker = { fontSize: 11, fontWeight: 950, color: "#64748b", letterSpacing: 1.2 };

const title = { margin: "6px 0 0", fontSize: 28, fontWeight: 950, color: "#0f172a", letterSpacing: 0.2 };

const subtitle = { marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 };

const grid = { marginTop: 14, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 14 };

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 10,
  flexWrap: "wrap",
  paddingBottom: 12,
  marginBottom: 14,
  borderBottom: "1px solid #eef2f7",
};

const cardHint = { fontSize: 12, color: "#64748b", fontWeight: 800 };

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 950,
  fontSize: 12,
  color: "#0f172a",
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

const input = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  outline: "none",
  fontWeight: 900,
  background: "#fff",
  boxShadow: "inset 0 1px 0 rgba(2,6,23,0.04)",
};

const hint = { display: "block", marginTop: 6, color: "#64748b", fontSize: 12, fontWeight: 800 };

const errorBox = {
  marginTop: 10,
  background: "#fff1f2",
  border: "1px solid #fecaca",
  padding: "10px 12px",
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 900,
  fontSize: 12,
};

const actionsRow = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 14,
  paddingTop: 14,
  borderTop: "1px solid #eef2f7",
};

const btnPrimary = {
  background: "#f97316",
  color: "#0b1220",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fb923c",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(249,115,22,0.22)",
};

const btnSecondary = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const btnGhost = {
  background: "transparent",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const side = { display: "flex", flexDirection: "column", gap: 12 };

const sideCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
  boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
};

const sideList = {
  marginTop: 10,
  paddingLeft: 18,
  color: "#334155",
  fontWeight: 800,
  fontSize: 13,
  lineHeight: 1.6,
};

const sideText = { marginTop: 10, color: "#475569", fontWeight: 800, fontSize: 13, lineHeight: 1.5 };