import { useState, useEffect } from 'react';
import { MtCard, MtBadge } from '../ui';
import { BarChart3, TrendingUp, AlertTriangle, DollarSign, Activity } from 'lucide-react';

export default function EquipmentAnalytics() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('90days');
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  useEffect(() => {
    loadEquipmentData();
  }, [selectedPeriod]);

  const loadEquipmentData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      const mockData = [
        {
          id: 1,
          name: 'Bomba Centrífuga Principal',
          code: 'EQ-001',
          criticality: 'A',
          totalFailures: 12,
          failures30d: 3,
          failures90d: 8,
          failureRate: 'Muy Alta',
          avgTTR: 4.5,
          costImpact: 135000,
          trend: [
            { period: 'Sep', failures: 1, cost: 15000 },
            { period: 'Oct', failures: 2, cost: 45000 },
            { period: 'Nov', failures: 3, cost: 75000 },
          ],
          failureModes: [
            { mode: 'Fuga de aceite', count: 5, severity: 'HIGH' },
            { mode: 'Ruido anormal', count: 3, severity: 'MEDIUM' },
            { mode: 'Vibración excesiva', count: 2, severity: 'HIGH' },
            { mode: 'Pérdida de potencia', count: 2, severity: 'MEDIUM' },
          ],
        },
        {
          id: 2,
          name: 'Compresor de Aire',
          code: 'EQ-002',
          criticality: 'B',
          totalFailures: 8,
          failures30d: 2,
          failures90d: 5,
          failureRate: 'Alta',
          avgTTR: 3.2,
          costImpact: 78000,
          trend: [
            { period: 'Sep', failures: 1, cost: 18000 },
            { period: 'Oct', failures: 1, cost: 25000 },
            { period: 'Nov', failures: 2, cost: 35000 },
          ],
          failureModes: [
            { mode: 'Fuga de aire', count: 4, severity: 'MEDIUM' },
            { mode: 'Presión baja', count: 3, severity: 'MEDIUM' },
            { mode: 'Temperatura alta', count: 1, severity: 'HIGH' },
          ],
        },
        {
          id: 3,
          name: 'Motor Eléctrico Principal',
          code: 'EQ-003',
          criticality: 'A',
          totalFailures: 6,
          failures30d: 1,
          failures90d: 4,
          failureRate: 'Media',
          avgTTR: 2.8,
          costImpact: 62000,
          trend: [
            { period: 'Sep', failures: 1, cost: 20000 },
            { period: 'Oct', failures: 1, cost: 22000 },
            { period: 'Nov', failures: 2, cost: 20000 },
          ],
          failureModes: [
            { mode: 'Sobrecalentamiento', count: 3, severity: 'HIGH' },
            { mode: 'Ruido', count: 2, severity: 'LOW' },
            { mode: 'Vibraciones', count: 1, severity: 'MEDIUM' },
          ],
        },
        {
          id: 4,
          name: 'Convertidor de Frecuencia',
          code: 'EQ-004',
          criticality: 'C',
          totalFailures: 4,
          failures30d: 1,
          failures90d: 2,
          failureRate: 'Baja',
          avgTTR: 5.1,
          costImpact: 45000,
          trend: [
            { period: 'Sep', failures: 0, cost: 0 },
            { period: 'Oct', failures: 1, cost: 18000 },
            { period: 'Nov', failures: 1, cost: 27000 },
          ],
          failureModes: [
            { mode: 'Error de comunicación', count: 2, severity: 'HIGH' },
            { mode: 'Sobrecorriente', count: 1, severity: 'MEDIUM' },
            { mode: 'Código de error', count: 1, severity: 'LOW' },
          ],
        },
        {
          id: 5,
          name: 'Válvula Control Principal',
          code: 'EQ-005',
          criticality: 'B',
          totalFailures: 5,
          failures30d: 2,
          failures90d: 3,
          failureRate: 'Media',
          avgTTR: 1.8,
          costImpact: 38000,
          trend: [
            { period: 'Sep', failures: 1, cost: 12000 },
            { period: 'Oct', failures: 1, cost: 13000 },
            { period: 'Nov', failures: 1, cost: 13000 },
          ],
          failureModes: [
            { mode: 'Fuga interna', count: 3, severity: 'MEDIUM' },
            { mode: 'Atasco', count: 1, severity: 'HIGH' },
            { mode: 'Corrosión', count: 1, severity: 'LOW' },
          ],
        },
      ];
      setEquipment(mockData);
      setSelectedEquipment(mockData[0]);
    } catch (error) {
      console.error('Error loading equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando análisis...</p>
        </div>
      </MtCard>
    );
  }

  // Ranking de equipos por fallas
  const equipmentRanking = [...equipment].sort((a, b) => b.totalFailures - a.totalFailures);

  // Costo total por equipo
  const totalCostByEquipment = equipment.reduce((sum, eq) => sum + eq.costImpact, 0);

  // Modos de falla más comunes
  const allFailureModes = equipment.reduce((acc, eq) => {
    return [...acc, ...eq.failureModes.map(fm => ({ ...fm, equipmentName: eq.name }))];
  }, []);
  const topFailureModes = [...allFailureModes]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const getSeverityColor = (severity) => {
    const colors = {
      HIGH: 'var(--mt-danger)',
      MEDIUM: 'var(--mt-warning)',
      LOW: 'var(--mt-info)',
    };
    return colors[severity] || 'var(--mt-text-secondary)';
  };

  const getCriticalityColor = (criticality) => {
    const colors = {
      A: 'var(--mt-danger)',
      B: 'var(--mt-warning)',
      C: 'var(--mt-info)',
    };
    return colors[criticality] || 'var(--mt-text-secondary)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
          📊 Análisis de Fallas por Equipo
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
          Identificación de equipos críticos y patrones de falla
        </p>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} style={{ color: 'var(--mt-danger)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Fallas Totales
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
              {equipment.reduce((sum, eq) => sum + eq.totalFailures, 0)}
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} style={{ color: 'var(--mt-accent)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Últimos 30 días
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
              {equipment.reduce((sum, eq) => sum + eq.failures30d, 0)}
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={24} style={{ color: 'var(--mt-success)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Costo Total
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)' }}>
              ${totalCostByEquipment.toLocaleString()}
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--mt-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={24} style={{ color: 'var(--mt-info)' }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Equipos Monitoreados
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-info)' }}>
              {equipment.length}
            </p>
          </div>
        </MtCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-2xl)' }}>
        {/* Ranking de Equipos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <BarChart3 size={20} style={{ color: 'var(--mt-accent)' }} />
            Equipos Críticos (Ranking)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {equipmentRanking.map((eq, idx) => (
              <MtCard
                key={eq.id}
                elevated
                interactive
                onClick={() => setSelectedEquipment(eq)}
                style={{
                  borderLeft: selectedEquipment?.id === eq.id ? '4px solid var(--mt-accent)' : '4px solid var(--mt-border)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ padding: 'var(--mt-space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--mt-space-md)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-xs)' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', color: 'var(--mt-accent)' }}>#{idx + 1}</span>
                        <h3 style={{ fontSize: '15px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                          {eq.name}
                        </h3>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                        {eq.code}
                      </p>
                    </div>
                    <MtBadge
                      label={eq.criticality === 'A' ? 'Crítica' : eq.criticality === 'B' ? 'Moderada' : 'Baja'}
                      variant={eq.criticality === 'A' ? 'danger' : eq.criticality === 'B' ? 'warning' : 'info'}
                      size="sm"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--mt-space-md)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '2px' }}>Fallas</p>
                      <p style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
                        {eq.totalFailures}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '2px' }}>TTR Prom.</p>
                      <p style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                        {eq.avgTTR}h
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '2px' }}>Costo</p>
                      <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)' }}>
                        ${(eq.costImpact / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                </div>
              </MtCard>
            ))}
          </div>
        </div>

        {/* Detalle del Equipo Seleccionado */}
        {selectedEquipment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
              <Activity size={20} style={{ color: 'var(--mt-accent)' }} />
              Análisis: {selectedEquipment.name}
            </h2>

            {/* Tendencia */}
            <MtCard elevated>
              <div style={{ padding: 'var(--mt-space-lg)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>
                  Tendencia (Últimos 3 meses)
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', gap: '12px' }}>
                  {selectedEquipment.trend.map((t) => (
                    <div key={t.period} style={{ textAlign: 'center', flex: 1 }}>
                      <div
                        style={{
                          height: `${t.failures * 30}px`,
                          background: 'linear-gradient(180deg, var(--mt-danger), var(--mt-warning))',
                          borderRadius: 'var(--mt-radius-sm)',
                          marginBottom: '8px',
                          minHeight: '4px',
                        }}
                      ></div>
                      <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0 }}>{t.period}</p>
                      <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{t.failures} f.</p>
                      <p style={{ fontSize: '10px', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                        ${(t.cost / 1000).toFixed(0)}K
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </MtCard>

            {/* Modos de Falla */}
            <MtCard elevated>
              <div style={{ padding: 'var(--mt-space-lg)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>
                  Modos de Falla
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
                  {selectedEquipment.failureModes.map((fm, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--mt-space-sm)', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-sm)' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '2px' }}>
                          {fm.mode}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--mt-text-secondary)' }}>
                            {fm.count} ocurrencias
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 'var(--mt-font-weight-bold)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: getSeverityColor(fm.severity) + '20',
                              color: getSeverityColor(fm.severity),
                            }}
                          >
                            {fm.severity === 'HIGH' ? 'Alta' : fm.severity === 'MEDIUM' ? 'Media' : 'Baja'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '20px' }}>
                        {fm.severity === 'HIGH' && '🔴'}
                        {fm.severity === 'MEDIUM' && '🟡'}
                        {fm.severity === 'LOW' && '🟢'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </MtCard>
          </div>
        )}
      </div>

      {/* Top Failure Modes */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--mt-danger)' }} />
            Modos de Falla Más Comunes (Todos los Equipos)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mt-space-lg)' }}>
            {topFailureModes.map((fm, idx) => (
              <div key={idx} style={{ padding: 'var(--mt-space-lg)', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-md)', borderLeft: `4px solid ${getSeverityColor(fm.severity)}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--mt-space-sm)' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>
                      {fm.mode}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {fm.equipmentName}
                    </p>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-black)', color: getSeverityColor(fm.severity) }}>
                    {fm.count}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: getSeverityColor(fm.severity),
                      width: `${(fm.count / Math.max(...topFailureModes.map(m => m.count))) * 100}%`,
                      transition: 'width 300ms ease',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MtCard>
    </div>
  );
}
