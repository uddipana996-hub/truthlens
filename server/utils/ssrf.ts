import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
  '169.254.169.254',
]);

/**
 * Checks whether an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * carrier-grade NAT, or otherwise non-routable internal address space.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const cleaned = ip.replace(/^\[|\]$/g, '').split('%')[0];
  const version = net.isIP(cleaned);
  if (version === 0) return true;

  if (version === 4) {
    const parts = cleaned.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return true;
    }
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  // IPv6
  const lower = cleaned.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('fe80:')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
  if (lower.startsWith('::ffff:')) {
    const mappedV4 = lower.slice('::ffff:'.length);
    return isPrivateOrReservedIp(mappedV4);
  }
  return false;
}

export interface ValidatedUrlResult {
  ok: true;
  url: URL;
}

export interface InvalidUrlResult {
  ok: false;
  reason: string;
}

/**
 * Validates that a user-submitted URL is well-formed HTTP/HTTPS, contains no embedded
 * credentials, and does not target local or private network infrastructure (SSRF protection).
 */
export async function validatePublicUrl(
  rawUrl: string,
  options?: { skipDnsLookup?: boolean }
): Promise<ValidatedUrlResult | InvalidUrlResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: 'Invalid URL syntax. Include https:// at the start of the URL.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: 'Only HTTP and HTTPS URLs are supported.' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'URLs containing embedded credentials are not allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { ok: false, reason: 'Local or internal network addresses cannot be accessed.' };
  }

  if (net.isIP(hostname) !== 0) {
    if (isPrivateOrReservedIp(hostname)) {
      return { ok: false, reason: 'Private or reserved IP addresses cannot be accessed.' };
    }
    return { ok: true, url: parsed };
  }

  if (!options?.skipDnsLookup) {
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      if (addresses.length === 0) {
        return { ok: false, reason: 'Could not resolve the domain name for this URL.' };
      }
      for (const addr of addresses) {
        if (isPrivateOrReservedIp(addr.address)) {
          return { ok: false, reason: 'URL resolves to a restricted private or internal network address.' };
        }
      }
    } catch {
      return { ok: false, reason: 'Could not resolve the target domain name.' };
    }
  }

  return { ok: true, url: parsed };
}

/**
 * Safe fetch wrapper with timeout, redirect SSRF checks, and max response byte limit.
 */
export async function safePublicFetch(
  targetUrl: string,
  init: RequestInit & { timeoutMs?: number; maxBytes?: number } = {}
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? 8000;
  const maxBytes = init.maxBytes ?? 1_500_000;
  let currentUrl = targetUrl;

  for (let hops = 0; hops < 4; hops++) {
    const check = await validatePublicUrl(currentUrl);
    if (!check.ok) {
      throw new Error(check.reason);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(check.url.toString(), {
        ...init,
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'TruthLensAI-FactCheckBot/1.0 (+public-content-only)',
          ...(init.headers ?? {}),
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Redirect response missing Location header.');
        }
        currentUrl = new URL(location, check.url).toString();
        continue;
      }

      const contentLength = Number(response.headers.get('content-length') ?? '0');
      if (contentLength > maxBytes) {
        throw new Error('Remote response exceeded maximum allowed size.');
      }

      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('Too many redirects while fetching public URL.');
}
