import crypto from 'node:crypto';
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
  'gemini-2.5-flash-lite',
];

const EXCLUDED_MODEL_SUBSTRINGS = [
  'gemini-1.',
  'gemini-2.0-',
  'tts',
  'image',
  'live',
  'audio',
  'robotics',
  'computer-use',
  'embedding',
  'aqa',
  'imagen',
  'veo',
  'lyria',
];

// Short-lived per-key-hash working model cache (never stores raw API key)
const workingModelCache = new Map<string, { model: string; cachedAt: number }>();
const MODEL_CACHE_TTL_MS = 5 * 60_000;

function hashKeyForCache(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey.trim()).digest('hex');
}

export function getCachedWorkingModelForKey(apiKey: string): string | null {
  const hash = hashKeyForCache(apiKey);
  const entry = workingModelCache.get(hash);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > MODEL_CACHE_TTL_MS) {
    workingModelCache.delete(hash);
    return null;
  }
  return entry.model;
}

export function recordWorkingModelForKey(apiKey: string, model: string): void {
  if (!apiKey.trim() || !model.trim()) return;
  const hash = hashKeyForCache(apiKey);
  workingModelCache.set(hash, { model: model.trim(), cachedAt: Date.now() });
}

export function isObviousOAuthToken(rawKey?: string): boolean {
  const trimmed = rawKey?.trim() ?? '';
  if (!trimmed) return false;
  return (
    trimmed.startsWith('ya29.') ||
    trimmed.startsWith('1//') ||
    /^bearer\s+/i.test(trimmed) ||
    trimmed.startsWith('ghp_') ||
    trimmed.startsWith('sk-')
  );
}

export function isNonPlaceholderEnvKey(rawKey?: string): boolean {
  const trimmed = rawKey?.trim() ?? '';
  if (trimmed.length < 16) return false;
  if (PLACEHOLDER_ENV_VALUES.has(trimmed)) return false;
  if (isObviousOAuthToken(trimmed)) return false;
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
 * 1. User-provided key (kept even if malformed/OAuth so explicit user error is returned without silently falling back)
 * 2. Server environment GEMINI_API_KEY (supports both standard AIza... keys and valid AQ. keys)
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
  const candidate = options?.keyCandidate?.trim() ?? '';

  if (isObviousOAuthToken(candidate)) {
    return {
      code: 'invalid_key',
      httpStatus: 401,
      isHardQuota: false,
      message:
        'OAuth access tokens (ya29..., Bearer tokens, or 1//...) are not Gemini API keys. Create a standard Gemini API key starting with AIza... at Google AI Studio (https://aistudio.google.com/apikey).',
    };
  }

  if (lower.includes('access_token_type_unsupported')) {
    if (candidate.startsWith('AQ.')) {
      return {
        code: 'invalid_key',
        httpStatus: 401,
        isHardQuota: false,
        message:
          'Google returned 401 ACCESS_TOKEN_TYPE_UNSUPPORTED for this AQ. credential. In Google Cloud Console → Credentials → API restrictions, change "Gemini API" to "Generative Language API" (generativelanguage.googleapis.com) or use a standard AIza... key from Google AI Studio (https://aistudio.google.com/apikey).',
      };
    }
    return {
      code: 'invalid_key',
      httpStatus: 401,
      isHardQuota: false,
      message:
        'This credential is not accepted as a Gemini API key (ACCESS_TOKEN_TYPE_UNSUPPORTED). Create a standard Gemini API key starting with AIza... at Google AI Studio (https://aistudio.google.com/apikey).',
    };
  }

  if (lower.includes('referer') || lower.includes('http_referrer_blocked')) {
    return {
      code: 'auth_failed',
      httpStatus: 403,
      isHardQuota: false,
      message:
        'This API key has HTTP Referrer (website) restrictions blocking server-side requests. In Google Cloud Console → Credentials, set Application restrictions to "None".',
    };
  }

  if (
    lower.includes('api_key_service_blocked') ||
    lower.includes('has not been used in project') ||
    lower.includes('service_disabled') ||
    (lower.includes('generativelanguage.googleapis.com') && lower.includes('disabled'))
  ) {
    return {
      code: 'auth_failed',
      httpStatus: 403,
      isHardQuota: false,
      message:
        'Generative Language API (generativelanguage.googleapis.com) is not enabled or permitted for this API key. Enable it in Google Cloud Console Credentials.',
    };
  }

  if (lower.includes('leaked') || lower.includes('compromised')) {
    return {
      code: 'invalid_key',
      httpStatus: 401,
      isHardQuota: false,
      message:
        'This API key was disabled by Google because it was reported as leaked. Generate a fresh key at Google AI Studio (https://aistudio.google.com/apikey).',
    };
  }

  if (lower.includes('user location is not supported')) {
    return {
      code: 'auth_failed',
      httpStatus: 403,
      isHardQuota: false,
      message:
        'Gemini API access from this server region is not supported for this API key or billing tier.',
    };
  }

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
    return {
      code: 'invalid_key',
      httpStatus: 401,
      isHardQuota: false,
      message:
        'Invalid, expired, or revoked Gemini API key. Generate a valid key (AIza... or Generative-Language-enabled AQ.) at Google AI Studio (https://aistudio.google.com/apikey).',
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
      message: `Authentication failed for this Gemini API key: ${raw}`,
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
        ? 'API quota exceeded (429 RESOURCE_EXHAUSTED). Check your Google AI Studio / Cloud plan and billing, or switch API keys.'
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
      message: `Model "${modelLabel}" is unavailable or unsupported for this API key (HTTP 404). Update GEMINI_MODEL or clear it to allow automatic model selection.`,
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
      const lower = name.toLowerCase();
      if (
        lower.includes('flash') &&
        !EXCLUDED_MODEL_SUBSTRINGS.some((sub) => lower.includes(sub))
      ) {
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
  if (!trimmed || trimmed.length < 16) {
    return {
      success: false,
      connectionStatus: 'invalid_key',
      message:
        'API key appears too short. Create a valid Gemini API key at Google AI Studio (https://aistudio.google.com/apikey).',
    };
  }

  if (isObviousOAuthToken(trimmed)) {
    return {
      success: false,
      connectionStatus: 'invalid_key',
      message:
        'OAuth access tokens (ya29..., Bearer tokens, or 1//...) are not Gemini API keys. Create a standard Gemini API key starting with AIza... at Google AI Studio (https://aistudio.google.com/apikey).',
    };
  }

  const strictModelMode = Boolean(options?.modelOverride?.trim()) || isExplicitModelConfigured();
  const configuredModel =
    options?.modelOverride?.trim() ||
    (!strictModelMode ? getCachedWorkingModelForKey(trimmed) : null) ||
    resolveGeminiModel();
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
      'Gemini API key verification'
    );

    if (response.text !== undefined) {
      if (!options?.client) {
        recordWorkingModelForKey(trimmed, configuredModel);
      }
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
            if (!options?.client) {
              recordWorkingModelForKey(trimmed, discovered);
            }
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
