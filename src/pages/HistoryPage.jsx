// src/pages/HistoryPage.jsx
// Historial auditable: actividades completadas, movimientos de inventario y órdenes preventivas.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import {
  getHistoryExecutions,
  getHistoryLubricantMovements,
  exportHistoryExecutions,
  exportHistoryMovements,
} from "../services/historyService";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { getTechnicians } from "../services/techniciansService";
import { API_ASSETS_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { Icon } from "../components/ui/lpIcons";
import {
  presetRange,
  monthRange,
  conditionInfo,
  KIND_LABEL,
  moveInfo,
  fmtQty,
  fmtDateTime,
  rangeLabel,
  delayInfo,
} from "../utils/history";
import { reasonLabel } from "../utils/inventory";
import "./TechniciansPage.css";
import "./InventoryPage.css";
import "./EquipmentsPage.css";
import "./HistoryPage.css";

const PRESETS = [
  ["today", "Hoy"],
  ["7d", "7 días"],
  ["month", "Este mes"],
  ["prev", "Mes anterior"],
  ["year", "Este año"],
];

const imgUrl = (raw) => {
  if (!raw) return "";
  const s = String(raw);
  if (/^https?:\/\//.test(s)) return s;
  return s.startsWith("/") ? `${API_ASSETS_URL}${s}` : s;
};

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function HistoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlantId, currentPlant, loadingPlants } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const isTech = role === "TECHNICIAN";

  // Deep links: ?month=YYYY-MM, ?filter=bad-condition, ?tab=movements|olp
  const qs = useMemo(() => new URLSearchParams(location.search || ""), [location.search]);
  const urlMonth = qs.get("month") || "";
  const badCondition = qs.get("filter") === "bad-condition";
  const urlTab = qs.get("tab");

  const initialRange = monthRange(urlMonth) || presetRange("month");
  const [tab, setTab] = useState(["movements", "olp"].includes(urlTab) ? urlTab : "executions");
  const [range, setRange] = useState(initialRange);
  const [preset, setPreset] = useState(urlMonth ? "" : "month");
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim());

  // filtros de actividades
  const [condition, setCondition] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [evidence, setEvidence] = useState(false);
  // filtros de movimientos
  const [moveType, setMoveType] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [data, setData] = useState({ items: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [detail, setDetail] = useState(null);
  const reqRef = useRef(0);

  // Sincroniza el rango cuando cambia el mes de la URL (p. ej. desde el dashboard).
  useEffect(() => {
    const r = monthRange(urlMonth);
    if (r) {
      setRange(r);
      setPreset("");
    }
  }, [urlMonth]);

  useEffect(() => {
    if (isTech || !currentPlantId) return;
    getTechnicians()
      .then((list) => setTechnicians(Array.isArray(list) ? list : []))
      .catch(() => setTechnicians([]));
  }, [isTech, currentPlantId]);

  // Vuelve a la página 1 al cambiar cualquier filtro.
  useEffect(() => {
    setPage(1);
  }, [tab, range, q, condition, technicianId, evidence, moveType, pageSize, badCondition, currentPlantId]);

  const params = useMemo(() => {
    const base = { from: range.from, to: range.to, q, page, pageSize };
    if (tab === "executions") {
      return {
        ...base,
        condition,
        technicianId: isTech ? "" : technicianId,
        evidence,
        filter: badCondition && !condition ? "bad-condition" : "",
      };
    }
    if (tab === "movements") return { ...base, type: moveType };
    return base;
  }, [tab, range, q, page, pageSize, condition, technicianId, evidence, moveType, badCondition, isTech]);

  const load = useCallback(async () => {
    if (loadingPlants || !currentPlantId) return;
    const id = ++reqRef.current;
    setLoading(true);
    setError("");
    try {
      let result;
      if (tab === "executions") {
        const r = await getHistoryExecutions(params);
        result = { items: r?.items || [], meta: r?.meta || null };
      } else if (tab === "movements") {
        const r = await getHistoryLubricantMovements(params);
        result = { items: r?.items || [], meta: r?.meta || null };
      } else {
        const r = await preventiveOrdersService.listCompleted({
          from: params.from,
          to: params.to,
          page: params.page,
          limit: params.pageSize,
        });
        const total = r?.meta?.total ?? r?.total ?? 0;
        const pages = r?.meta?.totalPages ?? r?.totalPages ?? 1;
        const items = Array.isArray(r?.data) ? r.data : [];
        const needle = q.toLowerCase();
        result = {
          items: needle
            ? items.filter((o) =>
                [o.title, o.equipment?.name, o.equipment?.code, o.assignedToUser?.name, `#${o.id}`]
                  .filter(Boolean)
                  .some((s) => String(s).toLowerCase().includes(needle))
              )
            : items,
          meta: { page: params.page, pages: Math.max(1, pages), total },
        };
      }
      if (id === reqRef.current) setData(result);
    } catch (e) {
      if (id === reqRef.current) {
        setError(e?.message || "No se pudo cargar el historial");
        setData({ items: [], meta: null });
      }
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [tab, params, q, currentPlantId, loadingPlants]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (key) => {
    const r = presetRange(key);
    if (!r) return;
    setPreset(key);
    setRange(r);
  };

  const setDate = (k) => (e) => {
    setPreset("");
    setRange((r) => ({ ...r, [k]: e.target.value }));
  };

  const clearBadCondition = () => {
    const p = new URLSearchParams(location.search || "");
    p.delete("filter");
    navigate({ search: p.toString() ? `?${p}` : "" }, { replace: true });
  };

  const openActivityByFolio = (id) => {
    setTab("executions");
    setCondition("");
    setTechnicianId("");
    setEvidence(false);
    setRange({ from: "", to: "" });
    setPreset("");
    setSearch(`#${id}`);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const { page: _p, pageSize: _s, ...filters } = params;
      if (tab === "executions") await exportHistoryExecutions(filters, currentPlantId);
      else await exportHistoryMovements(filters, currentPlantId);
      toast.success("Archivo CSV descargado");
    } catch (e) {
      toast.error(e?.message || "No se pudo exportar");
    } finally {
      setExporting(false);
    }
  };

  const meta = data.meta;
  const totals = meta?.totals || {};
  const filtersActive =
    tab === "executions" ? Boolean(condition || technicianId || evidence || q) : tab === "movements" ? Boolean(moveType || q) : Boolean(q);

  const clearFilters = () => {
    setCondition("");
    setTechnicianId("");
    setEvidence(false);
    setMoveType("");
    setSearch("");
  };

  const toggleCondition = (c) => setCondition((cur) => (cur === c ? "" : c));

  return (
    <MainLayout>
      <div className="tch hst lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Historial{currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">Historial</h1>
            <div className="tch-sub">
              Registro de actividades ejecutadas, consumos de lubricante y órdenes preventivas cerradas. Base para auditorías.
            </div>
          </div>
          <div className="tch-head-actions">
            <label className="tch-search">
              <Icon name="search" size="sm" />
              <input
                placeholder={tab === "movements" ? "Lubricante, motivo, equipo…" : "Folio, equipo, ruta, técnico…"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar en el historial"
              />
              {search ? (
                <button type="button" className="tch-icon-btn" style={{ width: 26, height: 26, border: 0 }} onClick={() => setSearch("")} aria-label="Limpiar búsqueda">
                  <Icon name="close" size="sm" />
                </button>
              ) : null}
            </label>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load} disabled={loading} aria-label="Actualizar">
              <Icon name="refresh" size="sm" /> Actualizar
            </button>
            {tab !== "olp" ? (
              <button type="button" className="tch-btn tch-btn-primary" onClick={onExport} disabled={exporting || !meta?.total}>
                <Icon name="download" size="sm" /> {exporting ? "Exportando…" : "Exportar CSV"}
              </button>
            ) : null}
          </div>
        </header>

        <div className="tch-tabs hst-tabs" role="tablist" aria-label="Sección del historial">
          {[
            ["executions", "Actividades", "check"],
            ["movements", "Movimientos de inventario", "drop"],
            ["olp", "Órdenes preventivas", "doc"],
          ].map(([key, label, icon]) => (
            <button key={key} type="button" role="tab" className="tch-tab" aria-selected={tab === key} aria-pressed={tab === key} onClick={() => setTab(key)}>
              <Icon name={icon} size="sm" /> {label}
              {tab === key && meta ? <span className="tch-tab-count">{meta.total}</span> : null}
            </button>
          ))}
        </div>

        {/* Rango de fechas */}
        <section className="hst-range" aria-label="Periodo">
          <div className="hst-presets" role="group" aria-label="Periodo rápido">
            {PRESETS.map(([key, label]) => (
              <button key={key} type="button" className="hst-preset" aria-pressed={preset === key} onClick={() => applyPreset(key)}>
                {label}
              </button>
            ))}
          </div>
          <div className="hst-dates">
            <label>
              <span>Desde</span>
              <input type="date" className="tch-input" value={range.from} max={range.to || undefined} onChange={setDate("from")} />
            </label>
            <label>
              <span>Hasta</span>
              <input type="date" className="tch-input" value={range.to} min={range.from || undefined} onChange={setDate("to")} />
            </label>
          </div>
          <div className="hst-range-label">
            <Icon name="calendar" size="sm" /> {rangeLabel(range.from, range.to)}
            {meta?.timezone ? <span className="hst-tz">Hora de planta · {meta.timezone.split("/").pop().replace(/_/g, " ")}</span> : null}
          </div>
        </section>

        {badCondition && tab === "executions" ? (
          <div className="eq-banner" role="status">
            <span>
              <Icon name="warn" size="sm" /> Actividades con condición MALA o CRÍTICA reportada por el técnico. Revisa observaciones y evidencia.
            </span>
            <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 32 }} onClick={clearBadCondition}>
              Quitar filtro
            </button>
          </div>
        ) : null}

        {/* KPIs */}
        {tab === "executions" && meta ? (
          <section className="tch-kpis" aria-label="Resumen de actividades">
            <Kpi icon="check" tone="is-green" value={totals.all ?? 0} label="Actividades completadas" active={!condition && !evidence} onClick={() => { setCondition(""); setEvidence(false); }} />
            <Kpi icon="alert" tone={totals.CRITICO ? "is-red" : ""} value={totals.CRITICO ?? 0} label="Condición crítica" active={condition === "CRITICO"} onClick={() => toggleCondition("CRITICO")} />
            <Kpi icon="warn" tone={totals.MALO ? "is-orange" : ""} value={totals.MALO ?? 0} label="Condición mala" active={condition === "MALO"} onClick={() => toggleCondition("MALO")} />
            <Kpi icon="camera" value={totals.withEvidence ?? 0} total={totals.all || null} label="Con evidencia" active={evidence} onClick={() => setEvidence((v) => !v)} />
          </section>
        ) : null}
        {tab === "movements" && meta ? (
          <section className="tch-kpis" aria-label="Resumen de movimientos">
            <Kpi icon="list" value={totals.all ?? 0} label="Movimientos" active={!moveType} onClick={() => setMoveType("")} />
            <Kpi icon="upload" tone="is-green" value={totals.IN ?? 0} label="Entradas" active={moveType === "IN"} onClick={() => setMoveType((t) => (t === "IN" ? "" : "IN"))} />
            <Kpi icon="download" tone={totals.OUT ? "is-red" : ""} value={totals.OUT ?? 0} label="Salidas" active={moveType === "OUT"} onClick={() => setMoveType((t) => (t === "OUT" ? "" : "OUT"))} />
            <Kpi icon="settings" tone={totals.ADJUST ? "is-orange" : ""} value={totals.ADJUST ?? 0} label="Ajustes" active={moveType === "ADJUST"} onClick={() => setMoveType((t) => (t === "ADJUST" ? "" : "ADJUST"))} />
          </section>
        ) : null}

        {/* Filtros */}
        {tab !== "olp" ? (
          <div className="eq-filters">
            {tab === "executions" ? (
              <>
                <select className="eq-select" value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Condición">
                  <option value="">Todas las condiciones</option>
                  <option value="BUENO">Buena</option>
                  <option value="REGULAR">Regular</option>
                  <option value="MALO">Mala</option>
                  <option value="CRITICO">Crítica</option>
                </select>
                {!isTech ? (
                  <select className="eq-select" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} aria-label="Técnico">
                    <option value="">Todos los técnicos</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.code ? ` · ${t.code}` : ""}
                      </option>
                    ))}
                  </select>
                ) : null}
                <label className="hst-check">
                  <input type="checkbox" checked={evidence} onChange={(e) => setEvidence(e.target.checked)} /> Solo con evidencia
                </label>
              </>
            ) : (
              <select className="eq-select" value={moveType} onChange={(e) => setMoveType(e.target.value)} aria-label="Tipo de movimiento">
                <option value="">Todos los tipos</option>
                <option value="IN">Entradas</option>
                <option value="OUT">Salidas</option>
                <option value="ADJUST">Ajustes</option>
              </select>
            )}
            {filtersActive ? (
              <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 36 }} onClick={clearFilters}>
                <Icon name="close" size="sm" /> Limpiar filtros
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Contenido */}
        {loading && !data.items.length ? (
          <div className="hst-list" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="hst-row hst-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudo cargar el historial</h3>
            <p>{error}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load}>
              <Icon name="refresh" size="sm" /> Reintentar
            </button>
          </div>
        ) : !data.items.length ? (
          <div className="tch-empty">
            <div className="tch-empty-icon"><Icon name="history" /></div>
            <h3>Sin registros</h3>
            <p>
              {filtersActive || badCondition
                ? "Ningún registro coincide con los filtros en este periodo."
                : "No hay registros en este periodo. Prueba con otro rango de fechas."}
            </p>
          </div>
        ) : (
          <div className={`hst-list${loading ? " is-refreshing" : ""}`}>
            {tab === "executions"
              ? data.items.map((ex) => <ActivityRow key={ex.id} ex={ex} onOpen={() => setDetail(ex)} />)
              : tab === "movements"
              ? data.items.map((m) => <MovementRow key={m.id} m={m} onOpenActivity={openActivityByFolio} />)
              : data.items.map((o) => <OrderRow key={o.id} o={o} onOpen={() => navigate(`/preventive-orders/${o.id}`)} />)}
          </div>
        )}

        {meta && meta.total > 0 ? (
          <Pager meta={meta} page={page} pageSize={pageSize} loading={loading} onPage={setPage} onPageSize={setPageSize} />
        ) : null}
      </div>

      {detail ? <ActivityDrawer ex={detail} onClose={() => setDetail(null)} plantName={currentPlant?.name} /> : null}
    </MainLayout>
  );
}

/* ================= Componentes ================= */

function Kpi({ icon, tone = "", value, total, label, onClick, active }) {
  return (
    <button type="button" className="tch-kpi hst-kpi" aria-pressed={!!active} onClick={onClick}>
      <div className={`tch-kpi-icon ${tone}`}><Icon name={icon} /></div>
      <div>
        <div className="tch-kpi-value">
          {value}
          {total != null ? <small> / {total}</small> : null}
        </div>
        <div className="tch-kpi-label">{label}</div>
      </div>
    </button>
  );
}

function ConditionBadge({ value }) {
  const c = conditionInfo(value);
  return <span className={`eq-crit ${c.cls}`}>{c.label}</span>;
}

function activityTitle(ex) {
  return ex?.route?.name || ex?.manualTitle || "Actividad";
}

function quantityText(ex) {
  const qty = ex?.usedInputQuantity ?? ex?.usedQuantity;
  if (qty == null) return null;
  return `${fmtQty(qty)} ${ex?.usedInputUnit || ex?.route?.unit || ""}`.trim();
}

function ActivityRow({ ex, onOpen }) {
  const eq = ex.equipment || ex.route?.equipment || {};
  const qty = quantityText(ex);
  const delay = delayInfo(ex.delayDays);
  const cond = conditionInfo(ex.condition);
  return (
    <button type="button" className={`hst-row hst-act ${cond.cls}`} onClick={onOpen}>
      <div className="hst-when">
        <span className="hst-folio">#{ex.id}</span>
        <span className="hst-date">{fmtDateTime(ex.executedAt)}</span>
      </div>
      <div className="hst-main">
        <div className="hst-title">{activityTitle(ex)}</div>
        <div className="hst-meta">
          <span><Icon name="equipment" size="sm" /> {eq.name || "Sin equipo"}{eq.code ? ` · ${eq.code}` : ""}</span>
          <span className="hst-kind">{KIND_LABEL[ex.kind] || "Actividad"}</span>
        </div>
      </div>
      <div className="hst-cell">
        <span className="hst-cell-label">Técnico</span>
        <span className="hst-cell-value">{ex.technician?.name || "—"}</span>
      </div>
      <div className="hst-cell">
        <span className="hst-cell-label">Consumo</span>
        <span className="hst-cell-value">{qty || "—"}</span>
      </div>
      <div className="hst-badges">
        <ConditionBadge value={ex.condition} />
        {delay ? <span className={`hst-delay ${delay.cls}`}>{delay.label}</span> : null}
        {ex.evidenceImage ? (
          <span className="hst-ev" title="Con evidencia fotográfica"><Icon name="camera" size="sm" /></span>
        ) : null}
        {ex.observations ? (
          <span className="hst-ev" title="Con observaciones"><Icon name="doc" size="sm" /></span>
        ) : null}
      </div>
    </button>
  );
}

function MovementRow({ m, onOpenActivity }) {
  const k = moveInfo(m.type);
  const unit = m.lubricant?.unit || "";
  const ex = m.execution;
  return (
    <div className="hst-row hst-mv">
      <div className={`inv-move-icon ${k.cls}`} aria-hidden="true">{k.sign}</div>
      <div className="hst-main">
        <div className="hst-title">
          {m.lubricant?.name || "Lubricante"}
          {m.lubricant?.code ? <span className="hst-code"> · {m.lubricant.code}</span> : null}
        </div>
        <div className="hst-meta">
          <span className="hst-kind">{k.label}</span>
          <span>{reasonLabel(m.reason) || (ex ? "Consumo por actividad" : "Movimiento manual")}</span>
          {ex?.equipment?.name ? <span><Icon name="equipment" size="sm" /> {ex.equipment.name}</span> : null}
          {ex?.technician?.name ? <span><Icon name="user" size="sm" /> {ex.technician.name}</span> : null}
          {m.note ? <span className="hst-note">“{m.note}”</span> : null}
        </div>
      </div>
      <div className="hst-cell">
        <span className="hst-cell-label">Fecha</span>
        <span className="hst-cell-value">{fmtDateTime(m.createdAt)}</span>
      </div>
      <div className="hst-cell">
        <span className="hst-cell-label">Stock</span>
        <span className="hst-cell-value">
          {m.stockBefore != null && m.stockAfter != null ? `${fmtQty(m.stockBefore)} → ${fmtQty(m.stockAfter)}` : "—"}
        </span>
      </div>
      <div className="hst-badges">
        <span className={`hst-qty ${k.cls}`}>
          {k.sign === "±" ? "" : k.sign}
          {fmtQty(m.quantity)} {unit}
        </span>
        {ex?.id ? (
          <button type="button" className="tch-chip hst-link" onClick={() => onOpenActivity(ex.id)} title="Ver la actividad">
            Actividad #{ex.id}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OrderRow({ o, onOpen }) {
  const items = o._count?.items ?? o.items?.length ?? null;
  return (
    <button type="button" className="hst-row hst-act c-baja" onClick={onOpen}>
      <div className="hst-when">
        <span className="hst-folio">OLP #{o.id}</span>
        <span className="hst-date">{fmtDateTime(o.completedAt)}</span>
      </div>
      <div className="hst-main">
        <div className="hst-title">{o.title || `Orden #${o.id}`}</div>
        <div className="hst-meta">
          <span><Icon name="equipment" size="sm" /> {o.equipment?.name || "—"}{o.equipment?.code ? ` · ${o.equipment.code}` : ""}</span>
          {items != null ? <span className="hst-kind">{items} punto{items === 1 ? "" : "s"}</span> : null}
        </div>
      </div>
      <div className="hst-cell">
        <span className="hst-cell-label">Técnico</span>
        <span className="hst-cell-value">{o.assignedToUser?.name || "—"}</span>
      </div>
      <div className="hst-cell">
        <span className="hst-cell-label">Programada</span>
        <span className="hst-cell-value">{fmtDateTime(o.scheduledDate, false)}</span>
      </div>
      <div className="hst-badges">
        <span className="eq-crit c-baja">Completada</span>
        <Icon name="chevronRight" size="sm" />
      </div>
    </button>
  );
}

function Pager({ meta, page, pageSize, loading, onPage, onPageSize }) {
  const pages = Math.max(1, meta.pages || 1);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(meta.total, page * pageSize);
  return (
    <div className="hst-pager">
      <span className="hst-pager-info">
        {start}–{end} de {meta.total}
      </span>
      <select className="eq-select" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} aria-label="Registros por página">
        {[25, 50, 100].map((n) => (
          <option key={n} value={n}>{n} por página</option>
        ))}
      </select>
      <div className="hst-pager-nav">
        <button type="button" className="tch-icon-btn" disabled={loading || page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior">
          <Icon name="chevronLeft" size="sm" />
        </button>
        <span>
          {page} / {pages}
        </span>
        <button type="button" className="tch-icon-btn" disabled={loading || page >= pages} onClick={() => onPage(page + 1)} aria-label="Página siguiente">
          <Icon name="chevronRight" size="sm" />
        </button>
      </div>
    </div>
  );
}

function ActivityDrawer({ ex, onClose, plantName }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const route = ex.route || null;
  const eq = ex.equipment || route?.equipment || {};
  const move = Array.isArray(ex.lubricantMovements) ? ex.lubricantMovements[0] || null : null;
  const lub = route?.lubricant || move?.lubricant || null;
  const delay = delayInfo(ex.delayDays);
  const evidence = imgUrl(ex.evidenceImage);
  const reference = imgUrl(route?.imageUrl);
  const qty = quantityText(ex);
  // Lo realmente descontado es el movimiento de inventario (en la unidad del lubricante).
  const deducted = move
    ? `${fmtQty(move.quantity)} ${move.lubricant?.unit || ""}`
    : ex.usedConvertedQuantity != null
    ? `${fmtQty(ex.usedConvertedQuantity)} ${ex.usedConvertedUnit || ""}`
    : null;
  const instructions = route?.instructions || ex.manualInstructions;

  return (
    <div className="inv-drawer-overlay tch-overlay hst-print-root" style={{ display: "flex", placeItems: "initial", padding: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="inv-drawer hst-drawer" role="dialog" aria-modal="true" aria-labelledby="hst-drawer-title">
        <div className="inv-drawer-head">
          <div style={{ minWidth: 0 }}>
            <div className="tch-kicker">
              Registro de actividad · Folio #{ex.id}
              {plantName ? ` · ${plantName}` : ""}
            </div>
            <h2 id="hst-drawer-title" className="tch-modal-title" style={{ wordBreak: "break-word" }}>{activityTitle(ex)}</h2>
            <div className="hst-drawer-badges">
              <ConditionBadge value={ex.condition} />
              <span className="hst-kind">{KIND_LABEL[ex.kind] || "Actividad"}</span>
              {delay ? <span className={`hst-delay ${delay.cls}`}>{delay.label}</span> : null}
            </div>
          </div>
          <div className="hst-drawer-actions">
            <button type="button" className="tch-icon-btn" onClick={() => window.print()} aria-label="Imprimir registro" title="Imprimir registro">
              <Icon name="doc" size="sm" />
            </button>
            <button type="button" className="tch-icon-btn" onClick={onClose} aria-label="Cerrar">
              <Icon name="close" size="sm" />
            </button>
          </div>
        </div>

        <div className="inv-drawer-body">
          <section className="hst-sec">
            <h3>Ejecución</h3>
            <dl className="eq-dl">
              <dt>Ejecutada</dt>
              <dd>{fmtDateTime(ex.executedAt)}</dd>
              <dt>Programada</dt>
              <dd>{fmtDateTime(ex.scheduledAt, false)}</dd>
              <dt>Técnico</dt>
              <dd>{ex.technician?.name ? `${ex.technician.name}${ex.technician.code ? ` · ${ex.technician.code}` : ""}` : "—"}</dd>
            </dl>
          </section>

          <section className="hst-sec">
            <h3>Equipo</h3>
            <dl className="eq-dl">
              <dt>Equipo</dt>
              <dd>{eq.name || "—"}</dd>
              <dt>Código</dt>
              <dd>{eq.code || "—"}</dd>
              <dt>Área</dt>
              <dd>{eq.area?.name || "—"}</dd>
              <dt>Ubicación</dt>
              <dd>{eq.location || "—"}</dd>
            </dl>
          </section>

          <section className="hst-sec">
            <h3>Consumo de lubricante</h3>
            <dl className="eq-dl">
              <dt>Lubricante</dt>
              <dd>{lub ? `${lub.name}${lub.code ? ` · ${lub.code}` : ""}` : route?.lubricantName || route?.lubricantType || "—"}</dd>
              <dt>Cantidad registrada</dt>
              <dd>{qty ? `${qty}${route?.points > 1 ? ` por punto × ${route.points} puntos` : ""}` : "—"}</dd>
              <dt>Descontado del inventario</dt>
              <dd>{deducted || "—"}</dd>
              {move?.stockBefore != null && move?.stockAfter != null ? (
                <>
                  <dt>Stock</dt>
                  <dd>
                    {fmtQty(move.stockBefore)} → {fmtQty(move.stockAfter)} {move.lubricant?.unit || ""}
                  </dd>
                </>
              ) : null}
              {route?.method ? (
                <>
                  <dt>Método</dt>
                  <dd>{route.method}</dd>
                </>
              ) : null}
            </dl>
          </section>

          <section className="hst-sec">
            <h3>Observaciones del técnico</h3>
            <p className={`hst-text${ex.observations ? "" : " is-empty"}`}>{ex.observations || "Sin observaciones."}</p>
          </section>

          {instructions ? (
            <section className="hst-sec">
              <h3>Instrucciones</h3>
              <p className="hst-text">{instructions}</p>
            </section>
          ) : null}

          <section className="hst-sec">
            <h3>Evidencia fotográfica</h3>
            {evidence ? (
              <a href={evidence} target="_blank" rel="noreferrer" className="hst-photo" title="Abrir en tamaño completo">
                <img src={evidence} alt="Evidencia de la actividad" onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }} />
              </a>
            ) : (
              <p className="hst-text is-empty">Sin evidencia cargada.</p>
            )}
            {ex.evidenceNote ? <p className="hst-text">{ex.evidenceNote}</p> : null}
          </section>

          {reference ? (
            <section className="hst-sec hst-noprint">
              <h3>Referencia del punto</h3>
              <img className="hst-ref" src={reference} alt="Referencia del punto de lubricación" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
