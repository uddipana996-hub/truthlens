import { motion } from 'motion/react';
import { ArrowRight, Compass, Eye, Scale, Shield } from 'lucide-react';
import { Mini3DCube, MiniRoboticArmNode } from '../components/Mini3DModels';
import type { AppRoute } from '../components/Navbar';

interface AboutPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/85 pb-8">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#0284C7]">
            <span className="h-px w-5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" aria-hidden="true" />
            <span>TruthLens · Think Critically. Share Responsibly.</span>
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why Evidence-First Verification Matters
          </h1>
          <p className="text-base leading-relaxed text-slate-600">
            Misinformation spreads fastest when emotionally compelling claims travel faster than
            context. TruthLens is built to slow down the impulse to share by putting primary
            evidence, uncertainty, and source transparency front and center.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200/85 bg-white/90 p-2 shadow-2xs shrink-0">
          <Mini3DCube />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="lab-panel-interactive rounded-2xl p-6 space-y-3">
          <div className="lab-icon-badge h-9 w-9">
            <Compass className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            The Viral Misinformation Problem
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Forwarded messages, cropped screenshots, and out-of-context headlines routinely blend
            real facts with distorted framing. Checking a single claim manually often requires
            cross-referencing multiple primary publications.
          </p>
        </div>

        <div className="lab-panel-interactive rounded-2xl p-6 space-y-3">
          <div className="lab-icon-badge h-9 w-9">
            <Eye className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Source Transparency Over Black Boxes
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            An automated answer without verifiable links is just another unverified claim.
            TruthLens surfaces only URLs retrieved directly from live Google Search grounding and
            clearly flags when evidence is missing or conflicting.
          </p>
        </div>

        <div className="lab-panel-interactive rounded-2xl p-6 space-y-3">
          <div className="lab-icon-badge h-9 w-9">
            <Scale className="h-4 w-4 text-[#06B6D4]" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Human Judgment Remains Essential
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Automated research can speed up investigation, but it cannot replace critical reading or
            qualified professional judgment—especially for health, financial, legal, and public
            safety topics.
          </p>
        </div>

        <div className="lab-panel-interactive rounded-2xl p-6 space-y-3">
          <div className="lab-icon-badge h-9 w-9">
            <Shield className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Privacy &amp; Local-First Design
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            TruthLens does not require accounts, payments, API keys, or claim history databases.
            Interactive demo investigations run locally in your browser without storing personal
            submissions on external servers.
          </p>
        </div>
      </div>

      <div className="lab-panel relative rounded-2xl border-blue-200 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent"
        />
        <div className="flex items-center gap-3.5">
          <MiniRoboticArmNode className="hidden sm:flex" />
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Think Critically. Share Responsibly.
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ready to examine a viral post, article link, or screenshot?
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('analyze')}
          className="lab-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0"
        >
          <span>Analyze a Claim</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
