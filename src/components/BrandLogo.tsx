interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = 'w-8 h-8' }: BrandLogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#2563EB]/20 via-[#0EA5E9]/15 to-[#06B6D4]/20 blur-sm"
      />
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tlWhiteShieldGrad" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="55%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="tlWhiteInnerFill" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EFF6FF" />
          </linearGradient>
        </defs>
        <path
          d="M20 3.5L7 9V18.8C7 27.1 12.55 34.45 20 36.5C27.45 34.45 33 27.1 33 18.8V9L20 3.5Z"
          fill="url(#tlWhiteInnerFill)"
          stroke="url(#tlWhiteShieldGrad)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M20 6.8L10.2 11V18.6C10.2 25 14.4 30.6 20 32.5C25.6 30.6 29.8 25 29.8 18.6V11L20 6.8Z"
          stroke="rgba(37, 99, 235, 0.22)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="18" r="5.3" stroke="#0284C7" strokeWidth="1.9" />
        <path
          d="M23 22L26.6 25.6"
          stroke="#1D4ED8"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M16.8 18L18.3 19.5L21.3 16.4"
          stroke="#1D4ED8"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
