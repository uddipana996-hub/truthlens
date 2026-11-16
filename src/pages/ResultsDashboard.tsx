import { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  PlusCircle,
  Scale,
  Share2,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { MiniMicrochipCore } from '../components/Mini3DModels';
import type { AssessmentOutcome, FactCheckResponse } from '../shared/types';
import {
  ASSESSMENT_META,
  CONFIDENCE_META,
  STANCE_META,
  formatPlatformName,
} from '../utils/assessmentStyles';

interface ResultsDashboardProps {
  result: FactCheckResponse;
  onStartNew: () => void;
}

function AssessmentIcon({ outcome, className = 'h-5 w-5' }: { outcome: AssessmentOutcome; className?: string }) {
  switch (outcome) {
    case 'SUPPORTED':
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case 'CONTRADICTED':
      return <XCircle className={className} aria-hidden="true" />;
    case 'MISLEADING':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'DISPUTED':
      return <Scale className={className} aria-hidden="true" />;
    default:
      return <HelpCircle className={className} aria-hidden="true" />;
  }
}

function buildPlainTextReport(result: FactCheckResponse): string {
  const lines: string[] = [
    result.isDemo ? 'TruthLens — Fact-Check Report [DEMO / SAMPLE REPORT]' : 'TruthLens — Fact-Check Report',
    ...(result.isDemo
      ? [
          result.demoNote ||
            'DEMO NOTICE: This report is an offline frontend demonstration sample and does not represent live verification.',
        ]
      : []),
    `Assessment: ${ASSESSMENT_META[result.assessment].label}`,
    `Confidence: ${result.confidence.level} (${result.confidence.reason})`,
    `Category: ${result.submission.category}`,
    `Researched At: ${new Date(result.researchedAt).toLocaleString()}`,
    '',
    'Claim Summary:',
    result.claimSummary,
    '',
    'Explanation:',
    result.overallExplanation,
  ];

  if (result.keyFindings.length > 0) {
    lines.push('', 'Key Findings:');
    result.keyFindings.forEach((f) => lines.push(`- ${f}`));
  }

  if (result.missingContext.length > 0) {
    lines.push('', 'Missing Context:');
    result.missingContext.forEach((m) => lines.push(`- ${m}`));
  }

  if (result.sources.length > 0) {
    lines.push('', 'Verified Sources:');
    result.sources.forEach((s) =>
      lines.push(`[${s.id}] ${s.title} (${s.publisher}) — ${s.url}`)
    );
  }

  lines.push(
    '',
    'Disclaimer: TruthLens provides automated research and preliminary assessments. Always consult original sources and qualified professionals.'
  );
  return lines.join('\n');
}

export function ResultsDashboard({ result, onStartNew }: ResultsDashboardProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const assessmentInfo = ASSESSMENT_META[result.assessment];
  const confidenceInfo = CONFIDENCE_META[result.confidence.level];
  const sourceById = new Map(result.sources.map((s) => [s.id, s]));

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainTextReport(result));
      setCopyFeedback('Full report copied to clipboard');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback('Clipboard permission unavailable in this browser');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleShareSummary = async () => {
    const summaryText = `TruthLens Assessment: ${assessmentInfo.label}\nClaim: ${result.claimSummary}\nConfidence: ${result.confidence.level}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'TruthLens Fact-Check Summary',
          text: summaryText,
        });
        return;
      } catch {
        // User cancelled or share unsupported; fall back to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyFeedback('Summary copied for sharing');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback('Unable to copy summary');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const isHighCautionCategory =
    result.submission.category === 'Health' ||
    result.submission.category === 'Finance' ||
    result.submission.category === 'Politics';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8"
    >
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/85 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex rounded-2xl border border-slate-200/85 bg-white/90 p-1 shadow-2xs">
            <MiniMicrochipCore />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Investigation Report
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
              <span>Category: {result.submission.category}</span>
              <span aria-hidden="true">·</span>
              <span>Analyzed: {new Date(result.researchedAt).toLocaleString()}</span>
              <span aria-hidden="true">·</span>
              <span>{result.isDemo ? `${result.sources.length} sample reference(s)` : `${result.sources.length} grounded source(s)`}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {copyFeedback && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB]">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {copyFeedback}
            </span>
          )}

          <button
            type="button"
            onClick={handleCopyReport}
            className="lab-btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <Copy className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
            <span>Copy Report</span>
          </button>

          <button
            type="button"
            onClick={handleShareSummary}
            className="lab-btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <Share2 className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
            <span>Share Summary</span>
          </button>

          <button
            type="button"
            onClick={onStartNew}
            className="lab-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Explicit Demo / Sample Report Banner */}
      {result.isDemo && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-2xl border border-cyan-200 bg-gradient-to-r from-blue-50 via-cyan-50/70 to-white p-4 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <span className="rounded border border-cyan-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0284C7] shrink-0">
              DEMO / SAMPLE
            </span>
            <p className="leading-relaxed">
              {result.demoNote ||
                'Sample Demo Report generated from local frontend demonstration data. No external verification API was called.'}
            </p>
          </div>
        </div>
      )}

      {/* B, C, D: Overall Assessment + Confidence + Claim Summary */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div
          className={`lg:col-span-5 rounded-2xl border p-6 space-y-4 shadow-sm ${assessmentInfo.containerClass}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium opacity-80">Overall Assessment</span>
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold shadow-2xs ${assessmentInfo.badgeClass}`}>
              <AssessmentIcon outcome={result.assessment} className="h-4 w-4" />
              <span>{assessmentInfo.label}</span>
            </span>
          </div>

          <p className="text-sm leading-relaxed opacity-95">{assessmentInfo.description}</p>

          <div className="border-t border-black/10 pt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="opacity-80">Evidence Confidence</span>
              <span className={`font-semibold ${confidenceInfo.textClass}`}>
                {confidenceInfo.label}
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{result.confidence.reason}</p>
          </div>
        </div>

        <div className="lab-panel relative lg:col-span-7 rounded-2xl p-6 space-y-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB]/45 to-transparent"
          />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              Claim Summary
            </h2>
            <p className="mt-1.5 font-display text-lg font-bold leading-snug text-slate-900">
              {result.claimSummary}
            </p>
          </div>
          <div className="border-t border-slate-200/85 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Plain-Language Assessment
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
              {result.overallExplanation}
            </p>
          </div>
        </div>
      </section>

      {/* A: Original Submission Details */}
      <section className="lab-panel rounded-2xl p-6 space-y-3">
        <h2 className="font-display text-base font-bold text-slate-900">Original Submission</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>Mode: {result.submission.submissionType}</span>
          <span aria-hidden="true">·</span>
          <span>Platform: {formatPlatformName(result.submission.detectedPlatform)}</span>
          <span aria-hidden="true">·</span>
          <span>Extraction status: {result.submission.extractionStatus}</span>
          {result.submission.sourceUrl && (
            <>
              <span aria-hidden="true">·</span>
              <a
                href={result.submission.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#2563EB] hover:underline break-all"
              >
                <span>Original link</span>
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            </>
          )}
        </div>

        <blockquote className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
          {result.submission.submittedText}
        </blockquote>

        {result.submission.extractedImageText && (
          <div className="text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-900">Extracted Screenshot Text:</span>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800 whitespace-pre-wrap">
              {result.submission.extractedImageText}
            </p>
          </div>
        )}

        {result.submission.unreadableImageNotes && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
            <span>
              <strong>Image Ambiguity Notice:</strong> {result.submission.unreadableImageNotes}
            </span>
          </div>
        )}
      </section>

      {/* E & H: Key Findings & Missing Context */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="lab-panel rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-base font-bold text-slate-900">Key Findings</h2>
          {result.keyFindings.length > 0 ? (
            <ul className="space-y-2 text-sm leading-relaxed text-slate-600 list-disc list-inside">
              {result.keyFindings.map((finding, idx) => (
                <li key={idx}>{finding}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No additional key findings recorded.</p>
          )}
        </div>

        <div className="lab-panel rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-base font-bold text-slate-900">Missing Context</h2>
          {result.missingContext.length > 0 ? (
            <ul className="space-y-2 text-sm leading-relaxed text-slate-600 list-disc list-inside">
              {result.missingContext.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No major omitted context flagged in retrieved sources.
            </p>
          )}
        </div>
      </section>

      {/* F & G: Supporting vs Contradicting Evidence */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="lab-panel rounded-2xl border-emerald-200 bg-emerald-50/35 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-slate-900">
              Evidence Supporting the Claim
            </h2>
          </div>
          {result.supportingEvidence.length > 0 ? (
            <ul className="space-y-2 text-sm leading-relaxed text-slate-700 list-disc list-inside">
              {result.supportingEvidence.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">
              No credible retrieved evidence directly supports this claim.
            </p>
          )}
        </div>

        <div className="lab-panel rounded-2xl border-rose-200 bg-rose-50/35 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-slate-900">
              Evidence Contradicting the Claim
            </h2>
          </div>
          {result.contradictingEvidence.length > 0 ? (
            <ul className="space-y-2 text-sm leading-relaxed text-slate-700 list-disc list-inside">
              {result.contradictingEvidence.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">
              No retrieved evidence directly contradicts this claim.
            </p>
          )}
        </div>
      </section>

      {/* I: Claim-by-Claim Breakdown */}
      {result.claims.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Claim-by-Claim Breakdown
          </h2>
          <div className="space-y-3">
            {result.claims.map((claim, idx) => {
              const claimMeta = ASSESSMENT_META[claim.assessment];
              return (
                <div
                  key={idx}
                  className="lab-panel rounded-2xl p-5 space-y-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      <span className="font-mono text-[#2563EB] mr-2">0{idx + 1}.</span>
                      {claim.text}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shrink-0 self-start ${claimMeta.badgeClass}`}
                    >
                      <AssessmentIcon outcome={claim.assessment} className="h-3.5 w-3.5" />
                      <span>{claimMeta.label}</span>
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600">{claim.explanation}</p>

                  {(claim.supportingSourceIds.length > 0 ||
                    claim.contradictingSourceIds.length > 0) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      {claim.supportingSourceIds.length > 0 && (
                        <span>
                          Supporting refs:{' '}
                          {claim.supportingSourceIds
                            .filter((id) => sourceById.has(id))
                            .map((id) => (
                              <a
                                key={id}
                                href={`#source-${id}`}
                                className="font-mono font-medium text-emerald-700 hover:underline mr-1.5"
                              >
                                [{id}]
                              </a>
                            ))}
                        </span>
                      )}
                      {claim.contradictingSourceIds.length > 0 && (
                        <span>
                          Contradicting refs:{' '}
                          {claim.contradictingSourceIds
                            .filter((id) => sourceById.has(id))
                            .map((id) => (
                              <a
                                key={id}
                                href={`#source-${id}`}
                                className="font-mono font-medium text-rose-700 hover:underline mr-1.5"
                              >
                                [{id}]
                              </a>
                            ))}
                        </span>
                      )}
                    </div>
                  )}

                  {claim.missingContext.length > 0 && (
                    <div className="border-t border-slate-200/85 pt-2.5 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">Missing context: </span>
                      {claim.missingContext.join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* J: Sources and References (Strictly Grounded) */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Sources and References
          </h2>
          <p className="text-xs text-slate-500">
            {result.isDemo
              ? 'Illustrative sample references included in offline Frontend Demo Mode.'
              : 'Every link below was retrieved directly from Google Search grounding metadata.'}
          </p>
        </div>

        {result.sources.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {result.sources.map((src) => {
              const stanceInfo = STANCE_META[src.stance];
              return (
                <article
                  key={src.id}
                  id={`source-${src.id}`}
                  className="lab-panel-interactive rounded-2xl p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-[#2563EB]">{src.id}</span>
                    <span className={`font-semibold ${stanceInfo.textClass}`}>
                      {stanceInfo.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 hover:text-[#2563EB] transition-colors"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                    </a>
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                    <span>{src.publisher}</span>
                    {src.publishedAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Published: {src.publishedAt}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Accessed: {new Date(src.retrievedAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-600">{src.relevance}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="lab-panel rounded-2xl p-5 text-sm text-slate-600">
            No verifiable external source URLs were returned during live grounding. Because
            TruthLens never fabricates citations, this submission remains marked Needs Verification.
          </div>
        )}
      </section>

      {/* K & L: Questions to Investigate + Recommended Actions */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="lab-panel rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-base font-bold text-slate-900">
            Questions to Investigate
          </h2>
          {result.questionsToInvestigate.length > 0 ? (
            <ul className="space-y-2 text-sm leading-relaxed text-slate-600 list-disc list-inside">
              {result.questionsToInvestigate.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">
              Compare this claim against primary institutional records and original reporting dates.
            </p>
          )}
        </div>

        <div className="lab-panel rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-base font-bold text-slate-900">Recommended Actions</h2>
          {result.recommendedActions.length > 0 ? (
            <ul className="space-y-2 text-sm leading-relaxed text-slate-600 list-disc list-inside">
              {result.recommendedActions.map((act, idx) => (
                <li key={idx}>{act}</li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2 text-sm leading-relaxed text-slate-600 list-disc list-inside">
              <li>Check the original publication and publication date.</li>
              <li>Verify against official institutional announcements.</li>
              <li>Avoid sharing until independent confirmation is available.</li>
            </ul>
          )}
        </div>
      </section>

      {/* Limitations & Caution Notice */}
      <section className="lab-panel rounded-2xl bg-slate-50/90 p-5 space-y-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <ShieldAlert className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
          <span>Limitations &amp; Verification Notice</span>
        </div>

        {result.limitations.length > 0 && (
          <ul className="space-y-1 list-disc list-inside leading-relaxed">
            {result.limitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        )}

        {isHighCautionCategory && (
          <p className="text-amber-800 leading-relaxed">
            <strong>{result.submission.category} Caution:</strong> Do not treat this research
            summary as medical, financial, or legal advice. Consult qualified professionals and
            official institutional guidance.
          </p>
        )}
      </section>
    </motion.div>
  );
}
