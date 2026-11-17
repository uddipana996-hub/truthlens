import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';

export function ApiKeyModal() {
  const {
    sessionApiKey,
    serverKeyConfigured,
    serverKeyVerified,
    activeModel,
    connectionState,
    statusMessage,
    isTesting,
    isModalOpen,
    closeModal,
    saveSessionKey,
    removeSessionKey,
    testSessionKey,
  } = useApiKey();

  const [draftKey, setDraftKey] = useState(sessionApiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setDraftKey(sessionApiKey);
      setShowKey(false);
    }
  }, [isModalOpen, sessionApiKey]);

  if (!isModalOpen) return null;

  const trimmedDraft = draftKey.trim();
  const isOAuthDraft =
    trimmedDraft.startsWith('ya29.') ||
    trimmedDraft.startsWith('1//') ||
    /^bearer\s+/i.test(trimmedDraft);

  const handleSaveAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTesting || !trimmedDraft) return;
    await testSessionKey(draftKey);
  };

  const handleSaveAndClose = () => {
    if (isTesting || !trimmedDraft) return;
    saveSessionKey(draftKey);
    closeModal();
  };

  const handleRemove = () => {
    if (isTesting) return;
    setDraftKey('');
    removeSessionKey();
  };

  const statusConfig = (() => {
    switch (connectionState) {
      case 'checking':
        return {
          icon: Loader2,
          spin: true,
          colorClass: 'border-blue-200 bg-blue-50 text-blue-950',
          label: 'Verifying Connection...',
        };
      case 'user-verified':
        return {
          icon: CheckCircle2,
          spin: false,
          colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
          label: 'Connected — User API Key',
        };
      case 'server-verified':
        return {
          icon: CheckCircle2,
          spin: false,
          colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
          label: 'Connected — Server Environment Key',
        };
      case 'user-untested':
        return {
          icon: KeyRound,
          spin: false,
          colorClass: 'border-blue-200 bg-blue-50 text-blue-950',
          label: 'User Key Stored in Memory (Unverified)',
        };
      case 'user-invalid-key':
      case 'server-invalid-key':
        return {
          icon: AlertCircle,
          spin: false,
          colorClass: 'border-rose-200 bg-rose-50 text-rose-900',
          label: 'Invalid API Key',
        };
      case 'user-auth-failed':
      case 'server-auth-failed':
        return {
          icon: AlertCircle,
          spin: false,
          colorClass: 'border-rose-200 bg-rose-50 text-rose-900',
          label: 'Authentication Failed',
        };
      case 'user-quota-exceeded':
      case 'server-quota-exceeded':
        return {
          icon: AlertCircle,
          spin: false,
          colorClass: 'border-amber-200 bg-amber-50 text-amber-950',
          label: 'API Quota Exceeded',
        };
      case 'user-model-unavailable':
      case 'server-model-unavailable':
        return {
          icon: AlertCircle,
          spin: false,
          colorClass: 'border-amber-200 bg-amber-50 text-amber-950',
          label: 'Model Unavailable',
        };
      case 'user-connection-failed':
      case 'server-connection-failed':
        return {
          icon: AlertCircle,
          spin: false,
          colorClass: 'border-rose-200 bg-rose-50 text-rose-900',
          label: 'Connection Failed',
        };
      default:
        return {
          icon: AlertCircle,
          spin: false,
          colorClass: 'border-amber-200 bg-amber-50 text-amber-950',
          label: 'Setup Required',
        };
    }
  })();

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="byok-modal-title"
    >
      <div className="lab-panel relative w-full max-w-xl rounded-2xl p-6 sm:p-7 shadow-2xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent"
        />
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 id="byok-modal-title" className="font-display text-xl font-bold text-slate-900">
              API Key Settings
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Use your own Google Gemini API key (standard <span className="font-mono">AIza...</span>{' '}
              or Generative-Language-enabled <span className="font-mono">AQ....</span>) for live
              fact-checking, or fall back to the server environment key.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close API Key Settings"
            className="lab-btn-secondary rounded-xl p-2 text-slate-500 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Connection Status Banner */}
        <div className={`mt-4 rounded-xl border p-3.5 ${statusConfig.colorClass}`}>
          <div className="flex items-start gap-2.5">
            <StatusIcon
              className={`h-4 w-4 mt-0.5 shrink-0 ${statusConfig.spin ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <div className="text-xs leading-relaxed">
              <div className="font-semibold">{statusConfig.label}</div>
              <p className="mt-0.5 opacity-90">{statusMessage}</p>
            </div>
          </div>
        </div>

        {/* Key Form */}
        <form onSubmit={handleSaveAndVerify} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="gemini-api-key-input" className="text-sm font-medium text-slate-900">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
              >
                <span>Get a Gemini API key</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>

            <div className="relative flex items-center">
              <input
                id="gemini-api-key-input"
                type={showKey ? 'text' : 'password'}
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                disabled={isTesting}
                autoComplete="off"
                spellCheck={false}
                placeholder="Paste your AIza... or AQ.... API key"
                className="lab-input w-full rounded-xl py-2.5 pl-3.5 pr-11 text-sm placeholder:text-slate-400 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-2 rounded-lg p-1.5 text-slate-500 hover:text-slate-900 transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {isOAuthDraft ? (
              <p className="mt-2 text-xs font-medium text-rose-700">
                This looks like an OAuth access token rather than a Gemini API key. Generate a
                standard key at aistudio.google.com/apikey.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Accepts standard <span className="font-mono font-medium text-slate-700">AIza...</span>{' '}
                keys or Cloud <span className="font-mono font-medium text-slate-700">AQ....</span>{' '}
                keys restricted to <strong>Generative Language API</strong> (not Gemini API).
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="submit"
              disabled={isTesting || !trimmedDraft}
              className="lab-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              {isTesting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              <span>{isTesting ? 'Verifying...' : 'Test & Save Key'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndClose}
              disabled={isTesting || !trimmedDraft}
              className="lab-btn-secondary rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              Save &amp; Close
            </button>

            {sessionApiKey && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Remove API Key</span>
              </button>
            )}
          </div>
        </form>

        {/* Security & Trust Disclosure */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs text-slate-600 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-[#2563EB] mt-0.5 shrink-0" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="text-slate-900">Trust &amp; Privacy Notice:</strong> User-provided
              API keys are stored strictly in React memory for the current browser tab only—never
              saved in localStorage, sessionStorage, cookies, or any database, and cleared when you
              click Remove API Key or close/refresh the tab. Requests transmit your key over HTTPS
              solely to TruthLens&apos;s backend routes; keys are never logged or returned in
              responses.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
            <span>Model: {activeModel}</span>
            <span aria-hidden="true">·</span>
            <span>
              Server key:{' '}
              {!serverKeyConfigured
                ? 'Not configured'
                : serverKeyVerified
                  ? 'Verified'
                  : 'Configured (Verification failed)'}
            </span>
            <span aria-hidden="true">·</span>
            <span>User key takes priority</span>
          </div>
        </div>
      </div>
    </div>
  );
}
