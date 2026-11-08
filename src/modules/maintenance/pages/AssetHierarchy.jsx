import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import { ChevronDown, ChevronRight, Building2, Factory, Grid3x3, Zap, Package, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function AssetHierarchy() {
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set(['empresa-1']));
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      const mockData = {
        id: 'empresa-1',
        name: 'TechManufacturing S.A.',
        type: 'EMPRESA',
        icon: 'building',
        children: [
          {
            id: 'planta-1',
            name: 'Planta Jilotepec',
            type: 'PLANTA',
            location: 'Jilotepec, Edo. Mex.',
            icon: 'factory',
            children: [
              {
                id: 'area-1',
                name: 'Producción',
                type: 'AREA',
                icon: 'grid',
                children: [
                  {
                    id: 'linea-1',
                    name: 'Línea 01',
                    type: 'LINEA',
                    icon: 'zap',
                    children: [
                      {
                        id: 'equipo-1',
                        name: 'Molino Principal',
                        type: 'EQUIPO',
                        code: 'EQ-001',
                        criticality: 'A',
                        state: 'OPERATING',
                        manufacturer: 'Siemens',
                        model: 'XYZ-2000',
                        icon: 'package',
                        children: [
                          {
                            id: 'subconj-1',
                            name: 'Motor Eléctrico',
                            type: 'SUBCONJUNTO',
                            code: 'MC-001',
                            icon: 'settings',
                            children: [
                              {
                                id: 'comp-1',
                                name: 'Rodamientos',
                                type: 'COMPONENTE',
                                code: 'RD-001',
                              },
                              {
                                id: 'comp-2',
                                name: 'Bobinado',
                                type: 'COMPONENTE',
                                code: 'BN-001',
                              },
                            ],
                          },
                          {
                            id: 'subconj-2',
                            name: 'Caja de Cambios',
                            type: 'SUBCONJUNTO',
                            code: 'CC-001',
                            icon: 'settings',
                          },
                        ],
                      },
                      {
                        id: 'equipo-2',
                        name: 'Bomba Centrífuga',
                        type: 'EQUIPO',
                        code: 'EQ-002',
                        criticality: 'A',
                        state: 'OPERATING',
                        manufacturer: 'Grundfos',
                        model: 'CR15-08',
                        icon: 'package',
                      },
                    ],
                  },
                  {
                    id: 'linea-2',
                    name: 'Línea 02',
                    type: 'LINEA',
                    icon: 'zap',
                    children: [
                      {
                        id: 'equipo-3',
                        name: 'Compresor de Aire',
                        type: 'EQUIPO',
                        code: 'EQ-003',
                        criticality: 'B',
                        state: 'OPERATING',
                        manufacturer: 'Atlas Copco',
                        model: 'ZR110',
                        icon: 'package',
                      },
                    ],
                  },
                ],
              },
              {
                id: 'area-2',
                name: 'Mantenimiento',
                type: 'AREA',
                icon: 'grid',
                children: [],
              },
            ],
          },
          {
            id: 'planta-2',
            name: 'Planta Toluca',
            type: 'PLANTA',
            location: 'Toluca, Edo. Mex.',
            icon: 'factory',
            children: [],
          },
        ],
      };

      setHierarchy(mockData);
    } catch (error) {
      toast.error('Error cargando jerarquía');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'EMPRESA':
        return Building2;
      case 'PLANTA':
        return Factory;
      case 'AREA':
      case 'LINEA':
        return Grid3x3;
      case 'EQUIPO':
        return Package;
      case 'SUBCONJUNTO':
      case 'COMPONENTE':
        return Settings;
      default:
        return Package;
    }
  };

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'A':
        return 'danger';
      case 'B':
        return 'warning';
      case 'C':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'OPERATING':
        return 'success';
      case 'STOPPED':
        return 'warning';
      case 'OUT_OF_SERVICE':
        return 'danger';
      default:
        return 'default';
    }
  };

  const StateLabel = (state) => {
    switch (state) {
      case 'OPERATING':
        return 'Operando';
      case 'STOPPED':
        return 'Detenido';
      case 'OUT_OF_SERVICE':
        return 'Fuera de servicio';
      default:
        return state;
    }
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const IconComponent = getIcon(node.type);

    return (
      <div key={node.id}>
        <div
          style={{
            paddingLeft: `${level * 24}px`,
            paddingTop: 'var(--mt-space-sm)',
            paddingBottom: 'var(--mt-space-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--mt-space-md)',
            cursor: 'pointer',
            background: selectedAsset?.id === node.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
            borderLeft: selectedAsset?.id === node.id ? '3px solid var(--mt-accent)' : '3px solid transparent',
            transition: 'all 200ms ease',
          }}
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            if (node.type === 'EQUIPO') {
              setSelectedAsset(node);
              navigate(`/maintenance/app/assets/${node.id}`);
            }
          }}
        >
          {/* Expand/Collapse Arrow */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              style={{
                width: '24px',
                height: '24px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isExpanded ? (
                <ChevronDown size={18} style={{ color: 'var(--mt-accent)' }} />
              ) : (
                <ChevronRight size={18} style={{ color: 'var(--mt-text-secondary)' }} />
              )}
            </button>
          ) : (
            <div style={{ width: '24px' }}></div>
          )}

          {/* Icon */}
          <IconComponent size={18} style={{ color: 'var(--mt-accent)', minWidth: '18px' }} />

          {/* Node Content */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '2px' }}>
                {node.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                {node.type}
                {node.code && ` · ${node.code}`}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', alignItems: 'center' }}>
            {node.criticality && (
              <MtBadge
                label={`Crítica ${node.criticality}`}
                variant={getCriticalityColor(node.criticality)}
                size="sm"
              />
            )}
            {node.state && (
              <MtBadge
                label={StateLabel(node.state)}
                variant={getStateColor(node.state)}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando jerarquía de activos...</p>
        </div>
      </MtCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
          🌳 Jerarquía de Activos
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
          Estructura completa de equipos por planta, área y línea
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 'var(--mt-space-lg)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <Building2 size={16} style={{ color: 'var(--mt-accent)' }} />
          <span>Empresa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <Factory size={16} style={{ color: 'var(--mt-accent)' }} />
          <span>Planta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <Grid3x3 size={16} style={{ color: 'var(--mt-accent)' }} />
          <span>Área/Línea</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <Package size={16} style={{ color: 'var(--mt-accent)' }} />
          <span>Equipo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <Settings size={16} style={{ color: 'var(--mt-accent)' }} />
          <span>Componentes</span>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          {hierarchy && renderNode(hierarchy)}
        </div>
      </MtCard>

      {/* Selected Asset Info */}
      {selectedAsset && selectedAsset.type === 'EQUIPO' && (
        <MtCard elevated style={{ background: 'rgba(56, 189, 248, 0.05)', border: '2px solid var(--mt-accent)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--mt-space-lg)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                  {selectedAsset.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                  {selectedAsset.code}
                </p>
              </div>
              <MtButton
                size="sm"
                onClick={() => navigate(`/maintenance/app/assets/${selectedAsset.id}`)}
              >
                Ver Expediente →
              </MtButton>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-lg)' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                  Fabricante
                </p>
                <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                  {selectedAsset.manufacturer}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                  Modelo
                </p>
                <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                  {selectedAsset.model}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                  Estado
                </p>
                <MtBadge
                  label={StateLabel(selectedAsset.state)}
                  variant={getStateColor(selectedAsset.state)}
                  size="sm"
                />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                  Criticidad
                </p>
                <MtBadge
                  label={`Crítica ${selectedAsset.criticality}`}
                  variant={getCriticalityColor(selectedAsset.criticality)}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </MtCard>
      )}

      {/* Info Box */}
      <div style={{ padding: 'var(--mt-space-lg)', background: 'var(--mt-bg-surface)', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)' }}>
        <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
          💡 <strong>Tip:</strong> Click en un equipo para ver su expediente digital completo con historial de mantenimiento, órdenes de trabajo, fotografías y costos acumulados.
        </p>
      </div>
    </div>
  );
}
