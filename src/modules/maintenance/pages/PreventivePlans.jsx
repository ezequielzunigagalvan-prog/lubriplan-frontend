import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtButton, MtCard, MtBadge, MtSkeleton } from '../ui';
import {
  Plus, Trash2, Edit2, Eye, AlertCircle, Power, Search, PlayCircle, Zap, Wrench, ArrowRight
} from 'lucide-react';
import { STATE_LABELS } from '../constants/maintenance';
import { toast } from 'sonner';
import { maintenanceApi } from '../services/maintenanceApi';
import PlanRoadmapModal from '../components/PlanRoadmapModal';
import PlanFormModal from '../components/PlanFormModal';
import '../ui/tokens.css';

const FREQUENCY_UNIT_LABELS = {
  DAY: 'día(s)',
  WEEK: 'semana(s)',
  MONTH: 'mes(es)',
  YEAR: 'año(s)',
};

const PRIORITY_LABELS = {
  CRITICAL: { label: 'Crítico', color: 'var(--mt-danger)' },
  HIGH: { label: 'Alto', color: 'var(--mt-warning)' },
  MEDIUM: { label: 'Medio', color: 'var(--mt-info)' },
  LOW: { label: 'Bajo', color: 'var(--mt-success)' },
};

const DECISION_LABELS = {
  GENERATED: 'OT generada',
  WOULD_GENERATE: 'Se generaría OT',
  SKIPPED_NOT_DUE: 'Aún no vence',
  SKIPPED_OPEN: 'Tiene una OT abierta',
  SKIPPED_DUPLICATE: 'La OT de este ciclo ya existe',
  SKIPPED_INACTIVE: 'Plan pausado',
  SKIPPED_NOT_SCHEDULABLE: 'Sin programación por tiempo',
  ERROR: 'Error',
};

const errorMessage = (err, fallback) => err?.data?.error || err?.message || fallback;

/**
 * Sincroniza técnicos y refacciones del plan con lo elegido en el formulario,
 * aplicando solo las diferencias. Devuelve la lista de errores (si hubo).
 */
async function syncAssignments(planId, previous, planData) {
  const failures = [];
  const run = async (label, fn) => {
    try {
      await fn();
    } catch (err) {
      failures.push(`${label}: ${errorMessage(err, 'error')}`);
    }
  };

  const prevTechIds = new Set((previous?.technicians || []).map((t) => t.technicianId));
  const nextTechIds = new Set(planData.assignedTechnicians || []);
  for (const id of prevTechIds) {
    if (!nextTechIds.has(id)) await run(`Quitar técnico ${id}`, () => maintenanceApi.removeTechnicianFromPlan(planId, id));
  }
  for (const id of nextTechIds) {
    if (!prevTechIds.has(id)) {
      await run(`Asignar técnico ${id}`, () => maintenanceApi.addTechnicianToPlan(planId, { technicianId: id, role: 'EXECUTOR' }));
    }
  }

  const prevParts = new Map((previous?.spareParts || []).map((p) => [p.sparePartId, Number(p.quantityRequired)]));
  const nextParts = new Map((planData.assignedSpareParts || []).map((p) => [p.id, Number(p.quantity) || 1]));
  for (const id of prevParts.keys()) {
    if (!nextParts.has(id)) await run(`Quitar refacción ${id}`, () => maintenanceApi.removeSparePartFromPlan(planId, id));
  }
  for (const [id, qty] of nextParts) {
    if (prevParts.get(id) !== qty) {
      // El endpoint hace upsert: sirve para agregar o para actualizar la cantidad
      await run(`Asignar refacción ${id}`, () => maintenanceApi.addSparePartToPlan(planId, { sparePartId: id, quantityRequired: qty }));
    }
  }

  return failures;
}

const woNumber = (n) => `OT-${String(n ?? '').padStart(5, '0')}`;

/**
 * Texto del vencimiento de la tarjeta.
 * Mientras el ciclo tiene una OT abierta, la tarjeta muestra esa OT (y su atraso) hasta que se termine;
 * al terminarla desaparece y queda la siguiente fecha del plan.
 */
function dueInfo(plan) {
  if (!plan.active) return { text: 'Pausado', color: 'var(--mt-text-tertiary)' };
  const fmt = (d) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  const next = plan.nextDueAt ? `Siguiente: ${fmt(plan.nextDueAt)}` : null;
  const wo = plan.openWorkOrder;
  if (wo) {
    if (wo.overdue) {
      return { text: `Atrasado ${wo.daysOverdue} día${wo.daysOverdue === 1 ? '' : 's'}`, sub: `${woNumber(wo.number)} pendiente${wo.dueAt ? ` · vencía el ${fmt(wo.dueAt)}` : ''}`, color: 'var(--mt-danger)', late: true };
    }
    return { text: `En curso: ${woNumber(wo.number)}`, sub: wo.dueAt ? `Para el ${fmt(wo.dueAt)}` : next, color: 'var(--mt-accent)' };
  }
  if (!plan.nextDueAt) return { text: 'Sin calcular', color: 'var(--mt-text-primary)' };
  if (plan.daysOverdue > 0) {
    return { text: `Atrasado ${plan.daysOverdue} día${plan.daysOverdue === 1 ? '' : 's'}`, sub: `Vencía el ${fmt(plan.nextDueAt)}`, color: 'var(--mt-danger)', late: true };
  }
  if (plan.dueToday) return { text: 'Vence hoy', sub: fmt(plan.nextDueAt), color: 'var(--mt-warning)', dueNow: true };
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d = new Date(plan.nextDueAt);
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - startToday) / 86400000);
  return { text: d.toLocaleDateString('es-MX'), sub: `En ${days} día${days === 1 ? '' : 's'}`, color: 'var(--mt-text-primary)', upToDate: true };
}

/** Estado general de la tarjeta (chip superior). */
function planStatus(plan, due) {
  if (!plan.active) return { label: 'Pausado', bg: 'rgba(107,114,128,0.12)', fg: 'var(--mt-text-tertiary)' };
  if (due.late) return { label: 'Atrasado', bg: 'rgba(239,68,68,0.12)', fg: 'var(--mt-danger)' };
  if (plan.openWorkOrder) return { label: 'En ejecución', bg: 'rgba(56,189,248,0.12)', fg: 'var(--mt-accent)' };
  if (due.dueNow) return { label: 'Vence hoy', bg: 'rgba(245,158,11,0.14)', fg: 'var(--mt-warning)' };
  return { label: plan.lastCompletedAt ? '✓ Al día' : 'Programado', bg: 'rgba(34,197,94,0.12)', fg: 'var(--mt-success)' };
}

export default function PreventivePlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const [busyPlanId, setBusyPlanId] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [upcomingPlans, setUpcomingPlans] = useState([]);

  const loadPlans = useCallback(async () => {
    try {
      // "Vencidos" se calcula de cada tarjeta (ciclo sin OT atrasado u OT del ciclo atrasada)
      const [response, upcoming] = await Promise.all([
        maintenanceApi.getAllPlans({ limit: 200 }),
        maintenanceApi.getUpcomingPlans(7),
      ]);
      setPlans(response?.data || []);
      setUpcomingPlans(upcoming || []);
    } catch (err) {
      console.error('[PreventivePlans] Error cargando planes:', err);
      toast.error(errorMessage(err, 'Error cargando planes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();

    // Catálogos para el formulario
    maintenanceApi.getAssets({ limit: 500 }).then((r) => setAssets(r?.data || [])).catch(() => setAssets([]));
    maintenanceApi.getTechnicians({ limit: 500 }).then((r) => setTechnicians(r?.data || r || [])).catch(() => setTechnicians([]));
    maintenanceApi
      .getSpareParts({ take: 500 })
      .then((r) => setSpareParts(Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : []))
      .catch(() => setSpareParts([]));
  }, [loadPlans]);

  const resetForm = () => setEditingPlan(null);

  const handleSavePlan = async (planData) => {
    // Técnicos y refacciones se guardan con sus propios endpoints; el código lo asigna el servidor
    const { assignedTechnicians: _t, assignedSpareParts: _s, code: _c, ...payload } = planData;
    const saved = editingPlan?.id
      ? await maintenanceApi.updatePlan(editingPlan.id, payload)
      : await maintenanceApi.createPlan(payload);

    if (!saved?.id) throw new Error('El servidor no devolvió el plan guardado');

    const failures = await syncAssignments(saved.id, editingPlan, planData);
    if (failures.length > 0) {
      toast.warning(`Plan guardado, pero hubo problemas con técnicos/refacciones: ${failures.join(' · ')}`);
    }
    await loadPlans();
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`¿Eliminar el plan ${plan.code} · ${plan.title}? Ya no generará órdenes.`)) return;

    try {
      await maintenanceApi.deletePlan(plan.id);
      toast.success('Plan eliminado');
      loadPlans();
    } catch (err) {
      toast.error(errorMessage(err, 'Error al eliminar plan'));
    }
  };

  const handleTogglePlan = async (plan) => {
    try {
      setBusyPlanId(plan.id);
      if (plan.active) {
        await maintenanceApi.pausePlan(plan.id);
        toast.success('Plan pausado: no generará órdenes hasta reanudarlo');
      } else {
        await maintenanceApi.resumePlan(plan.id);
        toast.success('Plan reanudado: la programación sigue desde hoy');
      }
      await loadPlans();
    } catch (err) {
      toast.error(errorMessage(err, 'Error actualizando plan'));
    } finally {
      setBusyPlanId(null);
    }
  };

  // Ejecutar: abre la OT abierta del plan o, si no hay, la genera y la abre
  const handleExecute = async (plan) => {
    if (plan.openWorkOrder) {
      navigate(`/maintenance/app/work-orders/${plan.openWorkOrder.id}`);
      return;
    }
    const due = plan.daysOverdue > 0 || plan.dueToday;
    const msg = due
      ? `¿Generar la orden del ciclo vencido de ${plan.code} y abrirla para ejecutarla? Al terminarla, el plan pasa a su siguiente fecha.`
      : `${plan.code} aún no vence. ¿Generar una orden adelantada y abrirla? Su próxima fecha programada no cambia.`;
    if (!window.confirm(msg)) return;
    try {
      setBusyPlanId(plan.id);
      const result = await maintenanceApi.executePlan(plan.id);
      const wo = result?.workOrder;
      toast.success(result?.existing ? `${plan.code} ya tenía abierta la ${woNumber(wo?.number)}` : `${woNumber(wo?.number)} generada desde ${plan.code}`);
      if (wo?.id) navigate(`/maintenance/app/work-orders/${wo.id}`);
      else await loadPlans();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo generar la orden'));
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleGenerateNow = async (plan) => {
    if (!window.confirm(`¿Generar ahora una orden de trabajo del plan ${plan.code}? Si el plan ya venció, la orden cubre ese ciclo; si no, es una orden adelantada.`)) return;
    try {
      setBusyPlanId(plan.id);
      const result = await maintenanceApi.executePlan(plan.id);
      toast.success(result?.existing ? `${plan.code} ya tenía abierta la ${woNumber(result?.workOrder?.number)}` : `${woNumber(result?.workOrder?.number)} generada desde ${plan.code}`);
      await loadPlans();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo generar la orden'));
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleLaunchDue = async () => {
    try {
      setLaunching(true);
      const summary = await maintenanceApi.launchPreventives();
      const details = (summary?.results || [])
        .filter((r) => r.decision !== 'SKIPPED_NOT_DUE')
        .map((r) => `${r.planCode}: ${DECISION_LABELS[r.decision] || r.decision}${r.workOrderNumber ? ` (OT #${r.workOrderNumber})` : ''}`);
      if (summary?.generated > 0) {
        toast.success(`${summary.generated} orden(es) preventiva(s) generada(s)`, { description: details.join(' · ') });
      } else {
        toast.info('No hay planes vencidos por generar', { description: details.join(' · ') || undefined });
      }
      if (summary?.errors > 0) toast.error(`${summary.errors} plan(es) con error al generar`);
      await loadPlans();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudieron generar las órdenes'));
    } finally {
      setLaunching(false);
    }
  };

  const handleEditPlan = async (plan) => {
    // La lista no trae tareas, técnicos ni refacciones: se carga el plan completo para no perderlos al guardar
    try {
      setBusyPlanId(plan.id);
      const full = await maintenanceApi.getPlan(plan.id);
      setEditingPlan(full);
      setShowForm(true);
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo cargar el plan'));
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleViewRoadmap = (plan) => {
    setSelectedPlan(plan);
    setShowRoadmap(true);
  };

  const filteredPlans = plans.filter(plan => {
    const term = search.trim().toLowerCase();
    const matchesFilter = filter === 'all' || (filter === 'active' && plan.active) || (filter === 'inactive' && !plan.active);
    const matchesSearch =
      !term ||
      plan.title?.toLowerCase().includes(term) ||
      plan.code?.toLowerCase().includes(term) ||
      plan.asset?.code?.toLowerCase().includes(term) ||
      plan.asset?.name?.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const activeCount = plans.filter(p => p.active).length;
  const totalCount = plans.length;

  if (loading) return <MtSkeleton type="card" count={3} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Planes de Mantenimiento Preventivo
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Programación automática y gestión de mantenimiento preventivo
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
          <MtButton variant="secondary" onClick={handleLaunchDue} disabled={launching}>
            <Zap size={18} />
            {launching ? 'Generando...' : 'Generar OTs vencidas'}
          </MtButton>
          <MtButton
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={20} />
            Nuevo Plan
          </MtButton>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              Total Planes
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-accent)' }}>
              {totalCount}
            </div>
          </div>
        </MtCard>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              Activos
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-success)' }}>
              {activeCount}
            </div>
          </div>
        </MtCard>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              Vencidos
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-danger)' }}>
              {plans.filter((p) => p.active && dueInfo(p).late).length}
            </div>
          </div>
        </MtCard>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              Próximos (7 días)
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-warning)' }}>
              {upcomingPlans.length}
            </div>
          </div>
        </MtCard>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--mt-text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Buscar planes, equipos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: 'var(--mt-radius-md)',
              fontSize: '14px',
              border: '1px solid var(--mt-border)',
              background: 'var(--mt-bg-surface)',
              color: 'var(--mt-text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', flexWrap: 'wrap' }}>
          {['all', 'active', 'inactive'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--mt-radius-full)',
                fontWeight: '600',
                fontSize: '13px',
                border: filter === status ? '2px solid var(--mt-accent)' : '1px solid var(--mt-border)',
                cursor: 'pointer',
                background: filter === status ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                color: filter === status ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
              }}
            >
              {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <MtCard elevated>
          <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
            <AlertCircle size={48} style={{ color: 'var(--mt-accent)', marginBottom: 'var(--mt-space-md)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
              Sin planes
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              {search ? 'No coinciden con tu búsqueda' : 'Crea tu primer plan de mantenimiento preventivo'}
            </p>
            {!search && (
              <MtButton
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                Crear Plan
              </MtButton>
            )}
          </div>
        </MtCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(380px, 100%), 1fr))', gap: 'var(--mt-space-lg)' }}>
          {filteredPlans.map((plan) => (
            <MtCard
              key={plan.id}
              elevated
              style={{
                borderLeft: !plan.active ? '4px solid var(--mt-text-tertiary)' : dueInfo(plan).late ? '4px solid var(--mt-danger)' : '4px solid var(--mt-success)',
              }}
            >
              <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--mt-space-sm)' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                      {plan.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {plan.code}
                      {plan.asset && ` · ${plan.asset.code} ${plan.asset.name}`}
                    </p>
                  </div>
                  {(() => {
                    const st = planStatus(plan, dueInfo(plan));
                    return (
                      <span style={{ padding: '4px 10px', borderRadius: '999px', background: st.bg, color: st.fg, fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {st.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)', fontSize: '12px' }}>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Frecuencia
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                      {plan.triggerType === 'TIME' && plan.frequencyUnit
                        ? `Cada ${plan.frequencyEvery} ${FREQUENCY_UNIT_LABELS[plan.frequencyUnit] || plan.frequencyUnit}`
                        : 'Por contador'}
                      {plan.triggerType === 'TIME' && (plan.scheduleMode === 'FLOATING' ? ' (desde la última realización)' : ' (fecha fija)')}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Prioridad
                    </div>
                    <div style={{ fontWeight: '700', color: PRIORITY_LABELS[plan.priority]?.color || 'var(--mt-text-primary)' }}>
                      {PRIORITY_LABELS[plan.priority]?.label}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Próximo Vencimiento
                    </div>
                    {(() => {
                      const due = dueInfo(plan);
                      return (
                        <>
                          <div style={{ fontWeight: '800', color: due.color }}>{due.text}</div>
                          {due.sub && <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>{due.sub}</div>}
                      {plan.openWorkOrder && plan.nextDueAt && (
                        <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>Siguiente ciclo: {new Date(plan.nextDueAt).toLocaleDateString('es-MX')}</div>
                      )}
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Última Realización
                    </div>
                    <div style={{ fontWeight: '700', color: plan.lastCompletedAt ? 'var(--mt-success)' : 'var(--mt-text-primary)' }}>
                      {plan.lastCompletedAt ? `✓ ${new Date(plan.lastCompletedAt).toLocaleDateString('es-MX')}` : 'Nunca'}
                    </div>
                  </div>
                </div>

                {plan.description && (
                  <div style={{ padding: '8px', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-sm)', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                    {plan.description}
                  </div>
                )}

                {/* Ejecutar */}
                {plan.active && (
                  <button
                    onClick={() => handleExecute(plan)}
                    disabled={busyPlanId === plan.id}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: dueInfo(plan).late ? 'var(--mt-danger)' : dueInfo(plan).upToDate && !plan.openWorkOrder ? 'transparent' : 'var(--mt-accent)',
                      border: dueInfo(plan).upToDate && !plan.openWorkOrder ? '1px dashed var(--mt-border)' : 'none',
                      borderRadius: 'var(--mt-radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: dueInfo(plan).upToDate && !plan.openWorkOrder ? 'var(--mt-text-secondary)' : '#fff',
                    }}
                  >
                    <Wrench size={15} />
                    {plan.openWorkOrder
                      ? `Ejecutar ${woNumber(plan.openWorkOrder.number)} · ${STATE_LABELS[plan.openWorkOrder.status] || plan.openWorkOrder.status}`
                      : dueInfo(plan).upToDate
                        ? 'Adelantar ejecución (opcional)'
                        : 'Ejecutar (generar orden)'}
                    <ArrowRight size={15} />
                  </button>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', borderTop: '1px solid var(--mt-border)', paddingTop: 'var(--mt-space-md)' }}>
                  <button
                    onClick={() => handleViewRoadmap(plan)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid var(--mt-accent)',
                      borderRadius: 'var(--mt-radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--mt-accent)',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <Eye size={14} />
                    Hoja de Ruta
                  </button>
                  <button
                    onClick={() => handleEditPlan(plan)}
                    disabled={busyPlanId === plan.id}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'transparent',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--mt-text-secondary)',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleTogglePlan(plan)}
                    disabled={busyPlanId === plan.id}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: plan.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      border: 'none',
                      borderRadius: 'var(--mt-radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: plan.active ? 'var(--mt-success)' : 'var(--mt-text-tertiary)',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <Power size={14} />
                    {plan.active ? 'Pausar' : 'Reanudar'}
                  </button>
                  {plan.active && (
                    <button
                      onClick={() => handleGenerateNow(plan)}
                      disabled={busyPlanId === plan.id}
                      title="Generar una OT de este plan ahora"
                      aria-label="Generar OT ahora"
                      style={{
                        width: '40px',
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--mt-accent)',
                      }}
                    >
                      <PlayCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePlan(plan)}
                    title="Eliminar plan"
                    aria-label="Eliminar plan"
                    style={{
                      width: '40px',
                      padding: '8px',
                      background: 'transparent',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--mt-danger)',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </MtCard>
          ))}
        </div>
      )}

      {/* Form Modal - Componente Professional */}
      <PlanFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        plan={editingPlan}
        onSave={handleSavePlan}
        assets={assets}
        technicians={technicians}
        spareParts={spareParts}
      />

      {/* Roadmap Modal */}
      <PlanRoadmapModal isOpen={showRoadmap} onClose={() => setShowRoadmap(false)} plan={selectedPlan} />
    </div>
  );
}
