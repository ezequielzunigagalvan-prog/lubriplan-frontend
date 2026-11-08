import { useState } from 'react';
import { IndustrialCard, IndustrialButton, IndustrialBadge, IndustrialStat, IndustrialInput } from '../design/IndustrialDesignSystem';
import { Plus, Search, Package, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import '../ui/tokens.css';

export default function Inventory() {
  const [warehouses] = useState([
    { id: 1, name: 'Almacén Principal', location: 'Planta A', items: 247, value: 125000, status: 'OPTIMAL' },
    { id: 2, name: 'Stock de Emergencia', location: 'Planta B', items: 45, value: 18500, status: 'LOW' },
    { id: 3, name: 'Repuestos Críticos', location: 'Sala de Bombeo', items: 23, value: 42000, status: 'OPTIMAL' },
  ]);

  const [search, setSearch] = useState('');

  const filtered = warehouses.filter((wh) =>
    wh.name.toLowerCase().includes(search.toLowerCase()) ||
    wh.location.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = warehouses.reduce((sum, wh) => sum + wh.items, 0);
  const totalValue = warehouses.reduce((sum, wh) => sum + wh.value, 0);
  const lowStockWarehouses = warehouses.filter((wh) => wh.status === 'LOW').length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario de Almacenes</h1>
          <p className="text-gray-600 mt-1">Monitorea el stock en todos tus almacenes</p>
        </div>
        <IndustrialButton
          variant="primary"
          size="lg"
          icon={<Plus size={20} />}
          onClick={() => console.log('Create warehouse')}
        >
          Nuevo Almacén
        </IndustrialButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <IndustrialStat
          label="Items en Stock"
          value={totalItems}
          icon={<Package size={32} />}
        />
        <IndustrialStat
          label="Almacenes"
          value={warehouses.length}
          icon={<span>🏭</span>}
        />
        <IndustrialStat
          label="Stock Bajo"
          value={lowStockWarehouses}
          icon={<AlertCircle size={32} />}
          trend={lowStockWarehouses > 0 ? -15 : null}
        />
        <IndustrialStat
          label="Valor Total"
          value={totalValue}
          unit="USD"
          icon={<DollarSign size={32} />}
          trend={8}
        />
      </div>

      {/* Search */}
      <IndustrialInput
        placeholder="Buscar almacén por nombre o ubicación..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={18} />}
      />

      {/* Warehouses List */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <IndustrialCard elevated className="p-12 text-center">
            <div className="text-5xl mb-4">🏭</div>
            <h3 className="text-lg font-bold text-gray-900">Sin almacenes</h3>
            <p className="text-gray-600 mt-2">No hay almacenes que coincidan con tu búsqueda</p>
          </IndustrialCard>
        ) : (
          filtered.map((warehouse) => {
            const itemsPercentage = (warehouse.items / 300) * 100;
            const isLowStock = warehouse.status === 'LOW';

            return (
              <IndustrialCard
                key={warehouse.id}
                elevated
                className={`p-6 hover:shadow-lg transition-all ${isLowStock ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🏢</span>
                      <h3 className="text-lg font-bold text-gray-900">{warehouse.name}</h3>
                      <IndustrialBadge
                        label={warehouse.status === 'OPTIMAL' ? 'Óptimo' : 'Stock Bajo'}
                        variant={warehouse.status === 'OPTIMAL' ? 'success' : 'danger'}
                        size="sm"
                      />
                    </div>
                    <p className="text-sm text-gray-600">{warehouse.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Items</p>
                    <p className="text-2xl font-bold text-cyan-600">{warehouse.items}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Valor Inventario</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(warehouse.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Ocupación</p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            itemsPercentage > 80 ? 'bg-cyan-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(itemsPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{Math.round(itemsPercentage)}% full</p>
                    </div>
                  </div>
                </div>
              </IndustrialCard>
            );
          })
        )}
      </div>
    </div>
  );
}
