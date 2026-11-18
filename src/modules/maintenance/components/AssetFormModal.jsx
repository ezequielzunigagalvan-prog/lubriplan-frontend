import { useState, useEffect } from 'react';
import { MtButton } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { toast } from 'sonner';
import { ASSET_LEVELS, ASSET_LEVEL_LABELS } from '../constants/maintenance';

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

function FormField({ label, placeholder, value, onChange, error, required, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-secondary)' }}>
        {label}
        {required && <span style={{ color: 'var(--mt-danger)' }}> *</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        style={{ width: '100%', padding: 'var(--mt-space-md)', borderRadius: 'var(--mt-radius-md)', border: error ? '2px solid var(--mt-danger)' : '1px solid var(--mt-border)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', fontFamily: 'inherit', fontSize: '14px' }}
      />
      {error && <p style={{ fontSize: '12px', color: 'var(--mt-danger)', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

function FormSelect({ label, value, onChange, options, error, required }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-secondary)' }}>
        {label}
        {required && <span style={{ color: 'var(--mt-danger)' }}> *</span>}
      </label>
      <select
        value={value ?? ''}
        onChange={onChange}
        style={{ width: '100%', padding: 'var(--mt-space-md)', borderRadius: 'var(--mt-radius-md)', border: error ? '2px solid var(--mt-danger)' : '1px solid var(--mt-border)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', fontFamily: 'inherit', fontSize: '14px' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p style={{ fontSize: '12px', color: 'var(--mt-danger)', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

const INITIAL_FORM_STATE = {
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
  parentId: '',
  installedAt: '',
};

// "2024-05-01T00:00:00.000Z" -> "2024-05-01" para el input type="date"
const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

export default function AssetFormModal({ isOpen, onClose, asset = null, onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState([]);

  // Activos que pueden ser padre (todos menos el que se está editando)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    maintenanceApi
      .getAssets({ limit: 500 })
      .then((res) => {
        if (cancelled) return;
        const options = (res?.data || [])
          .filter((a) => a.id !== asset?.id)
          .sort((a, b) => a.code.localeCompare(b.code));
        setParentOptions(options);
      })
      .catch(() => !cancelled && setParentOptions([]));
    return () => {
      cancelled = true;
    };
  }, [isOpen, asset?.id]);

  // Resetear formulario cuando se abre/cierra o cambia el asset
  useEffect(() => {
    if (isOpen) {
      if (asset?.id) {
        // Editando: llenar con datos del activo, asegurar strings
        setFormData({
          code: asset.code ?? '',
          name: asset.name ?? '',
          level: asset.level ?? 'EQUIPMENT',
          location: asset.location ?? '',
          manufacturer: asset.manufacturer ?? '',
          model: asset.model ?? '',
          serialNumber: asset.serialNumber ?? '',
          criticality: asset.criticality ?? 'B',
          status: asset.status ?? 'OPERATING',
          notes: asset.notes ?? '',
          parentId: asset.parentId ? String(asset.parentId) : '',
          installedAt: toDateInput(asset.installedAt),
        });
      } else {
        // Creando: resetear formulario
        setFormData(INITIAL_FORM_STATE);
      }
      setErrors({});
    }
  }, [isOpen, asset]);

  const validate = () => {
    const newErrors = {};

    // Validaciones de campos requeridos
    if (!formData.code?.trim()) {
      newErrors.code = 'Código es requerido';
    } else if (formData.code.trim().length < 2) {
      newErrors.code = 'Código debe tener al menos 2 caracteres';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Nombre es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nombre debe tener al menos 3 caracteres';
    }

    if (!formData.level) {
      newErrors.level = 'Nivel es requerido';
    }

    if (!formData.criticality) {
      newErrors.criticality = 'Criticidad es requerida';
    }

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
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);

      const dataToSubmit = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        level: formData.level,
        location: formData.location.trim(),
        manufacturer: formData.manufacturer.trim(),
        model: formData.model.trim(),
        serialNumber: formData.serialNumber.trim(),
        criticality: formData.criticality,
        status: formData.status,
        notes: formData.notes.trim(),
        parentId: formData.parentId ? Number(formData.parentId) : null,
        installedAt: formData.installedAt || null,
      };

      if (asset?.id) {
        await maintenanceApi.updateAsset(asset.id, dataToSubmit);
        toast.success('Activo actualizado correctamente');
      } else {
        await maintenanceApi.createAsset(dataToSubmit);
        toast.success('Activo creado correctamente');
      }

      onSuccess?.();
      setFormData(INITIAL_FORM_STATE);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('[AssetFormModal] Error saving asset:', error);
      toast.error(error?.data?.error || error?.message || 'Error al guardar el activo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 'var(--mt-z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'var(--mt-overlay)' }} onClick={onClose}></div>

      <div style={{ background: 'var(--mt-bg-surface)', borderRadius: 'var(--mt-radius-lg)', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--mt-shadow-lg)', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--mt-space-lg)', borderBottom: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface-2)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
            {asset?.id ? 'Editar Activo' : 'Crear Nuevo Activo'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--mt-text-secondary)', padding: 0 }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--mt-space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-lg)' }}>
            <FormField label="Código del Activo" placeholder="EQ-001" value={formData.code} onChange={(e) => handleChange('code', e.target.value)} error={errors.code} required />
            <FormField label="Nombre" placeholder="Bomba Centrífuga Principal" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} error={errors.name} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-lg)' }}>
            <FormSelect label="Nivel de Activo" value={formData.level} onChange={(e) => handleChange('level', e.target.value)} options={ASSET_LEVELS} error={errors.level} required />
            <FormSelect label="Criticidad" value={formData.criticality} onChange={(e) => handleChange('criticality', e.target.value)} options={CRITICALITIES} error={errors.criticality} required />
          </div>

          <FormSelect
            label="Activo padre (ubicación en la jerarquía)"
            value={formData.parentId}
            onChange={(e) => handleChange('parentId', e.target.value)}
            options={[
              { value: '', label: '— Ninguno (nivel superior) —' },
              ...parentOptions.map((a) => ({
                value: String(a.id),
                label: `${a.code} · ${a.name} (${ASSET_LEVEL_LABELS[a.level] || a.level})`,
              })),
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-lg)' }}>
            <FormField label="Ubicación" placeholder="Sala de Bombeo - Sector A" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} />
            <FormField label="Fecha de instalación" type="date" value={formData.installedAt} onChange={(e) => handleChange('installedAt', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-lg)' }}>
            <FormField label="Fabricante" placeholder="Ej: Grundfos" value={formData.manufacturer} onChange={(e) => handleChange('manufacturer', e.target.value)} />
            <FormField label="Modelo" placeholder="Ej: CR95-3-2" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-lg)' }}>
            <FormField label="Número de Serie" placeholder="S/N: GRD-2023-001" value={formData.serialNumber} onChange={(e) => handleChange('serialNumber', e.target.value)} />
            <FormSelect label="Estado" value={formData.status} onChange={(e) => handleChange('status', e.target.value)} options={STATUSES} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-secondary)' }}>
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Información adicional..."
              rows="3"
              style={{ width: '100%', padding: 'var(--mt-space-md)', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
            />
          </div>
        </form>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--mt-space-md)', padding: 'var(--mt-space-lg)', borderTop: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface-2)' }}>
          <MtButton variant="secondary" disabled={loading} onClick={onClose}>
            Cancelar
          </MtButton>
          <MtButton variant="primary" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Guardando...' : asset?.id ? 'Actualizar' : 'Crear'}
          </MtButton>
        </div>
      </div>
    </div>
  );
}
