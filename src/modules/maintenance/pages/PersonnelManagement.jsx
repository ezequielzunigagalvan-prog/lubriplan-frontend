import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton, MtInput } from '../ui';
import {
  Users, Search, Plus, Filter, Award, Clock, TrendingUp, AlertCircle,
  Wrench, Zap, Droplet, Flame, Gauge, Shield, ChevronRight, Grid3x3
} from 'lucide-react';
import '../ui/tokens.css';

// Speciality definitions
const SPECIALITIES = {
  MECHANIC: { label: 'Mecánica', icon: Wrench, color: 'var(--mt-warning)' },
  ELECTRICAL: { label: 'Eléctrica', icon: Zap, color: 'var(--mt-danger)' },
  INSTRUMENTS: { label: 'Instrumentación', icon: Gauge, color: 'var(--mt-info)' },
  WELDING: { label: 'Soldadura', icon: Flame, color: 'var(--mt-warning)' },
  LUBRICATION: { label: 'Lubricación', icon: Droplet, color: 'var(--mt-accent)' },
  SUPERVISOR: { label: 'Supervisor', icon: Shield, color: 'var(--mt-success)' },
  MANAGER: { label: 'Jefe de Mantenimiento', icon: Award, color: 'var(--mt-accent)' },
};

const MOCK_TECHNICIANS = [
  {
    id: 1,
    name: 'Juan Pérez',
    speciality: 'MECHANIC',
    plant: 'Planta Jilotepec',
    email: 'juan.perez@company.com',
    phone: '+56 9 1234 5678',
    status: 'active',
    hoursThisMonth: 168,
    ordersCompleted: 24,
    compliance: 96,
    certifications: ['Mecánica Industrial', 'Seguridad en Altura'],
    joinDate: '2020-03-15',
  },
  {
    id: 2,
    name: 'Carlos López',
    speciality: 'ELECTRICAL',
    plant: 'Planta Jilotepec',
    email: 'carlos.lopez@company.com',
    phone: '+56 9 2345 6789',
    status: 'active',
    hoursThisMonth: 156,
    ordersCompleted: 19,
    compliance: 88,
    certifications: ['Electricidad Industrial', 'NEC 2020'],
    joinDate: '2021-06-20',
  },
  {
    id: 3,
    name: 'Roberto García',
    speciality: 'INSTRUMENTS',
    plant: 'Planta Toluca',
    email: 'roberto.garcia@company.com',
    phone: '+56 9 3456 7890',
    status: 'active',
    hoursThisMonth: 172,
    ordersCompleted: 21,
    compliance: 92,
    certifications: ['Instrumentación ISA', 'Calibración'],
    joinDate: '2019-11-10',
  },
  {
    id: 4,
    name: 'Miguel Torres',
    speciality: 'LUBRICATION',
    plant: 'Planta Jilotepec',
    email: 'miguel.torres@company.com',
    phone: '+56 9 4567 8901',
    status: 'active',
    hoursThisMonth: 160,
    ordersCompleted: 28,
    compliance: 98,
    certifications: ['Lubricación ISO', 'Análisis de Aceites'],
    joinDate: '2022-01-05',
  },
  {
    id: 5,
    name: 'Ana Martínez',
    speciality: 'SUPERVISOR',
    plant: 'Planta Jilotepec',
    email: 'ana.martinez@company.com',
    phone: '+56 9 5678 9012',
    status: 'active',
    hoursThisMonth: 140,
    ordersCompleted: 15,
    compliance: 100,
    certifications: ['Supervisión de Mantenimiento', 'ISO 14224'],
    joinDate: '2018-05-12',
  },
];

export default function PersonnelManagement() {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState(MOCK_TECHNICIANS);
  const [search, setSearch] = useState('');
  const [filterSpeciality, setFilterSpeciality] = useState('all');
  const [filterPlant, setFilterPlant] = useState('all');

  const plants = [...new Set(technicians.map(t => t.plant))];
  const specialities = Object.keys(SPECIALITIES);

  const filtered = technicians.filter(tech => {
    const matchSearch = tech.name.toLowerCase().includes(search.toLowerCase());
    const matchSpeciality = filterSpeciality === 'all' || tech.speciality === filterSpeciality;
    const matchPlant = filterPlant === 'all' || tech.plant === filterPlant;
    return matchSearch && matchSpeciality && matchPlant;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Gestión de Personal
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            {technicians.length} técnicos | {technicians.filter(t => t.status === 'active').length} activos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--mt-space-md)' }}>
          <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/skills-matrix')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Grid3x3 size={20} />
            Matriz Habilidades
          </MtButton>
          <MtButton onClick={() => navigate('/maintenance/app/personnel/new')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={20} />
            Agregar Técnico
          </MtButton>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Users size={16} style={{ color: 'var(--mt-accent)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>TOTAL</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-accent)' }}>
              {technicians.length}
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <TrendingUp size={16} style={{ color: 'var(--mt-success)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>ACTIVOS</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-success)' }}>
              {technicians.filter(t => t.status === 'active').length}
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Clock size={16} style={{ color: 'var(--mt-info)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>HORAS MES</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-info)' }}>
              {Math.round(technicians.reduce((sum, t) => sum + t.hoursThisMonth, 0) / technicians.length)}h
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Award size={16} style={{ color: 'var(--mt-warning)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>CUMPLIM.</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-warning)' }}>
              {Math.round(technicians.reduce((sum, t) => sum + t.compliance, 0) / technicians.length)}%
            </div>
          </div>
        </MtCard>
      </div>

      {/* Filters */}
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar técnico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                borderRadius: 'var(--mt-radius-md)',
                fontSize: '14px',
                border: '1px solid var(--mt-border)',
                background: 'var(--mt-bg-surface)',
                color: 'var(--mt-text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', overflowX: 'auto', paddingBottom: 'var(--mt-space-sm)' }}>
            <button
              onClick={() => setFilterSpeciality('all')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--mt-radius-full)',
                fontWeight: '600',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                border: filterSpeciality === 'all' ? '2px solid var(--mt-accent)' : '1px solid var(--mt-border)',
                cursor: 'pointer',
                background: filterSpeciality === 'all' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                color: filterSpeciality === 'all' ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
              }}
            >
              Todas las especialidades
            </button>
            {specialities.map(spec => (
              <button
                key={spec}
                onClick={() => setFilterSpeciality(spec)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--mt-radius-full)',
                  fontWeight: '600',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  border: filterSpeciality === spec ? `2px solid ${SPECIALITIES[spec].color}` : '1px solid var(--mt-border)',
                  cursor: 'pointer',
                  background: filterSpeciality === spec ? `${SPECIALITIES[spec].color}20` : 'transparent',
                  color: filterSpeciality === spec ? SPECIALITIES[spec].color : 'var(--mt-text-secondary)',
                }}
              >
                {SPECIALITIES[spec].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Technicians Grid */}
      {filtered.length === 0 ? (
        <MtCard elevated>
          <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
            <Users size={48} style={{ color: 'var(--mt-accent)', marginBottom: 'var(--mt-space-md)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
              Sin técnicos
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              No hay técnicos que coincidan con tu búsqueda
            </p>
          </div>
        </MtCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          {filtered.map((tech) => {
            const SpecIcon = SPECIALITIES[tech.speciality].icon;
            return (
              <MtCard
                key={tech.id}
                elevated
                style={{ cursor: 'pointer', transition: 'all 200ms ease' }}
                onClick={() => navigate(`/maintenance/app/personnel/${tech.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(56, 189, 248, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-lg)' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--mt-radius-md)',
                        background: `${SPECIALITIES[tech.speciality].color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <SpecIcon size={24} style={{ color: SPECIALITIES[tech.speciality].color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                        {tech.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                        {SPECIALITIES[tech.speciality].label}
                      </p>
                    </div>
                    <MtBadge variant="success" size="sm">
                      Activo
                    </MtBadge>
                  </div>

                  {/* Contact Info */}
                  <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginBottom: 'var(--mt-space-lg)', paddingBottom: 'var(--mt-space-lg)', borderBottom: '1px solid var(--mt-border)' }}>
                    <div style={{ marginBottom: '4px' }}>📧 {tech.email}</div>
                    <div>📱 {tech.phone}</div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-lg)' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>HORAS</div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--mt-accent)' }}>{tech.hoursThisMonth}h</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>ÓRDENES</div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--mt-info)' }}>{tech.ordersCompleted}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>CUMPLIM.</div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: tech.compliance >= 95 ? 'var(--mt-success)' : 'var(--mt-warning)' }}>
                        {tech.compliance}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '2px' }}>DESDE</div>
                      <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                        {new Date(tech.joinDate).getFullYear()}
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  {tech.certifications.length > 0 && (
                    <div style={{ marginBottom: 'var(--mt-space-md)' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>CERTIFICACIONES</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {tech.certifications.slice(0, 2).map((cert, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              background: 'var(--mt-bg-base)',
                              padding: '2px 6px',
                              borderRadius: 'var(--mt-radius-full)',
                              color: 'var(--mt-text-secondary)',
                            }}
                          >
                            {cert}
                          </span>
                        ))}
                        {tech.certifications.length > 2 && (
                          <span
                            style={{
                              fontSize: '11px',
                              background: 'var(--mt-bg-base)',
                              padding: '2px 6px',
                              borderRadius: 'var(--mt-radius-full)',
                              color: 'var(--mt-text-tertiary)',
                            }}
                          >
                            +{tech.certifications.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Button */}
                  <button
                    onClick={() => navigate(`/maintenance/app/personnel/${tech.id}`)}
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-md)',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid var(--mt-accent)',
                      borderRadius: 'var(--mt-radius-md)',
                      color: 'var(--mt-accent)',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(56, 189, 248, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(56, 189, 248, 0.1)';
                    }}
                  >
                    Ver Perfil
                    <ChevronRight size={14} />
                  </button>
                </div>
              </MtCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
