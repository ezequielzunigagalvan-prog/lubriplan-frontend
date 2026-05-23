// src/components/chat/ChatWidget.jsx
import { useState, useEffect, useRef } from "react";
import useChat from "../../hooks/useChat.js";
import ChatMessages from "./ChatMessages.jsx";
import ChatInput from "./ChatInput.jsx";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { messages, loading, error, sendMessage, clearChat } = useChat();

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Cerrar al hacer clic fuera del panel
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) {
        // También ignorar el botón de toggle (el click en él ya maneja el toggle)
        const btn = document.getElementById("lubribot-toggle-btn");
        if (btn && btn.contains(e.target)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unread = !open && messages.some((m) => m.role === "assistant");

  return (
    <>
      <style>{`
        @keyframes lpChatPop {
          0% { transform: scale(0.85) translateY(12px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes lpChatBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        #lubribot-toggle-btn {
          transition: box-shadow 140ms ease, transform 140ms ease;
        }
        #lubribot-toggle-btn:hover {
          box-shadow: 0 10px 28px rgba(249,115,22,0.50) !important;
          transform: translateY(-2px);
        }
        #lubribot-toggle-btn:active {
          transform: scale(0.94);
        }
      `}</style>

      {/* Panel de chat */}
      {open && (
        <div ref={panelRef} style={panel}>
          {/* Header */}
          <div style={header}>
            <div style={headerLeft}>
              <div style={headerAvatar}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                  <circle cx="9" cy="13" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div>
                <div style={headerTitle}>LubriBot</div>
                <div style={headerSub}>Asistente de lubricación</div>
              </div>
            </div>
            <div style={headerActions}>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  style={iconBtn}
                  title="Limpiar conversación"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={iconBtn}
                title="Cerrar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div style={messagesArea}>
            <ChatMessages messages={messages} loading={loading} error={error} />
          </div>

          {/* Input */}
          <ChatInput onSend={sendMessage} loading={loading} />
        </div>
      )}

      {/* Botón flotante */}
      <button
        id="lubribot-toggle-btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...fab,
          background: open
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
        }}
        title={open ? "Cerrar LubriBot" : "Abrir LubriBot"}
        aria-label={open ? "Cerrar asistente de chat" : "Abrir asistente de chat"}
      >
        {open ? (
          // Ícono X cuando está abierto
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Ícono de chat cuando está cerrado
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="10" x2="15" y2="10" />
            <line x1="9" y1="14" x2="13" y2="14" />
          </svg>
        )}

        {/* Indicador de mensajes no leídos */}
        {unread && (
          <span style={unreadDot} />
        )}
      </button>
    </>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const panel = {
  position: "fixed",
  bottom: 84,
  right: 20,
  width: "min(390px, calc(100vw - 24px))",
  height: "min(540px, calc(100dvh - 110px))",
  background: "#ffffff",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 22,
  boxShadow: "0 24px 64px rgba(2,6,23,0.18), 0 8px 20px rgba(2,6,23,0.08)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  zIndex: 1100,
  animation: "lpChatPop 220ms cubic-bezier(0.22,1,0.36,1) both",
};

const header = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px 11px",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(180deg, #ffffff 0%, rgba(248,250,252,0.90) 100%)",
  flexShrink: 0,
};

const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const headerAvatar = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(251,146,60,0.10) 100%)",
  border: "1px solid rgba(249,115,22,0.28)",
  color: "#f97316",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const headerTitle = {
  fontWeight: 950,
  fontSize: 14,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
};

const headerSub = {
  fontWeight: 800,
  fontSize: 10,
  color: "#64748b",
  letterSpacing: 0.2,
  marginTop: 1,
};

const headerActions = {
  display: "flex",
  gap: 4,
};

const iconBtn = {
  width: 32,
  height: 32,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.90)",
  borderRadius: 10,
  cursor: "pointer",
  color: "#475569",
  display: "grid",
  placeItems: "center",
  transition: "background 120ms ease, color 120ms ease",
};

const messagesArea = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
};

const fab = {
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 56,
  height: 56,
  borderRadius: 999,
  border: "none",
  color: "#ffffff",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 8px 24px rgba(249,115,22,0.40)",
  zIndex: 1100,
};

const unreadDot = {
  position: "absolute",
  top: 6,
  right: 6,
  width: 11,
  height: 11,
  borderRadius: 999,
  background: "#22c55e",
  border: "2px solid #fff",
  boxShadow: "0 2px 6px rgba(34,197,94,0.45)",
  animation: "lpChatBounce 1.8s ease-in-out infinite",
};
