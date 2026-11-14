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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSessionKey(draftKey);
  };

  const handleTest = async () => {
    await testSessionKey(draftKey);
  };

  const handleRemove = () => {
    setDraftKey('');
    removeSessionKey();
  };

  const statusConfig = (() => {
    switch (connectionState) {
      case 'user-verified':
        return {
          icon: CheckCircle2,
          colorClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
          label: 'Connected (User Session Key)',
        };
      case 'user-untested':
        return {
          icon: KeyRound,
          colorClass: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
          label: 'Session Key Stored in Memory (Untested)',
        };
      case 'user-error':
        return {
          icon: AlertCircle,
          colorClass: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
          label: 'Key Verification Error',
        };
      case 'server-configured':
        return {
          icon: CheckCircle2,
          colorClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
          label: 'Connected (Server Environment Key)',
        };
      default:
        return {
          icon: AlertCircle,
          colorClass: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
          label: 'Setup Required',
        };
    }
  })();

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="byok-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-[#10162A] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 id="byok-modal-title" className="font-display text-xl font-bold text-[#F8FAFC]">
              API Key Settings (BYOK)
            </h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Use your own Google Gemini API key to power TruthLens AI. Your key is sent to the
              application server for processing and is not saved in the application&apos;s database.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close API Key Settings"
            className="rounded-lg border border-white/10 p-2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Connection Status Banner */}
        <div className={`mt-4 rounded-xl border p-3.5 ${statusConfig.colorClass}`}>
          <div className="flex items-start gap-2.5">
            <StatusIcon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-xs leading-relaxed">
              <div className="font-semibold">{statusConfig.label}</div>
              <p className="mt-0.5 opacity-90">{statusMessage}</p>
            </div>
          </div>
        </div>

        {/* Key Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="gemini-api-key-input" className="text-sm font-medium text-[#F8FAFC]">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#22D3EE] hover:underline"
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
                autoComplete="off"
                spellCheck={false}
                placeholder="Paste your Gemini API key (held in session memory only)"
                className="w-full rounded-xl border border-white/15 bg-[#080B18] py-2.5 pl-3.5 pr-11 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-2 rounded-lg p-1.5 text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="submit"
              disabled={!draftKey.trim()}
              className="rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              Save for This Session
            </button>

            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !draftKey.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#080B18] px-4 py-2 text-xs font-semibold text-[#F8FAFC] transition-colors hover:border-[#22D3EE]/50 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              {isTesting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              <span>{isTesting ? 'Testing...' : 'Test API Key'}</span>
            </button>

            {sessionApiKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Remove API Key</span>
              </button>
            )}
          </div>
        </form>

        {/* Security & Trust Disclosure */}
        <div className="mt-5 rounded-xl border border-white/10 bg-[#080B18]/80 p-3.5 text-xs text-[#94A3B8] space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-[#8B5CF6] mt-0.5 shrink-0" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="text-[#F8FAFC]">Trust &amp; Privacy Notice:</strong> Your key is
              held exclusively in browser memory for this tab session (never in localStorage,
              sessionStorage, or cookies). Because it is transmitted to the application backend over
              HTTPS for Gemini grounding calls, only enter a key into a deployment you trust. Local
              self-hosting is recommended for maximum control.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2 text-[11px] text-[#94A3B8]">
            <span>Model: {activeModel}</span>
            <span aria-hidden="true">·</span>
            <span>
              Server fallback key: {serverKeyConfigured ? 'Configured' : 'Not configured'}
            </span>
            <span aria-hidden="true">·</span>
            <span>User key takes precedence when entered</span>
          </div>
        </div>
      </div>
    </div>
  );
}
