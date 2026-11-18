import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtCard, MtBadge, MtButton } from '../ui';
import {
  Wrench, Clock, CheckCircle2, AlertCircle, ChevronRight, User, Briefcase, History, Plus, PauseCircle, CalendarClock,
} from 'lucide-react';
import { maintenanceApi } from '../services/maintenanceApi';
import { STATE_LABELS, PRIORITY_LABELS } from '../constants/maintenance';
import '../ui/tokens.css';

const STORAGE_KEY = 'mt.technicianDashboard.technicianId';
const TYPE_LABELS = { CORRECTIVE: 'Correctiva', PREVENTIVE: 'Preventiva', INSPECTION: 'Inspección' };
const PRIORITY_COLOR = { CRITICAL: 'var(--mt-danger)', HIGH: 'var(--mt-warning)', MEDIUM: 'var(--mt-accent)', LOW: 'var(--mt-info)' };
const woNumber = (n) => `OT-${String(n).padStart(5, '0')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : null);

function Stat({ icon: Icon, label, value, color }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Icon size={16} style={{ color }} />
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', textTransform: 'uppercase' }}>{label}</div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: '900', color }}>{value}</div>
      </div>
    </MtCard>
  );
}

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await maintenanceApi.getTechnicianDashboard({ technicianId: selectedId || undefined }));
    } catch (err) {
      console.error('[TechnicianDashboard] Error loading dashboard:', err);
      // Si el técnico guardado ya no existe, se vuelve a la vista propia
      if (err?.status === 404 && selectedId) {
        localStorage.removeItem(STORAGE_KEY);
        setSelectedId('');
        return;
      }
      setError(err?.data?.error || err?.message || 'No se pudo cargar el tablero');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const chooseTechnician = (id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    setSelectedId(id);
  };

  if (loading && !data) {
    return (
      <MtCard elevated>
        <p style={{ padding: 'var(--mt-space-3xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-secondary)' }}>Cargando tablero...</p>
      </MtCard>
    );
  }

  if (error) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <p style={{ margin: 0, color: 'var(--mt-danger)', fontWeight: 700 }}>{error}</p>
          <MtButton onClick={load}>Reintentar</MtButton>
        </div>
      </MtCard>
    );
  }

  const { technician, technicians = [], openOrders = [], recentCompleted = [], stats } = data || {};
  const canChoose = technicians.length > 0;

  const picker = canChoose && (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
      Ver técnico:
      <select
        value={selectedId || technician?.id || ''}
        onChange={(e) => chooseTechnician(e.target.value)}
        style={{ padding: '8px 10px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-surface)', color: 'var(--mt-text-primary)', fontSize: '13px' }}
      >
        <option value="">— Selecciona —</option>
        {technicians.map((t) => (
          <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` · ${t.specialty}` : ''}</option>
        ))}
      </select>
    </label>
  );

  // Usuario sin ficha de técnico y sin técnico elegido
  if (!technician) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <User size={40} style={{ color: 'var(--mt-accent)' }} />
          <h2 style={{ margin: 0, fontSize: '18px' }}>Tu usuario no está vinculado a un técnico</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-text-secondary)', maxWidth: '420px' }}>
            {canChoose
              ? 'Como supervisor puedes ver el tablero de cualquier técnico de la planta.'
              : 'Pide a un administrador que vincule tu usuario con tu ficha de técnico para ver tus órdenes.'}
          </p>
          {picker}
        </div>
      </MtCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)', paddingBottom: '72px' }}>
      {/* Perfil */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--mt-space-lg)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--mt-radius-md)', background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={28} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{technician.name}</h2>
              <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                {[technician.code, technician.specialty].filter(Boolean).join(' · ')}
              </p>
              {(technician.phone || technician.email) && (
                <p style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', margin: '2px 0 0 0' }}>
                  {[technician.phone, technician.email].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          {picker}
        </div>
      </MtCard>

      {/* Indicadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <Stat icon={Briefcase} label="Asignadas" value={stats.assigned} color="var(--mt-warning)" />
        <Stat icon={Wrench} label="En proceso" value={stats.inProgress} color="var(--mt-accent)" />
        <Stat icon={PauseCircle} label="En espera" value={stats.waiting} color="var(--mt-text-secondary)" />
        <Stat icon={CalendarClock} label="Vencidas" value={stats.overdue} color={stats.overdue ? 'var(--mt-danger)' : 'var(--mt-success)'} />
        <Stat icon={CheckCircle2} label="Completadas (30d)" value={stats.completed30d} color="var(--mt-success)" />
        <Stat icon={Clock} label="Horas hoy" value={`${stats.hoursToday}h`} color="var(--mt-info)" />
      </div>

      {/* Órdenes abiertas */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--mt-space-lg)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={20} /> {technician.id === data.technician?.id && !selectedId ? 'Mis órdenes' : 'Órdenes asignadas'}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', fontWeight: '700' }}>{openOrders.length} pendientes</span>
        </div>

        {openOrders.length === 0 ? (
          <MtCard elevated>
            <p style={{ padding: 'var(--mt-space-xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>
              No hay órdenes asignadas pendientes. 🎉
            </p>
          </MtCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {openOrders.map((order) => {
              const due = order.dueAt || order.scheduledAt;
              return (
                <MtCard key={order.id} elevated interactive onClick={() => navigate(`/maintenance/app/work-orders/${order.id}`)}>
                  <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderLeft: `4px solid ${PRIORITY_COLOR[order.priority]}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-sm)', marginBottom: '6px', flexWrap: 'wrap' }}>
                        {['CRITICAL', 'HIGH'].includes(order.priority) && <AlertCircle size={16} style={{ color: PRIORITY_COLOR[order.priority] }} />}
                        <code style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-accent)' }}>{woNumber(order.number)}</code>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{order.title}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <MtBadge size="sm" variant={order.status === 'IN_PROGRESS' ? 'warning' : order.status === 'ASSIGNED' ? 'accent' : 'neutral'}>
                          {STATE_LABELS[order.status] || order.status}
                        </MtBadge>
                        <MtBadge size="sm" variant={order.type === 'CORRECTIVE' ? 'danger' : 'info'}>{TYPE_LABELS[order.type] || order.type}</MtBadge>
                        <MtBadge size="sm" variant="neutral">Prioridad {PRIORITY_LABELS[order.priority] || order.priority}</MtBadge>
                        {order.overdue && <MtBadge size="sm" variant="danger">Vencida</MtBadge>}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                        {order.asset ? `${order.asset.code} · ${order.asset.name}${order.asset.location ? ` · ${order.asset.location}` : ''}` : 'Sin activo'}
                        {due && ` · Programada ${fmtDate(due)}`}
                        {order._count?.tasks > 0 && ` · ${order._count.tasks} tarea(s)`}
                      </p>
                    </div>
                    <ChevronRight size={20} style={{ color: 'var(--mt-text-tertiary)' }} />
                  </div>
                </MtCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial reciente */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '900', margin: '0 0 var(--mt-space-lg) 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} /> Terminadas en los últimos 30 días
          <span style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)', fontWeight: 700 }}>· {stats.hours30d}h trabajadas</span>
        </h3>
        {recentCompleted.length === 0 ? (
          <MtCard elevated>
            <p style={{ padding: 'var(--mt-space-xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>Sin órdenes terminadas recientemente.</p>
          </MtCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            {recentCompleted.map((order) => (
              <MtCard key={order.id} elevated interactive onClick={() => navigate(`/maintenance/app/work-orders/${order.id}`)}>
                <div style={{ padding: 'var(--mt-space-lg)', borderLeft: '4px solid var(--mt-success)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>
                      <code style={{ color: 'var(--mt-accent)', marginRight: '6px' }}>{woNumber(order.number)}</code>{order.title}
                    </h4>
                    <MtBadge variant="success" size="sm">{STATE_LABELS[order.status] || order.status}</MtBadge>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', margin: 0 }}>
                    {order.asset ? `${order.asset.code} · ${order.asset.name}` : 'Sin activo'} · Terminada {fmtDate(order.finishedAt)} · {order.hours}h
                  </p>
                </div>
              </MtCard>
            ))}
          </div>
        )}
      </div>

      {/* Acción rápida: reportar falla */}
      <div style={{ position: 'fixed', bottom: 'var(--mt-space-lg)', right: 'var(--mt-space-lg)', zIndex: 40 }}>
        <MtButton
          onClick={() => navigate('/maintenance/app/report-failure')}
          aria-label="Reportar falla"
          title="Reportar falla"
          style={{ borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)' }}
        >
          <Plus size={24} />
        </MtButton>
      </div>
    </div>
  );
}
