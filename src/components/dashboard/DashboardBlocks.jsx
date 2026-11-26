// src/components/dashboard/DashboardBlocks.jsx
// Bloques del dashboard por planta: carril de actividades y cuadrícula de atajos.
import { Icon } from "../ui/lpIcons";
import "./PlantDashboard.css";

const LANE = {
  red: { color: "#dc2626", soft: "#fef2f2" },
  amber: { color: "#d97706", soft: "#fffbeb" },
  green: { color: "#16a34a", soft: "#f0fdf4" },
  blue: { color: "#2563eb", soft: "#eff6ff" },
};

export function ActivityLane({ tone = "amber", icon, title, subtitle, count = 0, loading, items = [], renderItem, emptyText, onMore, max = 3 }) {
  const t = LANE[tone] || LANE.amber;
  return (
    <section className="pd-lane" style={{ "--lane": t.color, "--lane-soft": t.soft }}>
      <div className="pd-lane-head">
        <span className="pd-lane-icon">
          <Icon name={icon} size="sm" />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="pd-lane-title">{title}</div>
          {subtitle ? <div className="pd-lane-sub">{subtitle}</div> : null}
        </div>
        <span className="pd-lane-count">{loading ? "…" : count}</span>
      </div>
      <div className="pd-lane-body">
        {loading ? (
          <div className="pd-empty">Cargando…</div>
        ) : items.length ? (
          items.slice(0, max).map(renderItem)
        ) : (
          <div className="pd-empty">
            <span className="pd-empty-icon">
              <Icon name="check" />
            </span>
            {emptyText}
          </div>
        )}
      </div>
      {onMore && count > 0 ? (
        <div className="pd-lane-foot">
          <button type="button" onClick={onMore}>
            {count > max ? `Ver las ${count}` : "Ver en actividades"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function QuickTiles({ tiles = [], row = false }) {
  return (
    <div className={`pd-tiles ${row ? "is-row" : ""}`}>
      {tiles.map((t) => (
        <button key={t.label} type="button" className={`pd-tile ${t.primary ? "is-primary" : ""}`} onClick={t.onClick}>
          <span className="pd-tile-icon">
            <Icon name={t.icon} size="sm" />
          </span>
          <span>
            <b>{t.label}</b>
            {t.sub ? <small>{t.sub}</small> : null}
          </span>
          {t.badge ? <span className="pd-tile-dot">{t.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

const clean = (v) => String(v ?? "").replace(/�/g, "").trim();

/** Fila compacta de actividad para los carriles. */
export function LaneItem({ activity: a, tone = "amber", onClick }) {
  const t = LANE[tone] || LANE.amber;
  const eq = typeof a?.equipment === "string" ? a.equipment : a?.equipment?.name || a?.equipmentName || "";
  const code = (typeof a?.equipment === "object" && a?.equipment?.code) || a?.equipmentCode || "";
  const named = [a?.activityName, a?.routeName, a?.title].map(clean).find((x) => x && x.toUpperCase() !== "MANUAL");
  const title = named || clean(eq) || "Actividad";
  const tech = clean(a?.technicianName || a?.technician?.name) || (a?.isUnassigned ? "" : "");
  const date = clean(a?.dateText || a?.relativeText || a?.dateLabel);
  return (
    <button type="button" className="pd-li" style={{ "--lane": t.color, "--lane-soft": t.soft }} onClick={onClick}>
      <span className="pd-li-main">
        <b title={title}>{title}</b>
        <span>
          {clean(eq) && clean(eq) !== title ? clean(eq) : ""}
          {code ? ` · ${code}` : ""}
        </span>
      </span>
      <span className="pd-li-meta">
        {date ? <span className="pd-li-date">{date}</span> : null}
        <span className={`pd-li-tech ${tech ? "" : "is-none"}`}>
          <Icon name="user" size="sm" /> {tech || "Sin técnico"}
        </span>
      </span>
    </button>
  );
}
