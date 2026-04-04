// src/pages/ConditionReportsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
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
  if (x === "BUENO") return "BUENO";
  if (x === "REGULAR") return "REGULAR";
  if (x === "MALO") return "MALO";
  if (x === "CRITICO" || x === "CRITICO") return "CRITICO";
  return x || "?";
};

const niceCategory = (c) => {
  const x = String(c || "").toUpperCase();
  if (!x) return "?";
  return x;
};

const safeUpper = (v) => String(v || "").toUpperCase();

/* =========================
   Page
========================= */
function ConditionReportsPage() {
  const { user } = useAuth();
  const role = safeUpper(user?.role || "TECHNICIAN");
  const canManage = role === "ADMIN" || role === "SUPERVISOR";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  // filtros
  const [status, setStatus] = useState(""); // vac?o = todos
  const [from, setFrom] = useState(() => toYMD(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => toYMD(new Date()));

  // modal correctivo
  const [openCorrective, setOpenCorrective] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // anti-race
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
      {/* Header premium */}
      <div style={headerWrap}>
        <div style={{ minWidth: 0 }}>
          <div style={titleRow}>
            <div style={titleIcon}>
              <Icon name="warn" size="sm" weight="bold" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={h1}>Reportes de condición</h1>
              <div style={subTitle}>
                {role === "TECHNICIAN"
                  ? "Aqu? ves tus reportes."
                  : "Gestiona reportes (OPEN / IN_PROGRESS / RESOLVED / DISMISSED)."}
              </div>
            </div>
          </div>

          <div style={metaRow}>
            <span style={metaPill}>
              <span style={metaPillIcon}>
                <Icon name="calendar" size="sm" />
              </span>
              Rango: <b>{from || "?"}</b> ? <b>{to || "?"}</b>
            </span>

            <span style={metaPill}>
              <span style={metaPillIcon}>
                <Icon name="user" size="sm" />
              </span>
              Rol: <b>{role}</b>
            </span>
          </div>
        </div>

        <button onClick={load} style={btnGhost} disabled={loading}>
          <span style={btnRow}>
            <Icon name="refresh" size="sm" />
            {loading ? "Actualizando?" : "Actualizar"}
          </span>
        </button>
      </div>

      {err ? (
        <div style={errorBox}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={errorIcon}>
              <Icon name="alert" size="sm" weight="bold" />
            </div>
            <div style={{ fontWeight: 900 }}>{err}</div>
          </div>
        </div>
      ) : null}

      {/* Filtros premium */}
      <div style={filtersCard}>
        <div style={filtersHeader}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 950, color: "#0f172a" }}>
            <Icon name="search" size="sm" />
            Filtros
          </div>

          <div style={tinyHint}>
            Tip: usa <b>Status</b> + rango de fechas.
          </div>
        </div>

        <div style={filtersGrid}>
          <div style={filterGroup}>
            <span style={lbl}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inp}>
              <option value="">Todos</option>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {niceStatus(s)} ({s})
                </option>
              ))}
            </select>
          </div>

          <div style={filterGroup}>
            <span style={lbl}>Desde</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inp} />
          </div>

          <div style={filterGroup}>
            <span style={lbl}>Hasta</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inp} />
          </div>
        </div>

        <div style={chipsWrap}>
          <Chip tone="red" icon="alert">OPEN: {counts.OPEN}</Chip>
          <Chip tone="amber" icon="clock">IN_PROGRESS: {counts.IN_PROGRESS}</Chip>
          <Chip tone="green" icon="check">RESOLVED: {counts.RESOLVED}</Chip>
          <Chip tone="gray" icon="xCircle">DISMISSED: {counts.DISMISSED}</Chip>
        </div>
      </div>

      {loading ? (
        <div style={muted}><Icon name="refresh" size="sm" /> Cargando?</div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div style={muted}><Icon name="info" size="sm" /> No hay reportes.</div>
      ) : null}

      {/* List */}
      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {items.map((r) => {
          const s = safeUpper(r?.status);
          const eq = r?.equipment || {};
          const by = r?.reportedBy || {};

          const detected = r?.detectedAt ? toYMD(r.detectedAt) : "?";

          return (
            <div key={r.id} style={rowCard}>
              {/* Left */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={rowTop}>
                  <div style={eqTitle}>
                    <span style={eqIcon}>
                      <Icon name="equipment" size="sm" />
                    </span>

                    <b style={{ color: "#0f172a" }}>
                      {eq?.name || "Equipo"} {eq?.code ? `(${eq.code})` : ""}
                    </b>
                  </div>

                  <span style={pill(s)} title={`Status: ${s}`}>
                    {niceStatus(s)}
                  </span>

                  {r?.condition ? (
                    <span style={miniTag}>Condición: {niceCondition(r.condition)}</span>
                  ) : null}

                  {r?.category ? (
                    <span style={miniTag}>Categoría: {niceCategory(r.category)}</span>
                  ) : null}
                </div>

                <div style={subRow}>
                  <span style={subItem}>
                    <Icon name="building" size="sm" /> {eq?.location || "?"}
                  </span>
                  <span style={subItem}>
                    <Icon name="calendar" size="sm" /> Detectado: {detected}
                  </span>
                  <span style={subItem}>
                    <Icon name="user" size="sm" /> Reportado: {by?.name || "?"} ({safeUpper(by?.role)})
                  </span>
                </div>

                <div style={desc}>{r?.description || "?"}</div>

                {r?.correctiveExecutionId || r?.correctiveScheduledAt ? (
                  <div style={followUpBox}>
                    <div style={sectionLbl}>
                      <Icon name="tool" size="sm" /> Seguimiento
                    </div>
                    <div style={followUpMeta}>
                      {r?.correctiveExecutionId ? `Ejecución #${r.correctiveExecutionId}` : "Acción correctiva programada"}
                      {r?.correctiveScheduledAt ? ` ? ${toYMD(r.correctiveScheduledAt)}` : ""}
                    </div>
                  </div>
                ) : null}

                {r?.status === "DISMISSED" && r?.dismissedAt ? (
                  <div style={dismissedBox}>
                    <Icon name="xCircle" size="sm" /> Descartado: {toYMD(r.dismissedAt)}
                  </div>
                ) : null}

                {r?.evidenceImage ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={sectionLbl}>
                      <Icon name="eye" size="sm" /> Evidencia
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

              {/* Right actions */}
              <div style={rightCol}>
                {canManage && !r?.correctiveExecutionId ? (
                  <button
                    type="button"
                    onClick={() => openCorrectiveModal(r)}
                    style={btnPrimaryMini}
                    title="Programar acción correctiva"
                  >
                    <span style={btnRow}>
                      <Icon name="tool" size="sm" />
                      Programar acción
                    </span>
                  </button>
                ) : null}

              {canManage && s !== "RESOLVED" && s !== "DISMISSED" ? (
  <button
    type="button"
    style={btnDangerMini}
    onClick={async () => {
      if (!window.confirm("?Descartar este reporte?")) return;
      await dismissConditionReport(r.id);
      await load();
    }}
    title="Descartar reporte"
  >
    <span style={btnRow}>
      <Icon name="xCircle" size="sm" />
      Descartar
    </span>
  </button>
) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* ? Modal (uno solo) */}
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
   UI bits
========================= */

function Chip({ children, tone = "gray", icon = "info" }) {
  const bg =
    tone === "red"
      ? "#fee2e2"
      : tone === "amber"
      ? "#fef3c7"
      : tone === "green"
      ? "#dcfce7"
      : "#f1f5f9";

  const fg =
    tone === "red"
      ? "#991b1b"
      : tone === "amber"
      ? "#92400e"
      : tone === "green"
      ? "#166534"
      : "#334155";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 950,
        background: bg,
        color: fg,
        border: "1px solid rgba(0,0,0,0.06)",
        whiteSpace: "nowrap",
        boxShadow: "0 10px 22px rgba(2,6,23,0.04)",
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: "rgba(255,255,255,0.65)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Icon name={icon} size="sm" weight="bold" />
      </span>
      {children}
    </span>
  );
}

/* =========================
   Styles
========================= */

const btnRow = { display: "inline-flex", alignItems: "center", gap: 8 };

const headerWrap = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-start",
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 100%)",
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const titleRow = { display: "flex", alignItems: "center", gap: 12 };
const titleIcon = {
  width: 44,
  height: 44,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.18)",
  border: "1px solid rgba(249,115,22,0.25)",
  color: "#0f172a",
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
};

const h1 = { margin: 0, fontSize: 26, fontWeight: 1000, color: "#0f172a", lineHeight: 1.05 };
const subTitle = { marginTop: 6, color: "#64748b", fontWeight: 850, fontSize: 13 };

const metaRow = { marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" };
const metaPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 999,
  padding: "8px 12px",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  fontWeight: 900,
  fontSize: 12,
  color: "#334155",
};
const metaPillIcon = {
  width: 26,
  height: 26,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#0f172a",
};

const btnGhost = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 14,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const errorBox = {
  marginTop: 12,
  background: "#fff1f2",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 14,
  color: "#991b1b",
  fontWeight: 900,
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const errorIcon = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
};

const filtersCard = {
  marginTop: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 14,
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const filtersHeader = { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" };
const tinyHint = { fontSize: 12, fontWeight: 850, color: "#64748b" };

const filtersGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const filterGroup = { display: "grid", gap: 6 };
const lbl = { fontSize: 12, fontWeight: 950, color: "#64748b" };
const lblSm = { fontSize: 12, fontWeight: 950, color: "#64748b" };

const inp = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: "10px 12px",
  fontWeight: 950,
  background: "rgba(255,255,255,0.95)",
  color: "#0f172a",
  outline: "none",
};

const chipsWrap = { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" };

const muted = {
  marginTop: 12,
  color: "#64748b",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const rowCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 14,
  background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.88) 100%)",
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const rowTop = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" };

const eqTitle = { display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 };
const eqIcon = {
  width: 34,
  height: 34,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#0f172a",
};

const subRow = {
  marginTop: 8,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  color: "#64748b",
  fontWeight: 900,
  fontSize: 12,
};

const subItem = { display: "inline-flex", alignItems: "center", gap: 8 };

const miniTag = {
  fontSize: 12,
  fontWeight: 950,
  color: "#475569",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.75)",
};

const desc = { marginTop: 10, fontWeight: 900, color: "#334155", lineHeight: 1.35 };

const sectionLbl = {
  fontSize: 12,
  fontWeight: 950,
  color: "#64748b",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const evidenceImg = {
  width: "min(360px, 100%)",
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  marginTop: 8,
};

const rightCol = {
  display: "grid",
  gap: 10,
  justifyItems: "stretch",
  alignContent: "start",
  minWidth: 220,
  maxWidth: 320,
  flex: "0 0 auto",
};

const linkedExec = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 950,
  color: "#0f172a",
  textAlign: "right",
  padding: "8px 10px",
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  justifyContent: "flex-end",
};

const pill = (s) => ({
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 1000,
  border: "1px solid rgba(0,0,0,0.06)",
  background:
    s === "OPEN"
      ? "#fee2e2"
      : s === "IN_PROGRESS"
      ? "#fef3c7"
      : s === "RESOLVED"
      ? "#dcfce7"
      : "#f1f5f9",
  color:
    s === "OPEN"
      ? "#991b1b"
      : s === "IN_PROGRESS"
      ? "#92400e"
      : s === "RESOLVED"
      ? "#166534"
      : "#334155",
});

const btnPrimaryMini = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  borderRadius: 14,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 1000,
  boxShadow: "0 12px 28px rgba(2,6,23,0.12)",
  width: "100%",
};

const btnDangerMini = {
  border: "1px solid rgba(252,165,165,0.70)",
  background: "rgba(254,242,242,0.85)",
  color: "#991b1b",
  borderRadius: 14,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 1000,
  boxShadow: "0 12px 28px rgba(153,27,27,0.10)",
  width: "100%",
};



const followUpBox = {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
};

const followUpMeta = {
  marginTop: 6,
  fontSize: 12,
  color: "#1d4ed8",
  fontWeight: 900,
};

const dismissedBox = {
  marginTop: 10,
  display: "inline-flex",
  gap: 8,
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: 12,
  fontWeight: 900,
};
