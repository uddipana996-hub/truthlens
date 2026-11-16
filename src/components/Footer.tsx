import type { AppRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative z-10 border-t border-slate-200/85 bg-white/90 backdrop-blur-md py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <div className="lab-panel rounded-2xl p-4 sm:p-5 text-xs leading-relaxed text-slate-600">
          <strong className="text-slate-900">Disclaimer:</strong> TruthLens provides automated
          research and preliminary assessments. Its findings may be incomplete or incorrect. Always
          consult original sources and qualified professionals before making important decisions.
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-display font-semibold tracking-tight text-slate-900">
              Truth<span className="text-[#2563EB]">Lens</span>
            </span>
            <span className="mx-1 text-slate-300" aria-hidden="true">
              ·
            </span>
            <span>Think Critically. Share Responsibly.</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('analyze')}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap"
            >
              Analyze
            </button>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="hover:text-[#2563EB] transition-colors whitespace-nowrap"
            >
              About
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
