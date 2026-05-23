// src/components/chat/ChatMessages.jsx
import { useEffect, useRef } from "react";

export default function ChatMessages({ messages, loading, error }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div style={empty}>
        <div style={emptyIcon}>💬</div>
        <div style={emptyTitle}>LubriBot está listo</div>
        <div style={emptyHint}>
          Pregunta sobre actividades vencidas, reportes de condición, stock de
          lubricantes o la carga de tus técnicos.
        </div>
        <div style={suggestionsRow}>
          {SUGGESTIONS.map((s) => (
            <span key={s} style={suggestionChip}>
              {s}
            </span>
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
          <div key={i} style={{ ...bubble, ...(isUser ? bubbleUser : bubbleBot) }}>
            {!isUser && (
              <div style={botLabel}>LubriBot</div>
            )}
            <div style={{ ...bubbleText, ...(isUser ? bubbleTextUser : bubbleTextBot) }}>
              {m.content}
            </div>
          </div>
        );
      })}

      {loading && (
        <div style={{ ...bubble, ...bubbleBot }}>
          <div style={botLabel}>LubriBot</div>
          <div style={typingRow}>
            <span style={dot} />
            <span style={{ ...dot, animationDelay: "0.18s" }} />
            <span style={{ ...dot, animationDelay: "0.36s" }} />
          </div>
        </div>
      )}

      {error && (
        <div style={errorBubble}>{error}</div>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes lpChatDot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const SUGGESTIONS = [
  "¿Qué actividades están vencidas?",
  "¿Hay lubricantes bajo mínimo?",
  "¿Cómo está la carga de técnicos?",
];

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "12px 12px 4px",
};

const empty = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  gap: 8,
  height: "100%",
};

const emptyIcon = {
  fontSize: 32,
  lineHeight: 1,
};

const emptyTitle = {
  fontWeight: 900,
  fontSize: 15,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const emptyHint = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  textAlign: "center",
  maxWidth: 280,
  lineHeight: 1.55,
};

const suggestionsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  justifyContent: "center",
  marginTop: 4,
};

const suggestionChip = {
  fontSize: 11,
  fontWeight: 900,
  color: "#c2410c",
  background: "rgba(249,115,22,0.08)",
  border: "1px solid rgba(249,115,22,0.22)",
  borderRadius: 999,
  padding: "4px 10px",
};

const bubble = {
  maxWidth: "88%",
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const bubbleUser = {
  alignSelf: "flex-end",
  alignItems: "flex-end",
};

const bubbleBot = {
  alignSelf: "flex-start",
  alignItems: "flex-start",
};

const bubbleText = {
  padding: "9px 13px",
  borderRadius: 16,
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.55,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const bubbleTextUser = {
  background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
  color: "#fff",
  borderBottomRightRadius: 4,
  boxShadow: "0 4px 12px rgba(249,115,22,0.25)",
};

const bubbleTextBot = {
  background: "rgba(248,250,252,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#0f172a",
  borderBottomLeftRadius: 4,
  boxShadow: "0 4px 10px rgba(2,6,23,0.05)",
};

const botLabel = {
  fontSize: 10,
  fontWeight: 950,
  color: "#94a3b8",
  letterSpacing: 0.8,
  textTransform: "uppercase",
  paddingLeft: 2,
};

const typingRow = {
  display: "flex",
  gap: 5,
  padding: "12px 14px",
  background: "rgba(248,250,252,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  borderBottomLeftRadius: 4,
  boxShadow: "0 4px 10px rgba(2,6,23,0.05)",
};

const dot = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: "#94a3b8",
  display: "inline-block",
  animation: "lpChatDot 1.1s ease-in-out infinite",
};

const errorBubble = {
  alignSelf: "center",
  background: "#fff1f2",
  border: "1px solid #fecaca",
  borderRadius: 12,
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 900,
  color: "#991b1b",
  maxWidth: "90%",
  textAlign: "center",
};
