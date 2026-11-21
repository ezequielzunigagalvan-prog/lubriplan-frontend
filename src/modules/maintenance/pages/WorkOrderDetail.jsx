import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, CheckCircle2, XCircle, UserPlus, Play, PauseCircle, Flag, ShieldCheck, RotateCcw, Ban,
  ClipboardList, Package, AlertTriangle, Camera, History, Save, Trash2, UserCog, MessageSquare, Send,
} from 'lucide-react';
import { MtCard, MtBadge, MtButton } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import PhotoCapture from '../components/PhotoCapture';
import { STATE_LABELS, PRIORITY_LABELS } from '../constants/maintenance';
import '../ui/tokens.css';

/** YYYY-MM-DD en la hora local (no UTC): una OT creada a las 19:25 del 20 no debe quedar programada el 21. */
const localYmd = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const TYPE_LABELS = { CORRECTIVE: 'Correctiva', PREVENTIVE: 'Preventiva', INSPECTION: 'Inspección' };
const STATUS_BADGE = {
  REQUESTED: 'info', APPROVED: 'info', ASSIGNED: 'accent', IN_PROGRESS: 'warning', WAITING_PARTS: 'warning',
  WAITING_PRODUCTION: 'warning', FINISHED: 'success', VALIDATED: 'success', REJECTED: 'danger', CANCELLED: 'neutral',
};
const PRIORITY_BADGE = { CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'info', LOW: 'neutral' };
const PRODUCTION_EFFECTS = [
  { value: '', label: '— Sin especificar —' },
  { value: 'TOTAL_STOP', label: 'Paro total' },
  { value: 'PARTIAL_STOP', label: 'Paro parcial' },
  { value: 'NO_EFFECT', label: 'Sin efecto en producción' },
];
const RESULT_LABELS = { OK: 'OK', NOT_OK: 'No OK', NA: 'N/A' };
const RESULT_BADGE = { OK: 'success', NOT_OK: 'danger', NA: 'neutral' };

/** Acciones de la máquina de estados, en el orden en que se muestran. */
const ACTIONS = {
  APPROVED: { label: 'Aprobar', icon: CheckCircle2, variant: 'primary' },
  ASSIGNED: { label: 'Asignar técnico', icon: UserPlus, variant: 'primary', form: 'assign' },
  IN_PROGRESS: { label: 'Iniciar trabajo', icon: Play, variant: 'primary' },
  WAITING_PARTS: { label: 'Esperando refacciones', icon: PauseCircle, variant: 'secondary', form: 'comment' },
  WAITING_PRODUCTION: { label: 'Esperando producción', icon: PauseCircle, variant: 'secondary', form: 'comment' },
  FINISHED: { label: 'Terminar trabajo', icon: Flag, variant: 'primary', form: 'finish' },
  VALIDATED: { label: 'Validar', icon: ShieldCheck, variant: 'primary', form: 'comment' },
  REJECTED: { label: 'Rechazar', icon: XCircle, variant: 'secondary', form: 'reason' },
  CANCELLED: { label: 'Cancelar orden', icon: Ban, variant: 'secondary', form: 'reason' },
};

const errorMessage = (err, fallback) => err?.data?.error || err?.message || fallback;
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
const woNumber = (n) => `OT-${String(n).padStart(5, '0')}`;

const labelStyle = { fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' };

function Section({ icon: Icon, title, children, right }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'var(--mt-font-weight-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon size={18} style={{ color: 'var(--mt-accent)' }} /> {title}
          </h3>
          {right}
        </div>
        {children}
      </div>
    </MtCard>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <div style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', color: value ? 'var(--mt-text-primary)' : 'var(--mt-text-tertiary)' }}>{value || '—'}</div>
    </div>
  );
}

function Empty({ text }) {
  return <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>{text}</p>;
}

/** Fila del checklist: permite registrar el resultado cuando la orden está en ejecución. */
function TaskRow({ task, editable, onSave }) {
  const [value, setValue] = useState(task.kind === 'MEASURE' ? task.valueNumber ?? '' : task.valueText ?? '');
  const [saving, setSaving] = useState(false);

  const save = async (data) => {
    setSaving(true);
    try {
      await onSave(task, data);
    } finally {
      setSaving(false);
    }
  };

  const limits = task.kind === 'MEASURE' && (task.minValue != null || task.maxValue != null)
    ? ` (rango ${task.minValue ?? '−∞'} – ${task.maxValue ?? '∞'}${task.unit ? ` ${task.unit}` : ''})`
    : task.unit ? ` (${task.unit})` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 'var(--mt-space-md)', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-base)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '13px' }}>
          <strong>{task.position + 1}.</strong> {task.description}
          <span style={{ color: 'var(--mt-text-tertiary)' }}>{limits}</span>
          {task.required && <span style={{ color: 'var(--mt-danger)' }}> *</span>}
        </div>
        {task.result && <MtBadge variant={RESULT_BADGE[task.result]} size="sm">{RESULT_LABELS[task.result]}</MtBadge>}
      </div>

      {!editable && (task.valueNumber != null || task.valueText) && (
        <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
          Registrado: {task.valueNumber ?? task.valueText}{task.unit && task.valueNumber != null ? ` ${task.unit}` : ''}
        </div>
      )}

      {editable && task.kind === 'CHECK' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['OK', 'NOT_OK', 'NA'].map((r) => (
            <MtButton key={r} size="sm" variant={task.result === r ? 'primary' : 'secondary'} disabled={saving} onClick={() => save({ result: r })}>
              {RESULT_LABELS[r]}
            </MtButton>
          ))}
        </div>
      )}

      {editable && task.kind !== 'CHECK' && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type={task.kind === 'MEASURE' ? 'number' : 'text'}
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={task.kind === 'MEASURE' ? `Valor${task.unit ? ` (${task.unit})` : ''}` : 'Respuesta'}
            style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
          />
          <MtButton
            size="sm"
            disabled={saving || value === ''}
            onClick={() => save(task.kind === 'MEASURE' ? { valueNumber: Number(value) } : { valueText: value })}
          >
            Guardar
          </MtButton>
          <MtButton size="sm" variant="secondary" disabled={saving} onClick={() => save({ result: 'NA' })}>N/A</MtButton>
        </div>
      )}
    </div>
  );
}

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [action, setAction] = useState(null); // estado destino seleccionado
  const [form, setForm] = useState({ comment: '', assignedTo: '', scheduledAt: '', workDone: '', diagnosis: '', failureCause: '', downtimeMinutes: '', startedAt: '', finishedAt: '', alsoValidate: false });
  const [note, setNote] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [failureCodes, setFailureCodes] = useState({ FAILURE_MODE: [], MECHANISM: [], ROOT_CAUSE: [] });
  const [consume, setConsume] = useState({ sparePartId: '', quantity: '' });
  const [failureForm, setFailureForm] = useState({ failureModeId: '', mechanismId: '', rootCauseId: '', productionEffect: '' });
  const [execution, setExecution] = useState({ diagnosis: '', failureCause: '', workDone: '', downtimeMinutes: '' });

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await maintenanceApi.getWorkOrder(id);
      setData(res);
      const wo = res.workOrder;
      setExecution({
        diagnosis: wo.diagnosis || '',
        failureCause: wo.failureCause || '',
        workDone: wo.workDone || '',
        downtimeMinutes: wo.downtimeMinutes ?? '',
      });
      setFailureForm({
        failureModeId: wo.failure?.failureModeId ?? '',
        mechanismId: wo.failure?.mechanismId ?? '',
        rootCauseId: wo.failure?.rootCauseId ?? '',
        productionEffect: wo.failure?.productionEffect ?? '',
      });
    } catch (err) {
      console.error('[WorkOrderDetail] Error loading work order:', err);
      setError(err?.status === 404 ? 'La orden no existe' : errorMessage(err, 'No se pudo cargar la orden'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const wo = data?.workOrder;
  const perms = data?.permissions;

  // Catálogos que solo se necesitan según lo que el usuario puede hacer
  useEffect(() => {
    if (!perms) return;
    if (perms.availableTransitions.includes('ASSIGNED') && technicians.length === 0) {
      maintenanceApi.getAssignableUsers().then((r) => setTechnicians(Array.isArray(r) ? r : r?.data || [])).catch(() => {});
    }
    if (perms.canExecute && spareParts.length === 0) {
      maintenanceApi.getSpareParts({ take: 100 }).then((r) => setSpareParts(r?.data || (Array.isArray(r) ? r : []))).catch(() => {});
    }
    if (perms.canEditFailure && failureCodes.FAILURE_MODE.length === 0) {
      maintenanceApi.getFailureCodes().then((r) => r && setFailureCodes({ FAILURE_MODE: [], MECHANISM: [], ROOT_CAUSE: [], ...r })).catch(() => {});
    }
  }, [perms, technicians.length, spareParts.length, failureCodes.FAILURE_MODE.length]);

  const actions = useMemo(() => {
    if (!perms || !wo) return [];
    return Object.keys(ACTIONS)
      .filter((to) => perms.availableTransitions.includes(to))
      .map((to) => {
        const base = ACTIONS[to];
        let label = base.label;
        if (to === 'ASSIGNED' && wo.status === 'ASSIGNED') label = 'Reasignar';
        if (to === 'IN_PROGRESS' && wo.status === 'FINISHED') label = 'Reabrir';
        if (to === 'IN_PROGRESS' && wo.status.startsWith('WAITING')) label = 'Reanudar trabajo';
        return { to, ...base, label, icon: to === 'IN_PROGRESS' && wo.status === 'FINISHED' ? RotateCcw : base.icon };
      });
  }, [perms, wo]);

  const openAction = (to) => {
    const def = ACTIONS[to];
    if (!def.form) return runTransition(to, {});
    setForm((f) => ({
      ...f,
      comment: '',
      assignedTo: wo.assignedTo ? String(wo.assignedTo) : '',
      scheduledAt: wo.scheduledAt ? localYmd(wo.scheduledAt) : '',
      workDone: execution.workDone,
      diagnosis: execution.diagnosis,
      failureCause: execution.failureCause,
      downtimeMinutes: execution.downtimeMinutes,
      startedAt: '',
      finishedAt: '',
      alsoValidate: false,
    }));
    setAction(to);
  };

  const runTransition = async (to, extra) => {
    try {
      setBusy(true);
      await maintenanceApi.transitionWorkOrder(wo.id, { to, expectedVersion: wo.version, ...extra });
      toast.success(`Estado actualizado: ${STATE_LABELS[extra.alsoValidate ? 'VALIDATED' : to] || to}`);
      setAction(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo cambiar el estado'));
      if (err?.status === 409) await load();
    } finally {
      setBusy(false);
    }
  };

  const submitAction = (e) => {
    e.preventDefault();
    const def = ACTIONS[action];
    const extra = {};
    if (form.comment.trim()) extra.comment = form.comment.trim();
    if (def.form === 'reason' && !extra.comment) return toast.error('Escribe el motivo');
    if (def.form === 'assign') {
      if (!form.assignedTo) return toast.error('Selecciona un técnico');
      extra.assignedTo = Number(form.assignedTo);
      if (form.scheduledAt) extra.scheduledAt = form.scheduledAt;
    }
    if (def.form === 'finish') {
      if (!form.workDone.trim()) return toast.error('Describe el trabajo realizado');
      extra.workDone = form.workDone.trim();
      if (form.diagnosis.trim()) extra.diagnosis = form.diagnosis.trim();
      if (form.failureCause.trim()) extra.failureCause = form.failureCause.trim();
      if (form.downtimeMinutes !== '') extra.downtimeMinutes = Number(form.downtimeMinutes);
      if (perms.isManager) {
        // datetime-local está en hora del navegador: se manda en ISO para no depender de la zona del servidor
        if (form.startedAt) extra.startedAt = new Date(form.startedAt).toISOString();
        if (form.finishedAt) extra.finishedAt = new Date(form.finishedAt).toISOString();
        if (form.startedAt && form.finishedAt && form.startedAt > form.finishedAt) return toast.error('El inicio debe ser anterior al término');
        if (form.alsoValidate) extra.alsoValidate = true;
      }
    }
    return runTransition(action, extra);
  };

  const saveExecution = async () => {
    try {
      setBusy(true);
      await maintenanceApi.updateExecution(wo.id, {
        ...execution,
        downtimeMinutes: execution.downtimeMinutes === '' ? undefined : Number(execution.downtimeMinutes),
        expectedVersion: wo.version,
      });
      toast.success('Avance guardado');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo guardar el avance'));
      if (err?.status === 409) await load();
    } finally {
      setBusy(false);
    }
  };

  const saveTask = async (task, payload) => {
    try {
      await maintenanceApi.updateWorkOrderTask(wo.id, task.id, payload);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo guardar la tarea'));
    }
  };

  const consumePart = async (e) => {
    e.preventDefault();
    if (!consume.sparePartId || !(Number(consume.quantity) > 0)) return toast.error('Selecciona la refacción y una cantidad mayor a 0');
    try {
      setBusy(true);
      await maintenanceApi.consumeSparePartInWorkOrder({ workOrderId: wo.id, sparePartId: Number(consume.sparePartId), quantity: Number(consume.quantity) });
      toast.success('Refacción registrada y descontada del inventario');
      setConsume({ sparePartId: '', quantity: '' });
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo registrar la refacción'));
    } finally {
      setBusy(false);
    }
  };

  const saveFailure = async (e) => {
    e.preventDefault();
    const toId = (v) => (v === '' ? null : Number(v));
    try {
      setBusy(true);
      await maintenanceApi.assignFailureToWorkOrder(wo.id, {
        failureModeId: toId(failureForm.failureModeId),
        mechanismId: toId(failureForm.mechanismId),
        rootCauseId: toId(failureForm.rootCauseId),
        productionEffect: failureForm.productionEffect || null,
      });
      toast.success('Clasificación de la falla guardada');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo guardar la falla'));
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      setBusy(true);
      await maintenanceApi.addWorkOrderComment(wo.id, note.trim());
      setNote('');
      toast.success('Comentario agregado');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo guardar el comentario'));
    } finally {
      setBusy(false);
    }
  };

  const deletePhoto = async (photo) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await maintenanceApi.deleteWorkOrderPhoto(wo.id, photo.id);
      toast.success('Foto eliminada');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo eliminar la foto'));
    }
  };

  if (loading) {
    return (
      <MtCard elevated>
        <p style={{ padding: 'var(--mt-space-3xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-secondary)' }}>Cargando orden...</p>
      </MtCard>
    );
  }

  if (error || !wo) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <XCircle size={40} style={{ color: 'var(--mt-danger)' }} />
          <p style={{ margin: 0, fontWeight: 'var(--mt-font-weight-bold)' }}>{error || 'Orden no encontrada'}</p>
          <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/work-orders')}>Volver a órdenes</MtButton>
        </div>
      </MtCard>
    );
  }

  const { events, photos } = data;
  const isOpen = !['FINISHED', 'VALIDATED', 'REJECTED', 'CANCELLED'].includes(wo.status);
  const tasksDone = wo.tasks.filter((t) => t.result).length;
  const actionDef = action ? ACTIONS[action] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-xl)' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', gap: 'var(--mt-space-md)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/maintenance/app/work-orders')} aria-label="Volver" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft size={20} style={{ color: 'var(--mt-text-secondary)' }} />
        </button>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <code style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mt-accent)' }}>{woNumber(wo.number)}</code>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '4px 0 8px' }}>{wo.title}</h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <MtBadge variant={STATUS_BADGE[wo.status]} dot>{STATE_LABELS[wo.status] || wo.status}</MtBadge>
            <MtBadge variant={PRIORITY_BADGE[wo.priority]}>Prioridad {PRIORITY_LABELS[wo.priority] || wo.priority}</MtBadge>
            <MtBadge variant="neutral">{TYPE_LABELS[wo.type] || wo.type}</MtBadge>
            {wo.plan && <MtBadge variant="accent">Plan {wo.plan.code}</MtBadge>}
            {wo.overdue && <MtBadge variant="danger">Atrasada {wo.daysOverdue} día(s)</MtBadge>}
          </div>
        </div>
      </div>

      {/* Captura en nombre del técnico */}
      {perms.onBehalfOf && !['VALIDATED', 'REJECTED', 'CANCELLED'].includes(wo.status) && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', borderRadius: 'var(--mt-radius-lg)', background: 'var(--mt-accent-soft, rgba(56,189,248,0.1))', border: '1px solid var(--mt-accent)' }}>
          <UserCog size={22} style={{ color: 'var(--mt-accent)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px' }}>
            <strong>Estás registrando esta orden en nombre de {perms.onBehalfOf.technicianName}.</strong>
            <div style={{ color: 'var(--mt-text-secondary)', marginTop: '2px' }}>
              {perms.onBehalfOf.hasUser ? 'El técnico tiene usuario, pero puedes capturar por él.' : 'El técnico aún no tiene usuario en el sistema.'}{' '}
              Inicia el trabajo, llena el checklist, registra refacciones, sube evidencia y comentarios, y termínala. Todo queda a tu nombre como capturista.
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      {actions.length > 0 && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', flexWrap: 'wrap' }}>
              {actions.map(({ to, label, icon: Icon, variant }) => (
                <MtButton key={to} variant={action === to ? 'primary' : variant} disabled={busy} onClick={() => openAction(to)}>
                  <Icon size={16} /> {label}
                </MtButton>
              ))}
            </div>

            {actionDef && (
              <form onSubmit={submitAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)', borderTop: '1px solid var(--mt-border)', paddingTop: 'var(--mt-space-md)' }}>
                {actionDef.form === 'assign' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--mt-space-md)' }}>
                    <Field label="Técnico *">
                      <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={inputStyle}>
                        <option value="">— Selecciona —</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` · ${t.specialty}` : ''}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Fecha programada">
                      <input type="date" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} style={inputStyle} />
                    </Field>
                  </div>
                )}

                {actionDef.form === 'finish' && (
                  <>
                    {wo.tasks.some((t) => t.required && !t.result) && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-warning)' }}>
                        Faltan tareas obligatorias del checklist: complétalas antes de terminar.
                      </p>
                    )}
                    <Field label="Trabajo realizado *">
                      <textarea rows={3} value={form.workDone} onChange={(e) => setForm({ ...form, workDone: e.target.value })} style={inputStyle} />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--mt-space-md)' }}>
                      <Field label="Diagnóstico">
                        <textarea rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} style={inputStyle} />
                      </Field>
                      <Field label="Causa de la falla">
                        <textarea rows={2} value={form.failureCause} onChange={(e) => setForm({ ...form, failureCause: e.target.value })} style={inputStyle} />
                      </Field>
                      <Field label="Tiempo de paro (minutos)">
                        <input type="number" min="0" value={form.downtimeMinutes} onChange={(e) => setForm({ ...form, downtimeMinutes: e.target.value })} style={inputStyle} />
                      </Field>
                    </div>
                    {perms.isManager && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--mt-space-md)' }}>
                          <Field label="Inicio real (opcional)">
                            <input type="datetime-local" value={form.startedAt} onChange={(e) => setForm({ ...form, startedAt: e.target.value })} style={inputStyle} />
                          </Field>
                          <Field label="Término real (opcional, si se hizo antes)">
                            <input type="datetime-local" value={form.finishedAt} onChange={(e) => setForm({ ...form, finishedAt: e.target.value })} style={inputStyle} />
                          </Field>
                        </div>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={form.alsoValidate} onChange={(e) => setForm({ ...form, alsoValidate: e.target.checked })} />
                          Validar la orden al terminar (queda como realizada y cerrada)
                        </label>
                      </>
                    )}
                  </>
                )}

                {actionDef.form !== 'assign' && (
                  <Field label={actionDef.form === 'reason' ? 'Motivo *' : 'Comentario'}>
                    <textarea rows={2} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} style={inputStyle} />
                  </Field>
                )}

                <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', justifyContent: 'flex-end' }}>
                  <MtButton type="button" variant="secondary" onClick={() => setAction(null)} disabled={busy}>Cancelar</MtButton>
                  <MtButton type="submit" disabled={busy}>{busy ? 'Guardando...' : `Confirmar: ${actionDef.label}`}</MtButton>
                </div>
              </form>
            )}
          </div>
        </MtCard>
      )}

      {/* Datos generales */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          <Info
            label="Activo"
            value={wo.asset ? <Link to={`/maintenance/app/assets/${wo.asset.id}`} style={{ color: 'var(--mt-accent)' }}>{wo.asset.code} · {wo.asset.name}</Link> : null}
          />
          <Info label="Ubicación" value={wo.asset?.location} />
          <Info label="Reportada por" value={wo.requester?.name} />
          <Info label="Técnico asignado" value={wo.assignee?.name} />
          <Info label="Creada" value={fmtDateTime(wo.createdAt)} />
          <Info label="Programada" value={wo.scheduledAt ? fmtDateTime(wo.scheduledAt) : null} />
          <Info
            label={wo.type === 'CORRECTIVE' && !wo.scheduledAt ? 'Fecha compromiso (SLA)' : 'Fecha compromiso'}
            value={wo.effectiveDueAt ? <span style={{ color: wo.overdue ? 'var(--mt-danger)' : undefined }}>{fmtDateTime(wo.effectiveDueAt)}</span> : null}
          />
          <Info label="Inicio" value={wo.startedAt ? fmtDateTime(wo.startedAt) : null} />
          <Info label="Término" value={wo.finishedAt ? fmtDateTime(wo.finishedAt) : null} />
          {wo.validatedAt && <Info label="Validada" value={`${fmtDateTime(wo.validatedAt)}${wo.validator ? ` · ${wo.validator.name}` : ''}`} />}
        </div>
        {wo.description && (
          <p style={{ margin: 0, padding: '0 var(--mt-space-lg) var(--mt-space-lg)', fontSize: '14px', color: 'var(--mt-text-secondary)', whiteSpace: 'pre-wrap' }}>
            {wo.description}
          </p>
        )}
      </MtCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 'var(--mt-space-xl)', alignItems: 'start' }}>
        {/* Checklist */}
        <Section icon={ClipboardList} title={`Checklist (${tasksDone}/${wo.tasks.length})`}>
          {wo.tasks.length === 0 && <Empty text="Esta orden no tiene tareas de checklist." />}
          {wo.tasks.length > 0 && !perms.canExecute && isOpen && (
            <Empty text="Las tareas se registran cuando la orden está en ejecución." />
          )}
          {wo.tasks.map((task) => (
            <TaskRow key={task.id} task={task} editable={perms.canExecute} onSave={saveTask} />
          ))}
        </Section>

        {/* Ejecución */}
        <Section
          icon={Save}
          title="Ejecución"
          right={perms.canExecute && <MtButton size="sm" variant="secondary" disabled={busy} onClick={saveExecution}>Guardar avance</MtButton>}
        >
          {perms.canExecute ? (
            <>
              <Field label="Diagnóstico">
                <textarea rows={2} value={execution.diagnosis} onChange={(e) => setExecution({ ...execution, diagnosis: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Causa de la falla">
                <textarea rows={2} value={execution.failureCause} onChange={(e) => setExecution({ ...execution, failureCause: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Trabajo realizado">
                <textarea rows={3} value={execution.workDone} onChange={(e) => setExecution({ ...execution, workDone: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Tiempo de paro (minutos)">
                <input type="number" min="0" value={execution.downtimeMinutes} onChange={(e) => setExecution({ ...execution, downtimeMinutes: e.target.value })} style={inputStyle} />
              </Field>
            </>
          ) : (
            <>
              <Info label="Diagnóstico" value={wo.diagnosis} />
              <Info label="Causa de la falla" value={wo.failureCause} />
              <Info label="Trabajo realizado" value={wo.workDone} />
              <Info label="Tiempo de paro" value={wo.downtimeMinutes != null ? `${wo.downtimeMinutes} min` : null} />
            </>
          )}
        </Section>

        {/* Refacciones */}
        <Section icon={Package} title={`Refacciones (${wo.parts.length})`} right={<strong style={{ fontSize: '13px' }}>{money(wo.partsCost)}</strong>}>
          {wo.parts.length === 0 && <Empty text="No se han registrado refacciones." />}
          {wo.parts.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px' }}>
              <span>{p.sparePart?.code} · {p.sparePart?.name} — {Number(p.quantity)} {p.sparePart?.unit || 'pza'}</span>
              <strong>{money(Number(p.quantity) * Number(p.costPerUnitAtTime))}</strong>
            </div>
          ))}
          {perms.canExecute && (
            <form onSubmit={consumePart} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--mt-border)', paddingTop: 'var(--mt-space-md)' }}>
              <select value={consume.sparePartId} onChange={(e) => setConsume({ ...consume, sparePartId: e.target.value })} style={{ ...inputStyle, flex: 2, minWidth: '180px' }}>
                <option value="">— Refacción —</option>
                {spareParts.map((s) => (
                  <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
                ))}
              </select>
              <input type="number" min="0" step="any" placeholder="Cant." value={consume.quantity} onChange={(e) => setConsume({ ...consume, quantity: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: '90px' }} />
              <MtButton type="submit" size="sm" disabled={busy}>Registrar</MtButton>
            </form>
          )}
        </Section>

        {/* Falla */}
        {(wo.type === 'CORRECTIVE' || wo.failure) && (
          <Section icon={AlertTriangle} title="Clasificación de la falla">
            {perms.canEditFailure && wo.asset ? (
              <form onSubmit={saveFailure} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                {[
                  ['failureModeId', 'Modo de falla', 'FAILURE_MODE'],
                  ['mechanismId', 'Mecanismo', 'MECHANISM'],
                  ['rootCauseId', 'Causa raíz', 'ROOT_CAUSE'],
                ].map(([field, label, category]) => (
                  <Field key={field} label={label}>
                    <select value={failureForm[field]} onChange={(e) => setFailureForm({ ...failureForm, [field]: e.target.value })} style={inputStyle}>
                      <option value="">— Sin especificar —</option>
                      {(failureCodes[category] || []).map((c) => (
                        <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                      ))}
                    </select>
                  </Field>
                ))}
                <Field label="Efecto en producción">
                  <select value={failureForm.productionEffect} onChange={(e) => setFailureForm({ ...failureForm, productionEffect: e.target.value })} style={inputStyle}>
                    {PRODUCTION_EFFECTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Field>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <MtButton type="submit" size="sm" disabled={busy}>Guardar clasificación</MtButton>
                </div>
              </form>
            ) : wo.failure ? (
              <>
                <Info label="Modo de falla" value={wo.failure.failureMode && `${wo.failure.failureMode.code} · ${wo.failure.failureMode.name}`} />
                <Info label="Mecanismo" value={wo.failure.mechanism && `${wo.failure.mechanism.code} · ${wo.failure.mechanism.name}`} />
                <Info label="Causa raíz" value={wo.failure.rootCause && `${wo.failure.rootCause.code} · ${wo.failure.rootCause.name}`} />
                <Info label="Efecto en producción" value={PRODUCTION_EFFECTS.find((p) => p.value === wo.failure.productionEffect)?.label} />
              </>
            ) : (
              <Empty text={wo.asset ? 'Sin clasificar.' : 'La orden no tiene activo: no se puede clasificar la falla.'} />
            )}
          </Section>
        )}

        {/* Fotos */}
        <Section icon={Camera} title={`Fotos (${photos.length})`}>
          {photos.length === 0 && <Empty text="Sin fotografías." />}
          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
              {photos.map((p) => (
                <div key={p.id} style={{ position: 'relative', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-md)', overflow: 'hidden' }}>
                  <a href={p.url} target="_blank" rel="noreferrer">
                    <img src={p.url} alt={`Foto ${p.kind}`} loading="lazy" style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                  </a>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', fontSize: '11px' }}>
                    <span>{p.kind === 'BEFORE' ? 'Antes' : p.kind === 'AFTER' ? 'Después' : 'Otra'}</span>
                    <button onClick={() => deletePhoto(p)} aria-label="Eliminar foto" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mt-danger)', padding: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isOpen && <PhotoCapture workOrderId={wo.id} maintenanceApi={maintenanceApi} onPhotoAdded={() => load()} />}
        </Section>

        {/* Historial */}
        <Section icon={History} title="Bitácora e historial">
          {perms.canComment && (
            <form onSubmit={addNote} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <textarea rows={2} placeholder="Agrega un comentario u observación de la orden..." value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <MtButton type="submit" size="sm" disabled={busy || !note.trim()} aria-label="Agregar comentario"><Send size={14} /></MtButton>
            </form>
          )}
          {events.length === 0 && <Empty text="Sin movimientos registrados." />}
          {[...events].reverse().map((ev) => {
            const isComment = ev.metadata?.kind === 'COMMENT';
            return (
              <div key={ev.id} style={{ borderLeft: `2px solid ${isComment ? 'var(--mt-warning)' : 'var(--mt-accent)'}`, paddingLeft: 'var(--mt-space-md)', fontSize: '13px' }}>
                <div style={{ fontWeight: 'var(--mt-font-weight-bold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isComment ? (
                    <><MessageSquare size={13} /> Comentario</>
                  ) : (
                    <>
                      {ev.fromStatus ? `${STATE_LABELS[ev.fromStatus] || ev.fromStatus} → ` : ''}{STATE_LABELS[ev.toStatus] || ev.toStatus}
                      {ev.metadata?.assignedToName && ` (${ev.metadata.assignedToName})`}
                    </>
                  )}
                </div>
                <div style={{ color: 'var(--mt-text-tertiary)', fontSize: '12px' }}>
                  {fmtDateTime(ev.createdAt)} · {ev.user?.name || 'Sistema'}
                  {ev.metadata?.onBehalfOfName && ` · en nombre de ${ev.metadata.onBehalfOfName}`}
                  {ev.metadata?.realFinishedAt && ` · término real ${fmtDateTime(ev.metadata.realFinishedAt)}`}
                </div>
                {ev.comment && <div style={{ color: 'var(--mt-text-secondary)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{ev.comment}</div>}
              </div>
            );
          })}
        </Section>
      </div>
    </div>
  );
}
