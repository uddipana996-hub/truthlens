import type { SocialExtractionResult } from '../../../src/shared/types.js';
import { validatePublicUrl } from '../../utils/ssrf.js';
import { detectSocialPlatform } from './platformDetector.js';
import { extractMetaPost } from './metaAdapter.js';
import { extractXPost } from './xAdapter.js';
import { extractTikTokPost, extractYouTubePost } from './videoAdapters.js';
import { extractPublicWebPage } from './webAdapter.js';

export async function extractSocialPost(rawUrl: string): Promise<SocialExtractionResult> {
  const urlCheck = await validatePublicUrl(rawUrl);
  const { platform, platformLabel } = detectSocialPlatform(rawUrl);

  if (!urlCheck.ok) {
    return {
      platform,
      platformLabel,
      status: 'unavailable',
      originalUrl: rawUrl,
      canonicalUrl: rawUrl,
      author: null,
      title: null,
      text: null,
      note: 'URL rejected by security validation.',
      failureReason: urlCheck.reason,
      fallbackSuggestion:
        'Enter a valid public https:// URL, or paste the claim text / upload a screenshot instead.',
    };
  }

  const normalizedUrl = urlCheck.url.toString();

  switch (platform) {
    case 'instagram':
    case 'facebook':
    case 'threads':
      return extractMetaPost(normalizedUrl, platform);
    case 'x':
      return extractXPost(normalizedUrl);
    case 'youtube':
      return extractYouTubePost(normalizedUrl);
    case 'tiktok':
      return extractTikTokPost(normalizedUrl);
    case 'web':
      return extractPublicWebPage(normalizedUrl);
    default:
      return {
        platform: 'unknown',
        platformLabel: 'Unknown Source',
        status: 'unsupported',
        originalUrl: normalizedUrl,
        canonicalUrl: normalizedUrl,
        author: null,
        title: null,
        text: null,
        note: 'Platform could not be identified.',
        failureReason: 'Unsupported or unrecognized URL format.',
        fallbackSuggestion: 'Paste the claim text or upload a screenshot instead.',
      };
  }
}
