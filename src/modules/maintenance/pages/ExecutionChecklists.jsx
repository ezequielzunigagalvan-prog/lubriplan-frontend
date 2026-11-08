import { MtCard, MtBadge, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function ExecutionChecklists() {
  const checklists = [
    { id: 1, title: 'Checklist Bomba A', items: 8, completed: 5, status: 'in_progress' },
    { id: 2, title: 'Checklist Compresor', items: 12, completed: 12, status: 'completed' },
    { id: 3, title: 'Checklist Motores', items: 6, completed: 0, status: 'pending' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px', color: 'var(--mt-text-primary)' }}>
        Checklists de Ejecución
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {checklists.map((list) => (
          <MtCard key={list.id} interactive elevated>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{list.title}</div>
                <MtBadge variant={list.status === 'completed' ? 'success' : list.status === 'in_progress' ? 'warning' : 'neutral'} size="sm" dot>
                  {list.status === 'completed' ? 'Completo' : list.status === 'in_progress' ? 'Ejecución' : 'Pendiente'}
                </MtBadge>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>
                Progreso: {list.completed}/{list.items} items
              </div>
              <div style={{
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: 'var(--mt-accent)',
                  width: `${(list.completed / list.items) * 100}%`,
                  transition: 'width 300ms ease',
                }} />
              </div>
            </div>
          </MtCard>
        ))}
      </div>
    </div>
  );
}
