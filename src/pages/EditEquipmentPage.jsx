// src/pages/EditEquipmentPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import {
  getEquipmentById,
  updateEquipment,
  assignEquipmentTechnician,
} from "../services/equipmentService";
import { getEquipmentAreas } from "../services/equipmentAreasService";
import { getTechnicians } from "../services/techniciansService";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";

// (Opcional) Si ya est?s usando lucide-react en el proyecto:
import { ArrowLeft, Save, X, UserPlus, ShieldAlert } from "lucide-react";

export default function EditEquipmentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipmentId = useMemo(() => Number(id), [id]);

  // =========================
  // ? AUTH / PERMISSIONS
  // =========================
  const { user } = useAuth();
  const { currentPlantId } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();

  const canEditEquipment = role === "ADMIN" || role === "SUPERVISOR";
  const canAssignTech = canEditEquipment;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [areas, setAreas] = useState([]);
  const [areaErr, setAreaErr] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    areaId: "",
    location: "",
    criticality: "MEDIA",
    status: "ACTIVO",
    description: "",
  });

  // =========================
  // Asignación técnico masiva
  // =========================
  const [techs, setTechs] = useState([]);
  const [techId, setTechId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignErr, setAssignErr] = useState("");
  const [assignMsg, setAssignMsg] = useState("");
  const [forceAssign, setForceAssign] = useState(false);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const criticalityHelp = useMemo(() => {
    const c = String(form.criticality || "MEDIA").toUpperCase();
    if (c === "CRITICA") return "Impacto directo en seguridad/producción. Prioridad máxima.";
    if (c === "ALTA") return "Impacto alto. Requiere atención prioritaria.";
    if (c === "MEDIA") return "Impacto moderado. Mantenimiento planeado.";
    return "Impacto bajo. Riesgo limitado.";
  }, [form.criticality]);

  const normalizeCode = (v) =>
    String(v ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "-");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const loadAreas = async () => {
    try {
      setAreaErr("");
      const json = await getEquipmentAreas();
      const list = Array.isArray(json?.result)
        ? json.result
        : Array.isArray(json)
        ? json
        : [];
      setAreas(list);
    } catch (e) {
      console.error(e);
      setAreas([]);
      setAreaErr(e?.message || "No se pudieron cargar áreas");
    }
  };

  const loadEquipment = async () => {
    try {
      setError("");

      if (!Number.isFinite(equipmentId)) {
        setError("ID inválido");
        return;
      }

      const eq = await getEquipmentById(equipmentId);

      setForm({
        code: eq?.code ?? "",
        name: eq?.name ?? "",
        areaId: eq?.areaId != null ? String(eq.areaId) : "",
        location: eq?.location ?? "",
        criticality: (eq?.criticality ?? "MEDIA").toUpperCase(),
        status: (eq?.status ?? "ACTIVO").toUpperCase(),
        description: eq?.description ?? "",
      });
    } catch (e) {
      console.error(e);
      setError(e?.message || "No se pudo cargar el equipo");
    }
  };

  const loadTechs = async () => {
    try {
      const data = await getTechnicians();
      setTechs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setTechs([]);
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!currentPlantId) {
          setAreas([]);
          setTechs([]);
          setError("");
          setLoading(false);
          return;
        }

        setLoading(true);
        await Promise.all([loadAreas(), loadEquipment()]);
        if (!alive) return;
        if (canAssignTech) await loadTechs();
        else setTechs([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlantId, equipmentId, canAssignTech]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEditEquipment) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        code: normalizeCode(form.code) || null,
        name: String(form.name || "").trim(),
        location: String(form.location || "").trim(),
        status: String(form.status || "ACTIVO").trim().toUpperCase(),
        criticality: String(form.criticality || "MEDIA").trim().toUpperCase(),
        description: String(form.description || "").trim() || null,
        areaId: form.areaId ? Number(form.areaId) : null,
      };

      if (!payload.name || !payload.location || !payload.status) {
        setError("Nombre, ubicación y estado son obligatorios.");
        return;
      }

      await updateEquipment(equipmentId, payload);

      alert("Equipo actualizado ?");
      navigate("/equipments");
    } catch (e2) {
      console.error(e2);
      setError(e2?.message || "Error actualizando equipo");
    } finally {
      setSaving(false);
    }
  };

  const onAssignAll = async () => {
    if (!canAssignTech) return;
    if (!techId || !Number.isFinite(equipmentId)) return;

    try {
      setAssignErr("");
      setAssignMsg("");
      setAssigning(true);

      const resp = await assignEquipmentTechnician(equipmentId, Number(techId), {
        from: fromDate,
        force: forceAssign,
      });

      const updated = resp?.updated ?? resp?.count ?? resp?.updatedCount;

      setAssignMsg(
        updated != null
          ? `Listo · Se asignó a ${updated} actividad(es).`
          : "Listo · Se aplicó la asignación."
      );
    } catch (e) {
      console.error(e);
      setAssignErr(e?.message || "Error asignando técnico");
    } finally {
      setAssigning(false);
    }
  };

  // =========================
  // ? UI: bloqueo TECHNICIAN
  // =========================
  if (!canEditEquipment) {
    return (
      <MainLayout>
        <div style={pageShell}>
          <div style={blockedWrap}>
            <div style={blockedCard}>
              <div style={blockedHeader}>
                <div style={blockedIcon}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div style={blockedTitle}>Acceso restringido</div>
                  <div style={blockedSub}>
                    Tu perfil es <b>{role}</b>. Esta pantalla es solo para <b>ADMIN</b> o <b>SUPERVISOR</b>.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => navigate("/equipments")} style={btnPrimary}>
                  Volver a equipos
                </button>
                <button type="button" onClick={() => navigate("/dashboard")} style={btnGhost}>
                  Ir al dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={pageShell}>
        {/* TOP BAR */}
        <div style={topBar}>
          <div style={headerRow}>
            <div style={headerLeft}>
              <div style={headerBadgeRow}>
  <span style={headerBadge}>
    {form.code ? normalizeCode(form.code) : `ID ${equipmentId}`}
  </span>
  <span style={headerBadgeSub}>
    {form.name ? String(form.name).trim() : "?"}
  </span>
</div>
<h1 style={title}>Editar equipo</h1>
              <div style={subtitle}>
                Actualiza datos: código/tag - área - criticidad - estado
              </div>
            </div>



            <div style={headerRight}>
              <button type="button" onClick={() => navigate("/equipments")} style={btnHeaderGhost}>
                <ArrowLeft size={16} strokeWidth={2} />
                Volver
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: 14 }}>
            <div style={loadingCard}>Cargando</div>
          </div>
        ) : (
          <div style={layoutGrid}>
            {/* FORM */}
            <form onSubmit={handleSubmit} style={formCard}>
              <div style={cardTopAccent} />

              <div style={cardHeader}>
                <div>
                  <div style={cardTitle}>Datos del equipo</div>
                  <div style={cardHint}>Los campos con * son obligatorios.</div>
                </div>

                <div style={statusPill(form.status)}>
                  {form.status === "ACTIVO" ? "ACTIVO" : "INACTIVO"}
                </div>
              </div>

              {error ? <div style={{ marginBottom: 12, ...miniError }}>{error}</div> : null}

              <div style={grid2}>
                <Field label="Código / Tag">
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="Ej: MTR-L1-001"
                    style={input}
                  />
                  <small style={hint}>
                    Recomendado: único y legible. Se normaliza a may?sculas con guiones.
                  </small>
                </Field>

                <Field label="Estado *">
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    style={input}
                    required
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </Field>
              </div>

              <div style={grid2}>
                <Field label="Nombre del equipo *">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ej: Motor Principal Línea 1"
                    style={input}
                    required
                  />
                </Field>

                <Field label="Ubicación *">
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Ej: Planta 1 - Zona A"
                    style={input}
                    required
                  />
                </Field>
              </div>

              <div style={grid2}>
                <Field label="área *">
                  <select
                    name="areaId"
                    value={form.areaId}
                    onChange={handleChange}
                    style={input}
                    required
                  >
                    <option value="">Selecciona un área</option>
                    {areas.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name}
                      </option>
                    ))}
                  </select>

                  {areaErr ? <div style={{ marginTop: 8, ...miniError }}>{areaErr}</div> : null}
                  <small style={hint}>Se usa para filtrar y agrupar equipos por área.</small>
                </Field>

                <Field label="Criticidad *">
                  <select
                    name="criticality"
                    value={form.criticality}
                    onChange={handleChange}
                    style={input}
                    required
                  >
                    <option value="BAJA">BAJA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                    <option value="CRITICA">CRÍTICA</option>
                  </select>

                  <div style={critBox(form.criticality)}>
                    <div style={critTitle}>Guía rápida</div>
                    <div style={critText}>{criticalityHelp}</div>
                  </div>
                </Field>
              </div>

              <Field label="Descripción / Notas">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Información adicional del equipo?"
                  rows={4}
                  style={{ ...input, resize: "vertical", minHeight: 110 }}
                />
              </Field>

              {/* ? Sticky actions */}
              <div style={stickyActions}>
                <button
                  type="button"
                  onClick={() => navigate("/equipments")}
                  style={btnSecondary}
                  disabled={saving}
                >
                  <X size={16} strokeWidth={2} />
                  Cancelar
                </button>

                <button type="submit" style={btnPrimaryOrange} disabled={saving}>
  <Save size={16} strokeWidth={2} />
  {saving ? "Guardando..." : "Guardar cambios"}
</button>
              </div>
            </form>

            {/* SIDE */}
            <div style={side}>
              {/* Asignación */}
              {canAssignTech ? (
                <div style={sideCard}>
                  <div style={sideHeader}>
                    <div style={sideTitle}>Asignar técnico</div>
                    <div style={sideBadge}>Masivo</div>
                  </div>

                  <div style={sideDesc}>
                    Asigna el técnico a las actividades (ejecuciones) ligadas a las rutas de este equipo.
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    <div>
                      <div style={miniLbl2}>Técnico</div>
                      <select value={techId} onChange={(e) => setTechId(e.target.value)} style={input}>
                        <option value="">Selecciona un técnico</option>
                        {techs.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} {t.code ? `(${t.code})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div style={miniLbl2}>Desde</div>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={input}
                      />
                    </div>

                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={forceAssign}
                        onChange={(e) => setForceAssign(e.target.checked)}
                      />
                      <span style={checkText}>Sobrescribir si ya tiene tecnico</span>
                    </label>

                    <button
                      type="button"
                      onClick={onAssignAll}
                      disabled={!techId || assigning}
                      style={{
                        ...btnPrimaryDark,
                        width: "100%",
                        opacity: !techId || assigning ? 0.6 : 1,
                        cursor: !techId || assigning ? "not-allowed" : "pointer",
                      }}
                    >
                      <UserPlus size={16} strokeWidth={2} />
                      {assigning ? "Asignando..." : "Asignar a todo el equipo"}
                    </button>

                    {assignErr ? <div style={miniError}>{assignErr}</div> : null}
                    {assignMsg ? <div style={miniOk}>{assignMsg}</div> : null}
                  </div>
                </div>
              ) : null}

              <div style={sideCard}>
                <div style={sideTitle}>Tips</div>
                <ul style={sideList}>
                  <li><b>Tag</b>: evita espacios, usa patrón fijo.</li>
                  <li><b>Área</b>: mantén nombres consistentes (Planta/Línea).</li>
                  <li><b>Criticidad</b>: Úsala para priorizar rutas/alertas.</li>
                </ul>
              </div>

              <div style={sideCard}>
                <div style={sideTitle}>Atajo</div>
                <div style={sideDesc}>Regresa al listado para ver equipos agrupados por área.</div>

                <button
                  type="button"
                  style={{ ...btnSecondary, marginTop: 12, width: "100%" }}
                  onClick={() => navigate("/equipments")}
                >
                  Ver equipos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

/* ================== UI ================== */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* ================== STYLES ================== */
const pageShell = {
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};

const topBar = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  paddingBottom: 12,
  borderBottom: "1px solid #e5e7eb",
};

const headerRow = {
  width: "100%",
  display: "flex",
  alignItems: "flex-start",
  gap: 16,
};

const headerLeft = { flex: 1, minWidth: 0 };

const headerRight = {
  display: "flex",
  gap: 12,
  justifyContent: "flex-end",
  alignItems: "center",
};

const title = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.2,
};

const subtitle = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const layoutGrid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 360px",
  gap: 14,
};

const loadingCard = {
  background: "rgba(255,255,255,0.85)",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
  fontWeight: 900,
  color: "#334155",
};

const formCard = {
  position: "relative",
  background: "rgba(255,255,255,0.90)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.07)",
  overflow: "hidden",
};

const cardTopAccent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 6,
  background: "rgba(249,115,22,0.85)",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 10,
  flexWrap: "wrap",
  paddingBottom: 12,
  marginBottom: 14,
  borderBottom: "1px solid rgba(226,232,240,0.9)",
};
const cardAccent = {
  height: 6,
  borderRadius: 999,
  marginBottom: 10,
  background: "linear-gradient(90deg, #fb923c 0%, #f97316 45%, rgba(249,115,22,0.12) 100%)",
  boxShadow: "0 10px 18px rgba(249,115,22,0.18)",
};

const cardTitle = { fontWeight: 1000, color: "#0f172a", fontSize: 14 };
const cardHint = { marginTop: 4, fontSize: 12, color: "#64748b", fontWeight: 800 };

const statusPill = (status) => {
  const active = String(status || "").toUpperCase() === "ACTIVO";
  return {
    padding: "7px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 1000,
    border: active ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(148,163,184,0.45)",
    background: active ? "rgba(34,197,94,0.10)" : "rgba(148,163,184,0.12)",
    color: active ? "#166534" : "#334155",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 950,
  fontSize: 12,
  color: "#0f172a",
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

const input = {
  width: "100%",
  border: "1px solid rgba(226,232,240,1)",
  borderRadius: 12,
  padding: "10px 12px",
  outline: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,0.95)",
  boxShadow: "inset 0 1px 0 rgba(2,6,23,0.04)",
};

const hint = {
  display: "block",
  marginTop: 6,
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
};

const critBox = (criticality) => {
  const c = String(criticality || "MEDIA").toUpperCase();
  const isCrit = c === "CRITICA";
  const isHigh = c === "ALTA";
  return {
    marginTop: 10,
    background: isCrit
      ? "rgba(254,242,242,0.75)"
      : isHigh
      ? "rgba(255,247,237,0.75)"
      : "rgba(248,250,252,0.85)",
    border: isCrit
      ? "1px solid rgba(239,68,68,0.25)"
      : isHigh
      ? "1px solid rgba(249,115,22,0.20)"
      : "1px solid rgba(226,232,240,1)",
    borderRadius: 12,
    padding: 12,
  };
};

const critTitle = { fontWeight: 950, fontSize: 12, color: "#0f172a" };
const critText = { marginTop: 6, fontSize: 12, color: "#475569", fontWeight: 800 };

const stickyActions = {
  position: "sticky",
  bottom: 0,
  marginTop: 14,
  paddingTop: 14,
  background: "linear-gradient(180deg, rgba(255,255,255,0.0), rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.95))",
  borderTop: "1px solid rgba(226,232,240,0.95)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const btnPrimary = {
  background: "#0f172a",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #0f172a",
  fontWeight: 950,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const btnPrimaryDark = {
  background: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
  color: "#f9fafb",
  borderRadius: 12,
  padding: "11px 12px",
  fontWeight: 950,
  cursor: "pointer",
  border: "1px solid #374151",
  boxShadow: "0 8px 18px rgba(31,41,55,0.28)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const btnSecondary = {
  background: "rgba(241,245,249,0.90)",
  color: "#0f172a",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,1)",
  fontWeight: 950,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const btnGhost = {
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(226,232,240,1)",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
};

const btnHeaderGhost = {
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(226,232,240,1)",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 950,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const side = { display: "flex", flexDirection: "column", gap: 12 };

const sideCard = {
  background: "rgba(255,255,255,0.90)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 14px 26px rgba(2,6,23,0.06)",
};

const sideHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const sideTitle = { fontWeight: 1000, color: "#0f172a", fontSize: 14 };
const sideDesc = { marginTop: 8, fontSize: 12, color: "#64748b", fontWeight: 800, lineHeight: 1.5 };

const sideBadge = {
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 1000,
  border: "1px solid rgba(226,232,240,1)",
  background: "rgba(249,115,22,0.10)",
  color: "#9a3412",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const sideList = {
  marginTop: 10,
  paddingLeft: 18,
  color: "#334155",
  fontWeight: 800,
  fontSize: 13,
  lineHeight: 1.6,
};

const miniError = {
  background: "#fff1f2",
  border: "1px solid #fecaca",
  padding: "8px 10px",
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 900,
  fontSize: 12,
};

const miniOk = {
  background: "#dcfce7",
  border: "1px solid #86efac",
  padding: "8px 10px",
  borderRadius: 12,
  color: "#166534",
  fontWeight: 900,
  fontSize: 12,
};

const miniLbl2 = { fontSize: 12, fontWeight: 900, color: "#64748b" };

const checkRow = { display: "inline-flex", alignItems: "center", gap: 10 };
const checkText = { fontSize: 12, color: "#334155", fontWeight: 900 };

/* bloqueado */
const blockedWrap = { marginTop: 14, display: "flex", justifyContent: "center" };
const blockedCard = {
  width: "min(720px, 100%)",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.07)",
};
const blockedHeader = { display: "flex", gap: 12, alignItems: "flex-start" };
const blockedIcon = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.25)",
  display: "grid",
  placeItems: "center",
  color: "#9a3412",
};

const headerBadgeRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 2,
};

const headerBadge = {
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid rgba(249,115,22,0.28)",
  background: "rgba(249,115,22,0.12)",
  color: "#9a3412",
  fontWeight: 1000,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  fontSize: 11,
};

const headerBadgeSub = {
  color: "#475569",
  fontWeight: 900,
  fontSize: 12,
  maxWidth: 520,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const btnPrimaryOrange = {
  background: "#f97316",
  color: "#0b1220",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fb923c",
  fontWeight: 1000,
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(249,115,22,0.22)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
const blockedTitle = { fontWeight: 1000, fontSize: 16, color: "#0f172a" };
const blockedSub = { marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 };


