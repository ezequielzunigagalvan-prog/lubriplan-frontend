import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndustrialCard,
  IndustrialButton,
  IndustrialBadge,
  IndustrialInput,
} from '../design/IndustrialDesignSystem';
import { maintenanceApi } from '../services/maintenanceApi';
import { Edit2, Trash2, Eye, Plus, Search } from 'lucide-react';
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
      <IndustrialCard className="p-12 text-center">
        <div className="inline-block animate-spin">⚙️</div>
        <p className="mt-4 text-gray-600">Cargando activos...</p>
      </IndustrialCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <IndustrialInput
        placeholder="Buscar por código, nombre o ubicación..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={18} />}
      />

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <IndustrialCard elevated className="p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-bold text-gray-900">No hay activos</h3>
          <p className="text-gray-600 mt-2">Crea tu primer activo para comenzar</p>
        </IndustrialCard>
      ) : (
        <div className="grid gap-4">
          {filteredAssets.map((asset) => (
            <IndustrialCard key={asset.id} elevated className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{asset.name}</h3>
                      <p className="text-sm text-gray-600">Código: {asset.code}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Ubicación</p>
                      <p className="text-sm font-semibold text-gray-900">{asset.location || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Criticidad</p>
                      <div className="mt-1">
                        <IndustrialBadge
                          label={CRITICALITY_COLORS[asset.criticality]?.label}
                          variant={CRITICALITY_COLORS[asset.criticality]?.badge}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Estado</p>
                      <div className="mt-1">
                        <IndustrialBadge
                          label={STATUS_COLORS[asset.status]?.label}
                          variant={STATUS_COLORS[asset.status]?.badge}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Modelo</p>
                      <p className="text-sm font-semibold text-gray-900">{asset.model || '—'}</p>
                    </div>
                  </div>

                  {asset.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">{asset.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/maintenance/app/assets/${asset.id}`)}
                    className="p-2 hover:bg-cyan-50 rounded-lg text-cyan-600 transition-colors"
                    title="Ver detalles"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEditClick?.(asset)}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    disabled={deleting === asset.id}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </IndustrialCard>
          ))}
        </div>
      )}
    </div>
  );
});

export default AssetsList;
