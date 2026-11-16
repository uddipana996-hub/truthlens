import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, BarChart3, CheckCircle2, FileCheck2, FolderKanban, Layers } from 'lucide-react';
import {
  DEMO_CATEGORY_DISTRIBUTION,
  DEMO_DASHBOARD_METRICS,
  DEMO_OUTCOME_DISTRIBUTION,
  DEMO_RECENT_ACTIVITY,
} from '../data/demoSamples';
import type { ClaimCategory, FactCheckResponse } from '../shared/types';
import { ASSESSMENT_META } from '../utils/assessmentStyles';

interface DemoAnalyticsDashboardProps {
  onOpenSampleReport: (report: FactCheckResponse) => void;
  onExploreAnalyzer: () => void;
}

export function DemoAnalyticsDashboard({
  onOpenSampleReport,
  onExploreAnalyzer,
}: DemoAnalyticsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ClaimCategory>('All');
  const [highlightedOutcome, setHighlightedOutcome] = useState<string | null>(null);

  const filteredActivity =
    selectedCategory === 'All'
      ? DEMO_RECENT_ACTIVITY
      : DEMO_RECENT_ACTIVITY.filter((item) => item.category === selectedCategory);

  const statCards = [
    {
      label: 'Sample Submissions',
      value: DEMO_DASHBOARD_METRICS.totalSubmissions,
      detail: 'Illustrative queue total',
      icon: Layers,
    },
    {
      label: 'Sample Reports',
      value: DEMO_DASHBOARD_METRICS.reportsGenerated,
      detail: 'Predefined demo dossiers',
      icon: FileCheck2,
    },
    {
      label: 'Sample Categories',
      value: DEMO_DASHBOARD_METRICS.categoriesTracked,
      detail: 'Topic domains modeled',
      icon: FolderKanban,
    },
    {
      label: 'Sample Citations',
      value: DEMO_DASHBOARD_METRICS.sampleSourcesIndexed,
      detail: 'Example reference links',
      icon: CheckCircle2,
    },
  ];

  // SVG Donut geometry for sample outcome chart
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let cumulativeShare = 0;

  return (
    <section aria-labelledby="demo-dashboard-heading" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/85 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Interactive Demonstration Workspace
          </p>
          <h2
            id="demo-dashboard-heading"
            className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900"
          >
            Sample Investigation Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Explore illustrative sample metrics, category breakdowns, and interactive demonstration
            reports without requiring any external API keys.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
            {DEMO_DASHBOARD_METRICS.label}
          </span>
        </div>
      </div>

      {/* 4 Interactive Sample Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="lab-panel-interactive rounded-2xl p-4 sm:p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600">{stat.label}</span>
                <div className="lab-icon-badge h-8 w-8 shrink-0">
                  <Icon className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
                </div>
              </div>
              <div className="font-display text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500">{stat.detail}</div>
            </div>
          );
        })}
      </div>

      {/* Animated Charts Row: Category Distribution + Outcome Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sample Category Distribution (Interactive Filter Bars) */}
        <div className="lab-panel relative lg:col-span-7 rounded-2xl p-5 sm:p-6 space-y-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB]/45 to-transparent"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="lab-icon-badge h-8 w-8">
                <BarChart3 className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Sample Category Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Click a category bar to filter sample activity below
                </p>
              </div>
            </div>

            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
              >
                Show All Categories
              </button>
            )}
          </div>

          <div className="space-y-3">
            {DEMO_CATEGORY_DISTRIBUTION.map((item, idx) => {
              const isSelected = selectedCategory === item.category;
              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === item.category ? 'All' : item.category
                    )
                  }
                  className={`w-full rounded-xl border p-2.5 text-left transition-all ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50/75'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800">{item.category}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {item.sampleCount} samples · {item.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: idx * 0.05 }}
                      style={{
                        width: `${item.percentage * 2.8}%`,
                        maxWidth: '100%',
                        transformOrigin: 'left',
                      }}
                      className={`h-full rounded-full ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4]'
                          : 'bg-gradient-to-r from-[#3B82F6] to-[#38BDF8]'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sample Outcome Breakdown Ring Chart */}
        <div className="lab-panel relative lg:col-span-5 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#06B6D4]/45 to-transparent"
          />
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Sample Assessment Mix
            </h3>
            <p className="text-xs text-slate-500">
              Illustrative outcome distribution across demo records
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6">
            <div className="relative h-36 w-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="12"
                />
                {DEMO_OUTCOME_DISTRIBUTION.map((seg) => {
                  const dashLength = (seg.share / 100) * circumference;
                  const dashOffset = -((cumulativeShare / 100) * circumference);
                  cumulativeShare += seg.share;
                  const isDimmed =
                    highlightedOutcome !== null && highlightedOutcome !== seg.label;
                  return (
                    <circle
                      key={seg.label}
                      cx="56"
                      cy="56"
                      r={radius}
                      fill="none"
                      stroke={seg.stroke}
                      strokeWidth={highlightedOutcome === seg.label ? '14' : '12'}
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="butt"
                      style={{
                        opacity: isDimmed ? 0.35 : 1,
                        transition: 'opacity 180ms ease, stroke-width 180ms ease',
                      }}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-xl font-extrabold text-slate-900 tabular-nums">
                  {DEMO_DASHBOARD_METRICS.reportsGenerated}
                </span>
                <span className="text-[11px] font-medium text-slate-500">Demo Reports</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              {DEMO_OUTCOME_DISTRIBUTION.map((seg) => (
                <button
                  key={seg.label}
                  type="button"
                  onMouseEnter={() => setHighlightedOutcome(seg.label)}
                  onMouseLeave={() => setHighlightedOutcome(null)}
                  onClick={() =>
                    setHighlightedOutcome((prev) => (prev === seg.label ? null : seg.label))
                  }
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className={`h-2.5 w-2.5 rounded-xs ${seg.barColor}`} aria-hidden="true" />
                    <span>{seg.label}</span>
                  </span>
                  <span className="font-mono text-slate-600 tabular-nums">
                    {seg.count} · {seg.share}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-3 text-xs text-slate-500 flex items-center justify-between gap-2">
            <span>Frontend Sample Data Only</span>
            <button
              type="button"
              onClick={onExploreAnalyzer}
              className="font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
            >
              Open Live Scanner
            </button>
          </div>
        </div>
      </div>

      {/* Recent Demo Activity (Interactive Sample Reports) */}
      <div className="lab-panel rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3.5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Recent Demo Activity
            </h3>
            <p className="text-xs text-slate-500">
              Select any sample record below to open its full interactive demonstration report.
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/90 p-1">
            {(['All', 'Health', 'Science', 'Finance', 'Politics', 'News', 'Technology'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-white text-[#1D4ED8] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {filteredActivity.length > 0 ? (
          <div className="divide-y divide-slate-200/80">
            {filteredActivity.map((item) => {
              const meta = ASSESSMENT_META[item.assessmentKey];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenSampleReport(item.report)}
                  className="group flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3.5 px-2 text-left rounded-xl hover:bg-blue-50/45 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-[#1D4ED8] transition-colors">
                      {item.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{item.timestampLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>Category: {item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${meta.dotColor}`}>
                        Demo Assessment: {item.assessmentLabel}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] shrink-0 whitespace-nowrap">
                    <span>View Sample Report</span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
            <p>
              No predefined sample activity matches the &ldquo;{selectedCategory}&rdquo; filter
              yet.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="font-semibold text-[#2563EB] hover:underline"
            >
              Reset category filter
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
