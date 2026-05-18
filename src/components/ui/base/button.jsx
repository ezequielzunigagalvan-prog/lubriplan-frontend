export function Button({ children, variant = "primary", className = "", style, ...props }) {
  const variants = {
    primary: "lp-btn-primary",
    ghost:   "lp-btn-ghost",
    danger:  "lp-btn-danger",
  };

  return (
    <button
      className={`lp-btn ${variants[variant] ?? variants.primary} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
