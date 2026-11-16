interface MiniModelProps {
  className?: string;
}

/**
 * Miniature rotating CSS-3D glassmorphic verification cube.
 */
export function Mini3DCube({ className = '' }: MiniModelProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex h-11 w-11 items-center justify-center shrink-0 ${className}`}
      style={{ perspective: '240px' }}
    >
      <div
        className="animate-lab-cube relative h-6 w-6"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <span
          className="absolute inset-0 rounded-[4px] border border-blue-400/55 bg-gradient-to-br from-white/90 to-blue-100/60 shadow-[inset_0_0_8px_rgba(37,99,235,0.16)]"
          style={{ transform: 'translateZ(12px)' }}
        />
        <span
          className="absolute inset-0 rounded-[4px] border border-cyan-400/50 bg-gradient-to-br from-white/80 to-cyan-100/50"
          style={{ transform: 'rotateY(180deg) translateZ(12px)' }}
        />
        <span
          className="absolute inset-0 rounded-[4px] border border-blue-400/45 bg-blue-50/70"
          style={{ transform: 'rotateY(90deg) translateZ(12px)' }}
        />
        <span
          className="absolute inset-0 rounded-[4px] border border-blue-400/45 bg-sky-50/70"
          style={{ transform: 'rotateY(-90deg) translateZ(12px)' }}
        />
        <span
          className="absolute inset-0 rounded-[4px] border border-cyan-400/50 bg-white/85"
          style={{ transform: 'rotateX(90deg) translateZ(12px)' }}
        />
        <span
          className="absolute inset-0 rounded-[4px] border border-blue-300/45 bg-blue-100/55"
          style={{ transform: 'rotateX(-90deg) translateZ(12px)' }}
        />
      </div>
    </div>
  );
}

/**
 * Miniature rotating digital globe with 3D meridian sweep.
 */
export function MiniDigitalGlobe({ className = '' }: MiniModelProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex h-11 w-11 items-center justify-center shrink-0 ${className}`}
    >
      <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-blue-500/15 to-cyan-400/20 blur-[4px]" />
      <svg viewBox="0 0 44 44" fill="none" className="relative h-10 w-10">
        <defs>
          <radialGradient id="miniGlobeBg" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#EFF6FF" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </radialGradient>
        </defs>
        <circle
          cx="22"
          cy="22"
          r="15"
          fill="url(#miniGlobeBg)"
          stroke="#3B82F6"
          strokeOpacity="0.55"
          strokeWidth="1.25"
        />
        <ellipse cx="22" cy="22" rx="15" ry="5.5" stroke="#0284C7" strokeOpacity="0.4" strokeWidth="1" />
        <ellipse
          cx="22"
          cy="22"
          rx="15"
          ry="10.5"
          stroke="#60A5FA"
          strokeOpacity="0.3"
          strokeWidth="0.9"
        />
        <ellipse
          cx="22"
          cy="22"
          rx="7.5"
          ry="15"
          stroke="#2563EB"
          strokeWidth="1.15"
          className="animate-lab-meridian"
          style={{ transformOrigin: '22px 22px' }}
        />
        <line x1="22" y1="7" x2="22" y2="37" stroke="#0EA5E9" strokeOpacity="0.45" strokeWidth="1" />
      </svg>
    </div>
  );
}

/**
 * Miniature 3D orbital satellite relay ring.
 */
export function MiniSatelliteOrbiter({ className = '' }: MiniModelProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex h-11 w-11 items-center justify-center shrink-0 ${className}`}
      style={{ perspective: '220px' }}
    >
      <div className="relative h-4 w-4 rounded-md border border-blue-300 bg-gradient-to-br from-white to-blue-100 shadow-xs flex items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-xs bg-[#2563EB]" />
      </div>
      <div
        className="animate-lab-orbit-3d absolute inset-0 rounded-full border border-blue-400/55"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-sm border border-cyan-300 bg-[#0EA5E9] shadow-[0_0_8px_rgba(14,165,233,0.7)]" />
      </div>
    </div>
  );
}

/**
 * Miniature articulated mechanical robotic arm / optical node.
 */
export function MiniRoboticArmNode({ className = '' }: MiniModelProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex h-11 w-11 items-center justify-center shrink-0 ${className}`}
    >
      <svg viewBox="0 0 44 44" fill="none" className="h-10 w-10">
        {/* Base Pedestal */}
        <rect x="11" y="34" width="22" height="4.5" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
        {/* Lower Arm */}
        <path d="M19 34 L15 22 L20 20 L24 34 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.1" />
        <circle cx="17.5" cy="21" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.3" />
        {/* Articulated Upper Head */}
        <g className="animate-lab-servo" style={{ transformOrigin: '17.5px 21px' }}>
          <path d="M17.5 19.5 L29 12.5 L31 16 L19 22.5 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.1" />
          <rect x="27" y="10" width="9" height="7.5" rx="2.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.25" />
          <circle cx="32.5" cy="13.75" r="2" fill="#0EA5E9" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Miniature animated electronic verification microchip.
 */
export function MiniMicrochipCore({ className = '' }: MiniModelProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex h-11 w-11 items-center justify-center shrink-0 ${className}`}
    >
      <svg viewBox="0 0 44 44" fill="none" className="h-10 w-10">
        <path
          d="M15 6 V11 M22 6 V11 M29 6 V11 M15 33 V38 M22 33 V38 M29 33 V38 M6 15 H11 M6 22 H11 M6 29 H11 M33 15 H38 M33 22 H38 M33 29 H38"
          stroke="#60A5FA"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <rect
          x="11"
          y="11"
          width="22"
          height="22"
          rx="5"
          fill="#FFFFFF"
          stroke="#3B82F6"
          strokeWidth="1.3"
        />
        <rect
          x="15.5"
          y="15.5"
          width="13"
          height="13"
          rx="2.5"
          fill="#EFF6FF"
          stroke="#0EA5E9"
          strokeWidth="1.1"
        />
        <path
          d="M18.5 22 L21 24.5 L25.5 19.5"
          stroke="#1D4ED8"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
