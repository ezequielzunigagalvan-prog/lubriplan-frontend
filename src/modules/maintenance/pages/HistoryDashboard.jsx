import { useState, useMemo } from 'react';
import { MtCard, MtBadge } from '../ui';
import {
  Search, Filter, Download, Clock, AlertCircle, Wrench, Droplet,
  TrendingDown, Calendar, ChevronDown, ChevronUp, Zap, Package,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import '../ui/tokens.css';

// Mock history data
const MOCK_HISTORY = [
  {
    id: 1,
    timestamp: '2025-11-28 14:30',
    type: 'WORK_ORDER_COMPLETED',
    category: 'ASSET_MAINTENANCE',
    asset: 'Bomba Principal',
    assetCode: 'EQ-001',
    title: 'Cambio de aceite - Mantenimiento preventivo',
    description: 'Se realizó cambio de aceite a la bomba. Aceite SAE 40 de 5 litros. Funcionamiento normal.',
    technician: 'Juan Pérez',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    details: {
      hoursSpent: 2.5,
      partsUsed: ['Aceite SAE 40 (5L)', 'Filtro Hidráulico'],
      notes: 'Bomba funcionando correctamente',
    },
  },
  {
    id: 2,
    timestamp: '2025-11-27 10:15',
    type: 'FAILURE_REPORTED',
    category: 'FAILURE',
    asset: 'Motor Eléctrico B',
    assetCode: 'EQ-002',
    title: 'Ruido anormal en motor',
    description: 'Operador reporta ruido anormal en motor durante operación normal.',
    technician: 'José López (Operador)',
    status: 'REPORTED',
    priority: 'HIGH',
    details: {
      failureCode: 'MEC-002-NOISE',
      symptom: 'Ruido de fricción',
      reportedBy: 'José López',
      location: 'Planta Jilotepec',
    },
  },
  {
    id: 3,
    timestamp: '2025-11-26 16:45',
    type: 'SPARE_PART_USED',
    category: 'SPARE_PARTS',
    asset: 'Compresor Principal',
    assetCode: 'EQ-003',
    title: 'Reemplazo de válvula de descarga',
    description: 'Se reemplazó válvula de descarga dañada por nueva.',
    technician: 'Carlos López',
    status: 'COMPLETED',
    priority: 'HIGH',
    details: {
      partCode: 'VALVE-DSC-001',
      partName: 'Válvula Descarga Compresor',
      quantity: 1,
      costPerUnit: 450,
      totalCost: 450,
      replacedPart: 'VALVE-DSC-OLD-012',
    },
  },
  {
    id: 4,
    timestamp: '2025-11-25 09:20',
    type: 'PREVENTIVE_PLAN_EXECUTED',
    category: 'PREVENTIVE_MAINTENANCE',
    asset: 'Reductor Principal',
    assetCode: 'EQ-004',
    title: 'Mantenimiento preventivo mensual',
    description: 'Ejecutado plan preventivo mensual para reductor.',
    technician: 'Juan Pérez',
    status: 'COMPLETED',
    priority: 'LOW',
    details: {
      planId: 'PREV-004-MONTHLY',
      frequency: 'Monthly',
      nextDue: '2025-12-25',
      checklist: ['Inspección visual', 'Medición de temperatura', 'Análisis de vibración'],
    },
  },
  {
    id: 5,
    timestamp: '2025-11-24 14:00',
    type: 'INVENTORY_MOVEMENT',
    category: 'SPARE_PARTS',
    asset: 'Almacén Jilotepec',
    assetCode: 'STG-001',
    title: 'Entrada de refacciones',
    description: 'Recepción de nuevas refacciones del proveedor.',
    technician: 'Supervisor Almacén',
    status: 'COMPLETED',
    priority: 'LOW',
    details: {
      movement: 'IN',
      partCode: 'BEARING-SKF-6205',
      partName: 'Rodamiento SKF 6205',
      quantity: 12,
      cost: 3600,
      supplier: 'Distribuidora Azpiazu',
      invoiceNumber: 'INV-2025-1234',
    },
  },
  {
    id: 6,
    timestamp: '2025-11-23 11:30',
    type: 'ASSET_INSPECTION',
    category: 'ASSET_MAINTENANCE',
    asset: 'Bomba Principal',
    assetCode: 'EQ-001',
    title: 'Inspección técnica mensual',
    description: 'Inspección visual y técnica del activo.',
    technician: 'Roberto García',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    details: {
      condition: 'GOOD',
      temperature: '65°C',
      vibration: '2.5 mm/s',
      nextInspection: '2025-12-23',
      recommendations: 'Continuar monitoreo mensual',
    },
  },
  {
    id: 7,
    timestamp: '2025-11-22 08:45',
    type: 'WORK_ORDER_REJECTED',
    category: 'WORK_ORDER',
    asset: 'Motor Eléctrico B',
    assetCode: 'EQ-002',
    title: 'Orden rechazada - Falta de información',
    description: 'Orden de mantenimiento rechazada por falta de información técnica.',
    technician: 'Supervisor Mantenimiento',
    status: 'REJECTED',
    priority: 'MEDIUM',
    details: {
      rejectionReason: 'Información incompleta',
      rejectedBy: 'Ana Martínez',
      requiredInfo: ['Diagnóstico completo', 'Estimación de horas'],
    },
  },
  {
    id: 8,
    timestamp: '2025-11-21 15:00',
    type: 'CALIBRATION_PERFORMED',
    category: 'ASSET_MAINTENANCE',
    asset: 'Sensor Presión PT-001',
    assetCode: 'INSTR-001',
    title: 'Calibración de sensor de presión',
    description: 'Calibración según estándar ISO 9001.',
    technician: 'Roberto García',
    status: 'COMPLETED',
    priority: 'HIGH',
    details: {
      calibrationStandard: 'ISO 9001',
      certificateNumber: 'CAL-2025-0145',
      rangeStart: 0,
      rangeEnd: 100,
      errorMargin: '±0.5%',
      nextCalibration: '2026-11-21',
    },
  },
];

const HISTORY_TYPES = {
  WORK_ORDER_COMPLETED: { label: 'Orden Completada', icon: CheckCircle2, color: '#10B981' },
  FAILURE_REPORTED: { label: 'Falla Reportada', icon: AlertCircle, color: '#EF4444' },
  SPARE_PART_USED: { label: 'Refacción Usada', icon: Package, color: '#F59E0B' },
  PREVENTIVE_PLAN_EXECUTED: { label: 'Plan Preventivo', icon: Wrench, color: '#38BDF8' },
  INVENTORY_MOVEMENT: { label: 'Movimiento Inventario', icon: TrendingDown, color: '#8B5CF6' },
  ASSET_INSPECTION: { label: 'Inspección Activo', icon: Zap, color: '#06B6D4' },
  WORK_ORDER_REJECTED: { label: 'Orden Rechazada', icon: AlertTriangle, color: '#DC2626' },
  CALIBRATION_PERFORMED: { label: 'Calibración', icon: Droplet, color: '#7C3AED' },
};

const CATEGORIES = {
  ASSET_MAINTENANCE: 'Mantenimiento de Activos',
  FAILURE: 'Fallas',
  SPARE_PARTS: 'Refacciones',
  PREVENTIVE_MAINTENANCE: 'Mantenimiento Preventivo',
  WORK_ORDER: 'Órdenes de Trabajo',
};

export default function HistoryDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    return MOCK_HISTORY.filter(item => {
      const matchSearch =
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.asset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.technician?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [searchTerm, filterCategory, filterStatus]);

  const stats = {
    total: MOCK_HISTORY.length,
    completedOrders: MOCK_HISTORY.filter(h => h.type === 'WORK_ORDER_COMPLETED').length,
    failuresReported: MOCK_HISTORY.filter(h => h.type === 'FAILURE_REPORTED').length,
    partsUsed: MOCK_HISTORY.filter(h => h.type === 'SPARE_PART_USED').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
          Historial del Sistema
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
          Registro completo de eventos, mantenimiento, fallas y refacciones
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Clock size={16} style={{ color: 'var(--mt-accent)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>TOTAL EVENTOS</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-accent)' }}>
              {stats.total}
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Wrench size={16} style={{ color: 'var(--mt-success)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>ÓRDENES COMPLETADAS</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-success)' }}>
              {stats.completedOrders}
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <AlertCircle size={16} style={{ color: 'var(--mt-danger)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>FALLAS REPORTADAS</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-danger)' }}>
              {stats.failuresReported}
            </div>
          </div>
        </MtCard>

        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Package size={16} style={{ color: 'var(--mt-info)' }} />
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)' }}>REFACCIONES USADAS</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--mt-info)' }}>
              {stats.partsUsed}
            </div>
          </div>
        </MtCard>
      </div>

      {/* Filters */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--mt-space-lg)' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-tertiary)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar por activo, técnico, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Category Filter */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--mt-radius-md)',
                  fontSize: '14px',
                  border: '1px solid var(--mt-border)',
                  background: 'var(--mt-bg-surface)',
                  color: 'var(--mt-text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">Todas las categorías</option>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--mt-radius-md)',
                  fontSize: '14px',
                  border: '1px solid var(--mt-border)',
                  background: 'var(--mt-bg-surface)',
                  color: 'var(--mt-text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">Todos los estados</option>
                <option value="COMPLETED">Completado</option>
                <option value="REPORTED">Reportado</option>
                <option value="IN_PROGRESS">En Proceso</option>
                <option value="REJECTED">Rechazado</option>
              </select>
            </div>

            {/* Export Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--mt-radius-md)',
                  background: 'var(--mt-accent)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Download size={16} />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </MtCard>

      {/* History Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0 }}>
          {filtered.length} Evento{filtered.length !== 1 ? 's' : ''} Encontrado{filtered.length !== 1 ? 's' : ''}
        </h2>

        {filtered.length === 0 ? (
          <MtCard elevated>
            <div style={{ textAlign: 'center', padding: 'var(--mt-space-3xl)' }}>
              <Clock size={48} style={{ color: 'var(--mt-accent)', marginBottom: 'var(--mt-space-md)', opacity: 0.6 }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
                Sin eventos
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                No hay eventos que coincidan con los filtros seleccionados
              </p>
            </div>
          </MtCard>
        ) : (
          filtered.map((item) => {
            const TypeIcon = HISTORY_TYPES[item.type]?.icon || Clock;
            const isExpanded = expandedId === item.id;

            return (
              <MtCard key={item.id} elevated style={{ background: 'var(--mt-bg-surface)' }}>
                <div
                  style={{
                    padding: 'var(--mt-space-lg)',
                    borderLeft: `4px solid ${HISTORY_TYPES[item.type]?.color || 'var(--mt-accent)'}`,
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {/* Main Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: 'var(--mt-space-md)', flex: 1 }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--mt-radius-md)',
                          background: `${HISTORY_TYPES[item.type]?.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <TypeIcon size={22} style={{ color: HISTORY_TYPES[item.type]?.color }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-sm)' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mt-text-primary)', margin: 0 }}>
                            {item.title}
                          </h3>
                          <MtBadge
                            variant={item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'info'}
                            size="sm"
                          >
                            {item.status}
                          </MtBadge>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-md)', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                          <div>
                            <span style={{ fontWeight: '700' }}>Activo:</span> {item.asset} ({item.assetCode})
                          </div>
                          <div>
                            <span style={{ fontWeight: '700' }}>Técnico:</span> {item.technician}
                          </div>
                          <div>
                            <span style={{ fontWeight: '700' }}>Fecha:</span> {item.timestamp}
                          </div>
                          <div>
                            <span style={{ fontWeight: '700' }}>Categoría:</span> {CATEGORIES[item.category]}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 'var(--mt-space-md)',
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp size={20} style={{ color: 'var(--mt-text-secondary)' }} />
                      ) : (
                        <ChevronDown size={20} style={{ color: 'var(--mt-text-secondary)' }} />
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ marginTop: 'var(--mt-space-lg)', paddingTop: 'var(--mt-space-lg)', borderTop: '1px solid var(--mt-border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mt-space-lg)' }}>
                        {/* Description */}
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Descripción
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--mt-text-primary)', margin: 0, lineHeight: '1.5' }}>
                            {item.description}
                          </p>
                        </div>

                        {/* Details Object */}
                        {item.details && Object.entries(item.details).map(([key, value]) => (
                          <div key={key}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            {Array.isArray(value) ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {value.map((v, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: '12px',
                                      background: 'var(--mt-bg-base)',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      color: 'var(--mt-text-secondary)',
                                    }}
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            ) : typeof value === 'object' ? (
                              <pre
                                style={{
                                  fontSize: '11px',
                                  background: 'var(--mt-bg-base)',
                                  padding: 'var(--mt-space-sm)',
                                  borderRadius: '4px',
                                  overflow: 'auto',
                                  margin: 0,
                                  color: 'var(--mt-text-secondary)',
                                }}
                              >
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                                {String(value)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </MtCard>
            );
          })
        )}
      </div>
    </div>
  );
}
