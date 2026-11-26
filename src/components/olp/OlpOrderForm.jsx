// Formulario de Orden de Lubricación Preventiva: equipo, fecha del preventivo, técnico y
// las rutas que se van a ejecutar en el paro (algunas o todas).
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Icon } from "../ui/lpIcons";
import TechnicianSelect from "../activities/TechnicianSelect";
import { getEquipment } from "../../services/equipmentService";
import { getTechnicians } from "../../services/techniciansService";
import { preventiveOrdersService } from "../../services/preventiveOrdersService";
import { DUE_STATE, fmtDay, qtyText, todayYmdLocal, ymdOf } from "./olpUi";
import "../../pages/TechniciansPage.css";
import "./Olp.css";

export default function OlpOrderForm({ open, onClose, onSaved, order = null, defaultEquipmentId = null }) {
  const editing = Boolean(order?.id);
  const [equipments, setEquipments] = useState([]);
  const [techs, setTechs] = useState([]);
  const [eqQuery, setEqQuery] = useState("");
  const [form, setForm] = useState(() => initial(order, defaultEquipmentId));
  const [routesInfo, setRoutesInfo] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [mode, setMode] = useState(() => (order?.items?.length ? "PICK" : "ALL"));
  const [selected, setSelected] = useState(() => new Set((order?.items || []).map((i) => i.routeId)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(initial(order, defaultEquipmentId));
    setSelected(new Set((order?.items || []).map((i) => i.routeId)));
    setMode(order?.items?.length ? "PICK" : "ALL");
    setError("");
    let alive = true;
    Promise.all([getEquipment().catch(() => []), getTechnicians().catch(() => [])]).then(([eq, tc]) => {
      if (!alive) return;
      const list = Array.isArray(eq) ? eq : eq?.items || eq?.data || [];
      setEquipments(list);
      setTechs(tc || []);
    });
    return () => {
      alive = false;
    };
  }, [open, order, defaultEquipmentId]);

  // Rutas del equipo
  useEffect(() => {
    if (!open || !form.equipmentId) {
      setRoutesInfo(null);
      return;
    }
    let alive = true;
    setLoadingRoutes(true);
    preventiveOrdersService
      .equipmentRoutes(form.equipmentId)
      .then((r) => {
        if (!alive) return;
        setRoutesInfo(r);
        const ids = (r?.routes || []).map((x) => x.id);
        // Al cambiar de equipo se limpia la selección que no sea de ese equipo.
        setSelected((prev) => {
          const keep = [...prev].filter((id) => ids.includes(id));
          return new Set(keep);
        });
      })
      .catch((e) => alive && setError(e?.message || "No se pudieron cargar las rutas del equipo"))
      .finally(() => alive && setLoadingRoutes(false));
    return () => {
      alive = false;
    };
  }, [open, form.equipmentId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !saving && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const routes = useMemo(() => routesInfo?.routes || [], [routesInfo]);
  const chosen = mode === "ALL" ? routes : routes.filter((r) => selected.has(r.id));
  const dueCount = routes.filter((r) => r.dueState === "OVERDUE" || r.dueState === "TODAY").length;

  const eqOptions = useMemo(() => {
    const q = eqQuery.trim().toLowerCase();
    const list = q
      ? equipments.filter((e) => `${e.name || ""} ${e.code || ""} ${e.tag || ""} ${e.location || ""}`.toLowerCase().includes(q))
      : equipments;
    return list.slice(0, 300);
  }, [equipments, eqQuery]);

  const consumptionByUnit = useMemo(() => {
    const m = new Map();
    for (const r of chosen) {
      if (!r.estimatedConsumption) continue;
      const k = `${r.lubricantName || "Lubricante"}|${r.estimatedConsumption.unit}`;
      m.set(k, (m.get(k) || 0) + Number(r.estimatedConsumption.quantity || 0));
    }
    return [...m.entries()].map(([k, q]) => {
      const [name, unit] = k.split("|");
      return { name, unit, q: Math.round(q * 100) / 100 };
    });
  }, [chosen]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const pickDue = () => {
    setMode("PICK");
    setSelected(new Set(routes.filter((r) => r.dueState === "OVERDUE" || r.dueState === "TODAY").map((r) => r.id)));
  };

  async function submit(release) {
    setError("");
    if (!form.equipmentId) return setError("Selecciona el equipo");
    if (!form.scheduledDate) return setError("Indica la fecha del preventivo");
    if (!routes.length) return setError("El equipo no tiene rutas de lubricación");
    if (!chosen.length) return setError("Selecciona al menos una ruta");
    const payload = {
      equipmentId: Number(form.equipmentId),
      scheduledDate: form.scheduledDate,
      title: form.title.trim(),
      notes: form.notes.trim(),
      assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
      requiresPhoto: form.requiresPhoto,
      ...(mode === "ALL" ? { allRoutes: true } : { routeIds: chosen.map((r) => r.id) }),
    };
    setSaving(true);
    try {
      let saved;
      if (editing) {
        saved = await preventiveOrdersService.update(order.id, payload);
        if (release && order.status === "DRAFT") saved = await preventiveOrdersService.open(order.id);
      } else {
        saved = await preventiveOrdersService.create({ ...payload, release });
      }
      toast.success(editing ? "Orden actualizada" : release ? `Orden #${saved.id} creada y liberada` : `Orden #${saved.id} guardada como borrador`);
      onSaved?.(saved);
    } catch (e) {
      setError(e?.message || "No se pudo guardar la orden");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="tch-overlay olp-overlay" role="dialog" aria-modal="true" aria-label="Orden preventiva" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose?.()}>
      <div className="olp-modal">
        <div className="olp-modal-head">
          <div>
            <small>Orden de lubricación preventiva</small>
            <h2>{editing ? `Editar orden #${order.id}` : "Nueva orden con el preventivo"}</h2>
          </div>
          <button type="button" className="olp-x" onClick={onClose} disabled={saving} aria-label="Cerrar">
            <Icon name="close" size="sm" />
          </button>
        </div>

        <div className="olp-modal-body">
          <div className="olp-form-grid">
            <label className="olp-field is-full">
              <span>Equipo</span>
              <input value={eqQuery} onChange={(e) => setEqQuery(e.target.value)} placeholder="Buscar por nombre, código o ubicación…" />
              <select value={form.equipmentId} onChange={(e) => set("equipmentId", e.target.value)}>
                <option value="">Selecciona el equipo…</option>
                {eqOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                    {e.code ? ` · ${e.code}` : ""}
                    {e.location ? ` — ${e.location}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="olp-field">
              <span>Fecha del preventivo</span>
              <input type="date" value={form.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} />
            </label>
            <label className="olp-field">
              <span>Técnico</span>
              <TechnicianSelect
                value={form.assignedTo}
                onChange={(v) => set("assignedTo", v)}
                techs={techs}
                allowOtherPlants
                onBorrowed={(t) => setTechs((prev) => [...prev.filter((x) => x.id !== t.id), t])}
                emptyLabel="Sin asignar (cualquier técnico)"
              />
            </label>
            <label className="olp-field is-full">
              <span>Título (opcional)</span>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej. Preventivo mensual de mantenimiento" maxLength={160} />
            </label>
          </div>

          <div>
            <div className="olp-pick-head">
              <div>
                <b>Rutas a ejecutar</b>{" "}
                <span>
                  {routes.length ? `${chosen.length} de ${routes.length} seleccionada${chosen.length === 1 ? "" : "s"}` : ""}
                  {dueCount ? ` · ${dueCount} vencida${dueCount === 1 ? "" : "s"} o para hoy` : ""}
                </span>
              </div>
              {routes.length ? (
                <div className="olp-seg" role="group" aria-label="Rutas">
                  <button type="button" aria-pressed={mode === "ALL"} onClick={() => setMode("ALL")}>
                    Todas
                  </button>
                  <button type="button" aria-pressed={mode === "PICK"} onClick={() => setMode("PICK")}>
                    Elegir
                  </button>
                  {dueCount ? (
                    <button type="button" aria-pressed={false} onClick={pickDue} title="Seleccionar solo las vencidas o de hoy">
                      Solo las que tocan
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 10 }}>
              {!form.equipmentId ? (
                <div className="olp-empty">Selecciona un equipo para ver sus rutas.</div>
              ) : loadingRoutes ? (
                <div className="olp-empty">Cargando rutas…</div>
              ) : !routes.length ? (
                <div className="olp-empty">
                  <b>Este equipo no tiene rutas de lubricación</b>
                  Crea sus rutas en el módulo de Rutas para poder incluirlas en el preventivo.
                </div>
              ) : (
                <div className="olp-pick">
                  {routes.map((r) => {
                    const on = mode === "ALL" || selected.has(r.id);
                    const due = DUE_STATE[r.dueState] || DUE_STATE.NONE;
                    return (
                      <label key={r.id} className={`olp-pick-row ${on ? "is-on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => {
                            if (mode === "ALL") {
                              setMode("PICK");
                              setSelected(new Set(routes.filter((x) => x.id !== r.id).map((x) => x.id)));
                            } else toggle(r.id);
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div className="olp-pick-name">{r.name}</div>
                          <div className="olp-pick-sub">
                            <span>{r.lubricantName || (r.routeKind === "INSPECTION" ? "Inspección" : "Sin lubricante")}</span>
                            {Number(r.quantity) > 0 ? (
                              <span>
                                {qtyText(r.quantity, r.unit)} × {r.points || 1} pto{(r.points || 1) === 1 ? "" : "s"}
                              </span>
                            ) : null}
                            <span>{r.frequencyText}</span>
                            {r.sharedCount > 1 ? <span className="olp-tag is-blue">Compartida · {r.sharedCount} equipos</span> : null}
                            {r.evidenceRequired ? <span className="olp-tag is-amber">Foto obligatoria</span> : null}
                          </div>
                        </div>
                        <div className="olp-pick-right">
                          <span className={`olp-tag ${due.cls}`}>{due.label}</span>
                          <span>Próxima: {fmtDay(r.dueYmd || r.nextDate)}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {chosen.length ? (
            <div className="olp-summary">
              <span>
                <b>{chosen.length}</b> ruta{chosen.length === 1 ? "" : "s"} · <b>{chosen.reduce((s, r) => s + (Number(r.points) || 1), 0)}</b> puntos
              </span>
              {consumptionByUnit.map((c) => (
                <span key={c.name + c.unit}>
                  {c.name}: <b>{qtyText(c.q, c.unit)}</b>
                </span>
              ))}
              {chosen.some((r) => r.sharedCount > 1) ? <span>Las rutas compartidas se registran solo para este equipo y conservan su fecha para los demás.</span> : null}
            </div>
          ) : null}

          <div className="olp-form-grid">
            <label className="olp-field is-full">
              <span>Notas para el técnico (opcional)</span>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ej. El equipo estará bloqueado de 8:00 a 12:00 por mantenimiento." />
            </label>
            <label className="olp-check">
              <input type="checkbox" checked={form.requiresPhoto} onChange={(e) => set("requiresPhoto", e.target.checked)} />
              Pedir foto de evidencia en todas las rutas
            </label>
          </div>

          {error ? <div className="olp-error">{error}</div> : null}
        </div>

        <div className="olp-modal-foot">
          <button type="button" className="tch-btn tch-btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          {!editing || order.status === "DRAFT" ? (
            <button type="button" className="tch-btn tch-btn-ghost" onClick={() => submit(false)} disabled={saving}>
              <Icon name="doc" size="sm" /> Guardar borrador
            </button>
          ) : null}
          <button type="button" className="tch-btn tch-btn-primary" onClick={() => submit(!editing || order.status === "DRAFT")} disabled={saving}>
            <Icon name="check" size="sm" /> {saving ? "Guardando…" : editing && order.status !== "DRAFT" ? "Guardar cambios" : "Guardar y liberar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function initial(order, defaultEquipmentId) {
  return {
    equipmentId: order?.equipmentId ? String(order.equipmentId) : defaultEquipmentId ? String(defaultEquipmentId) : "",
    scheduledDate: ymdOf(order?.scheduledDate) || todayYmdLocal(),
    assignedTo: order?.assignedTo ? String(order.assignedTo) : "",
    title: order?.title || "",
    notes: order?.notes || "",
    requiresPhoto: Boolean(order?.requiresPhoto),
  };
}
