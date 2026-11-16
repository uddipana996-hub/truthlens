export type AssessmentOutcome =
  | 'SUPPORTED'
  | 'CONTRADICTED'
  | 'MISLEADING'
  | 'DISPUTED'
  | 'NEEDS_VERIFICATION';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type SubmissionType = 'text' | 'url' | 'image';

export type ClaimCategory =
  | 'General'
  | 'Health'
  | 'Science'
  | 'Technology'
  | 'Politics'
  | 'News'
  | 'Finance'
  | 'Other';

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'threads'
  | 'tiktok'
  | 'youtube'
  | 'web'
  | 'unknown';

export type ExtractionStatus =
  | 'retrieved'
  | 'partial'
  | 'unavailable'
  | 'unsupported'
  | 'user_provided';

export type SourceStance = 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXTUALIZES';

export interface GroundedSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
  retrievedAt: string;
  relevance: string;
  stance: SourceStance;
}

export interface ClaimAnalysisItem {
  text: string;
  assessment: AssessmentOutcome;
  explanation: string;
  supportingSourceIds: string[];
  contradictingSourceIds: string[];
  missingContext: string[];
}

export interface SubmissionMetadata {
  submissionType: SubmissionType;
  submittedText: string;
  sourceUrl: string | null;
  detectedPlatform: SocialPlatform;
  extractionStatus: ExtractionStatus;
  category: ClaimCategory;
  hasImage: boolean;
  extractedImageText: string | null;
  unreadableImageNotes: string | null;
}

export interface FactCheckResponse {
  status: 'success';
  assessment: AssessmentOutcome;
  confidence: {
    level: ConfidenceLevel;
    reason: string;
  };
  claimSummary: string;
  overallExplanation: string;
  keyFindings: string[];
  claims: ClaimAnalysisItem[];
  supportingEvidence: string[];
  contradictingEvidence: string[];
  missingContext: string[];
  questionsToInvestigate: string[];
  recommendedActions: string[];
  sources: GroundedSource[];
  limitations: string[];
  submission: SubmissionMetadata;
  researchedAt: string;
  isDemo?: boolean;
  demoNote?: string;
}

export interface SocialExtractionResult {
  platform: SocialPlatform;
  platformLabel: string;
  status: ExtractionStatus;
  originalUrl: string;
  canonicalUrl: string;
  author: string | null;
  title: string | null;
  text: string | null;
  note: string;
  failureReason: string | null;
  fallbackSuggestion: string;
}

export type ServerKeyHealthStatus =
  | 'verified'
  | 'unverified'
  | 'invalid_key'
  | 'auth_failed'
  | 'quota_exceeded'
  | 'model_unavailable'
  | 'connection_failed'
  | 'not_configured';

export interface HealthStatusResponse {
  status: 'ok';
  serverKeyConfigured: boolean;
  serverKeyStatus: ServerKeyHealthStatus;
  serverKeyMessage?: string;
  metaConfigured: boolean;
  xConfigured: boolean;
  model: string;
}

export type KeyVerificationStatus =
  | 'connected'
  | 'invalid_key'
  | 'auth_failed'
  | 'quota_exceeded'
  | 'model_unavailable'
  | 'connection_failed'
  | 'error';

export interface TestKeyResponse {
  success: boolean;
  connectionStatus: KeyVerificationStatus;
  message: string;
  activeModel?: string;
}
