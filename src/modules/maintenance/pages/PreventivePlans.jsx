import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtButton, MtCard, MtBadge, MtEmpty, MtSkeleton, MtInput } from '../ui';
import {
  Plus, Calendar, Trash2, Edit2, Eye, CheckCircle2, Clock, AlertCircle, Power,
  RotateCw, Filter, Search
} from 'lucide-react';
import { toast } from 'sonner';
import '../ui/tokens.css';

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Diario' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'SEMIANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
];

const MOCK_ASSETS = [
  { id: 1, name: 'Motor eléctrico principal', code: 'EQ-001' },
  { id: 2, name: 'Reductor', code: 'EQ-002' },
  { id: 3, name: 'Bomba centrífuga', code: 'EQ-003' },
  { id: 4, name: 'Compresor', code: 'EQ-004' },
  { id: 5, name: 'Transportador', code: 'EQ-005' },
];

const MOCK_TECHNICIANS = [
  { id: 1, name: 'Juan Pérez', speciality: 'Mecánica' },
  { id: 2, name: 'Carlos López', speciality: 'Eléctrica' },
  { id: 3, name: 'Roberto García', speciality: 'Hidráulica' },
  { id: 4, name: 'Miguel Torres', speciality: 'Instrumentación' },
];

// Mock data for preventive plans
const MOCK_PLANS = [
  {
    id: 1,
    name: 'Inspección general Motor',
    assetName: 'Motor eléctrico principal',
    assetCode: 'EQ-001',
    activity: 'Inspección general',
    frequency: 'MONTHLY',
    nextDate: '2025-12-15',
    lastExecution: '2025-11-15',
    status: 'active',
    assignedTo: 'Juan Pérez',
    estimatedHours: 2,
    notes: 'Verificar temperaturas y vibraciones',
  },
  {
    id: 2,
    name: 'Inspección de fugas Reductor',
    assetName: 'Reductor',
    assetCode: 'EQ-002',
    activity: 'Inspección de fugas',
    frequency: 'WEEKLY',
    nextDate: '2025-12-02',
    lastExecution: '2025-11-25',
    status: 'active',
    assignedTo: 'Carlos López',
    estimatedHours: 1,
    notes: 'Revisar nivel de aceite',
  },
  {
    id: 3,
    name: 'Revisión de sellos Bomba',
    assetName: 'Bomba centrífuga',
    assetCode: 'EQ-003',
    activity: 'Revisión de sellos',
    frequency: 'MONTHLY',
    nextDate: '2025-12-10',
    lastExecution: '2025-11-10',
    status: 'active',
    assignedTo: 'Roberto García',
    estimatedHours: 3,
    notes: 'Inspeccionar desgaste de sellos',
  },
  {
    id: 4,
    name: 'Cambio de filtros Compresor',
    assetName: 'Compresor',
    assetCode: 'EQ-004',
    activity: 'Cambio de filtros',
    frequency: 'QUARTERLY',
    nextDate: '2025-12-20',
    lastExecution: '2025-09-20',
    status: 'active',
    assignedTo: 'Miguel Torres',
    estimatedHours: 4,
    notes: 'Incluye filtro de aire y aceite',
  },
  {
    id: 5,
    name: 'Inspección mecánica Transportador',
    assetName: 'Transportador',
    assetCode: 'EQ-005',
    activity: 'Inspección mecánica',
    frequency: 'WEEKLY',
    nextDate: '2025-12-03',
    lastExecution: '2025-11-26',
    status: 'inactive',
    assignedTo: 'Juan Pérez',
    estimatedHours: 1.5,
    notes: 'Verificar cadenas y rodillos',
  },
];

export default function PreventivePlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [spareParts, setSpareParts] = useState([]);
  const [loadingSpareParts, setLoadingSpareParts] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    activity: '',
    frequency: 'MONTHLY',
    assignedTo: '',
    estimatedHours: '1',
    notes: '',
    selectedSpareParts: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(false);
        setPlans(MOCK_PLANS);
        // Cargar refacciones desde API
        await loadSpareParts();
      } catch (err) {
        toast.error('Error cargando planes');
      }
    };
    load();
  }, []);

  const loadSpareParts = async () => {
    try {
      setLoadingSpareParts(true);
      const response = await fetch('/api/maintenance/spare-parts');
      if (response.ok) {
        const data = await response.json();
        setSpareParts(data);
      }
    } catch (err) {
      console.error('Error cargando refacciones:', err);
    } finally {
      setLoadingSpareParts(false);
    }
  };

  const resetForm = () => {
    setFormData({
      assetId: '',
      activity: '',
      frequency: 'MONTHLY',
      assignedTo: '',
      estimatedHours: '1',
      notes: '',
      selectedSpareParts: [],
    });
    setEditingPlan(null);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!formData.assetId || !formData.activity || !formData.assignedTo) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      const asset = MOCK_ASSETS.find(a => a.id === parseInt(formData.assetId));
      const tech = MOCK_TECHNICIANS.find(t => t.id === parseInt(formData.assignedTo));
      const freq = FREQUENCY_OPTIONS.find(f => f.value === formData.frequency);

      const newPlan = {
        id: editingPlan?.id || Math.max(...plans.map(p => p.id), 0) + 1,
        name: `${formData.activity} ${asset?.name}`,
        assetName: asset?.name,
        assetCode: asset?.code,
        activity: formData.activity,
        frequency: formData.frequency,
        nextDate: editingPlan?.nextDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastExecution: editingPlan?.lastExecution || null,
        status: 'active',
        assignedTo: tech?.name,
        estimatedHours: parseFloat(formData.estimatedHours),
        notes: formData.notes,
      };

      if (editingPlan) {
        setPlans(plans.map(p => p.id === editingPlan.id ? newPlan : p));
        toast.success('Plan actualizado');
      } else {
        setPlans([...plans, newPlan]);
        toast.success('Plan creado exitosamente');
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error('Error guardando plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este plan?')) {
      setPlans(plans.filter(p => p.id !== id));
      toast.success('Plan eliminado');
    }
  };

  const handleTogglePlan = (id) => {
    setPlans(plans.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    const asset = MOCK_ASSETS.find(a => a.code === plan.assetCode);
    const tech = MOCK_TECHNICIANS.find(t => t.name === plan.assignedTo);
    setFormData({
      assetId: asset?.id.toString() || '',
      activity: plan.activity,
      frequency: plan.frequency,
      assignedTo: tech?.id.toString() || '',
      estimatedHours: plan.estimatedHours.toString(),
      notes: plan.notes,
    });
    setShowForm(true);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesFilter = filter === 'all' || plan.status === filter;
    const matchesSearch =
      plan.name?.toLowerCase().includes(search.toLowerCase()) ||
      plan.assetName?.toLowerCase().includes(search.toLowerCase()) ||
      plan.assetCode?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = plans.filter(p => p.status === 'active').length;
  const inactiveCount = plans.filter(p => p.status === 'inactive').length;
  const totalOrders = plans.length;

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
            Automatiza el mantenimiento periódico de tus equipos
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
              {totalOrders}
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
              Próximas en 7 días
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-warning)' }}>
              {plans.filter(p => {
                const nextDate = new Date(p.nextDate);
                const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return nextDate <= in7Days && p.status === 'active';
              }).length}
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

        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
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
            <Calendar size={48} style={{ color: 'var(--mt-accent)', marginBottom: 'var(--mt-space-md)', opacity: 0.6 }} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          {filteredPlans.map((plan) => (
            <MtCard
              key={plan.id}
              elevated
              style={{
                borderLeft: plan.status === 'active' ? '4px solid var(--mt-success)' : '4px solid var(--mt-text-tertiary)',
              }}
            >
              <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--mt-space-sm)' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                      {plan.activity}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {plan.assetName}
                    </p>
                  </div>
                  <MtBadge variant={plan.status === 'active' ? 'success' : 'default'} size="sm">
                    {plan.status === 'active' ? 'Activo' : 'Inactivo'}
                  </MtBadge>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)', fontSize: '12px' }}>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Frecuencia
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                      {FREQUENCY_OPTIONS.find(f => f.value === plan.frequency)?.label}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Horas Est.
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                      {plan.estimatedHours}h
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Próximo
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                      {new Date(plan.nextDate).toLocaleDateString('es-MX')}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Responsable
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                      {plan.assignedTo}
                    </div>
                  </div>
                </div>

                {plan.notes && (
                  <div style={{ padding: '8px', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-sm)', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                    {plan.notes}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', borderTop: '1px solid var(--mt-border)', paddingTop: 'var(--mt-space-md)' }}>
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
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--mt-bg-surface)';
                      e.target.style.borderColor = 'var(--mt-accent)';
                      e.target.style.color = 'var(--mt-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = 'var(--mt-border)';
                      e.target.style.color = 'var(--mt-text-secondary)';
                    }}
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleTogglePlan(plan.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: plan.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      border: 'none',
                      borderRadius: 'var(--mt-radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: plan.status === 'active' ? 'var(--mt-success)' : 'var(--mt-text-tertiary)',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <Power size={14} />
                    {plan.status === 'active' ? 'Desactivar' : 'Activar'}
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
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(244, 65, 82, 0.1)';
                      e.target.style.borderColor = 'var(--mt-danger)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = 'var(--mt-border)';
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
              maxWidth: '500px',
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
                    {MOCK_ASSETS.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Actividad *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Inspección general"
                    value={formData.activity}
                    onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
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

                {/* Frequency */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Frecuencia *
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
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
                    {FREQUENCY_OPTIONS.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Technician */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Responsable *
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
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
                    <option value="">-- Selecciona un técnico --</option>
                    {MOCK_TECHNICIANS.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.speciality})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Hours */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Horas Estimadas
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
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

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Notas (opcional)
                  </label>
                  <textarea
                    placeholder="Instrucciones especiales..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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

                {/* Spare Parts Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Refacciones Requeridas (opcional)
                  </label>
                  {loadingSpareParts ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: 'var(--mt-text-secondary)' }}>
                      Cargando refacciones...
                    </div>
                  ) : spareParts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: 'var(--mt-text-secondary)', fontSize: '13px' }}>
                      No hay refacciones disponibles
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                      {spareParts.map(part => (
                        <label key={part.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', background: 'var(--mt-bg-surface)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.selectedSpareParts.includes(part.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedSpareParts: [...prev.selectedSpareParts, part.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedSpareParts: prev.selectedSpareParts.filter(id => id !== part.id)
                                }));
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13px', flex: 1 }}>
                            <strong>{part.code}</strong> - {part.name}
                            <br />
                            <span style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                              Stock: {part.stock || 0} {part.unit} | ${part.costPerUnit || 0}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {formData.selectedSpareParts.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px', fontSize: '12px', color: 'var(--mt-accent)' }}>
                      ✓ {formData.selectedSpareParts.length} refacción{formData.selectedSpareParts.length !== 1 ? 'es' : ''} seleccionada{formData.selectedSpareParts.length !== 1 ? 's' : ''}
                    </div>
                  )}
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
    </div>
  );
}
