import type { AppRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#080B18] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <div className="rounded-xl border border-white/10 bg-[#10162A]/70 p-4 text-xs leading-relaxed text-[#94A3B8]">
          <strong className="text-[#F8FAFC]">Disclaimer:</strong> TruthLens AI provides
          AI-assisted research and preliminary assessments. Its findings may be incomplete or
          incorrect. Always consult original sources and qualified professionals before making
          important decisions.
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-[#94A3B8]">
          <div>
            <span className="font-display font-semibold text-[#F8FAFC]">TRUTHLENS AI</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Think Critically. Share Responsibly.</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="hover:text-[#F8FAFC] transition-colors"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('analyze')}
              className="hover:text-[#F8FAFC] transition-colors"
            >
              Analyze
            </button>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="hover:text-[#F8FAFC] transition-colors"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="hover:text-[#F8FAFC] transition-colors"
            >
              About
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
