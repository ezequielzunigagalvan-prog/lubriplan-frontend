// src/components/LubricationCard/SyncFromRoutesModal.jsx
// Cargar rutas del equipo como puntos de la carta.
import { useEffect, useMemo, useState } from "react";
import { getSyncPreview } from "../../services/lubricationCardService";
import { Icon } from "../ui/lpIcons";
import "./LubricationCardUi.css";

const FREQ_COLOR = { DAILY: "#dc2626", WEEKLY: "#f97316", MONTHLY: "#d97706", QUARTERLY: "#16a34a", ANNUAL: "#2563eb" };
const METH_LABEL = { MANUAL: "Manual", AUTO: "Automático", GREASE_GUN: "Pistola de grasa", OIL_CAN: "Aceitera" };

export default function SyncFromRoutesModal({ equipmentId, onSync, onClose }) {
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [expandPoints, setExpandPoints] = useState(false);
  const [refreshExisting, setRefreshExisting] = useState(true);

  useEffect(() => {
    let alive = true;
    getSyncPreview(equipmentId)
      .then((data) => {
        if (!alive) return;
        const rows = data?.preview ?? [];
        setPreview(rows);
        setSelected(new Set(rows.filter((r) => !r.alreadySynced).map((r) => r.routeId)));
      })
      .catch((e) => alive && setError(e?.message || "No se pudieron cargar las rutas"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [equipmentId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !syncing && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [syncing, onClose]);

  const pending = preview.filter((r) => !r.alreadySynced);
  const synced = preview.filter((r) => r.alreadySynced);
  const newMarkers = useMemo(
    () => pending.filter((r) => selected.has(r.routeId)).reduce((n, r) => n + (expandPoints ? r.pointsCount || 1 : 1), 0),
    [pending, selected, expandPoints]
  );
  const willRefresh = refreshExisting ? synced.length : 0;
  const canRun = newMarkers > 0 || willRefresh > 0;

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOn = pending.length > 0 && pending.every((r) => selected.has(r.routeId));

  const run = async () => {
    if (!canRun || syncing) return;
    setSyncing(true);
    setError("");
    try {
      const ids = [...selected, ...(refreshExisting ? synced.map((r) => r.routeId) : [])];
      await onSync(ids, { expandPoints, refreshExisting });
      onClose?.();
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las rutas");
    } finally {
      setSyncing(false);
    }
  };

  const qty = (r) => (r.quantity != null ? `${r.quantity} ${r.unit}${r.pointsCount > 1 ? ` × ${r.pointsCount} puntos` : ""}` : "Sin cantidad");

  return (
    <div className="lc-overlay" onMouseDown={(e) => e.target === e.currentTarget && !syncing && onClose?.()}>
      <div className="lc-modal" role="dialog" aria-modal="true" aria-label="Cargar rutas en la carta">
        <div className="lc-modal-head">
          <div>
            <div className="lc-kicker">CARTA DE LUBRICACIÓN</div>
            <div className="lc-modal-title">Cargar rutas del equipo</div>
            <div className="lc-modal-sub">Cada ruta se vuelve un punto con su lubricante, cantidad, frecuencia y método. Luego solo acomodas los puntos en la foto.</div>
          </div>
          <button type="button" className="lc-x" onClick={onClose} disabled={syncing} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>

        <div className="lc-modal-body">
          {loading ? <div className="lc-muted">Cargando rutas…</div> : null}
          {!loading && error ? <div className="lc-error">{error}</div> : null}
          {!loading && !error && !preview.length ? (
            <div className="lc-empty">
              <Icon name="route" size="xl" />
              <b>Este equipo no tiene rutas</b>
              <span>Crea sus rutas de lubricación y vuelve para cargarlas en la carta.</span>
            </div>
          ) : null}

          {pending.length ? (
            <div className="lc-sec">
              <div className="lc-sec-head">
                <span>Rutas por cargar ({pending.length})</span>
                <button
                  type="button"
                  className="lc-link"
                  onClick={() => setSelected(allOn ? new Set() : new Set(pending.map((r) => r.routeId)))}
                >
                  {allOn ? "Quitar todas" : "Elegir todas"}
                </button>
              </div>
              {pending.map((r) => (
                <label key={r.routeId} className={`lc-route ${selected.has(r.routeId) ? "is-on" : ""}`}>
                  <input type="checkbox" checked={selected.has(r.routeId)} onChange={() => toggle(r.routeId)} />
                  <span className="lc-dot" style={{ background: FREQ_COLOR[r.frequency] || "#64748b" }} />
                  <span className="lc-route-info">
                    <b>{r.routeName}</b>
                    <span>
                      {[r.lubricant || "Sin lubricante", qty(r), r.frequencyLabel, METH_LABEL[r.method]].filter(Boolean).join(" · ")}
                    </span>
                    {r.sharedWith ? <em>Ruta compartida con {r.sharedWith} equipo{r.sharedWith === 1 ? "" : "s"} más</em> : null}
                  </span>
                </label>
              ))}
            </div>
          ) : null}

          {synced.length ? (
            <div className="lc-sec">
              <div className="lc-sec-head">
                <span>Ya en la carta ({synced.length})</span>
              </div>
              {synced.map((r) => (
                <div key={r.routeId} className="lc-route is-done">
                  <Icon name="check" size="sm" />
                  <span className="lc-dot" style={{ background: FREQ_COLOR[r.frequency] || "#64748b" }} />
                  <span className="lc-route-info">
                    <b>{r.routeName}</b>
                    <span>{[qty(r), r.frequencyLabel].filter(Boolean).join(" · ")} · {r.markers} marcador{r.markers === 1 ? "" : "es"}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {preview.length ? (
            <div className="lc-options">
              <label>
                <input type="checkbox" checked={expandPoints} onChange={(e) => setExpandPoints(e.target.checked)} />
                <span>
                  <b>Un marcador por cada punto de engrase</b>
                  <em>Si una ruta tiene 4 puntos, se crean 4 marcadores (P1…P4) para ubicarlos uno por uno.</em>
                </span>
              </label>
              {synced.length ? (
                <label>
                  <input type="checkbox" checked={refreshExisting} onChange={(e) => setRefreshExisting(e.target.checked)} />
                  <span>
                    <b>Actualizar las rutas que ya están en la carta</b>
                    <em>Trae cambios de lubricante, cantidad, frecuencia o método. Los marcadores no se mueven.</em>
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        {preview.length ? (
          <div className="lc-modal-foot">
            <span className="lc-muted-sm">
              {newMarkers ? `${newMarkers} punto${newMarkers === 1 ? "" : "s"} nuevo${newMarkers === 1 ? "" : "s"}` : "Sin puntos nuevos"}
              {willRefresh ? ` · ${willRefresh} ruta${willRefresh === 1 ? "" : "s"} por actualizar` : ""}
            </span>
            <button type="button" className="lc-btn" onClick={onClose} disabled={syncing}>
              Cancelar
            </button>
            <button type="button" className="lc-btn is-primary" onClick={run} disabled={!canRun || syncing}>
              <Icon name="route" size="sm" />
              {syncing ? "Cargando…" : "Cargar en la carta"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
