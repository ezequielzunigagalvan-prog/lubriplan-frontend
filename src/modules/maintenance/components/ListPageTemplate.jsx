import { MtCard, MtButton, MtBadge } from '../ui';
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
      <MtCard elevated>
        <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando...</p>
        </div>
      </MtCard>
    );
  }

  if (error) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', borderLeft: '4px solid var(--mt-danger)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--mt-space-md)' }}>⚠️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', color: 'var(--mt-danger)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            {error}
          </h3>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Intenta recargar la página</p>
        </div>
      </MtCard>
    );
  }

  const hasItems = items && items.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            {title}
          </h1>
          {description && (
            <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              {description}
            </p>
          )}
        </div>
        <MtButton variant="primary" size="lg" icon={<Plus size={20} />} onClick={onCreateClick}>
          {createButtonLabel}
        </MtButton>
      </div>

      {/* Search & Filters */}
      {(searchValue !== undefined || filters.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          {searchValue !== undefined && (
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  padding: '10px 12px 10px 40px',
                  borderRadius: 'var(--mt-radius-md)',
                }}
              />
            </div>
          )}

          {filters.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', overflowX: 'auto', paddingBottom: 'var(--mt-space-sm)' }}>
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => onFilterChange(filter.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--mt-radius-full)',
                    fontWeight: 'var(--mt-font-weight-bold)',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    cursor: 'pointer',
                    background: selectedFilter === filter.value ? 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))' : 'var(--mt-bg-surface)',
                    color: selectedFilter === filter.value ? '#fff' : 'var(--mt-text-secondary)',
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Items List/Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        {!hasItems ? (
          <MtCard elevated>
            <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--mt-space-md)' }}>
                {emptyIcon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                {emptyTitle}
              </h3>
              <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>
                {emptyDescription}
              </p>
            </div>
          </MtCard>
        ) : (
          items.map((item, idx) => (
            <div key={item.id || idx}>{renderItem(item)}</div>
          ))
        )}
      </div>
    </div>
  );
}
