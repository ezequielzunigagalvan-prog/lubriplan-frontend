// src/pages/PreventiveOrderDetail.jsx
// Detalle de una Orden de Lubricación Preventiva: rutas incluidas, lo ejecutado (condición,
// inventario descontado y siguiente fecha de cada ruta) y las acciones según el estado.
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import OlpOrderForm from "../components/olp/OlpOrderForm";
import { CONDITIONS, ITEM_STATUS, ORDER_STATUS, daysFromToday, fmtDateTime, fmtDay, pct, qtyText } from "../components/olp/olpUi";
import "./TechniciansPage.css";
import "../components/olp/Olp.css";

export default function PreventiveOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const canManage = role === "ADMIN" || role === "SUPERVISOR";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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

  async function run(key, fn, okMsg) {
    setBusy(key);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      await load();
    } catch (e) {
      toast.error(e?.message || "No se pudo completar la acción");
    } finally {
      setBusy("");
    }
  }

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

  const st = ORDER_STATUS[order.status] || ORDER_STATUS.DRAFT;
  const items = order.items || [];
  const done = items.filter((i) => i.status === "COMPLETED").length;
  const skipped = items.filter((i) => i.status === "SKIPPED").length;
  const pending = items.length - done - skipped;
  const progress = pct(done + skipped, items.length);
  const active = ["OPEN", "IN_PROGRESS"].includes(order.status);
  const left = daysFromToday(order.scheduledDate);
  const canExecute = active || (order.status === "DRAFT" && canManage);
  const needsSignature = order.status === "COMPLETED" && !order.signatureImage;

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">
              <button type="button" onClick={() => navigate("/preventive-orders")} style={{ border: 0, background: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer" }}>
                Órdenes preventivas
              </button>{" "}
              · OLP #{order.id}
            </div>
            <h1 className="tch-title">{order.title}</h1>
            <div className="tch-sub" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`olp-badge ${st.cls}`}>
                <Icon name={st.icon} size="sm" /> {st.label}
              </span>
              <span>
                {order.equipment?.name}
                {order.equipment?.code ? ` · ${order.equipment.code}` : ""}
              </span>
            </div>
          </div>
          <div className="tch-head-actions">
            {canExecute && pending > 0 ? (
              <button type="button" className="tch-btn tch-btn-primary" onClick={() => navigate(`/preventive-orders/${order.id}/execute`)}>
                <Icon name="tool" size="sm" /> {done + skipped ? "Continuar ejecución" : "Ejecutar rutas"}
              </button>
            ) : null}
            {needsSignature || (order.status !== "COMPLETED" && order.status !== "CANCELLED" && pending === 0) ? (
              <button type="button" className="tch-btn tch-btn-primary" onClick={() => navigate(`/preventive-orders/${order.id}/execute`)}>
                <Icon name="edit" size="sm" /> Firmar cierre
              </button>
            ) : null}
            {canManage && order.status === "DRAFT" ? (
              <button type="button" className="tch-btn tch-btn-ghost" disabled={!!busy} onClick={() => run("open", () => preventiveOrdersService.open(order.id), "Orden liberada al técnico")}>
                <Icon name="userCheck" size="sm" /> {busy === "open" ? "Liberando…" : "Liberar al técnico"}
              </button>
            ) : null}
            {canManage && (order.status === "DRAFT" || (order.status === "OPEN" && done + skipped === 0)) ? (
              <button type="button" className="tch-btn tch-btn-ghost" onClick={() => setEditing(true)}>
                <Icon name="edit" size="sm" /> Editar
              </button>
            ) : null}
            <button type="button" className="tch-btn tch-btn-ghost" onClick={() => window.print()}>
              <Icon name="doc" size="sm" /> Imprimir
            </button>
          </div>
        </header>

        <div className="olp-hero">
          <section className="olp-panel">
            <div className="olp-panel-head">
              <h3>Datos de la orden</h3>
            </div>
            <div className="olp-panel-body">
              <div className="olp-facts">
                <Fact label="Equipo" value={order.equipment?.name} />
                <Fact label="Ubicación" value={order.equipment?.location || "—"} />
                <Fact
                  label="Fecha del preventivo"
                  value={
                    <>
                      {fmtDay(order.scheduledDate)}
                      {active && left != null && left < 0 ? <span className="olp-tag is-red" style={{ marginLeft: 6 }}>Atrasada</span> : null}
                    </>
                  }
                />
                <Fact label="Técnico" value={order.assignedToUser?.name || "Sin asignar"} />
                <Fact label="Creada por" value={order.createdByUser?.name || "—"} />
                <Fact label="Creada" value={fmtDay(order.createdAt)} />
                {order.completedAt ? <Fact label="Cerrada" value={fmtDateTime(order.completedAt)} /> : null}
                <Fact label="Evidencia" value={order.requiresPhoto ? "Foto en todas las rutas" : "Según la ruta"} />
              </div>
              {order.notes ? <div className="olp-notes">{order.notes}</div> : null}
              {canManage && (order.status === "DRAFT" || active) ? (
                <div className="olp-actions">
                  {order.status === "DRAFT" ? (
                    <button
                      type="button"
                      className="tch-btn tch-btn-ghost olp-btn-danger"
                      disabled={!!busy}
                      onClick={() => {
                        if (!window.confirm("¿Eliminar este borrador? Esta acción no se puede deshacer.")) return;
                        run("del", async () => {
                          await preventiveOrdersService.remove(order.id);
                          navigate("/preventive-orders");
                        }, "Borrador eliminado");
                      }}
                    >
                      <Icon name="trash" size="sm" /> Eliminar borrador
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="tch-btn tch-btn-ghost olp-btn-danger"
                      disabled={!!busy}
                      onClick={() => {
                        const reason = window.prompt("Motivo de la cancelación (las rutas ya ejecutadas se conservan):", "");
                        if (reason === null) return;
                        run("cancel", () => preventiveOrdersService.cancel(order.id, reason), "Orden cancelada");
                      }}
                    >
                      <Icon name="xCircle" size="sm" /> Cancelar orden
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          <section className="olp-panel">
            <div className="olp-panel-head">
              <h3>Avance</h3>
            </div>
            <div className="olp-panel-body">
              <div className="olp-ring-wrap">
                <div className="olp-ring" style={{ "--p": progress }}>
                  <div>{progress}%</div>
                </div>
                <div className="olp-ring-stats">
                  <span>
                    <b>{done}</b> ejecutada{done === 1 ? "" : "s"}
                  </span>
                  <span>
                    <b>{skipped}</b> omitida{skipped === 1 ? "" : "s"}
                  </span>
                  <span>
                    <b>{pending}</b> pendiente{pending === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              {order.signatureImage ? (
                <div style={{ marginTop: 14 }}>
                  <div className="olp-fact">
                    <small>Firma de cierre</small>
                  </div>
                  <img className="olp-sig" src={order.signatureImage} alt="Firma" />
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section className="olp-panel">
          <div className="olp-panel-head">
            <h3>Rutas de la orden · {items.length}</h3>
          </div>
          <div className="olp-routes">
            {items.map((it, ix) => (
              <RouteRow key={it.id} it={it} ix={ix} />
            ))}
          </div>
        </section>
      </div>

      <OlpOrderForm
        open={editing}
        order={order}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          load();
        }}
      />
    </MainLayout>
  );
}

function Fact({ label, value }) {
  return (
    <div className="olp-fact">
      <small>{label}</small>
      <b>{value || "—"}</b>
    </div>
  );
}

function RouteRow({ it, ix }) {
  const r = it.route || {};
  const ist = ITEM_STATUS[it.status] || ITEM_STATUS.PENDING;
  const ex = it.execution;
  const cond = CONDITIONS.find((c) => c.v === ex?.condition);
  const mv = ex?.movements?.[0];
  return (
    <div className={`olp-route ${ist.cls}`}>
      <span className="olp-route-ix">{it.status === "COMPLETED" ? <Icon name="check" size="sm" /> : ix + 1}</span>
      <div style={{ minWidth: 0 }}>
        <div className="olp-route-name">{r.name || "Ruta eliminada"}</div>
        <div className="olp-route-sub">
          <span>{r.lubricant?.name || r.lubricantName || (r.routeKind === "INSPECTION" ? "Inspección" : "Sin lubricante")}</span>
          {Number(r.quantity) > 0 ? (
            <span>
              {qtyText(r.quantity, r.unit)} × {r.points || 1} pto{(r.points || 1) === 1 ? "" : "s"}
            </span>
          ) : null}
          {r.frequencyText ? <span>{r.frequencyText}</span> : null}
          {r.sharedCount > 1 ? <span className="olp-tag is-blue">Compartida</span> : null}
          {r.evidenceRequired ? <span className="olp-tag is-amber">Foto</span> : null}
        </div>
        {it.observations ? <div className="olp-route-sub" style={{ marginTop: 4 }}>“{it.observations}”</div> : null}
      </div>
      <div className="olp-route-col is-hide-md">
        <small>{it.status === "COMPLETED" ? "Consumo descontado" : "Consumo estimado"}</small>
        <b>
          {it.status === "COMPLETED"
            ? mv
              ? qtyText(mv.quantity, mv.unit)
              : "Sin descuento"
            : it.estimatedConsumption
            ? qtyText(it.estimatedConsumption.quantity, it.estimatedConsumption.unit)
            : "—"}
        </b>
      </div>
      <div className="olp-route-col is-hide-md">
        <small>{it.status === "COMPLETED" ? "Siguiente fecha de la ruta" : "Próxima fecha de la ruta"}</small>
        <b className={it.status === "COMPLETED" ? "is-green" : ""}>{fmtDay(r.nextDate)}</b>
        {it.status === "COMPLETED" && r.sharedCount > 1 ? <div className="olp-route-sub">Se conserva por los demás equipos</div> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span className={`olp-badge ${ist.cls}`}>{ist.label}</span>
        {cond ? <span className={`olp-tag ${cond.v === "BUENO" ? "is-green" : cond.v === "REGULAR" ? "is-amber" : "is-red"}`}>{cond.label}</span> : null}
        {it.completedAt ? <span className="olp-route-sub">{fmtDateTime(it.completedAt)}{it.completedByUser?.name ? ` · ${it.completedByUser.name}` : ""}</span> : null}
        {ex?.evidenceImage ? (
          <a href={ex.evidenceImage} target="_blank" rel="noreferrer">
            <img className="olp-thumb" src={ex.evidenceImage} alt="Evidencia" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
