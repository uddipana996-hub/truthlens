import { useState } from 'react';
import { KeyRound, Menu, X } from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';
import { BrandLogo } from './BrandLogo';

export type AppRoute = 'home' | 'analyze' | 'how-it-works' | 'about';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const NAV_ITEMS: Array<{ id: AppRoute; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'about', label: 'About' },
];

export function Navbar({ activeRoute, onNavigate }: NavbarProps) {
  const { connectionState, openModal } = useApiKey();
  const [mobileOpen, setMobileOpen] = useState(false);

  const keyLabel =
    connectionState === 'user-verified'
      ? 'Key Ready'
      : connectionState === 'user-untested'
        ? 'Session Key'
        : connectionState === 'server-verified'
          ? 'Key Ready'
          : 'API Key Settings';

  const handleSelect = (route: AppRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/85 bg-white/85 backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent"
      />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="group flex items-center gap-3 text-left whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg"
        >
          <BrandLogo className="w-8 h-8 transition-transform duration-200 group-hover:scale-[1.03]" />
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Truth<span className="text-[#2563EB]">Lens</span>
          </span>
        </button>

        {/* Zone 2: 4 Single-line Nav Links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded ${
                  isActive
                    ? 'text-[#1D4ED8]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openModal}
            className="lab-btn-secondary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
            <span>{keyLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="lab-btn-secondary inline-flex md:hidden items-center justify-center rounded-xl p-2 text-slate-600 hover:text-slate-900 min-w-[40px] min-h-[40px]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-3">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors min-h-[44px] ${
                    isActive
                      ? 'border border-blue-200 bg-blue-50 text-[#1D4ED8]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="text-xs font-medium text-[#2563EB]">Active</span>}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
