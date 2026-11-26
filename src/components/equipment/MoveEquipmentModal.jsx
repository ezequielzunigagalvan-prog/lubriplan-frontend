// src/components/equipment/MoveEquipmentModal.jsx
// Trasladar un equipo a otra planta (solo ADMIN): vista previa de lo que se mueve y confirmación.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../ui/lpIcons";
import { httpGet, httpPost } from "../../services/http";
import "../actionPlan/ActionPlan.css";

export default function MoveEquipmentModal({ equipment, onClose, onMoved }) {
  const [plants, setPlants] = useState(null);
  const [target, setTarget] = useState("");
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [moving, setMoving] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    httpGet("/equipment/move-targets")
      .then((r) => setPlants(Array.isArray(r?.items) ? r.items : []))
      .catch((e) => {
        setPlants([]);
        setError(e?.message || "No se pudieron cargar las plantas");
      });
  }, []);

  useEffect(() => {
    if (!target) return undefined;
    let alive = true;
    setLoadingPreview(true);
    httpGet(`/equipment/${equipment.id}/move-preview?toPlantId=${target}`)
      .then((r) => alive && (setPreview(r), setError("")))
      .catch((e) => alive && (setPreview(null), setError(e?.message || "No se pudo preparar el traslado")))
      .finally(() => alive && setLoadingPreview(false));
    return () => {
      alive = false;
    };
  }, [target, equipment.id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !moving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moving, onClose]);

  const code = equipment.code || equipment.name;
  const ready = preview && confirmText.trim().toUpperCase() === String(code).trim().toUpperCase();

  const move = async () => {
    if (!ready || moving) return;
    setMoving(true);
    try {
      const r = await httpPost(`/equipment/${equipment.id}/move`, { toPlantId: Number(target) });
      toast.success(`${equipment.name} ahora está en ${r?.target?.name || "la otra planta"}`);
      onMoved?.(r);
    } catch (e) {
      setError(e?.message || "No se pudo trasladar el equipo");
    } finally {
      setMoving(false);
    }
  };

  const m = preview?.moves;
  const pending = (preview?.technicians || []).filter((t) => !t.to);
  const missingLub = (preview?.lubricants || []).filter((l) => !l.found);

  return (
    <div className="ap-overlay" onMouseDown={(e) => e.target === e.currentTarget && !moving && onClose()}>
      <div className="ap-modal" style={{ "--cat": "#2563eb" }} role="dialog" aria-modal="true" aria-label="Trasladar equipo">
        <div className="ap-modal-head">
          <div>
            <div className="ap-kicker">TRASLADAR EQUIPO · SOLO ADMINISTRADOR</div>
            <div className="ap-modal-title">{equipment.name}</div>
          </div>
          <button type="button" className="ap-x" onClick={onClose} disabled={moving} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="ap-modal-body">
          <label className="ap-label">
            Planta destino
            <select className="ap-input" value={target} onChange={(e) => { setTarget(e.target.value); setPreview(null); setConfirmText(""); }}>
              <option value="">{plants == null ? "Cargando…" : plants.length ? "Elige la planta" : "No hay otras plantas activas"}</option>
              {(plants || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          {loadingPreview ? <div className="ap-muted-sm">Revisando qué se mueve…</div> : null}

          {m ? (
            <>
              <div className="mv-grid">
                {[
                  [m.routes, "Rutas"],
                  [m.activities, "Actividades (historial incluido)"],
                  [m.openActivities, "Pendientes"],
                  [m.conditionReports, "Reportes de condición"],
                  [m.documents + m.diagrams, "Documentos y diagramas"],
                  [m.oilSamples + m.preventiveOrders, "Muestras y órdenes"],
                ].map(([v, l]) => (
                  <div key={l} className="mv-stat">
                    <b>{v}</b>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <div className="mv-note is-ok">
                <Icon name="check" size="sm" /> El equipo, su carta de lubricación y su QR pasan a <b>{preview.target.name}</b>. Sus supervisores verán sus rutas y actividades y recibirán un aviso.
              </div>
              {preview.technicians.length ? (
                <div className="mv-list">
                  <b>Técnicos</b>
                  {preview.technicians.map((t) => (
                    <span key={t.from} className={t.to ? "" : "is-warn"}>
                      {t.from} → {t.to || "sin técnico (asignar en la planta destino)"}
                    </span>
                  ))}
                </div>
              ) : null}
              {preview.lubricants.length ? (
                <div className="mv-list">
                  <b>Lubricantes</b>
                  {preview.lubricants.map((l) => (
                    <span key={l.route} className={l.found ? "" : "is-warn"}>
                      {l.lubricant}: {l.found ? "existe en la planta destino" : "no existe en el inventario destino (queda como texto)"}
                    </span>
                  ))}
                </div>
              ) : null}
              {preview.area ? (
                <div className="mv-list">
                  <b>Área</b>
                  <span className={preview.area.to ? "" : "is-warn"}>{preview.area.from} → {preview.area.to || "sin área"}</span>
                </div>
              ) : null}
              {preview.stays.sharedRoutes.length || preview.stays.actionItems ? (
                <div className="mv-note is-warn">
                  <Icon name="warn" size="sm" />
                  <span>
                    Se quedan en esta planta:
                    {preview.stays.sharedRoutes.length ? ` ${preview.stays.sharedRoutes.length} ruta(s) compartida(s) con otros equipos (${preview.stays.sharedRoutes.map((r) => r.name).join(", ")}); el equipo sale de ellas.` : ""}
                    {preview.stays.actionItems ? ` ${preview.stays.actionItems} pendiente(s) del Plan de acción sin referencia al equipo.` : ""}
                  </span>
                </div>
              ) : null}
              {pending.length || missingLub.length ? (
                <div className="mv-note is-warn">
                  <Icon name="info" size="sm" /> Después del traslado revisa en la planta destino {pending.length ? "los técnicos" : ""}{pending.length && missingLub.length ? " y " : ""}{missingLub.length ? "los lubricantes" : ""} marcados.
                </div>
              ) : null}
              <label className="ap-label">
                Para confirmar escribe <span style={{ textTransform: "none", color: "#0f172a" }}>{code}</span>
                <input className="ap-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={code} />
              </label>
            </>
          ) : null}
          {error ? <div className="ap-error">{error}</div> : null}
        </div>
        <div className="ap-modal-foot">
          <button type="button" className="ap-btn" onClick={onClose} disabled={moving}>Cancelar</button>
          <button type="button" className="ap-btn is-primary" onClick={move} disabled={!ready || moving}>
            <Icon name="building" size="sm" /> {moving ? "Trasladando…" : "Trasladar equipo"}
          </button>
        </div>
      </div>
    </div>
  );
}
