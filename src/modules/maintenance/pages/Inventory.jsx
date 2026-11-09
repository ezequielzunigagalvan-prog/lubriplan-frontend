import { useState } from 'react';
import { MtCard, MtButton, MtBadge } from '../ui';
import { Plus, Search } from 'lucide-react';

export default function Inventory() {
  const [warehouses] = useState([
    { id: 1, name: 'Almacén Principal', location: 'Planta A', items: 247, value: 125000, status: 'OPTIMAL' },
    { id: 2, name: 'Stock de Emergencia', location: 'Planta B', items: 45, value: 18500, status: 'LOW' },
    { id: 3, name: 'Repuestos Críticos', location: 'Sala de Bombeo', items: 23, value: 42000, status: 'OPTIMAL' },
  ]);

  const [search, setSearch] = useState('');

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Items en Stock
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                {totalItems}
              </p>
            </div>
            <div style={{ fontSize: '32px', opacity: 0.2 }}>📦</div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Almacenes
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                {warehouses.length}
              </p>
            </div>
            <div style={{ fontSize: '32px', opacity: 0.2 }}>🏭</div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Stock Bajo
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: lowStockWarehouses > 0 ? 'var(--mt-warning)' : 'var(--mt-success)' }}>
                {lowStockWarehouses}
              </p>
            </div>
            <div style={{ fontSize: '32px', opacity: 0.2 }}>⚠️</div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Valor Total
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div style={{ fontSize: '32px', opacity: 0.2 }}>💰</div>
          </div>
        </MtCard>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar almacén por nombre o ubicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', paddingLeft: '40px', padding: '10px 12px 10px 40px', borderRadius: 'var(--mt-radius-md)' }}
        />
      </div>

      {/* Warehouses List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        {filtered.length === 0 ? (
          <MtCard elevated>
            <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--mt-space-md)' }}>🏭</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                Sin almacenes
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                No hay almacenes que coincidan con tu búsqueda
              </p>
            </div>
          </MtCard>
        ) : (
          filtered.map((warehouse) => {
            const itemsPercentage = (warehouse.items / 300) * 100;
            const isLowStock = warehouse.status === 'LOW';

            return (
              <MtCard key={warehouse.id} elevated style={{ borderLeft: isLowStock ? '4px solid var(--mt-danger)' : '4px solid var(--mt-success)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--mt-space-lg)', marginBottom: 'var(--mt-space-lg)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-sm)' }}>
                      <span style={{ fontSize: '24px' }}>🏢</span>
                      <h3 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                        {warehouse.name}
                      </h3>
                      <MtBadge variant={warehouse.status === 'OPTIMAL' ? 'success' : 'danger'} size="sm">
                        {warehouse.status === 'OPTIMAL' ? 'Óptimo' : 'Stock Bajo'}
                      </MtBadge>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {warehouse.location}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mt-space-lg)' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                      Items
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                      {warehouse.items}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                      Valor Inventario
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                      {formatCurrency(warehouse.value)}
                    </p>
                  </div>
                  <div style={{ gridColumn: 'span 1', minWidth: '140px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                      Ocupación
                    </p>
                    <div style={{ width: '100%', height: '8px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden', marginBottom: 'var(--mt-space-xs)' }}>
                      <div
                        style={{
                          height: '100%',
                          background: itemsPercentage > 80 ? 'var(--mt-accent)' : 'var(--mt-success)',
                          width: `${Math.min(itemsPercentage, 100)}%`,
                          transition: 'width 300ms ease',
                        }}
                      ></div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {Math.round(itemsPercentage)}% full
                    </p>
                  </div>
                </div>
              </MtCard>
            );
          })
        )}
      </div>
    </div>
  );
}
