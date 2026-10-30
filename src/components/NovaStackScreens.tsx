import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Heart,
  Star,
  Play,
  PlayCircle,
  MessageCircle,
  Search,
  Eye,
  EyeOff,
  ArrowUpDown,
  Tv,
  Download,
  Pause,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  Calendar,
  Settings,
  Sparkles,
  Bell,
  Trash2,
  Send,
  Check,
  X,
  Code2,
  Link2,
  Clock,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  SkipBack,
  SkipForward,
  Smartphone,
  PictureInPicture2,
  ExternalLink,
  Volume2,
  Maximize2,
  Menu,
} from "lucide-react";
import {
  Anime,
  AwDubbedSeries,
  AwDubbedSeason,
  DubbedSeries,
  DubbedSeason,
  StardimaSeries,
  StardimaEpisodeItem,
} from "../types/anime";
import { extractYoutubeId, getYoutubeThumbUrl } from "../data/animeData";
import {
  ThemePalette,
  ThemeName,
  GENRE_MAP,
  paletteColors,
} from "../constants/novaColors";
import { useTvMetrics, getGridColumnCount } from "../utils/tv";
import { NovaInternalVideoPlayer } from "./NovaSeasonsAndMangaScreens";
import {
  AR_SCHEDULE_DAYS,
  buildWeeklySchedule,
  filterAndSortSchedule,
  getDayLabelAr,
  getScheduleStats,
  ScheduleSortBy,
  ScheduleStatusFilter,
} from "../utils/scheduleLogic";

/* ══════════════════════════════════════════════════════════════════════════
   1. AnimeDetailScreen (100% 1:1 from artifacts/nova-mobile/app/anime/[id].tsx)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaAnimeDetailScreen({
  anime,
  allAnime,
  colors,
  isFav,
  onBack,
  onToggleFav,
  onOpenEpisodes,
  onOpenComments,
  onSelectSimilar,
}: {
  anime: Anime;
  allAnime: Anime[];
  colors: ThemePalette;
  isFav: boolean;
  onBack: () => void;
  onToggleFav: (anime: Anime) => void;
  onOpenEpisodes: (anime: Anime) => void;
  onOpenComments: (anime: Anime, epNum?: number) => void;
  onSelectSimilar: (anime: Anime) => void;
}) {
  const { width: vpWidth, height: vpHeight } = useTvMetrics();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [trailerLandscape, setTrailerLandscape] = useState(true);
  const [trailerThumbBroken, setTrailerThumbBroken] = useState(false);
  const trailerModalRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<"chars" | "related" | "similar">("chars");
  const [favCharIds, setFavCharIds] = useState<Set<number>>(new Set([1]));

  const openTrailerFullscreen = () => {
    setTrailerLandscape(true);
    setShowTrailerModal(true);
    setTimeout(() => {
      const el = trailerModalRef.current;
      if (el && el.requestFullscreen && !document.fullscreenElement) {
        el.requestFullscreen().catch(() => {});
      }
      try {
        const scr = window.screen as any;
        if (scr?.orientation?.lock) {
          scr.orientation.lock("landscape").catch(() => {});
        }
      } catch {}
    }, 40);
  };

  const closeTrailerModal = () => {
    try {
      const scr = window.screen as any;
      if (scr?.orientation?.unlock) {
        scr.orientation.unlock();
      }
    } catch {}
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setShowTrailerModal(false);
  };

  const isAiring = anime.status === "Airing";
  const trailerYT = useMemo(
    () => extractYoutubeId(anime.trailerYtId) || "Poo5lqoWSGw",
    [anime.trailerYtId]
  );
  const trailerThumbUrl = useMemo(() => {
    const ytThumb = getYoutubeThumbUrl(trailerYT);
    if (!trailerThumbBroken && ytThumb) return ytThumb;
    return anime.bannerImage || anime.coverImage || "";
  }, [trailerYT, trailerThumbBroken, anime.bannerImage, anime.coverImage]);

  const mainChars = useMemo(
    () => [
      {
        id: 1,
        name: anime.characters[0]?.name || "Saitama",
        image:
          anime.characters[0]?.imageUrl ||
          anime.coverImage ||
          "",
        role: "MAIN",
      },
      {
        id: 2,
        name: anime.characters[1]?.name || "Genos",
        image:
          anime.characters[1]?.imageUrl ||
          anime.bannerImage ||
          anime.coverImage ||
          "",
        role: "MAIN",
      },
      {
        id: 3,
        name: anime.characters[2]?.name || "Tatsumaki",
        image:
          anime.characters[2]?.imageUrl ||
          anime.coverImage ||
          "",
        role: "MAIN",
      },
    ],
    [anime]
  );

  const suppChars = useMemo(
    () => [
      {
        id: 101,
        name: "Silver Fang",
        image:
          allAnime[1]?.coverImage || anime.coverImage,
      },
      {
        id: 102,
        name: "King",
        image:
          allAnime[2]?.coverImage || anime.coverImage,
      },
      {
        id: 103,
        name: "Sonic",
        image:
          allAnime[3]?.coverImage || anime.coverImage,
      },
      {
        id: 104,
        name: "Fubuki",
        image:
          allAnime[4]?.coverImage || anime.coverImage,
      },
      {
        id: 105,
        name: "Mumen Rider",
        image:
          allAnime[5]?.coverImage || anime.coverImage,
      },
    ],
    [anime, allAnime]
  );

  const toggleCharFav = (id: number) => {
    setFavCharIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 overflow-y-auto no-scrollbar select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 100 }}
    >
      {/* ── Sticky Navigation Header (always accessible when scrolling down/up) ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between"
        style={{
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 9,
          paddingBottom: 9,
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
            style={{
              width: 36,
              height: 36,
              backgroundColor: colors.input,
              borderRadius: 11,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ChevronRight size={20} color={colors.textPrimary} />
          </button>
          <span
            className="line-clamp-1"
            style={{
              fontSize: 14.5,
              fontWeight: 800,
              color: colors.textPrimary,
            }}
          >
            {anime.titleAr || anime.title}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
          style={{
            backgroundColor: isAiring
              ? "rgba(16, 185, 129, 0.14)"
              : colors.accentSurface,
            border: isAiring
              ? "1px solid rgba(52, 211, 153, 0.3)"
              : `1px solid ${colors.accentBorder}`,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: isAiring ? "#10B981" : colors.accent,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: isAiring ? "#34D399" : colors.accent,
            }}
          >
            {isAiring ? "يُعرض الآن" : "مكتمل"}
          </span>
        </div>
      </div>

      {/* ── Hero Banner (Modern Cinematic Backdrop) ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: vpWidth >= 960 ? 310 : vpWidth >= 600 ? 260 : 220 }}
      >
        <img
          src={anime.bannerImage || anime.coverImage}
          alt={anime.title}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(9,10,12,0.12) 0%, rgba(9,10,12,0.55) 55%, ${colors.background} 100%)`,
          }}
        />
      </div>

      {/* ── Cover + Title + Key Metadata Block ── */}
      <div
        className="flex items-end"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          marginTop: -64,
          gap: 14,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: 106,
            height: 154,
            borderRadius: 16,
            border: `2px solid ${colors.surfaceElevated}`,
            backgroundColor: colors.card,
            boxShadow: "0 14px 28px -8px rgba(0, 0, 0, 0.65)",
          }}
        >
          <img
            src={anime.coverImage}
            alt={anime.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ paddingBottom: 4, gap: 5 }}
        >
          {/* Arabic Title First for immediate clarity */}
          <h1
            dir="rtl"
            className="m-0 line-clamp-2"
            style={{
              fontSize: 17.5,
              fontWeight: 900,
              color: colors.textPrimary,
              lineHeight: "24px",
              textAlign: "right",
            }}
          >
            {anime.titleAr || anime.title}
          </h1>

          {/* English / Romaji Subtitle */}
          <p
            dir="ltr"
            className="m-0 line-clamp-1"
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              fontWeight: 700,
              lineHeight: "17px",
              textAlign: "left",
            }}
          >
            {anime.title}
          </p>

          {/* Compact Metadata Chips (Format + Year + Episodes + Score) */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span
              style={{
                borderRadius: 8,
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 3,
                paddingBottom: 3,
                backgroundColor: colors.accentSurface,
                border: `1px solid ${colors.accentBorder}`,
                fontSize: 10,
                fontWeight: 800,
                color: colors.accent,
              }}
            >
              {anime.format === "TV" ? "مسلسل TV" : anime.format}
            </span>

            {anime.year && (
              <span
                style={{
                  borderRadius: 8,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 3,
                  paddingBottom: 3,
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  fontSize: 10,
                  fontWeight: 800,
                  color: colors.textSecondary,
                }}
              >
                {anime.year}
              </span>
            )}

            {anime.episodesCount > 0 && (
              <span
                style={{
                  borderRadius: 8,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 3,
                  paddingBottom: 3,
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  fontSize: 10,
                  fontWeight: 800,
                  color: colors.textSecondary,
                }}
              >
                {anime.episodesCount} حلقة
              </span>
            )}

            {anime.score > 0 && (
              <div
                className="flex items-center gap-1"
                style={{
                  borderRadius: 8,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 3,
                  paddingBottom: 3,
                  backgroundColor: "rgba(14, 165, 233, 0.14)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                <Star size={10} color="#38BDF8" fill="#38BDF8" />
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 900,
                    color: colors.textPrimary,
                  }}
                >
                  {anime.score.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Next episode countdown ── */}
      {isAiring && (
        <div
          className="flex items-center gap-2 mx-4 mt-3.5 px-3.5 py-2.5"
          style={{
            borderRadius: 13,
            backgroundColor: colors.accentSurface,
            border: `1px solid ${colors.accentBorder}`,
          }}
        >
          <Clock size={14} color={colors.accent} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.accent,
              flex: 1,
            }}
          >
            الحلقة {(anime.episodesCount % 12) + 1} تُبث بعد 3 يوم و 6 ساعة
          </span>
        </div>
      )}

      {/* ── Eye-Comfortable Ocean Sapphire Watch Now Button ── */}
      <div
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          marginTop: isAiring ? 10 : 16,
        }}
      >
        <button
          onClick={() => onOpenEpisodes(anime)}
          className="w-full flex items-center justify-between px-4 cursor-pointer active:scale-[0.985] transition-transform"
          style={{
            height: 54,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, #0EA5E9 0%, #0284C7 55%, #0369A1 100%)",
            border: "1px solid rgba(186, 230, 253, 0.35)",
            boxShadow: "0 10px 24px -6px rgba(2, 132, 199, 0.42)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                backgroundColor: "rgba(9, 10, 12, 0.22)",
                border: "1px solid rgba(255, 255, 255, 0.24)",
                borderRadius: 11,
              }}
            >
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            </div>
            <div className="flex flex-col items-start">
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  lineHeight: "19px",
                }}
              >
                مشاهدة الآن
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(224, 242, 254, 0.9)",
                }}
              >
                تصفح الحلقات وابدأ المشاهدة فوراً
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
            style={{
              backgroundColor: "rgba(9, 10, 12, 0.22)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              {anime.episodesCount || 12} حلقة
            </span>
            <ChevronLeft size={14} color="#FFFFFF" />
          </div>
        </button>
      </div>

      {/* ── Modern 3-Col Quick Action Bar (التعليقات | المفضلة | تقييمي) ── */}
      <div
        className="grid grid-cols-3"
        style={{
          gap: 8,
          paddingLeft: 16,
          paddingRight: 16,
          marginTop: 12,
        }}
      >
        <button
          onClick={() => onOpenComments(anime)}
          className="flex items-center justify-center gap-2 py-3 px-2 cursor-pointer active:scale-95 transition-transform"
          style={{
            borderRadius: 14,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <MessageCircle size={16} color={colors.accent} />
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: colors.textPrimary,
            }}
          >
            التعليقات
          </span>
        </button>

        <button
          onClick={() => onToggleFav(anime)}
          className="flex items-center justify-center gap-2 py-3 px-2 cursor-pointer active:scale-95 transition-transform"
          style={{
            borderRadius: 14,
            backgroundColor: isFav ? "rgba(244, 63, 94, 0.14)" : colors.card,
            border: `1px solid ${
              isFav ? "rgba(244, 63, 94, 0.35)" : colors.border
            }`,
          }}
        >
          <Heart
            size={16}
            color={isFav ? "#F43F5E" : colors.textSecondary}
            fill={isFav ? "#F43F5E" : "transparent"}
          />
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: isFav ? "#F43F5E" : colors.textPrimary,
            }}
          >
            {isFav ? "في المفضلة" : "المفضلة"}
          </span>
        </button>

        <button
          onClick={() => setShowRatingModal(true)}
          className="flex items-center justify-center gap-2 py-3 px-2 cursor-pointer active:scale-95 transition-transform"
          style={{
            borderRadius: 14,
            backgroundColor:
              myRating > 0 ? colors.accentSurface : colors.card,
            border: `1px solid ${
              myRating > 0 ? colors.accentBorder : colors.border
            }`,
          }}
        >
          <Star
            size={16}
            color={myRating > 0 ? colors.accent : colors.textSecondary}
            fill={myRating > 0 ? colors.accent : "transparent"}
          />
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: myRating > 0 ? colors.accent : colors.textPrimary,
            }}
          >
            {myRating > 0 ? `تقييمي ${myRating}/10` : "تقييمي"}
          </span>
        </button>
      </div>

      {/* ── Global Rating & Ranking Strip (MyAnimeList) ── */}
      <div
        style={{
          marginLeft: 16,
          marginRight: 16,
          marginTop: 14,
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
        }}
      >
        <div
          className="flex items-center justify-between px-3.5 py-2"
          style={{
            borderBottom: `1px solid ${colors.border}`,
            backgroundColor: colors.surfaceElevated,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: colors.textSecondary,
            }}
          >
            الإحصائيات والتقييم العالمي
          </span>
          <span
            dir="ltr"
            style={{
              fontSize: 10.5,
              color: colors.accent,
              fontWeight: 800,
            }}
          >
            MAL #{anime.anilistId}
          </span>
        </div>

        <div className="grid grid-cols-3">
          <div className="flex flex-col items-center py-3">
            <div className="flex items-center gap-1">
              <Star size={14} color="#38BDF8" fill="#38BDF8" />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: colors.textPrimary,
                }}
              >
                {anime.score.toFixed(1)}
              </span>
            </div>
            <span
              style={{
                fontSize: 9.5,
                color: colors.textMuted,
                marginTop: 2,
                fontWeight: 600,
              }}
            >
              184,320 مصوت
            </span>
          </div>

          <div
            className="flex flex-col items-center py-3"
            style={{ borderRight: `1px solid ${colors.border}` }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: colors.textPrimary,
              }}
            >
              #24
            </span>
            <span
              style={{
                fontSize: 9.5,
                color: colors.textMuted,
                marginTop: 2,
                fontWeight: 600,
              }}
            >
              الترتيب العالمي
            </span>
          </div>

          <div
            className="flex flex-col items-center py-3"
            style={{ borderRight: `1px solid ${colors.border}` }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: colors.textPrimary,
              }}
            >
              52,410
            </span>
            <span
              style={{
                fontSize: 9.5,
                color: colors.textMuted,
                marginTop: 2,
                fontWeight: 600,
              }}
            >
              في قائمة المتابعة
            </span>
          </div>
        </div>
      </div>

      {/* ── Synopsis (قصة الأنمي) ── */}
      <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 18 }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div
            style={{
              width: 3.5,
              height: 16,
              backgroundColor: colors.primary,
              borderRadius: 999,
            }}
          />
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 900,
              color: colors.textPrimary,
            }}
          >
            قصة الأنمي
          </span>
        </div>

        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 14,
            border: `1px solid ${colors.border}`,
          }}
        >
          <p
            className={`m-0 ${showFullDesc ? "" : "line-clamp-4"}`}
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: "23px",
              textAlign: "right",
            }}
          >
            {anime.synopsisAr}
          </p>
          <button
            onClick={() => setShowFullDesc((f) => !f)}
            className="w-full flex items-center justify-center gap-1 mt-3 pt-2 cursor-pointer"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            <span
              style={{
                fontSize: 12,
                color: colors.accent,
                fontWeight: 800,
              }}
            >
              {showFullDesc ? "عرض أقل" : "قراءة القصة كاملة"}
            </span>
            {showFullDesc ? (
              <ChevronUp size={14} color={colors.accent} />
            ) : (
              <ChevronDown size={14} color={colors.accent} />
            )}
          </button>
        </div>
      </div>

      {/* ── Genres (التصنيفات) ── */}
      <div
        className="flex overflow-x-auto no-scrollbar"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          gap: 8,
          marginTop: 12,
        }}
      >
        {anime.genres.map((g) => (
          <div
            key={g}
            className="shrink-0"
            style={{
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 5.5,
              paddingBottom: 5.5,
              borderRadius: 10,
              backgroundColor: colors.accentSurface,
              border: `1px solid ${colors.accentBorder}`,
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: colors.accent,
              }}
            >
              {GENRE_MAP[g] || g}
            </span>
          </div>
        ))}
      </div>

      {/* ── Modern Bento Metadata Grid (معلومات الإنتاج والعرض) ── */}
      <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 18 }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div
            style={{
              width: 3.5,
              height: 16,
              backgroundColor: colors.primary,
              borderRadius: 999,
            }}
          />
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 900,
              color: colors.textPrimary,
            }}
          >
            معلومات الإنتاج
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "الاستوديو المنتج", value: anime.studio || "Madhouse", highlight: true },
            { label: "المصدر الأصلي", value: "مانجا يابانية", highlight: false },
            {
              label: "مدة الحلقة",
              value: anime.durationPerEp || "24 دقيقة",
              highlight: false,
            },
            {
              label: "فترة العرض",
              value: `${anime.year} · ${isAiring ? "مستمر" : "مكتمل"}`,
              highlight: false,
            },
          ].map((box) => (
            <div
              key={box.label}
              className="flex flex-col gap-1 p-3"
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                border: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  color: colors.textMuted,
                  fontWeight: 700,
                }}
              >
                {box.label}
              </span>
              <span
                className="line-clamp-1"
                style={{
                  fontSize: 12.5,
                  color: box.highlight ? colors.accent : colors.textPrimary,
                  fontWeight: 800,
                }}
              >
                {box.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trailer (الإعلان الدعائي الرسمي) ── */}
      {trailerYT && (
        <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 18 }}>
          <div
            onClick={openTrailerFullscreen}
            className="flex items-center justify-between mb-2.5 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 3.5,
                  height: 16,
                  backgroundColor: colors.primary,
                  borderRadius: 999,
                }}
              />
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 900,
                  color: colors.textPrimary,
                }}
              >
                الإعلان الدعائي الرسمي
              </span>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#38BDF8",
                backgroundColor: "rgba(14, 165, 233, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.28)",
              }}
            >
              1080p HD · رسمي
            </span>
          </div>

          <button
            onClick={openTrailerFullscreen}
            aria-label="تشغيل الإعلان الدعائي"
            className="w-full relative overflow-hidden cursor-pointer text-right active:scale-[0.99] transition-transform"
            style={{
              height: 184,
              borderRadius: 18,
              backgroundColor: "#0D1017",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 14px 32px -12px rgba(0, 0, 0, 0.55)",
            }}
          >
            <img
              src={trailerThumbUrl}
              alt="العرض الدعائي"
              onError={() => setTrailerThumbBroken(true)}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(9,10,12,0.12) 0%, rgba(9,10,12,0.88) 100%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 58,
                  height: 58,
                  background:
                    "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
                  borderRadius: 999,
                  border: "2px solid rgba(255,255,255,0.45)",
                  boxShadow: "0 10px 28px rgba(14, 165, 233, 0.58)",
                }}
              >
                <Play size={23} color="#fff" fill="#fff" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3.5 flex items-center justify-between">
              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 900,
                    color: "#fff",
                    textAlign: "right",
                  }}
                >
                  العرض التشويقي الرسمي (YouTube HD)
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "rgba(226,232,240,0.82)",
                    marginTop: 2,
                    textAlign: "right",
                  }}
                >
                  مشغل دعائي سينمائي فائق الوضوح — اضغط للمشاهدة
                </div>
              </div>
              <div
                className="px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                style={{
                  backgroundColor: "rgba(255, 0, 0, 0.85)",
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                <Play size={10} color="#fff" fill="#fff" />
                <span>YouTube</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Segmented 3-Tab Section: الشخصيات | ذات صلة | مشابهة ── */}
      <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 20 }}>
        <div
          className="grid grid-cols-3 p-1"
          style={{
            borderRadius: 13,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            marginBottom: 14,
          }}
        >
          {(
            [
              { key: "chars", label: "الشخصيات" },
              { key: "related", label: "ذات صلة" },
              { key: "similar", label: "أنميات مشابهة" },
            ] as const
          ).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="py-2 flex items-center justify-center cursor-pointer transition-all"
                style={{
                  borderRadius: 10,
                  backgroundColor: active ? colors.primary : "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: active ? "#FFFFFF" : colors.textSecondary,
                  }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: الشخصيات */}
        {tab === "chars" && (
          <div>
            <div
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                fontWeight: 800,
                marginBottom: 10,
                textAlign: "right",
              }}
            >
              الشخصيات الرئيسية
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {mainChars.map((ch) => {
                const isCharFav = favCharIds.has(ch.id);
                return (
                  <div
                    key={ch.id}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full relative overflow-hidden"
                      style={{
                        aspectRatio: "0.72",
                        borderRadius: 11,
                        border: `1.5px solid ${colors.accentBorder}`,
                        backgroundColor: colors.surfaceElevated,
                      }}
                    >
                      <img
                        src={ch.image}
                        alt={ch.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => toggleCharFav(ch.id)}
                        className="absolute flex items-center justify-center cursor-pointer"
                        style={{
                          bottom: 4,
                          right: 4,
                          backgroundColor: isCharFav
                            ? "rgba(244,63,94,0.9)"
                            : "rgba(9,10,12,0.7)",
                          borderRadius: 8,
                          padding: 4,
                          border: `1px solid ${
                            isCharFav ? "#f43f5e" : "rgba(255,255,255,0.25)"
                          }`,
                        }}
                      >
                        <Heart
                          size={10}
                          color="#fff"
                          fill={isCharFav ? "#fff" : "transparent"}
                        />
                      </button>
                    </div>
                    <span
                      className="line-clamp-1 text-center"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: colors.textPrimary,
                        lineHeight: "13px",
                      }}
                    >
                      {ch.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                fontWeight: 800,
                marginTop: 14,
                marginBottom: 10,
                textAlign: "right",
              }}
            >
              الشخصيات المساعدة
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {suppChars.map((ch) => {
                const isCharFav = favCharIds.has(ch.id);
                return (
                  <div
                    key={ch.id}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full relative overflow-hidden"
                      style={{
                        aspectRatio: "0.72",
                        borderRadius: 11,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.surfaceElevated,
                      }}
                    >
                      <img
                        src={ch.image}
                        alt={ch.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => toggleCharFav(ch.id)}
                        className="absolute flex items-center justify-center cursor-pointer"
                        style={{
                          bottom: 4,
                          right: 4,
                          backgroundColor: isCharFav
                            ? "rgba(244,63,94,0.9)"
                            : "rgba(9,10,12,0.7)",
                          borderRadius: 8,
                          padding: 4,
                          border: `1px solid ${
                            isCharFav ? "#f43f5e" : "rgba(255,255,255,0.25)"
                          }`,
                        }}
                      >
                        <Heart
                          size={10}
                          color="#fff"
                          fill={isCharFav ? "#fff" : "transparent"}
                        />
                      </button>
                    </div>
                    <span
                      className="line-clamp-1 text-center"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: colors.textSecondary,
                        lineHeight: "13px",
                      }}
                    >
                      {ch.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: ذات صلة */}
        {tab === "related" && (
          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-1">
            {allAnime.slice(0, 4).map((rel, idx) => (
              <div
                key={rel.id}
                onClick={() => onSelectSimilar(rel)}
                className="shrink-0 flex flex-col gap-1.5 cursor-pointer"
                style={{ width: 108 }}
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: 108,
                    height: 150,
                    borderRadius: 13,
                    backgroundColor: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <img
                    src={rel.coverImage}
                    alt={rel.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      backgroundColor: "rgba(9, 10, 12, 0.82)",
                      borderRadius: 6,
                      paddingLeft: 6,
                      paddingRight: 6,
                      paddingTop: 2,
                      paddingBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 8.5,
                        color: "#38BDF8",
                        fontWeight: 800,
                      }}
                    >
                      {idx === 0 ? "تكملة" : idx === 1 ? "قصة جانبية" : "مشتق"}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: 6,
                      backgroundColor: "rgba(9, 10, 12, 0.82)",
                      borderRadius: 6,
                      paddingLeft: 5,
                      paddingRight: 5,
                      paddingTop: 2,
                      paddingBottom: 2,
                    }}
                  >
                    <Star size={8.5} color="#38BDF8" fill="#38BDF8" />
                    <span
                      style={{
                        fontSize: 8.5,
                        color: "#fff",
                        fontWeight: 800,
                      }}
                    >
                      {rel.score.toFixed(1)}
                    </span>
                  </div>
                </div>
                <span
                  className="line-clamp-1 text-center"
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: colors.textPrimary,
                  }}
                >
                  {rel.titleAr || rel.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: مشابهة */}
        {tab === "similar" && (
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${getGridColumnCount(vpWidth, vpHeight)}, minmax(0, 1fr))`,
            }}
          >
            {allAnime
              .filter((a) => a.id !== anime.id)
              .slice(0, 6)
              .map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => onSelectSimilar(sim)}
                  className="flex flex-col gap-1 cursor-pointer"
                >
                  <div
                    className="w-full relative overflow-hidden"
                    style={{
                      aspectRatio: "0.7",
                      borderRadius: 13,
                      backgroundColor: colors.surfaceElevated,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <img
                      src={sim.coverImage}
                      alt={sim.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="flex items-center gap-1"
                      style={{
                        position: "absolute",
                        bottom: 6,
                        left: 6,
                        backgroundColor: "rgba(9, 10, 12, 0.82)",
                        borderRadius: 6,
                        paddingLeft: 5,
                        paddingRight: 5,
                        paddingTop: 2,
                        paddingBottom: 2,
                      }}
                    >
                      <Star size={8.5} color="#38BDF8" fill="#38BDF8" />
                      <span
                        style={{
                          fontSize: 8.5,
                          color: "#fff",
                          fontWeight: 800,
                        }}
                      >
                        {sim.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <span
                    className="line-clamp-1 text-center"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: colors.textPrimary,
                    }}
                  >
                    {sim.titleAr || sim.title}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Rating Bottom Sheet Modal (exact lines 930-954 of anime/[id].tsx) ── */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center">
          <div
            onClick={() => setShowRatingModal(false)}
            className="fixed inset-0"
            style={{ backgroundColor: colors.overlay }}
          />
          <div
            className="relative z-10 w-full max-w-[540px] flex flex-col gap-4 p-6"
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: colors.textPrimary,
                textAlign: "center",
              }}
            >
              أضف تقييمك
            </div>
            <div
              style={{
                fontSize: 12,
                color: colors.textMuted,
                textAlign: "center",
              }}
            >
              اختر تقييمك من 1 إلى 10
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const active = n <= myRating;
                return (
                  <button
                    key={n}
                    onClick={() => {
                      setMyRating(n);
                      setShowRatingModal(false);
                    }}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: active
                        ? colors.accentSurface
                        : colors.surfaceElevated,
                      border: `1px solid ${
                        active ? colors.accent : colors.border
                      }`,
                      fontSize: 14,
                      fontWeight: 800,
                      color: active ? colors.textPrimary : colors.textSecondary,
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {myRating > 0 && (
              <button
                onClick={() => {
                  setMyRating(0);
                  setShowRatingModal(false);
                }}
                className="mt-2 cursor-pointer"
                style={{
                  color: colors.destructive,
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                حذف التقييم
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Fullscreen Official YouTube Trailer Modal (Redesigned Cinema Interior & Header) ── */}
      {showTrailerModal && trailerYT && (() => {
        const shouldRotateLandscape = trailerLandscape && vpHeight > vpWidth;
        return (
          <div
            ref={trailerModalRef}
            data-testid="trailer-fullscreen-modal"
            className="fixed inset-0 z-[120] overflow-hidden"
            style={{ backgroundColor: "#04070D" }}
          >
            <div
              dir="rtl"
              className="flex flex-col overflow-hidden"
              style={
                shouldRotateLandscape
                  ? {
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      width: "100vh",
                      height: "100vw",
                      transform: "translate(-50%, -50%) rotate(90deg)",
                      transformOrigin: "center center",
                      background:
                        "radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.16) 0%, #050811 55%, #020409 100%)",
                    }
                  : {
                      width: "100vw",
                      height: "100vh",
                      background:
                        "radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.16) 0%, #050811 55%, #020409 100%)",
                    }
              }
            >
              {/* ── Redesigned Luxury Top Header Bar (الجزء الأعلى من التريلر) ── */}
              <div
                data-testid="trailer-modal-header"
                className="flex items-center justify-between shrink-0"
                style={{
                  gap: 10,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 10,
                  paddingBottom: 10,
                  background:
                    "linear-gradient(180deg, rgba(8, 13, 24, 0.98) 0%, rgba(11, 17, 30, 0.90) 100%)",
                  borderBottom: "1px solid rgba(56, 189, 248, 0.22)",
                  boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
                }}
              >
                {/* Right Side: Back Button + Poster Thumbnail + Title & Official Badge */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={closeTrailerModal}
                    aria-label="رجوع"
                    className="flex items-center justify-center cursor-pointer shrink-0 active:scale-95 transition-transform"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.07)",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                    }}
                  >
                    <ChevronRight size={19} color="#F8FAFC" />
                  </button>

                  <img
                    src={anime.cover}
                    alt={anime.titleAr || anime.title}
                    className="w-8 h-11 rounded-lg object-cover shrink-0"
                    style={{
                      border: "1px solid rgba(56, 189, 248, 0.35)",
                    }}
                  />

                  <div className="min-w-0 flex-1 text-right">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-md flex items-center gap-1"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.2)",
                          border: "1px solid rgba(239, 68, 68, 0.45)",
                          fontSize: 9.5,
                          fontWeight: 900,
                          color: "#FCA5A5",
                        }}
                      >
                        <Play size={8} color="#EF4444" fill="#EF4444" />
                        OFFICIAL TRAILER
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: "rgba(14, 165, 233, 0.16)",
                          border: "1px solid rgba(56, 189, 248, 0.35)",
                          fontSize: 9.5,
                          fontWeight: 900,
                          color: "#38BDF8",
                        }}
                      >
                        1080p HD
                      </span>
                    </div>
                    <div
                      className="line-clamp-1 mt-0.5"
                      style={{
                        fontSize: 13.5,
                        fontWeight: 900,
                        color: "#F8FAFC",
                      }}
                    >
                      {anime.titleAr || anime.title}
                    </div>
                  </div>
                </div>

                {/* Left Side: Action Controls (Orientation, Fullscreen, YouTube, Close) */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setTrailerLandscape((prev) => !prev)}
                    aria-label="تدوير الشاشة"
                    className="flex items-center gap-1.5 px-3 cursor-pointer active:scale-95 transition-transform"
                    style={{
                      height: 36,
                      borderRadius: 11,
                      background: trailerLandscape
                        ? "linear-gradient(135deg, rgba(14, 165, 233, 0.26) 0%, rgba(37, 99, 235, 0.22) 100%)"
                        : "rgba(255, 255, 255, 0.07)",
                      border: trailerLandscape
                        ? "1px solid rgba(56, 189, 248, 0.5)"
                        : "1px solid rgba(255, 255, 255, 0.14)",
                    }}
                  >
                    <RotateCw
                      size={14}
                      color={trailerLandscape ? "#38BDF8" : "#E2E8F0"}
                    />
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 900,
                        color: trailerLandscape ? "#E0F2FE" : "#CBD5E1",
                      }}
                    >
                      {trailerLandscape ? "تدوير الشاشة" : "وضع عمودي"}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const el = trailerModalRef.current;
                      if (document.fullscreenElement && document.exitFullscreen) {
                        document.exitFullscreen().catch(() => {});
                      } else if (el && el.requestFullscreen) {
                        el.requestFullscreen().catch(() => {});
                      }
                    }}
                    aria-label="ملء الشاشة"
                    className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      backgroundColor: "rgba(255, 255, 255, 0.07)",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                    }}
                  >
                    <Maximize2 size={15} color="#F8FAFC" />
                  </button>

                  <a
                    href={`https://www.youtube.com/watch?v=${trailerYT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="فتح في يوتيوب"
                    className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      backgroundColor: "rgba(255, 255, 255, 0.07)",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                    }}
                  >
                    <ExternalLink size={15} color="#94A3B8" />
                  </a>

                  <button
                    onClick={closeTrailerModal}
                    aria-label="إغلاق الإعلان الدعائي"
                    className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      backgroundColor: "rgba(244, 63, 94, 0.16)",
                      border: "1px solid rgba(244, 63, 94, 0.38)",
                    }}
                  >
                    <X size={17} color="#FDA4AF" />
                  </button>
                </div>
              </div>

              {/* ── Redesigned Cinema Frame Interior (من الداخل) ── */}
              <div className="flex-1 w-full h-full p-2.5 sm:p-4 flex flex-col overflow-hidden">
                <div
                  className="flex-1 w-full h-full relative overflow-hidden rounded-2xl"
                  style={{
                    backgroundColor: "#000",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    boxShadow:
                      "0 20px 50px rgba(0, 0, 0, 0.85), 0 0 32px rgba(14, 165, 233, 0.12)",
                  }}
                >
                  <iframe
                    key={trailerYT}
                    title={`الإعلان الدعائي - ${anime.title}`}
                    src={`https://www.youtube.com/embed/${trailerYT}?autoplay=1&playsinline=0&rel=0&modestbranding=1&fs=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    className="w-full h-full border-0 block"
                    style={{ width: "100%", height: "100%", backgroundColor: "#000" }}
                  />
                </div>
              </div>

              {/* ── Bottom Cinema Info & Quick Watch Strip ── */}
              <div
                className="flex items-center justify-between shrink-0 px-4 py-2.5"
                style={{
                  backgroundColor: "rgba(8, 13, 24, 0.95)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 900,
                      color: "#FBBF24",
                    }}
                  >
                    ★ {anime.score.toFixed(1)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94A3B8",
                    }}
                  >
                    {anime.year} · {anime.episodesCount} حلقة
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#38BDF8",
                    }}
                  >
                    {(anime.genres || []).slice(0, 3).join(" ، ")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeTrailerModal();
                    onOpenEpisodes(anime);
                  }}
                  className="px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  style={{
                    background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  <Play size={12} color="#fff" fill="#fff" />
                  <span>مشاهدة الحلقات</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. EpisodeListScreen (100% 1:1 from artifacts/nova-mobile/app/episodes/[id].tsx)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaEpisodeListScreen({
  anime,
  colors,
  onBack,
  onSelectEpisode,
  onOpenComments,
}: {
  anime: Anime;
  colors: ThemePalette;
  onBack: () => void;
  onSelectEpisode: (anime: Anime, epNumber: number) => void;
  onOpenComments: (anime: Anime, epNumber: number) => void;
}) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [selectedRange, setSelectedRange] = useState<string>("all");
  const [watchedSet, setWatchedSet] = useState<Set<number>>(new Set([1, 2]));
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const episodeListTopRef = useRef<HTMLDivElement | null>(null);
  const episodeListBottomRef = useRef<HTMLDivElement | null>(null);

  const seasons = useMemo(
    () => [
      { id: `${anime.id}-s1`, count: Math.max(anime.episodesCount || 12, 24) },
      { id: `${anime.id}-s2`, count: 12 },
    ],
    [anime]
  );

  const total = seasons[selectedSeason]?.count || 12;
  const watchedCount = watchedSet.size;
  const pct = Math.min(100, Math.round((watchedCount / total) * 100));

  const episodeRanges = useMemo(() => {
    const step = total > 12 ? 12 : 6;
    const ranges: { key: string; label: string; start: number; end: number }[] = [
      { key: "all", label: `الكل (${total})`, start: 1, end: total },
    ];
    for (let i = 1; i <= total; i += step) {
      const end = Math.min(total, i + step - 1);
      ranges.push({
        key: `${i}-${end}`,
        label: `${i} - ${end}`,
        start: i,
        end,
      });
    }
    return ranges;
  }, [total]);

  const displayedEps = useMemo(() => {
    let arr = Array.from({ length: Math.min(total, 50) }, (_, i) => i + 1);
    if (selectedRange !== "all") {
      const found = episodeRanges.find((r) => r.key === selectedRange);
      if (found) {
        arr = arr.filter((n) => n >= found.start && n <= found.end);
      }
    }
    if (sortOrder === "desc") arr.reverse();
    if (search.trim()) {
      return arr.filter((n) => String(n).includes(search.trim()));
    }
    return arr;
  }, [total, sortOrder, search, selectedRange, episodeRanges]);

  const toggleWatched = (n: number) => {
    setWatchedSet((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const scrollToTopEps = () => {
    if (episodeListTopRef.current) {
      episodeListTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottomEps = () => {
    if (episodeListBottomRef.current) {
      episodeListBottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      dir="rtl"
      className="flex-1 min-h-0 overflow-y-auto nova-ep-scroll select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 100 }}
    >
      {/* ── Compact Sticky Header (~52px height) ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between"
        style={{
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 9,
          paddingBottom: 9,
          gap: 8,
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
            style={{
              width: 36,
              height: 36,
              backgroundColor: colors.surfaceElevated,
              borderRadius: 11,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ChevronRight size={18} color={colors.textPrimary} />
          </button>

          <div className="flex-1 min-w-0">
            <div
              className="line-clamp-1"
              style={{
                fontSize: 13.5,
                fontWeight: 900,
                color: colors.textPrimary,
                textAlign: "right",
              }}
            >
              {anime.titleAr || anime.title}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span style={{ fontSize: 10, color: colors.textPrimary, fontWeight: 800 }}>
                الموسم {selectedSeason + 1} · {displayedEps.length} حلقة
              </span>
              <span style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: 700 }}>
                ({pct}% مكتمل)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Scroll Up / Down + Sort Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={scrollToTopEps}
            title="أعلى القائمة"
            aria-label="أعلى القائمة"
            className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.surfaceElevated,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ChevronUp size={15} color={colors.textSecondary} />
          </button>
          <button
            onClick={scrollToBottomEps}
            title="أسفل القائمة"
            aria-label="أسفل القائمة"
            className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.surfaceElevated,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ChevronDown size={15} color={colors.textSecondary} />
          </button>
          <button
            onClick={() =>
              setSortOrder((cur) => (cur === "asc" ? "desc" : "asc"))
            }
            className="flex items-center cursor-pointer active:scale-95 transition-transform"
            style={{
              height: 32,
              gap: 4,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 10,
              backgroundColor: colors.surfaceElevated,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ArrowUpDown size={13} color={colors.textPrimary} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: colors.textPrimary,
              }}
            >
              {sortOrder === "asc" ? "الأقدم" : "الأحدث"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Sleek Hero Banner + Progress Strip ── */}
      <div
        className="relative w-full flex flex-col justify-end overflow-hidden"
        style={{ height: 188 }}
      >
        <img
          src={anime.bannerImage || anime.coverImage}
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(9,9,11,0.22) 0%, rgba(9,9,11,0.75) 55%, #09090B 100%)",
          }}
        />

        {/* Cover + info + watch progress */}
        <div
          className="relative z-10 flex items-end"
          style={{
            gap: 13,
            paddingLeft: 14,
            paddingRight: 14,
            paddingBottom: 14,
          }}
        >
          <img
            src={anime.coverImage}
            alt={anime.title}
            style={{
              width: 66,
              height: 94,
              borderRadius: 13,
              border: "1.5px solid rgba(255,255,255,0.18)",
              objectFit: "cover",
              boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
            }}
          />
          <div className="flex-1 min-w-0" style={{ paddingBottom: 2 }}>
            <h1
              dir="ltr"
              className="m-0 line-clamp-1"
              style={{
                fontSize: 15.5,
                fontWeight: 900,
                color: "#fff",
                textAlign: "right",
              }}
            >
              {anime.title}
            </h1>
            <div
              className="flex items-center flex-wrap"
              style={{ gap: 6, marginTop: 6 }}
            >
              <span
                className="px-2 py-0.5 rounded-md"
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  backgroundColor: "rgba(255, 255, 255, 0.14)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  color: "#FFFFFF",
                }}
              >
                {total} حلقة
              </span>
              {watchedCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    backgroundColor: "rgba(16, 185, 129, 0.16)",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                    color: "#34D399",
                  }}
                >
                  تمت مشاهدة {watchedCount}
                </span>
              )}
              {anime.score > 0 && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                  }}
                >
                  <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                  {anime.score.toFixed(1)}
                </span>
              )}
            </div>

            {/* Watch Progress Bar */}
            <div style={{ marginTop: 9 }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.68)" }}>
                  تقدم المشاهدة
                </span>
                <span style={{ fontSize: 9.5, fontWeight: 900, color: "#FFFFFF" }}>
                  {watchedCount} / {total} ({pct}%)
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 99,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.max(pct, watchedCount > 0 ? 6 : 0)}%`,
                    height: "100%",
                    borderRadius: 99,
                    background: "linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Seasons + Search + Episode Range Chips ── */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        {/* Seasons section */}
        {seasons.length > 1 && (
          <div style={{ marginBottom: 10 }}>
            <div
              className="flex overflow-x-auto no-scrollbar"
              style={{ gap: 7, paddingBottom: 2 }}
            >
              {seasons.map((s, idx) => {
                const isActive = selectedSeason === idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSeason(idx);
                      setSelectedRange("all");
                    }}
                    className="flex items-center justify-between shrink-0 cursor-pointer transition-all"
                    style={{
                      gap: 8,
                      paddingLeft: 14,
                      paddingRight: 14,
                      paddingTop: 7,
                      paddingBottom: 7,
                      borderRadius: 20,
                      backgroundColor: isActive
                        ? colors.primary
                        : colors.surfaceElevated,
                      border: `1px solid ${
                        isActive ? colors.primary : colors.border
                      }`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: isActive ? "#FFFFFF" : colors.textPrimary,
                      }}
                    >
                      الموسم {idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: isActive ? "rgba(255,255,255,0.85)" : colors.textMuted,
                        fontWeight: 700,
                      }}
                    >
                      {s.count} حلقة
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar + Quick Watch Button */}
        <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
          <div
            className="flex-1 flex items-center"
            style={{
              gap: 8,
              backgroundColor: colors.input,
              borderRadius: 12,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Search size={14} color={colors.textMuted} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن رقم أو عنوان الحلقة..."
              className="flex-1 bg-transparent outline-none text-right"
              style={{
                color: colors.textPrimary,
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="cursor-pointer">
                <X size={15} color={colors.textMuted} />
              </button>
            )}
          </div>

          <button
            onClick={() =>
              onSelectEpisode(
                anime,
                watchedCount > 0 ? Math.min(total, watchedCount + 1) : 1
              )
            }
            className="flex items-center shrink-0 cursor-pointer active:scale-95 transition-transform"
            style={{
              gap: 6,
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 9,
              paddingBottom: 9,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #0EA5E9 0%, #0284C7 55%, #0369A1 100%)",
              border: "1px solid rgba(186, 230, 253, 0.35)",
              boxShadow: "0 6px 16px -4px rgba(2, 132, 199, 0.42)",
            }}
          >
            <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 900,
                color: "#FFFFFF",
              }}
            >
              {watchedCount > 0
                ? `متابعة ح ${watchedCount + 1}`
                : "ابدأ المشاهدة"}
            </span>
          </button>
        </div>

        {/* Episode Range Filter Chips (Styled like Dubbed Animation pill tabs) */}
        <div
          ref={episodeListTopRef}
          className="flex items-center overflow-x-auto no-scrollbar"
          style={{ gap: 8, paddingTop: 2 }}
        >
          {episodeRanges.map((range) => {
            const active = selectedRange === range.key;
            return (
              <button
                key={range.key}
                onClick={() => setSelectedRange(range.key)}
                className="shrink-0 cursor-pointer transition-all"
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 7,
                  paddingBottom: 7,
                  borderRadius: 20,
                  backgroundColor: active
                    ? colors.primary
                    : colors.surfaceElevated,
                  border: `1px solid ${
                    active ? colors.primary : colors.border
                  }`,
                }}
              >
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: active ? "#FFFFFF" : colors.textPrimary,
                  }}
                >
                  {range.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Separated Rounded Episode Cards (Matching Dubbed Animation / NovaAwDubbedDetailScreen) ── */}
      <div className="flex flex-col" style={{ paddingTop: 10 }}>
        {displayedEps.map((n) => {
          const watched = watchedSet.has(n);
          const epObj = anime.episodes.find((e) => e.number === n);
          const arabicTitle =
            epObj?.titleAr?.replace(/^الحلقة \d+:\s*/, "") ||
            (n === 1
              ? "بداية الرحلة واللقاء الحاسم"
              : n === 2
              ? "مواجهة القوة الخفية"
              : n === 3
              ? "قرار لا رجعة فيه"
              : `أحداث الحلقة ${n}`);
          const originalTitle = epObj?.title || `Episode ${n}`;
          const isFiller = n === 9;
          const commentCount = (n % 4) + 1;

          return (
            <div
              key={n}
              className="flex items-center nova-ep-row transition-colors"
              style={{
                gap: 12,
                marginLeft: 14,
                marginRight: 14,
                marginBottom: 8,
                padding: 10,
                borderRadius: 12,
                backgroundColor: watched
                  ? colors.surfaceElevated
                  : colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              {/* Main Pressable */}
              <div
                onClick={() => onSelectEpisode(anime, n)}
                className="flex-1 flex items-center cursor-pointer active:opacity-80 min-w-0"
                style={{ gap: 12 }}
              >
                {/* Episode Thumbnail (84x54, borderRadius: 9, matching Dubbed Animation) */}
                <div
                  className="relative shrink-0 overflow-hidden"
                  style={{
                    width: 84,
                    height: 54,
                    borderRadius: 9,
                    backgroundColor: "#141419",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <img
                    src={anime.bannerImage || anime.coverImage}
                    alt={`Ep ${n}`}
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.4)",
                    }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: watched
                          ? "rgba(16, 185, 129, 0.88)"
                          : "rgba(2, 132, 199, 0.88)",
                        border: "1px solid rgba(255,255,255,0.45)",
                      }}
                    >
                      {watched ? (
                        <Check size={11} color="#FFFFFF" />
                      ) : (
                        <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                      )}
                    </div>
                  </div>
                  <div
                    className="absolute"
                    style={{
                      bottom: 3,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.75)",
                      borderRadius: 4,
                      paddingLeft: 4,
                      paddingRight: 4,
                      paddingTop: 1,
                      paddingBottom: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        color: "#FFFFFF",
                      }}
                    >
                      {n}
                    </span>
                  </div>
                </div>

                {/* Episode Title & Meta */}
                <div className="flex-1 flex flex-col min-w-0" style={{ gap: 2 }}>
                  <div
                    className="flex items-center justify-start flex-wrap"
                    style={{ gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: colors.textPrimary,
                      }}
                    >
                      الحلقة {n}
                    </span>
                    {watched && (
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          fontSize: 8.5,
                          fontWeight: 800,
                          backgroundColor: "rgba(16, 185, 129, 0.14)",
                          color: "#10B981",
                        }}
                      >
                        مشاهدة
                      </span>
                    )}
                    {isFiller && (
                      <span
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.18)",
                          border: "1px solid rgba(239, 68, 68, 0.38)",
                          color: "#EF4444",
                          fontSize: 8.5,
                          paddingLeft: 6,
                          paddingRight: 6,
                          paddingTop: 1,
                          paddingBottom: 1,
                          borderRadius: 5,
                          fontWeight: 800,
                        }}
                      >
                        فلر
                      </span>
                    )}
                  </div>

                  {arabicTitle && (
                    <span
                      className="line-clamp-1"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: colors.textSecondary,
                        textAlign: "right",
                      }}
                    >
                      {arabicTitle}
                    </span>
                  )}

                  {originalTitle && (
                    <span
                      className="line-clamp-1"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: colors.textMuted,
                        textAlign: "right",
                      }}
                    >
                      {originalTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Episode Actions (commentBtn + eyeBtn) */}
              <div className="flex items-center shrink-0" style={{ gap: 7 }}>
                <button
                  onClick={() => onOpenComments(anime, n)}
                  aria-label={`تعليقات الحلقة ${n}`}
                  className="relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <MessageCircle
                    size={13}
                    color={colors.textPrimary}
                  />
                  {commentCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        minWidth: 14,
                        height: 14,
                        backgroundColor: colors.primary,
                        borderRadius: 7,
                        fontSize: 8,
                        color: "#FFFFFF",
                        fontWeight: 800,
                        textAlign: "center",
                        lineHeight: "14px",
                        paddingLeft: 3,
                        paddingRight: 3,
                      }}
                    >
                      {commentCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => toggleWatched(n)}
                  aria-label={
                    watched
                      ? `إلغاء مشاهدة الحلقة ${n}`
                      : `تحديد الحلقة ${n} كمشاهدة`
                  }
                  className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: watched
                      ? "rgba(16, 185, 129, 0.14)"
                      : colors.surfaceElevated,
                    border: `1px solid ${
                      watched ? "rgba(52, 211, 153, 0.35)" : colors.border
                    }`,
                  }}
                >
                  {watched ? (
                    <Eye size={13} color="#10B981" />
                  ) : (
                    <EyeOff size={13} color={colors.textMuted} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
        <div ref={episodeListBottomRef} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. WatchScreen (Modernized Server & Quality Picker + Download Servers)
      Includes:
      - "picker" screen (Server & Quality Picker + Download Servers section)
      - "loading" screen (Salawat + Poster + SpinRing)
      - "player" screen (RiftPlayer)
   ══════════════════════════════════════════════════════════════════════════ */
const WATCH_SERVERS_BY_QUALITY = [
  {
    qk: "1080p",
    dotColor: "#38bdf8",
    slots: [
      { site: "kawaii", tag: "KW", ready: true },
      { site: "megaplay", tag: "MP", ready: true },
      { site: "anineko", tag: "AN", ready: false },
      { site: "animewitcher", tag: "AW", ready: true },
      { site: "anslayer", tag: "AS", ready: true },
      { site: "sanime", tag: "SA", ready: false },
    ],
  },
  {
    qk: "720p",
    dotColor: "#34d399",
    slots: [
      { site: "megaplay", tag: "MP", ready: true },
      { site: "animewitcher", tag: "AW", ready: true },
      { site: "anslayer", tag: "AS", ready: false },
      { site: "sanime", tag: "SA", ready: true },
      { site: "anifox", tag: "FX", ready: false },
    ],
  },
  {
    qk: "480p",
    dotColor: "#94a3b8",
    slots: [
      { site: "megaplay", tag: "MP", ready: false },
      { site: "animewitcher", tag: "AW", ready: true },
      { site: "animeify", tag: "AF", ready: false },
    ],
  },
];

const DOWNLOAD_SLOTS = [
  { site: "animewitcher", tag: "AW", quality: "1080p" },
  { site: "sanime", tag: "SA", quality: "1080p" },
  { site: "anslayer", tag: "AS", quality: "720p" },
  { site: "anifox", tag: "FX", quality: "720p" },
];

const AW_DUBBED_SERVERS_BY_QUALITY = [
  {
    qk: "1080p",
    dotColor: "#38bdf8",
    slots: [
      { site: "aw-s1-1080", tag: "1", ready: true },
      { site: "aw-s2-1080", tag: "2", ready: true },
      { site: "aw-s3-1080", tag: "3", ready: false },
    ],
  },
  {
    qk: "720p",
    dotColor: "#34d399",
    slots: [
      { site: "aw-s1-720", tag: "1", ready: true },
      { site: "aw-s2-720", tag: "2", ready: true },
      { site: "aw-s3-720", tag: "3", ready: false },
    ],
  },
  {
    qk: "480p",
    dotColor: "#94a3b8",
    slots: [
      { site: "aw-s1-480", tag: "1", ready: true },
      { site: "aw-s2-480", tag: "2", ready: false },
    ],
  },
];

export function NovaWatchScreen({
  anime,
  episodeNumber,
  colors,
  mode = "anime",
  seasonLabel,
  autoStartPlayer = false,
  initialPositionSec = 0,
  onBack,
  onChangeEpisode,
  onTriggerDownload,
  onProgressUpdate,
}: {
  anime: Anime;
  episodeNumber: number;
  colors: ThemePalette;
  mode?: "anime" | "aw-dubbed";
  seasonLabel?: string;
  autoStartPlayer?: boolean;
  initialPositionSec?: number;
  onBack: () => void;
  onChangeEpisode: (ep: number) => void;
  onTriggerDownload: (anime: Anime, ep: number) => void;
  onProgressUpdate?: (positionSec: number, durationSec: number) => void;
}) {
  const [screen, setScreen] = useState<"picker" | "player">(
    autoStartPlayer ? "player" : "picker"
  );
  const [selectedServerKey, setSelectedServerKey] = useState<string>(
    mode === "aw-dubbed" ? "1080p-aw-s1-1080" : "1080p-kwik"
  );
  const [selectedServerLabel, setSelectedServerLabel] = useState<string>(
    mode === "aw-dubbed" ? "AW-1 · 1080P" : "KW · 1080P"
  );
  const [dlDoneSet, setDlDoneSet] = useState<Set<string>>(new Set());

  const serverQualityGroups =
    mode === "aw-dubbed"
      ? AW_DUBBED_SERVERS_BY_QUALITY
      : WATCH_SERVERS_BY_QUALITY;

  const handlePickServer = (site: string, qk: string, tag: string) => {
    setSelectedServerKey(`${qk}-${site}`);
    setSelectedServerLabel(`${tag} · ${qk.toUpperCase()}`);
    setScreen("player");
  };

  const canGoPrev = episodeNumber > 1;
  const canGoNext = episodeNumber < (anime.episodesCount || 12);

  /* ── Direct Video Player Screen (RiftPlayer — Opens immediately when clicking any server or download) ── */
  if (screen === "player") {
    const epObj = anime.episodes.find((e) => e.number === episodeNumber);
    const epVideoUrl =
      epObj?.videoUrl ||
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    const totalEpsCount = anime.episodesCount || anime.episodes.length || 12;
    const flatServers = serverQualityGroups
      .flatMap((qGroup) =>
        qGroup.slots
          .filter((slot) => slot.ready)
          .map((slot) => ({
            id: `${qGroup.qk}-${slot.site}`,
            label: `${slot.tag} · ${qGroup.qk.toUpperCase()}`,
            sublabel:
              slot.site.includes("kwik") || slot.site.includes("aw-s1")
                ? "بث HLS فائق السرعة · يوصى به"
                : "بث MP4 مباشر مستقر · يدعم الاستئناف",
            badge: slot.tag,
            site: slot.site,
            quality: qGroup.qk,
            videoUrl: epVideoUrl,
            type: epVideoUrl.includes(".m3u8") ? ("hls" as const) : ("mp4" as const),
          }))
      );

    return (
      <NovaInternalVideoPlayer
        title={anime.titleAr || anime.title}
        subtitle={`${seasonLabel ? `${seasonLabel} · ` : ""}الحلقة ${episodeNumber}`}
        poster={anime.bannerImage || anime.coverImage}
        videoUrl={epVideoUrl}
        episodeNumber={episodeNumber}
        totalEpisodes={totalEpsCount}
        episodes={anime.episodes.map((e) => ({
          number: e.number,
          title: e.titleAr || e.title || `الحلقة ${e.number}`,
          duration: e.duration || "24:00",
          thumbnail: e.thumbnail,
        }))}
        servers={flatServers}
        activeServerId={selectedServerKey}
        initialQuality={
          selectedServerKey.startsWith("1080p")
            ? "1080p FHD"
            : selectedServerKey.startsWith("480p")
            ? "480p SD"
            : "720p HD"
        }
        audioModeLabel={mode === "aw-dubbed" ? "مدبلج عربي" : "مترجم عربي"}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        initialPositionSec={initialPositionSec}
        anilistId={anime.id}
        onBack={() => {
          if (autoStartPlayer) {
            onBack();
          } else {
            setScreen("picker");
          }
        }}
        onOpenServerPicker={() => setScreen("picker")}
        onSelectServer={(srvId) => setSelectedServerKey(srvId)}
        onChangeEpisode={(epNum) => onChangeEpisode(epNum)}
        onProgressUpdate={onProgressUpdate}
      />
    );
  }

  /* ── Modernized Server & Download Picker Screen ── */
  return (
    <div
      dir="rtl"
      className="flex-1 relative flex flex-col overflow-y-auto no-scrollbar select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 56 }}
    >
      {/* Subtle atmospheric cover background */}
      <img
        src={anime.coverImage}
        alt=""
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.06, filter: "blur(20px)" }}
      />

      {/* ── Top Sticky Bar ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-3.5 py-2.5"
        style={{
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
        }}
      >
        <button
          onClick={onBack}
          aria-label="رجوع"
          className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: colors.surfaceElevated,
            border: `1px solid ${colors.border}`,
          }}
        >
          <ChevronRight size={18} color={colors.textPrimary} />
        </button>

        <div className="flex-1 flex flex-col items-center px-2 min-w-0">
          <span
            className="line-clamp-1"
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: colors.textPrimary,
            }}
          >
            {anime.titleAr || anime.title}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: colors.textSecondary,
            }}
          >
            {seasonLabel
              ? `${seasonLabel} · الحلقة ${episodeNumber}`
              : `الحلقة ${episodeNumber} · اختيار السيرفر`}
          </span>
        </div>

        {/* Episode Prev / Next Controls */}
        <div className="flex items-center gap-1.5">
          <button
            disabled={!canGoPrev}
            onClick={() => canGoPrev && onChangeEpisode(episodeNumber - 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95 transition-transform"
            style={{
              backgroundColor: colors.surfaceElevated,
              border: `1px solid ${colors.border}`,
              opacity: canGoPrev ? 1 : 0.3,
            }}
          >
            <ChevronRight size={12} color={colors.textSecondary} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: colors.textSecondary,
              }}
            >
              السابقة
            </span>
          </button>

          <button
            disabled={!canGoNext}
            onClick={() => canGoNext && onChangeEpisode(episodeNumber + 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95 transition-transform"
            style={{
              backgroundColor: colors.primary,
              border: `1px solid ${colors.primary}`,
              opacity: canGoNext ? 1 : 0.3,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              التالية
            </span>
            <ChevronLeft size={12} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* ── Scroll Content ── */}
      <div className="relative z-10 p-3.5 flex flex-col gap-4">
        {/* Episode Overview Banner Card */}
        <div
          className="flex items-center justify-between gap-3 p-3.5"
          style={{
            borderRadius: 18,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={anime.coverImage}
              alt={anime.title}
              style={{
                width: 58,
                height: 82,
                borderRadius: 12,
                objectFit: "cover",
                border: `1px solid ${colors.border}`,
              }}
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <span
                className="line-clamp-1"
                style={{
                  fontSize: 14.5,
                  fontWeight: 900,
                  color: colors.textPrimary,
                }}
              >
                {anime.titleAr || anime.title}
              </span>
              <div className="flex items-center flex-wrap gap-1.5">
                <div
                  className="flex items-center gap-1 px-2.5 py-1"
                  style={{
                    borderRadius: 999,
                    backgroundColor: colors.accentSurface,
                    border: `1px solid ${colors.accentBorder}`,
                  }}
                >
                  <PlayCircle size={11} color={colors.textPrimary} />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: colors.textPrimary,
                    }}
                  >
                    {seasonLabel
                      ? `${seasonLabel} · الحلقة ${episodeNumber}`
                      : `الحلقة ${episodeNumber}`}
                  </span>
                </div>
                <span
                  className="px-2.5 py-1"
                  style={{
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 800,
                    backgroundColor: "rgba(16, 185, 129, 0.14)",
                    color: "#10B981",
                  }}
                >
                  مترجم عربي
                </span>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  color: colors.textMuted,
                  fontWeight: 600,
                }}
              >
                اضغط على أي سيرفر بالأسفل لفتح مشغل الفيديو فوراً
              </span>
            </div>
          </div>
        </div>

        {/* ── Quality Sections & Vertical Watch Server List ── */}
        {serverQualityGroups.map((qGroup) => {
          const qualityBadgeLabel =
            qGroup.qk === "1080p"
              ? "Full HD"
              : qGroup.qk === "720p"
              ? "HD عالية"
              : "SD متوسطة";
          return (
            <div
              key={qGroup.qk}
              className="flex flex-col gap-2.5 p-3.5"
              style={{
                borderRadius: 18,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              {/* Quality Tier Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="shrink-0"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: "#10B981",
                      boxShadow: "0 0 8px rgba(16,185,129,0.5)",
                    }}
                  />
                  <span
                    className="whitespace-nowrap"
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: colors.textPrimary,
                    }}
                  >
                    سيرفرات المشاهدة · {qGroup.qk.replace("p", "P")}
                  </span>
                  <span
                    className="px-2 py-0.5 whitespace-nowrap shrink-0"
                    style={{
                      borderRadius: 999,
                      fontSize: 9.5,
                      fontWeight: 800,
                      backgroundColor: colors.accentSurface,
                      color: colors.textPrimary,
                    }}
                  >
                    {qualityBadgeLabel}
                  </span>
                </div>
                <span
                  className="whitespace-nowrap shrink-0"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: colors.textMuted,
                  }}
                >
                  {qGroup.slots.length} سيرفرات
                </span>
              </div>

              {/* Vertical Single-Column Watch Servers List */}
              <div className="flex flex-col gap-2">
                {qGroup.slots.map((slot, sIdx) => {
                  const serverKey = `${qGroup.qk}-${slot.site}`;
                  const isSelected = selectedServerKey === serverKey;
                  return (
                    <button
                      key={serverKey}
                      onClick={() =>
                        handlePickServer(slot.site, qGroup.qk, slot.tag)
                      }
                      className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer active:scale-[0.99] transition-all text-right"
                      style={{
                        borderRadius: 16,
                        backgroundColor: isSelected
                          ? colors.surfaceElevated
                          : slot.ready
                          ? colors.surfaceElevated
                          : colors.surface,
                        border: `1.5px solid ${
                          isSelected
                            ? colors.textPrimary
                            : colors.border
                        }`,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Sleek Circular Signal & Stream Orb */}
                        <div
                          className="relative flex items-center justify-center shrink-0"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 999,
                            background: isSelected
                              ? "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)"
                              : slot.ready
                              ? colors.accentSurface
                              : "rgba(148, 163, 184, 0.08)",
                            border: `1.5px solid ${
                              isSelected
                                ? "rgba(255,255,255,0.4)"
                                : colors.border
                            }`,
                          }}
                        >
                          <PlayCircle
                            size={18}
                            color={
                              isSelected
                                ? "#FFFFFF"
                                : colors.textPrimary
                            }
                          />
                          <span
                            style={{
                              position: "absolute",
                              bottom: 1,
                              right: 1,
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              backgroundColor: slot.ready
                                ? "#34D399"
                                : "#64748B",
                              border: `1.5px solid ${colors.card}`,
                            }}
                          />
                        </div>

                        <div className="flex flex-col min-w-0 gap-0.5 overflow-hidden">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span
                              className="whitespace-nowrap shrink-0"
                              style={{
                                fontSize: 12.5,
                                fontWeight: 900,
                                color: colors.textPrimary,
                              }}
                            >
                              سيرفر {slot.tag}
                            </span>
                            <span
                              className="whitespace-nowrap shrink-0"
                              style={{
                                paddingLeft: 6,
                                paddingRight: 6,
                                paddingTop: 1.5,
                                paddingBottom: 1.5,
                                borderRadius: 999,
                                fontSize: 8.5,
                                fontWeight: 800,
                                backgroundColor: isSelected
                                  ? colors.accentSurface
                                  : slot.ready
                                  ? "rgba(16, 185, 129, 0.14)"
                                  : "rgba(148, 163, 184, 0.12)",
                                color: isSelected
                                  ? colors.textPrimary
                                  : slot.ready
                                  ? "#10B981"
                                  : colors.textMuted,
                              }}
                            >
                              {isSelected
                                ? "مختار ✓"
                                : slot.ready
                                ? sIdx === 0
                                  ? "موصى به"
                                  : "متاح"
                                : "احتياطي"}
                            </span>
                          </div>
                          <span
                            className="line-clamp-1"
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: colors.textMuted,
                            }}
                          >
                            {slot.ready
                              ? `بث فوري بدقة ${qGroup.qk.replace(
                                  "p",
                                  "P"
                                )} بدون تقطيع`
                              : `بث بديل مستقر بدقة ${qGroup.qk.replace(
                                  "p",
                                  "P"
                                )}`}
                          </span>
                        </div>
                      </div>

                      {/* Capsule Action Pill on Left */}
                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        style={{
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 6,
                          paddingBottom: 6,
                          borderRadius: 999,
                          background: isSelected
                            ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                            : slot.ready
                            ? "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)"
                            : colors.input,
                          border:
                            isSelected || slot.ready
                              ? "1px solid rgba(255, 255, 255, 0.28)"
                              : `1px solid ${colors.border}`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 900,
                            color:
                              isSelected || slot.ready
                                ? "#FFFFFF"
                                : colors.textSecondary,
                          }}
                        >
                          تشغيل مباشر
                        </span>
                        <Play
                          size={10}
                          color={
                            isSelected || slot.ready
                              ? "#FFFFFF"
                              : colors.textSecondary
                          }
                          fill={
                            isSelected || slot.ready ? "#FFFFFF" : "none"
                          }
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Direct Download Servers Card (2-Column Grid) ── */}
        <div
          className="flex flex-col gap-3 p-3.5"
          style={{
            borderRadius: 18,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: colors.accentSurface,
                  border: `1px solid ${colors.accentBorder}`,
                }}
              >
                <Download size={16} color={colors.textPrimary} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: colors.textPrimary,
                    textAlign: "right",
                  }}
                >
                  سيرفرات التحميل المباشر
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    color: colors.textMuted,
                    fontWeight: 600,
                    textAlign: "right",
                  }}
                >
                  روابط سريعة للمشاهدة بدون إنترنت
                </div>
              </div>
            </div>
            <span
              className="px-2 py-0.5 rounded-md"
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                backgroundColor: "rgba(16, 185, 129, 0.14)",
                color: "#10B981",
              }}
            >
              MP4 مباشر
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DOWNLOAD_SLOTS.map((slot) => {
              const key = `${slot.site}:${slot.quality}`;
              const isDone = dlDoneSet.has(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (!isDone) {
                      setDlDoneSet((prev) => new Set(prev).add(key));
                      onTriggerDownload(anime, episodeNumber);
                    }
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer active:scale-[0.98] transition-all text-right"
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    border: `1px solid ${
                      isDone
                        ? "rgba(52, 211, 153, 0.38)"
                        : colors.border
                    }`,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        backgroundColor: colors.accentSurface,
                        border: `1px solid ${colors.accentBorder}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 900,
                          color: colors.textPrimary,
                        }}
                      >
                        {slot.tag}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: colors.textPrimary,
                        }}
                      >
                        سيرفر {slot.tag}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: colors.textMuted,
                        }}
                      >
                        جودة {slot.quality.replace("p", "P")}
                      </span>
                    </div>
                  </div>

                  {isDone ? (
                    <CheckCircle2 size={18} color="#10B981" />
                  ) : (
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        backgroundColor: colors.primary,
                      }}
                    >
                      <Download size={13} color="#FFFFFF" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. CommentsPage — Modernized Community Discussions & Nested Replies
   ══════════════════════════════════════════════════════════════════════════ */
interface NovaReplyItem {
  id: string;
  username: string;
  badge: string;
  badgeColor: string;
  avatarBg: string;
  time: string;
  replyToUser?: string;
  text: string;
  likes: number;
  liked: boolean;
  isOwn?: boolean;
}

interface NovaCommentThread {
  id: string;
  username: string;
  badge: string;
  badgeColor: string;
  avatarBg: string;
  time: string;
  episodeTag: string;
  text: string;
  isSpoiler?: boolean;
  likes: number;
  liked: boolean;
  pinned?: boolean;
  isOwn?: boolean;
  replies: NovaReplyItem[];
}

export function NovaCommentsScreen({
  anime,
  episodeNumber,
  colors,
  onBack,
}: {
  anime: Anime;
  episodeNumber?: number;
  colors: ThemePalette;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const [sortBy, setSortBy] = useState<"top" | "newest" | "replies">("top");
  const [markAsSpoiler, setMarkAsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(
    new Set()
  );
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(
    new Set(["c0-own", "c1", "c2"])
  );
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string;
    username: string;
  } | null>(null);
  const [activeReaction, setActiveReaction] = useState<string | null>("fire");
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    fire: 148,
    mindblown: 94,
    masterpiece: 112,
    emotional: 43,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  const epLabel = episodeNumber ? `الحلقة ${episodeNumber}` : "مناقشة عامة";

  const [comments, setComments] = useState<NovaCommentThread[]>([
    {
      id: "c0-own",
      username: "أنت · عضو NOVA",
      badge: "تعليقك",
      badgeColor: "#38BDF8",
      avatarBg: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
      time: "منذ 10 دقائق",
      episodeTag: epLabel,
      text: "هذه الحلقة فاقت كل التوقعات! الإخراج الصوتي والتحريك في اللحظة الحاسمة كان خيالياً بمعنى الكلمة 🔥💙",
      likes: 18,
      liked: true,
      isOwn: true,
      replies: [
        {
          id: "r0-1",
          username: "فيصل الشمري",
          badge: "عضو نشط",
          badgeColor: "#34D399",
          avatarBg: "linear-gradient(135deg, #059669 0%, #065F46 100%)",
          time: "منذ 5 دقائق",
          replyToUser: "أنت · عضو NOVA",
          text: "أتفق معك تماماً! أفضل حلقة في الموسم حتى الآن بدون منازع 👏",
          likes: 7,
          liked: true,
        },
      ],
    },
    {
      id: "c1",
      username: "أحمد الأنصاري",
      badge: "عضو مميز",
      badgeColor: "#38BDF8",
      avatarBg: "linear-gradient(135deg, #0284C7 0%, #1E3A8A 100%)",
      time: "منذ ساعتين",
      episodeTag: epLabel,
      text: "حلقة أسطورية بكل المقاييس! التحريك والموسيقى التصويرية في المشهد الأخير كانت تحفة بصرية لا توصف، الاستوديو تفوق على نفسه هذا الموسم 🔥⚡",
      likes: 64,
      liked: true,
      pinned: true,
      replies: [
        {
          id: "r1-1",
          username: "ريان الحربي",
          badge: "متابع مخضرم",
          badgeColor: "#34D399",
          avatarBg: "linear-gradient(135deg, #059669 0%, #065F46 100%)",
          time: "منذ ساعة",
          replyToUser: "أحمد الأنصاري",
          text: "أتفق معك 100%! خصوصاً الدقيقة 18 لما تغيرت زوايا الكاميرا مع دخول الأوست الجديد، قشعريرة!",
          likes: 19,
          liked: true,
        },
        {
          id: "r1-2",
          username: "أنت · عضو NOVA",
          badge: "ردك",
          badgeColor: "#38BDF8",
          avatarBg: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
          time: "منذ 25 دقيقة",
          replyToUser: "ريان الحربي",
          text: "المخرج المسؤول عن هذه الحلقة هو نفسه مخرج الحلقة الختامية للموسم الأول، عشان كذا الإخراج كان سينمائي 💙",
          likes: 11,
          liked: true,
          isOwn: true,
        },
      ],
    },
    {
      id: "c2",
      username: "سارة محمد",
      badge: "ناقدة أنمي",
      badgeColor: "#F43F5E",
      avatarBg: "linear-gradient(135deg, #E11D48 0%, #881337 100%)",
      time: "منذ 4 ساعات",
      episodeTag: epLabel,
      text: "بناء الأحداث وتطور شخصية البطل في هذه الحلقة عبقري جداً. أعجبني كيف لم يتسرع الكاتب في كشف القوة الكاملة وترك مجالاً للغموض في الحلقات القادمة ✨",
      likes: 38,
      liked: false,
      replies: [
        {
          id: "r2-1",
          username: "خالد العتيبي",
          badge: "قارئ المانجا",
          badgeColor: "#38BDF8",
          avatarBg: "linear-gradient(135deg, #0369A1 0%, #0F172A 100%)",
          time: "منذ 3 ساعات",
          replyToUser: "سارة محمد",
          text: "بدون أي حرق، الحلقات الثلاث القادمة راح تقلب موازين القصة بالكامل! استعدوا لأقوى آرك في العمل 🔥",
          likes: 14,
          liked: false,
        },
      ],
    },
    {
      id: "c3",
      username: "Kaito_99",
      badge: "قارئ المانجا",
      badgeColor: "#38BDF8",
      avatarBg: "linear-gradient(135deg, #334155 0%, #0F172A 100%)",
      time: "منذ 7 ساعات",
      episodeTag: epLabel,
      isSpoiler: true,
      text: "ظهور الشخصية المقنعة في نهاية الحلقة بعد شارة النهاية هو التمهيد المباشر للمواجهة الكبرى ضد القائد الأعلى في الحلقة القادمة!",
      likes: 27,
      liked: false,
      replies: [],
    },
    {
      id: "c4",
      username: "عمر الدوسري",
      badge: "عضو نشط",
      badgeColor: "#34D399",
      avatarBg: "linear-gradient(135deg, #0D9488 0%, #115E59 100%)",
      time: "منذ يوم",
      episodeTag: epLabel,
      text: "أفضل تطبيق لمشاهدة الأنمي بجودة فائقة وبدون أي تقطيع، شكراً لفريق Anime NOVA على الترجمة الاحترافية وسرعة رفع الحلقات 👏💙",
      likes: 45,
      liked: true,
      replies: [],
    },
  ]);

  const totalRepliesCount = useMemo(
    () => comments.reduce((acc, c) => acc + c.replies.length, 0),
    [comments]
  );

  const sortedComments = useMemo(() => {
    const copy = [...comments];
    if (sortBy === "top") {
      return copy.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.isOwn && !b.isOwn) return -1;
        if (!a.isOwn && b.isOwn) return 1;
        return b.likes - a.likes;
      });
    }
    if (sortBy === "replies") {
      return copy.sort((a, b) => b.replies.length - a.replies.length);
    }
    return copy;
  }, [comments, sortBy]);

  const handleToggleThread = (commentId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleStartReply = (commentId: string, username: string) => {
    setReplyTarget({ commentId, username });
    setExpandedThreads((prev) => new Set(prev).add(commentId));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    if (replyTarget?.commentId === commentId) {
      setReplyTarget(null);
    }
  };

  const handleDeleteReply = (commentId: string, replyId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
          : c
      )
    );
  };

  const handleHideSpoiler = (commentId: string) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    let currentProfileName = "أنت · عضو NOVA";
    let currentUsernameBadge = "تعليقك";
    try {
      const rawUser = localStorage.getItem("nova_google_user_v1");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.name) currentProfileName = parsed.name;
        if (parsed?.username) currentUsernameBadge = parsed.username;
      }
    } catch {}

    if (replyTarget) {
      const newReply: NovaReplyItem = {
        id: `r-${Date.now()}`,
        username: currentProfileName,
        badge: currentUsernameBadge,
        badgeColor: "#38BDF8",
        avatarBg: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
        time: "الآن",
        replyToUser: replyTarget.username,
        text: trimmed,
        likes: 1,
        liked: true,
        isOwn: true,
      };
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyTarget.commentId
            ? { ...c, replies: [...c.replies, newReply] }
            : c
        )
      );
      setExpandedThreads((prev) => new Set(prev).add(replyTarget.commentId));
      setReplyTarget(null);
      setText("");
      return;
    }

    const commentId = `c-${Date.now()}`;
    const newComment: NovaCommentThread = {
      id: commentId,
      username: currentProfileName,
      badge: currentUsernameBadge,
      badgeColor: "#38BDF8",
      avatarBg: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
      time: "الآن",
      episodeTag: epLabel,
      text: trimmed,
      isSpoiler: markAsSpoiler,
      likes: 1,
      liked: true,
      isOwn: true,
      replies: [],
    };
    setComments((prev) => [newComment, ...prev]);

    try {
      const rawHistory = localStorage.getItem("nova_user_comments_v1");
      const existingHistory = rawHistory ? JSON.parse(rawHistory) : [];
      const historyEntry = {
        id: commentId,
        animeId: anime.id,
        animeTitle: anime.titleAr || anime.title,
        animePoster: anime.coverImage,
        episodeNumber: episodeNumber || 1,
        episodeTag: epLabel,
        text: trimmed,
        time: "الآن",
        likes: 1,
        isSpoiler: markAsSpoiler,
      };
      localStorage.setItem(
        "nova_user_comments_v1",
        JSON.stringify([historyEntry, ...existingHistory])
      );
    } catch {}

    setText("");
    setMarkAsSpoiler(false);
  };

  const handleToggleReaction = (key: string) => {
    setReactionCounts((prev) => {
      const next = { ...prev };
      if (activeReaction === key) {
        next[key] = Math.max(0, (next[key] || 1) - 1);
        setActiveReaction(null);
      } else {
        if (activeReaction && next[activeReaction]) {
          next[activeReaction] = Math.max(0, next[activeReaction] - 1);
        }
        next[key] = (next[key] || 0) + 1;
        setActiveReaction(key);
      }
      return next;
    });
  };

  const REACTIONS = [
    { key: "fire", emoji: "🔥", label: "أسطورية" },
    { key: "masterpiece", emoji: "⚡", label: "تحريك خيالي" },
    { key: "mindblown", emoji: "🤯", label: "أحداث صادمة" },
    { key: "emotional", emoji: "💙", label: "مؤثرة جداً" },
  ];

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col select-none relative overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {/* Subtle Ambient Backdrop */}
      <img
        src={anime.bannerImage || anime.coverImage}
        alt=""
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.05, filter: "blur(24px)" }}
      />

      {/* ── Top Sticky Glass Header ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-3.5 py-2.5 shrink-0"
        style={{
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: colors.surfaceElevated,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ChevronRight size={18} color={colors.textPrimary} />
          </button>

          <img
            src={anime.coverImage}
            alt={anime.title}
            style={{
              width: 34,
              height: 46,
              borderRadius: 8,
              objectFit: "cover",
              border: `1px solid ${colors.border}`,
            }}
          />

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="line-clamp-1"
                style={{
                  fontSize: 13.5,
                  fontWeight: 900,
                  color: colors.textPrimary,
                }}
              >
                {anime.titleAr || anime.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#38BDF8",
                }}
              >
                {epLabel}
              </span>
              <span style={{ fontSize: 10, color: colors.textMuted }}>•</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: colors.textMuted,
                }}
              >
                {comments.length} تعليق و {totalRepliesCount} رد
              </span>
            </div>
          </div>
        </div>

        {/* Community Live Badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 shrink-0"
          style={{
            borderRadius: 999,
            backgroundColor: "rgba(14, 165, 233, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.28)",
          }}
        >
          <MessageCircle size={12} color="#38BDF8" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#38BDF8",
            }}
          >
            مجتمع NOVA
          </span>
        </div>
      </div>

      {/* ── Scrollable Discussion Feed ── */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3.5 flex flex-col gap-3.5 relative z-10">
        {/* Episode Quick Reactions Card */}
        <div
          className="p-3 flex flex-col gap-2.5"
          style={{
            borderRadius: 18,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: colors.textPrimary,
              }}
            >
              تفاعل الأعضاء مع {epLabel}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: colors.textMuted,
              }}
            >
              اختر انطباعك السريع
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {REACTIONS.map((r) => {
              const active = activeReaction === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => handleToggleReaction(r.key)}
                  className="flex flex-col items-center justify-center py-2 px-1.5 cursor-pointer active:scale-95 transition-all"
                  style={{
                    borderRadius: 12,
                    backgroundColor: active
                      ? "rgba(14, 165, 233, 0.16)"
                      : colors.surfaceElevated,
                    border: `1px solid ${
                      active ? "rgba(56, 189, 248, 0.45)" : colors.border
                    }`,
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span style={{ fontSize: 13 }}>{r.emoji}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 900,
                        color: active ? "#38BDF8" : colors.textPrimary,
                      }}
                    >
                      {reactionCounts[r.key] || 0}
                    </span>
                  </div>
                  <span
                    className="line-clamp-1 mt-0.5"
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: active ? "#E0F2FE" : colors.textMuted,
                    }}
                  >
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort & Filter Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {[
              { id: "top" as const, label: "الأعلى تفاعلاً" },
              { id: "newest" as const, label: "الأحدث" },
              { id: "replies" as const, label: "الأكثر ردوداً" },
            ].map((tab) => {
              const active = sortBy === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSortBy(tab.id)}
                  className="px-3 py-1.5 cursor-pointer transition-all"
                  style={{
                    borderRadius: 999,
                    backgroundColor: active
                      ? "rgba(14, 165, 233, 0.16)"
                      : colors.card,
                    border: `1px solid ${
                      active ? "rgba(56, 189, 248, 0.4)" : colors.border
                    }`,
                    color: active ? "#38BDF8" : colors.textSecondary,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: colors.textMuted,
            }}
          >
            {comments.length + totalRepliesCount} مشاركة
          </span>
        </div>

        {/* ── Comments & Nested Replies List ── */}
        <div className="flex flex-col gap-3">
          {sortedComments.map((c) => {
            const spoilerHidden =
              c.isSpoiler && !revealedSpoilers.has(c.id);
            const isExpanded = expandedThreads.has(c.id);

            return (
              <div
                key={c.id}
                className="flex flex-col p-3.5 transition-all"
                style={{
                  borderRadius: 18,
                  backgroundColor: colors.card,
                  border: `1px solid ${
                    c.pinned
                      ? "rgba(56, 189, 248, 0.32)"
                      : colors.border
                  }`,
                }}
              >
                {/* Pinned Indicator */}
                {c.pinned && (
                  <div
                    className="flex items-center gap-1.5 mb-2.5 pb-2"
                    style={{
                      borderBottom: `1px dashed ${colors.border}`,
                    }}
                  >
                    <Sparkles size={12} color="#38BDF8" />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#38BDF8",
                      }}
                    >
                      تعليق مثبت · أبرز مناقشة في الحلقة
                    </span>
                  </div>
                )}

                {/* Comment Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        background: c.avatarBg,
                        border: "1.5px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: 900,
                          color: "#FFFFFF",
                        }}
                      >
                        {c.username[0]}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: colors.textPrimary,
                          }}
                        >
                          {c.username}
                        </span>
                        <span
                          style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 1.5,
                            paddingBottom: 1.5,
                            borderRadius: 999,
                            fontSize: 9.5,
                            fontWeight: 800,
                            backgroundColor: `${c.badgeColor}18`,
                            color: c.badgeColor,
                            border: `1px solid ${c.badgeColor}35`,
                          }}
                        >
                          {c.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          style={{
                            fontSize: 10.5,
                            color: colors.textMuted,
                            fontWeight: 600,
                          }}
                        >
                          {c.time}
                        </span>
                        <span style={{ fontSize: 9, color: colors.textMuted }}>
                          •
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: colors.textSecondary,
                          }}
                        >
                          {c.episodeTag}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Own Comment Button */}
                  {(c.isOwn || c.username.includes("أنت")) && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      aria-label="حذف تعليقك"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-all shrink-0"
                      style={{
                        backgroundColor: "rgba(244, 63, 94, 0.12)",
                        border: "1px solid rgba(244, 63, 94, 0.32)",
                      }}
                    >
                      <Trash2 size={13} color="#FB7185" />
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: "#FDA4AF",
                        }}
                      >
                        حذف تعليقك
                      </span>
                    </button>
                  )}
                </div>

                {/* Comment Body or Spoiler Shield (with Re-Close Spoiler Button when revealed) */}
                <div className="mt-2.5">
                  {spoilerHidden ? (
                    <button
                      onClick={() =>
                        setRevealedSpoilers((prev) => new Set(prev).add(c.id))
                      }
                      className="w-full flex items-center justify-between p-3.5 rounded-xl cursor-pointer active:scale-[0.99] transition-all"
                      style={{
                        backgroundColor: "rgba(244, 63, 94, 0.08)",
                        border: "1px dashed rgba(244, 63, 94, 0.38)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <EyeOff size={16} color="#FB7185" />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#FDA4AF",
                          }}
                        >
                          تنبيه: هذا التعليق يحتوي على حرق للأحداث
                        </span>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full shrink-0"
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          backgroundColor: "rgba(244, 63, 94, 0.22)",
                          color: "#FFE4E6",
                        }}
                      >
                        إظهار التعليق
                      </span>
                    </button>
                  ) : c.isSpoiler ? (
                    <div
                      className="flex flex-col gap-2.5 p-3 rounded-xl"
                      style={{
                        backgroundColor: "rgba(244, 63, 94, 0.06)",
                        border: "1px solid rgba(244, 63, 94, 0.26)",
                      }}
                    >
                      <div
                        className="flex items-center justify-between gap-2 pb-2"
                        style={{
                          borderBottom: "1px dashed rgba(244, 63, 94, 0.22)",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Eye size={14} color="#FB7185" />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#FDA4AF",
                            }}
                          >
                            محتوى حرق مكشوف
                          </span>
                        </div>
                        <button
                          onClick={() => handleHideSpoiler(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer active:scale-95 transition-transform"
                          style={{
                            backgroundColor: "rgba(244, 63, 94, 0.2)",
                            border: "1px solid rgba(244, 63, 94, 0.42)",
                          }}
                        >
                          <EyeOff size={12.5} color="#FFE4E6" />
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              color: "#FFE4E6",
                            }}
                          >
                            إغلاق الحرق
                          </span>
                        </button>
                      </div>
                      <p
                        className="m-0"
                        style={{
                          fontSize: 13,
                          color: colors.textPrimary,
                          lineHeight: "22px",
                          fontWeight: 600,
                        }}
                      >
                        {c.text}
                      </p>
                    </div>
                  ) : (
                    <p
                      className="m-0"
                      style={{
                        fontSize: 13,
                        color: colors.textPrimary,
                        lineHeight: "22px",
                        fontWeight: 600,
                      }}
                    >
                      {c.text}
                    </p>
                  )}
                </div>

                {/* Comment Action Row: Like + Enlarged Reply Button + Toggle Replies */}
                <div
                  className="flex items-center justify-between mt-3 pt-2.5"
                  style={{ borderTop: `1px solid ${colors.border}` }}
                >
                  <div className="flex items-center gap-2">
                    {/* Like Button */}
                    <button
                      onClick={() =>
                        setComments((prev) =>
                          prev.map((item) =>
                            item.id === c.id
                              ? {
                                  ...item,
                                  liked: !item.liked,
                                  likes: item.liked
                                    ? item.likes - 1
                                    : item.likes + 1,
                                }
                              : item
                          )
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer active:scale-95 transition-transform"
                      style={{
                        backgroundColor: c.liked
                          ? "rgba(244, 63, 94, 0.14)"
                          : colors.surfaceElevated,
                        border: `1px solid ${
                          c.liked ? "rgba(244, 63, 94, 0.35)" : colors.border
                        }`,
                      }}
                    >
                      <Heart
                        size={13.5}
                        color={c.liked ? "#FB7185" : colors.textSecondary}
                        fill={c.liked ? "#FB7185" : "transparent"}
                      />
                      <span
                        style={{
                          fontSize: 11.5,
                          color: c.liked ? "#FDA4AF" : colors.textSecondary,
                          fontWeight: 800,
                        }}
                      >
                        {c.likes}
                      </span>
                    </button>

                    {/* Enlarged Direct Reply Button */}
                    <button
                      onClick={() => handleStartReply(c.id, c.username)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full cursor-pointer active:scale-95 transition-transform"
                      style={{
                        backgroundColor:
                          replyTarget?.commentId === c.id
                            ? "rgba(14, 165, 233, 0.22)"
                            : "rgba(14, 165, 233, 0.10)",
                        border: `1px solid ${
                          replyTarget?.commentId === c.id
                            ? "rgba(56, 189, 248, 0.55)"
                            : "rgba(56, 189, 248, 0.28)"
                        }`,
                      }}
                    >
                      <MessageCircle size={14} color="#38BDF8" />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: "#38BDF8",
                        }}
                      >
                        رد على التعليق
                      </span>
                    </button>
                  </div>

                  {/* Expand / Collapse Replies Button */}
                  {c.replies.length > 0 && (
                    <button
                      onClick={() => handleToggleThread(c.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer"
                      style={{
                        backgroundColor: "rgba(14, 165, 233, 0.10)",
                        border: "1px solid rgba(56, 189, 248, 0.22)",
                        color: "#38BDF8",
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}
                    >
                      <span>
                        {isExpanded
                          ? `إخفاء الردود (${c.replies.length})`
                          : `عرض الردود (${c.replies.length})`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={14} color="#38BDF8" />
                      ) : (
                        <ChevronDown size={14} color="#38BDF8" />
                      )}
                    </button>
                  )}
                </div>

                {/* ── Enlarged Nested Replies Thread ── */}
                {c.replies.length > 0 && isExpanded && (
                  <div
                    className="mt-3.5 pr-3.5 mr-1 flex flex-col gap-3"
                    style={{
                      borderRight: "3px solid rgba(56, 189, 248, 0.42)",
                    }}
                  >
                    {c.replies.map((reply) => {
                      const isOwnReply =
                        reply.isOwn || reply.username.includes("أنت");
                      return (
                        <div
                          key={reply.id}
                          className="p-3.5 rounded-2xl flex flex-col gap-2.5"
                          style={{
                            backgroundColor: colors.surfaceElevated,
                            border: `1px solid ${
                              isOwnReply
                                ? "rgba(56, 189, 248, 0.35)"
                                : colors.border
                            }`,
                            boxShadow: "0 6px 16px -6px rgba(0, 0, 0, 0.4)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="flex items-center justify-center shrink-0"
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 999,
                                  background: reply.avatarBg,
                                  border: "1.5px solid rgba(255,255,255,0.2)",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13.5,
                                    fontWeight: 900,
                                    color: "#FFFFFF",
                                  }}
                                >
                                  {reply.username[0]}
                                </span>
                              </div>

                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 900,
                                      color: colors.textPrimary,
                                    }}
                                  >
                                    {reply.username}
                                  </span>
                                  <span
                                    style={{
                                      paddingLeft: 8,
                                      paddingRight: 8,
                                      paddingTop: 2,
                                      paddingBottom: 2,
                                      borderRadius: 999,
                                      fontSize: 9.5,
                                      fontWeight: 800,
                                      backgroundColor: `${reply.badgeColor}18`,
                                      color: reply.badgeColor,
                                      border: `1px solid ${reply.badgeColor}35`,
                                    }}
                                  >
                                    {reply.badge}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    color: colors.textMuted,
                                    marginTop: 1,
                                  }}
                                >
                                  {reply.time}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Like Reply Button */}
                              <button
                                onClick={() =>
                                  setComments((prev) =>
                                    prev.map((item) =>
                                      item.id === c.id
                                        ? {
                                            ...item,
                                            replies: item.replies.map((r) =>
                                              r.id === reply.id
                                                ? {
                                                    ...r,
                                                    liked: !r.liked,
                                                    likes: r.liked
                                                      ? r.likes - 1
                                                      : r.likes + 1,
                                                  }
                                                : r
                                            ),
                                          }
                                        : item
                                    )
                                  )
                                }
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer active:scale-95 transition-transform"
                                style={{
                                  backgroundColor: reply.liked
                                    ? "rgba(244, 63, 94, 0.14)"
                                    : colors.card,
                                  border: `1px solid ${
                                    reply.liked
                                      ? "rgba(244, 63, 94, 0.32)"
                                      : colors.border
                                  }`,
                                }}
                              >
                                <Heart
                                  size={12.5}
                                  color={
                                    reply.liked ? "#FB7185" : colors.textMuted
                                  }
                                  fill={reply.liked ? "#FB7185" : "transparent"}
                                />
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: reply.liked
                                      ? "#FDA4AF"
                                      : colors.textMuted,
                                  }}
                                >
                                  {reply.likes}
                                </span>
                              </button>

                              {/* Reply to Reply Button */}
                              <button
                                onClick={() =>
                                  handleStartReply(c.id, reply.username)
                                }
                                className="flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer active:scale-95 transition-transform"
                                style={{
                                  backgroundColor: "rgba(14, 165, 233, 0.12)",
                                  border: "1px solid rgba(56, 189, 248, 0.28)",
                                  fontSize: 11.5,
                                  fontWeight: 900,
                                  color: "#38BDF8",
                                }}
                              >
                                <MessageCircle size={12} color="#38BDF8" />
                                <span>رد</span>
                              </button>

                              {/* Delete Own Reply Button */}
                              {isOwnReply && (
                                <button
                                  onClick={() =>
                                    handleDeleteReply(c.id, reply.id)
                                  }
                                  aria-label="حذف ردك"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer active:scale-95 transition-transform"
                                  style={{
                                    backgroundColor: "rgba(244, 63, 94, 0.14)",
                                    border: "1px solid rgba(244, 63, 94, 0.35)",
                                  }}
                                >
                                  <Trash2 size={12} color="#FB7185" />
                                  <span
                                    style={{
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      color: "#FDA4AF",
                                    }}
                                  >
                                    حذف
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          <p
                            className="m-0"
                            style={{
                              fontSize: 13.5,
                              color: colors.textPrimary,
                              lineHeight: "23px",
                              fontWeight: 700,
                            }}
                          >
                            {reply.replyToUser && (
                              <span
                                style={{
                                  color: "#38BDF8",
                                  fontWeight: 900,
                                  marginLeft: 6,
                                  fontSize: 13,
                                }}
                              >
                                @{reply.replyToUser}
                              </span>
                            )}
                            {reply.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Sticky Composer with Active Reply Banner & Quick Emojis ── */}
      <div
        className="shrink-0 z-20 flex flex-col gap-2 px-3.5 py-2.5"
        style={{
          backgroundColor: colors.surface,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        {/* Active Reply Banner */}
        {replyTarget && (
          <div
            className="flex items-center justify-between px-3 py-1.5 rounded-xl"
            style={{
              backgroundColor: "rgba(14, 165, 233, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <MessageCircle size={13} color="#38BDF8" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#E0F2FE",
                }}
              >
                الرد على{" "}
                <span style={{ color: "#38BDF8" }}>
                  @{replyTarget.username}
                </span>
              </span>
            </div>
            <button
              onClick={() => setReplyTarget(null)}
              aria-label="إلغاء الرد"
              className="flex items-center justify-center p-1 rounded-full cursor-pointer"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <X size={12} color={colors.textPrimary} />
            </button>
          </div>
        )}

        {/* Quick Emoji Bar + Spoiler Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {["🔥", "⚡", "💙", "👏", "🤩", "🐐"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setText((prev) => `${prev} ${emoji}`.trimStart())}
                className="px-2 py-0.5 rounded-full cursor-pointer active:scale-95 transition-transform"
                style={{
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  fontSize: 12,
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {!replyTarget && (
            <button
              onClick={() => setMarkAsSpoiler((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer"
              style={{
                backgroundColor: markAsSpoiler
                  ? "rgba(244, 63, 94, 0.18)"
                  : colors.surfaceElevated,
                border: `1px solid ${
                  markAsSpoiler ? "rgba(244, 63, 94, 0.45)" : colors.border
                }`,
              }}
            >
              {markAsSpoiler ? (
                <EyeOff size={11} color="#FB7185" />
              ) : (
                <Eye size={11} color={colors.textMuted} />
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: markAsSpoiler ? "#FDA4AF" : colors.textMuted,
                }}
              >
                {markAsSpoiler ? "تفعيل تنبيه الحرق" : "حرق؟"}
              </span>
            </button>
          )}
        </div>

        {/* Input & Send Button */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              replyTarget
                ? `اكتب ردك على ${replyTarget.username}...`
                : "شارك رأيك حول الحلقة أو ناقش مع الأعضاء..."
            }
            className="flex-1 px-4 py-2.5 rounded-full outline-none text-right"
            style={{
              backgroundColor: colors.input,
              border: `1px solid ${
                replyTarget ? "rgba(56, 189, 248, 0.4)" : colors.border
              }`,
              color: colors.textPrimary,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          />
          <button
            onClick={handleSend}
            aria-label="إرسال التعليق"
            className="flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-all"
            style={{
              height: 42,
              paddingLeft: 15,
              paddingRight: 15,
              borderRadius: 14,
              background: text.trim()
                ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                : colors.surfaceElevated,
              border: text.trim()
                ? "1px solid rgba(253, 230, 138, 0.45)"
                : `1px solid ${colors.border}`,
              boxShadow: text.trim()
                ? "0 6px 16px -4px rgba(245, 158, 11, 0.45)"
                : "none",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: text.trim() ? "#090D16" : colors.textPrimary,
              }}
            >
              إرسال
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              style={{ transform: "scaleX(-1)" }}
            >
              <path
                d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"
                fill={text.trim() ? "#090D16" : colors.textPrimary}
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   5. ScheduleScreen (1:1 from artifacts/nova-mobile/app/schedule.tsx)
   ══════════════════════════════════════════════════════════════════════════ */
const AR_DAYS = [
  { id: 0, label: "الأحد" },
  { id: 1, label: "الإثنين" },
  { id: 2, label: "الثلاثاء" },
  { id: 3, label: "الأربعاء" },
  { id: 4, label: "الخميس" },
  { id: 5, label: "الجمعة" },
  { id: 6, label: "السبت" },
];

export function NovaScheduleScreen({
  animeList,
  colors,
  onBack,
  onOpenDetails,
  onPlayEpisode,
}: {
  animeList: Anime[];
  colors: ThemePalette;
  onBack: () => void;
  onOpenDetails: (anime: Anime) => void;
  onPlayEpisode: (anime: Anime, episodeNumber?: number) => void;
}) {
  const { width: vpWidth, tv: tvMode } = useTvMetrics();
  const todayDay = useMemo(() => new Date().getDay(), []);
  const [mainTab, setMainTab] = useState<"schedule" | "latest">("schedule");
  const [selectedDay, setSelectedDay] = useState<number>(todayDay);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ScheduleStatusFilter>("all");
  const [sortBy, setSortBy] = useState<ScheduleSortBy>("time");
  const [reminders, setReminders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("nova_schedule_reminders_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleReminder = (entryId: string) => {
    setReminders((prev) => {
      const next = prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId];
      try {
        localStorage.setItem(
          "nova_schedule_reminders_v1",
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
  };

  const fullSchedule = useMemo(
    () => buildWeeklySchedule(animeList),
    [animeList]
  );

  const stats = useMemo(
    () => getScheduleStats(fullSchedule, todayDay),
    [fullSchedule, todayDay]
  );

  const visibleEntries = useMemo(() => {
    if (mainTab === "latest") {
      return filterAndSortSchedule(fullSchedule, {
        selectedDay: -1,
        searchQuery,
        statusFilter: "all",
        sortBy: "score",
      });
    }
    return filterAndSortSchedule(fullSchedule, {
      selectedDay,
      searchQuery,
      statusFilter,
      sortBy,
    });
  }, [fullSchedule, mainTab, selectedDay, searchQuery, statusFilter, sortBy]);

  const gridCols = tvMode ? 3 : vpWidth >= 760 ? 2 : 1;

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 40 }}
    >
      {/* Top Sticky Broadcast Navigation & Filter Header */}
      <div
        className="sticky top-0 z-20 shrink-0 px-4 pt-3.5 pb-3"
        style={{
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              aria-label="رجوع"
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <ChevronRight size={18} color={colors.textPrimary} />
            </button>
            <div
              className="flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(14,165,233,0.22), rgba(139,92,246,0.22))",
                border: "1px solid rgba(56,189,248,0.35)",
              }}
            >
              <Calendar size={18} color="#38BDF8" />
            </div>
            <div>
              <h1
                className="m-0"
                style={{
                  fontSize: 16.5,
                  fontWeight: 900,
                  color: colors.textPrimary,
                }}
              >
                جدول البث الأسبوعي
              </h1>
              <p
                className="m-0"
                style={{ fontSize: 11, color: colors.textMuted }}
              >
                مواعيد عرض الحلقات المترجمة بتوقيتك المحلي · تحديث مباشر
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setSortBy((prev) => (prev === "time" ? "score" : "time"))
            }
            aria-label={
              sortBy === "time" ? "ترتيب حسب التقييم" : "ترتيب حسب وقت البث"
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            <ArrowUpDown size={13} color="#38BDF8" />
            <span>{sortBy === "time" ? "حسب الوقت" : "الأعلى تقييماً"}</span>
          </button>
        </div>

        {/* Main View Switcher: Weekly Schedule vs Latest Added Episodes */}
        <div className="flex gap-2">
          <button
            onClick={() => setMainTab("schedule")}
            className="flex-1 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2"
            style={{
              backgroundColor:
                mainTab === "schedule"
                  ? "rgba(14,165,233,0.18)"
                  : colors.card,
              border: `1px solid ${
                mainTab === "schedule" ? "#0EA5E9" : colors.border
              }`,
              color: mainTab === "schedule" ? "#38BDF8" : colors.textMuted,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            <Calendar size={14} />
            <span>جدول أيام الأسبوع ({stats.totalWeeklyEpisodes})</span>
          </button>
          <button
            onClick={() => setMainTab("latest")}
            className="flex-1 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2"
            style={{
              backgroundColor:
                mainTab === "latest"
                  ? "rgba(139,92,246,0.22)"
                  : colors.card,
              border: `1px solid ${
                mainTab === "latest" ? "#8B5CF6" : colors.border
              }`,
              color: mainTab === "latest" ? "#C4B5FD" : colors.textMuted,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            <Sparkles size={14} />
            <span>أحدث الحلقات المضافة</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <div
            className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Search size={14} color={colors.textMuted} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أنمي أو استوديو في جدول البث..."
              aria-label="ابحث عن أنمي في جدول البث"
              className="flex-1 bg-transparent border-0 outline-none text-right"
              style={{
                color: colors.textPrimary,
                fontSize: 11.5,
                fontWeight: 700,
              }}
            />
            {searchQuery.trim().length > 0 && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="مسح البحث"
                className="cursor-pointer flex items-center justify-center"
              >
                <X size={13} color={colors.textMuted} />
              </button>
            )}
          </div>

          {mainTab === "schedule" && (
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "all", label: "الكل" },
                  { id: "upcoming", label: "يُبث قريباً" },
                  { id: "aired", label: "مكتمل اليوم" },
                ] as { id: ScheduleStatusFilter; label: string }[]
              ).map((f) => {
                const active = statusFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className="px-2.5 py-2 rounded-xl cursor-pointer"
                    style={{
                      backgroundColor: active
                        ? "rgba(56,189,248,0.16)"
                        : colors.card,
                      border: `1px solid ${
                        active ? "rgba(56,189,248,0.45)" : colors.border
                      }`,
                      color: active ? "#38BDF8" : colors.textMuted,
                      fontSize: 10.5,
                      fontWeight: 800,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 7-Day Selector Bar + All Week Option */}
        {mainTab === "schedule" && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-0.5">
            <button
              onClick={() => setSelectedDay(-1)}
              className="shrink-0 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5"
              style={{
                backgroundColor:
                  selectedDay === -1 ? colors.primary : colors.card,
                border: `1px solid ${
                  selectedDay === -1 ? colors.primary : colors.border
                }`,
                color: selectedDay === -1 ? "#FFFFFF" : colors.textMuted,
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              <span>كل الأسبوع</span>
              <span
                style={{
                  fontSize: 10,
                  opacity: selectedDay === -1 ? 0.95 : 0.7,
                }}
              >
                ({stats.totalWeeklyEpisodes})
              </span>
            </button>

            {AR_SCHEDULE_DAYS.map((d) => {
              const active = selectedDay === d.id;
              const isToday = d.id === todayDay;
              const count = stats.dayCounts[d.id] || 0;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDay(d.id)}
                  className="shrink-0 px-3.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                  style={{
                    backgroundColor: active
                      ? colors.primary
                      : isToday
                      ? "rgba(14,165,233,0.12)"
                      : colors.card,
                    border: `1px solid ${
                      active
                        ? colors.primary
                        : isToday
                        ? "rgba(56,189,248,0.4)"
                        : colors.border
                    }`,
                    color: active
                      ? "#FFFFFF"
                      : isToday
                      ? "#38BDF8"
                      : colors.textMuted,
                    fontSize: 11.5,
                    fontWeight: 800,
                  }}
                >
                  <span>{d.label}</span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 900,
                        color: active ? "#E0F2FE" : "#38BDF8",
                      }}
                    >
                      • اليوم
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      opacity: active ? 0.95 : 0.7,
                    }}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Broadcast Summary Hero Banner */}
      {stats.nextHighlight && (
        <div className="px-4 pt-4">
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(14,165,233,0.16) 0%, rgba(139,92,246,0.16) 60%, rgba(15,23,42,0.92) 100%)",
              border: "1px solid rgba(56,189,248,0.28)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={
                    stats.nextHighlight.anime.coverImage ||
                    stats.nextHighlight.anime.cover
                  }
                  alt={stats.nextHighlight.anime.titleAr}
                  style={{
                    width: 56,
                    height: 78,
                    borderRadius: 12,
                    objectFit: "cover",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                />
                <div className="min-w-0">
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: "#38BDF8",
                    }}
                  >
                    ● بث اليوم ({getDayLabelAr(todayDay)}) ·{" "}
                    {stats.todayCount} حلقات مجدولة · { reminders.length } تذكيرات نشطة
                  </div>
                  <div
                    className="truncate mt-0.5"
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: colors.textPrimary,
                    }}
                  >
                    {stats.nextHighlight.anime.titleAr ||
                      stats.nextHighlight.anime.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: colors.textSecondary,
                      fontWeight: 700,
                    }}
                  >
                    الحلقة {stats.nextHighlight.episodeNumber} · الساعة{" "}
                    {stats.nextHighlight.airTimeLabelAr} ·{" "}
                    {stats.nextHighlight.studio}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onPlayEpisode(
                      stats.nextHighlight!.anime,
                      stats.nextHighlight!.episodeNumber
                    )
                  }
                  className="px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
                  style={{
                    backgroundColor: "#0EA5E9",
                    color: "#FFFFFF",
                    fontSize: 11.5,
                    fontWeight: 900,
                  }}
                >
                  <Play size={13} fill="#FFFFFF" />
                  <span>مشاهدة الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Day Section Header */}
      <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 900,
            color: colors.textPrimary,
          }}
        >
          {mainTab === "latest"
            ? "⚡ أحدث الحلقات المضافة مؤخراً"
            : selectedDay === -1
            ? "📅 جدول البث الكامل لجميع أيام الأسبوع"
            : `📅 عروض يوم ${getDayLabelAr(selectedDay)}${
                selectedDay === todayDay ? " (اليوم)" : ""
              }`}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
          }}
        >
          {visibleEntries.length} حلقة متاحة
        </div>
      </div>

      {/* Schedule Cards Responsive Grid */}
      {visibleEntries.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
          <Calendar size={34} color={colors.textMuted} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: colors.textPrimary,
            }}
          >
            لا توجد حلقات مطابقة لخيارات التصفية الحالية
          </div>
          <div style={{ fontSize: 11.5, color: colors.textMuted }}>
            جرّب اختيار يوم آخر أو عرض كل الأسبوع
          </div>
          <button
            onClick={() => {
              setSelectedDay(-1);
              setStatusFilter("all");
              setSearchQuery("");
            }}
            className="mt-2 px-4 py-2 rounded-xl cursor-pointer"
            style={{
              backgroundColor: colors.primary,
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            إظهار جدول الأسبوع بالكامل
          </button>
        </div>
      ) : (
        <div
          className="p-4 grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          }}
        >
          {visibleEntries.map((entry) => {
            const isReminded = reminders.includes(entry.id);
            const statusColor =
              entry.slotStatus === "live"
                ? "#10B981"
                : entry.slotStatus === "upcoming"
                ? "#38BDF8"
                : "#A78BFA";

            return (
              <div
                key={entry.id}
                className="flex flex-col justify-between p-3 rounded-2xl transition-transform"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${
                    isReminded ? "rgba(56,189,248,0.45)" : colors.border
                  }`,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Poster with Episode Overlay */}
                  <div
                    onClick={() => onOpenDetails(entry.anime)}
                    className="relative shrink-0 cursor-pointer overflow-hidden"
                    style={{
                      width: 74,
                      height: 104,
                      borderRadius: 12,
                    }}
                  >
                    <img
                      src={entry.anime.coverImage || entry.anime.cover}
                      alt={entry.anime.titleAr || entry.anime.title}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1gX3iwfIsLu.png";
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: "rgba(9, 13, 22, 0.88)",
                        color: "#FFFFFF",
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      حلقة {entry.episodeNumber}
                    </div>
                  </div>

                  {/* Episode Broadcast Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: statusColor,
                        }}
                      >
                        ● {entry.dayLabel} · {entry.countdownLabelAr}
                      </span>
                      <span
                        className="flex items-center gap-1"
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: colors.textSecondary,
                        }}
                      >
                        <Clock size={11} color="#38BDF8" />
                        {entry.airTimeLabelAr}
                      </span>
                    </div>

                    <div
                      onClick={() => onOpenDetails(entry.anime)}
                      className="truncate cursor-pointer"
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: colors.textPrimary,
                      }}
                    >
                      {entry.anime.titleAr || entry.anime.title}
                    </div>

                    <div
                      className="truncate"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#A78BFA",
                      }}
                    >
                      {entry.episodeTitleAr}
                    </div>

                    {/* Clean dot-separated metadata line (Zero-Pill discipline) */}
                    <div
                      className="truncate mt-0.5"
                      style={{
                        fontSize: 10.5,
                        color: colors.textMuted,
                        fontWeight: 600,
                      }}
                    >
                      {entry.studio} · {entry.genreLabelAr} ·{" "}
                      {entry.formatLabel} · ★ {entry.anime.score} ·{" "}
                      {entry.qualityBadge}
                    </div>
                  </div>
                </div>

                {/* Action Row: Watch Episode, Toggle Reminder, Details */}
                <div
                  className="flex items-center justify-between gap-2 mt-3 pt-2.5"
                  style={{ borderTop: `1px solid ${colors.border}` }}
                >
                  <button
                    onClick={() =>
                      onPlayEpisode(entry.anime, entry.episodeNumber)
                    }
                    className="flex-1 py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: "rgba(14,165,233,0.16)",
                      border: "1px solid rgba(56,189,248,0.38)",
                      color: "#38BDF8",
                      fontSize: 11.5,
                      fontWeight: 800,
                    }}
                  >
                    <Play size={13} fill="#38BDF8" />
                    <span>مشاهدة الحلقة {entry.episodeNumber}</span>
                  </button>

                  <button
                    onClick={() => toggleReminder(entry.id)}
                    aria-label={`تذكير عرض ${
                      entry.anime.titleAr || entry.anime.title
                    }`}
                    className="py-2 px-3 rounded-xl cursor-pointer flex items-center gap-1"
                    style={{
                      backgroundColor: isReminded
                        ? "rgba(16,185,129,0.16)"
                        : colors.surface,
                      border: `1px solid ${
                        isReminded ? "rgba(16,185,129,0.45)" : colors.border
                      }`,
                      color: isReminded ? "#34D399" : colors.textSecondary,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    <Bell size={13} />
                    <span>{isReminded ? "مُفعّل" : "تذكير"}</span>
                  </button>

                  <button
                    onClick={() => onOpenDetails(entry.anime)}
                    className="py-2 px-3 rounded-xl cursor-pointer"
                    style={{
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    التفاصيل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. SettingsScreen (1:1 from artifacts/nova-mobile/app/settings.tsx)
   ══════════════════════════════════════════════════════════════════════════ */
interface NovaUserCommentRecord {
  id: string;
  animeId: string;
  animeTitle: string;
  animePoster: string;
  episodeNumber: number;
  episodeTag: string;
  text: string;
  time: string;
  likes: number;
  isSpoiler?: boolean;
}

const DEFAULT_USER_COMMENTS: NovaUserCommentRecord[] = [
  {
    id: "uc-sl-7",
    animeId: "solo-leveling",
    animeTitle: "سولو ليفلينغ (الارتقاء المنفرد)",
    animePoster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
    episodeNumber: 7,
    episodeTag: "الحلقة 7",
    text: "تحريك استوديو A-1 Pictures في مشهد استدعاء الظلال تخطى كل التوقعات! أفضل حلقة في الموسم بلا منازع 🔥",
    time: "منذ ساعتين",
    likes: 42,
  },
  {
    id: "uc-opm-3",
    animeId: "one-punch-man",
    animeTitle: "ون بنش مان",
    animePoster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg",
    episodeNumber: 3,
    episodeTag: "الحلقة 3",
    text: "مشهد قتال سايتاما ضد جينوس في التدريب لا يُمل منه أبداً حتى بعد إعادته عشرات المرات ⚡",
    time: "أمس",
    likes: 29,
  },
  {
    id: "uc-jjk-12",
    animeId: "jujutsu-kaisen",
    animeTitle: "جوجوتسو كايسن",
    animePoster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
    episodeNumber: 12,
    episodeTag: "الحلقة 12",
    text: "إخراج حادثة شيبويا والموسيقى التصويرية في هذه الحلقة تحفة بصرية خالدة.",
    time: "قبل 3 أيام",
    likes: 64,
  },
];

const CURATED_ANIME_AVATARS: { id: string; label: string; url: string }[] = [
  {
    id: "jinwoo",
    label: "سونغ جين-وو",
    url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
  },
  {
    id: "gojo",
    label: "غوجو ساتورو",
    url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
  },
  {
    id: "saitama",
    label: "سايتاما",
    url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg",
  },
  {
    id: "frieren",
    label: "فريرين",
    url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg",
  },
  {
    id: "tanjiro",
    label: "تانجيرو",
    url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTc93blC.jpg",
  },
  {
    id: "luffy",
    label: "لوفي جير 5",
    url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
  },
  {
    id: "eren",
    label: "إيرين ييغر",
    url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg",
  },
  {
    id: "ichigo",
    label: "إيتشيغو",
    url: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/114446-DTd4xfGx7DJB.jpg",
  },
];

export function NovaSettingsScreen({
  theme,
  colors,
  animeList = [],
  favorites = [],
  watchHistoryCount,
  favoritesCount,
  onSetTheme,
  onBack,
  onClearHistory,
  onReplaySplash,
  onOpenTelegramModal,
  onOpenKotlinExporter,
  onOpenTvLink,
  onToggleFav,
  onOpenDetails,
  onOpenComments,
}: {
  theme: ThemeName;
  colors: ThemePalette;
  animeList?: Anime[];
  favorites?: string[];
  watchHistoryCount: number;
  favoritesCount: number;
  onSetTheme: (t: ThemeName) => void;
  onBack: () => void;
  onClearHistory: () => void;
  onReplaySplash: () => void;
  onOpenTelegramModal: () => void;
  onOpenKotlinExporter: () => void;
  onOpenTvLink: () => void;
  onToggleFav?: (anime: Anime) => void;
  onOpenDetails?: (anime: Anime) => void;
  onOpenComments?: (anime: Anime, epNum?: number) => void;
}) {
  const { tv: tvMode } = useTvMetrics();
  const [notifs, setNotifs] = useState(true);
  const [showPremium, setShowPremium] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showTvLink, setShowTvLink] = useState(false);
  const [linkCode, setLinkCode] = useState("849201");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [otherModalInfo, setOtherModalInfo] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const [googleUser, setGoogleUser] = useState<{
    name: string;
    username: string;
    email: string;
    avatar: string;
    syncedAt: string;
  } | null>(() => {
    try {
      const raw = localStorage.getItem("nova_google_user_v1");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || "Ali Anime NOVA",
        username:
          parsed.username ||
          `@${(parsed.email || "ali_nova").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_")}`,
        email: parsed.email || "ali0117078153@gmail.com",
        avatar:
          parsed.avatar ||
          "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
        syncedAt: parsed.syncedAt || "الآن · متصل سحابياً",
      };
    } catch {
      return null;
    }
  });

  // Dedicated Full-Page Account Management Screen state (opens when user clicks 'إدارة الحساب')
  const [showAccountHub, setShowAccountHub] = useState<boolean>(false);
  const [accountTab, setAccountTab] = useState<
    "edit" | "avatar" | "favorites" | "comments"
  >("edit");
  const [profileNameDraft, setProfileNameDraft] = useState<string>(
    googleUser?.name || "Ali Anime NOVA"
  );
  const [profileUsernameDraft, setProfileUsernameDraft] = useState<string>(
    googleUser?.username || "@ali_nova"
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (googleUser) {
      setProfileNameDraft(googleUser.name);
      setProfileUsernameDraft(googleUser.username || "@ali_nova");
    }
  }, [googleUser]);

  // User Comments History (persisted in localStorage)
  const [userComments, setUserComments] = useState<NovaUserCommentRecord[]>(
    () => {
      try {
        const raw = localStorage.getItem("nova_user_comments_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return DEFAULT_USER_COMMENTS;
    }
  );
  const [quickCommentText, setQuickCommentText] = useState("");
  const [quickCommentAnimeId, setQuickCommentAnimeId] = useState(
    animeList[0]?.id || "solo-leveling"
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        "nova_user_comments_v1",
        JSON.stringify(userComments)
      );
    } catch {}
  }, [userComments]);

  // Support App State (under Nova Premium)
  const [supportCount, setSupportCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("nova_support_count_v1") || "3") || 3;
    } catch {
      return 3;
    }
  });
  const [adWatchProgress, setAdWatchProgress] = useState<number | null>(null);
  const [selectedSupportTier, setSelectedSupportTier] = useState<string>("");

  const favoriteAnimeItems = useMemo(() => {
    if (!animeList.length) return [];
    return animeList.filter((a) => favorites.includes(a.id));
  }, [animeList, favorites]);

  const persistGoogleUser = (nextUser: {
    name: string;
    username: string;
    email: string;
    avatar: string;
    syncedAt: string;
  }) => {
    setGoogleUser(nextUser);
    try {
      localStorage.setItem("nova_google_user_v1", JSON.stringify(nextUser));
      window.dispatchEvent(new Event("nova-profile-updated"));
    } catch {}
  };

  const handleGoogleSignIn = (account: {
    name: string;
    username?: string;
    email: string;
    avatar: string;
  }) => {
    const cleanHandle = account.username
      ? account.username.startsWith("@")
        ? account.username
        : `@${account.username}`
      : `@${account.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_")}`;
    const payload = {
      name: account.name,
      username: cleanHandle,
      email: account.email,
      avatar: account.avatar,
      syncedAt: "الآن · متصل سحابياً",
    };
    persistGoogleUser(payload);
    setShowAccountHub(true);
    setShowAuth(false);
    showToast(`تم تسجيل الدخول بحساب Google (${account.email})`);
  };

  const handleGoogleSignOut = () => {
    setGoogleUser(null);
    try {
      localStorage.removeItem("nova_google_user_v1");
      window.dispatchEvent(new Event("nova-profile-updated"));
    } catch {
      // ignore
    }
    setShowAuth(false);
    showToast("تم تسجيل الخروج من حساب Google");
  };

  const handleSaveProfileIdentity = () => {
    if (!googleUser) return;
    const cleanName = profileNameDraft.trim() || googleUser.name;
    const rawUser = profileUsernameDraft.trim().replace(/\s+/g, "_");
    const cleanUsername = rawUser
      ? rawUser.startsWith("@")
        ? rawUser
        : `@${rawUser}`
      : googleUser.username;
    const updated = {
      ...googleUser,
      name: cleanName,
      username: cleanUsername,
      syncedAt: "الآن · تم تحديث الملف الشخصي",
    };
    persistGoogleUser(updated);
    showToast(`تم حفظ اسم المستخدم (${cleanName}) واليوزر (${cleanUsername})`);
  };

  const handleSelectAvatar = (avatarUrl: string, label?: string) => {
    if (!googleUser) return;
    const updated = {
      ...googleUser,
      avatar: avatarUrl,
      syncedAt: "الآن · تم تحديث صورة البروفايل",
    };
    persistGoogleUser(updated);
    showToast(
      label
        ? `تم تغيير صورة البروفايل إلى ${label}`
        : "تم تحديث صورة البروفايل بنجاح"
    );
  };

  const handleFileAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !googleUser) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleSelectAvatar(reader.result, "صورة من جهازك");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddQuickComment = () => {
    const trimmed = quickCommentText.trim();
    if (!trimmed) return;
    const targetAnime =
      animeList.find((a) => a.id === quickCommentAnimeId) || animeList[0];
    const newEntry: NovaUserCommentRecord = {
      id: `uc-${Date.now()}`,
      animeId: targetAnime?.id || "solo-leveling",
      animeTitle: targetAnime?.titleAr || targetAnime?.title || "سولو ليفلينغ",
      animePoster:
        targetAnime?.coverImage ||
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      episodeNumber: 1,
      episodeTag: "الحلقة 1",
      text: trimmed,
      time: "الآن",
      likes: 1,
    };
    setUserComments((prev) => [newEntry, ...prev]);
    setQuickCommentText("");
    showToast("تمت إضافة تعليقك إلى سجل تعليقات الحساب");
  };

  const handleDeleteUserComment = (commentId: string) => {
    setUserComments((prev) => prev.filter((c) => c.id !== commentId));
    showToast("تم حذف التعليق من سجل تعليقاتك");
  };

  const handleStartFreeRewardSupport = () => {
    if (adWatchProgress !== null) return;
    setAdWatchProgress(20);
    const interval = setInterval(() => {
      setAdWatchProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return null;
        }
        const next = prev + 25;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setAdWatchProgress(null);
            setSupportCount((c) => {
              const updated = c + 1;
              try {
                localStorage.setItem("nova_support_count_v1", String(updated));
              } catch {}
              return updated;
            });
            showToast(
              "شكراً لدعمك! مساهمتك تساعد في استمرار Anime NOVA مجاناً ❤️"
            );
          }, 300);
          return 100;
        }
        return next;
      });
    }, 450);
  };

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 2600);
  };

  /* ── DEDICATED FULL-PAGE ACCOUNT MANAGEMENT SCREEN (صفحة إدارة الحساب الكاملة) ── */
  if (showAccountHub && googleUser) {
    return (
      <div
        dir="rtl"
        data-testid="account-management-fullpage"
        className="flex-1 min-h-0 overflow-y-auto nova-ep-scroll select-none"
        style={{ backgroundColor: colors.background, paddingBottom: 60 }}
      >
        {toastMsg && (
          <div
            className="fixed top-4 left-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl"
            style={{
              backgroundColor: "rgba(12, 24, 20, 0.96)",
              border: "1px solid rgba(52, 211, 153, 0.45)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.65)",
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                backgroundColor: "rgba(16, 185, 129, 0.22)",
              }}
            >
              <Check size={14} color="#34D399" />
            </div>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: "#F8FAFC",
              }}
            >
              {toastMsg}
            </span>
          </div>
        )}

        {/* Dedicated Sticky Header for Full-Page Account Management */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between"
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="account-page-back-btn"
              onClick={() => setShowAccountHub(false)}
              aria-label="رجوع للإعدادات"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <ChevronRight size={19} color={colors.textPrimary} />
            </button>
            <div>
              <h1
                className="m-0"
                style={{
                  fontSize: 16.5,
                  fontWeight: 900,
                  color: colors.textPrimary,
                }}
              >
                إدارة الحساب
              </h1>
              <p
                className="m-0"
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: colors.textMuted,
                }}
              >
                تعديل اليوزر · صورة البروفايل · المفضلة · سجل تعليقاتك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAccountHub(false)}
            className="px-3 py-1.5 rounded-xl cursor-pointer"
            style={{
              backgroundColor: colors.input,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            رجوع للإعدادات
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Account Summary Banner */}
          <div
            className="p-4 rounded-2xl flex items-center justify-between gap-3"
            style={{
              background:
                theme === "white"
                  ? colors.card
                  : "linear-gradient(145deg, #171926 0%, #0F111A 100%)",
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="overflow-hidden shrink-0"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  border: "2px solid rgba(52, 211, 153, 0.8)",
                }}
              >
                <img
                  src={googleUser.avatar}
                  alt={googleUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="line-clamp-1"
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: colors.textPrimary,
                    }}
                  >
                    {googleUser.name}
                  </span>
                  <span
                    dir="ltr"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      paddingLeft: 7,
                      paddingRight: 7,
                      paddingTop: 1.5,
                      paddingBottom: 1.5,
                      borderRadius: 999,
                      backgroundColor: "rgba(56, 189, 248, 0.15)",
                      border: "1px solid rgba(56, 189, 248, 0.35)",
                      color: "#38BDF8",
                    }}
                  >
                    {googleUser.username}
                  </span>
                </div>
                <div
                  dir="ltr"
                  className="truncate mt-0.5 text-right"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: colors.textSecondary,
                  }}
                >
                  {googleUser.email}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleGoogleSignOut();
                setShowAccountHub(false);
              }}
              className="px-3 py-2 rounded-xl cursor-pointer shrink-0"
              style={{
                backgroundColor: "rgba(244, 63, 94, 0.14)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "#FDA4AF",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              تسجيل الخروج
            </button>
          </div>

          {/* 4 Interactive Account Sub-Tabs */}
          <div
            data-testid="internal-account-settings"
            className="flex flex-col gap-3.5"
          >
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  id: "edit" as const,
                  label: "اليوزر والاسم",
                },
                {
                  id: "avatar" as const,
                  label: "صورة البروفايل",
                },
                {
                  id: "favorites" as const,
                  label: `المفضلة (${favoriteAnimeItems.length})`,
                },
                {
                  id: "comments" as const,
                  label: `تعليقاتك (${userComments.length})`,
                },
              ].map((tab) => {
                const active = accountTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`account-tab-${tab.id}`}
                    onClick={() => setAccountTab(tab.id)}
                    className="py-2.5 px-2 rounded-xl cursor-pointer transition-all text-center"
                    style={{
                      backgroundColor: active
                        ? "rgba(14, 165, 233, 0.18)"
                        : colors.card,
                      border: active
                        ? "1.5px solid rgba(56, 189, 248, 0.65)"
                        : `1px solid ${colors.border}`,
                      color: active ? "#38BDF8" : colors.textSecondary,
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: تغيير اليوزر واسم المستخدم */}
            {accountTab === "edit" && (
              <div
                data-testid="account-panel-edit"
                className="p-4 rounded-2xl flex flex-col gap-3.5"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: colors.textSecondary,
                      }}
                    >
                      اسم المستخدم (الاسم الظاهر)
                    </label>
                    <input
                      type="text"
                      data-testid="input-display-name"
                      value={profileNameDraft}
                      onChange={(e) => setProfileNameDraft(e.target.value)}
                      placeholder="مثال: Ali Anime NOVA"
                      className="w-full px-3.5 py-2.5 rounded-xl outline-none text-right"
                      style={{
                        backgroundColor: colors.input,
                        border: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: colors.textSecondary,
                      }}
                    >
                      اليوزر (معرّف الحساب @username)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      data-testid="input-username-handle"
                      value={profileUsernameDraft}
                      onChange={(e) => setProfileUsernameDraft(e.target.value)}
                      placeholder="@ali_nova"
                      className="w-full px-3.5 py-2.5 rounded-xl outline-none text-left"
                      style={{
                        backgroundColor: colors.input,
                        border: `1px solid ${colors.border}`,
                        color: "#38BDF8",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.textMuted,
                    }}
                  >
                    يظهر اسمك واليوزر في التعليقات والملف الشخصي
                  </span>
                  <button
                    type="button"
                    data-testid="save-profile-identity-btn"
                    onClick={handleSaveProfileIdentity}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    <Check size={14} color="#FFFFFF" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: تغيير صورة البروفايل (بدون وضع صورة عبر رابط) */}
            {accountTab === "avatar" && (
              <div
                data-testid="account-panel-avatar"
                className="p-4 rounded-2xl flex flex-col gap-3.5"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: colors.textPrimary,
                    }}
                  >
                    اختر أفاتار أنمي احترافي أو ارفع صورة من جهازك:
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    data-testid="upload-device-avatar-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl cursor-pointer active:scale-95 transition-transform shrink-0"
                    style={{
                      backgroundColor: "rgba(14, 165, 233, 0.16)",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      color: "#38BDF8",
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    رفع صورة من الجهاز
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {CURATED_ANIME_AVATARS.map((av) => {
                    const selected = googleUser.avatar === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => handleSelectAvatar(av.url, av.label)}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer active:scale-95 transition-all"
                        style={{
                          backgroundColor: selected
                            ? "rgba(16, 185, 129, 0.16)"
                            : colors.input,
                          border: selected
                            ? "1.5px solid #10B981"
                            : `1px solid ${colors.border}`,
                        }}
                      >
                        <img
                          src={av.url}
                          alt={av.label}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <span
                          className="line-clamp-1"
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: selected ? "#34D399" : colors.textSecondary,
                          }}
                        >
                          {av.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: المفضلة داخل إعدادات الحساب */}
            {accountTab === "favorites" && (
              <div
                data-testid="account-panel-favorites"
                className="p-4 rounded-2xl flex flex-col gap-3"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: colors.textPrimary,
                    }}
                  >
                    قائمة أنمياتك المفضلة المرتبطة بالحساب ({favoriteAnimeItems.length})
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#34D399",
                    }}
                  >
                    مُزامنة سحابياً ✓
                  </span>
                </div>

                {favoriteAnimeItems.length === 0 ? (
                  <div
                    className="py-8 text-center rounded-xl"
                    style={{
                      backgroundColor: colors.input,
                      border: `1px dashed ${colors.border}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: colors.textMuted,
                      }}
                    >
                      لا توجد أنميات في مفضلتك حالياً
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {favoriteAnimeItems.map((anime) => (
                      <div
                        key={anime.id}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl"
                        style={{
                          backgroundColor: colors.surfaceElevated,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <div
                          onClick={() => onOpenDetails?.(anime)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        >
                          <img
                            src={anime.coverImage}
                            alt={anime.title}
                            className="w-12 h-16 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1 text-right">
                            <div
                              className="line-clamp-1"
                              style={{
                                fontSize: 12.5,
                                fontWeight: 900,
                                color: colors.textPrimary,
                              }}
                            >
                              {anime.titleAr || anime.title}
                            </div>
                            <div
                              className="flex items-center gap-2 mt-0.5"
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: colors.textMuted,
                              }}
                            >
                              <span>★ {anime.score.toFixed(1)}</span>
                              <span>•</span>
                              <span>{anime.episodesCount} حلقة</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onOpenDetails && (
                            <button
                              type="button"
                              onClick={() => onOpenDetails(anime)}
                              className="px-3 py-1.5 rounded-lg cursor-pointer"
                              style={{
                                backgroundColor: "rgba(14, 165, 233, 0.14)",
                                border: "1px solid rgba(56, 189, 248, 0.35)",
                                color: "#38BDF8",
                                fontSize: 10.5,
                                fontWeight: 800,
                              }}
                            >
                              عرض
                            </button>
                          )}
                          {onToggleFav && (
                            <button
                              type="button"
                              onClick={() => {
                                onToggleFav(anime);
                                showToast(
                                  `تمت إزالة ${anime.titleAr || anime.title} من المفضلة`
                                );
                              }}
                              className="p-2 rounded-lg cursor-pointer"
                              style={{
                                backgroundColor: "rgba(244, 63, 94, 0.14)",
                                border: "1px solid rgba(244, 63, 94, 0.3)",
                              }}
                              title="إزالة من المفضلة"
                            >
                              <Trash2 size={14} color="#FB7185" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: سجل تعليقاتك */}
            {accountTab === "comments" && (
              <div
                data-testid="account-panel-comments"
                className="p-4 rounded-2xl flex flex-col gap-3"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: colors.textPrimary,
                    }}
                  >
                    سجل تعليقاتك في الحلقات ({userComments.length})
                  </span>
                  <span
                    dir="ltr"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: "#38BDF8",
                    }}
                  >
                    {googleUser.username}
                  </span>
                </div>

                {/* User Comments List */}
                {userComments.length === 0 ? (
                  <div
                    className="py-6 text-center rounded-xl"
                    style={{
                      backgroundColor: colors.input,
                      border: `1px dashed ${colors.border}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: colors.textMuted,
                      }}
                    >
                      لا توجد تعليقات محفوظة في سجلك حتى الآن
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {userComments.map((c) => {
                      const matchedAnime = animeList.find(
                        (a) => a.id === c.animeId
                      );
                      return (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl flex flex-col gap-2"
                          style={{
                            backgroundColor: colors.surfaceElevated,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={c.animePoster}
                                alt={c.animeTitle}
                                className="w-9 h-12 rounded-md object-cover shrink-0"
                              />
                              <div className="min-w-0 text-right">
                                <div
                                  className="line-clamp-1"
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 900,
                                    color: colors.textPrimary,
                                  }}
                                >
                                  {c.animeTitle}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      color: "#38BDF8",
                                    }}
                                  >
                                    {c.episodeTag}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: colors.textMuted,
                                    }}
                                  >
                                    • {c.time}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {matchedAnime && onOpenComments && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenComments(
                                      matchedAnime,
                                      c.episodeNumber
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg cursor-pointer"
                                  style={{
                                    backgroundColor:
                                      "rgba(14, 165, 233, 0.14)",
                                    border:
                                      "1px solid rgba(56, 189, 248, 0.35)",
                                    color: "#38BDF8",
                                    fontSize: 10,
                                    fontWeight: 800,
                                  }}
                                >
                                  فتح المناقشة
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteUserComment(c.id)}
                                className="p-2 rounded-lg cursor-pointer"
                                style={{
                                  backgroundColor: "rgba(244, 63, 94, 0.14)",
                                  border: "1px solid rgba(244, 63, 94, 0.3)",
                                }}
                                title="حذف التعليق"
                              >
                                <Trash2 size={13} color="#FB7185" />
                              </button>
                            </div>
                          </div>

                          <p
                            className="m-0 text-right"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: colors.textPrimary,
                              lineHeight: "20px",
                            }}
                          >
                            {c.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      data-testid="nova-settings-screen"
      className="flex-1 min-h-0 overflow-y-auto nova-ep-scroll select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 60 }}
    >
      {toastMsg && (
        <div
          className="fixed top-4 left-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: "rgba(12, 24, 20, 0.96)",
            border: "1px solid rgba(52, 211, 153, 0.45)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.65)",
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              backgroundColor: "rgba(16, 185, 129, 0.22)",
            }}
          >
            <Check size={14} color="#34D399" />
          </div>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: "#F8FAFC",
            }}
          >
            {toastMsg}
          </span>
        </div>
      )}

      {/* ── 0. Luxury Sticky Header Bar ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 11,
          paddingBottom: 11,
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.input,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ChevronRight size={19} color={colors.textPrimary} />
          </button>
          <div>
            <h1
              className="m-0"
              style={{
                fontSize: 16.5,
                fontWeight: 900,
                color: colors.textPrimary,
              }}
            >
              الملف الشخصي والإعدادات
            </h1>
            <p
              className="m-0"
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: colors.textMuted,
              }}
            >
              حساب Google · إعدادات الحساب · المفضلة · سجل التعليقات
            </p>
          </div>
        </div>

        <span
          dir="ltr"
          style={{
            paddingLeft: 9,
            paddingRight: 9,
            paddingTop: 4,
            paddingBottom: 4,
            borderRadius: 9,
            backgroundColor: colors.input,
            border: `1px solid ${colors.border}`,
            fontSize: 10,
            fontWeight: 800,
            color: colors.textSecondary,
          }}
        >
          v2.4.0
        </span>
      </div>

      {/* ── 1. Executive Profile Hero & Internal Account Settings Hub ── */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        <div
          data-testid="profile-hero-card"
          className="overflow-hidden"
          style={{
            borderRadius: 24,
            border: `1px solid ${colors.border}`,
            background:
              theme === "white"
                ? colors.card
                : "linear-gradient(145deg, #171926 0%, #0F111A 100%)",
            boxShadow:
              theme === "white"
                ? "0 8px 24px rgba(15, 23, 42, 0.06)"
                : "0 16px 32px -12px rgba(0, 0, 0, 0.65)",
          }}
        >
          {/* Top Decorative Cover Banner inside Profile Card */}
          <div
            className="relative px-4 pt-4 pb-3 flex items-center justify-between gap-2"
            style={{
              background:
                theme === "white"
                  ? "linear-gradient(135deg, rgba(225, 29, 72, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)"
                  : "linear-gradient(135deg, rgba(225, 29, 72, 0.20) 0%, rgba(124, 58, 237, 0.18) 55%, rgba(15, 23, 42, 0.4) 100%)",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Interactive Avatar with Edit Trigger */}
              <button
                type="button"
                onClick={() => {
                  if (googleUser) {
                    setShowAccountHub(true);
                    setAccountTab("avatar");
                  } else {
                    setShowAuth(true);
                  }
                }}
                className="relative shrink-0 cursor-pointer active:scale-95 transition-transform p-0 border-0 bg-transparent"
                title="تغيير صورة البروفايل"
              >
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 18,
                    background: googleUser
                      ? "linear-gradient(135deg, #E11D48 0%, #7C3AED 100%)"
                      : "linear-gradient(135deg, #334155 0%, #1E293B 100%)",
                    border: googleUser
                      ? "2px solid rgba(52, 211, 153, 0.8)"
                      : "1.5px solid rgba(255, 255, 255, 0.22)",
                  }}
                >
                  {googleUser?.avatar ? (
                    <img
                      src={googleUser.avatar}
                      alt={googleUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: "#FFFFFF",
                      }}
                    >
                      {googleUser ? googleUser.name.charAt(0) : "ض"}
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center justify-center"
                  style={{
                    position: "absolute",
                    bottom: -3,
                    left: -3,
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor: googleUser ? "#10B981" : "#F59E0B",
                    border: "2px solid #11131C",
                    color: "#FFFFFF",
                    fontSize: 9,
                    fontWeight: 900,
                  }}
                >
                  {googleUser ? "✎" : "•"}
                </div>
              </button>

              {/* Profile Name, @Username, Email & Status Badges */}
              <div className="text-right min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="line-clamp-1"
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: colors.textPrimary,
                    }}
                  >
                    {googleUser ? googleUser.name : "زائر Anime NOVA"}
                  </span>
                  {googleUser?.username && (
                    <span
                      dir="ltr"
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        paddingLeft: 7,
                        paddingRight: 7,
                        paddingTop: 1.5,
                        paddingBottom: 1.5,
                        borderRadius: 999,
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        border: "1px solid rgba(56, 189, 248, 0.35)",
                        color: "#38BDF8",
                      }}
                    >
                      {googleUser.username}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      paddingLeft: 7,
                      paddingRight: 7,
                      paddingTop: 2,
                      paddingBottom: 2,
                      borderRadius: 999,
                      backgroundColor: googleUser
                        ? "rgba(16, 185, 129, 0.16)"
                        : "rgba(245, 158, 11, 0.16)",
                      border: googleUser
                        ? "1px solid rgba(16, 185, 129, 0.35)"
                        : "1px solid rgba(245, 158, 11, 0.35)",
                      color: googleUser ? "#34D399" : "#FBBF24",
                    }}
                  >
                    {googleUser ? "متصل بـ Google ✓" : "حساب محلي"}
                  </span>
                </div>

                <p
                  dir="ltr"
                  className="m-0 mt-1 text-right truncate"
                  style={{
                    fontSize: 11.5,
                    color: colors.textSecondary,
                    fontWeight: 700,
                  }}
                >
                  {googleUser
                    ? googleUser.email
                    : "سجّل دخولك عبر Google لتفعيل إعدادات الحساب والمزامنة"}
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="open-google-auth-btn"
              onClick={() => {
                if (googleUser) {
                  setShowAccountHub(true);
                } else {
                  setShowAuth(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer active:scale-95 transition-transform shrink-0"
              style={{
                backgroundColor: googleUser
                  ? "rgba(56, 189, 248, 0.18)"
                  : "rgba(255, 255, 255, 0.08)",
                border: googleUser
                  ? "1px solid rgba(56, 189, 248, 0.45)"
                  : `1px solid ${colors.border}`,
              }}
            >
              <Settings
                size={14}
                color={googleUser ? "#38BDF8" : colors.textPrimary}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: googleUser ? "#38BDF8" : colors.textPrimary,
                }}
              >
                {googleUser ? "إدارة الحساب" : "حسابي"}
              </span>
            </button>
          </div>

          {/* ── Dedicated Google Sign-In Box ── */}
          <div
            data-testid="google-signin-card"
            className="p-4"
            style={{
              backgroundColor:
                theme === "white"
                  ? "rgba(248, 250, 252, 0.9)"
                  : "rgba(17, 19, 28, 0.85)",
            }}
          >
            {!googleUser ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Official 4-Color Google G Emblem */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: "#FFFFFF",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 900,
                          color: colors.textPrimary,
                        }}
                      >
                        بوابة تسجيل الدخول عبر Google
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: colors.textSecondary,
                          marginTop: 1,
                        }}
                      >
                        أضف حسابك لتغيير اليوزر والصورة واستعراض المفضلة وسجل تعليقاتك
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official High-Contrast Google Sign-In Button */}
                <button
                  type="button"
                  data-testid="google-primary-signin-btn"
                  onClick={() => setShowAuth(true)}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl cursor-pointer active:scale-[0.99] transition-transform"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: "0 8px 20px -6px rgba(0, 0, 0, 0.35)",
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span
                    style={{
                      color: "#0F172A",
                      fontSize: 13.5,
                      fontWeight: 900,
                    }}
                  >
                    تسجيل الدخول باستخدام Google
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: colors.textPrimary,
                        }}
                      >
                        حساب Google متصل ومُزامَن
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: "#34D399",
                        }}
                      >
                        آخر مزامنة: {googleUser.syncedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAuth(true)}
                      className="px-3 py-2 rounded-xl cursor-pointer"
                      style={{
                        backgroundColor: colors.input,
                        border: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      تبديل الحساب
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleSignOut}
                      className="px-3 py-2 rounded-xl cursor-pointer"
                      style={{
                        backgroundColor: "rgba(244, 63, 94, 0.14)",
                        border: "1px solid rgba(244, 63, 94, 0.3)",
                        color: "#FDA4AF",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      خروج
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Integrated 4-Column Telemetry & Activity Strip */}
          {(
            <div
              className="grid grid-cols-4"
              style={{
                borderTop: `1px solid ${colors.border}`,
                backgroundColor: colors.surfaceElevated,
              }}
            >
              {[
                {
                  label: "حلقات مشاهَدة",
                  val: watchHistoryCount,
                  color: theme === "white" ? "#334155" : "#F8FAFC",
                },
                {
                  label: "أنميات مفضلة",
                  val: favoritesCount,
                  color: theme === "white" ? "#BE123C" : "#FB7185",
                },
                {
                  label: "سجل تعليقاتك",
                  val: userComments.length,
                  color: "#38BDF8",
                },
                {
                  label: "العضوية",
                  val: "VIP متاح",
                  color: "#A78BFA",
                },
              ].map((st, idx) => (
                <div
                  key={st.label}
                  className="flex flex-col items-center justify-center py-3"
                  style={{
                    borderLeft:
                      idx < 3
                        ? `1px solid ${colors.border}`
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: st.color,
                    }}
                  >
                    {st.val}
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: colors.textMuted,
                      marginTop: 1,
                    }}
                  >
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Device & TV Pairing Action Row */}
          <div
            className="flex items-center gap-2 p-3"
            style={{
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
            }}
          >
            <button
              onClick={onOpenTvLink}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Link2 size={14} color={colors.textSecondary} />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: colors.textPrimary,
                }}
              >
                ربط تلفاز أو هاتف بالرمز
              </span>
            </button>

            <button
              onClick={() => setShowTvLink(true)}
              className="px-3.5 flex items-center justify-center gap-1.5 py-2.5 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: colors.surfaceElevated,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Tv size={14} color={colors.textSecondary} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: colors.textPrimary,
                }}
              >
                عرض الرمز
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Ocean Sapphire Nova Premium VIP Banner ── */}
      {(
        <div className="px-4 mt-4 flex flex-col gap-3">
          <button
            onClick={() => setShowPremium(true)}
            className="w-full p-4 rounded-2xl cursor-pointer text-right active:scale-[0.99] transition-transform"
            style={{
              background:
                theme === "white"
                  ? "rgba(14, 165, 233, 0.10)"
                  : "linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(3, 105, 161, 0.22) 55%, rgba(15, 23, 42, 0.96) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              boxShadow: "0 12px 26px -10px rgba(2, 132, 199, 0.25)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    background:
                      "linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(2, 132, 199, 0.16))",
                    border: "1px solid rgba(56, 189, 248, 0.42)",
                  }}
                >
                  <Sparkles size={19} color="#38BDF8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontSize: 14.5,
                        fontWeight: 900,
                        color: theme === "white" ? "#0369A1" : "#E0F2FE",
                      }}
                    >
                      Nova Premium
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        paddingLeft: 6,
                        paddingRight: 6,
                        paddingTop: 1,
                        paddingBottom: 1,
                        borderRadius: 6,
                        backgroundColor: colors.primary,
                        color: "#FFFFFF",
                      }}
                    >
                      VIP · 1.99$
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      marginTop: 2,
                      color: colors.textSecondary,
                    }}
                  >
                    مشاهدة فائقة بدون إعلانات مع تخطي تلقائي للمقدمات
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-1 shrink-0"
                style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingTop: 6,
                  paddingBottom: 6,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  border: `1px solid ${colors.primary}`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#FFFFFF",
                  }}
                >
                  ترقية
                </span>
                <ChevronLeft size={13} color="#FFFFFF" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["بدون إعلانات", "جودة 1080p فائقة", "تخطي المقدمة"].map(
                (f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: colors.surfaceElevated,
                      border: `1px solid ${colors.border}`,
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: colors.textPrimary,
                    }}
                  >
                    <Check size={10} color={colors.textPrimary} />
                    {f}
                  </span>
                )
              )}
            </div>
          </button>

          {/* ── 2B. خيار "ادعمني ليستمر التطبيق بالعمل مجاناً" تحت Nova المدفوع ── */}
          <button
            type="button"
            data-testid="support-app-card"
            onClick={() => setShowSupportModal(true)}
            className="w-full p-4 rounded-2xl cursor-pointer text-right active:scale-[0.99] transition-transform"
            style={{
              background:
                theme === "white"
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(244, 63, 94, 0.08) 100%)"
                  : "linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(225, 29, 72, 0.16) 55%, rgba(15, 23, 42, 0.96) 100%)",
              border: "1px solid rgba(52, 211, 153, 0.38)",
              boxShadow: "0 12px 26px -10px rgba(16, 185, 129, 0.22)",
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    background:
                      "linear-gradient(135deg, rgba(52, 211, 153, 0.26), rgba(244, 63, 94, 0.22))",
                    border: "1px solid rgba(52, 211, 153, 0.45)",
                  }}
                >
                  <Heart size={19} color="#34D399" fill="#34D399" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: theme === "white" ? "#065F46" : "#ECFDF5",
                      }}
                    >
                      ادعمني ليستمر التطبيق بالعمل مجاناً
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        paddingLeft: 7,
                        paddingRight: 7,
                        paddingTop: 1.5,
                        paddingBottom: 1.5,
                        borderRadius: 999,
                        backgroundColor: "rgba(16, 185, 129, 0.2)",
                        border: "1px solid rgba(52, 211, 153, 0.45)",
                        color: "#34D399",
                      }}
                    >
                      مجاني 100% ❤️
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      marginTop: 2,
                      color: colors.textSecondary,
                    }}
                  >
                    ساهم في دعم خوادم البث السحابية ليبقى التطبيق مجانياً للجميع
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-1 shrink-0"
                style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingTop: 6,
                  paddingBottom: 6,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#FFFFFF",
                  }}
                >
                  ادعمني
                </span>
                <ChevronLeft size={13} color="#FFFFFF" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "ادعمني بنجوم أو هدايا تلجرام",
                  "دعم سيرفرات الحلقات",
                  "مشاركة التطبيق",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: colors.surfaceElevated,
                      border: `1px solid ${colors.border}`,
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: colors.textPrimary,
                    }}
                  >
                    <Check size={10} color="#34D399" />
                    {tag}
                  </span>
                ))}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#34D399",
                }}
              >
                مساهماتك: {supportCount} ⭐
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── 3. المظهر وتجربة العرض (Appearance & Theme) ── */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 900,
              color: "#A78BFA",
            }}
          >
            المظهر وتجربة العرض
          </span>
          <div
            className="flex-1"
            style={{
              height: 1,
              background:
                "linear-gradient(270deg, rgba(167,139,250,0.25), transparent)",
            }}
          />
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: colors.textPrimary,
                }}
              >
                ثيم التطبيق
              </div>
              <div style={{ fontSize: 10.5, color: colors.textMuted }}>
                اختر المظهر المناسب لشاشات OLED أو الإضاءة النهارية
              </div>
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 3,
                paddingBottom: 3,
                borderRadius: 8,
                backgroundColor: colors.accentSurface,
                color: colors.accent,
              }}
            >
              {theme === "black" ? "داكن OLED" : "نهاري أبيض"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: "أسود ملكي (OLED)",
                sub: "مريح للعين في الظلام",
                value: "black" as const,
                dot: "#09090B",
              },
              {
                label: "أبيض ساطع",
                sub: "وضوح عالٍ نهاراً",
                value: "white" as const,
                dot: "#F8FAFC",
              },
            ].map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => {
                    onSetTheme(t.value);
                    showToast(`تم التبديل إلى الثيم: ${t.label}`);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-right transition-all"
                  style={{
                    backgroundColor: active
                      ? "rgba(139, 92, 246, 0.14)"
                      : colors.surface,
                    border: `1.5px solid ${
                      active ? "#8B5CF6" : colors.border
                    }`,
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: t.dot,
                      border: "1px solid rgba(167, 139, 250, 0.35)",
                    }}
                  >
                    {active && <Check size={14} color="#8B5CF6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="line-clamp-1"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: active
                          ? colors.textPrimary
                          : colors.textSecondary,
                      }}
                    >
                      {t.label}
                    </div>
                    <div
                      className="line-clamp-1"
                      style={{
                        fontSize: 9.5,
                        color: colors.textMuted,
                      }}
                    >
                      {t.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 4. الإشعارات والبيانات والمجتمع ── */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 900,
              color: "#A78BFA",
            }}
          >
            الإشعارات والبيانات والمجتمع
          </span>
          <div
            className="flex-1"
            style={{
              height: 1,
              background:
                "linear-gradient(270deg, rgba(167,139,250,0.25), transparent)",
            }}
          />
        </div>

        <div
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* Row 1: Notifications with Toggle Switch */}
          <button
            onClick={() => {
              setNotifs((n) => !n);
              showToast(
                !notifs ? "تم تفعيل إشعارات الحلقات" : "تم إيقاف الإشعارات"
              );
            }}
            className="w-full flex items-center justify-between p-3.5 cursor-pointer"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: notifs
                    ? "rgba(16, 185, 129, 0.16)"
                    : "rgba(148, 163, 184, 0.12)",
                  border: `1px solid ${
                    notifs
                      ? "rgba(16, 185, 129, 0.35)"
                      : "rgba(148, 163, 184, 0.2)"
                  }`,
                }}
              >
                <Bell
                  size={17}
                  color={notifs ? "#34D399" : colors.textMuted}
                />
              </div>
              <div className="text-right">
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: colors.textPrimary,
                  }}
                >
                  إشعارات الحلقات الجديدة
                </div>
                <div style={{ fontSize: 10.5, color: colors.textMuted }}>
                  {notifs
                    ? "مفعّلة · تنبيه فوري عند صدور الحلقات"
                    : "موقفة حالياً على هذا الجهاز"}
                </div>
              </div>
            </div>

            {/* Interactive Switch */}
            <div
              className="flex items-center px-1 transition-all"
              style={{
                width: 44,
                height: 24,
                borderRadius: 999,
                backgroundColor: notifs
                  ? "#10B981"
                  : "rgba(255, 255, 255, 0.14)",
                justifyContent: notifs ? "flex-start" : "flex-end",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
                }}
              />
            </div>
          </button>

          {/* Row 2: Clear Watch History */}
          <button
            onClick={() => {
              onClearHistory();
              showToast("تم مسح سجل المشاهدة بالكامل");
            }}
            className="w-full flex items-center justify-between p-3.5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: "rgba(244, 63, 94, 0.14)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                }}
              >
                <Trash2 size={16} color="#FB7185" />
              </div>
              <div className="text-right">
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#FDA4AF",
                  }}
                >
                  مسح سجل المشاهدة
                </div>
                <div style={{ fontSize: 10.5, color: colors.textMuted }}>
                  حذف كافة الحلقات من قائمة متابعة المشاهدة
                </div>
              </div>
            </div>
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>
      </div>

      {/* ── 6. قسم "اخري" ── */}
      <div className="px-4 mt-6 flex flex-col gap-3">
        <div
          className="px-1 text-right"
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: colors.textPrimary,
          }}
        >
          اخري
        </div>

        {[
          {
            id: "website",
            label: "الموقع الرسمي",
            iconType: "doc" as const,
            onClick: () =>
              setOtherModalInfo({
                title: "الموقع الرسمي — ANIME NOVA",
                body: "يمكنك زيارة البوابة الرسمية لتطبيق ANIME NOVA لمتابعة التحديثات الفورية، تنزيل أحدث نسخ الأندرويد والتلفاز الذكي Android TV، واستعراض مكتبة الأنمي والمانجا الكاملة.",
              }),
          },
          {
            id: "contact",
            label: "تواصل معنا",
            iconType: "mail" as const,
            onClick: () =>
              setOtherModalInfo({
                title: "تواصل معنا",
                body: "فريق دعم ANIME NOVA متواجد على مدار الساعة لاستقبال اقتراحاتكم وطلبات إضافة الأنميات والحلقات عبر قناتنا الرسمية في تيليجرام أو البريد المخصص للدعم الفني.",
              }),
          },
          {
            id: "share",
            label: "مشاركة التطبيق",
            iconType: "share" as const,
            onClick: () => {
              try {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
              } catch {}
              showToast("تم نسخ رابط مشاركة التطبيق بنجاح");
            },
          },
          {
            id: "disclaimer",
            label: "اخلاء المسؤولية",
            iconType: "shield" as const,
            onClick: () =>
              setOtherModalInfo({
                title: "إخلاء المسؤولية",
                body: "تطبيق ANIME NOVA لا يستضيف أي ملفات فيديو على خوادمه الخاصة، وإنما يقوم بفهرسة وتنظيم الروابط المتاحة للعامة عبر مصادر البث المختلفة لتوفير تجربة مشاهدة مريحة للمستخدم العربي.",
              }),
          },
          {
            id: "privacy",
            label: "سياسة الخصوصية",
            iconType: "doc" as const,
            onClick: () =>
              setOtherModalInfo({
                title: "سياسة الخصوصية",
                body: "نحن نحترم خصوصيتك بالكامل. يتم حفظ سجل المشاهدة، المفضلة، والإعدادات محلياً على جهازك فقط، ولا يتم مشاركة أي بيانات شخصية مع أي أطراف خارجية.",
              }),
          },
          {
            id: "about",
            label: "عن التطبيق",
            iconType: "info" as const,
            onClick: () =>
              setOtherModalInfo({
                title: "عن التطبيق — ANIME NOVA v2.4.0",
                body: "ANIME NOVA هو تطبيق متكامل لمشاهدة الأنمي المترجم والمدبلج، الكرتون العربي، وأعمال سبيستون، وقراءة المانجا المترجمة مع مشغل داخلي متطور ودعم كامل لشاشات التلفاز والهواتف.",
              }),
          },
        ].map((item) => {
          const isLightMode =
            colors.background === "#F8FAFC" || colors.background === "#FFFFFF";
          const cardBg = isLightMode ? "#FFFFFF" : "#222225";
          const iconColor = isLightMode ? "#0F172A" : "#FFFFFF";
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="w-full flex items-center justify-between px-5 cursor-pointer active:scale-[0.99] transition-transform"
              style={{
                height: 68,
                borderRadius: 12,
                backgroundColor: cardBg,
                border: isLightMode
                  ? `1px solid ${colors.border}`
                  : "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: colors.textPrimary,
                }}
              >
                {item.label}
              </span>

              <div className="flex items-center justify-center">
                {item.iconType === "doc" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="3"
                      fill={iconColor}
                    />
                    <path
                      d="M7 8H17M7 12H17M7 16H13"
                      stroke={cardBg}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {item.iconType === "mail" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="2"
                      y="4"
                      width="20"
                      height="16"
                      rx="3"
                      fill={iconColor}
                    />
                    <path
                      d="M3.5 6.5L12 13L20.5 6.5"
                      stroke={cardBg}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {item.iconType === "share" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="18" cy="5" r="3" fill={iconColor} />
                    <circle cx="6" cy="12" r="3" fill={iconColor} />
                    <circle cx="18" cy="19" r="3" fill={iconColor} />
                    <path
                      d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49"
                      stroke={iconColor}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {item.iconType === "shield" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z"
                      fill={iconColor}
                    />
                    <circle cx="12" cy="8.5" r="1.3" fill={cardBg} />
                    <path
                      d="M12 11.5V17"
                      stroke={cardBg}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {item.iconType === "info" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill={iconColor} />
                    <circle cx="12" cy="8" r="1.3" fill={cardBg} />
                    <path
                      d="M12 11.5V17"
                      stroke={cardBg}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal Sheet for "اخري" Info Cards */}
      {otherModalInfo && (
        <div
          onClick={() => setOtherModalInfo(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-3 text-right"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 20px 45px rgba(0,0,0,0.7)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: 15.5,
                  fontWeight: 900,
                  color: colors.textPrimary,
                }}
              >
                {otherModalInfo.title}
              </span>
              <button
                onClick={() => setOtherModalInfo(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: colors.input }}
              >
                <X size={16} color={colors.textPrimary} />
              </button>
            </div>
            <p
              className="m-0"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: colors.textSecondary,
                lineHeight: "22px",
              }}
            >
              {otherModalInfo.body}
            </p>
            <button
              onClick={() => setOtherModalInfo(null)}
              className="w-full py-2.5 rounded-xl cursor-pointer mt-1"
              style={{
                backgroundColor: colors.textPrimary,
                color: colors.background,
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      {/* ── Luxury Footer ── */}
      <div className="flex flex-col items-center gap-1 pt-7 pb-4">
        <div dir="ltr" className="flex items-baseline gap-1.5">
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: "1.2px",
              color: colors.textSecondary,
            }}
          >
            ANIME
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: "1.8px",
              color: "#A78BFA",
            }}
          >
            NOVA
          </span>
        </div>
        <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>
          الإصدار 2.4.0 · تطبيق الأندرويد والتلفاز الرسمي
        </div>
      </div>

      {/* ── Upgraded Google Auth Sheet (بدون خانة البريد اليدوي) ── */}
      {showAuth && (
        <div
          data-testid="google-auth-modal"
          className="fixed inset-0 z-[95] flex items-end justify-center"
        >
          <div
            onClick={() => setShowAuth(false)}
            className="fixed inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.78)" }}
          />
          <div
            className="relative z-10 w-full max-w-[480px] p-5 pb-8 overflow-y-auto max-h-[90vh]"
            style={{
              backgroundColor: "#10121C",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderTop: "1.5px solid rgba(255, 255, 255, 0.16)",
              boxShadow: "0 -20px 50px rgba(0, 0, 0, 0.85)",
            }}
          >
            {/* Top Drag Handle */}
            <div
              className="mx-auto mb-4"
              style={{
                width: 42,
                height: 4,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            />

            {/* Header Row with Official Google Logo */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: "#FFFFFF",
                    }}
                  >
                    تسجيل الدخول باستخدام Google
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(226, 232, 240, 0.65)",
                    }}
                  >
                    المتابعة إلى حسابك في Anime NOVA
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAuth(false)}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <X size={16} color="rgba(255,255,255,0.75)" />
              </button>
            </div>

            {/* Cloud Sync Benefits Banner */}
            <div
              className="grid grid-cols-2 gap-2 p-3 rounded-2xl mb-4"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {[
                "مزامنة سجل المشاهدة تلقائياً",
                "حفظ قائمة المفضلة السحابية",
                "استكمال الحلقات على التلفاز",
                "حماية بياناتك من الضياع",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} color="#34D399" />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#E2E8F0",
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Google Account Picker (اختيار حساب Google بنقرة واحدة) */}
            <div className="mb-4">
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "rgba(226, 232, 240, 0.75)",
                  marginBottom: 8,
                }}
              >
                اختر حساب Google للمتابعة الفورية:
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  {
                    name: "Ali Anime NOVA",
                    username: "@ali_nova",
                    email: "ali0117078153@gmail.com",
                    avatar:
                      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
                    tag: "الحساب الأساسي",
                  },
                  {
                    name: "عاشق الأنمي · VIP",
                    username: "@otaku_nova_vip",
                    email: "otaku.nova.ar@gmail.com",
                    avatar:
                      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
                    tag: "مزامنة سحابية",
                  },
                ].map((acc) => {
                  const isCurrent = googleUser?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleGoogleSignIn(acc)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl cursor-pointer active:scale-[0.99] transition-transform text-right"
                      style={{
                        backgroundColor: isCurrent
                          ? "rgba(16, 185, 129, 0.14)"
                          : "rgba(255, 255, 255, 0.05)",
                        border: isCurrent
                          ? "1.5px solid rgba(52, 211, 153, 0.55)"
                          : "1px solid rgba(255, 255, 255, 0.12)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                          style={{
                            border: "1.5px solid rgba(255,255,255,0.3)",
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "#FFFFFF",
                              }}
                            >
                              {acc.name}
                            </span>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 800,
                                paddingLeft: 6,
                                paddingRight: 6,
                                paddingTop: 1,
                                paddingBottom: 1,
                                borderRadius: 6,
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "#CBD5E1",
                              }}
                            >
                              {acc.tag}
                            </span>
                          </div>
                          <div
                            dir="ltr"
                            className="text-right"
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "rgba(226, 232, 240, 0.65)",
                            }}
                          >
                            {acc.email}
                          </div>
                        </div>
                      </div>

                      <div
                        className="px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: isCurrent
                            ? "#10B981"
                            : "rgba(255,255,255,0.1)",
                          color: "#FFFFFF",
                          fontSize: 10.5,
                          fontWeight: 800,
                        }}
                      >
                        {isCurrent ? "متصل" : "دخول"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Continue with Google Button */}
            <button
              type="button"
              onClick={() =>
                handleGoogleSignIn({
                  name: "Ali Anime NOVA",
                  username: "@ali_nova",
                  email: "ali0117078153@gmail.com",
                  avatar:
                    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
                })
              }
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl cursor-pointer active:scale-[0.99] transition-transform"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 10px 25px -5px rgba(255, 255, 255, 0.2)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span
                style={{
                  color: "#0F172A",
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                المتابعة باستخدام Google
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Support App Modal Sheet (ادعمني ليستمر التطبيق بالعمل مجاناً) ── */}
      {showSupportModal && (
        <div
          data-testid="support-app-modal"
          className="fixed inset-0 z-[95] flex items-end justify-center"
        >
          <div
            onClick={() => setShowSupportModal(false)}
            className="fixed inset-0"
            style={{
              backgroundColor:
                theme === "white" ? "rgba(15, 23, 42, 0.55)" : "rgba(0,0,0,0.78)",
            }}
          />
          <div
            className="relative z-10 w-full max-w-[480px] p-5 pb-8 overflow-y-auto max-h-[90vh]"
            style={{
              backgroundColor: theme === "white" ? "#FFFFFF" : "#0B131E",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderTop: "2px solid #10B981",
              boxShadow:
                theme === "white"
                  ? "0 -18px 45px rgba(15, 23, 42, 0.18)"
                  : "0 -20px 50px rgba(0, 0, 0, 0.85)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(56, 189, 248, 0.22))",
                    border: "1px solid rgba(52, 211, 153, 0.45)",
                  }}
                >
                  <Heart size={18} color="#10B981" fill="#10B981" />
                </div>
                <div className="text-right">
                  <div
                    style={{
                      fontSize: 15.5,
                      fontWeight: 900,
                      color: theme === "white" ? "#0F172A" : "#ECFDF5",
                    }}
                  >
                    ادعمني ليستمر التطبيق بالعمل مجاناً
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color:
                        theme === "white"
                          ? "#64748B"
                          : "rgba(226, 232, 240, 0.65)",
                    }}
                  >
                    دعمك يحافظ على خوادم الحلقات السريعة بدون رسوم إجبارية
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor:
                    theme === "white"
                      ? "#F1F5F9"
                      : "rgba(255,255,255,0.08)",
                }}
              >
                <X
                  size={16}
                  color={theme === "white" ? "#0F172A" : "#FFFFFF"}
                />
              </button>
            </div>

            {/* Option 1: Support with Telegram Stars or Gifts (ادعمني بنجوم أو هدايا تلجرام) */}
            <div
              data-testid="support-telegram-stars-card"
              className="p-4 rounded-2xl mb-3.5 flex flex-col gap-2.5"
              style={{
                background:
                  theme === "white"
                    ? "linear-gradient(135deg, rgba(14, 165, 233, 0.10) 0%, rgba(16, 185, 129, 0.08) 100%)"
                    : "linear-gradient(135deg, rgba(14, 165, 233, 0.16) 0%, rgba(16, 185, 129, 0.12) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.38)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-right">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: theme === "white" ? "#0F172A" : "#FFFFFF",
                    }}
                  >
                    ادعمني بنجوم أو هدايا تلجرام ⭐🎁
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color:
                        theme === "white"
                          ? "#475569"
                          : "rgba(226, 232, 240, 0.78)",
                      marginTop: 2,
                    }}
                  >
                    يمكنك إرسال نجوم تلجرام (Telegram Stars) أو هدايا رمزية لدعم استمرار سيرفرات المشاهدة والتحميل
                  </div>
                </div>
                <span
                  className="shrink-0"
                  style={{
                    fontSize: 10.5,
                    fontWeight: 900,
                    paddingLeft: 9,
                    paddingRight: 9,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 999,
                    backgroundColor: "rgba(14, 165, 233, 0.2)",
                    color: "#0284C7",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                  }}
                >
                  Telegram ⭐
                </span>
              </div>
            </div>

            {/* Option 2: Select Support Amount -> Reveals "اذهب إلى تلجرام" */}
            <div className="mb-3.5">
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 900,
                  color:
                    theme === "white"
                      ? "#334155"
                      : "rgba(226, 232, 240, 0.88)",
                  marginBottom: 8,
                }}
              >
                اختر مبلغ الدعم أو الهدية عبر تلجرام:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "coffee",
                    title: "50 نجمة ⭐",
                    subtitle: "قهوة للمطور",
                    amount: "1$",
                  },
                  {
                    id: "server",
                    title: "150 نجمة ⭐",
                    subtitle: "دعم السيرفر",
                    amount: "3$",
                  },
                  {
                    id: "gold",
                    title: "هدية تلجرام 🎁",
                    subtitle: "الراعي الذهبي",
                    amount: "5$",
                  },
                ].map((tier) => {
                  const active = selectedSupportTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      data-testid={`support-tier-${tier.id}`}
                      onClick={() => {
                        setSelectedSupportTier(tier.id);
                        setSupportCount((c) => c + 1);
                      }}
                      className="p-3 rounded-xl cursor-pointer text-center transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: active
                          ? "rgba(14, 165, 233, 0.18)"
                          : theme === "white"
                            ? "#F8FAFC"
                            : "rgba(255, 255, 255, 0.05)",
                        border: active
                          ? "1.5px solid #0EA5E9"
                          : theme === "white"
                            ? "1px solid #E2E8F0"
                            : "1px solid rgba(255, 255, 255, 0.12)",
                        boxShadow: active
                          ? "0 8px 20px -6px rgba(14, 165, 233, 0.35)"
                          : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: active
                            ? "#0EA5E9"
                            : theme === "white"
                              ? "#0F172A"
                              : "#FFFFFF",
                        }}
                      >
                        {tier.amount}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 900,
                          color: active
                            ? "#0284C7"
                            : theme === "white"
                              ? "#334155"
                              : "#38BDF8",
                          marginTop: 2,
                        }}
                      >
                        {tier.title}
                      </div>
                      <div
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color:
                            theme === "white"
                              ? "#64748B"
                              : "rgba(226, 232, 240, 0.7)",
                          marginTop: 1,
                        }}
                      >
                        {tier.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic "اذهب إلى تلجرام" button shown when a specific amount is selected */}
              {selectedSupportTier !== "" && (
                <div
                  data-testid="telegram-support-action-box"
                  className="mt-3 p-3.5 rounded-2xl flex flex-col gap-2.5"
                  style={{
                    backgroundColor:
                      theme === "white"
                        ? "#F0F9FF"
                        : "rgba(14, 165, 233, 0.12)",
                    border: "1.5px solid rgba(14, 165, 233, 0.45)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 900,
                        color: theme === "white" ? "#0F172A" : "#E0F2FE",
                      }}
                    >
                      تم اختيار باقة الدعم ({selectedSupportTier === "coffee" ? "1$ · 50 نجمة" : selectedSupportTier === "server" ? "3$ · 150 نجمة" : "5$ · هدية تلجرام"})
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#0EA5E9",
                      }}
                    >
                      @ANIME_N0VA
                    </span>
                  </div>
                  <a
                    href="https://t.me/ANIME_N0VA"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="go-to-telegram-support-btn"
                    onClick={() => {
                      showToast(
                        "شكراً لدعمك! يتم تحويلك إلى قناة وحساب تلجرام الرسمي ❤️"
                      );
                    }}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-transform"
                    style={{
                      background:
                        "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 900,
                      textDecoration: "none",
                      boxShadow: "0 10px 24px -8px rgba(14, 165, 233, 0.55)",
                    }}
                  >
                    <ExternalLink size={15} color="#FFFFFF" />
                    <span>اذهب إلى تلجرام</span>
                  </a>
                </div>
              )}
            </div>

            {/* Option 3: Share App with Friends */}
            <button
              type="button"
              onClick={() => {
                try {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                  }
                } catch {}
                setSupportCount((c) => c + 1);
                setShowSupportModal(false);
                showToast("تم نسخ رابط التطبيق! مشاركتك أكبر دعم لنا ❤️");
              }}
              className="w-full py-3.5 rounded-2xl cursor-pointer"
              style={{
                backgroundColor:
                  theme === "white"
                    ? "#F1F5F9"
                    : "rgba(255, 255, 255, 0.07)",
                border:
                  theme === "white"
                    ? "1px solid #CBD5E1"
                    : "1px solid rgba(255, 255, 255, 0.15)",
                color: theme === "white" ? "#0F172A" : "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 800,
              }}
            >
              نسخ رابط التطبيق ومشاركته مع أصدقائك
            </button>
          </div>
        </div>
      )}

      {/* TvLink Sheet */}
      {showTvLink && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center">
          <div
            onClick={() => setShowTvLink(false)}
            className="fixed inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.76)" }}
          />
          <div
            className="relative z-10 w-full max-w-[480px] p-5 pb-8"
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowTvLink(false)}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: colors.input,
                }}
              >
                <X size={18} color={colors.textSecondary} />
              </button>
              <div className="text-right">
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: colors.textPrimary,
                  }}
                >
                  ربط جهاز جديد
                </div>
                <div style={{ fontSize: 10, color: colors.textMuted }}>
                  هاتف آخر أو تلفاز · تسجيل آمن بدون مشاركة جلسة Google
                </div>
              </div>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: colors.accentSurface,
                border: `1px solid ${colors.accentBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: colors.accent,
                }}
              >
                رمز ربط الجهاز
              </div>
              <p
                className="m-0 mt-1"
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  lineHeight: "20px",
                }}
              >
                افتح شاشة «ربط الحساب» في الهاتف أو التلفاز الآخر، ثم اكتب الرمز
                الظاهر هنا. صالح لمدة 10 دقائق.
              </p>

              <div
                className="my-3 py-3 rounded-xl text-center"
                style={{
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 4,
                    color: colors.textPrimary,
                  }}
                >
                  {linkCode}
                </div>
              </div>

              <button
                onClick={() =>
                  setLinkCode(`NV-${Math.floor(1000 + Math.random() * 9000)}`)
                }
                className="w-full py-2.5 rounded-xl cursor-pointer"
                style={{
                  backgroundColor: colors.primary,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                إعادة إنشاء الرمز
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nova Premium Sheet */}
      {showPremium && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center">
          <div
            onClick={() => setShowPremium(false)}
            className="fixed inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.76)" }}
          />
          <div
            className="relative z-10 w-full max-w-[480px] p-5 pb-8"
            style={{
              backgroundColor: "#0B111E",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderTop: "2px solid #0EA5E9",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowPremium(false)}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                <X size={16} color="#fff" />
              </button>
              <span
                style={{ fontSize: 16, fontWeight: 800, color: "#38BDF8" }}
              >
                Nova Premium 💎
              </span>
              <div style={{ width: 36 }} />
            </div>

            <div
              className="p-4 rounded-2xl mb-3 flex items-center justify-between"
              style={{
                backgroundColor: "rgba(14, 165, 233, 0.10)",
                border: "1px solid rgba(56, 189, 248, 0.32)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                  الاشتراك الشهري
                </div>
                <div
                  style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}
                >
                  باقة Premium الوحيدة · بدون إعلانات + جودة أعلى
                </div>
              </div>
              <div className="text-center">
                <div
                  style={{ fontSize: 24, fontWeight: 800, color: "#38BDF8" }}
                >
                  1.99$
                </div>
                <div style={{ fontSize: 9, color: "#BAE6FD" }}>شهرياً</div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPremium(false);
                showToast("تم فتح طلب الاشتراك عبر تيليجرام");
              }}
              className="w-full py-4 rounded-2xl cursor-pointer"
              style={{
                backgroundColor: "rgba(14, 165, 233, 0.18)",
                border: "1.5px solid rgba(56, 189, 248, 0.40)",
                color: "#38BDF8",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              اشترك الآن عبر تيليجرام
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   7. TvLinkScreen (100% 1:1 from artifacts/nova-mobile/app/tv-link.tsx)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaTvLinkScreen({
  colors,
  onBack,
}: {
  colors: ThemePalette;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [linkedSuccess, setLinkedSuccess] = useState(false);

  const normalizedCode = useMemo(
    () => code.replace(/[^0-9]/g, "").slice(0, 6),
    [code]
  );

  const handleCompleteLink = () => {
    if (normalizedCode.length !== 6) {
      setErrorText("أدخل الرمز المكوّن من 6 أرقام كما يظهر في الإعدادات");
      return;
    }
    setSubmitting(true);
    setErrorText(null);
    setTimeout(() => {
      setSubmitting(false);
      setLinkedSuccess(true);
      setTimeout(() => {
        onBack();
      }, 900);
    }, 600);
  };

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar select-none"
      style={{
        backgroundColor: colors.background,
        paddingLeft: 18,
        paddingRight: 18,
        paddingTop: 14,
        paddingBottom: 28,
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-20 shrink-0 flex items-center justify-between"
        style={{ marginBottom: 18, backgroundColor: colors.background, paddingBottom: 8 }}
      >
        <button
          onClick={onBack}
          aria-label="رجوع"
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <ChevronRight size={20} color={colors.textPrimary} />
        </button>

        <h1
          className="m-0 text-center"
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: colors.textPrimary,
          }}
        >
          ربط الحساب
        </h1>

        <div style={{ width: 38 }} />
      </div>

      {/* Hero Box */}
      <div
        className="flex items-start gap-3"
        style={{
          borderRadius: 22,
          border: `1px solid ${colors.accentBorder}`,
          backgroundColor: colors.accentSurface,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.surfaceElevated,
          }}
        >
          <Link2 size={22} color={colors.accent} />
        </div>
        <div className="flex-1 text-right">
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: colors.textPrimary,
            }}
          >
            ربط هذا الجهاز بالحساب
          </div>
          <p
            className="m-0"
            style={{
              fontSize: 12,
              lineHeight: "20px",
              marginTop: 4,
              color: colors.textSecondary,
            }}
          >
            اكتب الرمز الظاهر في هاتفك المسجل الدخول داخل الإعدادات. صالح لمدة
            10 دقائق ولا يشارك جلسة Google نفسها.
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          borderRadius: 22,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 10,
            color: colors.textPrimary,
            textAlign: "right",
          }}
        >
          رمز الربط المكوّن من 6 أرقام
        </div>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={normalizedCode}
          onChange={(e) => {
            setCode(e.target.value);
            if (errorText) setErrorText(null);
          }}
          placeholder="000000"
          className="w-full outline-none"
          style={{
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.input,
            color: colors.textPrimary,
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 16,
            paddingRight: 16,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 8,
            textAlign: "center",
          }}
        />

        {errorText && (
          <div
            style={{
              borderRadius: 14,
              border: `1px solid ${colors.destructiveBorder}`,
              backgroundColor: colors.destructiveSurface,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 10,
              paddingBottom: 10,
              marginTop: 12,
              color: colors.destructive,
              fontSize: 12,
              lineHeight: "19px",
              textAlign: "right",
            }}
          >
            {errorText}
          </div>
        )}

        {linkedSuccess && (
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(16,185,129,0.4)",
              backgroundColor: "rgba(16,185,129,0.14)",
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 10,
              paddingBottom: 10,
              marginTop: 12,
              color: colors.success,
              fontSize: 12,
              fontWeight: 700,
              textAlign: "right",
            }}
          >
            تم ربط الجهاز بالحساب بنجاح ✓
          </div>
        )}

        <button
          onClick={handleCompleteLink}
          disabled={submitting}
          className="w-full flex items-center justify-center cursor-pointer"
          style={{
            borderRadius: 16,
            paddingTop: 14,
            paddingBottom: 14,
            marginTop: 14,
            backgroundColor: colors.primary,
            color: colors.buttonText,
            fontSize: 14,
            fontWeight: 800,
            opacity: submitting ? 0.65 : 1,
          }}
        >
          {submitting ? "جاري الربط..." : "ربط الجهاز بالرمز"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   8. AwDubbedDetailScreen (100% 1:1 from artifacts/nova-mobile/app/aw-dubbed/[key].tsx)
      Used for: أنيميشن مدبلج ومترجم
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaAwDubbedDetailScreen({
  series,
  colors,
  onBack,
  onSelectEpisode,
}: {
  series: AwDubbedSeries;
  colors: ThemePalette;
  onBack: () => void;
  onSelectEpisode: (
    series: AwDubbedSeries,
    season: AwDubbedSeason,
    episodeNumber: number
  ) => void;
}) {
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const seasons = series.seasons;
  const curSeason = seasons[selectedSeasonIdx] || seasons[0];
  const episodes = curSeason?.episodes || [];
  const displayPoster = curSeason?.poster || series.poster;
  const displayTitle = series.titleAr || series.title;

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 overflow-y-auto nova-ep-scroll select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 48 }}
    >
      {/* ── Sticky Header (exact styles.header from aw-dubbed/[key].tsx lines 67-75) ── */}
      <div
        className="sticky top-0 z-20 shrink-0 flex items-center"
        style={{
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 8,
          paddingBottom: 8,
          gap: 10,
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={onBack}
          aria-label="رجوع"
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.input,
            border: `1px solid ${colors.border}`,
          }}
        >
          <ChevronRight size={20} color={colors.textSecondary} />
        </button>

        <h1
          className="m-0 flex-1 line-clamp-1"
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: colors.textPrimary,
            textAlign: "center",
          }}
        >
          {displayTitle}
        </h1>

        <div style={{ width: 36 }} />
      </div>

      {/* ── Hero Row (exact styles.heroRow: height 200, aw-dubbed/[key].tsx lines 91-118) ── */}
      <div
        className="relative w-full shrink-0"
        style={{ height: 200, marginBottom: 16 }}
      >
        <img
          src={displayPoster}
          alt={displayTitle}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(9,9,11,0.9))",
          }}
        />
        <div
          className="absolute flex flex-col"
          style={{
            bottom: 12,
            right: 12,
            left: 12,
            gap: 4,
          }}
        >
          <div
            className="line-clamp-2"
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#fff",
              textAlign: "right",
            }}
          >
            {displayTitle}
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center"
              style={{
                gap: 5,
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 3,
                paddingBottom: 3,
                borderRadius: 8,
                backgroundColor: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <Volume2 size={11} color="#10B981" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#10B981",
                }}
              >
                {series.badge === "مترجم" ? "مترجم عربي" : "مدبلج عربي"}
              </span>
            </div>
          </div>

          {episodes.length > 0 && (
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                textAlign: "right",
              }}
            >
              {episodes.length} حلقة
            </span>
          )}
        </div>
      </div>

      {/* ── Season Tabs (High-contrast in both Dark & Light/White themes) ── */}
      {seasons.length > 1 && (
        <div
          className="flex overflow-x-auto no-scrollbar"
          style={{
            paddingLeft: 14,
            paddingRight: 14,
            gap: 8,
            marginBottom: 14,
          }}
        >
          {seasons.map((s, idx) => {
            const active = idx === selectedSeasonIdx;
            return (
              <button
                key={s.key}
                onClick={() => setSelectedSeasonIdx(idx)}
                className="shrink-0 cursor-pointer transition-all"
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 7,
                  paddingBottom: 7,
                  borderRadius: 20,
                  backgroundColor: active
                    ? "#10B981"
                    : colors.surfaceElevated,
                  border: `1px solid ${
                    active ? "#10B981" : colors.border
                  }`,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: active ? "#FFFFFF" : colors.textPrimary,
                  }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Section Title (High-contrast in both Dark & White themes) ── */}
      {episodes.length > 0 && (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: colors.textSecondary,
            paddingLeft: 14,
            paddingRight: 14,
            marginBottom: 8,
            textAlign: "right",
          }}
        >
          الحلقات ({episodes.length})
        </div>
      )}

      {/* ── Episodes List (Theme-aware cards so episode numbers & titles are 100% visible in White theme) ── */}
      <div className="flex flex-col">
        {episodes.map((ep) => (
          <div
            key={ep.number}
            onClick={() => onSelectEpisode(series, curSeason, ep.number)}
            className="nova-ep-row flex items-center cursor-pointer active:opacity-80"
            style={{
              gap: 12,
              marginLeft: 14,
              marginRight: 14,
              marginBottom: 8,
              padding: 10,
              borderRadius: 12,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            {/* Thumbnail 80x52 */}
            <div
              className="relative shrink-0 overflow-hidden"
              style={{
                width: 80,
                height: 52,
                borderRadius: 8,
                backgroundColor: "#141419",
              }}
            >
              <img
                src={displayPoster}
                alt={`الحلقة ${ep.number}`}
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "rgba(16,185,129,0.88)",
                  }}
                >
                  <Play size={11} color="#fff" fill="#fff" />
                </div>
              </div>
              <div
                className="absolute"
                style={{
                  bottom: 3,
                  right: 4,
                  backgroundColor: "rgba(0,0,0,0.78)",
                  borderRadius: 4,
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingTop: 1,
                  paddingBottom: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  {ep.number}
                </span>
              </div>
            </div>

            {/* epInfo */}
            <div className="flex-1 flex flex-col" style={{ gap: 2 }}>
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: colors.textPrimary,
                  textAlign: "right",
                }}
              >
                الحلقة {ep.number}
              </span>
              {curSeason && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: colors.textMuted,
                    textAlign: "right",
                  }}
                >
                  {curSeason.label}
                </span>
              )}
            </div>

            <ChevronLeft size={16} color={colors.textMuted} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   9. DubbedDetailScreen (100% 1:1 from artifacts/nova-mobile/app/dubbed/[id].tsx)
      Used for: مسلسلات سبيستون (provider="sp") & كرتون مدبلج (provider="ct")
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaDubbedDetailScreen({
  series,
  colors,
  onBack,
  onSelectEpisode,
}: {
  series: DubbedSeries;
  colors: ThemePalette;
  onBack: () => void;
  onSelectEpisode: (
    series: DubbedSeries,
    season: DubbedSeason,
    episodeNumber: number
  ) => void;
}) {
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const [seasonDropOpen, setSeasonDropOpen] = useState(false);

  const seasons = series.seasons;
  const curSeason = seasons[selectedSeasonIdx] || seasons[0];
  const episodes = curSeason?.episodes || [];
  const isSpacetoon = series.provider === "sp";

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 overflow-y-auto nova-ep-scroll select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 48 }}
    >
      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-20 shrink-0 flex items-center justify-between"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={onBack}
          aria-label="رجوع"
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.input,
            border: `1px solid ${colors.border}`,
          }}
        >
          <ChevronRight size={22} color={colors.textPrimary} />
        </button>

        <h1
          className="m-0 flex-1 line-clamp-1"
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: colors.textPrimary,
            textAlign: "center",
            marginLeft: 8,
            marginRight: 8,
          }}
        >
          {series.title}
        </h1>

        <div style={{ width: 36 }} />
      </div>

      {/* ── Hero Row (Theme-aware card so title & episode count are 100% visible in White theme) ── */}
      <div
        className="flex"
        style={{
          gap: 14,
          marginLeft: 16,
          marginRight: 16,
          marginTop: 14,
          marginBottom: 14,
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
        }}
      >
        <img
          src={series.poster}
          alt={series.title}
          className="shrink-0 object-cover"
          style={{
            width: 90,
            aspectRatio: "2/3",
            borderRadius: 12,
            backgroundColor: "#141419",
          }}
        />

        <div
          className="flex-1 flex flex-col justify-center"
          style={{ gap: 8 }}
        >
          <div
            className="line-clamp-3"
            style={{
              fontSize: 16.5,
              fontWeight: 900,
              color: colors.textPrimary,
              lineHeight: "23px",
              textAlign: "right",
            }}
          >
            {series.title}
          </div>

          <div className="flex items-center">
            <div
              className="flex items-center"
              style={{
                gap: 5,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 20,
                backgroundColor: colors.accentSurface,
                border: `1px solid ${colors.accentBorder}`,
              }}
            >
              <Volume2 size={11} color={colors.textPrimary} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: colors.textPrimary,
                }}
              >
                {isSpacetoon ? "سبيستون" : "مدبلج عربي"}
              </span>
            </div>
          </div>

          {episodes.length > 0 && (
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: colors.textSecondary,
                textAlign: "right",
              }}
            >
              {episodes.length} حلقة
            </span>
          )}

          {/* Season Selector (dropdown if > 1 season, label if 1 season) */}
          {seasons.length > 1 ? (
            <div className="relative">
              <button
                onClick={() => setSeasonDropOpen((o) => !o)}
                className="flex items-center justify-between cursor-pointer"
                style={{
                  gap: 6,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 6,
                  paddingBottom: 6,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: colors.textPrimary,
                  }}
                >
                  {curSeason?.label}
                </span>
                {seasonDropOpen ? (
                  <ChevronUp size={14} color={colors.textPrimary} />
                ) : (
                  <ChevronDown size={14} color={colors.textPrimary} />
                )}
              </button>

              {seasonDropOpen && (
                <div
                  className="mt-1 overflow-hidden"
                  style={{
                    borderRadius: 10,
                    backgroundColor: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {seasons.map((s, idx) => {
                    const active = idx === selectedSeasonIdx;
                    return (
                      <button
                        key={s.key}
                        onClick={() => {
                          setSelectedSeasonIdx(idx);
                          setSeasonDropOpen(false);
                        }}
                        className="w-full flex items-center justify-between cursor-pointer"
                        style={{
                          paddingLeft: 14,
                          paddingRight: 14,
                          paddingTop: 10,
                          paddingBottom: 10,
                          backgroundColor: active
                            ? colors.accentSurface
                            : "transparent",
                          borderBottom:
                            idx < seasons.length - 1
                              ? `1px solid ${colors.border}`
                              : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: active ? 800 : 600,
                            color: active
                              ? colors.textPrimary
                              : colors.textSecondary,
                          }}
                        >
                          {s.label}
                        </span>
                        {active && <Check size={13} color={colors.textPrimary} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : seasons.length === 1 ? (
            <span
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                fontWeight: 700,
                textAlign: "right",
              }}
            >
              {seasons[0].label}
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Episodes Section Header ── */}
      {episodes.length > 0 && (
        <div
          className="flex items-center"
          style={{
            gap: 8,
            paddingLeft: 16,
            paddingRight: 16,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 4,
              height: 20,
              borderRadius: 2,
              backgroundColor: colors.primary,
            }}
          />
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: colors.textPrimary,
            }}
          >
            الحلقات ({episodes.length})
          </span>
        </div>
      )}

      {/* ── Episode Rows (Theme-aware cards so episode numbers are 100% legible in White theme) ── */}
      <div className="flex flex-col">
        {episodes.map((ep) => (
          <div
            key={ep.number}
            onClick={() => onSelectEpisode(series, curSeason, ep.number)}
            className="nova-ep-row flex items-center cursor-pointer active:opacity-80"
            style={{
              gap: 12,
              marginLeft: 16,
              marginRight: 16,
              marginBottom: 8,
              padding: 10,
              borderRadius: 12,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            {/* 16:9 Thumbnail (width: 90) */}
            <div
              className="relative shrink-0 overflow-hidden"
              style={{
                width: 90,
                aspectRatio: "16/9",
                borderRadius: 8,
                backgroundColor: "#141419",
              }}
            >
              <img
                src={series.poster}
                alt={`الحلقة ${ep.number}`}
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: "rgba(0,0,0,0.65)",
                  }}
                >
                  <Play size={12} color="#fff" fill="#fff" />
                </div>
              </div>
              <div
                className="absolute"
                style={{
                  bottom: 3,
                  right: 4,
                  backgroundColor: "rgba(0,0,0,0.78)",
                  borderRadius: 4,
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingTop: 1,
                  paddingBottom: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  {ep.number}
                </span>
              </div>
            </div>

            {/* epInfo */}
            <div className="flex-1 flex flex-col" style={{ gap: 2 }}>
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: colors.textPrimary,
                  textAlign: "right",
                }}
              >
                {series.isMovie ? "مشاهدة الفيلم" : `الحلقة ${ep.number}`}
              </span>
              {curSeason && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: colors.textMuted,
                    textAlign: "right",
                  }}
                >
                  {curSeason.label}
                </span>
              )}
            </div>

            <ChevronLeft size={16} color={colors.textMuted} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   10. DubbedWatchScreen (100% 1:1 from artifacts/nova-mobile/app/dubbed/watch.tsx)
       Direct server extraction + RiftPlayer for Spacetoon & Arabic Toons
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaDubbedWatchScreen({
  series,
  season,
  episodeNumber,
  colors,
  onBack,
  onChangeEpisode,
}: {
  series: DubbedSeries;
  season: DubbedSeason;
  episodeNumber: number;
  colors: ThemePalette;
  onBack: () => void;
  onChangeEpisode: (ep: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progressSec, setProgressSec] = useState(145);
  const durationSec = 1380;
  const videoRef = useRef<HTMLVideoElement | null>(null);


  const totalEps = season.episodes.length || 26;
  const canGoPrev = episodeNumber > 1;
  const canGoNext = episodeNumber < totalEps;

  const formatPlayerTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? "0" : ""}${r}`;
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex-1 flex flex-col select-none"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="flex items-center"
          style={{
            gap: 10,
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 10,
            paddingBottom: 10,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.input,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ChevronRight size={22} color={colors.textPrimary} />
          </button>
          <div className="flex-1">
            <div
              className="line-clamp-1"
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: colors.textPrimary,
                textAlign: "right",
              }}
            >
              {series.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#A78BFA",
                marginTop: 1,
                textAlign: "right",
              }}
            >
              {season.label ? `${season.label} · ` : ""}الحلقة {episodeNumber}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <div
            className="animate-spin"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              border: "3px solid rgba(124,58,237,0.2)",
              borderTopColor: "#7C3AED",
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            جاري تحميل الحلقة...
          </span>
        </div>
      </div>
    );
  }

  const videoUrl =
    season.episodes.find((e) => e.number === episodeNumber)?.videoUrl ||
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const dubbedServers = [
    {
      id: "dub-main-720p",
      label: series.provider === "sp" ? "SP · 720P" : "DUB · 720P",
      sublabel: "سيرفر الدبلجة الأساسي فائق السرعة",
      badge: "رئيسي",
      site: series.provider || "dubbed",
      quality: "720p",
      videoUrl,
      type: "mp4" as const,
    },
    {
      id: "dub-backup-480p",
      label: series.provider === "sp" ? "SP-2 · 480P" : "DUB-2 · 480P",
      sublabel: "سيرفر احتياطي مستقر للشبكات الضعيفة",
      badge: "احتياطي",
      site: series.provider || "dubbed",
      quality: "480p",
      videoUrl,
      type: "mp4" as const,
    },
  ];

  return (
    <NovaInternalVideoPlayer
      title={series.title}
      subtitle={`${season.label} · الحلقة ${episodeNumber}`}
      poster={series.poster}
      videoUrl={videoUrl}
      episodeNumber={episodeNumber}
      totalEpisodes={season.episodes.length}
      episodes={season.episodes.map((e) => ({
        number: e.number,
        title: e.title || `الحلقة ${e.number}`,
        duration: "24:00",
      }))}
      servers={dubbedServers}
      activeServerId={dubbedServers[0].id}
      initialQuality="720p HD"
      audioModeLabel={
        series.provider === "sp" ? "سبيستون عربي" : "مدبلج عربي"
      }
      canGoPrev={canGoPrev}
      canGoNext={canGoNext}
      onBack={onBack}
      onChangeEpisode={onChangeEpisode}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   11. StardimaTitleScreen (100% 1:1 from artifacts/nova-mobile/app/stardima-title.tsx)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaStardimaTitleScreen({
  series,
  colors,
  onBack,
  onSelectEpisode,
}: {
  series: StardimaSeries;
  colors: ThemePalette;
  onBack: () => void;
  onSelectEpisode: (
    series: StardimaSeries,
    episode: StardimaEpisodeItem
  ) => void;
}) {
  const [selectedSeason, setSelectedSeason] = useState(
    series.seasons[0]?.season_number || 1
  );

  const currentSeasonObj =
    series.seasons.find((s) => s.season_number === selectedSeason) ||
    series.seasons[0];
  const episodes = currentSeasonObj?.episodes || [];

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 overflow-y-auto nova-ep-scroll select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 42 }}
    >
      {/* Sticky Header (exact styles.header from stardima-title.tsx lines 166-176) */}
      <div
        className="sticky top-0 z-20 shrink-0 flex items-center"
        style={{
          gap: 10,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={onBack}
          aria-label="رجوع"
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: colors.input,
            border: `1px solid ${colors.border}`,
          }}
        >
          <ChevronRight size={20} color={colors.textSecondary} />
        </button>

        <h1
          className="m-0 flex-1 line-clamp-1"
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: colors.textPrimary,
            textAlign: "right",
          }}
        >
          {series.title_ar}
        </h1>
      </div>

      {/* Hero Card (exact styles.hero from stardima-title.tsx lines 215-269) */}
      <div
        className="flex"
        style={{
          marginLeft: 16,
          marginRight: 16,
          marginTop: 14,
          padding: 14,
          borderRadius: 18,
          gap: 14,
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
        }}
      >
        <img
          src={series.poster_url}
          alt={series.title_ar}
          className="shrink-0 object-cover"
          style={{
            width: 96,
            height: 142,
            borderRadius: 14,
            backgroundColor: "#141419",
          }}
        />

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                lineHeight: "26px",
                color: colors.textPrimary,
                textAlign: "right",
              }}
            >
              {series.title_ar}
            </div>
            <div
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {[
                series.media_type === "movie" ? "فيلم" : "مسلسل",
                series.release_year,
                `${series.episode_count} حلقة مسجلة`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2.5">
            <span
              style={{
                borderRadius: 999,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 5,
                paddingBottom: 5,
                backgroundColor: colors.accentSurface,
                border: `1px solid ${colors.accentBorder}`,
                color: colors.accent,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {series.badge}
            </span>
            <span
              style={{
                borderRadius: 999,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 5,
                paddingBottom: 5,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              مؤكد
            </span>
          </div>
        </div>
      </div>

      {/* Seasons Rail (exact styles.seasonBtn from stardima-title.tsx lines 271-304) */}
      {series.seasons.length > 1 && (
        <div
          className="flex overflow-x-auto no-scrollbar"
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 14,
            paddingBottom: 8,
            gap: 8,
          }}
        >
          {series.seasons.map((season) => {
            const active = selectedSeason === season.season_number;
            return (
              <button
                key={season.season_number}
                onClick={() => setSelectedSeason(season.season_number)}
                className="shrink-0 cursor-pointer"
                style={{
                  borderRadius: 12,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 9,
                  paddingBottom: 9,
                  backgroundColor: active
                    ? colors.accentSurface
                    : colors.input,
                  border: `1px solid ${
                    active ? colors.accent : colors.border
                  }`,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? colors.accent : colors.textSecondary,
                  }}
                >
                  الموسم {season.season_number} · {season.episode_count} حلقة
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Episodes List (exact styles.episodeRow from stardima-title.tsx lines 306-374) */}
      <div
        className="flex flex-col"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
          gap: 10,
        }}
      >
        {episodes.map((ep) => (
          <div
            key={ep.provider_episode_id}
            onClick={() => onSelectEpisode(series, ep)}
            className="nova-ep-row flex items-center justify-between cursor-pointer active:opacity-80"
            style={{
              borderRadius: 14,
              padding: 13,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              gap: 12,
            }}
          >
            <div className="flex-1 flex items-center gap-3">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: colors.accentSurface,
                  border: `1px solid ${colors.accentBorder}`,
                }}
              >
                <Play size={16} color={colors.accent} fill={colors.accent} />
              </div>

              <div className="flex-1">
                <div
                  className="line-clamp-2"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    textAlign: "right",
                  }}
                >
                  {ep.title_raw}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    marginTop: 2,
                    textAlign: "right",
                  }}
                >
                  الموسم {ep.season_number} · الحلقة {ep.episode_number} · حلقة
                  مفهرسة
                </div>
              </div>
            </div>

            <ChevronLeft size={18} color={colors.textMuted} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   12. StardimaServersScreen (100% 1:1 from artifacts/nova-mobile/app/stardima-servers.tsx)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaStardimaServersScreen({
  series,
  episode,
  colors,
  onBack,
  onSelectServer,
}: {
  series: StardimaSeries;
  episode: StardimaEpisodeItem;
  colors: ThemePalette;
  onBack: () => void;
  onSelectServer: (
    series: StardimaSeries,
    episode: StardimaEpisodeItem,
    quality: string,
    serverLabel: string,
    videoUrl: string
  ) => void;
}) {
  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 42 }}
    >
      {/* Sticky Header (exact styles.header from stardima-servers.tsx lines 113-131) */}
      <div
        className="sticky top-0 z-20 shrink-0 flex items-center"
        style={{
          gap: 10,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={onBack}
          aria-label="رجوع"
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: colors.input,
            border: `1px solid ${colors.border}`,
          }}
        >
          <ChevronRight size={20} color={colors.textSecondary} />
        </button>

        <div className="flex-1">
          <div
            className="line-clamp-1"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: colors.textPrimary,
              textAlign: "right",
            }}
          >
            {series.title_ar}
          </div>
          <div
            className="line-clamp-1"
            style={{
              fontSize: 11,
              color: colors.textMuted,
              marginTop: 1,
              textAlign: "right",
            }}
          >
            الموسم {episode.season_number} · الحلقة {episode.episode_number}
          </div>
        </div>
      </div>

      {/* Content (stardima-servers.tsx lines 155-225) */}
      <div
        className="flex flex-col"
        style={{
          padding: 16,
          gap: 14,
        }}
      >
        <p
          className="m-0"
          style={{
            fontSize: 13,
            lineHeight: "20px",
            color: colors.textSecondary,
            textAlign: "right",
          }}
        >
          اختر الجودة ثم السيرفر. سيُفحص السيرفر المحدد وتُستخرج وصلة التشغيل
          قبل فتح المشغل.
        </p>

        {episode.qualities.map((group) => (
          <div
            key={group.quality}
            className="flex flex-col"
            style={{
              borderRadius: 16,
              padding: 14,
              gap: 10,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: colors.textPrimary,
                }}
              >
                الجودة: {group.quality}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                }}
              >
                {group.servers.length} سيرفر
              </span>
            </div>

            {group.servers.map((server) => (
              <div
                key={`${group.quality}-${server.server_key}`}
                onClick={() =>
                  onSelectServer(
                    series,
                    episode,
                    group.quality,
                    server.label,
                    server.videoUrl
                  )
                }
                className="flex items-center justify-between cursor-pointer active:opacity-80"
                style={{
                  borderRadius: 13,
                  padding: 12,
                  gap: 10,
                  backgroundColor: colors.input,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex-1 flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: server.verified
                        ? "rgba(16,185,129,0.14)"
                        : colors.accentSurface,
                    }}
                  >
                    {server.verified ? (
                      <CheckCircle2 size={16} color="#10B981" />
                    ) : (
                      <PlayCircle size={16} color={colors.accent} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div
                      className="line-clamp-1"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: colors.textPrimary,
                        textAlign: "right",
                      }}
                    >
                      {server.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginTop: 2,
                        textAlign: "right",
                      }}
                    >
                      {server.verified
                        ? "فحص سابق ناجح — سيُعاد التحقق قبل التشغيل"
                        : "يتحقق عند الضغط قبل بدء التشغيل"}
                    </div>
                  </div>
                </div>

                <ChevronLeft size={18} color={colors.textMuted} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   13. StardimaPlayerScreen (100% 1:1 from artifacts/nova-mobile/app/stardima-player.tsx)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaStardimaPlayerScreen({
  series,
  episode,
  quality,
  serverLabel,
  videoUrl,
  colors,
  onBack,
}: {
  series: StardimaSeries;
  episode: StardimaEpisodeItem;
  quality: string;
  serverLabel: string;
  videoUrl: string;
  colors: ThemePalette;
  onBack: () => void;
}) {
  const [resolving, setResolving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progressSec, setProgressSec] = useState(210);
  const durationSec = 1380;
  const videoRef = useRef<HTMLVideoElement | null>(null);


  const formatPlayerTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? "0" : ""}${r}`;
  };

  if (resolving) {
    return (
      <div
        dir="rtl"
        className="flex-1 flex flex-col select-none"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="flex items-center"
          style={{
            gap: 10,
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 10,
            paddingBottom: 10,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: colors.input,
              border: `1px solid ${colors.border}`,
            }}
          >
            <ChevronRight size={20} color={colors.textSecondary} />
          </button>

          <div className="flex-1">
            <div
              className="line-clamp-1"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: colors.textPrimary,
                textAlign: "right",
              }}
            >
              {series.title_ar}
            </div>
            <div
              style={{
                fontSize: 11,
                color: colors.textMuted,
                marginTop: 1,
                textAlign: "right",
              }}
            >
              الموسم {episode.season_number} · الحلقة {episode.episode_number} ·{" "}
              {quality}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <div
            className="animate-spin"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              border: "3px solid rgba(139,92,246,0.2)",
              borderTopColor: colors.primary,
            }}
          />
          <p
            className="m-0 text-center"
            style={{
              fontSize: 13,
              lineHeight: "20px",
              color: colors.textSecondary,
            }}
          >
            جارٍ الاستعلام عن جودة {quality} في الخادم المختار واستخراج رابط
            الوسائط...
          </p>
        </div>
      </div>
    );
  }

  const stardimaSeasonEpisodes =
    series.seasons.find((s) => s.season_number === episode.season_number)
      ?.episodes ||
    series.seasons[0]?.episodes ||
    [];

  const stardimaServers = [
    {
      id: `stardima-main-${quality}`,
      label: `${serverLabel || "SD-1"} · ${quality}`,
      sublabel: "سيرفر ستارديما المباشر",
      badge: "نشط",
      site: "stardima",
      quality: quality || "720p",
      videoUrl,
      type: "mp4" as const,
    },
    {
      id: "stardima-backup-480p",
      label: "SD-Backup · 480p",
      sublabel: "سيرفر ستارديما الاحتياطي",
      badge: "احتياطي",
      site: "stardima",
      quality: "480p",
      videoUrl,
      type: "mp4" as const,
    },
  ];

  return (
    <NovaInternalVideoPlayer
      title={series.title_ar}
      subtitle={`الموسم ${episode.season_number} · الحلقة ${episode.episode_number}`}
      poster={series.poster_url}
      videoUrl={videoUrl}
      episodeNumber={episode.episode_number}
      totalEpisodes={stardimaSeasonEpisodes.length || series.episode_count || 12}
      episodes={stardimaSeasonEpisodes.map((e) => ({
        number: e.episode_number,
        title: e.title_raw || `الحلقة ${e.episode_number}`,
        duration: "24:00",
      }))}
      servers={stardimaServers}
      activeServerId={stardimaServers[0].id}
      initialQuality={quality || "720p HD"}
      audioModeLabel="مدبلج عربي"
      canGoPrev={episode.episode_number > 1}
      canGoNext={
        episode.episode_number <
        (stardimaSeasonEpisodes.length || series.episode_count || 12)
      }
      onBack={onBack}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   14. GlobalStatsScreen (الإحصائيات العالمية — 1:1 from Screenshot_20261027-165349 & 165354)
       Includes all 6 categories:
       1. أفضل الأنميات
       2. أفضل الأنميات المستمرة
       3. أفضل الأفلام
       4. أفضل المسلسلات
       5. أفضل الاوفا
       6. أفضل الاونا
   ══════════════════════════════════════════════════════════════════════════ */
type GlobalStatsTabId =
  | "top_all"
  | "top_airing"
  | "top_movies"
  | "top_series"
  | "top_ova"
  | "top_ona";

interface GlobalStatItem {
  id: string;
  title: string;
  titleAr: string;
  year: number;
  typeLabel: "مسلسل" | "فيلم" | "أوفا" | "أونا";
  poster: string;
  score: number;
}

const GLOBAL_STATS_DATA: Record<GlobalStatsTabId, GlobalStatItem[]> = {
  top_all: [
    {
      id: "frieren",
      title: "Sousou no Frieren",
      titleAr: "فريرن: ما وراء نهاية الرحلة",
      year: 2023,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg",
      score: 9.3,
    },
    {
      id: "fmab",
      title: "Fullmetal Alchemist: Brotherhood",
      titleAr: "الكيميائي المعدني الكامل: الأخوة",
      year: 2009,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-KJTQz9AIm6Wk.jpg",
      score: 9.2,
    },
    {
      id: "solo-leveling",
      title: "Re:Zero kara Hajimeru Isekai Seikatsu",
      titleAr: "ري:زيرو — بدء الحياة في عالم آخر",
      year: 2026,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      score: 9.0,
    },
    {
      id: "steins-gate",
      title: "Steins;Gate",
      titleAr: "بوابة شتاينز",
      year: 2011,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzQSkKxT.jpg",
      score: 9.1,
    },
    {
      id: "jujutsu-kaisen",
      title: "Chainsaw Man Movie: Reze-hen",
      titleAr: "رجل المنشار: فصل ريزي",
      year: 2025,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
      score: 9.0,
    },
    {
      id: "one-punch-man",
      title: "Gintama°",
      titleAr: "غينتاما",
      year: 2015,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg",
      score: 9.1,
    },
    {
      id: "attack-on-titan",
      title: "Shingeki no Kyojin Season 3 Part 2",
      titleAr: "هجوم العمالقة",
      year: 2019,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-LaZYFkmhinfB.jpg",
      score: 9.1,
    },
    {
      id: "demon-slayer",
      title: "Gintama: The Final",
      titleAr: "غينتاما: النهاية",
      year: 2021,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
      score: 9.0,
    },
    {
      id: "hunter-x-hunter",
      title: "Hunter x Hunter (2011)",
      titleAr: "القناص",
      year: 2011,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png",
      score: 9.0,
    },
    {
      id: "bleach-tybw",
      title: "Bleach: Sennen Kessen-hen",
      titleAr: "بليتش: حرب الألف سنة الدموية",
      year: 2022,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg",
      score: 9.0,
    },
    {
      id: "kimi-no-na-wa",
      title: "Kimi no Na wa.",
      titleAr: "اسمك (Your Name)",
      year: 2016,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21519-XIr3PeczUjjF.png",
      score: 8.9,
    },
    {
      id: "koe-no-katachi",
      title: "Koe no Katachi",
      titleAr: "صوت صامت",
      year: 2016,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20954-UMb6Kl7ZL8Ke.jpg",
      score: 8.9,
    },
  ],
  top_airing: [
    {
      id: "one-piece",
      title: "One Piece",
      titleAr: "ون بيس",
      year: 1999,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
      score: 8.9,
    },
    {
      id: "solo-leveling",
      title: "Ore dake Level Up na Ken Season 2",
      titleAr: "سولو ليفلينغ الموسم الثاني",
      year: 2025,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      score: 8.9,
    },
    {
      id: "bleach-tybw",
      title: "Bleach: Sennen Kessen-hen - Soukoku-tan",
      titleAr: "بليتش: حرب الألف سنة الدموية ج3",
      year: 2024,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg",
      score: 8.9,
    },
    {
      id: "detective-conan",
      title: "Detective Conan",
      titleAr: "المحقق كونان",
      year: 1996,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx235-MyYT7K3chBdO.jpg",
      score: 8.8,
    },
    {
      id: "frieren",
      title: "Sousou no Frieren",
      titleAr: "فريرن",
      year: 2024,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg",
      score: 9.3,
    },
    {
      id: "demon-slayer",
      title: "Kimetsu no Yaiba: Hashira Geiko-hen",
      titleAr: "قاتل الشياطين: تدريب الهاشيرا",
      year: 2024,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
      score: 8.7,
    },
  ],
  top_movies: [
    {
      id: "kimi-no-na-wa",
      title: "Kimi no Na wa.",
      titleAr: "اسمك (Your Name)",
      year: 2016,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21519-XIr3PeczUjjF.png",
      score: 9.0,
    },
    {
      id: "koe-no-katachi",
      title: "Koe no Katachi",
      titleAr: "صوت صامت (A Silent Voice)",
      year: 2016,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20954-UMb6Kl7ZL8Ke.jpg",
      score: 8.9,
    },
    {
      id: "chainsaw-man-reze",
      title: "Chainsaw Man Movie: Reze-hen",
      titleAr: "فيلم رجل المنشار: فصل ريزي",
      year: 2025,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
      score: 9.0,
    },
    {
      id: "demon-slayer-mugen",
      title: "Kimetsu no Yaiba: Mugen Ressha-hen",
      titleAr: "قاتل الشياطين: قطار اللانهاية",
      year: 2020,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
      score: 8.7,
    },
    {
      id: "solo-leveling-reawakening",
      title: "Ore dake Level Up na Ken: ReAwakening",
      titleAr: "فيلم سولو ليفلينغ",
      year: 2024,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      score: 8.8,
    },
    {
      id: "aot-last-attack",
      title: "Shingeki no Kyojin: The Last Attack",
      titleAr: "فيلم هجوم العمالقة: الهجوم الأخير",
      year: 2024,
      typeLabel: "فيلم",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-LaZYFkmhinfB.jpg",
      score: 8.9,
    },
  ],
  top_series: [
    {
      id: "frieren",
      title: "Sousou no Frieren",
      titleAr: "فريرن: ما وراء نهاية الرحلة",
      year: 2023,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg",
      score: 9.3,
    },
    {
      id: "fmab",
      title: "Fullmetal Alchemist: Brotherhood",
      titleAr: "الكيميائي المعدني الكامل: الأخوة",
      year: 2009,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-KJTQz9AIm6Wk.jpg",
      score: 9.2,
    },
    {
      id: "steins-gate",
      title: "Steins;Gate",
      titleAr: "بوابة شتاينز",
      year: 2011,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzQSkKxT.jpg",
      score: 9.1,
    },
    {
      id: "attack-on-titan",
      title: "Shingeki no Kyojin",
      titleAr: "هجوم العمالقة",
      year: 2019,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-LaZYFkmhinfB.jpg",
      score: 9.1,
    },
    {
      id: "hunter-x-hunter",
      title: "Hunter x Hunter (2011)",
      titleAr: "القناص",
      year: 2011,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png",
      score: 9.0,
    },
    {
      id: "dragon-ball-z",
      title: "Dragon Ball Z",
      titleAr: "دراغون بول زد",
      year: 1989,
      typeLabel: "مسلسل",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx813-ZhnFNOeCU5dQ.png",
      score: 8.6,
    },
  ],
  top_ova: [
    {
      id: "mob-psycho-ova",
      title: "Mob Psycho 100: Dai Ikkai Rei Toka",
      titleAr: "موب سايكو 100 أوفا",
      year: 2019,
      typeLabel: "أوفا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21507-BICFOA3eK22E.jpg",
      score: 8.5,
    },
    {
      id: "steins-gate-ova",
      title: "Steins;Gate: Oukoubakko no Poriomania",
      titleAr: "بوابة شتاينز: أوفا",
      year: 2012,
      typeLabel: "أوفا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzQSkKxT.jpg",
      score: 8.6,
    },
    {
      id: "aot-no-regrets",
      title: "Shingeki no Kyojin: Kuinaki Sentaku",
      titleAr: "هجوم العمالقة: اختيار بلا ندم",
      year: 2014,
      typeLabel: "أوفا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg",
      score: 8.5,
    },
    {
      id: "hxh-ova",
      title: "Hunter x Hunter: Greed Island OVA",
      titleAr: "القناص: جزيرة الطمع أوفا",
      year: 2003,
      typeLabel: "أوفا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png",
      score: 8.4,
    },
    {
      id: "opm-ova",
      title: "One-Punch Man Specials",
      titleAr: "ون بنش مان أوفا",
      year: 2016,
      typeLabel: "أوفا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg",
      score: 8.3,
    },
    {
      id: "fmab-ova",
      title: "Fullmetal Alchemist: Brotherhood Specials",
      titleAr: "الكيميائي المعدني الكامل أوفا",
      year: 2009,
      typeLabel: "أوفا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-KJTQz9AIm6Wk.jpg",
      score: 8.4,
    },
  ],
  top_ona: [
    {
      id: "solo-leveling-ona",
      title: "Ore dake Level Up na Ken Special",
      titleAr: "سولو ليفلينغ أونا",
      year: 2024,
      typeLabel: "أونا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      score: 8.7,
    },
    {
      id: "jjk-ona",
      title: "Jujutsu Kaisen: Shibuya Incident ONA",
      titleAr: "جوجوتسو كايسن أونا",
      year: 2023,
      typeLabel: "أونا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
      score: 8.6,
    },
    {
      id: "frieren-ona",
      title: "Sousou no Frieren: Mini Anime ONA",
      titleAr: "فريرن أونا",
      year: 2024,
      typeLabel: "أونا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg",
      score: 8.5,
    },
    {
      id: "demon-slayer-ona",
      title: "Kimetsu Gakuen: Valentine-hen",
      titleAr: "أكاديمية قاتل الشياطين أونا",
      year: 2021,
      typeLabel: "أونا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
      score: 8.2,
    },
    {
      id: "captain-tsubasa-ona",
      title: "Captain Tsubasa: Junior Youth Arc",
      titleAr: "كابتن ماجد أونا",
      year: 2023,
      typeLabel: "أونا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
      score: 8.1,
    },
    {
      id: "one-piece-ona",
      title: "Monsters: 103 Mercies Dragon Damnation",
      titleAr: "مونسترز أونا",
      year: 2024,
      typeLabel: "أونا",
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
      score: 8.2,
    },
  ],
};

const GLOBAL_STATS_TABS: { id: GlobalStatsTabId; label: string }[] = [
  { id: "top_all", label: "أفضل الأنميات" },
  { id: "top_airing", label: "أفضل الأنميات المستمرة" },
  { id: "top_movies", label: "أفضل الأفلام" },
  { id: "top_series", label: "أفضل المسلسلات" },
  { id: "top_ova", label: "أفضل الاوفا" },
  { id: "top_ona", label: "أفضل الاونا" },
];

export function NovaGlobalStatsScreen({
  animeList,
  colors,
  onBack,
  onOpenDrawer,
  onOpenDetails,
}: {
  animeList: Anime[];
  colors: ThemePalette;
  onBack: () => void;
  onOpenDrawer: () => void;
  onOpenDetails: (anime: Anime) => void;
}) {
  const { width: gsWidth, height: gsHeight } = useTvMetrics();
  const gsCols = getGridColumnCount(gsWidth, gsHeight);
  const [activeTab, setActiveTab] = useState<GlobalStatsTabId>("top_all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const items = useMemo(() => {
    const raw = GLOBAL_STATS_DATA[activeTab] || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.titleAr.toLowerCase().includes(q) ||
        String(item.year).includes(q)
    );
  }, [activeTab, searchQuery]);

  const handleSelectItem = (item: GlobalStatItem) => {
    const found =
      animeList.find(
        (a) =>
          a.id === item.id ||
          a.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 10))
      ) || {
        ...animeList[0],
        id: item.id,
        title: item.title,
        titleAr: item.titleAr,
        coverImage: item.poster,
        bannerImage: item.poster,
        year: item.year,
        score: item.score,
      };
    onOpenDetails(found);
  };

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto nova-ep-scroll select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 48 }}
    >
      {/* ── Top App Bar + Horizontal Category Tabs (1:1 from Screenshot_20261027-165349 & 165354) ── */}
      <div
        className="sticky top-0 z-30 shrink-0"
        style={{
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 12,
            paddingBottom: 10,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="رجوع"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <ChevronRight size={20} color={colors.textPrimary} />
            </button>
            <h1
              className="m-0"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: colors.textPrimary,
              }}
            >
              الاحصائيات العالمية
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearchQuery("");
              }}
              aria-label="بحث"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              {searchOpen ? (
                <X size={18} color={colors.textPrimary} />
              ) : (
                <Search size={18} color={colors.textPrimary} />
              )}
            </button>
            <button
              onClick={onOpenDrawer}
              aria-label="القائمة"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Menu size={20} color={colors.textPrimary} />
            </button>
          </div>
        </div>

        {/* Optional inline search input */}
        {searchOpen && (
          <div className="px-3.5 pb-2.5">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Search size={15} color={colors.textMuted} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الإحصائيات العالمية..."
                className="flex-1 bg-transparent outline-none text-right"
                style={{ fontSize: 13, color: colors.textPrimary }}
              />
            </div>
          </div>
        )}

        {/* Horizontal Scrollable Category Tabs (all 6 tabs from screenshots) */}
        <div
          className="flex items-center overflow-x-auto no-scrollbar"
          style={{
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          {GLOBAL_STATS_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative shrink-0 px-3.5 py-2.5 cursor-pointer transition-colors"
              >
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: active ? 800 : 700,
                    color: active ? colors.textPrimary : colors.textSecondary,
                  }}
                >
                  {tab.label}
                </span>
                {active && (
                  <div
                    className="absolute bottom-0 left-2 right-2"
                    style={{
                      height: 3,
                      borderRadius: "3px 3px 0 0",
                      backgroundColor: "#0EA5E9",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Responsive Poster Grid with Year Overlay + Title + Format Subtitle ── */}
      <div
        className="grid gap-3 p-3.5"
        style={{ gridTemplateColumns: `repeat(${gsCols}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <div
            key={`${activeTab}-${item.id}`}
            onClick={() => handleSelectItem(item)}
            className="flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "2 / 2.95",
                borderRadius: 10,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <img
                src={item.poster}
                alt={item.title}
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: "42%",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.78) 100%)",
                }}
              />
              <span
                dir="ltr"
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 7,
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  textShadow: "0 1px 4px rgba(0,0,0,0.85)",
                }}
              >
                {item.year}
              </span>
            </div>

            <div
              dir="ltr"
              className="line-clamp-1 mt-1.5"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: colors.textPrimary,
                textAlign: "left",
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: colors.textMuted,
                textAlign: "left",
                marginTop: 1,
              }}
            >
              {item.typeLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   15. ComingSoonScreen (قادم قريبا — 1:1 from Screenshot_20261027-165400)
   ══════════════════════════════════════════════════════════════════════════ */
interface ComingSoonItem {
  id: string;
  title: string;
  titleAr: string;
  year?: number;
  typeLabel: "فيلم" | "مسلسل";
  poster: string;
}

const COMING_SOON_ITEMS: ComingSoonItem[] = [
  {
    id: "solo-leveling-movie",
    title: "Ore dake Level Up na Ken: ReAwakening",
    titleAr: "فيلم سولو ليفلينغ: الصحوة المزدوجة",
    typeLabel: "فيلم",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
  },
  {
    id: "kagurabachi",
    title: "Kagurabachi",
    titleAr: "كاغوراباتشي",
    year: 2027,
    typeLabel: "مسلسل",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg",
  },
  {
    id: "roshidere-s2",
    title: "Tokidoki Bosotto Russia-go de Dereru Tonari no Alya-san Season 2",
    titleAr: "آليا تهمس أحياناً بالروسية الموسم الثاني",
    typeLabel: "مسلسل",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg",
  },
  {
    id: "jjk-culling-game",
    title: "Jujutsu Kaisen: Shimetsu Kaiyuu",
    titleAr: "جوجوتسو كايسن: لعبة الإبادة",
    typeLabel: "مسلسل",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
  },
  {
    id: "eminence-in-shadow-movie",
    title: "Kage no Jitsuryokusha ni Naritakute!: Zankyou-hen",
    titleAr: "فيلم سيد الظل: فصل الصدى المفقود",
    typeLabel: "فيلم",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzQSkKxT.jpg",
  },
  {
    id: "blue-lock-nel",
    title: "Blue Lock: Neo Egoist League",
    titleAr: "بلو لوك: دوري الأنانية الجديد",
    typeLabel: "مسلسل",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
  },
  {
    id: "apothecary-diaries-s2",
    title: "Kusuriya no Hitorigoto Season 2",
    titleAr: "يوميات الصيدلانية الموسم الثاني",
    typeLabel: "مسلسل",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
  },
  {
    id: "gachiakuta-s2",
    title: "Gachiakuta Season 2",
    titleAr: "غاتشياكوتا الموسم الثاني",
    typeLabel: "مسلسل",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg",
  },
  {
    id: "omniscient-reader",
    title: "Omniscient Reader's Viewpoint",
    titleAr: "وجهة نظر القارئ العليم",
    typeLabel: "مسلسل",
    poster:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png",
  },
];

export function NovaComingSoonScreen({
  animeList,
  colors,
  onBack,
  onOpenDrawer,
  onOpenDetails,
}: {
  animeList: Anime[];
  colors: ThemePalette;
  onBack: () => void;
  onOpenDrawer: () => void;
  onOpenDetails: (anime: Anime) => void;
}) {
  const { width: csWidth, height: csHeight } = useTvMetrics();
  const csCols = getGridColumnCount(csWidth, csHeight);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const items = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COMING_SOON_ITEMS;
    return COMING_SOON_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.titleAr.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectItem = (item: ComingSoonItem) => {
    const found =
      animeList.find((a) =>
        a.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 8))
      ) || {
        ...animeList[0],
        id: item.id,
        title: item.title,
        titleAr: item.titleAr,
        coverImage: item.poster,
        bannerImage: item.poster,
        year: item.year || 2026,
      };
    onOpenDetails(found);
  };

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto nova-ep-scroll select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 48 }}
    >
      {/* ── Top App Bar (1:1 from Screenshot_20261027-165400) ── */}
      <div
        className="sticky top-0 z-30 shrink-0"
        style={{
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="رجوع"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <ChevronRight size={20} color={colors.textPrimary} />
            </button>
            <h1
              className="m-0"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: colors.textPrimary,
              }}
            >
              قادم قريبا
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearchQuery("");
              }}
              aria-label="بحث"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              {searchOpen ? (
                <X size={18} color={colors.textPrimary} />
              ) : (
                <Search size={18} color={colors.textPrimary} />
              )}
            </button>
            <button
              onClick={onOpenDrawer}
              aria-label="القائمة"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Menu size={20} color={colors.textPrimary} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="px-3.5 pb-2.5">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Search size={15} color={colors.textMuted} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الأنميات القادمة قريباً..."
                className="flex-1 bg-transparent outline-none text-right"
                style={{ fontSize: 13, color: colors.textPrimary }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Responsive Poster Grid (1:1 from Screenshot_20261027-165400) ── */}
      <div
        className="grid gap-3 p-3.5"
        style={{ gridTemplateColumns: `repeat(${csCols}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelectItem(item)}
            className="flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "2 / 2.95",
                borderRadius: 10,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <img
                src={item.poster}
                alt={item.title}
                decoding="async"
                className="w-full h-full object-cover"
              />
              {item.year && (
                <>
                  <div
                    className="absolute inset-x-0 bottom-0 pointer-events-none"
                    style={{
                      height: "40%",
                      background:
                        "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.78) 100%)",
                    }}
                  />
                  <span
                    dir="ltr"
                    style={{
                      position: "absolute",
                      bottom: 6,
                      right: 7,
                      fontSize: 13,
                      fontWeight: 900,
                      color: "#FFFFFF",
                      textShadow: "0 1px 4px rgba(0,0,0,0.85)",
                    }}
                  >
                    {item.year}
                  </span>
                </>
              )}
            </div>

            <div
              dir="ltr"
              className="line-clamp-1 mt-1.5"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: colors.textPrimary,
                textAlign: "left",
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: colors.textMuted,
                textAlign: "left",
                marginTop: 1,
              }}
            >
              {item.typeLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   16. LatestEpisodesScreen (أحدث الحلقات — Full Section like قادم قريبا)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaLatestEpisodesScreen({
  animeList,
  colors,
  onBack,
  onOpenDrawer,
  onPlayEpisode,
  onOpenDetails,
}: {
  animeList: Anime[];
  colors: ThemePalette;
  onBack: () => void;
  onOpenDrawer: () => void;
  onPlayEpisode: (anime: Anime, epNumber: number) => void;
  onOpenDetails: (anime: Anime) => void;
}) {
  const { width: leWidth, height: leHeight } = useTvMetrics();
  const leCols = getGridColumnCount(leWidth, leHeight);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "top">(
    "all"
  );

  const latestEntries = useMemo(() => {
    const releaseTimes = [
      "منذ 15 دقيقة",
      "منذ ساعة",
      "منذ ساعتين",
      "منذ 4 ساعات",
      "اليوم · 08:30 م",
      "اليوم · 06:00 م",
      "أمس · 11:15 م",
      "أمس · 09:00 م",
    ];
    return animeList.map((anime, idx) => {
      const epNum =
        anime.episodes && anime.episodes.length > 0
          ? anime.episodes[
              Math.min(idx % anime.episodes.length, anime.episodes.length - 1)
            ]?.number || (idx % 12) + 1
          : (idx % 12) + 1;
      const isToday = idx < 6;
      return {
        id: `latest-full-${anime.id}-${epNum}`,
        anime,
        epNumber: epNum,
        releaseTime: releaseTimes[idx % releaseTimes.length],
        isToday,
      };
    });
  }, [animeList]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return latestEntries.filter((entry) => {
      if (activeFilter === "today" && !entry.isToday) return false;
      if (activeFilter === "top" && entry.anime.score < 8.4) return false;
      if (!q) return true;
      return (
        entry.anime.title.toLowerCase().includes(q) ||
        (entry.anime.titleAr || "").toLowerCase().includes(q)
      );
    });
  }, [latestEntries, activeFilter, searchQuery]);

  const FILTER_TABS: {
    id: "all" | "today" | "top";
    label: string;
  }[] = [
    { id: "all", label: "الكل" },
    { id: "today", label: "حلقات اليوم" },
    { id: "top", label: "الأعلى تقييماً" },
  ];

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto nova-ep-scroll select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 48 }}
    >
      {/* ── Top App Bar (Back button on Right, Search & Drawer Menu on Left) ── */}
      <div
        className="sticky top-0 z-30 shrink-0"
        style={{
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="رجوع"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <ChevronRight size={19} color={colors.textPrimary} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="m-0"
                  style={{
                    fontSize: 17.5,
                    fontWeight: 900,
                    color: colors.textPrimary,
                  }}
                >
                  أحدث الحلقات
                </h1>
                <span
                  style={{
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 2,
                    paddingBottom: 2,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    border: `1px solid ${colors.primary}`,
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#FFFFFF",
                  }}
                >
                  تحديث مباشر
                </span>
              </div>
              <p
                className="m-0"
                style={{
                  fontSize: 10.5,
                  color: colors.textMuted,
                  fontWeight: 600,
                }}
              >
                جميع الحلقات الجديدة المضافة مترجمة بجودة فائقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearchQuery("");
              }}
              aria-label="بحث"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              {searchOpen ? (
                <X size={18} color={colors.textPrimary} />
              ) : (
                <Search size={18} color={colors.textPrimary} />
              )}
            </button>
            <button
              onClick={onOpenDrawer}
              aria-label="القائمة"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Menu size={20} color={colors.textPrimary} />
            </button>
          </div>
        </div>

        {/* Filter Tabs Row (1080P removed per user request) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3.5 pb-2.5">
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className="shrink-0 px-3.5 py-1.5 cursor-pointer transition-all"
                style={{
                  borderRadius: 999,
                  backgroundColor: active ? colors.primary : colors.input,
                  border: `1px solid ${
                    active ? colors.primary : colors.border
                  }`,
                  color: active ? "#FFFFFF" : colors.textSecondary,
                  fontSize: 11.5,
                  fontWeight: 800,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {searchOpen && (
          <div className="px-3.5 pb-2.5">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Search size={15} color={colors.textMuted} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في أحدث الحلقات المضافة..."
                className="flex-1 bg-transparent outline-none text-right"
                style={{ fontSize: 13, color: colors.textPrimary }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Responsive Full Section Grid ── */}
      <div
        className="grid gap-3 p-3.5"
        style={{ gridTemplateColumns: `repeat(${leCols}, minmax(0, 1fr))` }}
      >
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => onPlayEpisode(entry.anime, entry.epNumber)}
            className="flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "2 / 2.95",
                borderRadius: 14,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 10px 22px -6px rgba(0, 0, 0, 0.65)",
              }}
            >
              <img
                src={entry.anime.coverImage}
                alt={entry.anime.title}
                decoding="async"
                className="w-full h-full object-cover"
              />

              {/* Top-Right Episode Pill */}
              <div
                className="absolute flex items-center gap-1"
                style={{
                  top: 7,
                  right: 7,
                  borderRadius: 999,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 2.5,
                  paddingBottom: 2.5,
                  background:
                    "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                  border: "1px solid rgba(186, 230, 253, 0.35)",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    color: "#FFFFFF",
                  }}
                >
                  حلقة {entry.epNumber}
                </span>
              </div>


              {/* Bottom Gradient + Release Time */}
              <div
                className="absolute inset-x-0 bottom-0 flex items-end justify-start p-2 pointer-events-none"
                style={{
                  height: "46%",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.92) 100%)",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "rgba(226, 232, 240, 0.9)",
                  }}
                >
                  {entry.releaseTime}
                </span>
              </div>
            </div>

            {/* Arabic Title */}
            <div
              className="line-clamp-1 mt-1.5"
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: colors.textPrimary,
                textAlign: "right",
              }}
            >
              {entry.anime.titleAr || entry.anime.title}
            </div>

            {/* English Subtitle */}
            <div
              dir="ltr"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(entry.anime);
              }}
              className="line-clamp-1"
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: colors.textMuted,
                textAlign: "right",
                marginTop: 1,
              }}
            >
              {entry.anime.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
