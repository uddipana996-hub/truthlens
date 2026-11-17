import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type {
  HealthStatusResponse,
  KeyVerificationStatus,
  ServerKeyHealthStatus,
  TestKeyResponse,
} from '../shared/types';

export type KeyConnectionState =
  | 'checking'
  | 'user-verified'
  | 'user-untested'
  | 'user-invalid-key'
  | 'user-auth-failed'
  | 'user-quota-exceeded'
  | 'user-model-unavailable'
  | 'user-connection-failed'
  | 'server-verified'
  | 'server-invalid-key'
  | 'server-auth-failed'
  | 'server-quota-exceeded'
  | 'server-model-unavailable'
  | 'server-connection-failed'
  | 'not-configured';

interface ApiKeyContextValue {
  /** Kept strictly in React memory for the active session only; never persisted. */
  sessionApiKey: string;
  serverKeyConfigured: boolean;
  serverKeyVerified: boolean;
  metaConfigured: boolean;
  xConfigured: boolean;
  activeModel: string;
  connectionState: KeyConnectionState;
  statusMessage: string;
  isTesting: boolean;
  isModalOpen: boolean;
  hasEffectiveKey: boolean;
  openModal: () => void;
  closeModal: () => void;
  saveSessionKey: (key: string) => void;
  removeSessionKey: () => void;
  testSessionKey: (keyToTest?: string) => Promise<TestKeyResponse>;
  refreshHealth: (forceRefresh?: boolean) => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

function looksLikeOAuthToken(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.startsWith('ya29.') || trimmed.startsWith('1//') || /^bearer\s+/i.test(trimmed);
}

async function parseJsonSafely<T>(response: Response): Promise<{ parsed: T | null; rawText: string }> {
  const rawText = await response.text();
  if (!rawText.trim()) return { parsed: null, rawText: '' };
  try {
    return { parsed: JSON.parse(rawText) as T, rawText };
  } catch {
    return { parsed: null, rawText };
  }
}

function mapUserVerificationFailure(status: KeyVerificationStatus): KeyConnectionState {
  switch (status) {
    case 'invalid_key':
      return 'user-invalid-key';
    case 'auth_failed':
      return 'user-auth-failed';
    case 'quota_exceeded':
      return 'user-quota-exceeded';
    case 'model_unavailable':
      return 'user-model-unavailable';
    default:
      return 'user-connection-failed';
  }
}

function mapServerHealthToState(status: ServerKeyHealthStatus): KeyConnectionState {
  switch (status) {
    case 'verified':
      return 'server-verified';
    case 'invalid_key':
      return 'server-invalid-key';
    case 'auth_failed':
      return 'server-auth-failed';
    case 'quota_exceeded':
      return 'server-quota-exceeded';
    case 'model_unavailable':
      return 'server-model-unavailable';
    case 'connection_failed':
      return 'server-connection-failed';
    default:
      return 'not-configured';
  }
}

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [sessionApiKey, setSessionApiKey] = useState<string>('');
  const [serverKeyConfigured, setServerKeyConfigured] = useState<boolean>(false);
  const [serverKeyVerified, setServerKeyVerified] = useState<boolean>(false);
  const [metaConfigured, setMetaConfigured] = useState<boolean>(false);
  const [xConfigured, setXConfigured] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-4-hydrogen');
  const [connectionState, setConnectionState] = useState<KeyConnectionState>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('Checking server API key configuration...');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const testingInFlightRef = useRef<boolean>(false);
  const sessionKeyRef = useRef<string>('');
  sessionKeyRef.current = sessionApiKey;

  const applyServerHealth = useCallback((parsed: HealthStatusResponse) => {
    setServerKeyConfigured(parsed.serverKeyConfigured);
    setServerKeyVerified(parsed.serverKeyStatus === 'verified');
    setMetaConfigured(parsed.metaConfigured);
    setXConfigured(parsed.xConfigured);
    setActiveModel(parsed.model);

    if (sessionKeyRef.current.trim()) {
      return;
    }

    if (!parsed.serverKeyConfigured) {
      setConnectionState('not-configured');
      setStatusMessage(
        'No server Gemini API key is configured. Add your session key here or set GEMINI_API_KEY on the server.'
      );
      return;
    }

    const mapped = mapServerHealthToState(parsed.serverKeyStatus);
    setConnectionState(mapped);
    if (parsed.serverKeyStatus === 'verified') {
      setStatusMessage(
        parsed.serverKeyMessage ||
          `Server environment key verified (${parsed.model}).`
      );
    } else {
      setStatusMessage(
        parsed.serverKeyMessage ||
          'Server environment key could not be verified with Gemini API.'
      );
    }
  }, []);

  const refreshHealth = useCallback(
    async (forceRefresh = false) => {
      try {
        const url = forceRefresh ? '/api/health?verify=1&refresh=1' : '/api/health?verify=1';
        const response = await fetch(url, { cache: 'no-store' });
        const { parsed } = await parseJsonSafely<HealthStatusResponse>(response);
        if (!response.ok || !parsed) {
          throw new Error(`Health check returned HTTP ${response.status}`);
        }
        applyServerHealth(parsed);
      } catch (err) {
        setServerKeyVerified(false);
        if (!sessionKeyRef.current.trim()) {
          setConnectionState('server-connection-failed');
          setStatusMessage(
            err instanceof Error
              ? `Connection failed while checking server status (${err.message}).`
              : 'Connection failed while checking server status.'
          );
        }
      }
    },
    [applyServerHealth]
  );

  useEffect(() => {
    void refreshHealth(false);
  }, [refreshHealth]);

  const saveSessionKey = useCallback(
    (rawKey: string) => {
      const trimmed = rawKey.trim();
      sessionKeyRef.current = trimmed;
      setSessionApiKey(trimmed);

      if (!trimmed) {
        void refreshHealth(false);
        return;
      }

      if (looksLikeOAuthToken(trimmed)) {
        setConnectionState('user-invalid-key');
        setStatusMessage(
          'OAuth access tokens (ya29..., Bearer, or 1//...) are not Gemini API keys. Use a key from aistudio.google.com/apikey.'
        );
        return;
      }

      setConnectionState('user-untested');
      setStatusMessage(
        'Session key stored in memory (not yet verified). Click Test & Save Key to verify.'
      );
    },
    [refreshHealth]
  );

  const removeSessionKey = useCallback(() => {
    sessionKeyRef.current = '';
    setSessionApiKey('');
    setConnectionState('checking');
    setStatusMessage('Session key cleared. Checking server key fallback...');
    void refreshHealth(true);
  }, [refreshHealth]);

  const testSessionKey = useCallback(async (keyToTest?: string): Promise<TestKeyResponse> => {
    if (testingInFlightRef.current) {
      return {
        success: false,
        connectionStatus: 'error',
        message: 'Verification is already in progress.',
      };
    }

    const candidate = (keyToTest ?? sessionKeyRef.current).trim();
    if (!candidate) {
      const res: TestKeyResponse = {
        success: false,
        connectionStatus: 'invalid_key',
        message: 'Please enter a Gemini API key to test.',
      };
      setConnectionState('user-invalid-key');
      setStatusMessage(res.message);
      return res;
    }

    sessionKeyRef.current = candidate;
    setSessionApiKey(candidate);
    setConnectionState('checking');
    setStatusMessage('Verifying Gemini API key with backend...');
    testingInFlightRef.current = true;
    setIsTesting(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: candidate }),
        signal: controller.signal,
      });

      const { parsed, rawText } = await parseJsonSafely<TestKeyResponse>(response);
      if (!parsed) {
        const fallbackMsg = `Server returned non-JSON response (HTTP ${response.status})${
          rawText ? `: ${rawText.slice(0, 120)}` : '.'
        }`;
        setConnectionState('user-connection-failed');
        setStatusMessage(fallbackMsg);
        return {
          success: false,
          connectionStatus: 'connection_failed',
          message: fallbackMsg,
        };
      }

      if (response.ok && parsed.success) {
        if (parsed.activeModel) {
          setActiveModel(parsed.activeModel);
        }
        setConnectionState('user-verified');
        setStatusMessage(parsed.message);
      } else {
        setConnectionState(mapUserVerificationFailure(parsed.connectionStatus));
        setStatusMessage(parsed.message || `API key verification failed (HTTP ${response.status}).`);
      }
      return parsed;
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const message = isAbort
        ? 'API key verification timed out after 20 seconds. Please try again.'
        : err instanceof Error
          ? `Connection failed while reaching /api/test-key (${err.message}).`
          : 'Connection failed while reaching /api/test-key.';
      const fallback: TestKeyResponse = {
        success: false,
        connectionStatus: 'connection_failed',
        message,
      };
      setConnectionState('user-connection-failed');
      setStatusMessage(fallback.message);
      return fallback;
    } finally {
      window.clearTimeout(timeoutId);
      testingInFlightRef.current = false;
      setIsTesting(false);
    }
  }, []);

  const hasEffectiveKey = Boolean(sessionApiKey.trim()) || serverKeyConfigured;

  return (
    <ApiKeyContext.Provider
      value={{
        sessionApiKey,
        serverKeyConfigured,
        serverKeyVerified,
        metaConfigured,
        xConfigured,
        activeModel,
        connectionState,
        statusMessage,
        isTesting,
        isModalOpen,
        hasEffectiveKey,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        saveSessionKey,
        removeSessionKey,
        testSessionKey,
        refreshHealth,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) {
    throw new Error('useApiKey must be used inside ApiKeyProvider');
  }
  return ctx;
}
