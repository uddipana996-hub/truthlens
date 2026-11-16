import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Globe2, Lock, SearchCheck, ShieldAlert } from 'lucide-react';
import { MiniDigitalGlobe, MiniMicrochipCore } from '../components/Mini3DModels';
import type { AppRoute } from '../components/Navbar';

interface HowItWorksPageProps {
  onNavigate: (route: AppRoute) => void;
}

const PIPELINE_STAGES = [
  {
    step: '01',
    title: 'Content Extraction & Input Sanitization',
    detail:
      'Accepts pasted text, public post metadata via official oEmbed/API adapters, or uploaded screenshots via optical text extraction. Unreadable or cropped image regions are flagged explicitly rather than guessed.',
  },
  {
    step: '02',
    title: 'Claim Decomposition',
    detail:
      'Breaks multi-part posts into individual checkable factual statements so a partially true post with one false statistic is evaluated accurately.',
  },
  {
    step: '03',
    title: 'Live Evidence Retrieval (Google Search Grounding)',
    detail:
      'Queries live web evidence prioritizing government & official institutions, peer-reviewed research, international organizations, established newsrooms, and independent fact-checkers.',
  },
  {
    step: '04',
    title: 'Evidence Evaluation & Missing Context',
    detail:
      'Evaluates whether sources support, contradict, or complicate the claim, checks publication recency, and surfaces omitted context.',
  },
  {
    step: '05',
    title: 'Plain-Language Synthesis',
    detail:
      'Produces a structured assessment (Supported, Contradicted, Misleading, Disputed, or Needs Verification) and a confidence level grounded strictly in evidence strength.',
  },
  {
    step: '06',
    title: 'Strict Citation Validation',
    detail:
      'Every displayed URL is mapped deterministically from Google Search grounding metadata. Unknown or unverified citations are stripped, and empty evidence defaults to Needs Verification.',
  },
];

export function HowItWorksPage({ onNavigate }: HowItWorksPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-12"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/85 pb-8">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#0284C7]">
            <span className="h-px w-5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" aria-hidden="true" />
            <span>Methodology &amp; Safeguards</span>
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How TruthLens Investigates Claims
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-600">
            Internal model memory alone is not proof. TruthLens separates claim parsing from live
            external evidence retrieval and enforces strict citation validation before presenting any
            assessment.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200/85 bg-white/90 p-2 shadow-2xs shrink-0">
          <MiniDigitalGlobe />
        </div>
      </div>

      {/* 6-Stage Pipeline */}
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Six-Stage Verification Pipeline
          </h2>
          <MiniMicrochipCore className="hidden sm:flex h-9 w-9" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.step}
              className="lab-panel-interactive rounded-2xl p-5 sm:p-6 space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="lab-icon-badge h-7 px-2.5 font-mono text-xs font-semibold text-[#2563EB]">
                  {stage.step}
                </span>
                <h3 className="font-display text-base font-bold text-slate-900">{stage.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{stage.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Source Priority & Platform Limits */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="lab-panel relative rounded-2xl p-6 space-y-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB]/45 to-transparent"
          />
          <div className="flex items-center gap-3">
            <div className="lab-icon-badge h-9 w-9">
              <SearchCheck className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Source Credibility Hierarchy
            </h2>
          </div>
          <ol className="space-y-2.5 text-sm text-slate-600 list-decimal list-inside">
            <li>Government agencies and official institutional records</li>
            <li>Original peer-reviewed research papers and scientific journals</li>
            <li>Recognized international organizations (WHO, UN, IPCC, OECD)</li>
            <li>Established news organizations with editorial standards</li>
            <li>Independent fact-checking organizations (IFCN signatories)</li>
            <li>Other relevant, verifiable primary sources</li>
          </ol>
        </div>

        <div className="lab-panel relative rounded-2xl p-6 space-y-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#06B6D4]/45 to-transparent"
          />
          <div className="flex items-center gap-3">
            <div className="lab-icon-badge h-9 w-9">
              <Lock className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Social Media &amp; Privacy Boundaries
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#0284C7] mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Only official APIs and public oEmbed integrations are used—never login bypasses,
                private scraping, or unauthorized cookies.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Globe2 className="h-4 w-4 text-[#2563EB] mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                When Meta or X credentials are absent or posts are restricted, TruthLens prompts you
                to paste text or upload a screenshot instead of guessing.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-[#2563EB] mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Submitted claims and screenshots are never stored in a database or persistent browser
                storage.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => onNavigate('analyze')}
          className="lab-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap"
        >
          <span>Try the Fact-Check Workspace</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
