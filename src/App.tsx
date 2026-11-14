import { useState } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';
import { Navbar, type AppRoute } from './components/Navbar';
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
      // Navigating explicitly to Analyze shows the submission workspace unless user stays in results
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
    <div className="min-h-screen flex flex-col bg-[#080B18] text-[#F8FAFC]">
      <Navbar activeRoute={activeRoute} onNavigate={handleNavigate} />

      <main className="flex-1">
        {activeRoute === 'home' && <HomePage onNavigate={handleNavigate} />}
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
