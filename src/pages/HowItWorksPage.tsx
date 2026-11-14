import { ArrowRight, CheckCircle2, Globe2, Lock, SearchCheck, ShieldAlert } from 'lucide-react';
import type { AppRoute } from '../components/Navbar';

interface HowItWorksPageProps {
  onNavigate: (route: AppRoute) => void;
}

const PIPELINE_STAGES = [
  {
    step: '01',
    title: 'Content Extraction & Input Sanitization',
    detail:
      'Accepts pasted text, public post metadata via official oEmbed/API adapters, or uploaded screenshots via multimodal vision. Unreadable or cropped image regions are flagged explicitly rather than guessed.',
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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-12">
      <div className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-sm font-medium text-[#22D3EE]">Methodology &amp; Safeguards</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
          How TruthLens AI Investigates Claims
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-[#94A3B8]">
          An AI model&apos;s internal memory is not proof. TruthLens AI separates claim parsing from
          live external evidence retrieval and enforces strict citation validation before presenting
          any assessment.
        </p>
      </div>

      {/* 6-Stage Pipeline */}
      <section className="space-y-5">
        <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
          Six-Stage Verification Pipeline
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.step}
              className="rounded-2xl border border-white/12 bg-[#10162A] p-5 space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#22D3EE]">
                  {stage.step}.
                </span>
                <h3 className="font-display text-base font-bold text-[#F8FAFC]">{stage.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-[#94A3B8]">{stage.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Source Priority & Platform Limits */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <SearchCheck className="h-5 w-5 text-[#8B5CF6]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
              Source Credibility Hierarchy
            </h2>
          </div>
          <ol className="space-y-2 text-sm text-[#94A3B8] list-decimal list-inside">
            <li>Government agencies and official institutional records</li>
            <li>Original peer-reviewed research papers and scientific journals</li>
            <li>Recognized international organizations (WHO, UN, IPCC, OECD)</li>
            <li>Established news organizations with editorial standards</li>
            <li>Independent fact-checking organizations (IFCN signatories)</li>
            <li>Other relevant, verifiable primary sources</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-[#22D3EE]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
              Social Media &amp; Privacy Boundaries
            </h2>
          </div>
          <ul className="space-y-2.5 text-sm text-[#94A3B8]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#22D3EE] mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Only official APIs and public oEmbed integrations are used—never login bypasses,
                private scraping, or unauthorized cookies.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Globe2 className="h-4 w-4 text-[#3B82F6] mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                When Meta or X credentials are absent or posts are restricted, TruthLens AI prompts
                you to paste text or upload a screenshot instead of guessing.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-[#8B5CF6] mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Submitted claims, screenshots, and BYOK session keys are never stored in a database
                or browser persistence.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => onNavigate('analyze')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
        >
          <span>Try the Fact-Check Workspace</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
