// src/components/actionPlan/ActionItemForm.jsx
// Alta de un pendiente. El admin elige responsable; el supervisor queda como responsable.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../ui/lpIcons";
import { createActionItem } from "../../services/actionPlanService";
import { getEquipment } from "../../services/equipmentService";
import { CATEGORY, CATEGORY_ORDER, PRIORITY, todayYmd } from "./actionPlanUi";

const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

export default function ActionItemForm({ category, admin, assignees = [], currentUser, onClose, onSaved }) {
  const today = todayYmd();
  const [form, setForm] = useState({
    category,
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: addDays(today, 7),
    ownerUserId: admin ? "" : String(currentUser?.id || ""),
    equipmentId: "",
  });
  const [equipments, setEquipments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getEquipment()
      .then((r) => setEquipments(Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : []))
      .catch(() => setEquipments([]));
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cat = CATEGORY[form.category];

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const r = await createActionItem({
        ...form,
        ownerUserId: admin ? Number(form.ownerUserId) || null : undefined,
        equipmentId: form.equipmentId ? Number(form.equipmentId) : null,
      });
      toast.success("Pendiente agregado");
      onSaved?.(r?.item);
    } catch (err) {
      setError(err?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ap-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="ap-modal" onSubmit={save} style={{ "--cat": cat.color }}>
        <div className="ap-modal-head">
          <div>
            <div className="ap-kicker">NUEVO PENDIENTE</div>
            <div className="ap-modal-title">Agregar pendiente</div>
          </div>
          <button type="button" className="ap-x" onClick={onClose} disabled={saving} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="ap-modal-body">
          <div className="ap-label">Grupo</div>
          <div className="ap-cats">
            {CATEGORY_ORDER.map((k) => (
              <button
                key={k}
                type="button"
                className={`ap-cat ${form.category === k ? "is-on" : ""}`}
                style={{ "--cat": CATEGORY[k].color }}
                onClick={() => setForm((f) => ({ ...f, category: k }))}
              >
                <Icon name={CATEGORY[k].icon} size="sm" /> {CATEGORY[k].label}
              </button>
            ))}
          </div>

          <label className="ap-label">
            Pendiente *
            <input className="ap-input" value={form.title} onChange={set("title")} placeholder="Ej. Instalar guardas en el transportador 3" autoFocus maxLength={160} />
          </label>
          <label className="ap-label">
            Descripción
            <textarea className="ap-input" rows={3} value={form.description} onChange={set("description")} placeholder="Qué se debe hacer y cómo se considera terminado" />
          </label>

          <div className="ap-row">
            <label className="ap-label">
              Fecha de ejecución *
              <input className="ap-input" type="date" min={today} value={form.dueDate} onChange={set("dueDate")} />
            </label>
            <label className="ap-label">
              Prioridad
              <select className="ap-input" value={form.priority} onChange={set("priority")}>
                {Object.entries(PRIORITY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="ap-chips">
            {[
              ["Mañana", 1],
              ["En 1 semana", 7],
              ["En 15 días", 15],
              ["En 1 mes", 30],
            ].map(([l, n]) => (
              <button key={l} type="button" className={`ap-chip ${form.dueDate === addDays(today, n) ? "is-on" : ""}`} onClick={() => setForm((f) => ({ ...f, dueDate: addDays(today, n) }))}>
                {l}
              </button>
            ))}
          </div>

          <div className="ap-row">
            <label className="ap-label">
              Responsable *
              {admin ? (
                <select className="ap-input" value={form.ownerUserId} onChange={set("ownerUserId")}>
                  <option value="">Elegir supervisor o administrador</option>
                  {assignees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.role === "ADMIN" ? "Administrador" : "Supervisor"}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="ap-input" value={`${currentUser?.name || "Yo"} (tú)`} disabled />
              )}
            </label>
            <label className="ap-label">
              Equipo (opcional)
              <select className="ap-input" value={form.equipmentId} onChange={set("equipmentId")}>
                <option value="">Sin equipo</option>
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                    {eq.code ? ` · ${eq.code}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <div className="ap-error">{error}</div> : null}
        </div>
        <div className="ap-modal-foot">
          <button type="button" className="ap-btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="ap-btn is-primary" disabled={saving}>
            <Icon name="plus" size="sm" /> {saving ? "Guardando…" : "Agregar pendiente"}
          </button>
        </div>
      </form>
    </div>
  );
}
