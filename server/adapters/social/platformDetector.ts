import type { SocialPlatform } from '../../../src/shared/types.js';

export function detectSocialPlatform(rawUrl: string): {
  platform: SocialPlatform;
  platformLabel: string;
} {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');

    if (host === 'instagram.com' || host.endsWith('.instagram.com') || host === 'instagr.am') {
      return { platform: 'instagram', platformLabel: 'Instagram' };
    }
    if (
      host === 'facebook.com' ||
      host.endsWith('.facebook.com') ||
      host === 'fb.watch' ||
      host === 'fb.com'
    ) {
      return { platform: 'facebook', platformLabel: 'Facebook' };
    }
    if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) {
      return { platform: 'x', platformLabel: 'X (Twitter)' };
    }
    if (host === 'threads.net' || host.endsWith('.threads.net') || host === 'threads.com') {
      return { platform: 'threads', platformLabel: 'Threads' };
    }
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com') || host === 'vm.tiktok.com') {
      return { platform: 'tiktok', platformLabel: 'TikTok' };
    }
    if (
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be'
    ) {
      return { platform: 'youtube', platformLabel: 'YouTube' };
    }
    return { platform: 'web', platformLabel: 'Public Web Page' };
  } catch {
    return { platform: 'unknown', platformLabel: 'Unknown Source' };
  }
}
