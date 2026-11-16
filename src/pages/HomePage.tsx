import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import {
  Mini3DCube,
  MiniDigitalGlobe,
  MiniRoboticArmNode,
  MiniSatelliteOrbiter,
} from '../components/Mini3DModels';
import { DemoAnalyticsDashboard } from '../components/DemoAnalyticsDashboard';
import type { AppRoute } from '../components/Navbar';
import { RoboticsCoreVisual } from '../components/RoboticsCoreVisual';
import type { FactCheckResponse } from '../shared/types';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
  onOpenSampleReport: (report: FactCheckResponse) => void;
}

export function HomePage({ onNavigate, onOpenSampleReport }: HomePageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16 space-y-20">
      {/* Hero Section */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-6 flex flex-col justify-center space-y-6"
        >
          <p className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-medium tracking-wide text-[#0284C7]">
            <span className="h-px w-6 bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" aria-hidden="true" />
            <span>TruthLens · Think Critically. Share Responsibly.</span>
          </p>

          <h1
            className="font-display font-extrabold tracking-tight text-slate-900 leading-[1.06]"
            style={{ fontSize: 'clamp(2.35rem, 4.1vw, 3.65rem)', textWrap: 'balance' }}
          >
            Before You Believe It,{' '}
            <span className="bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
              Check It.
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Turn viral posts into verified insights. Investigate claims, discover credible evidence,
            and make informed decisions.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('analyze')}
              className="lab-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              <span>Analyze a Claim</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="lab-btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              <span>See How It Works</span>
            </button>
          </div>
        </motion.div>

        {/* Right Column: Interactive Robotics Verification Unit */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-6 flex flex-col"
        >
          <RoboticsCoreVisual />
        </motion.div>
      </section>

      {/* Three Core Feature Cards with Subtle Live 3D Models */}
      <section aria-labelledby="core-capabilities-heading" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/85 pb-4">
          <div>
            <h2
              id="core-capabilities-heading"
              className="font-display text-2xl font-bold tracking-tight text-slate-900"
            >
              Built for Transparent Investigation
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Designed to distinguish verified external evidence from unverified speculation.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/85 px-3 py-1.5 shadow-2xs">
            <MiniRoboticArmNode className="h-9 w-9" />
            <span className="text-xs font-medium text-slate-600">Automated Verification Core</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="lab-panel-interactive relative md:col-span-5 rounded-2xl p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold tracking-wider text-[#2563EB]">
                01
              </span>
              <MiniSatelliteOrbiter />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Social Media Analysis
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Submit forwarded WhatsApp messages, social captions, public post URLs, or screenshots.
              Supported platforms use official embeds and APIs with honest paste-text fallbacks—never
              unauthorized scraping.
            </p>
          </div>

          <div className="lab-panel-interactive relative md:col-span-4 rounded-2xl p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold tracking-wider text-[#2563EB]">
                02
              </span>
              <Mini3DCube />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Evidence-Based Fact Checking
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Claims are evaluated against live Google Search grounding across supporting,
              contradicting, and missing context—returning Needs Verification whenever evidence is
              incomplete.
            </p>
          </div>

          <div className="lab-panel-interactive relative md:col-span-3 rounded-2xl p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold tracking-wider text-[#2563EB]">
                03
              </span>
              <MiniDigitalGlobe />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Source Transparency
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Inspect clickable source links, publisher identities, retrieval dates, and why each
              reference supports, contradicts, or contextualizes the claim.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Frontend-Only Sample Dashboard */}
      <DemoAnalyticsDashboard
        onOpenSampleReport={onOpenSampleReport}
        onExploreAnalyzer={() => onNavigate('analyze')}
      />
    </div>
  );
}
