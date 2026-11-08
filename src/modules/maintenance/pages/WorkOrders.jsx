import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { MtButton, MtCard, MtBadge, MtEmpty, MtSkeleton } from '../ui';
import { Plus, Search } from 'lucide-react';

const STATUS_LABELS = {
  REQUESTED: 'Solicitada',
  APPROVED: 'Aprobada',
  ASSIGNED: 'Asignada',
  IN_PROGRESS: 'En ejecución',
  WAITING_PARTS: 'Esperando partes',
  FINISHED: 'Finalizada',
  VALIDATED: 'Validada',
  REJECTED: 'Rechazada',
};

const STATUS_VARIANTS = {
  REQUESTED: 'info',
  APPROVED: 'info',
  ASSIGNED: 'warning',
  IN_PROGRESS: 'warning',
  WAITING_PARTS: 'warning',
  FINISHED: 'success',
  VALIDATED: 'success',
  REJECTED: 'danger',
};

const PRIORITY_LABELS = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

const PRIORITY_VARIANTS = {
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

export default function WorkOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await maintenanceApi.getWorkOrders({ limit: 100 });
        setOrders(res?.data || []);
      } catch (err) {
        setError(err?.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <MtSkeleton type="card" count={3} />;
  if (error) return <MtEmpty icon="⚠️" title="Error" description={error} action={() => window.location.reload()} actionLabel="Reintentar" />;
  if (!orders.length) return <MtEmpty icon="📋" title="Sin órdenes" description="No hay órdenes de trabajo" action={() => navigate('/maintenance/app/report-failure')} actionLabel="Crear primera orden" />;

  const statusFilters = ['all', 'REQUESTED', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'FINISHED', 'VALIDATED', 'REJECTED'];

  const filtered = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.status?.toUpperCase() === filter;
    const matchesSearch =
      order.number?.toLowerCase().includes(search.toLowerCase()) ||
      order.title?.toLowerCase().includes(search.toLowerCase()) ||
      order.assetName?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Órdenes de Trabajo
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Gestiona todas las órdenes de mantenimiento
          </p>
        </div>
        <MtButton variant="primary" size="lg" icon={<Plus size={20} />} onClick={() => navigate('/maintenance/app/report-failure')}>
          Nueva Orden
        </MtButton>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar por número, título o activo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px', paddingRight: '12px', padding: '10px 12px 10px 40px', borderRadius: 'var(--mt-radius-md)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', overflowX: 'auto', paddingBottom: 'var(--mt-space-sm)' }}>
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--mt-radius-full)',
                fontWeight: 'var(--mt-font-weight-bold)',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                background: filter === status ? 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))' : 'var(--mt-bg-surface)',
                color: filter === status ? '#fff' : 'var(--mt-text-secondary)',
                boxShadow: filter === status ? '0 4px 12px rgba(56, 189, 248, 0.3)' : 'none',
              }}
            >
              {status === 'all' ? 'Todas' : STATUS_LABELS[status] || status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        {filtered.length === 0 ? (
          <MtCard elevated>
            <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--mt-space-md)' }}>📋</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                Sin órdenes
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                No hay órdenes que coincidan con tu búsqueda
              </p>
            </div>
          </MtCard>
        ) : (
          filtered.map((order) => (
            <MtCard
              key={order.id}
              elevated
              interactive
              onClick={() => navigate(`/maintenance/app/work-orders/${order.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--mt-space-lg)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
                    <code style={{ background: 'var(--mt-bg-surface-2)', padding: '4px 8px', borderRadius: 'var(--mt-radius-sm)', fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-accent)' }}>
                      OT-{String(order.id).padStart(6, '0')}
                    </code>
                    <MtBadge variant={PRIORITY_VARIANTS[order.priority]} size="sm">
                      {PRIORITY_LABELS[order.priority] || order.priority}
                    </MtBadge>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                    {order.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
                    {order.assetName}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--mt-space-lg)' }}>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                        Tipo
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                        {order.type}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                        Estado
                      </p>
                      <MtBadge variant={STATUS_VARIANTS[order.status] || 'default'} size="sm">
                        {STATUS_LABELS[order.status] || order.status}
                      </MtBadge>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                        Creada
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-ES') : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '32px', minWidth: '40px', textAlign: 'center' }}>
                  {order.status === 'WAITING_PARTS' && '⏳'}
                  {order.status === 'IN_PROGRESS' && '⚙️'}
                  {['FINISHED', 'VALIDATED'].includes(order.status) && '✅'}
                  {order.status === 'REJECTED' && '❌'}
                </div>
              </div>
            </MtCard>
          ))
        )}
      </div>
    </div>
  );
}
