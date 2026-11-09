import { useState, useMemo } from 'react';
import { MtCard, MtBadge, MtButton } from '../ui';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, Users,
  CheckCircle2, AlertCircle, Wrench, Zap, Droplet, Grid3x3, List,
  Edit3, X, Plus
} from 'lucide-react';
import '../ui/tokens.css';

// Mock data for calendar events
const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Cambio de aceite Bomba A',
    type: 'PREVENTIVE',
    date: '2025-12-01',
    startTime: '08:00',
    endTime: '10:00',
    technician: 'Juan Pérez',
    plant: 'Planta Jilotepec',
    status: 'SCHEDULED',
    priority: 'MEDIUM',
  },
  {
    id: 2,
    title: 'Reparación Motor B',
    type: 'CORRECTIVE',
    date: '2025-12-01',
    startTime: '10:30',
    endTime: '13:00',
    technician: 'Carlos López',
    plant: 'Planta Jilotepec',
    status: 'SCHEDULED',
    priority: 'HIGH',
  },
  {
    id: 3,
    title: 'Inspección Reductor',
    type: 'PREVENTIVE',
    date: '2025-12-01',
    startTime: '14:00',
    endTime: '15:30',
    technician: 'Juan Pérez',
    plant: 'Planta Jilotepec',
    status: 'SCHEDULED',
    priority: 'LOW',
  },
  {
    id: 4,
    title: 'Paro programado Línea 2',
    type: 'SCHEDULED_DOWNTIME',
    date: '2025-12-02',
    startTime: '06:00',
    endTime: '12:00',
    technician: 'Equipo Mantenimiento',
    plant: 'Planta Jilotepec',
    status: 'SCHEDULED',
    priority: 'CRITICAL',
  },
  {
    id: 5,
    title: 'Calibración Sensores',
    type: 'ROUTINE',
    date: '2025-12-02',
    startTime: '08:00',
    endTime: '09:00',
    technician: 'Roberto García',
    plant: 'Planta Toluca',
    status: 'SCHEDULED',
    priority: 'MEDIUM',
  },
  {
    id: 6,
    title: 'Lubricación General',
    type: 'ROUTINE',
    date: '2025-12-03',
    startTime: '07:00',
    endTime: '08:30',
    technician: 'Miguel Torres',
    plant: 'Planta Jilotepec',
    status: 'SCHEDULED',
    priority: 'LOW',
  },
  {
    id: 7,
    title: 'Emergencia: Fuga Hidráulica',
    type: 'CORRECTIVE',
    date: '2025-12-03',
    startTime: '11:00',
    endTime: '14:00',
    technician: 'Juan Pérez',
    plant: 'Planta Jilotepec',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
  },
];

const MOCK_TECHNICIANS = [
  { id: 1, name: 'Juan Pérez', availability: 'available' },
  { id: 2, name: 'Carlos López', availability: 'available' },
  { id: 3, name: 'Roberto García', availability: 'on_leave' },
  { id: 4, name: 'Miguel Torres', availability: 'available' },
];

const EVENT_TYPES = {
  PREVENTIVE: { label: 'Preventiva', color: '#38BDF8', icon: Wrench },
  CORRECTIVE: { label: 'Correctiva', color: '#EF4444', icon: AlertTriangle },
  ROUTINE: { label: 'Rutinaria', color: '#10B981', icon: CheckCircle2 },
  SCHEDULED_DOWNTIME: { label: 'Paro Programado', color: '#8B5CF6', icon: AlertCircle },
};

export default function PlanningCalendar() {
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date('2025-12-01'));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showConflicts, setShowConflicts] = useState(true);

  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Check for technician conflicts
  const getConflicts = useMemo(() => {
    const conflicts = [];
    const techSchedule = {};

    MOCK_EVENTS.forEach(event => {
      if (!techSchedule[event.technician]) {
        techSchedule[event.technician] = [];
      }
      techSchedule[event.technician].push(event);
    });

    // Check for overlaps
    Object.entries(techSchedule).forEach(([tech, events]) => {
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const e1 = events[i];
          const e2 = events[j];
          if (e1.date === e2.date) {
            const time1Start = parseInt(e1.startTime.replace(':', ''));
            const time1End = parseInt(e1.endTime.replace(':', ''));
            const time2Start = parseInt(e2.startTime.replace(':', ''));
            const time2End = parseInt(e2.endTime.replace(':', ''));

            if ((time2Start < time1End && time2End > time1Start)) {
              conflicts.push({
                technician: tech,
                events: [e1.id, e2.id],
                type: 'OVERLAP',
              });
            }
          }
        }
      }
    });

    return conflicts;
  }, []);

  // Get events for specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return MOCK_EVENTS.filter(e => e.date === dateStr);
  };

  // Month view
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ background: 'var(--mt-bg-base)', borderRadius: 'var(--mt-radius-md)' }} />);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          style={{
            border: isToday ? '2px solid var(--mt-accent)' : '1px solid var(--mt-border)',
            borderRadius: 'var(--mt-radius-md)',
            padding: 'var(--mt-space-sm)',
            minHeight: '100px',
            background: isToday ? 'rgba(56, 189, 248, 0.05)' : 'var(--mt-bg-surface)',
          }}
        >
          <div style={{ fontWeight: '700', fontSize: '12px', marginBottom: 'var(--mt-space-sm)', color: 'var(--mt-text-primary)' }}>
            {day}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {events.slice(0, 2).map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                style={{
                  padding: '2px 4px',
                  background: EVENT_TYPES[event.type].color,
                  borderRadius: '2px',
                  fontSize: '9px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {event.title}
              </div>
            ))}
            {events.length > 2 && (
              <div style={{ fontSize: '9px', color: 'var(--mt-accent)', fontWeight: '700' }}>
                +{events.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // Week view
  const renderWeekView = () => {
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const events = getEventsForDate(date);
      const dayName = date.toLocaleDateString('es-MX', { weekday: 'short' });

      weekDays.push(
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--mt-accent)', paddingBottom: 'var(--mt-space-sm)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
              {dayName.toUpperCase()}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--mt-accent)' }}>
              {date.getDate()}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
            {events.map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                style={{
                  padding: 'var(--mt-space-sm)',
                  background: EVENT_TYPES[event.type].color + '20',
                  border: `1px solid ${EVENT_TYPES[event.type].color}`,
                  borderRadius: 'var(--mt-radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                  {event.startTime} - {event.endTime}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--mt-text-secondary)', marginTop: '2px' }}>
                  {event.title}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--mt-text-tertiary)', marginTop: '2px' }}>
                  {event.technician}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return weekDays;
  };

  // Day view
  const renderDayView = () => {
    const events = getEventsForDate(currentDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
          {currentDate.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--mt-space-lg)' }}>
          {hours.map(hour => {
            const hourEvents = events.filter(e => {
              const startHour = parseInt(e.startTime.split(':')[0]);
              return startHour === hour;
            });

            return (
              <div key={hour} style={{ display: 'contents' }}>
                <div style={{ textAlign: 'right', paddingRight: 'var(--mt-space-lg)', fontSize: '12px', fontWeight: '700', color: 'var(--mt-text-secondary)' }}>
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      style={{
                        padding: 'var(--mt-space-md)',
                        background: EVENT_TYPES[event.type].color + '20',
                        border: `2px solid ${EVENT_TYPES[event.type].color}`,
                        borderRadius: 'var(--mt-radius-md)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>
                        {event.startTime} - {event.endTime} • {event.technician}
                      </div>
                      <MtBadge variant={event.priority === 'CRITICAL' ? 'danger' : 'info'} size="sm" style={{ marginTop: '4px' }}>
                        {event.priority}
                      </MtBadge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const monthName = currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--mt-space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: 'var(--mt-space-sm)' }}>
            Calendario de Planificación
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mt-text-secondary)', margin: 0 }}>
            {MOCK_EVENTS.length} eventos | {getConflicts.length} conflictos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
          <button
            onClick={() => setViewMode('day')}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--mt-radius-md)',
              background: viewMode === 'day' ? 'var(--mt-accent)' : 'var(--mt-bg-surface)',
              color: viewMode === 'day' ? '#fff' : 'var(--mt-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
            }}
          >
            Día
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--mt-radius-md)',
              background: viewMode === 'week' ? 'var(--mt-accent)' : 'var(--mt-bg-surface)',
              color: viewMode === 'week' ? '#fff' : 'var(--mt-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
            }}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--mt-radius-md)',
              background: viewMode === 'month' ? 'var(--mt-accent)' : 'var(--mt-bg-surface)',
              color: viewMode === 'month' ? '#fff' : 'var(--mt-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
            }}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Navigation and Conflicts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        {/* Navigation Card */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--mt-space-lg)' }}>
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === 'month') {
                    newDate.setMonth(newDate.getMonth() - 1);
                  } else if (viewMode === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                  } else {
                    newDate.setDate(newDate.getDate() - 1);
                  }
                  setCurrentDate(newDate);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--mt-radius-md)',
                  border: '1px solid var(--mt-border)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-secondary)', textTransform: 'uppercase' }}>
                  {viewMode === 'month' ? monthName : currentDate.toLocaleDateString('es-MX')}
                </div>
              </div>
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === 'month') {
                    newDate.setMonth(newDate.getMonth() + 1);
                  } else if (viewMode === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                  } else {
                    newDate.setDate(newDate.getDate() + 1);
                  }
                  setCurrentDate(newDate);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--mt-radius-md)',
                  border: '1px solid var(--mt-border)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                width: '100%',
                padding: 'var(--mt-space-md)',
                borderRadius: 'var(--mt-radius-md)',
                background: 'var(--mt-accent)',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Hoy
            </button>
          </div>
        </MtCard>

        {/* Conflicts Card */}
        {getConflicts.length > 0 && (
          <MtCard elevated style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--mt-space-md)' }}>
                <AlertTriangle size={18} style={{ color: 'var(--mt-danger)' }} />
                <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, color: 'var(--mt-text-primary)' }}>
                  Conflictos de Asignación
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
                {getConflicts.slice(0, 3).map((conflict, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', padding: '6px', background: 'var(--mt-bg-base)', borderRadius: '4px' }}>
                    <strong>{conflict.technician}</strong> tiene eventos solapados
                  </div>
                ))}
              </div>
            </div>
          </MtCard>
        )}

        {/* Technician Availability */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--mt-space-md)' }}>
              <Users size={18} style={{ color: 'var(--mt-accent)' }} />
              <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, color: 'var(--mt-text-primary)' }}>
                Disponibilidad
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
              {MOCK_TECHNICIANS.map(tech => (
                <div key={tech.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--mt-text-secondary)' }}>{tech.name}</span>
                  <MtBadge
                    variant={tech.availability === 'available' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {tech.availability === 'available' ? 'Disponible' : 'De licencia'}
                  </MtBadge>
                </div>
              ))}
            </div>
          </div>
        </MtCard>
      </div>

      {/* Calendar View */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          {viewMode === 'month' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--mt-space-sm)', marginBottom: 'var(--mt-space-lg)' }}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map((day, idx) => (
                <div key={idx} style={{ textAlign: 'center', fontWeight: '700', fontSize: '12px', color: 'var(--mt-text-secondary)', padding: 'var(--mt-space-sm)' }}>
                  {day}
                </div>
              ))}
              {renderMonthView()}
            </div>
          )}

          {viewMode === 'week' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--mt-space-lg)' }}>
              {renderWeekView()}
            </div>
          )}

          {viewMode === 'day' && (
            <div>
              {renderDayView()}
            </div>
          )}
        </div>
      </MtCard>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <MtCard elevated style={{ maxWidth: '400px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 'var(--mt-space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--mt-space-lg)' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--mt-text-primary)', margin: 0, marginBottom: '4px' }}>
                    {selectedEvent.title}
                  </h2>
                  <MtBadge variant={selectedEvent.priority === 'CRITICAL' ? 'danger' : 'info'} size="sm">
                    {EVENT_TYPES[selectedEvent.type].label}
                  </MtBadge>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} style={{ color: 'var(--mt-text-secondary)' }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>FECHA Y HORA</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                    {new Date(selectedEvent.date).toLocaleDateString('es-MX')} • {selectedEvent.startTime} - {selectedEvent.endTime}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>TÉCNICO</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                    {selectedEvent.technician}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--mt-text-tertiary)', marginBottom: '4px' }}>PLANTA</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--mt-text-primary)' }}>
                    {selectedEvent.plant}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
                  <button
                    style={{
                      padding: 'var(--mt-space-md)',
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
                    <Edit3 size={14} />
                    Editar
                  </button>
                  <button
                    style={{
                      padding: 'var(--mt-space-md)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'transparent',
                      color: 'var(--mt-text-secondary)',
                      border: '1px solid var(--mt-border)',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedEvent(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </MtCard>
        </div>
      )}
    </div>
  );
}
