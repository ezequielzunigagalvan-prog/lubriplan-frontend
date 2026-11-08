import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { PRIORITIES, PRIORITY_LABELS } from '../constants/maintenance';
import { MtButton, MtInput, MtPriorityBadge, MtCard, MtIcon } from '../ui';
import '../ui/tokens.css';

const DRAFT_KEY = 'mnt_report_failure_draft';

export default function ReportFailure() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);

  const [formData, setFormData] = useState(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : {
      assetId: '',
      assetSearch: '',
      title: '',
      description: '',
      priority: PRIORITIES.HIGH,
      photos: [],
    };
  });

  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [showAssetList, setShowAssetList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await maintenanceApi.getAssets({ limit: 100 });
        setAssets(res?.data || []);
      } catch (err) {
        console.error('Error loading assets:', err);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const search = formData.assetSearch.toLowerCase();
    if (!search) return [];
    return assets.filter(a => a.name?.toLowerCase().includes(search) || a.code?.toLowerCase().includes(search));
  }, [formData.assetSearch, assets]);

  useEffect(() => {
    setFilteredAssets(filtered);
  }, [filtered]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleAssetSelect = (asset) => {
    setFormData(prev => ({ ...prev, assetId: asset.id, assetSearch: asset.name }));
    setShowAssetList(false);
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (file && formData.photos.length < 3) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, { file, preview: evt.target.result }],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (idx) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId) { setError('Selecciona un activo'); return; }
    if (!formData.title.trim()) { setError('Ingresa un título'); return; }

    try {
      setSubmitting(true);
      const res = await maintenanceApi.createWorkOrder({
        assetId: formData.assetId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });

      if (formData.photos.length > 0 && res?.data?.id) {
        for (const photo of formData.photos) {
          try {
            await maintenanceApi.uploadPhoto(res.data.id, photo.file, 'GENERAL');
          } catch (err) {
            console.error('Photo upload error:', err);
          }
        }
      }

      localStorage.removeItem(DRAFT_KEY);
      navigate(`/maintenance/app/work-orders/${res?.data?.id}`);
    } catch (err) {
      setError(err?.message || 'Error al reportar falla');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px', color: 'var(--mt-text-primary)' }}>
        Reportar falla
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Asset Selection */}
        <div style={{ position: 'relative' }}>
          <MtInput
            label="Activo *"
            placeholder="Buscar activo..."
            value={formData.assetSearch}
            onChange={(e) => setFormData(prev => ({ ...prev, assetSearch: e.target.value }))}
            onFocus={() => setShowAssetList(true)}
          />
          {showAssetList && filteredAssets.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'var(--mt-bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--mt-border)',
              zIndex: 100,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAssetSelect(asset)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--mt-border)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--mt-text-primary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  {asset.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <MtInput
          label="Título *"
          placeholder="Ej: Ruido anormal en bomba"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />

        {/* Description */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
            Descripción
          </label>
          <textarea
            placeholder="Detalles adicionales..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'var(--mt-bg-surface)',
              border: '1px solid var(--mt-border)',
              borderRadius: '8px',
              color: 'var(--mt-text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '80px',
            }}
            rows={3}
          />
        </div>

        {/* Priority */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-primary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
            Prioridad
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {Object.values(PRIORITIES).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority }))}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: formData.priority === priority ? '2px solid var(--mt-accent)' : '1px solid var(--mt-border)',
                  background: formData.priority === priority ? 'rgba(56, 189, 248, 0.1)' : 'var(--mt-bg-surface)',
                  color: formData.priority === priority ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  transition: 'all 150ms ease',
                }}
              >
                {PRIORITY_LABELS[priority]}
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-primary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
            Fotos ({formData.photos.length}/3)
          </label>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{ display: 'none' }}
            disabled={formData.photos.length >= 3}
          />
          <MtButton
            type="button"
            variant={formData.photos.length >= 3 ? 'secondary' : 'primary'}
            onClick={() => cameraRef.current?.click()}
            disabled={formData.photos.length >= 3}
            style={{ width: '100%' }}
          >
            <MtIcon name="camera" size="md" />
            Capturar foto
          </MtButton>

          {formData.photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
              {formData.photos.map((photo, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                  <img src={photo.preview} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MtIcon name="x" size="sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px',
            background: 'rgba(248, 113, 113, 0.15)',
            border: '1px solid var(--mt-danger)',
            borderRadius: '8px',
            color: 'var(--mt-danger)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Submit */}
        <MtButton type="submit" disabled={submitting} loading={submitting} size="lg" style={{ width: '100%' }}>
          {submitting ? 'Enviando...' : 'Reportar Falla'}
        </MtButton>
      </form>
    </div>
  );
}
