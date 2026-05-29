// src/pages/ConditionReportsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { useConfirm } from "../components/ui/ConfirmDialog";
import {
  getConditionReports,
  updateConditionReportStatus,
  dismissConditionReport,
} from "../services/conditionReportsService";
import CreateCorrectiveExecutionModal from "../components/conditionReports/CreateCorrectiveExecutionModal.jsx";
import { Icon } from "../components/ui/lpIcons";

const STATUS = ["OPEN", "IN_PROGRESS", "RESOLVED", "DISMISSED"];

/* =========================
   Helpers
========================= */
const toYMD = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const niceStatus = (s) => {
  const x = String(s || "").toUpperCase();
  if (x === "OPEN") return "Abierto";
  if (x === "IN_PROGRESS") return "En proceso";
  if (x === "RESOLVED") return "Resuelto";
  if (x === "DISMISSED") return "Descartado";
  return x || "?";
};

const niceCondition = (c) => {
  const x = String(c || "").toUpperCase();
  if (x === "BUENO") return "Bueno";
  if (x === "REGULAR") return "Regular";
  if (x === "MALO") return "Malo";
  if (x === "CRITICO") return "Crítico";
  return x || "?";
};

const niceCategory = (c) => {
  const x = String(c || "");
  return x || "?";
};

const safeUpper = (v) => String(v || "").toUpperCase();

const statusColor = (s) =>
  s === "OPEN"
    ? "#dc2626"
    : s === "IN_PROGRESS"
    ? "#d97706"
    : s === "RESOLVED"
    ? "#16a34a"
    : "#94a3b8";

/* =========================
   Page
========================= */
function ConditionReportsPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const role = safeUpper(user?.role || "TECHNICIAN");
  const canManage = role === "ADMIN" || role === "SUPERVISOR";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [status, setStatus] = useState("");
  const [from, setFrom] = useState(() => toYMD(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => toYMD(new Date()));

  const [openCorrective, setOpenCorrective] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const reqRef = useRef(0);

  const load = async () => {
    const req = ++reqRef.current;
    try {
      setErr("");
      setLoading(true);
      const data = await getConditionReports({
        status: status || null,
        from: from || null,
        to: to || null,
      });
      if (req !== reqRef.current) return;
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error(e);
      if (req !== reqRef.current) return;
      setErr(e?.error || e?.message || "Error cargando reportes");
      setItems([]);
    } finally {
      if (req === reqRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, from, to]);

  const onChangeStatus = async (id, nextStatus) => {
    try {
      setErr("");
      await updateConditionReportStatus(id, nextStatus);
      await load();
    } catch (e) {
      console.error(e);
      setErr(e?.error || e?.message || "Error actualizando status");
    }
  };

  const openCorrectiveModal = (r) => {
    setSelectedReport(r);
    setOpenCorrective(true);
  };

  const closeCorrectiveModal = () => {
    setOpenCorrective(false);
    setSelectedReport(null);
  };

  const counts = useMemo(() => {
    const c = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, DISMISSED: 0 };
    (items || []).forEach((x) => {
      const s = safeUpper(x?.status);
      if (c[s] != null) c[s] += 1;
    });
    return c;
  }, [items]);

  return (
    <MainLayout>

      {/* ── Hero ── */}
      <div style={heroWrap} className="lp-enter">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
          <div style={heroIcon}>
            <Icon name="warn" size="md" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={kicker}>MANTENIMIENTO · REPORTES</div>
            <h1 style={h1}>Reportes de condición</h1>
            <p style={heroSub}>
              {role === "TECHNICIAN"
                ? "Aquí ves los reportes de condición que has generado."
                : "Gestiona y da seguimiento a reportes de condición de los equipos en planta."}
            </p>
            <div style={metaRow}>
              <span style={metaPill}>
                <span style={metaIconBox}><Icon name="calendar" size="sm" /></span>
                <b>{from || "—"}</b>&nbsp;→&nbsp;<b>{to || "—"}</b>
              </span>
              <span style={metaPill}>
                <span style={metaIconBox}><Icon name="user" size="sm" /></span>
                {role}
              </span>
            </div>
          </div>
        </div>

        <button onClick={load} style={refreshBtn} disabled={loading} type="button">
          <Icon name="refresh" size="sm" />
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {/* ── Error ── */}
      {err ? (
        <div style={errorBox} className="lp-enter">
          <div style={errorIconBox}><Icon name="alert" size="sm" /></div>
          <div style={{ fontWeight: 900 }}>{err}</div>
        </div>
      ) : null}

      {/* ── KPI grid ── */}
      <div style={kpiGrid} className="lp-stagger">
        <KpiCard label="Abierto"    count={counts.OPEN}       accent="#dc2626" icon="alert"       />
        <KpiCard label="En proceso" count={counts.IN_PROGRESS} accent="#d97706" icon="clock"       />
        <KpiCard label="Resuelto"   count={counts.RESOLVED}    accent="#16a34a" icon="checkCircle" />
        <KpiCard label="Descartado" count={counts.DISMISSED}   accent="#94a3b8" icon="xCircle"     />
      </div>

      {/* ── Filters ── */}
      <div style={filtersCard} className="lp-enter">
        <div style={filtersHeader}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 950, color: "#0f172a", fontSize: 13 }}>
            <Icon name="search" size="sm" />
            Filtros
          </div>
          <div style={tinyHint}>Combina estado y rango de fechas para encontrar reportes.</div>
        </div>

        <div style={filtersGrid}>
          <label style={filterGroup}>
            <span style={lbl}>Estado</span>
            <select
              className="lp-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inp}
            >
              <option value="">Todos</option>
              {STATUS.map((s) => (
                <option key={s} value={s}>{niceStatus(s)}</option>
              ))}
            </select>
          </label>

          <label style={filterGroup}>
            <span style={lbl}>Desde</span>
            <input
              className="lp-input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={inp}
            />
          </label>

          <label style={filterGroup}>
            <span style={lbl}>Hasta</span>
            <input
              className="lp-input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={inp}
            />
          </label>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div style={loadingBox}>
          <div style={spinnerBox}><Icon name="refresh" size="sm" /></div>
          Cargando reportes…
        </div>
      ) : null}

      {/* ── Empty ── */}
      {!loading && items.length === 0 ? (
        <div style={emptyBox}>
          <div style={emptyIconBox}><Icon name="warn" size="md" /></div>
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 15 }}>Sin reportes</div>
          <div style={{ fontWeight: 850, color: "#64748b", fontSize: 13 }}>
            No hay reportes de condición para el rango y filtros seleccionados.
          </div>
        </div>
      ) : null}

      {/* ── Report list ── */}
      <div style={{ marginTop: 12, display: "grid", gap: 10 }} className="lp-stagger">
        {items.map((r) => {
          const s = safeUpper(r?.status);
          const eq = r?.equipment || {};
          const by = r?.reportedBy || {};
          const detected = r?.detectedAt ? toYMD(r.detectedAt) : "—";
          const sc = statusColor(s);

          return (
            <div
              key={r.id}
              className="lpCard"
              style={{
                ...rowCard,
                borderTop: "1px solid rgba(226,232,240,0.95)",
                borderRight: "1px solid rgba(226,232,240,0.95)",
                borderBottom: "1px solid rgba(226,232,240,0.95)",
                borderLeft: `4px solid ${sc}`,
              }}
            >
              {/* ── Card header row ── */}
              <div style={cardHeader}>
                <div style={eqRow}>
                  <div style={{ ...eqIconBox, background: `${sc}14`, border: `1px solid ${sc}28`, color: sc }}>
                    <Icon name="equipment" size="sm" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={eqName}>
                      {eq?.name || "Equipo"}
                      {eq?.code ? <span style={eqCode}>{eq.code}</span> : null}
                    </div>
                    {eq?.location ? (
                      <div style={eqMeta}>
                        <Icon name="building" size="sm" />
                        {eq.location}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={tagsRow}>
                  <span style={{ ...statusPill, background: `${sc}14`, color: sc, border: `1px solid ${sc}28` }}>
                    {niceStatus(s)}
                  </span>
                  {r?.condition ? (
                    <span style={miniTag}>{niceCondition(r.condition)}</span>
                  ) : null}
                  {r?.category ? (
                    <span style={miniTag}>{niceCategory(r.category)}</span>
                  ) : null}
                </div>
              </div>

              {/* ── Body ── */}
              <div style={cardBody}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={metaChips}>
                    <span style={chip}>
                      <Icon name="calendar" size="sm" />
                      Detectado: {detected}
                    </span>
                    <span style={chip}>
                      <Icon name="user" size="sm" />
                      {by?.name || "—"}{by?.role ? ` · ${safeUpper(by.role)}` : ""}
                    </span>
                  </div>

                  {r?.description ? (
                    <p style={descText}>{r.description}</p>
                  ) : null}

                  {r?.correctiveExecutionId || r?.correctiveScheduledAt ? (
                    <div style={followUpBox}>
                      <div style={followUpLabel}>
                        <Icon name="tool" size="sm" /> Seguimiento correctivo
                      </div>
                      <div style={followUpMeta}>
                        {r?.correctiveExecutionId
                          ? `Ejecución #${r.correctiveExecutionId}`
                          : "Acción correctiva programada"}
                        {r?.correctiveScheduledAt
                          ? ` → ${toYMD(r.correctiveScheduledAt)}`
                          : ""}
                      </div>
                    </div>
                  ) : null}

                  {r?.status === "DISMISSED" && r?.dismissedAt ? (
                    <div style={dismissedBox}>
                      <Icon name="xCircle" size="sm" />
                      Descartado el {toYMD(r.dismissedAt)}
                    </div>
                  ) : null}

                  {r?.evidenceImage ? (
                    <div style={{ marginTop: 10 }}>
                      <div style={sectionLbl}>
                        <Icon name="eye" size="sm" /> Evidencia fotográfica
                      </div>
                      <a
                        href={r.evidenceImage}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block" }}
                        onClick={(e) => e.stopPropagation()}
                        title="Abrir evidencia"
                      >
                        <img
                          src={r.evidenceImage}
                          alt="Evidencia"
                          style={evidenceImg}
                          loading="lazy"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </a>
                    </div>
                  ) : null}
                </div>

                {/* ── Actions column ── */}
                {canManage ? (
                  <div style={actionsCol}>
                    {!r?.correctiveExecutionId ? (
                      <button
                        type="button"
                        onClick={() => openCorrectiveModal(r)}
                        style={btnAction}
                        title="Programar acción correctiva"
                      >
                        <Icon name="tool" size="sm" />
                        Programar acción
                      </button>
                    ) : null}

                    {s !== "RESOLVED" && s !== "DISMISSED" ? (
                      <button
                        type="button"
                        style={btnDanger}
                        onClick={async () => {
                          const ok = await confirm("¿Descartar este reporte de condición?", {
                            title: "Descartar reporte",
                            confirmLabel: "Descartar",
                            danger: true,
                          });
                          if (!ok) return;
                          await dismissConditionReport(r.id);
                          await load();
                        }}
                        title="Descartar reporte"
                      >
                        <Icon name="xCircle" size="sm" />
                        Descartar
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal ── */}
      <CreateCorrectiveExecutionModal
        open={openCorrective}
        onClose={closeCorrectiveModal}
        report={selectedReport}
        onSaved={async () => {
          closeCorrectiveModal();
          await load();
        }}
      />
    </MainLayout>
  );
}

export default ConditionReportsPage;

/* =========================
   Sub-components
========================= */

function KpiCard({ label, count, accent, icon }) {
  return (
    <div
      className="lp-enter"
      style={{
        borderRadius: 18,
        borderTop: `4px solid ${accent}`,
        borderRight: "1px solid rgba(226,232,240,0.95)",
        borderBottom: "1px solid rgba(226,232,240,0.95)",
        borderLeft: "1px solid rgba(226,232,240,0.95)",
        padding: "14px 16px",
        background: "#fff",
        boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            display: "grid",
            placeItems: "center",
            background: `${accent}14`,
            border: `1px solid ${accent}28`,
            color: accent,
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size="sm" />
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 950,
            color: accent,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
        {count}
      </div>
    </div>
  );
}

/* =========================
   Styles
========================= */

const ACCENT = "#f97316";

const heroWrap = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  flexWrap: "wrap",
  padding: "18px 20px 16px",
  borderRadius: 22,
  borderTop: `4px solid #0f172a`,
  borderRight: "1px solid rgba(226,232,240,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  borderLeft: `4px solid ${ACCENT}`,
  background: `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 55%, rgba(255,247,237,0.65) 100%)`,
  boxShadow: "0 18px 36px rgba(2,6,23,0.07)",
};

const heroIcon = {
  width: 46,
  height: 46,
  borderRadius: 15,
  display: "grid",
  placeItems: "center",
  background: `${ACCENT}18`,
  border: `1px solid ${ACCENT}30`,
  color: ACCENT,
  flexShrink: 0,
};

const kicker = {
  fontSize: 10,
  fontWeight: 950,
  color: ACCENT,
  letterSpacing: 1.4,
  textTransform: "uppercase",
};

const h1 = {
  margin: "4px 0 0",
  fontSize: 24,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
};

const heroSub = {
  margin: "6px 0 0",
  color: "#64748b",
  fontWeight: 850,
  fontSize: 13,
  lineHeight: 1.45,
};

const metaRow = { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" };

const metaPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 999,
  padding: "6px 10px",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  fontWeight: 900,
  fontSize: 12,
  color: "#334155",
};

const metaIconBox = {
  width: 22,
  height: 22,
  borderRadius: 8,
  display: "grid",
  placeItems: "center",
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#0f172a",
};

const refreshBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.88)",
  borderRadius: 14,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 13,
  color: "#0f172a",
  boxShadow: "0 8px 20px rgba(2,6,23,0.05)",
  flexShrink: 0,
  alignSelf: "flex-start",
};

const errorBox = {
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "rgba(254,242,242,0.90)",
  border: "1px solid rgba(252,165,165,0.60)",
  borderLeft: "4px solid #dc2626",
  padding: "12px 14px",
  borderRadius: 14,
  color: "#991b1b",
  fontWeight: 900,
};

const errorIconBox = {
  width: 32,
  height: 32,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  flexShrink: 0,
};

const kpiGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const filtersCard = {
  marginTop: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  borderLeft: `3px solid ${ACCENT}60`,
  borderRadius: 18,
  padding: "14px 16px",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 10px 24px rgba(2,6,23,0.05)",
};

const filtersHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const tinyHint = { fontSize: 12, fontWeight: 850, color: "#94a3b8" };

const filtersGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 10,
};

const filterGroup = { display: "grid", gap: 6 };

const lbl = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const inp = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  background: "#fff",
  color: "#0f172a",
  width: "100%",
};

const loadingBox = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "18px 16px",
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.88)",
  fontWeight: 900,
  color: "#475569",
  fontSize: 13,
  marginTop: 12,
};

const spinnerBox = {
  width: 28,
  height: 28,
  borderRadius: 9,
  display: "grid",
  placeItems: "center",
  background: `${ACCENT}14`,
  border: `1px solid ${ACCENT}28`,
  color: ACCENT,
  flexShrink: 0,
};

const emptyBox = {
  padding: "40px 20px",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.90)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  textAlign: "center",
  boxShadow: "0 12px 28px rgba(2,6,23,0.04)",
  marginTop: 12,
};

const emptyIconBox = {
  width: 52,
  height: 52,
  borderRadius: 18,
  background: "rgba(15,23,42,0.06)",
  display: "grid",
  placeItems: "center",
  color: "#94a3b8",
};

const rowCard = {
  borderRadius: 18,
  padding: "14px 16px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.90) 100%)",
  boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
  display: "grid",
  gap: 12,
};

const cardHeader = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const eqRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  minWidth: 0,
  flex: 1,
};

const eqIconBox = {
  width: 36,
  height: 36,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const eqName = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const eqCode = {
  fontSize: 12,
  fontWeight: 950,
  color: "#64748b",
  padding: "2px 8px",
  borderRadius: 6,
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const eqMeta = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 850,
  color: "#94a3b8",
  marginTop: 3,
};

const tagsRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  flexShrink: 0,
};

const statusPill = {
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const miniTag = {
  fontSize: 12,
  fontWeight: 950,
  color: "#475569",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.75)",
  whiteSpace: "nowrap",
};

const cardBody = {
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const metaChips = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const chip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 900,
  color: "#64748b",
  padding: "5px 10px",
  borderRadius: 999,
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const descText = {
  margin: "10px 0 0",
  fontWeight: 850,
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.5,
};

const sectionLbl = {
  fontSize: 12,
  fontWeight: 950,
  color: "#64748b",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  marginTop: 10,
};

const followUpBox = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(239,246,255,0.90)",
  border: "1px solid rgba(191,219,254,0.80)",
  borderLeft: "3px solid #3b82f6",
};

const followUpLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#1d4ed8",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const followUpMeta = {
  marginTop: 6,
  fontSize: 13,
  color: "#1e40af",
  fontWeight: 900,
};

const dismissedBox = {
  marginTop: 10,
  display: "inline-flex",
  gap: 8,
  alignItems: "center",
  padding: "6px 12px",
  borderRadius: 999,
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 900,
};

const evidenceImg = {
  width: "min(320px, 100%)",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
  marginTop: 8,
  display: "block",
};

const actionsCol = {
  display: "grid",
  gap: 8,
  alignContent: "start",
  minWidth: 180,
  flexShrink: 0,
};

const btnAction = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 13,
  boxShadow: "0 8px 20px rgba(2,6,23,0.14)",
};

const btnDanger = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  border: "1px solid rgba(252,165,165,0.60)",
  background: "rgba(254,242,242,0.85)",
  color: "#991b1b",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 13,
};
