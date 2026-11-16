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
    containerClass: 'border-emerald-200 bg-emerald-50/75 text-emerald-950',
    badgeClass: 'border-emerald-300 bg-white text-emerald-700',
    dotColor: 'text-emerald-600',
  },
  CONTRADICTED: {
    label: 'Contradicted',
    description: 'Reliable retrieved evidence directly contradicts this claim.',
    containerClass: 'border-rose-200 bg-rose-50/75 text-rose-950',
    badgeClass: 'border-rose-300 bg-white text-rose-700',
    dotColor: 'text-rose-600',
  },
  MISLEADING: {
    label: 'Misleading',
    description:
      'Contains some accurate elements but omits critical context or distorts the facts.',
    containerClass: 'border-orange-200 bg-orange-50/80 text-orange-950',
    badgeClass: 'border-orange-300 bg-white text-orange-700',
    dotColor: 'text-orange-600',
  },
  DISPUTED: {
    label: 'Disputed',
    description: 'Credible sources provide conflicting evidence or interpretations.',
    containerClass: 'border-indigo-200 bg-indigo-50/75 text-indigo-950',
    badgeClass: 'border-indigo-300 bg-white text-indigo-700',
    dotColor: 'text-indigo-600',
  },
  NEEDS_VERIFICATION: {
    label: 'Needs Verification',
    description: 'Insufficient reliable evidence was retrieved to reach a conclusion.',
    containerClass: 'border-slate-200 bg-slate-100/85 text-slate-900',
    badgeClass: 'border-slate-300 bg-white text-slate-700',
    dotColor: 'text-slate-600',
  },
};

export const CONFIDENCE_META: Record<
  ConfidenceLevel,
  { label: string; textClass: string }
> = {
  HIGH: { label: 'High Confidence', textClass: 'text-emerald-700' },
  MEDIUM: { label: 'Medium Confidence', textClass: 'text-blue-700' },
  LOW: { label: 'Low Confidence', textClass: 'text-amber-700' },
};

export const STANCE_META: Record<SourceStance, { label: string; textClass: string }> = {
  SUPPORTS: { label: 'Supports Claim', textClass: 'text-emerald-700' },
  CONTRADICTS: { label: 'Contradicts Claim', textClass: 'text-rose-700' },
  CONTEXTUALIZES: { label: 'Provides Context', textClass: 'text-blue-700' },
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
