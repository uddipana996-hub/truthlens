import type { SocialExtractionResult } from '../../../src/shared/types.js';
import { safePublicFetch } from '../../utils/ssrf.js';

function extractTweetId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const match = parsed.pathname.match(/\/status(?:es)?\/(\d+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export async function extractXPost(url: string): Promise<SocialExtractionResult> {
  const tweetId = extractTweetId(url);
  const xBearerToken = process.env.X_BEARER_TOKEN?.trim();

  // 1. Official X API v2 when bearer token is configured
  if (tweetId && xBearerToken) {
    try {
      const apiUrl = new URL(`https://api.twitter.com/2/tweets/${tweetId}`);
      apiUrl.searchParams.set('expansions', 'author_id');
      apiUrl.searchParams.set('tweet.fields', 'created_at,text,note_tweet');
      apiUrl.searchParams.set('user.fields', 'name,username');

      const response = await safePublicFetch(apiUrl.toString(), {
        timeoutMs: 8000,
        headers: {
          Authorization: `Bearer ${xBearerToken}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          data?: { text?: string; note_tweet?: { text?: string }; created_at?: string };
          includes?: { users?: Array<{ name?: string; username?: string }> };
        };

        const postText = payload.data?.note_tweet?.text || payload.data?.text;
        const user = payload.includes?.users?.[0];
        if (postText) {
          return {
            platform: 'x',
            platformLabel: 'X (Twitter)',
            status: 'retrieved',
            originalUrl: url,
            canonicalUrl: url,
            author: user ? `${user.name ?? ''} (@${user.username ?? ''})`.trim() : null,
            title: null,
            text: postText,
            note: 'Retrieved via official X API v2.',
            failureReason: null,
            fallbackSuggestion:
              'If the post references an attached image or video, upload a screenshot to analyze embedded visuals too.',
          };
        }
      }
    } catch {
      // Fall through cleanly to public oEmbed check
    }
  }

  // 2. Public X oEmbed fallback (official unauthenticated embed endpoint)
  try {
    const oembedUrl = new URL('https://publish.twitter.com/oembed');
    oembedUrl.searchParams.set('url', url);
    oembedUrl.searchParams.set('omit_script', 'true');

    const response = await safePublicFetch(oembedUrl.toString(), {
      timeoutMs: 8000,
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data = (await response.json()) as {
        author_name?: string;
        html?: string;
        url?: string;
      };
      const cleanText = data.html ? stripHtmlTags(data.html) : '';
      if (cleanText.length > 5) {
        return {
          platform: 'x',
          platformLabel: 'X (Twitter)',
          status: 'partial',
          originalUrl: url,
          canonicalUrl: data.url ?? url,
          author: data.author_name ?? null,
          title: null,
          text: cleanText,
          note: 'Retrieved via X public oEmbed. Thread replies, quoted posts, and embedded image text are not included.',
          failureReason: null,
          fallbackSuggestion:
            'If the claim relies on an attached image, thread, or video, paste the full text or upload a screenshot.',
        };
      }
    }
  } catch {
    // Fall through cleanly
  }

  return {
    platform: 'x',
    platformLabel: 'X (Twitter)',
    status: 'unavailable',
    originalUrl: url,
    canonicalUrl: url,
    author: null,
    title: null,
    text: null,
    note: xBearerToken
      ? 'X API v2 and public oEmbed could not access this post (it may be private, age-gated, or deleted).'
      : 'X_BEARER_TOKEN is not configured and public oEmbed could not retrieve this post.',
    failureReason:
      'Could not retrieve post content from X without bypassing platform restrictions.',
    fallbackSuggestion:
      'Copy and paste the post text directly, or upload a screenshot of the post for multimodal extraction.',
  };
}
