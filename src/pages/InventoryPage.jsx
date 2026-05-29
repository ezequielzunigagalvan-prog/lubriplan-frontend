// src/pages/InventoryPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import InventoryDrawer from "../components/inventory/InventoryDrawer";
import NewInventoryModal from "../components/inventory/NewInventoryModal";
import { usePlant } from "../context/PlantContext";

import {
  getLubricants,
  createLubricant,
  updateLubricant,
  deleteLubricant,
} from "../services/lubricantsService";

import { useAuth } from "../context/AuthContext";
import { CardSkeleton } from "../components/ui/CardSkeleton";
import {
  Package,
  XCircle,
  AlertTriangle,
  DollarSign,
  RefreshCcw,
  Plus,
  Pencil,
  Trash2,
  Search,
  Tag,
  MapPin,
  Droplets,
} from "lucide-react";

/* =========================
   Barra "stock relativo" (sin backend)
   - Baseline por lubricante en localStorage
   - Si el stock sube (Entrada/Ajuste), baseline se "eleva" => 100%
========================= */
function baselineKey(plantId) {
  return `lp_inv_baseline_v1:${plantId || "default"}`;
}

function readBaselines(plantId) {
  try {
    return JSON.parse(localStorage.getItem(baselineKey(plantId)) || "{}") || {};
  } catch {
    return {};
  }
}

function writeBaselines(plantId, obj) {
  try {
    localStorage.setItem(baselineKey(plantId), JSON.stringify(obj || {}));
  } catch {}
}

function getBaseline(plantId, lubricantId, currentStock) {
  const map = readBaselines(plantId);
  const saved = Number(map?.[lubricantId]);
  if (Number.isFinite(saved) && saved > 0) return saved;

  const s = Number(currentStock ?? 0);
  const init = Number.isFinite(s) && s > 0 ? s : 1;
  map[lubricantId] = init;
  writeBaselines(plantId, map);
  return init;
}

function maybeRaiseBaseline(plantId, lubricantId, newStock) {
  const map = readBaselines(plantId);
  const s = Number(newStock ?? 0);
  if (!Number.isFinite(s) || s <= 0) return;

  const prev = Number(map?.[lubricantId]);
  if (!Number.isFinite(prev) || s > prev) {
    map[lubricantId] = s;
    writeBaselines(plantId, map);
  }
}

function parseProperty(viscosityRaw) {
  const raw = String(viscosityRaw ?? "").trim();
  if (!raw) return null;

  // si viene como "NLGI 2" / "NLGI2"
  const m = raw.match(/^NLGI\s*(.*)$/i);
  if (m) {
    const v = String(m[1] ?? "").trim();
    return { label: "NLGI", value: v || raw.replace(/\s+/g, " ").trim() };
  }

  // si no, lo tratamos como viscosidad
  return { label: "Viscosidad", value: raw };
}

function propertyToText(p) {
  if (!p) return null;
  const val = String(p.value ?? "").trim();
  if (!val) return null;
  return `${p.label}: ${val}`;
}

/* =========================
Toast (confirmacion animada)
========================= */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast?.open) return;
    const t = window.setTimeout(() => onClose?.(), toast?.ms || 2200);
    return () => window.clearTimeout(t);
  }, [toast?.open]);

  if (!toast?.open) return null;

  const tone =
    toast.tone === "success"
      ? { bg: "rgba(34,197,94,0.14)", bd: "rgba(34,197,94,0.30)", fg: "#14532d" }
      : toast.tone === "danger"
      ? { bg: "rgba(239,68,68,0.12)", bd: "rgba(239,68,68,0.28)", fg: "#7f1d1d" }
      : { bg: "rgba(249,115,22,0.14)", bd: "rgba(249,115,22,0.30)", fg: "#7c2d12" };

  return (
    <div style={toastWrap} role="status" aria-live="polite">
      <div style={{ ...toastCard, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
        <div style={{ fontWeight: 950 }}>{toast.title || "Listo"}</div>
        {toast.message ? <div style={{ marginTop: 2, fontWeight: 850, opacity: 0.92 }}>{toast.message}</div> : null}
      </div>
    </div>
  );
}

const toastWrap = {
  position: "fixed",
  right: 18,
  bottom: 18,
  zIndex: 9999,
};

const toastCard = {
  minWidth: 260,
  maxWidth: 420,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 18px 34px rgba(2,6,23,0.18)",
  transform: "translateY(0)",
  animation: "lp_toast_in 220ms ease",
};

/* =========================
   Page
========================= */
export default function InventoryPage() {
  const { user } = useAuth();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const canDelete = role === "ADMIN";
  const { currentPlantId, currentPlant } = usePlant();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  

  // UI state
  const [q, setQ] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL"); // ALL | LOW | OUT
  const [sortBy, setSortBy] = useState("priority"); // priority | name | stock | value
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  // modal: create/edit
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState(null);
  const [drawerTab, setDrawerTab] = useState("move"); // move | history

  // toast
  const [toast, setToast] = useState({ open: false });
  const showToast = (t) => setToast({ open: true, ms: 2200, ...t });
  const closeToast = () => setToast((p) => ({ ...p, open: false }));

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const data = await getLubricants();
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);

      // Inicializa baseline a los que no tengan
      try {
        const map = readBaselines(currentPlantId);
let changed = false;

arr.forEach((it) => {
  if (!it?.id) return;
  const stock = Number(it.stock ?? 0);
  const saved = Number(map?.[it.id]);

  if (!(Number.isFinite(saved) && saved > 0)) {
    map[it.id] = Number.isFinite(stock) && stock > 0 ? stock : 1;
    changed = true;
  }
});

if (changed) writeBaselines(currentPlantId, map);
      } catch {}
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Error cargando inventario");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentPlantId) return;
    load();
  }, [currentPlantId]);

  // ===== Helpers =====
  const getStock = (it) => {
    const n = Number(it?.stock ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const getMin = (it) => {
    const v = it?.minStock;
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const isOut = (it) => getStock(it) <= 0;

  const isLow = (it) => {
    const stock = getStock(it);
    const min = getMin(it);
    return min != null && stock <= min;
  };

  const itemValue = (it) => {
    const stock = getStock(it);
    const unitCost = it?.unitCost == null || it?.unitCost === "" ? null : Number(it.unitCost);
    if (!Number.isFinite(unitCost) || unitCost < 0) return 0;
    return stock * unitCost;
  };

  // ===== Stats =====
  const stats = useMemo(() => {
    const total = items.length;
    const out = items.filter((x) => isOut(x)).length;
    const low = items.filter((x) => !isOut(x) && isLow(x)).length;
    const value = items.reduce((acc, it) => acc + itemValue(it), 0);
    return { total, out, low, value };
  }, [items]);

  // ===== Filtering =====
  const norm = (v) => String(v ?? "").toLowerCase().trim();

  const filtered = useMemo(() => {
    const needle = norm(q);

    return (items || [])
      .filter((it) => it && typeof it.id === "number")
      .filter((it) => {
        if (stockFilter === "OUT") return isOut(it);
        if (stockFilter === "LOW") return !isOut(it) && isLow(it);
        return true;
      })
      .filter((it) => {
        if (!needle) return true;

        const hay = [
          it.name,
          it.code,
          it.brand,
          it.supplier,
          it.type,
          it.viscosity,
          it.location,
          it.notes,
          it.equipmentCode,
          it.equipment?.code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(needle);
      });
  }, [items, q, stockFilter]);

  // ===== Sorting (prioridad siempre primero) =====
  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;

    const nameKey = (it) => String(it?.name || "").toLowerCase();

    const priorityKey = (it) => {
      // 0 = SIN STOCK, 1 = BAJO, 2 = OK
      if (isOut(it)) return 0;
      if (isLow(it)) return 1;
      return 2;
    };

    const stockKey = (it) => getStock(it);
    const valueKey = (it) => itemValue(it);

    return [...filtered].sort((a, b) => {
      const pa = priorityKey(a);
      const pb = priorityKey(b);
      if (pa !== pb) return pa - pb;

      let va, vb;
      if (sortBy === "stock") {
        va = stockKey(a);
        vb = stockKey(b);
      } else if (sortBy === "value") {
        va = valueKey(a);
        vb = valueKey(b);
      } else {
        va = nameKey(a);
        vb = nameKey(b);
      }

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtered, sortBy, sortDir]);

  // ===== CRUD =====
  const handleCreate = async (payload) => {
    const created = await createLubricant(payload);
    setItems((prev) => [created, ...prev]);
    try {
      maybeRaiseBaseline(currentPlantId, created.id, created.stock);
    } catch {}
    showToast({ tone: "success", title: "Producto creado", message: created?.name || "" });
  };

  const handleUpdate = async (id, payload) => {
    const updated = await updateLubricant(id, payload);
    setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
    try {
      maybeRaiseBaseline(currentPlantId, updated.id, updated.stock);
    } catch {}
    showToast({ tone: "success", title: "Producto actualizado", message: updated?.name || "" });
  };

  const handleDelete = async (id) => {
    const ok = confirm("?Eliminar este lubricante del inventario?");
    if (!ok) return;

    await deleteLubricant(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    showToast({ tone: "danger", title: "Producto eliminado" });
  };

  return (
    <MainLayout>
      {/* Animacion del toast */}
      <style>{`
        @keyframes lp_toast_in {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <Toast toast={toast} onClose={closeToast} />

      <div className="lp-fade-in" style={pageShell}>
        {/* HEADER */}
        <div style={topBar}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 950, color: "#64748b", letterSpacing: 1.2 }}>
              <span style={{ width: 18, height: 2, background: "#f97316", borderRadius: 999, flexShrink: 0 }} />
              INVENTARIO · LUBRICANTES
            </div>
            <h1 style={title}>Inventario</h1>
           <div style={subtitle}>
  Controla tus lubricantes, stock y movimientos
            {currentPlant?.name ? ` · Planta: ${currentPlant.name}` : ""}
</div>
          </div>

          <div style={topActions}>
            <div style={searchBox}>
              <Search size={16} strokeWidth={2.2} />
              <input
              placeholder="Buscar por nombre, código, marca, proveedor..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={searchInput}
              />
            </div>

            <button onClick={load} style={btnGhost} disabled={loading} title="Actualizar">
              <RefreshCcw size={16} strokeWidth={2.2} />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>

            <button
              style={btnPrimary}
              onClick={() => {
                setEditing(null);
                setOpenModal(true);
              }}
            >
              <Plus size={16} strokeWidth={2.2} />
              Nuevo producto
            </button>
          </div>
        </div>

        {err && <div style={errorBox}>{err}</div>}

        {/* KPI */}
        {!loading && (
          <div style={summaryCard}>
            <div style={summaryMetrics4}>
              <KpiCard icon={<Package size={20} />}       value={stats.total}              label="Productos"   accentColor="#0f172a" iconTone="navy"  />
              <KpiCard icon={<XCircle size={20} />}       value={stats.out}                label="Sin stock"   accentColor="#ef4444" iconTone="red"   />
              <KpiCard icon={<AlertTriangle size={20} />} value={stats.low}                label="Bajo mínimo" accentColor="#f59e0b" iconTone="amber" />
              <KpiCard icon={<DollarSign size={20} />}    value={formatCurrency(stats.value)} label="Valor"    accentColor="#22c55e" iconTone="green" small />
            </div>
          </div>
        )}

        {/* CONTROLES */}
        <div style={filtersWrap}>
          <div style={filtersRow}>
            <div style={field}>
              <label style={label}>Stock</label>
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={input}>
                <option value="ALL">Todos</option>
                <option value="OUT">Solo sin stock</option>
                <option value="LOW">Solo bajo mínimo</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Orden</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={input}>
                <option value="priority">Prioridad (recomendado)</option>
                <option value="name">Nombre</option>
                <option value="stock">Stock</option>
                <option value="value">Valor</option>
              </select>
            </div>

            <div style={field}>
                <label style={label}>Dirección</label>
              <button
                type="button"
                style={btnDir}
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title="Cambiar orden"
              >
                  {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>
            </div>
          </div>
        </div>

        {/* FILTER CHIPS */}
        {(q || stockFilter !== "ALL") ? (
          <div style={activeFiltersRow}>
            <span style={activeFiltersLabel}>Filtros activos:</span>
            {q && (
              <button type="button" className="lpFilterChip" onClick={() => setQ("")}>
                "{q}" ✕
              </button>
            )}
            {stockFilter === "OUT" && (
              <button type="button" className="lpFilterChip" onClick={() => setStockFilter("ALL")}>
                Sin stock ✕
              </button>
            )}
            {stockFilter === "LOW" && (
              <button type="button" className="lpFilterChip" onClick={() => setStockFilter("ALL")}>
                Bajo mínimo ✕
              </button>
            )}
            <button type="button" style={clearAllFiltersBtn} onClick={() => { setQ(""); setStockFilter("ALL"); }}>
              Limpiar todos
            </button>
          </div>
        ) : null}

        {/* GRID */}
        {loading && <CardSkeleton count={8} columns="repeat(auto-fill, minmax(220px, 1fr))" gap={12} />}
        {!loading && sorted.length === 0 && (
          <div style={inlineEmptyBox}>
            <div style={emptyIconWrap}>
              <Package size={24} color="#94a3b8" />
            </div>
            <div style={emptyTitle}>Sin productos</div>
            <div style={emptyDesc}>
              {q || stockFilter !== "ALL"
                ? "No hay productos que coincidan con los filtros activos."
                : "Aún no hay productos registrados en el inventario."}
            </div>
            {(q || stockFilter !== "ALL") ? (
              <button type="button" style={emptyAction} onClick={() => { setQ(""); setStockFilter("ALL"); }}>
                Limpiar filtros
              </button>
            ) : (
              <button type="button" style={emptyActionPrimary} onClick={() => { setEditing(null); setOpenModal(true); }}>
                + Nuevo producto
              </button>
            )}
          </div>
        )}

        <div style={grid}>
          {sorted.map((item) => {
            const stock = getStock(item);
            const min = getMin(item);

            const out = isOut(item);
            const low = !out && isLow(item);

            // Barra relativa
            const baseline = getBaseline(currentPlantId, item.id, stock);
            const pct = Math.max(0, Math.min(100, Math.round((stock / baseline) * 100)));

            const barStyle = {
              ...barFill,
              width: `${pct}%`,
              background: out ? "#ef4444" : low ? "#f59e0b" : "#22c55e",
            };

            const eqCode =
              item?.equipmentCode ||
              item?.equipment?.code ||
              item?.route?.equipment?.code ||
              null;

            // Propiedades: si viene "NLGI X" lo mostramos bonito; si no, como viscosidad
            const propObj = parseProperty(item?.viscosity);
const propText = propertyToText(propObj);

            return (
              <div
  key={item.id}
  style={{
    ...card,
    borderTop: out ? "4px solid #ef4444" : low ? "4px solid #f59e0b" : "4px solid #22c55e",
    borderLeft: out
      ? "4px solid rgba(239,68,68,0.65)"
      : low
      ? "4px solid rgba(245,158,11,0.65)"
      : "4px solid rgba(34,197,94,0.45)",
    background: out
      ? "linear-gradient(160deg, rgba(254,242,242,0.55) 0%, rgba(248,250,252,0.96) 100%)"
      : low
      ? "linear-gradient(160deg, rgba(255,251,235,0.55) 0%, rgba(248,250,252,0.96) 100%)"
      : "linear-gradient(160deg, rgba(240,253,244,0.40) 0%, rgba(248,250,252,0.96) 100%)",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 20px 40px rgba(15,23,42,0.12)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 10px 22px rgba(15,23,42,0.06)";
  }}
>
                {/* TOP */}
                
                <div style={cardHeader}>
                  <div style={{ minWidth: 0 }}>
                    <div style={nameRow}>
                      <h3 style={cardTitle} title={item?.name || ""}>
                          {item?.name || "-"}
                      </h3>

                      {out ? (
                            <span style={pill("#fee2e2", "#991b1b")}>Sin stock</span>
                      ) : low ? (
                            <span style={pill("#ffedd5", "#9a3412")}>Bajo mínimo</span>
                      ) : (
                        <span style={pill("#dcfce7", "#166534")}>OK</span>
                      )}
                    </div>

                    <div style={metaRow}>
                      {item?.code ? (
                        <span style={metaPill}>
                          <Tag size={14} strokeWidth={2.2} /> {item.code}
                        </span>
                      ) : null}

                      {item?.type ? (
  <span style={typeBadge}>
    <Droplets size={14} strokeWidth={2.2} />
    {item.type}
  </span>
) : null}

                      {propText ? (
  <span style={metaPill}>
    <strong>{propObj.label}:</strong>&nbsp;{propObj.value}
  </span>
) : null}

                      {eqCode ? (
                        <span style={{ ...metaPill, background: "rgba(224,242,254,0.7)" }}>
                          <strong>Eq:</strong>&nbsp;{eqCode}
                        </span>
                      ) : null}

                      {item?.location ? (
                        <span style={metaPill}>
                          <MapPin size={14} strokeWidth={2.2} /> {item.location}
                        </span>
                      ) : null}
                    </div>

                    <div style={subRow}>
                      {item?.brand ? (
                        <span>
                          <strong>Marca:</strong> {item.brand}
                        </span>
                      ) : null}
                      {item?.supplier ? (
                        <span>
                          <strong>Proveedor:</strong> {item.supplier}
                        </span>
                      ) : null}
                      {item?.unitCost != null && item.unitCost !== "" ? (
                        <span>
                          <strong>Costo:</strong> {formatCurrency(Number(item.unitCost))} / {item.unit || ""}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={actionsCol}>
                   <button
  type="button"
  style={btnMove}
  onClick={() => {
    setDrawerItem(item);
    setDrawerTab("move");
    setDrawerOpen(true);
  }}
>
  Movimiento
</button>

                    <button
                      type="button"
                      style={btnSmall}
                      onClick={() => {
                        setDrawerItem(item);
                        setDrawerTab("history");
                        setDrawerOpen(true);
                      }}
                    >
                      Historial
                    </button>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        style={iconBtn}
                        title="Editar"
                        onClick={() => {
                          setEditing(item);
                          setOpenModal(true);
                        }}
                      >
                        <Pencil size={16} strokeWidth={2.2} />
                      </button>

                      {canDelete ? (
                        <button
                          type="button"
                          style={iconBtnDanger}
                          title="Eliminar"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={16} strokeWidth={2.2} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* STOCK */}
                <div style={stockRow}>
                  <div>
                    <div style={stockLabel}>Stock</div>
                    <div style={stockValue}>{stock} {item.unit || ""}</div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 980, color: out ? "#dc2626" : low ? "#d97706" : "#16a34a" }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800, letterSpacing: 0.4 }}>RELATIVO</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={stockLabel}>Mínimo</div>
                    <div style={stockValue}>{min == null ? "—" : `${min} ${item.unit || ""}`}</div>
                  </div>
                </div>

                {/* BAR */}
                <div style={{ ...barWrap, marginTop: 8 }}>
                  <div style={barStyle} />
                </div>

                {/* VALOR */}
                {item.unitCost != null && item.unitCost !== "" ? (
                  <div style={valueRow}>
                    <span style={{ color: "#64748b", fontWeight: 900, fontSize: 12 }}>Valor estimado</span>
                    <strong style={{ color: "#0f172a" }}>{formatCurrency(itemValue(item))}</strong>
                  </div>
                ) : null}

                {item.notes ? (
                  <div style={notes}>
                    <strong>Notas:</strong> {item.notes}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: NUEVO / EDITAR */}
      <NewInventoryModal
        open={openModal}
        initialData={editing}
        onClose={() => {
          setOpenModal(false);
          setEditing(null);
        }}
        onSave={async (payload) => {
          try {
            if (editing?.id) {
              await handleUpdate(editing.id, payload);
            } else {
              await handleCreate(payload);
            }
            setOpenModal(false);
            setEditing(null);
          } catch (e) {
            toast.error(e?.message || "Error guardando lubricante");
          }
        }}
      />

      {/* DRAWER */}
      <InventoryDrawer
        open={drawerOpen}
        item={drawerItem}
        initialTab={drawerTab}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerItem(null);
        }}
        onUpdated={(updated) => {
          try {
            maybeRaiseBaseline(currentPlantId, updated.id, updated.stock);
          } catch {}
          setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        }}
        onToast={(t) => showToast(t)}
      />
    </MainLayout>
  );
}

/* ================= KPI COMPONENT ================= */

const KPI_ICON_TONES = {
  navy:   { background: "rgba(15,23,42,0.06)",   border: "1px solid rgba(15,23,42,0.12)",    color: "#334155" },
  orange: { background: "rgba(249,115,22,0.10)",  border: "1px solid rgba(249,115,22,0.28)",  color: "#9a3412" },
  blue:   { background: "rgba(59,130,246,0.08)",  border: "1px solid rgba(59,130,246,0.22)",  color: "#1e40af" },
  green:  { background: "rgba(34,197,94,0.09)",   border: "1px solid rgba(34,197,94,0.22)",   color: "#166534" },
  red:    { background: "rgba(239,68,68,0.08)",   border: "1px solid rgba(239,68,68,0.22)",   color: "#991b1b" },
  amber:  { background: "rgba(245,158,11,0.10)",  border: "1px solid rgba(245,158,11,0.25)",  color: "#78350f" },
  slate:  { background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.20)", color: "#475569" },
};

function KpiCard({ icon, value, label, small, accentColor = "#0f172a", iconTone = "navy" }) {
  const tone = KPI_ICON_TONES[iconTone] || KPI_ICON_TONES.navy;
  return (
    <div style={{ ...kpiCard, borderTop: `4px solid ${accentColor}` }} className="lpKpiCard">
      <div style={kpiInner}>
        <div style={{ ...kpiIconBox, ...tone }}>{icon}</div>
        <div style={kpiRight}>
          <div style={small ? kpiValueSmall : kpiValue}>{value}</div>
          <div style={kpiLabel}>{label}</div>
        </div>
      </div>
    </div>
  );
}

function pill(bg, color) {
  return {
    background: bg,
    color,
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 950,
    border: "1px solid rgba(226,232,240,0.9)",
  };
}

function formatCurrency(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return "$0";
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

/* ================= STYLES ================= */

const pageShell = {
  paddingTop: 6,
  display: "grid",
  gap: 14,
};

const topBar = {
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

const title = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1.05,
};

const subtitle = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const topActions = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const btnPrimary = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#f97316",
  color: "#0b1220",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fb923c",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(249,115,22,0.22)",
  whiteSpace: "nowrap",
};

const btnGhost = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  whiteSpace: "nowrap",
};


const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  minWidth: 0,
  width: "100%",
  flex: "1 1 280px",
};

const searchInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontWeight: 800,
  width: "100%",
  minWidth: 0,
  flex: 1,
};

const summaryCard = {
  marginTop: 14,
};

const summaryMetrics4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
};

const kpiCard = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.92) 100%)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 10px 24px rgba(2,6,23,0.07)",
  minHeight: 80,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const kpiInner = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const kpiIconBox = {
  width: 48,
  height: 48,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const kpiRight = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  flex: 1,
  lineHeight: 1.05,
};

const kpiValue = {
  fontSize: 38,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1,
  letterSpacing: -1,
};

const kpiValueSmall = {
  fontSize: 22,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1,
};

const kpiLabel = {
  marginTop: 5,
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  color: "#64748b",
  letterSpacing: 0.7,
};

const filtersWrap = {
  marginTop: 4,
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  borderLeft: "3px solid rgba(249,115,22,0.45)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const filtersRow = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const field = { display: "flex", flexDirection: "column", gap: 6, minWidth: 200 };
const label = { fontSize: 12, color: "#64748b", fontWeight: 900 };

const input = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const btnDir = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const grid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
};

const card = {
  position: "relative",
  background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.96) 100%)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 14,
  transition: "transform 180ms ease, box-shadow 180ms ease, border-color 160ms ease",
  boxShadow: "0 10px 22px rgba(15,23,42,0.06)",
  cursor: "default",
  overflow: "hidden",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const nameRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const cardTitle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 900,
  color: "#020617",
  letterSpacing: 0.3,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 520,
};

const metaRow = {
  marginTop: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const metaPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.85)",
  color: "#0f172a",
};

const subRow = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  fontSize: 12,
  color: "#475569",
  marginTop: 10,
  fontWeight: 800,
};

const actionsCol = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "stretch",
  minWidth: 120,
  flex: "1 1 160px",
};

const btnSmall = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "9px 10px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  width: "100%",
};

const btnMove = {
  ...btnSmall,
  border: "1px solid #374151",
  background: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
  color: "#f9fafb",
  boxShadow: "0 10px 20px rgba(31,41,55,0.32)",
};

const iconBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  borderRadius: 12,
  width: 40,
  height: 36,
  cursor: "pointer",
  fontWeight: 950,
  display: "grid",
  placeItems: "center",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const iconBtnDanger = {
  ...iconBtn,
  border: "1px solid rgba(254,202,202,0.95)",
  color: "#b91c1c",
  boxShadow: "0 8px 18px rgba(239,68,68,0.08)",
};

const stockRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 14,
};

const stockLabel = { fontSize: 12, color: "#6b7280", fontWeight: 900 };
const stockValue = { fontSize: 16, fontWeight: 950, color: "#111827" };

const barWrap = {
  marginTop: 10,
  height: 12,
  borderRadius: 999,
  background: "rgba(241,245,249,0.9)",
  overflow: "hidden",
};

const barFill = {
  height: "100%",
  borderRadius: 999,
  transition: "width 220ms ease",
};

const valueRow = {
  marginTop: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const notes = {
  marginTop: 12,
  fontSize: 12,
  color: "#0f172a",
  background: "rgba(241,245,249,0.7)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 850,
};

const errorBox = {
  marginTop: 12,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 900,
};

const typeBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.28)",
  color: "#7c2d12",
};

const inlineEmptyBox = {
  marginTop: 14,
  padding: "40px 24px",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  borderTop: "4px solid rgba(226,232,240,0.80)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.92) 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  textAlign: "center",
  boxShadow: "0 12px 28px rgba(2,6,23,0.05)",
};

const emptyIconWrap = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: "rgba(15,23,42,0.05)",
  border: "1px solid rgba(226,232,240,0.95)",
  display: "grid",
  placeItems: "center",
};

const emptyTitle = {
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
};

const emptyDesc = {
  fontSize: 13,
  color: "#64748b",
  fontWeight: 800,
  maxWidth: "36ch",
};

const emptyAction = {
  marginTop: 6,
  padding: "8px 16px",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.90)",
  fontWeight: 950,
  fontSize: 13,
  color: "#334155",
  cursor: "pointer",
};

const emptyActionPrimary = {
  marginTop: 6,
  padding: "9px 18px",
  borderRadius: 12,
  border: "1px solid rgba(249,115,22,0.45)",
  background: "#f97316",
  fontWeight: 950,
  fontSize: 13,
  color: "#0b1220",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(249,115,22,0.22)",
};

const activeFiltersRow = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
  padding: "10px 14px",
  borderRadius: 14,
  background: "rgba(249,115,22,0.05)",
  border: "1px solid rgba(249,115,22,0.18)",
};

const activeFiltersLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#92400e",
  letterSpacing: 0.4,
  textTransform: "uppercase",
  marginRight: 4,
};

const clearAllFiltersBtn = {
  marginLeft: "auto",
  padding: "5px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.90)",
  color: "#334155",
  cursor: "pointer",
};

