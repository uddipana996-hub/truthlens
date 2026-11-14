import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { TestKeyResponse } from '../../src/shared/types.js';
import { sanitizeErrorMessage } from '../middleware/security.js';

const PROHIBITED_DEPRECATED_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-2.0-flash-thinking',
]);

export function resolveGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (!configured || PROHIBITED_DEPRECATED_MODELS.has(configured)) {
    return 'gemini-4-hydrogen';
  }
  return configured;
}

export function resolveActiveApiKey(userProvidedKey?: string): {
  apiKey: string;
  source: 'user' | 'server';
} | null {
  const userKey = userProvidedKey?.trim();
  if (userKey) {
    return { apiKey: userKey, source: 'user' };
  }
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey) {
    return { apiKey: envKey, source: 'server' };
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

export function classifyGeminiError(err: unknown): {
  code: 'invalid_key' | 'quota_exceeded' | 'model_not_found' | 'timeout' | 'error';
  message: string;
} {
  const raw = sanitizeErrorMessage(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('unauthenticated')
  ) {
    return {
      code: 'invalid_key',
      message:
        'The Gemini API key was rejected or lacks permission. Please verify the key in API Key Settings or Google AI Studio.',
    };
  }

  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      code: 'quota_exceeded',
      message:
        'Gemini API rate limit or quota exceeded. Wait a moment and retry, or check your quota in Google AI Studio.',
    };
  }

  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      code: 'model_not_found',
      message:
        'The requested Gemini model was not found or is unavailable for this API key.',
    };
  }

  if (lower.includes('abort') || lower.includes('timeout') || lower.includes('timed out')) {
    return {
      code: 'timeout',
      message: 'The Gemini API request timed out. Please try again.',
    };
  }

  return {
    code: 'error',
    message: `Gemini API request failed: ${raw}`,
  };
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
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
  const baseDelayMs = options.baseDelayMs ?? 1500;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const classified = classifyGeminiError(err);
      const isRetryable = classified.code === 'quota_exceeded' || classified.code === 'timeout';
      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function testGeminiKey(apiKey: string): Promise<TestKeyResponse> {
  try {
    const ai = createGeminiClient(apiKey);
    const model = resolveGeminiModel();

    const response = await withTimeout(
      ai.models.generateContent({
        model,
        contents: 'Reply with OK.',
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }),
      15_000,
      'Gemini key verification'
    );

    if (response.text !== undefined) {
      return {
        success: true,
        connectionStatus: 'connected',
        message: `Connected successfully using ${model}. Your session key is active in memory only.`,
      };
    }

    return {
      success: false,
      connectionStatus: 'error',
      message: 'Received an empty verification response from Gemini.',
    };
  } catch (err) {
    const classified = classifyGeminiError(err);
    return {
      success: false,
      connectionStatus:
        classified.code === 'invalid_key'
          ? 'invalid_key'
          : classified.code === 'quota_exceeded'
            ? 'quota_exceeded'
            : 'error',
      message: classified.message,
    };
  }
}
