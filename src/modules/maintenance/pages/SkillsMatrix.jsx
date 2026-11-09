import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge } from '../ui';
import {
  ChevronLeft, Filter, Download, Grid3x3, List, CheckCircle2, AlertCircle,
  Wrench, Zap, Gauge
} from 'lucide-react';
import '../ui/tokens.css';

// Mock skills matrix data
const MOCK_SKILLS_DATA = [
  {
    technician: 'Juan Pérez',
    speciality: 'MECHANIC',
    skills: [
      { skill: 'Bomba Centrífuga', level: 95 },
      { skill: 'Motor Eléctrico', level: 88 },
      { skill: 'Reductor', level: 92 },
      { skill: 'Compresor', level: 85 },
      { skill: 'Turbina', level: 45 },
    ],
  },
  {
    technician: 'Carlos López',
    speciality: 'ELECTRICAL',
    skills: [
      { skill: 'Motor Eléctrico', level: 98 },
      { skill: 'Variador Frecuencia', level: 90 },
      { skill: 'PLC', level: 80 },
      { skill: 'Bomba Centrífuga', level: 60 },
      { skill: 'Transformador', level: 95 },
    ],
  },
  {
    technician: 'Roberto García',
    speciality: 'INSTRUMENTS',
    skills: [
      { skill: 'Transmisor Presión', level: 96 },
      { skill: 'Indicador Temperatura', level: 94 },
      { skill: 'Calibración', level: 98 },
      { skill: 'PLC', level: 85 },
      { skill: 'SCADA', level: 88 },
    ],
  },
  {
    technician: 'Miguel Torres',
    speciality: 'LUBRICATION',
    skills: [
      { skill: 'Análisis Aceite', level: 99 },
      { skill: 'Lubricación General', level: 100 },
      { skill: 'Motor Eléctrico', level: 75 },
      { skill: 'Reductor', level: 90 },
      { skill: 'Bomba Centrífuga', level: 85 },
    ],
  },
];

const EQUIPMENT_LIST = [
  'Bomba Centrífuga',
  'Motor Eléctrico',
  'Reductor',
  'Compresor',
  'Turbina',
  'Variador Frecuencia',
  'PLC',
  'Transformador',
  'Transmisor Presión',
  'Indicador Temperatura',
  'Calibración',
  'SCADA',
  'Análisis Aceite',
  'Lubricación General',
];

const SPECIALITIES = {
  MECHANIC: { label: 'Mecánica', color: '#FFA500' },
  ELECTRICAL: { label: 'Eléctrica', color: '#FF0000' },
  INSTRUMENTS: { label: 'Instrumentación', color: '#0084FF' },
  WELDING: { label: 'Soldadura', color: '#FFA500' },
  LUBRICATION: { label: 'Lubricación', color: '#38BDF8' },
  SUPERVISOR: { label: 'Supervisor', color: '#10B981' },
  MANAGER: { label: 'Jefe de Mantenimiento', color: '#38BDF8' },
};

export default function SkillsMatrix() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [minLevel, setMinLevel] = useState(70);
  const [selectedSpeciality, setSelectedSpeciality] = useState('all');

  const filtered = MOCK_SKILLS_DATA.filter(item =>
    selectedSpeciality === 'all' || item.speciality === selectedSpeciality
  );

  const getSkillColor = (level) => {
    if (level >= 90) return 'var(--mt-success)';
    if (level >= 75) return 'var(--mt-warning)';
    return 'var(--mt-danger)';
  };

  const getLevelBadge = (level) => {
    if (level >= 90) return 'Experto';
    if (level >= 80) return 'Avanzado';
    if (level >= 70) return 'Intermedio';
    return 'Básico';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
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
              Matriz de Habilidades
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              Visualiza quién está calificado para cada equipamiento
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--mt-radius-md)',
              background: viewMode === 'grid' ? 'var(--mt-accent)' : 'var(--mt-bg-surface)',
              color: viewMode === 'grid' ? '#fff' : 'var(--mt-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Grid3x3 size={16} />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--mt-radius-md)',
              background: viewMode === 'list' ? 'var(--mt-accent)' : 'var(--mt-bg-surface)',
              color: viewMode === 'list' ? '#fff' : 'var(--mt-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <List size={16} />
            Lista
          </button>
        </div>
      </div>

      {/* Filters */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Especialidad
              </label>
              <select
                value={selectedSpeciality}
                onChange={(e) => setSelectedSpeciality(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--mt-radius-md)',
                  fontSize: '13px',
                  border: '1px solid var(--mt-border)',
                  background: 'var(--mt-bg-surface)',
                  color: 'var(--mt-text-primary)',
                  outline: 'none',
                }}
              >
                <option value="all">Todas</option>
                {Object.entries(SPECIALITIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Nivel Mínimo: {minLevel}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minLevel}
                onChange={(e) => setMinLevel(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </MtCard>

      {/* View Content */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          {filtered.map((item, idx) => {
            const spec = SPECIALITIES[item.speciality];
            return (
              <MtCard key={idx} elevated style={{ background: `linear-gradient(135deg, ${spec.color}20 0%, ${spec.color}10 100%)` }}>
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-sm) 0' }}>
                    {item.technician}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
                    {spec.label}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                    {item.skills.map((skill, sidx) => (
                      <div key={sidx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                            {skill.skill}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: getSkillColor(skill.level) }}>
                            {skill.level}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: '4px',
                            borderRadius: '2px',
                            background: 'var(--mt-bg-base)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${skill.level}%`,
                              background: getSkillColor(skill.level),
                              transition: 'width 300ms ease',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--mt-text-tertiary)', marginTop: 'var(--mt-space-lg)', paddingTop: 'var(--mt-space-lg)', borderTop: '1px solid var(--mt-border)' }}>
                    {item.skills.filter(s => s.level >= 90).length} Experto • {item.skills.filter(s => s.level >= 75 && s.level < 90).length} Avanzado
                  </div>
                </div>
              </MtCard>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          {filtered.map((item, idx) => {
            const spec = SPECIALITIES[item.speciality];
            return (
              <MtCard key={idx} elevated style={{ borderLeft: `4px solid ${spec.color}` }}>
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--mt-space-lg)' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: '4px' }}>
                        {item.technician}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                        {spec.label}
                      </p>
                    </div>
                    <MtBadge variant="info" size="sm">
                      {item.skills.length} habilidades
                    </MtBadge>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--mt-space-sm)' }}>
                    {item.skills.map((skill, sidx) => {
                      const skillLevel = getLevelBadge(skill.level);
                      const color = getSkillColor(skill.level);
                      return (
                        <div
                          key={sidx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: 'var(--mt-radius-full)',
                            background: skill.level >= 80 ? `${color}20` : 'var(--mt-bg-base)',
                            border: `1px solid ${color}`,
                            fontSize: '11px',
                            fontWeight: '700',
                            color: color,
                          }}
                        >
                          {skill.level >= 80 ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          {skill.skill} ({skill.level}%)
                        </div>
                      );
                    })}
                  </div>
                </div>
              </MtCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
