import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  getUsers,
  createUser,
  setUserActive,
  getAvailableTechnicians,
  getAvailableUserPlants,
  updateUser,
  getUserPlants,
  updateUserPlants,
} from "../services/usersService";
import { setPasswordByEmail } from "../services/authService";
import { getTechLinks, linkUserTechnician } from "../services/adminLinksService";
import { Icon } from "../components/ui/lpIcons";
import "./UsersPage.css";

const ROLE_LABEL = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  TECHNICIAN: "Técnico",
};

const VALID_ROLES = ["ADMIN", "SUPERVISOR", "TECHNICIAN"];

const toRole = (value) => String(value || "").toUpperCase();

function fmtDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function roleChip(role) {
  const normalized = toRole(role);
  if (normalized === "ADMIN") {
    return { bg: "rgba(254,243,199,0.88)", fg: "#92400e", label: "Administrador", icon: "settings" };
  }
  if (normalized === "SUPERVISOR") {
    return { bg: "rgba(219,234,254,0.88)", fg: "#1d4ed8", label: "Supervisor", icon: "doc" };
  }
  return { bg: "rgba(220,252,231,0.88)", fg: "#166534", label: "Técnico", icon: "user" };
}

function statusChip(active) {
  return active
    ? { bg: "rgba(220,252,231,0.88)", fg: "#166534", label: "Activo", icon: "check" }
    : { bg: "rgba(254,226,226,0.92)", fg: "#991b1b", label: "Inactivo", icon: "warn" };
}

function passwordChip(hasPassword) {
  return hasPassword
    ? { bg: "rgba(219,234,254,0.88)", fg: "#1e40af", label: "Configurada", icon: "lock" }
    : { bg: "rgba(255,237,213,0.88)", fg: "#9a3412", label: "Pendiente", icon: "alert" };
}

function buildTechLabel(user) {
  const tech = user?.technician || null;
  if (toRole(user?.role) !== "TECHNICIAN") return "—";
  if (!tech) return "Sin vínculo";
  return `${tech.name}${tech.code ? ` · ${tech.code}` : ""}`;
}

function buildPlantsText(user) {
  if (!Array.isArray(user?.userPlants) || user.userPlants.length === 0) return "Sin planta asignada";
  return user.userPlants
    .map((entry) => `${entry?.plant?.name || `Planta ${entry?.plantId}`}${entry?.isDefault ? " (por defecto)" : ""}`)
    .join(", ");
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("USERS");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "TECHNICIAN", technicianId: "" });
  const [techLoading, setTechLoading] = useState(false);
  const [techError, setTechError] = useState("");
  const [availableTechs, setAvailableTechs] = useState([]);
  const [plantOptions, setPlantOptions] = useState([]);
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [plantsError, setPlantsError] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showNewPwd2, setShowNewPwd2] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdUser, setPwdUser] = useState(null);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdAssigned, setPwdAssigned] = useState("");
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksErr, setLinksErr] = useState("");
  const [techUsers, setTechUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [busyUserId, setBusyUserId] = useState(null);
  const [syncName, setSyncName] = useState(true);
  const roleOptions = useMemo(() => VALID_ROLES, []);
  const isTechRole = toRole(form.role) === "TECHNICIAN";

  const fetchUsers = async () => {
    setError("");
    setLoading(true);
    try {
      const json = await getUsers();
      setUsers(Array.isArray(json?.items) ? json.items : []);
    } catch (err) {
      console.error("GET /users", err);
      setError(err?.message || "Error cargando usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchAvailableTechs = async () => {
    setTechError("");
    setTechLoading(true);
    try {
      const json = await getAvailableTechnicians();
      setAvailableTechs(Array.isArray(json?.items) ? json.items : []);
    } catch (err) {
      console.error("GET /users/technicians/available", err);
      setAvailableTechs([]);
      setTechError(err?.message || "Error cargando técnicos disponibles");
    } finally {
      setTechLoading(false);
    }
  };

  const fetchUserPlants = async (userId) => {
    setPlantsError("");
    setPlantsLoading(true);
    try {
      const json = await getUserPlants(userId);
      setPlantOptions(Array.isArray(json?.items) ? json.items : []);
    } catch (err) {
      console.error("GET /users/:id/plants", err);
      setPlantOptions([]);
      setPlantsError(err?.message || "Error cargando plantas del usuario");
    } finally {
      setPlantsLoading(false);
    }
  };

  const fetchPlantsForCreate = async () => {
    setPlantsError("");
    setPlantsLoading(true);
    try {
      const json = await getAvailableUserPlants();
      setPlantOptions(Array.isArray(json?.items) ? json.items : []);
    } catch (err) {
      console.error("GET /users/plants/available", err);
      setPlantOptions([]);
      setPlantsError(err?.message || "Error cargando plantas disponibles");
    } finally {
      setPlantsLoading(false);
    }
  };

  const resetCreatePassword = () => {
    setNewPwd("");
    setNewPwd2("");
    setShowNewPwd(false);
    setShowNewPwd2(false);
  };

  const openCreateModal = async () => {
    setEditingUser(null);
    setForm({ name: "", email: "", role: "TECHNICIAN", technicianId: "" });
    setPlantOptions([]);
    setShowModal(true);
    setError("");
    setTechError("");
    setPlantsError("");
    resetCreatePassword();
    await Promise.all([fetchAvailableTechs(), fetchPlantsForCreate()]);
  };

  const openEditModal = async (user) => {
    setEditingUser(user);
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      role: toRole(user?.role) || "TECHNICIAN",
      technicianId: user?.technicianId ? String(user.technicianId) : "",
    });
    setShowModal(true);
    setError("");
    setTechError("");
    setPlantsError("");
    resetCreatePassword();
    await Promise.all([fetchAvailableTechs(), fetchUserPlants(user.id)]);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError("");
    setTechError("");
    setPlantsError("");
    setPlantOptions([]);
    resetCreatePassword();
  };

  const onChangeForm = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "role" && toRole(value) !== "TECHNICIAN") next.technicianId = "";
      return next;
    });
  };

  const validateAssignedPlants = () => {
    if (plantOptions.length === 0) return null;
    const assignedPlants = plantOptions.filter((plant) => plant.assigned && plant.active);
    if (assignedPlants.length === 0) return "Debes asignar al menos una planta.";
    if (!assignedPlants.some((plant) => plant.isDefault)) return "Debes seleccionar una planta por defecto.";
    return null;
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    setError("");

    const name = String(form.name || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    const role = toRole(form.role || "TECHNICIAN");
    if (!name || !email) {
      setError("Nombre y correo requeridos.");
      return;
    }

    const finalRole = VALID_ROLES.includes(role) ? role : "TECHNICIAN";
    const technicianIdRaw = form.technicianId;
    const technicianId = technicianIdRaw ? Number(technicianIdRaw) : null;
    if (finalRole === "TECHNICIAN" && !Number.isFinite(technicianId)) {
      setError("Para el rol Técnico debes seleccionar un técnico.");
      return;
    }

    if (!editingUser) {
      if (newPwd.length < 6) {
        setError("Define una contraseña inicial de al menos 6 caracteres.");
        return;
      }
      if (newPwd !== newPwd2) {
        setError("Las contraseñas del alta no coinciden.");
        return;
      }
    }

    const plantsValidation = validateAssignedPlants();
    if (plantsValidation) {
      setError(plantsValidation);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        email,
        role: finalRole,
        technicianId: finalRole === "TECHNICIAN" ? technicianId : null,
      };

      let savedUserId = editingUser?.id ?? null;
      if (editingUser?.id) {
        await updateUser(editingUser.id, payload);
      } else {
        const created = await createUser({ ...payload, password: newPwd });
        savedUserId = created?.user?.id ?? null;
      }

      if (savedUserId && plantOptions.length > 0) {
        const assignedPlants = plantOptions
          .filter((plant) => plant.assigned && plant.active)
          .map((plant) => ({
            plantId: plant.plantId,
            active: true,
            isDefault: !!plant.isDefault,
          }));

        await updateUserPlants(savedUserId, { plants: assignedPlants });
      }

      closeModal();
      await fetchUsers();
    } catch (err) {
      console.error("SAVE /users", err);
      setError(err?.message || "Error guardando usuario");
    } finally {
      setSaving(false);
    }
  };

  const togglePlantAssigned = (plantId) => {
    setPlantOptions((prev) => {
      const next = prev.map((plant) => {
        if (Number(plant.plantId) !== Number(plantId)) return plant;
        const willAssign = !plant.assigned;
        return {
          ...plant,
          assigned: willAssign,
          active: willAssign,
          isDefault: willAssign ? plant.isDefault : false,
        };
      });

      const assigned = next.filter((plant) => plant.assigned && plant.active);
      if (assigned.length === 1) {
        return next.map((plant) => ({ ...plant, isDefault: Number(plant.plantId) === Number(assigned[0].plantId) }));
      }
      if (assigned.length > 1 && !assigned.some((plant) => plant.isDefault)) {
        return next.map((plant) => ({
          ...plant,
          isDefault: Number(plant.plantId) === Number(assigned[0].plantId),
        }));
      }
      return next;
    });
  };

  const setDefaultPlant = (plantId) => {
    setPlantOptions((prev) =>
      prev.map((plant) => ({
        ...plant,
        isDefault: plant.assigned && plant.active && Number(plant.plantId) === Number(plantId),
      }))
    );
  };

  const toggleUserStatus = async (user) => {
    setError("");
    setTogglingId(user.id);
    setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, active: !item.active } : item)));
    try {
      await setUserActive(user.id, !user.active);
    } catch (err) {
      console.error("PATCH /users/:id/status", err);
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, active: user.active } : item)));
      setError(err?.message || "Error actualizando estado");
    } finally {
      setTogglingId(null);
    }
  };

  const openPwdModal = (user) => {
    setPwdUser(user);
    setPwd("");
    setPwd2("");
    setPwdError("");
    setPwdAssigned("");
    setShowPwd(false);
    setShowPwd2(false);
    setShowPwdModal(true);
  };

  const closePwdModal = () => {
    setShowPwdModal(false);
    setPwdUser(null);
    setPwd("");
    setPwd2("");
    setShowPwd(false);
    setShowPwd2(false);
    setPwdError("");
    setPwdAssigned("");
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setPwdError("");
    const email = String(pwdUser?.email || "").trim().toLowerCase();
    if (!email) {
      setPwdError("Usuario inválido.");
      return;
    }
    if (pwd.length < 6) {
      setPwdError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pwd !== pwd2) {
      setPwdError("Las contraseñas no coinciden.");
      return;
    }

    setPwdSaving(true);
    try {
      await setPasswordByEmail(email, pwd);
      setPwdAssigned(pwd);
      setPwd("");
      setPwd2("");
      await fetchUsers();
    } catch (err) {
      console.error("POST /auth/set-password", err);
      setPwdError(err?.message || "Error asignando contraseña");
    } finally {
      setPwdSaving(false);
    }
  };

  const copyAssignedPassword = async () => {
    if (!pwdAssigned) return;
    try {
      await navigator.clipboard.writeText(pwdAssigned);
    } catch {}
  };

  const kpis = useMemo(() => {
    let admins = 0;
    let supervisors = 0;
    let techs = 0;
    for (const user of users) {
      if (toRole(user?.role) === "ADMIN") admins += 1;
      else if (toRole(user?.role) === "SUPERVISOR") supervisors += 1;
      else if (toRole(user?.role) === "TECHNICIAN") techs += 1;
    }
    return { total: users.length, admins, supervisors, techs };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const search = q.trim().toLowerCase();
    return users
      .filter((user) => {
        if (roleFilter !== "ALL" && toRole(user?.role) !== roleFilter) return false;
        if (statusFilter === "ACTIVE" && !user?.active) return false;
        if (statusFilter === "INACTIVE" && user?.active) return false;
        if (!search) return true;
        return [user?.name, user?.email, user?.technician?.name, user?.technician?.code, buildPlantsText(user)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((a, b) => {
        const activeA = a?.active ? 0 : 1;
        const activeB = b?.active ? 0 : 1;
        if (activeA !== activeB) return activeA - activeB;
        const order = { ADMIN: 0, SUPERVISOR: 1, TECHNICIAN: 2 };
        const roleA = order[toRole(a?.role)] ?? 9;
        const roleB = order[toRole(b?.role)] ?? 9;
        if (roleA !== roleB) return roleA - roleB;
        return String(a?.name || "").localeCompare(String(b?.name || ""));
      });
  }, [users, q, roleFilter, statusFilter]);

  const loadLinks = async () => {
    try {
      setLinksErr("");
      setLinksLoading(true);
      const res = await getTechLinks();
      setTechUsers(Array.isArray(res?.techUsers) ? res.techUsers : []);
      setTechnicians(Array.isArray(res?.technicians) ? res.technicians : []);
    } catch (err) {
      console.error(err);
      setLinksErr(err?.message || "Error cargando vínculos");
      setTechUsers([]);
      setTechnicians([]);
    } finally {
      setLinksLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "LINKS") loadLinks();
  }, [activeTab]);

  const onChangeLink = async (user, value) => {
    const userId = Number(user.id);
    const technicianId = value === "" ? null : Number(value);
    setBusyUserId(userId);
    setLinksErr("");
    try {
      const res = await linkUserTechnician(userId, technicianId, syncName);
      const updated = res?.item;
      setTechUsers((prev) => prev.map((item) => (item.id === userId ? updated : item)));
      await loadLinks();
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setLinksErr(err?.message || "Error vinculando técnico");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <MainLayout>
      <style>{`
        .lpCard {
          position: relative;
          overflow: hidden;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .lpCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(2,6,23,0.10);
        }
        .lpPress:active {
          transform: translateY(0) scale(0.99);
        }
      `}</style>

      <div className="lpUsersHeader">
        <div>
          <h1 style={{ margin: 0 }}>Usuarios</h1>
          <div className="lpUsersSub">Administración de accesos, roles y vínculos con técnicos.</div>
        </div>

        <div className="lpUsersHeaderActions">
          <button
            className="lpBtnGhost lpPress"
            onClick={() => (activeTab === "USERS" ? fetchUsers() : loadLinks())}
            disabled={loading || linksLoading}
            type="button"
            title="Actualizar"
          >
            <span className="lpBtnRow">
              <Icon name="reset" />
              {loading || linksLoading ? "Actualizando…" : "Actualizar"}
            </span>
          </button>

          <button className="lpBtnPrimary lpPress" onClick={openCreateModal} disabled={loading} type="button">
            <span className="lpBtnRow">
              <Icon name="plus" />
              Nuevo usuario
            </span>
          </button>
        </div>
      </div>

      {error ? <div className="lpErrorBox">{error}</div> : null}

      <div className="lpTabsBar">
        <div className="lpTabs">
          <button type="button" className={activeTab === "USERS" ? "lpTab lpTabActive" : "lpTab"} onClick={() => setActiveTab("USERS")}>
            <span className="lpTabRow">
              <span className="lpTabDot" />
              Usuarios
            </span>
          </button>

          <button type="button" className={activeTab === "LINKS" ? "lpTab lpTabActive" : "lpTab"} onClick={() => setActiveTab("LINKS")}>
            <span className="lpTabRow">
              <span className="lpTabDot" />
              Vínculos (técnicos)
              <span className="lpTabBadge">{techUsers?.length || 0}</span>
            </span>
          </button>

          <span className="lpTabIndicator" style={{ transform: activeTab === "USERS" ? "translateX(0%)" : "translateX(100%)" }} />
        </div>
      </div>

      {activeTab === "USERS" ? (
        <div className="lpTabPane">
          <div className="lpKpiGrid">
            <KpiCard title="Total usuarios" value={kpis.total} icon="users" />
            <KpiCard title="Administradores" value={kpis.admins} icon="settings" />
            <KpiCard title="Supervisores" value={kpis.supervisors} icon="doc" />
            <KpiCard title="Técnicos" value={kpis.techs} icon="user" />
          </div>

          <div className="lpCard lpFiltersCard">
            <div className="lpFiltersHeader">
              <div className="lpFiltersTitle">
                <span className="lpHdrIcon"><Icon name="search" /></span>
                <span>Filtros</span>
              </div>
              <div className="lpFiltersMeta">{loading ? "Cargando…" : `${filteredUsers.length} usuarios`}</div>
            </div>

            <div className="lpFiltersRow">
              <div className="lpField">
                <label className="lpLabel">Buscar</label>
                <input className="lpInput" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Nombre, correo, técnico o código…" />
              </div>

              <div className="lpField">
                <label className="lpLabel">Rol</label>
                <select className="lpInput" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="ALL">Todos</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="TECHNICIAN">Técnico</option>
                </select>
              </div>

              <div className="lpField">
                <label className="lpLabel">Estado</label>
                <select className="lpInput" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="INACTIVE">Inactivos</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="lpMuted" style={{ marginTop: 12 }}>Cargando usuarios…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="lpMuted" style={{ marginTop: 12 }}>No hay usuarios con este filtro.</div>
          ) : (
            <div className="lpUsersGrid">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  u={user}
                  toggling={togglingId === user.id}
                  onToggle={() => toggleUserStatus(user)}
                  onEdit={() => openEditModal(user)}
                  onPwd={() => openPwdModal(user)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "LINKS" ? (
        <div className="lpTabPane">
          {linksErr ? <div className="lpErrorBox">{linksErr}</div> : null}
          <div className="lpCard lpLinksCard">
            <div className="lpLinksHeader">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="lpHdrIcon"><Icon name="route" /></span>
                <div style={{ fontWeight: 980, color: "#0f172a" }}>Vincular técnicos ↔ usuarios</div>
              </div>

              <label className="lpCheck">
                <input type="checkbox" checked={syncName} onChange={(event) => setSyncName(event.target.checked)} />
                <span>Sincronizar nombre</span>
              </label>
            </div>

            <div className="lpMuted" style={{ marginTop: 6 }}>
              Define qué usuario técnico corresponde a qué registro operativo para actividades, filtros y trazabilidad.
            </div>

            {linksLoading ? (
              <div className="lpMuted" style={{ marginTop: 12 }}>Cargando vínculos...</div>
            ) : techUsers.length === 0 ? (
              <div className="lpMuted" style={{ marginTop: 12 }}>No hay usuarios técnicos activos.</div>
            ) : (
              <div className="lpLinksList">
                {techUsers.map((user) => {
                  const currentTechId = user.technicianId != null ? Number(user.technicianId) : null;
                  return (
                    <div key={user.id} className="lpLinkRow">
                      <div style={{ minWidth: 0 }}>
                        <div className="lpLinkTitle">
                          <span style={{ fontWeight: 980 }}>{user.name}</span>
                          <span className="lpLinkTag">{user.email}</span>
                        </div>
                        <div className="lpLinkSub">
                          T?cnico ligado: <b>{user.technician ? `${user.technician.name}${user.technician.code ? ` (${user.technician.code})` : ""}` : "?"}</b>
                        </div>
                      </div>

                      <div className="lpLinkActions">
                        <select
                          className="lpInput"
                          value={currentTechId ?? ""}
                          onChange={(event) => onChangeLink(user, event.target.value)}
                          disabled={busyUserId === user.id}
                          style={{ minWidth: 0, width: "100%", maxWidth: 360 }}
                          title="Selecciona el técnico correspondiente"
                        >
                          <option value="">? Sin técnico ?</option>
                          {technicians.map((tech) => {
                            const takenByOther = tech.user?.id && Number(tech.user.id) !== Number(user.id);
                            const label = `${tech.name}${tech.code ? ` (${tech.code})` : ""}${takenByOther ? ` ? Ocupado por ${tech.user?.name}` : ""}`;
                            return (
                              <option key={tech.id} value={tech.id} disabled={takenByOther}>
                                {label}
                              </option>
                            );
                          })}
                        </select>

                        <button
                          type="button"
                          className="lpBtnGhost lpPress"
                          onClick={() => onChangeLink(user, "")}
                          disabled={busyUserId === user.id || currentTechId == null}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="lpHint">
              Tip: si un técnico se da de baja, mantén el usuario para historial y solo desvincúlalo aquí.
            </div>
          </div>
        </div>
      ) : null}

      {showModal ? (
        <div className="lpModalOverlay" onClick={(event) => event.target.classList.contains("lpModalOverlay") && closeModal()}>
          <div className="lpModal lpModalWide">
            <div className="lpModalHeader">
              <div>
                <div style={{ fontWeight: 980, fontSize: 16 }}>{editingUser ? "Editar usuario" : "Nuevo usuario"}</div>
                <div className="lpMuted" style={{ marginTop: 4 }}>
                  {editingUser
                    ? "Actualiza rol, vínculo técnico y acceso por planta."
                    : "Crea la cuenta, define contraseña inicial y deja el acceso listo desde aquí."}
                </div>
              </div>
              <button className="lpBtnGhost lpPress" onClick={closeModal} type="button" title="Cerrar">
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="lpModalGrid2">
                <label className="lpModalLabel">
                  Nombre
                  <input className="lpInput" value={form.name} onChange={onChangeForm("name")} required />
                </label>

                <label className="lpModalLabel">
                  Correo
                  <input className="lpInput" type="email" value={form.email} onChange={onChangeForm("email")} required />
                </label>
              </div>

              <div className="lpModalGrid2">
                <label className="lpModalLabel">
                  Rol
                  <select className="lpInput" value={form.role} onChange={onChangeForm("role")}>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                    ))}
                  </select>
                </label>

                {isTechRole ? (
                  <label className="lpModalLabel">
                    Técnico vinculado
                    <select className="lpInput" value={form.technicianId} onChange={onChangeForm("technicianId")} required disabled={techLoading}>
                      {editingUser?.technicianId && !availableTechs.some((tech) => String(tech.id) === String(editingUser.technicianId)) ? (
                        <option value={String(editingUser.technicianId)}>Técnico actual (ID {editingUser.technicianId})</option>
                      ) : null}
                      <option value="">{techLoading ? "Cargando técnicos…" : "Selecciona un técnico"}</option>
                      {availableTechs.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}{tech.code ? ` · ${tech.code}` : ""}{tech.status ? ` · ${tech.status}` : ""}
                        </option>
                      ))}
                    </select>
                    {techError ? <div className="lpModalError">{techError}</div> : null}
                  </label>
                ) : (
                  <div className="lpModalInfoCard">
                    <div className="lpModalInfoTitle">Acceso operativo</div>
                    <div className="lpMuted">Este rol no requiere vínculo con un técnico operativo.</div>
                  </div>
                )}
              </div>

              {!editingUser ? (
                <div className="lpModalSection">
                  <div className="lpModalSectionTitle">Contraseña inicial</div>
                  <div className="lpMuted">El administrador la define aquí y deja la cuenta lista desde el primer ingreso.</div>
                  <div className="lpModalGrid2" style={{ marginTop: 10 }}>
                    <label className="lpModalLabel">
                      Contraseña inicial
                      <div className="lpInputCombo">
                        <input className="lpInput" type={showNewPwd ? "text" : "password"} value={newPwd} onChange={(event) => setNewPwd(event.target.value)} placeholder="Mínimo 6 caracteres" />
                        <button type="button" className="lpBtnGhost lpPress" onClick={() => setShowNewPwd((value) => !value)}>
                          {showNewPwd ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                    </label>

                    <label className="lpModalLabel">
                      Confirmar contraseña
                      <div className="lpInputCombo">
                        <input className="lpInput" type={showNewPwd2 ? "text" : "password"} value={newPwd2} onChange={(event) => setNewPwd2(event.target.value)} />
                        <button type="button" className="lpBtnGhost lpPress" onClick={() => setShowNewPwd2((value) => !value)}>
                          {showNewPwd2 ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              ) : null}

              <div className="lpModalSection">
                <div className="lpModalSectionTitle">Plantas asignadas</div>
                <div className="lpMuted">Define en qué plantas puede operar el usuario y cuál será su planta por defecto.</div>
                {plantsError ? <div className="lpModalError">{plantsError}</div> : null}
                {plantsLoading ? (
                  <div className="lpMuted" style={{ marginTop: 10 }}>Cargando plantas…</div>
                ) : plantOptions.length === 0 ? (
                  <div className="lpMuted" style={{ marginTop: 10 }}>No hay plantas disponibles.</div>
                ) : (
                  <div className="lpPlantsList">
                    {plantOptions.map((plant) => (
                      <div key={plant.plantId} className="lpPlantRow">
                        <label className="lpPlantLeft">
                          <input type="checkbox" checked={!!plant.assigned} onChange={() => togglePlantAssigned(plant.plantId)} />
                          <span><b>{plant?.plant?.name || `Planta ${plant.plantId}`}</b></span>
                        </label>
                        <label className="lpPlantRight">
                          <input type="radio" name="defaultPlant" checked={!!plant.isDefault} disabled={!plant.assigned || !plant.active} onChange={() => setDefaultPlant(plant.plantId)} />
                          <span>Por defecto</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error ? <div className="lpModalError">{error}</div> : null}

              <div className="lpModalActions">
                <button type="button" className="lpBtnGhost lpPress" onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className="lpBtnPrimary lpPress" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showPwdModal ? (
        <div className="lpModalOverlay" onClick={(event) => event.target.classList.contains("lpModalOverlay") && closePwdModal()}>
          <div className="lpModal">
            <div className="lpModalHeader">
              <div>
                <div style={{ fontWeight: 980, fontSize: 16 }}>Asignar contraseña</div>
                <div className="lpMuted" style={{ marginTop: 4 }}>Usuario: <b style={{ color: "#0f172a" }}>{pwdUser?.email}</b></div>
              </div>
              <button className="lpBtnGhost lpPress" onClick={closePwdModal} type="button" title="Cerrar">
                <Icon name="close" />
              </button>
            </div>

            <div className="lpModalInfoCard">
              <div className="lpModalInfoTitle">Seguridad</div>
              <div className="lpMuted">La contraseña actual no puede visualizarse porque el sistema solo guarda su hash. Aquí puedes definir una nueva, verla y copiarla antes de cerrar.</div>
            </div>

            {pwdAssigned ? (
              <div className="lpPasswordResult">
                <div className="lpPasswordResultTitle">Nueva contraseña asignada</div>
                <div className="lpPasswordValue">{pwdAssigned}</div>
                <button type="button" className="lpBtnGhost lpPress" onClick={copyAssignedPassword}>
                  <span className="lpBtnRow"><Icon name="download" />Copiar contraseña</span>
                </button>
              </div>
            ) : null}

            <form onSubmit={handleSetPassword}>
              <label className="lpModalLabel">
                Nueva contraseña
                <div className="lpInputCombo">
                  <input className="lpInput" type={showPwd ? "text" : "password"} value={pwd} onChange={(event) => setPwd(event.target.value)} required placeholder="Mínimo 6 caracteres" />
                  <button type="button" className="lpBtnGhost lpPress" onClick={() => setShowPwd((value) => !value)}>{showPwd ? "Ocultar" : "Mostrar"}</button>
                </div>
              </label>

              <label className="lpModalLabel">
                Confirmar contraseña
                <div className="lpInputCombo">
                  <input className="lpInput" type={showPwd2 ? "text" : "password"} value={pwd2} onChange={(event) => setPwd2(event.target.value)} required />
                  <button type="button" className="lpBtnGhost lpPress" onClick={() => setShowPwd2((value) => !value)}>{showPwd2 ? "Ocultar" : "Mostrar"}</button>
                </div>
              </label>

              {pwdError ? <div className="lpModalError">{pwdError}</div> : null}

              <div className="lpModalActions">
                <button type="button" className="lpBtnGhost lpPress" onClick={closePwdModal} disabled={pwdSaving}>Cancelar</button>
                <button type="submit" className="lpBtnPrimary lpPress" disabled={pwdSaving}>{pwdSaving ? "Guardando…" : "Asignar"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}

function KpiCard({ title, value, icon }) {
  return (
    <div className="lpCard lpKpiCard">
      <div className="lpKpiBand" />
      <div className="lpKpiBody">
        <div className="lpKpiIcon"><Icon name={icon} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="lpKpiTitle">{title}</div>
          <div className="lpKpiValue">{value}</div>
        </div>
      </div>
    </div>
  );
}

function UserCard({ u, toggling, onToggle, onEdit, onPwd }) {
  const role = roleChip(u?.role);
  const status = statusChip(!!u?.active);
  const password = passwordChip(!!u?.hasPassword);
  const lastActivityText = u?.lastActivityAt
    ? `${fmtDateTime(u.lastActivityAt)}${u?.lastActivityRouteName ? ` · ${u.lastActivityRouteName}` : ""}${u?.lastActivityStatus ? ` · ${String(u.lastActivityStatus).toUpperCase()}` : ""}`
    : "Sin actividad registrada";

  return (
    <div className="lpCard lpUserCard">
      <div className="lpUserTopRow">
        <div className="lpUserIconSlate"><Icon name="user" /></div>
        <div style={{ minWidth: 0 }}>
          <div className="lpUserName">{u?.name || "—"}</div>
          <div className="lpUserEmail">{u?.email || "—"}</div>
        </div>
        <div className="lpUserChips">
          <span className="lpChip" style={{ background: role.bg, color: role.fg }}>
            <span className="lpChipRow"><Icon name={role.icon} />{ROLE_LABEL[toRole(u?.role)] || role.label}</span>
          </span>
          <span className="lpChip" style={{ background: status.bg, color: status.fg }}>
            <span className="lpChipRow"><Icon name={status.icon} />{status.label}</span>
          </span>
        </div>
      </div>

      <div className="lpUserMeta">
        <div className="lpMetaItem"><Icon name="tag" /><span><b>Técnico:</b> {buildTechLabel(u)}</span></div>
        <div className="lpMetaItem"><Icon name="building" /><span><b>Plantas:</b> {buildPlantsText(u)}</span></div>
        <div className="lpMetaItem"><Icon name="lock" /><span><b>Contraseña:</b> <span className="lpInlineStatus" style={{ background: password.bg, color: password.fg }}>{password.label}</span></span></div>
        <div className="lpMetaItem"><Icon name="calendar" /><span><b>Última actividad:</b> {lastActivityText}</span></div>
      </div>

      <div className="lpUserActions">
        <button className="lpBtnGhost lpPress" onClick={onEdit} type="button" title="Editar usuario">
          <span className="lpBtnRow"><Icon name="edit" />Editar</span>
        </button>
        <button className="lpBtnGhost lpPress" onClick={onPwd} type="button" title="Asignar o resetear contraseña">
          <span className="lpBtnRow"><Icon name="lock" />Contraseña</span>
        </button>
        <button className={u?.active ? "lpBtnDanger lpPress" : "lpBtnDark lpPress"} onClick={onToggle} disabled={toggling} type="button" title="Cambiar estado">
          <span className="lpBtnRow"><Icon name={u?.active ? "warn" : "check"} />{toggling ? "…" : u?.active ? "Desactivar" : "Activar"}</span>
        </button>
      </div>
    </div>
  );
}
