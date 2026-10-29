import React from 'react';
import {
  X,
  Home,
  Search,
  Grid,
  Film,
  Download,
  Calendar,
  Heart,
  Clock,
  Settings,
  Code2,
  Tv,
  User,
  ExternalLink
} from 'lucide-react';
import { Language } from '../types/anime';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onNavigate: (tab: string) => void;
  onOpenCodebase: () => void;
  onToggleTvMode: () => void;
  onOpenAuth: () => void;
  watchlistCount: number;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  language,
  onNavigate,
  onOpenCodebase,
  onToggleTvMode,
  onOpenAuth,
  watchlistCount
}) => {
  const isAr = language === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container (Right side for RTL) */}
      <div
        className={`absolute top-0 bottom-0 ${
          isAr ? 'right-0' : 'left-0'
        } w-80 max-w-[85vw] bg-[#090A0C] border-l border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 font-['Cairo']`}
      >
        {/* Header Profile Section */}
        <div className="p-5 border-b border-white/10 bg-[#111317]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md">
                <span className="text-xs font-black">N</span>
              </div>
              <span className="text-base font-extrabold text-white">
                Anime <span className="text-[#7654C8]">NOVA</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-violet-500/40 cursor-pointer transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#4C1D95] flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-violet-500/30">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white group-hover:text-violet-400 truncate">
                {isAr ? 'تسجيل الدخول / حسابي' : 'Login / My Account'}
              </h4>
              <p className="text-[11px] text-[#9299A5] truncate">
                {isAr ? 'اضغط لمزامنة المفضلة والمشاهدات' : 'Sync watchlist & progress'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Main Group */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold text-[#9299A5] uppercase tracking-wider">
              {isAr ? 'التنقل الرئيسي' : 'Main Navigation'}
            </div>

            <button
              onClick={() => {
                onNavigate('home');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3F4F6] hover:bg-white/5 hover:text-white transition-colors text-right"
            >
              <Home className="w-4 h-4 text-[#8B5CF6]" />
              <span>{isAr ? 'الرئيسية' : 'Home'}</span>
            </button>

            <button
              onClick={() => {
                onNavigate('search');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3F4F6] hover:bg-white/5 hover:text-white transition-colors text-right"
            >
              <Search className="w-4 h-4 text-[#6366F1]" />
              <span>{isAr ? 'البحث' : 'Search'}</span>
            </button>

            <button
              onClick={() => {
                onNavigate('browse');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3F4F6] hover:bg-white/5 hover:text-white transition-colors text-right"
            >
              <Grid className="w-4 h-4 text-[#3B82F6]" />
              <span>{isAr ? 'تصفح الأنمي' : 'Browse Anime'}</span>
            </button>

            <button
              onClick={() => {
                onNavigate('dubbed');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3F4F6] hover:bg-white/5 hover:text-white transition-colors text-right"
            >
              <Film className="w-4 h-4 text-[#10B981]" />
              <span>{isAr ? 'كرتون مدبلج ومترجم' : 'Dubbed & Spacetoon'}</span>
            </button>

            <button
              onClick={() => {
                onNavigate('downloads');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3F4F6] hover:bg-white/5 hover:text-white transition-colors text-right"
            >
              <Download className="w-4 h-4 text-[#8B5CF6]" />
              <span>{isAr ? 'تنزيلاتي' : 'Downloads'}</span>
            </button>

            <button
              onClick={() => {
                onNavigate('schedule');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3F4F6] hover:bg-white/5 hover:text-white transition-colors text-right"
            >
              <Calendar className="w-4 h-4 text-[#10B981]" />
              <span>{isAr ? 'جدول البث الأسبوعي' : 'Weekly Schedule'}</span>
            </button>
          </div>

          {/* Library Group */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold text-[#9299A5] uppercase tracking-wider">
              {isAr ? 'المكتبة الشخصية' : 'Personal Library'}
            </div>

            <button
              onClick={() => {
                onNavigate('library');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3F4F6] hover:bg-white/5 hover:text-white transition-colors text-right"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-[#F43F5E]" />
                <span>{isAr ? 'المفضلة' : 'Favorites'}</span>
              </div>
              {watchlistCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#7654C8] text-white text-[10px] font-mono">
                  {watchlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNavigate('library');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3F4F6] hover:bg-white/5 hover:text-white transition-colors text-right"
            >
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <span>{isAr ? 'سجل المشاهدة' : 'Watch History'}</span>
            </button>
          </div>

          {/* TV & Native Tools */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                onClose();
                onToggleTvMode();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-950/60 to-purple-900/40 border border-violet-500/30 text-white font-bold text-xs hover:border-violet-400 transition-all text-right"
            >
              <div className="flex items-center gap-2.5">
                <Tv className="w-4 h-4 text-violet-400 animate-pulse" />
                <span>{isAr ? 'التبديل إلى وضع التلفاز (Android TV)' : 'Switch to Android TV Mode'}</span>
              </div>
              <span className="text-[10px] bg-violet-600 px-2 py-0.5 rounded-full">10-foot</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCodebase();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#14171C] border border-white/10 text-neutral-200 hover:text-white hover:border-violet-500/40 font-bold text-xs transition-all text-right"
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'كود Kotlin الأصلي (Compose)' : 'Kotlin Native Source'}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 text-center text-[10px] text-[#9299A5]">
          Anime NOVA Mobile v2.4 · Kotlin & Compose Ready
        </div>
      </div>
    </div>
  );
};
