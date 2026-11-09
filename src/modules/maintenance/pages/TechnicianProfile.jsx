import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import {
  ChevronLeft, Mail, Phone, MapPin, Briefcase, Clock, TrendingUp, Award,
  CheckCircle2, AlertCircle, Edit3, Trash2, Calendar, BarChart3, Book
} from 'lucide-react';
import '../ui/tokens.css';

// Mock technicians database
const MOCK_TECHNICIANS_DB = {
  1: {
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
    recentOrders: [
      { id: 101, title: 'Cambio de aceite Motor A', status: 'VALIDATED', date: '2025-11-26', hours: 2.5 },
      { id: 102, title: 'Reparación válvula Bomba B', status: 'VALIDATED', date: '2025-11-25', hours: 1.5 },
      { id: 103, title: 'Inspección Compresor C', status: 'IN_PROGRESS', date: '2025-11-28', hours: 1 },
    ],
    skills: [
      { skill: 'Mecánica Industrial', level: 95, equipment: ['Bombas', 'Motores', 'Reductores'] },
      { skill: 'Diagnóstico', level: 88, equipment: ['Vibraciones', 'Ruidos'] },
      { skill: 'Seguridad', level: 100, equipment: ['PPE', 'Procedimientos'] },
    ],
    performanceMetrics: {
      weeklyOrders: 6,
      averageHours: 28,
      accuracy: 98,
      safetyIncidents: 0,
    },
  },
};

const SPECIALITIES = {
  MECHANIC: { label: 'Mecánica', color: '#FFA500' },
  ELECTRICAL: { label: 'Eléctrica', color: '#FF0000' },
  INSTRUMENTS: { label: 'Instrumentación', color: '#0084FF' },
  WELDING: { label: 'Soldadura', color: '#FFA500' },
  LUBRICATION: { label: 'Lubricación', color: '#38BDF8' },
  SUPERVISOR: { label: 'Supervisor', color: '#10B981' },
  MANAGER: { label: 'Jefe de Mantenimiento', color: '#38BDF8' },
};

export default function TechnicianProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [technician, setTechnician] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const tech = MOCK_TECHNICIANS_DB[parseInt(id)];
    if (tech) {
      setTechnician(tech);
    } else {
      navigate('/maintenance/app/personnel');
    }
  }, [id, navigate]);

  if (!technician) {
    return <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>Cargando...</div>;
  }

  const spec = SPECIALITIES[technician.speciality];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header with Back Button */}
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
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.1)';
            e.target.style.color = 'var(--mt-accent)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = 'var(--mt-text-secondary)';
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0 }}>
            {technician.name}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            {spec.label} • {technician.plant}
          </p>
        </div>
        <MtButton variant="secondary" size="sm">
          <Edit3 size={16} />
          Editar
        </MtButton>
      </div>

      {/* Profile Card */}
      <MtCard elevated style={{ background: `linear-gradient(135deg, ${spec.color}20 0%, ${spec.color}10 100%)` }}>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
            {/* Contact */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Contacto
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                  <Mail size={16} style={{ color: 'var(--mt-accent)' }} />
                  {technician.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                  <Phone size={16} style={{ color: 'var(--mt-accent)' }} />
                  {technician.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                  <MapPin size={16} style={{ color: 'var(--mt-accent)' }} />
                  {technician.plant}
                </div>
              </div>
            </div>

            {/* Employment Info */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Información
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Especialidad</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>{spec.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Desde</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                    {new Date(technician.joinDate).toLocaleDateString('es-MX')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Estado</div>
                  <MtBadge variant="success" size="sm">Activo</MtBadge>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Rendimiento
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} style={{ color: 'var(--mt-accent)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                    <strong>{technician.hoursThisMonth}h</strong> este mes
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--mt-success)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                    <strong>{technician.ordersCompleted}</strong> órdenes
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} style={{ color: 'var(--mt-warning)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--mt-text-primary)' }}>
                    <strong>{technician.compliance}%</strong> cumplimiento
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MtCard>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', borderBottom: '1px solid var(--mt-border)', paddingBottom: 'var(--mt-space-lg)' }}>
        {['overview', 'orders', 'skills', 'certifications'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: 'var(--mt-space-md) var(--mt-space-lg)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              color: activeTab === tab ? 'var(--mt-accent)' : 'var(--mt-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--mt-accent)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BarChart3 size={16} style={{ color: 'var(--mt-accent)' }} />
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>ÓRDENES SEMANA</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-accent)', marginBottom: '8px' }}>
                {technician.performanceMetrics.weeklyOrders}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Promedio: {technician.performanceMetrics.averageHours}h/semana</div>
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--mt-success)' }} />
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>PRECISIÓN</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-success)', marginBottom: '8px' }}>
                {technician.performanceMetrics.accuracy}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Calidad de ejecución</div>
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={16} style={{ color: 'var(--mt-info)' }} />
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>SEGURIDAD</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-success)', marginBottom: '8px' }}>
                0
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Incidentes de seguridad</div>
            </div>
          </MtCard>
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: 0 }}>
            Órdenes Recientes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {technician.recentOrders.map((order) => (
              <MtCard key={order.id} elevated>
                <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: 0, marginBottom: '4px' }}>
                      {order.title}
                    </h4>
                    <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', display: 'flex', gap: '8px' }}>
                      <span>{new Date(order.date).toLocaleDateString('es-MX')}</span>
                      <span>•</span>
                      <span>{order.hours}h</span>
                    </div>
                  </div>
                  <MtBadge variant={order.status === 'VALIDATED' ? 'success' : 'info'} size="sm">
                    {order.status === 'VALIDATED' ? 'Completada' : 'En Proceso'}
                  </MtBadge>
                </div>
              </MtCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: 0 }}>
            Matriz de Habilidades
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
            {technician.skills.map((skill, idx) => (
              <MtCard key={idx} elevated>
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <div style={{ marginBottom: 'var(--mt-space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                        {skill.skill}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-accent)' }}>
                        {skill.level}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '3px',
                        background: 'var(--mt-bg-base)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${skill.level}%`,
                          background: 'linear-gradient(90deg, var(--mt-accent), var(--mt-accent-strong))',
                          transition: 'width 300ms ease',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                    <strong>Equipos:</strong> {skill.equipment.join(', ')}
                  </div>
                </div>
              </MtCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'certifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: 0 }}>
            Certificaciones y Capacitaciones
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {technician.certifications.map((cert, idx) => (
              <MtCard key={idx} elevated style={{ borderLeft: '3px solid var(--mt-accent)' }}>
                <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
                  <Award size={24} style={{ color: 'var(--mt-accent)' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: 0, marginBottom: '2px' }}>
                      {cert}
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      Vigente hasta Dic 2026
                    </p>
                  </div>
                  <MtBadge variant="success" size="sm">Vigente</MtBadge>
                </div>
              </MtCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
