import type { SocialExtractionResult, SocialPlatform } from '../../../src/shared/types.js';
import { safePublicFetch } from '../../utils/ssrf.js';

const META_OEMBED_ENDPOINTS: Record<'instagram' | 'facebook', string> = {
  instagram: 'https://graph.facebook.com/v19.0/instagram_oembed',
  facebook: 'https://graph.facebook.com/v19.0/oembed_post',
};

export async function extractMetaPost(
  url: string,
  platform: Extract<SocialPlatform, 'instagram' | 'facebook' | 'threads'>
): Promise<SocialExtractionResult> {
  const platformLabel =
    platform === 'instagram' ? 'Instagram' : platform === 'facebook' ? 'Facebook' : 'Threads';

  if (platform === 'threads') {
    return {
      platform,
      platformLabel,
      status: 'unsupported',
      originalUrl: url,
      canonicalUrl: url,
      author: null,
      title: null,
      text: null,
      note: 'Threads does not currently provide an unauthenticated public post text retrieval endpoint.',
      failureReason:
        'Automatic Threads post retrieval is not supported without authorized API access. TruthLens never scrapes or bypasses platform login screens.',
      fallbackSuggestion:
        'Copy and paste the Threads post text into the "Paste Text" tab, or upload a screenshot in the "Upload Screenshot" tab.',
    };
  }

  const metaToken = process.env.META_ACCESS_TOKEN?.trim();
  if (!metaToken) {
    return {
      platform,
      platformLabel,
      status: 'unavailable',
      originalUrl: url,
      canonicalUrl: url,
      author: null,
      title: null,
      text: null,
      note: `${platformLabel} official Meta oEmbed requires a configured META_ACCESS_TOKEN on the server.`,
      failureReason: `Official ${platformLabel} oEmbed retrieval is unavailable because META_ACCESS_TOKEN is not configured. TruthLens does not scrape private pages or bypass login walls.`,
      fallbackSuggestion:
        'Paste the post caption or forwarded text directly below, or upload a screenshot of the post.',
    };
  }

  try {
    const endpoint = new URL(META_OEMBED_ENDPOINTS[platform]);
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('omitscript', 'true');

    const response = await safePublicFetch(endpoint.toString(), {
      timeoutMs: 8000,
      headers: {
        Authorization: `Bearer ${metaToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        platform,
        platformLabel,
        status: 'unavailable',
        originalUrl: url,
        canonicalUrl: url,
        author: null,
        title: null,
        text: null,
        note: `Meta oEmbed returned HTTP ${response.status}. The post may be private, deleted, or restricted.`,
        failureReason: `Official ${platformLabel} oEmbed did not return public content (HTTP ${response.status}).`,
        fallbackSuggestion:
          'Copy the caption text or take a screenshot of the post and submit it for multimodal verification.',
      };
    }

    const data = (await response.json()) as {
      author_name?: string;
      title?: string;
      provider_name?: string;
    };

    const retrievedTitle = data.title?.trim() || null;
    const author = data.author_name?.trim() || null;

    if (!retrievedTitle) {
      return {
        platform,
        platformLabel,
        status: 'partial',
        originalUrl: url,
        canonicalUrl: url,
        author,
        title: null,
        text: null,
        note: `Meta oEmbed identified the author (${author ?? 'unknown'}) but did not include full caption text or media transcripts.`,
        failureReason:
          'Meta oEmbed metadata only; full post caption or image text was not provided by the embed endpoint.',
        fallbackSuggestion:
          'Please paste the full caption or upload a screenshot of the post so all claims can be checked accurately.',
      };
    }

    return {
      platform,
      platformLabel,
      status: 'partial',
      originalUrl: url,
      canonicalUrl: url,
      author,
      title: retrievedTitle,
      text: author ? `Author: ${author}\nPost caption/title: ${retrievedTitle}` : retrievedTitle,
      note: 'Retrieved via official Meta oEmbed. Embed responses do not include comment threads, video audio, or text inside images.',
      failureReason: null,
      fallbackSuggestion:
        'If the post includes claims inside an image or video, also upload a screenshot or paste the transcript.',
    };
  } catch {
    return {
      platform,
      platformLabel,
      status: 'unavailable',
      originalUrl: url,
      canonicalUrl: url,
      author: null,
      title: null,
      text: null,
      note: `Could not reach Meta oEmbed for this ${platformLabel} link.`,
      failureReason: `Official ${platformLabel} retrieval failed due to a network or permission error.`,
      fallbackSuggestion:
        'Paste the post caption or upload a screenshot of the post instead.',
    };
  }
}
