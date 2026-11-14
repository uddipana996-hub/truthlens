import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import type { GenerateContentResponse } from '@google/genai';
import { createApiApp } from '../server/app.js';
import { extractSocialPost } from '../server/adapters/social/index.js';
import { detectSocialPlatform } from '../server/adapters/social/platformDetector.js';
import {
  extractVerifiedGroundingSources,
  filterValidSourceIds,
  validateAndBuildSources,
} from '../server/services/citationValidator.js';
import { runFactCheckPipeline } from '../server/services/factCheckPipeline.js';
import { resolveActiveApiKey } from '../server/services/geminiClient.js';
import { isPrivateOrReservedIp, validatePublicUrl } from '../server/utils/ssrf.js';
import { analyzeRequestSchema, factCheckResponseSchema } from '../src/shared/schemas.js';

describe('TRUTHLENS AI — Security, Ingestion & Citation Unit Tests', () => {
  it('blocks private, loopback, metadata, and non-HTTP URLs (SSRF protection)', async () => {
    assert.equal(isPrivateOrReservedIp('127.0.0.1'), true);
    assert.equal(isPrivateOrReservedIp('10.0.0.5'), true);
    assert.equal(isPrivateOrReservedIp('169.254.169.254'), true);
    assert.equal(isPrivateOrReservedIp('192.168.1.1'), true);
    assert.equal(isPrivateOrReservedIp('::1'), true);
    assert.equal(isPrivateOrReservedIp('8.8.8.8'), false);

    const localhostCheck = await validatePublicUrl('http://localhost:3000/api/health');
    assert.equal(localhostCheck.ok, false);

    const metadataCheck = await validatePublicUrl('http://169.254.169.254/latest/meta-data/');
    assert.equal(metadataCheck.ok, false);

    const fileCheck = await validatePublicUrl('file:///etc/passwd');
    assert.equal(fileCheck.ok, false);

    const credsCheck = await validatePublicUrl('https://user:pass@example.com/post');
    assert.equal(credsCheck.ok, false);
  });

  it('detects supported social media platforms accurately', () => {
    assert.equal(detectSocialPlatform('https://www.instagram.com/p/ABC123/').platform, 'instagram');
    assert.equal(detectSocialPlatform('https://www.facebook.com/share/p/123').platform, 'facebook');
    assert.equal(detectSocialPlatform('https://x.com/user/status/123456').platform, 'x');
    assert.equal(detectSocialPlatform('https://twitter.com/user/status/123456').platform, 'x');
    assert.equal(detectSocialPlatform('https://www.threads.net/@user/post/123').platform, 'threads');
    assert.equal(detectSocialPlatform('https://www.tiktok.com/@user/video/123').platform, 'tiktok');
    assert.equal(detectSocialPlatform('https://youtu.be/dQw4w9WgXcQ').platform, 'youtube');
    assert.equal(detectSocialPlatform('https://www.reuters.com/world/story').platform, 'web');
  });

  it('returns honest fallback guidance for Threads and unconfigured Meta URLs', async () => {
    const threadsResult = await extractSocialPost('https://www.threads.net/@example/post/123');
    assert.equal(threadsResult.platform, 'threads');
    assert.equal(threadsResult.status, 'unsupported');
    assert.equal(threadsResult.text, null);
    assert.ok(threadsResult.fallbackSuggestion.length > 10);

    const originalMeta = process.env.META_ACCESS_TOKEN;
    delete process.env.META_ACCESS_TOKEN;
    try {
      const igResult = await extractSocialPost('https://www.instagram.com/p/ABC123/');
      assert.equal(igResult.platform, 'instagram');
      assert.equal(igResult.status, 'unavailable');
      assert.equal(igResult.text, null);
      assert.ok(igResult.failureReason?.includes('META_ACCESS_TOKEN'));
    } finally {
      if (originalMeta) process.env.META_ACCESS_TOKEN = originalMeta;
    }
  });

  it('extracts citations strictly from groundingChunks and rejects hallucinated source IDs', () => {
    const mockResponse = {
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'https://www.who.int/news-room/fact-sheets', title: 'WHO Fact Sheets' } },
              { web: { uri: 'https://www.who.int/news-room/fact-sheets/', title: 'Duplicate Trailing Slash' } },
              { web: { uri: 'https://www.cdc.gov/example', title: 'CDC Guidance' } },
              { web: { uri: 'javascript:alert(1)', title: 'Malicious URI' } },
            ],
          },
        },
      ],
    } as unknown as GenerateContentResponse;

    const retrievedAt = '2026-11-14T18:00:00.000Z';
    const records = extractVerifiedGroundingSources([mockResponse], retrievedAt);
    assert.equal(records.length, 2);
    assert.equal(records[0].id, 'SRC-1');
    assert.equal(records[1].id, 'SRC-2');

    const { validSourceIds, sources } = validateAndBuildSources(records, [
      {
        sourceId: 'SRC-1',
        publisher: 'World Health Organization',
        publishedAt: '2025-05-01',
        relevance: 'Official WHO reference',
        stance: 'CONTRADICTS',
      },
      {
        sourceId: 'SRC-999-HALLUCINATED',
        publisher: 'Fake Journal',
        publishedAt: '2026-01-01',
        relevance: 'Invented citation',
        stance: 'SUPPORTS',
      },
    ]);

    assert.equal(sources.length, 2);
    assert.equal(validSourceIds.has('SRC-999-HALLUCINATED'), false);
    assert.deepEqual(filterValidSourceIds(['SRC-1', 'SRC-FAKE', 'SRC-2', 'SRC-1'], validSourceIds), [
      'SRC-1',
      'SRC-2',
    ]);
  });

  it('validates user-supplied key precedence and rejects unsupported image formats', () => {
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'server_env_placeholder_key';
    try {
      const userTakesPrecedence = resolveActiveApiKey('user_session_key_12345');
      assert.equal(userTakesPrecedence?.source, 'user');
      assert.equal(userTakesPrecedence?.apiKey, 'user_session_key_12345');

      const fallsBackToServer = resolveActiveApiKey(undefined);
      assert.equal(fallsBackToServer?.source, 'server');
    } finally {
      if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = originalKey;
    }

    const badMime = analyzeRequestSchema.safeParse({
      submissionType: 'image',
      category: 'General',
      imageData: {
        mimeType: 'image/gif',
        base64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      },
    });
    assert.equal(badMime.success, false);
  });
});

describe('TRUTHLENS AI — Express API Route Tests', () => {
  let server: http.Server;
  let baseUrl = '';

  before(async () => {
    const app = createApiApp();
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('GET /api/health returns status without exposing secrets', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.serverKeyConfigured, 'boolean');
    assert.equal('apiKey' in body, false);
    assert.equal('GEMINI_API_KEY' in body, false);
  });

  it('POST /api/test-key rejects malformed keys cleanly without echoing the key', async () => {
    const res = await fetch(`${baseUrl}/api/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'bad_k' }),
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { success: boolean; message: string };
    assert.equal(body.success, false);
    assert.equal(JSON.stringify(body).includes('bad_k'), false);
  });

  it('POST /api/extract-post rejects SSRF URLs', async () => {
    const res = await fetch(`${baseUrl}/api/extract-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://127.0.0.1:3000/api/health' }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; failureReason: string };
    assert.equal(body.status, 'unavailable');
    assert.ok(body.failureReason.length > 5);
  });

  it('POST /api/analyze returns clear MISSING_API_KEY error when neither key is available', async () => {
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionType: 'text',
          text: 'The Eiffel Tower is in Paris, France.',
          category: 'General',
        }),
      });
      assert.equal(res.status, 400);
      const body = (await res.json()) as { code: string; message: string };
      assert.equal(body.code, 'MISSING_API_KEY');
    } finally {
      if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
    }
  });

  it('POST /api/analyze handles malformed JSON safely', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { message: string };
    assert.ok(body.message.toLowerCase().includes('malformed'));
  });
});

const liveApiKey = process.env.GEMINI_API_KEY?.trim();

describe(
  'TRUTHLENS AI — Live Gemini + Google Search Grounding Integration',
  { skip: !liveApiKey },
  () => {
    it('runs multi-claim verification with live Google Search grounding and returns validated schema', async () => {
      const result = await runFactCheckPipeline({
        apiKey: liveApiKey!,
        submissionType: 'text',
        submittedText:
          'Drinking 4 liters of lemon water daily cures chronic kidney disease in 14 days, and the World Health Organization recommends replacing prescribed blood pressure medicine with citrus juice.',
        sourceUrl: null,
        detectedPlatform: 'unknown',
        extractionStatus: 'user_provided',
        category: 'Health',
      });

      const parsed = factCheckResponseSchema.safeParse(result);
      assert.equal(parsed.success, true);
      assert.ok(result.claims.length >= 1);
      assert.ok(['CONTRADICTED', 'MISLEADING', 'NEEDS_VERIFICATION'].includes(result.assessment));
      if (result.sources.length > 0) {
        for (const src of result.sources) {
          assert.ok(src.url.startsWith('http'));
        }
      }
    });
  }
);
