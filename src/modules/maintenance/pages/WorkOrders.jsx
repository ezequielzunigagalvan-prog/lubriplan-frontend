import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { MtButton, MtCard, MtBadge, MtPriorityBadge, MtEmpty, MtSkeleton, MtIcon } from '../ui';
import '../ui/tokens.css';

const STATE_COLORS = {
  OPEN: 'accent',
  IN_PROGRESS: 'warning',
  CLOSED: 'success',
  CANCELLED: 'neutral',
};

export default function WorkOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

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

  const filtered = filter === 'all' ? orders : orders.filter(o => o.state?.toUpperCase() === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['all', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--mt-border)',
              background: filter === f ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: filter === f ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              transition: 'all 150ms ease',
            }}
          >
            {f === 'all' ? 'Todas' : f === 'OPEN' ? 'Abiertas' : f === 'IN_PROGRESS' ? 'En ejecución' : 'Cerradas'}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map((order) => (
          <MtCard
            key={order.id}
            interactive
            elevated
            onClick={() => navigate(`/maintenance/app/work-orders/${order.id}`)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--mt-accent)' }}>
                  OT-{String(order.id).padStart(6, '0')}
                </div>
                <MtPriorityBadge priority={order.priority} short size="sm" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{order.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>{order.assetName}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <MtBadge variant={STATE_COLORS[order.state?.toUpperCase()] || 'neutral'} dot size="sm">
                  {order.state}
                </MtBadge>
              </div>
            </div>
          </MtCard>
        ))}
      </div>
    </div>
  );
}
