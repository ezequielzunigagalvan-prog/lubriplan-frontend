// src/components/activities/TechnicianSelect.jsx
// Selector de técnico para actividades. Para supervisor/admin agrega la opción
// "Técnico de otra planta…": elige a alguien de otra planta y se le crea (o reutiliza)
// su perfil en esta planta; la actividad queda asignada a ese perfil.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Icon } from "../ui/lpIcons";
import { getOtherPlantTechnicians, borrowTechnician } from "../../services/techniciansService";
import "./TechnicianSelect.css";

const OTHER = "__OTHER_PLANT__";

export default function TechnicianSelect({
  value,
  onChange,
  techs = [],
  allowOtherPlants = false,
  onBorrowed,
  emptyLabel = "Sin asignar",
  disabled = false,
  style,
  className,
  title,
  name,
  formatOption,
}) {
  const [extra, setExtra] = useState([]);
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const ids = new Set((techs || []).map((t) => String(t.id)));
    return [...(techs || []), ...extra.filter((t) => !ids.has(String(t.id)))];
  }, [techs, extra]);

  const label = (t) =>
    formatOption ? formatOption(t) : `${t.name}${t.code ? ` · ${t.code}` : ""}${t.fromPlantName ? ` (de ${t.fromPlantName})` : ""}`;

  const handle = (e) => {
    const v = e.target.value;
    if (v === OTHER) {
      setOpen(true);
      return;
    }
    onChange?.(v, e);
  };

  return (
    <>
      <select
        name={name}
        value={value ?? ""}
        onChange={handle}
        onClick={(e) => e.stopPropagation()}
        disabled={disabled}
        style={style}
        className={className}
        title={title}
      >
        <option value="">{emptyLabel}</option>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {label(t)}
          </option>
        ))}
        {allowOtherPlants ? <option value={OTHER}>＋ Técnico de otra planta…</option> : null}
      </select>
      {open ? createPortal(
        <OtherPlantTechModal
          onClose={() => setOpen(false)}
          onPicked={(tech) => {
            setExtra((prev) => [...prev.filter((x) => x.id !== tech.id), tech]);
            onBorrowed?.(tech);
            onChange?.(String(tech.id), { target: { name, value: String(tech.id) } });
            setOpen(false);
          }}
        />,
        document.body
      ) : null}
    </>
  );
}

function OtherPlantTechModal({ onClose, onPicked }) {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getOtherPlantTechnicians()
      .then((r) => alive && setItems(r))
      .catch((e) => {
        if (!alive) return;
        setItems([]);
        setError(e?.message || "No se pudieron cargar los técnicos");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busyId && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busyId, onClose]);

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (items || []).filter(
      (t) => !s || `${t.name} ${t.code} ${t.plantName} ${t.specialty || ""}`.toLowerCase().includes(s)
    );
    const map = new Map();
    list.forEach((t) => {
      if (!map.has(t.plantName)) map.set(t.plantName, []);
      map.get(t.plantName).push(t);
    });
    return [...map.entries()];
  }, [items, q]);

  const pick = async (t) => {
    if (busyId) return;
    setBusyId(t.id);
    setError("");
    try {
      const r = await borrowTechnician(t.id);
      const local = r?.technician;
      if (!local?.id) throw new Error("No se pudo asignar el técnico");
      toast.success(
        r.accessGranted
          ? `${local.name} ahora tiene acceso a esta planta`
          : r.created
          ? `${local.name} quedó disponible en esta planta`
          : `${local.name} listo para asignar`
      );
      onPicked({ ...local, fromPlantName: t.plantName });
    } catch (e) {
      setError(e?.message || "No se pudo asignar el técnico");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="ts-overlay" onMouseDown={(e) => { e.stopPropagation(); if (!busyId) onClose(); }} onClick={(e) => e.stopPropagation()}>
      <div className="ts-modal" role="dialog" aria-modal="true" aria-label="Técnico de otra planta" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ts-head">
          <div>
            <div className="ts-kicker">APOYO DE OTRA PLANTA</div>
            <div className="ts-title">Elegir técnico de otra planta</div>
            <div className="ts-sub">Se le crea su perfil en esta planta (con su misma cuenta) para que pueda ver y completar la actividad.</div>
          </div>
          <button type="button" className="ts-x" onClick={onClose} disabled={Boolean(busyId)} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="ts-body">
          <div className="ts-search">
            <Icon name="search" size="sm" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, código o planta" />
          </div>
          {items == null ? <div className="ts-muted">Cargando técnicos…</div> : null}
          {items && !groups.length ? (
            <div className="ts-muted">
              {items.length ? "Ningún técnico coincide con la búsqueda." : "No hay técnicos activos en otras plantas a las que tengas acceso."}
            </div>
          ) : null}
          {groups.map(([plant, list]) => (
            <div key={plant} className="ts-group">
              <div className="ts-plant">
                <Icon name="building" size="sm" /> {plant}
              </div>
              {list.map((t) => (
                <button key={t.id} type="button" className="ts-row" onClick={() => pick(t)} disabled={Boolean(busyId)}>
                  <span className="ts-avatar">{String(t.name || "?").slice(0, 1).toUpperCase()}</span>
                  <span className="ts-info">
                    <b>{t.name}</b>
                    <span>
                      {[t.code, t.specialty].filter(Boolean).join(" · ")}
                      {t.hasAccount ? "" : " · sin cuenta en LubriPlan"}
                    </span>
                  </span>
                  <span className="ts-go">{busyId === t.id ? "Asignando…" : "Elegir"}</span>
                </button>
              ))}
            </div>
          ))}
          {error ? <div className="ts-error">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}
