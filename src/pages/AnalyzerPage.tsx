import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { MiniMicrochipCore, MiniRoboticArmNode } from '../components/Mini3DModels';
import {
  DEMO_REPORTS,
  buildCustomDemoReport,
} from '../data/demoSamples';
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
  key: 'health' | 'science' | 'finance';
  title: string;
  category: ClaimCategory;
  text: string;
  badge: string;
}

const SAMPLE_CLAIMS: SampleClaim[] = [
  {
    key: 'health',
    title: 'Viral Health Claim (Multi-part)',
    category: 'Health',
    badge: 'Sample · Contradicted',
    text: 'Drinking 4 liters of lemon water every morning cures kidney disease within 14 days and eliminates the need for prescription blood pressure medication, according to a 2024 WHO bulletin.',
  },
  {
    key: 'science',
    title: 'Climate & Energy Headline',
    category: 'Science',
    badge: 'Sample · Misleading',
    text: 'Solar and wind power generated more electricity than coal worldwide for the first time in 2025, while global solar installations continued to double every three years.',
  },
  {
    key: 'finance',
    title: 'Forwarded Finance Alert',
    category: 'Finance',
    badge: 'Sample · Contradicted',
    text: 'Starting next Monday, all bank transfers over $500 in the United States will be automatically taxed 5% under a new Federal Reserve emergency rule.',
  },
];

const SCAN_STAGES = [
  'Input received',
  'Decomposing claims',
  'Analyzing content',
  'Cross-checking sources',
  'Preparing report',
];

export function AnalyzerPage({ onAnalysisComplete }: AnalyzerPageProps) {
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

  const [scanMode, setScanMode] = useState<'idle' | 'demo'>('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanCompleted, setScanCompleted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const demoTimersRef = useRef<number[]>([]);
  const isScanning = scanMode !== 'idle';

  const clearDemoTimers = () => {
    demoTimersRef.current.forEach((id) => window.clearTimeout(id));
    demoTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearDemoTimers();
    };
  }, []);

  useEffect(() => {
    if (!isScanning) {
      setElapsedSeconds(0);
      return;
    }
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isScanning]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleClear = () => {
    if (isScanning) return;
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
    if (isScanning) return;
    setActiveTab('text');
    setCategory(sample.category);
    setTextInput(sample.text);
    setErrorBanner(null);
  };

  const handleRunDemoScan = (overrideReport?: FactCheckResponse) => {
    setErrorBanner(null);

    if (!overrideReport) {
      if (activeTab === 'text' && textInput.trim().length < 5) {
        setErrorBanner(
          'Enter at least 5 characters or click a Sample Claim below to run a Demo Scan.'
        );
        return;
      }
      if (activeTab === 'url' && urlInput.trim().length < 8 && urlFallbackText.trim().length < 5) {
        setErrorBanner('Enter a URL or caption text to run a Demo Scan.');
        return;
      }
      if (activeTab === 'image' && !imagePayload && imageNotes.trim().length < 5) {
        setErrorBanner('Upload a screenshot or enter notes to run a Demo Scan.');
        return;
      }
    }

    clearDemoTimers();
    setScanMode('demo');
    setScanCompleted(false);
    setScanProgress(8);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const totalMs = prefersReducedMotion ? 450 : 1900;
    const stepDelay = Math.round(totalMs / 5);

    const report =
      overrideReport ??
      buildCustomDemoReport({
        submissionType: activeTab,
        category,
        submittedText:
          activeTab === 'text'
            ? textInput.trim()
            : activeTab === 'url'
              ? urlFallbackText.trim()
              : imageNotes.trim(),
        sourceUrl: activeTab === 'url' ? urlInput.trim() : null,
        imageName: activeTab === 'image' ? imagePayload?.fileName || null : null,
      });

    const checkpoints = [22, 46, 70, 90, 100];
    checkpoints.forEach((pct, index) => {
      const t = window.setTimeout(() => {
        setScanProgress(pct);
        if (pct === 100) {
          setScanCompleted(true);
        }
      }, stepDelay * (index + 1));
      demoTimersRef.current.push(t);
    });

    const finishTimer = window.setTimeout(() => {
      setScanMode('idle');
      setScanCompleted(false);
      setScanProgress(0);
      onAnalysisComplete({
        ...report,
        researchedAt: new Date().toISOString(),
      });
    }, totalMs + (prefersReducedMotion ? 150 : 520));
    demoTimersRef.current.push(finishTimer);
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

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch('/api/extract-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
        signal: controller.signal,
      });

      const rawText = await response.text();
      let data: Record<string, unknown> | null = null;
      try {
        data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
      } catch {
        data = null;
      }

      if (!response.ok || !data) {
        const msg =
          (data && typeof data.message === 'string' && data.message) ||
          `Unable to inspect URL (HTTP ${response.status}).`;
        setErrorBanner(msg);
        return;
      }

      const result = data as unknown as SocialExtractionResult;
      setExtractionResult(result);
      if (result.text && !urlFallbackText.trim()) {
        setUrlFallbackText(result.text);
      }
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      setErrorBanner(
        isAbort
          ? 'URL extraction timed out. Try pasting the post text or uploading a screenshot.'
          : err instanceof Error
            ? `Failed to reach /api/extract-post (${err.message}).`
            : 'Network error while checking the public URL.'
      );
    } finally {
      window.clearTimeout(timeoutId);
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

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    if (activeTab === 'text' && textInput.trim().length < 5) {
      setErrorBanner('Please paste a claim, post, or headline (at least 5 characters).');
      return;
    }

    if (activeTab === 'url' && urlInput.trim().length < 8 && urlFallbackText.trim().length < 5) {
      setErrorBanner('Please enter a public URL or paste the post text.');
      return;
    }

    if (activeTab === 'image' && !imagePayload && imageNotes.trim().length < 5) {
      setErrorBanner('Please upload a PNG, JPG, JPEG, or WebP screenshot or add claim notes.');
      return;
    }

    handleRunDemoScan();
  };

  const activeStageIndex = Math.min(
    SCAN_STAGES.length - 1,
    Math.floor((scanProgress / 100) * SCAN_STAGES.length)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8"
    >
      {/* Header & Local Mode Indicator */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/85 pb-6">
        <div className="flex items-start gap-3.5">
          <div className="hidden sm:flex rounded-2xl border border-slate-200/85 bg-white/90 p-1.5 shadow-2xs">
            <MiniRoboticArmNode />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Investigate a Claim
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Submit text, a public post URL, or a screenshot to run an interactive local TruthLens
              scan and explore structured sample reports.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200/85 bg-blue-50/75 px-3.5 py-2 text-xs font-medium text-[#1D4ED8] whitespace-nowrap shrink-0 self-start sm:self-auto">
          <Cpu className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
          <span>Interactive Demo Mode</span>
        </div>
      </div>

      {/* Main Submission Workspace */}
      <form
        onSubmit={handleAnalyze}
        className="lab-panel relative rounded-2xl p-5 sm:p-7 space-y-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB]/45 to-transparent"
        />

        {/* Top Controls: Segmented Tabs + Category Selector */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div
            role="tablist"
            aria-label="Submission mode"
            className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/90 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'text'}
              onClick={() => {
                setActiveTab('text');
                setErrorBanner(null);
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'text'
                  ? 'lab-btn-primary'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
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
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'url'
                  ? 'lab-btn-primary'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
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
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'image'
                  ? 'lab-btn-primary'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Upload Screenshot</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <label htmlFor="claim-category" className="text-xs font-medium text-slate-600 shrink-0">
              Category
            </label>
            <select
              id="claim-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ClaimCategory)}
              className="lab-input rounded-xl px-3 py-2 text-xs font-medium"
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
            <label htmlFor="claim-text-area" className="block text-sm font-medium text-slate-900">
              Paste claim, forwarded message, caption, or article excerpt
            </label>
            <textarea
              id="claim-text-area"
              rows={7}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              maxLength={15_000}
              placeholder="Example: Paste a forwarded WhatsApp message, Instagram caption, X post, or news headline—or select a sample claim below..."
              className="lab-input w-full rounded-xl p-4 text-sm leading-relaxed placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
              <span>All submitted content is treated as untrusted text for factual review.</span>
              <span className="font-mono">{textInput.length} / 15,000</span>
            </div>
          </div>
        )}

        {/* Tab 2: Social Media URL */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="social-url-input" className="block text-sm font-medium text-slate-900">
                Public post or article URL (Instagram, Facebook, X, Threads, TikTok, YouTube, Web)
              </label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  id="social-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://x.com/... or https://www.youtube.com/watch?v=..."
                  className="lab-input flex-1 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleExtractUrl}
                  disabled={isExtractingUrl || !urlInput.trim()}
                  className="lab-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border-blue-200 px-4 py-2.5 text-xs font-semibold disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  {isExtractingUrl ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563EB]" aria-hidden="true" />
                  ) : (
                    <Search className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
                  )}
                  <span>{isExtractingUrl ? 'Checking URL...' : 'Fetch Public Post'}</span>
                </button>
              </div>
            </div>

            {extractionResult && (
              <div
                className={`rounded-xl border p-4 text-xs space-y-2 ${
                  extractionResult.text
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : 'border-amber-200 bg-amber-50 text-amber-950'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 font-semibold">
                  {extractionResult.text ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
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
                  <p className="leading-relaxed text-amber-800">{extractionResult.failureReason}</p>
                )}
                <p className="leading-relaxed opacity-85">{extractionResult.fallbackSuggestion}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="url-fallback-text"
                className="block text-xs font-medium text-slate-600"
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
                className="lab-input w-full rounded-xl p-3.5 text-sm placeholder:text-slate-400"
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
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-slate-50/80 px-6 py-10 text-center transition-all hover:border-blue-500 hover:bg-blue-50/40"
              >
                <div className="lab-icon-badge h-12 w-12 transition-transform duration-200 group-hover:scale-105">
                  <Upload className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
                </div>
                <span className="mt-3.5 text-sm font-semibold text-slate-900">
                  Upload a screenshot or viral graphic
                </span>
                <span className="mt-1 text-xs text-slate-500">
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{imagePayload?.fileName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{imagePayload?.sizeKb} KB</span>
                    <span aria-hidden="true">·</span>
                    <span>{imagePayload?.mimeType}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Remove Image</span>
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white max-h-80 flex items-center justify-center p-2">
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded screenshot preview"
                    className="max-h-72 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="image-notes" className="block text-xs font-medium text-slate-600">
                Optional context (e.g., where the screenshot came from or specific part to verify)
              </label>
              <input
                id="image-notes"
                type="text"
                value={imageNotes}
                onChange={(e) => setImageNotes(e.target.value)}
                placeholder="Optional: Add source platform or question about the screenshot..."
                className="lab-input w-full rounded-xl px-3.5 py-2.5 text-sm placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {errorBanner && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs leading-relaxed text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Live Scanning Experience */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/85 via-white to-cyan-50/60 p-4 sm:p-5 space-y-3.5 shadow-2xs"
            >
              <div
                aria-hidden="true"
                className="animate-lab-scan pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent"
              />

              <div className="relative flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5 font-semibold text-slate-900">
                  <MiniMicrochipCore className="h-8 w-8" />
                  <div>
                    <p className="font-display text-sm font-bold text-slate-900">
                      {scanCompleted
                        ? 'Scan complete — Opening report'
                        : 'Running Frontend Demo Scan (Sample Mode)'}
                    </p>
                    <p className="text-[11px] font-normal text-slate-600">
                      Stage: {SCAN_STAGES[activeStageIndex]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                  <span className="rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0284C7]">
                    DEMO
                  </span>
                  <span className="font-semibold text-[#2563EB]">{scanProgress}%</span>
                  <span className="text-slate-500">{elapsedSeconds}s</span>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div
                className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/80"
                role="progressbar"
                aria-valuenow={scanProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Scanning progress"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#06B6D4] transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              {/* Clear 5-Stage Scanning Indicators */}
              <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-5">
                {SCAN_STAGES.map((label, idx) => {
                  const isDone = scanCompleted || idx < activeStageIndex;
                  const isCurrent = !scanCompleted && idx === activeStageIndex;
                  return (
                    <div
                      key={label}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] transition-colors ${
                        isDone
                          ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900'
                          : isCurrent
                            ? 'border-blue-300 bg-white text-slate-900 shadow-2xs ring-1 ring-blue-500/20'
                            : 'border-slate-200/80 bg-white/75 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      ) : isCurrent ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#2563EB]" aria-hidden="true" />
                      ) : (
                        <span className="font-mono font-semibold text-slate-400">0{idx + 1}.</span>
                      )}
                      <span className="truncate font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/85 pt-5">
          <button
            type="button"
            onClick={handleClear}
            disabled={isScanning}
            className="lab-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleRunDemoScan()}
              disabled={isScanning}
              className="lab-btn-secondary inline-flex items-center gap-2 rounded-xl border-blue-200 px-4 py-2.5 text-xs font-semibold text-[#1D4ED8] hover:border-blue-300 hover:bg-blue-50/70 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Run Demo Scan</span>
            </button>

            <button
              type="submit"
              disabled={isScanning}
              className="lab-btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isScanning ? 'Scanning Content...' : 'Analyze'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Three Clickable Sample Claims + One-Click Demo Preview */}
      <section aria-labelledby="samples-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="samples-heading" className="font-display text-sm font-semibold text-slate-600">
            Interactive Demo Samples (Local Preview)
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Cpu className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
            <span>Load into editor or preview full sample report</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {SAMPLE_CLAIMS.map((sample) => (
            <div
              key={sample.title}
              className="lab-panel-interactive flex flex-col justify-between rounded-xl p-4 space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900">{sample.title}</span>
                  <span className="font-mono text-[11px] text-[#2563EB] shrink-0">
                    {sample.category}
                  </span>
                </div>
                <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
                  {sample.text}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3 text-xs">
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleApplySample(sample)}
                  className="font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40"
                >
                  Load Text
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => {
                    handleApplySample(sample);
                    handleRunDemoScan(DEMO_REPORTS[sample.key]);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  <span>Run Demo Scan</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
