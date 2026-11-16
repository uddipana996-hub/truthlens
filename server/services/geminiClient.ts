import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { KeyVerificationStatus, TestKeyResponse } from '../../src/shared/types.js';
import { sanitizeErrorMessage } from '../middleware/security.js';

export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

const PLACEHOLDER_ENV_VALUES = new Set([
  'MY_GEMINI_API_KEY',
  'YOUR_GEMINI_API_KEY',
  'YOUR_API_KEY',
  'GEMINI_API_KEY',
  'null',
  'undefined',
]);

const FALLBACK_FLASH_CANDIDATES = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
];

export function isNonPlaceholderEnvKey(rawKey?: string): boolean {
  const trimmed = rawKey?.trim() ?? '';
  if (trimmed.length < 10) return false;
  if (PLACEHOLDER_ENV_VALUES.has(trimmed)) return false;
  return true;
}

export function isExplicitModelConfigured(): boolean {
  return Boolean(process.env.GEMINI_MODEL?.trim());
}

export function resolveGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured || DEFAULT_GEMINI_MODEL;
}

/**
 * Resolves the active Gemini API key with strict priority:
 * 1. User-provided key (if any non-empty string is supplied; never silently falls back to server key)
 * 2. Server environment GEMINI_API_KEY (if configured and non-placeholder)
 */
export function resolveActiveApiKey(userProvidedKey?: string): {
  apiKey: string;
  source: 'user' | 'server';
} | null {
  const userKey = userProvidedKey?.trim();
  if (userKey && userKey.length > 0) {
    return { apiKey: userKey, source: 'user' };
  }
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (isNonPlaceholderEnvKey(envKey)) {
    return { apiKey: envKey!, source: 'server' };
  }
  return null;
}

export function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export type GeminiErrorCode =
  | 'invalid_key'
  | 'auth_failed'
  | 'quota_exceeded'
  | 'model_unavailable'
  | 'service_unavailable'
  | 'connection_failed'
  | 'timeout'
  | 'error';

export class GeminiPipelineError extends Error {
  readonly code: GeminiErrorCode;
  readonly httpStatus: number;

  constructor(code: GeminiErrorCode, message: string, httpStatus: number) {
    super(message);
    this.name = 'GeminiPipelineError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function looksLikeNonApiKeyCredential(candidate?: string): boolean {
  const trimmed = candidate?.trim() ?? '';
  if (!trimmed) return false;
  if (/^bearer\s+/i.test(trimmed)) return true;
  return (
    trimmed.startsWith('AQ.') ||
    trimmed.startsWith('ya29.') ||
    trimmed.startsWith('1//') ||
    trimmed.startsWith('eyJ')
  );
}

export function classifyGeminiError(
  err: unknown,
  options?: { keyCandidate?: string; modelName?: string }
): {
  code: GeminiErrorCode;
  httpStatus: number;
  isHardQuota: boolean;
  message: string;
} {
  const raw = sanitizeErrorMessage(err);
  const lower = raw.toLowerCase();
  const modelLabel = options?.modelName || resolveGeminiModel();
  const nonApiKeyShape = looksLikeNonApiKeyCredential(options?.keyCandidate);
  const isAuthOrKeyRejection =
    lower.includes('access_token_type_unsupported') ||
    lower.includes('unauthenticated') ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied') ||
    lower.includes('400') ||
    lower.includes('401') ||
    lower.includes('403');

  if (
    lower.includes('access_token_type_unsupported') ||
    (isAuthOrKeyRejection && nonApiKeyShape)
  ) {
    return {
      code: 'invalid_key',
      httpStatus: 401,
      isHardQuota: false,
      message:
        'OAuth access tokens, Google Cloud tokens, Bearer headers, and AQ... credentials are not accepted as Gemini API keys. Generate a standard Gemini API key at Google AI Studio (https://aistudio.google.com/apikey).',
    };
  }

  if (lower.includes('referer') || lower.includes('http_referrer_blocked')) {
    return {
      code: 'auth_failed',
      httpStatus: 403,
      isHardQuota: false,
      message:
        'This Gemini API key has HTTP Referrer (website) restrictions that block server-side requests. In Google Cloud / AI Studio, set Key Application Restrictions to "None" for server use.',
    };
  }

  if (
    lower.includes('api_key_service_blocked') ||
    lower.includes('has not been used in project') ||
    lower.includes('service_disabled') ||
    lower.includes('generativelanguage.googleapis.com') && lower.includes('disabled')
  ) {
    return {
      code: 'auth_failed',
      httpStatus: 403,
      isHardQuota: false,
      message:
        'The Generative Language API is not enabled for this Google Cloud project. Create a key directly at Google AI Studio (https://aistudio.google.com/apikey) or enable generativelanguage.googleapis.com.',
    };
  }

  if (lower.includes('leaked') || lower.includes('compromised')) {
    return {
      code: 'invalid_key',
      httpStatus: 401,
      isHardQuota: false,
      message:
        'This Gemini API key was disabled by Google because it was reported as leaked. Generate a fresh key at Google AI Studio (https://aistudio.google.com/apikey).',
    };
  }

  if (lower.includes('user location is not supported')) {
    return {
      code: 'auth_failed',
      httpStatus: 403,
      isHardQuota: false,
      message:
        'Gemini API access from the server region is not supported for this key or billing tier.',
    };
  }

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
    return {
      code: 'invalid_key',
      httpStatus: 401,
      isHardQuota: false,
      message:
        'Invalid or revoked Gemini API key. Generate or verify a standard Gemini API key at Google AI Studio (https://aistudio.google.com/apikey).',
    };
  }

  if (
    lower.includes('permission_denied') ||
    lower.includes('unauthenticated') ||
    lower.includes('401') ||
    lower.includes('403')
  ) {
    return {
      code: 'auth_failed',
      httpStatus: lower.includes('403') || lower.includes('permission_denied') ? 403 : 401,
      isHardQuota: false,
      message: `Authentication failed for this API key: ${raw}`,
    };
  }

  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    const isHardQuota =
      lower.includes('check your plan and billing') ||
      lower.includes('exceeded your current quota');
    return {
      code: 'quota_exceeded',
      httpStatus: 429,
      isHardQuota,
      message: isHardQuota
        ? 'API quota exceeded (429 RESOURCE_EXHAUSTED). Check your Google AI Studio plan/billing or switch API keys.'
        : 'API rate limit reached (429). Please wait a moment and try again.',
    };
  }

  if (
    lower.includes('not_found') ||
    lower.includes('404') ||
    lower.includes('not supported for generatecontent') ||
    lower.includes('is not found for api version')
  ) {
    return {
      code: 'model_unavailable',
      httpStatus: 404,
      isHardQuota: false,
      message: `Model "${modelLabel}" is unavailable or unsupported for this API key (HTTP 404). Update GEMINI_MODEL or check enabled models in Google AI Studio.`,
    };
  }

  if (lower.includes('unavailable') || lower.includes('503') || lower.includes('high demand')) {
    return {
      code: 'service_unavailable',
      httpStatus: 503,
      isHardQuota: false,
      message: `Gemini service is temporarily unavailable for model "${modelLabel}" (503 UNAVAILABLE). Please retry shortly.`,
    };
  }

  if (lower.includes('abort') || lower.includes('timeout') || lower.includes('timed out')) {
    return {
      code: 'timeout',
      httpStatus: 504,
      isHardQuota: false,
      message: 'The request to Gemini API timed out. Please try again.',
    };
  }

  if (
    lower.includes('fetch failed') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('network')
  ) {
    return {
      code: 'connection_failed',
      httpStatus: 503,
      isHardQuota: false,
      message: `Connection failed while contacting Gemini API: ${raw}`,
    };
  }

  return {
    code: 'error',
    httpStatus: 500,
    isHardQuota: false,
    message: `Gemini API request failed: ${raw}`,
  };
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const classified = classifyGeminiError(err);
      // Retry transient 503 high-demand or non-billing 429 rate-limits, not auth, 404, timeouts, or hard quotas
      const isRetryable =
        classified.code === 'service_unavailable' ||
        (classified.code === 'quota_exceeded' && !classified.isHardQuota);
      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export function buildThinkingConfigForModel(
  model: string,
  level: ThinkingLevel
): { thinkingConfig: { thinkingLevel: ThinkingLevel } } | undefined {
  if (model.startsWith('gemini-4-') || model.startsWith('gemini-3-')) {
    return { thinkingConfig: { thinkingLevel: level } };
  }
  return undefined;
}

/**
 * Discovers an available generateContent-capable Flash model via Google's models.list() endpoint
 * when no explicit GEMINI_MODEL override is set and the default model returned 404.
 */
export async function discoverSupportedModel(ai: GoogleGenAI): Promise<string | null> {
  try {
    const pager = await withTimeout(
      ai.models.list({ config: { pageSize: 100 } }),
      10_000,
      'Gemini model discovery'
    );
    const availableNames = new Set<string>();
    for await (const m of pager) {
      const name = m.name?.replace(/^models\//, '') ?? '';
      const actions = m.supportedActions ?? [];
      if (name && (actions.length === 0 || actions.includes('generateContent'))) {
        availableNames.add(name);
      }
    }
    for (const candidate of FALLBACK_FLASH_CANDIDATES) {
      if (availableNames.has(candidate)) {
        return candidate;
      }
    }
    for (const name of availableNames) {
      if (name.includes('flash') && !name.includes('tts') && !name.includes('image') && !name.includes('live')) {
        return name;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAndSelectWorkingModel(
  ai: GoogleGenAI,
  preferredModel: string
): Promise<string> {
  if (isExplicitModelConfigured()) {
    return preferredModel;
  }
  const discovered = await discoverSupportedModel(ai);
  return discovered ?? preferredModel;
}

function mapErrorCodeToConnectionStatus(code: GeminiErrorCode): KeyVerificationStatus {
  switch (code) {
    case 'invalid_key':
      return 'invalid_key';
    case 'auth_failed':
      return 'auth_failed';
    case 'quota_exceeded':
      return 'quota_exceeded';
    case 'model_unavailable':
      return 'model_unavailable';
    case 'connection_failed':
    case 'service_unavailable':
    case 'timeout':
      return 'connection_failed';
    default:
      return 'error';
  }
}

export async function testGeminiKey(
  apiKey: string,
  options?: { client?: GoogleGenAI; modelOverride?: string }
): Promise<TestKeyResponse> {
  const trimmed = apiKey.trim();
  if (!trimmed || trimmed.length < 10) {
    return {
      success: false,
      connectionStatus: 'invalid_key',
      message: 'API key appears too short. Enter a valid Gemini API key from Google AI Studio.',
    };
  }

  const configuredModel = options?.modelOverride?.trim() || resolveGeminiModel();
  const strictModelMode = Boolean(options?.modelOverride?.trim()) || isExplicitModelConfigured();
  const ai = options?.client ?? createGeminiClient(trimmed);

  try {
    const thinkingCfg = buildThinkingConfigForModel(configuredModel, ThinkingLevel.LOW);
    const response = await withTimeout(
      ai.models.generateContent({
        model: configuredModel,
        contents: 'Reply with OK.',
        ...(thinkingCfg ? { config: thinkingCfg } : {}),
      }),
      15_000,
      'Gemini key verification'
    );

    if (response.text !== undefined) {
      return {
        success: true,
        connectionStatus: 'connected',
        activeModel: configuredModel,
        message: `Connected successfully using ${configuredModel}.`,
      };
    }

    return {
      success: false,
      connectionStatus: 'error',
      message: 'Received an empty verification response from Gemini.',
    };
  } catch (err) {
    const classified = classifyGeminiError(err, {
      keyCandidate: trimmed,
      modelName: configuredModel,
    });

    // If default model returned 404 and no explicit GEMINI_MODEL was forced, verify available models via models.list()
    if (classified.code === 'model_unavailable' && !strictModelMode) {
      const discovered = await discoverSupportedModel(ai);
      if (discovered && discovered !== configuredModel) {
        try {
          const thinkingCfg = buildThinkingConfigForModel(discovered, ThinkingLevel.LOW);
          const fallbackResp = await withTimeout(
            ai.models.generateContent({
              model: discovered,
              contents: 'Reply with OK.',
              ...(thinkingCfg ? { config: thinkingCfg } : {}),
            }),
            15_000,
            'Gemini fallback model verification'
          );
          if (fallbackResp.text !== undefined) {
            return {
              success: true,
              connectionStatus: 'connected',
              activeModel: discovered,
              message: `Connected successfully using ${discovered}.`,
            };
          }
        } catch (fallbackErr) {
          const fallbackClassified = classifyGeminiError(fallbackErr, {
            keyCandidate: trimmed,
            modelName: discovered,
          });
          return {
            success: false,
            connectionStatus: mapErrorCodeToConnectionStatus(fallbackClassified.code),
            message: fallbackClassified.message,
          };
        }
      }
    }

    return {
      success: false,
      connectionStatus: mapErrorCodeToConnectionStatus(classified.code),
      message: classified.message,
    };
  }
}
