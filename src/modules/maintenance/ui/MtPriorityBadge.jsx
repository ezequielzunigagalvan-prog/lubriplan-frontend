import './tokens.css';
import MtBadge from './MtBadge';

const PRIORITY_MAP = {
  CRITICAL: { variant: 'danger', label: 'Crítica', shortLabel: 'CRIT' },
  HIGH: { variant: 'warning', label: 'Alta', shortLabel: 'ALT' },
  MEDIUM: { variant: 'info', label: 'Media', shortLabel: 'MED' },
  LOW: { variant: 'neutral', label: 'Baja', shortLabel: 'BJ' },
};

export default function MtPriorityBadge({
  priority = 'MEDIUM',
  short = false,
  dot = true,
  ...props
}) {
  const config = PRIORITY_MAP[priority] || PRIORITY_MAP.MEDIUM;

  return (
    <MtBadge variant={config.variant} dot={dot} {...props}>
      {short ? config.shortLabel : config.label}
    </MtBadge>
  );
}
