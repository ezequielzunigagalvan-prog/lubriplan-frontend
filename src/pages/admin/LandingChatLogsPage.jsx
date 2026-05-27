// src/pages/admin/LandingChatLogsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLandingChatLogs, deleteLandingChatLog } from "../../services/landingChatLogsService.js";

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function LandingChatLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [hotOnly, setHotOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLandingChatLogs({ hotOnly });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [hotOnly]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta conversación?")) return;
    setDeleting(id);
    try {
      await deleteLandingChatLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setTotal((t) => t - 1);
      if (expanded === id) setExpanded(null);
    } catch (e) {
      alert("Error al eliminar");
    } finally {
      setDeleting(null);
    }
  };

  const hotCount = logs.filter((l) => l.isHotLead).length;

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <div>
          <div style={headerKicker}>ADMINISTRACIÓN · LEADS</div>
          <h1 style={headerTitle}>Conversaciones del Landing</h1>
          <div style={headerSub}>
            {total} conversación{total !== 1 ? "es" : ""} registrada{total !== 1 ? "s" : ""}{" "}
            {hotCount > 0 && <span style={hotBadgeInline}>🔥 {hotCount} leads calientes</span>}
          </div>
        </div>
        <div style={headerActions}>
          <button type="button" onClick={() => navigate("/dashboard")} style={backBtn}>
            ← Regresar
          </button>
          <button
            type="button"
            onClick={() => setHotOnly(false)}
            style={{ ...filterBtn, ...(hotOnly ? {} : filterBtnActive) }}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setHotOnly(true)}
            style={{ ...filterBtn, ...(hotOnly ? filterBtnActive : {}) }}
          >
            🔥 Solo leads calientes
          </button>
          <button type="button" onClick={load} style={refreshBtn} title="Actualizar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={emptyState}>Cargando conversaciones…</div>
      ) : logs.length === 0 ? (
        <div style={emptyState}>
          {hotOnly ? "No hay leads calientes aún." : "Aún no hay conversaciones registradas."}
          <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
            Las conversaciones aparecen aquí cuando alguien interactúa con el asistente del landing.
          </div>
        </div>
      ) : (
        <div style={list}>
          {logs.map((log) => {
            const msgs = Array.isArray(log.messages) ? log.messages : [];
            const userMsgs = msgs.filter((m) => m.role === "user");
            const firstMsg = userMsgs[0]?.content || "—";
            const isOpen = expanded === log.id;
            const date = new Date(log.updatedAt);
            const dateStr = date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
            const timeStr = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={log.id} style={card}>
                {/* Card header */}
                <div style={cardTop} onClick={() => setExpanded(isOpen ? null : log.id)}>
                  <div style={cardMeta}>
                    {log.isHotLead && (
                      <span style={hotBadge}>🔥 Lead caliente</span>
                    )}
                    {log.hotKeywords?.length > 0 && (
                      <div style={keywordRow}>
                        {log.hotKeywords.map((kw) => (
                          <span key={kw} style={keyword}>{kw}</span>
                        ))}
                      </div>
                    )}
                    <div style={cardPreview}>
                      <span style={cardQuote}>"</span>{firstMsg.slice(0, 120)}{firstMsg.length > 120 ? "…" : ""}
                    </div>
                  </div>
                  <div style={cardRight}>
                    <div style={cardDate}>{dateStr}</div>
                    <div style={cardTime}>{timeStr}</div>
                    <div style={cardStats}>
                      <span style={statPill}>{userMsgs.length} pregunta{userMsgs.length !== 1 ? "s" : ""}</span>
                      {log.ip && <span style={statPillGray}>{log.ip}</span>}
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms ease", marginTop: 4, flexShrink: 0 }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Conversación expandida */}
                {isOpen && (
                  <div style={transcript}>
                    <div style={transcriptDivider} />
                    {msgs.map((m, i) => (
                      <div key={i} style={m.role === "user" ? msgUser : msgBot}>
                        <div style={m.role === "user" ? msgLabelUser : msgLabelBot}>
                          {m.role === "user" ? "Visitante" : "LubriBot"}
                        </div>
                        <div style={m.role === "user" ? msgBubbleUser : msgBubbleBot}>
                          {String(m.content || "")}
                        </div>
                      </div>
                    ))}
                    <div style={transcriptFooter}>
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>
                        Sesión: {log.sessionId} · Email notificado: {log.emailSent ? "Sí" : "No"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
                        disabled={deleting === log.id}
                        style={deleteBtn}
                      >
                        {deleting === log.id ? "Eliminando…" : "Eliminar conversación"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const page = { fontFamily: FONT, padding: "28px 24px", maxWidth: 900, margin: "0 auto" };

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

const hotBadgeInline = {
  background: "#fff7ed", color: "#c2410c",
  border: "1px solid #fed7aa", borderRadius: 999,
  padding: "2px 10px", fontSize: 11, fontWeight: 900,
};

const headerActions = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };

const filterBtn = {
  padding: "8px 16px", borderRadius: 10,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "#f8fafc", color: "#475569",
  fontWeight: 800, fontSize: 13, cursor: "pointer",
  fontFamily: FONT,
};

const filterBtnActive = {
  background: "#0f172a", color: "#f97316",
  border: "1px solid #0f172a",
};

const backBtn = {
  padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(226,232,240,0.95)",
  background: "#f8fafc", cursor: "pointer", color: "#475569",
  fontFamily: FONT, fontWeight: 700, fontSize: 13,
};

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

const list = { display: "flex", flexDirection: "column", gap: 10 };

const card = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(2,6,23,0.04)",
};

const cardTop = {
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 16, padding: "14px 16px", cursor: "pointer",
};

const cardMeta = { flex: 1, minWidth: 0 };

const hotBadge = {
  display: "inline-block",
  background: "#fff7ed", color: "#c2410c",
  border: "1px solid #fed7aa", borderRadius: 999,
  padding: "3px 10px", fontSize: 11, fontWeight: 900,
  marginBottom: 6,
};

const keywordRow = { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 };

const keyword = {
  background: "#f1f5f9", color: "#475569",
  borderRadius: 6, padding: "2px 8px",
  fontSize: 11, fontWeight: 800,
};

const cardPreview = {
  fontSize: 13, fontWeight: 600, color: "#334155",
  lineHeight: 1.5, wordBreak: "break-word",
};

const cardQuote = { color: "#f97316", fontWeight: 900, marginRight: 2 };

const cardRight = {
  flexShrink: 0, textAlign: "right",
  display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
};

const cardDate = { fontSize: 12, fontWeight: 900, color: "#0f172a" };
const cardTime = { fontSize: 11, fontWeight: 700, color: "#94a3b8" };

const cardStats = { display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" };

const statPill = {
  background: "rgba(249,115,22,0.10)", color: "#c2410c",
  borderRadius: 999, padding: "2px 8px",
  fontSize: 11, fontWeight: 800,
};

const statPillGray = {
  background: "#f1f5f9", color: "#64748b",
  borderRadius: 999, padding: "2px 8px",
  fontSize: 11, fontWeight: 700,
};

const transcript = { padding: "0 16px 14px" };

const transcriptDivider = {
  height: 1, background: "rgba(226,232,240,0.95)",
  margin: "0 0 14px",
};

const msgUser = { marginBottom: 10, display: "flex", flexDirection: "column", alignItems: "flex-end" };
const msgBot = { marginBottom: 10, display: "flex", flexDirection: "column", alignItems: "flex-start" };

const msgLabelUser = {
  fontSize: 10, fontWeight: 900, color: "#f97316",
  letterSpacing: 0.5, textTransform: "uppercase",
  marginBottom: 3, paddingRight: 4,
};

const msgLabelBot = {
  fontSize: 10, fontWeight: 900, color: "#64748b",
  letterSpacing: 0.5, textTransform: "uppercase",
  marginBottom: 3, paddingLeft: 4,
};

const msgBubbleUser = {
  background: "linear-gradient(135deg,#f97316,#fb923c)",
  color: "#fff", padding: "8px 13px",
  borderRadius: 13, borderBottomRightRadius: 4,
  fontSize: 13, fontWeight: 700, lineHeight: 1.55,
  maxWidth: "80%", wordBreak: "break-word",
};

const msgBubbleBot = {
  background: "#f8fafc", border: "1px solid rgba(226,232,240,0.95)",
  color: "#1e293b", padding: "8px 13px",
  borderRadius: 13, borderBottomLeftRadius: 4,
  fontSize: 13, fontWeight: 600, lineHeight: 1.6,
  maxWidth: "80%", wordBreak: "break-word",
};

const transcriptFooter = {
  marginTop: 12, paddingTop: 10,
  borderTop: "1px solid rgba(226,232,240,0.95)",
  display: "flex", justifyContent: "space-between",
  alignItems: "center", gap: 8, flexWrap: "wrap",
};

const deleteBtn = {
  background: "transparent", border: "1px solid #fecaca",
  color: "#dc2626", borderRadius: 8,
  padding: "5px 12px", fontSize: 12, fontWeight: 800,
  cursor: "pointer", fontFamily: FONT,
};
