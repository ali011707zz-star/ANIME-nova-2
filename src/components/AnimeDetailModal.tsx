import React from 'react';
import { Anime, Episode, Language } from '../types/anime';
import { Play, Star, Heart, Clock, Film, Sparkles, X, Tv } from 'lucide-react';

interface AnimeDetailModalProps {
  anime: Anime;
  language: Language;
  onClose: () => void;
  onPlayEpisode: (anime: Anime, episode: Episode) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (animeId: string) => void;
  onLaunchTvModeForAnime?: () => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  anime,
  language,
  onClose,
  onPlayEpisode,
  isInWatchlist,
  onToggleWatchlist,
  onLaunchTvModeForAnime
}) => {
  const isAr = language === 'ar';
  const title = isAr ? anime.titleAr : anime.title;
  const synopsis = isAr ? anime.synopsisAr : anime.synopsis;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl bg-neutral-900 border border-white/15 overflow-hidden shadow-2xl text-white my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner Header */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#111317]">
          {anime.bannerImage ? (
            <img
              src={anime.bannerImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-r ${anime.bannerColor}`} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#090A0C] via-[#090A0C]/75 to-black/40" />

          {/* Banner Content */}
          <div className="relative z-10 w-full h-full p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-violet-600/90 text-white shadow">
                  {anime.rating}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{anime.score}</span>
                </span>
                <span className="text-neutral-300">
                  {anime.year} · {isAr ? anime.statusAr : anime.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {title}
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">{anime.titleJp}</p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onPlayEpisode(anime, anime.episodes[0])}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-xl shadow-violet-950/60 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isAr ? 'بدء الحلقة 1' : 'Play Episode 1'}</span>
              </button>

              <button
                onClick={() => onToggleWatchlist(anime.id)}
                className={`p-2.5 rounded-xl border backdrop-blur-md transition-all active:scale-95 ${
                  isInWatchlist
                    ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                    : 'bg-black/40 border-white/15 text-neutral-300 hover:text-white'
                }`}
                title={isInWatchlist ? 'إزالة من قائمتي' : 'إضافة إلى قائمتي'}
              >
                <Heart className={`w-5 h-5 ${isInWatchlist ? 'fill-violet-400 text-violet-400' : ''}`} />
              </button>

              {onLaunchTvModeForAnime && (
                <button
                  onClick={onLaunchTvModeForAnime}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-white/10"
                  title="عرض في شاشة التلفاز الذكي"
                >
                  <Tv className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">{isAr ? 'عرض تلفاز' : 'TV View'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200">{isAr ? 'التصنيفات:' : 'Genres:'}</span>
            {(isAr ? anime.genresAr : anime.genres).map((g, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300">
                {g}
              </span>
            ))}
            <span className="mx-2">·</span>
            <span>{isAr ? `الاستوديو: ${anime.studio}` : `Studio: ${anime.studio}`}</span>
            <span className="mx-2">·</span>
            <span>{anime.durationPerEp}</span>
          </div>

          {/* Synopsis */}
          <div>
            <h2 className="text-sm font-bold text-neutral-200 mb-1.5">
              {isAr ? 'القصة والأحداث' : 'Synopsis'}
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">{synopsis}</p>
          </div>

          {/* Episode List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-violet-400" />
                <span>{isAr ? 'قائمة الحلقات' : 'Episodes'} ({anime.episodes.length})</span>
              </h2>
              <span className="text-xs text-neutral-400 font-mono">1080p Full HD</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {anime.episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => onPlayEpisode(anime, ep)}
                  className="group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-violet-400 font-bold group-hover:bg-violet-600 group-hover:text-white transition-colors shrink-0">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-neutral-400 block">
                        EP {ep.number} · {ep.duration}
                      </span>
                      <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-violet-400 transition-colors">
                        {isAr ? ep.titleAr : ep.title}
                      </h3>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-400 px-2 py-1 rounded bg-black/40 font-mono">
                    HD
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Characters */}
          <div>
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'أبرز الشخصيات' : 'Key Characters'}</span>
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {anime.characters.map((char, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 text-center flex flex-col items-center justify-center"
                >
                  <div
                    className="w-12 h-12 rounded-full mb-2 flex items-center justify-center text-sm font-black text-white border border-white/20"
                    style={{ backgroundColor: `${anime.accentColor}30` }}
                  >
                    {(char.name || '').slice(0, 1)}
                  </div>
                  <span className="text-xs font-bold text-white line-clamp-1">
                    {isAr ? char.nameAr : char.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                    {isAr ? char.roleAr : char.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
