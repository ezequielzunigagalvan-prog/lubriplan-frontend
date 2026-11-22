// src/pages/InventoryPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import InventoryDrawer from "../components/inventory/InventoryDrawer";
import NewInventoryModal from "../components/inventory/NewInventoryModal";
import { usePlant } from "../context/PlantContext";
import { getLubricants, createLubricant, updateLubricant, deleteLubricant } from "../services/lubricantsService";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { CardSkeleton } from "../components/ui/CardSkeleton";
import { Icon } from "../components/ui/lpIcons";
import { formatQty, formatCurrency, stockState } from "../utils/inventory";
import "./TechniciansPage.css";
import "./InventoryPage.css";

const norm = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const SORTS = {
  priority: "Prioridad (recomendado)",
  coverage: "Menos días de cobertura",
  consumption: "Mayor consumo",
  name: "Nombre",
  value: "Valor",
};

const itemValue = (it) => {
  const cost = Number(it?.unitCost);
  return Number.isFinite(cost) && cost > 0 ? Number(it.stock || 0) * cost : 0;
};

export default function InventoryPage() {
  const { user } = useAuth();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const canDelete = role === "ADMIN";
  const { currentPlantId, currentPlant } = usePlant();
  const confirm = useConfirm();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL"); // ALL | LOW | OUT
  const [sortBy, setSortBy] = useState("priority");

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [drawer, setDrawer] = useState({ open: false, item: null, tab: "move" });

  const load = useCallback(async () => {
    if (!currentPlantId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setErr("");
      setLoading(true);
      const data = await getLubricants();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "No se pudo cargar el inventario.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentPlantId]);

  useEffect(() => {
    setQ("");
    setStockFilter("ALL");
    load();
  }, [load]);

  /* ===== Indicadores ===== */
  const stats = useMemo(() => {
    let out = 0;
    let low = 0;
    let value = 0;
    for (const it of items) {
      const s = stockState(it);
      if (s === "out") out++;
      else if (s === "low") low++;
      value += itemValue(it);
    }
    return { total: items.length, out, low, value };
  }, [items]);

  /* ===== Filtro y orden ===== */
  const visible = useMemo(() => {
    const needle = norm(q);
    const priority = { out: 0, low: 1, ok: 2 };
    const list = items.filter((it) => {
      const s = stockState(it);
      if (stockFilter === "OUT" && s !== "out") return false;
      if (stockFilter === "LOW" && s !== "low") return false;
      if (!needle) return true;
      return [it.name, it.code, it.brand, it.supplier, it.type, it.viscosity, it.location].some((v) => norm(v).includes(needle));
    });

    const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es");
    const cov = (it) => (it.coverageDays == null ? Infinity : it.coverageDays);

    return [...list].sort((a, b) => {
      if (sortBy === "name") return byName(a, b);
      if (sortBy === "value") return itemValue(b) - itemValue(a) || byName(a, b);
      if (sortBy === "consumption") return (b.consumption30d || 0) - (a.consumption30d || 0) || byName(a, b);
      if (sortBy === "coverage") return cov(a) - cov(b) || byName(a, b);
      return priority[stockState(a)] - priority[stockState(b)] || cov(a) - cov(b) || byName(a, b);
    });
  }, [items, q, stockFilter, sortBy]);

  /* ===== CRUD ===== */
  // Lanza el error para que el formulario lo muestre y no se cierre.
  const handleSave = async (payload) => {
    if (editing?.id) {
      const before = Number(editing.stock || 0);
      await updateLubricant(editing.id, payload);
      const stockMsg = Number(payload.stock) !== before ? " · el cambio de stock quedó como ajuste en el historial" : "";
      toast.success(`Lubricante actualizado${stockMsg}`);
    } else {
      await createLubricant(payload);
      toast.success("Lubricante creado");
    }
    setOpenModal(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (item) => {
    const ok = await confirm(`¿Eliminar "${item.name}" del inventario?`, {
      title: "Eliminar lubricante",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteLubricant(item.id);
      toast.success("Lubricante eliminado");
      await load();
    } catch (e) {
      // 409: tiene historial o rutas; el servidor explica qué hacer.
      toast.error(e?.message || "No se pudo eliminar el lubricante", { duration: 7000 });
    }
  };

  const openDrawer = (item, tab) => setDrawer({ open: true, item, tab });

  const openCreate = () => {
    setEditing(null);
    setOpenModal(true);
  };

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        {/* Encabezado */}
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Lubricantes{currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">Inventario</h1>
            <div className="tch-sub">Stock, consumo real por actividades y movimientos de cada lubricante.</div>
          </div>
          <div className="tch-head-actions">
            <label className="tch-search">
              <Icon name="search" size="sm" />
              <input
                placeholder="Buscar por nombre, código, marca, proveedor…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar lubricante"
              />
              {q ? (
                <button type="button" className="tch-icon-btn" style={{ width: 26, height: 26, border: 0 }} onClick={() => setQ("")} aria-label="Limpiar búsqueda">
                  <Icon name="close" size="sm" />
                </button>
              ) : null}
            </label>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load} disabled={loading} title="Actualizar">
              <Icon name="refresh" size="sm" /> Actualizar
            </button>
            <button type="button" className="tch-btn tch-btn-primary" onClick={openCreate}>
              <Icon name="plus" size="sm" /> Nuevo lubricante
            </button>
          </div>
        </header>

        {/* Indicadores */}
        {!loading && !err ? (
          <section className="tch-kpis" aria-label="Resumen del inventario">
            <Kpi icon="drop" value={stats.total} label="Lubricantes" />
            <Kpi icon="warn" tone={stats.low ? "is-orange" : ""} value={stats.low} label="Bajo mínimo" />
            <Kpi icon="alert" tone={stats.out ? "is-red" : ""} value={stats.out} label="Sin stock" />
            <Kpi icon="trendUp" tone="is-green" value={formatCurrency(stats.value)} label="Valor del inventario" small />
          </section>
        ) : null}

        {/* Filtros */}
        {!loading && !err && items.length ? (
          <div className="tch-toolbar">
            <div className="tch-tabs" role="group" aria-label="Filtrar por stock">
              {[
                ["ALL", "Todos", stats.total],
                ["LOW", "Bajo mínimo", stats.low],
                ["OUT", "Sin stock", stats.out],
              ].map(([key, label, n]) => (
                <button key={key} type="button" className="tch-tab" aria-pressed={stockFilter === key} onClick={() => setStockFilter(key)}>
                  {label} <span className="tch-tab-count">{n}</span>
                </button>
              ))}
            </div>
            <label className="tch-sort">
              Ordenar por
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {/* Lista */}
        {loading ? (
          <CardSkeleton count={6} columns="repeat(auto-fill, minmax(320px, 1fr))" gap={14} />
        ) : err ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudo cargar el inventario</h3>
            <p>{err}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load}>
              <Icon name="refresh" size="sm" /> Reintentar
            </button>
          </div>
        ) : visible.length ? (
          <div className="inv-grid">
            {visible.map((item) => (
              <LubricantCard
                key={item.id}
                item={item}
                canDelete={canDelete}
                onMove={() => openDrawer(item, "move")}
                onHistory={() => openDrawer(item, "history")}
                onEdit={() => {
                  setEditing(item);
                  setOpenModal(true);
                }}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>
        ) : (
          <div className="tch-empty">
            <div className="tch-empty-icon"><Icon name="drop" /></div>
            <h3>{items.length ? "Sin resultados" : "Inventario vacío"}</h3>
            <p>
              {items.length
                ? "Ningún lubricante coincide con la búsqueda o el filtro."
                : "Registra tus lubricantes para que cada actividad descuente su consumo automáticamente."}
            </p>
            {items.length ? (
              <button
                type="button"
                className="tch-btn tch-btn-ghost"
                onClick={() => {
                  setQ("");
                  setStockFilter("ALL");
                }}
              >
                Limpiar filtros
              </button>
            ) : (
              <button type="button" className="tch-btn tch-btn-primary" onClick={openCreate}>
                <Icon name="plus" size="sm" /> Agregar lubricante
              </button>
            )}
          </div>
        )}
      </div>

      <NewInventoryModal
        open={openModal}
        initialData={editing}
        onClose={() => {
          setOpenModal(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <InventoryDrawer
        open={drawer.open}
        item={drawer.item}
        initialTab={drawer.tab}
        onClose={() => setDrawer({ open: false, item: null, tab: "move" })}
        onUpdated={(updated) => {
          // Refleja el nuevo stock al instante y recarga para recalcular consumo/cobertura.
          setItems((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
          setDrawer((d) => (d.item?.id === updated.id ? { ...d, item: { ...d.item, ...updated } } : d));
          load();
        }}
      />
    </MainLayout>
  );
}

function Kpi({ icon, tone = "", value, label, small = false }) {
  return (
    <div className="tch-kpi">
      <div className={`tch-kpi-icon ${tone}`}><Icon name={icon} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="tch-kpi-value" style={small ? { fontSize: 20 } : undefined}>{value}</div>
        <div className="tch-kpi-label">{label}</div>
      </div>
    </div>
  );
}

function LubricantCard({ item, canDelete, onMove, onHistory, onEdit, onDelete }) {
  const state = stockState(item);
  const unit = item.unit || "";
  const stock = Number(item.stock || 0);
  const min = item.minStock == null || item.minStock === "" ? null : Number(item.minStock);

  // Escala de la barra: el doble del mínimo (o el stock si es mayor). Así el mínimo
  // siempre se ve en el mismo lugar y no depende de datos guardados en el navegador.
  const scale = Math.max(min != null ? min * 2 : 0, stock, 1);
  const pct = Math.max(0, Math.min(100, (Math.max(stock, 0) / scale) * 100));
  const minPct = min != null ? Math.min(100, (min / scale) * 100) : null;

  const statusLabel = state === "out" ? "Sin stock" : state === "low" ? "Bajo mínimo" : "En nivel";
  const cov = item.coverageDays;
  const covClass = cov == null ? "" : cov <= 7 ? "is-danger" : cov <= 15 ? "is-warn" : "";
  const details = [item.type, item.viscosity, item.brand].filter(Boolean).join(" · ");

  return (
    <article className={`inv-card ${state === "ok" ? "" : `is-${state}`}`}>
      <div className="inv-card-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="inv-name">{item.name}</div>
          {details ? <div className="inv-sub">{details}</div> : null}
        </div>
        <span className={`inv-status is-${state}`}>{statusLabel}</span>
      </div>

      <div className="inv-meta">
        {item.code ? <span className="tch-chip is-code">{item.code}</span> : null}
        {item.location ? (
          <span className="tch-chip" title="Ubicación">
            <Icon name="pin" size="sm" /> {item.location}
          </span>
        ) : null}
        {item.supplier ? <span className="tch-chip" title="Proveedor">{item.supplier}</span> : null}
      </div>

      <div className="inv-level">
        <div className="inv-level-top">
          <div className="inv-stock">
            {formatQty(stock)}
            <small>{unit}</small>
          </div>
          <div className="inv-min">
            {min != null ? (
              <>
                Mínimo
                <br />
                <strong>{formatQty(min)} {unit}</strong>
              </>
            ) : (
              "Sin mínimo definido"
            )}
          </div>
        </div>
        <div className="inv-bar" role="img" aria-label={`Stock ${formatQty(stock)} ${unit}${min != null ? `, mínimo ${formatQty(min)}` : ""}`}>
          <div className="inv-bar-fill" style={{ width: `${pct}%` }} />
          {minPct != null ? <div className="inv-bar-min" style={{ left: `${minPct}%` }} title="Mínimo" /> : null}
        </div>
      </div>

      <div className="inv-stats">
        <div className="inv-stat">
          <div className="inv-stat-value">
            {formatQty(item.consumption30d || 0)} <span style={{ fontSize: 11, fontWeight: 600 }}>{unit}</span>
          </div>
          <div className="inv-stat-label">Consumo 30d</div>
        </div>
        <div className="inv-stat">
          <div className={`inv-stat-value ${covClass}`}>{cov == null ? "—" : `${cov} d`}</div>
          <div className="inv-stat-label">Cobertura</div>
        </div>
        <div className="inv-stat">
          <div className="inv-stat-value">{item.routesCount || 0}</div>
          <div className="inv-stat-label">Rutas</div>
        </div>
      </div>

      <div className="inv-actions">
        <button type="button" className="tch-btn tch-btn-primary grow" onClick={onMove}>
          <Icon name="plus" size="sm" /> Movimiento
        </button>
        <button type="button" className="tch-btn tch-btn-ghost" onClick={onHistory}>
          <Icon name="history" size="sm" /> Historial
        </button>
        <button type="button" className="tch-icon-btn" style={{ width: 36, height: 36 }} onClick={onEdit} title="Editar" aria-label={`Editar ${item.name}`}>
          <Icon name="edit" size="sm" />
        </button>
        {canDelete ? (
          <button type="button" className="tch-icon-btn is-danger" style={{ width: 36, height: 36 }} onClick={onDelete} title="Eliminar" aria-label={`Eliminar ${item.name}`}>
            <Icon name="trash" size="sm" />
          </button>
        ) : null}
      </div>
    </article>
  );
}
