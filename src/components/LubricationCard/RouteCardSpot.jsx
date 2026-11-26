// src/components/LubricationCard/RouteCardSpot.jsx
// Carta de lubricación del equipo con el/los punto(s) de la ruta resaltados.
// Sustituye la foto por ruta: una sola imagen por equipo y se marca qué punto toca.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/lpIcons";
import { httpGet } from "../../services/http";
import "./LubricationCardUi.css";

export default function RouteCardSpot({ equipmentId, routeId, fallbackImage = "", compact = false, canEdit = false }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(null); // null = imagen principal

  useEffect(() => {
    if (!equipmentId) return undefined;
    let alive = true;
    httpGet(`/lubrication-cards/${equipmentId}/route-spot/${routeId || 0}`)
      .then((r) => {
        if (!alive) return;
        setData(r);
        // Abre la imagen donde está el primer punto de esta ruta.
        const first = (r?.points || []).find((p) => (r?.highlightIds || []).includes(p.id));
        setActive(first?.imageId ?? null);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [equipmentId, routeId]);

  const highlight = useMemo(() => new Set(data?.highlightIds || []), [data]);
  const images = useMemo(() => {
    const list = [];
    if (data?.imageUrl) list.push({ id: null, url: data.imageUrl, label: "Principal" });
    (data?.images || []).forEach((i) => list.push({ id: i.id, url: i.imageUrl, label: i.label }));
    return list;
  }, [data]);
  const current = images.find((i) => i.id === active) || images[0];
  const shown = (data?.points || []).filter((p) => (current ? (p.imageId ?? null) === current.id : false));
  const targets = (data?.points || []).filter((p) => highlight.has(p.id));

  // Sin carta: usa la foto antigua de la ruta si existe.
  if (failed || (data && !data.hasCard)) {
    if (fallbackImage) {
      return (
        <div className="rcs rcs-fallback">
          <div className="rcs-head">
            <Icon name="camera" size="sm" /> Referencia del punto
          </div>
          <img src={fallbackImage} alt="Referencia de la ruta" className="rcs-img-plain" />
        </div>
      );
    }
    return compact ? null : (
      <div className="rcs rcs-empty">
        <Icon name="doc" size="sm" />
        <span>Este equipo aún no tiene carta de lubricación.</span>
        {canEdit && equipmentId ? <Link to={`/equipments/${equipmentId}/lubrication-card`}>Crear carta</Link> : null}
      </div>
    );
  }
  if (!data) return compact ? null : <div className="rcs rcs-empty">Cargando carta…</div>;

  return (
    <div className={`rcs ${compact ? "is-compact" : ""}`}>
      <div className="rcs-head">
        <Icon name="doc" size="sm" /> Carta de lubricación
        {targets.length ? (
          <span className="rcs-tag">
            Toca: {targets.map((t) => t.label).slice(0, 3).join(", ")}
            {targets.length > 3 ? ` +${targets.length - 3}` : ""}
          </span>
        ) : (
          <span className="rcs-tag is-muted">Punto no ubicado en la carta</span>
        )}
      </div>

      {images.length > 1 ? (
        <div className="rcs-tabs">
          {images.map((im) => {
            const n = (data.points || []).filter((p) => (p.imageId ?? null) === im.id && highlight.has(p.id)).length;
            return (
              <button key={String(im.id)} type="button" className={current?.id === im.id ? "is-on" : ""} onClick={() => setActive(im.id)}>
                {im.label}
                {n ? <span>{n}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {current ? (
        <div className="rcs-stage">
          <img src={current.url} alt="Carta de lubricación" draggable={false} />
          {shown.map((p) => {
            const on = highlight.has(p.id);
            const idx = (data.points || []).indexOf(p) + 1;
            return (
              <span key={p.id} className={`rcs-dot ${on ? "is-on" : ""}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} title={p.label}>
                {on ? idx : ""}
                {on ? <em>{p.label}</em> : null}
              </span>
            );
          })}
        </div>
      ) : null}

      {targets.length ? (
        <div className="rcs-list">
          {targets.map((t) => (
            <span key={t.id}>
              <b>{(data.points || []).indexOf(t) + 1}</b> {t.label}
              {t.lubricant ? ` · ${t.lubricant}` : ""}
              {t.quantity != null ? ` · ${t.quantity} ${t.unit || ""}` : ""}
            </span>
          ))}
        </div>
      ) : canEdit && equipmentId ? (
        <div className="rcs-hint">
          Ubica esta ruta en la carta con <Link to={`/equipments/${equipmentId}/lubrication-card`}>Cargar rutas</Link> para que el técnico vea qué punto toca.
        </div>
      ) : null}
    </div>
  );
}
