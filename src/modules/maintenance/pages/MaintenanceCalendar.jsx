import { useState, useEffect } from 'react';
import { MtCard, MtBadge } from '../ui';
import { getUpcomingMaintenance, getOverdueMaintenance, getMaintenanceStats } from '../services/preventiveAutomation';
import { Calendar, AlertTriangle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import '../ui/tokens.css';

const MOCK_PLANS = [
  { id: 1, activity: 'Inspección general', assetName: 'Motor eléctrico', assetCode: 'EQ-001', frequency: 'MONTHLY', nextDate: '2025-12-15', status: 'active', assignedTo: 'Juan Pérez', estimatedHours: 2 },
  { id: 2, activity: 'Inspección de fugas', assetName: 'Reductor', assetCode: 'EQ-002', frequency: 'WEEKLY', nextDate: '2025-12-02', status: 'active', assignedTo: 'Carlos López', estimatedHours: 1 },
  { id: 3, activity: 'Revisión de sellos', assetName: 'Bomba centrífuga', assetCode: 'EQ-003', frequency: 'MONTHLY', nextDate: '2025-12-10', status: 'active', assignedTo: 'Roberto García', estimatedHours: 3 },
  { id: 4, activity: 'Cambio de filtros', assetName: 'Compresor', assetCode: 'EQ-004', frequency: 'QUARTERLY', nextDate: '2025-11-30', status: 'active', assignedTo: 'Miguel Torres', estimatedHours: 4 },
];

export default function MaintenanceCalendar() {
  const [plans] = useState(MOCK_PLANS);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [overdueMaintenance, setOverdueMaintenance] = useState([]);
  const [stats, setStats] = useState({});
  const [viewMode, setViewMode] = useState('upcoming');

  useEffect(() => {
    const upcoming = getUpcomingMaintenance(plans, 30);
    const overdue = getOverdueMaintenance(plans);
    const maintenanceStats = getMaintenanceStats(plans);
    setUpcomingMaintenance(upcoming);
    setOverdueMaintenance(overdue);
    setStats(maintenanceStats);
  }, []);

  const getDaysUntil = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysOverdue = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffDays = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const displayedMaintenance = viewMode === 'overdue' ? overdueMaintenance : viewMode === 'upcoming' ? upcomingMaintenance : [...overdueMaintenance, ...upcomingMaintenance];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--mt-radius-md)', background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={28} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-primary)' }}>
            Calendario de Mantenimiento
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            Cronograma de mantenimiento preventivo
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated style={{ background: 'rgba(244, 65, 82, 0.05)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <AlertTriangle size={16} style={{ color: 'var(--mt-danger)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>VENCIDAS</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-danger)' }}>{stats.overdue || 0}</div>
          </div>
        </MtCard>

        <MtCard elevated style={{ background: 'rgba(251, 191, 36, 0.05)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Clock size={16} style={{ color: 'var(--mt-warning)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>PRÓXIMAS 7D</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-warning)' }}>{stats.next7Days || 0}</div>
          </div>
        </MtCard>

        <MtCard elevated style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--mt-success)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>PRÓXIMOS 30D</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-success)' }}>{stats.next30Days || 0}</div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Calendar size={16} style={{ color: 'var(--mt-accent)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>ACTIVOS</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-accent)' }}>{stats.active || 0}/{stats.total || 0}</div>
          </div>
        </MtCard>
      </div>

      <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
        {['overdue', 'upcoming', 'all'].map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '8px 16px', borderRadius: 'var(--mt-radius-full)', fontWeight: '600', fontSize: '13px', border: viewMode === mode ? '2px solid var(--mt-accent)' : '1px solid var(--mt-border)', cursor: 'pointer', background: viewMode === mode ? 'rgba(56, 189, 248, 0.1)' : 'transparent', color: viewMode === mode ? 'var(--mt-accent)' : 'var(--mt-text-secondary)' }}>
            {mode === 'overdue' ? 'Vencidas' : mode === 'upcoming' ? 'Próximas' : 'Todas'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        {displayedMaintenance.map((m) => {
          const isOverdue = new Date(m.nextDate) < new Date();
          const daysValue = isOverdue ? getDaysOverdue(m.nextDate) : getDaysUntil(m.nextDate);
          return (
            <MtCard key={m.id} elevated style={{ borderLeft: isOverdue ? '4px solid var(--mt-danger)' : daysValue <= 3 ? '4px solid var(--mt-warning)' : '4px solid var(--mt-accent)' }}>
              <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--mt-text-primary)' }}>{m.activity}</h3>
                    <MtBadge variant={isOverdue ? 'danger' : daysValue <= 3 ? 'warning' : 'info'} size="sm">
                      {isOverdue ? `${daysValue}d vencida` : daysValue === 0 ? 'Hoy' : `En ${daysValue}d`}
                    </MtBadge>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
                    {m.assetName} ({m.assetCode}) • Responsable: {m.assignedTo} • {m.estimatedHours}h
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                    {new Date(m.nextDate).toLocaleDateString('es-MX')}
                  </p>
                </div>
                {isOverdue && <AlertTriangle size={20} style={{ color: 'var(--mt-danger)', marginLeft: 'var(--mt-space-md)' }} />}
              </div>
            </MtCard>
          );
        })}
      </div>
    </div>
  );
}
