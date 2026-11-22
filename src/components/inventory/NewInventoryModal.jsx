// src/components/inventory/NewInventoryModal.jsx
import { useEffect, useState } from "react";
import { Icon } from "../ui/lpIcons";
import { formatCurrency } from "../../utils/inventory";
import "../../pages/TechniciansPage.css";

const LUBRICANT_TYPES = [
  "Aceite hidráulico",
  "Aceite para engranes",
  "Aceite para compresor",
  "Aceite de circulación",
  "Aceite para cadenas",
  "Aceite para unidades neumáticas",
  "Grasa EP",
  "Grasa alta temperatura",
  "Grasa grado alimenticio",
  "Grasa multipropósito",
  "Grasa para motores eléctricos",
  "Grasa para altas velocidades",
  "Otro",
];

const UNITS = [
  ["L", "Litros (L)"],
  ["ml", "Mililitros (ml)"],
  ["kg", "Kilos (kg)"],
  ["g", "Gramos (g)"],
];

// La propiedad se guarda en `viscosity`: "ISO VG 68" o "NLGI 2".
function toPropertyFields(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return { propertyType: "VISCOSIDAD", propertyValue: "" };
  if (v.toUpperCase().startsWith("NLGI")) return { propertyType: "NLGI", propertyValue: v.replace(/^NLGI\s*/i, "").trim() };
  return { propertyType: "VISCOSIDAD", propertyValue: v };
}

function fromPropertyFields(type, value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  return type === "NLGI" ? `NLGI ${v}` : v;
}

const EMPTY = {
  name: "",
  unit: "L",
  brand: "",
  type: "",
  typeDetail: "",
  code: "",
  supplier: "",
  unitCost: "",
  propertyType: "VISCOSIDAD",
  propertyValue: "",
  location: "",
  stock: "",
  minStock: "",
  notes: "",
};

function formFrom(data) {
  if (!data) return EMPTY;
  const prop = toPropertyFields(data.viscosity);
  const knownType = !data.type || LUBRICANT_TYPES.includes(data.type);
  return {
    name: data.name ?? "",
    unit: data.unit ?? "L",
    brand: data.brand ?? "",
    type: knownType ? data.type ?? "" : "Otro",
    typeDetail: knownType ? "" : data.type,
    code: data.code ?? "",
    supplier: data.supplier ?? "",
    unitCost: data.unitCost != null ? String(data.unitCost) : "",
    propertyType: prop.propertyType,
    propertyValue: prop.propertyValue,
    location: data.location ?? "",
    stock: data.stock != null ? String(data.stock) : "",
    minStock: data.minStock != null ? String(data.minStock) : "",
    notes: data.notes ?? "",
  };
}

const num = (v) => (v === "" || v == null ? null : Number(String(v).replace(",", ".")));

export default function NewInventoryModal({ open, onClose, onSave, initialData }) {
  const isEdit = !!initialData?.id;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(formFrom(initialData));
    setError("");
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const stockNum = num(form.stock) ?? 0;
  const minNum = num(form.minStock);
  const costNum = num(form.unitCost);
  const valueEst = Number.isFinite(stockNum) && Number.isFinite(costNum) && costNum != null ? stockNum * costNum : null;
  const isLow = minNum != null && Number.isFinite(minNum) && stockNum <= minNum;
  const stockChanged = isEdit && Number(initialData.stock || 0) !== stockNum;
  const unitChanged = isEdit && (initialData.unit || "L") !== form.unit && Number(initialData.stock || 0) > 0;

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) return setError("Escribe el nombre del lubricante.");
    if (!Number.isFinite(stockNum) || stockNum < 0) return setError("El stock no es válido.");
    if (minNum !== null && (!Number.isFinite(minNum) || minNum < 0)) return setError("El stock mínimo no es válido.");
    if (costNum !== null && (!Number.isFinite(costNum) || costNum < 0)) return setError("El costo unitario no es válido.");

    const finalType = form.type === "Otro" ? form.typeDetail.trim() || "Otro" : form.type.trim() || null;

    const payload = {
      name: form.name.trim(),
      unit: form.unit || "L",
      brand: form.brand.trim() || null,
      type: finalType,
      code: form.code.trim() || null,
      supplier: form.supplier.trim() || null,
      unitCost: costNum,
      viscosity: fromPropertyFields(form.propertyType, form.propertyValue),
      location: form.location.trim() || null,
      stock: stockNum,
      minStock: minNum,
      notes: form.notes.trim() || null,
    };

    setError("");
    setSaving(true);
    try {
      // La página cierra el formulario solo si se guardó; si falla, los datos se conservan.
      await onSave(payload);
    } catch (ex) {
      setError(ex?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tch-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="tch-modal" style={{ maxWidth: 680 }} role="dialog" aria-modal="true" aria-labelledby="inv-modal-title">
        <div className="tch-modal-head">
          <div>
            <div className="tch-kicker">Inventario · lubricante</div>
            <h2 id="inv-modal-title" className="tch-modal-title">{isEdit ? "Editar lubricante" : "Nuevo lubricante"}</h2>
          </div>
          <button type="button" className="tch-icon-btn" onClick={() => !saving && onClose()} aria-label="Cerrar" disabled={saving}>
            <Icon name="close" size="sm" />
          </button>
        </div>

        <form onSubmit={handleSave} noValidate>
          <div className="tch-form">
            <div className="tch-field">
              <label htmlFor="inv-name">Nombre *</label>
              <input id="inv-name" className="tch-input" value={form.name} onChange={set("name")} placeholder="Ej. Mobil DTE 25" maxLength={120} autoFocus />
            </div>

            <div className="tch-row">
              <div className="tch-field">
                <label htmlFor="inv-type">Tipo</label>
                <select id="inv-type" className="tch-input" value={form.type} onChange={set("type")}>
                  <option value="">Seleccionar</option>
                  {LUBRICANT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="tch-field">
                <label htmlFor="inv-prop">Propiedad</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select className="tch-input" style={{ width: 130, flexShrink: 0 }} value={form.propertyType} onChange={set("propertyType")} aria-label="Tipo de propiedad">
                    <option value="VISCOSIDAD">Viscosidad</option>
                    <option value="NLGI">NLGI</option>
                  </select>
                  <input id="inv-prop" className="tch-input" value={form.propertyValue} onChange={set("propertyValue")} placeholder={form.propertyType === "NLGI" ? "Ej. 2" : "Ej. ISO VG 46"} />
                </div>
              </div>
            </div>

            {form.type === "Otro" ? (
              <div className="tch-field">
                <label htmlFor="inv-type-other">¿Qué tipo?</label>
                <input id="inv-type-other" className="tch-input" value={form.typeDetail} onChange={set("typeDetail")} placeholder="Ej. Aceite dieléctrico" />
              </div>
            ) : null}

            <div className="tch-row">
              <div className="tch-field">
                <label htmlFor="inv-brand">Marca <span>(opcional)</span></label>
                <input id="inv-brand" className="tch-input" value={form.brand} onChange={set("brand")} placeholder="Ej. Mobil" />
              </div>
              <div className="tch-field">
                <label htmlFor="inv-code">Código <span>(opcional)</span></label>
                <input id="inv-code" className="tch-input is-code" value={form.code} onChange={set("code")} placeholder="Ej. SH-GS2-220" />
              </div>
            </div>

            <div className="tch-row">
              <div className="tch-field">
                <label htmlFor="inv-unit">Unidad de inventario *</label>
                <select id="inv-unit" className="tch-input" value={form.unit} onChange={set("unit")}>
                  {UNITS.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                {unitChanged ? (
                  <div className="tch-hint" style={{ color: "#b45309" }}>
                    Cambiar la unidad no convierte el stock: revisa que la cantidad corresponda a la nueva unidad.
                  </div>
                ) : null}
              </div>
              <div className="tch-field">
                <label htmlFor="inv-location">Ubicación <span>(opcional)</span></label>
                <input id="inv-location" className="tch-input" value={form.location} onChange={set("location")} placeholder="Ej. Almacén A · Estante 2" />
              </div>
            </div>

            <div className="tch-row">
              <div className="tch-field">
                <label htmlFor="inv-stock">{isEdit ? "Stock actual" : "Stock inicial"} <span>({form.unit})</span></label>
                <input id="inv-stock" className="tch-input" value={form.stock} onChange={set("stock")} inputMode="decimal" placeholder="Ej. 50" />
                {stockChanged ? (
                  <div className="tch-hint">El cambio quedará registrado como ajuste en el historial.</div>
                ) : null}
              </div>
              <div className="tch-field">
                <label htmlFor="inv-min">Stock mínimo <span>(alerta)</span></label>
                <input id="inv-min" className="tch-input" value={form.minStock} onChange={set("minStock")} inputMode="decimal" placeholder="Ej. 10" />
                <div className="tch-hint">Al llegar a este nivel se avisa a supervisores.</div>
              </div>
            </div>

            {isLow ? (
              <div className="tch-error" style={{ color: "#b45309", background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.35)" }}>
                El stock está en o por debajo del mínimo.
              </div>
            ) : null}

            <div className="tch-row">
              <div className="tch-field">
                <label htmlFor="inv-supplier">Proveedor <span>(opcional)</span></label>
                <input id="inv-supplier" className="tch-input" value={form.supplier} onChange={set("supplier")} />
              </div>
              <div className="tch-field">
                <label htmlFor="inv-cost">Costo por {form.unit} <span>(opcional)</span></label>
                <input id="inv-cost" className="tch-input" value={form.unitCost} onChange={set("unitCost")} inputMode="decimal" placeholder="Ej. 85.50" />
                {valueEst != null ? <div className="tch-hint">Valor en inventario: {formatCurrency(valueEst)}</div> : null}
              </div>
            </div>

            <div className="tch-field">
              <label htmlFor="inv-notes">Notas <span>(opcional)</span></label>
              <textarea id="inv-notes" className="tch-input" style={{ height: "auto", minHeight: 72, padding: "10px 12px", resize: "vertical" }} value={form.notes} onChange={set("notes")} placeholder="Compatibilidad, lote, fecha de compra…" />
            </div>

            {error ? <div className="tch-error" role="alert">{error}</div> : null}
          </div>

          <div className="tch-modal-foot">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="tch-btn tch-btn-primary" disabled={saving}>
              {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear lubricante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
