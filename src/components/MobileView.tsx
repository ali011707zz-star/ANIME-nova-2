import React, { useState, useEffect, useRef } from 'react';
import { Anime, Language, Episode } from '../types/anime';
import { AnimeCard } from './AnimeCard';
import { GENRE_LIST } from '../data/animeData';
import {
  Play,
  Info,
  Star,
  Tv,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  Sparkles,
  Home,
  Grid,
  Film,
  Download,
  Bookmark,
  Bell,
  X,
  History,
  Clock,
  ArrowRight
} from 'lucide-react';

interface MobileViewProps {
  animeList: Anime[];
  language: Language;
  onSelectAnime: (anime: Anime) => void;
  onPlayAnime: (anime: Anime, episode?: Episode) => void;
  onSwitchToTvMode: () => void;
  onOpenCodebase: () => void;
  watchlist: string[];
  onToggleWatchlist: (animeId: string) => void;
  savedSessionNotice?: string | null;
  activeNavTab?: string;
  onSelectNavTab?: (tab: string) => void;
}

export const MobileView: React.FC<MobileViewProps> = ({
  animeList,
  language,
  onSelectAnime,
  onPlayAnime,
  onSwitchToTvMode,
  onOpenCodebase,
  watchlist,
  onToggleWatchlist,
  savedSessionNotice,
  activeNavTab = 'home',
  onSelectNavTab
}) => {
  const isAr = language === 'ar';
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'search' | 'browse' | 'dubbed' | 'downloads' | 'library'>(
    activeNavTab === 'dubbed' ? 'dubbed' : activeNavTab === 'watchlist' ? 'library' : 'home'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // Sync with prop changes
  useEffect(() => {
    if (activeNavTab === 'dubbed') setActiveBottomTab('dubbed');
    else if (activeNavTab === 'watchlist') setActiveBottomTab('library');
    else if (activeNavTab === 'search') setActiveBottomTab('search');
    else if (activeNavTab === 'home') setActiveBottomTab('home');
  }, [activeNavTab]);

  // Hero carousel state
  const heroItems = animeList.filter((a) => a.featured || a.score >= 8.5);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroItems.length]);

  const currentHero = heroItems[heroIndex] || animeList[0];

  // Filtered lists for distinct rails
  const continueWatchingList = animeList.filter((a) => a.progress && a.progress > 0);
  const latestEpisodesList = animeList.slice(0, 7);
  const dubbedList = animeList.filter((a) => a.provider === 'spacetoon' || a.genresAr.includes('مدبلج'));
  const trendingList = animeList.filter((a) => a.score >= 8.5);
  const airingList = animeList.filter((a) => a.status === 'Airing');
  const topRatedList = [...animeList].sort((a, b) => b.score - a.score);
  const spacetoonList = animeList.filter((a) => a.provider === 'spacetoon' || a.badge?.includes('سبيستون'));
  const watchlistItems = animeList.filter((a) => watchlist.includes(a.id));

  // Search filtered items
  const searchResults = animeList.filter((anime) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      anime.title.toLowerCase().includes(q) ||
      anime.titleAr.includes(q) ||
      anime.genres.some((g) => g.toLowerCase().includes(q)) ||
      anime.genresAr.some((g) => g.includes(q))
    );
  });

  const handleTabChange = (tab: 'home' | 'search' | 'browse' | 'dubbed' | 'downloads' | 'library') => {
    setActiveBottomTab(tab);
    if (onSelectNavTab) {
      onSelectNavTab(tab === 'library' ? 'watchlist' : tab);
    }
  };

  return (
    <div className="pb-24 max-w-5xl mx-auto px-3 sm:px-4 font-['Cairo'] text-[#F3F4F6] select-none animate-in fade-in duration-200">
      {/* Saved Playback Session Toast (from TV handover) */}
      {savedSessionNotice && (
        <div className="my-3 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{savedSessionNotice}</span>
          </div>
          <button
            onClick={onSwitchToTvMode}
            className="px-3 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors"
          >
            {isAr ? 'العودة للتلفاز' : 'Back to TV'}
          </button>
        </div>
      )}

      {/* TOP ANNOUNCEMENT BANNER matching artifacts/nova-mobile/components/AnnouncementBanner.tsx */}
      {showAnnouncement && activeBottomTab === 'home' && (
        <div className="my-2.5 p-3 rounded-2xl bg-[#14171C] border border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-[#B8BDC7] text-[11px] truncate leading-normal">
              {isAr
                ? '📢 تم تحديث مشغل Anime NOVA: سيرفرات سريعة بدقة 1080p ودعم كامل لشاشات التلفاز الذكي (Android TV)!'
                : '📢 Anime NOVA Updated: Fast 1080p playback and full Android TV 10-foot remote support!'}
            </p>
          </div>
          <button
            onClick={() => setShowAnnouncement(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================== TAB: HOME ===================== */}
      {activeBottomTab === 'home' && (
        <div className="space-y-6">
          {/* HERO SECTION matching artifacts/nova-mobile/components/HeroSection.tsx */}
          <div className="relative w-full h-[290px] sm:h-[340px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
            {/* Background Anime Banner */}
            <div className="absolute inset-0 bg-[#111317]">
              <img
                src={currentHero.bannerImage || currentHero.coverImage}
                alt=""
                onError={(e) => {
                  const img = e.currentTarget;
                  if (currentHero.coverImage && img.src !== currentHero.coverImage) {
                    img.src = currentHero.coverImage;
                  }
                }}
                className="w-full h-full object-cover object-center transition-all duration-700 scale-100 group-hover:scale-105"
              />
            </div>

            {/* Gradient Overlays: Dark fade to bottom #090A0C */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090A0C] via-[#090A0C]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090A0C]/90 via-[#090A0C]/40 to-transparent" />

            {/* Content container inside Hero */}
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end z-10 space-y-2">
              {/* Genre Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(isAr ? currentHero.genresAr : currentHero.genres).slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 rounded border border-[#7654C8]/60 bg-[#7654C8]/20 text-[#A78BFA] text-[9px] font-semibold"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* English Title */}
              <h2
                className="text-lg sm:text-2xl font-black text-white leading-tight font-['Cairo'] tracking-tight drop-shadow-md"
                dir="ltr"
              >
                {currentHero.title}
              </h2>

              {/* Arabic Title */}
              {currentHero.titleAr && (
                <p className="text-xs sm:text-sm text-[#B8BDC7] font-bold font-['Cairo'] -mt-1 leading-normal">
                  {currentHero.titleAr}
                </p>
              )}

              {/* Info Row: Star, Episode Count, Format */}
              <div className="flex items-center gap-3 text-[11px] text-[#B8BDC7] font-medium pt-0.5">
                {currentHero.score && (
                  <div className="flex items-center gap-1 text-[#FFD700] font-bold">
                    <Star className="w-3 h-3 fill-[#FFD700]" />
                    <span>{currentHero.score}</span>
                  </div>
                )}
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3 text-[#9299A5]" />
                  <span>{currentHero.episodesCount} {isAr ? 'حلقة' : 'episodes'}</span>
                </div>
                <span>·</span>
                <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-neutral-300">
                  {currentHero.format || 'TV'}
                </span>
              </div>

              {/* Hero Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                {/* Watch Button (Purple primary #7654C8) */}
                <button
                  onClick={() => onPlayAnime(currentHero, currentHero.episodes[0])}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7654C8] hover:bg-[#6744b8] text-white font-bold text-xs shadow-lg shadow-violet-950/60 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isAr ? 'مشاهدة' : 'Watch'}</span>
                </button>

                {/* Details Button */}
                <button
                  onClick={() => onSelectAnime(currentHero)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14171C]/90 hover:bg-white/10 border border-white/15 text-white font-bold text-xs backdrop-blur-md active:scale-95 transition-all"
                >
                  <Info className="w-3.5 h-3.5 text-neutral-300" />
                  <span>{isAr ? 'تفاصيل' : 'Details'}</span>
                </button>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
              {heroItems.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === heroIndex ? 'w-4 bg-[#7654C8]' : 'w-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Quick TV Mode Switch Banner Banner (One-click) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#14171C] via-[#1A1D23] to-[#1e1333] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0">
                <Tv className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'شاشات التلفاز الذكية (Android TV)' : 'Android TV Leanback UI'}</span>
                  <span className="px-1.5 py-0.2 rounded bg-violet-600/80 text-[9px] text-white font-mono">
                    10-Foot
                  </span>
                </h3>
                <p className="text-[11px] text-[#9299A5]">
                  {isAr
                    ? 'تجربة سينمائية متكاملة مع تحكم الريموت D-Pad'
                    : 'Experience full 10-foot TV mode with D-Pad controller.'}
                </p>
              </div>
            </div>

            <button
              onClick={onSwitchToTvMode}
              className="px-3.5 py-2 rounded-xl bg-[#7654C8] hover:bg-violet-600 text-white font-bold text-[11px] shadow-md shadow-violet-950/50 shrink-0 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{isAr ? 'اقلب للتلفاز' : 'Switch'}</span>
            </button>
          </div>

          {/* RAIL 1: متابعة المشاهدة (Continue Watching) */}
          {continueWatchingList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'متابعة المشاهدة' : 'Continue Watching'}
                  </h3>
                </div>
              </div>

              <div className="flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-0.5">
                {continueWatchingList.map((anime) => (
                  <div key={anime.id} className="w-28 sm:w-32 shrink-0">
                    <AnimeCard
                      anime={anime}
                      language={language}
                      size="sm"
                      onSelect={onSelectAnime}
                      onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RAIL 2: 📺 أحدث الحلقات (Latest Episodes) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📺</span>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'أحدث الحلقات' : 'Latest Episodes'}
                </h3>
              </div>
              <button
                onClick={() => handleTabChange('browse')}
                className="text-[11px] font-bold text-[#7654C8] hover:text-[#A78BFA] transition-colors flex items-center gap-0.5"
              >
                <span>{isAr ? 'عرض الكل' : 'See all'}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-0.5">
              {latestEpisodesList.map((anime) => (
                <div key={anime.id} className="w-28 sm:w-32 shrink-0">
                  <AnimeCard
                    anime={anime}
                    language={language}
                    size="sm"
                    onSelect={onSelectAnime}
                    onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RAIL 3: ✨ أنيميشن مدبلج ومترجم (AW Dubbed) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'أنيميشن مدبلج ومترجم' : 'Animation & Dubbed'}
                </h3>
              </div>
              <button
                onClick={() => handleTabChange('dubbed')}
                className="text-[11px] font-bold text-[#7654C8] hover:text-[#A78BFA] transition-colors flex items-center gap-0.5"
              >
                <span>{isAr ? 'عرض الكل' : 'See all'}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-0.5">
              {dubbedList.map((anime) => (
                <div key={anime.id} className="w-28 sm:w-32 shrink-0">
                  <AnimeCard
                    anime={anime}
                    language={language}
                    size="sm"
                    onSelect={onSelectAnime}
                    onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RAIL 4: رائج الآن (Trending Now) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'رائج الآن' : 'Trending Now'}
                </h3>
              </div>
              <button
                onClick={() => handleTabChange('browse')}
                className="text-[11px] font-bold text-[#7654C8] hover:text-[#A78BFA] transition-colors flex items-center gap-0.5"
              >
                <span>{isAr ? 'عرض الكل' : 'See all'}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-0.5">
              {trendingList.map((anime) => (
                <div key={anime.id} className="w-28 sm:w-32 shrink-0">
                  <AnimeCard
                    anime={anime}
                    language={language}
                    size="sm"
                    onSelect={onSelectAnime}
                    onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RAIL 5: يُعرض حالياً (Airing Now) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'يُعرض حالياً' : 'Airing Now'}
                </h3>
              </div>
              <button
                onClick={() => handleTabChange('browse')}
                className="text-[11px] font-bold text-[#7654C8] hover:text-[#A78BFA] transition-colors flex items-center gap-0.5"
              >
                <span>{isAr ? 'عرض الكل' : 'See all'}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-0.5">
              {airingList.map((anime) => (
                <div key={anime.id} className="w-28 sm:w-32 shrink-0">
                  <AnimeCard
                    anime={anime}
                    language={language}
                    size="sm"
                    onSelect={onSelectAnime}
                    onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RAIL 6: كرتون زمان وسبيستون (Spacetoon Classics) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎈</span>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'كرتون زمان وسبيستون' : 'Spacetoon & Classics'}
                </h3>
              </div>
              <button
                onClick={() => handleTabChange('dubbed')}
                className="text-[11px] font-bold text-[#7654C8] hover:text-[#A78BFA] transition-colors flex items-center gap-0.5"
              >
                <span>{isAr ? 'عرض الكل' : 'See all'}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-0.5">
              {spacetoonList.map((anime) => (
                <div key={anime.id} className="w-28 sm:w-32 shrink-0">
                  <AnimeCard
                    anime={anime}
                    language={language}
                    size="sm"
                    onSelect={onSelectAnime}
                    onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RAIL 7: الأعلى تقييماً على الإطلاق (Top Rated) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'الأعلى تقييماً على الإطلاق' : 'Top Rated All Time'}
                </h3>
              </div>
            </div>

            <div className="flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-0.5">
              {topRatedList.slice(0, 6).map((anime) => (
                <div key={anime.id} className="w-28 sm:w-32 shrink-0">
                  <AnimeCard
                    anime={anime}
                    language={language}
                    size="sm"
                    onSelect={onSelectAnime}
                    onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: SEARCH ===================== */}
      {activeBottomTab === 'search' && (
        <div className="space-y-4 pt-2">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9299A5] absolute top-3.5 right-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث باسم الأنمي، التصنيف، أو الاستوديو...' : 'Search by title, genre, or studio...'}
              className="w-full bg-[#111317] border border-white/10 rounded-2xl px-4 py-3 pr-11 text-xs text-white placeholder:text-[#9299A5] focus:outline-none focus:border-[#7654C8] transition-colors"
              autoFocus
            />
          </div>

          {/* Genre quick filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {GENRE_LIST.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  selectedGenre === genre.id
                    ? 'bg-[#7654C8] text-white shadow-md'
                    : 'bg-[#14171C] text-[#9299A5] hover:text-white border border-white/5'
                }`}
              >
                {isAr ? genre.labelAr : genre.labelEn}
              </button>
            ))}
          </div>

          {/* Grid Results */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-2">
            {searchResults
              .filter(
                (a) =>
                  selectedGenre === 'all' ||
                  a.genres.includes(selectedGenre) ||
                  a.genresAr.includes(selectedGenre)
              )
              .map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  language={language}
                  size="sm"
                  onSelect={onSelectAnime}
                  onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                />
              ))}
          </div>

          {searchResults.length === 0 && (
            <div className="text-center py-16 text-[#9299A5] space-y-2">
              <Search className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs">{isAr ? 'لم يتم العثور على أي أنمي مطابق' : 'No results found'}</p>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: BROWSE ===================== */}
      {activeBottomTab === 'browse' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-[#3B82F6]" />
              <span>{isAr ? 'تصفح مكتبة الأنمي' : 'Browse Catalog'}</span>
            </h2>
            <span className="text-[11px] text-[#9299A5]">
              {animeList.length} {isAr ? 'عمل' : 'titles'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {animeList.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                language={language}
                size="sm"
                onSelect={onSelectAnime}
                onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
              />
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB: DUBBED (AW Dubbed & Spacetoon) ===================== */}
      {activeBottomTab === 'dubbed' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-[#10B981]" />
              <span>{isAr ? 'كرتون مدبلج وسبيستون زمان' : 'Dubbed Cartoons & Spacetoon'}</span>
            </h2>
            <span className="text-[11px] text-[#9299A5]">
              {dubbedList.length} {isAr ? 'مسلسل مدبلج' : 'shows'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {dubbedList.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                language={language}
                size="sm"
                onSelect={onSelectAnime}
                onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
              />
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB: DOWNLOADS ===================== */}
      {activeBottomTab === 'downloads' && (
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-[#8B5CF6]" />
            <span>{isAr ? 'تنزيلاتي دون إنترنت' : 'Offline Downloads'}</span>
          </h2>

          <div className="p-6 rounded-2xl bg-[#14171C] border border-white/10 text-center space-y-3">
            <Download className="w-10 h-10 mx-auto text-violet-400 opacity-60" />
            <h3 className="text-xs font-bold text-white">
              {isAr ? 'التحميل دون إنترنت جاهز' : 'Offline Mode Available'}
            </h3>
            <p className="text-[11px] text-[#9299A5] max-w-sm mx-auto leading-relaxed">
              {isAr
                ? 'يمكنك تنزيل حلقات الأنمي المفضلة لديك بدقة عالية ومشاهدتها دون الحاجة لاتصال بالإنترنت على الهاتف وتطبيق التلفاز الذكي.'
                : 'Download anime episodes to watch offline anytime on your mobile or Android TV device.'}
            </p>
            <button
              onClick={() => handleTabChange('home')}
              className="px-4 py-2 rounded-xl bg-[#7654C8] text-white text-xs font-bold hover:bg-violet-600 transition-colors"
            >
              {isAr ? 'تصفح الحلقات المتاحة للتحميل' : 'Browse Available Episodes'}
            </button>
          </div>
        </div>
      )}

      {/* ===================== TAB: LIBRARY / WATCHLIST ===================== */}
      {activeBottomTab === 'library' && (
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#7654C8]" />
            <span>{isAr ? 'قائمتي المفضلة' : 'My Watchlist'} ({watchlistItems.length})</span>
          </h2>

          {watchlistItems.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {watchlistItems.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  language={language}
                  size="sm"
                  onSelect={onSelectAnime}
                  onPlayDirect={() => onPlayAnime(anime, anime.episodes[0])}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#9299A5] space-y-3">
              <Bookmark className="w-12 h-12 mx-auto text-neutral-700" />
              <p className="text-xs">
                {isAr ? 'لم تقم بإضافة أي أنمي إلى قائمتك بعد.' : 'No anime in your list yet.'}
              </p>
              <button
                onClick={() => handleTabChange('home')}
                className="px-4 py-2 rounded-xl bg-[#14171C] border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                {isAr ? 'استكشف الأنميات الآن' : 'Explore Anime Now'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===================== AUTHENTIC 6-TAB BOTTOM NAVIGATION BAR ===================== */}
      {/* Matches artifacts/nova-mobile/app/(tabs)/_layout.tsx EXACTLY:
          Height: 64px, Background: #090A0C, borderTop: rgba(255,255,255,0.12),
          Tabs: الرئيسية, بحث, تصفح, مدبلج, تنزيلاتي, قائمتي
      */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-[#090A0C] border-t border-white/10 backdrop-blur-2xl max-w-lg mx-auto sm:max-w-full font-['Cairo']"
        style={{ height: '64px' }}
      >
        <div className="grid grid-cols-6 h-full items-center px-1">
          {/* Tab 1: الرئيسية */}
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeBottomTab === 'home' ? 'text-[#7654C8] font-bold' : 'text-[#9299A5] hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 leading-none">{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>

          {/* Tab 2: بحث */}
          <button
            onClick={() => handleTabChange('search')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeBottomTab === 'search' ? 'text-[#7654C8] font-bold' : 'text-[#9299A5] hover:text-white'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 leading-none">{isAr ? 'بحث' : 'Search'}</span>
          </button>

          {/* Tab 3: تصفح */}
          <button
            onClick={() => handleTabChange('browse')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeBottomTab === 'browse' ? 'text-[#7654C8] font-bold' : 'text-[#9299A5] hover:text-white'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 leading-none">{isAr ? 'تصفح' : 'Browse'}</span>
          </button>

          {/* Tab 4: مدبلج */}
          <button
            onClick={() => handleTabChange('dubbed')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeBottomTab === 'dubbed' ? 'text-[#7654C8] font-bold' : 'text-[#9299A5] hover:text-white'
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 leading-none">{isAr ? 'مدبلج' : 'Dubbed'}</span>
          </button>

          {/* Tab 5: تنزيلاتي */}
          <button
            onClick={() => handleTabChange('downloads')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeBottomTab === 'downloads' ? 'text-[#7654C8] font-bold' : 'text-[#9299A5] hover:text-white'
            }`}
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 leading-none">{isAr ? 'تنزيلاتي' : 'Downloads'}</span>
          </button>

          {/* Tab 6: قائمتي */}
          <button
            onClick={() => handleTabChange('library')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeBottomTab === 'library' ? 'text-[#7654C8] font-bold' : 'text-[#9299A5] hover:text-white'
            }`}
          >
            <div className="relative">
              <Bookmark className="w-5 h-5" />
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#7654C8]" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-none">{isAr ? 'قائمتي' : 'Library'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
