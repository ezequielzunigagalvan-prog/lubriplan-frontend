// src/components/modals/NewTechnicianModal.jsx
import { useEffect, useState } from "react";
import { Icon } from "../ui/lpIcons";
import "../../pages/TechniciansPage.css";
import { prettySpecialty } from "../../utils/technicians";
import { getNextTechnicianCode } from "../../services/techniciansService";

const SPECIALTIES = ["Lubricación", "Mecánico", "Eléctrico", "Instrumentista"];
const OTHER = "__other__";

function initialForm(technician) {
  if (!technician) {
    return {
      name: "",
      code: "",
      specialty: "Lubricación",
      customSpecialty: "",
      status: "Activo",
      email: "",
      phone: "",
      certifications: "",
    };
  }
  const pretty = prettySpecialty(technician.specialty || "Lubricación");
  const known = SPECIALTIES.includes(pretty);
  const isActive = ["ACTIVO", "ACTIVE"].includes(String(technician.status || "").toUpperCase());
  return {
    name: technician.name ?? "",
    code: technician.code ?? "",
    specialty: known ? pretty : OTHER,
    customSpecialty: known ? "" : pretty,
    status: isActive ? "Activo" : "Inactivo",
    email: technician.email ?? "",
    phone: technician.phone ?? "",
    certifications: Array.isArray(technician.certifications) ? technician.certifications.join(", ") : "",
  };
}

export default function NewTechnicianModal({ technician, onClose, onSave }) {
  const isEdit = !!technician?.id;
  const [form, setForm] = useState(() => initialForm(technician));
  const [suggestedCode, setSuggestedCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Código sugerido para altas nuevas (TEC-###). Si falla, el servidor lo genera igual.
  useEffect(() => {
    if (isEdit) return undefined;
    let alive = true;
    getNextTechnicianCode()
      .then((code) => alive && setSuggestedCode(code))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isEdit]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const specialty = form.specialty === OTHER ? form.customSpecialty.trim() : form.specialty;
    const email = form.email.trim();

    if (!form.name.trim()) return setError("El nombre es obligatorio.");
    if (!specialty) return setError("Indica la especialidad.");
    if (isEdit && !form.code.trim()) return setError("El código es obligatorio.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("El correo no es válido.");

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      specialty,
      status: form.status,
      email,
      phone: form.phone.trim(),
      certifications: form.certifications
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      ...(isEdit ? { id: technician.id } : {}),
    };

    setError("");
    try {
      setSaving(true);
      await onSave(payload);
    } catch (ex) {
      setError(ex?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tch-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="tch-modal" role="dialog" aria-modal="true" aria-labelledby="tch-modal-title">
        <div className="tch-modal-head">
          <div>
            <div className="tch-kicker">Personal de lubricación</div>
            <h2 id="tch-modal-title" className="tch-modal-title">{isEdit ? "Editar técnico" : "Nuevo técnico"}</h2>
          </div>
          <button type="button" className="tch-icon-btn" onClick={() => !saving && onClose()} aria-label="Cerrar" disabled={saving}>
            <Icon name="close" size="sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="tch-form">
            <div className="tch-row">
              <div className="tch-field">
                <label htmlFor="tch-name">Nombre completo *</label>
                <input id="tch-name" className="tch-input" value={form.name} onChange={set("name")} maxLength={120} autoFocus required />
              </div>
              <div className="tch-field">
                <label htmlFor="tch-code">
                  Código {isEdit ? "*" : <span>(opcional)</span>}
                </label>
                <input
                  id="tch-code"
                  className="tch-input is-code"
                  value={form.code}
                  onChange={set("code")}
                  maxLength={30}
                  placeholder={isEdit ? "" : suggestedCode ? `${suggestedCode} (automático)` : "Automático"}
                />
                {!isEdit ? <div className="tch-hint">Si lo dejas vacío se asigna el siguiente disponible.</div> : null}
              </div>
            </div>

            <div className="tch-row">
              <div className="tch-field">
                <label htmlFor="tch-specialty">Especialidad *</label>
                <select id="tch-specialty" className="tch-input" value={form.specialty} onChange={set("specialty")}>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value={OTHER}>Otra…</option>
                </select>
              </div>
              <div className="tch-field">
                <label htmlFor="tch-status">Estado</label>
                <select id="tch-status" className="tch-input" value={form.status} onChange={set("status")}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {form.specialty === OTHER ? (
              <div className="tch-field">
                <label htmlFor="tch-custom">¿Cuál especialidad? *</label>
                <input id="tch-custom" className="tch-input" value={form.customSpecialty} onChange={set("customSpecialty")} maxLength={80} placeholder="Ej. Mecánico lubricador" />
              </div>
            ) : null}

            <div className="tch-row">
              <div className="tch-field">
                <label htmlFor="tch-email">Correo <span>(opcional)</span></label>
                <input id="tch-email" type="email" className="tch-input" value={form.email} onChange={set("email")} maxLength={160} placeholder="tecnico@empresa.com" />
              </div>
              <div className="tch-field">
                <label htmlFor="tch-phone">Teléfono <span>(opcional)</span></label>
                <input id="tch-phone" type="tel" className="tch-input" value={form.phone} onChange={set("phone")} maxLength={40} placeholder="55 1234 5678" />
              </div>
            </div>

            <div className="tch-field">
              <label htmlFor="tch-certs">Certificaciones <span>(opcional, separadas por coma)</span></label>
              <input id="tch-certs" className="tch-input" value={form.certifications} onChange={set("certifications")} placeholder="ICML MLT I, Seguridad industrial" />
            </div>

            {error ? <div className="tch-error" role="alert">{error}</div> : null}
          </div>

          <div className="tch-modal-foot">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="tch-btn tch-btn-primary" disabled={saving}>
              {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear técnico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
