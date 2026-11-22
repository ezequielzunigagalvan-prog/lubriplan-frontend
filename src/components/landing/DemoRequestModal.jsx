// Formulario «Solicitar demo» en ventana emergente.
// Envía los datos al backend (/landing/lead); el servidor decide a qué correo avisar,
// así que el visitante nunca ve el destinatario.
import { useCallback, useEffect, useRef, useState } from "react";
import { submitLandingLead } from "../../services/landingLeadsService";
import { Icon } from "../ui/lpIcons";
import "./DemoRequestModal.css";

const EMPTY = { nombre: "", empresa: "", email: "", telefono: "", website: "" };

// Textos por producto. LubriPlan Card pide nombre, empresa y teléfono (correo opcional).
const COPY = {
  landing: {
    label: "Solicitar demo",
    title: "Agenda una demo de LubriPlan",
    text: "Déjanos tus datos y te contactamos para mostrarte la plataforma con el caso de tu planta.",
    done: "Gracias por tu interés en LubriPlan. Nos pondremos en contacto contigo a la brevedad para agendar tu demo.",
    required: "Nombre, correo y teléfono son obligatorios.",
  },
  card: {
    label: "Solicitar información",
    title: "Recibe información de LubriPlan Card",
    text: "La propuesta depende del número de equipos y de tu operación. Déjanos tus datos y te contactamos.",
    done: "Gracias por tu interés en LubriPlan Card. Nos pondremos en contacto contigo a la brevedad.",
    required: "Nombre, empresa y teléfono son obligatorios.",
  },
};

export default function DemoRequestModal({ open, onClose, source = "landing" }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const firstFieldRef = useRef(null);

  // Al cerrar se limpia el estado para que la siguiente apertura empiece de cero.
  const handleClose = useCallback(() => {
    setStatus("idle");
    setError("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
    const onKey = (e) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, handleClose]);

  if (!open) return null;

  const isCard = source === "card";
  const copy = isCard ? COPY.card : COPY.landing;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const missing = !form.nombre.trim() || !form.telefono.trim() || (isCard ? !form.empresa.trim() : !form.email.trim());
    if (missing) {
      setError(copy.required);
      return;
    }
    setStatus("sending");
    setError("");
    try {
      await submitLandingLead({ ...form, source, origin: "form" });
      setStatus("done");
      setForm(EMPTY);
    } catch (ex) {
      setStatus("idle");
      setError(ex?.message || "No pudimos enviar tu solicitud. Intenta de nuevo.");
    }
  };

  return (
    <div className="lpdm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="lpdm" role="dialog" aria-modal="true" aria-labelledby="lpdm-title">
        <div className="lpdm-hazard" />
        <button type="button" className="lpdm-close" onClick={handleClose} aria-label="Cerrar">
          <Icon name="close" size="sm" />
        </button>

        {status === "done" ? (
          <div className="lpdm-done">
            <div className="lpdm-done-icon"><Icon name="checkCircle" size="xl" /></div>
            <h2 id="lpdm-title" className="lpdm-title">¡Solicitud recibida!</h2>
            <p className="lpdm-text">{copy.done}</p>
            <button type="button" className="lpdm-submit" onClick={handleClose}>Cerrar</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="lpdm-label">{copy.label}</div>
            <h2 id="lpdm-title" className="lpdm-title">{copy.title}</h2>
            <p className="lpdm-text">{copy.text}</p>

            <div className="lpdm-grid">
              <label className="lpdm-field">
                <span>{isCard ? "Nombre *" : "Nombre completo *"}</span>
                <input ref={firstFieldRef} value={form.nombre} onChange={set("nombre")} autoComplete="name" maxLength={120} required />
              </label>
              <label className="lpdm-field">
                <span>{isCard ? "Nombre de la empresa *" : "Empresa"}</span>
                <input value={form.empresa} onChange={set("empresa")} autoComplete="organization" maxLength={160} required={isCard} />
              </label>
              <label className="lpdm-field" style={isCard ? { order: 1 } : undefined}>
                <span>{isCard ? "Correo electrónico (opcional)" : "Correo electrónico *"}</span>
                <input type="email" value={form.email} onChange={set("email")} autoComplete="email" maxLength={160} required={!isCard} />
              </label>
              <label className="lpdm-field">
                <span>{isCard ? "Número de teléfono *" : "Teléfono *"}</span>
                <input type="tel" value={form.telefono} onChange={set("telefono")} autoComplete="tel" maxLength={40} required />
              </label>
            </div>

            {/* Campo trampa para bots: oculto para personas */}
            <input
              className="lpdm-trap"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.website}
              onChange={set("website")}
              name="website"
            />

            {error && <div className="lpdm-error" role="alert">{error}</div>}

            <button type="submit" className="lpdm-submit" disabled={status === "sending"}>
              {status === "sending" ? "Enviando…" : "Enviar solicitud"}
            </button>
            <p className="lpdm-privacy">Usaremos tus datos solo para contactarte sobre LubriPlan.</p>
          </form>
        )}
      </div>
    </div>
  );
}
