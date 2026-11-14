import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { HealthStatusResponse, TestKeyResponse } from '../shared/types';

export type KeyConnectionState =
  | 'checking'
  | 'user-verified'
  | 'user-untested'
  | 'user-error'
  | 'server-configured'
  | 'not-configured';

interface ApiKeyContextValue {
  /** Kept strictly in React memory for the active session only; never persisted. */
  sessionApiKey: string;
  serverKeyConfigured: boolean;
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
  refreshHealth: () => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [sessionApiKey, setSessionApiKey] = useState<string>('');
  const [serverKeyConfigured, setServerKeyConfigured] = useState<boolean>(false);
  const [metaConfigured, setMetaConfigured] = useState<boolean>(false);
  const [xConfigured, setXConfigured] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-4-hydrogen');
  const [connectionState, setConnectionState] = useState<KeyConnectionState>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('Checking server configuration...');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const refreshHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('Health check failed');
      const data = (await response.json()) as HealthStatusResponse;
      setServerKeyConfigured(data.serverKeyConfigured);
      setMetaConfigured(data.metaConfigured);
      setXConfigured(data.xConfigured);
      setActiveModel(data.model);

      setConnectionState((prev) => {
        if (prev === 'user-verified' || prev === 'user-untested' || prev === 'user-error') {
          return prev;
        }
        return data.serverKeyConfigured ? 'server-configured' : 'not-configured';
      });
      setStatusMessage((prevMsg) => {
        if (sessionApiKey) return prevMsg;
        return data.serverKeyConfigured
          ? `Server-configured Gemini key active (${data.model}).`
          : 'No Gemini API key configured yet. Add your own session key to begin.';
      });
    } catch {
      setConnectionState((prev) =>
        prev === 'user-verified' || prev === 'user-untested' ? prev : 'not-configured'
      );
      setStatusMessage('Unable to verify server API status.');
    }
  }, [sessionApiKey]);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const saveSessionKey = useCallback(
    (rawKey: string) => {
      const trimmed = rawKey.trim();
      setSessionApiKey(trimmed);
      if (trimmed) {
        setConnectionState('user-untested');
        setStatusMessage('Session API key saved in memory. Click Test API Key to verify.');
      } else {
        setConnectionState(serverKeyConfigured ? 'server-configured' : 'not-configured');
        setStatusMessage(
          serverKeyConfigured
            ? `Using server-configured key (${activeModel}).`
            : 'No API key configured.'
        );
      }
    },
    [serverKeyConfigured, activeModel]
  );

  const removeSessionKey = useCallback(() => {
    setSessionApiKey('');
    setConnectionState(serverKeyConfigured ? 'server-configured' : 'not-configured');
    setStatusMessage(
      serverKeyConfigured
        ? `Session key removed. Falling back to server-configured key (${activeModel}).`
        : 'Session key removed from memory.'
    );
  }, [serverKeyConfigured, activeModel]);

  const testSessionKey = useCallback(
    async (keyToTest?: string): Promise<TestKeyResponse> => {
      const candidate = (keyToTest ?? sessionApiKey).trim();
      if (!candidate) {
        const res: TestKeyResponse = {
          success: false,
          connectionStatus: 'invalid_key',
          message: 'Please enter a Gemini API key to test.',
        };
        setConnectionState('user-error');
        setStatusMessage(res.message);
        return res;
      }

      setIsTesting(true);
      try {
        const response = await fetch('/api/test-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: candidate }),
        });
        const data = (await response.json()) as TestKeyResponse;
        if (response.ok && data.success) {
          setSessionApiKey(candidate);
          setConnectionState('user-verified');
          setStatusMessage(data.message);
        } else {
          setConnectionState('user-error');
          setStatusMessage(data.message || 'API key verification failed.');
        }
        return data;
      } catch {
        const fallback: TestKeyResponse = {
          success: false,
          connectionStatus: 'error',
          message: 'Network error while testing the Gemini API key.',
        };
        setConnectionState('user-error');
        setStatusMessage(fallback.message);
        return fallback;
      } finally {
        setIsTesting(false);
      }
    },
    [sessionApiKey]
  );

  const hasEffectiveKey = Boolean(sessionApiKey.trim()) || serverKeyConfigured;

  return (
    <ApiKeyContext.Provider
      value={{
        sessionApiKey,
        serverKeyConfigured,
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
