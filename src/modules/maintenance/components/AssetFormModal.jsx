import { useState } from 'react';
import {
  IndustrialModal,
  IndustrialInput,
  IndustrialSelect,
  IndustrialTextarea,
  IndustrialButton,
} from '../design/IndustrialDesignSystem';
import { maintenanceApi } from '../services/maintenanceApi';
import { toast } from 'sonner';

const ASSET_LEVELS = [
  { value: 'AREA', label: 'Área' },
  { value: 'LINE', label: 'Línea' },
  { value: 'EQUIPMENT', label: 'Equipamiento' },
  { value: 'SUBASSEMBLY', label: 'Subensamblaje' },
  { value: 'COMPONENT', label: 'Componente' },
];

const CRITICALITIES = [
  { value: 'A', label: 'Crítica (A) - Impacto Alto' },
  { value: 'B', label: 'Moderada (B) - Impacto Medio' },
  { value: 'C', label: 'Baja (C) - Impacto Bajo' },
];

const STATUSES = [
  { value: 'OPERATING', label: 'Operando' },
  { value: 'STOPPED', label: 'Detenido' },
  { value: 'OUT_OF_SERVICE', label: 'Fuera de Servicio' },
];

export default function AssetFormModal({ isOpen, onClose, asset = null, onSuccess }) {
  const [formData, setFormData] = useState(
    asset || {
      code: '',
      name: '',
      level: 'EQUIPMENT',
      location: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      criticality: 'B',
      status: 'OPERATING',
      notes: '',
    }
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.code.trim()) newErrors.code = 'Código es requerido';
    if (!formData.name.trim()) newErrors.name = 'Nombre es requerido';
    if (!formData.level) newErrors.level = 'Nivel es requerido';
    if (!formData.criticality) newErrors.criticality = 'Criticidad es requerida';
    return newErrors;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      if (asset?.id) {
        await maintenanceApi.updateAsset(asset.id, formData);
        toast.success('Activo actualizado correctamente');
      } else {
        await maintenanceApi.createAsset(formData);
        toast.success('Activo creado correctamente');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IndustrialModal
      isOpen={isOpen}
      title={asset?.id ? 'Editar Activo' : 'Crear Nuevo Activo'}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <IndustrialButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </IndustrialButton>
          <IndustrialButton
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : asset?.id ? 'Actualizar' : 'Crear'}
          </IndustrialButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <IndustrialInput
            label="Código del Activo"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="EQ-001"
            required
            error={errors.code}
          />
          <IndustrialInput
            label="Nombre"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Bomba Centrífuga Principal"
            required
            error={errors.name}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <IndustrialSelect
            label="Nivel de Activo"
            value={formData.level}
            onChange={(e) => handleChange('level', e.target.value)}
            options={ASSET_LEVELS}
            required
            error={errors.level}
          />
          <IndustrialSelect
            label="Criticidad"
            value={formData.criticality}
            onChange={(e) => handleChange('criticality', e.target.value)}
            options={CRITICALITIES}
            required
            error={errors.criticality}
          />
        </div>

        <IndustrialInput
          label="Ubicación"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Sala de Bombeo - Sector A"
        />

        <div className="grid grid-cols-2 gap-4">
          <IndustrialInput
            label="Fabricante"
            value={formData.manufacturer}
            onChange={(e) => handleChange('manufacturer', e.target.value)}
            placeholder="Ej: Grundfos, Siemens"
          />
          <IndustrialInput
            label="Modelo"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder="Ej: CR95-3-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <IndustrialInput
            label="Número de Serie"
            value={formData.serialNumber}
            onChange={(e) => handleChange('serialNumber', e.target.value)}
            placeholder="S/N: GRD-2023-001"
          />
          <IndustrialSelect
            label="Estado"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={STATUSES}
          />
        </div>

        <IndustrialTextarea
          label="Notas"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Información adicional sobre el activo..."
          rows={3}
        />
      </form>
    </IndustrialModal>
  );
}
