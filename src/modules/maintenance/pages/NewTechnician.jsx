import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton, MtInput } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import {
  ChevronLeft, Save, X, Wrench, Zap, Gauge, Flame, Droplet, Shield, Award
} from 'lucide-react';
import '../ui/tokens.css';

const SPECIALITIES = {
  MECHANIC: { label: 'Mecánica', icon: Wrench, color: 'var(--mt-warning)' },
  ELECTRICAL: { label: 'Eléctrica', icon: Zap, color: 'var(--mt-danger)' },
  INSTRUMENTS: { label: 'Instrumentación', icon: Gauge, color: 'var(--mt-info)' },
  WELDING: { label: 'Soldadura', icon: Flame, color: 'var(--mt-warning)' },
  LUBRICATION: { label: 'Lubricación', icon: Droplet, color: 'var(--mt-accent)' },
  SUPERVISOR: { label: 'Supervisor', icon: Shield, color: 'var(--mt-success)' },
  MANAGER: { label: 'Jefe de Mantenimiento', icon: Award, color: 'var(--mt-accent)' },
};

const PLANTS = [
  'Planta Jilotepec',
  'Planta Toluca',
  'Planta Mexico City',
  'Planta Guadalajara',
  'Planta Monterrey',
];

export default function NewTechnician() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    speciality: 'MECHANIC',
    plant: 'Planta Jilotepec',
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
        certifications: [...prev.certifications, prev.newCertification],
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
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const technicianData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        speciality: formData.speciality,
        plant: formData.plant,
        certifications: formData.certifications,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
      };

      await maintenanceApi.createTechnician(technicianData);
      navigate('/maintenance/app/personnel');
    } catch (error) {
      console.error('Error creating technician:', error);
      alert('Error al crear técnico. Intenta de nuevo.');
    }
  };

  const spec = SPECIALITIES[formData.speciality];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
        <button
          onClick={() => navigate('/maintenance/app/personnel')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: 'var(--mt-radius-md)',
            border: '1px solid var(--mt-border)',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--mt-text-secondary)',
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0 }}>
            Nuevo Técnico
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Ingresa los datos del nuevo personal técnico
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
        {/* Basic Information */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
              Información Básica
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--mt-space-lg)' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Juan Pérez García"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--mt-radius-md)',
                    fontSize: '13px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-surface)',
                    color: 'var(--mt-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="juan.perez@company.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--mt-radius-md)',
                    fontSize: '13px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-surface)',
                    color: 'var(--mt-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+56 9 1234 5678"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--mt-radius-md)',
                    fontSize: '13px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-surface)',
                    color: 'var(--mt-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>
        </MtCard>

        {/* Assignment */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
              Asignación
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--mt-space-lg)' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Especialidad *
                </label>
                <select
                  value={formData.speciality}
                  onChange={(e) => handleChange('speciality', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--mt-radius-md)',
                    fontSize: '13px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-surface)',
                    color: 'var(--mt-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {Object.entries(SPECIALITIES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Planta Asignada *
                </label>
                <select
                  value={formData.plant}
                  onChange={(e) => handleChange('plant', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--mt-radius-md)',
                    fontSize: '13px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-surface)',
                    color: 'var(--mt-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {PLANTS.map(plant => (
                    <option key={plant} value={plant}>
                      {plant}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </MtCard>

        {/* Certifications */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
              Certificaciones
            </h2>

            <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Agregar Certificación
              </label>
              <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
                <input
                  type="text"
                  value={formData.newCertification}
                  onChange={(e) => handleChange('newCertification', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCertification();
                    }
                  }}
                  placeholder="Ej: Mecánica Industrial, Seguridad en Altura"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 'var(--mt-radius-md)',
                    fontSize: '13px',
                    border: '1px solid var(--mt-border)',
                    background: 'var(--mt-bg-surface)',
                    color: 'var(--mt-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCertification}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--mt-radius-md)',
                    background: 'var(--mt-accent)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>

            {formData.certifications.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--mt-space-sm)' }}>
                {formData.certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--mt-radius-full)',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid var(--mt-accent)',
                    }}
                  >
                    <Award size={14} style={{ color: 'var(--mt-accent)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--mt-text-primary)' }}>{cert}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '4px',
                      }}
                    >
                      <X size={14} style={{ color: 'var(--mt-text-tertiary)' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MtCard>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--mt-space-md)', justifyContent: 'flex-end' }}>
          <MtButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/maintenance/app/personnel')}
          >
            Cancelar
          </MtButton>
          <MtButton type="submit">
            <Save size={16} />
            Guardar Técnico
          </MtButton>
        </div>
      </form>
    </div>
  );
}
