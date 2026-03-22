// src/components/ui/lpIcons.jsx
import React from "react";

export function Icon({
  name,
  size = "md",        // sm | md | lg | xl
  weight = "regular", // regular | bold
  style,
  title,
}) {
  const sizeMap = { sm: 16, md: 18, lg: 22, xl: 26 };
  const px = sizeMap[size] ?? 18;

  const strokeMap = { regular: 2.2, bold: 2.8 };
  const sw = strokeMap[weight] ?? 2.2;

  const common = {
    width: px,
    height: px,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style,
    "aria-hidden": title ? undefined : true,
  };

  const props = title ? { ...common, role: "img" } : common;
  const T = () => (title ? <title>{title}</title> : null);

  switch (name) {
    // ===== KPI / STATUS =====
    case "clock":
      return (
        <svg {...props}>
          <T />
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );

    case "check":
      return (
        <svg {...props}>
          <T />
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );

    case "warn":
      return (
        <svg {...props}>
          <T />
          <path d="M10.3 3.5 1.8 18.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.8L13.7 3.5a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );

    case "alert":
      return (
        <svg {...props}>
          <T />
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6" />
          <path d="M12 17h.01" />
        </svg>
      );

    case "info":
      return (
        <svg {...props}>
          <T />
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <path d="M12 7h.01" />
        </svg>
      );

    case "checkCircle":
      return (
        <svg {...props}>
          <T />
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.2 11 14.6 16 9.6" />
        </svg>
      );

    case "xCircle":
      return (
        <svg {...props}>
          <T />
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9 9 15" />
          <path d="M9 9l6 6" />
        </svg>
      );

    case "bolt":
      return (
        <svg {...props}>
          <T />
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      );

    // ===== NOTIFICATIONS =====
    case "bell":
      return (
        <svg {...props}>
          <T />
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
        </svg>
      );

    // ===== ACTIONS =====
    case "refresh":
    case "reset": // ✅ alias por compatibilidad con tu dashboard
      return (
        <svg {...props}>
          <T />
          <path d="M21 12a9 9 0 0 1-15.5 6.4" />
          <path d="M3 12a9 9 0 0 1 15.5-6.4" />
          <path d="M3 3v6h6" />
          <path d="M21 21v-6h-6" />
        </svg>
      );

    case "plus":
      return (
        <svg {...props}>
          <T />
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "close":
      return (
        <svg {...props}>
          <T />
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      );

          case "menu":
      return (
        <svg {...props}>
          <T />
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );

    case "search":
      return (
        <svg {...props}>
          <T />
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );

    case "edit":
      return (
        <svg {...props}>
          <T />
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      );

    case "trash":
      return (
        <svg {...props}>
          <T />
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      );

      case "camera":
      return (
        <svg {...props}>
          <T />
          <path d="M4 8a2 2 0 0 1 2-2h2.2l1.1-1.6A2 2 0 0 1 11 3h2a2 2 0 0 1 1.7.9L15.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      );

    case "filter":
      return (
        <svg {...props}>
          <T />
          <path d="M4 5h16" />
          <path d="M7 12h10" />
          <path d="M10 19h4" />
        </svg>
      );

      case "id":
  return (
    <svg {...props}>
      <T />
      <path d="M7 4h10" />
      <path d="M7 8h10" />
      <path d="M7 12h6" />
      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    </svg>
  );

      case "tag":
      return (
        <svg {...props}>
          <T />
          {/* tag/etiqueta */}
          <path d="M20 12l-8 8-10-10V4h6l12 12z" />
          <path d="M7.5 7.5h.01" />
        </svg>
      );

    case "download":
      return (
        <svg {...props}>
          <T />
          <path d="M12 3v10" />
          <path d="M8 11l4 4 4-4" />
          <path d="M4 20h16" />
        </svg>
      );

    case "upload":
      return (
        <svg {...props}>
          <T />
          <path d="M12 21V11" />
          <path d="M8 13l4-4 4 4" />
          <path d="M4 4h16" />
        </svg>
      );

    case "eye":
      return (
        <svg {...props}>
          <T />
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

          case "lock":
      return (
        <svg {...props}>
          <T />
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );

    case "link":
      return (
        <svg {...props}>
          <T />
          <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
          <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
        </svg>
      );

    case "chevronDown":
      return (
        <svg {...props}>
          <T />
          <path d="M6 9l6 6 6-6" />
        </svg>
      );



      case "quantity":
  return (
    <svg {...props}>
      <T />
      <path d="M12 3C12 3 6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11z" />
      <line x1="19" y1="6" x2="22" y2="6" />
      <line x1="19" y1="10" x2="22" y2="10" />
      <line x1="19" y1="14" x2="22" y2="14" />
    </svg>
  );

    case "chevronLeft":
      return (
        <svg {...props}>
          <T />
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );

    case "chevronRight":
      return (
        <svg {...props}>
          <T />
          <path d="M9 18l6-6-6-6" />
        </svg>
      );

    case "logout":
      return (
        <svg {...props}>
          <T />
          <path d="M10 17l-1 0a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h1" />
          <path d="M15 12H9" />
          <path d="M13 10l2 2-2 2" />
          <path d="M19 4v16" />
        </svg>
      );

    // ===== DOMAIN =====
    case "tool":
      return (
        <svg {...props}>
          <T />
          <path d="M14.7 6.3a4 4 0 0 0-5.6 5.6l-6 6a2 2 0 0 0 2.8 2.8l6-6a4 4 0 0 0 5.6-5.6l-3 3-2.8-2.8 3-3z" />
        </svg>
      );

    case "wrench":
      return (
        <svg {...props}>
          <T />
          <path d="M21 7.5a5 5 0 0 1-7 4.6L7 19a2 2 0 0 1-2.8-2.8l6.9-7A5 5 0 0 1 16.5 3l-2.3 2.3 2.8 2.8L21 7.5z" />
        </svg>
      );

    case "drop":
      return (
        <svg {...props}>
          <T />
          <path d="M12 2s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z" />
        </svg>
      );

    case "route":
      return (
        <svg {...props}>
          <T />
          <path d="M6 6h10a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h10" />
        </svg>
      );

    case "history":
      return (
        <svg {...props}>
          <T />
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 3v7h7" />
          <path d="M12 7v6l4 2" />
        </svg>
      );

    case "doc":
      return (
        <svg {...props}>
          <T />
          <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
        </svg>
      );

    case "list":
      return (
        <svg {...props}>
          <T />
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      );

    case "grid":
      return (
        <svg {...props}>
          <T />
          <path d="M4 4h7v7H4z" />
          <path d="M13 4h7v7h-7z" />
          <path d="M4 13h7v7H4z" />
          <path d="M13 13h7v7h-7z" />
        </svg>
      );

   case "equipment":
  return (
    <svg {...props}>
      <T />
      
      {/* aro exterior */}
      <circle cx="12" cy="12" r="9" />
      
      {/* aro interior */}
      <circle cx="12" cy="12" r="4.5" />

      {/* bolas del rodamiento */}
      <circle cx="12" cy="4.5" r="1" />
      <circle cx="19.5" cy="12" r="1" />
      <circle cx="12" cy="19.5" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="16.5" cy="7.5" r="1" />
      <circle cx="7.5" cy="16.5" r="1" />
    </svg>
  );

    case "settings":
      return (
        <svg {...props}>
          <T />
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
          <path d="M19.4 15a7.8 7.8 0 0 0 .1-2l2-1.2-2-3.4-2.3.7a7.5 7.5 0 0 0-1.7-1L15 4.6h-6L8.5 8a7.5 7.5 0 0 0-1.7 1L4.5 8.4l-2 3.4L4.5 13a7.8 7.8 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.7a7.5 7.5 0 0 0 1.7 1L9 19.4h6l.5-3.4a7.5 7.5 0 0 0 1.7-1l2.3.7 2-3.4-2.1-1.2z" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...props}>
          <T />
          <path d="M8 3v3" />
          <path d="M16 3v3" />
          <path d="M4 7h16" />
          <path d="M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
        </svg>
      );

    case "user":
      return (
        <svg {...props}>
          <T />
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );

    case "users":
      return (
        <svg {...props}>
          <T />
          <path d="M17 21a7 7 0 0 0-14 0" />
          <circle cx="10" cy="8" r="3.5" />
          <path d="M21 21a6 6 0 0 0-8-5" />
          <path d="M17.5 4.5a3 3 0 0 1 0 6" />
        </svg>
      );

    case "userCheck":
      return (
        <svg {...props}>
          <T />
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="8" r="4" />
          <path d="M16.5 13.5l1.5 1.5 3-3" />
        </svg>
      );

    case "userX":
      return (
        <svg {...props}>
          <T />
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="8" r="4" />
          <path d="M17 14l4 4" />
          <path d="M21 14l-4 4" />
        </svg>
      );

    case "trendUp":
      return (
        <svg {...props}>
          <T />
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );

    case "trendDown":
      return (
        <svg {...props}>
          <T />
          <path d="M3 7l6 6 4-4 8 8" />
          <path d="M14 17h7v-7" />
        </svg>
      );

    case "spark":
      return (
        <svg {...props}>
          <T />
          <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
          <path d="M19 12l.8 2.2L22 15l-2.2.8L19 18l-.8-2.2L16 15l2.2-.8L19 12z" />
        </svg>
      );

    case "shield":
      return (
        <svg {...props}>
          <T />
          <path d="M12 2l8 4v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4z" />
        </svg>
      );

    case "building": // ✅ multiplanta
      return (
        <svg {...props}>
          <T />
          <path d="M4 22V4a2 2 0 0 1 2-2h7v20" />
          <path d="M13 10h7a2 2 0 0 1 2 2v10H13" />
          <path d="M7 6h2" />
          <path d="M7 10h2" />
          <path d="M7 14h2" />
          <path d="M7 18h2" />
          <path d="M16 14h2" />
          <path d="M16 18h2" />
        </svg>
      );

    // ===== FALLBACK =====
    default:
      return (
        <svg {...props}>
          <T />
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      );
  }
}