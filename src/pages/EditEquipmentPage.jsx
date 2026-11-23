// src/pages/EditEquipmentPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { getEquipmentById, updateEquipment, assignEquipmentTechnician } from "../services/equipmentService";
import { getEquipmentAreas } from "../services/equipmentAreasService";
import { getTechnicians } from "../services/techniciansService";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { Icon } from "../components/ui/lpIcons";
import EquipmentFields from "../components/equipment/EquipmentFields";
import { normalizeCode } from "../utils/equipment";
import "./TechniciansPage.css";
import "./EquipmentsPage.css";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const CRIT_HELP = {
  CRITICA: "Impacto directo en seguridad o producción. Prioridad máxima.",
  ALTA: "Impacto alto. Requiere atención prioritaria.",
  MEDIA: "Impacto moderado. Mantenimiento planeado.",
  BAJA: "Impacto bajo. Riesgo limitado.",
};

export default function EditEquipmentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipmentId = useMemo(() => Number(id), [id]);
  const { user } = useAuth();
  const { currentPlantId } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const canEdit = role === "ADMIN" || role === "SUPERVISOR";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState([]);
  const [equipmentName, setEquipmentName] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    areaId: "",
    location: "",
    criticality: "MEDIA",
    status: "ACTIVO",
    brand: "",
    model: "",
    description: "",
  });

  const [techs, setTechs] = useState([]);
  const [techId, setTechId] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [force, setForce] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!currentPlantId || !canEdit) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        if (!Number.isFinite(equipmentId)) throw new Error("ID de equipo inválido");
        const [areasRes, eq, techList] = await Promise.all([
          getEquipmentAreas().catch(() => null),
          getEquipmentById(equipmentId),
          getTechnicians().catch(() => []),
        ]);
        if (!alive) return;
        setAreas(Array.isArray(areasRes?.result) ? areasRes.result : Array.isArray(areasRes) ? areasRes : []);
        setTechs((Array.isArray(techList) ? techList : []).filter((t) => ["ACTIVO", "ACTIVE"].includes(String(t.status || "").toUpperCase())));
        setEquipmentName(eq?.name || "");
        setForm({
          name: eq?.name ?? "",
          code: eq?.code ?? "",
          areaId: eq?.areaId != null ? String(eq.areaId) : "",
          location: eq?.location ?? "",
          criticality: String(eq?.criticality || "MEDIA").toUpperCase(),
          status: String(eq?.status || "ACTIVO").toUpperCase(),
          brand: eq?.brand ?? "",
          model: eq?.model ?? "",
          description: eq?.description ?? "",
        });
        if (eq?.assignedTechnician?.id) setTechId(String(eq.assignedTechnician.id));
      } catch (e) {
        if (alive) setLoadError(e?.message || "No se pudo cargar el equipo");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [currentPlantId, equipmentId, canEdit]);

  // Si se llegó con #assign, baja a la sección de asignación.
  useEffect(() => {
    if (!loading && window.location.hash === "#assign") {
      document.getElementById("assign")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) return setError("Nombre y ubicación son obligatorios.");
    setSaving(true);
    setError("");
    try {
      await updateEquipment(equipmentId, {
        name: form.name.trim(),
        code: normalizeCode(form.code) || null,
        areaId: form.areaId ? Number(form.areaId) : null,
        location: form.location.trim(),
        criticality: form.criticality,
        status: form.status,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        description: form.description.trim() || null,
      });
      toast.success("Equipo actualizado");
      navigate(`/equipments/${equipmentId}`);
    } catch (ex) {
      setError(ex?.message || "No se pudo actualizar el equipo");
    } finally {
      setSaving(false);
    }
  };

  const onAssign = async () => {
    if (!techId) return;
    setAssigning(true);
    try {
      const resp = await assignEquipmentTechnician(equipmentId, Number(techId), { from: fromDate, force });
      const acts = resp?.updatedCount ?? 0;
      const routes = resp?.routesUpdatedCount ?? 0;
      toast.success(
        `${resp?.technician?.name || "Técnico"} asignado · ${routes} ruta${routes === 1 ? "" : "s"} y ${acts} actividad${acts === 1 ? "" : "es"} pendiente${acts === 1 ? "" : "s"}`
      );
    } catch (e) {
      toast.error(e?.message || "No se pudo asignar el técnico");
    } finally {
      setAssigning(false);
    }
  };

  if (!canEdit) {
    return (
      <MainLayout>
        <div className="tch">
          <div className="tch-empty">
            <div className="tch-empty-icon"><Icon name="lock" /></div>
            <h3>Acceso restringido</h3>
            <p>Solo administradores y supervisores pueden editar equipos.</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={() => navigate("/equipments")}>
              Volver a equipos
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="tch lp-fade-in" style={{ maxWidth: 900 }}>
        <header className="tch-head">
          <div>
            <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 32, marginBottom: 10 }} onClick={() => navigate(-1)}>
              <Icon name="arrowLeft" size="sm" /> Volver
            </button>
            <div className="tch-kicker">Equipos · edición</div>
            <h1 className="tch-title">{equipmentName || "Editar equipo"}</h1>
          </div>
        </header>

        {loading ? (
          <div className="tch-empty"><p>Cargando equipo…</p></div>
        ) : loadError ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudo cargar el equipo</h3>
            <p>{loadError}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={() => navigate("/equipments")}>
              Volver a equipos
            </button>
          </div>
        ) : (
          <>
            <form className="tch-modal" style={{ maxWidth: "none", maxHeight: "none", boxShadow: "var(--shadow-sm)" }} onSubmit={handleSubmit} noValidate>
              <div className="tch-modal-head">
                <div>
                  <div className="tch-kicker">Datos del equipo</div>
                  <div className="tch-hint" style={{ marginTop: 6 }}>{CRIT_HELP[form.criticality] || ""}</div>
                </div>
              </div>
              <EquipmentFields form={form} set={set} areas={areas} />
              {error ? <div className="tch-error" role="alert" style={{ margin: "0 22px 16px" }}>{error}</div> : null}
              <div className="tch-modal-foot">
                <button type="button" className="tch-btn tch-btn-ghost" onClick={() => navigate(-1)} disabled={saving}>Cancelar</button>
                <button type="submit" className="tch-btn tch-btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
              </div>
            </form>

            <section id="assign" className="tch-modal" style={{ maxWidth: "none", maxHeight: "none", boxShadow: "var(--shadow-sm)" }}>
              <div className="tch-modal-head">
                <div>
                  <div className="tch-kicker">Asignación</div>
                  <h2 className="tch-modal-title">Técnico responsable</h2>
                  <div className="tch-sub">Asigna el técnico a todas las rutas del equipo y a sus actividades pendientes.</div>
                </div>
              </div>
              <div className="tch-form">
                <div className="tch-row">
                  <div className="tch-field">
                    <label htmlFor="as-tech">Técnico</label>
                    <select id="as-tech" className="tch-input" value={techId} onChange={(e) => setTechId(e.target.value)}>
                      <option value="">Selecciona un técnico</option>
                      {techs.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.code ? ` · ${t.code}` : ""}
                        </option>
                      ))}
                    </select>
                    {!techs.length ? <div className="tch-hint">No hay técnicos activos en esta planta.</div> : null}
                  </div>
                  <div className="tch-field">
                    <label htmlFor="as-from">Desde la fecha</label>
                    <input id="as-from" type="date" className="tch-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </div>
                </div>
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
                  <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} style={{ marginTop: 3 }} />
                  <span>
                    Reasignar también las actividades que ya tienen técnico
                    <span className="tch-hint" style={{ display: "block" }}>Si no lo marcas, solo se asignan las actividades pendientes sin técnico.</span>
                  </span>
                </label>
              </div>
              <div className="tch-modal-foot">
                <button type="button" className="tch-btn tch-btn-primary" disabled={!techId || assigning} onClick={onAssign}>
                  <Icon name="userCheck" size="sm" /> {assigning ? "Asignando…" : "Asignar técnico"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}
