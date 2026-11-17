import type { GenerateContentResponse } from '@google/genai';
import type { GroundedSource, SourceStance } from '../../src/shared/types.js';

export interface GroundedChunkRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  retrievedAt: string;
}

function isValidHttpUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function inferPublisherFromUrl(rawUrl: string, fallbackTitle?: string): string {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('vertexaisearch.cloud.google.com') && fallbackTitle) {
      return fallbackTitle;
    }
    return host;
  } catch {
    return fallbackTitle || 'Web Source';
  }
}

/**
 * Extracts verified web citations solely from Gemini's `groundingMetadata.groundingChunks`.
 * Never reads URLs generated inside model prose so the LLM cannot hallucinate links.
 */
export function extractVerifiedGroundingSources(
  responses: GenerateContentResponse[],
  retrievedAt: string
): GroundedChunkRecord[] {
  const seenUrls = new Set<string>();
  const records: GroundedChunkRecord[] = [];

  for (const response of responses) {
    const candidates = response.candidates ?? [];
    for (const candidate of candidates) {
      const chunks = candidate.groundingMetadata?.groundingChunks ?? [];
      for (const chunk of chunks) {
        const uri = chunk.web?.uri?.trim();
        const title = chunk.web?.title?.trim();
        if (!uri || !isValidHttpUrl(uri)) continue;

        const normalizedKey = uri.replace(/\/$/, '');
        if (seenUrls.has(normalizedKey)) continue;
        seenUrls.add(normalizedKey);

        const id = `SRC-${records.length + 1}`;
        const publisher = inferPublisherFromUrl(uri, title);

        records.push({
          id,
          title: title && title.length > 0 ? title : publisher,
          publisher,
          url: uri,
          retrievedAt,
        });
      }
    }
  }

  return records;
}

/**
 * Validates model-provided source IDs and annotations against the server's verified grounded source catalog.
 * Unknown or hallucinated source IDs are strictly discarded.
 */
function normalizeSourceId(rawId: string): string {
  return rawId.trim().replace(/^\[+|\]+$/g, '').toUpperCase();
}

export function validateAndBuildSources(
  groundedRecords: GroundedChunkRecord[],
  annotations: Array<{
    sourceId: string;
    publisher?: string;
    publishedAt?: string | null;
    relevance: string;
    stance: SourceStance;
  }>
): {
  validSourceIds: Set<string>;
  sources: GroundedSource[];
} {
  const recordMap = new Map(groundedRecords.map((r) => [r.id, r]));
  const annotationMap = new Map<string, (typeof annotations)[number]>();

  for (const ann of annotations) {
    const normalizedId = normalizeSourceId(ann.sourceId);
    if (recordMap.has(normalizedId) && !annotationMap.has(normalizedId)) {
      annotationMap.set(normalizedId, { ...ann, sourceId: normalizedId });
    }
  }

  const sources: GroundedSource[] = groundedRecords.map((rec) => {
    const ann = annotationMap.get(rec.id);
    const cleanedPublisher =
      ann?.publisher && ann.publisher.trim().length > 1
        ? ann.publisher.trim().slice(0, 120)
        : rec.publisher;
    const cleanedPublishedAt =
      ann?.publishedAt && ann.publishedAt.trim().length >= 4 && ann.publishedAt.trim().toLowerCase() !== 'unknown'
        ? ann.publishedAt.trim().slice(0, 64)
        : null;

    return {
      id: rec.id,
      title: rec.title,
      publisher: cleanedPublisher,
      url: rec.url,
      publishedAt: cleanedPublishedAt,
      retrievedAt: rec.retrievedAt,
      relevance:
        ann?.relevance?.trim() ||
        'Retrieved via live Google Search grounding during claim verification.',
      stance: ann?.stance ?? 'CONTEXTUALIZES',
    };
  });

  return {
    validSourceIds: new Set(groundedRecords.map((r) => r.id)),
    sources,
  };
}

export function filterValidSourceIds(ids: string[], validSourceIds: Set<string>): string[] {
  const seen = new Set<string>();
  const valid: string[] = [];
  for (const rawId of ids) {
    const id = normalizeSourceId(rawId);
    if (validSourceIds.has(id) && !seen.has(id)) {
      seen.add(id);
      valid.push(id);
    }
  }
  return valid;
}
