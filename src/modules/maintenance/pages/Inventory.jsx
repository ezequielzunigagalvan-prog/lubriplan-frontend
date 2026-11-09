import { useState } from 'react';
import { MtCard, MtButton, MtBadge } from '../ui';
import { Plus, Search, Package, Building2, AlertTriangle, DollarSign, ChevronDown, ChevronUp, Edit2, Trash2, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function Inventory() {
  // Unified data structure: Warehouses with integrated Spare Parts
  const [warehouses] = useState([
    {
      id: 1,
      name: 'Almacén Principal',
      location: 'Planta Jilotepec',
      status: 'OPTIMAL',
      lastUpdated: '2026-11-08 14:30',
      spareParts: [
        { id: 'SP-001', code: 'SP-001', name: 'Sello mecánico bomba', sku: 'SEAL-MECH-001', qty: 5, minQty: 10, criticalQty: 2, unit: 'pz', price: 85.50, supplier: 'Hidrolub', category: 'Sellos', location: 'Estante A-01', lastMovement: '2026-11-05', notes: 'Para bomba principal' },
        { id: 'SP-002', code: 'SP-002', name: 'Correa trapecial', sku: 'BELT-TRAP-005', qty: 12, minQty: 20, criticalQty: 5, unit: 'm', price: 45.00, supplier: 'Industrial', category: 'Correas', location: 'Estante B-03', lastMovement: '2026-11-06', notes: 'Diversos diámetros' },
        { id: 'SP-003', code: 'SP-003', name: 'Aceite ISO 68', sku: 'OIL-ISO68-200L', qty: 100, minQty: 50, criticalQty: 25, unit: 'L', price: 12.50, supplier: 'Castrol', category: 'Lubricantes', location: 'Tanque T-01', lastMovement: '2026-11-03', notes: 'Lubricante industrial' },
      ],
    },
    {
      id: 2,
      name: 'Stock de Emergencia',
      location: 'Planta Toluca',
      status: 'LOW',
      lastUpdated: '2026-11-07 09:15',
      spareParts: [
        { id: 'SP-004', code: 'SP-004', name: 'Rodamiento 6205-2RS', sku: 'BEAR-6205-01', qty: 8, minQty: 15, criticalQty: 3, unit: 'pz', price: 28.75, supplier: 'SKF', category: 'Rodamientos', location: 'Estante C-02', lastMovement: '2026-11-04', notes: 'Repuesto crítico' },
        { id: 'SP-005', code: 'SP-005', name: 'Filtro hidráulico', sku: 'FILT-HYD-250', qty: 3, minQty: 10, criticalQty: 1, unit: 'pz', price: 156.00, supplier: 'Bosch', category: 'Filtros', location: 'Estante D-01', lastMovement: '2026-10-28', notes: 'CRÍTICO - Bajo stock' },
      ],
    },
    {
      id: 3,
      name: 'Repuestos Críticos',
      location: 'Sala de Bombeo',
      status: 'OPTIMAL',
      lastUpdated: '2026-11-08 11:45',
      spareParts: [
        { id: 'SP-006', code: 'SP-006', name: 'Sello mecánico 40mm', sku: 'SEAL-MECH-40', qty: 6, minQty: 8, criticalQty: 2, unit: 'pz', price: 95.00, supplier: 'Hidrolub', category: 'Sellos', location: 'Caja 001', lastMovement: '2026-11-07', notes: 'Para bomba secundaria' },
      ],
    },
  ]);

  const [search, setSearch] = useState('');
  const [expandedWarehouseId, setExpandedWarehouseId] = useState(null);
  const [expandedPartId, setExpandedPartId] = useState(null);
  const [viewMode, setViewMode] = useState('by-warehouse'); // 'by-warehouse' or 'all-parts'

  // Calculate total inventory stats
  const allSpareParts = warehouses.flatMap((wh) => wh.spareParts.map((p) => ({ ...p, warehouseId: wh.id })));

  const filteredWarehouses = warehouses.filter((wh) =>
    wh.name?.toLowerCase().includes(search.toLowerCase()) ||
    wh.location?.toLowerCase().includes(search.toLowerCase()) ||
    wh.spareParts.some(p =>
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const filteredSpareParts = allSpareParts.filter((p) =>
    p.code?.toLowerCase().includes(search.toLowerCase()) ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = allSpareParts.length;
  const totalValue = allSpareParts.reduce((sum, p) => sum + (p.qty * p.price), 0);
  const lowStockItems = allSpareParts.filter((p) => p.qty < p.minQty).length;
  const criticalStockItems = allSpareParts.filter((p) => p.qty < p.criticalQty).length;
  const warehousesWithLowStock = warehouses.filter((wh) =>
    wh.spareParts.some((p) => p.qty < p.minQty)
  ).length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Inventario & Refacciones
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Gestión completa de almacenes y stock de refacciones
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
          <MtButton variant="secondary" size="lg" icon={<Plus size={20} />} onClick={() => console.log('Create warehouse')}>
            Nuevo Almacén
          </MtButton>
          <MtButton variant="primary" size="lg" icon={<Plus size={20} />} onClick={() => console.log('Create part')}>
            Nueva Refacción
          </MtButton>
        </div>
      </div>

      {/* Alerts for Critical Stock */}
      {criticalStockItems > 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--mt-radius-md)', padding: 'var(--mt-space-lg)', display: 'flex', gap: 'var(--mt-space-md)' }}>
          <AlertCircle size={24} style={{ color: 'var(--mt-danger)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-danger)', margin: 0, marginBottom: '4px' }}>
              ⚠️ ALERTA CRÍTICA: {criticalStockItems} refacciones bajo nivel crítico
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              Requieren reposición inmediata para evitar paros de producción
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Refacciones
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
              <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: lowStockItems > 0 ? 'var(--mt-warning)' : 'var(--mt-success)' }}>
                {lowStockItems}
              </p>
            </div>
            <div style={{ width: '40px', height: '40px', background: lowStockItems > 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} style={{ color: lowStockItems > 0 ? 'var(--mt-warning)' : 'var(--mt-success)' }} />
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                CRÍTICOS
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: criticalStockItems > 0 ? 'var(--mt-danger)' : 'var(--mt-success)' }}>
                {criticalStockItems}
              </p>
            </div>
            <div style={{ width: '40px', height: '40px', background: criticalStockItems > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} style={{ color: criticalStockItems > 0 ? 'var(--mt-danger)' : 'var(--mt-success)' }} />
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Valor Total
              </p>
              <p style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
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
      <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar por código, nombre, SKU o proveedor..."
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
      </div>

      {/* Warehouses & Spare Parts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        {filteredWarehouses.length === 0 ? (
          <MtCard elevated>
            <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-lg)' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={32} style={{ color: 'var(--mt-accent)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                  Sin resultados
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                  No hay almacenes o refacciones que coincidan con tu búsqueda
                </p>
              </div>
            </div>
          </MtCard>
        ) : (
          filteredWarehouses.map((warehouse) => {
            const isExpanded = expandedWarehouseId === warehouse.id;
            const warehousePartsCount = warehouse.spareParts.length;
            const warehouseLowStockCount = warehouse.spareParts.filter((p) => p.qty < p.minQty).length;
            const warehouseCriticalCount = warehouse.spareParts.filter((p) => p.qty < p.criticalQty).length;
            const warehouseValue = warehouse.spareParts.reduce((sum, p) => sum + (p.qty * p.price), 0);

            return (
              <div key={warehouse.id}>
                {/* Warehouse Header */}
                <MtCard elevated style={{ borderLeft: warehouseLowStockCount > 0 ? '4px solid var(--mt-danger)' : '4px solid var(--mt-success)' }}>
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
                            {warehouse.status}
                          </MtBadge>
                          <MtBadge variant="info" size="sm">
                            {warehousePartsCount} refacciones
                          </MtBadge>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                          📍 {warehouse.location}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
                      <div style={{ textAlign: 'right', fontSize: '12px' }}>
                        <p style={{ margin: 0, fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-text-secondary)' }}>Valor</p>
                        <p style={{ margin: 0, fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-success)' }}>{formatCurrency(warehouseValue)}</p>
                      </div>
                      <button
                        onClick={() => setExpandedWarehouseId(isExpanded ? null : warehouse.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--mt-text-secondary)' }}
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Spare Parts List */}
                  {isExpanded && (
                    <div style={{ marginTop: 'var(--mt-space-lg)', paddingTop: 'var(--mt-space-lg)', borderTop: '1px solid var(--mt-border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                        {warehouse.spareParts.map((part) => {
                          const isCritical = part.qty < part.criticalQty;
                          const isLow = part.qty < part.minQty;
                          const isExpandedPart = expandedPartId === part.id;
                          const stockPercentage = (part.qty / part.minQty) * 100;

                          return (
                            <div key={part.id} style={{ background: 'var(--mt-bg-surface)', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-md)', overflow: 'hidden' }}>
                              <div
                                onClick={() => setExpandedPartId(isExpandedPart ? null : part.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--mt-space-md)',
                                  padding: 'var(--mt-space-md)',
                                  cursor: 'pointer',
                                  background: isCritical ? 'rgba(239, 68, 68, 0.05)' : isLow ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                                  borderLeft: isCritical ? '3px solid var(--mt-danger)' : isLow ? '3px solid var(--mt-warning)' : '3px solid var(--mt-success)',
                                }}
                              >
                                {/* Part Icon */}
                                <div style={{ width: '36px', height: '36px', background: isCritical ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Package size={18} style={{ color: 'var(--mt-accent)' }} />
                                </div>

                                {/* Part Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <code style={{ background: 'var(--mt-bg-surface-2)', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold', color: 'var(--mt-accent)' }}>
                                      {part.code}
                                    </code>
                                    {isCritical && <MtBadge variant="danger" size="xs">CRÍTICO</MtBadge>}
                                    {isLow && !isCritical && <MtBadge variant="warning" size="xs">BAJO</MtBadge>}
                                    <MtBadge variant="info" size="xs">{part.category}</MtBadge>
                                  </div>
                                  <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{part.name}</p>
                                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: '2px 0 0 0' }}>SKU: {part.sku}</p>
                                </div>

                                {/* Stock Status */}
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <div style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-black)', color: isCritical ? 'var(--mt-danger)' : isLow ? 'var(--mt-warning)' : 'var(--mt-accent)' }}>
                                    {part.qty} {part.unit}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', fontWeight: 'bold' }}>
                                    Min: {part.minQty} {part.unit}
                                  </div>
                                </div>

                                {/* Expand Icon */}
                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--mt-text-secondary)' }}>
                                  {isExpandedPart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>

                              {/* Expanded Part Details */}
                              {isExpandedPart && (
                                <div style={{ padding: 'var(--mt-space-lg)', borderTop: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface-2)' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--mt-space-lg)', marginBottom: 'var(--mt-space-lg)' }}>
                                    <div>
                                      <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>Stock Actual</p>
                                      <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: isCritical ? 'var(--mt-danger)' : 'var(--mt-accent)' }}>{part.qty}</p>
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>Mínimo</p>
                                      <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{part.minQty}</p>
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>CRÍTICO</p>
                                      <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--mt-danger)' }}>{part.criticalQty}</p>
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>Precio Unit.</p>
                                      <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{formatCurrency(part.price)}</p>
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>Valor Total</p>
                                      <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--mt-success)' }}>{formatCurrency(part.qty * part.price)}</p>
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>Proveedor</p>
                                      <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>{part.supplier}</p>
                                    </div>
                                  </div>

                                  {/* Progress Bar */}
                                  <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Ocupación vs Mínimo</span>
                                      <span style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>{Math.round(stockPercentage)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'var(--mt-bg-surface)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
                                      <div
                                        style={{
                                          height: '100%',
                                          background: isCritical ? 'var(--mt-danger)' : isLow ? 'var(--mt-warning)' : 'var(--mt-success)',
                                          width: `${Math.min(stockPercentage, 100)}%`,
                                          transition: 'width 300ms ease',
                                        }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Additional Info */}
                                  <div style={{ padding: 'var(--mt-space-md)', background: 'var(--mt-bg-surface)', borderRadius: 'var(--mt-radius-md)', marginBottom: 'var(--mt-space-lg)' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '4px' }}>📍 Ubicación: <strong>{part.location}</strong></p>
                                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '4px' }}>🕐 Último movimiento: <strong>{part.lastMovement}</strong></p>
                                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>📝 {part.notes}</p>
                                  </div>

                                  {/* Action Buttons */}
                                  <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
                                    <MtButton variant="secondary" size="sm" icon={<Edit2 size={14} />}>
                                      Editar
                                    </MtButton>
                                    <MtButton variant="secondary" size="sm" icon={<Trash2 size={14} />}>
                                      Eliminar
                                    </MtButton>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </MtCard>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
