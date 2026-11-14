import { useState, useEffect } from 'react';
import { MtCard, MtBadge, MtButton } from '../ui';
import { Users, Package, CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { maintenanceApi } from '../services/maintenanceApi';

export default function PlanRoadmapModal({ isOpen, onClose, plan }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && plan?.id) {
      loadRoadmap();
    }
  }, [isOpen, plan?.id]);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceApi.getPlanRoadmap(plan.id);
      setRoadmap(data);
    } catch (err) {
      console.error('Error cargando hoja de ruta:', err);
      setError('Error cargando la hoja de ruta');
      toast.error('Error cargando la hoja de ruta');
    } finally {
      setLoading(false);
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
        background: 'rgba(0,0,0,0.5)',
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
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: 'var(--mt-space-2xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--mt-space-lg)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--mt-text-primary)' }}>
              📋 Hoja de Ruta del Plan
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--mt-text-secondary)',
              }}
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div style={{
              padding: 'var(--mt-space-3xl)',
              textAlign: 'center',
            }}>
              <Zap size={32} style={{ color: 'var(--mt-accent)', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                Cargando hoja de ruta...
              </p>
            </div>
          ) : error ? (
            <div style={{
              padding: 'var(--mt-space-lg)',
              background: 'rgba(244, 65, 82, 0.1)',
              borderRadius: 'var(--mt-radius-md)',
              border: '1px solid var(--mt-danger)',
              textAlign: 'center',
            }}>
              <AlertCircle size={24} style={{ color: 'var(--mt-danger)', marginBottom: 'var(--mt-space-sm)' }} />
              <p style={{ fontSize: '14px', color: 'var(--mt-danger)', margin: 0 }}>
                {error}
              </p>
            </div>
          ) : roadmap ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
              {/* Plan Info */}
              {roadmap.plan && (
                <div style={{ padding: 'var(--mt-space-md)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                  <div style={{ marginBottom: 'var(--mt-space-sm)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                      {roadmap.plan.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {roadmap.plan.code}
                    </p>
                  </div>
                  {roadmap.plan.frequency && (
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      Frecuencia: {roadmap.plan.frequency}
                    </p>
                  )}
                  {roadmap.plan.nextDue && (
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      Próximo: {new Date(roadmap.plan.nextDue).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </div>
              )}

              {/* Asset Info */}
              {roadmap.asset && (
                <div style={{ padding: 'var(--mt-space-md)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, marginBottom: '6px', color: 'var(--mt-text-tertiary)' }}>
                    EQUIPO
                  </h3>
                  <p style={{ fontSize: '14px', fontWeight: '700', margin: 0, marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                    {roadmap.asset.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                    {roadmap.asset.code} • {roadmap.asset.location}
                  </p>
                </div>
              )}

              {/* Checklist */}
              {roadmap.checklist && roadmap.checklist.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--mt-space-md)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--mt-success)' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--mt-text-primary)' }}>
                      Checklist de Actividades ({roadmap.checklist.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {roadmap.checklist.map((item, idx) => (
                      <div key={idx} style={{
                        padding: '8px',
                        background: 'var(--mt-bg-base)',
                        borderRadius: 'var(--mt-radius-sm)',
                        borderLeft: '3px solid var(--mt-accent)',
                      }}>
                        <p style={{ fontSize: '13px', margin: 0, marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                          {item.order}. {item.description}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <MtBadge size="xs" variant="default">
                            {item.kind}
                          </MtBadge>
                          {item.required && (
                            <MtBadge size="xs" variant="danger">
                              Requerido
                            </MtBadge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Technicians */}
              {roadmap.assignedTechnicians && roadmap.assignedTechnicians.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--mt-space-md)' }}>
                    <Users size={18} style={{ color: 'var(--mt-info)' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--mt-text-primary)' }}>
                      Técnicos Asignados ({roadmap.assignedTechnicians.length})
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                    {roadmap.assignedTechnicians.map((tech, idx) => (
                      <div key={idx} style={{
                        padding: '8px',
                        background: 'var(--mt-bg-base)',
                        borderRadius: 'var(--mt-radius-sm)',
                        borderLeft: '3px solid var(--mt-info)',
                      }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, marginBottom: '2px', color: 'var(--mt-text-primary)' }}>
                          {tech.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '4px' }}>
                          {tech.code}
                        </p>
                        <MtBadge size="xs" variant="info">
                          {tech.role}
                        </MtBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Spare Parts */}
              {roadmap.requiredSpares && roadmap.requiredSpares.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--mt-space-md)' }}>
                    <Package size={18} style={{ color: 'var(--mt-warning)' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--mt-text-primary)' }}>
                      Refacciones Requeridas ({roadmap.requiredSpares.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {roadmap.requiredSpares.map((spare, idx) => (
                      <div key={idx} style={{
                        padding: '8px',
                        background: 'var(--mt-bg-base)',
                        borderRadius: 'var(--mt-radius-sm)',
                        borderLeft: '3px solid var(--mt-warning)',
                      }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, marginBottom: '2px', color: 'var(--mt-text-primary)' }}>
                          {spare.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                          {spare.code} • Cantidad: {spare.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution History */}
              {roadmap.executionHistory && roadmap.executionHistory.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--mt-space-md)' }}>
                    <Clock size={18} style={{ color: 'var(--mt-accent)' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--mt-text-primary)' }}>
                      Historial de Ejecuciones ({roadmap.executionHistory.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {roadmap.executionHistory.slice(0, 5).map((exec, idx) => (
                      <div key={idx} style={{
                        padding: '8px',
                        background: 'var(--mt-bg-base)',
                        borderRadius: 'var(--mt-radius-sm)',
                        fontSize: '12px',
                      }}>
                        <p style={{ margin: 0, marginBottom: '2px', color: 'var(--mt-text-primary)' }}>
                          {new Date(exec.completedAt).toLocaleDateString('es-MX')}
                        </p>
                        <p style={{ margin: 0, color: 'var(--mt-text-secondary)' }}>
                          Estado: {exec.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <MtButton
                variant="secondary"
                onClick={onClose}
                style={{ width: '100%', marginTop: 'var(--mt-space-lg)' }}
              >
                Cerrar
              </MtButton>
            </div>
          ) : (
            <div style={{
              padding: 'var(--mt-space-3xl)',
              textAlign: 'center',
            }}>
              <AlertCircle size={32} style={{ color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-md)' }} />
              <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                No hay datos disponibles
              </p>
            </div>
          )}
        </div>
      </MtCard>
    </div>
  );
}
