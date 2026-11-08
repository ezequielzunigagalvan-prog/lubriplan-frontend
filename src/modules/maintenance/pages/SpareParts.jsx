import { useState } from 'react';
import { MtCard, MtButton, MtBadge } from '../ui';
import { Plus, Search, AlertTriangle } from 'lucide-react';

export default function SpareParts() {
  const [parts] = useState([
    { id: 1, code: 'SP-001', name: 'Sello mecánico bomba', qty: 5, minQty: 10, unit: 'pz', supplier: 'Hidrolub', category: 'Sellos' },
    { id: 2, code: 'SP-002', name: 'Correa trapecial', qty: 12, minQty: 20, unit: 'm', supplier: 'Industrial', category: 'Correas' },
    { id: 3, code: 'SP-003', name: 'Aceite ISO 68', qty: 100, minQty: 50, unit: 'L', supplier: 'Castrol', category: 'Lubricantes' },
  ]);
  const [search, setSearch] = useState('');

  const filtered = parts.filter((part) =>
    part.code.toLowerCase().includes(search.toLowerCase()) ||
    part.name.toLowerCase().includes(search.toLowerCase()) ||
    part.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockParts = filtered.filter((p) => p.qty < p.minQty);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Refacciones y Repuestos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Gestiona tu catálogo de partes y componentes
          </p>
        </div>
        <MtButton variant="primary" size="lg" icon={<Plus size={20} />} onClick={() => console.log('Create spare part')}>
          Nueva Refacción
        </MtButton>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar por código, nombre o proveedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', paddingLeft: '40px', padding: '10px 12px 10px 40px', borderRadius: 'var(--mt-radius-md)' }}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <MtCard elevated>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--mt-space-md)', padding: 'var(--mt-space-lg)', background: 'rgba(251, 146, 60, 0.1)', borderRadius: 'var(--mt-radius-md)', border: '1px solid rgba(251, 146, 60, 0.2)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--mt-warning)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-warning)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                {lowStockParts.length} refacciones con stock bajo
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                Requieren reposición inmediata
              </p>
            </div>
          </div>
        </MtCard>
      )}

      {/* Parts Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        {filtered.length === 0 ? (
          <MtCard elevated>
            <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--mt-space-md)' }}>🔧</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                Sin refacciones
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                No hay refacciones que coincidan con tu búsqueda
              </p>
            </div>
          </MtCard>
        ) : (
          filtered.map((part) => {
            const isLowStock = part.qty < part.minQty;
            return (
              <MtCard key={part.id} elevated style={{ borderLeft: isLowStock ? '4px solid var(--mt-warning)' : '4px solid var(--mt-success)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--mt-space-lg)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
                      <code style={{ background: 'var(--mt-bg-surface-2)', padding: '4px 8px', borderRadius: 'var(--mt-radius-sm)', fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-accent)' }}>
                        {part.code}
                      </code>
                      <MtBadge variant="info" size="sm">
                        {part.category}
                      </MtBadge>
                      {isLowStock && <MtBadge variant="danger" size="sm">Stock Bajo</MtBadge>}
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
                      {part.name}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--mt-space-lg)' }}>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                          Stock Actual
                        </p>
                        <p style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: isLowStock ? 'var(--mt-warning)' : 'var(--mt-accent)' }}>
                          {part.qty} <span style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>{part.unit}</span>
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                          Mínimo
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                          {part.minQty} {part.unit}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                          Proveedor
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                          {part.supplier}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isLowStock && <div style={{ fontSize: '32px' }}>⚠️</div>}
                </div>
              </MtCard>
            );
          })
        )}
      </div>
    </div>
  );
}
