import { useState, useMemo } from 'react';
import { MtCard, MtBadge } from '../ui';
import {
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, Wrench,
  Clock, CheckCircle2, AlertCircle, Filter, Download, Calendar,
  Zap, Activity, BarChart3, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import '../ui/tokens.css';

// Mock data for comprehensive industrial maintenance analytics
const MOCK_ANALYTICS_DATA = {
  dateRange: { start: '2025-09-01', end: '2025-11-30' },
  summary: {
    totalWorkOrders: 156,
    preventiveMaintenance: 98,
    correctiveMaintenance: 58,
    totalDowntime: 142.5,
    totalCost: 358000,
    averageCostPerOrder: 2295,
    equipmentCount: 12,
    criticality: { A: 4, B: 5, C: 3 },
  },
  kpis: {
    mtbf: 312,
    mttr: 4.2,
    availability: 96.8,
    oee: 87.5,
    preventiveRatio: 62.8,
    costAvoidance: 145000,
    eficienciaLabor: 89,
    cumplimientoPlanes: 94,
  },
  equipment: [
    {
      id: 1,
      name: 'Bomba Centrífuga Principal',
      code: 'EQ-001',
      criticality: 'A',
      status: 'CRITICAL',
      totalFailures: 12,
      failures30d: 3,
      failureRate: 3.5,
      downtime: 54.3,
      mtbf: 280,
      mttr: 4.5,
      preventiveMaintenance: 8,
      correctiveMaintenance: 4,
      totalCost: 185000,
      costPerHour: 287,
      topFailureModes: [
        { mode: 'Fuga de aceite', count: 5, severity: 'HIGH', trend: 'INCREASING' },
        { mode: 'Vibración excesiva', count: 3, severity: 'HIGH', trend: 'STABLE' },
        { mode: 'Ruido anormal', count: 2, severity: 'MEDIUM', trend: 'DECREASING' },
      ],
      parts: [
        { code: 'SEAL-001', name: 'Sello Mecánico', cost: 2500, qty: 2 },
        { code: 'BEARING-SKF', name: 'Rodamiento SKF 6205', cost: 850, qty: 3 },
        { code: 'OIL-SAE40', name: 'Aceite SAE 40', cost: 450, qty: 8 },
      ],
      partsInventory: 34,
      availability: 94.2,
      oee: 82.1,
      monthlyData: [
        { month: 'Sep', failures: 1, cost: 45000, downtime: 15.2, orders: 3 },
        { month: 'Oct', failures: 4, cost: 70000, downtime: 18.5, orders: 5 },
        { month: 'Nov', failures: 3, cost: 70000, downtime: 20.6, orders: 4 },
      ],
      technicians: [
        { name: 'Juan Pérez', interventions: 8, hours: 32, efficiency: 92 },
        { name: 'Carlos López', interventions: 4, hours: 18, efficiency: 88 },
      ],
    },
    {
      id: 2,
      name: 'Compresor de Aire Centrifugo',
      code: 'EQ-002',
      criticality: 'B',
      status: 'MEDIUM',
      totalFailures: 7,
      failures30d: 2,
      failureRate: 1.8,
      downtime: 28.4,
      mtbf: 450,
      mttr: 4.1,
      preventiveMaintenance: 5,
      correctiveMaintenance: 2,
      totalCost: 98000,
      costPerHour: 245,
      topFailureModes: [
        { mode: 'Presión baja', count: 3, severity: 'MEDIUM', trend: 'STABLE' },
        { mode: 'Temperatura alta', count: 2, severity: 'HIGH', trend: 'INCREASING' },
        { mode: 'Fuga de aire', count: 2, severity: 'LOW', trend: 'STABLE' },
      ],
      parts: [
        { code: 'VALVE-PRE', name: 'Válvula Presión', cost: 3500, qty: 1 },
        { code: 'FILTER-AIR', name: 'Filtro de Aire', cost: 650, qty: 4 },
      ],
      partsInventory: 28,
      availability: 97.1,
      oee: 91.3,
      monthlyData: [
        { month: 'Sep', failures: 1, cost: 32000, downtime: 9.2, orders: 2 },
        { month: 'Oct', failures: 2, cost: 33000, downtime: 9.6, orders: 2 },
        { month: 'Nov', failures: 2, cost: 33000, downtime: 9.6, orders: 3 },
      ],
      technicians: [
        { name: 'Roberto García', interventions: 5, hours: 22, efficiency: 94 },
      ],
    },
    {
      id: 3,
      name: 'Motor Eléctrico Principal',
      code: 'EQ-003',
      criticality: 'A',
      status: 'GOOD',
      totalFailures: 4,
      failures30d: 1,
      failureRate: 0.9,
      downtime: 12.8,
      mtbf: 680,
      mttr: 3.2,
      preventiveMaintenance: 7,
      correctiveMaintenance: 1,
      totalCost: 62000,
      costPerHour: 156,
      topFailureModes: [
        { mode: 'Sobrecalentamiento', count: 2, severity: 'HIGH', trend: 'DECREASING' },
        { mode: 'Vibración', count: 1, severity: 'MEDIUM', trend: 'STABLE' },
      ],
      parts: [
        { code: 'WINDING-REPAIR', name: 'Bobinado de Reparación', cost: 8500, qty: 1 },
      ],
      partsInventory: 18,
      availability: 98.9,
      oee: 94.2,
      monthlyData: [
        { month: 'Sep', failures: 1, cost: 20000, downtime: 4.2, orders: 2 },
        { month: 'Oct', failures: 1, cost: 22000, downtime: 4.3, orders: 2 },
        { month: 'Nov', failures: 1, cost: 20000, downtime: 4.3, orders: 3 },
      ],
      technicians: [
        { name: 'Ana Martínez', interventions: 6, hours: 18, efficiency: 96 },
      ],
    },
  ],
};

const COLORS = {
  accent: '#38BDF8',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
};

export default function EquipmentAnalytics() {
  const [selectedEquipment, setSelectedEquipment] = useState(MOCK_ANALYTICS_DATA.equipment[0]);
  const [filterCriticality, setFilterCriticality] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const data = MOCK_ANALYTICS_DATA;
  const summary = data.summary;
  const kpis = data.kpis;

  const filteredEquipment = useMemo(() => {
    return data.equipment.filter(eq => {
      const critMatch = filterCriticality === 'all' || eq.criticality === filterCriticality;
      const statusMatch = filterStatus === 'all' || eq.status === filterStatus;
      return critMatch && statusMatch;
    });
  }, [filterCriticality, filterStatus]);

  // Datos para gráficos
  const equipmentFailureChart = data.equipment.map(eq => ({
    name: eq.code,
    fallas: eq.totalFailures,
    disponibilidad: eq.availability,
  }));

  const maintenanceRatioData = [
    { name: 'Preventivo', value: summary.preventiveMaintenance, fill: COLORS.success },
    { name: 'Correctivo', value: summary.correctiveMaintenance, fill: COLORS.danger },
  ];

  const costTrendData = data.equipment.map(eq => ({
    name: eq.code,
    Costo: eq.totalCost,
    'Costo/Hora': Math.round(eq.costPerHour * 100),
  }));

  const failureModesData = selectedEquipment.topFailureModes.map(fm => ({
    name: fm.mode,
    incidentes: fm.count,
    fill: fm.severity === 'HIGH' ? COLORS.danger : fm.severity === 'MEDIUM' ? COLORS.warning : COLORS.info,
  }));

  const getStatusColor = (status) => {
    const colors = {
      CRITICAL: COLORS.danger,
      MEDIUM: COLORS.warning,
      GOOD: COLORS.success,
    };
    return colors[status] || COLORS.accent;
  };

  const getStatusLabel = (status) => {
    const labels = {
      CRITICAL: 'Crítico',
      MEDIUM: 'Moderado',
      GOOD: 'Bueno',
    };
    return labels[status] || status;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'INCREASING') return <TrendingUp size={14} style={{ color: COLORS.danger }} />;
    if (trend === 'DECREASING') return <TrendingDown size={14} style={{ color: COLORS.success }} />;
    return <Activity size={14} style={{ color: 'var(--mt-text-tertiary)' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
          Analítica de Mantenimiento Industrial
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
          Análisis integral con visualización de datos | Sep - Nov 2025
        </p>
      </div>

      {/* KPI Dashboard */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
          KPIs Clave de Mantenimiento
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>MTBF</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: COLORS.accent }}>{kpis.mtbf}h</div>
              <div style={{ fontSize: '10px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Entre fallas</div>
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>MTTR</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: COLORS.info }}>{kpis.mttr}h</div>
              <div style={{ fontSize: '10px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Reparación</div>
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>DISPONIBILIDAD</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: COLORS.success }}>{kpis.availability}%</div>
              <div style={{ fontSize: '10px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Operativo</div>
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>OEE</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: COLORS.warning }}>{kpis.oee}%</div>
              <div style={{ fontSize: '10px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Efectividad</div>
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>PREVENTIVA</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: COLORS.accent }}>{kpis.preventiveRatio}%</div>
              <div style={{ fontSize: '10px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Ratio</div>
            </div>
          </MtCard>

          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>AHORRO</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: COLORS.success }}>${(kpis.costAvoidance / 1000).toFixed(0)}k</div>
              <div style={{ fontSize: '10px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Evitado</div>
            </div>
          </MtCard>
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
          Visualización de Datos
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          {/* Fallas por Equipo */}
          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
                Fallas por Equipo
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={equipmentFailureChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mt-border)" />
                  <XAxis dataKey="name" stroke="var(--mt-text-secondary)" />
                  <YAxis stroke="var(--mt-text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--mt-bg-surface)',
                      border: '1px solid var(--mt-border)',
                      borderRadius: '8px',
                      color: 'var(--mt-text-primary)',
                    }}
                  />
                  <Bar dataKey="fallas" fill={COLORS.danger} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </MtCard>

          {/* Mantenimiento Preventivo vs Correctivo */}
          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
                Distribución de Mantenimiento
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie data={maintenanceRatioData}>
                  <Pie cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                    {maintenanceRatioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--mt-bg-surface)',
                      border: '1px solid var(--mt-border)',
                      borderRadius: '8px',
                      color: 'var(--mt-text-primary)',
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--mt-space-lg)', marginTop: 'var(--mt-space-lg)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: COLORS.success }}>Preventivo</div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--mt-text-primary)' }}>{summary.preventiveMaintenance}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: COLORS.danger }}>Correctivo</div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--mt-text-primary)' }}>{summary.correctiveMaintenance}</div>
                </div>
              </div>
            </div>
          </MtCard>

          {/* Tendencia de Costos */}
          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
                Costo Total por Equipo
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mt-border)" />
                  <XAxis dataKey="name" stroke="var(--mt-text-secondary)" />
                  <YAxis stroke="var(--mt-text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--mt-bg-surface)',
                      border: '1px solid var(--mt-border)',
                      borderRadius: '8px',
                      color: 'var(--mt-text-primary)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Costo" fill={COLORS.accent} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </MtCard>

          {/* Tendencia Mensual del Equipo Seleccionado */}
          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
                Tendencia Mensual: {selectedEquipment.code}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={selectedEquipment.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mt-border)" />
                  <XAxis dataKey="month" stroke="var(--mt-text-secondary)" />
                  <YAxis stroke="var(--mt-text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--mt-bg-surface)',
                      border: '1px solid var(--mt-border)',
                      borderRadius: '8px',
                      color: 'var(--mt-text-primary)',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="failures" stroke={COLORS.danger} strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="orders" stroke={COLORS.accent} strokeWidth={2} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </MtCard>

          {/* Modos de Falla del Equipo Seleccionado */}
          <MtCard elevated>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
                Modos de Falla: {selectedEquipment.code}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={failureModesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mt-border)" />
                  <XAxis type="number" stroke="var(--mt-text-secondary)" />
                  <YAxis dataKey="name" type="category" width={120} stroke="var(--mt-text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--mt-bg-surface)',
                      border: '1px solid var(--mt-border)',
                      borderRadius: '8px',
                      color: 'var(--mt-text-primary)',
                    }}
                  />
                  <Bar dataKey="incidentes" fill={COLORS.danger} radius={[0, 8, 8, 0]}>
                    {failureModesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </MtCard>
        </div>
      </div>

      {/* Summary Stats */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
          Resumen del Período
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          <MtCard elevated style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)' }}>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} style={{ color: COLORS.danger }} />
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)' }}>FALLAS TOTALES</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: COLORS.danger, marginBottom: '8px' }}>
                {data.equipment.reduce((sum, eq) => sum + eq.totalFailures, 0)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                {data.equipment.reduce((sum, eq) => sum + eq.failures30d, 0)} últimos 30 días
              </div>
            </div>
          </MtCard>

          <MtCard elevated style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)' }}>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Wrench size={18} style={{ color: COLORS.info }} />
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)' }}>ÓRDENES</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: COLORS.info, marginBottom: '8px' }}>
                {summary.totalWorkOrders}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                {summary.preventiveMaintenance} preventivas | {summary.correctiveMaintenance} correctivas
              </div>
            </div>
          </MtCard>

          <MtCard elevated style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%)' }}>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={18} style={{ color: COLORS.success }} />
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)' }}>COSTO TOTAL</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: COLORS.success, marginBottom: '8px' }}>
                ${(summary.totalCost / 1000).toFixed(0)}k
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                Promedio ${summary.averageCostPerOrder.toLocaleString()} por orden
              </div>
            </div>
          </MtCard>

          <MtCard elevated style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.02) 100%)' }}>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={18} style={{ color: COLORS.warning }} />
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)' }}>TIEMPO PARADO</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: COLORS.warning, marginBottom: '8px' }}>
                {summary.totalDowntime}h
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                Promedio {(summary.totalDowntime / summary.totalWorkOrders).toFixed(1)}h por orden
              </div>
            </div>
          </MtCard>
        </div>
      </div>

      {/* Filters and Equipment Selection */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
          Detalle de Equipos
        </h2>
        <div style={{ display: 'flex', gap: 'var(--mt-space-lg)', flexWrap: 'wrap', marginBottom: 'var(--mt-space-lg)' }}>
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--mt-radius-md)',
              fontSize: '13px',
              border: '1px solid var(--mt-border)',
              background: 'var(--mt-bg-surface)',
              color: 'var(--mt-text-primary)',
              outline: 'none',
              flex: 1,
              minWidth: '150px',
            }}
          >
            <option value="all">Todas las criticidades</option>
            <option value="A">Crítica (A)</option>
            <option value="B">Moderada (B)</option>
            <option value="C">Baja (C)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--mt-radius-md)',
              fontSize: '13px',
              border: '1px solid var(--mt-border)',
              background: 'var(--mt-bg-surface)',
              color: 'var(--mt-text-primary)',
              outline: 'none',
              flex: 1,
              minWidth: '150px',
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="CRITICAL">Crítico</option>
            <option value="MEDIUM">Moderado</option>
            <option value="GOOD">Bueno</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--mt-space-2xl)' }}>
          {/* Equipment List */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
              {filteredEquipment.map(eq => (
                <MtCard
                  key={eq.id}
                  elevated
                  style={{
                    cursor: 'pointer',
                    borderLeft: selectedEquipment?.id === eq.id ? '4px solid var(--mt-accent)' : '4px solid var(--mt-border)',
                    background: selectedEquipment?.id === eq.id ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                  }}
                  onClick={() => setSelectedEquipment(eq)}
                >
                  <div style={{ padding: 'var(--mt-space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: '0 0 2px 0' }}>
                          {eq.name}
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                          {eq.code}
                        </p>
                      </div>
                      <MtBadge variant={eq.criticality === 'A' ? 'danger' : 'warning'} size="sm">
                        {eq.criticality}
                      </MtBadge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', marginBottom: '8px' }}>
                      <div>
                        <span style={{ color: 'var(--mt-text-tertiary)' }}>Fallas:</span> {eq.totalFailures}
                      </div>
                      <div>
                        <span style={{ color: 'var(--mt-text-tertiary)' }}>Costo:</span> ${(eq.totalCost / 1000).toFixed(0)}k
                      </div>
                    </div>

                    <div style={{ padding: '4px 6px', background: 'var(--mt-bg-base)', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: getStatusColor(eq.status), marginBottom: '2px' }}>
                        {getStatusLabel(eq.status)}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--mt-text-secondary)' }}>
                        Disp: {eq.availability}% | OEE: {eq.oee}%
                      </div>
                    </div>
                  </div>
                </MtCard>
              ))}
            </div>
          </div>

          {/* Equipment Details */}
          {selectedEquipment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
              <MtCard elevated>
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--mt-space-lg)' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: '4px' }}>
                        {selectedEquipment.name}
                      </h2>
                      <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                        {selectedEquipment.code} • Criticidad {selectedEquipment.criticality}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <MtBadge variant={selectedEquipment.criticality === 'A' ? 'danger' : 'warning'} size="sm">
                        {selectedEquipment.criticality}
                      </MtBadge>
                      <MtBadge
                        variant={selectedEquipment.status === 'CRITICAL' ? 'danger' : selectedEquipment.status === 'MEDIUM' ? 'warning' : 'success'}
                        size="sm"
                      >
                        {getStatusLabel(selectedEquipment.status)}
                      </MtBadge>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-lg)' }}>
                    <div style={{ padding: 'var(--mt-space-md)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>MTBF</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: COLORS.accent }}>
                        {selectedEquipment.mtbf}h
                      </div>
                    </div>
                    <div style={{ padding: 'var(--mt-space-md)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>MTTR</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: COLORS.info }}>
                        {selectedEquipment.mttr}h
                      </div>
                    </div>
                    <div style={{ padding: 'var(--mt-space-md)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>DISPONIBILIDAD</div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: COLORS.success }}>
                        {selectedEquipment.availability}%
                      </div>
                    </div>
                  </div>

                  {/* Refacciones */}
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-md) 0' }}>
                      Refacciones Utilizadas
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
                      {selectedEquipment.parts.map((part, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--mt-space-sm)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-sm)', fontSize: '12px' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                              {part.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--mt-text-secondary)' }}>
                              Qty: {part.qty}
                            </div>
                          </div>
                          <div style={{ fontWeight: '700', color: COLORS.accent }}>
                            ${part.cost.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </MtCard>

              {/* Technicians */}
              <MtCard elevated>
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: '0 0 var(--mt-space-lg) 0' }}>
                    Técnicos Asignados
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                    {selectedEquipment.technicians.map((tech, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--mt-space-md)', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                            {tech.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginTop: '2px' }}>
                            {tech.interventions} intervenciones • {tech.hours}h
                          </div>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: COLORS.success }}>
                          {tech.efficiency}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </MtCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
