import { useState } from 'react';
import { MtCard, MtButton, MtBadge } from '../ui';
import { Plus, Search, Package, Building2, AlertTriangle, DollarSign, ChevronDown, ChevronUp, Edit2, MoreVertical, TrendingUp } from 'lucide-react';

export default function Inventory() {
  const [warehouses] = useState([
    { id: 1, name: 'Almacén Principal', location: 'Planta Jilotepec', items: 247, maxItems: 300, value: 125000, status: 'OPTIMAL', lastUpdated: '2026-11-08 14:30' },
    { id: 2, name: 'Stock de Emergencia', location: 'Planta Toluca', items: 45, maxItems: 100, value: 18500, status: 'LOW', lastUpdated: '2026-11-07 09:15' },
    { id: 3, name: 'Repuestos Críticos', location: 'Sala de Bombeo', items: 23, maxItems: 50, value: 42000, status: 'OPTIMAL', lastUpdated: '2026-11-08 11:45' },
  ]);

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = warehouses.filter((wh) =>
    wh.name?.toLowerCase().includes(search.toLowerCase()) ||
    wh.location?.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = warehouses.reduce((sum, wh) => sum + wh.items, 0);
  const totalValue = warehouses.reduce((sum, wh) => sum + wh.value, 0);
  const lowStockWarehouses = warehouses.filter((wh) => wh.status === 'LOW').length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Inventario de Almacenes
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Monitorea el stock en todos tus almacenes
          </p>
        </div>
        <MtButton variant="primary" size="lg" icon={<Plus size={20} />} onClick={() => console.log('Create warehouse')}>
          Nuevo Almacén
        </MtButton>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Items en Stock
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                {totalItems}
              </p>
            </div>
            <div style={{ width: '40px', height: '40px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} style={{ color: 'var(--mt-accent)' }} />
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Almacenes
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                {warehouses.length}
              </p>
            </div>
            <div style={{ width: '40px', height: '40px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} style={{ color: 'var(--mt-accent)' }} />
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Stock Bajo
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: lowStockWarehouses > 0 ? 'var(--mt-warning)' : 'var(--mt-success)' }}>
                {lowStockWarehouses}
              </p>
            </div>
            <div style={{ width: '40px', height: '40px', background: lowStockWarehouses > 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} style={{ color: lowStockWarehouses > 0 ? 'var(--mt-warning)' : 'var(--mt-success)' }} />
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Valor Total
              </p>
              <p style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div style={{ width: '40px', height: '40px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} style={{ color: 'var(--mt-success)' }} />
            </div>
          </div>
        </MtCard>
      </div>

      {/* Search & Filter */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar almacén por nombre o ubicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 40px',
            borderRadius: 'var(--mt-radius-md)',
            border: '1px solid var(--mt-border)',
            background: 'var(--mt-bg-surface)',
            color: 'var(--mt-text-primary)',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Warehouses List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        {filtered.length === 0 ? (
          <MtCard elevated>
            <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-lg)' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={32} style={{ color: 'var(--mt-accent)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                  Sin almacenes
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                  No hay almacenes que coincidan con tu búsqueda
                </p>
              </div>
            </div>
          </MtCard>
        ) : (
          filtered.map((warehouse) => {
            const itemsPercentage = (warehouse.items / warehouse.maxItems) * 100;
            const isLowStock = warehouse.status === 'LOW';
            const isExpanded = expandedId === warehouse.id;

            return (
              <MtCard key={warehouse.id} elevated style={{ borderLeft: isLowStock ? '4px solid var(--mt-danger)' : '4px solid var(--mt-success)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--mt-space-lg)' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--mt-space-lg)' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={20} style={{ color: 'var(--mt-accent)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-xs)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                          {warehouse.name}
                        </h3>
                        <MtBadge variant={warehouse.status === 'OPTIMAL' ? 'success' : 'danger'} size="sm">
                          {warehouse.status === 'OPTIMAL' ? 'Óptimo' : 'Stock Bajo'}
                        </MtBadge>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                        {warehouse.location}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '2px' }}>
                        Ocupación
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                        {Math.round(itemsPercentage)}%
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : warehouse.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--mt-text-secondary)',
                        transition: 'all 200ms ease'
                      }}
                      title={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ marginTop: 'var(--mt-space-lg)', paddingTop: 'var(--mt-space-lg)', borderTop: '1px solid var(--mt-border)' }}>
                    {/* Progress Bar */}
                    <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--mt-space-sm)' }}>
                        <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-text-secondary)', margin: 0 }}>
                          Ocupación del almacén
                        </p>
                        <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-text-secondary)', margin: 0 }}>
                          {warehouse.items} / {warehouse.maxItems} items
                        </p>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: itemsPercentage > 90 ? 'var(--mt-danger)' : itemsPercentage > 75 ? 'var(--mt-warning)' : 'var(--mt-success)',
                            width: `${Math.min(itemsPercentage, 100)}%`,
                            transition: 'width 300ms ease',
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mt-space-lg)' }}>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                          Total de Items
                        </p>
                        <p style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                          {warehouse.items}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                          Valor Total
                        </p>
                        <p style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, color: 'var(--mt-success)' }}>
                          {formatCurrency(warehouse.value)}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                          Última Actualización
                        </p>
                        <p style={{ fontSize: '12px', margin: 0, color: 'var(--mt-text-secondary)' }}>
                          {warehouse.lastUpdated}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                          Valor por Item
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                          {formatCurrency(warehouse.value / warehouse.items)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--mt-space-md)', marginTop: 'var(--mt-space-lg)' }}>
                      <MtButton variant="secondary" size="sm" icon={<Edit2 size={16} />}>
                        Editar
                      </MtButton>
                      <MtButton variant="secondary" size="sm" icon={<TrendingUp size={16} />}>
                        Ver Movimientos
                      </MtButton>
                    </div>
                  </div>
                )}
              </MtCard>
            );
          })
        )}
      </div>
    </div>
  );
}
