import type { AssessmentOutcome, ConfidenceLevel, SourceStance } from '../shared/types';

export const ASSESSMENT_META: Record<
  AssessmentOutcome,
  {
    label: string;
    description: string;
    containerClass: string;
    badgeClass: string;
    dotColor: string;
  }
> = {
  SUPPORTED: {
    label: 'Supported',
    description: 'Available credible evidence strongly supports this claim.',
    containerClass: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    dotColor: 'text-emerald-400',
  },
  CONTRADICTED: {
    label: 'Contradicted',
    description: 'Reliable retrieved evidence directly contradicts this claim.',
    containerClass: 'border-rose-500/35 bg-rose-500/10 text-rose-100',
    badgeClass: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    dotColor: 'text-rose-400',
  },
  MISLEADING: {
    label: 'Misleading',
    description:
      'Contains some accurate elements but omits critical context or distorts the facts.',
    containerClass: 'border-orange-500/35 bg-orange-500/10 text-orange-100',
    badgeClass: 'border-orange-500/40 bg-orange-500/15 text-orange-300',
    dotColor: 'text-orange-400',
  },
  DISPUTED: {
    label: 'Disputed',
    description: 'Credible sources provide conflicting evidence or interpretations.',
    containerClass: 'border-purple-500/35 bg-purple-500/10 text-purple-100',
    badgeClass: 'border-purple-500/40 bg-purple-500/15 text-purple-300',
    dotColor: 'text-purple-400',
  },
  NEEDS_VERIFICATION: {
    label: 'Needs Verification',
    description: 'Insufficient reliable evidence was retrieved to reach a conclusion.',
    containerClass: 'border-slate-400/30 bg-slate-500/10 text-slate-100',
    badgeClass: 'border-slate-400/35 bg-slate-500/15 text-slate-300',
    dotColor: 'text-slate-300',
  },
};

export const CONFIDENCE_META: Record<
  ConfidenceLevel,
  { label: string; textClass: string }
> = {
  HIGH: { label: 'High Confidence', textClass: 'text-emerald-300' },
  MEDIUM: { label: 'Medium Confidence', textClass: 'text-sky-300' },
  LOW: { label: 'Low Confidence', textClass: 'text-amber-300' },
};

export const STANCE_META: Record<SourceStance, { label: string; textClass: string }> = {
  SUPPORTS: { label: 'Supports Claim', textClass: 'text-emerald-300' },
  CONTRADICTS: { label: 'Contradicts Claim', textClass: 'text-rose-300' },
  CONTEXTUALIZES: { label: 'Provides Context', textClass: 'text-sky-300' },
};

export function formatPlatformName(platform: string): string {
  switch (platform) {
    case 'x':
      return 'X (Twitter)';
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook';
    case 'threads':
      return 'Threads';
    case 'tiktok':
      return 'TikTok';
    case 'youtube':
      return 'YouTube';
    case 'web':
      return 'Public Web Page';
    default:
      return 'Direct Submission';
  }
}
