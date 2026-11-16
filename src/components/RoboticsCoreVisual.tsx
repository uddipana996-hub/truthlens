import React, { useState } from 'react';
import { CheckCircle2, FileSearch, Globe2 } from 'lucide-react';
import { Mini3DCube, MiniSatelliteOrbiter } from './Mini3DModels';

interface WorkflowStage {
  id: string;
  step: string;
  title: string;
  summary: string;
  focusLabel: string;
  icon: typeof FileSearch;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'decompose',
    step: '01',
    title: 'Claim Decomposition',
    summary:
      'Separates multi-part viral posts and screenshots into individual testable factual statements.',
    focusLabel: 'Optical Text & Claim Parsing',
    icon: FileSearch,
  },
  {
    id: 'search',
    step: '02',
    title: 'Authoritative Evidence Search',
    summary:
      'Queries current public records from official institutions, peer-reviewed journals, and established newsrooms.',
    focusLabel: 'Live Search Grounding',
    icon: Globe2,
  },
  {
    id: 'validate',
    step: '03',
    title: 'Strict Citation Validation',
    summary:
      'Every displayed link is checked against retrieved search metadata—never invented from model memory.',
    focusLabel: 'Deterministic Source Verification',
    icon: CheckCircle2,
  },
];

export function RoboticsCoreVisual() {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeStage = WORKFLOW_STAGES[activeStageIdx];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Number((-relY * 6).toFixed(2)),
      y: Number((relX * 7).toFixed(2)),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="lab-panel relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 sm:p-7"
      style={{ perspective: '1100px' }}
    >
      {/* Subtle Top Blue Laboratory Specular Hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6]/60 to-transparent"
      />

      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3.5 text-xs text-slate-500">
        <span className="font-display font-bold tracking-tight text-slate-900">
          Verification Workflow
        </span>
        <span className="font-mono text-[11px] font-medium text-[#2563EB]">
          Live Search Grounding
        </span>
      </div>

      {/* 3D Mechanical Robotics Optical Core Assembly */}
      <div
        className="relative my-5 flex min-h-[256px] items-center justify-center rounded-2xl border border-slate-200/80 bg-gradient-to-b from-[#FFFFFF] via-[#F4F8FF] to-[#EAF2FE] p-4 overflow-hidden transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Fine Precision Lab Grid Inside Viewport */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-65"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(37, 99, 235, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(37, 99, 235, 0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Soft Blue Ambient Core Lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-48 w-48 rounded-full bg-gradient-to-tr from-[#2563EB]/20 via-[#0EA5E9]/18 to-[#06B6D4]/15 blur-2xl"
        />

        {/* Animated Vertical Optical Scanning Sweep */}
        <div
          aria-hidden="true"
          className="animate-lab-scan pointer-events-none absolute inset-x-6 top-0 h-14 bg-gradient-to-b from-transparent via-[#0EA5E9]/22 to-transparent"
        >
          <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#0284C7]/75 to-transparent shadow-[0_0_12px_rgba(14,165,233,0.55)]" />
        </div>

        {/* Left & Right Floating Holographic White Glass Callouts (Desktop / Tablet) */}
        <div
          aria-hidden="true"
          className="animate-lab-float hidden sm:flex absolute left-3.5 top-3.5 z-20 items-center gap-2.5 rounded-xl border border-blue-200/80 bg-white/85 px-3 py-2 shadow-sm backdrop-blur-md"
        >
          <Mini3DCube className="h-8 w-8" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-medium text-[#2563EB]">
              Stage {activeStage.step} Active
            </span>
            <span className="text-[11px] font-semibold text-slate-800">{activeStage.focusLabel}</span>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="animate-lab-float hidden sm:flex absolute right-3.5 top-3.5 z-20 items-center justify-center rounded-xl border border-blue-200/70 bg-white/80 p-1.5 shadow-sm backdrop-blur-md"
          style={{ animationDelay: '0.8s' }}
        >
          <MiniSatelliteOrbiter className="h-9 w-9" />
        </div>

        <div
          aria-hidden="true"
          className="animate-lab-float hidden sm:flex absolute right-3.5 bottom-3.5 z-20 flex-col rounded-xl border border-slate-200/90 bg-white/85 px-3 py-2 shadow-sm backdrop-blur-md"
          style={{ animationDelay: '1.4s' }}
        >
          <span className="font-mono text-[10px] font-medium text-slate-500">
            Evidence Policy
          </span>
          <span className="text-[11px] font-semibold text-slate-800">
            5 Evidence-Backed Outcomes
          </span>
        </div>

        {/* Central Articulated Mechanical Verification Robot Head / Optical Unit */}
        <div className="relative z-10 flex items-center justify-center">
          <svg
            viewBox="0 0 280 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-48 w-64 sm:h-52 sm:w-72 drop-shadow-[0_18px_28px_rgba(37,99,235,0.14)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="roboShell" x1="60" y1="20" x2="220" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="roboMetal" x1="0" y1="0" x2="280" y2="220" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
              <linearGradient id="roboBlue" x1="90" y1="60" x2="190" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <radialGradient id="roboLensCore" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="45%" stopColor="#38BDF8" />
                <stop offset="85%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#0F172A" />
              </radialGradient>
            </defs>

            {/* Circuit Conduits Feeding Mechanical Chassis */}
            <path
              d="M12 110 H54 L70 94"
              stroke="#3B82F6"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              className="animate-lab-circuit"
            />
            <path
              d="M268 110 H226 L210 126"
              stroke="#06B6D4"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              className="animate-lab-circuit"
            />
            <path
              d="M34 156 H68 L84 140"
              stroke="#93C5FD"
              strokeWidth="1.2"
            />
            <path
              d="M246 64 H212 L196 80"
              stroke="#93C5FD"
              strokeWidth="1.2"
            />

            {/* Left & Right Articulated Servo Stabilizer Arms */}
            <g>
              <path
                d="M46 86 C46 72 58 62 72 62 H86 V158 H72 C58 158 46 148 46 134 V86 Z"
                fill="url(#roboShell)"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <circle cx="66" cy="84" r="6" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.6" />
              <circle cx="66" cy="136" r="6" fill="#FFFFFF" stroke="#0EA5E9" strokeWidth="1.6" />
              <rect x="52" y="102" width="12" height="16" rx="3" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1" />
            </g>

            <g>
              <path
                d="M234 86 C234 72 222 62 208 62 H194 V158 H208 C222 158 234 148 234 134 V86 Z"
                fill="url(#roboShell)"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <circle cx="214" cy="84" r="6" fill="#FFFFFF" stroke="#0EA5E9" strokeWidth="1.6" />
              <circle cx="214" cy="136" r="6" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.6" />
              <rect x="216" y="102" width="12" height="16" rx="3" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1" />
            </g>

            {/* Primary Ceramic-White Chassis Ring */}
            <circle
              cx="140"
              cy="110"
              r="72"
              fill="url(#roboShell)"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
            <circle
              cx="140"
              cy="110"
              r="64"
              fill="#FFFFFF"
              stroke="url(#roboMetal)"
              strokeWidth="1.4"
            />

            {/* Slow Rotating Precision Calibration Ring */}
            <g className="animate-lab-spin-slow" style={{ transformOrigin: '140px 110px' }}>
              <circle
                cx="140"
                cy="110"
                r="57"
                stroke="#3B82F6"
                strokeOpacity="0.32"
                strokeWidth="1.4"
                strokeDasharray="6 6"
              />
              <path
                d="M140 50 A60 60 0 0 1 192 80"
                stroke="#2563EB"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M140 170 A60 60 0 0 1 88 140"
                stroke="#06B6D4"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>

            {/* Counter-Rotating Inner Mechanical Servo Ring */}
            <g className="animate-lab-spin-reverse" style={{ transformOrigin: '140px 110px' }}>
              <circle
                cx="140"
                cy="110"
                r="45"
                stroke="#0284C7"
                strokeOpacity="0.4"
                strokeWidth="1.2"
                strokeDasharray="14 8"
              />
              <circle cx="140" cy="65" r="2.5" fill="#2563EB" />
              <circle cx="140" cy="155" r="2.5" fill="#06B6D4" />
            </g>

            {/* Optical Verification Aperture Housing */}
            <circle
              cx="140"
              cy="110"
              r="34"
              fill="#F8FAFC"
              stroke="url(#roboBlue)"
              strokeWidth="2.2"
            />
            <circle cx="140" cy="110" r="25" fill="url(#roboLensCore)" />

            {/* Specular Glass Highlight & Reticle */}
            <ellipse
              cx="132"
              cy="101"
              rx="8"
              ry="4.5"
              transform="rotate(-28 132 101)"
              fill="#FFFFFF"
              fillOpacity="0.6"
            />
            <path
              d="M132 110.5 L137.5 116 L149 104.5"
              stroke="#FFFFFF"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Top & Bottom Precision Sensor Brackets */}
            <path
              d="M118 32 H162 L154 42 H126 L118 32 Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="1.4"
            />
            <path
              d="M126 178 H154 L162 188 H118 L126 178 Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="1.4"
            />
          </svg>
        </div>
      </div>

      {/* Interactive Workflow Stage Selector (Preserving Real 3-Stage Content) */}
      <div className="relative z-10 space-y-2.5">
        <div className="grid grid-cols-1 gap-2">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = idx === activeStageIdx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageIdx(idx)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-150 ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50/75 shadow-sm'
                    : 'border-slate-200/80 bg-white/75 hover:border-blue-200 hover:bg-blue-50/35'
                }`}
              >
                <div
                  className={`lab-icon-badge h-8 w-8 shrink-0 ${
                    isSelected ? 'border-blue-300' : ''
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isSelected ? 'text-[#1D4ED8]' : 'text-[#0284C7]'}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {idx + 1}. {stage.title}
                    </span>
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        isSelected ? 'text-[#2563EB] font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {stage.step}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{stage.summary}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-5 border-t border-slate-200/80 pt-3.5 text-xs text-slate-500 flex items-center justify-between gap-2">
        <span>5 Evidence-Backed Outcomes</span>
        <span className="font-medium text-[#2563EB]">Zero Persistent Claim Storage</span>
      </div>
    </div>
  );
}
