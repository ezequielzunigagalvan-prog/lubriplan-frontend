// src/components/chat/ChatMessages.jsx
import { useEffect, useRef } from "react";

const SUGGESTIONS = [
  { icon: "⚠️", label: "¿Actividades vencidas?" },
  { icon: "🛢️", label: "¿Lubricantes bajo mínimo?" },
  { icon: "👷", label: "¿Carga de técnicos?" },
  { icon: "📋", label: "¿Reportes de condición abiertos?" },
];

export default function ChatMessages({ messages, loading, error, onSuggest }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div style={emptyWrap}>
        <div style={emptyCard}>
          <div style={emptyAvatarRing}>
            <span style={emptyAvatarInner}>🤖</span>
          </div>
          <div style={emptyTitle}>LubriBot listo</div>
          <div style={emptyHint}>
            Tu asistente de lubricación industrial. Pregúntame sobre el estado
            de la planta, actividades, inventario o técnicos.
          </div>
        </div>

        <div style={suggestionsLabel}>Sugerencias rápidas</div>
        <div style={suggestionsGrid}>
          {SUGGESTIONS.map(({ icon, label }) => (
            <button
              key={label}
              type="button"
              style={suggBtn}
              onClick={() => onSuggest?.(label)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(249,115,22,0.10)";
                e.currentTarget.style.borderColor = "rgba(249,115,22,0.40)";
                e.currentTarget.style.color = "#c2410c";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = suggBtn.background;
                e.currentTarget.style.borderColor = suggBtn.borderColor;
                e.currentTarget.style.color = suggBtn.color;
                e.currentTarget.style.transform = "none";
              }}
            >
              <span style={suggIcon}>{icon}</span>
              <span style={suggText}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={list}>
      {messages.map((m, i) => {
        const isUser = m.role === "user";
        return (
          <div key={i} style={{ ...row, ...(isUser ? rowUser : rowBot) }}>
            {!isUser && <div style={botAvatar}>🤖</div>}
            <div style={{ ...bubble, ...(isUser ? bubbleUser : bubbleBot) }}>
              {!isUser && <div style={botName}>LubriBot</div>}
              <MessageText text={m.content} isUser={isUser} />
            </div>
            {isUser && <div style={userAvatar}>👤</div>}
          </div>
        );
      })}

      {loading && (
        <div style={{ ...row, ...rowBot }}>
          <div style={botAvatar}>🤖</div>
          <div style={{ ...bubble, ...bubbleBot }}>
            <div style={botName}>LubriBot</div>
            <div style={typingRow}>
              <span style={dot} />
              <span style={{ ...dot, animationDelay: "0.18s" }} />
              <span style={{ ...dot, animationDelay: "0.36s" }} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={errorChip}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes lpChatDot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

function MessageText({ text, isUser }) {
  // Renderiza saltos de línea como <br/> para mensajes del bot
  if (isUser) {
    return <div style={bubbleTextUser}>{text}</div>;
  }
  const parts = String(text || "").split("\n");
  return (
    <div style={bubbleTextBot}>
      {parts.map((line, i) => (
        <span key={i}>
          {line}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const emptyWrap = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px 14px 14px",
  gap: 14,
  height: "100%",
  overflowY: "auto",
};

const emptyCard = {
  width: "100%",
  background: "linear-gradient(140deg, #0f172a 0%, #1e3a5f 100%)",
  borderRadius: 18,
  padding: "18px 16px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 12px 32px rgba(15,23,42,0.18)",
};

const emptyAvatarRing = {
  width: 52,
  height: 52,
  borderRadius: 999,
  background: "rgba(249,115,22,0.18)",
  border: "2px solid rgba(249,115,22,0.40)",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 0 0 6px rgba(249,115,22,0.08)",
  marginBottom: 2,
};

const emptyAvatarInner = {
  fontSize: 26,
  lineHeight: 1,
};

const emptyTitle = {
  fontWeight: 950,
  fontSize: 15,
  color: "#f1f5f9",
  letterSpacing: "-0.02em",
};

const emptyHint = {
  fontSize: 12,
  fontWeight: 700,
  color: "#94a3b8",
  textAlign: "center",
  lineHeight: 1.6,
  maxWidth: 290,
};

const suggestionsLabel = {
  fontSize: 10,
  fontWeight: 950,
  color: "#94a3b8",
  letterSpacing: 1,
  textTransform: "uppercase",
  alignSelf: "flex-start",
  paddingLeft: 2,
};

const suggestionsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  width: "100%",
};

const suggBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  background: "rgba(248,250,252,0.90)",
  cursor: "pointer",
  textAlign: "left",
  color: "#374151",
  transition: "background 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease",
  boxShadow: "0 2px 8px rgba(2,6,23,0.04)",
};

const suggIcon = {
  fontSize: 18,
  lineHeight: 1,
  flexShrink: 0,
};

const suggText = {
  fontSize: 12,
  fontWeight: 900,
  lineHeight: 1.35,
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: "14px 12px 6px",
};

const row = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
};

const rowUser = {
  flexDirection: "row-reverse",
};

const rowBot = {
  flexDirection: "row",
};

const botAvatar = {
  width: 28,
  height: 28,
  borderRadius: 999,
  background: "linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(251,146,60,0.10) 100%)",
  border: "1px solid rgba(249,115,22,0.28)",
  display: "grid",
  placeItems: "center",
  fontSize: 14,
  flexShrink: 0,
  alignSelf: "flex-start",
  marginTop: 18,
};

const userAvatar = {
  width: 28,
  height: 28,
  borderRadius: 999,
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.22)",
  display: "grid",
  placeItems: "center",
  fontSize: 14,
  flexShrink: 0,
  alignSelf: "flex-start",
};

const bubble = {
  maxWidth: "82%",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const bubbleUser = {
  alignItems: "flex-end",
};

const bubbleBot = {
  alignItems: "flex-start",
};

const bubbleTextUser = {
  background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
  color: "#fff",
  padding: "9px 13px",
  borderRadius: 16,
  borderBottomRightRadius: 4,
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.55,
  wordBreak: "break-word",
  boxShadow: "0 4px 14px rgba(249,115,22,0.28)",
};

const bubbleTextBot = {
  background: "rgba(248,250,252,0.98)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#0f172a",
  padding: "9px 13px",
  borderRadius: 16,
  borderBottomLeftRadius: 4,
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.6,
  wordBreak: "break-word",
  boxShadow: "0 4px 10px rgba(2,6,23,0.05)",
};

const botName = {
  fontSize: 10,
  fontWeight: 950,
  color: "#f97316",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  paddingLeft: 2,
  marginBottom: 1,
};

const typingRow = {
  display: "flex",
  gap: 5,
  padding: "11px 15px",
  background: "rgba(248,250,252,0.98)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  borderBottomLeftRadius: 4,
  boxShadow: "0 4px 10px rgba(2,6,23,0.05)",
  alignItems: "center",
};

const dot = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: "#f97316",
  display: "inline-block",
  animation: "lpChatDot 1.1s ease-in-out infinite",
};

const errorChip = {
  alignSelf: "center",
  background: "#fff1f2",
  border: "1px solid #fecaca",
  borderRadius: 12,
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 900,
  color: "#991b1b",
  display: "flex",
  gap: 6,
  alignItems: "center",
};
