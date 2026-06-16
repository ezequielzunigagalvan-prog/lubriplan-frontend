// src/pages/NotificationsPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationsService";
import { usePlant } from "../context/PlantContext";

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function Tag({ children, tone = "gray" }) {
  const bg =
    tone === "amber"
      ? "rgba(254,243,199,0.92)"
      : tone === "red"
      ? "rgba(254,226,226,0.92)"
      : tone === "steel"
      ? "rgba(226,232,240,0.95)"
      : "rgba(241,245,249,0.92)";

  const fg =
    tone === "amber"
      ? "#92400e"
      : tone === "red"
      ? "#991b1b"
      : "#334155";

  return <span style={{ ...tagBase, background: bg, color: fg }}>{children}</span>;
}

function getNotifMeta(type) {
  const t = String(type || "").toUpperCase();

  switch (t) {
    case "CONDITION_REPORTED":
      return { icon: "warn", tone: "amber", label: "Condición" };
    case "CONDITION_DISMISSED":
      return { icon: "checkCircle", tone: "steel", label: "Descartado" };
    case "EXEC_ASSIGNED":
      return { icon: "tool", tone: "steel", label: "Correctiva" };
    case "EXEC_CRITICAL":
    case "EXEC_CONDITION_CRITICAL":
      return { icon: "alert", tone: "red", label: "Crítica" };
    case "MONTHLY_TECH_SUMMARY":
      return { icon: "chartBar", tone: "amber", label: "Desempeño" };
    default:
      return { icon: "info", tone: "steel", label: "Sistema" };
  }
}

const NOTIF_ACCENT = { red: "#dc2626", amber: "#d97706", steel: "#64748b" };
const NOTIF_TINT = {
  red: "rgba(254,242,242,0.55)",
  amber: "rgba(255,251,235,0.55)",
  steel: "rgba(248,250,252,0.55)",
};

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return new Date(iso).toLocaleDateString("es-MX");
  if (diff < 60000) return "ahora";
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)} h`;
  if (diff < 604800000) return `hace ${Math.floor(diff / 86400000)} d`;
  return new Date(iso).toLocaleDateString("es-MX");
}

/**
 * Quita emojis / pictogramas al inicio o dentro del texto para que
 * la UI quede limpia aunque backend los siga mandando.
 */
function stripEmojiText(value) {
  const txt = String(value || "");

  return txt
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickNotificationData(n) {
  return n?.data || n?.payload || n?.meta || {};
}

function firstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

/**
 * Navegación inteligente:
 * - Si backend ya manda link espec?fico, se usa.
 * - Si es EXEC_CRITICAL o EXEC_ASSIGNED, intenta mandar a ActivitiesPage
 *   enfocado en esa ejecución/actividad.
 * - Si es CONDITION_REPORTED / CONDITION_DISMISSED, intenta mandar a activities
 *   o a equipment si existe.
 *
 * OJO:
 * Para que el filtro puntual funcione al 100%, ActivitiesPage debe leer
 * estos query params / state:
 *   - executionId
 *   - activityId
 *   - reportId
 *   - focus=critical
 */
function resolveNotificationTarget(n) {
  const data = pickNotificationData(n);
  const type = String(n?.type || "").toUpperCase();

  const executionId = firstDefined(
    data?.executionId,
    data?.execution?.id,
    n?.executionId
  );

  const activityId = firstDefined(
    data?.activityId,
    data?.activity?.id,
    n?.activityId
  );

  const reportId = firstDefined(
    data?.reportId,
    data?.conditionReportId,
    data?.condition?.id,
    n?.reportId
  );

  const equipmentId = firstDefined(
    data?.equipmentId,
    data?.equipment?.id,
    n?.equipmentId
  );

  if (n?.link) {
    return {
      pathname: n.link,
      state: {
        notificationId: n.id,
        executionId,
        activityId,
        reportId,
        equipmentId,
        focus: type === "EXEC_CRITICAL" || type === "EXEC_CONDITION_CRITICAL" ? "critical" : undefined,
      },
    };
  }

  if (type === "EXEC_CRITICAL" || type === "EXEC_CONDITION_CRITICAL" || type === "EXEC_ASSIGNED") {
    const params = new URLSearchParams();

    if (executionId) params.set("executionId", String(executionId));
    if (activityId) params.set("activityId", String(activityId));
    if (reportId) params.set("reportId", String(reportId));
    params.set("focus", type === "EXEC_CRITICAL" || type === "EXEC_CONDITION_CRITICAL" ? "critical" : "execution");

    return {
      pathname: `/activities${params.toString() ? `?${params.toString()}` : ""}`,
      state: {
        notificationId: n.id,
        executionId,
        activityId,
        reportId,
        equipmentId,
        focus: type === "EXEC_CRITICAL" || type === "EXEC_CONDITION_CRITICAL" ? "critical" : "execution",
        openExecutionModal: !!executionId,
      },
    };
  }

  if (type === "CONDITION_REPORTED" || type === "CONDITION_DISMISSED") {
    const params = new URLSearchParams();

    if (reportId) params.set("reportId", String(reportId));
    if (activityId) params.set("activityId", String(activityId));
    if (executionId) params.set("executionId", String(executionId));
    params.set("focus", "condition");

    return {
      pathname: `/activities${params.toString() ? `?${params.toString()}` : ""}`,
      state: {
        notificationId: n.id,
        executionId,
        activityId,
        reportId,
        equipmentId,
        focus: "condition",
      },
    };
  }

  // Manejo de resumen mensual técnico
  if (type === "MONTHLY_TECH_SUMMARY") {
    // El link viene directamente en la notificación (ej: /activities?month=2026-06&scope=mine)
    if (n.link) {
      return {
        pathname: n.link.split("?")[0] || "/activities",
        search: n.link.includes("?") ? "?" + n.link.split("?")[1] : "",
        state: { notificationId: n.id },
      };
    }
    // Fallback: ir a mis actividades
    return {
      pathname: "/activities",
      search: "?scope=mine",
      state: { notificationId: n.id },
    };
  }

  if (equipmentId) {
    return {
      pathname: `/equipments/${equipmentId}`,
      state: { notificationId: n.id },
    };
  }

  return null;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { currentPlantId } = usePlant();

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [softLoading, setSoftLoading] = useState(false);
  const [error, setError] = useState("");

  const [nextCursor, setNextCursor] = useState(null);

  const reqIdRef = useRef(0);

  const busy = loading || softLoading;

  const loadFirst = useCallback(async () => {
    const myReq = ++reqIdRef.current;
    try {
      setError("");
      setLoading(true);

      if (!currentPlantId) {
        setItems([]);
        setUnreadCount(0);
        setNextCursor(null);
        return;
      }

      const res = await getNotifications({
        unread: unreadOnly,
        limit: 20,
        cursor: null,
      });

      if (myReq !== reqIdRef.current) return;

      setItems(Array.isArray(res?.items) ? res.items : []);
      setUnreadCount(toNum(res?.unreadCount));
      setNextCursor(res?.nextCursor ?? null);
    } catch (e) {
      if (myReq !== reqIdRef.current) return;
      setError(e?.message || "Error cargando notificaciones");
    } finally {
      if (myReq !== reqIdRef.current) return;
      setLoading(false);
    }
  }, [unreadOnly, currentPlantId]);

  const loadMore = useCallback(async () => {
    if (!currentPlantId || !nextCursor) return;
    const myReq = ++reqIdRef.current;

    try {
      setError("");
      setSoftLoading(true);

      const res = await getNotifications({
        unread: unreadOnly,
        limit: 20,
        cursor: nextCursor,
      });

      if (myReq !== reqIdRef.current) return;

      const more = Array.isArray(res?.items) ? res.items : [];
      setItems((prev) => {
        const seen = new Set(prev.map((x) => String(x.id)));
        const merged = [...prev];
        for (const it of more) {
          if (!seen.has(String(it.id))) merged.push(it);
        }
        return merged;
      });

      setUnreadCount(toNum(res?.unreadCount));
      setNextCursor(res?.nextCursor ?? null);
    } catch (e) {
      if (myReq !== reqIdRef.current) return;
      setError(e?.message || "Error cargando más notificaciones");
    } finally {
      if (myReq !== reqIdRef.current) return;
      setSoftLoading(false);
    }
  }, [currentPlantId, nextCursor, unreadOnly]);

  const markRead = useCallback(
    async (id) => {
      const nid = Number(id);
      if (!Number.isFinite(nid)) return;

      setItems((prev) =>
        prev.map((n) =>
          Number(n.id) === nid ? { ...n, readAt: n.readAt || new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, toNum(c) - 1));

      try {
        await markNotificationRead({ id: nid });
      } catch (e) {
        loadFirst();
        throw e;
      }
    },
    [loadFirst]
  );

  const markAll = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
      loadFirst();
    } catch (e) {
      loadFirst();
      throw e;
    }
  }, [loadFirst]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  useEffect(() => {
    const onSSE = (e) => {
      const { eventName, payload } = e.detail || {};
      if (!eventName) return;

      const payloadPlantId = payload?.plantId != null ? String(payload.plantId) : "";
      const activePlantId = currentPlantId != null ? String(currentPlantId) : "";
      const samePlant = !payloadPlantId || !activePlantId || payloadPlantId === activePlantId;
      if (!samePlant) return;

      if (eventName === "notification.created") {
        loadFirst();

        const notifType = String(payload?.type || "").toUpperCase();
        if (notifType === "EXEC_CRITICAL" || notifType === "EXEC_CONDITION_CRITICAL") {
          try {
            const audio = new Audio("/alert.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {
            // noop
          }
        }
      }
    };

    window.addEventListener("lubriplan:sse", onSSE);
    return () => window.removeEventListener("lubriplan:sse", onSSE);
  }, [currentPlantId, loadFirst]);

  const title = useMemo(() => {
    if (unreadOnly) return "Notificaciones ? sin leer";
    return "Notificaciones";
  }, [unreadOnly]);

  return (
    <MainLayout>
      <style>{`
        @keyframes lp-pulse-dot {
          0%, 100% { box-shadow: 0 0 0 3px rgba(249,115,22,0.18); }
          50% { box-shadow: 0 0 0 6px rgba(249,115,22,0.10); }
        }
      `}</style>
      <div style={headerRow}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 950, color: "#64748b", letterSpacing: 1.2 }}>
            <span style={{ width: 18, height: 2, background: "#f97316", borderRadius: 999, flexShrink: 0 }} />
            NOTIFICACIONES · BANDEJA
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{title}</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontWeight: 900 }}>
            Bandeja de eventos (condición, correctivas, alertas, sistema)
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={toggleWrap}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            <span style={{ fontWeight: 950, color: "#0f172a" }}>Solo sin leer</span>
          </label>

          <Tag tone={unreadCount ? "amber" : "steel"}>
            {unreadCount ? `${unreadCount} sin leer` : "Todo al días"}
          </Tag>

          <button
            className="lpPress"
            style={btnGhost}
            onClick={loadFirst}
            disabled={busy}
            type="button"
            title="Actualizar"
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="reset" />
              {busy ? "Actualizando?" : "Actualizar"}
            </span>
          </button>

          <button
            className="lpPress"
            style={{
              ...btnPrimary,
              opacity: unreadCount ? 1 : 0.55,
              cursor: unreadCount ? "pointer" : "not-allowed",
            }}
            onClick={markAll}
            disabled={!unreadCount || busy}
            type="button"
            title="Marcar todas como le?das"
          >
            Marcar todas
          </button>
        </div>
      </div>

      {error ? <div style={errorBox}>{error}</div> : null}

      {loading ? (
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="lpShimmer" style={{ height: 96, borderRadius: 14, borderTop: "4px solid rgba(226,232,240,0.9)" }} />
          ))}
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div style={emptyTxt}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(15,23,42,0.06)", display: "grid", placeItems: "center" }}>
                <Icon name="alert" style={{ width: 22, height: 22, color: "#94a3b8" }} />
              </div>
              <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 15 }}>Sin notificaciones</div>
              <div style={{ fontWeight: 850, color: "#64748b", fontSize: 13 }}>No hay notificaciones para mostrar.</div>
            </div>
          ) : (
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {items.map((n, idx) => {
                const meta = getNotifMeta(n.type);
                const unread = !n.readAt;
                const safeTitle = stripEmojiText(n.title || "Notificación");
                const safeMessage = stripEmojiText(n.message || "");
                const target = resolveNotificationTarget(n);

                const accent = NOTIF_ACCENT[meta.tone] || "#64748b";
                const tintBg = NOTIF_TINT[meta.tone] || "rgba(248,250,252,0.55)";
                const sideBorder = meta.tone === "red"
                  ? "4px solid rgba(239,68,68,0.65)"
                  : meta.tone === "amber"
                  ? "4px solid rgba(249,115,22,0.65)"
                  : "4px solid rgba(148,163,184,0.45)";

                return (
                  <button
                    key={n.id}
                    className="lpPress lpKpiCard"
                    style={{
                      ...notifCard,
                      borderTop: `4px solid ${accent}`,
                      borderRight: `1px solid ${unread ? "rgba(249,115,22,0.22)" : "rgba(226,232,240,0.90)"}`,
                      borderBottom: `1px solid ${unread ? "rgba(249,115,22,0.22)" : "rgba(226,232,240,0.90)"}`,
                      borderLeft: sideBorder,
                      background: unread
                        ? `linear-gradient(160deg, ${tintBg} 0%, rgba(248,250,252,0.92) 100%)`
                        : "linear-gradient(160deg, rgba(248,250,252,0.55) 0%, rgba(255,255,255,0.92) 100%)",
                      opacity: unread ? 1 : 0.74,
                      animationDelay: `${Math.min(idx, 9) * 40}ms`,
                    }}
                    onClick={async () => {
                      if (unread) {
                        try { await markRead(n.id); } catch {}
                      }
                      if (target?.pathname) {
                        navigate(target.pathname, { state: target.state });
                      }
                    }}
                    type="button"
                    title={safeMessage || safeTitle}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{
                        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                        display: "grid", placeItems: "center",
                        background: meta.tone === "red" ? "rgba(254,226,226,0.9)"
                          : meta.tone === "amber" ? "rgba(254,243,199,0.9)"
                          : "rgba(226,232,240,0.9)",
                        border: `1px solid ${accent}33`,
                        color: accent,
                      }}>
                        <Icon name={meta.icon} size="sm" />
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 900, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {safeTitle}
                        </div>
                        {safeMessage ? <div style={notifMsg}>{safeMessage}</div> : null}
                        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <Tag tone={meta.tone}>{meta.label}</Tag>
                          {unread
                            ? <span style={dotLive} title="Nuevo" />
                            : <span style={dotOff} title="Leído" />}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                        <div style={notifMeta}>{relativeTime(n.createdAt)}</div>
                        {unread ? <Tag tone="amber">Nuevo</Tag> : <Tag tone="steel">Leído</Tag>}
                      </div>
                    </div>

                    {/* Footer go-button */}
                    {target?.pathname && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "5px 12px", borderRadius: 999,
                          fontSize: 12, fontWeight: 900,
                          background: accent, color: "#fff",
                          boxShadow: `0 4px 12px ${accent}44`,
                        }}>
                          Ver →
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            {nextCursor ? (
              <button
                className="lpPress"
                style={btnGhost}
                onClick={loadMore}
                disabled={softLoading}
                type="button"
              >
                {softLoading ? "Cargando" : "Cargar más"}
              </button>
            ) : items.length ? (
              <div style={{ color: "#94a3b8", fontWeight: 900 }}>Fin</div>
            ) : null}
          </div>
        </>
      )}
    </MainLayout>
  );
}

/* ===================== styles ===================== */

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  padding: "14px 16px",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  borderTop: "3px solid #0f172a",
  borderLeft: "3px solid rgba(249,115,22,0.55)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 52%, rgba(255,247,237,0.60) 100%)",
  boxShadow: "0 18px 36px rgba(2,6,23,0.07)",
};

const toggleWrap = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  cursor: "pointer",
  userSelect: "none",
};

const tagBase = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.9)",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const btnGhost = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const btnPrimary = {
  border: "1px solid rgba(15,23,42,0.92)",
  background: "rgba(15,23,42,0.92)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "white",
  boxShadow: "0 10px 24px rgba(2,6,23,0.10)",
};

const notifCard = {
  textAlign: "left",
  borderRadius: 14,
  padding: 12,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
};

const notifMsg = { marginTop: 4, fontSize: 12, fontWeight: 800, color: "#475569" };
const notifMeta = { fontSize: 11, fontWeight: 850, color: "#94a3b8" };

const dotLive = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "rgba(249,115,22,0.95)",
  border: "1px solid rgba(251,146,60,0.85)",
  boxShadow: "0 0 0 3px rgba(249,115,22,0.18)",
  flex: "0 0 auto",
  animation: "lp-pulse-dot 1.8s ease-in-out infinite",
};

const dotOff = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "rgba(148,163,184,0.55)",
  border: "1px solid rgba(148,163,184,0.75)",
  flex: "0 0 auto",
};

const emptyTxt = {
  marginTop: 14,
  padding: "32px 18px",
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.90)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  textAlign: "center",
  boxShadow: "0 12px 28px rgba(2,6,23,0.04)",
};

const loadingBox = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginTop: 14,
  padding: "18px 16px",
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.88)",
  fontWeight: 900,
  color: "#475569",
};

const errorBox = {
  marginTop: 12,
  background: "rgba(254,226,226,0.92)",
  border: "1px solid rgba(254,202,202,0.95)",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 950,
};

