import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { getEquipmentById, assignEquipmentTechnician } from "../services/equipmentService";
import { getTechnicians } from "../services/techniciansService";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import {
  Settings,
  MapPin,
  UserCog,
  Calendar,
  ArrowLeft,
  Route,
  AlertTriangle,
  Wrench,
  Clock3,
  ClipboardList,
} from "lucide-react";

function normalizeEquipmentResponse(data) {
  if (!data) return null;
  if (data?.item) return data.item;
  if (data?.equipment) return data.equipment;
  if (data?.result) return data.result;
  return data;
}

function formatCrit(crit) {
  const v = String(crit || "").toUpperCase().trim();
  if (v === "CRITICA" || v === "CRÍTICA") return "Crítica";
  if (v === "ALTA") return "Alta";
  if (v === "BAJA") return "Baja";
  return "Media";
}

function isCritical(crit) {
  const v = String(crit || "").toUpperCase().trim();
  return v === "CRITICA" || v === "CRÍTICA";
}

function isActiveStatus(status) {
  const v = String(status || "").toUpperCase().trim();
  return v === "ACTIVO" || v === "ACTIVE";
}

function safeCount(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ymdToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function truncate(text, max = 110) {
  const s = String(text || "").trim();
  if (!s) return "—";
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export default function EquipmentDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipmentId = useMemo(() => Number(id), [id]);

  const { user } = useAuth();
  const { currentPlant, currentPlantId } = usePlant();

  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const canAssignTech = role === "ADMIN" || role === "SUPERVISOR";

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [techs, setTechs] = useState([]);
  const [techId, setTechId] = useState("");

  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");

  const [force, setForce] = useState(false);
  const [from, setFrom] = useState(ymdToday());

  const [reloading, setReloading] = useState(false);

  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [showAllExecutions, setShowAllExecutions] = useState(false);
  const [showAllConditions, setShowAllConditions] = useState(false);

  const loadEquipment = async ({ silent = false } = {}) => {
    try {
      setErr("");
      if (silent) setReloading(true);
      else setLoading(true);

      if (!Number.isFinite(equipmentId) || equipmentId <= 0) {
        setEquipment(null);
        setErr("ID de equipo inválido.");
        return;
      }

      const raw = await getEquipmentById(equipmentId);
      const eq = normalizeEquipmentResponse(raw);

      if (!eq) {
        setEquipment(null);
        setErr("No se encontró el equipo.");
        return;
      }

      setEquipment(eq);
    } catch (e) {
      console.error("loadEquipment error:", e);
      setEquipment(null);
      setErr(e?.message || "Error cargando equipo");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    if (!currentPlantId) {
      setEquipment(null);
      setErr("");
      setLoading(false);
      return;
    }

    loadEquipment();
  }, [equipmentId, currentPlantId]);

  useEffect(() => {
    if (!canAssignTech || !currentPlantId) {
      setTechs([]);
      return;
    }

    let alive = true;

    (async () => {
      try {
        const data = await getTechnicians();
        if (!alive) return;

        const list =
          Array.isArray(data?.items) ? data.items :
          Array.isArray(data?.result) ? data.result :
          Array.isArray(data) ? data :
          [];

        setTechs(list);
      } catch (e) {
        console.error("loadTechs error:", e);
        if (!alive) return;
        setTechs([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [canAssignTech, currentPlantId]);

  const onAssign = async () => {
    if (!canAssignTech) return;
    if (!Number.isFinite(equipmentId) || equipmentId <= 0) return;
    if (!techId) return;

    try {
      setErr("");
      setAssignMsg("");
      setAssigning(true);

      const resp = await assignEquipmentTechnician(equipmentId, Number(techId), {
        from,
        force,
      });

      const updated =
        resp?.updatedCount ??
        resp?.updated ??
        resp?.count ??
        resp?.item?.updatedCount ??
        null;

      setAssignMsg(
        updated != null
          ? `Listo. Se asignó el técnico a ${updated} actividad(es).`
          : "Listo. Se aplicó la asignación."
      );

      await loadEquipment({ silent: true });
    } catch (e) {
      console.error("assign technician error:", e);
      setErr(e?.message || "Error asignando técnico");
    } finally {
      setAssigning(false);
    }
  };

  const equipmentName = equipment?.name || "Equipo";
  const equipmentCode = equipment?.code || equipment?.tag || "Sin código";
  const equipmentLocation = equipment?.location || "Sin ubicación";
  const equipmentArea = equipment?.area?.name || "Sin área";
  const equipmentStatus = String(equipment?.status || "").toUpperCase();
  const equipmentCriticality = formatCrit(equipment?.criticality);
  const active = isActiveStatus(equipment?.status);

  const routesCount =
    safeCount(equipment?.routesCount) ||
    safeCount(equipment?._count?.routes) ||
    (Array.isArray(equipment?.routes) ? equipment.routes.length : 0);

  const executionsCount =
    safeCount(equipment?.executionsCount) ||
    safeCount(equipment?._count?.executions) ||
    (Array.isArray(equipment?.executions) ? equipment.executions.length : 0);

  const conditionsCount =
    safeCount(equipment?.conditionReportsCount) ||
    safeCount(equipment?._count?.conditionReports) ||
    (Array.isArray(equipment?.conditionReports) ? equipment.conditionReports.length : 0);

  const routes = Array.isArray(equipment?.routes) ? equipment.routes : [];
  const executions = Array.isArray(equipment?.executions) ? equipment.executions : [];
  const conditionReports = Array.isArray(equipment?.conditionReports) ? equipment.conditionReports : [];

  const visibleRoutes = showAllRoutes ? routes : routes.slice(0, 4);
  const visibleExecutions = showAllExecutions ? executions : executions.slice(0, 5);
  const visibleConditions = showAllConditions ? conditionReports : conditionReports.slice(0, 4);

  const mostUsedTechnician = equipment?.mostUsedTechnician || null;
  const selectedTechnician = techs.find((t) => String(t.id) === String(techId));

  if (loading) {
    return (
      <MainLayout>
        <div style={pageShell}>
          <div style={loadingCard}>
            <div style={loadingTitle}>Cargando detalle del equipo</div>
            <div style={loadingSub}>Estamos obteniendo la información desde backend.</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!equipment) {
    return (
      <MainLayout>
        <div style={pageShell}>
          <div style={topBackRow}>
            <button type="button" onClick={() => navigate("/equipments")} style={btnGhost}>
              <ArrowLeft size={16} />
              Volver a equipos
            </button>
          </div>

          <div style={errorPanel}>
            <div style={errorTitle}>Equipo no encontrado</div>
            <div style={errorText}>{err || "No fue posible cargar el detalle del equipo."}</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={pageShell}>
        <div style={topBackRow}>
          <button type="button" onClick={() => navigate("/equipments")} style={btnGhost}>
            <ArrowLeft size={16} />
            Volver a equipos
          </button>

          <button
            type="button"
            onClick={() => loadEquipment({ silent: true })}
            style={btnGhost}
            disabled={reloading}
          >
            {reloading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <div style={compactHeroCard}>
          <div style={heroAccent} />

          <div style={compactHeroHeader}>
            <div style={compactHeroLeft}>
              <div style={heroIcon}>
                <Settings size={24} strokeWidth={1.9} />
              </div>

              <div style={{ minWidth: 0 }}>
                <h1 style={title}>{equipmentName}</h1>

                <div style={subtitle}>
                  Detalle del equipo
                  {currentPlant?.name ? ` - Planta: ${currentPlant.name}` : ""}
                </div>

                <div style={heroTagsRow}>
                  <span style={codePill}>{equipmentCode}</span>
                  <span style={statusPill(active)}>{equipmentStatus || "—"}</span>
                  <span style={critPill(isCritical(equipment?.criticality))}>
                    Criticidad: {equipmentCriticality}
                  </span>
                  {!canAssignTech ? <span style={readOnlyPill}>Solo visualización</span> : null}
                </div>
              </div>
            </div>
          </div>

          {err ? <div style={errorBox}>{err}</div> : null}
          {assignMsg ? <div style={okBox}>{assignMsg}</div> : null}
        </div>

        <div style={kpiGrid}>
          <InfoCard
            icon={<MapPin size={18} strokeWidth={1.8} />}
            title="Ubicación"
            value={equipmentLocation}
            sub={equipmentArea}
          />
          <InfoCard
            icon={<Route size={18} strokeWidth={1.8} />}
            title="Rutas"
            value={String(routesCount)}
            sub="Ligadas al equipo"
          />
          <InfoCard
            icon={<ClipboardList size={18} strokeWidth={1.8} />}
            title="Historial"
            value={String(executionsCount)}
            sub="Ejecuciones registradas"
          />
          <InfoCard
            icon={<AlertTriangle size={18} strokeWidth={1.8} />}
            title="Condiciones"
            value={String(conditionsCount)}
            sub="Reportes levantados"
          />
        </div>

        <div style={compactMainGrid}>
          <section style={compactPanel}>
            <div style={sectionTitle}>Datos generales</div>

            <div style={compactDetailsGrid}>
              <DetailRow label="Nombre" value={equipmentName} />
              <DetailRow label="Código / TAG" value={equipmentCode} />
              <DetailRow label="Ubicación" value={equipmentLocation} />
              <DetailRow label="Área" value={equipmentArea} />
              <DetailRow label="Estado" value={equipmentStatus || "—"} />
              <DetailRow label="Criticidad" value={equipmentCriticality} />
              <DetailRow label="Marca" value={equipment?.brand || "—"} />
              <DetailRow label="Modelo" value={equipment?.model || "—"} />
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={miniLabel}>Descripción / notas</div>
              <div style={notesBox}>{equipment?.description || "Sin notas adicionales."}</div>
            </div>
          </section>

          <section style={compactPanel}>
            <div style={sectionTitle}>Asignación de técnico</div>

            <div style={summaryMiniCard}>
              <div style={summaryMiniLabel}>Técnico más usado</div>
              <div style={summaryMiniValue}>
                {mostUsedTechnician?.technician?.name || "Sin histórico suficiente"}
              </div>
              <div style={summaryMiniSub}>
                {mostUsedTechnician?.count
                  ? `${mostUsedTechnician.count} ejecución(es)`
                  : "Aún no hay técnico dominante"}
              </div>
            </div>

            {canAssignTech ? (
              <>
                <div style={muted}>
                  Asigna un técnico a las actividades pendientes o vencidas relacionadas con este equipo.
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  <div style={field}>
                    <label style={labelStyle}>Técnico</label>
                    <select
                      value={techId}
                      onChange={(e) => setTechId(e.target.value)}
                      style={select}
                    >
                      <option value="">Selecciona un técnico</option>
                      {techs.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.code ? ` (${t.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={compactTwoCols}>
                    <div style={field}>
                      <label style={labelStyle}>Desde</label>
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        style={dateInput}
                      />
                    </div>

                    <label style={checkCard}>
                      <input
                        type="checkbox"
                        checked={force}
                        onChange={(e) => setForce(e.target.checked)}
                      />
                      <span>Sobrescribir si ya tiene técnico</span>
                    </label>
                  </div>

                  {selectedTechnician ? (
                    <div style={previewBox}>
                      Técnico seleccionado: <b>{selectedTechnician.name}</b>
                      {selectedTechnician.code ? ` · ${selectedTechnician.code}` : ""}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={onAssign}
                    disabled={!techId || assigning}
                    style={{
                      ...btnPrimary,
                      opacity: !techId || assigning ? 0.6 : 1,
                      cursor: !techId || assigning ? "not-allowed" : "pointer",
                    }}
                  >
                    <UserCog size={16} />
                    {assigning ? "Asignando..." : "Asignar a todo el equipo"}
                  </button>
                </div>
              </>
            ) : (
              <div style={emptyBox}>
                Tu perfil es de solo visualización. La asignación de técnicos está disponible para Admin y Supervisor.
              </div>
            )}
          </section>
        </div>

        <div style={compactBottomGrid}>
          <section style={compactPanel}>
            <div style={sectionHeaderRow}>
              <div style={sectionTitle}>Rutas del equipo</div>
              {routes.length > 4 ? (
                <button type="button" style={linkBtn} onClick={() => setShowAllRoutes((v) => !v)}>
                  {showAllRoutes ? "Ver menos" : `Ver todas (${routes.length})`}
                </button>
              ) : null}
            </div>

            {visibleRoutes.length === 0 ? (
              <div style={emptyBox}>Este equipo aún no tiene rutas registradas.</div>
            ) : (
              <div style={stackList}>
                {visibleRoutes.map((r) => (
                  <div key={r.id} style={listCard}>
                    <div style={listTitle}>{r.name || "Ruta"}</div>
                    <div style={listMeta}>
                      <span>{r.lubricantType || "—"}</span>
                      <span>·</span>
                      <span>{r.frequencyDays ? `Cada ${r.frequencyDays} días` : "Frecuencia —"}</span>
                      <span>·</span>
                      <span>Próxima: {fmtDate(r.nextDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={compactPanel}>
            <div style={sectionHeaderRow}>
              <div style={sectionTitle}>Condiciones reportadas</div>
              {conditionReports.length > 4 ? (
                <button type="button" style={linkBtn} onClick={() => setShowAllConditions((v) => !v)}>
                  {showAllConditions ? "Ver menos" : `Ver todas (${conditionReports.length})`}
                </button>
              ) : null}
            </div>

            {visibleConditions.length === 0 ? (
              <div style={emptyBox}>No hay condiciones reportadas para este equipo.</div>
            ) : (
              <div style={stackList}>
                {visibleConditions.map((c) => (
                  <div key={c.id} style={listCard}>
                    <div style={listTitleRow}>
                      <span style={conditionPill(c.condition)}>{c.condition || "—"}</span>
                      <span style={datePill}>{fmtDate(c.detectedAt || c.createdAt)}</span>
                    </div>
                    <div style={listText}>{truncate(c.description, 140)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div style={{ marginTop: 14 }}>
          <section style={compactPanel}>
            <div style={sectionHeaderRow}>
              <div style={sectionTitle}>Historial reciente de ejecución</div>
              {executions.length > 5 ? (
                <button type="button" style={linkBtn} onClick={() => setShowAllExecutions((v) => !v)}>
                  {showAllExecutions ? "Ver menos" : `Ver más (${executions.length})`}
                </button>
              ) : null}
            </div>

            {visibleExecutions.length === 0 ? (
              <div style={emptyBox}>No hay historial de ejecución para este equipo.</div>
            ) : (
              <div style={stackList}>
                {visibleExecutions.map((ex) => (
                  <div key={ex.id} style={historyCard}>
                    <div style={historyTop}>
                      <div style={historyTitle}>{ex?.route?.name || ex?.manualTitle || "Actividad"}</div>
                      <div style={datePill}>
                        {fmtDate(ex.executedAt || ex.scheduledAt)}
                      </div>
                    </div>

                    <div style={historyMeta}>
                      <span>Estado: <b>{ex.status || "—"}</b></span>
                      <span>·</span>
                      <span>Técnico: <b>{ex?.technician?.name || "Sin técnico"}</b></span>
                      <span>·</span>
                      <span>Condición: <b>{ex?.condition || "—"}</b></span>
                    </div>

                    {ex?.observations ? (
                      <div style={historyNotes}>{truncate(ex.observations, 180)}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

function InfoCard({ icon, title, value, sub }) {
  return (
    <div style={kpiCard}>
      <div style={kpiStripe} />
      <div style={kpiInner}>
        <div style={kpiIcon}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={kpiValue} title={value}>{value}</div>
          <div style={kpiTitle}>{title}</div>
          <div style={kpiSub}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

function usePageMobile(breakpoint = 820) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

function DetailRow({ label, value }) {
  return (
    <div style={detailCard}>
      <div style={detailLabel}>{label}</div>
      <div style={detailValue}>{value}</div>
    </div>
  );
}

/* ===== STYLES ===== */

const pageShell = {
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};

const topBackRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 14,
};

const heroCard = {
  position: "relative",
  overflow: "hidden",
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const heroAccent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 10,
  background: "linear-gradient(90deg, rgba(15,23,42,0.92), rgba(30,41,59,0.86))",
};

const heroHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  marginTop: 4,
};

const heroLeft = {
  display: "flex",
  gap: 14,
  minWidth: 0,
  flex: 1,
};

const heroIcon = {
  width: 58,
  height: 58,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.95)",
  border: "1px solid rgba(251,146,60,0.90)",
  color: "#0b1220",
  boxShadow: "0 10px 22px rgba(249,115,22,0.18)",
  flexShrink: 0,
};

const title = {
  margin: 0,
  fontSize: typeof window !== "undefined" && window.innerWidth <= 820 ? 24 : 30,
  fontWeight: 1000,
  color: "#0f172a",
  lineHeight: 1.05,
};

const subtitle = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const heroTagsRow = {
  marginTop: 12,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const codePill = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(15,23,42,0.10)",
  color: "#0f172a",
  fontWeight: 950,
  fontSize: 12,
};

const statusPill = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: 999,
  background: active ? "rgba(34,197,94,0.12)" : "rgba(251,191,36,0.14)",
  border: active ? "1px solid rgba(34,197,94,0.24)" : "1px solid rgba(251,191,36,0.24)",
  color: active ? "#166534" : "#9a3412",
  fontWeight: 950,
  fontSize: 12,
});

const critPill = (critical) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: 999,
  background: critical ? "rgba(239,68,68,0.10)" : "rgba(15,23,42,0.05)",
  border: critical ? "1px solid rgba(239,68,68,0.22)" : "1px solid rgba(15,23,42,0.10)",
  color: critical ? "#991b1b" : "#334155",
  fontWeight: 950,
  fontSize: 12,
});

const readOnlyPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.70)",
  color: "#334155",
  fontWeight: 900,
  fontSize: 12,
};

const kpiGrid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const kpiCard = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.82)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  minHeight: 92,
};

const kpiStripe = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 10,
  background: "rgba(15,23,42,0.88)",
};

const kpiInner = {
  padding: 14,
  paddingTop: 18,
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const kpiIcon = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.90)",
  color: "#0b1220",
  boxShadow: "0 10px 22px rgba(249,115,22,0.18)",
  flexShrink: 0,
};

const kpiValue = {
  fontSize: 22,
  fontWeight: 1000,
  color: "#0f172a",
  lineHeight: 1.05,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const kpiTitle = {
  marginTop: 4,
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const kpiSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#475569",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const mainGrid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "1.15fr 0.85fr",
  gap: 14,
};

const bottomGrid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const panel = {
  background: "#fff",
  borderRadius: 16,
  padding: 16,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const sectionTitle = {
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 15,
};

const sectionHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const detailsGrid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const detailCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  background: "rgba(248,250,252,0.82)",
  padding: 12,
};

const detailLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const detailValue = {
  marginTop: 6,
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.3,
  wordBreak: "break-word",
};

const notesBox = {
  marginTop: 6,
  padding: 12,
  borderRadius: 14,
  background: "rgba(248,250,252,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#334155",
  fontWeight: 800,
  lineHeight: 1.5,
  fontSize: 13,
};

const field = {
  display: "grid",
  gap: 8,
};

const labelStyle = {
  display: "block",
  fontWeight: 950,
  fontSize: 12,
  color: "#0f172a",
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

const select = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "11px 12px",
  fontWeight: 900,
  outline: "none",
  minWidth: 260,
  background: "#fff",
};

const dateInput = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "11px 12px",
  fontWeight: 900,
  outline: "none",
  background: "#fff",
};

const twoCols = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  alignItems: "end",
};

const checkCard = {
  minHeight: 46,
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "rgba(248,250,252,0.82)",
  fontWeight: 900,
  color: "#334155",
};

const previewBox = {
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,247,237,0.85)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "#9a3412",
  fontWeight: 850,
  fontSize: 13,
};

const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#f97316",
  color: "#0b1220",
  border: "1px solid rgba(249,115,22,0.55)",
  borderRadius: 12,
  padding: "11px 14px",
  fontWeight: 950,
  boxShadow: "0 10px 22px rgba(249,115,22,0.18)",
};

const btnGhost = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "rgba(255,255,255,0.75)",
  color: "#0f172a",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const linkBtn = {
  background: "transparent",
  border: "none",
  color: "#2563eb",
  fontWeight: 950,
  cursor: "pointer",
};

const muted = {
  marginTop: 10,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
  lineHeight: 1.4,
};

const summaryMiniCard = {
  marginTop: 12,
  padding: 12,
  borderRadius: 14,
  background: "rgba(248,250,252,0.82)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const summaryMiniLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const summaryMiniValue = {
  marginTop: 6,
  fontSize: 16,
  fontWeight: 950,
  color: "#0f172a",
};

const summaryMiniSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#475569",
};

const miniLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const loadingCard = {
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const loadingTitle = {
  fontWeight: 950,
  color: "#0f172a",
};

const loadingSub = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 13,
};

const errorPanel = {
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  border: "1px solid #fecaca",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const errorTitle = {
  fontWeight: 950,
  color: "#991b1b",
  fontSize: 18,
};

const errorText = {
  marginTop: 8,
  color: "#7f1d1d",
  fontWeight: 800,
  fontSize: 14,
};

const errorBox = {
  marginTop: 12,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 900,
};

const okBox = {
  marginTop: 12,
  background: "#dcfce7",
  border: "1px solid #86efac",
  padding: 12,
  borderRadius: 12,
  color: "#166534",
  fontWeight: 900,
};

const emptyBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  border: "1px dashed #cbd5e1",
  color: "#64748b",
  fontWeight: 800,
  fontSize: 13,
  background: "rgba(248,250,252,0.85)",
};

const stackList = {
  marginTop: 12,
  display: "grid",
  gap: 10,
};

const listCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: 12,
  background: "rgba(248,250,252,0.82)",
};

const listTitle = {
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 14,
};

const listMeta = {
  marginTop: 6,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const listText = {
  marginTop: 8,
  color: "#334155",
  fontWeight: 800,
  fontSize: 13,
  lineHeight: 1.45,
};

const listTitleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const datePill = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(15,23,42,0.10)",
  color: "#334155",
  fontWeight: 900,
  fontSize: 11,
};

const conditionPill = (condition) => {
  const v = String(condition || "").toUpperCase().trim();

  if (v === "CRITICO" || v === "CR?TICO") {
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.22)",
      color: "#991b1b",
      fontWeight: 950,
      fontSize: 11,
    };
  }

  if (v === "MALO") {
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(251,191,36,0.14)",
      border: "1px solid rgba(251,191,36,0.24)",
      color: "#9a3412",
      fontWeight: 950,
      fontSize: 11,
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.06)",
    border: "1px solid rgba(15,23,42,0.10)",
    color: "#334155",
    fontWeight: 950,
    fontSize: 11,
  };
};

const historyCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: 12,
  background: "rgba(248,250,252,0.82)",
};

const historyTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const historyTitle = {
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 14,
};

const historyMeta = {
  marginTop: 8,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  color: "#475569",
  fontWeight: 800,
  fontSize: 12,
};

const historyNotes = {
  marginTop: 8,
  color: "#334155",
  fontWeight: 800,
  fontSize: 13,
  lineHeight: 1.45,
};



