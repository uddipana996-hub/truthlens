import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, FileSearch, Globe2, Link2, ShieldCheck } from 'lucide-react';
import type { AppRoute } from '../components/Navbar';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16 space-y-16">
      {/* Hero Section */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-7 flex flex-col justify-center space-y-6"
        >
          <p className="text-sm font-medium text-[#22D3EE]">
            TRUTHLENS AI · Think Critically. Share Responsibly.
          </p>

          <h1
            className="font-display font-extrabold tracking-tight text-[#F8FAFC] leading-[1.08]"
            style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.6rem)', textWrap: 'balance' }}
          >
            Before You Believe It, Check It.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
            Turn viral posts into verified insights. Investigate claims, discover credible evidence,
            and make informed decisions with AI.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('analyze')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-opacity hover:opacity-95 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
            >
              <span>Analyze a Claim</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#10162A] px-5 py-3 text-sm font-semibold text-[#F8FAFC] transition-colors hover:border-[#22D3EE]/50 hover:bg-[#151E38] whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              <span>See How It Works</span>
            </button>
          </div>
        </motion.div>

        {/* Right Column: Structured Investigation Dossier Preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/12 bg-[#10162A] p-6"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 text-xs text-[#94A3B8]">
              <span className="font-medium text-[#F8FAFC]">Verification Workflow</span>
              <span>Live Search Grounding</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileSearch className="h-4 w-4 text-[#8B5CF6] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-[#F8FAFC]">
                    1. Claim Decomposition
                  </div>
                  <p className="text-xs leading-relaxed text-[#94A3B8]">
                    Separates multi-part viral posts and screenshots into individual testable
                    factual statements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                <Globe2 className="h-4 w-4 text-[#3B82F6] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-[#F8FAFC]">
                    2. Authoritative Evidence Search
                  </div>
                  <p className="text-xs leading-relaxed text-[#94A3B8]">
                    Queries current public records from official institutions, peer-reviewed
                    journals, and established newsrooms.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                <CheckCircle2 className="h-4 w-4 text-[#22D3EE] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-[#F8FAFC]">
                    3. Strict Citation Validation
                  </div>
                  <p className="text-xs leading-relaxed text-[#94A3B8]">
                    Every displayed link is checked against retrieved search metadata—never
                    invented from model memory.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-3.5 text-xs text-[#94A3B8] flex items-center justify-between gap-2">
            <span>5 Evidence-Backed Outcomes</span>
            <span className="text-[#22D3EE]">Zero Persistent Claim Storage</span>
          </div>
        </motion.div>
      </section>

      {/* Three Core Feature Cards */}
      <section aria-labelledby="core-capabilities-heading" className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-4">
          <div>
            <h2
              id="core-capabilities-heading"
              className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]"
            >
              Built for Transparent Investigation
            </h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Designed to distinguish verified external evidence from AI speculation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-5 rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-3 transition-colors hover:border-[#8B5CF6]/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#22D3EE]">01</span>
              <Link2 className="h-5 w-5 text-[#8B5CF6]" aria-hidden="true" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
              Social Media Analysis
            </h3>
            <p className="text-sm leading-relaxed text-[#94A3B8]">
              Submit forwarded WhatsApp messages, social captions, public post URLs, or screenshots.
              Supported platforms use official embeds and APIs with honest paste-text fallbacks—never
              unauthorized scraping.
            </p>
          </div>

          <div className="md:col-span-4 rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-3 transition-colors hover:border-[#3B82F6]/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#22D3EE]">02</span>
              <ShieldCheck className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
              Evidence-Based Fact Checking
            </h3>
            <p className="text-sm leading-relaxed text-[#94A3B8]">
              Claims are evaluated against live Google Search grounding across supporting,
              contradicting, and missing context—returning Needs Verification whenever evidence is
              incomplete.
            </p>
          </div>

          <div className="md:col-span-3 rounded-2xl border border-white/12 bg-[#10162A] p-6 space-y-3 transition-colors hover:border-[#22D3EE]/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#22D3EE]">03</span>
              <Globe2 className="h-5 w-5 text-[#22D3EE]" aria-hidden="true" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
              Source Transparency
            </h3>
            <p className="text-sm leading-relaxed text-[#94A3B8]">
              Inspect clickable source links, publisher identities, retrieval dates, and why each
              reference supports, contradicts, or contextualizes the claim.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
