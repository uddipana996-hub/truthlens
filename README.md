# TRUTHLENS AI

**Think Critically. Share Responsibly.**

TRUTHLENS AI is an evidence-based social media fact-checking platform. It helps users investigate viral claims, forwarded messages, public social media URLs, and screenshots by decomposing factual assertions, retrieving live external information via Google Search grounding, evaluating supporting and contradicting evidence, and presenting traceable source citations in plain language.

> **Disclaimer:** TruthLens AI provides AI-assisted research and preliminary assessments. Its findings may be incomplete or incorrect. Always consult original sources and qualified professionals before making important decisions.

---

## Core Features

- **Three Input Modes**
  - **Paste Text**: Forwarded WhatsApp messages, social media captions, headlines, or multi-part claims.
  - **Social Media URL**: Modular platform detection and public metadata retrieval for Instagram, Facebook, X (Twitter), Threads, TikTok, YouTube, and public web articles—with honest paste-text and screenshot fallbacks when access is restricted.
  - **Upload Screenshot**: Multimodal image analysis (PNG, JPG, JPEG, WebP up to 5 MB) with preview, visible text extraction, explicit reporting of unreadable/ambiguous text, and evidence verification.
- **Six-Stage Evidence Verification Pipeline**
  1. Content Extraction & Prompt-Injection Isolation
  2. Claim Decomposition into Individual Testable Claims
  3. Live Evidence Retrieval via Gemini Google Search Grounding
  4. Evidence Evaluation (Authority, Recency, Stance, Missing Context)
  5. Structured Plain-Language Synthesis
  6. Strict Citation Validation (only URLs genuinely returned by `groundingMetadata.groundingChunks` are shown; zero invented links; defaults to `NEEDS_VERIFICATION` if evidence is missing)
- **Five Clear Assessment Categories**: `SUPPORTED`, `CONTRADICTED`, `MISLEADING`, `DISPUTED`, and `NEEDS_VERIFICATION`.
- **Bring Your Own API Key (BYOK)**:
  - Enter your own Gemini API key in **API Key Settings**, test connectivity, or remove it at any time.
  - User-provided keys are held **in frontend memory for the current tab session only**—never written to `localStorage`, `sessionStorage`, cookies, or a database.
  - Server-side `GEMINI_API_KEY` is supported as a fallback; user-supplied keys take precedence when provided.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion (`motion/react`)
- **Backend**: Node.js, Express, TypeScript (`tsx`), Zod validation
- **AI & Research**: Official `@google/genai` SDK (`gemini-4-hydrogen` default), Google Search Grounding (`googleSearch`), Structured JSON Outputs (`responseSchema`), Multimodal Image Analysis

---

## Project Structure

```text
├── server.ts                          # Express + Vite dev/prod server entrypoint (port 3000)
├── server/
│   ├── app.ts                         # API routes: /api/health, /api/test-key, /api/extract-post, /api/analyze
│   ├── middleware/security.ts         # Security headers, no-store API headers, rate limiting, key redaction
│   ├── utils/ssrf.ts                  # URL allowlisting, private/loopback IP blocking, safe redirect fetch
│   ├── adapters/social/               # Modular Instagram/Facebook/Threads, X, YouTube/TikTok, & Web adapters
│   └── services/
│       ├── geminiClient.ts            # Per-request GoogleGenAI client, key precedence, & key tester
│       ├── citationValidator.ts       # Deterministic SRC-N mapping from groundingChunks only
│       └── factCheckPipeline.ts       # 6-stage fact-checking orchestrator
├── src/
│   ├── shared/                        # Shared TypeScript types & Zod request/response schemas
│   ├── context/ApiKeyContext.tsx      # Volatile in-memory BYOK session state
│   ├── components/                    # BrandLogo, Navbar, ApiKeyModal, Footer
│   ├── pages/                         # HomePage, AnalyzerPage, ResultsDashboard, HowItWorksPage, AboutPage
│   └── utils/assessmentStyles.ts      # Accessible color + label metadata
└── tests/truthlens.test.ts            # Automated unit, security, API route, & conditional live tests
```

---

## Installation & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to set `GEMINI_API_KEY` (optional if using BYOK in the browser UI).

3. **Start the development server** (runs Express + Vite on `http://localhost:3000`):
   ```bash
   npm run dev
   ```

4. **Type-check, test, and build for production**:
   ```bash
   npm run lint
   npm test
   npm run build
   npm start
   ```

---

## Gemini API Key Setup & BYOK Configuration

- **Option 1 — Bring Your Own API Key (UI)**:
  1. Get a key from [Google AI Studio](https://aistudio.google.com/apikey).
  2. Click **API Key Settings** in the navigation bar.
  3. Paste your key, click **Save for This Session**, and optionally click **Test API Key**.
- **Option 2 — Server Environment Key (`.env`)**:
  Set `GEMINI_API_KEY=...` in `.env` (or your hosting provider's secrets manager). Never expose this variable with a `VITE_` prefix.

### Security & Trust Note for BYOK

Your session key is held strictly in browser memory and transmitted via same-origin `POST` requests to the application backend so the server can call Gemini securely. Only enter your API key into a deployment you trust. For maximum control, self-host TruthLens AI locally.

---

## Social Media Ingestion Limitations & Optional Credentials

TruthLens AI strictly respects platform boundaries: it **never** bypasses login screens, scrapes private accounts, or uses unauthorized cookies.

- **Instagram & Facebook**: Uses official Meta oEmbed endpoints when `META_ACCESS_TOKEN` is configured. Note that Meta oEmbed returns limited embed metadata (e.g., author and title/caption when available) and does not provide comments, private posts, or video transcripts.
- **X (Twitter)**: Uses official X API v2 when `X_BEARER_TOKEN` is configured, with a fallback to X's public oEmbed endpoint when accessible.
- **YouTube & TikTok**: Uses official public oEmbed endpoints (`youtube.com/oembed`, `tiktok.com/oembed`) to retrieve public titles/captions. Spoken video audio is not automatically transcribed—users can paste transcripts or upload keyframe screenshots.
- **Threads**: No unauthenticated public retrieval endpoint is available; users are guided to paste text or upload a screenshot.

**Note:** `META_ACCESS_TOKEN` and `X_BEARER_TOKEN` are completely separate from `GEMINI_API_KEY` and are only required if you want authenticated Meta or X API retrieval.

---

## Security Practices Implemented

- Request validation with **Zod** and payload size limits (`64 KB` for metadata/key tests, `8 MB` for screenshot uploads).
- **SSRF protection** blocking loopback, private IPv4/IPv6 ranges, cloud metadata IPs (`169.254.169.254`), non-HTTP protocols, and embedded URL credentials.
- In-memory sliding-window **rate limiting** on `/api/*`.
- `Cache-Control: no-store` on all API responses and automatic redaction of API keys/tokens in error sanitization.
- Prompt-injection isolation wrapping submitted posts and images inside untrusted data boundaries.
- Zero database persistence of user claims or uploaded screenshots.
