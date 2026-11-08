import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { IndustrialButton, IndustrialCard, IndustrialBadge, IndustrialInput } from '../design/IndustrialDesignSystem';
import { MtButton, MtCard, MtBadge, MtPriorityBadge, MtEmpty, MtSkeleton, MtIcon } from '../ui';
import '../ui/tokens.css';
import { Plus, Search, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_BADGES = {
  REQUESTED: { variant: 'info', label: 'Solicitada' },
  APPROVED: { variant: 'info', label: 'Aprobada' },
  ASSIGNED: { variant: 'warning', label: 'Asignada' },
  IN_PROGRESS: { variant: 'warning', label: 'En Ejecución' },
  WAITING_PARTS: { variant: 'warning', label: 'Esperando Partes' },
  FINISHED: { variant: 'success', label: 'Finalizada' },
  VALIDATED: { variant: 'success', label: 'Validada' },
  REJECTED: { variant: 'danger', label: 'Rechazada' },
};

const PRIORITY_BADGES = {
  URGENT: { variant: 'danger', label: 'Urgente' },
  HIGH: { variant: 'warning', label: 'Alta' },
  MEDIUM: { variant: 'info', label: 'Media' },
  LOW: { variant: 'default', label: 'Baja' },
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

  const filtered = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.status?.toUpperCase() === filter;
    const matchesSearch =
      order.number?.toLowerCase().includes(search.toLowerCase()) ||
      order.title?.toLowerCase().includes(search.toLowerCase()) ||
      order.assetName?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusFilters = ['all', 'REQUESTED', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'FINISHED', 'VALIDATED', 'REJECTED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          <p className="text-gray-600 mt-1">Gestiona todas las órdenes de mantenimiento</p>
        </div>
        <IndustrialButton
          variant="primary"
          size="lg"
          icon={<Plus size={20} />}
          onClick={() => navigate('/maintenance/app/report-failure')}
        >
          Nueva Orden
        </IndustrialButton>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <IndustrialInput
          placeholder="Buscar por número, título o activo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all
                ${filter === status
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {status === 'all' ? 'Todas' : STATUS_BADGES[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <IndustrialCard elevated className="p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-gray-900">Sin órdenes</h3>
            <p className="text-gray-600 mt-2">No hay órdenes que coincidan con tu búsqueda</p>
          </IndustrialCard>
        ) : (
          filtered.map((order) => (
            <IndustrialCard
              key={order.id}
              elevated
              className="p-6 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/maintenance/app/work-orders/${order.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-bold text-cyan-600">
                      OT-{String(order.id).padStart(6, '0')}
                    </code>
                    <IndustrialBadge
                      label={PRIORITY_BADGES[order.priority]?.label || order.priority}
                      variant={PRIORITY_BADGES[order.priority]?.variant || 'default'}
                      size="sm"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{order.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{order.assetName}</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Tipo</p>
                      <p className="text-sm font-semibold text-gray-900">{order.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Estado</p>
                      <div className="mt-1">
                        <IndustrialBadge
                          label={STATUS_BADGES[order.status]?.label || order.status}
                          variant={STATUS_BADGES[order.status]?.variant || 'default'}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Creada</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('es-ES')
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {order.status === 'WAITING_PARTS' && (
                    <div className="text-2xl">⏳</div>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <div className="text-2xl animate-pulse">⚙️</div>
                  )}
                  {['FINISHED', 'VALIDATED'].includes(order.status) && (
                    <div className="text-2xl">✅</div>
                  )}
                  {order.status === 'REJECTED' && (
                    <div className="text-2xl">❌</div>
                  )}
                </div>
              </div>
            </IndustrialCard>
          ))
        )}
      </div>
    </div>
  );
}
