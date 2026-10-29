import React, { useEffect, useState, useRef } from 'react';
import { Anime, Episode, Language } from '../types/anime';
import { AnimeCard } from './AnimeCard';
import { calculateNextTvFocus, GridBounds } from '../utils/tvNavigation';
import {
  Tv,
  Play,
  Heart,
  Search,
  Wifi,
  Sparkles,
  Smartphone,
  Code2,
  Film,
  ArrowRight,
  Info
} from 'lucide-react';

interface TvModeViewProps {
  animeList: Anime[];
  language: Language;
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime, episode?: Episode) => void;
  onSwitchToPhoneMode: () => void;
  onOpenCodebase: () => void;
  watchlist: string[];
  onToggleWatchlist: (animeId: string) => void;
  externalDirection?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
  externalSelectTrigger?: number;
}

export const TvModeView: React.FC<TvModeViewProps> = ({
  animeList,
  language,
  onSelectAnime,
  onPlayAnime,
  onSwitchToPhoneMode,
  onOpenCodebase,
  watchlist,
  onToggleWatchlist,
  externalDirection,
  externalSelectTrigger
}) => {
  const isAr = language === 'ar';
  const featuredAnime = animeList[0];

  // TV D-Pad Focus State:
  // row 0: Hero Spotlight action button
  // row 1: Trending rail (cards)
  // row 2: Action & Supernatural rail (cards)
  // row 3: Fantasy & Adventure rail (cards)
  const [focusCoord, setFocusCoord] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [activeSideNav, setActiveSideNav] = useState<'home' | 'search' | 'watchlist' | 'code'>('home');
  const [currentTimeStr, setCurrentTimeStr] = useState('20:45');

  // Time ticker for TV status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const dubbedAnime = animeList.filter(
    (a) => a.genres.includes('dubbed') || a.genresAr.includes('المدبلج وسبيستون') || a.provider === 'spacetoon' || a.provider === 'aw' || a.provider === 'carateen'
  );
  const trendingAnime = animeList.slice(0, 6);
  const actionAnime = animeList.filter((a) => a.genres.includes('Action') || a.genres.includes('Supernatural'));
  const fantasyAnime = animeList.filter((a) => a.genres.includes('Fantasy') || a.genres.includes('Adventure'));

  const bounds: GridBounds = {
    totalRows: 5,
    getColsInRow: (r) => {
      if (r === 0) return 2; // Hero Watch button & Info button
      if (r === 1) return dubbedAnime.length;
      if (r === 2) return trendingAnime.length;
      if (r === 3) return actionAnime.length;
      if (r === 4) return fantasyAnime.length;
      return 1;
    }
  };

  // Keyboard Arrow listener for genuine TV experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp') {
        setFocusCoord((prev) => calculateNextTvFocus(prev, 'UP', bounds));
      } else if (e.key === 'ArrowDown') {
        setFocusCoord((prev) => calculateNextTvFocus(prev, 'DOWN', bounds));
      } else if (e.key === 'ArrowLeft') {
        // In RTL Arabic, left advances forward in row; calculate accordingly
        setFocusCoord((prev) => calculateNextTvFocus(prev, isAr ? 'RIGHT' : 'LEFT', bounds));
      } else if (e.key === 'ArrowRight') {
        setFocusCoord((prev) => calculateNextTvFocus(prev, isAr ? 'LEFT' : 'RIGHT', bounds));
      } else if (e.key === 'Enter') {
        triggerActionForCurrentFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusCoord, isAr]);

  // Handle external direction from Virtual Remote controller
  useEffect(() => {
    if (externalDirection) {
      setFocusCoord((prev) => calculateNextTvFocus(prev, externalDirection, bounds));
    }
  }, [externalDirection]);

  // Handle external Select / OK from Virtual Remote controller
  useEffect(() => {
    if (externalSelectTrigger && externalSelectTrigger > 0) {
      triggerActionForCurrentFocus();
    }
  }, [externalSelectTrigger]);

  const triggerActionForCurrentFocus = () => {
    const { row, col } = focusCoord;
    if (row === 0) {
      if (col === 0) {
        onPlayAnime(featuredAnime, featuredAnime.episodes[0]);
      } else {
        onSelectAnime(featuredAnime);
      }
    } else if (row === 1) {
      const anime = dubbedAnime[col];
      if (anime) onSelectAnime(anime);
    } else if (row === 2) {
      const anime = trendingAnime[col];
      if (anime) onSelectAnime(anime);
    } else if (row === 3) {
      const anime = actionAnime[col];
      if (anime) onSelectAnime(anime);
    } else if (row === 4) {
      const anime = fantasyAnime[col];
      if (anime) onSelectAnime(anime);
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white select-none px-6 sm:px-12 py-6 overflow-x-hidden">
      {/* 5% Android TV Safe Area Frame */}
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* TV Top Status Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-violet-600/30 text-violet-400 border border-violet-500/40">
              <Tv className="w-5 h-5" />
            </span>
            <div>
              <span className="text-base font-black tracking-wide">
                ANDROID <span className="text-violet-400">TV</span> LEANBACK
              </span>
              <span className="block text-[11px] text-neutral-400 font-mono">
                10-Foot UI Interface (4K Ultra HD)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-300">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>5G Wi-Fi</span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 font-bold">
              4K HDR
            </div>

            <div className="text-base font-bold text-white tabular-nums px-2">
              {currentTimeStr}
            </div>

            {/* Quick Switch to Phone Button */}
            <button
              onClick={onSwitchToPhoneMode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/15 text-xs text-neutral-200 hover:text-white transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'اقلب للهاتف' : 'Switch to Phone'}</span>
            </button>
          </div>
        </div>

        {/* TV Layout: Left Rail + TV Stage */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* TV Left Navigation Rail */}
          <div className="col-span-1 flex flex-col gap-4 py-4 items-center bg-neutral-900/60 border border-white/10 rounded-3xl p-3 backdrop-blur-xl">
            <button
              onClick={() => setActiveSideNav('home')}
              aria-label="TV Home"
              className={`p-3 rounded-2xl transition-all ${
                activeSideNav === 'home'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/60'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-6 h-6" />
            </button>

            <button
              onClick={() => setActiveSideNav('watchlist')}
              aria-label="TV Watchlist"
              className={`p-3 rounded-2xl transition-all ${
                activeSideNav === 'watchlist'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/60'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Heart className="w-6 h-6" />
            </button>

            <button
              onClick={onOpenCodebase}
              aria-label="Kotlin Android Studio Code"
              className="p-3 rounded-2xl text-violet-400 hover:bg-violet-600/20 hover:text-white transition-all"
              title={isAr ? 'كود أندرويد الأصلي' : 'Kotlin Native Code'}
            >
              <Code2 className="w-6 h-6" />
            </button>
          </div>

          {/* TV Main Stage (Rows & Rails) */}
          <div className="col-span-11 space-y-8">
            {/* TV Giant Featured Spotlight Banner */}
            <div
              className={`relative rounded-3xl overflow-hidden p-8 sm:p-12 border-2 transition-all duration-300 shadow-2xl ${
                focusCoord.row === 0
                  ? 'border-violet-500 ring-4 ring-violet-500/20'
                  : 'border-white/10'
              }`}
            >
              {featuredAnime.bannerImage && (
                <img
                  src={featuredAnime.bannerImage}
                  alt={featuredAnime.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent"></div>

              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-lg bg-violet-600 text-white font-bold">
                    {featuredAnime.rating}
                  </span>
                  <span className="text-amber-400 font-bold">★ {featuredAnime.score}</span>
                  <span className="text-neutral-300 font-mono">
                    {featuredAnime.year} · {isAr ? featuredAnime.statusAr : featuredAnime.status}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  {isAr ? featuredAnime.titleAr : featuredAnime.title}
                </h1>

                <p className="text-sm sm:text-base text-neutral-300 line-clamp-3 leading-relaxed">
                  {isAr ? featuredAnime.synopsisAr : featuredAnime.synopsis}
                </p>

                {/* TV Action Buttons with D-Pad focus indicators */}
                <div className="flex items-center gap-4 pt-3">
                  <button
                    onClick={() => onPlayAnime(featuredAnime, featuredAnime.episodes[0])}
                    className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                      focusCoord.row === 0 && focusCoord.col === 0
                        ? 'bg-violet-600 text-white scale-105 ring-4 ring-violet-400/50 shadow-2xl shadow-violet-950/80'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>{isAr ? 'مشاهدة الآن (Enter)' : 'Watch Now (Enter)'}</span>
                  </button>

                  <button
                    onClick={() => onSelectAnime(featuredAnime)}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                      focusCoord.row === 0 && focusCoord.col === 1
                        ? 'bg-neutral-800 text-white scale-105 ring-4 ring-violet-400/50'
                        : 'bg-black/40 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    <span>{isAr ? 'تفاصيل الأنمي' : 'Details'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TV Rail 1: Dubbed Anime & Spacetoon Classics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
                  <span>{isAr ? 'المدبلج وسبيستون وكرتون • Dubbed & Cartoons' : 'Spacetoon & Arabic Dubbed Classics'}</span>
                </h2>
                <span className="text-xs font-mono text-neutral-400">
                  {isAr ? 'تنقل بالأسهم ← → واضغط OK' : 'Use D-Pad ← → & Press OK'}
                </span>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none">
                {dubbedAnime.map((anime, idx) => (
                  <div key={anime.id} className="shrink-0">
                    <AnimeCard
                      anime={anime}
                      language={language}
                      isTvMode={true}
                      isFocused={focusCoord.row === 1 && focusCoord.col === idx}
                      onSelect={onSelectAnime}
                      onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* TV Rail 2: Trending on TV (TvLazyRow simulation) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                  <span>{isAr ? 'الأكثر شعبية على شاشات التلفاز' : 'Trending on Android TV'}</span>
                </h2>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none">
                {trendingAnime.map((anime, idx) => (
                  <div key={anime.id} className="shrink-0">
                    <AnimeCard
                      anime={anime}
                      language={language}
                      isTvMode={true}
                      isFocused={focusCoord.row === 2 && focusCoord.col === idx}
                      onSelect={onSelectAnime}
                      onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* TV Rail 3: Action & Supernatural */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>{isAr ? 'أكشن وشونين أسطوري' : 'Action & Supernatural Masters'}</span>
                </h2>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none">
                {actionAnime.map((anime, idx) => (
                  <div key={anime.id} className="shrink-0">
                    <AnimeCard
                      anime={anime}
                      language={language}
                      isTvMode={true}
                      isFocused={focusCoord.row === 3 && focusCoord.col === idx}
                      onSelect={onSelectAnime}
                      onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* TV Rail 4: Fantasy & Adventure */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>{isAr ? 'فانتازيا ومغامرات ساحرة' : 'Fantasy & Adventure Chronicles'}</span>
                </h2>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none">
                {fantasyAnime.map((anime, idx) => (
                  <div key={anime.id} className="shrink-0">
                    <AnimeCard
                      anime={anime}
                      language={language}
                      isTvMode={true}
                      isFocused={focusCoord.row === 4 && focusCoord.col === idx}
                      onSelect={onSelectAnime}
                      onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
