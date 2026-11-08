import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { Edit2, Trash2, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';

const CRITICALITY_COLORS = {
  A: { badge: 'danger', label: 'Crítica' },
  B: { badge: 'warning', label: 'Moderada' },
  C: { badge: 'info', label: 'Baja' },
};

const STATUS_COLORS = {
  OPERATING: { badge: 'success', label: 'Operando' },
  STOPPED: { badge: 'warning', label: 'Detenido' },
  OUT_OF_SERVICE: { badge: 'danger', label: 'Fuera de Servicio' },
};

const AssetsList = forwardRef(function AssetsList({ onEditClick, onRefresh }, ref) {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useImperativeHandle(ref, () => ({
    reload: loadAssets,
  }));

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await maintenanceApi.getAssets();
      setAssets(response?.data || []);
    } catch (error) {
      toast.error('Error cargando activos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este activo?')) {
      return;
    }

    try {
      setDeleting(id);
      await maintenanceApi.deleteAsset(id);
      toast.success('Activo eliminado');
      loadAssets();
      onRefresh?.();
    } catch (error) {
      toast.error('Error al eliminar: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.code.toLowerCase().includes(search.toLowerCase()) ||
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando activos...</p>
        </div>
      </MtCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar por código, nombre o ubicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '40px',
            padding: '10px 12px 10px 40px',
            borderRadius: 'var(--mt-radius-md)',
          }}
        />
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <MtCard elevated>
          <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)', fontSize: '48px', marginBottom: 'var(--mt-space-md)' }}>
            📦
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', marginBottom: 'var(--mt-space-sm)', margin: 0 }}>
            No hay activos
          </h3>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>
            Crea tu primer activo para comenzar
          </p>
        </MtCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          {filteredAssets.map((asset) => (
            <MtCard key={asset.id} elevated>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--mt-space-lg)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 'var(--mt-space-md)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', marginBottom: 'var(--mt-space-xs)', margin: 0 }}>
                      {asset.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      Código: {asset.code}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--mt-space-lg)', marginTop: 'var(--mt-space-lg)', marginBottom: 'var(--mt-space-lg)' }}>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-xs)', margin: 0 }}>
                        Ubicación
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                        {asset.location || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-xs)', margin: 0 }}>
                        Criticidad
                      </p>
                      <MtBadge variant={CRITICALITY_COLORS[asset.criticality]?.badge} size="sm">
                        {CRITICALITY_COLORS[asset.criticality]?.label}
                      </MtBadge>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-xs)', margin: 0 }}>
                        Estado
                      </p>
                      <MtBadge variant={STATUS_COLORS[asset.status]?.badge} size="sm">
                        {STATUS_COLORS[asset.status]?.label}
                      </MtBadge>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-xs)', margin: 0 }}>
                        Modelo
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                        {asset.model || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {asset.notes && (
                    <div style={{ padding: 'var(--mt-space-md)', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-sm)', border: '1px solid var(--mt-border)', marginTop: 'var(--mt-space-lg)' }}>
                      <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                        {asset.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)', marginLeft: 'var(--mt-space-lg)' }}>
                  <button
                    onClick={() => navigate(`/maintenance/app/assets/${asset.id}`)}
                    style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-sm)', border: 'none', cursor: 'pointer', color: 'var(--mt-accent)', transition: 'background 150ms ease' }}
                    title="Ver detalles"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEditClick?.(asset)}
                    style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-sm)', border: 'none', cursor: 'pointer', color: 'var(--mt-accent)', transition: 'background 150ms ease' }}
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    disabled={deleting === asset.id}
                    style={{ padding: '8px', background: deleting === asset.id ? 'rgba(0,0,0,0.2)' : 'rgba(248, 113, 113, 0.1)', borderRadius: 'var(--mt-radius-sm)', border: 'none', cursor: deleting === asset.id ? 'not-allowed' : 'pointer', color: 'var(--mt-danger)', opacity: deleting === asset.id ? 0.6 : 1, transition: 'background 150ms ease' }}
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </MtCard>
          ))}
        </div>
      )}
    </div>
  );
});

export default AssetsList;
