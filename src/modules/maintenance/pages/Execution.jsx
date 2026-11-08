import { useState } from 'react';
import { MtButton, MtCard, MtIcon } from '../ui';
import '../ui/tokens.css';

export default function Execution() {
  const [current, setCurrent] = useState(0);
  const sections = [
    { title: 'Diagnóstico', desc: '¿Cuál es el problema?', icon: 'alertCircle' },
    { title: 'Causa', desc: 'Identifica la raíz', icon: 'wrench' },
    { title: 'Trabajo realizado', desc: 'Detalla qué hiciste', icon: 'checkCircle' },
    { title: 'Fotos', desc: 'Captura evidencia', icon: 'camera' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--mt-bg-base)' }}>
      {/* Header - Fixed */}
      <div style={{ background: 'var(--mt-bg-surface)', padding: '16px', borderBottom: '1px solid var(--mt-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mt-text-secondary)', textTransform: 'uppercase' }}>OT-000123</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mt-text-primary)' }}>Bomba Principal</div>
          </div>
          <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(251, 191, 36, 0.15)', color: 'var(--mt-warning)', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
            EN EJECUCIÓN
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{ background: 'var(--mt-bg-surface)', padding: '12px 16px', borderBottom: '1px solid var(--mt-border)' }}>
        <div style={{ display: 'flex', gap: '6px', maxWidth: 1200, margin: '0 auto' }}>
          {sections.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '4px', background: i <= current ? 'var(--mt-accent)' : 'var(--mt-border)', borderRadius: '2px', transition: 'all 300ms ease' }} />
          ))}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div style={{ flex: 1, padding: '24px 16px', overflowY: 'auto', maxWidth: 600, margin: '0 auto', width: '100%' }}>
        {/* Sections */}
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '24px', opacity: i === current ? 1 : 0.3, transition: 'opacity 300ms ease', pointerEvents: i === current ? 'auto' : 'none' }}>
            {i === current && (
              <MtCard elevated>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mt-accent)', fontSize: '20px' }}>
                    <MtIcon name={section.icon} size="lg" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--mt-text-primary)' }}>{section.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)' }}>{section.desc}</div>
                  </div>
                </div>
                <textarea
                  placeholder="Escribe aquí..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--mt-bg-base)',
                    border: '1px solid var(--mt-border)',
                    borderRadius: '8px',
                    color: 'var(--mt-text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    minHeight: '120px',
                    resize: 'vertical',
                  }}
                />
              </MtCard>
            )}
          </div>
        ))}
      </div>

      {/* Footer - Fixed */}
      <div style={{ background: 'var(--mt-bg-surface)', padding: '16px', borderTop: '1px solid var(--mt-border)', position: 'sticky', bottom: 0 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: '12px' }}>
          <MtButton
            variant="secondary"
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            size="lg"
            style={{ flex: 1 }}
          >
            ← Anterior
          </MtButton>
          <MtButton
            onClick={() => setCurrent(Math.min(sections.length - 1, current + 1))}
            disabled={current === sections.length - 1}
            size="lg"
            style={{ flex: 1 }}
          >
            {current === sections.length - 1 ? '✓ Enviar' : 'Siguiente →'}
          </MtButton>
        </div>
      </div>
    </div>
  );
}
