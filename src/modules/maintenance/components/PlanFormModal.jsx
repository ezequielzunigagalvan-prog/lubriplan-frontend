import { useState, useEffect } from 'react';
import { MtButton, MtCard, MtBadge } from '../ui';
import {
  Plus, X, Trash2, Edit2, Check, AlertCircle, Users, Package, CheckSquare,
  Calendar, Clock, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { maintenanceApi } from '../services/maintenanceApi';

const FREQUENCY_OPTIONS = [
  { value: 'DAY', label: 'Cada día', increment: 1 },
  { value: 'DAY', label: 'Cada 2 días', increment: 2 },
  { value: 'DAY', label: 'Cada 3 días', increment: 3 },
  { value: 'DAY', label: 'Cada 7 días', increment: 7 },
  { value: 'WEEK', label: 'Cada semana', increment: 1 },
  { value: 'WEEK', label: 'Cada 2 semanas', increment: 2 },
  { value: 'WEEK', label: 'Cada 3 semanas', increment: 3 },
  { value: 'WEEK', label: 'Cada 4 semanas', increment: 4 },
  { value: 'MONTH', label: 'Cada mes', increment: 1 },
  { value: 'MONTH', label: 'Cada 2 meses', increment: 2 },
  { value: 'MONTH', label: 'Cada 3 meses', increment: 3 },
  { value: 'MONTH', label: 'Cada 6 meses', increment: 6 },
  { value: 'YEAR', label: 'Cada año', increment: 1 },
  { value: 'YEAR', label: 'Cada 2 años', increment: 2 },
];

const PRIORITIES = [
  { value: 'CRITICAL', label: 'Crítico', color: '#f4414e' },
  { value: 'HIGH', label: 'Alto', color: '#fbbf24' },
  { value: 'MEDIUM', label: 'Medio', color: '#3b82f6' },
  { value: 'LOW', label: 'Bajo', color: '#22c55e' },
];

const TASK_TYPES = [
  { value: 'CHECK', label: 'Verificación' },
  { value: 'MEASURE', label: 'Medición' },
  { value: 'TEXT', label: 'Texto Libre' },
];

const calculateNextDate = (anchorDate, frequencyUnit, frequencyEvery) => {
  if (!anchorDate) return '';

  // Parsear fecha como YYYY-MM-DD para evitar problemas de zona horaria
  const [year, month, day] = anchorDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const unit = frequencyUnit;
  const increment = parseInt(frequencyEvery) || 1;

  switch (unit) {
    case 'DAY':
      date.setDate(date.getDate() + increment);
      break;
    case 'WEEK':
      date.setDate(date.getDate() + (increment * 7));
      break;
    case 'MONTH':
      date.setMonth(date.getMonth() + increment);
      break;
    case 'YEAR':
      date.setFullYear(date.getFullYear() + increment);
      break;
    default:
      break;
  }

  // Retornar en formato YYYY-MM-DD sin problemas de zona horaria
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function PlanFormModal({ isOpen, onClose, plan, onSave, assets = [], technicians = [], spareParts = [] }) {
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
    assignedTechnicians: [],
    assignedSpareParts: [],
  });

  const [activeTab, setActiveTab] = useState('general');
  const [editingTaskIdx, setEditingTaskIdx] = useState(null);
  const [newTask, setNewTask] = useState({
    position: 0,
    description: '',
    kind: 'CHECK',
    unit: '',
    minValue: '',
    maxValue: '',
    required: true,
  });
  const [newTechnician, setNewTechnician] = useState('');
  const [newSparePart, setNewSparePart] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && plan?.id) {
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
        assignedTechnicians: [],
        assignedSpareParts: [],
      });
    } else {
      resetForm();
    }
  }, [isOpen, plan]);

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
      assignedTechnicians: [],
      assignedSpareParts: [],
    });
    setEditingTaskIdx(null);
    setNewTask({
      position: 0,
      description: '',
      kind: 'CHECK',
      unit: '',
      minValue: '',
      maxValue: '',
      required: true,
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.assetId) newErrors.assetId = 'Equipo requerido';
    if (!formData.title) newErrors.title = 'Título requerido';
    if (!formData.anchorDate) newErrors.anchorDate = 'Fecha de inicio requerida';
    if (formData.tasks.length === 0) newErrors.tasks = 'Al menos una actividad requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTask = () => {
    if (!newTask.description.trim()) {
      toast.error('Describe la actividad');
      return;
    }

    if (editingTaskIdx !== null) {
      const updatedTasks = [...formData.tasks];
      updatedTasks[editingTaskIdx] = { ...newTask, position: editingTaskIdx };
      setFormData(prev => ({ ...prev, tasks: updatedTasks }));
      setEditingTaskIdx(null);
    } else {
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, { ...newTask, position: prev.tasks.length }]
      }));
    }

    setNewTask({
      position: 0,
      description: '',
      kind: 'CHECK',
      unit: '',
      minValue: '',
      maxValue: '',
      required: true,
    });
  };

  const handleEditTask = (idx) => {
    setNewTask({ ...formData.tasks[idx] });
    setEditingTaskIdx(idx);
  };

  const handleDeleteTask = (idx) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== idx)
    }));
    if (editingTaskIdx === idx) {
      setEditingTaskIdx(null);
      setNewTask({
        position: 0,
        description: '',
        kind: 'CHECK',
        unit: '',
        minValue: '',
        maxValue: '',
        required: true,
      });
    }
  };

  const handleAddTechnician = () => {
    if (!newTechnician) {
      toast.error('Selecciona un técnico');
      return;
    }
    if (formData.assignedTechnicians.includes(parseInt(newTechnician))) {
      toast.error('Técnico ya asignado');
      return;
    }
    setFormData(prev => ({
      ...prev,
      assignedTechnicians: [...prev.assignedTechnicians, parseInt(newTechnician)]
    }));
    setNewTechnician('');
  };

  const handleRemoveTechnician = (techId) => {
    setFormData(prev => ({
      ...prev,
      assignedTechnicians: prev.assignedTechnicians.filter(t => t !== techId)
    }));
  };

  const handleAddSparePart = () => {
    if (!newSparePart) {
      toast.error('Selecciona una refacción');
      return;
    }
    const alreadyAdded = formData.assignedSpareParts.find(s => s.id === parseInt(newSparePart));
    if (alreadyAdded) {
      toast.error('Refacción ya asignada');
      return;
    }
    setFormData(prev => ({
      ...prev,
      assignedSpareParts: [...prev.assignedSpareParts, { id: parseInt(newSparePart), quantity: 1 }]
    }));
    setNewSparePart('');
  };

  const handleRemoveSparePart = (spareId) => {
    setFormData(prev => ({
      ...prev,
      assignedSpareParts: prev.assignedSpareParts.filter(s => s.id !== spareId)
    }));
  };

  const handleUpdateSparePartQty = (spareId, qty) => {
    setFormData(prev => ({
      ...prev,
      assignedSpareParts: prev.assignedSpareParts.map(s =>
        s.id === spareId ? { ...s, quantity: parseInt(qty) || 1 } : s
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await onSave({
        ...formData,
        assetId: parseInt(formData.assetId),
        frequencyEvery: parseInt(formData.frequencyEvery) || 1,
        leadDays: parseInt(formData.leadDays) || 0,
        graceDays: parseInt(formData.graceDays) || 0,
        estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : undefined,
        defaultAssigneeId: formData.defaultAssigneeId ? parseInt(formData.defaultAssigneeId) : undefined,
      });

      toast.success(plan?.id ? 'Plan actualizado' : 'Plan creado');
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error:', err);
      toast.error(err.message || 'Error guardando plan');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--mt-space-lg)',
      }}
      onClick={onClose}
    >
      <MtCard
        elevated
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '95vh',
          overflowY: 'auto',
          background: 'var(--mt-bg-surface)',
        }}
      >
        <div style={{ padding: 'var(--mt-space-2xl)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={24} style={{ color: '#fff' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--mt-text-primary)' }}>
                  {plan?.id ? 'Editar' : 'Crear'} Plan
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                  Gestión de mantenimiento preventivo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: 'var(--mt-text-secondary)',
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-lg)', borderBottom: '2px solid var(--mt-border)', paddingBottom: 'var(--mt-space-md)', overflowX: 'auto' }}>
            {[
              { id: 'general', label: 'General', Icon: Settings },
              { id: 'actividades', label: 'Actividades', Icon: CheckSquare },
              { id: 'tecnicos', label: 'Técnicos', Icon: Users },
              { id: 'repuestos', label: 'Refacciones', Icon: Package },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab.id ? 'var(--mt-accent)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--mt-text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--mt-radius-md)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 200ms',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <tab.Icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
                {/* Equipo */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Equipo * {errors.assetId && <span style={{ color: 'var(--mt-danger)' }}>({errors.assetId})</span>}
                  </label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => setFormData(prev => ({ ...prev, assetId: e.target.value }))}
                    disabled={!!plan?.id}
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: errors.assetId ? '2px solid var(--mt-danger)' : '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-base)',
                      color: 'var(--mt-text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Selecciona un equipo --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Código y Título */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                      Código
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generado"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      disabled={!!plan?.id}
                      style={{
                        width: '100%',
                        padding: 'var(--mt-space-md)',
                        fontSize: '14px',
                        border: '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        background: 'var(--mt-bg-base)',
                        color: 'var(--mt-text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                      Título * {errors.title && <span style={{ color: 'var(--mt-danger)' }}>({errors.title})</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Mantenimiento del motor"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'var(--mt-space-md)',
                        fontSize: '14px',
                        border: errors.title ? '2px solid var(--mt-danger)' : '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        background: 'var(--mt-bg-base)',
                        color: 'var(--mt-text-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Descripción
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
                      background: 'var(--mt-bg-base)',
                      color: 'var(--mt-text-primary)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Fecha de Inicio */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Fecha de Inicio * {errors.anchorDate && <span style={{ color: 'var(--mt-danger)' }}>({errors.anchorDate})</span>}
                  </label>
                  <input
                    type="date"
                    value={formData.anchorDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, anchorDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: errors.anchorDate ? '2px solid var(--mt-danger)' : '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-base)',
                      color: 'var(--mt-text-primary)',
                      cursor: 'pointer',
                    }}
                  />
                </div>

                {/* Frecuencia de Programación */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Frecuencia de Programación Automática
                  </label>
                  <select
                    value={`${formData.frequencyUnit}-${formData.frequencyEvery}`}
                    onChange={(e) => {
                      const [unit, every] = e.target.value.split('-');
                      setFormData(prev => ({ ...prev, frequencyUnit: unit, frequencyEvery: every }));
                    }}
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-base)',
                      color: 'var(--mt-text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {FREQUENCY_OPTIONS.map((opt, idx) => (
                      <option key={idx} value={`${opt.value}-${opt.increment}`}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Próxima Fecha Calculada */}
                <div style={{ padding: 'var(--mt-space-md)', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.05))', borderRadius: 'var(--mt-radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Clock size={16} style={{ color: 'var(--mt-accent)' }} />
                    <p style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                      Próxima Programación Automática
                    </p>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-accent)', margin: 0 }}>
                    {calculateNextDate(formData.anchorDate, formData.frequencyUnit, formData.frequencyEvery)
                      ? new Date(calculateNextDate(formData.anchorDate, formData.frequencyUnit, formData.frequencyEvery)).toLocaleDateString('es-MX')
                      : 'Selecciona fecha de inicio'}
                  </p>
                </div>

                {/* Prioridad y Minutos Estimados */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
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
                        background: 'var(--mt-bg-base)',
                        color: 'var(--mt-text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                      Minutos Estimados
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="120"
                      value={formData.estimatedMinutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'var(--mt-space-md)',
                        fontSize: '14px',
                        border: '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        background: 'var(--mt-bg-base)',
                        color: 'var(--mt-text-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACTIVIDADES */}
            {activeTab === 'actividades' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
                {errors.tasks && (
                  <div style={{ padding: 'var(--mt-space-md)', background: 'rgba(244, 65, 82, 0.1)', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-danger)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--mt-danger)', margin: 0 }}>
                      Advertencia: {errors.tasks}
                    </p>
                  </div>
                )}

                {/* Agregar Actividad */}
                <div style={{ padding: 'var(--mt-space-lg)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-md)', color: 'var(--mt-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} />
                    {editingTaskIdx !== null ? 'Editar Actividad' : 'Agregar Nueva Actividad'}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                    {/* Descripción */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                        Descripción de la Actividad
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Inspeccionar aceite"
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: 'var(--mt-space-md)',
                          fontSize: '14px',
                          border: '1px solid var(--mt-border)',
                          borderRadius: 'var(--mt-radius-md)',
                          background: 'var(--mt-bg-surface)',
                          color: 'var(--mt-text-primary)',
                        }}
                      />
                    </div>

                    {/* Grid: Tipo y Requerido */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                          Tipo de Tarea
                        </label>
                        <select
                          value={newTask.kind}
                          onChange={(e) => setNewTask(prev => ({ ...prev, kind: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: 'var(--mt-space-md)',
                            fontSize: '14px',
                            border: '1px solid var(--mt-border)',
                            borderRadius: 'var(--mt-radius-md)',
                            background: 'var(--mt-bg-surface)',
                            color: 'var(--mt-text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {TASK_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newTask.required}
                            onChange={(e) => setNewTask(prev => ({ ...prev, required: e.target.checked }))}
                            style={{ cursor: 'pointer' }}
                          />
                          Requerido
                        </label>
                      </div>
                    </div>

                    {/* Unidad (si es MEASURE) */}
                    {newTask.kind === 'MEASURE' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--mt-space-md)' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                            Unidad
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: °C, ml, %"
                            value={newTask.unit}
                            onChange={(e) => setNewTask(prev => ({ ...prev, unit: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: 'var(--mt-space-md)',
                              fontSize: '14px',
                              border: '1px solid var(--mt-border)',
                              borderRadius: 'var(--mt-radius-md)',
                              background: 'var(--mt-bg-surface)',
                              color: 'var(--mt-text-primary)',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                            Mín
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={newTask.minValue}
                            onChange={(e) => setNewTask(prev => ({ ...prev, minValue: e.target.value ? parseFloat(e.target.value) : '' }))}
                            style={{
                              width: '100%',
                              padding: 'var(--mt-space-md)',
                              fontSize: '14px',
                              border: '1px solid var(--mt-border)',
                              borderRadius: 'var(--mt-radius-md)',
                              background: 'var(--mt-bg-surface)',
                              color: 'var(--mt-text-primary)',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                            Máx
                          </label>
                          <input
                            type="number"
                            placeholder="100"
                            value={newTask.maxValue}
                            onChange={(e) => setNewTask(prev => ({ ...prev, maxValue: e.target.value ? parseFloat(e.target.value) : '' }))}
                            style={{
                              width: '100%',
                              padding: 'var(--mt-space-md)',
                              fontSize: '14px',
                              border: '1px solid var(--mt-border)',
                              borderRadius: 'var(--mt-radius-md)',
                              background: 'var(--mt-bg-surface)',
                              color: 'var(--mt-text-primary)',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
                      <MtButton
                        onClick={handleAddTask}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        {editingTaskIdx !== null ? <Check size={16} /> : <Plus size={16} />}
                        {editingTaskIdx !== null ? 'Guardar Cambios' : 'Agregar Actividad'}
                      </MtButton>

                      {editingTaskIdx !== null && (
                        <MtButton
                          variant="secondary"
                          onClick={() => {
                            setEditingTaskIdx(null);
                            setNewTask({
                              position: 0,
                              description: '',
                              kind: 'CHECK',
                              unit: '',
                              minValue: '',
                              maxValue: '',
                              required: true,
                            });
                          }}
                          style={{ flex: 1 }}
                        >
                          Cancelar
                        </MtButton>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de Actividades */}
                {formData.tasks.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-md)', color: 'var(--mt-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={16} />
                      Actividades Agregadas ({formData.tasks.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {formData.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: 'var(--mt-space-md)',
                            background: 'var(--mt-bg-base)',
                            borderRadius: 'var(--mt-radius-md)',
                            borderLeft: '3px solid var(--mt-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 'var(--mt-space-md)',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                              {idx + 1}. {task.description}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <MtBadge size="xs" variant="default">{TASK_TYPES.find(t => t.value === task.kind)?.label}</MtBadge>
                              {task.required && <MtBadge size="xs" variant="danger">Requerido</MtBadge>}
                              {task.unit && <span style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Unidad: {task.unit}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleEditTask(idx)}
                              style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: 'none',
                                borderRadius: 'var(--mt-radius-md)',
                                cursor: 'pointer',
                                color: 'var(--mt-accent)',
                                padding: '6px 10px',
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(idx)}
                              style={{
                                background: 'rgba(244, 65, 82, 0.1)',
                                border: 'none',
                                borderRadius: 'var(--mt-radius-md)',
                                cursor: 'pointer',
                                color: 'var(--mt-danger)',
                                padding: '6px 10px',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: TÉCNICOS */}
            {activeTab === 'tecnicos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
                {/* Agregar Técnico */}
                <div style={{ padding: 'var(--mt-space-lg)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-md)', color: 'var(--mt-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} />
                    Asignar Técnico
                  </h3>

                  <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
                    <select
                      value={newTechnician}
                      onChange={(e) => setNewTechnician(e.target.value)}
                      style={{
                        flex: 1,
                        padding: 'var(--mt-space-md)',
                        fontSize: '14px',
                        border: '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        background: 'var(--mt-bg-surface)',
                        color: 'var(--mt-text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">-- Selecciona técnico --</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                    <MtButton onClick={handleAddTechnician} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={16} />
                      Asignar
                    </MtButton>
                  </div>
                </div>

                {/* Técnicos Asignados */}
                {formData.assignedTechnicians.length > 0 ? (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-md)', color: 'var(--mt-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={16} />
                      Técnicos Asignados ({formData.assignedTechnicians.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                      {formData.assignedTechnicians.map(techId => {
                        const tech = technicians.find(t => t.id === techId);
                        return tech ? (
                          <div
                            key={techId}
                            style={{
                              padding: 'var(--mt-space-md)',
                              background: 'var(--mt-bg-base)',
                              borderRadius: 'var(--mt-radius-md)',
                              borderLeft: '3px solid var(--mt-info)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, marginBottom: '2px', color: 'var(--mt-text-primary)' }}>
                                {tech.name}
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                                {tech.code}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveTechnician(techId)}
                              style={{
                                background: 'rgba(244, 65, 82, 0.1)',
                                border: 'none',
                                borderRadius: 'var(--mt-radius-md)',
                                cursor: 'pointer',
                                color: 'var(--mt-danger)',
                                padding: '6px 8px',
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 'var(--mt-space-lg)', textAlign: 'center', color: 'var(--mt-text-secondary)' }}>
                    <p style={{ fontSize: '13px', margin: 0 }}>Sin técnicos asignados</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: REFACCIONES */}
            {activeTab === 'repuestos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
                {/* Agregar Refacción */}
                <div style={{ padding: 'var(--mt-space-lg)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-md)', color: 'var(--mt-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} />
                    Asignar Refacción
                  </h3>

                  <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
                    <select
                      value={newSparePart}
                      onChange={(e) => setNewSparePart(e.target.value)}
                      style={{
                        flex: 1,
                        padding: 'var(--mt-space-md)',
                        fontSize: '14px',
                        border: '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        background: 'var(--mt-bg-base)',
                        color: 'var(--mt-text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">-- Selecciona refacción --</option>
                      {spareParts.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                    <MtButton onClick={handleAddSparePart} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={16} />
                      Asignar
                    </MtButton>
                  </div>

                  {spareParts.length === 0 && (
                    <div style={{ marginTop: 'var(--mt-space-md)', padding: 'var(--mt-space-md)', background: 'rgba(251, 191, 36, 0.1)', borderRadius: 'var(--mt-radius-md)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                      <p style={{ fontSize: '12px', color: 'var(--mt-warning)', margin: 0 }}>
                        No hay refacciones disponibles. Verifica tu inventario.
                      </p>
                    </div>
                  )}
                </div>

                {/* Refacciones Asignadas */}
                {formData.assignedSpareParts.length > 0 ? (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-md)', color: 'var(--mt-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={16} />
                      Refacciones Asignadas ({formData.assignedSpareParts.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {formData.assignedSpareParts.map(spare => {
                        const sparePart = spareParts.find(s => s.id === spare.id);
                        return sparePart ? (
                          <div
                            key={spare.id}
                            style={{
                              padding: 'var(--mt-space-md)',
                              background: 'var(--mt-bg-base)',
                              borderRadius: 'var(--mt-radius-md)',
                              borderLeft: '3px solid var(--mt-warning)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 'var(--mt-space-md)',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, marginBottom: '2px', color: 'var(--mt-text-primary)' }}>
                                {sparePart.name}
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                                {sparePart.code}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                min="1"
                                value={spare.quantity}
                                onChange={(e) => handleUpdateSparePartQty(spare.id, e.target.value)}
                                style={{
                                  width: '60px',
                                  padding: '6px',
                                  fontSize: '12px',
                                  border: '1px solid var(--mt-border)',
                                  borderRadius: 'var(--mt-radius-sm)',
                                  background: 'var(--mt-bg-surface)',
                                  color: 'var(--mt-text-primary)',
                                }}
                              />
                              <button
                                onClick={() => handleRemoveSparePart(spare.id)}
                                style={{
                                  background: 'rgba(244, 65, 82, 0.1)',
                                  border: 'none',
                                  borderRadius: 'var(--mt-radius-md)',
                                  cursor: 'pointer',
                                  color: 'var(--mt-danger)',
                                  padding: '6px 8px',
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 'var(--mt-space-lg)', textAlign: 'center', color: 'var(--mt-text-secondary)' }}>
                    <p style={{ fontSize: '13px', margin: 0 }}>Sin refacciones asignadas</p>
                  </div>
                )}
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: 'var(--mt-space-md)', marginTop: 'var(--mt-space-lg)', paddingTop: 'var(--mt-space-lg)', borderTop: '1px solid var(--mt-border)' }}>
              <MtButton
                variant="secondary"
                onClick={onClose}
                style={{ flex: 1 }}
                disabled={submitting}
              >
                Cancelar
              </MtButton>
              <MtButton
                onClick={handleSubmit}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                disabled={submitting}
              >
                {submitting ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Check size={16} />
                    {plan?.id ? 'Actualizar Plan' : 'Crear Plan'}
                  </>
                )}
              </MtButton>
            </div>
          </form>
        </div>
      </MtCard>
    </div>
  );
}
