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
        : connectionState === 'server-configured'
          ? 'API Key Settings'
          : 'API Key Settings';

  const handleSelect = (route: AppRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080B18]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-lg"
        >
          <BrandLogo className="w-8 h-8" />
          <span className="font-display text-lg font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap">
            TRUTHLENS AI
          </span>
        </button>

        {/* Zone 2: 4 Single-line Nav Links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded ${
                  isActive
                    ? 'text-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" />
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
            className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/40 bg-[#10162A] px-3.5 py-2 text-xs font-semibold text-[#F8FAFC] transition-colors hover:border-[#22D3EE]/60 hover:bg-[#161F3B] whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#22D3EE]" aria-hidden="true" />
            <span>{keyLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/10 bg-[#10162A] p-2 text-[#94A3B8] hover:text-[#F8FAFC] min-w-[40px] min-h-[40px]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#080B18] px-4 py-3">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-[#10162A] text-[#F8FAFC]'
                      : 'text-[#94A3B8] hover:bg-[#10162A]/60 hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="text-xs text-[#22D3EE]">Active</span>}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
