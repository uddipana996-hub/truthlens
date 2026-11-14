import type { SocialExtractionResult } from '../../../src/shared/types.js';
import { safePublicFetch } from '../../utils/ssrf.js';

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractReadableWebContent(html: string): { title: string | null; text: string | null } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleMatch ? decodeEntities(titleMatch[1].replace(/\s+/g, ' ').trim()) : null;

  // Strip scripts, styles, noscript, svg, nav, footer
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');

  const articleMatch =
    cleaned.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i) ||
    cleaned.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);

  const scope = articleMatch ? articleMatch[1] : cleaned;

  // Collect meaningful paragraphs and headings
  const blocks: string[] = [];
  const blockRegex = /<(h1|h2|h3|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(scope)) !== null) {
    const plain = decodeEntities(match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (plain.length >= 25) {
      blocks.push(plain);
    }
    if (blocks.join('\n').length > 3500) break;
  }

  const excerpt = blocks.join('\n\n').slice(0, 3500).trim();
  return {
    title: rawTitle,
    text: excerpt.length >= 40 ? excerpt : null,
  };
}

export async function extractPublicWebPage(url: string): Promise<SocialExtractionResult> {
  try {
    const response = await safePublicFetch(url, {
      timeoutMs: 8000,
      maxBytes: 1_500_000,
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
      },
    });

    if (!response.ok) {
      return {
        platform: 'web',
        platformLabel: 'Public Web Page',
        status: 'unavailable',
        originalUrl: url,
        canonicalUrl: response.url || url,
        author: null,
        title: null,
        text: null,
        note: `The website returned HTTP ${response.status}.`,
        failureReason: `Unable to fetch article text (HTTP ${response.status}). The site may require sign-in or block automated requests.`,
        fallbackSuggestion:
          'Copy and paste the headline or article excerpt into the "Paste Text" tab, or upload a screenshot.',
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return {
        platform: 'web',
        platformLabel: 'Public Web Page',
        status: 'unsupported',
        originalUrl: url,
        canonicalUrl: response.url || url,
        author: null,
        title: null,
        text: null,
        note: `Unsupported content type (${contentType || 'unknown'}).`,
        failureReason: 'Only public HTML web pages and plain text documents can be extracted.',
        fallbackSuggestion: 'Paste the specific claim or upload a screenshot instead.',
      };
    }

    const rawBody = (await response.text()).slice(0, 500_000);
    const { title, text } = contentType.includes('text/plain')
      ? { title: null, text: rawBody.slice(0, 3500).trim() }
      : extractReadableWebContent(rawBody);

    if (!text && !title) {
      return {
        platform: 'web',
        platformLabel: 'Public Web Page',
        status: 'unavailable',
        originalUrl: url,
        canonicalUrl: response.url || url,
        author: null,
        title: null,
        text: null,
        note: 'No readable article text was found in the HTML response (the page may render dynamically via JavaScript or sit behind a paywall).',
        failureReason: 'Could not extract readable claim text from this webpage.',
        fallbackSuggestion: 'Copy and paste the headline or text excerpt directly.',
      };
    }

    return {
      platform: 'web',
      platformLabel: 'Public Web Page',
      status: text ? 'retrieved' : 'partial',
      originalUrl: url,
      canonicalUrl: response.url || url,
      author: null,
      title,
      text: title && text ? `${title}\n\n${text}` : text || title,
      note: text
        ? 'Extracted readable headline and article excerpt from public webpage.'
        : 'Extracted page title only; full article body was unavailable.',
      failureReason: null,
      fallbackSuggestion:
        'Review the extracted text below and edit or add context before analyzing.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return {
      platform: 'web',
      platformLabel: 'Public Web Page',
      status: 'unavailable',
      originalUrl: url,
      canonicalUrl: url,
      author: null,
      title: null,
      text: null,
      note: 'Public webpage retrieval failed.',
      failureReason: message,
      fallbackSuggestion: 'Paste the article headline or text manually, or upload a screenshot.',
    };
  }
}
