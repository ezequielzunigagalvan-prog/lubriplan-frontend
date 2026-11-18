import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { MtButton, MtCard, MtBadge, MtEmpty, MtSkeleton } from '../ui';
import { Plus, Search, AlertTriangle, FileText, Clock, CheckCircle2, Wrench, Pause, XCircle, ChevronRight, Filter } from 'lucide-react';
import '../ui/tokens.css';

const STATUS_CONFIG = {
  REQUESTED: { label: 'Solicitada', color: 'var(--mt-info)', icon: FileText, stage: 1 },
  APPROVED: { label: 'Aprobada', color: 'var(--mt-info)', icon: CheckCircle2, stage: 2 },
  ASSIGNED: { label: 'Asignada', color: 'var(--mt-accent)', icon: Wrench, stage: 2 },
  IN_PROGRESS: { label: 'En ejecución', color: 'var(--mt-warning)', icon: Wrench, stage: 3 },
  WAITING_PARTS: { label: 'Esperando partes', color: 'var(--mt-warning)', icon: Pause, stage: 3 },
  WAITING_PRODUCTION: { label: 'Esperando producción', color: 'var(--mt-warning)', icon: Clock, stage: 3 },
  FINISHED: { label: 'Finalizada', color: 'var(--mt-success)', icon: CheckCircle2, stage: 4 },
  VALIDATED: { label: 'Validada', color: 'var(--mt-success)', icon: CheckCircle2, stage: 5 },
  REJECTED: { label: 'Rechazada', color: 'var(--mt-danger)', icon: XCircle, stage: 0 },
  CANCELLED: { label: 'Cancelada', color: 'var(--mt-text-tertiary)', icon: XCircle, stage: 0 },
};

const TYPE_LABELS = { CORRECTIVE: 'Correctiva', PREVENTIVE: 'Preventiva', INSPECTION: 'Inspección' };

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Crítica', color: 'var(--mt-danger)', bg: 'rgba(244, 65, 82, 0.1)' },
  HIGH: { label: 'Alta', color: 'var(--mt-warning)', bg: 'rgba(251, 191, 36, 0.1)' },
  MEDIUM: { label: 'Media', color: 'var(--mt-info)', bg: 'rgba(59, 130, 246, 0.1)' },
  LOW: { label: 'Baja', color: 'var(--mt-accent)', bg: 'rgba(56, 189, 248, 0.1)' },
};

export default function WorkOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await maintenanceApi.getWorkOrders({ limit: 200 });
        const orders = res?.data || [];

        const formattedOrders = orders.map(order => ({
          ...order,
          numberLabel: `OT-${String(order.number).padStart(5, '0')}`,
          assetName: order.asset?.name || null,
          assetCode: order.asset?.code || null,
          reportedBy: order.requester?.name || null,
          assignedName: order.assignee?.name || null,
          daysOpen: order.createdAt ? (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0,
        }));

        setOrders(formattedOrders);
        setCounts(res?.countsByStatus || {});
      } catch (err) {
        console.error('Error loading work orders:', err);
        setError(err?.message || 'Error al cargar órdenes de trabajo');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusFilters = [
    'all',
    'REQUESTED',
    'APPROVED',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_PARTS',
    'WAITING_PRODUCTION',
    'FINISHED',
    'VALIDATED',
    'REJECTED',
    'CANCELLED',
  ];
  const countOf = (...statuses) => statuses.reduce((sum, st) => sum + (counts[st] || 0), 0);

  const term = search.trim().toLowerCase();
  const filtered = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch =
      !term ||
      order.numberLabel.toLowerCase().includes(term) ||
      String(order.number) === term.replace(/^ot-?0*/, '') ||
      order.title?.toLowerCase().includes(term) ||
      order.assetName?.toLowerCase().includes(term) ||
      order.assetCode?.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const getActionButton = (order) => {
    switch (order.status) {
      case 'REQUESTED':
        return { label: 'Revisar', color: 'warning' };
      case 'APPROVED':
        return { label: 'Asignar', color: 'info' };
      case 'ASSIGNED':
        return { label: 'Ejecutar', color: 'warning' };
      case 'IN_PROGRESS':
      case 'WAITING_PARTS':
      case 'WAITING_PRODUCTION':
        return { label: 'Continuar', color: 'warning' };
      case 'FINISHED':
        return { label: 'Validar', color: 'info' };
      default:
        return null;
    }
  };

  // Todas las acciones (revisar, asignar, ejecutar, validar) se hacen en el detalle de la OT
  const handleAction = (order) => navigate(`/maintenance/app/work-orders/${order.id}`);

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
              {status !== 'all' && counts[status] ? ` (${counts[status]})` : ''}
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
              {countOf('REQUESTED')}
            </div>
          </div>
        </MtCard>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              En Ejecución
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-accent)' }}>
              {countOf('IN_PROGRESS', 'WAITING_PARTS', 'WAITING_PRODUCTION')}
            </div>
          </div>
        </MtCard>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>
              Finalizadas
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-success)' }}>
              {countOf('FINISHED', 'VALIDATED')}
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
                        {order.numberLabel}
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
                        {TYPE_LABELS[order.type] || order.type}
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
                      {order.assetName ? `${order.assetName} (${order.assetCode})` : 'Sin activo'}
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
                      {order.assignedName && (
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>
                            Asignado a
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                            {order.assignedName}
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
                          handleAction(order);
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
