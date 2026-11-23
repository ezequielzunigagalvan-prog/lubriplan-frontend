// src/pages/NotificationsPage.jsx
// Bandeja de notificaciones: cada usuario ve solo las suyas, de la planta activa.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";
import { useConfirm } from "../components/ui/ConfirmDialog";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteReadNotifications,
} from "../services/notificationsService";
import { usePlant } from "../context/PlantContext";
import { useAuth } from "../context/AuthContext";
import { notifMeta, notifCategories, relativeTime, groupByDay, cleanText } from "../utils/notifications";
import "./TechniciansPage.css";
import "./NotificationsPage.css";

const PAGE = 25;

export default function NotificationsPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { currentPlantId, currentPlant, setPlant } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const categories = useMemo(() => notifCategories(role), [role]);

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByType, setUnreadByType] = useState({});
  const [otherPlants, setOtherPlants] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const reqRef = useRef(0);

  const types = useMemo(() => categories.find((c) => c.key === category)?.types || null, [categories, category]);

  const apply = (res) => {
    setUnreadCount(Number(res?.unreadCount || 0));
    setUnreadByType(res?.unreadByType || {});
    setOtherPlants(Array.isArray(res?.otherPlants) ? res.otherPlants : []);
    setNextCursor(res?.nextCursor ?? null);
  };

  const load = useCallback(async () => {
    if (!currentPlantId) return;
    const id = ++reqRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await getNotifications({ unread: unreadOnly, limit: PAGE, types });
      if (id !== reqRef.current) return;
      setItems(Array.isArray(res?.items) ? res.items : []);
      apply(res);
    } catch (e) {
      if (id === reqRef.current) setError(e?.message || "No se pudieron cargar las notificaciones");
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [currentPlantId, unreadOnly, types]);

  const loadMore = async () => {
    if (!nextCursor) return;
    const id = ++reqRef.current;
    setLoadingMore(true);
    try {
      const res = await getNotifications({ unread: unreadOnly, limit: PAGE, types, cursor: nextCursor });
      if (id !== reqRef.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...(res?.items || []).filter((x) => !seen.has(x.id))];
      });
      apply(res);
    } catch (e) {
      toast.error(e?.message || "No se pudieron cargar más");
    } finally {
      if (id === reqRef.current) setLoadingMore(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  // Tiempo real: recarga cuando llega una notificación de esta planta.
  useEffect(() => {
    const onSSE = (e) => {
      const { eventName, payload } = e.detail || {};
      if (eventName !== "notification.created") return;
      const pid = payload?.plantId != null ? String(payload.plantId) : "";
      if (pid && currentPlantId != null && pid !== String(currentPlantId)) {
        load(); // actualiza el aviso de "otras plantas"
        return;
      }
      load();
    };
    window.addEventListener("lubriplan:sse", onSSE);
    return () => window.removeEventListener("lubriplan:sse", onSSE);
  }, [currentPlantId, load]);

  const markRead = async (n) => {
    if (n.readAt) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    setUnreadByType((m) => ({ ...m, [n.type]: Math.max(0, (m[n.type] || 0) - 1) }));
    try {
      await markNotificationRead({ id: n.id });
    } catch {
      load();
    }
  };

  const open = async (n) => {
    await markRead(n);
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      const r = await markAllNotificationsRead({ types });
      toast.success(r?.count ? `${r.count} marcada${r.count === 1 ? "" : "s"} como leída${r.count === 1 ? "" : "s"}` : "Todo estaba leído");
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo marcar como leídas");
    }
  };

  const remove = async (n) => {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (!n.readAt) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await deleteNotification(n.id);
    } catch (e) {
      toast.error(e?.message || "No se pudo eliminar");
      load();
    }
  };

  const clearRead = async () => {
    const ok = await confirm("Se eliminan todas las notificaciones ya leídas de esta planta. Las no leídas se conservan.", {
      title: "Borrar notificaciones leídas",
      confirmLabel: "Borrar leídas",
      danger: true,
    });
    if (!ok) return;
    try {
      const r = await deleteReadNotifications();
      toast.success(`${r?.count || 0} notificaci${r?.count === 1 ? "ón eliminada" : "ones eliminadas"}`);
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudieron borrar");
    }
  };

  const catUnread = (c) => c.types.reduce((s, t) => s + (unreadByType[t] || 0), 0);
  const groups = useMemo(() => groupByDay(items), [items]);
  const hasRead = items.some((n) => n.readAt);

  return (
    <MainLayout>
      <div className="tch nt lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Notificaciones{currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">Notificaciones</h1>
            <div className="tch-sub">
              {role === "TECHNICIAN"
                ? "Tus asignaciones, actividades vencidas, el seguimiento de tus reportes y tu resumen mensual."
                : "Condiciones reportadas, actividades críticas, vencidas, stock bajo y asignaciones de tu planta."}
            </div>
          </div>
          <div className="tch-head-actions">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load} disabled={loading}>
              <Icon name="refresh" size="sm" /> Actualizar
            </button>
            {hasRead ? (
              <button type="button" className="tch-btn tch-btn-ghost" onClick={clearRead}>
                <Icon name="trash" size="sm" /> Borrar leídas
              </button>
            ) : null}
            <button type="button" className="tch-btn tch-btn-primary" onClick={markAll} disabled={!unreadCount}>
              <Icon name="check" size="sm" /> Marcar todas como leídas
            </button>
          </div>
        </header>

        {otherPlants.length ? (
          <div className="nt-other" role="status">
            <Icon name="building" size="sm" />
            <span>Tienes notificaciones sin leer en otras plantas:</span>
            {otherPlants.map((p) => (
              <button key={p.plantId} type="button" className="tch-chip nt-plant" onClick={() => setPlant?.(p.plantId)}>
                {p.plantName} <strong>{p.unread}</strong>
              </button>
            ))}
          </div>
        ) : null}

        <div className="tch-toolbar">
          <div className="tch-tabs" role="group" aria-label="Estado">
            <button type="button" className="tch-tab" aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>
              Todas
            </button>
            <button type="button" className="tch-tab" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>
              Sin leer <span className="tch-tab-count">{unreadCount}</span>
            </button>
          </div>
          <div className="nt-cats" role="group" aria-label="Tipo">
            <button type="button" className="nt-cat" aria-pressed={!category} onClick={() => setCategory("")}>
              Todos los tipos
            </button>
            {categories.map((c) => {
              const n = catUnread(c);
              return (
                <button key={c.key} type="button" className="nt-cat" aria-pressed={category === c.key} onClick={() => setCategory(category === c.key ? "" : c.key)}>
                  {c.label}
                  {n ? <span className="nt-cat-n">{n}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {loading && !items.length ? (
          <div className="nt-list" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="nt-item nt-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudieron cargar las notificaciones</h3>
            <p>{error}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load}>
              <Icon name="refresh" size="sm" /> Reintentar
            </button>
          </div>
        ) : !items.length ? (
          <div className="tch-empty">
            <div className="tch-empty-icon"><Icon name="bell" /></div>
            <h3>{unreadOnly ? "Todo al día" : "Sin notificaciones"}</h3>
            <p>
              {unreadOnly
                ? "No tienes notificaciones pendientes de leer."
                : category
                ? "No hay notificaciones de este tipo en esta planta."
                : "Aquí verás los avisos de tu planta en cuanto ocurran."}
            </p>
          </div>
        ) : (
          <div className={`nt-list${loading ? " is-refreshing" : ""}`}>
            {groups.map((g) => (
              <section key={g.key} className="nt-group" aria-label={g.label}>
                <h2 className="nt-group-title">{g.label}</h2>
                {g.items.map((n) => (
                  <NotificationItem key={n.id} n={n} onOpen={() => open(n)} onRead={() => markRead(n)} onDelete={() => remove(n)} />
                ))}
              </section>
            ))}
            {nextCursor ? (
              <button type="button" className="tch-btn tch-btn-ghost nt-more" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Cargando…" : "Ver más"}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function NotificationItem({ n, onOpen, onRead, onDelete }) {
  const meta = notifMeta(n.type);
  const unread = !n.readAt;
  return (
    <article className={`nt-item${unread ? " is-unread" : ""}`}>
      <button type="button" className="nt-main" onClick={onOpen} title={n.link ? "Abrir" : undefined}>
        <span className={`tch-kpi-icon nt-icon ${meta.tone}`} aria-hidden="true">
          <Icon name={meta.icon} size="sm" />
        </span>
        <span className="nt-body">
          <span className="nt-top">
            <span className="nt-type">{meta.label}</span>
            <span className="nt-time" title={new Date(n.createdAt).toLocaleString("es-MX")}>{relativeTime(n.createdAt)}</span>
          </span>
          <span className="nt-title">{cleanText(n.title) || "Notificación"}</span>
          {n.message ? <span className="nt-msg">{cleanText(n.message)}</span> : null}
        </span>
        {n.link ? <Icon name="chevronRight" size="sm" /> : null}
      </button>
      <div className="nt-actions">
        {unread ? (
          <button type="button" className="tch-icon-btn" onClick={onRead} aria-label="Marcar como leída" title="Marcar como leída">
            <Icon name="check" size="sm" />
          </button>
        ) : null}
        <button type="button" className="tch-icon-btn" onClick={onDelete} aria-label="Eliminar notificación" title="Eliminar">
          <Icon name="trash" size="sm" />
        </button>
      </div>
    </article>
  );
}
