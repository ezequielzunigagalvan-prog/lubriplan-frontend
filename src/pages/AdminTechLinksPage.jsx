import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { getTechLinks, linkUserTechnician } from "../services/adminLinksService";

const toRole = (r) => String(r || "").toUpperCase();

export default function AdminTechLinksPage() {
  const { token, user } = useAuth();
  const role = toRole(user?.role);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [techUsers, setTechUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [busyUserId, setBusyUserId] = useState(null);
  const [syncName, setSyncName] = useState(true);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await getTechLinks({ token });
      setTechUsers(Array.isArray(res?.techUsers) ? res.techUsers : []);
      setTechnicians(Array.isArray(res?.technicians) ? res.technicians : []);
    } catch (e) {
      setErr(e?.message || "Error cargando vínculos");
      setTechUsers([]);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const techById = useMemo(() => {
    const m = new Map();
    for (const t of technicians) m.set(Number(t.id), t);
    return m;
  }, [technicians]);

  const onChangeLink = async (u, value) => {
    const userId = Number(u.id);
    const technicianId = value === "" ? null : Number(value);

    setBusyUserId(userId);
    setErr("");
    try {
      const res = await linkUserTechnician({ token, userId, technicianId, syncName });
      const updated = res?.item;

      setTechUsers((prev) =>
        prev.map((x) => (x.id === userId ? updated : x))
      );

      // recargar technicians (para reflejar "ocupado por user")
      await load();
    } catch (e) {
      setErr(e?.message || "Error vinculando");
    } finally {
      setBusyUserId(null);
    }
  };

  // seguridad: solo admin
  if (role !== "ADMIN") {
    return (
      <MainLayout>
        <div style={panel}>
          <div style={{ fontWeight: 950, color: "#991b1b" }}>Sin permiso</div>
          <div style={muted}>Solo ADMIN puede ver esta pantalla.</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={header}>
        <div>
          <div style={h1}>Vincular Técnicos ↔ Usuarios</div>
          <div style={muted}>
            Esto define qué usuario TECH corresponde a qué registro de Técnico (para actividades, filtros y nombres).
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label style={checkWrap} title="Si está activo, al ligar se iguala User.name a Technician.name">
            <input
              type="checkbox"
              checked={syncName}
              onChange={(e) => setSyncName(e.target.checked)}
            />
            <span style={{ fontWeight: 900 }}>Sincronizar nombre</span>
          </label>

          <button onClick={load} style={btn} disabled={loading}>
            {loading ? "Cargando..." : "↻ Actualizar"}
          </button>
        </div>
      </div>

      {err ? <div style={errorBox}>{err}</div> : null}

      <div style={panel}>
        {loading ? (
          <div style={muted}>Cargando…</div>
        ) : techUsers.length === 0 ? (
          <div style={muted}>No hay usuarios TECHNICIAN activos.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {techUsers.map((u) => {
              const currentTechId = u.technicianId != null ? Number(u.technicianId) : null;

              return (
                <div key={u.id} style={row}>
                  <div style={{ minWidth: 0 }}>
                    <div style={rowTitle}>
                      {u.name} <span style={tag}>{u.email}</span>
                    </div>
                    <div style={rowSub}>
                      Técnico ligado:{" "}
                      <b>
                        {u.technician
                          ? `${u.technician.name}${u.technician.code ? ` (${u.technician.code})` : ""}`
                          : "—"}
                      </b>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      value={currentTechId ?? ""}
                      onChange={(e) => onChangeLink(u, e.target.value)}
                      style={select}
                      disabled={busyUserId === u.id}
                      title="Selecciona el técnico correspondiente"
                    >
                      <option value="">— Sin técnico —</option>
                      {technicians.map((t) => {
                        const takenByOther =
                          t.user?.id && Number(t.user.id) !== Number(u.id);

                        const label = `${t.name}${t.code ? ` (${t.code})` : ""}${
                          takenByOther ? ` · OCUPADO (${t.user?.name})` : ""
                        }`;

                        return (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={takenByOther}
                          >
                            {label}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      type="button"
                      onClick={() => onChangeLink(u, "")}
                      style={btnGhost}
                      disabled={busyUserId === u.id || currentTechId == null}
                      title="Desvincular"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={hint}>
        Tip pro: si en tu operación un técnico se “da de baja”, no borres el User; marca el Technician con deletedAt o status
        y desvincula aquí.
      </div>
    </MainLayout>
  );
}

/* estilos inline (consistentes con tu app) */
const header = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 12 };
const h1 = { fontSize: 22, fontWeight: 950, color: "#0f172a" };
const muted = { marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 };

const panel = { border: "1px solid #e5e7eb", borderRadius: 16, padding: 14, background: "#fff" };
const row = { border: "1px solid #eef2f7", borderRadius: 14, padding: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" };
const rowTitle = { fontWeight: 950, color: "#0f172a" };
const rowSub = { marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" };

const tag = { marginLeft: 8, fontSize: 12, fontWeight: 900, color: "#64748b" };

const select = { border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", fontWeight: 900, outline: "none", minWidth: 320 };

const btn = { border: "1px solid #e5e7eb", background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontWeight: 950, color: "#0f172a" };
const btnGhost = { border: "1px solid #e5e7eb", background: "transparent", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontWeight: 950, color: "#0f172a" };

const errorBox = { marginBottom: 12, background: "#fee2e2", border: "1px solid #fecaca", padding: 12, borderRadius: 12, color: "#991b1b", fontWeight: 800 };

const checkWrap = { display: "inline-flex", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", background: "rgba(255,255,255,0.85)" };

const hint = { marginTop: 12, fontSize: 12, fontWeight: 800, color: "#475569" };