import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { PRIORITIES, PRIORITY_LABELS } from '../constants/maintenance';
import { MtButton, MtInput, MtPriorityBadge, MtCard, MtIcon, MtBadge } from '../ui';
import { AlertTriangle, Camera, X, Plus, Zap, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import '../ui/tokens.css';
import { toast } from 'sonner';

const DRAFT_KEY = 'mnt_report_failure_draft';

const PRIORITY_CONFIGS = {
  CRITICAL: { color: 'var(--mt-danger)', label: 'Crítica', desc: 'Equipo detenido', bg: 'rgba(244, 65, 82, 0.1)' },
  HIGH: { color: 'var(--mt-warning)', label: 'Alta', desc: 'Riesgo de paro', bg: 'rgba(251, 191, 36, 0.1)' },
  MEDIUM: { color: 'var(--mt-info)', label: 'Media', desc: 'Intervención programada', bg: 'rgba(59, 130, 246, 0.1)' },
  LOW: { color: 'var(--mt-accent)', label: 'Baja', desc: 'Sin afectación inmediata', bg: 'rgba(56, 189, 248, 0.1)' },
};

export default function ReportFailure() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const [step, setStep] = useState(1); // 1: Asset, 2: Details, 3: Photos, 4: Review
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [showAssetList, setShowAssetList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : {
      assetId: '',
      assetName: '',
      assetCode: '',
      title: '',
      description: '',
      priority: 'HIGH',
      photos: [],
      comments: '',
    };
  });

  // Load assets on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await maintenanceApi.getAssets({ limit: 100 });
        setAssets(res?.data || []);
      } catch (err) {
        console.error('Error loading assets:', err);
        toast.error('Error cargando activos');
      }
    };
    load();
  }, []);

  // Save draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  // Filter assets
  const filtered = useMemo(() => {
    const search = formData.assetCode.toLowerCase();
    if (!search) return [];
    return assets.filter(a =>
      a.name?.toLowerCase().includes(search) ||
      a.code?.toLowerCase().includes(search)
    );
  }, [formData.assetCode, assets]);

  useEffect(() => {
    setFilteredAssets(filtered);
  }, [filtered]);

  const handleAssetSelect = (asset) => {
    setFormData(prev => ({
      ...prev,
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
    }));
    setShowAssetList(false);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file && formData.photos.length < 5) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, { file, preview: evt.target.result, uploaded: false }],
        }));
        toast.success(`Foto agregada (${formData.photos.length + 1}/5)`);
      };
      reader.readAsDataURL(file);
    } else if (formData.photos.length >= 5) {
      toast.error('Máximo 5 fotos');
    }
  };

  const handleRemovePhoto = (idx) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.assetId) { toast.error('Selecciona un activo'); return; }
    if (!formData.title.trim()) { toast.error('Ingresa un título'); return; }
    if (!formData.description.trim()) { toast.error('Describe el problema'); return; }

    try {
      setSubmitting(true);
      const res = await maintenanceApi.createWorkOrder({
        assetId: formData.assetId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        type: 'CORRECTIVE',
        status: 'REQUESTED',
        comments: formData.comments,
      });

      // Upload photos
      if (formData.photos.length > 0 && res?.data?.id) {
        for (const photo of formData.photos) {
          try {
            await maintenanceApi.uploadPhoto(res.data.id, photo.file, 'FAILURE_REPORT');
          } catch (err) {
            console.error('Photo upload error:', err);
          }
        }
      }

      localStorage.removeItem(DRAFT_KEY);
      toast.success('Falla reportada exitosamente');

      // Redirect to success or order detail
      setTimeout(() => {
        navigate(`/maintenance/app/work-orders/${res?.data?.id}`);
      }, 500);
    } catch (err) {
      toast.error(err?.message || 'Error al reportar falla');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Asset Selection
  if (step === 1) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--mt-space-lg)' }}>
        <div style={{ marginBottom: 'var(--mt-space-2xl)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-primary)' }}>
            Reportar Falla
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Paso 1 de 4: Selecciona el equipo
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-2xl)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1,
              height: '4px',
              background: i <= step ? 'var(--mt-accent)' : 'var(--mt-border)',
              borderRadius: 'var(--mt-radius-full)',
              transition: 'all 300ms ease'
            }}></div>
          ))}
        </div>

        {/* Asset Search */}
        <div style={{ position: 'relative', marginBottom: 'var(--mt-space-lg)' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
            Equipo *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={formData.assetCode}
              onChange={(e) => setFormData(prev => ({ ...prev, assetCode: e.target.value }))}
              onFocus={() => setShowAssetList(true)}
              style={{
                width: '100%',
                padding: 'var(--mt-space-md)',
                fontSize: '14px',
                border: '1px solid var(--mt-border)',
                borderRadius: 'var(--mt-radius-md)',
                background: 'var(--mt-bg-surface)',
                color: 'var(--mt-text-primary)',
                outline: 'none',
                transition: 'all 200ms ease',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowAssetList(false);
              }}
            />
            {formData.assetCode && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, assetCode: '', assetId: '' }))}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mt-text-secondary)',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showAssetList && filteredAssets.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              background: 'var(--mt-bg-surface)',
              border: '1px solid var(--mt-border)',
              borderRadius: 'var(--mt-radius-md)',
              zIndex: 100,
              maxHeight: 300,
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {filteredAssets.map((asset, idx) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAssetSelect(asset)}
                  style={{
                    width: '100%',
                    padding: 'var(--mt-space-md)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(56, 189, 248, 0.02)',
                    border: 'none',
                    borderBottom: idx < filteredAssets.length - 1 ? '1px solid var(--mt-border)' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    fontSize: '13px',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(56, 189, 248, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(56, 189, 248, 0.02)'}
                >
                  <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)', marginBottom: '2px' }}>
                    {asset.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>
                    {asset.code} • {asset.location}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Asset Card */}
        {formData.assetId && (
          <MtCard elevated style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: 'var(--mt-space-lg)' }}>
            <div style={{ padding: 'var(--mt-space-md)', display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--mt-success)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                  {formData.assetName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                  {formData.assetCode}
                </div>
              </div>
            </div>
          </MtCard>
        )}

        <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
          <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/work-orders')} style={{ flex: 1 }}>
            Cancelar
          </MtButton>
          <MtButton
            disabled={!formData.assetId}
            onClick={() => setStep(2)}
            style={{ flex: 1 }}
          >
            Siguiente
          </MtButton>
        </div>
      </div>
    );
  }

  // Step 2: Details
  if (step === 2) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--mt-space-lg)' }}>
        <div style={{ marginBottom: 'var(--mt-space-2xl)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-primary)' }}>
            Detalles de la Falla
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Paso 2 de 4: Describe el problema
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-2xl)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1,
              height: '4px',
              background: i <= step ? 'var(--mt-accent)' : 'var(--mt-border)',
              borderRadius: 'var(--mt-radius-full)',
              transition: 'all 300ms ease'
            }}></div>
          ))}
        </div>

        {/* Title */}
        <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
            Título del problema *
          </label>
          <input
            type="text"
            placeholder="Ej: Ruido anormal en bomba"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            maxLength={100}
            style={{
              width: '100%',
              padding: 'var(--mt-space-md)',
              fontSize: '14px',
              border: '1px solid var(--mt-border)',
              borderRadius: 'var(--mt-radius-md)',
              background: 'var(--mt-bg-surface)',
              color: 'var(--mt-text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', marginTop: '4px' }}>
            {formData.title.length}/100
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
            Descripción detallada *
          </label>
          <textarea
            placeholder="Describe el problema, síntomas observados, cuándo comenzó..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            maxLength={500}
            rows={5}
            style={{
              width: '100%',
              padding: 'var(--mt-space-md)',
              fontSize: '14px',
              border: '1px solid var(--mt-border)',
              borderRadius: 'var(--mt-radius-md)',
              background: 'var(--mt-bg-surface)',
              color: 'var(--mt-text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', marginTop: '4px' }}>
            {formData.description.length}/500
          </div>
        </div>

        {/* Priority Selection */}
        <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-md)' }}>
            Prioridad estimada
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
            {Object.entries(PRIORITY_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: key }))}
                style={{
                  padding: 'var(--mt-space-md)',
                  background: formData.priority === key ? config.bg : 'var(--mt-bg-surface)',
                  border: formData.priority === key ? `2px solid ${config.color}` : '1px solid var(--mt-border)',
                  borderRadius: 'var(--mt-radius-md)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '700', color: config.color, marginBottom: '2px' }}>
                  {config.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                  {config.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
          <MtButton variant="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
            Atrás
          </MtButton>
          <MtButton
            disabled={!formData.title.trim() || !formData.description.trim()}
            onClick={() => setStep(3)}
            style={{ flex: 1 }}
          >
            Siguiente
          </MtButton>
        </div>
      </div>
    );
  }

  // Step 3: Photos
  if (step === 3) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--mt-space-lg)' }}>
        <div style={{ marginBottom: 'var(--mt-space-2xl)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-primary)' }}>
            Evidencia Fotográfica
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Paso 3 de 4: Adjunta fotos del problema
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-2xl)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1,
              height: '4px',
              background: i <= step ? 'var(--mt-accent)' : 'var(--mt-border)',
              borderRadius: 'var(--mt-radius-full)',
            }}></div>
          ))}
        </div>

        {/* Photo Upload Button */}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={formData.photos.length >= 5}
          style={{
            width: '100%',
            padding: 'var(--mt-space-lg)',
            border: '2px dashed var(--mt-accent)',
            borderRadius: 'var(--mt-radius-lg)',
            background: 'rgba(56, 189, 248, 0.05)',
            cursor: formData.photos.length >= 5 ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--mt-space-md)',
            opacity: formData.photos.length >= 5 ? 0.6 : 1,
            transition: 'all 200ms ease',
            marginBottom: 'var(--mt-space-lg)',
          }}
          onMouseEnter={(e) => {
            if (formData.photos.length < 5) {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)';
          }}
        >
          <Camera size={32} style={{ color: 'var(--mt-accent)' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
              Tomar o cargar foto
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '2px' }}>
              {formData.photos.length}/5 fotos
            </div>
          </div>
        </button>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          style={{ display: 'none' }}
        />

        {/* Photos Grid */}
        {formData.photos.length > 0 && (
          <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-md)' }}>
              Fotos adjuntas ({formData.photos.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--mt-space-md)' }}>
              {formData.photos.map((photo, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 'var(--mt-radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--mt-border)',
                  }}
                >
                  <img
                    src={photo.preview}
                    alt={`Foto ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
            Comentarios adicionales (opcional)
          </label>
          <textarea
            placeholder="Información adicional para el técnico..."
            value={formData.comments}
            onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
            maxLength={300}
            rows={3}
            style={{
              width: '100%',
              padding: 'var(--mt-space-md)',
              fontSize: '14px',
              border: '1px solid var(--mt-border)',
              borderRadius: 'var(--mt-radius-md)',
              background: 'var(--mt-bg-surface)',
              color: 'var(--mt-text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
          <MtButton variant="secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>
            Atrás
          </MtButton>
          <MtButton onClick={() => setStep(4)} style={{ flex: 1 }}>
            Revisar
          </MtButton>
        </div>
      </div>
    );
  }

  // Step 4: Review & Confirm
  if (step === 4) {
    const selectedAsset = assets.find(a => a.id === formData.assetId);

    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--mt-space-lg)' }}>
        <div style={{ marginBottom: 'var(--mt-space-2xl)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-primary)' }}>
            Revisar Reporte
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Paso 4 de 4: Confirma los detalles
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-2xl)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1,
              height: '4px',
              background: i <= step ? 'var(--mt-accent)' : 'var(--mt-border)',
              borderRadius: 'var(--mt-radius-full)',
            }}></div>
          ))}
        </div>

        {/* Review Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)', marginBottom: 'var(--mt-space-2xl)' }}>
          {/* Equipo */}
          <MtCard>
            <div style={{ padding: 'var(--mt-space-md)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                Equipo
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                {formData.assetName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '2px' }}>
                {formData.assetCode} • {selectedAsset?.location}
              </div>
            </div>
          </MtCard>

          {/* Problema */}
          <MtCard>
            <div style={{ padding: 'var(--mt-space-md)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                Problema
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)', marginBottom: '8px' }}>
                {formData.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', lineHeight: '1.5' }}>
                {formData.description}
              </div>
            </div>
          </MtCard>

          {/* Prioridad */}
          <MtCard>
            <div style={{ padding: 'var(--mt-space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '6px' }}>
                  Prioridad
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                  {PRIORITY_CONFIGS[formData.priority].label}
                </div>
              </div>
              <MtBadge variant={formData.priority === 'CRITICAL' ? 'danger' : formData.priority === 'HIGH' ? 'warning' : formData.priority === 'MEDIUM' ? 'info' : 'default'}>
                {PRIORITY_CONFIGS[formData.priority].label}
              </MtBadge>
            </div>
          </MtCard>

          {/* Fotos */}
          {formData.photos.length > 0 && (
            <MtCard>
              <div style={{ padding: 'var(--mt-space-md)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: 'var(--mt-space-md)' }}>
                  Evidencia Fotográfica ({formData.photos.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 'var(--mt-space-sm)' }}>
                  {formData.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo.preview}
                      alt={`Foto ${idx + 1}`}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        borderRadius: 'var(--mt-radius-sm)',
                        border: '1px solid var(--mt-border)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </MtCard>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-lg)' }}>
          <MtButton variant="secondary" onClick={() => setStep(3)} style={{ flex: 1 }} disabled={submitting}>
            Atrás
          </MtButton>
          <MtButton
            onClick={handleSubmit}
            loading={submitting}
            style={{ flex: 1 }}
          >
            {submitting ? 'Enviando...' : 'Enviar Reporte'}
          </MtButton>
        </div>

        <div style={{ padding: 'var(--mt-space-md)', background: 'rgba(56, 189, 248, 0.05)', borderRadius: 'var(--mt-radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', alignItems: 'flex-start', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--mt-accent)' }} />
            <div>
              El supervisor recibirá esta notificación y podrá aprobar o rechazar tu reporte dentro de 24 horas.
            </div>
          </div>
        </div>
      </div>
    );
  }
}
