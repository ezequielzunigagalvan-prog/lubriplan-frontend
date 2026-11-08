import { useState, useRef } from 'react';
import { MtButton, MtCard } from '../ui';
import AssetFormModal from '../components/AssetFormModal';
import AssetsList from '../components/AssetsList';
import { Plus, Package, AlertCircle, CheckCircle, Zap, Building2 } from 'lucide-react';

export default function Assets() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [filterCriticality, setFilterCriticality] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const listRef = useRef(null);

  // Mock stats
  const stats = {
    total: 45,
    operating: 42,
    stopped: 2,
    outOfService: 1,
    criticalA: 12,
    criticalB: 18,
    criticalC: 15,
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    listRef.current?.reload?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header Premium */}
      <div style={{
        background: 'linear-gradient(135deg, var(--mt-bg-surface) 0%, var(--mt-bg-surface-2) 100%)',
        borderRadius: 'var(--mt-radius-lg)',
        padding: 'var(--mt-space-xl)',
        border: '1px solid var(--mt-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--mt-space-lg)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-sm)' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))',
              borderRadius: 'var(--mt-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
            }}>
              <Package size={28} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-text-primary)' }}>
                Gestión de Activos
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                Base de datos completa de equipos e instalaciones
              </p>
            </div>
          </div>
        </div>
        <MtButton
          variant="primary"
          size="lg"
          icon={<Plus size={20} />}
          onClick={handleCreate}
          style={{
            background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--mt-radius-md)',
            padding: '10px 20px',
            fontWeight: 'var(--mt-font-weight-bold)'
          }}
        >
          + Nuevo Activo
        </MtButton>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        {/* Total */}
        <MtCard elevated style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.05))' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)' }}>📦</div>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
              Total Activos
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
              {stats.total}
            </p>
          </div>
        </MtCard>

        {/* Operating */}
        <MtCard elevated style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)' }}>✅</div>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
              Operando
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)' }}>
              {stats.operating}
            </p>
          </div>
        </MtCard>

        {/* Stopped */}
        <MtCard elevated style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)' }}>⏸️</div>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
              Detenidos
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-warning)' }}>
              {stats.stopped}
            </p>
          </div>
        </MtCard>

        {/* Out of Service */}
        <MtCard elevated style={{ background: 'linear-gradient(135deg, rgba(244, 65, 82, 0.1), rgba(244, 65, 82, 0.05))' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)' }}>🔴</div>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
              Fuera Servicio
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
              {stats.outOfService}
            </p>
          </div>
        </MtCard>
      </div>

      {/* Criticality Stats */}
      <div>
        <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>
          Distribución por Criticidad
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-md)' }}>
          {[
            { level: 'A - CRÍTICA', count: stats.criticalA, color: 'var(--mt-danger)', bg: 'rgba(244, 65, 82, 0.1)' },
            { level: 'B - MODERADA', count: stats.criticalB, color: 'var(--mt-warning)', bg: 'rgba(251, 191, 36, 0.1)' },
            { level: 'C - BAJA', count: stats.criticalC, color: 'var(--mt-info)', bg: 'rgba(59, 130, 246, 0.1)' },
          ].map((item) => (
            <div key={item.level} style={{
              background: item.bg,
              borderRadius: 'var(--mt-radius-md)',
              padding: 'var(--mt-space-md)',
              borderLeft: `4px solid ${item.color}`,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--mt-space-md)'
            }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '2px' }}>
                  {item.level}
                </p>
                <p style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: item.color }}>
                  {item.count}
                </p>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: item.color,
                  width: `${(item.count / stats.total) * 100}%`,
                  transition: 'width 300ms ease'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>
          Filtros
        </p>
        <div style={{ display: 'flex', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
            {['Todos', 'A', 'B', 'C'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterCriticality(level === 'Todos' ? 'all' : level)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--mt-radius-md)',
                  border: '1px solid var(--mt-border)',
                  background: filterCriticality === (level === 'Todos' ? 'all' : level) ? 'var(--mt-accent)' : 'transparent',
                  color: filterCriticality === (level === 'Todos' ? 'all' : level) ? '#fff' : 'var(--mt-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 'var(--mt-font-weight-bold)',
                  fontSize: '12px',
                  transition: 'all 200ms ease',
                }}
              >
                {level === 'Todos' ? 'Todas' : `Crítica ${level}`}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
            {['Todos', 'OPERATING', 'STOPPED', 'OUT_OF_SERVICE'].map((state) => (
              <button
                key={state}
                onClick={() => setFilterState(state === 'Todos' ? 'all' : state)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--mt-radius-md)',
                  border: '1px solid var(--mt-border)',
                  background: filterState === (state === 'Todos' ? 'all' : state) ? 'var(--mt-info)' : 'transparent',
                  color: filterState === (state === 'Todos' ? 'all' : state) ? '#fff' : 'var(--mt-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 'var(--mt-font-weight-bold)',
                  fontSize: '12px',
                  transition: 'all 200ms ease',
                }}
              >
                {state === 'Todos' ? 'Todos los Estados' : state === 'OPERATING' ? 'Operando' : state === 'STOPPED' ? 'Detenido' : 'Fuera Servicio'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assets List */}
      <AssetsList
        ref={listRef}
        onEditClick={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Form Modal */}
      <AssetFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAsset(null);
        }}
        asset={editingAsset}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
