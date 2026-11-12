import { useState, useEffect } from 'react';
import { MtCard, MtButton, MtBadge } from '../ui';
import { Plus, Search, Package, Building2, AlertTriangle, DollarSign, ChevronDown, ChevronUp, Edit2, Trash2, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { maintenanceApi } from '../services/maintenanceApi';
import { httpDelete } from '../../../services/http';

export default function Inventory() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedWarehouseId, setExpandedWarehouseId] = useState(null);
  const [expandedPartId, setExpandedPartId] = useState(null);
  const [viewMode, setViewMode] = useState('by-warehouse');

  // Cargar almacenes y stock desde API
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usar maintenanceApi que incluye autenticación automáticamente
        const warehousesData = await maintenanceApi.getWarehouses();

        // Si no es array, convertir a array
        if (!Array.isArray(warehousesData)) {
          console.warn('Datos no son array, convirtiéndolos a []');
          setWarehouses([]);
          return;
        }

        // Para cada almacén, cargar su stock
        // El backend ya retorna sparePart incluido en cada stock
        const warehousesWithStock = await Promise.all(
          warehousesData.map(async (warehouse) => {
            try {
              const stock = await maintenanceApi.getWarehouseStock(warehouse.id);

              const enrichedStock = (Array.isArray(stock) ? stock : []).map(s => {
                // El stock ya viene con sparePart incluido del backend
                const part = s.sparePart || {};
                return {
                  id: s.sparePartId || s.id,
                  stockId: s.id,
                  qty: s.quantity || 0,
                  minQty: part.minStock || 10,
                  criticalQty: Math.floor((part.minStock || 10) / 3),
                  code: part.code || 'N/A',
                  name: part.name || 'Sin nombre',
                  sku: part.id || '',
                  unit: part.unit || 'pz',
                  price: part.costPerUnit || 0,
                  category: part.category || '',
                  supplier: '',
                  location: '',
                  lastMovement: new Date().toISOString().split('T')[0],
                  notes: '',
                };
              });
              return { ...warehouse, spareParts: enrichedStock };
            } catch (err) {
              console.warn(`Error cargando stock para almacén ${warehouse.id}:`, err);
              return { ...warehouse, spareParts: [] };
            }
          })
        );

        setWarehouses(warehousesWithStock);
      } catch (err) {
        console.error('Error cargando inventario:', err);
        // Mostrar mensaje de error y usar datos demo
        console.warn('Usando datos demo porque el backend no está disponible');
        setError(`⚠️ ${err.message || 'Backend no disponible'} - Mostrando datos de demostración`);

        // Cargar datos demo para que el usuario pueda ver la interfaz
        setWarehouses([
          {
            id: 1,
            name: 'Almacén Principal (DEMO)',
            location: 'Planta Jilotepec',
            status: 'OPTIMAL',
            spareParts: [
              { id: 'SP-001', code: 'SP-001', name: 'Sello mecánico bomba', sku: 'SEAL-MECH-001', qty: 5, minQty: 10, criticalQty: 2, unit: 'pz', price: 85.50, supplier: 'Hidrolub', category: 'Sellos', location: 'Estante A-01', lastMovement: '2026-11-05', notes: 'Para bomba principal' },
              { id: 'SP-002', code: 'SP-002', name: 'Correa trapecial', sku: 'BELT-TRAP-005', qty: 12, minQty: 20, criticalQty: 5, unit: 'm', price: 45.00, supplier: 'Industrial', category: 'Correas', location: 'Estante B-03', lastMovement: '2026-11-06', notes: 'Diversos diámetros' },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Estados para modales
  const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
  const [showCreatePartModal, setShowCreatePartModal] = useState(false);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [selectedPartForEdit, setSelectedPartForEdit] = useState(null);
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [selectedPartForMovements, setSelectedPartForMovements] = useState(null);

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

  const handleDeletePart = async (partId) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta refacción?')) {
      try {
        // Usar httpDelete directamente
        await httpDelete(`/maintenance/spare-parts/${partId}`);
        alert('Refacción eliminada exitosamente');
        // Recargar inventario
        window.location.reload();
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert('Error al eliminar la refacción: ' + err.message);
      }
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--mt-border)', borderTopColor: 'var(--mt-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--mt-text-secondary)' }}>Cargando inventario...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Mostrar error (pero permitir seguir usando la página con datos demo)
  // El error ahora se muestra como alerta, no bloquea la interfaz

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
          <MtButton variant="secondary" size="lg" icon={<Plus size={20} />} onClick={() => setShowCreateWarehouseModal(true)}>
            Nuevo Almacén
          </MtButton>
          <MtButton variant="primary" size="lg" icon={<Plus size={20} />} onClick={() => setShowCreatePartModal(true)}>
            Nueva Refacción
          </MtButton>
        </div>
      </div>

      {/* Alerts for API Error or Critical Stock */}
      {error && (
        <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 'var(--mt-radius-md)', padding: 'var(--mt-space-lg)', display: 'flex', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-lg)' }}>
          <AlertTriangle size={24} style={{ color: 'var(--mt-warning)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-warning)', margin: 0, marginBottom: '4px' }}>
              {error.includes('Backend') ? '🔌 Conexión Backend' : '⚠️ Advertencia'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              {error}
            </p>
            {error.includes('Backend') && (
              <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: '8px 0 0 0' }}>
                💡 Tip: Verifica que el backend esté corriendo con: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 4px' }}>npm run dev</code>
              </p>
            )}
          </div>
        </div>
      )}

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
                                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '4px' }}>Último movimiento: <strong>{part.lastMovement}</strong></p>
                                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>📝 {part.notes}</p>
                                  </div>

                                  {/* Action Buttons */}
                                  <div style={{ display: 'flex', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
                                    <MtButton variant="secondary" size="sm" icon={<Clock size={14} />} onClick={() => {
                                      setSelectedPartForMovements(part);
                                      setShowMovementsModal(true);
                                    }}>
                                      Historial
                                    </MtButton>
                                    <MtButton variant="secondary" size="sm" icon={<Edit2 size={14} />} onClick={() => {
                                      setSelectedPartForEdit(part);
                                      setShowEditPartModal(true);
                                    }}>
                                      Editar
                                    </MtButton>
                                    <MtButton variant="secondary" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDeletePart(part.id)}>
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

      {/* Modal Crear Almacén */}
      {showCreateWarehouseModal && (
        <WarehouseModal
          onClose={() => setShowCreateWarehouseModal(false)}
          onSuccess={async () => {
            setShowCreateWarehouseModal(false);
            // Recargar inventario sin reload
            try {
              const [warehousesData, spareParts] = await Promise.all([
                maintenanceApi.getWarehouses(),
                maintenanceApi.getSpareParts()
              ]);
              if (Array.isArray(warehousesData)) {
                const sparePartsMap = {};
                if (Array.isArray(spareParts)) {
                  spareParts.forEach(part => {
                    sparePartsMap[part.id] = part;
                  });
                }
                const warehousesWithStock = await Promise.all(
                  warehousesData.map(async (wh) => {
                    try {
                      const stock = await maintenanceApi.getWarehouseStock(wh.id);
                      const enrichedStock = (Array.isArray(stock) ? stock : []).map(s => {
                        const sparePart = sparePartsMap[s.sparePartId] || s;
                        return {
                          ...s,
                          ...sparePart,
                          id: s.sparePartId || s.id,
                          qty: s.quantity || s.qty || 0,
                          minQty: s.minStock || s.minQty || 10,
                          price: sparePart?.costPerUnit || s.price || 0,
                          code: sparePart?.code || s.code || 'N/A',
                          name: sparePart?.name || s.name || 'Sin nombre',
                          unit: sparePart?.unit || s.unit || 'pz',
                        };
                      });
                      return { ...wh, spareParts: enrichedStock };
                    } catch {
                      return { ...wh, spareParts: [] };
                    }
                  })
                );
                setWarehouses(warehousesWithStock);
              }
            } catch (err) {
              console.error('Error recargando:', err);
            }
          }}
        />
      )}

      {/* Modal Crear Refacción */}
      {showCreatePartModal && (
        <SparePartModal
          warehouses={warehouses}
          onClose={() => setShowCreatePartModal(false)}
          onSuccess={async () => {
            setShowCreatePartModal(false);
            // Recargar inventario sin reload
            try {
              const warehousesData = await maintenanceApi.getWarehouses();
              if (Array.isArray(warehousesData)) {
                const warehousesWithStock = await Promise.all(
                  warehousesData.map(async (wh) => {
                    try {
                      const stock = await maintenanceApi.getWarehouseStock(wh.id);
                      return { ...wh, spareParts: Array.isArray(stock) ? stock : [] };
                    } catch {
                      return { ...wh, spareParts: [] };
                    }
                  })
                );
                setWarehouses(warehousesWithStock);
              }
            } catch (err) {
              console.error('Error recargando:', err);
            }
          }}
        />
      )}

      {/* Modal Editar Refacción */}
      {showEditPartModal && selectedPartForEdit && (
        <SparePartModal
          warehouses={warehouses}
          part={selectedPartForEdit}
          onClose={() => {
            setShowEditPartModal(false);
            setSelectedPartForEdit(null);
          }}
          onSuccess={async () => {
            setShowEditPartModal(false);
            setSelectedPartForEdit(null);
            // Recargar inventario sin reload
            try {
              const warehousesData = await maintenanceApi.getWarehouses();
              if (Array.isArray(warehousesData)) {
                const warehousesWithStock = await Promise.all(
                  warehousesData.map(async (wh) => {
                    try {
                      const stock = await maintenanceApi.getWarehouseStock(wh.id);
                      return { ...wh, spareParts: Array.isArray(stock) ? stock : [] };
                    } catch {
                      return { ...wh, spareParts: [] };
                    }
                  })
                );
                setWarehouses(warehousesWithStock);
              }
            } catch (err) {
              console.error('Error recargando:', err);
            }
          }}
        />
      )}
    </div>
  );
}

// Modal para crear/editar almacenes
function WarehouseModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      await maintenanceApi.createWarehouse(formData);
      onSuccess();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al crear almacén: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '500px', maxHeight: '95vh', background: 'var(--mt-bg-surface)', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--mt-text-primary)' }}>Nuevo Almacén</h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Crear un nuevo almacén para gestionar inventario</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--mt-text-secondary)', padding: '8px', transition: 'all 150ms' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--mt-text-primary)' }}>Nombre del Almacén *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Almacén Principal"
                style={{ width: '100%', padding: '12px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', background: 'var(--mt-bg-surface)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--mt-text-primary)' }}>Ubicación *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Planta Jilotepec"
                style={{ width: '100%', padding: '12px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', background: 'var(--mt-bg-surface)' }}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface-2)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <MtButton variant="secondary" onClick={onClose} disabled={loading}>Cancelar</MtButton>
          <MtButton variant="primary" onClick={() => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true }))} disabled={loading}>
            {loading ? 'Creando...' : 'Crear Almacén'}
          </MtButton>
        </div>
      </div>
    </div>
  );
}

// Modal para crear/editar refacciones
function SparePartModal({ warehouses, part, onClose, onSuccess }) {
  const [formData, setFormData] = useState(part ? {
    code: part.code,
    name: part.name,
    description: part.description || '',
    category: part.category || '',
    brand: part.brand || '',
    partNumber: part.partNumber || part.sku || '',
    unit: part.unit || 'pz',
    warehouseId: '',
    initialQuantity: part.qty || 0,
    minStock: part.minQty || 10,
    maxStock: part.maxStock || part.minQty * 2 || 20,
    costPerUnit: part.price || 0,
  } : {
    code: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    partNumber: '',
    unit: 'pz',
    warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
    initialQuantity: 0,
    minStock: 10,
    maxStock: 20,
    costPerUnit: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.warehouseId) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      if (part) {
        await maintenanceApi.updateSparePart(part.id, formData);
      } else {
        // Crear refacción
        const newPart = await maintenanceApi.createSparePart(formData);

        // Crear stock en el almacén seleccionado con cantidad inicial
        if (formData.initialQuantity > 0 && newPart?.id) {
          await maintenanceApi.createStock({
            warehouseId: formData.warehouseId,
            sparePartId: newPart.id,
            quantity: formData.initialQuantity,
            minStock: formData.minStock,
            maxStock: formData.maxStock,
          });
        }
      }
      onSuccess();
    } catch (err) {
      console.error('Error:', err);
      alert(`Error al ${part ? 'actualizar' : 'crear'} refacción: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '650px', maxHeight: '95vh', background: 'var(--mt-bg-surface)', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--mt-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--mt-bg-surface-2)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--mt-text-primary)' }}>
              {part ? 'Editar Refacción' : 'Nueva Refacción'}
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
              {part ? `ID: ${part.code}` : 'Completa los campos requeridos (*)'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--mt-text-secondary)', padding: '8px', transition: 'all 150ms' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>×</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Código *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="SP-001"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sello mecánico"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Categoría</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Sellos"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Marca</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Hidrolub"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Número de Parte</label>
            <input
              type="text"
              value={formData.partNumber}
              onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
              placeholder="SEAL-001"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Unidad</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            >
              <option value="pz">Pieza</option>
              <option value="m">Metro</option>
              <option value="L">Litro</option>
              <option value="kg">Kilogramo</option>
              <option value="ft">Pie</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Almacén *</label>
            <select
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
              required
            >
              <option value="">-- Selecciona un almacén --</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.location})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Cantidad Inicial</label>
            <input
              type="number"
              value={formData.initialQuantity}
              onChange={(e) => setFormData({ ...formData, initialQuantity: parseInt(e.target.value) || 0 })}
              placeholder="0"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Stock Mínimo</label>
            <input
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Stock Máximo</label>
            <input
              type="number"
              value={formData.maxStock}
              onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Costo por Unidad</label>
            <input
              type="number"
              value={formData.costPerUnit}
              onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
              placeholder="0.00"
              step="0.01"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción adicional..."
              style={{ width: '100%', padding: '10px', border: '1px solid var(--mt-border)', borderRadius: '8px', boxSizing: 'border-box', minHeight: '80px' }}
            />
          </div>

        </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface-2)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <MtButton variant="secondary" onClick={onClose} disabled={loading}>Cancelar</MtButton>
          <MtButton variant="primary" onClick={() => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true }))} disabled={loading}>
            {loading ? 'Guardando...' : (part ? 'Actualizar' : 'Crear')}
          </MtButton>
        </div>
      </div>
    </div>
  );
}

// Modal para ver historial de movimientos
function MovementsModal({ part, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true);
        const data = await maintenanceApi.getStockMovementHistory(part.id, 50);
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando movimientos:', err);
        setMovements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [part.id]);

  const getMovementIcon = (type) => {
    switch (type) {
      case 'IN': return '';
      case 'OUT': return '';
      case 'TRANSFER': return '';
      case 'ADJUST': return '';
      default: return '📝';
    }
  };

  const getMovementColor = (type) => {
    switch (type) {
      case 'IN': return 'var(--mt-success)';
      case 'OUT': return 'var(--mt-danger)';
      case 'TRANSFER': return 'var(--mt-accent)';
      case 'ADJUST': return 'var(--mt-warning)';
      default: return 'var(--mt-text-secondary)';
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '700px', maxHeight: '95vh', background: 'var(--mt-bg-surface)', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--mt-text-primary)' }}>Historial de Movimientos</h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
              <strong>{part.code}</strong> · {part.name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--mt-text-secondary)', padding: '8px', transition: 'all 150ms' }} onMouseEnter={(e) => e.target.style.color = 'var(--mt-text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--mt-text-secondary)'}>×</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--mt-border)', borderTopColor: 'var(--mt-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando movimientos...</p>
            </div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Clock size={48} style={{ color: 'var(--mt-text-tertiary)', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--mt-text-secondary)', margin: 0 }}>Sin historial</p>
              <p style={{ fontSize: '13px', color: 'var(--mt-text-tertiary)', margin: 0 }}>No hay movimientos registrados para este stock</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {movements.map((movement, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  border: `2px solid ${getMovementColor(movement.type)}20`,
                  borderRadius: '10px',
                  background: `${getMovementColor(movement.type)}08`,
                  transition: 'all 150ms',
                  cursor: 'default'
                }} onMouseEnter={(e) => { e.currentTarget.style.background = `${getMovementColor(movement.type)}12`; e.currentTarget.style.borderColor = `${getMovementColor(movement.type)}40`; }} onMouseLeave={(e) => { e.currentTarget.style.background = `${getMovementColor(movement.type)}08`; e.currentTarget.style.borderColor = `${getMovementColor(movement.type)}20`; }}>
                  <div style={{ fontSize: '28px', minWidth: '32px', textAlign: 'center' }}>
                    {getMovementIcon(movement.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: getMovementColor(movement.type) }}>
                        {movement.type === 'IN' ? 'Entrada' : movement.type === 'OUT' ? 'Salida' : movement.type === 'TRANSFER' ? 'Transferencia' : 'Ajuste'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', fontWeight: '500' }}>
                        {new Date(movement.createdAt).toLocaleString('es-ES')}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '16px 24px', fontSize: '13px', marginBottom: '8px' }}>
                      <div>
                        <span style={{ color: 'var(--mt-text-secondary)', fontSize: '12px' }}>Cantidad:</span>
                        <div style={{ fontWeight: '700', color: getMovementColor(movement.type), fontSize: '15px' }}>{movement.quantity} {part.unit}</div>
                      </div>
                      {movement.notes && (
                        <div>
                          <span style={{ color: 'var(--mt-text-secondary)', fontSize: '12px' }}>Nota:</span>
                          <div style={{ fontWeight: '500', color: 'var(--mt-text-primary)' }}>{movement.notes}</div>
                        </div>
                      )}
                    </div>
                    {movement.userId && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                        👤 Usuario #{movement.userId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface-2)', display: 'flex', justifyContent: 'flex-end' }}>
          <MtButton variant="secondary" onClick={onClose}>Cerrar</MtButton>
        </div>
      </div>
    </div>
  );
}
