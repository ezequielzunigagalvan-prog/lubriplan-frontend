import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import { ChevronDown, ChevronRight, Factory, Grid3x3, Zap, Package, Settings, Cog, TreePine, Lightbulb, Search } from 'lucide-react';
import { maintenanceApi } from '../services/maintenanceApi';
import { ASSET_LEVEL_LABELS, ASSET_STATUS_INFO, ASSET_CRITICALITY_INFO } from '../constants/maintenance';

const LEVEL_ICONS = {
  AREA: Grid3x3,
  LINE: Zap,
  EQUIPMENT: Package,
  SUBASSEMBLY: Settings,
  COMPONENT: Cog,
};

/** Devuelve el subárbol que coincide con la búsqueda (conserva los ancestros de cada coincidencia). */
function filterTree(nodes, term) {
  if (!term) return nodes;
  const t = term.toLowerCase();
  return nodes
    .map((node) => {
      const children = filterTree(node.children, term);
      const match = node.code.toLowerCase().includes(t) || node.name.toLowerCase().includes(t);
      return match || children.length ? { ...node, children: match ? node.children : children } : null;
    })
    .filter(Boolean);
}

function collectIds(nodes, acc = []) {
  for (const n of nodes) {
    if (n.children.length) {
      acc.push(n.id);
      collectIds(n.children, acc);
    }
  }
  return acc;
}

export default function AssetHierarchy() {
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceApi.getAssetHierarchy();
      setHierarchy(data);
      // Primer nivel abierto por defecto
      setExpandedNodes(new Set(data.roots.filter((r) => r.children.length).map((r) => r.id)));
    } catch (err) {
      console.error('[AssetHierarchy] Error loading hierarchy:', err);
      setError(err?.message || 'No se pudo cargar la jerarquía');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  const visibleRoots = useMemo(() => filterTree(hierarchy?.roots || [], search.trim()), [hierarchy, search]);
  // Con búsqueda activa se expande todo lo visible para mostrar las coincidencias
  const expanded = useMemo(() => (search.trim() ? new Set(collectIds(visibleRoots)) : expandedNodes), [search, visibleRoots, expandedNodes]);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const setAll = (open) => setExpandedNodes(open ? new Set(collectIds(hierarchy?.roots || [])) : new Set());

  const renderNode = (node, level = 0) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;
    const IconComponent = LEVEL_ICONS[node.level] || Package;
    const crit = ASSET_CRITICALITY_INFO[node.criticality];
    const status = ASSET_STATUS_INFO[node.status];
    const isSelected = selectedAsset?.id === node.id;

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
            background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
            borderLeft: isSelected ? '3px solid var(--mt-accent)' : '3px solid transparent',
            transition: 'all 200ms ease',
          }}
          onClick={() => setSelectedAsset(node)}
          onDoubleClick={() => navigate(`/maintenance/app/assets/${node.id}`)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              aria-label={isExpanded ? 'Contraer' : 'Expandir'}
              style={{ width: '24px', height: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isExpanded ? <ChevronDown size={18} style={{ color: 'var(--mt-accent)' }} /> : <ChevronRight size={18} style={{ color: 'var(--mt-text-secondary)' }} />}
            </button>
          ) : (
            <div style={{ width: '24px' }} />
          )}

          <IconComponent size={18} style={{ color: 'var(--mt-accent)', minWidth: '18px' }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '2px' }}>{node.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: 0 }}>
              {ASSET_LEVEL_LABELS[node.level] || node.level} · {node.code}
              {hasChildren && ` · ${node.children.length} hijo(s)`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', alignItems: 'center' }}>
            {crit && <MtBadge variant={crit.badge} size="sm">{crit.label}</MtBadge>}
            {status && <MtBadge variant={status.badge} size="sm">{status.label}</MtBadge>}
          </div>
        </div>

        {hasChildren && isExpanded && <div>{node.children.map((child) => renderNode(child, level + 1))}</div>}
      </div>
    );
  };

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>
            <Settings size={32} style={{ color: 'var(--mt-accent)' }} />
          </div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando jerarquía de activos...</p>
        </div>
      </MtCard>
    );
  }

  if (error) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <p style={{ color: 'var(--mt-danger)', margin: 0, fontWeight: 'var(--mt-font-weight-bold)' }}>{error}</p>
          <MtButton onClick={loadHierarchy}>Reintentar</MtButton>
        </div>
      </MtCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--mt-space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-sm)' }}>
            <TreePine size={32} style={{ color: 'var(--mt-accent)' }} />
            <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>Jerarquía de Activos</h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            {hierarchy.plant.name} · {hierarchy.total} activo(s)
          </p>
        </div>
        <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/assets')}>Ir al catálogo</MtButton>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 'var(--mt-space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-md)', padding: '8px 12px', background: 'var(--mt-bg-surface)' }}>
          <Search size={16} style={{ color: 'var(--mt-text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--mt-text-primary)', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>
        <MtButton variant="secondary" size="sm" onClick={() => setAll(true)} disabled={Boolean(search)}>Expandir todo</MtButton>
        <MtButton variant="secondary" size="sm" onClick={() => setAll(false)} disabled={Boolean(search)}>Contraer todo</MtButton>
      </div>

      {/* Hierarchy Tree */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', paddingBottom: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-sm)', borderBottom: '1px solid var(--mt-border)' }}>
            <Factory size={18} style={{ color: 'var(--mt-accent)' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)' }}>{hierarchy.plant.name}</p>
          </div>
          {hierarchy.total === 0 && (
            <p style={{ margin: 0, padding: 'var(--mt-space-lg)', textAlign: 'center', fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>
              Aún no hay activos. Créalos en el catálogo y asígnales un "Activo padre" para armar la jerarquía.
            </p>
          )}
          {hierarchy.total > 0 && visibleRoots.length === 0 && (
            <p style={{ margin: 0, padding: 'var(--mt-space-lg)', textAlign: 'center', fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>
              Ningún activo coincide con "{search}".
            </p>
          )}
          {visibleRoots.map((root) => renderNode(root))}
        </div>
      </MtCard>

      {/* Selected Asset Info */}
      {selectedAsset && (
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', borderLeft: '3px solid var(--mt-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--mt-space-lg)', gap: 'var(--mt-space-md)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>{selectedAsset.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                  {selectedAsset.code} · {ASSET_LEVEL_LABELS[selectedAsset.level] || selectedAsset.level}
                </p>
              </div>
              <MtButton size="sm" onClick={() => navigate(`/maintenance/app/assets/${selectedAsset.id}`)}>Ver expediente →</MtButton>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-lg)' }}>
              {[
                ['Fabricante', selectedAsset.manufacturer],
                ['Modelo', selectedAsset.model],
                ['Ubicación', selectedAsset.location],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, color: value ? 'var(--mt-text-primary)' : 'var(--mt-text-tertiary)' }}>{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </MtCard>
      )}

      {/* Info Box */}
      <div style={{ padding: 'var(--mt-space-lg)', background: 'var(--mt-bg-surface)', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', display: 'flex', gap: 'var(--mt-space-md)' }}>
        <Lightbulb size={18} style={{ color: 'var(--mt-accent)', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
          <strong>Tip:</strong> Click en un activo para ver su ficha; doble click para abrir su expediente. Para mover un activo de lugar, edítalo en el catálogo y cambia su "Activo padre".
        </p>
      </div>
    </div>
  );
}
