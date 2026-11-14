import express from 'express';
import {
  analyzeRequestSchema,
  extractPostRequestSchema,
  testKeyRequestSchema,
} from '../src/shared/schemas.js';
import type {
  ExtractionStatus,
  HealthStatusResponse,
  SocialPlatform,
} from '../src/shared/types.js';
import { extractSocialPost } from './adapters/social/index.js';
import { detectSocialPlatform } from './adapters/social/platformDetector.js';
import {
  createRateLimiter,
  noStoreApiMiddleware,
  sanitizeErrorMessage,
  securityHeadersMiddleware,
} from './middleware/security.js';
import { runFactCheckPipeline } from './services/factCheckPipeline.js';
import {
  resolveActiveApiKey,
  resolveGeminiModel,
  testGeminiKey,
} from './services/geminiClient.js';

export function createApiApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(securityHeadersMiddleware);
  app.use('/api', noStoreApiMiddleware);

  const apiLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 30,
  });
  app.use('/api', apiLimiter);

  const smallJsonParser = express.json({ limit: '64kb' });
  const analyzeJsonParser = express.json({ limit: '8mb' });

  app.get('/api/health', (_req, res) => {
    const payload: HealthStatusResponse = {
      status: 'ok',
      serverKeyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      metaConfigured: Boolean(process.env.META_ACCESS_TOKEN?.trim()),
      xConfigured: Boolean(process.env.X_BEARER_TOKEN?.trim()),
      model: resolveGeminiModel(),
    };
    res.json(payload);
  });

  app.post('/api/test-key', smallJsonParser, async (req, res) => {
    const parsed = testKeyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        connectionStatus: 'invalid_key',
        message: parsed.error.issues[0]?.message ?? 'Invalid API key format.',
      });
      return;
    }

    const result = await testGeminiKey(parsed.data.apiKey);
    res.status(result.success ? 200 : 400).json(result);
  });

  app.post('/api/extract-post', smallJsonParser, async (req, res) => {
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
          'No Gemini API key is configured. Open API Key Settings to enter your own session key, or configure GEMINI_API_KEY on the server.',
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

      const result = await runFactCheckPipeline({
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
      const safeMessage = sanitizeErrorMessage(err);
      res.status(502).json({
        status: 'error',
        code: 'ANALYSIS_FAILED',
        message: safeMessage,
      });
    }
  });

  // Return clean JSON errors for malformed payloads or oversized bodies
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
        res.status(413).json({
          status: 'error',
          message: 'Uploaded payload is too large. Keep screenshots under 5 MB.',
        });
        return;
      }
      if (err instanceof SyntaxError) {
        res.status(400).json({
          status: 'error',
          message: 'Malformed JSON request body.',
        });
        return;
      }
      next(err);
    }
  );

  return app;
}
