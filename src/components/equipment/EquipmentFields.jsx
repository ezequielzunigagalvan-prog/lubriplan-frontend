// src/components/equipment/EquipmentFields.jsx
import { CRITICALITIES, critLabel } from "../../utils/equipment";

/** Campos del equipo; también los usa la pantalla de edición. */
export default function EquipmentFields({ form, set, areas }) {
  return (
    <div className="tch-form">
      <div className="tch-row">
        <div className="tch-field">
          <label htmlFor="eq-name">Nombre *</label>
          <input id="eq-name" className="tch-input" value={form.name} onChange={set("name")} maxLength={120} placeholder="Ej. Compresor de tornillo 2" autoFocus />
        </div>
        <div className="tch-field">
          <label htmlFor="eq-code">Código / TAG <span>(opcional)</span></label>
          <input id="eq-code" className="tch-input is-code" value={form.code} onChange={set("code")} maxLength={40} placeholder="Ej. CMP-002" />
        </div>
      </div>
      <div className="tch-row">
        <div className="tch-field">
          <label htmlFor="eq-area">Área</label>
          <select id="eq-area" className="tch-input" value={form.areaId} onChange={set("areaId")}>
            <option value="">Sin área</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="tch-field">
          <label htmlFor="eq-location">Ubicación *</label>
          <input id="eq-location" className="tch-input" value={form.location} onChange={set("location")} maxLength={120} placeholder="Ej. Nave 1, línea 3" />
        </div>
      </div>
      <div className="tch-row">
        <div className="tch-field">
          <label htmlFor="eq-crit">Criticidad</label>
          <select id="eq-crit" className="tch-input" value={form.criticality} onChange={set("criticality")}>
            {CRITICALITIES.map((c) => (
              <option key={c} value={c}>{critLabel(c)}</option>
            ))}
          </select>
        </div>
        <div className="tch-field">
          <label htmlFor="eq-status">Estado</label>
          <select id="eq-status" className="tch-input" value={form.status} onChange={set("status")}>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>
      <div className="tch-row">
        <div className="tch-field">
          <label htmlFor="eq-brand">Marca <span>(opcional)</span></label>
          <input id="eq-brand" className="tch-input" value={form.brand} onChange={set("brand")} maxLength={80} placeholder="Ej. Kaeser" />
        </div>
        <div className="tch-field">
          <label htmlFor="eq-model">Modelo <span>(opcional)</span></label>
          <input id="eq-model" className="tch-input" value={form.model} onChange={set("model")} maxLength={80} placeholder="Ej. SK-19" />
        </div>
      </div>
      <div className="tch-field">
        <label htmlFor="eq-desc">Descripción <span>(opcional)</span></label>
        <textarea id="eq-desc" className="tch-input" style={{ height: "auto", minHeight: 70, padding: "10px 12px", resize: "vertical" }} value={form.description} onChange={set("description")} maxLength={1000} />
      </div>
    </div>
  );
}
