import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { toast } from 'sonner';
import {
  Users, Search, Plus, Filter, Award, Clock, TrendingUp, AlertCircle,
  Wrench, Zap, Droplet, Flame, Gauge, Shield, ChevronRight, Trash2, Edit2, Mail, Phone, LayoutGrid, List
} from 'lucide-react';
import '../ui/tokens.css';

const SPECIALITIES = {
  MECHANIC: { label: 'Mecánica', icon: Wrench, color: '#f59e0b' },
  ELECTRICAL: { label: 'Eléctrica', icon: Zap, color: '#ef4444' },
  INSTRUMENTS: { label: 'Instrumentación', icon: Gauge, color: '#3b82f6' },
  WELDING: { label: 'Soldadura', icon: Flame, color: '#f59e0b' },
  LUBRICATION: { label: 'Lubricación', icon: Droplet, color: '#38bdf8' },
  SUPERVISOR: { label: 'Supervisor', icon: Shield, color: '#22c55e' },
  MANAGER: { label: 'Jefe', icon: Award, color: '#38bdf8' },
};

export default function PersonnelManagement() {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Activo');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    filterTechnicians();
  }, [technicians, searchTerm, statusFilter, specialtyFilter]);

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const response = await maintenanceApi.getTechnicians({ limit: 1000 });
      setTechnicians(response?.data || []);
    } catch (err) {
      console.error('Error loading technicians:', err);
      toast.error('Error al cargar técnicos');
    } finally {
      setLoading(false);
    }
  };

  const filterTechnicians = () => {
    let filtered = [...technicians];

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Filtrar por especialidad
    if (specialtyFilter !== 'all') {
      filtered = filtered.filter(t => t.specialty === specialtyFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.code?.toLowerCase().includes(term)
      );
    }

    setFilteredTechnicians(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas desactivar este técnico?')) {
      try {
        await maintenanceApi.deleteTechnician(id);
        toast.success('Técnico desactivado');
        loadTechnicians();
      } catch (err) {
        toast.error('Error al desactivar técnico');
      }
    }
  };

  const stats = {
    total: technicians.filter(t => t.status === 'Activo').length,
    bySpecialty: SPECIALITIES,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'var(--mt-text-secondary)' }}>Cargando personal...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
        color: '#fff',
        padding: '32px',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Users size={40} />
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Gestión de Personal</h1>
            <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.9 }}>Administra técnicos y personal de mantenimiento</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/maintenance/app/personnel/new')}
          style={{
            background: '#fff',
            color: '#38bdf8',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={20} /> Nuevo Técnico
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(2, 132, 199, 0.05))',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--mt-border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#38bdf8' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Técnicos Activos</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(20, 184, 60, 0.05))',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--mt-border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{technicians.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Total Registrados</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(239, 68, 68, 0.05))',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid var(--mt-border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>
            {technicians.filter(t => t.status === 'Inactivo').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>Inactivos</div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div style={{
        background: 'var(--mt-bg-surface)',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid var(--mt-border)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Búsqueda */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: '6px',
              border: '1px solid var(--mt-border)',
              background: 'var(--mt-bg-base)',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--mt-text-tertiary)' }} />
        </div>

        {/* Filtro de Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--mt-border)',
            background: 'var(--mt-bg-base)',
            fontSize: '14px'
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="Activo">Activos</option>
          <option value="Inactivo">Inactivos</option>
        </select>

        {/* Filtro de Especialidad */}
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--mt-border)',
            background: 'var(--mt-bg-base)',
            fontSize: '14px'
          }}
        >
          <option value="all">Todas las especialidades</option>
          {Object.entries(SPECIALITIES).map(([key, spec]) => (
            <option key={key} value={key}>{spec.label}</option>
          ))}
        </select>

        {/* Vista */}
        <div style={{ display: 'flex', gap: '8px', borderLeft: '1px solid var(--mt-border)', paddingLeft: '16px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px',
              background: viewMode === 'grid' ? '#38bdf8' : 'transparent',
              color: viewMode === 'grid' ? '#fff' : 'var(--mt-text-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px',
              background: viewMode === 'list' ? '#38bdf8' : 'transparent',
              color: viewMode === 'list' ? '#fff' : 'var(--mt-text-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Lista de Técnicos */}
      {filteredTechnicians.length > 0 ? (
        <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', flexDirection: viewMode === 'list' ? 'column' : undefined }}>
          {filteredTechnicians.map(tech => {
            const spec = SPECIALITIES[tech.specialty];
            const Icon = spec?.icon || Users;

            return (
              <div
                key={tech.id}
                style={{
                  background: 'var(--mt-bg-surface)',
                  border: '1px solid var(--mt-border)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--mt-text-primary)' }}>
                      {tech.name}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                      {tech.code}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: `${spec?.color}20`,
                      color: spec?.color
                    }}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                {/* Especialidad */}
                {spec && (
                  <div style={{
                    display: 'inline-block',
                    background: `${spec.color}20`,
                    color: spec.color,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    width: 'fit-content'
                  }}>
                    {spec.label}
                  </div>
                )}

                {/* Contacto */}
                {(tech.email || tech.phone) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
                    {tech.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={14} />
                        {tech.email}
                      </div>
                    )}
                    {tech.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} />
                        {tech.phone}
                      </div>
                    )}
                  </div>
                )}

                {/* Estado */}
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  width: 'fit-content',
                  background: tech.status === 'Activo' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                  color: tech.status === 'Activo' ? '#22c55e' : '#6b7280'
                }}>
                  {tech.status}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => navigate(`/maintenance/app/personnel/${tech.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#38bdf8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(tech.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={14} /> Desactivar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: 'var(--mt-bg-surface)',
          padding: '60px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid var(--mt-border)'
        }}>
          <AlertCircle size={40} style={{ margin: '0 auto 16px', color: 'var(--mt-text-tertiary)' }} />
          <p style={{ color: 'var(--mt-text-secondary)', marginBottom: '16px' }}>
            No se encontraron técnicos que coincidan con los filtros
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setSpecialtyFilter('all');
            }}
            style={{
              background: '#38bdf8',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
