// src/components/actionPlan/ActionItemDrawer.jsx
// Detalle de un pendiente: avance (barra + registrar avance con comentario), comentarios,
// evidencia y, para el admin, responsable / fecha de ejecución / cancelar.
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../ui/lpIcons";
import { useConfirm } from "../ui/ConfirmDialog";
import {
  getActionItem, updateActionItem, deleteActionItem, addActionProgress, addActionComment,
  uploadActionEvidence, deleteActionEvidence,
} from "../../services/actionPlanService";
import { CATEGORY, PRIORITY, STATUS, fmtDay, fmtDateTime, ymdOf, daysLeft, fmtLocalDay } from "./actionPlanUi";

const STEPS = [25, 50, 75, 100];

export default function ActionItemDrawer({ id, admin, currentUser, assignees = [], onClose, onChanged }) {
  const confirm = useConfirm();
  const fileRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState(null);
  const [progressNote, setProgressNote] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState("");
  const [edit, setEdit] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await getActionItem(id);
      setData(r);
      setTarget(null);
    } catch (e) {
      setError(e?.message || "No se pudo abrir el pendiente");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const run = async (key, fn, okMsg) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setBusy("");
    }
  };

  if (!data && !error) {
    return (
      <div className="ap-drawer-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <aside className="ap-drawer">
          <div className="ap-muted">Cargando…</div>
        </aside>
      </div>
    );
  }

  const item = data?.item;
  const cat = item ? CATEGORY[item.category] : null;
  const isOwner = item?.ownerUserId === currentUser?.id;
  const canWork = item && item.status !== "CANCELLED" && (admin || isOwner);
  const left = item ? daysLeft(item.dueDate) : 0;
  const minNext = admin ? 0 : (item?.progress || 0) + 1;
  const progValue = target ?? item?.progress ?? 0;

  return (
    <div className="ap-drawer-wrap" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <aside className="ap-drawer" role="dialog" aria-modal="true" aria-label="Detalle del pendiente" style={{ "--cat": cat?.color || "#f97316" }}>
        {error ? (
          <div className="ap-error" style={{ margin: 16 }}>
            {error}
          </div>
        ) : (
          <>
            <div className="ap-drawer-head">
              <div style={{ minWidth: 0 }}>
                <div className="ap-kicker">
                  <Icon name={cat.icon} size="sm" /> {cat.label.toUpperCase()} · {STATUS[item.status]}
                </div>
                <h2>{item.title}</h2>
                <div className="ap-drawer-meta">
                  <span className={`ap-prio ${PRIORITY[item.priority]?.cls}`}>{PRIORITY[item.priority]?.label}</span>
                  <span>
                    <Icon name="user" size="sm" /> {item.owner?.name}
                  </span>
                  <span className={item.overdue ? "is-red" : ""}>
                    <Icon name="calendar" size="sm" /> Ejecutar: {fmtDay(item.dueDate)}
                    {item.status !== "DONE" && item.status !== "CANCELLED" ? ` (${item.overdue ? `vencido ${Math.abs(left)} d` : left === 0 ? "hoy" : `en ${left} d`})` : ""}
                  </span>
                  {item.closedAt ? (
                    <span className="is-green">
                      <Icon name="check" size="sm" /> Cerrado {fmtLocalDay(item.closedAt)}
                    </span>
                  ) : null}
                  {item.equipment ? (
                    <span>
                      <Icon name="equipment" size="sm" /> {item.equipment.name}
                    </span>
                  ) : null}
                </div>
              </div>
              <button type="button" className="ap-x" onClick={onClose} aria-label="Cerrar">
                <Icon name="close" />
              </button>
            </div>

            <div className="ap-drawer-body">
              {item.description ? <p className="ap-desc">{item.description}</p> : null}

              {/* Avance */}
              <section className="ap-sec">
                <div className="ap-sec-title">Avance</div>
                <div className="ap-big-prog">
                  <div className="ap-bar is-big">
                    <span style={{ width: `${item.progress}%`, background: item.progress >= 100 ? "#16a34a" : cat.color }} />
                    {target != null && target > item.progress ? (
                      <span className="ap-bar-ghost" style={{ left: `${item.progress}%`, width: `${target - item.progress}%` }} />
                    ) : null}
                  </div>
                  <b>{progValue}%</b>
                </div>
                {canWork && item.status !== "DONE" ? (
                  <div className="ap-prog-form">
                    <div className="ap-chips">
                      {STEPS.filter((s) => s >= minNext).map((s) => (
                        <button key={s} type="button" className={`ap-chip ${target === s ? "is-on" : ""}`} onClick={() => setTarget(s)}>
                          {s === 100 ? "✓ 100% · Cerrar" : `${s}%`}
                        </button>
                      ))}
                      {item.progress + 10 <= 100 && !STEPS.includes(item.progress + 10) ? (
                        <button type="button" className={`ap-chip ${target === item.progress + 10 ? "is-on" : ""}`} onClick={() => setTarget(item.progress + 10)}>
                          +10%
                        </button>
                      ) : null}
                    </div>
                    <input
                      type="range"
                      min={minNext}
                      max={100}
                      step={5}
                      value={Math.max(minNext, progValue)}
                      onChange={(e) => setTarget(Number(e.target.value))}
                      aria-label="Nuevo avance"
                    />
                    <textarea
                      className="ap-input"
                      rows={2}
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      placeholder="¿Qué se avanzó? (obligatorio)"
                    />
                    <button
                      type="button"
                      className="ap-btn is-primary"
                      disabled={target == null || target === item.progress || progressNote.trim().length < 3 || Boolean(busy)}
                      onClick={() =>
                        run(
                          "progress",
                          async () => {
                            await addActionProgress(item.id, target, progressNote.trim());
                            setProgressNote("");
                          },
                          target >= 100 ? "Pendiente cerrado" : `Avance registrado: ${target}%`
                        )
                      }
                    >
                      <Icon name="trendUp" size="sm" /> {busy === "progress" ? "Guardando…" : target >= 100 ? "Cerrar pendiente" : "Registrar avance"}
                    </button>
                  </div>
                ) : null}
              </section>

              {/* Evidencia */}
              <section className="ap-sec">
                <div className="ap-sec-title">
                  Evidencia ({data.evidence.length})
                  {canWork ? (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,application/pdf"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) run("evidence", () => uploadActionEvidence(item.id, f), "Evidencia agregada");
                        }}
                      />
                      <button type="button" className="ap-btn is-sm" onClick={() => fileRef.current?.click()} disabled={Boolean(busy)}>
                        <Icon name="camera" size="sm" /> {busy === "evidence" ? "Subiendo…" : "Subir foto o PDF"}
                      </button>
                    </>
                  ) : null}
                </div>
                {data.evidence.length ? (
                  <div className="ap-evidence">
                    {data.evidence.map((ev) => {
                      const pdf = /\.pdf($|\?)/i.test(ev.url) || /\/raw\//.test(ev.url);
                      return (
                        <div key={ev.id} className="ap-ev">
                          <a href={ev.url} target="_blank" rel="noreferrer" className="ap-ev-thumb">
                            {pdf ? <span className="ap-ev-pdf">PDF</span> : <img src={ev.url} alt={ev.name || "Evidencia"} loading="lazy" />}
                          </a>
                          <div className="ap-ev-info">
                            <b>{ev.name || (pdf ? "Documento" : "Foto")}</b>
                            <span>
                              {ev.user?.name} · {fmtDateTime(ev.createdAt)}
                            </span>
                          </div>
                          {admin || ev.userId === currentUser?.id ? (
                            <button
                              type="button"
                              className="ap-icon-btn"
                              title="Quitar evidencia"
                              onClick={async () => {
                                if (await confirm("¿Quitar esta evidencia?", { title: "Quitar evidencia", confirmLabel: "Quitar", danger: true })) {
                                  run("ev-del", () => deleteActionEvidence(item.id, ev.id), "Evidencia quitada");
                                }
                              }}
                            >
                              <Icon name="trash" size="sm" />
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ap-muted-sm">Aún no hay evidencia.</div>
                )}
              </section>

              {/* Comentarios */}
              <section className="ap-sec">
                <div className="ap-sec-title">Comentarios y avances ({data.comments.length})</div>
                <div className="ap-comment-form">
                  <textarea className="ap-input" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Escribe un comentario" />
                  <button
                    type="button"
                    className="ap-btn"
                    disabled={!comment.trim() || Boolean(busy)}
                    onClick={() =>
                      run("comment", async () => {
                        await addActionComment(item.id, comment.trim());
                        setComment("");
                      })
                    }
                  >
                    <Icon name="doc" size="sm" /> Comentar
                  </button>
                </div>
                <ol className="ap-timeline">
                  {data.comments.map((c) => (
                    <li key={c.id} className={c.progressTo != null ? "is-progress" : ""}>
                      <span className="ap-avatar">{String(c.user?.name || "?").slice(0, 1).toUpperCase()}</span>
                      <div>
                        <div className="ap-tl-head">
                          <b>{c.user?.name}</b>
                          <span>{fmtDateTime(c.createdAt)}</span>
                          {c.progressTo != null ? (
                            <span className="ap-tl-prog">
                              {c.progressFrom}% → {c.progressTo}%
                            </span>
                          ) : null}
                        </div>
                        <p>{c.text}</p>
                      </div>
                    </li>
                  ))}
                  <li className="is-origin">
                    <span className="ap-avatar">{String(item.createdBy?.name || "?").slice(0, 1).toUpperCase()}</span>
                    <div>
                      <div className="ap-tl-head">
                        <b>{item.createdBy?.name}</b>
                        <span>{fmtDateTime(item.createdAt)}</span>
                      </div>
                      <p>Creó el pendiente{item.createdById !== item.ownerUserId ? ` y lo asignó a ${item.owner?.name}` : ""}.</p>
                    </div>
                  </li>
                </ol>
              </section>

              {/* Administración */}
              {admin ? (
                <section className="ap-sec is-admin">
                  <div className="ap-sec-title">Administración</div>
                  {edit ? (
                    <div className="ap-edit">
                      <label className="ap-label">
                        Responsable
                        <select className="ap-input" value={edit.ownerUserId} onChange={(e) => setEdit((s) => ({ ...s, ownerUserId: e.target.value }))}>
                          {assignees.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="ap-label">
                        Fecha de ejecución
                        <input className="ap-input" type="date" value={edit.dueDate} onChange={(e) => setEdit((s) => ({ ...s, dueDate: e.target.value }))} />
                      </label>
                      <div className="ap-row-btns">
                        <button type="button" className="ap-btn" onClick={() => setEdit(null)}>
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="ap-btn is-primary"
                          disabled={Boolean(busy)}
                          onClick={() => {
                            const patch = {};
                            if (Number(edit.ownerUserId) !== item.ownerUserId) patch.ownerUserId = Number(edit.ownerUserId);
                            if (edit.dueDate !== ymdOf(item.dueDate)) patch.dueDate = edit.dueDate;
                            if (!Object.keys(patch).length) return setEdit(null);
                            run("edit", async () => {
                              await updateActionItem(item.id, patch);
                              setEdit(null);
                            }, "Pendiente actualizado");
                          }}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ap-row-btns">
                      <button type="button" className="ap-btn" onClick={() => setEdit({ ownerUserId: String(item.ownerUserId), dueDate: ymdOf(item.dueDate) })}>
                        <Icon name="edit" size="sm" /> Responsable y fecha
                      </button>
                      {item.status === "DONE" || item.status === "CANCELLED" ? (
                        <button type="button" className="ap-btn" onClick={() => run("reopen", () => updateActionItem(item.id, { status: "REOPEN" }), "Pendiente reabierto")}>
                          <Icon name="refresh" size="sm" /> Reabrir
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="ap-btn"
                          onClick={async () => {
                            if (await confirm("El pendiente quedará cancelado (se conserva su historial).", { title: "Cancelar pendiente", confirmLabel: "Cancelar pendiente", danger: true })) {
                              run("cancel", () => updateActionItem(item.id, { status: "CANCELLED" }), "Pendiente cancelado");
                            }
                          }}
                        >
                          <Icon name="xCircle" size="sm" /> Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        className="ap-btn is-danger"
                        onClick={async () => {
                          if (await confirm("Se borrará el pendiente con sus comentarios y evidencia. No se puede deshacer.", { title: "Eliminar pendiente", confirmLabel: "Eliminar", danger: true })) {
                            setBusy("delete");
                            try {
                              await deleteActionItem(item.id);
                              toast.success("Pendiente eliminado");
                              onChanged?.();
                              onClose();
                            } catch (e) {
                              toast.error(e?.message || "No se pudo eliminar");
                            } finally {
                              setBusy("");
                            }
                          }
                        }}
                      >
                        <Icon name="trash" size="sm" /> Eliminar
                      </button>
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
