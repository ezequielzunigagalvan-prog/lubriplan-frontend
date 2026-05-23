// src/components/chat/ChatWidget.jsx
import { useState, useEffect, useRef } from "react";
import useChat from "../../hooks/useChat.js";
import ChatMessages from "./ChatMessages.jsx";
import ChatInput from "./ChatInput.jsx";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { messages, loading, error, sendMessage, clearChat } = useChat();

  const hasNewBotMsg =
    !open && messages.length > 0 && messages[messages.length - 1].role === "assistant";

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Cerrar al clic fuera del panel
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const btn = document.getElementById("lubribot-fab");
      if (btn?.contains(e.target)) return;
      if (!panelRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleSuggest = (text) => {
    sendMessage(text);
  };

  const msgCount = messages.length;

  return (
    <>
      <style>{`
        @keyframes lpChatPop {
          0% { opacity: 0; transform: scale(0.88) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes lpChatFabPulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(249,115,22,0.42); }
          50% { box-shadow: 0 8px 32px rgba(249,115,22,0.65); }
        }
        @keyframes lpChatBadgePop {
          0% { transform: scale(0); }
          60% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        #lubribot-fab {
          transition: transform 150ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 150ms ease;
        }
        #lubribot-fab:hover {
          transform: scale(1.10) !important;
          box-shadow: 0 12px 32px rgba(249,115,22,0.55) !important;
        }
        #lubribot-fab:active {
          transform: scale(0.94) !important;
        }
        .lpIconBtn:hover {
          background: rgba(226,232,240,0.95) !important;
          color: #0f172a !important;
        }
        .lpIconBtn:active {
          transform: scale(0.92);
        }
        .lpChatClearBtn:hover {
          background: rgba(254,226,226,0.80) !important;
          border-color: rgba(252,165,165,0.60) !important;
          color: #991b1b !important;
        }
      `}</style>

      {/* ── Panel de chat ── */}
      {open && (
        <div ref={panelRef} style={panel} role="dialog" aria-label="LubriBot — Asistente de lubricación">
          {/* Header */}
          <div style={header}>
            <div style={headerGlow} />
            <div style={headerLeft}>
              <div style={avatarWrap}>
                <div style={avatarInner}>🤖</div>
                <div style={avatarOnline} />
              </div>
              <div>
                <div style={headerTitle}>LubriBot</div>
                <div style={headerSub}>
                  {loading ? "Analizando planta…" : "Asistente de lubricación · IA"}
                </div>
              </div>
            </div>
            <div style={headerRight}>
              {msgCount > 0 && (
                <button
                  type="button"
                  className="lpIconBtn lpChatClearBtn"
                  onClick={clearChat}
                  style={iconBtn}
                  title="Limpiar conversación"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="lpIconBtn"
                onClick={() => setOpen(false)}
                style={iconBtn}
                title="Cerrar (Esc)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Separador con info de contexto */}
          {msgCount === 0 && (
            <div style={contextBanner}>
              <span style={contextDot} />
              <span style={contextText}>Contexto de planta cargado en tiempo real</span>
            </div>
          )}

          {/* Mensajes */}
          <div style={messagesScroll}>
            <ChatMessages
              messages={messages}
              loading={loading}
              error={error}
              onSuggest={handleSuggest}
            />
          </div>

          {/* Input */}
          <ChatInput onSend={sendMessage} loading={loading} />
        </div>
      )}

      {/* ── Botón flotante ── */}
      <button
        id="lubribot-fab"
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...fab,
          background: open
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          animation: !open && msgCount === 0
            ? "lpChatFabPulse 2.8s ease-in-out infinite"
            : "none",
        }}
        title={open ? "Cerrar LubriBot (Esc)" : "Abrir LubriBot"}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={open}
      >
        <div style={{ transition: "transform 200ms ease", transform: open ? "rotate(0deg)" : "rotate(0deg)" }}>
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
              <line x1="9" y1="14" x2="12" y2="14" />
            </svg>
          )}
        </div>

        {/* Badge de mensajes no leídos */}
        {hasNewBotMsg && (
          <span style={badge} aria-label="Nuevo mensaje">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
              <circle cx="4" cy="4" r="4" />
            </svg>
          </span>
        )}

        {/* Label flotante en desktop */}
        {!open && msgCount === 0 && (
          <div style={fabLabel}>
            ¿Necesitas ayuda?
          </div>
        )}
      </button>
    </>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const panel = {
  position: "fixed",
  bottom: 88,
  right: 20,
  width: "min(400px, calc(100vw - 24px))",
  height: "min(560px, calc(100dvh - 112px))",
  background: "#ffffff",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 24,
  boxShadow:
    "0 32px 80px rgba(2,6,23,0.20), 0 12px 28px rgba(2,6,23,0.10), 0 0 0 1px rgba(249,115,22,0.08)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  zIndex: 1100,
  animation: "lpChatPop 240ms cubic-bezier(0.22,1,0.36,1) both",
};

const header = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px 11px",
  background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
  flexShrink: 0,
  overflow: "hidden",
};

const headerGlow = {
  position: "absolute",
  top: -30,
  right: -20,
  width: 120,
  height: 120,
  borderRadius: 999,
  background: "rgba(249,115,22,0.20)",
  filter: "blur(30px)",
  pointerEvents: "none",
};

const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  zIndex: 1,
};

const avatarWrap = {
  position: "relative",
  flexShrink: 0,
};

const avatarInner = {
  width: 38,
  height: 38,
  borderRadius: 14,
  background: "rgba(249,115,22,0.22)",
  border: "1.5px solid rgba(249,115,22,0.40)",
  display: "grid",
  placeItems: "center",
  fontSize: 20,
};

const avatarOnline = {
  position: "absolute",
  bottom: -2,
  right: -2,
  width: 11,
  height: 11,
  borderRadius: 999,
  background: "#22c55e",
  border: "2px solid #0f172a",
};

const headerTitle = {
  fontWeight: 950,
  fontSize: 14,
  color: "#f1f5f9",
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
};

const headerSub = {
  fontWeight: 800,
  fontSize: 10,
  color: "#94a3b8",
  letterSpacing: 0.2,
  marginTop: 2,
};

const headerRight = {
  display: "flex",
  gap: 6,
  zIndex: 1,
};

const iconBtn = {
  width: 30,
  height: 30,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  borderRadius: 10,
  cursor: "pointer",
  color: "#cbd5e1",
  display: "grid",
  placeItems: "center",
  transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
};

const contextBanner = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "6px 14px",
  background: "rgba(34,197,94,0.06)",
  borderBottom: "1px solid rgba(34,197,94,0.14)",
  flexShrink: 0,
};

const contextDot = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: "#22c55e",
  flexShrink: 0,
  boxShadow: "0 0 0 3px rgba(34,197,94,0.18)",
};

const contextText = {
  fontSize: 10,
  fontWeight: 900,
  color: "#166534",
  letterSpacing: 0.2,
};

const messagesScroll = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
};

const fab = {
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 58,
  height: 58,
  borderRadius: 999,
  border: "none",
  color: "#ffffff",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  zIndex: 1100,
};

const badge = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 14,
  height: 14,
  borderRadius: 999,
  background: "#22c55e",
  border: "2.5px solid #fff",
  display: "grid",
  placeItems: "center",
  animation: "lpChatBadgePop 380ms cubic-bezier(0.22,1,0.36,1) both",
};

const fabLabel = {
  position: "absolute",
  right: "calc(100% + 12px)",
  top: "50%",
  transform: "translateY(-50%)",
  background: "#0f172a",
  color: "#f1f5f9",
  fontSize: 12,
  fontWeight: 900,
  padding: "6px 12px",
  borderRadius: 10,
  whiteSpace: "nowrap",
  boxShadow: "0 8px 24px rgba(2,6,23,0.22)",
  pointerEvents: "none",
  letterSpacing: 0.1,
};
