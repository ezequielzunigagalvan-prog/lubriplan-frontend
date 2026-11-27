// src/pages/OwnerConsolePage.jsx
// Consola del dueño de la plataforma (/consola): fuera del sistema, sin menú lateral.
// Alta de clientes (planta + su administrador), vista de todas las plantas y acceso de soporte.
// El servidor responde 404 a cualquiera que no sea el dueño; aquí solo se muestra lo que llega.
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Icon } from "../components/ui/lpIcons";
import { useAuth } from "../context/AuthContext";
import { getOwnerOverview, createClient, updateOwnerPlant, setMyPlantAccess } from "../services/ownerService";
import "./TechniciansPage.css";
import "./OwnerConsolePage.css";

const TIMEZONES = [
  "America/Mexico_City",
  "America/Monterrey",
  "America/Chihuahua",
  "America/Hermosillo",
  "America/Mazatlan",
  "America/Tijuana",
  "America/Cancun",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
];

const fmtDay = (v) => (v ? new Date(v).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function OwnerConsolePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getOwnerOverview());
    } catch (e) {
      if (e?.status === 404 || e?.status === 403) setDenied(true);
      else toast.error(e?.message || "No se pudo cargar la consola");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const plants = useMemo(() => {
    const list = data?.plants || [];
    const s = q.trim().toLowerCase();
    return list.filter((p) => {
      if (filter === "ACTIVE" && !p.active) return false;
      if (filter === "INACTIVE" && p.active) return false;
      if (!s) return true;
      return `${p.name} ${p.admins.map((a) => `${a.name} ${a.email}`).join(" ")}`.toLowerCase().includes(s);
    });
  }, [data, q, filter]);

  async function act(key, fn, ok) {
    setBusy(key);
    try {
      await fn();
      if (ok) toast.success(ok);
      await load();
    } catch (e) {
      toast.error(e?.message || "No se pudo completar");
    } finally {
      setBusy("");
    }
  }

  if (denied) {
    return (
      <div className="oc">
        <div className="oc-denied">
          <Icon name="lock" />
          <b>Esta página no está disponible.</b>
          <button type="button" className="tch-btn tch-btn-primary" onClick={() => navigate("/dashboard")}>
            Ir a LubriPlan
          </button>
        </div>
      </div>
    );
  }

  const t = data?.totals || {};

  return (
    <div className="oc">
      <header className="oc-top">
        <div className="oc-brand">
          <span className="oc-logo">LP</span>
          <div>
            <b>LubriPlan · Consola</b>
            <small>Administración de clientes</small>
          </div>
        </div>
        <div className="oc-top-actions">
          <span className="oc-me">{user?.name}</span>
          <button type="button" className="oc-top-btn" onClick={() => navigate("/dashboard")}>
            <Icon name="arrowLeft" size="sm" /> Ir a LubriPlan
          </button>
          <button type="button" className="oc-top-btn" onClick={() => logout?.()}>
            <Icon name="logout" size="sm" /> Salir
          </button>
        </div>
      </header>

      <main className="tch oc-main">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Solo dueño de la plataforma</div>
            <h1 className="tch-title">Clientes y plantas</h1>
            <div className="tch-sub">Cada cliente ve únicamente sus plantas. Tú no quedas dentro de una planta nueva salvo que lo pidas.</div>
          </div>
          <div className="tch-head-actions">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load} disabled={loading}>
              <Icon name="refresh" size="sm" /> {loading ? "Cargando…" : "Actualizar"}
            </button>
            <button type="button" className="tch-btn tch-btn-primary" onClick={() => setShowNew(true)}>
              <Icon name="plus" size="sm" /> Alta de cliente
            </button>
          </div>
        </header>

        <section className="tch-kpis oc-kpis">
          <Kpi icon="building" v={t.plants ?? "—"} l="Plantas" />
          <Kpi icon="checkCircle" v={t.active ?? "—"} l="Activas" tone="is-green" />
          <Kpi icon="equipment" v={t.equipment ?? "—"} l="Equipos" />
          <Kpi icon="history" v={t.executions30d ?? "—"} l="Ejecuciones 30 días" />
        </section>

        <div className="oc-toolbar">
          <div className="tch-tabs" role="group" aria-label="Estado">
            {[
              ["ALL", "Todas"],
              ["ACTIVE", "Activas"],
              ["INACTIVE", "Inactivas"],
            ].map(([k, l]) => (
              <button key={k} type="button" className="tch-tab" aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
          <label className="tch-search oc-search">
            <Icon name="search" size="sm" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar planta, administrador o correo…" />
          </label>
        </div>

        {loading && !data ? (
          <div className="oc-empty">Cargando…</div>
        ) : !plants.length ? (
          <div className="oc-empty">Sin plantas en esta vista.</div>
        ) : (
          <div className="oc-table">
            <div className="oc-row oc-row-head">
              <span>Planta</span>
              <span>Administradores</span>
              <span>Uso</span>
              <span>Mi acceso</span>
              <span />
            </div>
            {plants.map((p) => (
              <div key={p.id} className={`oc-row ${p.active ? "" : "is-off"}`}>
                <div>
                  <b className="oc-plant">{p.name}</b>
                  <small>
                    #{p.id} · {p.timezone} · alta {fmtDay(p.createdAt)}
                  </small>
                </div>
                <div className="oc-admins">
                  {p.admins.length ? (
                    p.admins.map((a) => (
                      <span key={a.id} className={a.active ? "" : "is-off"}>
                        <b>{a.name}</b> {a.email}
                      </span>
                    ))
                  ) : (
                    <span className="oc-warn">Sin administrador</span>
                  )}
                </div>
                <div className="oc-usage">
                  <span>
                    <b>{p.users}</b> usuarios
                  </span>
                  <span>
                    <b>{p.equipment}</b> equipos · <b>{p.routes}</b> rutas
                  </span>
                  <span>
                    <b>{p.executions30d}</b> ejecuciones (30 d)
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    className={`oc-chip ${p.ownerLinked ? "is-on" : ""}`}
                    disabled={!!busy}
                    title={p.ownerLinked ? "Quitarme el acceso a esta planta" : "Darme acceso temporal para soporte"}
                    onClick={() =>
                      act(`acc${p.id}`, () => setMyPlantAccess(p.id, !p.ownerLinked), p.ownerLinked ? "Acceso retirado" : "Ahora puedes entrar a esta planta desde LubriPlan")
                    }
                  >
                    <Icon name={p.ownerLinked ? "userCheck" : "lock"} size="sm" /> {p.ownerLinked ? "Con acceso" : "Sin acceso"}
                  </button>
                </div>
                <div className="oc-actions">
                  <button
                    type="button"
                    className="tch-btn tch-btn-ghost"
                    disabled={!!busy}
                    onClick={() => {
                      if (p.active && !window.confirm(`¿Desactivar ${p.name}? Sus usuarios ya no podrán entrar a esta planta.`)) return;
                      act(`act${p.id}`, () => updateOwnerPlant(p.id, { active: !p.active }), p.active ? "Planta desactivada" : "Planta activada");
                    }}
                  >
                    {p.active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showNew ? (
        <NewClientModal
          admins={data?.admins || []}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function Kpi({ icon, v, l, tone = "" }) {
  return (
    <div className="tch-kpi">
      <div className={`tch-kpi-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <div>
        <div className="tch-kpi-value">{v}</div>
        <div className="tch-kpi-label">{l}</div>
      </div>
    </div>
  );
}

function NewClientModal({ admins, onClose, onCreated }) {
  const [f, setF] = useState({
    plantName: "",
    timezone: "America/Mexico_City",
    adminMode: "new",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    sendInvite: true,
    adminUserId: "",
    createBaseArea: true,
    baseAreaName: "General",
    monthlyReportEnabled: true,
    monthlyReportDay: 1,
    monthlyReportHour: 8,
    monthlyReportRecipientsExtra: "",
    linkMe: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  async function submit() {
    setError("");
    setSaving(true);
    try {
      const r = await createClient({
        ...f,
        adminUserId: f.adminMode === "existing" ? Number(f.adminUserId) : undefined,
        monthlyReportDay: Number(f.monthlyReportDay),
        monthlyReportHour: Number(f.monthlyReportHour),
      });
      toast.success(`Cliente creado: ${r.plant?.name} · admin ${r.user?.email}`);
      if (r.invite === "sent") toast.success("Invitación enviada por correo");
      if (r.invite === "failed") toast.warning("No se pudo enviar la invitación; fija una contraseña desde Usuarios o reintenta");
      onCreated?.(r);
    } catch (e) {
      setError(e?.message || "No se pudo crear el cliente");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="tch-overlay oc-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="oc-modal">
        <div className="oc-modal-head">
          <div>
            <small>Consola</small>
            <h2>Alta de cliente</h2>
          </div>
          <button type="button" className="oc-x" onClick={onClose} disabled={saving} aria-label="Cerrar">
            <Icon name="close" size="sm" />
          </button>
        </div>
        <div className="oc-modal-body">
          <fieldset>
            <legend>Planta</legend>
            <div className="oc-grid">
              <label className="oc-field is-full">
                <span>Nombre de la planta</span>
                <input value={f.plantName} onChange={(e) => set("plantName", e.target.value)} placeholder="Ej. Cementos del Norte · Planta Monterrey" />
              </label>
              <label className="oc-field">
                <span>Zona horaria</span>
                <select value={f.timezone} onChange={(e) => set("timezone", e.target.value)}>
                  {TIMEZONES.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </label>
              <label className="oc-field">
                <span>Área inicial</span>
                <div className="oc-inline">
                  <input type="checkbox" checked={f.createBaseArea} onChange={(e) => set("createBaseArea", e.target.checked)} />
                  <input value={f.baseAreaName} onChange={(e) => set("baseAreaName", e.target.value)} disabled={!f.createBaseArea} />
                </div>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Administrador del cliente</legend>
            <div className="oc-seg" role="group">
              <button type="button" aria-pressed={f.adminMode === "new"} onClick={() => set("adminMode", "new")}>
                Cliente nuevo
              </button>
              <button type="button" aria-pressed={f.adminMode === "existing"} onClick={() => set("adminMode", "existing")}>
                Otra planta de un cliente existente
              </button>
            </div>
            {f.adminMode === "new" ? (
              <div className="oc-grid">
                <label className="oc-field">
                  <span>Nombre</span>
                  <input value={f.adminName} onChange={(e) => set("adminName", e.target.value)} />
                </label>
                <label className="oc-field">
                  <span>Correo</span>
                  <input type="email" value={f.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} />
                </label>
                <label className="oc-field is-full oc-inline">
                  <input type="checkbox" checked={f.sendInvite} onChange={(e) => set("sendInvite", e.target.checked)} />
                  Enviarle invitación por correo para que cree su contraseña
                </label>
                {!f.sendInvite ? (
                  <label className="oc-field">
                    <span>Contraseña temporal (mín. 8)</span>
                    <input type="password" autoComplete="new-password" value={f.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} />
                  </label>
                ) : null}
              </div>
            ) : (
              <label className="oc-field">
                <span>Administrador existente</span>
                <select value={f.adminUserId} onChange={(e) => set("adminUserId", e.target.value)}>
                  <option value="">Elige…</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id} disabled={!a.active}>
                      {a.name} · {a.email} {a.plants.length ? `— ${a.plants.map((p) => p.name).join(", ")}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </fieldset>

          <fieldset>
            <legend>Reporte mensual</legend>
            <div className="oc-grid">
              <label className="oc-field oc-inline">
                <input type="checkbox" checked={f.monthlyReportEnabled} onChange={(e) => set("monthlyReportEnabled", e.target.checked)} /> Enviar reporte mensual
              </label>
              <label className="oc-field">
                <span>Día (1–28) y hora</span>
                <div className="oc-inline">
                  <input type="number" min={1} max={28} value={f.monthlyReportDay} onChange={(e) => set("monthlyReportDay", e.target.value)} />
                  <input type="number" min={0} max={23} value={f.monthlyReportHour} onChange={(e) => set("monthlyReportHour", e.target.value)} />
                </div>
              </label>
              <label className="oc-field is-full">
                <span>Destinatarios extra (separados por coma)</span>
                <input value={f.monthlyReportRecipientsExtra} onChange={(e) => set("monthlyReportRecipientsExtra", e.target.value)} />
              </label>
            </div>
          </fieldset>

          <label className="oc-field oc-inline oc-linkme">
            <input type="checkbox" checked={f.linkMe} onChange={(e) => set("linkMe", e.target.checked)} />
            Darme acceso a esta planta (soporte). Por defecto no: el cliente queda totalmente separado.
          </label>

          {error ? <div className="oc-error">{error}</div> : null}
        </div>
        <div className="oc-modal-foot">
          <button type="button" className="tch-btn tch-btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="tch-btn tch-btn-primary" onClick={submit} disabled={saving}>
            <Icon name="check" size="sm" /> {saving ? "Creando…" : "Crear cliente"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
