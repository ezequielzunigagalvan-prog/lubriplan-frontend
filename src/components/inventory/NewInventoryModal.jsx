// src/components/inventory/NewInventoryModal.jsx
import { useState, useEffect, useRef } from "react";

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

const PROPERTY_OPTIONS = [
  { value: "VISCOSIDAD", label: "Viscosidad" },
  { value: "NLGI", label: "NLGI" },
];

function toPropertyFields(viscosityRaw) {
  const raw = String(viscosityRaw ?? "").trim();
  if (!raw) return { propertyType: "VISCOSIDAD", propertyValue: "" };

  const up = raw.toUpperCase();
  if (up.startsWith("NLGI")) {
    return { propertyType: "NLGI", propertyValue: raw.replace(/^NLGI\s*/i, "").trim() };
  }
  return { propertyType: "VISCOSIDAD", propertyValue: raw };
}

function fromPropertyFields(propertyType, propertyValue) {
  const v = String(propertyValue ?? "").trim();
  if (!v) return null;
  return propertyType === "NLGI" ? `NLGI ${v}` : v;
}

/* =========================
   Field (con subrayado activo)
========================= */
function Field({ label, hint, children, active }) {
  return (
    <div
      style={{
        ...fieldWrap,
        borderBottom: active
          ? "2px solid rgba(249,115,22,0.95)"
          : "1px solid rgba(226,232,240,0.95)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>
          {label}
        </label>

        {hint && (
          <span title={hint} style={infoDot}>
            ℹ️
          </span>
        )}
      </div>

      {children}

      {hint && <div style={hintText}>{hint}</div>}
    </div>
  );
}

const fieldWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  paddingBottom: 10,
  transition: "border-color 160ms ease, border-bottom 160ms ease",
};

const infoDot = { fontSize: 12, cursor: "help", opacity: 0.75 };

const hintText = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.3,
  marginTop: -2,
};

export default function NewInventoryModal({ open, onClose, onSave, initialData }) {
  const initialState = {
    name: "",
    unit: "L",
    brand: "",
    type: "",
    typeDetail: "",

    code: "",
    supplier: "",
    unitCost: "",

    // ✅ nuevos (UI)
    propertyType: "VISCOSIDAD",
    propertyValue: "",

    location: "",
    stock: "",
    minStock: "",
    notes: "",
  };

  const [form, setForm] = useState(initialState);

  // underline active row
  const [focusKey, setFocusKey] = useState("");
  const blurT = useRef(null);

  const onFieldFocus = (key) => {
    if (blurT.current) window.clearTimeout(blurT.current);
    setFocusKey(key);
  };
  const onFieldBlur = () => {
    if (blurT.current) window.clearTimeout(blurT.current);
    blurT.current = window.setTimeout(() => setFocusKey(""), 0);
  };

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      const prop = toPropertyFields(initialData?.viscosity);

      setForm({
        name: initialData?.name ?? "",
        unit: initialData?.unit ?? "L",
        brand: initialData?.brand ?? "",
        type: initialData?.type ?? "",
        typeDetail: initialData?.typeDetail ?? "",

        code: initialData?.code ?? "",
        supplier: initialData?.supplier ?? "",
        unitCost: initialData?.unitCost != null ? String(initialData.unitCost) : "",

        propertyType: prop.propertyType,
        propertyValue: prop.propertyValue,

        location: initialData?.location ?? "",
        stock: initialData?.stock != null ? String(initialData.stock) : "",
        minStock: initialData?.minStock != null ? String(initialData.minStock) : "",
        notes: initialData?.notes ?? "",
      });
    } else {
      setForm(initialState);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id]);

  useEffect(() => {
    if (!open) setFocusKey("");
  }, [open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const stockNum = form.stock === "" ? 0 : Number(form.stock);
  const unitCostNum = form.unitCost === "" ? null : Number(form.unitCost);
  const valueEst =
    Number.isFinite(stockNum) &&
    Number.isFinite(unitCostNum) &&
    unitCostNum != null
      ? stockNum * unitCostNum
      : null;

  const handleSave = () => {
    if (!String(form.name ?? "").trim()) return alert("Falta el nombre del producto.");

    const stock = form.stock === "" ? 0 : Number(form.stock);
    if (!Number.isFinite(stock) || stock < 0) return alert("Stock inválido.");

    const minNum = form.minStock === "" ? null : Number(form.minStock);
    if (minNum !== null && (!Number.isFinite(minNum) || minNum < 0)) {
      return alert("Stock mínimo inválido.");
    }

    const unitCost = form.unitCost === "" ? null : Number(form.unitCost);
    if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) {
      return alert("Costo unitario inválido.");
    }

    const finalType =
      form.type === "Otro"
        ? String(form.typeDetail ?? "").trim() || "Otro"
        : String(form.type ?? "").trim() || null;

    const viscosityFinal = fromPropertyFields(form.propertyType, form.propertyValue);

    const payload = {
      name: String(form.name ?? "").trim(),
      unit: form.unit || "L",
      brand: String(form.brand ?? "").trim() || null,
      type: finalType,

      code: String(form.code ?? "").trim() || null,
      supplier: String(form.supplier ?? "").trim() || null,
      unitCost: unitCost,

      // ✅ backend: seguimos usando "viscosity"
      viscosity: viscosityFinal,

      location: String(form.location ?? "").trim() || null,
      stock: stock,
      minStock: minNum,
      notes: String(form.notes ?? "").trim() || null,
    };

    onSave(payload);
    onClose();
  };

  const isLowStock =
    form.stock !== "" &&
    form.minStock !== "" &&
    Number(form.stock) <= Number(form.minStock);

  return (
    <div style={overlay}>
      {/* ✅ Animación de “brillo” (solo OK) */}
      

      <div style={modal}>
        <h2 style={{ margin: 0 }}>
          {initialData ? "Editar producto" : "Nuevo producto"}
        </h2>

        <div style={modalBody}>
          <Field label="Nombre *" active={focusKey === "name"}>
            <input
              placeholder="Ej: Mobil DTE 25 Hydraulic Oil"
              name="name"
              value={form.name ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("name")}
              onBlur={onFieldBlur}
              style={input}
            />
          </Field>

          <Field label="Unidad base *" active={focusKey === "unit"}>
            <select
              name="unit"
              value={form.unit ?? "L"}
              onChange={handleChange}
              onFocus={() => onFieldFocus("unit")}
              onBlur={onFieldBlur}
              style={input}
            >
              <option value="L">Litros (L)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="kg">Kilos (kg)</option>
              <option value="g">Gramos (g)</option>
            </select>
          </Field>

          <Field
            label="Código (opcional)"
            hint="Identificador interno. Ej: SH-GS2-220"
            active={focusKey === "code"}
          >
            <input
              name="code"
              value={form.code ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("code")}
              onBlur={onFieldBlur}
              style={input}
            />
          </Field>

          <Field
            label="Proveedor (opcional)"
            hint="Proveedor habitual de compra."
            active={focusKey === "supplier"}
          >
            <input
              name="supplier"
              value={form.supplier ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("supplier")}
              onBlur={onFieldBlur}
              style={input}
            />
          </Field>

          <Field
            label="Costo unitario (opcional)"
            hint="Costo por unidad base (ej: $/kg o $/L)."
            active={focusKey === "unitCost"}
          >
            <input
              type="number"
              name="unitCost"
              value={form.unitCost ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("unitCost")}
              onBlur={onFieldBlur}
              style={input}
              min="0"
              step="0.01"
              inputMode="decimal"
            />
          </Field>

          {/* ✅ Valor estimado (nuevo) */}
          <Field
            label="Valor estimado (calculado)"
            hint="Se calcula como stock × costo unitario."
            active={focusKey === "valueEst"}
          >
            <div style={{ position: "relative" }}>
              {/* Brillo SOLO si es OK: tiene stock y NO está bajo mínimo */}
              

              <input
                value={
                  valueEst == null
                    ? "—"
                    : valueEst.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                }
                readOnly
                onFocus={() => onFieldFocus("valueEst")}
                onBlur={onFieldBlur}
                style={{
                  ...input,
                  background: "#f8fafc",
                  fontWeight: 900,
                  color: "#0f172a",
                  position: "relative",
                  zIndex: 1,
                }}
              />
            </div>
          </Field>

          <Field label="Marca (opcional)" active={focusKey === "brand"}>
            <input
              placeholder="Ej: Mobil"
              name="brand"
              value={form.brand ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("brand")}
              onBlur={onFieldBlur}
              style={input}
            />
          </Field>

          <Field
            label="Tipo (opcional)"
            hint="Clasificación del lubricante. Puedes elegir uno sugerido o usar 'Otro'."
            active={focusKey === "type"}
          >
            <select
              name="type"
              value={form.type ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setForm((p) => ({
                  ...p,
                  type: v,
                  typeDetail: v === "Otro" ? p.typeDetail : "",
                }));
              }}
              onFocus={() => onFieldFocus("type")}
              onBlur={onFieldBlur}
              style={input}
            >
              <option value="">Seleccionar</option>
              {LUBRICANT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {form.type === "Otro" && (
              <input
                placeholder="Especifica el tipo (opcional)"
                name="typeDetail"
                value={form.typeDetail ?? ""}
                onChange={handleChange}
                onFocus={() => onFieldFocus("type")}
                onBlur={onFieldBlur}
                style={input}
              />
            )}
          </Field>

          {/* ✅ Propiedades (reemplaza viscosidad) */}
          <Field
            label="Propiedades (opcional)"
            hint="Para aceites: ISO VG 32/46/68. Para grasas: NLGI 1/2/3 (si aplica)."
            active={focusKey === "property"}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                name="propertyType"
                value={form.propertyType}
                onChange={handleChange}
                onFocus={() => onFieldFocus("property")}
                onBlur={onFieldBlur}
                style={{ ...input, minWidth: 170 }}
              >
                {PROPERTY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <input
                name="propertyValue"
                value={form.propertyValue ?? ""}
                onChange={handleChange}
                onFocus={() => onFieldFocus("property")}
                onBlur={onFieldBlur}
                placeholder={form.propertyType === "NLGI" ? "Ej: 2" : "Ej: ISO VG 46"}
                style={{ ...input, flex: 1, minWidth: 190 }}
              />
            </div>
          </Field>

          <Field
            label="Ubicación (opcional)"
            hint="Dónde está guardado en almacén. Ej: Almacén A - Estante 2."
            active={focusKey === "location"}
          >
            <input
              placeholder="Ej: Almacén A - Estante 2"
              name="location"
              value={form.location ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("location")}
              onBlur={onFieldBlur}
              style={input}
            />
          </Field>

          <Field
            label="Stock actual"
            hint="Cantidad disponible en la unidad base."
            active={focusKey === "stock"}
          >
            <input
              type="number"
              placeholder="Ej: 50"
              name="stock"
              value={form.stock ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("stock")}
              onBlur={onFieldBlur}
              style={input}
              min="0"
              step="0.01"
              inputMode="decimal"
            />
          </Field>

          <Field
            label="Stock mínimo (alerta)"
            hint="Cuando el stock sea menor o igual a este valor, se marca como stock bajo."
            active={focusKey === "minStock"}
          >
            <input
              type="number"
              placeholder="Ej: 10"
              name="minStock"
              value={form.minStock ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("minStock")}
              onBlur={onFieldBlur}
              style={input}
              min="0"
              step="0.01"
              inputMode="decimal"
            />
          </Field>

          {isLowStock && (
            <div style={lowStockBox}>
              ⚠ Stock bajo: el stock actual está por debajo (o igual) al mínimo.
            </div>
          )}

          <Field
            label="Notas (opcional)"
            hint="Cualquier comentario: proveedor, compatibilidad, lote, fecha de compra, etc."
            active={focusKey === "notes"}
          >
            <textarea
              placeholder="Ej: Compatible con X, proveedor Y, lote Z..."
              name="notes"
              value={form.notes ?? ""}
              onChange={handleChange}
              onFocus={() => onFieldFocus("notes")}
              onBlur={onFieldBlur}
              rows={4}
              style={{ ...input, resize: "vertical" }}
            />
          </Field>
        </div>

        <div style={actions}>
          <button onClick={onClose} style={btnGhost}>
            Cancelar
          </button>
          <button style={primaryBtn} onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modal = {
  background: "#fff",
  padding: 20,
  width: 460,
  maxWidth: "92vw",
  borderRadius: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 18px 34px rgba(15,23,42,0.18)",
};

const modalBody = {
  display: "grid",
  gap: 12,
  maxHeight: "70vh",
  overflowY: "auto",
  paddingRight: 6,
};

const input = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  outline: "none",
  fontWeight: 850,
  color: "#0f172a",
  background: "rgba(255,255,255,0.95)",
};

const actions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};

const btnGhost = {
  background: "transparent",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 900,
  color: "#0f172a",
};

const primaryBtn = {
  background: "#f97316",
  color: "#0b1220",
  border: "1px solid #fb923c",
  padding: "8px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 10px 22px rgba(249,115,22,0.22)",
};

const lowStockBox = {
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
  padding: 10,
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 900,
};

