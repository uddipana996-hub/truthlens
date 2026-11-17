import crypto from 'node:crypto';
import express from 'express';
import {
  analyzeRequestSchema,
  extractPostRequestSchema,
  testKeyRequestSchema,
} from '../src/shared/schemas.js';
import type {
  ExtractionStatus,
  FactCheckResponse,
  HealthStatusResponse,
  ServerKeyHealthStatus,
  SocialPlatform,
  TestKeyResponse,
} from '../src/shared/types.js';
import { extractSocialPost } from './adapters/social/index.js';
import { detectSocialPlatform } from './adapters/social/platformDetector.js';
import {
  createRateLimiter,
  noStoreApiMiddleware,
  sanitizeErrorMessage,
  securityHeadersMiddleware,
} from './middleware/security.js';
import { runFactCheckPipeline, type PipelineInput } from './services/factCheckPipeline.js';
import {
  GeminiPipelineError,
  isObviousOAuthToken,
  resolveActiveApiKey,
  resolveGeminiModel,
  testGeminiKey,
} from './services/geminiClient.js';

export interface ApiAppDependencies {
  testKeyFn?: (apiKey: string) => Promise<TestKeyResponse>;
  runPipelineFn?: (input: PipelineInput) => Promise<FactCheckResponse>;
}

function mapVerificationToServerStatus(res: TestKeyResponse): ServerKeyHealthStatus {
  if (res.success) return 'verified';
  switch (res.connectionStatus) {
    case 'invalid_key':
      return 'invalid_key';
    case 'auth_failed':
      return 'auth_failed';
    case 'quota_exceeded':
      return 'quota_exceeded';
    case 'model_unavailable':
      return 'model_unavailable';
    default:
      return 'connection_failed';
  }
}

export function createApiApp(deps?: ApiAppDependencies) {
  const app = express();
  const verifyKey = deps?.testKeyFn ?? ((key: string) => testGeminiKey(key));
  const executePipeline = deps?.runPipelineFn ?? ((input: PipelineInput) => runFactCheckPipeline(input));

  // Short-lived in-memory cache of server-key verification keyed by SHA-256 hash (never raw secret)
  let cachedServerCheck: {
    keyHash: string;
    model: string;
    checkedAt: number;
    result: TestKeyResponse;
  } | null = null;

  app.disable('x-powered-by');
  app.use(securityHeadersMiddleware);
  app.use('/api', noStoreApiMiddleware);

  // Safe CORS & preflight handling for AI Studio iframe / localhost / APP_URL origins
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      const appUrl = process.env.APP_URL?.trim();
      let appUrlOrigin = '';
      if (appUrl) {
        try {
          appUrlOrigin = new URL(appUrl).origin;
        } catch {
          appUrlOrigin = '';
        }
      }
      const isAllowedOrigin =
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.run.app') ||
        (appUrlOrigin ? origin === appUrlOrigin : false);

      if (isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      }
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  const apiLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 30,
  });
  app.use('/api', apiLimiter);

  const smallJsonParser = express.json({ limit: '64kb' });
  const analyzeJsonParser = express.json({ limit: '8mb' });

  app.get('/api/health', async (req, res) => {
    const envResolution = resolveActiveApiKey(undefined);
    const configuredModel = resolveGeminiModel();
    const shouldVerify = req.query.verify === '1' || req.query.verify === 'true';
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

    let serverKeyStatus: ServerKeyHealthStatus = envResolution ? 'unverified' : 'not_configured';
    let serverKeyMessage: string | undefined;
    let activeModel = configuredModel;

    if (envResolution && shouldVerify) {
      const keyHash = crypto.createHash('sha256').update(envResolution.apiKey).digest('hex');
      const now = Date.now();
      const cacheValid =
        !forceRefresh &&
        cachedServerCheck &&
        cachedServerCheck.keyHash === keyHash &&
        cachedServerCheck.model === configuredModel &&
        now - cachedServerCheck.checkedAt < 30_000;

      const checkResult = cacheValid
        ? cachedServerCheck!.result
        : await verifyKey(envResolution.apiKey);

      if (!cacheValid) {
        cachedServerCheck = {
          keyHash,
          model: configuredModel,
          checkedAt: now,
          result: checkResult,
        };
      }

      serverKeyStatus = mapVerificationToServerStatus(checkResult);
      serverKeyMessage = checkResult.message;
      if (checkResult.activeModel) {
        activeModel = checkResult.activeModel;
      }
    }

    const payload: HealthStatusResponse = {
      status: 'ok',
      serverKeyConfigured: Boolean(envResolution),
      serverKeyStatus,
      ...(serverKeyMessage ? { serverKeyMessage } : {}),
      metaConfigured: Boolean(process.env.META_ACCESS_TOKEN?.trim()),
      xConfigured: Boolean(process.env.X_BEARER_TOKEN?.trim()),
      model: activeModel,
    };
    res.json(payload);
  });

  app.post('/api/test-key', smallJsonParser, async (req, res) => {
    try {
      const parsed = testKeyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          connectionStatus: 'invalid_key',
          message: parsed.error.issues[0]?.message ?? 'Invalid API key format.',
        });
        return;
      }

      const result = await verifyKey(parsed.data.apiKey);
      const statusCode = result.success
        ? 200
        : result.connectionStatus === 'invalid_key'
          ? 401
          : result.connectionStatus === 'auth_failed'
            ? 403
            : result.connectionStatus === 'model_unavailable'
              ? 404
              : result.connectionStatus === 'quota_exceeded'
                ? 429
                : result.connectionStatus === 'connection_failed'
                  ? 503
                  : 500;
      res.status(statusCode).json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        connectionStatus: 'error',
        message: `Key verification failed: ${sanitizeErrorMessage(err)}`,
      });
    }
  });

  app.post('/api/extract-post', smallJsonParser, async (req, res) => {
    try {
      const parsed = extractPostRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          status: 'error',
          message: parsed.error.issues[0]?.message ?? 'Invalid URL submission.',
        });
        return;
      }

      const extraction = await extractSocialPost(parsed.data.url);
      res.json(extraction);
    } catch (err) {
      res.status(503).json({
        status: 'error',
        message: `URL extraction failed: ${sanitizeErrorMessage(err)}`,
      });
    }
  });

  app.post('/api/analyze', analyzeJsonParser, async (req, res) => {
    const parsed = analyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message ?? 'Invalid analysis request.',
      });
      return;
    }

    const data = parsed.data;
    const keyResolution = resolveActiveApiKey(data.apiKey);
    if (!keyResolution) {
      res.status(400).json({
        status: 'error',
        code: 'MISSING_API_KEY',
        message:
          'No Gemini API key is configured. Open API Key Settings to enter your own key (https://aistudio.google.com/apikey), or set GEMINI_API_KEY on the server.',
      });
      return;
    }

    if (isObviousOAuthToken(keyResolution.apiKey)) {
      res.status(401).json({
        status: 'error',
        code: 'INVALID_KEY',
        keySource: keyResolution.source,
        message:
          keyResolution.source === 'user'
            ? 'User API key error: OAuth access tokens (ya29..., Bearer, or 1//...) are not Gemini API keys. Generate a standard key at Google AI Studio (https://aistudio.google.com/apikey).'
            : 'Server API key error: Configured credential appears to be an OAuth token rather than a Gemini API key.',
      });
      return;
    }

    try {
      let submittedText = data.text.trim();
      let detectedPlatform: SocialPlatform = 'unknown';
      let extractionStatus: ExtractionStatus = 'user_provided';
      const sourceUrl = data.url ? data.url.trim() : null;

      if (data.submissionType === 'url' && sourceUrl) {
        const detected = detectSocialPlatform(sourceUrl);
        detectedPlatform = detected.platform;

        const extraction = await extractSocialPost(sourceUrl);
        detectedPlatform = extraction.platform;
        extractionStatus = extraction.status;

        if (extraction.text) {
          submittedText = submittedText
            ? `${extraction.text}\n\nAdditional user-provided context:\n${submittedText}`
            : extraction.text;
        } else if (!submittedText) {
          res.status(422).json({
            status: 'error',
            code: 'URL_EXTRACTION_UNAVAILABLE',
            extraction,
            message:
              extraction.failureReason ??
              'Could not automatically retrieve content from this URL. Please paste the post text or upload a screenshot.',
          });
          return;
        }
      } else if (data.submissionType === 'image') {
        extractionStatus = 'retrieved';
      }

      const result = await executePipeline({
        apiKey: keyResolution.apiKey,
        submissionType: data.submissionType,
        submittedText,
        sourceUrl,
        detectedPlatform,
        extractionStatus,
        category: data.category,
        imageData: data.imageData,
      });

      res.json(result);
    } catch (err) {
      if (err instanceof GeminiPipelineError) {
        res.status(err.httpStatus).json({
          status: 'error',
          code: err.code.toUpperCase(),
          keySource: keyResolution.source,
          message:
            keyResolution.source === 'user'
              ? `User API key error: ${err.message}`
              : `Server API key error: ${err.message}`,
        });
        return;
      }
      const safeMessage = sanitizeErrorMessage(err);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: `Internal analysis error: ${safeMessage}`,
      });
    }
  });

  // Unmatched /api/* routes return JSON 404 instead of falling through to Vite SPA HTML
  app.use('/api', (_req, res) => {
    res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'API endpoint not found.',
    });
  });

  // Return clean JSON errors for malformed payloads, oversized bodies, or unexpected errors
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
        res.status(413).json({
          status: 'error',
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Uploaded payload is too large. Keep screenshots under 5 MB.',
        });
        return;
      }
      if (err instanceof SyntaxError) {
        res.status(400).json({
          status: 'error',
          code: 'MALFORMED_JSON',
          message: 'Malformed JSON request body.',
        });
        return;
      }
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: sanitizeErrorMessage(err),
      });
    }
  );

  return app;
}
