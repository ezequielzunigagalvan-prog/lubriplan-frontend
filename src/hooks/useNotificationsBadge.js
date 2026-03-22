import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NotificationBell({
  unreadCount = 0,
  items = [],
  loading = false,
  error = "",
  onRefresh,
  onMarkRead,
  onMarkAllRead,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (ev) => {
      if (!ref.current) return;
      if (!ref.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = async (n) => {
    if (n?.id) await onMarkRead?.(n.id);
    setOpen(false);
    if (n?.link) navigate(n.link);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Notificaciones"
        style={bellBtn}
      >
        🔔
        {unreadCount > 0 ? <span style={badge}>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <div style={panel}>
          <div style={panelHead}>
            <div style={{ fontWeight: 950 }}>Notificaciones</div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={onRefresh} style={miniBtn} disabled={loading} title="Actualizar">
                {loading ? "…" : "↻"}
              </button>

              <button onClick={onMarkAllRead} style={miniBtnGhost} disabled={!unreadCount}>
                Marcar todo
              </button>
            </div>
          </div>

          {error ? <div style={errBox}>{error}</div> : null}

          <div style={{ maxHeight: 360, overflow: "auto" }}>
            {items.length === 0 ? (
              <div style={empty}>Sin notificaciones.</div>
            ) : (
              items.slice(0, 12).map((n) => {
                const isUnread = !n.readAt;
                return (
                  <button
                    key={n.id}
                    onClick={() => go(n)}
                    style={{ ...rowBtn, ...(isUnread ? rowUnread : null) }}
                    title={n?.message || ""}
                  >
                    <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                      <div style={{ fontWeight: 950, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {n.title || "Notificación"}
                      </div>
                      {n.message ? (
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {n.message}
                        </div>
                      ) : null}
                    </div>

                    {isUnread ? <span style={dot} /> : null}
                  </button>
                );
              })
            )}
          </div>

          <div style={panelFoot}>
            <button
              onClick={() => { setOpen(false); navigate("/notifications"); }}
              style={seeAll}
              type="button"
            >
              Ver todas →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* styles (inline, como tu proyecto) */
const bellBtn = {
  position: "relative",
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 16,
};

const badge = {
  position: "absolute",
  top: -6,
  right: -6,
  background: "#ef4444",
  color: "#fff",
  borderRadius: 999,
  padding: "2px 6px",
  fontSize: 11,
  fontWeight: 950,
  border: "2px solid #fff",
};

const panel = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 8px)",
  width: "min(92vw, 420px)",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  boxShadow: "0 18px 40px rgba(2,6,23,0.12)",
  overflow: "hidden",
  zIndex: 50,
};

const panelHead = {
  padding: 12,
  borderBottom: "1px solid #eef2f7",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const panelFoot = {
  padding: 10,
  borderTop: "1px solid #eef2f7",
  background: "rgba(248,250,252,0.9)",
};

const miniBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 950,
};

const miniBtnGhost = {
  border: "1px solid #e5e7eb",
  background: "transparent",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const rowBtn = {
  width: "100%",
  border: "none",
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #f1f5f9",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const rowUnread = {
  background: "rgba(239,246,255,0.7)",
};

const dot = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "#ef4444",
  flex: "0 0 auto",
};

const empty = { padding: 14, color: "#64748b", fontWeight: 800 };
const errBox = { margin: 10, background: "#fff1f2", border: "1px solid #fecaca", padding: 10, borderRadius: 12, color: "#991b1b", fontWeight: 900, fontSize: 12 };
const seeAll = { border: "none", background: "transparent", cursor: "pointer", fontWeight: 950, color: "#0f172a" };