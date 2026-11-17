import { useState } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';
import { Navbar, type AppRoute } from './components/Navbar';
import { NetworkParticlesCanvas } from './components/NetworkParticlesCanvas';
import { ApiKeyProvider } from './context/ApiKeyContext';
import { AboutPage } from './pages/AboutPage';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ResultsDashboard } from './pages/ResultsDashboard';
import type { FactCheckResponse } from './shared/types';

function AppShell() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('home');
  const [analysisResult, setAnalysisResult] = useState<FactCheckResponse | null>(null);

  const handleNavigate = (route: AppRoute) => {
    if (route === 'analyze') {
      setAnalysisResult(null);
    }
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisComplete = (result: FactCheckResponse) => {
    setAnalysisResult(result);
    setActiveRoute('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#F1F6FE] text-[#0F172A] overflow-x-clip">
      {/* Subtle Non-Interactive White Laboratory & Moving Circuit Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-44 left-1/2 -translate-x-1/2 h-[540px] w-[1100px] rounded-full opacity-75 blur-[110px]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.14) 0%, rgba(14, 165, 233, 0.08) 45%, transparent 75%)',
          }}
        />
        <div
          className="absolute bottom-[-180px] right-[-100px] h-[480px] w-[560px] rounded-full opacity-65 blur-[110px]"
          style={{
            background:
              'radial-gradient(circle at center, rgba(6, 182, 212, 0.12) 0%, rgba(37, 99, 235, 0.06) 50%, transparent 75%)',
          }}
        />
        <div className="absolute inset-0 bg-lab-grid opacity-90" />

        {/* Subtle Moving Circuit Traces */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.22]"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M0 160 H260 L310 210 H620"
            stroke="url(#labTraceA)"
            strokeWidth="1.2"
            className="animate-lab-circuit"
          />
          <path
            d="M1440 240 H1160 L1100 300 H820"
            stroke="url(#labTraceB)"
            strokeWidth="1.2"
            className="animate-lab-circuit"
          />
          <path
            d="M120 780 H420 L470 730 H760"
            stroke="url(#labTraceA)"
            strokeWidth="1"
            className="animate-lab-circuit"
          />
          <defs>
            <linearGradient id="labTraceA" x1="0" y1="0" x2="700" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="labTraceB" x1="820" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
              <stop offset="50%" stopColor="#2563EB" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Lightweight Digital Network Particles Canvas */}
      <NetworkParticlesCanvas />

      <Navbar activeRoute={activeRoute} onNavigate={handleNavigate} />

      <main className="relative z-10 flex-1">
        {activeRoute === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenSampleReport={handleAnalysisComplete}
          />
        )}
        {activeRoute === 'analyze' &&
          (analysisResult ? (
            <ResultsDashboard
              result={analysisResult}
              onStartNew={() => {
                setAnalysisResult(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <AnalyzerPage onAnalysisComplete={handleAnalysisComplete} />
          ))}
        {activeRoute === 'how-it-works' && <HowItWorksPage onNavigate={handleNavigate} />}
        {activeRoute === 'about' && <AboutPage onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />
      <ApiKeyModal />
    </div>
  );
}

export default function App() {
  return (
    <ApiKeyProvider>
      <AppShell />
    </ApiKeyProvider>
  );
}
