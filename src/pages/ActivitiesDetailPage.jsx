// src/pages/ActivitiesDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { getExecutionsByRoute } from "../services/executionsService";
import { Icon } from "../components/ui/lpIcons";

/* =========================
   HELPERS (fechas locales)
========================= */
const toLocalYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (!dt || Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ActivitiesDetailPage() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const rid = Number(routeId);

  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const today = toLocalYMD(new Date());

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        if (!Number.isFinite(rid)) {
          if (!alive) return;
          setExecutions([]);
          setErr("RouteId inválido");
          return;
        }

        const data = await getExecutionsByRoute(rid);
        if (!alive) return;
        setExecutions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr(e?.message || "Error cargando actividades de la ruta");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [rid]);

  // Normaliza ejecuciones a items UI
  const activities = useMemo(() => {
    return (executions || [])
      .filter((ex) => ex && typeof ex.id === "number")
      .map((ex) => {
        const route = ex?.route || {};
        const equipment = route?.equipment || {};

        const computedStatus =
          ex?.status === "COMPLETED"
            ? "Completada"
            : ex?.status === "OVERDUE"
            ? "Atrasada"
            : "Pendiente";

        // fecha principal según estado
        const dateISO =
          ex?.status === "COMPLETED" ? ex?.executedAt : ex?.scheduledAt || ex?.executedAt;

        const dateLabel = dateISO ? toLocalYMD(dateISO) : "";

        const isFuture = computedStatus !== "Completada" && dateLabel && dateLabel > today;

        const commercialName =
          String(route?.lubricantName || "").trim() ||
          String(route?.lubricant?.name || "").trim() || // ✅ si viene del inventario
          "";

        return {
          id: ex.id,
          computedStatus,
          statusRaw: ex?.status,

          dateISO,
          dateLabel,
          isFuture,

          // info
          routeName: route?.name || Ruta `#${rid}`,
          equipmentName: equipment?.name || "—",
          equipmentCode: equipment?.code || equipment?.tag || "",

          lubricantType: route?.lubricantType || "—",
          commercialName,

          method: route?.method || "—",
          quantityLabel:
            route?.quantity != null
              ? `${route.quantity}${route.unit ? ` ${route.unit}` : ""}`
              : "—",
        };
      });
  }, [executions, rid, today]);

  // Orden: atrasadas, pendientes (próximas), completadas (recientes)
  const sorted = useMemo(() => {
    const rank = (s) => (s === "Atrasada" ? 0 : s === "Pendiente" ? 1 : 2);

    const ms = (iso) => {
      if (!iso) return Number.POSITIVE_INFINITY;
      const t = new Date(iso).getTime();
      return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
    };

    return [...activities].sort((a, b) => {
      const ra = rank(a.computedStatus);
      const rb = rank(b.computedStatus);
      if (ra !== rb) return ra - rb;

      if (a.computedStatus !== "Completada") return ms(a.dateISO) - ms(b.dateISO);
      return ms(b.dateISO) - ms(a.dateISO);
    });
  }, [activities]);

  const routeTitle = sorted?.[0]?.routeName || `Ruta #${routeId}`;

  return (
    <MainLayout>
      <div style={pageShell}>
        {/* TOP BAR */}
        <div style={topBar}>
          <div>
            <div style={kicker}>LUBRIPLAN · ACTIVIDADES</div>
            <h1 style={title}>Actividades</h1>
            <div style={subtitle}>{routeTitle}</div>
          </div>

          <button type="button" onClick={() => navigate("/routes")} style={btnGhost}>
            <Icon name="arrowLeft" style={{ width: 16, height: 16 }} />
            <span>Volver a rutas</span>
          </button>
        </div>

        {/* STATES */}
        {err ? <div style={errorBox}>{err}</div> : null}

        {loading ? (
          <div style={panel}>
            <p style={{ margin: 0, fontWeight: 950, color: "#0f172a" }}>Cargando actividades…</p>
          </div>
        ) : !err && sorted.length === 0 ? (
          <div style={emptyBox}>No hay ejecuciones para esta ruta.</div>
        ) : null}

        {/* LIST */}
        {!loading && !err && sorted.length > 0 ? (
          <div style={list}>
            {sorted.map((a) => (
              <div
                key={a.id}
                style={{
                  ...card,
                  opacity: a.computedStatus === "Completada" ? 0.72 : 1,
                }}
                title={a.isFuture ? `Programada para ${a.dateLabel} (no disponible aún)` : ""}
              >
                <div style={{ minWidth: 0 }}>
                  {/* header mini */}
                  <div style={rowTop}>
                    <div style={{ minWidth: 0 }}>
                      <div style={eqNameRow}>
                        <div style={eqName}>{a.equipmentName}</div>
                        {a.equipmentCode ? (
                          <span style={tagPill}>
                            <Icon name="tag" style={{ width: 14, height: 14 }} /> {a.equipmentCode}
                          </span>
                        ) : null}
                      </div>
                      <div style={routeLine}>
                        <Icon name="route" style={{ width: 14, height: 14, color: "#64748b" }} />
                        <span style={routeText}>{a.routeName}</span>
                      </div>
                    </div>

                    <span style={statusPill(a.computedStatus)}>{a.computedStatus}</span>
                  </div>

                  {/* mini cards */}
                  <div style={miniGrid}>
                    <MiniCard
                      label="Fecha"
                      icon="calendar"
                      value={
                        a.dateLabel
                          ? `${a.dateLabel} ${
                              a.computedStatus === "Completada" ? "(realizada)" : "(programada)"
                            }`
                          : "—"
                      }
                      subtle={a.isFuture ? "Programada a futuro" : ""}
                    />

                    <MiniCard
                      label="Lubricante"
                      icon="drop"
                      value={a.lubricantType}
                      sub={a.commercialName ? a.commercialName : "—"}
                    />

                    <MiniCard label="Cantidad" icon="dot" value={a.quantityLabel} />
                    <MiniCard label="Método" icon="settings" value={a.method} />
                  </div>

                  {a.isFuture ? (
                    <div style={futureNote}>
                      <Icon name="warn" style={{ width: 14, height: 14 }} />
                      <span>Programada para esa fecha</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}

/* =========================
   UI PIECES
========================= */

function MiniCard({ label, value, sub, icon, subtle }) {
  return (
    <div style={miniCard}>
      <div style={miniHead}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {icon ? <Icon name={icon} style={{ width: 16, height: 16, color: "#64748b" }} /> : null}
          <span style={miniLabel}>{label}</span>
        </div>
        {subtle ? <span style={miniSubtle}>{subtle}</span> : null}
      </div>

      <div style={miniValue}>{value || "—"}</div>
      {sub ? <div style={miniSub}>{sub}</div> : null}
    </div>
  );
}

/* =========================
   STYLES (alineado a Routes)
========================= */

const pageShell = {
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  paddingBottom: 12,
  borderBottom: "1px solid #e5e7eb",
};

const kicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 1.2,
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

const btnGhost = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const panel = {
  marginTop: 14,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
};

const emptyBox = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  border: "1px dashed #cbd5e1",
  color: "#64748b",
  fontWeight: 800,
  fontSize: 13,
  background: "rgba(248,250,252,0.85)",
};

const errorBox = {
  marginTop: 12,
  background: "rgba(239,68,68,0.10)",
  border: "1px solid rgba(239,68,68,0.30)",
  padding: 12,
  borderRadius: 14,
  color: "#7f1d1d",
  fontWeight: 900,
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  marginTop: 14,
};

const card = {
  background: "rgba(255,255,255,0.82)",
  borderRadius: 16,
  padding: 14,

  // ✅ contorno más grueso y marcado
  border: "2px solid rgba(203,213,225,0.95)", // slate-300 aprox

  // ✅ un poquito más de presencia (sin exagerar)
  boxShadow:
    "0 14px 30px rgba(2,6,23,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
};

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const eqNameRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const eqName = {
  fontWeight: 950,
  fontSize: 16,
  color: "#0f172a",
  letterSpacing: 0.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 520,
};

const tagPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.08)",
  border: "1px solid rgba(15,23,42,0.12)",
  color: "#0f172a",
  fontWeight: 950,
  fontSize: 12,
};

const routeLine = {
  marginTop: 6,
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#64748b",
  fontWeight: 900,
  fontSize: 12,
};

const routeText = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const statusPill = (status) => {
  const isOver = status === "Atrasada";
  const isPend = status === "Pendiente";
  return {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 0.2,
    border: `1px solid ${
      isOver ? "rgba(239,68,68,0.35)" : isPend ? "rgba(245,158,11,0.35)" : "rgba(34,197,94,0.35)"
    }`,
    background: isOver
      ? "rgba(239,68,68,0.10)"
      : isPend
      ? "rgba(245,158,11,0.12)"
      : "rgba(34,197,94,0.10)",
    color: isOver ? "#7f1d1d" : isPend ? "#92400e" : "#14532d",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
};

const miniGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
};

const miniCard = {
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.75)",
  padding: 12,
  boxShadow: "inset 0 1px 0 rgba(2,6,23,0.04)",
};

const miniHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const miniLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const miniSubtle = {
  fontSize: 11,
  fontWeight: 900,
  color: "#64748b",
  opacity: 0.9,
  whiteSpace: "nowrap",
};

const miniValue = {
  marginTop: 8,
  fontWeight: 950,
  fontSize: 14,
  color: "#0f172a",
};

const miniSub = {
  marginTop: 4,
  fontWeight: 850,
  fontSize: 12,
  color: "#64748b",
};

const futureNote = {
  marginTop: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.70)",
  color: "#64748b",
  fontWeight: 900,
  fontSize: 12,
};