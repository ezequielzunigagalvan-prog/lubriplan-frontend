import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MtButton, MtCard, MtEmpty, MtSkeleton, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function PreventivePlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setPlans([
        { id: 1, name: 'Mantenimiento preventivo Bomba A', frequency: 'Mensual', nextDate: '2025-12-15', status: 'active' },
        { id: 2, name: 'Inspección Compresor B', frequency: 'Quincenal', nextDate: '2025-12-08', status: 'active' },
        { id: 3, name: 'Lubricación Motores', frequency: 'Semanal', nextDate: '2025-12-02', status: 'active' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <MtSkeleton type="card" count={3} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mt-text-primary)' }}>Planes Preventivos</h1>
        <MtButton size="md"><MtIcon name="plus" size="md" /> Nuevo plan</MtButton>
      </div>

      {plans.length === 0 ? (
        <MtEmpty icon="📅" title="Sin planes" description="Crea tu primer plan preventivo" action={() => {}} actionLabel="Crear" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {plans.map((plan) => (
            <MtCard key={plan.id} interactive elevated onClick={() => navigate(`/maintenance/app/plans/${plan.id}`)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ fontWeight: 700 }}>{plan.name}</div>
                  <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(52, 211, 153, 0.15)', color: 'var(--mt-success)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>Activo</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                  <div>Frecuencia: {plan.frequency}</div>
                  <div>Próxima: {plan.nextDate}</div>
                </div>
              </div>
            </MtCard>
          ))}
        </div>
      )}
    </div>
  );
}
