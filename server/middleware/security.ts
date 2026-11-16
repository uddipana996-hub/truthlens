import type { NextFunction, Request, Response } from 'express';

/**
 * Sets protective HTTP headers on all responses without breaking Vite dev or iframe preview.
 */
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
}

/**
 * Prevents caching of API responses (and ensures user-supplied keys/claims are never cached).
 */
export function noStoreApiMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
}

interface RateBucket {
  timestamps: number[];
}

/**
 * Lightweight in-memory sliding-window rate limiter per client IP.
 */
export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const buckets = new Map<string, RateBucket>();

  // Periodically prune stale buckets to prevent unbounded memory growth
  const pruneTimer = setInterval(() => {
    const cutoff = Date.now() - options.windowMs;
    for (const [key, bucket] of buckets.entries()) {
      bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
      if (bucket.timestamps.length === 0) {
        buckets.delete(key);
      }
    }
  }, Math.max(60_000, options.windowMs));
  pruneTimer.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
      req.ip ||
      'unknown';

    const now = Date.now();
    const cutoff = now - options.windowMs;
    const bucket = buckets.get(clientIp) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

    if (bucket.timestamps.length >= options.maxRequests) {
      res.status(429).json({
        status: 'error',
        message: 'Too many requests. Please wait a moment before trying again.',
      });
      return;
    }

    bucket.timestamps.push(now);
    buckets.set(clientIp, bucket);
    next();
  };
}

/**
 * Masks any secret-looking query params or strings before safe operational logging.
 */
export function sanitizeErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'Unknown error');
  // Never leak AIza..., AQ..., ya29..., 1//..., JWTs, Bearer tokens, or query key params in error messages or logs
  return raw
    .replace(/AIza[0-9A-Za-z_-]{16,}/g, '[REDACTED_KEY]')
    .replace(/AQ\.[0-9A-Za-z._-]{10,}/g, '[REDACTED_TOKEN]')
    .replace(/ya29\.[0-9A-Za-z._-]{10,}/g, '[REDACTED_TOKEN]')
    .replace(/1\/\/[0-9A-Za-z._-]{10,}/g, '[REDACTED_TOKEN]')
    .replace(/eyJ[0-9A-Za-z_-]{8,}\.[0-9A-Za-z._-]{8,}(?:\.[0-9A-Za-z._-]+)?/g, '[REDACTED_JWT]')
    .replace(/Bearer\s+[0-9A-Za-z._/-]+/gi, 'Bearer [REDACTED]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED]')
    .slice(0, 400);
}
