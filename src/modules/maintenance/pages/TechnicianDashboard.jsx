import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import {
  Wrench, Calendar, Clock, CheckCircle2, AlertCircle, ChevronRight,
  User, Briefcase, BarChart3, History, Plus
} from 'lucide-react';
import '../ui/tokens.css';

// Mock technician data
const MOCK_TECHNICIAN = {
  id: 1,
  name: 'Juan Pérez',
  speciality: 'Mecánica',
  phone: '+56 9 1234 5678',
};

// Mock work orders for technician
const MOCK_WORK_ORDERS = [
  {
    id: 1,
    type: 'CORRECTIVE',
    priority: 'HIGH',
    title: 'Ruido anormal en bomba',
    assetName: 'Bomba Principal',
    assetCode: 'EQ-001',
    status: 'ASSIGNED',
    daysOpen: 0.1,
    reportedBy: 'José López',
    createdAt: '2025-11-28 14:30',
  },
  {
    id: 2,
    type: 'PREVENTIVE',
    priority: 'MEDIUM',
    title: 'Mantenimiento Motor',
    assetName: 'Motor eléctrico',
    assetCode: 'EQ-001',
    status: 'ASSIGNED',
    daysOpen: 0.5,
    scheduledDate: '2025-12-15',
    createdAt: '2025-11-28 10:00',
  },
  {
    id: 3,
    type: 'CORRECTIVE',
    priority: 'CRITICAL',
    title: 'Falla en reductor',
    assetName: 'Reductor',
    assetCode: 'EQ-002',
    status: 'IN_PROGRESS',
    daysOpen: 0.08,
    reportedBy: 'Carlos García',
    createdAt: '2025-11-28 15:00',
  },
  {
    id: 4,
    type: 'PREVENTIVE',
    priority: 'LOW',
    title: 'Inspección Compresor',
    assetName: 'Compresor',
    assetCode: 'EQ-004',
    status: 'ASSIGNED',
    daysOpen: 1,
    scheduledDate: '2025-12-20',
    createdAt: '2025-11-27 09:00',
  },
];

// Mock completed work orders
const MOCK_COMPLETED_ORDERS = [
  {
    id: 101,
    title: 'Cambio de aceite',
    assetName: 'Motor A',
    status: 'VALIDATED',
    completedAt: '2025-11-26 16:30',
    timeSpent: 2.5,
  },
  {
    id: 102,
    title: 'Reparación válvula',
    assetName: 'Bomba B',
    status: 'VALIDATED',
    completedAt: '2025-11-25 14:00',
    timeSpent: 1.5,
  },
];

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const [technician] = useState(MOCK_TECHNICIAN);
  const [workOrders] = useState(MOCK_WORK_ORDERS);
  const [completedOrders] = useState(MOCK_COMPLETED_ORDERS);

  const assignedCount = workOrders.filter(o => o.status === 'ASSIGNED').length;
  const inProgressCount = workOrders.filter(o => o.status === 'IN_PROGRESS').length;
  const totalHours = completedOrders.reduce((sum, o) => sum + o.timeSpent, 0);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertCircle size={16} style={{ color: 'var(--mt-danger)' }} />;
      case 'HIGH':
        return <AlertCircle size={16} style={{ color: 'var(--mt-warning)' }} />;
      default:
        return <Wrench size={16} style={{ color: 'var(--mt-accent)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Technician Profile Card */}
      <MtCard elevated style={{ background: 'linear-gradient(135deg, var(--mt-bg-surface) 0%, var(--mt-bg-surface-2) 100%)' }}>
        <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--mt-space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--mt-radius-md)',
                background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
              }}
            >
              <User size={28} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: 'var(--mt-text-primary)' }}>
                {technician.name}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                {technician.speciality}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: '2px 0 0 0' }}>
                {technician.phone}
              </p>
            </div>
          </div>
        </div>
      </MtCard>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated style={{ background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Briefcase size={16} style={{ color: 'var(--mt-warning)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>ASIGNADAS</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-warning)' }}>
              {assignedCount}
            </div>
          </div>
        </MtCard>

        <MtCard elevated style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Wrench size={16} style={{ color: 'var(--mt-accent)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>EN PROCESO</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-accent)' }}>
              {inProgressCount}
            </div>
          </div>
        </MtCard>

        <MtCard elevated style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--mt-success)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>COMPLETADAS</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-success)' }}>
              {completedOrders.length}
            </div>
          </div>
        </MtCard>

        <MtCard elevated style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Clock size={16} style={{ color: 'var(--mt-info)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>HORAS HOY</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--mt-info)' }}>
              {totalHours.toFixed(1)}h
            </div>
          </div>
        </MtCard>
      </div>

      {/* Assigned Work Orders */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={20} />
            Mis Órdenes
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', fontWeight: '700' }}>
            {workOrders.length} pendientes
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
          {workOrders.map((order) => (
            <MtCard
              key={order.id}
              elevated
              style={{
                borderLeft: order.priority === 'CRITICAL' ? '4px solid var(--mt-danger)' : order.priority === 'HIGH' ? '4px solid var(--mt-warning)' : '4px solid var(--mt-accent)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div
                style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                onClick={() => navigate(`/maintenance/app/work-orders/${order.id}/execute`)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-sm)' }}>
                    <div>{getPriorityIcon(order.priority)}</div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--mt-text-primary)' }}>
                      {order.title}
                    </h4>
                    <MtBadge size="sm" variant={order.type === 'CORRECTIVE' ? 'danger' : 'info'}>
                      {order.type === 'CORRECTIVE' ? 'Correctiva' : 'Preventiva'}
                    </MtBadge>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '6px' }}>
                    {order.assetName} ({order.assetCode})
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--mt-space-md)', fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>
                    <span>{order.status === 'IN_PROGRESS' ? 'En curso' : 'Pendiente'}</span>
                    <span>•</span>
                    <span>{order.daysOpen < 1 ? `${Math.round(order.daysOpen * 24)}h` : `${order.daysOpen.toFixed(1)}d`}</span>
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--mt-text-tertiary)' }} />
              </div>
            </MtCard>
          ))}
        </div>
      </div>

      {/* Completed Work Orders */}
      {completedOrders.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} />
            Historial Reciente
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {completedOrders.map((order) => (
              <MtCard key={order.id} elevated style={{ borderLeft: '4px solid var(--mt-success)', opacity: 0.8 }}>
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--mt-space-sm)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--mt-text-primary)' }}>
                      {order.title}
                    </h4>
                    <MtBadge variant="success" size="sm">Completada</MtBadge>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '6px' }}>
                    {order.assetName}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--mt-space-md)', fontSize: '11px', color: 'var(--mt-text-tertiary)' }}>
                    <span>{new Date(order.completedAt).toLocaleDateString('es-MX')}</span>
                    <span>•</span>
                    <span>{order.timeSpent}h</span>
                  </div>
                </div>
              </MtCard>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Button */}
      <div style={{ position: 'fixed', bottom: 'var(--mt-space-lg)', right: 'var(--mt-space-lg)', zIndex: 40 }}>
        <MtButton
          onClick={() => navigate('/maintenance/app/report-failure')}
          style={{
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)',
          }}
        >
          <Plus size={24} />
        </MtButton>
      </div>
    </div>
  );
}
