import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtButton, MtCard, MtBadge, MtSkeleton } from '../ui';
import {
  Plus, Trash2, Edit2, Eye, CheckCircle2, Clock, AlertCircle, Power,
  RotateCw, Search, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { maintenanceApi } from '../services/maintenanceApi';
import PlanRoadmapModal from '../components/PlanRoadmapModal';
import '../ui/tokens.css';

const FREQUENCY_UNIT_LABELS = {
  DAY: 'Diariamente',
  WEEK: 'Semanalmente',
  MONTH: 'Mensualmente',
  YEAR: 'Anualmente',
};

const PRIORITY_LABELS = {
  CRITICAL: { label: 'Crítico', color: 'var(--mt-danger)' },
  HIGH: { label: 'Alto', color: 'var(--mt-warning)' },
  MEDIUM: { label: 'Medio', color: 'var(--mt-info)' },
  LOW: { label: 'Bajo', color: 'var(--mt-success)' },
};

export default function PreventivePlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [overduePlans, setOverduePlans] = useState([]);
  const [upcomingPlans, setUpcomingPlans] = useState([]);

  const [formData, setFormData] = useState({
    assetId: '',
    code: '',
    title: '',
    description: '',
    type: 'PREVENTIVE',
    triggerType: 'TIME',
    frequencyUnit: 'MONTH',
    frequencyEvery: '1',
    scheduleMode: 'FIXED',
    anchorDate: '',
    leadDays: '0',
    graceDays: '0',
    priority: 'MEDIUM',
    estimatedMinutes: '',
    defaultAssigneeId: '',
    skipIfOpen: true,
    tasks: [],
    selectedSpareParts: [],
  });

  useEffect(() => {
    loadPlans();
    loadAssets();
    loadTechnicians();
    loadSpareParts();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await maintenanceApi.getAllPlans({ limit: 100 });
      setPlans(response?.data || []);

      const overdue = await maintenanceApi.getOverduePlans();
      setOverduePlans(overdue || []);

      const upcoming = await maintenanceApi.getUpcomingPlans(7);
      setUpcomingPlans(upcoming || []);
    } catch (err) {
      console.error('Error cargando planes:', err);
      toast.error('Error cargando planes');
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const response = await maintenanceApi.getAssets({ limit: 500 });
      setAssets(response?.data || []);
    } catch (err) {
      console.error('Error cargando activos:', err);
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await maintenanceApi.getTechnicians({ limit: 500 });
      setTechnicians(response?.data || response || []);
    } catch (err) {
      console.error('Error cargando técnicos:', err);
    }
  };

  const loadSpareParts = async () => {
    try {
      setLoadingData(true);
      const response = await maintenanceApi.getSpareParts({ limit: 500 });
      setSpareParts(response?.data || response || []);
    } catch (err) {
      console.error('Error cargando refacciones:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      assetId: '',
      code: '',
      title: '',
      description: '',
      type: 'PREVENTIVE',
      triggerType: 'TIME',
      frequencyUnit: 'MONTH',
      frequencyEvery: '1',
      scheduleMode: 'FIXED',
      anchorDate: '',
      leadDays: '0',
      graceDays: '0',
      priority: 'MEDIUM',
      estimatedMinutes: '',
      defaultAssigneeId: '',
      skipIfOpen: true,
      tasks: [],
      selectedSpareParts: [],
    });
    setEditingPlan(null);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!formData.assetId || !formData.title) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      const planData = {
        assetId: parseInt(formData.assetId),
        code: formData.code,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        triggerType: formData.triggerType,
        frequencyUnit: formData.frequencyUnit,
        frequencyEvery: parseInt(formData.frequencyEvery) || 1,
        scheduleMode: formData.scheduleMode,
        anchorDate: formData.anchorDate,
        leadDays: parseInt(formData.leadDays) || 0,
        graceDays: parseInt(formData.graceDays) || 0,
        priority: formData.priority,
        estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : undefined,
        defaultAssigneeId: formData.defaultAssigneeId ? parseInt(formData.defaultAssigneeId) : undefined,
        skipIfOpen: formData.skipIfOpen,
        tasks: formData.tasks,
      };

      if (editingPlan) {
        await maintenanceApi.updatePlan(editingPlan.id, planData);
        toast.success('Plan actualizado');
      } else {
        await maintenanceApi.createPlan(planData);
        toast.success('Plan creado exitosamente');
      }

      setShowForm(false);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Error guardando plan:', error);
      toast.error(error?.message || 'Error guardando plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este plan?')) return;

    try {
      await maintenanceApi.deletePlan(id);
      toast.success('Plan eliminado');
      loadPlans();
    } catch (error) {
      toast.error('Error al eliminar plan');
    }
  };

  const handleTogglePlan = async (id, isActive) => {
    try {
      if (isActive) {
        await maintenanceApi.updatePlan(id, { active: false });
        toast.success('Plan pausado');
      } else {
        await maintenanceApi.updatePlan(id, { active: true });
        toast.success('Plan reanudado');
      }
      loadPlans();
    } catch (error) {
      toast.error('Error actualizando plan');
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setFormData({
      assetId: plan.assetId?.toString() || '',
      code: plan.code || '',
      title: plan.title || '',
      description: plan.description || '',
      type: plan.type || 'PREVENTIVE',
      triggerType: plan.triggerType || 'TIME',
      frequencyUnit: plan.frequencyUnit || 'MONTH',
      frequencyEvery: (plan.frequencyEvery || 1).toString(),
      scheduleMode: plan.scheduleMode || 'FIXED',
      anchorDate: plan.anchorDate ? new Date(plan.anchorDate).toISOString().split('T')[0] : '',
      leadDays: (plan.leadDays || 0).toString(),
      graceDays: (plan.graceDays || 0).toString(),
      priority: plan.priority || 'MEDIUM',
      estimatedMinutes: (plan.estimatedMinutes || '').toString(),
      defaultAssigneeId: (plan.defaultAssigneeId || '').toString(),
      skipIfOpen: plan.skipIfOpen ?? true,
      tasks: plan.tasks || [],
      selectedSpareParts: [],
    });
    setShowForm(true);
  };

  const handleViewRoadmap = (plan) => {
    setSelectedPlan(plan);
    setShowRoadmap(true);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesFilter = filter === 'all' || (filter === 'active' && plan.active) || (filter === 'inactive' && !plan.active);
    const matchesSearch =
      plan.title?.toLowerCase().includes(search.toLowerCase()) ||
      plan.code?.toLowerCase().includes(search.toLowerCase());
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
              {overduePlans.length}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          {filteredPlans.map((plan) => (
            <MtCard
              key={plan.id}
              elevated
              style={{
                borderLeft: plan.active ? '4px solid var(--mt-success)' : '4px solid var(--mt-text-tertiary)',
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
                    </p>
                  </div>
                  <MtBadge variant={plan.active ? 'success' : 'default'} size="sm">
                    {plan.active ? 'Activo' : 'Inactivo'}
                  </MtBadge>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)', fontSize: '12px' }}>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Frecuencia
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                      Cada {plan.frequencyEvery} {FREQUENCY_UNIT_LABELS[plan.frequencyUnit] || plan.frequencyUnit}
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
                    <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                      {plan.nextDueAt ? new Date(plan.nextDueAt).toLocaleDateString('es-MX') : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Última Ejecución
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                      {plan.lastCompletedAt ? new Date(plan.lastCompletedAt).toLocaleDateString('es-MX') : 'Nunca'}
                    </div>
                  </div>
                </div>

                {plan.description && (
                  <div style={{ padding: '8px', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-sm)', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                    {plan.description}
                  </div>
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
                    onClick={() => handleTogglePlan(plan.id, plan.active)}
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
                    {plan.active ? 'Pausar' : 'Reanud.'}
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
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

      {/* Form Modal */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--mt-space-lg)',
          }}
          onClick={() => setShowForm(false)}
        >
          <MtCard
            elevated
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: 'var(--mt-space-2xl)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-lg)', color: 'var(--mt-text-primary)' }}>
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan de Mantenimiento'}
              </h2>

              <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
                {/* Asset Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Equipo *
                  </label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => setFormData(prev => ({ ...prev, assetId: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-surface)',
                      color: 'var(--mt-text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Selecciona un equipo --</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Título del Plan *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Mantenimiento preventivo de motor"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-surface)',
                      color: 'var(--mt-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Frequency Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                      Cada (cantidad)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.frequencyEvery}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequencyEvery: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'var(--mt-space-md)',
                        fontSize: '14px',
                        border: '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        background: 'var(--mt-bg-surface)',
                        color: 'var(--mt-text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                      Unidad de tiempo
                    </label>
                    <select
                      value={formData.frequencyUnit}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequencyUnit: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'var(--mt-space-md)',
                        fontSize: '14px',
                        border: '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        background: 'var(--mt-bg-surface)',
                        color: 'var(--mt-text-primary)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {Object.entries(FREQUENCY_UNIT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-surface)',
                      color: 'var(--mt-text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {Object.entries(PRIORITY_LABELS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Anchor Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.anchorDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, anchorDate: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-surface)',
                      color: 'var(--mt-text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Descripción (opcional)
                  </label>
                  <textarea
                    placeholder="Detalles del plan..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-surface)',
                      color: 'var(--mt-text-primary)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 'var(--mt-space-md)', marginTop: 'var(--mt-space-lg)' }}>
                  <MtButton
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    style={{ flex: 1 }}
                    disabled={submitting}
                  >
                    Cancelar
                  </MtButton>
                  <MtButton
                    type="submit"
                    style={{ flex: 1 }}
                    disabled={submitting}
                  >
                    {submitting ? 'Guardando...' : 'Guardar Plan'}
                  </MtButton>
                </div>
              </form>
            </div>
          </MtCard>
        </div>
      )}

      {/* Roadmap Modal */}
      <PlanRoadmapModal isOpen={showRoadmap} onClose={() => setShowRoadmap(false)} plan={selectedPlan} />
    </div>
  );
}
