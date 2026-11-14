import type { SocialExtractionResult } from '../../../src/shared/types.js';
import { safePublicFetch } from '../../utils/ssrf.js';

export async function extractYouTubePost(url: string): Promise<SocialExtractionResult> {
  try {
    const endpoint = new URL('https://www.youtube.com/oembed');
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('format', 'json');

    const response = await safePublicFetch(endpoint.toString(), {
      timeoutMs: 8000,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return {
        platform: 'youtube',
        platformLabel: 'YouTube',
        status: 'unavailable',
        originalUrl: url,
        canonicalUrl: url,
        author: null,
        title: null,
        text: null,
        note: `YouTube oEmbed returned HTTP ${response.status}. The video may be private or unlisted.`,
        failureReason: `Unable to retrieve public YouTube metadata (HTTP ${response.status}).`,
        fallbackSuggestion:
          'Paste the video title, description, or transcript into the text box, or upload a screenshot of the video claim.',
      };
    }

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
    };

    const title = data.title?.trim() || null;
    const author = data.author_name?.trim() || null;

    if (!title) {
      return {
        platform: 'youtube',
        platformLabel: 'YouTube',
        status: 'unavailable',
        originalUrl: url,
        canonicalUrl: url,
        author,
        title: null,
        text: null,
        note: 'YouTube oEmbed did not return a video title.',
        failureReason: 'Insufficient public metadata returned from YouTube oEmbed.',
        fallbackSuggestion:
          'Paste the video claim or transcript manually, or upload a keyframe screenshot.',
      };
    }

    return {
      platform: 'youtube',
      platformLabel: 'YouTube',
      status: 'partial',
      originalUrl: url,
      canonicalUrl: url,
      author,
      title,
      text: author ? `YouTube video by ${author}: "${title}"` : `YouTube video: "${title}"`,
      note: 'Retrieved video title and channel via official YouTube oEmbed. Spoken video audio and full transcripts are not automatically fetched.',
      failureReason: null,
      fallbackSuggestion:
        'For claims spoken inside the video, paste the relevant transcript or captions in the notes box below before running analysis.',
    };
  } catch {
    return {
      platform: 'youtube',
      platformLabel: 'YouTube',
      status: 'unavailable',
      originalUrl: url,
      canonicalUrl: url,
      author: null,
      title: null,
      text: null,
      note: 'Could not connect to YouTube oEmbed.',
      failureReason: 'Network or timeout error while querying YouTube oEmbed.',
      fallbackSuggestion:
        'Paste the video title, transcript, or a screenshot of the claim instead.',
    };
  }
}

export async function extractTikTokPost(url: string): Promise<SocialExtractionResult> {
  try {
    const endpoint = new URL('https://www.tiktok.com/oembed');
    endpoint.searchParams.set('url', url);

    const response = await safePublicFetch(endpoint.toString(), {
      timeoutMs: 8000,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return {
        platform: 'tiktok',
        platformLabel: 'TikTok',
        status: 'unavailable',
        originalUrl: url,
        canonicalUrl: url,
        author: null,
        title: null,
        text: null,
        note: `TikTok oEmbed returned HTTP ${response.status}.`,
        failureReason: `Public TikTok oEmbed could not retrieve this post (HTTP ${response.status}).`,
        fallbackSuggestion:
          'Paste the video caption or spoken claim, or upload a screenshot/keyframe.',
      };
    }

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
    };

    const title = data.title?.trim() || null;
    const author = data.author_name?.trim() || null;

    if (!title) {
      return {
        platform: 'tiktok',
        platformLabel: 'TikTok',
        status: 'unavailable',
        originalUrl: url,
        canonicalUrl: url,
        author,
        title: null,
        text: null,
        note: 'TikTok oEmbed did not return caption text.',
        failureReason: 'No caption text returned by TikTok oEmbed.',
        fallbackSuggestion: 'Paste the video caption or upload a screenshot instead.',
      };
    }

    return {
      platform: 'tiktok',
      platformLabel: 'TikTok',
      status: 'partial',
      originalUrl: url,
      canonicalUrl: url,
      author,
      title,
      text: author ? `TikTok post by ${author}: "${title}"` : `TikTok caption: "${title}"`,
      note: 'Retrieved caption metadata via official TikTok oEmbed. Video audio and on-screen overlays are not transcribed automatically.',
      failureReason: null,
      fallbackSuggestion:
        'Paste any on-screen text or spoken claims, or upload a screenshot keyframe.',
    };
  } catch {
    return {
      platform: 'tiktok',
      platformLabel: 'TikTok',
      status: 'unavailable',
      originalUrl: url,
      canonicalUrl: url,
      author: null,
      title: null,
      text: null,
      note: 'Could not reach TikTok oEmbed.',
      failureReason: 'Network or timeout error while querying TikTok oEmbed.',
      fallbackSuggestion: 'Paste the caption text or upload a screenshot.',
    };
  }
}
