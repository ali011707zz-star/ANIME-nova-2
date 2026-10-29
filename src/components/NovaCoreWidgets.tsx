import React, { useEffect, useState } from "react";
import {
  Play,
  Info,
  Heart,
  Star,
  ChevronLeft,
  X,
  Home,
  Search,
  Compass,
  Tv,
  Download,
  Calendar,
  Clock,
  Settings,
  BarChart3,
  Sparkles,
  Layers,
  BookOpen,
} from "lucide-react";
import { Anime } from "../types/anime";
import { ThemePalette, GENRE_MAP } from "../constants/novaColors";
import { getRailCardWidth, useTvMetrics } from "../utils/tv";

export function NovaBrandEmblem({ size = 22 }: { size?: number }) {
  return (
    <img
      src="/assets/aistudio/IMG_20261025_020007_932_0a013fb3.jpg"
      alt="Anime NOVA"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        objectFit: "cover",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1. HeroSection — Floating Cinematic Spotlight Card + Touch Swipe & Segmented Dash Bar
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaHeroSection({
  items,
  colors,
  onWatchEpisodes,
  onOpenDetails,
}: {
  items: Anime[];
  colors: ThemePalette;
  onWatchEpisodes: (anime: Anime) => void;
  onOpenDetails: (anime: Anime) => void;
}) {
  const [index, setIndex] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const { tv: tvMode } = useTvMetrics();

  const heroItems = items.slice(0, 5);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroItems.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [heroItems.length]);

  if (!heroItems.length) {
    return (
      <div
        style={{
          height: tvMode ? 360 : 290,
          backgroundColor: colors.card,
        }}
      />
    );
  }

  const current = heroItems[index] || heroItems[0];
  const imgUri = current.bannerImage || current.coverImage;
  const genres = current.genres.slice(0, 3);

  const handleSwipeDelta = (dx: number, dy: number) => {
    if (heroItems.length <= 1) return;
    if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      if (dx < 0) {
        // Swiped left -> next slide
        setIndex((prev) => (prev + 1) % heroItems.length);
      } else {
        // Swiped right -> previous slide
        setIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length);
      }
    }
  };

  return (
    <div
      className="relative select-none"
      style={{
        paddingLeft: tvMode ? 24 : 14,
        paddingRight: tvMode ? 24 : 14,
        paddingTop: 8,
      }}
    >
      {/* Floating Cinematic Hero Card (Swipeable via Touch & Pointer, zero GPU-heavy filter blur) */}
      <div
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) setTouchStartPos({ x: t.clientX, y: t.clientY });
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          if (t && touchStartPos) {
            handleSwipeDelta(
              t.clientX - touchStartPos.x,
              t.clientY - touchStartPos.y
            );
          }
          setTouchStartPos(null);
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") {
            setTouchStartPos({ x: e.clientX, y: e.clientY });
          }
        }}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse" && touchStartPos) {
            handleSwipeDelta(
              e.clientX - touchStartPos.x,
              e.clientY - touchStartPos.y
            );
            setTouchStartPos(null);
          }
        }}
        className="relative w-full overflow-hidden"
        style={{
          height: tvMode ? 350 : 276,
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 14px 32px -10px rgba(0, 0, 0, 0.68)",
          backgroundColor: "#121318",
          touchAction: "pan-y",
          zIndex: 1,
        }}
      >
        <img
          src={imgUri}
          alt={current.title}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Multi-stop Cinematic Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(9,9,11,0.18) 0%, rgba(9,9,11,0.48) 45%, rgba(9,9,11,0.92) 82%, #09090B 100%)",
          }}
        />

        {/* Top Spotlight Badge + Score Pill */}
        <div
          className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between"
          style={{ zIndex: 2 }}
        >
          <div
            className="flex items-center gap-1.5"
            style={{
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 999,
              backgroundColor: "rgba(15, 17, 23, 0.86)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#A78BFA",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#F8FAFC",
              }}
            >
              مختارات الموسم #{index + 1}
            </span>
          </div>

          {current.score > 0 && (
            <div
              className="flex items-center gap-1"
              style={{
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 999,
                backgroundColor: "rgba(12, 16, 24, 0.88)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
              }}
            >
              <Star size={11} color="#FACC15" fill="#FACC15" />
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {current.score.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Hero Content */}
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col"
          style={{
            paddingLeft: tvMode ? 28 : 18,
            paddingRight: tvMode ? 28 : 18,
            paddingBottom: tvMode ? 22 : 16,
            gap: 4,
          }}
        >
          {/* Genre Badges */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-0.5">
              {genres.map((g) => (
                <span
                  key={g}
                  style={{
                    borderRadius: 7,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 2.5,
                    paddingBottom: 2.5,
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    backgroundColor: "rgba(18, 20, 28, 0.82)",
                    fontSize: tvMode ? 13 : 9.5,
                    fontWeight: 700,
                    color: "#E2E8F0",
                  }}
                >
                  {GENRE_MAP[g] || g}
                </span>
              ))}
            </div>
          )}

          {/* Arabic Title First (High Impact) */}
          <h2
            dir="rtl"
            className="line-clamp-1 m-0"
            style={{
              fontSize: tvMode ? 26 : 19.5,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: tvMode ? "34px" : "25px",
              textAlign: "right",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.85)",
            }}
          >
            {current.titleAr || current.title}
          </h2>

          {/* Clear White English Subtitle */}
          <div
            dir="ltr"
            className="line-clamp-1"
            style={{
              fontSize: tvMode ? 16 : 13.5,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: tvMode ? "22px" : "18px",
              textAlign: "right",
              letterSpacing: "0.2px",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
            }}
          >
            {current.title}
          </div>

          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              dir="rtl"
              style={{
                fontSize: tvMode ? 13 : 11,
                fontWeight: 700,
                color: "rgba(226, 232, 240, 0.88)",
              }}
            >
              {[
                current.episodesCount > 0 ? `${current.episodesCount} حلقة` : null,
                current.format === "TV" ? "مسلسل TV" : current.format,
                current.year || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onWatchEpisodes(current)}
              className="flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
              style={{
                paddingLeft: tvMode ? 22 : 16,
                paddingRight: tvMode ? 18 : 13,
                paddingTop: tvMode ? 10 : 8,
                paddingBottom: tvMode ? 10 : 8,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, #0EA5E9 0%, #0284C7 55%, #0369A1 100%)",
                border: "1px solid rgba(186, 230, 253, 0.34)",
                boxShadow: "0 10px 24px -6px rgba(2, 132, 199, 0.45)",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: tvMode ? 28 : 24,
                  height: tvMode ? 28 : 24,
                  borderRadius: 8,
                  backgroundColor: "rgba(9, 10, 12, 0.24)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                }}
              >
                <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
              </div>
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: tvMode ? 15 : 13,
                  fontWeight: 900,
                  letterSpacing: "0.2px",
                }}
              >
                مشاهدة الآن
              </span>
            </button>

            <button
              onClick={() => onOpenDetails(current)}
              className="flex items-center justify-center gap-1.5 cursor-pointer active:opacity-90"
              style={{
                paddingLeft: tvMode ? 18 : 14,
                paddingRight: tvMode ? 18 : 14,
                paddingTop: tvMode ? 11 : 9,
                paddingBottom: tvMode ? 11 : 9,
                borderRadius: 13,
                border: "1px solid rgba(255, 255, 255, 0.18)",
                backgroundColor: "rgba(24, 22, 34, 0.88)",
              }}
            >
              <Info size={15} color="#fff" />
              <span
                style={{
                  color: "#fff",
                  fontSize: tvMode ? 15 : 13,
                  fontWeight: 700,
                }}
              >
                تفاصيل
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sleek Segmented Dash Indicator Bar Underneath Hero */}
      {heroItems.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 mt-3"
          style={{ position: "relative", zIndex: 2 }}
        >
          {heroItems.map((item, i) => {
            const active = i === index;
            return (
              <button
                key={item.id}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className="cursor-pointer p-0 border-0"
                style={{
                  width: active ? 28 : 12,
                  height: 4,
                  borderRadius: 999,
                  background: active
                    ? colors.textPrimary
                    : colors.border,
                  transition: "width 0.25s ease, background 0.25s ease",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. AnimeCard — Redesigned Cinema Poster Card (Luxury Frame & Badges)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaAnimeCard({
  item,
  width,
  colors,
  isFav,
  hideFavButton = false,
  onPress,
  onToggleFav,
}: {
  item: Anime;
  width?: number;
  colors: ThemePalette;
  isFav: boolean;
  hideFavButton?: boolean;
  onPress: (anime: Anime) => void;
  onToggleFav: (anime: Anime) => void;
}) {
  const { width: windowWidth, tv: tvMode, size: scaleSize } = useTvMetrics();
  const cardW = width ?? getRailCardWidth(windowWidth, tvMode ? 5 : 3);
  const imgHeight = Math.round(cardW * 1.46);
  const isAiring = item.status === "Airing";

  return (
    <div
      data-tv-focusable="true"
      tabIndex={0}
      onClick={() => onPress(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPress(item);
        }
      }}
      className="flex flex-col shrink-0 cursor-pointer select-none active:scale-[0.98] transition-transform"
      style={{
        width: cardW,
        gap: tvMode ? 8 : 6,
        borderRadius: tvMode ? 14 : undefined,
        padding: tvMode ? 5 : 0,
      }}
    >
      {/* Luxury Poster Frame */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "100%",
          height: imgHeight,
          borderRadius: 16,
          backgroundColor: "#0E131D",
          border: "1px solid rgba(56, 189, 248, 0.16)",
          boxShadow: "0 12px 26px -8px rgba(0, 0, 0, 0.78)",
        }}
      >
        <img
          src={item.coverImage}
          alt={item.title}
          draggable={false}
          decoding="async"
          className="w-full h-full object-cover"
        />

        {/* Multi-Stop Top & Bottom Cinematic Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(7, 9, 14, 0.36) 0%, transparent 32%, transparent 56%, rgba(7, 9, 14, 0.96) 100%)",
          }}
        />

        {/* Top-Left Favorite Button or Score Pill */}
        {!tvMode && !hideFavButton ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav(item);
            }}
            aria-label="المفضلة"
            className="absolute flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
            style={{
              top: 7,
              left: 7,
              backgroundColor: isFav
                ? "rgba(244, 63, 94, 0.92)"
                : "rgba(9, 12, 18, 0.84)",
              border: `1px solid ${
                isFav ? "rgba(253, 164, 175, 0.6)" : "rgba(255, 255, 255, 0.16)"
              }`,
              borderRadius: 999,
              width: 26,
              height: 26,
            }}
          >
            <Heart
              size={12}
              color="#FFFFFF"
              fill={isFav ? "#FFFFFF" : "transparent"}
            />
          </button>
        ) : (
          item.score > 0 && (
            <div
              className="absolute flex items-center gap-[3px]"
              style={{
                top: 7,
                left: 7,
                backgroundColor: "rgba(9, 12, 18, 0.88)",
                border: "1px solid rgba(250, 204, 21, 0.35)",
                borderRadius: 999,
                paddingLeft: 6,
                paddingRight: 6,
                paddingTop: 2,
                paddingBottom: 2,
              }}
            >
              <Star size={9} color="#FACC15" fill="#FACC15" />
              <span
                style={{ color: "#FEF08A", fontSize: 9, fontWeight: 900 }}
              >
                {item.score.toFixed(1)}
              </span>
            </div>
          )
        )}

        {/* Bottom Overlay Bar Inside Poster: Episode Count Only */}
        {item.episodesCount > 0 && (
          <div
            className="absolute left-2 right-2 bottom-2 flex items-center justify-start"
          >
            <span
              style={{
                backgroundColor: "rgba(9, 12, 18, 0.86)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 999,
                paddingLeft: 7,
                paddingRight: 7,
                paddingTop: 2,
                paddingBottom: 2,
                color: "#FFFFFF",
                fontSize: 8.5,
                fontWeight: 800,
              }}
            >
              {item.episodesCount} حلقة
            </span>
          </div>
        )}
      </div>

      {/* Arabic Title First + English Subtitle Below Poster */}
      <div className="flex flex-col px-1" style={{ gap: 1.5 }}>
        <span
          dir="rtl"
          className="line-clamp-1"
          style={{
            color: colors.textPrimary,
            fontSize: scaleSize(12, 19),
            fontWeight: 900,
            lineHeight: `${scaleSize(16.5, 26)}px`,
            textAlign: "right",
          }}
        >
          {item.titleAr || item.title}
        </span>

        <span
          dir="ltr"
          className="line-clamp-1"
          style={{
            color: colors.textMuted,
            fontSize: tvMode ? 13 : 10,
            fontWeight: 700,
            lineHeight: tvMode ? "18px" : "13.5px",
            textAlign: "right",
          }}
        >
          {item.title}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. SectionRow (1:1 from artifacts/nova-mobile/components/SectionRow.tsx)
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaSectionRow({
  title,
  items,
  colors,
  favorites,
  onPressAnime,
  onToggleFav,
  onSeeAll,
}: {
  title: string;
  items: Anime[];
  colors: ThemePalette;
  favorites: string[];
  onPressAnime: (anime: Anime) => void;
  onToggleFav: (anime: Anime) => void;
  onSeeAll?: () => void;
}) {
  const { width: windowWidth, tv: tvMode, size: scaleSize } = useTvMetrics();
  const cardWidth = getRailCardWidth(windowWidth, tvMode ? 5 : 3);

  if (!items.length) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        className="flex items-center justify-between"
        style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 12 }}
      >
        <h3
          className="m-0"
          style={{
            color: colors.text,
            fontSize: scaleSize(17, 25),
            lineHeight: `${scaleSize(22, 34)}px`,
            fontWeight: 800,
          }}
        >
          {title}
        </h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            style={{
              paddingLeft: 10,
              paddingRight: 11,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 999,
              backgroundColor:
                colors.background === "#F8FAFC"
                  ? "rgba(15, 23, 42, 0.06)"
                  : "rgba(255, 255, 255, 0.09)",
              border:
                colors.background === "#F8FAFC"
                  ? "1px solid rgba(15, 23, 42, 0.12)"
                  : "1px solid rgba(255, 255, 255, 0.16)",
            }}
          >
            <span
              style={{
                color: colors.textPrimary,
                fontSize: scaleSize(12.5, 17),
                fontWeight: 800,
              }}
            >
              عرض الكل
            </span>
            <ChevronLeft
              size={tvMode ? 18 : 14}
              color={colors.textPrimary}
            />
          </button>
        )}
      </div>

      <div
        className="flex overflow-x-auto no-scrollbar"
        style={{ paddingLeft: 16, paddingRight: 16, gap: 14 }}
      >
        {items.slice(0, tvMode ? 10 : items.length).map((item) => (
          <NovaAnimeCard
            key={item.id}
            item={item}
            width={cardWidth}
            colors={colors}
            isFav={favorites.includes(item.id)}
            hideFavButton={true}
            onPress={onPressAnime}
            onToggleFav={onToggleFav}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. DrawerMenu — Adaptive Light/Dark Theme, Calm Neutral Borders & Global Stats / Coming Soon
   ══════════════════════════════════════════════════════════════════════════ */
export function NovaDrawerMenu({
  open,
  colors,
  onClose,
  watchHistoryCount,
  favoritesCount,
  onNavigate,
}: {
  open: boolean;
  colors?: ThemePalette;
  onClose: () => void;
  watchHistoryCount: number;
  favoritesCount: number;
  onNavigate: (route: string) => void;
}) {
  const { tv: tvMode } = useTvMetrics();

  const [drawerProfile, setDrawerProfile] = useState<{
    name: string;
    username?: string;
    email: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    const syncProfile = () => {
      try {
        const raw = localStorage.getItem("nova_google_user_v1");
        setDrawerProfile(raw ? JSON.parse(raw) : null);
      } catch {
        setDrawerProfile(null);
      }
    };
    syncProfile();
    window.addEventListener("nova-profile-updated", syncProfile);
    window.addEventListener("storage", syncProfile);
    return () => {
      window.removeEventListener("nova-profile-updated", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, [open]);

  if (!open) return null;

  const isLight =
    colors?.background === "#F8FAFC" || colors?.background === "#FFFFFF";

  const go = (route: string) => {
    onClose();
    setTimeout(() => onNavigate(route), 120);
  };

  // Main Navigation including الإحصائيات العالمية and قادم قريبا
  const NAV_MAIN = [
    { icon: Home, label: "الرئيسية", route: "tab:index", color: "#6366F1" },
    { icon: Search, label: "البحث", route: "tab:search", color: "#3B82F6" },
    {
      icon: Compass,
      label: "تصفح الأنمي",
      route: "tab:browse",
      color: "#0EA5E9",
    },
    {
      icon: Layers,
      label: "المواسم",
      route: "/seasons",
      color: "#F59E0B",
    },
    {
      icon: BookOpen,
      label: "المانجا",
      route: "/manga",
      color: "#10B981",
    },
    {
      icon: BarChart3,
      label: "الإحصائيات العالمية",
      route: "/global-stats",
      color: "#0EA5E9",
    },
    {
      icon: Sparkles,
      label: "قادم قريبا",
      route: "/coming-soon",
      color: "#EC4899",
    },
    {
      icon: Tv,
      label: "كرتون مدبلج ومترجم",
      route: "tab:aw-dubbed:cartoon",
      color: "#10B981",
    },
    {
      icon: Download,
      label: "تنزيلاتي",
      route: "tab:downloads",
      color: "#0284C7",
    },
    {
      icon: Calendar,
      label: "جدول البث الأسبوعي",
      route: "/schedule",
      color: "#14B8A6",
    },
  ];

  const NAV_LIBRARY = [
    {
      icon: Heart,
      label: "المفضلة",
      route: "tab:library:favs",
      color: "#F43F5E",
      badge: favoritesCount > 0 ? String(favoritesCount) : undefined,
    },
    {
      icon: Clock,
      label: "سجل المشاهدة",
      route: "tab:library:history",
      color: "#06B6D4",
      badge: watchHistoryCount > 0 ? String(watchHistoryCount) : undefined,
    },
  ];

  const NAV_OTHER = [
    {
      icon: Settings,
      label: "الإعدادات",
      route: "/settings",
      color: "#64748B",
    },
  ];

  const renderDrawerItem = (item: {
    icon: React.ComponentType<any>;
    label: string;
    route: string;
    color: string;
    badge?: string;
  }) => {
    const Icon = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => go(item.route)}
        className="group flex items-center cursor-pointer text-right transition-all active:scale-[0.985]"
        style={{
          width: `calc(100% - ${tvMode ? 32 : 24}px)`,
          gap: tvMode ? 16 : 12,
          paddingLeft: tvMode ? 18 : 12,
          paddingRight: tvMode ? 18 : 12,
          paddingTop: tvMode ? 14 : 9,
          paddingBottom: tvMode ? 14 : 9,
          marginLeft: tvMode ? 16 : 12,
          marginRight: tvMode ? 16 : 12,
          marginBottom: 5,
          borderRadius: tvMode ? 18 : 13,
          backgroundColor: isLight
            ? "#F8FAFC"
            : "rgba(255, 255, 255, 0.03)",
          border: isLight
            ? "1px solid rgba(15, 23, 42, 0.07)"
            : "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: tvMode ? 48 : 35,
            height: tvMode ? 48 : 35,
            borderRadius: tvMode ? 14 : 10,
            backgroundColor: isLight
              ? `${item.color}16`
              : `${item.color}1E`,
            border: `1px solid ${item.color}30`,
          }}
        >
          <Icon size={tvMode ? 24 : 16.5} color={item.color} />
        </div>
        <span
          className="flex-1"
          style={{
            fontSize: tvMode ? 18 : 13,
            fontWeight: 800,
            color: isLight ? "#0F172A" : "#F8FAFC",
          }}
        >
          {item.label}
        </span>
        {item.badge ? (
          <span
            style={{
              backgroundColor: isLight
                ? "rgba(15, 23, 42, 0.07)"
                : "rgba(255, 255, 255, 0.09)",
              borderRadius: 999,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 2,
              paddingBottom: 2,
              border: isLight
                ? "1px solid rgba(15, 23, 42, 0.12)"
                : "1px solid rgba(255, 255, 255, 0.14)",
              fontSize: 10,
              fontWeight: 800,
              color: isLight ? "#0F172A" : "#E2E8F0",
            }}
          >
            {item.badge}
          </span>
        ) : (
          <ChevronLeft
            size={14}
            color={isLight ? "rgba(15,23,42,0.35)" : "rgba(255,255,255,0.28)"}
          />
        )}
      </button>
    );
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[80] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0"
        style={{
          backgroundColor: isLight
            ? "rgba(15, 23, 42, 0.42)"
            : "rgba(4, 5, 7, 0.72)",
        }}
      />

      {/* Drawer Panel (opens from the left side matching the Menu button position) */}
      <div
        className="relative z-10 flex flex-col h-full overflow-hidden ml-0 mr-auto"
        style={{
          width: tvMode ? "min(42vw, 520px)" : "min(82vw, 326px)",
          backgroundColor: isLight ? "#FFFFFF" : "#0E1015",
          borderRight: isLight
            ? `${tvMode ? 2 : 1}px solid rgba(15, 23, 42, 0.09)`
            : `${tvMode ? 2 : 1}px solid rgba(255, 255, 255, 0.08)`,
          boxShadow: isLight
            ? "8px 0 32px rgba(15, 23, 42, 0.14)"
            : "8px 0 36px rgba(0, 0, 0, 0.72)",
        }}
      >
        {/* CSS selector 1: Drawer inner scroll container */}
        <div
          className="flex-1 overflow-y-auto nova-ep-scroll"
          style={{
            paddingBottom: 24,
            backgroundColor: isLight ? "#FFFFFF" : "#0E1015",
          }}
        >
          {/* ── Upgraded Typographic Brand Header (Adaptive Light/Dark, calm border) ── */}
          <div
            className="flex items-center justify-between"
            style={{
              gap: tvMode ? 16 : 12,
              paddingLeft: tvMode ? 24 : 16,
              paddingRight: tvMode ? 24 : 16,
              paddingTop: tvMode ? 24 : 16,
              paddingBottom: tvMode ? 22 : 14,
              backgroundColor: isLight ? "#F8FAFC" : "#12151C",
              borderBottom: isLight
                ? "1px solid rgba(15, 23, 42, 0.08)"
                : "1px solid rgba(255, 255, 255, 0.07)",
            }}
          >
            <div className="flex items-center gap-2.5">
              {/* Sleek vertical accent bar */}
              <div
                style={{
                  width: 3.5,
                  height: tvMode ? 36 : 26,
                  borderRadius: 999,
                  background: "linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)",
                }}
              />
              <div className="flex flex-col">
                <div
                  dir="ltr"
                  className="flex items-baseline gap-1.5 justify-end"
                >
                  <span
                    style={{
                      fontSize: tvMode ? 26 : 18.5,
                      fontWeight: 900,
                      letterSpacing: "0.8px",
                      color: isLight ? "#0F172A" : "#FFFFFF",
                    }}
                  >
                    ANIME
                  </span>
                  <span
                    style={{
                      fontSize: tvMode ? 26 : 18.5,
                      fontWeight: 900,
                      letterSpacing: "1.6px",
                      color: isLight ? "#0284C7" : "#38BDF8",
                    }}
                  >
                    NOVA
                  </span>
                </div>
                <span
                  style={{
                    fontSize: tvMode ? 13 : 9.5,
                    fontWeight: 700,
                    color: isLight ? "#64748B" : "#94A3B8",
                    marginTop: 1,
                  }}
                >
                  منصة الأنمي العربية
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="إغلاق القائمة"
              className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              style={{
                width: tvMode ? 46 : 34,
                height: tvMode ? 46 : 34,
                borderRadius: 11,
                backgroundColor: isLight
                  ? "#FFFFFF"
                  : "rgba(255, 255, 255, 0.06)",
                border: isLight
                  ? "1px solid rgba(15, 23, 42, 0.1)"
                  : "1px solid rgba(255, 255, 255, 0.09)",
              }}
            >
              <X
                size={tvMode ? 24 : 17}
                color={isLight ? "#334155" : "#CBD5E1"}
              />
            </button>
          </div>

          {/* ── User Profile & Google Sync Card (Luxury Executive Design) ── */}
          <button
            onClick={() => go("/settings")}
            className="flex items-center cursor-pointer text-right overflow-hidden active:scale-[0.985] transition-transform"
            style={{
              width: `calc(100% - ${tvMode ? 32 : 24}px)`,
              marginLeft: tvMode ? 16 : 12,
              marginRight: tvMode ? 16 : 12,
              marginTop: tvMode ? 18 : 12,
              marginBottom: tvMode ? 8 : 6,
              borderRadius: tvMode ? 20 : 18,
              border: isLight
                ? "1px solid rgba(15, 23, 42, 0.1)"
                : "1px solid rgba(244, 63, 94, 0.28)",
              background: isLight
                ? "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)"
                : "linear-gradient(135deg, rgba(28, 22, 38, 0.96) 0%, rgba(15, 17, 26, 0.98) 100%)",
              boxShadow: isLight
                ? "0 8px 20px -8px rgba(15, 23, 42, 0.08)"
                : "0 12px 26px -8px rgba(0, 0, 0, 0.6)",
              padding: "13px 13px",
              gap: 12,
            }}
          >
            <div className="relative shrink-0">
              <div
                className="flex items-center justify-center overflow-hidden"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 15,
                  background:
                    "linear-gradient(135deg, #E11D48 0%, #7C3AED 100%)",
                  border: "1.5px solid rgba(255, 255, 255, 0.32)",
                }}
              >
                {drawerProfile?.avatar ? (
                  <img
                    src={drawerProfile.avatar}
                    alt={drawerProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#FFFFFF",
                    }}
                  >
                    {drawerProfile?.name ? drawerProfile.name.charAt(0) : "م"}
                  </span>
                )}
              </div>
              <div
                className="flex items-center justify-center"
                style={{
                  position: "absolute",
                  bottom: -3,
                  left: -3,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  backgroundColor: "#FFFFFF",
                  border: "1.5px solid #141720",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24">
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
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="line-clamp-1"
                  style={{
                    fontSize: 13.5,
                    fontWeight: 900,
                    color: isLight ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {drawerProfile?.name || "الملف الشخصي"}
                </span>
                <span
                  dir="ltr"
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    paddingLeft: 6,
                    paddingRight: 6,
                    paddingTop: 1.5,
                    paddingBottom: 1.5,
                    borderRadius: 999,
                    backgroundColor: "rgba(16, 185, 129, 0.16)",
                    color: "#34D399",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                  }}
                >
                  {drawerProfile?.username || "Google مزامنة"}
                </span>
              </div>

              <div
                className="flex items-center gap-2"
                style={{ marginTop: 5 }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    paddingLeft: 7,
                    paddingRight: 7,
                    paddingTop: 2,
                    paddingBottom: 2,
                    borderRadius: 6,
                    backgroundColor: isLight
                      ? "rgba(15, 23, 42, 0.05)"
                      : "rgba(255, 255, 255, 0.06)",
                    color: isLight ? "#334155" : "#E2E8F0",
                  }}
                >
                  {watchHistoryCount} مشاهدة
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    paddingLeft: 7,
                    paddingRight: 7,
                    paddingTop: 2,
                    paddingBottom: 2,
                    borderRadius: 6,
                    backgroundColor: isLight
                      ? "rgba(15, 23, 42, 0.05)"
                      : "rgba(255, 255, 255, 0.06)",
                    color: isLight ? "#334155" : "#FDA4AF",
                  }}
                >
                  {favoritesCount} مفضلة
                </span>
              </div>
            </div>

            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: isLight
                  ? "rgba(15, 23, 42, 0.06)"
                  : "rgba(255, 255, 255, 0.07)",
                border: isLight
                  ? "1px solid rgba(15, 23, 42, 0.09)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <ChevronLeft
                size={15}
                color={isLight ? "#0F172A" : "#FFFFFF"}
              />
            </div>
          </button>

          {/* ── Main navigation (القائمة الرئيسية) ── */}
          <div
            className="flex items-center gap-2"
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: isLight ? "#64748B" : "#94A3B8",
              }}
            >
              القائمة الرئيسية
            </span>
            <div
              className="flex-1"
              style={{
                height: 1,
                backgroundColor: isLight
                  ? "rgba(15, 23, 42, 0.07)"
                  : "rgba(255, 255, 255, 0.07)",
              }}
            />
          </div>
          {NAV_MAIN.map(renderDrawerItem)}

          {/* ── Library (مكتبتي) ── */}
          <div
            className="flex items-center gap-2"
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: isLight ? "#64748B" : "#94A3B8",
              }}
            >
              مكتبتي
            </span>
            <div
              className="flex-1"
              style={{
                height: 1,
                backgroundColor: isLight
                  ? "rgba(15, 23, 42, 0.07)"
                  : "rgba(255, 255, 255, 0.07)",
              }}
            />
          </div>
          {NAV_LIBRARY.map(renderDrawerItem)}

          {/* ── Other (أخرى) ── */}
          <div
            className="flex items-center gap-2"
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: isLight ? "#64748B" : "#94A3B8",
              }}
            >
              أخرى
            </span>
            <div
              className="flex-1"
              style={{
                height: 1,
                backgroundColor: isLight
                  ? "rgba(15, 23, 42, 0.07)"
                  : "rgba(255, 255, 255, 0.07)",
              }}
            />
          </div>
          {NAV_OTHER.map(renderDrawerItem)}

          {/* ── Adaptive Luxury Footer (CSS selector 1: 2026 Edition) ── */}
          <div
            className="flex items-center justify-between"
            style={{
              marginTop: 16,
              marginLeft: 12,
              marginRight: 12,
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 12,
              paddingBottom: 12,
              borderRadius: 15,
              background: isLight
                ? "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)"
                : "linear-gradient(135deg, rgba(26, 30, 40, 0.85) 0%, rgba(16, 18, 24, 0.95) 100%)",
              border: isLight
                ? "1px solid rgba(15, 23, 42, 0.09)"
                : "1px solid rgba(255, 255, 255, 0.09)",
              boxShadow: isLight
                ? "0 4px 12px -4px rgba(15, 23, 42, 0.05)"
                : "0 8px 18px -6px rgba(0, 0, 0, 0.45)",
            }}
          >
            <div className="flex flex-col">
              <div dir="ltr" className="flex items-center gap-1.5">
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: "0.5px",
                    color: isLight ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  ANIME{" "}
                  <span style={{ color: isLight ? "#0284C7" : "#38BDF8" }}>
                    NOVA
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    paddingLeft: 6,
                    paddingRight: 6,
                    paddingTop: 1,
                    paddingBottom: 1,
                    borderRadius: 6,
                    backgroundColor: isLight
                      ? "rgba(15, 23, 42, 0.08)"
                      : "rgba(255, 255, 255, 0.12)",
                    color: isLight ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  © 2026
                </span>
              </div>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: isLight ? "#64748B" : "#94A3B8",
                  marginTop: 2,
                }}
              >
                الإصدار الرسمي v2.4 · جميع الحقوق محفوظة
              </span>
            </div>

            <div
              className="flex items-center gap-1.5"
              style={{
                paddingLeft: 9,
                paddingRight: 9,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 999,
                backgroundColor: "rgba(34, 197, 94, 0.14)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <div
                style={{
                  width: 6.5,
                  height: 6.5,
                  borderRadius: 999,
                  backgroundColor: "#22C55E",
                  boxShadow: "0 0 8px rgba(34, 197, 94, 0.65)",
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: isLight ? "#15803D" : "#4ADE80",
                }}
              >
                متصل
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
