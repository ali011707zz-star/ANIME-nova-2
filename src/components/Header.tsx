import React from 'react';
import { ViewMode, Language } from '../types/anime';
import { Menu, Play, Tv, Smartphone, Globe, User, Search, Code2 } from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenCodebase: () => void;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  activeNavTab: string;
  onSelectNavTab: (tab: string) => void;
  onOpenDrawer: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onToggleViewMode,
  language,
  onToggleLanguage,
  onOpenCodebase,
  onSelectNavTab,
  onOpenDrawer,
  onOpenAuth
}) => {
  const isAr = language === 'ar';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090A0C]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Right side in RTL (Logo & Brand) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectNavTab('home')}
            className="flex items-center gap-2 text-right focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-lg shadow-violet-900/40 group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </div>
            <div className="leading-tight">
              <span className="text-base sm:text-lg font-black tracking-tight text-white block font-['Cairo']">
                Anime <span className="text-[#7654C8]">NOVA</span>
              </span>
            </div>
          </button>
        </div>

        {/* Left side in RTL (Actions & TV Mode & Drawer) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Search */}
          <button
            onClick={() => onSelectNavTab('search')}
            title={isAr ? 'بحث' : 'Search'}
            className="p-2 text-[#9299A5] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Android TV Mode Switcher */}
          <button
            onClick={onToggleViewMode}
            title={viewMode === 'tv' ? 'Switch to Phone' : 'التحويل لوضع التلفاز الذكي Android TV'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border shrink-0 font-['Cairo'] ${
              viewMode === 'tv'
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
                : 'bg-[#14171C] text-[#F3F4F6] border-white/10 hover:border-violet-500/50 hover:bg-white/5'
            }`}
          >
            {viewMode === 'tv' ? (
              <>
                <Tv className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span className="hidden sm:inline">{isAr ? 'وضع التلفاز (10-Foot)' : 'TV Mode'}</span>
                <span className="sm:hidden">{isAr ? 'تلفاز 📺' : 'TV'}</span>
              </>
            ) : (
              <>
                <Tv className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">{isAr ? '📺 اقلب للتلفاز' : 'Switch to TV'}</span>
                <span className="sm:hidden">{isAr ? 'تلفاز' : 'TV'}</span>
              </>
            )}
          </button>

          {/* Native Kotlin Code modal */}
          <button
            onClick={onOpenCodebase}
            title={isAr ? 'كود Kotlin الأصلي' : 'Native Kotlin Code'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#14171C] border border-white/10 text-emerald-400 hover:text-white text-[11px] font-bold transition-colors font-['Cairo']"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'Kotlin' : 'Kotlin'}</span>
          </button>

          {/* Language toggle */}
          <button
            onClick={onToggleLanguage}
            title={isAr ? 'English' : 'العربية'}
            className="p-2 text-[#9299A5] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* Profile / Auth */}
          <button
            onClick={onOpenAuth}
            title={isAr ? 'الحساب' : 'Account'}
            className="p-2 text-[#9299A5] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Hamburger Drawer Menu Button */}
          <button
            onClick={onOpenDrawer}
            title={isAr ? 'القائمة' : 'Menu'}
            className="p-2 text-white bg-[#14171C] border border-white/10 hover:border-violet-500/50 rounded-xl transition-colors active:scale-95"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};
