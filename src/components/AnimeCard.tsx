import React, { useState } from 'react';
import { Anime, Language } from '../types/anime';
import { Star, Tv, Film } from 'lucide-react';

interface AnimeCardProps {
  anime: Anime;
  language: Language;
  size?: 'sm' | 'md' | 'lg';
  isTvMode?: boolean;
  isFocused?: boolean;
  onSelect: (anime: Anime) => void;
  onPlayDirect?: (anime: Anime) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  language,
  size = 'md',
  isTvMode = false,
  isFocused = false,
  onSelect,
}) => {
  const isAr = language === 'ar';
  const title = isAr ? (anime.titleAr || anime.title) : anime.title;
  const secondaryTitle = isAr ? anime.title : anime.titleAr;
  const [imageError, setImageError] = useState(false);

  // Poster source: first anime.coverImage, then AniList CDN, then fallback
  const posterUri = imageError
    ? ''
    : (anime.coverImage || (anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : ''));

  return (
    <div
      onClick={() => onSelect(anime)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSelect(anime);
        }
      }}
      className={`group relative cursor-pointer select-none transition-all duration-200 ${
        isTvMode
          ? `w-56 shrink-0 ${
              isFocused
                ? 'scale-105 ring-4 ring-violet-500/80 shadow-2xl shadow-violet-950/80 z-20'
                : 'opacity-90 hover:opacity-100'
            }`
          : 'w-full'
      }`}
    >
      {/* Poster Image Container with exact 1:1.4 aspect ratio */}
      <div
        className={`relative w-full aspect-[1/1.4] rounded-xl overflow-hidden bg-[#14171C] border transition-all ${
          isFocused ? 'border-violet-500 ring-2 ring-violet-400' : 'border-white/10 group-hover:border-violet-500/50'
        }`}
      >
        {posterUri ? (
          <img
            src={posterUri}
            alt={title}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
            style={{ background: anime.posterBg || 'linear-gradient(135deg, #111317 0%, #1e1333 100%)' }}
          >
            <Film className="w-8 h-8 text-violet-400 mb-2 opacity-60" />
            <span className="text-xs font-bold text-neutral-300 line-clamp-2">{title}</span>
          </div>
        )}

        {/* Subtle dark gradient overlay at top & bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0C]/90 via-transparent to-black/30 pointer-events-none" />

        {/* Score Badge: Top Right */}
        {anime.score && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-md border border-white/10 text-[#FFD700] text-[10px] font-bold">
            <Star className="w-2.5 h-2.5 fill-[#FFD700]" />
            <span>{anime.score}</span>
          </div>
        )}

        {/* Airing / Dubbed Badge: Top Left */}
        {anime.badge && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-[#7654C8] text-white text-[9px] font-bold shadow-md">
            {anime.badge}
          </div>
        )}

        {/* TV Mode Indicator */}
        {isTvMode && (
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="p-1 rounded-md bg-violet-600/90 text-white flex items-center">
              <Tv className="w-3 h-3" />
            </span>
          </div>
        )}

        {/* Watch Progress Bar */}
        {anime.progress && anime.progress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
            <div
              className="h-full bg-[#7654C8]"
              style={{ width: `${Math.min(anime.progress * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Typography: Title & Subtitle */}
      <div className="mt-1.5 space-y-0.5">
        <h3
          className="text-[12px] font-bold text-[#F3F4F6] line-clamp-2 leading-tight group-hover:text-violet-400 transition-colors font-['Cairo']"
          title={title}
        >
          {title}
        </h3>

        {secondaryTitle && secondaryTitle !== title && (
          <p
            className="text-[10px] text-[#9299A5] truncate font-['Cairo'] leading-none"
            dir={isAr ? 'ltr' : 'rtl'}
          >
            {secondaryTitle}
          </p>
        )}
      </div>
    </div>
  );
};
