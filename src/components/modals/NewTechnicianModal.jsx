import { useEffect, useMemo, useState } from "react";

export default function NewTechnicianModal({ technician, onClose, onSave }) {
  const initial = useMemo(
    () => ({
      name: "",
      code: "",
      specialty: "Lubricación",
      status: "Activo",
    }),
    []
  );

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  // UI-only focus states (no rompe nada)
  const [focus, setFocus] = useState({
    name: false,
    code: false,
    specialty: false,
    status: false,
  });

  useEffect(() => {
    if (technician) {
      setForm({
        name: technician.name ?? "",
        code: technician.code ?? "",
        specialty: technician.specialty ?? "Lubricación",
        status: technician.status ?? "Activo",
      });
    } else {
      setForm(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technician]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = technician?.id ? { ...form, id: technician.id } : form;

    try {
      setSaving(true);
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const title = technician ? "Editar técnico" : "Nuevo técnico";
  const primaryLabel = saving ? "Guardando..." : technician ? "Guardar" : "Crear";

  return (
    <div style={overlay} onClick={() => (!saving ? onClose() : null)}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={modalHeader}>
          <div style={{ minWidth: 0 }}>
            <div style={modalKicker}>LUBRIPLAN · TÉCNICOS</div>
            <div style={modalTitle}>{title}</div>
            <div style={modalSub}>
              Captura la información del técnico para asignaciones y operación.
            </div>
          </div>

          <button
            onClick={() => (!saving ? onClose() : null)}
            style={xBtn(saving)}
            aria-label="Cerrar"
            title="Cerrar"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={field}>
            <label style={label}>Nombre</label>
            <input
              style={input(focus.name)}
              placeholder="Nombre completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => setFocus((p) => ({ ...p, name: true }))}
              onBlur={() => setFocus((p) => ({ ...p, name: false }))}
              required
              autoFocus
            />
          </div>

          <div style={field}>
            <label style={label}>Código</label>
            <input
              style={input(focus.code)}
              placeholder="Ej. TEC-001"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              onFocus={() => setFocus((p) => ({ ...p, code: true }))}
              onBlur={() => setFocus((p) => ({ ...p, code: false }))}
              required
            />
            <small style={hint}>
              Tip: usa un patrón (TEC-001, TEC-002…). Esto ayuda a búsquedas rápidas.
            </small>
          </div>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Especialidad</label>
              <select
                style={input(focus.specialty)}
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                onFocus={() => setFocus((p) => ({ ...p, specialty: true }))}
                onBlur={() => setFocus((p) => ({ ...p, specialty: false }))}
                required
              >
                <option value="Lubricación">Lubricación</option>
                <option value="Mecánico">Mecánico</option>
                <option value="Eléctrico">Eléctrico</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Estado</label>
              <select
                style={input(focus.status)}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                onFocus={() => setFocus((p) => ({ ...p, status: true }))}
                onBlur={() => setFocus((p) => ({ ...p, status: false }))}
                required
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div style={actions}>
            <button
              type="button"
              onClick={() => (!saving ? onClose() : null)}
              style={btnSecondary(saving)}
              disabled={saving}
            >
              Cancelar
            </button>

            <button type="submit" style={btnPrimary(saving)} disabled={saving}>
              {primaryLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== styles (industrial/pro) ===== */

const overlay = {
  position: "fixed",
  inset: 0,
  background:
    "radial-gradient(1200px 800px at 20% 10%, rgba(255,255,255,0.10), rgba(15,23,42,0.58))",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  padding: 16,
};

const modal = {
  background: "rgba(255,255,255,0.92)",
  width: 560,
  maxWidth: "100%",
  borderRadius: 18,
  padding: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.28)",
  backdropFilter: "blur(10px)",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  paddingBottom: 12,
  borderBottom: "1px solid rgba(226,232,240,0.75)",
};

const modalKicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 1.2,
};

const modalTitle = {
  marginTop: 6,
  fontWeight: 1000,
  color: "#0f172a",
  letterSpacing: 0.3,
  fontSize: 18,
};

const modalSub = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const xBtn = (disabled) => ({
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 12,
  width: 38,
  height: 38,
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 950,
  color: "#0f172a",
  display: "grid",
  placeItems: "center",
  opacity: disabled ? 0.6 : 1,
});

const formStyle = {
  marginTop: 14,
  display: "grid",
  gap: 12,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const field = { display: "grid", gap: 6 };

const label = {
  fontSize: 12,
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

const input = (isFocus) => ({
  padding: "11px 12px",
  borderRadius: 14,
  border: `1px solid ${isFocus ? "rgba(249,115,22,0.60)" : "rgba(226,232,240,0.95)"}`,
  outline: "none",
  fontWeight: 850,
  background: "rgba(255,255,255,0.95)",
  boxShadow: isFocus
    ? "0 0 0 4px rgba(249,115,22,0.14)"
    : "inset 0 1px 0 rgba(2,6,23,0.04)",
  transition: "box-shadow 120ms ease, border-color 120ms ease",
});

const hint = {
  marginTop: 2,
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
};

const actions = {
  marginTop: 6,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  paddingTop: 12,
  borderTop: "1px solid rgba(226,232,240,0.75)",
};

const btnSecondary = (disabled) => ({
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: "10px 14px",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 900,
  color: "#0f172a",
  opacity: disabled ? 0.65 : 1,
});

const btnPrimary = (disabled) => ({
  background: "linear-gradient(180deg, #fb923c 0%, #f97316 100%)",
  color: "#0b1220",
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(251,146,60,0.95)",
  fontWeight: 1000,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: "0 12px 24px rgba(249,115,22,0.22)",
  opacity: disabled ? 0.7 : 1,
});

/* Responsive sin CSS: si quieres 1 columna en pantallas chicas:
   esto lo dejamos así por ahora para no meter window listeners.
   Si te interesa, lo hacemos con un hook de media query seguro. */
