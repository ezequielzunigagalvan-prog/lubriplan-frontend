import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, User, Mail, Phone, Link2, Unlink, Save, Award, Wrench, Clock, CheckCircle2, CalendarCheck, X } from 'lucide-react';
import { MtCard, MtBadge, MtButton } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';
import { useAuth } from '../../../context/AuthContext';
import { STATE_LABELS } from '../constants/maintenance';
import '../ui/tokens.css';

const SPECIALTIES = [
  { value: 'MECHANIC', label: 'Mecánica' },
  { value: 'ELECTRICAL', label: 'Eléctrica' },
  { value: 'INSTRUMENTS', label: 'Instrumentación' },
  { value: 'WELDING', label: 'Soldadura' },
  { value: 'LUBRICATION', label: 'Lubricación' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'MANAGER', label: 'Jefe de Mantenimiento' },
  { value: 'General', label: 'General' },
];
const specialtyLabel = (v) => SPECIALTIES.find((s) => s.value === v)?.label || v || '—';
const TYPE_LABELS = { CORRECTIVE: 'Correctiva', PREVENTIVE: 'Preventiva', INSPECTION: 'Inspección' };
const woNumber = (n) => `OT-${String(n).padStart(5, '0')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const errorMessage = (err, fallback) => err?.data?.error || err?.message || fallback;

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', background: 'var(--mt-bg-base)', color: 'var(--mt-text-primary)', fontSize: '14px', boxSizing: 'border-box' };
const labelStyle = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mt-text-tertiary)', marginBottom: '4px', display: 'block' };

function Stat({ icon: Icon, label, value, color = 'var(--mt-text-primary)' }) {
  return (
    <MtCard elevated>
      <div style={{ padding: 'var(--mt-space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Icon size={16} style={{ color }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mt-text-tertiary)', textTransform: 'uppercase' }}>{label}</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color }}>{value}</div>
      </div>
    </MtCard>
  );
}

export default function TechnicianProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isSupervisor } = useAuth();
  const canEdit = isAdmin || isSupervisor;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [newCert, setNewCert] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkableUsers, setLinkableUsers] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await maintenanceApi.getTechnicianProfile(id));
    } catch (err) {
      console.error('[TechnicianProfile] Error loading profile:', err);
      setError(err?.status === 404 ? 'El técnico no existe o fue desactivado' : errorMessage(err, 'No se pudo cargar el técnico'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    maintenanceApi.getLinkableUsers().then((u) => setLinkableUsers(Array.isArray(u) ? u : [])).catch(() => setLinkableUsers([]));
  }, [isAdmin]);

  const startEdit = () => {
    const t = data.technician;
    setForm({
      name: t.name || '',
      code: t.code || '',
      email: t.email || '',
      phone: t.phone || '',
      specialty: t.specialty || 'General',
      status: t.status || 'Activo',
      certifications: [...(t.certifications || [])],
    });
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('El nombre es requerido');
    try {
      setSaving(true);
      await maintenanceApi.updateTechnician(id, { ...form, name: form.name.trim(), code: form.code.trim() });
      toast.success('Técnico actualizado');
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  const addCert = () => {
    const value = newCert.trim();
    if (!value) return;
    setForm((f) => ({ ...f, certifications: [...f.certifications, value] }));
    setNewCert('');
  };

  const link = async (userId) => {
    try {
      setSaving(true);
      await maintenanceApi.linkTechnicianUser(id, userId);
      toast.success(userId ? 'Usuario vinculado' : 'Usuario desvinculado');
      setSelectedUserId('');
      await load();
      maintenanceApi.getLinkableUsers().then((u) => setLinkableUsers(Array.isArray(u) ? u : [])).catch(() => {});
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo actualizar el vínculo'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MtCard elevated>
        <p style={{ padding: 'var(--mt-space-3xl)', margin: 0, textAlign: 'center', color: 'var(--mt-text-secondary)' }}>Cargando técnico...</p>
      </MtCard>
    );
  }

  if (error || !data) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
          <p style={{ margin: 0, color: 'var(--mt-danger)', fontWeight: 700 }}>{error || 'Sin datos'}</p>
          <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/personnel')}>Volver a Personal</MtButton>
        </div>
      </MtCard>
    );
  }

  const { technician: t, user, stats, recentOrders, plans } = data;
  // Usuarios que se pueden elegir: sin técnico, o ya vinculados a este
  const availableUsers = (linkableUsers || []).filter((u) => !u.technicianId || u.technicianId === t.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-xl)' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/maintenance/app/personnel')} aria-label="Volver" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft size={20} style={{ color: 'var(--mt-text-secondary)' }} />
        </button>
        <div style={{ width: '56px', height: '56px', borderRadius: 'var(--mt-radius-md)', background: 'linear-gradient(135deg, var(--mt-accent), var(--mt-accent-strong))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={28} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>{t.name}</h1>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            <MtBadge size="sm" variant="neutral">{t.code}</MtBadge>
            <MtBadge size="sm" variant="accent">{specialtyLabel(t.specialty)}</MtBadge>
            <MtBadge size="sm" variant={t.status === 'Activo' ? 'success' : 'neutral'}>{t.status}</MtBadge>
          </div>
        </div>
        {canEdit && !editing && <MtButton variant="secondary" onClick={startEdit}>Editar ficha</MtButton>}
      </div>

      {/* Indicadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mt-space-lg)' }}>
        <Stat icon={Wrench} label="OT abiertas" value={stats.openOrders} color="var(--mt-warning)" />
        <Stat icon={CheckCircle2} label="Terminadas (30d)" value={stats.completed30d} color="var(--mt-success)" />
        <Stat icon={Clock} label="Horas (30d)" value={`${stats.hours30d}h`} color="var(--mt-info)" />
        <Stat icon={CalendarCheck} label="A tiempo" value={stats.onTimeRate == null ? '—' : `${stats.onTimeRate}%`} color="var(--mt-accent)" />
        <Stat icon={Award} label="Terminadas (total)" value={stats.completedTotal} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 'var(--mt-space-xl)', alignItems: 'start' }}>
        {/* Ficha */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)' }}>
            <h3 style={{ margin: '0 0 var(--mt-space-md)', fontSize: '15px' }}>Ficha del técnico</h3>
            {editing ? (
              <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--mt-space-md)' }}>
                  <label><span style={labelStyle}>Nombre *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} /></label>
                  <label><span style={labelStyle}>Código</span><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={inputStyle} /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
                  <label><span style={labelStyle}>Correo</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} /></label>
                  <label><span style={labelStyle}>Teléfono</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mt-space-md)' }}>
                  <label>
                    <span style={labelStyle}>Especialidad</span>
                    <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} style={inputStyle}>
                      {SPECIALTIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      {!SPECIALTIES.some((s) => s.value === form.specialty) && <option value={form.specialty}>{form.specialty}</option>}
                    </select>
                  </label>
                  <label>
                    <span style={labelStyle}>Estado</span>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </label>
                </div>
                <div>
                  <span style={labelStyle}>Certificaciones</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {form.certifications.map((c, i) => (
                      <MtBadge key={`${c}-${i}`} size="sm" variant="accent">
                        {c}{' '}
                        <button type="button" aria-label={`Quitar ${c}`} onClick={() => setForm({ ...form, certifications: form.certifications.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}>
                          <X size={11} />
                        </button>
                      </MtBadge>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input value={newCert} onChange={(e) => setNewCert(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }} placeholder="Agregar certificación" style={inputStyle} />
                    <MtButton type="button" size="sm" variant="secondary" onClick={addCert}>Agregar</MtButton>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <MtButton type="button" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>Cancelar</MtButton>
                  <MtButton type="submit" disabled={saving}><Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}</MtButton>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} /> {t.email || <em style={{ color: 'var(--mt-text-tertiary)' }}>Sin correo</em>}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} /> {t.phone || <em style={{ color: 'var(--mt-text-tertiary)' }}>Sin teléfono</em>}</div>
                <div>
                  <span style={labelStyle}>Certificaciones</span>
                  {t.certifications.length === 0
                    ? <em style={{ color: 'var(--mt-text-tertiary)', fontSize: '13px' }}>Sin certificaciones registradas</em>
                    : <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{t.certifications.map((c, i) => <MtBadge key={`${c}-${i}`} size="sm" variant="accent">{c}</MtBadge>)}</div>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Alta: {fmtDate(t.createdAt)}</div>
              </div>
            )}
          </div>
        </MtCard>

        {/* Usuario vinculado */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}><Link2 size={16} /> Usuario del sistema</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
              Con el usuario vinculado, el técnico ve sus órdenes en su tablero y puede iniciarlas y terminarlas. El vínculo es el mismo que usa LubriPlan.
            </p>
            {user ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: 'var(--mt-space-md)', border: '1px solid var(--mt-border)', borderRadius: 'var(--mt-radius-md)' }}>
                <div>
                  <strong>{user.name}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>{user.email} · {user.role}{user.active ? '' : ' · inactivo'}</div>
                </div>
                {isAdmin && (
                  <MtButton size="sm" variant="secondary" disabled={saving} onClick={() => window.confirm(`¿Desvincular a ${user.name} de este técnico?`) && link(null)}>
                    <Unlink size={14} /> Desvincular
                  </MtButton>
                )}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--mt-warning)' }}>Este técnico no tiene usuario vinculado.</p>
            )}
            {isAdmin && !user && (
              linkableUsers === null ? (
                <span style={{ fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Cargando usuarios...</span>
              ) : availableUsers.length === 0 ? (
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>
                  No hay usuarios con rol Técnico disponibles en esta planta. Crea el usuario (rol TECHNICIAN) y asígnale la planta para poder vincularlo.
                </p>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={inputStyle} aria-label="Usuario a vincular">
                    <option value="">— Selecciona un usuario —</option>
                    {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
                  </select>
                  <MtButton disabled={!selectedUserId || saving} onClick={() => link(Number(selectedUserId))}><Link2 size={14} /> Vincular</MtButton>
                </div>
              )
            )}
            {!isAdmin && !user && <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>Solo un administrador puede vincular usuarios.</p>}
          </div>
        </MtCard>

        {/* Órdenes recientes */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
            <h3 style={{ margin: '0 0 var(--mt-space-sm)', fontSize: '15px' }}>Órdenes recientes</h3>
            {recentOrders.length === 0 && <em style={{ fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>Sin órdenes asignadas.</em>}
            {recentOrders.map((o) => (
              <Link key={o.id} to={`/maintenance/app/work-orders/${o.id}`} style={{ textDecoration: 'none', color: 'inherit', borderLeft: '3px solid var(--mt-accent)', paddingLeft: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{woNumber(o.number)} · {o.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                  {TYPE_LABELS[o.type] || o.type} · {STATE_LABELS[o.status] || o.status} · {o.asset ? o.asset.code : 'Sin activo'} · {fmtDate(o.finishedAt || o.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </MtCard>

        {/* Planes */}
        <MtCard elevated>
          <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
            <h3 style={{ margin: '0 0 var(--mt-space-sm)', fontSize: '15px' }}>Planes preventivos</h3>
            {plans.length === 0 && <em style={{ fontSize: '13px', color: 'var(--mt-text-tertiary)' }}>No participa en ningún plan.</em>}
            {plans.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px' }}>
                <span><strong>{p.code}</strong> · {p.title}</span>
                <span style={{ color: 'var(--mt-text-secondary)', whiteSpace: 'nowrap' }}>{p.active ? `Próx. ${fmtDate(p.nextDueAt)}` : 'Pausado'}</span>
              </div>
            ))}
          </div>
        </MtCard>
      </div>
    </div>
  );
}
