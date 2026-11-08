import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { Edit2, Trash2, Eye, Search, Zap, Package, Cog } from 'lucide-react';
import { toast } from 'sonner';

const CRITICALITY_COLORS = {
  A: { badge: 'danger', label: 'Crítica', icon: '🔴', bg: 'rgba(244, 65, 82, 0.1)' },
  B: { badge: 'warning', label: 'Moderada', icon: '🟡', bg: 'rgba(251, 191, 36, 0.1)' },
  C: { badge: 'info', label: 'Baja', icon: '🟢', bg: 'rgba(59, 130, 246, 0.1)' },
};

const STATUS_COLORS = {
  OPERATING: { badge: 'success', label: 'Operando', icon: '✅', color: 'var(--mt-success)' },
  STOPPED: { badge: 'warning', label: 'Detenido', icon: '⏸️', color: 'var(--mt-warning)' },
  OUT_OF_SERVICE: { badge: 'danger', label: 'Fuera de Servicio', icon: '🔴', color: 'var(--mt-danger)' },
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
      {/* Premium Search Bar */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, var(--mt-bg-surface) 0%, var(--mt-bg-surface-2) 100%)',
        borderRadius: 'var(--mt-radius-lg)',
        border: '1px solid var(--mt-border)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--mt-space-md)'
      }}>
        <Search size={18} style={{ color: 'var(--mt-text-tertiary)' }} />
        <input
          type="text"
          placeholder="Buscar por código, nombre o ubicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--mt-text-primary)',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mt-text-secondary)',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <MtCard elevated>
          <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--mt-space-md)' }}>📦</div>
            <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
              No hay activos
            </h3>
            <p style={{ color: 'var(--mt-text-secondary)', margin: 0, fontSize: '13px' }}>
              {search ? 'No coinciden con tu búsqueda' : 'Crea tu primer activo para comenzar'}
            </p>
          </div>
        </MtCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              style={{
                background: 'linear-gradient(135deg, var(--mt-bg-surface) 0%, var(--mt-bg-surface-2) 100%)',
                borderRadius: 'var(--mt-radius-lg)',
                border: '1px solid var(--mt-border)',
                overflow: 'hidden',
                transition: 'all 300ms ease',
                cursor: 'pointer',
                transform: 'translateY(0)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                ':hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(56, 189, 248, 0.2)',
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(56, 189, 248, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Card Header - Color Bar */}
              <div style={{
                height: '4px',
                background: `linear-gradient(90deg, var(--mt-accent), var(--mt-accent-strong))`,
              }}></div>

              {/* Card Content */}
              <div style={{ padding: 'var(--mt-space-lg)' }}>
                {/* Top Section: Name & Badges */}
                <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-sm)' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--mt-radius-md)',
                      background: CRITICALITY_COLORS[asset.criticality]?.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}>
                      {CRITICALITY_COLORS[asset.criticality]?.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                        {asset.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                        {asset.code}
                      </p>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', flexWrap: 'wrap' }}>
                    <MtBadge variant={CRITICALITY_COLORS[asset.criticality]?.badge} size="sm">
                      {CRITICALITY_COLORS[asset.criticality]?.label}
                    </MtBadge>
                    <MtBadge variant={STATUS_COLORS[asset.status]?.badge} size="sm">
                      {STATUS_COLORS[asset.status]?.label}
                    </MtBadge>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--mt-space-md)',
                  marginBottom: 'var(--mt-space-lg)',
                  paddingBottom: 'var(--mt-space-lg)',
                  borderBottom: '1px solid var(--mt-border)',
                }}>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                      Ubicación
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, color: 'var(--mt-text-primary)' }}>
                      {asset.location || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                      Modelo
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, color: 'var(--mt-text-primary)' }}>
                      {asset.model || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {asset.notes && (
                  <div style={{
                    padding: 'var(--mt-space-md)',
                    background: 'var(--mt-bg-base)',
                    borderRadius: 'var(--mt-radius-sm)',
                    marginBottom: 'var(--mt-space-lg)',
                    borderLeft: '2px solid var(--mt-accent)',
                  }}>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {asset.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
                  <button
                    onClick={() => navigate(`/maintenance/app/assets/${asset.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      borderRadius: 'var(--mt-radius-md)',
                      border: '1px solid var(--mt-accent)',
                      cursor: 'pointer',
                      color: 'var(--mt-accent)',
                      fontWeight: 'var(--mt-font-weight-bold)',
                      fontSize: '12px',
                      transition: 'all 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                    title="Ver expediente"
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(56, 189, 248, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(56, 189, 248, 0.1)';
                    }}
                  >
                    <Eye size={14} />
                    Ver
                  </button>
                  <button
                    onClick={() => onEditClick?.(asset)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'transparent',
                      borderRadius: 'var(--mt-radius-md)',
                      border: '1px solid var(--mt-border)',
                      cursor: 'pointer',
                      color: 'var(--mt-text-secondary)',
                      fontWeight: 'var(--mt-font-weight-bold)',
                      fontSize: '12px',
                      transition: 'all 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                    title="Editar"
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--mt-bg-surface-2)';
                      e.target.style.borderColor = 'var(--mt-accent)';
                      e.target.style.color = 'var(--mt-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = 'var(--mt-border)';
                      e.target.style.color = 'var(--mt-text-secondary)';
                    }}
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    disabled={deleting === asset.id}
                    style={{
                      width: '40px',
                      padding: '8px',
                      background: deleting === asset.id ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                      borderRadius: 'var(--mt-radius-md)',
                      border: '1px solid var(--mt-border)',
                      cursor: deleting === asset.id ? 'not-allowed' : 'pointer',
                      color: 'var(--mt-danger)',
                      opacity: deleting === asset.id ? 0.6 : 1,
                      transition: 'all 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Eliminar"
                    onMouseEnter={(e) => {
                      if (deleting !== asset.id) {
                        e.target.style.background = 'rgba(244, 65, 82, 0.1)';
                        e.target.style.borderColor = 'var(--mt-danger)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = 'var(--mt-border)';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default AssetsList;
