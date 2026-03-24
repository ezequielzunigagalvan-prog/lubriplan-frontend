// src/pages/HistoryPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import {
  getHistoryExecutions,
  getHistoryLubricantMovements,
  getExecutionById,
} from "../services/historyService";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import { usePlant } from "../context/PlantContext";

import { API_ASSETS_URL } from "../services/api";

/* =========================
   HELPERS
========================= */

const toYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfMonthLocal = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonthLocal = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

const safeDateLabel = (iso) => {
  try {
    if (!iso) return "—";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString();
  } catch {
    return "—";
  }
};

const safeDateTimeLabel = (iso) => {
  try {
    if (!iso) return "—";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleString();
  } catch {
    return "—";
  }
};

const buildImgUrl = (raw) => {
  if (!raw) return "";
  const s = String(raw);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_ASSETS_URL}${s}`;
  return s;
};

const up = (v) => String(v || "").toUpperCase();

const conditionChip = (conditionRaw) => {
  const c = up(conditionRaw);
  if (c === "BUENO") return { bg: "#dcfce7", bd: "#bbf7d0", fg: "#166534", label: "Bueno", icon: "check" };
  if (c === "REGULAR") return { bg: "#e0e7ff", bd: "#c7d2fe", fg: "#3730a3", label: "Regular", icon: "dot" };
  if (c === "MALO") return { bg: "#fef3c7", bd: "#fde68a", fg: "#92400e", label: "Malo", icon: "warn" };
  if (c === "CRITICO" || c === "CRÍTICO")
    return { bg: "#fee2e2", bd: "#fecaca", fg: "#991b1b", label: "Crítico", icon: "alert" };
  return { bg: "#f1f5f9", bd: "#e2e8f0", fg: "#0f172a", label: conditionRaw || "—", icon: "dot" };
};

const normMoveType = (raw) => {
  const t = String(raw || "").trim().toUpperCase();
  if (t === "ENTRADA") return "IN";
  if (t === "SALIDA") return "OUT";
  if (t === "AJUSTE") return "ADJUST";
  return t;
};

const moveBadge = (t) => {
  const type = normMoveType(t);
  const map = {
    IN: { bg: "#dcfce7", bd: "#bbf7d0", fg: "#166534", label: "Entrada", icon: "arrowUp" },
    OUT: { bg: "#fee2e2", bd: "#fecaca", fg: "#991b1b", label: "Salida", icon: "arrowDown" },
    ADJUST: { bg: "#e0e7ff", bd: "#c7d2fe", fg: "#3730a3", label: "Ajuste", icon: "settings" },
  };
  return map[type] || { bg: "#f1f5f9", bd: "#e2e8f0", fg: "#0f172a", label: type || "—", icon: "dot" };
};

const monthToFromTo = (monthStr) => {
  if (!/^\d{4}-\d{2}$/.test(monthStr)) return null;
  const [y, m] = monthStr.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;

  const fromD = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const toD = new Date(y, m, 0, 23, 59, 59, 999);
  return { from: toYMD(fromD), to: toYMD(toD) };
};

function MiniIconBox({ name }) {
  return (
    <span style={kpiIconBox}>
      <Icon name={name} />
    </span>
  );
}

/* =========================
   PAGE
========================= */

export default function HistoryPage() {
  const reqIdRef = useRef(0);
  const mvReqIdRef = useRef(0);
  const { currentPlantId, loadingPlants } = usePlant();

  const location = useLocation();
  const navigate = useNavigate();

  // AUTH / PERMISSIONS
  const { user } = useAuth();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const isTech = role === "TECHNICIAN";
  const myTechId = user?.technicianId != null ? Number(user.technicianId) : null;

  // query params (deep links)
  const qs = useMemo(() => new URLSearchParams(location.search || ""), [location.search]);
  const month = String(qs.get("month") || "");
  const urlFilter = String(qs.get("filter") || "");
  const isBadCondition = urlFilter === "bad-condition";

  // filtros actividades
  const now = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(toYMD(startOfMonthLocal(now)));
  const [to, setTo] = useState(toYMD(endOfMonthLocal(now)));
  const [condition, setCondition] = useState("ALL"); // ALL | BUENO | REGULAR | MALO | CRITICO
  const [q, setQ] = useState("");

  // paginación actividades
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // data actividades
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);

  // drawer detalle ejecución
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState("");
  const [detail, setDetail] = useState(null);

  // movimientos
  const [mvLoading, setMvLoading] = useState(false);
  const [mvErr, setMvErr] = useState("");
  const [mvItems, setMvItems] = useState([]);
  const [mvMeta, setMvMeta] = useState(null);
  const [mvType, setMvType] = useState("ALL");
  const [mvPage, setMvPage] = useState(1);
  const [mvPageSize, setMvPageSize] = useState(10);
  const [mvLubQ, setMvLubQ] = useState(""); // filtro por nombre/código (client-side)

  /* =========================
     LOADERS
  ========================= */

  const load = useCallback(
    async (opts = {}) => {
      const reqId = ++reqIdRef.current;
      try {
        setErr("");
        setLoading(true);

        const useClientScopedPage = isTech || isBadCondition;
        const params = {
          from,
          to,
          q: q.trim() || "",
          page: useClientScopedPage ? 1 : opts.page ?? page,
          pageSize: useClientScopedPage ? Math.max(pageSize, 200) : pageSize,
          condition: condition === "ALL" ? "" : condition,
        };

        const resp = await getHistoryExecutions(params);
        if (reqId !== reqIdRef.current) return;

        const raw = Array.isArray(resp?.items) ? resp.items : [];

        // Scope técnico: solo lo suyo
        const scopedRaw = isTech
          ? raw.filter((x) => {
              const techId = x?.technicianId ?? x?.technician?.id ?? null;
              if (!Number.isFinite(myTechId)) return false;
              return Number(techId) === Number(myTechId);
            })
          : raw;

        // deep link bad condition
        const filtered = isBadCondition
          ? scopedRaw.filter((x) => ["MALO", "CRITICO", "CRÍTICO"].includes(up(x?.condition)))
          : scopedRaw;

        setItems(filtered);
        if (useClientScopedPage) {
          setMeta({ page: 1, pages: 1, total: filtered.length, pageSize: filtered.length || params.pageSize });
          setPage(1);
        } else {
          setMeta(resp?.meta || null);
          setPage(resp?.meta?.page ?? params.page);
        }
      } catch (e) {
        if (reqId !== reqIdRef.current) return;
        console.error(e);
        setErr(e?.message || "Error cargando historial");
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    },
    [from, to, q, page, pageSize, condition, isBadCondition, isTech, myTechId]
  );

  const loadMovements = useCallback(
    async (opts = {}) => {
      const rid = ++mvReqIdRef.current;
      try {
        setMvErr("");
        setMvLoading(true);

        const useClientScopedPage = isTech;
        const params = {
          from,
          to,
          q: q.trim() || "",
          type: mvType === "ALL" ? "" : mvType,
          page: useClientScopedPage ? 1 : opts.page ?? mvPage,
          pageSize: useClientScopedPage ? Math.max(mvPageSize, 200) : mvPageSize,
        };

        const resp = await getHistoryLubricantMovements(params);
        const all = Array.isArray(resp?.items) ? resp.items : [];

        // Scope técnico: ocultar manuales; solo movimientos ligados a sus ejecuciones
        const scoped = isTech
          ? all.filter((m) => {
              const ex = m?.execution;
              if (!ex?.id) return false;
              const techId = ex?.technicianId ?? ex?.technician?.id ?? null;
              if (!Number.isFinite(myTechId)) return false;
              return Number(techId) === Number(myTechId);
            })
          : all;

        if (rid !== mvReqIdRef.current) return;

        setMvItems(scoped);
        if (useClientScopedPage) {
          setMvMeta({ page: 1, pages: 1, total: scoped.length, pageSize: scoped.length || params.pageSize });
          setMvPage(1);
        } else {
          setMvMeta(resp?.meta || null);
          setMvPage(resp?.meta?.page ?? params.page);
        }
      } catch (e) {
        if (rid !== mvReqIdRef.current) return;
        console.error(e);
        setMvErr(e?.message || "Error cargando movimientos de lubricantes");
      } finally {
        if (rid === mvReqIdRef.current) setMvLoading(false);
      }
    },
    [from, to, q, mvType, mvPage, mvPageSize, isTech, myTechId]
  );

  // carga inicial
  useEffect(() => {
  if (loadingPlants) return;
  if (!currentPlantId) return;

  load({ page: 1 });
  loadMovements({ page: 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentPlantId, loadingPlants]);

  // filtros actividades
  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, condition, pageSize]);

  // filtros movimientos
  useEffect(() => {
    loadMovements({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, mvType, mvPageSize]);

  // deep links
  useEffect(() => {
    const r = monthToFromTo(month);
    if (r) {
      setFrom(r.from);
      setTo(r.to);
    }
    if (isBadCondition) setCondition("ALL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, isBadCondition]);

  /* =========================
     KPI COUNTS
  ========================= */

  const scopedTotals = useMemo(() => {
    const t = { total: items.length, CRITICO: 0, MALO: 0, BUENO: 0 };
    for (const it of items) {
      const c = up(it?.condition);
      if (c === "CRITICO" || c === "CRÍTICO") t.CRITICO += 1;
      else if (c === "MALO") t.MALO += 1;
      else if (c === "BUENO") t.BUENO += 1;
    }
    return t;
  }, [items]);

  /* =========================
     DRAWER
  ========================= */

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedId(null);
    setDetail(null);
    setDetailErr("");
    setDetailLoading(false);
  };

  const openDetail = async (ex) => {
    const id = ex?.id;
    if (!id) return;

    setSelectedId(id);
    setDetailOpen(true);
    setDetailErr("");
    setDetailLoading(true);
    setDetail(ex || null);

    try {
      const needsFetch =
        !ex?.route || !ex?.technician || ex?.evidenceImage == null || ex?.usedQuantity == null;

      if (needsFetch) {
        const full = await getExecutionById(id);
        setDetail(full);
      }
    } catch (e) {
      console.error(e);
      setDetailErr(e?.message || "Error cargando detalle");
    } finally {
      setDetailLoading(false);
    }
  };

  /* =========================
     MOVEMENTS FILTER (client-side)
  ========================= */

  const mvFilteredItems = useMemo(() => {
    const s = mvLubQ.trim().toLowerCase();
    if (!s) return mvItems;

    return mvItems.filter((m) => {
      const lub = m?.lubricant || {};
      const name = String(lub?.name || "").toLowerCase();
      const code = String(lub?.code || "").toLowerCase();
      return name.includes(s) || code.includes(s);
    });
  }, [mvItems, mvLubQ]);

  return (
    <MainLayout>
      <style>{`
        .lpCard {
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .lpCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(2,6,23,0.08);
        }
        .lpPress:active {
          transform: translateY(0px) scale(0.99);
        }
      `}</style>

      {/* HEADER */}
      <div style={headerRow}>
        <div>
          <h1 style={{ margin: 0 }}>Historial</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontWeight: 800 }}>
            Registro de actividades completadas y movimientos de lubricantes
          </p>
        </div>

        <button
          className="lpPress"
          onClick={() => {
            load({ page });
            loadMovements({ page: mvPage });
          }}
          style={btnGhost}
          disabled={loading || mvLoading}
          title="Actualizar"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="reset" />
            {loading || mvLoading ? "Actualizando…" : "Actualizar"}
          </span>
        </button>
      </div>

      {err && <div style={errorBox}>{err}</div>}

      {/* BANNER BAD CONDITION */}
      {isBadCondition ? (
        <div style={warnBanner}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 980, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={miniOrange}>
                <Icon name="warn" />
              </span>
              Condición mala/crítica (Historial)
            </div>

            <div style={warnBannerText}>
              Son ejecuciones <b>COMPLETADAS</b> donde el técnico reportó condición <b>MALO</b> o <b>CRÍTICO</b>. Revisa
              observación y evidencia y genera acción correctiva.
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const p = new URLSearchParams(location.search || "");
              p.delete("filter");
              navigate(`/history?${p.toString()}`);
            }}
            style={btnWarnGhost}
            className="lpPress"
          >
            Quitar filtro
          </button>
        </div>
      ) : null}

      {/* KPIs */}
      <div style={statsGrid}>
        <KpiCard title="Equipos" value={scopedTotals.total} icon="list" />
        <KpiCard title="Críticos" value={scopedTotals.CRITICO} icon="warn" />
        <KpiCard title="Malos" value={scopedTotals.MALO} icon="alert" />
        <KpiCard title="Buenos" value={scopedTotals.BUENO} icon="check" />
      </div>

      {/* FILTROS EJECUCIONES */}
      <div className="lpCard" style={filtersWrap}>
        <div style={filtersHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={hdrIcon}>
              <Icon name="filter" />
            </span>
            <div style={{ fontWeight: 980, color: "#0f172a" }}>Filtros (Actividades)</div>
          </div>

          <div style={{ color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            {meta ? `Página ${meta.page} de ${meta.pages} • ${meta.total} registros` : ""}
          </div>
        </div>

        <div style={filtersRow}>
          <div style={field}>
            <label style={label}>Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={input} />
          </div>

          <div style={field}>
            <label style={label}>Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={input} />
          </div>

          <div style={field}>
            <label style={label}>Condición</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} style={input}>
              <option value="ALL">Todas</option>
              <option value="BUENO">Bueno</option>
              <option value="REGULAR">Regular</option>
              <option value="MALO">Malo</option>
              <option value="CRITICO">Crítico</option>
            </select>
          </div>

          <div style={{ ...field, flex: 1, minWidth: 260 }}>
            <label style={label}>Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Equipo, ruta, lubricante o técnico…"
              style={input}
            />
          </div>

          {/* ✅ Buscar en gris ghost */}
        <button
  className="lpPress"
  onClick={() => {
    load({ page: 1 });
    loadMovements({ page: 1 });
  }}
  style={btnKpiGray}
  disabled={loading || mvLoading}
  title="Buscar"
>
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <Icon name="search" />
    Buscar
  </span>
</button>
        </div>

        <div style={{ ...filtersRow, marginTop: 10 }}>
          <div style={field}>
            <label style={label}>Por página</label>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={input}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ marginLeft: "auto", color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            {meta ? `Mostrando ${items.length} en el filtro actual` : ""}
          </div>
        </div>
      </div>

      {/* LISTADO EJECUCIONES */}
      {loading && <p style={{ marginTop: 14, color: "#64748b", fontWeight: 850 }}>Cargando historial…</p>}
      {!loading && items.length === 0 && (
        <p style={{ marginTop: 14, color: "#64748b", fontWeight: 850 }}>No hay registros en este rango.</p>
      )}

      <div style={list}>
        {items.map((ex) => (
          <HistoryCard key={ex.id} ex={ex} onOpen={() => openDetail(ex)} />
        ))}
      </div>

      {/* PAGINACIÓN EJECUCIONES */}
      {meta && meta.pages > 1 && (
        <div style={pager}>
          <button
            style={pagerBtn}
            className="lpPress"
            disabled={loading || meta.page <= 1}
            onClick={() => load({ page: meta.page - 1 })}
          >
            ← Anterior
          </button>

          <div style={{ fontWeight: 950, color: "#0f172a" }}>
            {meta.page} / {meta.pages}
          </div>

          <button
            style={pagerBtn}
            className="lpPress"
            disabled={loading || meta.page >= meta.pages}
            onClick={() => load({ page: meta.page + 1 })}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* MOVIMIENTOS */}
      <div className="lpCard" style={{ ...panel, marginTop: 18 }}>
        <div style={panelHeaderRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={hdrIcon}>
              <Icon name="drop" />
            </span>
            <div style={panelTitle}>Movimientos de lubricantes</div>
            <Tag tone="gray">Inventario</Tag>
          </div>

          <div style={{ color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            {mvMeta ? `Página ${mvMeta.page} de ${mvMeta.pages} • ${mvMeta.total} movimientos` : ""}
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={field}>
            <label style={label}>Tipo</label>
            <select value={mvType} onChange={(e) => setMvType(e.target.value)} style={input}>
              <option value="ALL">Todos</option>
              <option value="IN">Entrada</option>
              <option value="OUT">Salida</option>
              <option value="ADJUST">Ajuste</option>
            </select>
          </div>

          <div style={field}>
            <label style={label}>Por página</label>
            <select value={mvPageSize} onChange={(e) => setMvPageSize(Number(e.target.value))} style={input}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div style={{ ...field, flex: 1, minWidth: 260 }}>
            <label style={label}>Lubricante</label>
            <input
              value={mvLubQ}
              onChange={(e) => setMvLubQ(e.target.value)}
              placeholder="Filtra por nombre o código…"
              style={input}
            />
          </div>

          <button
            className="lpPress"
            onClick={() => loadMovements({ page: mvPage })}
            style={btnGhost}
            disabled={mvLoading}
            title="Actualizar movimientos"
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="reset" />
              {mvLoading ? "Actualizando…" : "Actualizar"}
            </span>
          </button>
        </div>

        {mvErr && <div style={errorBox}>{mvErr}</div>}

        {mvLoading && <p style={{ marginTop: 14, color: "#64748b", fontWeight: 850 }}>Cargando movimientos…</p>}
        {!mvLoading && mvFilteredItems.length === 0 && (
          <p style={{ marginTop: 14, color: "#64748b", fontWeight: 850 }}>
            No hay movimientos en este rango / filtro.
          </p>
        )}

        <div style={{ ...list, marginTop: 14 }}>
          {mvFilteredItems.map((m) => (
            <MovementCard key={m.id} m={m} />
          ))}
        </div>

        {mvMeta && mvMeta.pages > 1 && (
          <div style={pager}>
            <button
              style={pagerBtn}
              className="lpPress"
              disabled={mvLoading || mvMeta.page <= 1}
              onClick={() => loadMovements({ page: mvMeta.page - 1 })}
            >
              ← Anterior
            </button>

            <div style={{ fontWeight: 950, color: "#0f172a" }}>
              {mvMeta.page} / {mvMeta.pages}
            </div>

            <button
              style={pagerBtn}
              className="lpPress"
              disabled={mvLoading || mvMeta.page >= mvMeta.pages}
              onClick={() => loadMovements({ page: mvMeta.page + 1 })}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* DRAWER */}
      <HistoryDrawer
        open={detailOpen}
        loading={detailLoading}
        error={detailErr}
        ex={detail}
        onClose={closeDetail}
      />
    </MainLayout>
  );
}

/* =========================
   UI COMPONENTS
========================= */

function KpiCard({ title, value, icon }) {
  return (
    <div className="lpCard" style={kpiCard}>
      <div style={kpiTopBandDarkThin} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
        <MiniIconBox name={icon} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950, color: "#0f172a" }}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 980, color: "#0f172a", marginTop: 6 }}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function Tag({ children, tone = "gray" }) {
  const bg =
    tone === "blue"
      ? "rgba(219,234,254,0.95)"
      : tone === "green"
      ? "rgba(220,252,231,0.92)"
      : tone === "amber"
      ? "rgba(254,243,199,0.92)"
      : tone === "red"
      ? "rgba(254,226,226,0.92)"
      : "rgba(241,245,249,0.92)";

  const fg =
    tone === "blue"
      ? "#1d4ed8"
      : tone === "green"
      ? "#166534"
      : tone === "amber"
      ? "#92400e"
      : tone === "red"
      ? "#991b1b"
      : "#334155";

  return <span style={{ ...tagBase, background: bg, color: fg }}>{children}</span>;
}

function ConditionChip({ value }) {
  const c = conditionChip(value);
  return (
    <span
      style={{
        ...chipBase,
        background: c.bg,
        borderColor: c.bd,
        color: c.fg,
      }}
      title={c.label}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Icon name={c.icon} />
        {c.label}
      </span>
    </span>
  );
}

function HistoryCard({ ex, onOpen }) {
  const route = ex?.route || {};
  const eq = route?.equipment || ex?.equipment || {};
  const tech = ex?.technician || {};
  const dateLabel = safeDateLabel(ex?.executedAt);
  const activityName = ex?.manualTitle || route?.name || "�";

  return (
    <div className="lpCard lpPress" style={{ ...card, cursor: "pointer" }} onClick={onOpen} title="Ver detalle">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 14, letterSpacing: 0.2 }}>{activityName}</strong>
            <ConditionChip value={ex?.condition} />
            {ex?.evidenceImage ? (
              <span style={{ ...chipBase, background: "#ecfccb", borderColor: "#d9f99d", color: "#365314" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="camera" />
                  Evidencia
                </span>
              </span>
            ) : null}
          </div>

          <div style={metaRow}>
            <span style={metaItem}>
              <Icon name="pin" /> {eq?.name || "—"}
              {eq?.code ? ` · ${eq.code}` : eq?.tag ? ` · ${eq.tag}` : ""}
            </span>

            <span style={metaItem}>
              <Icon name="calendar" /> {dateLabel}
            </span>

            {tech?.name ? (
              <span style={metaItem}>
                <Icon name="user" /> {tech.name}
              </span>
            ) : null}
          </div>

          {ex?.observations ? (
            <div style={{ ...notes, marginTop: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="doc" />
                <b>Observación:</b> {ex.observations}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MovementCard({ m }) {
  const b = moveBadge(m?.type);
  const lub = m?.lubricant || {};
  const ex = m?.execution || null;

  const route = ex?.route || {};
  const eq = route?.equipment || ex?.equipment || {};
  const tech = ex?.technician || {};

  const qty = m?.quantity != null ? Number(m.quantity) : null;
  const qtyLabel = qty == null || !Number.isFinite(qty) ? "???" : qty % 1 === 0 ? String(qty) : qty.toFixed(2);
  const capturedQty = m?.inputQuantity != null ? Number(m.inputQuantity) : null;
  const capturedQtyLabel = capturedQty == null || !Number.isFinite(capturedQty) ? "???" : capturedQty % 1 === 0 ? String(capturedQty) : capturedQty.toFixed(2);

  const unit = lub?.unit || "???";
  const capturedUnit = m?.inputUnit || "???";
  const lubLabel = lub?.name ? `${lub.name}${lub.code ? ` (${lub.code})` : ""}` : "???";

  return (
    <div className="lpCard" style={{ ...card, gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 160 }}>
        <span
          style={{
            ...chipBase,
            background: b.bg,
            borderColor: b.bd,
            color: b.fg,
            width: "fit-content",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name={b.icon} />
            {b.label}
          </span>
        </span>

        <div style={{ color: "#64748b", fontWeight: 850, fontSize: 12, display: "inline-flex", gap: 8, alignItems: "center" }}>
          <Icon name="calendar" />
          {safeDateTimeLabel(m?.createdAt)}
        </div>

        <div style={{ fontWeight: 980, color: "#0f172a" }}>
          {qtyLabel} {unit}
        </div>

        {m?.inputQuantity != null ? (
          <div style={{ color: "#64748b", fontWeight: 850, fontSize: 12 }}>
            Captura: {capturedQtyLabel} {capturedUnit}
          </div>
        ) : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 980, color: "#0f172a" }}>{lubLabel}</div>

        <div style={{ ...metaRow, marginTop: 8 }}>
          {m?.reason ? (
            <span style={metaItem}>
              <Icon name="doc" /> {m.reason}
            </span>
          ) : null}

          {ex?.id ? (
            <span style={metaItem}>
              <Icon name="link" /> Ejecuci??n #{ex.id}
            </span>
          ) : (
            <span style={metaItem}>
              <Icon name="dot" /> Movimiento manual
            </span>
          )}
        </div>

        {ex?.id ? (
          <div style={{ ...metaRow, marginTop: 8 }}>
            {route?.name || ex?.manualTitle ? (
              <span style={metaItem}>
                <Icon name="route" /> {route?.name || ex?.manualTitle}
              </span>
            ) : null}

            {eq?.name ? (
              <span style={metaItem}>
                <Icon name="pin" /> {eq.name}
              </span>
            ) : null}

            {tech?.name ? (
              <span style={metaItem}>
                <Icon name="user" /> {tech.name}
              </span>
            ) : null}
          </div>
        ) : null}

        {m?.note ? (
          <div style={{ ...notes, marginTop: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="doc" />
              {m.note}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* =========================
   DRAWER
========================= */

function HistoryDrawer({ open, loading, error, ex, onClose }) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const route = ex?.route || {};
  const eq = route?.equipment || ex?.equipment || {};
  const latestMove = Array.isArray(ex?.lubricantMovements) ? ex.lubricantMovements[0] || null : null;
  const lub = route?.lubricant || latestMove?.lubricant || {};
  const tech = ex?.technician || {};
  const executedAt = safeDateLabel(ex?.executedAt);
  const evidenceUrl = buildImgUrl(ex?.evidenceImage);
  const activityName = ex?.manualTitle || route?.name || "???";

  return (
    <>
      <div style={drawerOverlay} onClick={onClose} />
      <div style={drawerPanel} role="dialog" aria-modal="true">
        <div style={drawerHeader}>
          <div>
            <div style={{ fontWeight: 980, fontSize: 16, color: "#0f172a" }}>Detalle de actividad</div>
            <div style={{ marginTop: 4, color: "#64748b", fontWeight: 850, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="calendar" /> Ejecutada: {executedAt}
            </div>
          </div>

          <button style={drawerCloseBtn} className="lpPress" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {loading && <div style={{ padding: 14, color: "#64748b", fontWeight: 900 }}>Cargando detalle…</div>}
        {error && <div style={{ ...errorBox, margin: 14 }}>{error}</div>}

        {!loading && !error && (
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={sectionCard}>
              <div style={sectionTitle}>Información</div>
              <div style={kvGrid}>
                <KV label="Condición" value={<ConditionChip value={ex?.condition} />} />
                <KV label="Técnico" value={tech?.name || "???"} />
                <KV label="Equipo" value={eq?.name || "???"} />
                <KV label="Actividad" value={activityName} />
              </div>
            </div>

            <div style={sectionCard}>
              <div style={sectionTitle}>Consumo</div>
              <div style={kvGrid}>
                <KV
                  label="Cantidad capturada"
                  value={
                    ex?.usedInputQuantity != null
                      ? `${ex.usedInputQuantity}${ex?.usedInputUnit ? ` ${ex.usedInputUnit}` : ""}`
                      : ex?.usedQuantity != null
                      ? `${ex.usedQuantity}${ex?.usedInputUnit ? ` ${ex.usedInputUnit}` : route?.unit ? ` ${route.unit}` : ""}`
                      : "???"
                  }
                />
                <KV
                  label="Descuento inventario"
                  value={
                    ex?.usedConvertedQuantity != null
                      ? `${ex.usedConvertedQuantity}${ex?.usedConvertedUnit ? ` ${ex.usedConvertedUnit}` : ""}`
                      : "???"
                  }
                />
                <KV label="Lubricante" value={lub?.name || route?.lubricantType || "???"} />
                <KV label="Unidad inventario" value={ex?.usedConvertedUnit || lub?.unit || "???"} />
              </div>

              {route?.instructions || ex?.manualInstructions ? (
                <div style={{ marginTop: 10, ...noteBox }}>
                  <div style={{ fontWeight: 950, marginBottom: 6 }}>Instrucciones</div>
                  <div style={{ fontWeight: 850, color: "#0f172a", whiteSpace: "pre-wrap" }}>
                    {route?.instructions || ex?.manualInstructions}
                  </div>
                </div>
              ) : null}
            </div>

            <div style={sectionCard}>
              <div style={sectionTitle}>Observaciones</div>
              <div style={{ ...noteBox, marginTop: 8 }}>
                <div style={{ fontWeight: 850, color: "#0f172a", whiteSpace: "pre-wrap" }}>
                  {ex?.observations || "—"}
                </div>
              </div>
            </div>

            <div style={sectionCard}>
              <div style={sectionTitle}>Evidencia</div>
              {!evidenceUrl ? (
                <div style={{ ...noteBox, marginTop: 8, color: "#64748b", fontWeight: 900 }}>
                  No hay evidencia cargada.
                </div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={evidenceUrl}
                    alt="Evidencia"
                    style={evidenceImg}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {ex?.evidenceNote ? (
                    <div style={{ ...noteBox, marginTop: 10 }}>
                      <div style={{ fontWeight: 950, marginBottom: 6 }}>Nota</div>
                      <div style={{ fontWeight: 850, color: "#0f172a", whiteSpace: "pre-wrap" }}>
                        {ex.evidenceNote}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function KV({ label, value }) {
  return (
    <div style={kvItem}>
      <div style={kvLabel}>{label}</div>
      <div style={kvValue}>{value}</div>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  padding: "14px 16px",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 55%, rgba(239,246,255,0.78) 100%)",
  boxShadow: "0 18px 36px rgba(2,6,23,0.06)",
};

const statsGrid = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const kpiCard = {
  position: "relative",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.97)",
  border: "1px solid rgba(148,163,184,0.45)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const kpiTopBandDarkThin = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 6, // ✅ más delgada (como Equipos)
  background: "#334155",
  borderTopLeftRadius: 14,
  borderTopRightRadius: 14,
};

const kpiIconBox = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "#f97316", // ✅ naranja
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#0f172a", // ✅ icono negro
  border: "1px solid rgba(2,6,23,0.10)",
  boxShadow: "0 10px 20px rgba(249,115,22,0.18)",
};

const filtersWrap = {
  marginTop: 18,
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.86) 100%)",
  boxShadow: "0 16px 30px rgba(2,6,23,0.05)",
  backdropFilter: "blur(8px)",
};

const filtersHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 10,
};

const filtersRow = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const field = { display: "flex", flexDirection: "column", gap: 6, minWidth: 160 };
const label = { fontSize: 12, color: "#64748b", fontWeight: 900 };

const input = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  outline: "none",
};

const btnGhost = {
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(241,245,249,0.92)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const warnBanner = {
  marginTop: 12,
  padding: "12px 14px",
  borderRadius: 14,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
  fontWeight: 900,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const warnBannerText = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 850,
  color: "#7c2d12",
  lineHeight: 1.35,
};

const btnWarnGhost = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #fed7aa",
  background: "rgba(255,255,255,0.85)",
  cursor: "pointer",
  fontWeight: 950,
  color: "#9a3412",
  whiteSpace: "nowrap",
};

const miniOrange = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 10,
  background: "rgba(249,115,22,0.20)",
  color: "#0f172a",
  border: "1px solid rgba(249,115,22,0.35)",
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginTop: 14,
};

const card = {
  padding: 14,
  borderRadius: 18,
  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 100%)",
  border: "1px solid rgba(148,163,184,0.45)",
  boxShadow: "0 14px 30px rgba(2,6,23,0.07)",
  transition: "all 160ms ease",
};

const metaRow = {
  fontSize: 13,
  color: "#64748b",
  display: "flex",
  gap: 14,
  marginTop: 8,
  flexWrap: "wrap",
  fontWeight: 800,
};

const metaItem = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const notes = {
  fontSize: 13,
  fontWeight: 850,
  color: "#0f172a",
  background: "rgba(241,245,249,0.7)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
};

const pager = {
  marginTop: 16,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 12,
};

const pagerBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const errorBox = {
  marginTop: 12,
  background: "rgba(254,226,226,0.92)",
  border: "1px solid rgba(254,202,202,0.95)",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 900,
};

const panel = {
  border: "1px solid rgba(148,163,184,0.35)",
  borderRadius: 18,
  padding: 14,
  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 100%)",
  boxShadow: "0 16px 30px rgba(2,6,23,0.05)",
};

const panelHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const panelTitle = { fontWeight: 980, color: "#0f172a" };

const hdrIcon = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 12,
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#0f172a",
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

const chipBase = {
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

/* ===== Drawer styles ===== */

const drawerOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.35)",
  backdropFilter: "blur(2px)",
  zIndex: 50,
};

const drawerPanel = {
  position: "fixed",
  top: 0,
  right: 0,
  height: "100vh",
  width: "min(520px, 92vw)",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  borderLeft: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "-18px 0 44px rgba(2,6,23,0.18)",
  zIndex: 51,
  overflowY: "auto",
};

const drawerHeader = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  padding: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  backdropFilter: "blur(6px)",
};

const drawerCloseBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
};

const sectionCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.85)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const sectionTitle = {
  fontWeight: 980,
  color: "#0f172a",
  marginBottom: 10,
};

const kvGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const kvItem = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  background: "rgba(248,250,252,0.75)",
};

const kvLabel = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 900,
  marginBottom: 6,
};

const kvValue = {
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 13,
};

const noteBox = {
  background: "rgba(241,245,249,0.7)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
};

const evidenceImg = {
  width: "100%",
  height: "auto",
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 12px 30px rgba(2,6,23,0.10)",
};
const btnKpiGray = {
  background: "#334155",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 900,
  boxShadow: "0 8px 18px rgba(2,6,23,0.18)",
  transition: "all 160ms ease",
};



