import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MtButton, MtCard, MtBadge } from '../ui';
import PreventiveChecklist from '../components/PreventiveChecklist';
import CorrectiveAnalysis from '../components/CorrectiveAnalysis';
import { maintenanceApi } from '../services/maintenanceApi';
import { toast } from 'sonner';
import { Settings, X } from 'lucide-react';

export default function Execution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasksCompleted, setTasksCompleted] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      // Mock data - in real app fetch from API
      setWorkOrder({
        id: parseInt(id),
        number: 123,
        type: 'PREVENTIVE', // PREVENTIVE | CORRECTIVE
        title: 'Bomba Principal',
        assetName: 'Bomba Centrífuga Principal',
        assetId: 1,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        description: 'Mantenimiento preventivo de bomba centrífuga',
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

  const canSubmit = () => {
    if (!workOrder) return false;

    if (workOrder.type === 'PREVENTIVE') {
      // Preventive: requires 100% checklist completion
      return tasksCompleted;
    } else {
      // Corrective: requires analysis completion
      return analysisCompleted;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      if (workOrder.type === 'PREVENTIVE') {
        toast.warning('Completa todas las tareas antes de enviar');
      } else {
        toast.warning('Completa el análisis de falla antes de enviar');
      }
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Call API to update work order
      toast.success('Orden de trabajo validada');
      setTimeout(() => navigate('/maintenance/app/work-orders'), 1500);
    } catch (error) {
      toast.error('Error enviando orden: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite', display: 'flex', justifyContent: 'center' }}>
            <Settings size={32} style={{ color: 'var(--mt-accent)' }} />
          </div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando orden...</p>
        </div>
      </MtCard>
    );
  }

  if (!workOrder) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ marginBottom: 'var(--mt-space-md)', display: 'flex', justifyContent: 'center' }}>
            <X size={48} style={{ color: 'var(--mt-danger)' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Orden no encontrada
          </h3>
          <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/work-orders')}>
            Volver a órdenes
          </MtButton>
        </div>
      </MtCard>
    );
  }

  const isPreventi = workOrder.type === 'PREVENTIVE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--mt-bg-base)' }}>
      {/* Header - Fixed */}
      <div style={{ background: 'var(--mt-bg-surface)', padding: '16px', borderBottom: '1px solid var(--mt-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-secondary)', textTransform: 'uppercase' }}>
              OT-{String(workOrder.number).padStart(6, '0')}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mt-text-primary)' }}>{workOrder.assetName}</div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
            <MtBadge
              label={isPreventi ? 'Preventiva' : 'Correctiva'}
              variant={isPreventi ? 'info' : 'warning'}
              size="sm"
            />
            <MtBadge label="En Ejecución" variant="warning" size="sm" />
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div style={{ flex: 1, padding: '24px 16px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {isPreventi ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
              <MtCard elevated>
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                    ✓ Mantenimiento Preventivo
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                    Completa todas las tareas del checklist y carga evidencia fotográfica.
                  </p>
                </div>
              </MtCard>

              <PreventiveChecklist workOrderId={workOrder.id} onTaskUpdate={handleTasksUpdate} />

              {tasksCompleted && (
                <MtCard elevated style={{ background: 'rgba(52, 211, 153, 0.1)', border: '2px solid var(--mt-success)' }}>
                  <div style={{ padding: 'var(--mt-space-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)' }}>✅</div>
                    <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-success)', margin: 0 }}>
                      ¡Todas las tareas completadas! Listo para validar la orden.
                    </p>
                  </div>
                </MtCard>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
              <MtCard elevated>
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                    🔧 Mantenimiento Correctivo
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                    Analiza la falla, identifica la causa raíz y proporciona recomendaciones.
                  </p>
                </div>
              </MtCard>

              <CorrectiveAnalysis workOrderId={workOrder.id} assetId={workOrder.assetId} />

              <MtCard elevated style={{ background: 'var(--mt-bg-surface-2)', padding: 'var(--mt-space-lg)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', textTransform: 'uppercase' }}>
                  Validación
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={analysisCompleted}
                      onChange={(e) => setAnalysisCompleted(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>He analizado la causa raíz y proporcionado recomendaciones</span>
                  </label>
                </div>
              </MtCard>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed */}
      <div style={{ background: 'var(--mt-bg-surface)', padding: '16px', borderTop: '1px solid var(--mt-border)', position: 'sticky', bottom: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: '12px' }}>
          <MtButton variant="secondary" onClick={() => navigate(-1)} size="lg" style={{ flex: 1 }}>
            ← Volver
          </MtButton>
          <MtButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            size="lg"
            style={{ flex: 1 }}
          >
            {submitting ? 'Enviando...' : '✓ Validar y Cerrar'}
          </MtButton>
        </div>
      </div>
    </div>
  );
}
