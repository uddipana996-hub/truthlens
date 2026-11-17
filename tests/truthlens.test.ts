import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import type { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import { createApiApp } from '../server/app.js';
import { extractSocialPost } from '../server/adapters/social/index.js';
import { detectSocialPlatform } from '../server/adapters/social/platformDetector.js';
import {
  extractVerifiedGroundingSources,
  filterValidSourceIds,
  validateAndBuildSources,
} from '../server/services/citationValidator.js';
import { runFactCheckPipeline } from '../server/services/factCheckPipeline.js';
import {
  classifyGeminiError,
  resolveActiveApiKey,
  resolveGeminiModel,
  testGeminiKey,
} from '../server/services/geminiClient.js';
import { sanitizeErrorMessage } from '../server/middleware/security.js';
import { isPrivateOrReservedIp, validatePublicUrl } from '../server/utils/ssrf.js';
import { analyzeRequestSchema, factCheckResponseSchema } from '../src/shared/schemas.js';

describe('TruthLens — Security, Ingestion & Citation Unit Tests', () => {
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

  it('masks secrets cleanly and validates key resolution priority', () => {
    const masked = sanitizeErrorMessage(
      new Error(
        'Failed for AIzaSyDummySecretValue1234567890, AQ.Ab8RN6SecretToken12345, ya29.a0SecretAccessToken123, and 1//0gRefreshSecretToken999'
      )
    );
    assert.equal(masked.includes('AIzaSyDummySecretValue'), false);
    assert.equal(masked.includes('AQ.Ab8RN6SecretToken'), false);
    assert.equal(masked.includes('ya29.a0SecretAccessToken'), false);
    assert.equal(masked.includes('1//0gRefreshSecretToken'), false);

    const prevModel = process.env.GEMINI_MODEL;
    delete process.env.GEMINI_MODEL;
    assert.equal(resolveGeminiModel(), 'gemini-4-hydrogen');
    process.env.GEMINI_MODEL = 'gemini-custom-test';
    assert.equal(resolveGeminiModel(), 'gemini-custom-test');
    if (prevModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = prevModel;

    assert.equal(classifyGeminiError(new Error('API_KEY_INVALID'), { keyCandidate: 'AIzaTestKey_1234567890' }).httpStatus, 401);

    const ya29On400 = classifyGeminiError(new Error('400 INVALID_ARGUMENT: API_KEY_INVALID'), {
      keyCandidate: 'ya29.a0ExampleOAuthToken123456',
    });
    assert.equal(ya29On400.code, 'invalid_key');
    assert.equal(ya29On400.httpStatus, 401);
    assert.match(ya29On400.message, /OAuth access tokens/i);
    assert.match(ya29On400.message, /aistudio\.google\.com\/apikey/i);

    const bearerWrapped = classifyGeminiError(new Error('401 UNAUTHENTICATED'), {
      keyCandidate: 'Bearer ya29.a0WrappedToken123456',
    });
    assert.equal(bearerWrapped.code, 'invalid_key');
    assert.match(bearerWrapped.message, /OAuth access tokens/i);

    const aqUnsupportedType = classifyGeminiError(
      new Error('401 UNAUTHENTICATED: API key not valid. ACCESS_TOKEN_TYPE_UNSUPPORTED'),
      { keyCandidate: 'AQ.Ab8RN6ExampleKey_1234567890' }
    );
    assert.equal(aqUnsupportedType.code, 'invalid_key');
    assert.equal(aqUnsupportedType.httpStatus, 401);
    assert.match(aqUnsupportedType.message, /Generative Language API/i);

    assert.equal(
      classifyGeminiError(new Error('PERMISSION_DENIED 403'), { keyCandidate: 'AIzaTestKey_1234567890' }).httpStatus,
      403
    );
    assert.equal(
      classifyGeminiError(new Error('404 NOT_FOUND'), { keyCandidate: 'AIzaTestKey_1234567890' }).httpStatus,
      404
    );
    assert.equal(
      classifyGeminiError(new Error('RESOURCE_EXHAUSTED 429'), { keyCandidate: 'AIzaTestKey_1234567890' }).httpStatus,
      429
    );
    assert.equal(
      classifyGeminiError(new Error('timed out after 20000ms'), { keyCandidate: 'AIzaTestKey_1234567890' }).httpStatus,
      504
    );

    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'AIzaServerEnvironmentPlaceholder1234567';
    try {
      const userTakesPrecedence = resolveActiveApiKey('AIzaUserSessionKey1234567890');
      assert.equal(userTakesPrecedence?.source, 'user');
      assert.equal(userTakesPrecedence?.apiKey, 'AIzaUserSessionKey1234567890');

      const fallsBackToServer = resolveActiveApiKey(undefined);
      assert.equal(fallsBackToServer?.source, 'server');
      assert.equal(fallsBackToServer?.apiKey, 'AIzaServerEnvironmentPlaceholder1234567');

      // AQ. server key is also accepted when configured
      process.env.GEMINI_API_KEY = 'AQ.Ab8RN6ServerAqKey1234567890';
      assert.equal(resolveActiveApiKey(undefined)?.source, 'server');

      // OAuth access token on server is rejected cleanly
      process.env.GEMINI_API_KEY = 'ya29.a0InvalidServerOAuth123456';
      assert.equal(resolveActiveApiKey(undefined), null);

      process.env.GEMINI_API_KEY = 'MY_GEMINI_API_KEY';
      assert.equal(resolveActiveApiKey(undefined), null);
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

describe('TruthLens — 10 Gemini API Integration & Route Scenarios (AIza + AQ.)', () => {
  const VALID_USER_KEY = 'AIzaValidUserKey_0123456789ABCDEF';
  const VALID_AQ_KEY = 'AQ.Ab8RN6ValidAqKey_0123456789ABCDEF';
  const VALID_SERVER_KEY = 'AIzaValidServerKey_0123456789ABCDEF';
  const INVALID_KEY = 'AIzaInvalidKey_0123456789ABCDEF';
  const RESTRICTED_AQ_KEY = 'AQ.Ab8RN6RestrictedKey_0123456789ABCDEF';
  const YA29_OAUTH_TOKEN = 'ya29.a0ExampleOAuthToken0123456789ABCDEF';
  const QUOTA_KEY = 'AIzaQuotaExceededKey_0123456789ABCDEF';

  function buildStubGeminiClient(apiKey: string, modelOverride?: string): GoogleGenAI {
    return {
      models: {
        async generateContent(params: { model: string; contents: unknown }) {
          if (apiKey === RESTRICTED_AQ_KEY) {
            throw new Error(
              '401 UNAUTHENTICATED: API key not valid. ACCESS_TOKEN_TYPE_UNSUPPORTED'
            );
          }
          if (apiKey === INVALID_KEY) {
            throw new Error('400 INVALID_ARGUMENT: API_KEY_INVALID');
          }
          if (apiKey === QUOTA_KEY) {
            throw new Error(
              '429 RESOURCE_EXHAUSTED: You exceeded your current quota, please check your plan and billing.'
            );
          }
          const targetModel = modelOverride || params.model;
          if (targetModel.includes('unsupported')) {
            throw new Error(`404 NOT_FOUND: models/${targetModel} is not found for API version`);
          }
          // Simulate public AIza key where gemini-4-hydrogen is 404 and falls back cleanly to gemini-2.5-flash
          if (apiKey === VALID_USER_KEY && targetModel === 'gemini-4-hydrogen') {
            throw new Error('404 NOT_FOUND: models/gemini-4-hydrogen is not found for API version');
          }

          if (params.contents === 'Reply with OK.') {
            return { text: 'OK' } as unknown as GenerateContentResponse;
          }

          const contentStr = String(params.contents);
          if (contentStr.includes('Verified Source Catalog')) {
            return {
              text: JSON.stringify({
                assessment: 'CONTRADICTED',
                confidence: {
                  level: 'HIGH',
                  reason: 'Authoritative primary medical reference contradicts the claim.',
                },
                claimSummary: 'Claim that lemon water cures chronic kidney disease in 14 days.',
                overallExplanation:
                  'Clinical medical references confirm lemon water does not cure chronic kidney disease.',
                keyFindings: [
                  'Hydration supports general health but does not cure established kidney disease.',
                ],
                claims: [
                  {
                    text: 'Lemon water cures chronic kidney disease in 14 days.',
                    assessment: 'CONTRADICTED',
                    explanation: 'No clinical evidence supports curing kidney disease with lemon water.',
                    supportingSourceIds: [],
                    contradictingSourceIds: ['SRC-1'],
                    missingContext: ['Patients with advanced kidney disease may have fluid limits.'],
                  },
                ],
                supportingEvidence: [],
                contradictingEvidence: ['Medical consensus confirms chronic kidney disease requires clinical management.'],
                missingContext: ['Fluid targets depend on kidney function stage.'],
                questionsToInvestigate: ['What medical institution published the cited claim?'],
                recommendedActions: ['Consult a licensed physician before altering treatment.'],
                sourceAnnotations: [
                  {
                    sourceId: 'SRC-1',
                    publisher: 'National Institute of Diabetes and Digestive and Kidney Diseases',
                    publishedAt: '2025-02-10',
                    relevance: 'Authoritative kidney disease overview.',
                    stance: 'CONTRADICTS',
                  },
                ],
                limitations: ['Check with a clinician for individual medical guidance.'],
              }),
            } as unknown as GenerateContentResponse;
          }

          return {
            text: 'Medical references from NIDDK state chronic kidney disease cannot be cured by lemon water.',
            candidates: [
              {
                groundingMetadata: {
                  groundingChunks: [
                    {
                      web: {
                        uri: 'https://www.niddk.nih.gov/health-information/kidney-disease',
                        title: 'Chronic Kidney Disease Management',
                      },
                    },
                  ],
                },
              },
            ],
          } as unknown as GenerateContentResponse;
        },
        async list() {
          async function* emptyGen() {
            if (apiKey !== VALID_USER_KEY) {
              yield { name: 'models/gemini-4-hydrogen', supportedActions: ['generateContent'] };
            }
            yield { name: 'models/gemini-2.5-flash', supportedActions: ['generateContent'] };
          }
          return emptyGen();
        },
      },
    } as unknown as GoogleGenAI;
  }

  let server: http.Server;
  let baseUrl = '';
  let savedServerEnvKey: string | undefined;

  before(async () => {
    savedServerEnvKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = VALID_SERVER_KEY;

    const app = createApiApp({
      testKeyFn: (key) =>
        testGeminiKey(key, {
          client: buildStubGeminiClient(key),
        }),
      runPipelineFn: (input) =>
        runFactCheckPipeline({
          ...input,
          client: buildStubGeminiClient(input.apiKey),
        }),
    });

    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (savedServerEnvKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = savedServerEnvKey;

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('TEST 1: Valid AIza and AQ. Gemini API key authentication succeeds with automatic model discovery', async () => {
    const aizaRes = await fetch(`${baseUrl}/api/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: VALID_USER_KEY }),
    });
    assert.equal(aizaRes.status, 200);
    const aizaBody = (await aizaRes.json()) as { success: boolean; connectionStatus: string; activeModel: string };
    assert.equal(aizaBody.success, true);
    assert.equal(aizaBody.connectionStatus, 'connected');
    assert.equal(aizaBody.activeModel, 'gemini-2.5-flash');

    const aqRes = await fetch(`${baseUrl}/api/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: VALID_AQ_KEY }),
    });
    assert.equal(aqRes.status, 200);
    const aqBody = (await aqRes.json()) as { success: boolean; connectionStatus: string; activeModel: string };
    assert.equal(aqBody.success, true);
    assert.equal(aqBody.connectionStatus, 'connected');
    assert.equal(aqBody.activeModel, 'gemini-4-hydrogen');
  });

  it('TEST 2: Invalid API key returns HTTP 401 authentication error without leaking key', async () => {
    const res = await fetch(`${baseUrl}/api/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: INVALID_KEY }),
    });
    assert.equal(res.status, 401);
    const body = (await res.json()) as { success: boolean; connectionStatus: string; message: string };
    assert.equal(body.success, false);
    assert.equal(body.connectionStatus, 'invalid_key');
    assert.equal(JSON.stringify(body).includes(INVALID_KEY), false);
  });

  it('TEST 3: OAuth token (ya29) and unpermitted AQ credential are rejected with clear guidance', async () => {
    const ya29Res = await fetch(`${baseUrl}/api/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: YA29_OAUTH_TOKEN }),
    });
    assert.equal(ya29Res.status, 401);
    const ya29Body = (await ya29Res.json()) as { success: boolean; connectionStatus: string; message: string };
    assert.equal(ya29Body.success, false);
    assert.equal(ya29Body.connectionStatus, 'invalid_key');
    assert.ok(ya29Body.message.includes('Google AI Studio'));
    assert.equal(JSON.stringify(ya29Body).includes(YA29_OAUTH_TOKEN), false);

    const restrictedRes = await fetch(`${baseUrl}/api/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: RESTRICTED_AQ_KEY }),
    });
    assert.equal(restrictedRes.status, 401);
    const restrictedBody = (await restrictedRes.json()) as {
      success: boolean;
      connectionStatus: string;
      message: string;
    };
    assert.equal(restrictedBody.success, false);
    assert.equal(restrictedBody.connectionStatus, 'invalid_key');
    assert.ok(restrictedBody.message.includes('Generative Language API'));
    assert.equal(JSON.stringify(restrictedBody).includes(RESTRICTED_AQ_KEY), false);
  });

  it('TEST 4: No user key falls back to valid server environment key', async () => {
    const healthRes = await fetch(`${baseUrl}/api/health?verify=1&refresh=1`);
    assert.equal(healthRes.status, 200);
    const healthBody = (await healthRes.json()) as Record<string, unknown>;
    assert.equal(healthBody.serverKeyConfigured, true);
    assert.equal(healthBody.serverKeyStatus, 'verified');

    const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionType: 'text',
        text: 'Drinking lemon water cures chronic kidney disease in 14 days.',
        category: 'Health',
      }),
    });
    assert.equal(analyzeRes.status, 200);
    const analyzeBody = (await analyzeRes.json()) as Record<string, unknown>;
    assert.equal(analyzeBody.status, 'success');
  });

  it('TEST 5: When both keys are available, valid user key takes priority', async () => {
    let seenKey = '';
    const customApp = createApiApp({
      runPipelineFn: async (input) => {
        seenKey = input.apiKey;
        return runFactCheckPipeline({ ...input, client: buildStubGeminiClient(input.apiKey) });
      },
    });
    const tmpServer = customApp.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => tmpServer.once('listening', () => resolve()));
    const addr = tmpServer.address() as { port: number };
    try {
      const res = await fetch(`http://127.0.0.1:${addr.port}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionType: 'text',
          text: 'Lemon water cures kidney disease.',
          category: 'Health',
          apiKey: VALID_USER_KEY,
        }),
      });
      assert.equal(res.status, 200);
      assert.equal(seenKey, VALID_USER_KEY);
    } finally {
      await new Promise<void>((resolve) => tmpServer.close(() => resolve()));
    }
  });

  it('TEST 6: Invalid user key or OAuth token with valid server key displays user-key error without silently switching', async () => {
    const resInvalid = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionType: 'text',
        text: 'Lemon water cures kidney disease.',
        category: 'Health',
        apiKey: INVALID_KEY,
      }),
    });
    assert.equal(resInvalid.status, 401);
    const bodyInvalid = (await resInvalid.json()) as {
      code: string;
      keySource: string;
      message: string;
    };
    assert.equal(bodyInvalid.code, 'INVALID_KEY');
    assert.equal(bodyInvalid.keySource, 'user');
    assert.ok(bodyInvalid.message.includes('User API key error'));

    const resOAuth = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionType: 'text',
        text: 'Lemon water cures kidney disease.',
        category: 'Health',
        apiKey: YA29_OAUTH_TOKEN,
      }),
    });
    assert.equal(resOAuth.status, 401);
    const bodyOAuth = (await resOAuth.json()) as {
      code: string;
      keySource: string;
      message: string;
    };
    assert.equal(bodyOAuth.code, 'INVALID_KEY');
    assert.equal(bodyOAuth.keySource, 'user');
    assert.ok(bodyOAuth.message.includes('OAuth access tokens'));
  });

  it('TEST 7: API quota exceeded returns clear HTTP 429 quota error', async () => {
    const res = await fetch(`${baseUrl}/api/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: QUOTA_KEY }),
    });
    assert.equal(res.status, 429);
    const body = (await res.json()) as { success: boolean; connectionStatus: string; message: string };
    assert.equal(body.success, false);
    assert.equal(body.connectionStatus, 'quota_exceeded');
    assert.ok(body.message.toLowerCase().includes('quota'));
  });

  it('TEST 8: Unsupported model returns clear HTTP 404 model_unavailable error', async () => {
    const prevModel = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = 'gemini-unsupported-99';
    try {
      const result = await testGeminiKey(VALID_USER_KEY, {
        client: buildStubGeminiClient(VALID_USER_KEY, 'gemini-unsupported-99'),
      });
      assert.equal(result.success, false);
      assert.equal(result.connectionStatus, 'model_unavailable');
      assert.ok(result.message.includes('gemini-unsupported-99'));
    } finally {
      if (prevModel === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = prevModel;
    }
  });

  it('TEST 9: Actual claim analysis returns complete schema with grounded citations using AIza key', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionType: 'text',
        text: 'Drinking lemon water cures chronic kidney disease within 14 days.',
        category: 'Health',
        apiKey: VALID_USER_KEY,
      }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    const parsed = factCheckResponseSchema.safeParse(body);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.assessment, 'CONTRADICTED');
      assert.equal(parsed.data.sources.length, 1);
      assert.equal(parsed.data.sources[0].id, 'SRC-1');
    }
  });

  it('TEST 10: Removing user API key clears override and restores valid server-key fallback', async () => {
    const healthRes = await fetch(`${baseUrl}/api/health?verify=1&refresh=1`);
    const healthBody = (await healthRes.json()) as { serverKeyStatus: string };
    assert.equal(healthBody.serverKeyStatus, 'verified');

    const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionType: 'text',
        text: 'Drinking lemon water cures chronic kidney disease within 14 days.',
        category: 'Health',
      }),
    });
    assert.equal(analyzeRes.status, 200);
  });

  it('returns MISSING_API_KEY 400 when neither key is configured and JSON errors for bad routes', async () => {
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
      const body = (await res.json()) as { code: string };
      assert.equal(body.code, 'MISSING_API_KEY');
    } finally {
      if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
    }

    const notFound = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(notFound.status, 404);
    const nfBody = (await notFound.json()) as { code: string };
    assert.equal(nfBody.code, 'NOT_FOUND');
  });
});
