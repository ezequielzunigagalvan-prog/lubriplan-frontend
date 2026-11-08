import { useState, useEffect } from 'react';
import { MtCard, MtBadge } from '../ui';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Zap, Wrench, AlertTriangle, BarChart3 } from 'lucide-react';

export default function ExecutiveDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Integrar con API real
      const mockData = {
        openOrders: 23,
        correctivePending: 8,
        preventivePending: 15,
        overdueOrders: 3,
        completedOrders: 156,
        preventiveCompliance: 87,
        operationalAvailability: 94,
        mttr: 4.2,
        mtbf: 720,
        maintenanceBacklog: 12,
        maintenanceCosts: 185400,
        costsTrend: -5, // Porcentaje

        // Gráficas
        correctiveVsPreventive: {
          corrective: 8,
          preventive: 15,
        },
        maintenanceByPlant: [
          { plant: 'Planta 1', orders: 12, cost: 45000 },
          { plant: 'Planta 2', orders: 8, cost: 38000 },
          { plant: 'Planta 3', orders: 3, cost: 18500 },
        ],
        failuresByEquipment: [
          { equipment: 'Bomba Principal', failures: 12 },
          { equipment: 'Compresor', failures: 8 },
          { equipment: 'Motor', failures: 6 },
          { equipment: 'Válvula', failures: 5 },
          { equipment: 'Convertidor', failures: 4 },
        ],
        equipmentDowntime: [
          { equipment: 'Bomba Principal', hours: 18.5 },
          { equipment: 'Compresor', hours: 12.3 },
          { equipment: 'Motor', hours: 8.7 },
        ],
        monthlyCosts: [
          { month: 'Sep', cost: 175000 },
          { month: 'Oct', cost: 195000 },
          { month: 'Nov', cost: 185400 },
        ],
        maintenanceCompliance: [
          { plan: 'Plan A', compliance: 92 },
          { plan: 'Plan B', compliance: 78 },
          { plan: 'Plan C', compliance: 88 },
        ],
        ordersBySpecialty: [
          { specialty: 'Mecánica', orders: 9, color: '#38BDF8' },
          { specialty: 'Eléctrica', orders: 7, color: '#FBBF24' },
          { specialty: 'Hidráulica', orders: 4, color: '#22C55E' },
          { specialty: 'Instrumentación', orders: 3, color: '#F44152' },
        ],
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando dashboard ejecutivo...</p>
        </div>
      </MtCard>
    );
  }

  if (!dashboardData) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Error cargando datos</p>
        </div>
      </MtCard>
    );
  }

  const getKpiColor = (value, thresholds) => {
    if (value >= thresholds.good) return 'var(--mt-success)';
    if (value >= thresholds.warning) return 'var(--mt-warning)';
    return 'var(--mt-danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={28} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
              Dashboard Ejecutivo
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              Estado operacional en tiempo real
            </p>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>
          Actualizado: {new Date().toLocaleTimeString('es-ES')}
        </div>
      </div>

      {/* KPI Row 1: Órdenes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        {/* Órdenes Abiertas */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} style={{ color: 'var(--mt-accent)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Abiertas
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
              {dashboardData.openOrders}
            </p>
          </div>
        </MtCard>

        {/* Correctivas Pendientes */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(244, 65, 82, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} style={{ color: 'var(--mt-danger)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Correctivas
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
              {dashboardData.correctivePending}
            </p>
          </div>
        </MtCard>

        {/* Preventivas Pendientes */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={20} style={{ color: 'var(--mt-warning)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Preventivas
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-warning)' }}>
              {dashboardData.preventivePending}
            </p>
          </div>
        </MtCard>

        {/* Órdenes Vencidas */}
        <MtCard elevated style={{ borderLeft: '4px solid var(--mt-danger)' }}>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(244, 65, 82, 0.15)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} style={{ color: 'var(--mt-danger)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Vencidas
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
              {dashboardData.overdueOrders}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--mt-danger)', margin: 0, marginTop: '4px', fontWeight: 'var(--mt-font-weight-bold)' }}>
              ⚠️ Requieren atención
            </p>
          </div>
        </MtCard>

        {/* Completadas */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} style={{ color: 'var(--mt-success)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Completadas
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)' }}>
              {dashboardData.completedOrders}
            </p>
          </div>
        </MtCard>
      </div>

      {/* KPI Row 2: Métricas Operacionales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        {/* Cumplimiento Preventivo */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              Cumplimiento Preventivo
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, marginBottom: 'var(--mt-space-sm)', color: getKpiColor(dashboardData.preventiveCompliance, { good: 85, warning: 70 }) }}>
              {dashboardData.preventiveCompliance}%
            </p>
            <div style={{ width: '100%', height: '6px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: getKpiColor(dashboardData.preventiveCompliance, { good: 85, warning: 70 }),
                  width: `${dashboardData.preventiveCompliance}%`,
                  transition: 'width 300ms ease',
                }}
              ></div>
            </div>
          </div>
        </MtCard>

        {/* Disponibilidad Operacional */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              Disponibilidad Operacional
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, marginBottom: 'var(--mt-space-sm)', color: getKpiColor(dashboardData.operationalAvailability, { good: 95, warning: 90 }) }}>
              {dashboardData.operationalAvailability}%
            </p>
            <div style={{ width: '100%', height: '6px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: getKpiColor(dashboardData.operationalAvailability, { good: 95, warning: 90 }),
                  width: `${dashboardData.operationalAvailability}%`,
                  transition: 'width 300ms ease',
                }}
              ></div>
            </div>
          </div>
        </MtCard>

        {/* MTTR */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              MTTR (Horas)
            </p>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>
              {dashboardData.mttr}h
            </p>
            <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginTop: '4px' }}>
              Tiempo promedio de reparación
            </p>
          </div>
        </MtCard>

        {/* MTBF */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              MTBF (Horas)
            </p>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>
              {dashboardData.mtbf}h
            </p>
            <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginTop: '4px' }}>
              Tiempo entre fallas
            </p>
          </div>
        </MtCard>

        {/* Backlog */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              Backlog
            </p>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: dashboardData.maintenanceBacklog > 10 ? 'var(--mt-warning)' : 'var(--mt-success)' }}>
              {dashboardData.maintenanceBacklog}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0, marginTop: '4px' }}>
              Órdenes pendientes
            </p>
          </div>
        </MtCard>

        {/* Costos */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              Costos Mensuales
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>
              ${(dashboardData.maintenanceCosts / 1000).toFixed(0)}K
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              {dashboardData.costsTrend < 0 ? (
                <>
                  <TrendingDown size={14} style={{ color: 'var(--mt-success)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--mt-success)', fontWeight: 'var(--mt-font-weight-bold)' }}>
                    {Math.abs(dashboardData.costsTrend)}% ↓
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp size={14} style={{ color: 'var(--mt-danger)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--mt-danger)', fontWeight: 'var(--mt-font-weight-bold)' }}>
                    {dashboardData.costsTrend}% ↑
                  </span>
                </>
              )}
            </div>
          </div>
        </MtCard>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        {/* Correctivos vs Preventivos */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              Correctivos vs Preventivos
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--mt-space-lg)', height: '150px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: `${(dashboardData.correctiveVsPreventive.corrective / 15) * 120}px`,
                    background: 'linear-gradient(180deg, var(--mt-danger), var(--mt-warning))',
                    borderRadius: 'var(--mt-radius-md)',
                    marginBottom: 'var(--mt-space-md)',
                  }}
                ></div>
                <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>
                  Correctivos
                </p>
                <p style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
                  {dashboardData.correctiveVsPreventive.corrective}
                </p>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: `${(dashboardData.correctiveVsPreventive.preventive / 15) * 120}px`,
                    background: 'linear-gradient(180deg, var(--mt-info), var(--mt-accent))',
                    borderRadius: 'var(--mt-radius-md)',
                    marginBottom: 'var(--mt-space-md)',
                  }}
                ></div>
                <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>
                  Preventivos
                </p>
                <p style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-info)' }}>
                  {dashboardData.correctiveVsPreventive.preventive}
                </p>
              </div>
            </div>
          </div>
        </MtCard>

        {/* Mantenimiento por Planta */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              Mantenimiento por Planta
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
              {dashboardData.maintenanceByPlant.map((plant) => (
                <div key={plant.plant}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                      {plant.plant}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {plant.orders} órdenes · ${(plant.cost / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--mt-accent), var(--mt-info))',
                        width: `${(plant.orders / 12) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MtCard>

        {/* Fallas por Equipo */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              Fallas por Equipo (Top 5)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
              {dashboardData.failuresByEquipment.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '12px', margin: 0, color: 'var(--mt-text-secondary)' }}>
                    {item.equipment}
                  </p>
                  <span style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-danger)' }}>
                    {item.failures}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </MtCard>

        {/* Equipos con Mayor Tiempo de Paro */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              Mayor Tiempo de Paro
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
              {dashboardData.equipmentDowntime.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                      {item.equipment}
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-warning)', margin: 0 }}>
                      {item.hours}h
                    </p>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'var(--mt-warning)',
                        width: `${(item.hours / 20) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MtCard>

        {/* Costos Mensuales */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              Costos Mensuales (Trend)
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '100px', gap: '8px' }}>
              {dashboardData.monthlyCosts.map((item, idx) => (
                <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      height: `${(item.cost / 200000) * 80}px`,
                      background: 'linear-gradient(180deg, var(--mt-accent), var(--mt-accent-strong))',
                      borderRadius: 'var(--mt-radius-sm)',
                      marginBottom: '8px',
                    }}
                  ></div>
                  <p style={{ fontSize: '11px', margin: 0, color: 'var(--mt-text-secondary)' }}>
                    {item.month}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                    ${(item.cost / 1000).toFixed(0)}K
                  </p>
                </div>
              ))}
            </div>
          </div>
        </MtCard>

        {/* Cumplimiento de Mantenimiento */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              Cumplimiento por Plan
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
              {dashboardData.maintenanceCompliance.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                      {item.plan}
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>
                      {item.compliance}%
                    </p>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: item.compliance >= 85 ? 'var(--mt-success)' : item.compliance >= 75 ? 'var(--mt-warning)' : 'var(--mt-danger)',
                        width: `${item.compliance}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MtCard>

        {/* Distribución por Especialidad */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
              Distribución por Especialidad
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
              {dashboardData.ordersBySpecialty.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
                  <div style={{ width: '12px', height: '12px', background: item.color, borderRadius: '2px' }}></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                      {item.specialty}
                    </p>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>
                    {item.orders}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </MtCard>
      </div>

      {/* Footer */}
      <div style={{ padding: 'var(--mt-space-lg)', background: 'var(--mt-bg-surface)', borderRadius: 'var(--mt-radius-md)', marginTop: 'var(--mt-space-xl)' }}>
        <p style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', margin: 0, textAlign: 'center' }}>
          Dashboard actualizado cada 5 minutos. Último update: {new Date().toLocaleString('es-ES')}
        </p>
      </div>
    </div>
  );
}
