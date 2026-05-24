// src/components/chat/CardChatWidget.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { sendCardChatMessage } from "../../services/landingChatService.js";
import { submitLandingLead } from "../../services/landingLeadsService.js";

function isLeadRequest(text) {
  const t = String(text || "").toLowerCase();
  return t.includes("nombre") && (t.includes("correo") || t.includes("teléfono") || t.includes("telefono"));
}

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const SUGGESTIONS = [
  { icon: "📇", label: "¿Qué es LubriPlan Card?" },
  { icon: "🔍", label: "¿Cómo funciona el acceso QR?" },
  { icon: "💰", label: "¿Cuánto cuesta?" },
  { icon: "🎯", label: "Quiero solicitar una demo" },
];

function genSessionId() {
  return `cc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function CardChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const panelRef = useRef(null);
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);
  const sessionIdRef = useRef(genSessionId());

  const canSend = value.trim().length > 0 && !loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const btn = document.getElementById("lp-card-fab");
      if (btn?.contains(e.target)) return;
      if (!panelRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed || loading) return;
    const userMsg = { role: "user", content: trimmed };
    const outbound = [...messages, userMsg];
    setMessages(outbound);
    setLoading(true);
    setError(null);
    try {
      const data = await sendCardChatMessage(outbound, sessionIdRef.current);
      if (data?.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (!leadSubmitted && isLeadRequest(data.reply)) setShowLeadForm(true);
      }
    } catch (e) {
      setError(e?.message || "Error al contactar el asistente");
    } finally {
      setLoading(false);
    }
  }, [messages, loading, leadSubmitted]);

  const submit = () => {
    if (!canSend) return;
    sendMessage(value.trim());
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const onInput = (e) => {
    setValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 110)}px`;
    }
  };

  const hasNewMsg = !open && messages.length > 0 && messages[messages.length - 1].role === "assistant";
  const isEmpty = messages.length === 0 && !loading;

  return (
    <>
      <style>{`
        @keyframes lpCardPop {
          0%  { opacity: 0; transform: scale(0.88) translateY(18px); }
          100%{ opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes lpCardFabPulse {
          0%,100%{ box-shadow: 0 8px 28px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.22); }
          50%    { box-shadow: 0 12px 36px rgba(99,102,241,0.65), 0 0 0 8px rgba(99,102,241,0); }
        }
        @keyframes lpCardDot {
          0%,80%,100%{ opacity:0.25; transform:translateY(0); }
          40%        { opacity:1; transform:translateY(-4px); }
        }
        @keyframes lpCardSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes lpCardBadge {
          0%  { transform: scale(0); }
          60% { transform: scale(1.3); }
          100%{ transform: scale(1); }
        }
        #lp-card-fab {
          transition: transform 150ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 150ms ease;
        }
        #lp-card-fab:hover {
          transform: scale(1.10) !important;
        }
        #lp-card-fab:active {
          transform: scale(0.93) !important;
        }
        .lp-cc-sgbtn:hover {
          background: rgba(99,102,241,0.12) !important;
          border-color: rgba(99,102,241,0.42) !important;
          color: #a5b4fc !important;
          transform: translateY(-1px);
        }
        .lp-cc-icobtn:hover {
          background: rgba(255,255,255,0.10) !important;
        }
        .lp-cc-textarea:focus {
          outline: none;
          border-color: rgba(99,102,241,0.50) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
        }
      `}</style>

      {open && (
        <div ref={panelRef} style={panel} role="dialog" aria-label="Asistente LubriPlan Card">
          <div style={header}>
            <div style={headerGlow} />
            <div style={headerLeft}>
              <div style={avatarWrap}>
                <div style={avatarInner}>
                  <svg viewBox="0 0 32 32" fill="none" style={{ width: 20, height: 20 }}>
                    <rect width="32" height="32" rx="8" fill="#6366f1" />
                    <rect x="4" y="10" width="24" height="14" rx="3" fill="#fff" fillOpacity="0.15" />
                    <rect x="4" y="10" width="24" height="5" rx="2" fill="#fff" fillOpacity="0.30" />
                    <rect x="6" y="18" width="8" height="2" rx="1" fill="#fff" fillOpacity="0.60" />
                    <circle cx="24" cy="19" r="2" fill="#818cf8" />
                  </svg>
                </div>
                <div style={avatarOnline} />
              </div>
              <div>
                <div style={headerTitle}>Asistente LubriPlan Card</div>
                <div style={headerSub}>
                  {loading ? "Procesando…" : "Preguntas sobre la tarjeta digital · IA"}
                </div>
              </div>
            </div>
            <div style={headerRight}>
              {messages.length > 0 && (
                <button
                  type="button"
                  className="lp-cc-icobtn"
                  onClick={() => { setMessages([]); setError(null); setShowLeadForm(false); }}
                  style={iconBtn}
                  title="Limpiar"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="lp-cc-icobtn"
                onClick={() => setOpen(false)}
                style={iconBtn}
                title="Cerrar (Esc)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div style={msgArea}>
            {isEmpty ? (
              <div style={emptyWrap}>
                <div style={emptyCard}>
                  <div style={emptyLogo}>
                    <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
                      <rect width="32" height="32" rx="8" fill="rgba(99,102,241,0.18)" />
                      <rect x="4" y="10" width="24" height="14" rx="3" fill="rgba(99,102,241,0.5)" />
                      <rect x="4" y="10" width="24" height="5" rx="2" fill="rgba(99,102,241,0.8)" />
                      <rect x="6" y="18" width="8" height="2" rx="1" fill="#a5b4fc" />
                      <circle cx="24" cy="19" r="2" fill="#818cf8" />
                    </svg>
                  </div>
                  <div style={emptyTitle}>Hola, soy el asistente de LubriPlan Card</div>
                  <div style={emptyText}>
                    Pregúntame sobre la tarjeta digital de lubricación: acceso QR, planes, características y cómo implementarla en tu planta.
                  </div>
                </div>

                <div style={suggestLabel}>Preguntas frecuentes</div>
                <div style={suggestGrid}>
                  {SUGGESTIONS.map(({ icon, label }, i) => {
                    const isFullWidth = SUGGESTIONS.length % 2 !== 0 && i === SUGGESTIONS.length - 1;
                    return (
                      <button
                        key={label}
                        type="button"
                        className="lp-cc-sgbtn"
                        style={{ ...suggestBtn, ...(isFullWidth ? { gridColumn: "1 / -1" } : {}) }}
                        onClick={() => sendMessage(label)}
                      >
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                        <span style={suggestBtnText}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={msgList}>
                {messages.map((m, i) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={i} style={{ ...msgRow, ...(isUser ? msgRowUser : msgRowBot) }}>
                      {!isUser && <div style={botAvatar}>LP</div>}
                      <div style={{ ...bubble, ...(isUser ? bubbleUser : bubbleBot) }}>
                        {!isUser && <div style={botLabel}>LubriPlan Card</div>}
                        <BotText text={m.content} isUser={isUser} />
                      </div>
                      {isUser && <div style={userAvatar}>Tú</div>}
                    </div>
                  );
                })}

                {loading && (
                  <div style={{ ...msgRow, ...msgRowBot }}>
                    <div style={botAvatar}>LP</div>
                    <div style={{ ...bubble, ...bubbleBot }}>
                      <div style={botLabel}>LubriPlan Card</div>
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

                {showLeadForm && !leadSubmitted && (
                  <InlineLeadForm
                    sessionId={sessionIdRef.current}
                    source="card"
                    onSuccess={() => {
                      setLeadSubmitted(true);
                      setShowLeadForm(false);
                      setMessages((prev) => [...prev, { role: "assistant", content: "¡Listo! Recibimos tus datos. El equipo de LubriPlan se pondrá en contacto contigo a la brevedad para agendar tu demo de LubriPlan Card. 🎉" }]);
                    }}
                  />
                )}

                <div ref={bottomRef} />
              </div>
            )}
            {!isEmpty && <div ref={bottomRef} />}
          </div>

          <div style={inputWrap}>
            <div style={inputInner}>
              <textarea
                ref={textareaRef}
                value={value}
                onInput={onInput}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={loading ? "Procesando…" : "Pregunta sobre LubriPlan Card…"}
                disabled={loading}
                rows={1}
                className="lp-cc-textarea"
                style={{ ...textarea, opacity: loading ? 0.55 : 1 }}
              />
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                title="Enviar (Enter)"
                style={{
                  ...sendBtn,
                  opacity: canSend ? 1 : 0.32,
                  cursor: canSend ? "pointer" : "default",
                  transform: canSend ? "scale(1)" : "scale(0.90)",
                }}
              >
                {loading
                  ? <span style={spinner} />
                  : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
              </button>
            </div>
            <div style={inputHint}>Enter para enviar · Shift+Enter para nueva línea</div>
          </div>
        </div>
      )}

      <button
        id="lp-card-fab"
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...fab,
          background: open
            ? "linear-gradient(135deg, #1e1b4b 0%, #0f0a2e 100%)"
            : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          animation: !open && messages.length === 0
            ? "lpCardFabPulse 2.6s ease-in-out infinite"
            : "none",
          border: open
            ? "1px solid rgba(99,102,241,0.25)"
            : "1px solid rgba(129,140,248,0.40)",
        }}
        title={open ? "Cerrar asistente" : "Hablar con el asistente de LubriPlan Card"}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 32 32" fill="none" style={{ width: 26, height: 26 }}>
            <rect x="2" y="8" width="28" height="17" rx="3" fill="white" fillOpacity="0.9" />
            <rect x="2" y="8" width="28" height="6" rx="2" fill="white" />
            <rect x="5" y="19" width="9" height="2" rx="1" fill="rgba(99,102,241,0.7)" />
            <circle cx="26" cy="20" r="2.5" fill="#a5b4fc" />
          </svg>
        )}

        {hasNewMsg && (
          <span style={badge} aria-label="Nuevo mensaje" />
        )}

        {!open && messages.length === 0 && (
          <div style={fabLabel}>¿Preguntas sobre LubriPlan Card?</div>
        )}
      </button>
    </>
  );
}

function InlineLeadForm({ sessionId, source, onSuccess }) {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", empresa: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      setErr("Nombre, correo y teléfono son obligatorios.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await submitLandingLead({ ...form, source, sessionId });
      onSuccess();
    } catch (ex) {
      setErr(ex?.message || "Error al enviar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handle} style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 16, padding: "14px 14px 12px", margin: "4px 0", fontFamily: FONT }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "#818cf8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Tus datos de contacto</div>
      {[
        { key: "nombre", placeholder: "Nombre completo *", type: "text" },
        { key: "email", placeholder: "Correo electrónico *", type: "email" },
        { key: "telefono", placeholder: "Teléfono *", type: "tel" },
        { key: "empresa", placeholder: "Empresa (opcional)", type: "text" },
      ].map(({ key, placeholder, type }) => (
        <input
          key={key}
          type={type}
          placeholder={placeholder}
          value={form[key]}
          onChange={set(key)}
          disabled={submitting}
          style={{ display: "block", width: "100%", boxSizing: "border-box", marginBottom: 7, padding: "8px 11px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.28)", background: "rgba(15,10,46,0.70)", color: "#e2e8f0", fontSize: 12, fontWeight: 700, fontFamily: FONT, outline: "none" }}
        />
      ))}
      {err && <div style={{ color: "#f87171", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{err}</div>}
      <button type="submit" disabled={submitting} style={{ width: "100%", padding: "9px", borderRadius: 10, border: "none", background: submitting ? "rgba(99,102,241,0.45)" : "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", fontWeight: 900, fontSize: 13, cursor: submitting ? "default" : "pointer", fontFamily: FONT }}>
        {submitting ? "Enviando…" : "Solicitar demo →"}
      </button>
    </form>
  );
}

function BotText({ text, isUser }) {
  if (isUser) return <div style={bubbleTextUser}>{text}</div>;
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

const panel = {
  position: "fixed",
  bottom: 88,
  right: 20,
  width: "min(400px, calc(100vw - 24px))",
  height: "min(540px, calc(100dvh - 112px))",
  background: "linear-gradient(180deg, #0f0a2e 0%, #0c0a1e 100%)",
  border: "1px solid rgba(99,102,241,0.20)",
  borderTop: "2px solid rgba(99,102,241,0.40)",
  borderRadius: 24,
  boxShadow: "0 40px 100px rgba(2,2,20,0.65), 0 0 0 1px rgba(99,102,241,0.08)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  zIndex: 9999,
  animation: "lpCardPop 240ms cubic-bezier(0.22,1,0.36,1) both",
  fontFamily: FONT,
};

const header = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px 11px",
  background: "rgba(10,8,30,0.85)",
  borderBottom: "1px solid rgba(99,102,241,0.16)",
  flexShrink: 0,
  overflow: "hidden",
};

const headerGlow = {
  position: "absolute",
  top: -40,
  right: -20,
  width: 140,
  height: 140,
  borderRadius: 999,
  background: "rgba(99,102,241,0.15)",
  filter: "blur(36px)",
  pointerEvents: "none",
};

const headerLeft = { display: "flex", alignItems: "center", gap: 10, zIndex: 1 };

const avatarWrap = { position: "relative", flexShrink: 0 };

const avatarInner = {
  width: 38,
  height: 38,
  borderRadius: 12,
  background: "rgba(99,102,241,0.15)",
  border: "1.5px solid rgba(99,102,241,0.38)",
  display: "grid",
  placeItems: "center",
};

const avatarOnline = {
  position: "absolute",
  bottom: -2,
  right: -2,
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "#22c55e",
  border: "2px solid #0c0a1e",
};

const headerTitle = {
  fontWeight: 900,
  fontSize: 13,
  color: "#f1f5f9",
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
};

const headerSub = {
  fontWeight: 700,
  fontSize: 10,
  color: "#64748b",
  letterSpacing: 0.2,
  marginTop: 2,
};

const headerRight = { display: "flex", gap: 6, zIndex: 1 };

const iconBtn = {
  width: 28,
  height: 28,
  border: "1px solid rgba(99,102,241,0.18)",
  background: "rgba(99,102,241,0.06)",
  borderRadius: 9,
  cursor: "pointer",
  color: "#64748b",
  display: "grid",
  placeItems: "center",
  transition: "background 120ms ease",
};

const msgArea = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
};

const emptyWrap = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "16px 14px 12px",
  gap: 12,
};

const emptyCard = {
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(99,102,241,0.18)",
  borderRadius: 18,
  padding: "16px 14px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  textAlign: "center",
};

const emptyLogo = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: "rgba(99,102,241,0.12)",
  border: "1.5px solid rgba(99,102,241,0.30)",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 0 0 6px rgba(99,102,241,0.06)",
};

const emptyTitle = {
  fontWeight: 900,
  fontSize: 14,
  color: "#f1f5f9",
  letterSpacing: "-0.02em",
};

const emptyText = {
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  lineHeight: 1.6,
  maxWidth: 280,
};

const suggestLabel = {
  fontSize: 10,
  fontWeight: 900,
  color: "#475569",
  letterSpacing: 1,
  textTransform: "uppercase",
  alignSelf: "flex-start",
  paddingLeft: 2,
};

const suggestGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 7,
  width: "100%",
};

const suggestBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 11px",
  border: "1px solid rgba(99,102,241,0.18)",
  borderRadius: 13,
  background: "rgba(99,102,241,0.06)",
  cursor: "pointer",
  textAlign: "left",
  color: "#94a3b8",
  transition: "background 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease",
};

const suggestBtnText = {
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.3,
};

const msgList = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "12px 12px 6px",
};

const msgRow = { display: "flex", alignItems: "flex-end", gap: 7 };
const msgRowUser = { flexDirection: "row-reverse" };
const msgRowBot = { flexDirection: "row" };

const botAvatar = {
  width: 26,
  height: 26,
  borderRadius: 999,
  background: "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(129,140,248,0.15) 100%)",
  border: "1px solid rgba(99,102,241,0.35)",
  display: "grid",
  placeItems: "center",
  fontSize: 8,
  fontWeight: 900,
  color: "#818cf8",
  flexShrink: 0,
  alignSelf: "flex-start",
  marginTop: 16,
  letterSpacing: 0,
};

const userAvatar = {
  width: 26,
  height: 26,
  borderRadius: 999,
  background: "rgba(99,102,241,0.10)",
  border: "1px solid rgba(99,102,241,0.22)",
  display: "grid",
  placeItems: "center",
  fontSize: 8,
  fontWeight: 900,
  color: "#a5b4fc",
  flexShrink: 0,
  alignSelf: "flex-start",
  letterSpacing: 0,
};

const bubble = { maxWidth: "84%", display: "flex", flexDirection: "column", gap: 2 };
const bubbleUser = { alignItems: "flex-end" };
const bubbleBot = { alignItems: "flex-start" };

const bubbleTextUser = {
  background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
  color: "#fff",
  padding: "9px 13px",
  borderRadius: 15,
  borderBottomRightRadius: 4,
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.55,
  wordBreak: "break-word",
  boxShadow: "0 4px 16px rgba(99,102,241,0.30)",
};

const bubbleTextBot = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(99,102,241,0.16)",
  color: "#e2e8f0",
  padding: "9px 13px",
  borderRadius: 15,
  borderBottomLeftRadius: 4,
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.65,
  wordBreak: "break-word",
};

const botLabel = {
  fontSize: 9,
  fontWeight: 900,
  color: "#818cf8",
  letterSpacing: 0.8,
  textTransform: "uppercase",
  paddingLeft: 2,
  marginBottom: 1,
};

const typingRow = {
  display: "flex",
  gap: 5,
  padding: "11px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(99,102,241,0.16)",
  borderRadius: 15,
  borderBottomLeftRadius: 4,
  alignItems: "center",
};

const dot = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: "#6366f1",
  display: "inline-block",
  animation: "lpCardDot 1.1s ease-in-out infinite",
};

const errorChip = {
  alignSelf: "center",
  background: "rgba(239,68,68,0.10)",
  border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: 10,
  padding: "7px 13px",
  fontSize: 12,
  fontWeight: 700,
  color: "#fca5a5",
  display: "flex",
  gap: 6,
  alignItems: "center",
};

const inputWrap = {
  padding: "9px 11px 8px",
  borderTop: "1px solid rgba(99,102,241,0.12)",
  background: "rgba(10,8,30,0.80)",
  flexShrink: 0,
};

const inputInner = { display: "flex", alignItems: "flex-end", gap: 7 };

const textarea = {
  flex: 1,
  resize: "none",
  border: "1px solid rgba(99,102,241,0.22)",
  borderRadius: 13,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 700,
  color: "#e2e8f0",
  background: "rgba(255,255,255,0.04)",
  lineHeight: 1.5,
  fontFamily: FONT,
  minHeight: 40,
  maxHeight: 110,
  overflowY: "auto",
  transition: "border-color 140ms ease, box-shadow 140ms ease",
};

const sendBtn = {
  width: 38,
  height: 38,
  flexShrink: 0,
  border: "none",
  borderRadius: 13,
  background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
  transition: "opacity 140ms ease, transform 140ms ease",
  cursor: "pointer",
};

const spinner = {
  display: "inline-block",
  width: 14,
  height: 14,
  border: "2.5px solid rgba(255,255,255,0.30)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "lpCardSpin 0.7s linear infinite",
};

const inputHint = {
  marginTop: 5,
  fontSize: 10,
  fontWeight: 700,
  color: "#334155",
  letterSpacing: 0.1,
  textAlign: "center",
};

const fab = {
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 58,
  height: 58,
  borderRadius: 999,
  color: "#ffffff",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
  fontFamily: FONT,
};

const badge = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "#22c55e",
  border: "2px solid #0c0a1e",
  animation: "lpCardBadge 380ms cubic-bezier(0.22,1,0.36,1) both",
};

const fabLabel = {
  position: "absolute",
  right: "calc(100% + 12px)",
  top: "50%",
  transform: "translateY(-50%)",
  background: "#0f0a2e",
  color: "#e2e8f0",
  fontSize: 12,
  fontWeight: 800,
  padding: "7px 13px",
  borderRadius: 10,
  whiteSpace: "nowrap",
  boxShadow: "0 8px 28px rgba(2,2,20,0.40)",
  border: "1px solid rgba(99,102,241,0.20)",
  pointerEvents: "none",
  letterSpacing: 0.1,
};
