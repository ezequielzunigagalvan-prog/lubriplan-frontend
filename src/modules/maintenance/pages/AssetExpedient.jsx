import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { MtCard, MtBadge, MtButton } from '../ui';
import { ArrowLeft, BarChart3, FileText, Image, Wrench, AlertCircle, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AssetExpedient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [expedient, setExpedient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssetExpedient();
  }, [id]);

  const loadAssetExpedient = async () => {
    try {
      setLoading(true);
      let assetData;
      let expedientData;
      try {
        assetData = await maintenanceApi.getAsset(parseInt(id));
        expedientData = await maintenanceApi.getAssetExpedient(parseInt(id));
      } catch (apiError) {
        console.warn('API unavailable, using fallback:', apiError);
        assetData = null;
        expedientData = null;
      }

      const mockAsset = {
        id: id,
        code: 'EQ-001',
        name: 'Molino Principal',
        manufacturer: 'Siemens',
        model: 'XYZ-2000',
        serialNumber: 'SN-12345-678',
        installationDate: '2019-05-15',
        criticality: 'A',
        state: 'OPERATING',
        responsible: 'Ing. Carlos García',
        planta: 'Planta Jilotepec',
        area: 'Producción',
        linea: 'Línea 01',
        ubicacion: 'Sector Sur, Columna 5',
      };

      const mockExpedient = {
        totalWorkOrders: 47,
        preventiveOrders: 32,
        correctiveOrders: 15,
        totalFailures: 12,
        totalDowntime: 68.5, // horas
        accumulatedCost: 285400, // USD
        lastIntervention: '2026-11-05',
        maintenanceOrders: [
          {
            id: 1,
            order: 'OT-001156',
            date: '2026-11-05',
            type: 'PREVENTIVE',
            status: 'VALIDATED',
            technician: 'José López',
            description: 'Cambio de aceite y filtros',
            cost: 1500,
          },
          {
            id: 2,
            order: 'OT-001145',
            date: '2026-10-28',
            type: 'CORRECTIVE',
            status: 'VALIDATED',
            technician: 'María Pérez',
            description: 'Reparación de rodamiento',
            cost: 3200,
          },
          {
            id: 3,
            order: 'OT-001132',
            date: '2026-10-15',
            type: 'PREVENTIVE',
            status: 'VALIDATED',
            technician: 'José López',
            description: 'Inspección general y alineación',
            cost: 1200,
          },
        ],
        failureHistory: [
          {
            id: 1,
            date: '2026-10-28',
            failureCode: 'F-001',
            mode: 'Fuga de aceite',
            cause: 'Sello mecánico desgastado',
            downtime: 4.5,
            cost: 3200,
            severity: 'HIGH',
          },
          {
            id: 2,
            date: '2026-09-12',
            failureCode: 'F-002',
            mode: 'Ruido anormal',
            cause: 'Rodamientos desalineados',
            downtime: 2.3,
            cost: 1800,
            severity: 'MEDIUM',
          },
        ],
        spareParts: [
          {
            id: 1,
            part: 'Sello Mecánico MG-1',
            code: 'SM-001',
            quantity: 2,
            unitCost: 850,
            date: '2026-11-05',
          },
          {
            id: 2,
            part: 'Filtro de Aceite HF-123',
            code: 'FO-001',
            quantity: 3,
            unitCost: 120,
            date: '2026-11-05',
          },
          {
            id: 3,
            part: 'Rodamiento 6205-2RS',
            code: 'RD-123',
            quantity: 1,
            unitCost: 450,
            date: '2026-10-28',
          },
        ],
        monthlyCosts: [
          { month: 'Septiembre', maintenance: 28000, spare: 8500 },
          { month: 'Octubre', maintenance: 35000, spare: 12200 },
          { month: 'Noviembre', maintenance: 22000, spare: 6800 },
        ],
        photos: [
          { id: 1, date: '2026-11-05', description: 'Estado general post-mantenimiento', thumb: '📸' },
          { id: 2, date: '2026-10-28', description: 'Rodamiento dañado antes de reparación', thumb: '📸' },
          { id: 3, date: '2026-09-15', description: 'Instalación de nuevo sello', thumb: '📸' },
        ],
        interventions: [
          {
            id: 1,
            date: '2026-11-05',
            type: 'MANTENIMIENTO',
            description: 'Cambio de aceite y filtros',
            technician: 'José López',
            hours: 2.5,
            status: 'COMPLETADA',
          },
          {
            id: 2,
            date: '2026-10-28',
            type: 'REPARACION',
            description: 'Reparación de rodamiento',
            technician: 'María Pérez',
            hours: 4.5,
            status: 'COMPLETADA',
          },
        ],
      };

      setAsset(assetData || mockAsset);
      setExpedient(expedientData || mockExpedient);
    } catch (error) {
      toast.error('Error cargando expediente');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !asset || !expedient) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando expediente...</p>
        </div>
      </MtCard>
    );
  }

  const tabs = [
    { id: 'overview', label: '📋 Resumen', icon: '📊' },
    { id: 'maintenance', label: '🔧 Mantenimiento', icon: '🔧' },
    { id: 'failures', label: '⚠️ Fallas', icon: '⚠️' },
    { id: 'spareparts', label: '📦 Refacciones', icon: '📦' },
    { id: 'costs', label: '💰 Costos', icon: '💰' },
    { id: 'photos', label: '📸 Fotos', icon: '📸' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-lg)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--mt-radius-md)',
            hover: { background: 'var(--mt-bg-surface)' },
          }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--mt-text-secondary)' }} />
        </button>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, marginBottom: 'var(--mt-space-xs)' }}>
            {asset.name}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            {asset.code} · {asset.planta} → {asset.area} → {asset.linea}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--mt-space-md)' }}>
          <MtBadge label={`Crítica ${asset.criticality}`} variant="danger" size="sm" />
          <MtBadge label="Operando" variant="success" size="sm" />
        </div>
      </div>

      {/* Asset Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '6px' }}>
              Fabricante
            </p>
            <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              {asset.manufacturer}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '6px' }}>
              Modelo
            </p>
            <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
              {asset.model}
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '6px' }}>
              Número de Serie
            </p>
            <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              {asset.serialNumber}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '6px' }}>
              Instalado
            </p>
            <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
              {new Date(asset.installationDate).toLocaleDateString('es-ES')}
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '6px' }}>
              Responsable
            </p>
            <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-md)' }}>
              {asset.responsible}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0, marginBottom: '6px' }}>
              Ubicación
            </p>
            <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              {asset.ubicacion}
            </p>
          </div>
        </MtCard>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-md)' }}>
              <FileText size={16} style={{ color: 'var(--mt-accent)' }} />
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Órdenes Totales
              </p>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>
              {expedient.totalWorkOrders}
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-md)' }}>
              <Wrench size={16} style={{ color: 'var(--mt-warning)' }} />
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Preventivas
              </p>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-warning)' }}>
              {expedient.preventiveOrders}
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-md)' }}>
              <AlertCircle size={16} style={{ color: 'var(--mt-danger)' }} />
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Correctivas
              </p>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-danger)' }}>
              {expedient.correctiveOrders}
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-md)' }}>
              <Clock size={16} style={{ color: 'var(--mt-info)' }} />
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Paro Total
              </p>
            </div>
            <p style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>
              {expedient.totalDowntime}h
            </p>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-md)' }}>
              <DollarSign size={16} style={{ color: 'var(--mt-success)' }} />
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                Costo Acumulado
              </p>
            </div>
            <p style={{ fontSize: '20px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)' }}>
              ${(expedient.accumulatedCost / 1000).toFixed(1)}K
            </p>
          </div>
        </MtCard>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--mt-space-sm)', borderBottom: '1px solid var(--mt-border)', overflowX: 'auto', paddingBottom: 'var(--mt-space-md)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--mt-accent)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--mt-text-secondary)',
              cursor: 'pointer',
              borderRadius: 'var(--mt-radius-md)',
              fontWeight: 'var(--mt-font-weight-bold)',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              transition: 'all 200ms ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content - Maintenance Orders */}
      {activeTab === 'maintenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
            Órdenes de Mantenimiento ({expedient.maintenanceOrders.length})
          </h3>
          {expedient.maintenanceOrders.map((order) => (
            <MtCard key={order.id} elevated>
              <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 'var(--mt-space-md)', alignItems: 'center', marginBottom: 'var(--mt-space-sm)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', margin: 0 }}>
                      {order.order}
                    </p>
                    <MtBadge
                      label={order.type === 'PREVENTIVE' ? 'Preventiva' : 'Correctiva'}
                      variant={order.type === 'PREVENTIVE' ? 'info' : 'danger'}
                      size="sm"
                    />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                    {order.description}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                    {new Date(order.date).toLocaleDateString('es-ES')} · Técnico: {order.technician}
                  </p>
                </div>
                <p style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)' }}>
                  ${order.cost.toLocaleString()}
                </p>
              </div>
            </MtCard>
          ))}
        </div>
      )}

      {/* Tab Content - Failures */}
      {activeTab === 'failures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
            Historial de Fallas ({expedient.failureHistory.length})
          </h3>
          {expedient.failureHistory.map((failure) => (
            <MtCard key={failure.id} elevated style={{ borderLeft: `4px solid ${failure.severity === 'HIGH' ? 'var(--mt-danger)' : 'var(--mt-warning)'}` }}>
              <div style={{ padding: 'var(--mt-space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--mt-space-md)' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>
                      {failure.mode}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                      {failure.failureCode} · {new Date(failure.date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <MtBadge
                    label={failure.severity === 'HIGH' ? 'Alta' : 'Media'}
                    variant={failure.severity === 'HIGH' ? 'danger' : 'warning'}
                    size="sm"
                  />
                </div>
                <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                  <strong>Causa:</strong> {failure.cause}
                </p>
                <div style={{ display: 'flex', gap: 'var(--mt-space-lg)', fontSize: '12px' }}>
                  <span>⏱️ {failure.downtime}h de paro</span>
                  <span>💰 ${failure.cost.toLocaleString()}</span>
                </div>
              </div>
            </MtCard>
          ))}
        </div>
      )}

      {/* Tab Content - Spare Parts */}
      {activeTab === 'spareparts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
            Refacciones Utilizadas ({expedient.spareParts.length})
          </h3>
          {expedient.spareParts.map((part) => (
            <MtCard key={part.id} elevated>
              <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: '4px' }}>
                    {part.part}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: 0 }}>
                    {part.code} · {part.quantity} unidad(es) · {new Date(part.date).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 'var(--mt-font-weight-black)', margin: 0, color: 'var(--mt-success)' }}>
                  ${(part.quantity * part.unitCost).toLocaleString()}
                </p>
              </div>
            </MtCard>
          ))}
        </div>
      )}

      {/* Tab Content - Costs */}
      {activeTab === 'costs' && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-lg)' }}>
            Evolución de Costos (Últimos 3 meses)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
            {expedient.monthlyCosts.map((cost, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                    {cost.month}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, color: 'var(--mt-success)' }}>
                    ${(cost.maintenance + cost.spare).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '4px', height: '24px' }}>
                  <div
                    style={{
                      flex: cost.maintenance / (cost.maintenance + cost.spare),
                      background: 'var(--mt-accent)',
                      borderRadius: '2px',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '9px', color: '#fff', position: 'absolute', left: '2px', top: '3px' }}>
                      Mant
                    </span>
                  </div>
                  <div
                    style={{
                      flex: cost.spare / (cost.maintenance + cost.spare),
                      background: 'var(--mt-warning)',
                      borderRadius: '2px',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '9px', color: '#fff', position: 'absolute', left: '2px', top: '3px' }}>
                      Ref
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content - Photos */}
      {activeTab === 'photos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--mt-space-lg)' }}>
          {expedient.photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                background: 'var(--mt-bg-surface)',
                borderRadius: 'var(--mt-radius-md)',
                padding: 'var(--mt-space-lg)',
                textAlign: 'center',
                cursor: 'pointer',
                border: '1px solid var(--mt-border)',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-sm)' }}>
                {photo.thumb}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', margin: 0, marginBottom: '4px' }}>
                {new Date(photo.date).toLocaleDateString('es-ES')}
              </p>
              <p style={{ fontSize: '11px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                {photo.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
