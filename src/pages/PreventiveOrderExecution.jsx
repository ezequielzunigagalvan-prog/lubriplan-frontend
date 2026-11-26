// src/pages/PreventiveOrderExecution.jsx
// Ejecución de una Orden de Lubricación Preventiva: por cada ruta se registra condición,
// cantidad real, observaciones y foto; o se ejecutan todas de una vez. Al final se firma.
// Cada ruta ejecutada cierra su actividad, descuenta inventario y programa su siguiente fecha.
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import SignaturePad from "../components/ui/SignaturePad";
import { Icon } from "../components/ui/lpIcons";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { CONDITIONS, ITEM_STATUS, compressImage, fmtDay, qtyText } from "../components/olp/olpUi";
import "./TechniciansPage.css";
import "../components/olp/Olp.css";

export default function PreventiveOrderExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [signature, setSignature] = useState(null);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setOrder(await preventiveOrdersService.get(Number(id)));
    } catch (e) {
      setError(e?.message || "No se pudo cargar la orden");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !order) {
    return (
      <MainLayout>
        <div className="tch lp-fade-in">
          <div className="olp-empty">Cargando orden…</div>
        </div>
      </MainLayout>
    );
  }
  if (error || !order) {
    return (
      <MainLayout>
        <div className="tch lp-fade-in">
          <div className="olp-error">{error || "Orden no encontrada"}</div>
          <button type="button" className="tch-btn tch-btn-ghost" onClick={() => navigate("/preventive-orders")}>
            <Icon name="arrowLeft" size="sm" /> Volver a órdenes
          </button>
        </div>
      </MainLayout>
    );
  }

  const items = order.items || [];
  const done = items.filter((i) => i.status === "COMPLETED").length;
  const skipped = items.filter((i) => i.status === "SKIPPED").length;
  const pendingItems = items.filter((i) => i.status === "PENDING");
  const closed = order.status === "CANCELLED" || (order.status === "COMPLETED" && order.signatureImage);
  const needPhoto = pendingItems.filter((i) => order.requiresPhoto || i.route?.evidenceRequired);

  async function completeAll() {
    const n = pendingItems.length - needPhoto.length;
    if (!n) return;
    if (!window.confirm(`Se ejecutarán ${n} ruta(s) con condición "Bueno" y la cantidad programada de cada una. ¿Continuar?`)) return;
    setBulkBusy(true);
    try {
      const r = await preventiveOrdersService.completeAll(order.id, { condition: "BUENO" });
      if (r.completed) toast.success(`${r.completed} ruta(s) ejecutada(s)`);
      for (const f of (r.results || []).filter((x) => !x.ok)) toast.warning(`${f.routeName}: ${f.error}`);
      for (const w of (r.results || []).filter((x) => x.ok && x.inventoryWarning)) toast.warning(`${w.routeName}: ${w.inventoryWarning}`);
      await load();
    } catch (e) {
      toast.error(e?.message || "No se pudieron ejecutar las rutas");
    } finally {
      setBulkBusy(false);
    }
  }

  async function closeOrder() {
    if (!signature) return toast.error("Firma para cerrar la orden");
    setClosing(true);
    try {
      await preventiveOrdersService.complete(order.id, signature);
      toast.success("Orden cerrada");
      navigate(`/preventive-orders/${order.id}`);
    } catch (e) {
      toast.error(e?.message || "No se pudo cerrar la orden");
    } finally {
      setClosing(false);
    }
  }

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        <div className="olp-exec-hero">
          <div style={{ minWidth: 0 }}>
            <small>Ejecución · OLP #{order.id}</small>
            <h2>{order.equipment?.name || "Equipo"}</h2>
            <p>
              {order.title} · Preventivo {fmtDay(order.scheduledDate)}
              {order.assignedToUser?.name ? ` · ${order.assignedToUser.name}` : ""}
            </p>
          </div>
          <div className="olp-exec-count">
            <div>
              <b>{pendingItems.length}</b>
              <span>Pendientes</span>
            </div>
            <div>
              <b style={{ color: "#86efac" }}>{done}</b>
              <span>Ejecutadas</span>
            </div>
            <div>
              <b style={{ color: "#cbd5e1" }}>{skipped}</b>
              <span>Omitidas</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="tch-btn tch-btn-ghost" onClick={() => navigate(`/preventive-orders/${order.id}`)}>
            <Icon name="arrowLeft" size="sm" /> Ver orden
          </button>
        </div>

        {order.notes ? (
          <div className="olp-warn">
            <Icon name="info" size="sm" /> <span>{order.notes}</span>
          </div>
        ) : null}

        {order.status === "CANCELLED" ? <div className="olp-error">Esta orden fue cancelada.</div> : null}

        {!closed && pendingItems.length > 1 ? (
          <div className="olp-bulk">
            <p>
              <b>¿Todo en orden?</b> Ejecuta todas las rutas pendientes con condición “Bueno” y la cantidad programada.
              {needPhoto.length ? ` ${needPhoto.length} ruta(s) piden foto y se quedan para capturarlas una por una.` : ""}
            </p>
            <button type="button" className="tch-btn tch-btn-primary" onClick={completeAll} disabled={bulkBusy || pendingItems.length === needPhoto.length}>
              <Icon name="checkCircle" size="sm" /> {bulkBusy ? "Ejecutando…" : `Completar todas (${pendingItems.length - needPhoto.length})`}
            </button>
          </div>
        ) : null}

        <div className="olp-xcards">
          {items.map((it, ix) => (
            <ExecItemCard key={it.id} order={order} it={it} ix={ix} disabled={closed || bulkBusy} onDone={load} />
          ))}
        </div>

        {order.status !== "CANCELLED" ? (
          <section className="olp-panel olp-page-end">
            <div className="olp-panel-head">
              <h3>Cierre de la orden</h3>
            </div>
            <div className="olp-panel-body olp-close">
              {order.signatureImage ? (
                <div className="olp-close-done">
                  <Icon name="checkCircle" /> Orden cerrada y firmada.
                </div>
              ) : pendingItems.length ? (
                <p style={{ margin: 0, fontSize: 13, color: "var(--tch-muted)" }}>
                  Ejecuta u omite las {pendingItems.length} ruta(s) pendientes para poder firmar el cierre.
                </p>
              ) : (
                <>
                  <SignaturePad onChange={setSignature} label="Firma del técnico" />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="button" className="tch-btn tch-btn-primary" onClick={closeOrder} disabled={closing || !signature}>
                      <Icon name="check" size="sm" /> {closing ? "Cerrando…" : "Firmar y cerrar orden"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </MainLayout>
  );
}

function ExecItemCard({ order, it, ix, disabled, onDone }) {
  const r = it.route || {};
  const ist = ITEM_STATUS[it.status] || ITEM_STATUS.PENDING;
  const pending = it.status === "PENDING";
  const photoRequired = Boolean(order.requiresPhoto || r.evidenceRequired);
  const hasLubricant = Boolean(r.lubricant);
  const plannedQty = Number(r.quantity) > 0 ? Number(r.quantity) : null;

  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState("BUENO");
  const [qty, setQty] = useState(plannedQty != null ? String(plannedQty) : "");
  const [obs, setObs] = useState("");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);

  const step = plannedQty != null && plannedQty < 5 ? 0.5 : 1;
  const bump = (d) => setQty((v) => String(Math.max(0, Math.round(((Number(v) || 0) + d) * 100) / 100)));

  async function onPhoto(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      setPhoto(await compressImage(f));
    } catch (err) {
      toast.error(err?.message || "No se pudo leer la foto");
    }
  }

  async function submit(status) {
    if (status === "SKIPPED" && !obs.trim()) return toast.error("Escribe el motivo para omitir la ruta");
    if (status === "COMPLETED" && photoRequired && !photo) return toast.error("Esta ruta requiere foto de evidencia");
    const q = qty === "" ? null : Number(qty);
    if (status === "COMPLETED" && hasLubricant && q != null && !(q > 0)) return toast.error("Captura una cantidad mayor a cero");
    setBusy(status);
    try {
      const res = await preventiveOrdersService.completeItem(order.id, it.id, {
        status,
        condition,
        observations: obs.trim(),
        photoUrl: photo,
        ...(status === "COMPLETED" && q != null && q !== plannedQty ? { usedQuantity: q } : {}),
      });
      setResult(res);
      if (status === "COMPLETED") {
        toast.success(`${r.name}: ejecutada${res.nextDate && !res.shared ? ` · siguiente ${fmtDay(res.nextDate)}` : ""}`);
        if (res.inventoryWarning) toast.warning(res.inventoryWarning);
      } else toast.success(`${r.name}: omitida`);
      await onDone?.();
    } catch (e) {
      toast.error(e?.message || "No se pudo registrar la ruta");
    } finally {
      setBusy("");
    }
  }

  const ex = it.execution;
  const mv = ex?.movements?.[0];
  const cond = CONDITIONS.find((c) => c.v === ex?.condition);

  return (
    <article className={`olp-x-card ${ist.cls}`}>
      <div className="olp-x-head">
        <span className="olp-route-ix">{it.status === "COMPLETED" ? <Icon name="check" size="sm" /> : ix + 1}</span>
        <div className="olp-x-title">
          <div className="olp-route-name">{r.name || "Ruta eliminada"}</div>
          <div className="olp-route-sub">
            <span>{r.lubricant?.name || r.lubricantName || (r.routeKind === "INSPECTION" ? "Inspección" : "Sin lubricante")}</span>
            {r.method ? <span>{r.method}</span> : null}
            {r.frequencyText ? <span>{r.frequencyText}</span> : null}
            {r.sharedCount > 1 ? <span className="olp-tag is-blue">Compartida · {r.sharedCount} equipos</span> : null}
            {photoRequired && pending ? <span className="olp-tag is-amber">Foto obligatoria</span> : null}
          </div>
        </div>
        <span className={`olp-badge ${ist.cls}`}>{ist.label}</span>
        {pending && !disabled ? (
          <button type="button" className="tch-btn tch-btn-ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Cerrar" : "Registrar"}
          </button>
        ) : null}
      </div>

      {pending && open && !disabled ? (
        <div className="olp-x-body">
          <div className="olp-x-spec">
            <Spec label="Cantidad por punto" value={qtyText(r.quantity, r.unit)} />
            <Spec label="Puntos" value={r.points || 1} />
            <Spec label="Consumo estimado" value={it.estimatedConsumption ? qtyText(it.estimatedConsumption.quantity, it.estimatedConsumption.unit) : "—"} />
            <Spec label="Stock disponible" value={r.lubricant ? qtyText(r.lubricant.stock, r.lubricant.unit) : "—"} />
            <Spec label="Próxima fecha actual" value={fmtDay(r.nextDate)} />
          </div>
          {r.instructions ? <div className="olp-x-instr">{r.instructions}</div> : null}

          <div className="olp-field">
            <span>Condición del equipo</span>
            <div className="olp-cond" role="group" aria-label="Condición">
              {CONDITIONS.map((c) => (
                <button key={c.v} type="button" className={c.cls} aria-pressed={condition === c.v} onClick={() => setCondition(c.v)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="olp-x-row">
            {hasLubricant && plannedQty != null ? (
              <div className="olp-field">
                <span>Cantidad real por punto</span>
                <div className="olp-step">
                  <button type="button" onClick={() => bump(-step)} aria-label="Menos">
                    −
                  </button>
                  <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.replace(",", "."))} aria-label="Cantidad" />
                  <em>{r.unit}</em>
                  <button type="button" onClick={() => bump(step)} aria-label="Más">
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div />
            )}
            <label className="olp-field">
              <span>Observaciones {"(obligatorio para omitir)"}</span>
              <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej. Se cambió grasera dañada, punto 3 sin acceso…" />
            </label>
          </div>

          <div className="olp-photo">
            <label className={photoRequired && !photo ? "is-required" : ""}>
              <Icon name="camera" size="sm" /> {photo ? "Cambiar foto" : photoRequired ? "Tomar foto (obligatoria)" : "Agregar foto"}
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
            </label>
            {photo ? (
              <>
                <img className="olp-thumb" src={photo} alt="Evidencia" />
                <button type="button" className="tch-btn tch-btn-ghost" onClick={() => setPhoto(null)}>
                  Quitar
                </button>
              </>
            ) : null}
          </div>

          {r.sharedCount > 1 ? (
            <div className="olp-warn">
              <Icon name="info" size="sm" /> Ruta compartida con otros equipos: se registra solo para este equipo y la ruta conserva su fecha para los demás.
            </div>
          ) : null}

          <div className="olp-x-foot">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={() => submit("SKIPPED")} disabled={!!busy}>
              <Icon name="xCircle" size="sm" /> {busy === "SKIPPED" ? "Guardando…" : "Omitir"}
            </button>
            <button type="button" className="tch-btn tch-btn-primary" onClick={() => submit("COMPLETED")} disabled={!!busy}>
              <Icon name="check" size="sm" /> {busy === "COMPLETED" ? "Guardando…" : "Ejecutar ruta"}
            </button>
          </div>
        </div>
      ) : null}

      {it.status === "COMPLETED" ? (
        <div className="olp-result">
          <Spec label="Condición" value={cond?.label || "—"} />
          <Spec label="Inventario descontado" value={mv ? qtyText(mv.quantity, mv.unit) : result?.stock ? qtyText(result.stock.quantity, result.stock.unit) : "Sin descuento"} />
          <Spec label={r.sharedCount > 1 ? "Fecha de la ruta (sin cambio)" : "Siguiente fecha"} value={fmtDay(r.nextDate)} green />
          <Spec label="Ejecutada" value={`${fmtDay(it.completedAt)}${it.completedByUser?.name ? ` · ${it.completedByUser.name}` : ""}`} />
        </div>
      ) : null}
      {it.status === "SKIPPED" && it.observations ? (
        <div className="olp-result">
          <Spec label="Motivo" value={it.observations} />
        </div>
      ) : null}
    </article>
  );
}

function Spec({ label, value, green }) {
  return (
    <div className="olp-route-col">
      <small>{label}</small>
      <b className={green ? "is-green" : ""}>{value ?? "—"}</b>
    </div>
  );
}
