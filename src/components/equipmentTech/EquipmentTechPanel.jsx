// src/components/equipmentTech/EquipmentTechPanel.jsx
// Información técnica del equipo: datos técnicos, manuales/documentos y diagramas de lubricación.
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Icon } from "../ui/lpIcons";
import { useConfirm } from "../ui/ConfirmDialog";
import {
  getEquipmentTech, saveEquipmentSpecs, uploadEquipmentDocument, deleteEquipmentDocument, deleteDiagram,
} from "../../services/equipmentTechService";
import { SYSTEM_TYPES } from "../diagram/symbols";
import "./EquipmentTech.css";

const DOC_CAT = {
  MANUAL: { label: "Manual", icon: "doc" },
  PLANO: { label: "Plano", icon: "grid" },
  FICHA: { label: "Ficha técnica", icon: "list" },
  CERTIFICADO: { label: "Certificado", icon: "shield" },
  FOTO: { label: "Foto", icon: "camera" },
  OTRO: { label: "Otro", icon: "link" },
};
const SPEC_SUGGESTIONS = ["Potencia", "Velocidad", "Voltaje", "Corriente", "Capacidad de aceite", "Tipo de rodamiento", "Número de serie", "Año de fabricación", "Presión de trabajo", "Temperatura de operación"];
const fmtSize = (b) => (!b ? "" : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "");

export default function EquipmentTechPanel({ equipmentId, canManage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const fileRef = useRef(null);
  const [tab, setTab] = useState(() => (location.hash === "#diagramas" ? "diagrams" : "specs"));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [specs, setSpecs] = useState([]);
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docCategory, setDocCategory] = useState("MANUAL");
  const [uploading, setUploading] = useState(false);
  const [newType, setNewType] = useState("PROGRESSIVE");

  const load = useCallback(async () => {
    try {
      const r = await getEquipmentTech(equipmentId);
      setData(r);
      setSpecs(r?.specs || []);
      setError("");
    } catch (e) {
      setError(e?.message || "No se pudo cargar la información técnica");
    }
  }, [equipmentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.hash === "#diagramas") document.getElementById("eq-tech")?.scrollIntoView({ behavior: "smooth" });
  }, [location.hash]);

  const docs = data?.documents || [];
  const diagrams = data?.diagrams || [];

  const saveSpecs = async () => {
    setSaving(true);
    try {
      const r = await saveEquipmentSpecs(equipmentId, specs);
      setSpecs(r?.specs || []);
      setEditingSpecs(false);
      toast.success("Datos técnicos guardados");
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudieron guardar");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadEquipmentDocument(equipmentId, file, { category: docCategory });
      toast.success("Documento agregado");
      load();
    } catch (e) {
      toast.error(e?.message || "No se pudo subir el documento");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section id="eq-tech" className="et-panel" aria-label="Información técnica">
      <div className="et-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "specs"} className={tab === "specs" ? "is-on" : ""} onClick={() => setTab("specs")}>
          <Icon name="list" size="sm" /> Datos técnicos <span>{(data?.specs || []).length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "docs"} className={tab === "docs" ? "is-on" : ""} onClick={() => setTab("docs")}>
          <Icon name="doc" size="sm" /> Manuales y documentos <span>{docs.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "diagrams"} className={tab === "diagrams" ? "is-on" : ""} onClick={() => setTab("diagrams")}>
          <Icon name="route" size="sm" /> Diagramas de lubricación <span>{diagrams.length}</span>
        </button>
      </div>

      <div className="et-body">
        {error ? <div className="et-error">{error}</div> : null}
        {!data && !error ? <div className="et-muted">Cargando…</div> : null}

        {/* ── Datos técnicos ── */}
        {data && tab === "specs" ? (
          editingSpecs ? (
            <div className="et-specs-edit">
              {specs.map((s, i) => (
                <div key={i} className="et-spec-row">
                  <input list="et-spec-sug" placeholder="Dato (ej. Potencia)" value={s.label} onChange={(e) => setSpecs((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <input placeholder="Valor" value={s.value} onChange={(e) => setSpecs((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <input placeholder="Unidad" value={s.unit} onChange={(e) => setSpecs((p) => p.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} />
                  <button type="button" className="et-icon" aria-label="Quitar dato" onClick={() => setSpecs((p) => p.filter((_, j) => j !== i))}>
                    <Icon name="trash" size="sm" />
                  </button>
                </div>
              ))}
              <datalist id="et-spec-sug">
                {SPEC_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
              <div className="et-actions">
                <button type="button" className="et-btn" onClick={() => setSpecs((p) => [...p, { label: "", value: "", unit: "" }])}>
                  <Icon name="plus" size="sm" /> Agregar dato
                </button>
                <span style={{ flex: 1 }} />
                <button type="button" className="et-btn" onClick={() => { setSpecs(data.specs || []); setEditingSpecs(false); }} disabled={saving}>Cancelar</button>
                <button type="button" className="et-btn is-primary" onClick={saveSpecs} disabled={saving}>
                  <Icon name="check" size="sm" /> {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {specs.length ? (
                <div className="et-specs">
                  {specs.map((s, i) => (
                    <div key={i} className="et-spec">
                      <span>{s.label}</span>
                      <b>
                        {s.value}
                        {s.unit ? <em> {s.unit}</em> : null}
                      </b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="et-empty">
                  <Icon name="list" size="xl" />
                  <b>Sin datos técnicos</b>
                  <span>Potencia, velocidad, capacidad de aceite, rodamientos, número de serie…</span>
                </div>
              )}
              {canManage ? (
                <div className="et-actions">
                  <button
                    type="button"
                    className="et-btn is-primary"
                    onClick={() => {
                      if (!specs.length) setSpecs([{ label: "", value: "", unit: "" }]);
                      setEditingSpecs(true);
                    }}
                  >
                    <Icon name="edit" size="sm" /> {specs.length ? "Editar datos técnicos" : "Agregar datos técnicos"}
                  </button>
                </div>
              ) : null}
            </>
          )
        ) : null}

        {/* ── Documentos ── */}
        {data && tab === "docs" ? (
          <>
            {canManage ? (
              <div className="et-upload">
                <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} aria-label="Tipo de documento">
                  {Object.entries(DOC_CAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input ref={fileRef} type="file" accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; upload(f); }} />
                <button type="button" className="et-btn is-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Icon name="upload" size="sm" /> {uploading ? "Subiendo…" : "Subir archivo"}
                </button>
                <span className="et-muted-sm">PDF, imagen, Word o Excel · hasta 20 MB</span>
              </div>
            ) : null}
            {docs.length ? (
              <div className="et-docs">
                {docs.map((d) => {
                  const cat = DOC_CAT[d.category] || DOC_CAT.OTRO;
                  const img = String(d.mime || "").startsWith("image/");
                  return (
                    <div key={d.id} className="et-doc">
                      <a className="et-doc-thumb" href={d.url} target="_blank" rel="noreferrer">
                        {img ? <img src={d.url} alt={d.name} loading="lazy" /> : <span>{(d.url.match(/\.([a-z0-9]{2,4})(\?|$)/i)?.[1] || "DOC").toUpperCase()}</span>}
                      </a>
                      <div className="et-doc-info">
                        <span className="et-doc-cat"><Icon name={cat.icon} size="sm" /> {cat.label}</span>
                        <b title={d.name}>{d.name}</b>
                        <span>{[fmtSize(d.size), fmtDate(d.createdAt)].filter(Boolean).join(" · ")}</span>
                      </div>
                      <div className="et-doc-actions">
                        <a className="et-icon" href={d.url} target="_blank" rel="noreferrer" title="Abrir / descargar"><Icon name="download" size="sm" /></a>
                        {canManage ? (
                          <button
                            type="button"
                            className="et-icon is-danger"
                            title="Eliminar"
                            onClick={async () => {
                              if (!(await confirm(`¿Eliminar «${d.name}»?`, { title: "Eliminar documento", confirmLabel: "Eliminar", danger: true }))) return;
                              try {
                                await deleteEquipmentDocument(equipmentId, d.id);
                                toast.success("Documento eliminado");
                                load();
                              } catch (e) {
                                toast.error(e?.message || "No se pudo eliminar");
                              }
                            }}
                          >
                            <Icon name="trash" size="sm" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="et-empty">
                <Icon name="doc" size="xl" />
                <b>Sin manuales ni documentos</b>
                <span>Sube manuales del fabricante, planos, fichas técnicas o certificados.</span>
              </div>
            )}
          </>
        ) : null}

        {/* ── Diagramas ── */}
        {data && tab === "diagrams" ? (
          <>
            {canManage ? (
              <div className="et-upload">
                <select value={newType} onChange={(e) => setNewType(e.target.value)} aria-label="Tipo de sistema">
                  {Object.entries(SYSTEM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button type="button" className="et-btn is-primary" onClick={() => navigate(`/equipments/${equipmentId}/diagrams/new?type=${newType}`)}>
                  <Icon name="plus" size="sm" /> Dibujar diagrama
                </button>
                <span className="et-muted-sm">Progresivo y aceite con dosificadores empiezan con una plantilla editable.</span>
              </div>
            ) : null}
            {diagrams.length ? (
              <div className="et-diagrams">
                {diagrams.map((d) => (
                  <div key={d.id} className="et-dcard">
                    <button type="button" className="et-dcard-main" onClick={() => navigate(`/equipments/${equipmentId}/diagrams/${d.id}`)}>
                      <span className="et-dcard-icon"><Icon name="route" /></span>
                      <span style={{ minWidth: 0 }}>
                        <span className="et-doc-cat">{SYSTEM_TYPES[d.systemType] || d.systemType}</span>
                        <b>{d.name}</b>
                        <span className="et-muted-sm">{d.nodes} elementos · {d.points} puntos · actualizado {fmtDate(d.updatedAt)}</span>
                      </span>
                    </button>
                    {canManage ? (
                      <button
                        type="button"
                        className="et-icon is-danger"
                        title="Eliminar diagrama"
                        onClick={async () => {
                          if (!(await confirm(`¿Eliminar el diagrama «${d.name}»? No se puede deshacer.`, { title: "Eliminar diagrama", confirmLabel: "Eliminar", danger: true }))) return;
                          try {
                            await deleteDiagram(equipmentId, d.id);
                            toast.success("Diagrama eliminado");
                            load();
                          } catch (e) {
                            toast.error(e?.message || "No se pudo eliminar");
                          }
                        }}
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="et-empty">
                <Icon name="route" size="xl" />
                <b>Sin diagramas de lubricación</b>
                <span>Dibuja el sistema automático del equipo: bomba, distribuidores progresivos, dosificadores, líneas y puntos.</span>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
