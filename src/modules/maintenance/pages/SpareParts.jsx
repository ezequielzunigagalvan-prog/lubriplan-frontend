import { useState } from 'react';
import { IndustrialCard, IndustrialButton, IndustrialBadge, IndustrialInput } from '../design/IndustrialDesignSystem';
import { Plus, Search, AlertTriangle, TrendingDown } from 'lucide-react';
import '../ui/tokens.css';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refacciones y Repuestos</h1>
          <p className="text-gray-600 mt-1">Gestiona tu catálogo de partes y componentes</p>
        </div>
        <IndustrialButton
          variant="primary"
          size="lg"
          icon={<Plus size={20} />}
          onClick={() => console.log('Create spare part')}
        >
          Nueva Refacción
        </IndustrialButton>
      </div>

      {/* Search */}
      <IndustrialInput
        placeholder="Buscar por código, nombre o proveedor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={18} />}
      />

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <IndustrialCard elevated className="p-4 bg-orange-50 border-l-4 border-orange-500">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-orange-900">{lowStockParts.length} refacciones con stock bajo</h3>
              <p className="text-sm text-orange-800 mt-1">
                Requieren reposición inmediata
              </p>
            </div>
          </div>
        </IndustrialCard>
      )}

      {/* Parts Grid */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <IndustrialCard elevated className="p-12 text-center">
            <div className="text-5xl mb-4">🔧</div>
            <h3 className="text-lg font-bold text-gray-900">Sin refacciones</h3>
            <p className="text-gray-600 mt-2">No hay refacciones que coincidan con tu búsqueda</p>
          </IndustrialCard>
        ) : (
          filtered.map((part) => {
            const isLowStock = part.qty < part.minQty;
            return (
              <IndustrialCard
                key={part.id}
                elevated
                className={`p-6 hover:shadow-lg transition-all ${isLowStock ? 'border-l-4 border-orange-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-bold text-cyan-600">
                        {part.code}
                      </code>
                      <IndustrialBadge label={part.category} variant="info" size="sm" />
                      {isLowStock && (
                        <IndustrialBadge label="Stock Bajo" variant="danger" size="sm" />
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3">{part.name}</h3>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Stock Actual</p>
                        <p className={`text-xl font-bold ${isLowStock ? 'text-orange-600' : 'text-cyan-600'}`}>
                          {part.qty} <span className="text-sm text-gray-600">{part.unit}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Mínimo</p>
                        <p className="text-sm font-semibold text-gray-900">{part.minQty} {part.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Proveedor</p>
                        <p className="text-sm font-semibold text-gray-900">{part.supplier}</p>
                      </div>
                    </div>
                  </div>

                  {isLowStock && (
                    <div className="text-2xl" title="Stock bajo">
                      ⚠️
                    </div>
                  )}
                </div>
              </IndustrialCard>
            );
          })
        )}
      </div>
    </div>
  );
}
