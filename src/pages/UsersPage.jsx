// src/pages/UsersPage.jsx
// Usuarios y acceso por planta. Un supervisor puede tener varias plantas; un técnico puede
// trabajar en varias plantas con un perfil de técnico en cada una.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import {
  getUsers,
  getUserOptions,
  createUser,
  updateUser,
  setUserActive,
  setUserPassword,
  sendPasswordLink,
} from "../services/usersService";
import "./TechniciansPage.css";
import "./UsersPage.css";

const ROLE = {
  ADMIN: { label: "Administrador", short: "Admin", desc: "Acceso total: usuarios, configuración y todas sus plantas.", cls: "r-admin" },
  SUPERVISOR: { label: "Supervisor", short: "Supervisor", desc: "Planea y supervisa la lubricación de sus plantas.", cls: "r-sup" },
  TECHNICIAN: { label: "Técnico", short: "Técnico", desc: "Ejecuta actividades y reporta condición en sus plantas.", cls: "r-tech" },
};

const initials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default function UsersPage() {
  const { user: me } = useAuth();
  const { currentPlant } = usePlant();
  const confirm = useConfirm();
  const [scope, setScope] = useState("plant");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // null | { mode: "create" } | { mode: "edit", user }
  const [pwUser, setPwUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await getUsers(scope));
    } catch (e) {
      setError(e?.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = items.filter((u) => u.active);
    return {
      total: active.length,
      ADMIN: active.filter((u) => u.role === "ADMIN").length,
      SUPERVISOR: active.filter((u) => u.role === "SUPERVISOR").length,
      TECHNICIAN: active.filter((u) => u.role === "TECHNICIAN").length,
      noPassword: active.filter((u) => !u.hasPassword).length,
      multi: active.filter((u) => u.plants.length > 1).length,
      inactive: items.length - active.length,
    };
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (u) =>
        (showInactive || u.active) &&
        (!roleFilter || u.role === roleFilter) &&
        (!q || [u.name, u.email, ...u.plants.map((p) => p.name), ...u.plants.map((p) => p.technician?.code || "")].some((s) => String(s).toLowerCase().includes(q)))
    );
  }, [items, search, roleFilter, showInactive]);

  const toggleActive = async (u) => {
    const ok = await confirm(
      u.active ? `${u.name} ya no podrá entrar a LubriPlan. Su historial se conserva.` : `${u.name} podrá volver a entrar a LubriPlan.`,
      { title: u.active ? "Desactivar usuario" : "Activar usuario", confirmLabel: u.active ? "Desactivar" : "Activar", danger: u.active }
    );
    if (!ok) return;
    try {
      await setUserActive(u.id, !u.active);
      toast.success(u.active ? "Usuario desactivado" : "Usuario activado");
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo actualizar");
    }
  };

  return (
    <MainLayout>
      <div className="tch us lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Usuarios{currentPlant?.name && scope === "plant" ? ` · ${currentPlant.name}` : " · Todas mis plantas"}</div>
            <h1 className="tch-title">Usuarios y acceso</h1>
            <div className="tch-sub">Quién entra a LubriPlan, con qué rol y a qué plantas. Un supervisor o técnico puede tener varias plantas.</div>
          </div>
          <div className="tch-head-actions">
            <label className="tch-search">
              <Icon name="search" size="sm" />
              <input placeholder="Buscar por nombre, correo, planta o código…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar usuario" />
            </label>
            <button type="button" className="tch-btn tch-btn-primary" onClick={() => setForm({ mode: "create" })}>
              <Icon name="plus" size="sm" /> Nuevo usuario
            </button>
          </div>
        </header>

        <section className="tch-kpis" aria-label="Resumen">
          <Kpi icon="users" value={stats.total} label="Usuarios activos" />
          <Kpi icon="shield" value={stats.SUPERVISOR} label="Supervisores" />
          <Kpi icon="tool" value={stats.TECHNICIAN} label="Técnicos" />
          <Kpi icon="building" value={stats.multi} label="Con varias plantas" />
          <Kpi icon="lock" tone={stats.noPassword ? "is-orange" : ""} value={stats.noPassword} label="Sin contraseña" />
        </section>

        <div className="tch-toolbar">
          <div className="tch-tabs" role="group" aria-label="Alcance">
            <button type="button" className="tch-tab" aria-pressed={scope === "plant"} onClick={() => setScope("plant")}>Esta planta</button>
            <button type="button" className="tch-tab" aria-pressed={scope === "all"} onClick={() => setScope("all")}>Todas mis plantas</button>
          </div>
          <div className="us-filters">
            {[["", "Todos"], ["ADMIN", "Administradores"], ["SUPERVISOR", "Supervisores"], ["TECHNICIAN", "Técnicos"]].map(([k, l]) => (
              <button key={k} type="button" className="an-preset" aria-pressed={roleFilter === k} onClick={() => setRoleFilter(k)}>{l}</button>
            ))}
            {stats.inactive ? (
              <label className="hst-check"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Ver inactivos ({stats.inactive})</label>
            ) : null}
          </div>
        </div>

        {loading && !items.length ? (
          <div className="us-list">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="us-row us-skeleton" />)}</div>
        ) : error ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudieron cargar los usuarios</h3>
            <p>{error}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load}><Icon name="refresh" size="sm" /> Reintentar</button>
          </div>
        ) : !visible.length ? (
          <div className="tch-empty">
            <div className="tch-empty-icon"><Icon name="users" /></div>
            <h3>Sin usuarios</h3>
            <p>{search || roleFilter ? "Ningún usuario coincide con el filtro." : "Crea el primer usuario de esta planta."}</p>
          </div>
        ) : (
          <div className="us-list">
            {visible.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                isMe={u.id === me?.id}
                onEdit={() => setForm({ mode: "edit", user: u })}
                onPassword={() => setPwUser(u)}
                onToggle={() => toggleActive(u)}
              />
            ))}
          </div>
        )}
      </div>

      {form ? (
        <UserForm
          mode={form.mode}
          user={form.user}
          meId={me?.id}
          onClose={() => setForm(null)}
          onSaved={(msg) => {
            setForm(null);
            toast.success(msg);
            load();
          }}
        />
      ) : null}
      {pwUser ? <PasswordModal u={pwUser} onClose={() => setPwUser(null)} onDone={() => { setPwUser(null); load(); }} /> : null}
    </MainLayout>
  );
}

function Kpi({ icon, value, label, tone = "" }) {
  return (
    <div className="tch-kpi">
      <div className={`tch-kpi-icon ${tone}`}><Icon name={icon} /></div>
      <div>
        <div className="tch-kpi-value">{value}</div>
        <div className="tch-kpi-label">{label}</div>
      </div>
    </div>
  );
}

function UserRow({ u, isMe, onEdit, onPassword, onToggle }) {
  const r = ROLE[u.role] || ROLE.TECHNICIAN;
  return (
    <article className={`us-row${u.active ? "" : " is-inactive"}`}>
      <div className={`us-avatar ${r.cls}`} aria-hidden="true">{initials(u.name)}</div>
      <div className="us-main">
        <div className="us-name">
          {u.name}
          {isMe ? <span className="us-tag">Tú</span> : null}
          {!u.active ? <span className="us-tag is-off">Inactivo</span> : null}
          {u.active && !u.hasPassword ? <span className="us-tag is-warn">Sin contraseña</span> : null}
        </div>
        <div className="us-email">{u.email}</div>
      </div>
      <span className={`us-role ${r.cls}`}>{r.label}</span>
      <div className="us-plants">
        {u.plants.map((p) => (
          <span key={p.plantId} className={`us-plant${p.isDefault ? " is-default" : ""}`} title={p.isDefault ? "Planta predeterminada" : undefined}>
            {p.isDefault ? <Icon name="pin" size="sm" /> : null}
            {p.name}
            {u.role === "TECHNICIAN" ? (
              p.technician ? <small>{p.technician.code}</small> : <small className="is-missing">sin perfil</small>
            ) : null}
          </span>
        ))}
      </div>
      <div className="us-actions">
        <button type="button" className="tch-icon-btn" onClick={onEdit} title="Editar" aria-label={`Editar ${u.name}`}><Icon name="edit" size="sm" /></button>
        <button type="button" className="tch-icon-btn" onClick={onPassword} title="Contraseña" aria-label={`Contraseña de ${u.name}`} disabled={!u.active}><Icon name="lock" size="sm" /></button>
        {!isMe ? (
          <button type="button" className="tch-icon-btn" onClick={onToggle} title={u.active ? "Desactivar" : "Activar"} aria-label={u.active ? "Desactivar" : "Activar"}>
            <Icon name={u.active ? "userX" : "userCheck"} size="sm" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

/* ================= Formulario ================= */

function UserForm({ mode, user, meId, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const [opts, setOpts] = useState(null);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "TECHNICIAN");
  const [plants, setPlants] = useState(() => (user?.plants || []).map((p) => ({ plantId: p.plantId, isDefault: p.isDefault })));
  const [techs, setTechs] = useState(() =>
    Object.fromEntries((user?.plants || []).filter((p) => p.technician).map((p) => [p.plantId, { technicianId: String(p.technician.id), code: "" }]))
  );
  const [pwMode, setPwMode] = useState("invite");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserOptions(user?.id)
      .then((o) => {
        setOpts(o);
        // Usuario nuevo: arranca con la planta actual seleccionada.
        if (!isEdit) {
          const current = Number(localStorage.getItem("lp_currentPlantId"));
          const first = o.plants.find((p) => p.id === current) || o.plants[0];
          if (first) setPlants([{ plantId: first.id, isDefault: true }]);
        }
      })
      .catch((e) => setError(e?.message || "No se pudieron cargar las plantas"));
  }, [user?.id, isEdit]);

  const checked = (id) => plants.some((p) => p.plantId === id);
  const togglePlant = (id) =>
    setPlants((prev) => {
      if (prev.some((p) => p.plantId === id)) {
        const next = prev.filter((p) => p.plantId !== id);
        if (next.length && !next.some((p) => p.isDefault)) next[0] = { ...next[0], isDefault: true };
        return next;
      }
      return [...prev, { plantId: id, isDefault: prev.length === 0 }];
    });
  const setDefault = (id) => setPlants((prev) => prev.map((p) => ({ ...p, isDefault: p.plantId === id })));
  const setTech = (plantId, patch) => setTechs((t) => ({ ...t, [plantId]: { technicianId: "", code: "", ...t[plantId], ...patch } }));

  const editingSelf = isEdit && user?.id === meId;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Escribe el nombre.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Escribe un correo válido.");
    if (!plants.length) return setError("Asigna al menos una planta.");
    if (!isEdit && pwMode === "set" && password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    const technicians = {};
    if (role === "TECHNICIAN") {
      for (const p of plants) {
        const t = techs[p.plantId] || {};
        if (t.technicianId) technicians[p.plantId] = { technicianId: Number(t.technicianId) };
        else if (t.code?.trim()) technicians[p.plantId] = { code: t.code.trim().toUpperCase() };
      }
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), email: email.trim().toLowerCase(), role, plants, technicians };
      if (isEdit) {
        await updateUser(user.id, payload);
        onSaved("Usuario actualizado");
      } else {
        const r = await createUser({ ...payload, ...(pwMode === "set" ? { password } : { sendInvite: pwMode === "invite" }) });
        onSaved(r?.invite === "sent" ? "Usuario creado · se envió el correo para crear su contraseña" : r?.invite ? `Usuario creado · ${r.invite}` : "Usuario creado");
      }
    } catch (ex) {
      setError(ex?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const plantName = (id) => opts?.plants.find((p) => p.id === id)?.name || `Planta ${id}`;

  return (
    <div className="tch-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="tch-modal us-modal" onSubmit={submit} noValidate>
        <div className="tch-modal-head">
          <div>
            <div className="tch-kicker">{isEdit ? "Editar usuario" : "Nuevo usuario"}</div>
            <h2 className="tch-modal-title">{isEdit ? user.name : "Alta de usuario"}</h2>
          </div>
          <button type="button" className="tch-icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="close" size="sm" /></button>
        </div>

        <div className="tch-form">
          <div className="tch-row">
            <div className="tch-field">
              <label htmlFor="us-name">Nombre</label>
              <input id="us-name" className="tch-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="tch-field">
              <label htmlFor="us-email">Correo</label>
              <input id="us-email" type="email" className="tch-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="tch-field">
            <label>Rol</label>
            <div className="us-roles">
              {Object.entries(ROLE).map(([k, r]) => (
                <button key={k} type="button" className={`us-role-card ${r.cls}`} aria-pressed={role === k} disabled={editingSelf && k !== role} onClick={() => setRole(k)}>
                  <strong>{r.label}</strong>
                  <span>{r.desc}</span>
                </button>
              ))}
            </div>
            {editingSelf ? <span className="tch-hint">No puedes cambiar tu propio rol.</span> : null}
          </div>

          <div className="tch-field">
            <label>Plantas</label>
            <span className="tch-hint">
              {role === "TECHNICIAN"
                ? "En cada planta el técnico necesita un perfil: liga uno existente o se crea uno nuevo con su código."
                : "Marca todas las plantas a su cargo. La predeterminada es la que se abre al entrar."}
            </span>
            {!opts ? (
              <p className="tch-hint">Cargando plantas…</p>
            ) : (
              <div className="us-plant-list">
                {opts.plants.map((p) => {
                  const on = checked(p.id);
                  const def = plants.find((x) => x.plantId === p.id)?.isDefault;
                  const available = opts.technicians.filter((t) => t.plantId === p.id);
                  const t = techs[p.id] || {};
                  return (
                    <div key={p.id} className={`us-plant-item${on ? " is-on" : ""}`}>
                      <label className="us-plant-check">
                        <input type="checkbox" checked={on} onChange={() => togglePlant(p.id)} />
                        <strong>{p.name}</strong>
                      </label>
                      {on ? (
                        <button type="button" className={`us-default${def ? " is-on" : ""}`} onClick={() => setDefault(p.id)} disabled={def}>
                          <Icon name="pin" size="sm" /> {def ? "Predeterminada" : "Hacer predeterminada"}
                        </button>
                      ) : null}
                      {on && role === "TECHNICIAN" ? (
                        <div className="us-profile">
                          <select className="tch-input" value={t.technicianId || ""} onChange={(e) => setTech(p.id, { technicianId: e.target.value })} aria-label={`Perfil de técnico en ${p.name}`}>
                            <option value="">Crear perfil nuevo en {p.name}</option>
                            {available.map((x) => (
                              <option key={x.id} value={x.id}>Ligar a {x.name} · {x.code}</option>
                            ))}
                          </select>
                          {!t.technicianId ? (
                            <input className="tch-input" placeholder="Código (p. ej. TEC-07)" value={t.code || ""} onChange={(e) => setTech(p.id, { code: e.target.value })} aria-label={`Código del técnico en ${p.name}`} />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            {role === "TECHNICIAN" && plants.length > 1 ? (
              <span className="tch-hint">
                El técnico verá y ejecutará las actividades de cada planta con el perfil de esa planta. Su perfil principal es el de {plantName(plants.find((p) => p.isDefault)?.plantId)}.
              </span>
            ) : null}
          </div>

          {!isEdit ? (
            <div className="tch-field">
              <label>Acceso</label>
              <div className="us-roles us-pw">
                <button type="button" className="us-role-card" aria-pressed={pwMode === "invite"} onClick={() => setPwMode("invite")}>
                  <strong>Enviar correo</strong><span>Recibe un enlace (72 h) para crear su contraseña.</span>
                </button>
                <button type="button" className="us-role-card" aria-pressed={pwMode === "set"} onClick={() => setPwMode("set")}>
                  <strong>Definir contraseña</strong><span>Se la compartes tú. Mínimo 8 caracteres.</span>
                </button>
                <button type="button" className="us-role-card" aria-pressed={pwMode === "later"} onClick={() => setPwMode("later")}>
                  <strong>Después</strong><span>Sin acceso hasta que le envíes el enlace.</span>
                </button>
              </div>
              {pwMode === "set" ? (
                <input type="password" className="tch-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" autoComplete="new-password" />
              ) : null}
            </div>
          ) : null}

          {error ? <div className="tch-error" role="alert">{error}</div> : null}
        </div>

        <div className="tch-modal-foot">
          <button type="button" className="tch-btn tch-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="tch-btn tch-btn-primary" disabled={saving || !opts}>{saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear usuario"}</button>
        </div>
      </form>
    </div>
  );
}

function PasswordModal({ u, onClose, onDone }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sendLink = async () => {
    setBusy(true);
    setError("");
    try {
      await sendPasswordLink(u.id);
      toast.success(`Se envió el enlace a ${u.email}`);
      onDone();
    } catch (e) {
      setError(e?.message || "No se pudo enviar");
    } finally {
      setBusy(false);
    }
  };
  const save = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError("Mínimo 8 caracteres.");
    setBusy(true);
    setError("");
    try {
      await setUserPassword(u.id, password);
      toast.success("Contraseña actualizada");
      onDone();
    } catch (ex) {
      setError(ex?.message || "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tch-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="tch-modal" style={{ maxWidth: 480 }} onSubmit={save} noValidate>
        <div className="tch-modal-head">
          <div>
            <div className="tch-kicker">Contraseña</div>
            <h2 className="tch-modal-title">{u.name}</h2>
            <div className="tch-sub">{u.hasPassword ? "Tiene contraseña." : "Aún no tiene contraseña: no puede entrar."}</div>
          </div>
          <button type="button" className="tch-icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="close" size="sm" /></button>
        </div>
        <div className="tch-form">
          <button type="button" className="tch-btn tch-btn-ghost" onClick={sendLink} disabled={busy}>
            <Icon name="bell" size="sm" /> Enviar enlace a {u.email}
          </button>
          <span className="tch-hint">O fija una contraseña y compártela por un medio seguro:</span>
          <input type="password" className="tch-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña (mínimo 8)" autoComplete="new-password" />
          {error ? <div className="tch-error" role="alert">{error}</div> : null}
        </div>
        <div className="tch-modal-foot">
          <button type="button" className="tch-btn tch-btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className="tch-btn tch-btn-primary" disabled={busy || !password}>Guardar contraseña</button>
        </div>
      </form>
    </div>
  );
}
