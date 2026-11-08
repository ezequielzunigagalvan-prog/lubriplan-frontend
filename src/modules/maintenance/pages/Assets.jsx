import { useState, useRef } from 'react';
import { MtButton } from '../ui';
import AssetFormModal from '../components/AssetFormModal';
import AssetsList from '../components/AssetsList';
import { Plus } from 'lucide-react';

export default function Assets() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const listRef = useRef(null);

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-text-primary)', marginBottom: 'var(--mt-space-sm)' }}>
            Activos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)' }}>
            Gestiona todos los activos de tu planta
          </p>
        </div>
        <MtButton variant="primary" size="lg" icon={<Plus size={20} />} onClick={handleCreate}>
          Crear Activo
        </MtButton>
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
