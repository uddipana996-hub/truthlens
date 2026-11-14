import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Link2,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  CLAIM_CATEGORIES,
} from '../shared/schemas';
import type {
  ClaimCategory,
  FactCheckResponse,
  SocialExtractionResult,
  SubmissionType,
} from '../shared/types';

interface AnalyzerPageProps {
  onAnalysisComplete: (result: FactCheckResponse) => void;
}

interface SampleClaim {
  title: string;
  category: ClaimCategory;
  text: string;
}

const SAMPLE_CLAIMS: SampleClaim[] = [
  {
    title: 'Viral Health Claim (Multi-part)',
    category: 'Health',
    text: 'Drinking 4 liters of lemon water every morning cures kidney disease within 14 days and eliminates the need for prescription blood pressure medication, according to a 2024 WHO bulletin.',
  },
  {
    title: 'Climate & Energy Headline',
    category: 'Science',
    text: 'Solar and wind power generated more electricity than coal worldwide for the first time in 2025, while global solar installations continued to double every three years.',
  },
  {
    title: 'Forwarded Finance Alert',
    category: 'Finance',
    text: 'Starting next Monday, all bank transfers over $500 in the United States will be automatically taxed 5% under a new Federal Reserve emergency rule.',
  },
];

const PIPELINE_STEPS = [
  'Reading submitted content',
  'Identifying factual claims',
  'Searching available evidence',
  'Comparing reliable sources',
  'Preparing assessment',
];

export function AnalyzerPage({ onAnalysisComplete }: AnalyzerPageProps) {
  const {
    sessionApiKey,
    connectionState,
    hasEffectiveKey,
    openModal,
  } = useApiKey();

  const [activeTab, setActiveTab] = useState<SubmissionType>('text');
  const [category, setCategory] = useState<ClaimCategory>('General');
  const [textInput, setTextInput] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlFallbackText, setUrlFallbackText] = useState<string>('');
  const [extractionResult, setExtractionResult] = useState<SocialExtractionResult | null>(null);
  const [isExtractingUrl, setIsExtractingUrl] = useState<boolean>(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePayload, setImagePayload] = useState<{
    mimeType: 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp';
    base64: string;
    fileName: string;
    sizeKb: number;
  } | null>(null);
  const [imageNotes, setImageNotes] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isAnalyzing) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleClear = () => {
    setTextInput('');
    setUrlInput('');
    setUrlFallbackText('');
    setExtractionResult(null);
    setImageNotes('');
    setErrorBanner(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setImagePayload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplySample = (sample: SampleClaim) => {
    setActiveTab('text');
    setCategory(sample.category);
    setTextInput(sample.text);
    setErrorBanner(null);
  };

  const handleExtractUrl = async () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setErrorBanner('Enter a public post or article URL first.');
      return;
    }

    setErrorBanner(null);
    setIsExtractingUrl(true);
    setExtractionResult(null);

    try {
      const response = await fetch('/api/extract-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorBanner(data.message || 'Unable to inspect the submitted URL.');
        return;
      }

      const result = data as SocialExtractionResult;
      setExtractionResult(result);
      if (result.text && !urlFallbackText.trim()) {
        setUrlFallbackText(result.text);
      }
    } catch {
      setErrorBanner('Network error while checking the public URL.');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const handleImageFile = (file: File | undefined) => {
    if (!file) return;
    setErrorBanner(null);

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      setErrorBanner('Unsupported file type. Please upload a PNG, JPG, JPEG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorBanner('Image file is larger than 5 MB. Please upload a smaller screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = resultStr.indexOf(',');
      if (commaIdx === -1) {
        setErrorBanner('Could not read the selected image file.');
        return;
      }
      const base64 = resultStr.slice(commaIdx + 1);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(URL.createObjectURL(file));
      setImagePayload({
        mimeType: file.type as 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp',
        base64,
        fileName: file.name,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
      });
    };
    reader.onerror = () => {
      setErrorBanner('Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setImagePayload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    if (!hasEffectiveKey) {
      setErrorBanner(
        'No Gemini API key is configured. Click "API Key Settings" to add your session key.'
      );
      openModal();
      return;
    }

    if (activeTab === 'text' && textInput.trim().length < 5) {
      setErrorBanner('Please paste a claim, post, or headline (at least 5 characters).');
      return;
    }

    if (activeTab === 'url' && urlInput.trim().length < 8 && urlFallbackText.trim().length < 5) {
      setErrorBanner('Please enter a public URL or paste the post text.');
      return;
    }

    if (activeTab === 'image' && !imagePayload) {
      setErrorBanner('Please upload a PNG, JPG, JPEG, or WebP screenshot.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const requestBody: Record<string, unknown> = {
        submissionType: activeTab,
        category,
      };

      if (activeTab === 'text') {
        requestBody.text = textInput.trim();
      } else if (activeTab === 'url') {
        requestBody.url = urlInput.trim();
        requestBody.text = urlFallbackText.trim();
      } else if (activeTab === 'image' && imagePayload) {
        requestBody.text = imageNotes.trim();
        requestBody.imageData = {
          mimeType: imagePayload.mimeType,
          base64: imagePayload.base64,
        };
      }

      if (sessionApiKey.trim()) {
        requestBody.apiKey = sessionApiKey.trim();
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'URL_EXTRACTION_UNAVAILABLE' && data.extraction) {
          setExtractionResult(data.extraction as SocialExtractionResult);
        }
        setErrorBanner(data.message || 'Analysis failed. Please check your input and try again.');
        return;
      }

      onAnalysisComplete(data as FactCheckResponse);
    } catch {
      setErrorBanner('Network or timeout error while running fact-check analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const apiStatusLabel = (() => {
    switch (connectionState) {
      case 'user-verified':
        return 'Session Gemini key verified';
      case 'user-untested':
        return 'Session Gemini key set (untested)';
      case 'user-error':
        return 'Session Gemini key needs attention';
      case 'server-configured':
        return 'Server Gemini key available';
      case 'checking':
        return 'Checking API connection...';
      default:
        return 'No Gemini API key configured';
    }
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      {/* Header & API Connection Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
            Investigate a Claim
          </h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Submit pasted text, a public social media URL, or a screenshot to retrieve live
            evidence and verifiable citations.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#10162A] px-3.5 py-2 text-xs font-medium text-[#F8FAFC] transition-colors hover:border-[#8B5CF6]/50 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <KeyRound
            className={`h-3.5 w-3.5 ${hasEffectiveKey ? 'text-emerald-400' : 'text-amber-400'}`}
            aria-hidden="true"
          />
          <span>{apiStatusLabel}</span>
        </button>
      </div>

      {/* Main Submission Workspace */}
      <form
        onSubmit={handleAnalyze}
        className="rounded-2xl border border-white/12 bg-[#10162A] p-5 sm:p-7 space-y-6"
      >
        {/* Top Controls: Segmented Tabs + Category Selector */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div
            role="tablist"
            aria-label="Submission mode"
            className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#080B18] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'text'}
              onClick={() => {
                setActiveTab('text');
                setErrorBanner(null);
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Paste Text</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'url'}
              onClick={() => {
                setActiveTab('url');
                setErrorBanner(null);
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'url'
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Social Media URL</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'image'}
              onClick={() => {
                setActiveTab('image');
                setErrorBanner(null);
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'image'
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Upload Screenshot</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <label htmlFor="claim-category" className="text-xs font-medium text-[#94A3B8] shrink-0">
              Category
            </label>
            <select
              id="claim-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ClaimCategory)}
              className="rounded-xl border border-white/15 bg-[#080B18] px-3 py-2 text-xs font-medium text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
            >
              {CLAIM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Paste Text */}
        {activeTab === 'text' && (
          <div className="space-y-2">
            <label htmlFor="claim-text-area" className="block text-sm font-medium text-[#F8FAFC]">
              Paste claim, forwarded message, caption, or article excerpt
            </label>
            <textarea
              id="claim-text-area"
              rows={7}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              maxLength={15_000}
              placeholder="Example: Paste a forwarded WhatsApp message, Instagram caption, X post, or news headline you want verified..."
              className="w-full rounded-xl border border-white/15 bg-[#080B18] p-4 text-sm leading-relaxed text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            />
            <div className="flex items-center justify-between text-xs text-[#94A3B8] tabular-nums">
              <span>All submitted content is treated as untrusted text for factual review.</span>
              <span>{textInput.length} / 15,000</span>
            </div>
          </div>
        )}

        {/* Tab 2: Social Media URL */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="social-url-input" className="block text-sm font-medium text-[#F8FAFC]">
                Public post or article URL (Instagram, Facebook, X, Threads, TikTok, YouTube, Web)
              </label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  id="social-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://x.com/... or https://www.youtube.com/watch?v=..."
                  className="flex-1 rounded-xl border border-white/15 bg-[#080B18] px-4 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleExtractUrl}
                  disabled={isExtractingUrl || !urlInput.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#22D3EE]/40 bg-[#080B18] px-4 py-2.5 text-xs font-semibold text-[#F8FAFC] transition-colors hover:border-[#22D3EE] disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  {isExtractingUrl ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="h-3.5 w-3.5 text-[#22D3EE]" aria-hidden="true" />
                  )}
                  <span>{isExtractingUrl ? 'Checking URL...' : 'Fetch Public Post'}</span>
                </button>
              </div>
            </div>

            {extractionResult && (
              <div
                className={`rounded-xl border p-4 text-xs space-y-2 ${
                  extractionResult.text
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 font-semibold">
                  {extractionResult.text ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
                  )}
                  <span>Platform: {extractionResult.platformLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>Status: {extractionResult.status}</span>
                  {extractionResult.author && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Author: {extractionResult.author}</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed opacity-90">{extractionResult.note}</p>
                {extractionResult.failureReason && (
                  <p className="leading-relaxed text-amber-200">{extractionResult.failureReason}</p>
                )}
                <p className="leading-relaxed opacity-85">{extractionResult.fallbackSuggestion}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="url-fallback-text"
                className="block text-xs font-medium text-[#94A3B8]"
              >
                Post text / fallback caption or transcript (auto-filled when available, or paste
                manually if platform blocks retrieval)
              </label>
              <textarea
                id="url-fallback-text"
                rows={4}
                value={urlFallbackText}
                onChange={(e) => setUrlFallbackText(e.target.value)}
                placeholder="Paste caption, transcript, or extra context here if automated retrieval is restricted..."
                className="w-full rounded-xl border border-white/15 bg-[#080B18] p-3.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Upload Screenshot */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            {!imagePreviewUrl ? (
              <label
                htmlFor="screenshot-file-input"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImageFile(e.dataTransfer.files?.[0]);
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#080B18] px-6 py-10 text-center transition-colors hover:border-[#8B5CF6]/60"
              >
                <Upload className="h-8 w-8 text-[#8B5CF6]" aria-hidden="true" />
                <span className="mt-3 text-sm font-semibold text-[#F8FAFC]">
                  Upload a screenshot or viral graphic
                </span>
                <span className="mt-1 text-xs text-[#94A3B8]">
                  Supports PNG, JPG, JPEG, and WebP up to 5 MB
                </span>
                <input
                  ref={fileInputRef}
                  id="screenshot-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleImageFile(e.target.files?.[0])}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="rounded-xl border border-white/15 bg-[#080B18] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#F8FAFC]">{imagePayload?.fileName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{imagePayload?.sizeKb} KB</span>
                    <span aria-hidden="true">·</span>
                    <span>{imagePayload?.mimeType}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Remove Image</span>
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40 max-h-80 flex items-center justify-center">
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded screenshot preview"
                    className="max-h-80 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="image-notes" className="block text-xs font-medium text-[#94A3B8]">
                Optional context (e.g., where the screenshot came from or specific part to verify)
              </label>
              <input
                id="image-notes"
                type="text"
                value={imageNotes}
                onChange={(e) => setImageNotes(e.target.value)}
                placeholder="Optional: Add source platform or question about the screenshot..."
                className="w-full rounded-xl border border-white/15 bg-[#080B18] px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {errorBanner && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3.5 text-xs leading-relaxed text-rose-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Loading State (Honest pipeline step display without fabricated completion) */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-[#8B5CF6]/30 bg-[#080B18] p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#F8FAFC]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#22D3EE]" aria-hidden="true" />
                  <span>Running live verification pipeline on server...</span>
                </div>
                <span className="font-mono text-[#94A3B8] tabular-nums">{elapsedSeconds}s</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                {PIPELINE_STEPS.map((label, idx) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/10 bg-[#10162A]/70 px-3 py-2 text-[11px] text-[#94A3B8]"
                  >
                    <span className="font-mono text-[#22D3EE] mr-1.5">0{idx + 1}.</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={handleClear}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#080B18] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] transition-colors hover:text-[#F8FAFC] disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-opacity hover:opacity-95 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isAnalyzing ? 'Analyzing Evidence...' : 'Analyze'}</span>
          </button>
        </div>
      </form>

      {/* Three Clickable Sample Claims */}
      <section aria-labelledby="samples-heading" className="space-y-3">
        <h2 id="samples-heading" className="font-display text-sm font-semibold text-[#94A3B8]">
          Try a Sample Claim
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {SAMPLE_CLAIMS.map((sample) => (
            <button
              key={sample.title}
              type="button"
              onClick={() => handleApplySample(sample)}
              className="group rounded-xl border border-white/10 bg-[#10162A]/70 p-4 text-left transition-colors hover:border-[#8B5CF6]/50 hover:bg-[#10162A]"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-[#22D3EE]">
                <span className="font-semibold text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors">
                  {sample.title}
                </span>
                <span>{sample.category}</span>
              </div>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[#94A3B8]">
                {sample.text}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
