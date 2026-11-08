import { ICON_DEFINITIONS } from './iconDefinitions.jsx';

export default function MtIcon({ name, size = 'md' }) {
  const sizeMap = { sm: 16, md: 20, lg: 24 };
  const actualSize = sizeMap[size] || size;

  return ICON_DEFINITIONS[name] ? ICON_DEFINITIONS[name](actualSize) : null;
}
