import { IndustrialButton, IndustrialCard, IndustrialInput } from '../design/IndustrialDesignSystem';
import { Plus, Search } from 'lucide-react';

/**
 * Reusable template for list pages in Maintenance module
 * Provides consistent industrial design across all sections
 */
export default function ListPageTemplate({
  title,
  description,
  items = [],
  loading = false,
  error = null,
  searchValue = '',
  onSearchChange = () => {},
  filters = [],
  selectedFilter = 'all',
  onFilterChange = () => {},
  onCreateClick = () => {},
  createButtonLabel = 'Crear',
  renderItem = () => null,
  emptyIcon = '📦',
  emptyTitle = 'Sin elementos',
  emptyDescription = 'Crea tu primer elemento para comenzar',
}) {
  if (loading) {
    return (
      <IndustrialCard className="p-12 text-center">
        <div className="text-3xl animate-spin mb-4">⚙️</div>
        <p className="text-gray-600">Cargando...</p>
      </IndustrialCard>
    );
  }

  if (error) {
    return (
      <IndustrialCard elevated className="p-12 text-center border-l-4 border-red-500">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-red-900">{error}</h3>
        <p className="text-red-700 mt-2">Intenta recargar la página</p>
      </IndustrialCard>
    );
  }

  const hasItems = items && items.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-600 mt-1">{description}</p>}
        </div>
        <IndustrialButton
          variant="primary"
          size="lg"
          icon={<Plus size={20} />}
          onClick={onCreateClick}
        >
          {createButtonLabel}
        </IndustrialButton>
      </div>

      {/* Search & Filters */}
      {(searchValue !== undefined || filters.length > 0) && (
        <div className="space-y-4">
          {searchValue !== undefined && (
            <IndustrialInput
              placeholder="Buscar..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              icon={<Search size={18} />}
            />
          )}

          {filters.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => onFilterChange(filter.value)}
                  className={`
                    px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all
                    ${selectedFilter === filter.value
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Items List/Grid */}
      <div className="grid gap-4">
        {!hasItems ? (
          <IndustrialCard elevated className="p-12 text-center">
            <div className="text-5xl mb-4">{emptyIcon}</div>
            <h3 className="text-lg font-bold text-gray-900">{emptyTitle}</h3>
            <p className="text-gray-600 mt-2">{emptyDescription}</p>
          </IndustrialCard>
        ) : (
          items.map((item, idx) => (
            <div key={item.id || idx}>{renderItem(item)}</div>
          ))
        )}
      </div>
    </div>
  );
}
