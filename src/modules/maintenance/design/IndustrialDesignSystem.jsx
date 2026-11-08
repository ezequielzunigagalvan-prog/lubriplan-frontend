// Industrial Design System for LubriPlan Maintenance
// Premium, clean, and scalable across all modules

export const IndustrialColors = {
  // Primary metals
  steel: '#2C3E50',
  aluminum: '#34495E',
  titanium: '#546E7A',

  // Accents
  electric: '#00BCD4',
  warning: '#FF9800',
  danger: '#E74C3C',
  success: '#27AE60',

  // Neutrals
  dark: '#1A1A1A',
  light: '#F5F7FA',
  border: '#D4D4D8',
  text: '#2D3748',
  textLight: '#718096',
};

export const IndustrialTypography = {
  heading1: 'font-bold text-3xl tracking-tight',
  heading2: 'font-bold text-2xl tracking-tight',
  heading3: 'font-bold text-xl tracking-tight',
  body: 'font-normal text-base',
  small: 'font-normal text-sm',
  caption: 'font-normal text-xs uppercase tracking-wide',
};

export const IndustrialSpacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

export function IndustrialCard({ children, className = '', elevated = false }) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200
        ${elevated ? 'shadow-lg hover:shadow-xl' : 'shadow-sm'}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function IndustrialButton({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  disabled = false,
  onClick,
  className = '',
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:shadow-lg',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        font-semibold rounded-lg
        transition-all duration-200
        flex items-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

export function IndustrialInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error = '',
  icon = null,
  className = '',
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full px-4 py-2.5 rounded-lg
            border-2 border-gray-200
            focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500
            text-gray-900 placeholder-gray-400
            transition-colors duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export function IndustrialSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  error = '',
  icon = null,
  className = '',
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>}
        <select
          value={value}
          onChange={onChange}
          className={`
            w-full px-4 py-2.5 rounded-lg
            border-2 border-gray-200
            focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500
            text-gray-900
            transition-colors duration-200
            appearance-none
            bg-white
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
        >
          <option value="">Selecciona una opción</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export function IndustrialTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error = '',
  rows = 4,
  className = '',
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full px-4 py-2.5 rounded-lg
          border-2 border-gray-200
          focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500
          text-gray-900 placeholder-gray-400
          transition-colors duration-200
          resize-none
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export function IndustrialBadge({ label, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-orange-100 text-orange-800',
    info: 'bg-cyan-100 text-cyan-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-block rounded-full font-semibold
        ${variants[variant]}
        ${sizes[size]}
      `}
    >
      {label}
    </span>
  );
}

export function IndustrialTable({ columns, rows, actions = null }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {typeof col.render === 'function' ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IndustrialModal({ isOpen, title, onClose, children, footer = null }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        <div className="relative w-full max-w-2xl transform bg-white rounded-xl shadow-2xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">{children}</div>

          {/* Footer */}
          {footer && <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function IndustrialStat({ label, value, unit = '', icon = null, trend = null }) {
  return (
    <IndustrialCard elevated className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {unit && <p className="text-gray-600 font-medium">{unit}</p>}
          </div>
          {trend && (
            <p className={`text-xs font-semibold mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs. mes anterior
            </p>
          )}
        </div>
        {icon && <div className="text-3xl opacity-20">{icon}</div>}
      </div>
    </IndustrialCard>
  );
}
