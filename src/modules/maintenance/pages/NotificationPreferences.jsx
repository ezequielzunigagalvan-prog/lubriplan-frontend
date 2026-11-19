import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { MtCard, MtButton } from '../ui';
import { maintenanceApi } from '../services/maintenanceApi';

const ALERTS = [
  { key: 'criticalFailureEnabled', label: 'Fallas críticas', desc: 'Al reportarse una correctiva con prioridad crítica (supervisores y admins).' },
  { key: 'overdueWoEnabled', label: 'Órdenes vencidas', desc: 'Órdenes abiertas que pasaron su fecha compromiso.' },
  { key: 'lowStockEnabled', label: 'Stock bajo', desc: 'Refacciones por debajo de su mínimo, sumando todos los almacenes.' },
  { key: 'technicianOverloadEnabled', label: 'Sobrecarga de técnicos', desc: 'Técnicos con más de 5 órdenes abiertas.' },
  { key: 'preventiveSoonEnabled', label: 'Preventivos próximos', desc: 'Planes que vencen en los próximos 7 días.' },
];

function Toggle({ checked, onChange, label, desc, disabled }) {
  return (
    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', borderRadius: 'var(--mt-radius-md)', border: '1px solid var(--mt-border)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} style={{ marginTop: '3px', width: '16px', height: '16px' }} />
      <span>
        <span style={{ display: 'block', fontWeight: 800, fontSize: '14px' }}>{label}</span>
        <span style={{ display: 'block', fontSize: '12px', color: 'var(--mt-text-secondary)' }}>{desc}</span>
      </span>
    </label>
  );
}

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true; // ignora respuestas de un montaje anterior
    maintenanceApi
      .getNotificationPreferences()
      .then((p) => active && (setPrefs(p), setError(null)))
      .catch((err) => active && setError(err?.data?.error || err?.message || 'No se pudieron cargar las preferencias'));
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const payload = Object.fromEntries([...ALERTS.map((a) => a.key), 'inAppEnabled'].map((k) => [k, Boolean(prefs[k])]));
      setPrefs(await maintenanceApi.updateNotificationPreferences(payload));
      toast.success('Preferencias guardadas');
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'No se pudieron guardar');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <MtCard elevated>
        <p style={{ padding: 'var(--mt-space-xl)', margin: 0, color: 'var(--mt-danger)', fontWeight: 700 }}>{error}</p>
      </MtCard>
    );
  }
  if (!prefs) return <p style={{ color: 'var(--mt-text-secondary)' }}>Cargando preferencias...</p>;

  const set = (key) => (value) => setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-xl)', maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)' }}>
        <button onClick={() => navigate('/maintenance/app/notifications')} aria-label="Volver" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ArrowLeft size={20} style={{ color: 'var(--mt-text-secondary)' }} />
        </button>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>Preferencias de notificaciones</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--mt-text-secondary)' }}>Elige qué avisos quieres recibir. Aplica solo a tu usuario.</p>
        </div>
      </div>

      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
          <h2 style={{ margin: '0 0 var(--mt-space-sm)', fontSize: '15px' }}>Canal</h2>
          <Toggle checked={prefs.inAppEnabled} onChange={set('inAppEnabled')} label="En la aplicación" desc="Campanita y centro de notificaciones. Si lo apagas, no recibirás ningún aviso." />
          <Toggle checked={false} onChange={() => {}} disabled label="Correo electrónico (próximamente)" desc="El envío por correo de Maintenance todavía no está disponible." />
        </div>
      </MtCard>

      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
          <h2 style={{ margin: '0 0 var(--mt-space-sm)', fontSize: '15px' }}>Tipos de aviso</h2>
          {ALERTS.map((a) => (
            <Toggle key={a.key} checked={Boolean(prefs[a.key])} onChange={set(a.key)} label={a.label} desc={a.desc} disabled={!prefs.inAppEnabled} />
          ))}
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--mt-text-tertiary)' }}>
            Las asignaciones de órdenes a tu nombre siempre se notifican.
          </p>
        </div>
      </MtCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <MtButton variant="secondary" onClick={() => navigate('/maintenance/app/notifications')}>Cancelar</MtButton>
        <MtButton onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar preferencias'}</MtButton>
      </div>
    </div>
  );
}
