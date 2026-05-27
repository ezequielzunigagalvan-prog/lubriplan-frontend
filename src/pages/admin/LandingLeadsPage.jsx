// src/pages/admin/LandingLeadsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLandingLeads, updateLandingLead } from "../../services/landingLeadsService.js";

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const STATUSES = [
  { value: "NUEVO", label: "Nuevo", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { value: "CONTACTADO", label: "Contactado", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { value: "CALIFICADO", label: "Calificado", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { value: "DESCARTADO", label: "Descartado", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
];

function statusStyle(value) {
  return STATUSES.find((s) => s.value === value) || STATUSES[0];
}

export default function LandingLeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLandingLeads({ source: source || undefined, status: status || undefined });
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [source, status]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await updateLandingLead(id, { status: newStatus });
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: newStatus } : l));
    } catch (e) {
      alert("Error al actualizar estado");
    } finally {
      setUpdating(null);
    }
  };

  const nuevoCount = leads.filter((l) => l.status === "NUEVO").length;

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <div>
          <div style={headerKicker}>ADMINISTRACIÓN · PROSPECTOS</div>
          <h1 style={headerTitle}>Leads de Landing</h1>
          <div style={headerSub}>
            {total} prospecto{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
            {nuevoCount > 0 && <span style={newBadge}>{nuevoCount} nuevo{nuevoCount !== 1 ? "s" : ""}</span>}
          </div>
        </div>
        <div style={headerActions}>
          <button type="button" onClick={() => navigate("/dashboard")} style={backBtn}>
            ← Regresar
          </button>
          {/* Source filter */}
          <div style={filterGroup}>
            <span style={filterLabel}>Origen</span>
            {[
              { value: "", label: "Todos" },
              { value: "landing", label: "Landing" },
              { value: "card", label: "Card" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSource(value)}
                style={{ ...filterBtn, ...(source === value ? filterBtnActive : {}) }}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div style={filterGroup}>
            <span style={filterLabel}>Estado</span>
            <button
              type="button"
              onClick={() => setStatus("")}
              style={{ ...filterBtn, ...(status === "" ? filterBtnActive : {}) }}
            >
              Todos
            </button>
            {STATUSES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                style={{ ...filterBtn, ...(status === value ? filterBtnActive : {}) }}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={load} style={refreshBtn} title="Actualizar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={emptyState}>Cargando prospectos…</div>
      ) : leads.length === 0 ? (
        <div style={emptyState}>
          No hay prospectos con los filtros seleccionados.
          <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
            Los leads aparecen aquí cuando alguien completa el formulario del chat.
          </div>
        </div>
      ) : (
        <div style={table}>
          <div style={tableHead}>
            <div style={thName}>Nombre</div>
            <div style={thContact}>Contacto</div>
            <div style={thEmpresa}>Empresa</div>
            <div style={thSource}>Origen</div>
            <div style={thDate}>Fecha</div>
            <div style={thStatus}>Estado</div>
          </div>
          {leads.map((lead) => {
            const st = statusStyle(lead.status);
            const date = new Date(lead.createdAt);
            const dateStr = date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
            return (
              <div key={lead.id} style={tableRow}>
                <div style={tdName}>{lead.nombre}</div>
                <div style={tdContact}>
                  <a href={`mailto:${lead.email}`} style={emailLink}>{lead.email}</a>
                  <div style={phoneText}>{lead.telefono}</div>
                </div>
                <div style={tdEmpresa}>{lead.empresa || <span style={naText}>—</span>}</div>
                <div style={tdSource}>
                  <span style={lead.source === "card" ? sourceBadgeCard : sourceBadgeLanding}>
                    {lead.source === "card" ? "Card" : "Landing"}
                  </span>
                </div>
                <div style={tdDate}>{dateStr}</div>
                <div style={tdStatus}>
                  <select
                    value={lead.status}
                    disabled={updating === lead.id}
                    onChange={(e) => handleStatus(lead.id, e.target.value)}
                    style={{
                      ...statusSelect,
                      background: st.bg,
                      color: st.color,
                      border: `1px solid ${st.border}`,
                      opacity: updating === lead.id ? 0.6 : 1,
                    }}
                  >
                    {STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const page = { fontFamily: FONT, padding: "28px 24px", maxWidth: 1100, margin: "0 auto" };

const header = {
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 16, flexWrap: "wrap", marginBottom: 28,
};

const headerKicker = {
  fontSize: 10, fontWeight: 900, color: "#f97316",
  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
};

const headerTitle = {
  margin: 0, fontSize: 26, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px",
};

const headerSub = {
  marginTop: 6, fontSize: 13, fontWeight: 600, color: "#64748b",
  display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
};

const newBadge = {
  background: "#eff6ff", color: "#1d4ed8",
  border: "1px solid #bfdbfe", borderRadius: 999,
  padding: "2px 10px", fontSize: 11, fontWeight: 900,
};

const headerActions = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" };

const filterGroup = { display: "flex", gap: 5, alignItems: "center" };

const filterLabel = { fontSize: 11, fontWeight: 800, color: "#94a3b8", marginRight: 2 };

const backBtn = {
  padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(226,232,240,0.95)",
  background: "#f8fafc", cursor: "pointer", color: "#475569",
  fontFamily: FONT, fontWeight: 700, fontSize: 13,
};

const filterBtn = {
  padding: "7px 13px", borderRadius: 9,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "#f8fafc", color: "#475569",
  fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: FONT,
};

const filterBtnActive = { background: "#0f172a", color: "#f97316", border: "1px solid #0f172a" };

const refreshBtn = {
  width: 36, height: 36, borderRadius: 10,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "#f8fafc", display: "grid", placeItems: "center",
  cursor: "pointer", color: "#64748b", fontFamily: FONT,
};

const emptyState = {
  textAlign: "center", padding: "60px 24px",
  fontSize: 14, fontWeight: 700, color: "#94a3b8",
};

const table = {
  border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16,
  overflow: "hidden", background: "#fff",
  boxShadow: "0 2px 8px rgba(2,6,23,0.04)",
};

const tableHead = {
  display: "grid",
  gridTemplateColumns: "1.5fr 2fr 1.5fr 80px 100px 130px",
  padding: "10px 16px", background: "#f8fafc",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  gap: 12,
};

const thBase = { fontSize: 10, fontWeight: 900, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" };
const thName = { ...thBase };
const thContact = { ...thBase };
const thEmpresa = { ...thBase };
const thSource = { ...thBase };
const thDate = { ...thBase };
const thStatus = { ...thBase };

const tableRow = {
  display: "grid",
  gridTemplateColumns: "1.5fr 2fr 1.5fr 80px 100px 130px",
  padding: "12px 16px", gap: 12,
  borderBottom: "1px solid rgba(226,232,240,0.60)",
  alignItems: "center",
};

const tdBase = { fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden" };
const tdName = { ...tdBase, fontWeight: 800 };
const tdContact = { ...tdBase, display: "flex", flexDirection: "column", gap: 2 };
const tdEmpresa = { ...tdBase };
const tdSource = { ...tdBase };
const tdDate = { ...tdBase, fontSize: 12, color: "#64748b" };
const tdStatus = { ...tdBase };

const emailLink = { color: "#3b82f6", textDecoration: "none", fontSize: 13, fontWeight: 700, wordBreak: "break-all" };

const phoneText = { fontSize: 12, color: "#64748b", fontWeight: 700 };

const naText = { color: "#cbd5e1" };

const sourceBadgeLanding = {
  fontSize: 11, fontWeight: 900, color: "#c2410c",
  background: "#fff7ed", border: "1px solid #fed7aa",
  borderRadius: 999, padding: "2px 10px",
};

const sourceBadgeCard = {
  fontSize: 11, fontWeight: 900, color: "#4f46e5",
  background: "#eef2ff", border: "1px solid #c7d2fe",
  borderRadius: 999, padding: "2px 10px",
};

const statusSelect = {
  padding: "5px 10px", borderRadius: 8,
  fontWeight: 900, fontSize: 12, cursor: "pointer",
  fontFamily: FONT, outline: "none",
  WebkitAppearance: "auto",
};
