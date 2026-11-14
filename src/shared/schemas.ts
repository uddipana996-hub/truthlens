import { z } from 'zod';

export const ASSESSMENT_OUTCOMES = [
  'SUPPORTED',
  'CONTRADICTED',
  'MISLEADING',
  'DISPUTED',
  'NEEDS_VERIFICATION',
] as const;

export const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW'] as const;

export const CLAIM_CATEGORIES = [
  'General',
  'Health',
  'Science',
  'Technology',
  'Politics',
  'News',
  'Finance',
  'Other',
] as const;

export const SUBMISSION_TYPES = ['text', 'url', 'image'] as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export const MAX_IMAGE_BASE64_BYTES = 7_500_000; // ~5.5MB raw image encoded as base64

export const testKeyRequestSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(10, 'API key appears too short.')
    .max(256, 'API key exceeds maximum allowed length.'),
});

export const extractPostRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(8, 'Please enter a valid public URL.')
    .max(2048, 'URL exceeds maximum allowed length.'),
});

export const analyzeRequestSchema = z
  .object({
    submissionType: z.enum(SUBMISSION_TYPES),
    text: z
      .string()
      .trim()
      .max(15_000, 'Submitted text exceeds 15,000 characters.')
      .optional()
      .default(''),
    url: z
      .string()
      .trim()
      .max(2048, 'URL exceeds maximum allowed length.')
      .optional()
      .default(''),
    category: z.enum(CLAIM_CATEGORIES).optional().default('General'),
    imageData: z
      .object({
        mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
        base64: z
          .string()
          .min(16, 'Image payload is empty.')
          .max(MAX_IMAGE_BASE64_BYTES, 'Uploaded image exceeds 5 MB limit.'),
      })
      .optional(),
    apiKey: z
      .string()
      .trim()
      .min(10, 'Provided Gemini API key appears invalid.')
      .max(256, 'Provided Gemini API key exceeds maximum length.')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.submissionType === 'text' && data.text.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a factual claim or post (at least 5 characters).',
        path: ['text'],
      });
    }
    if (data.submissionType === 'url' && data.url.length < 8 && data.text.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid public URL or provide fallback post text.',
        path: ['url'],
      });
    }
    if (data.submissionType === 'image' && !data.imageData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please upload a PNG, JPG, JPEG, or WebP screenshot.',
        path: ['imageData'],
      });
    }
  });

export const stage1ExtractionSchema = z.object({
  extractedText: z.string(),
  unreadableOrAmbiguousNotes: z.string().nullable().default(null),
  centralSummary: z.string(),
  claims: z
    .array(
      z.object({
        claim: z.string(),
        searchQuery: z.string(),
      })
    )
    .max(5),
});

export const stage5SynthesisSchema = z.object({
  assessment: z.enum(ASSESSMENT_OUTCOMES),
  confidence: z.object({
    level: z.enum(CONFIDENCE_LEVELS),
    reason: z.string(),
  }),
  claimSummary: z.string(),
  overallExplanation: z.string(),
  keyFindings: z.array(z.string()),
  claims: z.array(
    z.object({
      text: z.string(),
      assessment: z.enum(ASSESSMENT_OUTCOMES),
      explanation: z.string(),
      supportingSourceIds: z.array(z.string()),
      contradictingSourceIds: z.array(z.string()),
      missingContext: z.array(z.string()),
    })
  ),
  supportingEvidence: z.array(z.string()),
  contradictingEvidence: z.array(z.string()),
  missingContext: z.array(z.string()),
  questionsToInvestigate: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  sourceAnnotations: z
    .array(
      z.object({
        sourceId: z.string(),
        publisher: z.string().optional(),
        publishedAt: z.string().nullable().optional(),
        relevance: z.string(),
        stance: z.enum(['SUPPORTS', 'CONTRADICTS', 'CONTEXTUALIZES']),
      })
    )
    .default([]),
  limitations: z.array(z.string()),
});

export const factCheckResponseSchema = z.object({
  status: z.literal('success'),
  assessment: z.enum(ASSESSMENT_OUTCOMES),
  confidence: z.object({
    level: z.enum(CONFIDENCE_LEVELS),
    reason: z.string(),
  }),
  claimSummary: z.string(),
  overallExplanation: z.string(),
  keyFindings: z.array(z.string()),
  claims: z.array(
    z.object({
      text: z.string(),
      assessment: z.enum(ASSESSMENT_OUTCOMES),
      explanation: z.string(),
      supportingSourceIds: z.array(z.string()),
      contradictingSourceIds: z.array(z.string()),
      missingContext: z.array(z.string()),
    })
  ),
  supportingEvidence: z.array(z.string()),
  contradictingEvidence: z.array(z.string()),
  missingContext: z.array(z.string()),
  questionsToInvestigate: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      publisher: z.string(),
      url: z.string().url(),
      publishedAt: z.string().nullable(),
      retrievedAt: z.string(),
      relevance: z.string(),
      stance: z.enum(['SUPPORTS', 'CONTRADICTS', 'CONTEXTUALIZES']),
    })
  ),
  limitations: z.array(z.string()),
  submission: z.object({
    submissionType: z.enum(SUBMISSION_TYPES),
    submittedText: z.string(),
    sourceUrl: z.string().nullable(),
    detectedPlatform: z.enum([
      'instagram',
      'facebook',
      'x',
      'threads',
      'tiktok',
      'youtube',
      'web',
      'unknown',
    ]),
    extractionStatus: z.enum([
      'retrieved',
      'partial',
      'unavailable',
      'unsupported',
      'user_provided',
    ]),
    category: z.enum(CLAIM_CATEGORIES),
    hasImage: z.boolean(),
    extractedImageText: z.string().nullable(),
    unreadableImageNotes: z.string().nullable(),
  }),
  researchedAt: z.string(),
});
