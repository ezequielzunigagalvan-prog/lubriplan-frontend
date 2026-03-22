// src/pages/InventoryPage.jsx
import { useEffect, useMemo, useState } from "react";
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
   Toast (confirmación animada)
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
    const ok = confirm("¿Eliminar este lubricante del inventario?");
    if (!ok) return;

    await deleteLubricant(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    showToast({ tone: "danger", title: "Producto eliminado" });
  };

  return (
    <MainLayout>
      {/* Animación del toast */}
      <style>{`
        @keyframes lp_toast_in {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <Toast toast={toast} onClose={closeToast} />

      <div style={pageShell}>
        {/* HEADER */}
        <div style={topBar}>
          <div>
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
                placeholder="Buscar por nombre, código, marca, proveedor…"
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
              <KpiCard icon={<Package size={18} />} value={stats.total} label="Productos" />
              <KpiCard icon={<XCircle size={18} />} value={stats.out} label="Sin stock" />
              <KpiCard icon={<AlertTriangle size={18} />} value={stats.low} label="Bajo mínimo" />
              <KpiCard
                icon={<DollarSign size={18} />}
                value={formatCurrency(stats.value)}
                label="Valor"
                small
              />
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

        {/* GRID */}
        {loading && <p style={{ marginTop: 14 }}>Cargando inventario…</p>}
        {!loading && sorted.length === 0 && <p style={{ marginTop: 14 }}>No hay productos para mostrar.</p>}

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
    borderColor: out
      ? "rgba(239,68,68,0.35)"
      : low
      ? "rgba(245,158,11,0.35)"
      : "rgba(226,232,240,0.95)",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-6px)";
    e.currentTarget.style.boxShadow = "0 18px 36px rgba(15,23,42,0.12)";
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
                        {item?.name || "—"}
                      </h3>

                      {out ? (
                        <span style={pill("#fee2e2", "#991b1b")}>⛔ Sin stock</span>
                      ) : low ? (
                        <span style={pill("#ffedd5", "#9a3412")}>⚠ Bajo mínimo</span>
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
                    <div style={stockValue}>
                      {stock} {item.unit || ""}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={stockLabel}>Mínimo</div>
                    <div style={stockValue}>{min == null ? "—" : `${min} ${item.unit || ""}`}</div>
                  </div>
                </div>

                {/* BAR (dejar verde que baja) */}
                <div style={barWrap}>
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
            console.error(e);
            alert(e?.message || "Error guardando lubricante");
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

function KpiCard({ icon, value, label, small }) {
  return (
    <div style={kpiCard}>
      <div style={kpiAccent} />
      <div style={kpiInner}>
        <div style={kpiIconBox}>{icon}</div>
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
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  paddingBottom: 12,
  borderBottom: "1px solid #e5e7eb",
  gap: 12,
  flexWrap: "wrap",
};

const title = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const kpiCard = {
  position: "relative",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 12,
  boxShadow: "0 10px 18px rgba(2,6,23,0.06)",
  overflow: "hidden", // ✅ importante para respetar la curva
};

const kpiAccent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 10,
  background: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
  borderTopLeftRadius: 16,   // ✅ curva
  borderTopRightRadius: 16,  // ✅ curva
};

const kpiInner = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const kpiIconBox = {
  width: 52,
  height: 52,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #fb923c 0%, #f97316 100%)",
  color: "#0f172a",
};

const kpiRight = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
};

const kpiValue = {
  fontSize: 36,
  fontWeight: 1000,
  color: "#0f172a",
};

const kpiValueSmall = {
  fontSize: 22,
  fontWeight: 1000,
  color: "#0f172a",
};

const kpiLabel = {
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  color: "#334155",
};

const filtersWrap = {
  marginTop: 18,
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.72)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  backdropFilter: "blur(4px)",
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
  background: "rgba(255,255,255,0.70)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 14,
  transition: "transform 180ms ease, box-shadow 180ms ease",
  boxShadow: "0 10px 22px rgba(15,23,42,0.06)",
  cursor: "default",
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
  fontWeight: 1000,
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