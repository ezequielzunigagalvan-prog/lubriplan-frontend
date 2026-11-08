import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton, MtInput } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { CheckCircle, XCircle, Clock, AlertTriangle, User, Calendar, DollarSign, FileText, Image, MessageCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import '../ui/tokens.css';

const STATUS_CONFIG = {
  REQUESTED: { label: 'Solicitada', color: 'var(--mt-info)', icon: FileText, bg: 'rgba(59, 130, 246, 0.1)' },
  PENDING_APPROVAL: { label: 'Pendiente Aprobación', color: 'var(--mt-warning)', icon: Clock, bg: 'rgba(251, 191, 36, 0.1)' },
  APPROVED: { label: 'Aprobada', color: 'var(--mt-success)', icon: CheckCircle, bg: 'rgba(34, 197, 94, 0.1)' },
  REJECTED: { label: 'Rechazada', color: 'var(--mt-danger)', icon: XCircle, bg: 'rgba(244, 65, 82, 0.1)' },
  ASSIGNED: { label: 'Asignada', color: 'var(--mt-accent)', icon: User, bg: 'rgba(56, 189, 248, 0.1)' },
};

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Crítica', color: 'var(--mt-danger)', icon: AlertTriangle },
  HIGH: { label: 'Alta', color: 'var(--mt-warning)' },
  MEDIUM: { label: 'Media', color: 'var(--mt-info)' },
  LOW: { label: 'Baja', color: 'var(--mt-accent)' },
};

// Mock technicians
const MOCK_TECHNICIANS = [
  { id: 1, name: 'Juan Pérez', speciality: 'Mecánica', available: true },
  { id: 2, name: 'Carlos López', speciality: 'Eléctrica', available: true },
  { id: 3, name: 'Roberto García', speciality: 'Hidráulica', available: false },
  { id: 4, name: 'Miguel Torres', speciality: 'Instrumentación', available: true },
];

export default function WorkOrderReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(null);

  const [approvalData, setApprovalData] = useState({
    assignedTechnicianId: '',
    estimatedDate: '',
    estimatedHours: '',
    notes: '',
  });

  const [rejectionData, setRejectionData] = useState({
    reason: '',
    comments: '',
  });

  // Mock work order
  const mockOrder = {
    id: id || '000123',
    type: 'CORRECTIVE',
    status: 'PENDING_APPROVAL',
    priority: 'HIGH',
    title: 'Ruido anormal en bomba principal',
    description: 'Se detectó ruido anormal en la bomba principal. Requiere inspección urgente. El operador reporta que comenzó a las 14:00 horas.',
    asset: { id: 1, name: 'Bomba Principal', code: 'EQ-001', location: 'Producción - Línea 01' },
    reportedBy: { name: 'José López', role: 'Operador', time: '2025-11-28 14:30' },
    createdAt: '2025-11-28 14:30',
    photos: [
      { id: 1, url: 'https://via.placeholder.com/400x300?text=Foto+1', caption: 'Vista general' },
      { id: 2, url: 'https://via.placeholder.com/400x300?text=Foto+2', caption: 'Detalle de motor' },
    ],
    comments: 'El equipo dejó de funcionar correctamente. Es crítico para la línea de producción.',
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(false);
        setWorkOrder(mockOrder);
        setPhotos(mockOrder.photos || []);
      } catch (error) {
        console.error('Error loading:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approvalData.assignedTechnicianId) {
      toast.error('Selecciona un técnico');
      return;
    }
    if (!approvalData.estimatedDate) {
      toast.error('Ingresa la fecha estimada');
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Call API
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Orden aprobada y asignada');
      navigate('/maintenance/app/work-orders');
    } catch (error) {
      toast.error('Error al aprobar: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionData.reason) {
      toast.error('Especifica la razón del rechazo');
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Call API
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Orden rechazada');
      navigate('/maintenance/app/work-orders');
    } catch (error) {
      toast.error('Error al rechazar: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', display: 'flex', justifyContent: 'center', marginBottom: 'var(--mt-space-md)' }}>
            <Clock size={32} style={{ color: 'var(--mt-accent)' }} />
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
          <XCircle size={48} style={{ color: 'var(--mt-danger)', marginBottom: 'var(--mt-space-md)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Orden no encontrada</h3>
          <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/work-orders')} style={{ marginTop: 'var(--mt-space-lg)' }}>
            Volver a órdenes
          </MtButton>
        </div>
      </MtCard>
    );
  }

  const statusConfig = STATUS_CONFIG[workOrder.status];
  const priorityConfig = PRIORITY_CONFIG[workOrder.priority];
  const selectedTechnician = MOCK_TECHNICIANS.find(t => t.id === parseInt(approvalData.assignedTechnicianId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--mt-radius-md)',
            background: statusConfig.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {statusConfig && <statusConfig.icon size={24} style={{ color: statusConfig.color }} />}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, marginBottom: '6px', color: 'var(--mt-text-primary)' }}>
              {workOrder.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
              <MtBadge variant={workOrder.priority === 'CRITICAL' ? 'danger' : workOrder.priority === 'HIGH' ? 'warning' : 'info'}>
                {priorityConfig.label}
              </MtBadge>
              <MtBadge>
                {statusConfig.label}
              </MtBadge>
              <span style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                OT #{workOrder.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        {/* Equipo */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
              Equipo Afectado
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--mt-text-primary)', marginBottom: '4px' }}>
              {workOrder.asset.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
              {workOrder.asset.code} • {workOrder.asset.location}
            </div>
          </div>
        </MtCard>

        {/* Reportado por */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
              Reportado por
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
              {workOrder.reportedBy.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
              {workOrder.reportedBy.role}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', marginTop: '4px' }}>
              {workOrder.reportedBy.time}
            </div>
          </div>
        </MtCard>

        {/* Fecha de reporte */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
              Fecha de Reporte
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--mt-text-primary)', marginBottom: '4px' }}>
              {new Date(workOrder.createdAt).toLocaleDateString('es-MX')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
              {new Date(workOrder.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </MtCard>
      </div>

      {/* Description */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
            Descripción del Problema
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
            {workOrder.description}
          </p>
          {workOrder.comments && (
            <div style={{ padding: 'var(--mt-space-md)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-sm)', borderLeft: '3px solid var(--mt-accent)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={14} />
                Comentarios Adicionales
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mt-text-primary)', margin: 0 }}>
                {workOrder.comments}
              </p>
            </div>
          )}
        </div>
      </MtCard>

      {/* Photos */}
      {photos.length > 0 && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              Evidencia Fotográfica ({photos.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--mt-space-md)' }}>
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    borderRadius: 'var(--mt-radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--mt-border)',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                  onClick={() => setExpandedPhoto(photo)}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    padding: '8px',
                    fontSize: '12px',
                    color: '#fff',
                    fontWeight: '600',
                  }}>
                    {photo.caption}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MtCard>
      )}

      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--mt-space-lg)',
          }}
          onClick={() => setExpandedPhoto(null)}
        >
          <img
            src={expandedPhoto.url}
            alt={expandedPhoto.caption}
            style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: 'var(--mt-radius-md)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Approval Form */}
      {!showRejectionForm && workOrder.status === 'PENDING_APPROVAL' && (
        <MtCard elevated style={{ background: 'rgba(34, 197, 94, 0.05)', border: '2px solid var(--mt-success)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            {!showApprovalForm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
                <CheckCircle size={24} style={{ color: 'var(--mt-success)' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: 0, marginBottom: '2px' }}>
                    Revisar y Aprobar Orden
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                    Aprobar esta orden de trabajo correctiva y asignarlo a un técnico
                  </p>
                </div>
                <MtButton onClick={() => setShowApprovalForm(true)}>
                  Aprobar
                </MtButton>
              </div>
            ) : (
              <form onSubmit={handleApprove} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
                {/* Technician Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Técnico a Asignar *
                  </label>
                  <select
                    value={approvalData.assignedTechnicianId}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, assignedTechnicianId: e.target.value }))}
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
                    {MOCK_TECHNICIANS.filter(t => t.available).map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.speciality})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Fecha Estimada de Atención *
                  </label>
                  <input
                    type="date"
                    value={approvalData.estimatedDate}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, estimatedDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-surface)',
                      color: 'var(--mt-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Estimated Hours */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Horas Estimadas de Trabajo
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="Ej: 2.5"
                    value={approvalData.estimatedHours}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      fontSize: '14px',
                      border: '1px solid var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'var(--mt-bg-surface)',
                      color: 'var(--mt-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Notas (opcional)
                  </label>
                  <textarea
                    placeholder="Instrucciones especiales para el técnico..."
                    value={approvalData.notes}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, notes: e.target.value }))}
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

                {/* Approval Summary */}
                {selectedTechnician && (
                  <MtCard style={{ background: 'rgba(56, 189, 248, 0.05)' }}>
                    <div style={{ padding: 'var(--mt-space-md)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-md)' }}>
                        Resumen de Asignación
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)', fontSize: '13px' }}>
                        <div>
                          <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>Técnico</div>
                          <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>{selectedTechnician.name}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>Especialidad</div>
                          <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>{selectedTechnician.speciality}</div>
                        </div>
                        {approvalData.estimatedDate && (
                          <div>
                            <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>Fecha</div>
                            <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                              {new Date(approvalData.estimatedDate).toLocaleDateString('es-MX')}
                            </div>
                          </div>
                        )}
                        {approvalData.estimatedHours && (
                          <div>
                            <div style={{ color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>Horas Est.</div>
                            <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>{approvalData.estimatedHours}h</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </MtCard>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
                  <MtButton variant="secondary" onClick={() => setShowApprovalForm(false)} style={{ flex: 1 }} disabled={submitting}>
                    Cancelar
                  </MtButton>
                  <MtButton type="submit" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Aprobando...' : 'Confirmar Aprobación'}
                  </MtButton>
                </div>
              </form>
            )}
          </div>
        </MtCard>
      )}

      {/* Rejection Form */}
      {!showApprovalForm && workOrder.status === 'PENDING_APPROVAL' && (
        <MtCard elevated style={{ background: 'rgba(244, 65, 82, 0.05)', border: '2px solid var(--mt-danger)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            {!showRejectionForm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
                <XCircle size={24} style={{ color: 'var(--mt-danger)' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: 0, marginBottom: '2px' }}>
                    Rechazar Orden
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                    Devolver la orden al reportante con comentarios
                  </p>
                </div>
                <MtButton variant="secondary" onClick={() => setShowRejectionForm(true)} style={{ color: 'var(--mt-danger)', borderColor: 'var(--mt-danger)' }}>
                  Rechazar
                </MtButton>
              </div>
            ) : (
              <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
                {/* Reason */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Motivo del Rechazo *
                  </label>
                  <select
                    value={rejectionData.reason}
                    onChange={(e) => setRejectionData(prev => ({ ...prev, reason: e.target.value }))}
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
                    <option value="">-- Selecciona un motivo --</option>
                    <option value="insufficient_info">Información Insuficiente</option>
                    <option value="no_equipment">Equipo no existe</option>
                    <option value="duplicate">Duplicado</option>
                    <option value="false_alarm">Falsa alarma</option>
                    <option value="other">Otro motivo</option>
                  </select>
                </div>

                {/* Comments */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                    Comentarios para el Reportante *
                  </label>
                  <textarea
                    placeholder="Explica por qué se rechaza la orden..."
                    value={rejectionData.comments}
                    onChange={(e) => setRejectionData(prev => ({ ...prev, comments: e.target.value }))}
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
                <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
                  <MtButton variant="secondary" onClick={() => setShowRejectionForm(false)} style={{ flex: 1 }} disabled={submitting}>
                    Cancelar
                  </MtButton>
                  <MtButton type="submit" style={{ flex: 1, background: 'var(--mt-danger)' }} disabled={submitting}>
                    {submitting ? 'Rechazando...' : 'Confirmar Rechazo'}
                  </MtButton>
                </div>
              </form>
            )}
          </div>
        </MtCard>
      )}
    </div>
  );
}
