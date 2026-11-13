import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { toast } from 'sonner';
import {
  ChevronLeft, Save, Wrench, Zap, Gauge, Flame, Droplet, Shield, Award, Plus, Trash2, User, Mail, Phone, Badge
} from 'lucide-react';
import '../ui/tokens.css';

const SPECIALITIES = {
  MECHANIC: { label: 'Mecánica', icon: Wrench, color: '#f59e0b' },
  ELECTRICAL: { label: 'Eléctrica', icon: Zap, color: '#ef4444' },
  INSTRUMENTS: { label: 'Instrumentación', icon: Gauge, color: '#3b82f6' },
  WELDING: { label: 'Soldadura', icon: Flame, color: '#f59e0b' },
  LUBRICATION: { label: 'Lubricación', icon: Droplet, color: '#38bdf8' },
  SUPERVISOR: { label: 'Supervisor', icon: Shield, color: '#22c55e' },
  MANAGER: { label: 'Jefe de Mantenimiento', icon: Award, color: '#38bdf8' },
};

export default function NewTechnician() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    speciality: 'MECHANIC',
    code: '',
    certifications: [],
    newCertification: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddCertification = () => {
    if ((formData.newCertification || '').trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, prev.newCertification.trim()],
        newCertification: '',
      }));
    }
  };

  const handleRemoveCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      setLoading(true);

      const technicianData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        speciality: formData.speciality,
        code: formData.code || undefined,
        certifications: formData.certifications,
        status: 'Activo',
      };

      await maintenanceApi.createTechnician(technicianData);
      toast.success('Técnico creado exitosamente');
      navigate('/maintenance/app/personnel');
    } catch (error) {
      console.error('Error creating technician:', error);
      toast.error('Error al crear técnico');
    } finally {
      setLoading(false);
    }
  };

  const spec = SPECIALITIES[formData.speciality];
  const SpecIcon = spec?.icon || User;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/maintenance/app/personnel')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--mt-text-secondary)',
            fontWeight: 'bold'
          }}
        >
          <ChevronLeft size={20} /> Volver
        </button>
      </div>

      {/* Formulario */}
      <div style={{
        background: 'var(--mt-bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--mt-border)',
        overflow: 'hidden'
      }}>
        {/* Encabezado */}
        <div style={{
          background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
          color: '#fff',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <User size={32} />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              Crear Nuevo Técnico
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
              Registra un nuevo miembro al equipo de mantenimiento
            </p>
          </div>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Sección: Información Personal */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--mt-text-primary)' }}>
              Información Personal
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Nombre */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-base)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Código */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Código (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="Ej: TEC-001"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-base)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="tecnico@company.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-base)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+56 9 1234 5678"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-base)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sección: Especialidad */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--mt-text-primary)' }}>
              Especialidad
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {Object.entries(SPECIALITIES).map(([key, sp]) => {
                const Icon = sp.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleChange('speciality', key)}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: formData.speciality === key ? `2px solid ${sp.color}` : '1px solid var(--mt-border)',
                      background: formData.speciality === key ? `${sp.color}10` : 'var(--mt-bg-base)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 200ms'
                    }}
                  >
                    <Icon size={24} style={{ color: sp.color }} />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--mt-text-primary)' }}>
                      {sp.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección: Certificaciones */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--mt-text-primary)' }}>
              Certificaciones
            </h2>

            {/* Agregar certificación */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={formData.newCertification}
                onChange={(e) => handleChange('newCertification', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
                placeholder="Ej: Certificación ISO 9001"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--mt-border)',
                  background: 'var(--mt-bg-base)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={handleAddCertification}
                style={{
                  padding: '10px 16px',
                  background: '#38bdf8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={18} /> Agregar
              </button>
            </div>

            {/* Lista de certificaciones */}
            {formData.certifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--mt-bg-base)',
                      borderRadius: '6px',
                      border: '1px solid var(--mt-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge size={16} style={{ color: '#38bdf8' }} />
                      <span style={{ fontSize: '13px' }}>{cert}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', fontStyle: 'italic' }}>
                Sin certificaciones agregadas
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--mt-border)' }}>
            <button
              type="button"
              onClick={() => navigate('/maintenance/app/personnel')}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: 'var(--mt-bg-base)',
                color: 'var(--mt-text-primary)',
                border: '1px solid var(--mt-border)',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: loading ? '#9ca3af' : '#38bdf8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? '⏳ Guardando...' : (
                <>
                  <Save size={18} /> Crear Técnico
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
