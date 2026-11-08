import { useState, useRef } from 'react';
import { IndustrialButton } from '../design/IndustrialDesignSystem';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activos</h1>
          <p className="text-gray-600 mt-1">Gestiona todos los activos de tu planta</p>
        </div>
        <IndustrialButton
          variant="primary"
          size="lg"
          icon={<Plus size={20} />}
          onClick={handleCreate}
        >
          Crear Activo
        </IndustrialButton>
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
