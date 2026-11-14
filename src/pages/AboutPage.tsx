import { ArrowRight, Compass, Eye, Scale, Shield } from 'lucide-react';
import type { AppRoute } from '../components/Navbar';

interface AboutPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10">
      <div className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-sm font-medium text-[#22D3EE]">
          TRUTHLENS AI · Think Critically. Share Responsibly.
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
          Why Evidence-First Verification Matters
        </h1>
        <p className="text-base leading-relaxed text-[#94A3B8]">
          Misinformation spreads fastest when emotionally compelling claims travel faster than
          context. TruthLens AI is built to slow down the impulse to share by putting primary
          evidence, uncertainty, and source transparency front and center.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-2.5">
          <Compass className="h-5 w-5 text-[#8B5CF6]" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            The Viral Misinformation Problem
          </h2>
          <p className="text-sm leading-relaxed text-[#94A3B8]">
            Forwarded messages, cropped screenshots, and out-of-context headlines routinely blend
            real facts with distorted framing. Checking a single claim manually often requires
            cross-referencing multiple primary publications.
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-2.5">
          <Eye className="h-5 w-5 text-[#22D3EE]" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            Source Transparency Over Black Boxes
          </h2>
          <p className="text-sm leading-relaxed text-[#94A3B8]">
            An AI answer without verifiable links is just another unverified claim. TruthLens AI
            surfaces only URLs retrieved directly from live Google Search grounding and clearly
            flags when evidence is missing or conflicting.
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-2.5">
          <Scale className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            Human Judgment Remains Essential
          </h2>
          <p className="text-sm leading-relaxed text-[#94A3B8]">
            AI-assisted research can speed up investigation, but it cannot replace critical reading
            or qualified professional judgment—especially for health, financial, legal, and public
            safety topics.
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-2.5">
          <Shield className="h-5 w-5 text-[#8B5CF6]" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            Privacy &amp; Bring Your Own Key
          </h2>
          <p className="text-sm leading-relaxed text-[#94A3B8]">
            TruthLens AI does not require accounts, payments, or claim history databases. User-supplied
            Gemini API keys stay in volatile tab memory for the active session and are discarded on
            the server immediately after each request.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#10162A] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            Think Critically. Share Responsibly.
          </h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Ready to examine a viral post, article link, or screenshot?
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('analyze')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 whitespace-nowrap shrink-0"
        >
          <span>Analyze a Claim</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
