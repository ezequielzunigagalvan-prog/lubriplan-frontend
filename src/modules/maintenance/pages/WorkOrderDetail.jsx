import { useState, useEffect } from 'react';
import { MtCard, MtBadge, MtPriorityBadge, MtButton, MtIcon } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import PhotoCapture from '../components/PhotoCapture';
import { toast } from 'sonner';
import '../ui/tokens.css';

export default function WorkOrderDetail() {
  const [order, setOrder] = useState(null);
  const [spareParts, setSpareParts] = useState([]);
  const [failureCodes, setFailureCodes] = useState({ FAILURE_MODE: [], MECHANISM: [], ROOT_CAUSE: [] });
  const [workOrderParts, setWorkOrderParts] = useState([]);
  const [workOrderFailure, setWorkOrderFailure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConsumeForm, setShowConsumeForm] = useState(false);
  const [showFailureForm, setShowFailureForm] = useState(false);

  const [consumeData, setConsumeData] = useState({
    sparePartId: '',
    quantity: 0,
    costPerUnit: 0,
  });

  const [failureData, setFailureData] = useState({
    failureModeId: '',
    mechanismId: '',
    rootCauseId: '',
    productionEffect: '',
  });

  const [photos, setPhotos] = useState([]);

  // Mock OT for now
  const mockOrder = {
    id: '000123',
    title: 'Ruido anormal en bomba',
    asset: 'Bomba Principal',
    priority: 'HIGH',
    state: 'IN_PROGRESS',
    createdAt: '2025-11-28',
    description: 'Se detectó ruido anormal en la bomba principal. Requiere inspección urgente.',
    assignedTo: 'Juan Pérez',
    timeline: [
      { date: '2025-11-28 09:15', event: 'Reportada', icon: 'alertCircle' },
      { date: '2025-11-28 10:30', event: 'Aprobada', icon: 'checkCircle' },
      { date: '2025-11-28 11:00', event: 'Asignada a Juan', icon: 'user' },
      { date: '2025-11-28 14:00', event: 'En ejecución', icon: 'wrench' },
    ],
  };

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [parts, codes] = await Promise.all([
          maintenanceApi.getSpareParts(),
          maintenanceApi.getFailureCodes(),
        ]);
        setSpareParts(parts.data || []);
        setFailureCodes(codes);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }
    loadData();
    setOrder(mockOrder);
  }, []);

  async function handleConsumeSparepart(e) {
    e.preventDefault();
    if (!consumeData.sparePartId || !consumeData.quantity) {
      toast.error('Refacción y cantidad requeridas');
      return;
    }
    try {
      // In real app, get workOrderId from URL/params
      const workOrderId = 1; // TODO: Get from actual WO
      await maintenanceApi.consumeSparePartInWorkOrder({
        workOrderId,
        sparePartId: parseInt(consumeData.sparePartId),
        quantity: parseFloat(consumeData.quantity),
        costPerUnit: consumeData.costPerUnit ? parseFloat(consumeData.costPerUnit) : null,
      });
      toast.success('Refacción consumida');
      setConsumeData({ sparePartId: '', quantity: 0, costPerUnit: 0 });
      setShowConsumeForm(false);
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  }

  async function handleAssignFailure(e) {
    e.preventDefault();
    try {
      const workOrderId = 1; // TODO: Get from actual WO
      await maintenanceApi.assignFailureToWorkOrder(workOrderId, {
        failureModeId: failureData.failureModeId ? parseInt(failureData.failureModeId) : null,
        mechanismId: failureData.mechanismId ? parseInt(failureData.mechanismId) : null,
        rootCauseId: failureData.rootCauseId ? parseInt(failureData.rootCauseId) : null,
        productionEffect: failureData.productionEffect || null,
      });
      toast.success('Falla asignada');
      setShowFailureForm(false);
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  }

  if (loading) return <div>Cargando...</div>;
  if (!order) return <div>Orden no encontrada</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--mt-accent)', marginBottom: '4px' }}>
              OT-{order.id}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mt-text-primary)' }}>{order.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <MtPriorityBadge priority={order.priority} />
            <MtBadge variant="info" dot>{order.state}</MtBadge>
          </div>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
          {order.asset} • Creada {order.createdAt} • Asignada: {order.assignedTo}
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Description */}
        <MtCard elevated>
          <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-secondary)' }}>
            Descripción
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mt-text-primary)', lineHeight: 1.6 }}>
            {order.description}
          </div>
        </MtCard>

        {/* Photos */}
        <MtCard elevated>
          <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-secondary)' }}>
            Fotos (3)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{ aspectRatio: '1', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                📷
              </div>
            ))}
          </div>
        </MtCard>

        {/* Phase 3A: Spare Parts Consumed */}
        <MtCard elevated>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-secondary)' }}>
              🔧 Refacciones ({workOrderParts.length})
            </div>
            <button
              onClick={() => setShowConsumeForm(!showConsumeForm)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--mt-border)',
                background: 'transparent',
                color: 'var(--mt-accent)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {showConsumeForm ? '✕ Cancelar' : '+ Consumir'}
            </button>
          </div>

          {showConsumeForm && (
            <form onSubmit={handleConsumeSparepart} style={{ marginBottom: '16px', padding: '12px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', space: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <select
                  value={consumeData.sparePartId}
                  onChange={(e) => setConsumeData({ ...consumeData, sparePartId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mt-border)', fontSize: '12px' }}
                  required
                >
                  <option value="">Selecciona refacción</option>
                  {spareParts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.code} - {part.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cantidad"
                  value={consumeData.quantity}
                  onChange={(e) => setConsumeData({ ...consumeData, quantity: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--mt-border)', fontSize: '12px' }}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Costo unitario (opt.)"
                  value={consumeData.costPerUnit}
                  onChange={(e) => setConsumeData({ ...consumeData, costPerUnit: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--mt-border)', fontSize: '12px' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  background: 'var(--mt-accent)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Registrar Consumo
              </button>
            </form>
          )}

          {workOrderParts.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Sin refacciones consumidas</div>
          ) : (
            <div style={{ space: '8px' }}>
              {workOrderParts.map((part) => (
                <div key={part.id} style={{ fontSize: '12px', padding: '8px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700 }}>
                    {part.sparePart.code} × {part.quantity} {part.sparePart.unit}
                  </div>
                  <div style={{ color: 'var(--mt-text-secondary)' }}>
                    ${(part.costPerUnitAtTime * part.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </MtCard>

        {/* Phase 3A: Failure Codes */}
        <MtCard elevated>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-secondary)' }}>
              ⚠️ Código de Falla
            </div>
            <button
              onClick={() => setShowFailureForm(!showFailureForm)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--mt-border)',
                background: 'transparent',
                color: 'var(--mt-accent)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {showFailureForm ? '✕ Cancelar' : '+ Asignar'}
            </button>
          </div>

          {showFailureForm && (
            <form onSubmit={handleAssignFailure} style={{ marginBottom: '16px', padding: '12px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', space: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Modo de Falla</label>
                <select
                  value={failureData.failureModeId}
                  onChange={(e) => setFailureData({ ...failureData, failureModeId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mt-border)', fontSize: '12px' }}
                >
                  <option value="">Selecciona...</option>
                  {failureCodes.FAILURE_MODE?.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.code} - {code.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Mecanismo</label>
                <select
                  value={failureData.mechanismId}
                  onChange={(e) => setFailureData({ ...failureData, mechanismId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mt-border)', fontSize: '12px' }}
                >
                  <option value="">Selecciona...</option>
                  {failureCodes.MECHANISM?.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.code} - {code.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Causa Raíz</label>
                <select
                  value={failureData.rootCauseId}
                  onChange={(e) => setFailureData({ ...failureData, rootCauseId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mt-border)', fontSize: '12px' }}
                >
                  <option value="">Selecciona...</option>
                  {failureCodes.ROOT_CAUSE?.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.code} - {code.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Efecto en Producción</label>
                <select
                  value={failureData.productionEffect}
                  onChange={(e) => setFailureData({ ...failureData, productionEffect: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--mt-border)', fontSize: '12px' }}
                >
                  <option value="">Selecciona...</option>
                  <option value="TOTAL_STOP">Paro Total</option>
                  <option value="PARTIAL_STOP">Paro Parcial</option>
                  <option value="NO_EFFECT">Sin Afectación</option>
                </select>
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  background: 'var(--mt-accent)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Asignar Falla
              </button>
            </form>
          )}

          {workOrderFailure ? (
            <div style={{ fontSize: '12px', padding: '12px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', space: '8px' }}>
              <div>
                <strong>Modo:</strong> {workOrderFailure.failureMode?.code} - {workOrderFailure.failureMode?.name}
              </div>
              <div>
                <strong>Mecanismo:</strong> {workOrderFailure.mechanism?.code} - {workOrderFailure.mechanism?.name}
              </div>
              <div>
                <strong>Causa Raíz:</strong> {workOrderFailure.rootCause?.code} - {workOrderFailure.rootCause?.name}
              </div>
              {workOrderFailure.productionEffect && (
                <div>
                  <strong>Efecto:</strong> {workOrderFailure.productionEffect}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Sin código de falla asignado</div>
          )}
        </MtCard>
      </div>

      {/* Photos */}
      <PhotoCapture
        workOrderId={order?.id}
        maintenanceApi={maintenanceApi}
        onPhotoAdded={(photo) => setPhotos([...photos, photo])}
      />

      {/* Timeline */}
      <MtCard elevated>
        <div style={{ marginBottom: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-secondary)' }}>
          Línea de tiempo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {order.timeline.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mt-accent)', flexShrink: 0 }}>
                <MtIcon name={item.icon} size="sm" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-primary)' }}>{item.event}</div>
                <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </MtCard>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <MtButton size="lg"><MtIcon name="wrench" size="md" /> Ejecutar</MtButton>
        <MtButton variant="secondary" size="lg">Comentar</MtButton>
        <MtButton variant="ghost" size="lg">Más opciones</MtButton>
      </div>
    </div>
  );
}
