import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MtButton, MtCard, MtBadge } from '../ui';
import PreventiveChecklist from '../components/PreventiveChecklist';
import CorrectiveAnalysis from '../components/CorrectiveAnalysis';
import { maintenanceApi } from '../services/maintenanceApi';
import { toast } from 'sonner';
import {
  Settings, X, Camera, Plus, Trash2, Clock, CheckCircle2, AlertTriangle,
  Wrench, Save, ChevronUp, ChevronDown
} from 'lucide-react';
import '../ui/tokens.css';

export default function Execution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cameraRef = useRef(null);

  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasksCompleted, setTasksCompleted] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    header: true,
    execution: true,
    spareparts: true,
    photos: true,
  });

  const [executionData, setExecutionData] = useState({
    startTime: new Date().toLocaleTimeString('es-ES'),
    diagnosis: '',
    cause: '',
    workPerformed: '',
    comments: '',
    endTime: '',
    photos: [],
    spareParts: [],
  });

  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      setWorkOrder({
        id: parseInt(id),
        number: 123,
        type: 'CORRECTIVE',
        title: 'Ruido anormal en bomba',
        assetName: 'Bomba Centrífuga Principal',
        assetCode: 'EQ-001',
        assetId: 1,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        description: 'Se detectó ruido anormal. Requiere inspección urgente.',
        reportedBy: 'José López',
        createdAt: '2025-11-28 14:30',
      });
    } catch (error) {
      toast.error('Error cargando orden');
    } finally {
      setLoading(false);
    }
  };

  const handleTasksUpdate = (tasks) => {
    const allCompleted = tasks.every((t) => t.completed);
    setTasksCompleted(allCompleted);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file && executionData.photos.length < 10) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setExecutionData(prev => ({
          ...prev,
          photos: [...prev.photos, { file, preview: evt.target.result }],
        }));
        toast.success(`Foto agregada (${executionData.photos.length + 1}/10)`);
      };
      reader.readAsDataURL(file);
    } else if (executionData.photos.length >= 10) {
      toast.error('Máximo 10 fotos');
    }
  };

  const handleRemovePhoto = (idx) => {
    setExecutionData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  const addSparePart = () => {
    setExecutionData(prev => ({
      ...prev,
      spareParts: [...prev.spareParts, { code: '', name: '', quantity: '', removed: '', installed: '', serialNumber: '' }],
    }));
  };

  const removeSparePart = (idx) => {
    setExecutionData(prev => ({
      ...prev,
      spareParts: prev.spareParts.filter((_, i) => i !== idx),
    }));
  };

  const updateSparePart = (idx, field, value) => {
    setExecutionData(prev => ({
      ...prev,
      spareParts: prev.spareParts.map((sp, i) => i === idx ? { ...sp, [field]: value } : sp),
    }));
  };

  const canSubmit = () => {
    if (!workOrder) return false;
    if (workOrder.type === 'PREVENTIVE') return tasksCompleted;
    return analysisCompleted && executionData.workPerformed.trim() && executionData.endTime;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      const msg = workOrder.type === 'PREVENTIVE'
        ? 'Completa todas las tareas'
        : 'Completa: diagnóstico, trabajo realizado y hora final';
      toast.warning(msg);
      return;
    }

    try {
      setSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Orden completada y enviada');
      setTimeout(() => navigate('/maintenance/app/technician'), 1500);
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <Settings size={32} style={{ color: 'var(--mt-accent)', animation: 'spin 1s linear infinite', marginBottom: 'var(--mt-space-md)' }} />
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando orden...</p>
        </div>
      </MtCard>
    );
  }

  if (!workOrder) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <X size={48} style={{ color: 'var(--mt-danger)', marginBottom: 'var(--mt-space-md)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Orden no encontrada</h3>
        </div>
      </MtCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)', paddingBottom: 'var(--mt-space-2xl)' }}>
      {/* Header Section */}
      {expandedSections.header && (
        <MtCard elevated style={{ borderLeft: '4px solid var(--mt-accent)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0, marginBottom: '6px', color: 'var(--mt-text-primary)' }}>
                  {workOrder.title}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                  {workOrder.assetName} ({workOrder.assetCode})
                </p>
                <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', flexWrap: 'wrap' }}>
                  <MtBadge variant={workOrder.priority === 'HIGH' ? 'warning' : 'info'} size="sm">
                    {workOrder.priority} Priority
                  </MtBadge>
                  <MtBadge variant={workOrder.type === 'CORRECTIVE' ? 'danger' : 'info'} size="sm">
                    {workOrder.type === 'CORRECTIVE' ? 'Correctiva' : 'Preventiva'}
                  </MtBadge>
                </div>
              </div>
              <button
                onClick={() => toggleSection('header')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <ChevronUp size={20} style={{ color: 'var(--mt-text-tertiary)' }} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, padding: 'var(--mt-space-sm)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-sm)', borderLeft: '2px solid var(--mt-accent)' }}>
              {workOrder.description}
            </p>
          </div>
        </MtCard>
      )}

      {/* Execution Form */}
      {expandedSections.execution && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 'var(--mt-space-md)',
              cursor: 'pointer',
              background: 'var(--mt-bg-surface)',
              borderRadius: 'var(--mt-radius-md)',
              marginBottom: 'var(--mt-space-lg)',
            }}
            onClick={() => toggleSection('execution')}
          >
            <Wrench size={20} style={{ color: 'var(--mt-accent)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, flex: 1, color: 'var(--mt-text-primary)' }}>
              Detalles de Ejecución
            </h2>
            <ChevronDown size={20} style={{ color: 'var(--mt-text-tertiary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {/* Time Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={executionData.startTime}
                  onChange={(e) => setExecutionData(prev => ({ ...prev, startTime: e.target.value }))}
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
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
                  Hora Fin
                </label>
                <input
                  type="time"
                  value={executionData.endTime}
                  onChange={(e) => setExecutionData(prev => ({ ...prev, endTime: e.target.value }))}
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
            </div>

            {/* Diagnosis */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
                Diagnóstico
              </label>
              <textarea
                placeholder="¿Cuál es el problema detectado?"
                value={executionData.diagnosis}
                onChange={(e) => setExecutionData(prev => ({ ...prev, diagnosis: e.target.value }))}
                rows={2}
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

            {/* Cause */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
                Causa de la Falla
              </label>
              <textarea
                placeholder="¿Cuál es la causa raíz?"
                value={executionData.cause}
                onChange={(e) => setExecutionData(prev => ({ ...prev, cause: e.target.value }))}
                rows={2}
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

            {/* Work Performed */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
                Trabajo Realizado *
              </label>
              <textarea
                placeholder="¿Qué trabajo realizaste?"
                value={executionData.workPerformed}
                onChange={(e) => setExecutionData(prev => ({ ...prev, workPerformed: e.target.value }))}
                rows={3}
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
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Comments */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
                Comentarios Adicionales
              </label>
              <textarea
                placeholder="Observaciones..."
                value={executionData.comments}
                onChange={(e) => setExecutionData(prev => ({ ...prev, comments: e.target.value }))}
                rows={2}
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

            {/* Preventive Checklist */}
            {workOrder.type === 'PREVENTIVE' && (
              <PreventiveChecklist workOrderId={workOrder.id} onUpdate={handleTasksUpdate} />
            )}

            {/* Corrective Analysis */}
            {workOrder.type === 'CORRECTIVE' && (
              <CorrectiveAnalysis workOrderId={workOrder.id} onUpdate={(completed) => setAnalysisCompleted(completed)} />
            )}
          </div>
        </div>
      )}

      {/* Spare Parts */}
      {expandedSections.spareparts && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 'var(--mt-space-md)',
              cursor: 'pointer',
              background: 'var(--mt-bg-surface)',
              borderRadius: 'var(--mt-radius-md)',
              marginBottom: 'var(--mt-space-lg)',
            }}
            onClick={() => toggleSection('spareparts')}
          >
            <Wrench size={20} style={{ color: 'var(--mt-info)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, flex: 1, color: 'var(--mt-text-primary)' }}>
              Refacciones Utilizadas ({executionData.spareParts.length})
            </h2>
            <ChevronDown size={20} style={{ color: 'var(--mt-text-tertiary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-lg)' }}>
            {executionData.spareParts.map((sp, idx) => (
              <MtCard key={idx} elevated style={{ padding: 'var(--mt-space-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
                  <input
                    placeholder="Código refacción"
                    value={sp.code}
                    onChange={(e) => updateSparePart(idx, 'code', e.target.value)}
                    style={{ padding: '8px', fontSize: '12px', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-sm)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <input
                    placeholder="Nombre"
                    value={sp.name}
                    onChange={(e) => updateSparePart(idx, 'name', e.target.value)}
                    style={{ padding: '8px', fontSize: '12px', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-sm)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      placeholder="Cantidad"
                      type="number"
                      value={sp.quantity}
                      onChange={(e) => updateSparePart(idx, 'quantity', e.target.value)}
                      style={{ padding: '8px', fontSize: '12px', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-sm)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <input
                      placeholder="Nº serie"
                      value={sp.serialNumber}
                      onChange={(e) => updateSparePart(idx, 'serialNumber', e.target.value)}
                      style={{ padding: '8px', fontSize: '12px', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-sm)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    onClick={() => removeSparePart(idx)}
                    style={{ padding: '6px', background: 'rgba(244, 65, 82, 0.1)', border: 'none', borderRadius: 'var(--mt-radius-sm)', cursor: 'pointer', color: 'var(--mt-danger)', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </MtCard>
            ))}
            <button
              onClick={addSparePart}
              style={{ padding: 'var(--mt-space-md)', background: 'rgba(56, 189, 248, 0.1)', border: '1px dashed var(--mt-accent)', borderRadius: 'var(--mt-radius-md)', cursor: 'pointer', color: 'var(--mt-accent)', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              Agregar Refacción
            </button>
          </div>
        </div>
      )}

      {/* Photos */}
      {expandedSections.photos && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 'var(--mt-space-md)',
              cursor: 'pointer',
              background: 'var(--mt-bg-surface)',
              borderRadius: 'var(--mt-radius-md)',
              marginBottom: 'var(--mt-space-lg)',
            }}
            onClick={() => toggleSection('photos')}
          >
            <Camera size={20} style={{ color: 'var(--mt-success)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, flex: 1, color: 'var(--mt-text-primary)' }}>
              Fotografías ({executionData.photos.length}/10)
            </h2>
            <ChevronDown size={20} style={{ color: 'var(--mt-text-tertiary)' }} />
          </div>

          <button
            onClick={() => cameraRef.current?.click()}
            disabled={executionData.photos.length >= 10}
            style={{
              width: '100%',
              padding: 'var(--mt-space-lg)',
              border: '2px dashed var(--mt-accent)',
              borderRadius: 'var(--mt-radius-lg)',
              background: 'rgba(56, 189, 248, 0.05)',
              cursor: executionData.photos.length >= 10 ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--mt-space-md)',
              opacity: executionData.photos.length >= 10 ? 0.6 : 1,
              transition: 'all 200ms ease',
              marginBottom: 'var(--mt-space-lg)',
            }}
          >
            <Camera size={32} style={{ color: 'var(--mt-accent)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                Tomar o cargar foto
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '2px' }}>
                {executionData.photos.length}/10 fotos
              </div>
            </div>
          </button>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            style={{ display: 'none' }}
          />

          {executionData.photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--mt-space-md)' }}>
              {executionData.photos.map((photo, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 'var(--mt-radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--mt-border)',
                  }}
                >
                  <img
                    src={photo.preview}
                    alt={`Foto ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 'var(--mt-space-lg)', background: 'linear-gradient(to top, var(--mt-bg-base), transparent)', display: 'flex', gap: 'var(--mt-space-md)' }}>
        <MtButton variant="secondary" onClick={() => navigate(-1)} style={{ flex: 1 }} disabled={submitting}>
          Cancelar
        </MtButton>
        <MtButton
          onClick={handleSubmit}
          disabled={!canSubmit()}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          disabled={submitting}
        >
          <Save size={18} />
          {submitting ? 'Guardando...' : 'Completar Orden'}
        </MtButton>
      </div>
    </div>
  );
}
