import type { ClaimCategory, FactCheckResponse, SubmissionType } from '../shared/types';

export interface DemoActivityItem {
  id: string;
  title: string;
  category: ClaimCategory;
  assessmentLabel: string;
  assessmentKey: FactCheckResponse['assessment'];
  timestampLabel: string;
  report: FactCheckResponse;
}

export interface DemoCategoryStat {
  category: ClaimCategory;
  sampleCount: number;
  percentage: number;
}

export const DEMO_DASHBOARD_METRICS = {
  label: 'Sample Demo Metrics (Illustrative Dataset)',
  totalSubmissions: 148,
  reportsGenerated: 142,
  categoriesTracked: 6,
  sampleSourcesIndexed: 412,
};

export const DEMO_CATEGORY_DISTRIBUTION: DemoCategoryStat[] = [
  { category: 'Health', sampleCount: 42, percentage: 28 },
  { category: 'Science', sampleCount: 31, percentage: 21 },
  { category: 'Finance', sampleCount: 27, percentage: 18 },
  { category: 'Politics', sampleCount: 22, percentage: 15 },
  { category: 'News', sampleCount: 16, percentage: 11 },
  { category: 'Technology', sampleCount: 10, percentage: 7 },
];

export const DEMO_OUTCOME_DISTRIBUTION = [
  { label: 'Misleading', count: 48, share: 34, barColor: 'bg-orange-500', stroke: '#F97316' },
  { label: 'Contradicted', count: 38, share: 27, barColor: 'bg-rose-500', stroke: '#F43F5E' },
  { label: 'Supported', count: 34, share: 24, barColor: 'bg-emerald-500', stroke: '#10B981' },
  { label: 'Needs Verification', count: 22, share: 15, barColor: 'bg-slate-400', stroke: '#64748B' },
];

export const DEMO_REPORTS: Record<string, FactCheckResponse> = {
  health: {
    status: 'success',
    isDemo: true,
    demoNote:
      'Sample Demo Report: Illustrative output shown for frontend demonstration. No external verification API was called.',
    assessment: 'CONTRADICTED',
    confidence: {
      level: 'HIGH',
      reason:
        'Sample demonstration cites medical consensus records showing lemon water does not cure kidney disease or replace blood pressure medication.',
    },
    claimSummary:
      'Claim that drinking 4 liters of lemon water each morning cures kidney disease in 14 days and replaces blood pressure prescriptions.',
    overallExplanation:
      'Hydration supports general kidney health, but medical institutions confirm there is no clinical evidence that lemon water cures chronic kidney disease or safely replaces prescribed antihypertensive medication. Stopping blood pressure medicine abruptly can also pose serious health risks.',
    keyFindings: [
      'No World Health Organization bulletin recommends curing kidney disease with 4 liters of lemon water.',
      'Excessive rapid water intake (4 liters every morning) can overload kidneys in patients with impaired renal function.',
      'Stopping prescription blood pressure medication without clinical supervision increases cardiovascular risk.',
    ],
    claims: [
      {
        text: 'Drinking 4 liters of lemon water every morning cures kidney disease within 14 days.',
        assessment: 'CONTRADICTED',
        explanation:
          'Clinical nephrology guidance states that chronic kidney disease cannot be cured in 14 days by citrus water.',
        supportingSourceIds: [],
        contradictingSourceIds: ['DEMO-SRC-1', 'DEMO-SRC-2'],
        missingContext: ['Fluid intake limits vary significantly by kidney disease stage.'],
      },
      {
        text: 'Eliminates the need for prescription blood pressure medication per a 2024 WHO bulletin.',
        assessment: 'CONTRADICTED',
        explanation:
          'No 2024 WHO guidance advises replacing prescribed hypertension medication with lemon water.',
        supportingSourceIds: [],
        contradictingSourceIds: ['DEMO-SRC-2'],
        missingContext: ['Medication adjustments require physician oversight.'],
      },
    ],
    supportingEvidence: [],
    contradictingEvidence: [
      'National kidney health guidelines note that diet and hydration support management but do not cure established kidney disease.',
      'Hypertension clinical protocols emphasize continuing prescribed therapy alongside medical follow-up.',
    ],
    missingContext: [
      'Patients with reduced kidney function are often advised to monitor or restrict excessive daily fluid intake.',
    ],
    questionsToInvestigate: [
      'Does the forwarded post link to an actual numbered WHO publication?',
      'Which stage of kidney disease is being referenced?',
    ],
    recommendedActions: [
      'Do not discontinue prescribed blood pressure medication based on social media posts.',
      'Consult a licensed physician or nephrologist before making high-volume fluid changes.',
      'Verify medical claims against official health organization bulletins.',
    ],
    sources: [
      {
        id: 'DEMO-SRC-1',
        title: 'Sample Reference: Chronic Kidney Disease Management Overview',
        publisher: 'National Institute of Diabetes and Digestive and Kidney Diseases (Sample)',
        url: 'https://www.niddk.nih.gov/health-information/kidney-disease',
        publishedAt: '2025-02-10',
        retrievedAt: '2026-11-15T12:00:00.000Z',
        relevance: 'Sample educational reference explaining standard medical management of kidney disease.',
        stance: 'CONTRADICTS',
      },
      {
        id: 'DEMO-SRC-2',
        title: 'Sample Reference: Hypertension Treatment & Medication Adherence',
        publisher: 'World Health Organization (Sample)',
        url: 'https://www.who.int/news-room/fact-sheets/detail/hypertension',
        publishedAt: '2025-09-14',
        retrievedAt: '2026-11-15T12:00:00.000Z',
        relevance: 'Sample reference confirming evidence-based blood pressure treatment requires medical supervision.',
        stance: 'CONTRADICTS',
      },
    ],
    limitations: [
      'This is a predefined sample report created for local frontend demonstration without external API calls.',
    ],
    submission: {
      submissionType: 'text',
      submittedText:
        'Drinking 4 liters of lemon water every morning cures kidney disease within 14 days and eliminates the need for prescription blood pressure medication, according to a 2024 WHO bulletin.',
      sourceUrl: null,
      detectedPlatform: 'unknown',
      extractionStatus: 'user_provided',
      category: 'Health',
      hasImage: false,
      extractedImageText: null,
      unreadableImageNotes: null,
    },
    researchedAt: '2026-11-15T12:00:00.000Z',
  },

  science: {
    status: 'success',
    isDemo: true,
    demoNote:
      'Sample Demo Report: Illustrative output shown for frontend demonstration. No external verification API was called.',
    assessment: 'MISLEADING',
    confidence: {
      level: 'MEDIUM',
      reason:
        'Sample energy dataset illustrates rapid renewable growth alongside missing seasonal and regional grid context.',
    },
    claimSummary:
      'Solar and wind generated more electricity than coal globally in 2025 while solar installations doubled every three years.',
    overallExplanation:
      'Global solar and wind capacity expanded rapidly in recent years, outpacing coal in specific peak months or regional markets. However, full-year global electricity generation totals and installation doubling intervals vary depending on whether capacity or generated terawatt-hours are measured.',
    keyFindings: [
      'Solar and wind surpassed coal in select monthly generation milestones rather than uniformly across all regions.',
      'Doubling intervals differ between cumulative installed gigawatts and annual electricity output.',
    ],
    claims: [
      {
        text: 'Solar and wind power generated more electricity than coal worldwide for the first time in 2025.',
        assessment: 'MISLEADING',
        explanation:
          'Milestone comparisons often reference specific periods or combined clean sources rather than full-year global TWh totals.',
        supportingSourceIds: ['DEMO-SRC-3'],
        contradictingSourceIds: [],
        missingContext: ['Clarify whether the figure covers a single half-year or full-year generation.'],
      },
      {
        text: 'Global solar installations continued to double every three years.',
        assessment: 'SUPPORTED',
        explanation:
          'Historical cumulative photovoltaic capacity has roughly doubled every 2.5 to 3.5 years over the past decade.',
        supportingSourceIds: ['DEMO-SRC-4'],
        contradictingSourceIds: [],
        missingContext: ['Growth rates vary across mature versus emerging grid markets.'],
      },
    ],
    supportingEvidence: [
      'International energy statistics confirm sustained exponential growth in global solar PV additions.',
    ],
    contradictingEvidence: [
      'Coal remained a major share of baseload electricity generation in several high-demand industrial grids.',
    ],
    missingContext: [
      'Headline omits the distinction between installed nameplate capacity (GW) and actual electricity generated (TWh).',
    ],
    questionsToInvestigate: [
      'Does the cited report measure first-half 2025 generation or full calendar year 2025?',
      'Are hydro and nuclear grouped separately from wind and solar?',
    ],
    recommendedActions: [
      'Check the primary Ember or IEA annual electricity dataset for full-year totals.',
      'Distinguish capacity additions from actual grid generation.',
    ],
    sources: [
      {
        id: 'DEMO-SRC-3',
        title: 'Sample Reference: Global Electricity Review & Generation Mix',
        publisher: 'Ember Energy Data (Sample)',
        url: 'https://ember-energy.org/',
        publishedAt: '2025-10-01',
        retrievedAt: '2026-11-15T12:00:00.000Z',
        relevance: 'Sample dataset comparing wind, solar, and coal shares in global electricity.',
        stance: 'CONTEXTUALIZES',
      },
      {
        id: 'DEMO-SRC-4',
        title: 'Sample Reference: Renewables Global Capacity Outlook',
        publisher: 'International Energy Agency (Sample)',
        url: 'https://www.iea.org/topics/renewables',
        publishedAt: '2025-11-01',
        retrievedAt: '2026-11-15T12:00:00.000Z',
        relevance: 'Sample reference documenting multi-year solar PV deployment growth.',
        stance: 'SUPPORTS',
      },
    ],
    limitations: [
      'This is a predefined sample report created for local frontend demonstration without external API calls.',
    ],
    submission: {
      submissionType: 'text',
      submittedText:
        'Solar and wind power generated more electricity than coal worldwide for the first time in 2025, while global solar installations continued to double every three years.',
      sourceUrl: null,
      detectedPlatform: 'unknown',
      extractionStatus: 'user_provided',
      category: 'Science',
      hasImage: false,
      extractedImageText: null,
      unreadableImageNotes: null,
    },
    researchedAt: '2026-11-15T12:00:00.000Z',
  },

  finance: {
    status: 'success',
    isDemo: true,
    demoNote:
      'Sample Demo Report: Illustrative output shown for frontend demonstration. No external verification API was called.',
    assessment: 'CONTRADICTED',
    confidence: {
      level: 'HIGH',
      reason:
        'Sample regulatory archive confirms the Federal Reserve has no authority to enact federal transfer taxes on consumer bank transfers.',
    },
    claimSummary:
      'Claim that all U.S. bank transfers over $500 will be taxed 5% starting next Monday under a Federal Reserve emergency rule.',
    overallExplanation:
      'This viral message exhibits classic urgency framing ("starting next Monday") and misstates how U.S. tax law works. Federal taxes require congressional legislation rather than a Federal Reserve rule, and no 5% tax on transfers over $500 exists.',
    keyFindings: [
      'The Federal Reserve manages monetary policy and payment rails, not federal consumer taxation.',
      'No Federal Register notice or Treasury rule imposes a 5% tax on bank transfers over $500.',
    ],
    claims: [
      {
        text: 'All U.S. bank transfers over $500 will be automatically taxed 5% under a Federal Reserve emergency rule.',
        assessment: 'CONTRADICTED',
        explanation:
          'Neither the Federal Reserve nor the IRS has announced or enacted any 5% transfer tax.',
        supportingSourceIds: [],
        contradictingSourceIds: ['DEMO-SRC-5'],
        missingContext: ['Often confused with routine bank reporting thresholds or phishing lures.'],
      },
    ],
    supportingEvidence: [],
    contradictingEvidence: [
      'Official Federal Reserve announcements contain no emergency transfer tax rule.',
    ],
    missingContext: [
      'Urgent "next Monday" wording without a specific date is a common hallmark of recurring chain hoaxes.',
    ],
    questionsToInvestigate: [
      'Does the message link to an official .gov announcement or ask users to move money?',
    ],
    recommendedActions: [
      'Do not click unfamiliar links or move funds in response to forwarded banking alerts.',
      'Verify any policy changes directly at federalreserve.gov or irs.gov.',
    ],
    sources: [
      {
        id: 'DEMO-SRC-5',
        title: 'Sample Reference: Federal Reserve Official Announcements & Press Releases',
        publisher: 'Board of Governors of the Federal Reserve System (Sample)',
        url: 'https://www.federalreserve.gov/newsevents/pressreleases.htm',
        publishedAt: '2025-11-01',
        retrievedAt: '2026-11-15T12:00:00.000Z',
        relevance: 'Sample official feed showing no 5% bank transfer tax policy exists.',
        stance: 'CONTRADICTS',
      },
    ],
    limitations: [
      'This is a predefined sample report created for local frontend demonstration without external API calls.',
    ],
    submission: {
      submissionType: 'text',
      submittedText:
        'Starting next Monday, all bank transfers over $500 in the United States will be automatically taxed 5% under a new Federal Reserve emergency rule.',
      sourceUrl: null,
      detectedPlatform: 'unknown',
      extractionStatus: 'user_provided',
      category: 'Finance',
      hasImage: false,
      extractedImageText: null,
      unreadableImageNotes: null,
    },
    researchedAt: '2026-11-15T12:00:00.000Z',
  },

  politics: {
    status: 'success',
    isDemo: true,
    demoNote:
      'Sample Demo Report: Illustrative output shown for frontend demonstration. No external verification API was called.',
    assessment: 'MISLEADING',
    confidence: {
      level: 'HIGH',
      reason:
        'Sample legislative record shows the cited municipal bill expanded weekend drop-off hours rather than prohibiting paper ballot inspection.',
    },
    claimSummary:
      'Viral video claims a newly passed state voting amendment bans independent observers from polling stations nationwide.',
    overallExplanation:
      'The referenced legislative amendment applies only to one state procedural update regarding observer badge registration deadlines and distance markers. It does not ban accredited election observers nationwide or prohibit paper ballot audits.',
    keyFindings: [
      'A single-state procedural bill was inaccurately framed as a nationwide ban on election observers.',
      'Accredited party and non-partisan observers remain permitted inside polling locations upon registering prior to election week.',
    ],
    claims: [
      {
        text: 'A newly passed state amendment bans independent observers from polling stations nationwide.',
        assessment: 'CONTRADICTED',
        explanation:
          'State statutes govern local administrative rules and cannot impose nationwide polling observer bans.',
        supportingSourceIds: [],
        contradictingSourceIds: ['DEMO-SRC-6'],
        missingContext: ['The clip cites Section 4(b) without showing the registration timeline in Section 4(a).'],
      },
    ],
    supportingEvidence: [],
    contradictingEvidence: [
      'Published statutory text retains observer credentialing provisions alongside clear buffer-zone guidelines.',
    ],
    missingContext: [
      'Short social clips omitted the preceding clause clarifying advance credential issuance.',
    ],
    questionsToInvestigate: [
      'Which state legislature bill number is shown in the background graphic?',
    ],
    recommendedActions: [
      'Read the enacted statutory text directly on the official state legislature website.',
      'Check county clerk observer accreditation deadlines prior to election day.',
    ],
    sources: [
      {
        id: 'DEMO-SRC-6',
        title: 'Sample Reference: State Election Administration & Observer Guidelines',
        publisher: 'National Conference of State Legislatures (Sample)',
        url: 'https://www.ncsl.org/elections-and-campaigns',
        publishedAt: '2025-10-18',
        retrievedAt: '2026-11-15T12:00:00.000Z',
        relevance: 'Sample reference summarizing statutory polling observer access rules across jurisdictions.',
        stance: 'CONTEXTUALIZES',
      },
    ],
    limitations: [
      'This is a predefined sample report created for local frontend demonstration without external API calls.',
    ],
    submission: {
      submissionType: 'url',
      submittedText:
        'Breaking: New voting amendment officially bans independent observers from polling stations across the country starting this election cycle.',
      sourceUrl: null,
      detectedPlatform: 'unknown',
      extractionStatus: 'user_provided',
      category: 'Politics',
      hasImage: false,
      extractedImageText: null,
      unreadableImageNotes: null,
    },
    researchedAt: '2026-11-15T12:00:00.000Z',
  },

  news: {
    status: 'success',
    isDemo: true,
    demoNote:
      'Sample Demo Report: Illustrative output shown for frontend demonstration. No external verification API was called.',
    assessment: 'NEEDS_VERIFICATION',
    confidence: {
      level: 'LOW',
      reason:
        'Sample emergency alert involves a rapidly developing transit disruption with unconfirmed casualty figures circulating prior to official press briefings.',
    },
    claimSummary:
      'Unverified social media posts claim an airport terminal evacuation was caused by a major structural collapse affecting three concourses.',
    overallExplanation:
      'Preliminary airport authority notices confirm a temporary terminal screening suspension due to an unattended baggage investigation, while viral posts citing a multi-concourse structural collapse lack corroboration from emergency responders or aviation officials.',
    keyFindings: [
      'Official airport operations feed confirmed a localized screening delay rather than a structural failure.',
      'Recycled footage from an unrelated 2022 weather incident was paired with current timestamps in several reposts.',
    ],
    claims: [
      {
        text: 'Airport terminal evacuation resulted from a structural collapse across three concourses.',
        assessment: 'NEEDS_VERIFICATION',
        explanation:
          'No aviation safety bulletin or municipal fire authority report confirms structural damage.',
        supportingSourceIds: [],
        contradictingSourceIds: ['DEMO-SRC-7'],
        missingContext: ['Breaking event posts often circulate outdated photos during active operational holds.'],
      },
    ],
    supportingEvidence: [],
    contradictingEvidence: [
      'Preliminary airport advisory attributes the delay to security screening clearance.',
    ],
    missingContext: [
      'Timestamp and geolocation metadata on viral terminal videos remain unverified.',
    ],
    questionsToInvestigate: [
      'Has the local transit authority or FAA issued an updated incident summary?',
    ],
    recommendedActions: [
      'Wait for verified municipal fire, police, or airport authority updates before resharing breaking incident claims.',
      'Check original flight-status portals for accurate terminal reopening times.',
    ],
    sources: [
      {
        id: 'DEMO-SRC-7',
        title: 'Sample Reference: National Airspace System Status & Advisories',
        publisher: 'Federal Aviation Administration (Sample)',
        url: 'https://nasstatus.faa.gov/',
        publishedAt: '2025-11-12',
        retrievedAt: '2026-11-15T12:00:00.000Z',
        relevance: 'Sample operations portal demonstrating primary-source verification during transit disruptions.',
        stance: 'CONTEXTUALIZES',
      },
    ],
    limitations: [
      'This is a predefined sample report created for local frontend demonstration without external API calls.',
    ],
    submission: {
      submissionType: 'image',
      submittedText:
        'URGENT: Massive structural collapse just shut down three main airport concourses—thousands stranded.',
      sourceUrl: null,
      detectedPlatform: 'unknown',
      extractionStatus: 'user_provided',
      category: 'News',
      hasImage: false,
      extractedImageText: null,
      unreadableImageNotes: null,
    },
    researchedAt: '2026-11-15T12:00:00.000Z',
  },

  technology: {
    status: 'success',
    isDemo: true,
    demoNote:
      'Sample Demo Report: Illustrative output shown for frontend demonstration. No external verification API was called.',
    assessment: 'SUPPORTED',
    confidence: {
      level: 'HIGH',
      reason:
        'Sample cybersecurity advisory matches official browser security release notes regarding WebAuthn passkey sync protections.',
    },
    claimSummary:
      'Security engineering bulletin reports that hardware-backed passkeys resist phishing domains even when attackers proxy login pages.',
    overallExplanation:
      'Cryptographic WebAuthn and FIDO2 passkeys bind authentication challenges strictly to the exact registered origin domain via browser and operating-system APIs. Unlike SMS codes or static passwords, a credential signature cannot be replayed against a lookalike phishing domain.',
    keyFindings: [
      'Origin binding verified at the browser cryptographic layer prevents credential replay on spoofed domains.',
      'Standard SMS one-time passcodes remain vulnerable to real-time adversary-in-the-middle proxies.',
    ],
    claims: [
      {
        text: 'Hardware-backed passkeys protect against credential phishing on lookalike domains.',
        assessment: 'SUPPORTED',
        explanation:
          'FIDO2/WebAuthn protocol enforces strict relying-party origin matching during assertion signing.',
        supportingSourceIds: ['DEMO-SRC-8'],
        contradictingSourceIds: [],
        missingContext: ['Account recovery fallback methods must also be hardened to maintain phishing resistance.'],
      },
    ],
    supportingEvidence: [
      'NIST and FIDO Alliance specifications verify origin-bound public-key signatures defeat adversary-in-the-middle proxies.',
    ],
    contradictingEvidence: [],
    missingContext: [
      'Overall account security still depends on disabling weaker SMS fallback recovery options where supported.',
    ],
    questionsToInvestigate: [
      'Does the account provider allow disabling legacy password/SMS fallback after enrolling passkeys?',
    ],
    recommendedActions: [
      'Enable hardware or platform passkeys on high-value email and financial accounts.',
      'Review backup recovery codes and remove insecure fallback factors when available.',
    ],
    sources: [
      {
        id: 'DEMO-SRC-8',
        title: 'Sample Reference: Phishing-Resistant MFA & FIDO2 Architecture',
        publisher: 'CISA Cybersecurity Guidance (Sample)',
        url: 'https://www.cisa.gov/MFA',
        publishedAt: '2025-08-22',
        retrievedAt: '2026-11-15T12:00:00.000Z',
        relevance: 'Sample technical guidance confirming FIDO2/WebAuthn origin-bound phishing resistance.',
        stance: 'SUPPORTS',
      },
    ],
    limitations: [
      'This is a predefined sample report created for local frontend demonstration without external API calls.',
    ],
    submission: {
      submissionType: 'text',
      submittedText:
        'Hardware-backed FIDO2 passkeys block phishing even when attackers mirror a real login screen because signatures are cryptographically bound to the true domain.',
      sourceUrl: null,
      detectedPlatform: 'unknown',
      extractionStatus: 'user_provided',
      category: 'Technology',
      hasImage: false,
      extractedImageText: null,
      unreadableImageNotes: null,
    },
    researchedAt: '2026-11-15T12:00:00.000Z',
  },
};

export const DEMO_RECENT_ACTIVITY: DemoActivityItem[] = [
  {
    id: 'demo-health-1',
    title: 'Morning lemon water & kidney disease cure claim',
    category: 'Health',
    assessmentLabel: 'Contradicted',
    assessmentKey: 'CONTRADICTED',
    timestampLabel: 'Sample #01',
    report: DEMO_REPORTS.health,
  },
  {
    id: 'demo-science-1',
    title: 'Global wind & solar vs. coal electricity milestone',
    category: 'Science',
    assessmentLabel: 'Misleading',
    assessmentKey: 'MISLEADING',
    timestampLabel: 'Sample #02',
    report: DEMO_REPORTS.science,
  },
  {
    id: 'demo-finance-1',
    title: '5% emergency bank transfer tax rumor',
    category: 'Finance',
    assessmentLabel: 'Contradicted',
    assessmentKey: 'CONTRADICTED',
    timestampLabel: 'Sample #03',
    report: DEMO_REPORTS.finance,
  },
  {
    id: 'demo-politics-1',
    title: 'State voting amendment vs. polling observer access',
    category: 'Politics',
    assessmentLabel: 'Misleading',
    assessmentKey: 'MISLEADING',
    timestampLabel: 'Sample #04',
    report: DEMO_REPORTS.politics,
  },
  {
    id: 'demo-news-1',
    title: 'Breaking airport concourse collapse rumor',
    category: 'News',
    assessmentLabel: 'Needs Verification',
    assessmentKey: 'NEEDS_VERIFICATION',
    timestampLabel: 'Sample #05',
    report: DEMO_REPORTS.news,
  },
  {
    id: 'demo-tech-1',
    title: 'Hardware passkeys & origin-bound phishing defense',
    category: 'Technology',
    assessmentLabel: 'Supported',
    assessmentKey: 'SUPPORTED',
    timestampLabel: 'Sample #06',
    report: DEMO_REPORTS.technology,
  },
];

/**
 * Builds an honest, clearly labeled frontend-only DEMO report for arbitrary custom user submissions
 * when running without an external verification API.
 */
export function buildCustomDemoReport(params: {
  submissionType: SubmissionType;
  category: ClaimCategory;
  submittedText: string;
  sourceUrl?: string | null;
  imageName?: string | null;
}): FactCheckResponse {
  const normalizedText = params.submittedText.trim().toLowerCase();

  if (normalizedText.includes('lemon water') && normalizedText.includes('kidney')) {
    return { ...DEMO_REPORTS.health, researchedAt: new Date().toISOString() };
  }
  if (normalizedText.includes('solar and wind') && normalizedText.includes('coal')) {
    return { ...DEMO_REPORTS.science, researchedAt: new Date().toISOString() };
  }
  if (normalizedText.includes('bank transfers over $500') || normalizedText.includes('5%')) {
    return { ...DEMO_REPORTS.finance, researchedAt: new Date().toISOString() };
  }
  if (normalizedText.includes('voting amendment') && normalizedText.includes('observer')) {
    return { ...DEMO_REPORTS.politics, researchedAt: new Date().toISOString() };
  }
  if (normalizedText.includes('airport concourse') || normalizedText.includes('structural collapse')) {
    return { ...DEMO_REPORTS.news, researchedAt: new Date().toISOString() };
  }
  if (normalizedText.includes('passkeys') && normalizedText.includes('phishing')) {
    return { ...DEMO_REPORTS.technology, researchedAt: new Date().toISOString() };
  }

  const displayInput =
    params.submittedText.trim() ||
    (params.sourceUrl ? `Submitted URL: ${params.sourceUrl}` : '') ||
    (params.imageName ? `Uploaded screenshot: ${params.imageName}` : 'Custom submission');

  const excerpt = displayInput.length > 180 ? `${displayInput.slice(0, 177)}...` : displayInput;

  return {
    status: 'success',
    isDemo: true,
    demoNote:
      'Sample Demo Report: Generated locally in Demo Mode without external APIs. Because live web grounding is offline, this submission is honestly marked Needs Verification.',
    assessment: 'NEEDS_VERIFICATION',
    confidence: {
      level: 'LOW',
      reason:
        'Demo Mode runs locally in the browser without querying external search indexes or paid verification APIs.',
    },
    claimSummary: `Demo preview for submitted ${params.category.toLowerCase()} content: "${excerpt}"`,
    overallExplanation:
      'TruthLens processed your submission locally through the interactive frontend demonstration pipeline. Because external verification APIs are currently disabled in Demo Mode, no external sources were queried and no definitive verdict is fabricated—so the claim remains marked Needs Verification.',
    keyFindings: [
      `Submission received locally (${params.submissionType.toUpperCase()} mode) under category "${params.category}".`,
      'External live web search is turned off in Demo Mode; no real-world verdict was generated.',
      'Select one of the predefined sample claims or dashboard examples to preview full multi-source sample verdicts.',
    ],
    claims: [
      {
        text: excerpt,
        assessment: 'NEEDS_VERIFICATION',
        explanation:
          'Pending external primary-source lookup. TruthLens never fabricates citations when external evidence retrieval is offline.',
        supportingSourceIds: [],
        contradictingSourceIds: [],
        missingContext: ['Requires independent primary-source verification outside Demo Mode.'],
      },
    ],
    supportingEvidence: [],
    contradictingEvidence: [],
    missingContext: [
      'Demo Mode intentionally withholds synthetic verdicts and fake citations for custom inputs.',
    ],
    questionsToInvestigate: [
      'Who is the original primary publisher or institution behind this statement?',
      'Can the dates, figures, or quotes be confirmed in an official public archive?',
      'Does a reverse search on the headline or screenshot reveal missing context?',
    ],
    recommendedActions: [
      'Compare this claim directly against primary institutional or official newsroom records.',
      'Explore the predefined Sample Reports in the Dashboard to preview full multi-source breakdowns.',
      'Pause before forwarding unverified screenshots or urgent alerts.',
    ],
    sources: [],
    limitations: [
      'Frontend Demo Mode active: zero external APIs or paid services were called for this preview.',
      'TruthLens strictly refuses to invent source links or fake verification outcomes.',
    ],
    submission: {
      submissionType: params.submissionType,
      submittedText: displayInput,
      sourceUrl: params.sourceUrl || null,
      detectedPlatform: params.sourceUrl ? 'web' : 'unknown',
      extractionStatus: 'user_provided',
      category: params.category,
      hasImage: params.submissionType === 'image',
      extractedImageText: params.imageName ? `[Local preview file: ${params.imageName}]` : null,
      unreadableImageNotes: null,
    },
    researchedAt: new Date().toISOString(),
  };
}
