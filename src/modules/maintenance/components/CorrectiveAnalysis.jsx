import { useState } from 'react';
import { MtCard, MtBadge } from '../ui';
import { AlertTriangle, BarChart3, TrendingUp, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function CorrectiveAnalysis({ workOrderId, assetId }) {
  const [analysis] = useState({
    failureInfo: {
      code: 'F-001',
      mode: 'Fuga de aceite',
      mechanism: 'Sello mecánico desgastado',
      rootCause: 'Aceite contaminado por partículas',
      severity: 'HIGH',
      impact: 'Parada total de equipamiento',
    },
    assetAnalysis: {
      name: 'Bomba Centrífuga Principal',
      code: 'EQ-001',
      criticalityLevel: 'A',
      totalFailures: 12,
      failuresLast30Days: 3,
      failuresLast90Days: 8,
      failureRate: 'Muy Alta',
      ttr: 4.5, // horas promedio
      trends: [
        { month: 'Septiembre', failures: 1 },
        { month: 'Octubre', failures: 2 },
        { month: 'Noviembre', failures: 3 },
      ],
    },
    productionImpact: {
      downtime: 4.5, // horas
      productionLoss: 45000, // unidades
      estimatedCost: 135000, // USD
      criticalityScore: 95,
    },
  });

  const [analysis_text, setAnalysisText] = useState(
    'El sello mecánico ha alcanzado el final de su vida útil. Se recomienda reemplazo preventivo en la próxima parada programada para evitar futuras fugas.'
  );
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState('Mantenimiento preventivo insuficiente + Calidad de aceite comprometida');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
      {/* Header */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', borderBottom: '1px solid var(--mt-border)', paddingBottom: 'var(--mt-space-md)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Análisis de Falla
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Código de Falla
              </p>
              <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{analysis.failureInfo.code}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Modo de Falla
              </p>
              <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{analysis.failureInfo.mode}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
                Severidad
              </p>
              <MtBadge label={analysis.failureInfo.severity === 'HIGH' ? 'Alta' : 'Media'} variant={analysis.failureInfo.severity === 'HIGH' ? 'danger' : 'warning'} size="sm" />
            </div>
          </div>
        </div>

        {/* Failure Details */}
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>
            Detalles de la Falla (ISO 14224)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-lg)' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '4px' }}>Mecanismo</p>
              <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{analysis.failureInfo.mechanism}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '4px' }}>Causa Raíz</p>
              <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{analysis.failureInfo.rootCause}</p>
            </div>
          </div>
        </div>
      </MtCard>

      {/* Asset Failure Analysis */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', borderBottom: '1px solid var(--mt-border)', paddingBottom: 'var(--mt-space-md)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <BarChart3 size={18} style={{ color: 'var(--mt-accent)' }} />
            Historial del Activo
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-lg)' }}>
            <div style={{ background: 'var(--mt-bg-surface-2)', padding: 'var(--mt-space-md)', borderRadius: 'var(--mt-radius-sm)', border: '2px solid var(--mt-danger)' }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                Fallas Totales
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
                {analysis.assetAnalysis.totalFailures}
              </p>
            </div>

            <div style={{ background: 'var(--mt-bg-surface-2)', padding: 'var(--mt-space-md)', borderRadius: 'var(--mt-radius-sm)', border: '2px solid var(--mt-warning)' }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                Últimos 30 días
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-warning)' }}>
                {analysis.assetAnalysis.failuresLast30Days}
              </p>
            </div>

            <div style={{ background: 'var(--mt-bg-surface-2)', padding: 'var(--mt-space-md)', borderRadius: 'var(--mt-radius-sm)', border: '2px solid var(--mt-accent)' }}>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                TTR Promedio
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-accent)' }}>
                {analysis.assetAnalysis.ttr}h
              </p>
            </div>
          </div>
        </div>

        {/* Trend */}
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} /> Tendencia (Últimos 90 días)
          </h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '80px', gap: '8px' }}>
            {analysis.assetAnalysis.trends.map((t) => (
              <div key={t.month} style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    height: `${t.failures * 25}px`,
                    background: 'linear-gradient(180deg, var(--mt-danger), var(--mt-warning))',
                    borderRadius: 'var(--mt-radius-sm)',
                    marginBottom: '8px',
                  }}
                ></div>
                <p style={{ fontSize: '11px', margin: 0, color: 'var(--mt-text-secondary)' }}>{t.month}</p>
                <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>{t.failures}</p>
              </div>
            ))}
          </div>
        </div>
      </MtCard>

      {/* Production Impact */}
      <MtCard elevated style={{ background: 'rgba(244, 63, 94, 0.05)', border: '2px solid rgba(244, 63, 94, 0.2)' }}>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--mt-danger)' }} />
            Impacto en Producción
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-lg)' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                Tiempo de Parada
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
                {analysis.productionImpact.downtime}h
              </p>
            </div>

            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                Pérdida Producción
              </p>
              <p style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
                {analysis.productionImpact.productionLoss.toLocaleString()} u.
              </p>
            </div>

            <div>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '4px' }}>
                Costo Estimado
              </p>
              <p style={{ fontSize: '18px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
                ${analysis.productionImpact.estimatedCost.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </MtCard>

      {/* Root Cause Analysis */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', borderBottom: '1px solid var(--mt-border)', paddingBottom: 'var(--mt-space-md)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <Zap size={18} style={{ color: 'var(--mt-accent)' }} />
            Análisis de Causa Raíz (Post-Mortem)
          </h3>
          <textarea
            placeholder="Describe el análisis profundo de la falla..."
            value={rootCauseAnalysis}
            onChange={(e) => setRootCauseAnalysis(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--mt-space-md)',
              border: '1px solid var(--mt-border)',
              borderRadius: 'var(--mt-radius-md)',
              background: 'var(--mt-bg-base)',
              color: 'var(--mt-text-primary)',
              fontSize: '13px',
              fontFamily: 'inherit',
              minHeight: '100px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Recommendations */}
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)' }}>
            Recomendaciones
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
            <li style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Reemplazar sello mecánico en próxima parada programada</li>
            <li style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Implementar cambio de aceite cada 500 horas en lugar de 750</li>
            <li style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Aumentar frecuencia de inspección visual a semanal</li>
            <li style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Evaluar instalación de sensor de vibración para monitoreo continuo</li>
          </ul>
        </div>
      </MtCard>
    </div>
  );
}
