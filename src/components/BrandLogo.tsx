interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = 'w-8 h-8' }: BrandLogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#8B5CF6]/40 via-[#3B82F6]/30 to-[#22D3EE]/30 blur-md"
      />
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tlShieldGrad" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="55%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <path
          d="M20 3.5L7 9V18.8C7 27.1 12.55 34.45 20 36.5C27.45 34.45 33 27.1 33 18.8V9L20 3.5Z"
          fill="#10162A"
          stroke="url(#tlShieldGrad)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="18" r="5.5" stroke="#22D3EE" strokeWidth="2" />
        <path
          d="M23.1 22.1L27 26"
          stroke="#22D3EE"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M16.8 18L18.3 19.5L21.4 16.4"
          stroke="#F8FAFC"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
