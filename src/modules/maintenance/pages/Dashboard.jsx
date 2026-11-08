import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceApi } from '../services/maintenanceApi';
import { MtButton, MtCard, MtStat, MtEmpty, MtSkeleton, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await maintenanceApi.getDashboardSummary();
        setSummary(res?.data || null);
      } catch (err) {
        setError(err?.message || 'Error cargando dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <MtSkeleton type="stat" count={4} style={{ marginBottom: '32px' }} />;

  if (error) {
    return (
      <MtEmpty
        icon="⚠️"
        title="Error cargando dashboard"
        description={error}
        action={() => window.location.reload()}
        actionLabel="Reintentar"
      />
    );
  }

  const opened = summary?.openedCount || 0;
  const overdue = summary?.overdueCount || 0;
  const waiting = summary?.waitingCount || 0;
  const closed30 = summary?.closed30DaysCount || 0;
  const topAssets = summary?.topAssets || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MtStat label="Órdenes Abiertas" value={opened} color="var(--mt-accent)" icon={<MtIcon name="clipboard" size="lg" />} />
        <MtStat label="Vencidas" value={overdue} color="var(--mt-danger)" icon={<MtIcon name="alertCircle" size="lg" />} />
        <MtStat label="En Espera" value={waiting} color="var(--mt-warning)" icon={<MtIcon name="clock" size="lg" />} />
        <MtStat label="Cerradas 30d" value={closed30} color="var(--mt-success)" icon={<MtIcon name="checkCircle" size="lg" />} />
      </div>

      {/* Top Assets */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px', color: 'var(--mt-text-primary)' }}>
          Activos con más correctivos
        </h2>
        {topAssets.length === 0 ? (
          <MtEmpty
            icon="📦"
            title="Sin activos"
            description="No hay activos con correctivos registrados"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topAssets.map((asset, i) => (
              <MtCard key={i} interactive onClick={() => navigate(`/maintenance/app/assets/${asset.id}`)} elevated>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--mt-accent)',
                    fontWeight: 900,
                    fontSize: '14px',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>{asset.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                      {asset.correctiveCount || 0} correctivos
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--mt-accent)' }}>
                    {asset.correctiveCount || 0}
                  </div>
                </div>
              </MtCard>
            ))}
          </div>
        )}
      </div>

      {/* Report Failure CTA */}
      <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--mt-bg-surface)', borderRadius: '12px', border: '1px solid var(--mt-border)' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>¿Encontraste un problema?</div>
        <MtButton onClick={() => navigate('/maintenance/app/report-failure')} size="lg">
          <MtIcon name="alertCircle" size="md" />
          Reportar falla
        </MtButton>
      </div>
    </div>
  );
}
