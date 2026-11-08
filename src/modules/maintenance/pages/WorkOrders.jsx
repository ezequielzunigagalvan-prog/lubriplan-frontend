import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { MtButton, MtCard, MtBadge, MtEmpty, MtSkeleton } from '../ui';
import { Plus, Search, AlertTriangle, FileText, Clock, CheckCircle2, Wrench, Pause, XCircle, ChevronRight, Filter } from 'lucide-react';
import '../ui/tokens.css';

const STATUS_CONFIG = {
  REQUESTED: { label: 'Solicitada', color: 'var(--mt-info)', icon: FileText, stage: 1 },
  PENDING_APPROVAL: { label: 'Pendiente Aprobación', color: 'var(--mt-warning)', icon: Clock, stage: 1 },
  APPROVED: { label: 'Aprobada', color: 'var(--mt-info)', icon: CheckCircle2, stage: 2 },
  ASSIGNED: { label: 'Asignada', color: 'var(--mt-accent)', icon: Wrench, stage: 2 },
  IN_PROGRESS: { label: 'En ejecución', color: 'var(--mt-warning)', icon: Wrench, stage: 3 },
  WAITING_PARTS: { label: 'Esperando partes', color: 'var(--mt-warning)', icon: Pause, stage: 3 },
  FINISHED: { label: 'Finalizada', color: 'var(--mt-success)', icon: CheckCircle2, stage: 4 },
  VALIDATED: { label: 'Validada', color: 'var(--mt-success)', icon: CheckCircle2, stage: 5 },
  REJECTED: { label: 'Rechazada', color: 'var(--mt-danger)', icon: XCircle, stage: 0 },
};

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Crítica', color: 'var(--mt-danger)', bg: 'rgba(244, 65, 82, 0.1)' },
  HIGH: { label: 'Alta', color: 'var(--mt-warning)', bg: 'rgba(251, 191, 36, 0.1)' },
  MEDIUM: { label: 'Media', color: 'var(--mt-info)', bg: 'rgba(59, 130, 246, 0.1)' },
  LOW: { label: 'Baja', color: 'var(--mt-accent)', bg: 'rgba(56, 189, 248, 0.1)' },
};

// Mock data - stages
const WORKFLOW_STAGES = [
  { id: 1, name: 'Reportada', color: 'var(--mt-info)' },
  { id: 2, name: 'Aprobada', color: 'var(--mt-accent)' },
  { id: 3, name: 'En Ejecución', color: 'var(--mt-warning)' },
  { id: 4, name: 'Finalizada', color: 'var(--mt-success)' },
  { id: 5, name: 'Validada', color: 'var(--mt-success)' },
];

export default function WorkOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    const load = async () => {
      try {
        // Mock data - replace with API call
        const mockOrders = [
          {
            id: 1,
            type: 'CORRECTIVE',
            status: 'PENDING_APPROVAL',
            priority: 'HIGH',
            title: 'Ruido anormal en bomba principal',
            assetName: 'Bomba Principal',
            assetCode: 'EQ-001',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            reportedBy: 'José López',
            daysOpen: 0.08,
          },
          {
            id: 2,
            type: 'PREVENTIVE',
            status: 'ASSIGNED',
            priority: 'MEDIUM',
            title: 'Mantenimiento preventivo Compresor',
            assetName: 'Compresor de Aire',
            assetCode: 'EQ-003',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            assignedTo: 'Carlos López',
            daysOpen: 1,
          },
          {
            id: 3,
            type: 'CORRECTIVE',
            status: 'IN_PROGRESS',
            priority: 'CRITICAL',
            title: 'Falla en motor principal',
            assetName: 'Motor Línea 01',
            assetCode: 'EQ-002',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            assignedTo: 'Juan Pérez',
            daysOpen: 0.13,
          },
          {
            id: 4,
            type: 'CORRECTIVE',
            status: 'FINISHED',
            priority: 'MEDIUM',
            title: 'Reparación válvula bloqueada',
            assetName: 'Válvula Principal',
            assetCode: 'EQ-004',
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            assignedTo: 'Roberto García',
            daysOpen: 0.21,
          },
          {
            id: 5,
            type: 'PREVENTIVE',
            status: 'VALIDATED',
            priority: 'LOW',
            title: 'Lubricación de rodamientos',
            assetName: 'Bomba Secundaria',
            assetCode: 'EQ-005',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            assignedTo: 'Miguel Torres',
            daysOpen: 1,
          },
        ];
        setOrders(mockOrders);
      } catch (err) {
        setError(err?.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusFilters = [
    'all',
    'REQUESTED',
    'PENDING_APPROVAL',
    'APPROVED',
    'ASSIGNED',
    'IN_PROGRESS',
    'FINISHED',
    'VALIDATED',
  ];

  const filtered = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch =
      String(order.id).toLowerCase().includes(search.toLowerCase()) ||
      (order.title?.toLowerCase?.().includes(search.toLowerCase()) || false) ||
      (order.assetName?.toLowerCase?.().includes(search.toLowerCase()) || false);
    return matchesFilter && matchesSearch;
  });

  const getActionButton = (order) => {
    switch (order.status) {
      case 'REQUESTED':
      case 'PENDING_APPROVAL':
        return { label: 'Revisar', action: 'review', color: 'warning' };
      case 'APPROVED':
        return { label: 'Asignar', action: 'review', color: 'info' };
      case 'ASSIGNED':
        return { label: 'Ejecutar', action: 'execute', color: 'warning' };
      case 'IN_PROGRESS':
      case 'WAITING_PARTS':
        return { label: 'Continuar', action: 'execute', color: 'warning' };
      case 'FINISHED':
        return { label: 'Validar', action: 'validate', color: 'info' };
      default:
        return null;
    }
  };

  const handleAction = (order, action) => {
    if (action === 'review') {
      navigate(`/maintenance/app/work-orders/${order.id}/review`);
    } else if (action === 'execute') {
      navigate(`/maintenance/app/work-orders/${order.id}/execute`);
    } else if (action === 'validate') {
      navigate(`/maintenance/app/work-orders/${order.id}`);
    }
  };

  if (loading) return <MtSkeleton type="card" count={3} />;
  if (error)
    return (
      <MtEmpty
        icon={<AlertTriangle size={40} style={{ color: 'var(--mt-danger)', opacity: 0.6 }} />}
        title="Error"
        description={error}
        action={() => window.location.reload()}
        actionLabel="Reintentar"
      />
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Órdenes de Trabajo
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            {filtered.length} de {orders.length} órdenes
          </p>
        </div>
        <MtButton
          variant="primary"
          size="lg"
          onClick={() => navigate('/maintenance/app/report-failure')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={20} />
          Nueva Orden
        </MtButton>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        {/* Search */}
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
            placeholder="Buscar por #, título o activo..."
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

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', overflowX: 'auto', paddingBottom: 'var(--mt-space-sm)' }}>
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--mt-radius-full)',
                fontWeight: '600',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                border: filter === status ? '2px solid var(--mt-accent)' : '1px solid var(--mt-border)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                background: filter === status ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                color: filter === status ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
              }}
            >
              {status === 'all'
                ? 'Todas'
                : STATUS_CONFIG[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              Pendientes Revisión
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-warning)' }}>
              {orders.filter(o => o.status === 'PENDING_APPROVAL').length}
            </div>
          </div>
        </MtCard>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              En Ejecución
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-accent)' }}>
              {orders.filter(o => o.status === 'IN_PROGRESS').length}
            </div>
          </div>
        </MtCard>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              Finalizadas
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-success)' }}>
              {orders.filter(o => o.status === 'FINISHED' || o.status === 'VALIDATED').length}
            </div>
          </div>
        </MtCard>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <MtCard elevated>
          <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
            <FileText size={48} style={{ color: 'var(--mt-accent)', marginBottom: 'var(--mt-space-md)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
              Sin órdenes
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              No hay órdenes que coincidan con tu búsqueda
            </p>
          </div>
        </MtCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          {filtered.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status];
            const priorityConfig = PRIORITY_CONFIG[order.priority];
            const actionBtn = getActionButton(order);
            const Icon = statusConfig?.icon;

            return (
              <MtCard
                key={order.id}
                elevated
                style={{
                  borderLeft: `4px solid ${statusConfig?.color}`,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                <div
                  style={{
                    padding: 'var(--mt-space-lg)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 'var(--mt-space-lg)',
                  }}
                  onClick={() => navigate(`/maintenance/app/work-orders/${order.id}`)}
                >
                  <div style={{ flex: 1 }}>
                    {/* Top Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--mt-radius-md)',
                          background: statusConfig?.color ? `${statusConfig.color}20` : 'var(--mt-bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {Icon && <Icon size={16} style={{ color: statusConfig?.color }} />}
                      </div>
                      <code
                        style={{
                          background: 'var(--mt-bg-base)',
                          padding: '4px 8px',
                          borderRadius: 'var(--mt-radius-sm)',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'var(--mt-accent)',
                        }}
                      >
                        OT-{String(order.id).padStart(5, '0')}
                      </code>
                      <MtBadge
                        variant={
                          order.priority === 'CRITICAL'
                            ? 'danger'
                            : order.priority === 'HIGH'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {PRIORITY_CONFIG[order.priority]?.label || order.priority}
                      </MtBadge>
                      <MtBadge size="sm">
                        {order.type === 'CORRECTIVE' ? 'Correctiva' : 'Preventiva'}
                      </MtBadge>
                    </div>

                    {/* Title & Asset */}
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        margin: 0,
                        marginBottom: 'var(--mt-space-sm)',
                        color: 'var(--mt-text-primary)',
                      }}
                    >
                      {order.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--mt-text-secondary)',
                        margin: 0,
                        marginBottom: 'var(--mt-space-lg)',
                      }}
                    >
                      {order.assetName} ({order.assetCode})
                    </p>

                    {/* Details Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: 'var(--mt-space-md)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>
                          Estado
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: statusConfig?.color }}>
                          {statusConfig?.label}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>
                          Reportado hace
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                          {order.daysOpen < 1
                            ? `${Math.round(order.daysOpen * 24)} horas`
                            : `${order.daysOpen.toFixed(1)} días`}
                        </div>
                      </div>
                      {order.reportedBy && (
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>
                            Reportado por
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                            {order.reportedBy}
                          </div>
                        </div>
                      )}
                      {order.assignedTo && (
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>
                            Asignado a
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                            {order.assignedTo}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {actionBtn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)' }}>
                      <MtButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(order, actionBtn.action);
                        }}
                        size="sm"
                        variant={actionBtn.color === 'warning' ? 'primary' : 'secondary'}
                      >
                        {actionBtn.label}
                      </MtButton>
                      <ChevronRight size={20} style={{ color: 'var(--mt-text-tertiary)' }} />
                    </div>
                  )}
                </div>
              </MtCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
