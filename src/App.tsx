import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home,
  Search,
  Compass,
  Film,
  Download,
  Bookmark,
  ChevronUp,
} from "lucide-react";
import {
  Anime,
  AwDubbedSeries,
  DubbedSeries,
  DubbedSeason,
  StardimaSeries,
  StardimaEpisodeItem,
} from "./types/anime";
import { ANIME_DATABASE } from "./data/animeData";
import { paletteColors, ThemeName } from "./constants/novaColors";
import {
  BrandSplash,
  TelegramAnnouncementModal,
} from "./components/NovaSplashAndModals";
import { NovaDrawerMenu } from "./components/NovaCoreWidgets";
import {
  NovaHomeTab,
  NovaSearchTab,
  NovaBrowseTab,
  NovaDubbedTab,
  NovaDownloadsTab,
  NovaLibraryTab,
  WatchHistoryItem,
  DownloadItem,
} from "./components/NovaTabScreens";
import {
  NovaAnimeDetailScreen,
  NovaEpisodeListScreen,
  NovaWatchScreen,
  NovaCommentsScreen,
  NovaScheduleScreen,
  NovaSettingsScreen,
  NovaTvLinkScreen,
  NovaAwDubbedDetailScreen,
  NovaDubbedDetailScreen,
  NovaDubbedWatchScreen,
  NovaStardimaTitleScreen,
  NovaStardimaServersScreen,
  NovaStardimaPlayerScreen,
  NovaGlobalStatsScreen,
  NovaComingSoonScreen,
  NovaLatestEpisodesScreen,
} from "./components/NovaStackScreens";
import {
  NovaSeasonsScreen,
  NovaMangaScreen,
} from "./components/NovaSeasonsAndMangaScreens";
import { KotlinCodeExporter } from "./components/KotlinCodeExporter";
import { useTvMetrics, useTvSpatialNavigation } from "./utils/tv";
import { useSmoothNavigationScroll } from "./utils/smoothScroll";

type TabId =
  | "index"
  | "search"
  | "browse"
  | "aw-dubbed"
  | "downloads"
  | "library";

type StackRoute =
  | { type: "tabs" }
  | { type: "anime"; anime: Anime }
  | { type: "episodes"; anime: Anime }
  | {
      type: "watch";
      anime: Anime;
      episodeNumber: number;
      mode?: "anime" | "aw-dubbed";
      seasonLabel?: string;
      autoStartPlayer?: boolean;
      initialPositionSec?: number;
    }
  | { type: "aw-dubbed-detail"; series: AwDubbedSeries }
  | { type: "dubbed-detail"; series: DubbedSeries }
  | {
      type: "dubbed-watch";
      series: DubbedSeries;
      season: DubbedSeason;
      episodeNumber: number;
    }
  | { type: "stardima-title"; series: StardimaSeries }
  | {
      type: "stardima-servers";
      series: StardimaSeries;
      episode: StardimaEpisodeItem;
    }
  | {
      type: "stardima-player";
      series: StardimaSeries;
      episode: StardimaEpisodeItem;
      quality: string;
      serverLabel: string;
      videoUrl: string;
    }
  | { type: "comments"; anime: Anime; episodeNumber?: number }
  | { type: "schedule" }
  | { type: "seasons" }
  | { type: "manga" }
  | { type: "global-stats" }
  | { type: "coming-soon" }
  | { type: "latest-episodes" }
  | { type: "settings" }
  | { type: "tv-link" };

export default function App() {
  const { tv: tvMode, contentWidth } = useTvMetrics();
  const [theme, setTheme] = useState<ThemeName>("black");
  const colors = paletteColors[theme];
  const mainRef = useRef<HTMLElement | null>(null);
  const { showScrollTop, scrollToTop } = useSmoothNavigationScroll(mainRef);

  const [animeList] = useState<Anime[]>(ANIME_DATABASE);
  const [activeTab, setActiveTab] = useState<TabId>("index");
  const [dubbedSubTab, setDubbedSubTab] = useState<
    "animation" | "spacetoon" | "cartoon"
  >("animation");
  const [librarySubTab, setLibrarySubTab] = useState<number>(0);

  // Navigation Stack (matches Expo Router Stack in artifacts/nova-mobile/app/_layout.tsx)
  const [routeStack, setRouteStack] = useState<StackRoute[]>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("player") === "1" && ANIME_DATABASE.length > 0) {
        return [
          { type: "tabs" },
          {
            type: "watch",
            anime: ANIME_DATABASE[0],
            episodeNumber: 4,
            autoStartPlayer: true,
          },
        ];
      }
    } catch {}
    return [{ type: "tabs" }];
  });
  const currentRoute = routeStack[routeStack.length - 1] || { type: "tabs" };

  // Drawer, Splash, Telegram Modal & Kotlin Source Modal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("autostart") === "1" || params.get("player") === "1") {
        return false;
      }
      return !sessionStorage.getItem("nova_splash_shown_v3");
    } catch {
      return true;
    }
  });
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showKotlinExporter, setShowKotlinExporter] = useState(false);

  // TV Exit Hint (matches artifacts/nova-mobile/app/_layout.tsx lines 44-87)
  const [showTvExitHint, setShowTvExitHint] = useState(false);
  const tvExitArmedUntilRef = useRef(0);
  const tvExitHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const pushRoute = useCallback((route: StackRoute) => {
    setRouteStack((prev) => [...prev, route]);
    try {
      window.history.pushState({ novaStackDepth: true }, "");
    } catch {}
  }, []);

  const popRoute = useCallback(() => {
    setRouteStack((prev) =>
      prev.length > 1 ? prev.slice(0, prev.length - 1) : [{ type: "tabs" }]
    );
  }, []);

  // Unified Back handler (matches artifacts/nova-mobile/app/_layout.tsx BackHandler)
  const handleBackPress = useCallback((): boolean => {
    if (drawerOpen) {
      setDrawerOpen(false);
      return true;
    }
    if (showKotlinExporter) {
      setShowKotlinExporter(false);
      return true;
    }
    if (showTelegramModal) {
      setShowTelegramModal(false);
      return true;
    }
    if (routeStack.length > 1) {
      popRoute();
      return true;
    }
    if (activeTab !== "index") {
      setActiveTab("index");
      return true;
    }
    if (tvMode) {
      const now = Date.now();
      if (tvExitArmedUntilRef.current > now) {
        tvExitArmedUntilRef.current = 0;
        setShowTvExitHint(false);
        try {
          (window as any).NovaAndroid?.exitApp?.();
        } catch {}
        return false;
      }
      tvExitArmedUntilRef.current = now + 2200;
      setShowTvExitHint(true);
      if (tvExitHintTimeoutRef.current) {
        clearTimeout(tvExitHintTimeoutRef.current);
      }
      tvExitHintTimeoutRef.current = setTimeout(() => {
        tvExitArmedUntilRef.current = 0;
        setShowTvExitHint(false);
      }, 2200);
      return true;
    }
    return false;
  }, [
    drawerOpen,
    showKotlinExporter,
    showTelegramModal,
    routeStack.length,
    activeTab,
    tvMode,
    popRoute,
  ]);

  useEffect(() => {
    (window as any).__novaHandleBackPress = handleBackPress;
    return () => {
      delete (window as any).__novaHandleBackPress;
    };
  }, [handleBackPress]);

  // Enable D-Pad spatial focus and Back/Escape key navigation
  useTvSpatialNavigation(tvMode, handleBackPress);

  // Sync browser back button with stack
  useEffect(() => {
    const onPopState = () => {
      handleBackPress();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [handleBackPress]);

  // Favorites persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("nova_favorites_v1");
      return raw
        ? JSON.parse(raw)
        : ["one-punch-man", "solo-leveling", "jujutsu-kaisen", "frieren"];
    } catch {
      return ["one-punch-man", "solo-leveling", "jujutsu-kaisen", "frieren"];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("nova_favorites_v1", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = (anime: Anime) => {
    setFavorites((prev) =>
      prev.includes(anime.id)
        ? prev.filter((id) => id !== anime.id)
        : [anime.id, ...prev]
    );
  };

  // Watch History (matches AppContext watchHistory in artifacts/nova-mobile)
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([
    {
      animeId: "solo-leveling",
      title: "سولو ليفلينغ",
      english: "Solo Leveling",
      ep: 7,
      thumbnail:
        "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg",
      position: 890,
      duration: 1440,
      updatedAt: Date.now() - 3600_000,
    },
    {
      animeId: "one-punch-man",
      title: "ون بنش مان",
      english: "One-Punch Man",
      ep: 3,
      thumbnail:
        "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21087-sHb9zUZFsHe1.jpg",
      position: 1120,
      duration: 1440,
      updatedAt: Date.now() - 7200_000,
    },
    {
      animeId: "jujutsu-kaisen",
      title: "جوجوتسو كايسن",
      english: "Jujutsu Kaisen",
      ep: 12,
      thumbnail:
        "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg",
      position: 540,
      duration: 1440,
      updatedAt: Date.now() - 18000_000,
    },
  ]);

  // Downloads state (grouped by anime poster in NovaDownloadsTab)
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      id: "dl-sl-5",
      animeId: "solo-leveling",
      title: "سولو ليفلينغ (الارتقاء المنفرد)",
      ep: 5,
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      quality: "720p HD",
      sizeMb: 210,
      date: "قبل يومين",
      progress: 100,
      status: "completed",
      savedToGallery: true,
    },
    {
      id: "dl-sl-6",
      animeId: "solo-leveling",
      title: "سولو ليفلينغ (الارتقاء المنفرد)",
      ep: 6,
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      quality: "720p HD",
      sizeMb: 225,
      date: "أمس",
      progress: 100,
      status: "completed",
      savedToGallery: true,
    },
    {
      id: "dl-sl-7",
      animeId: "solo-leveling",
      title: "سولو ليفلينغ (الارتقاء المنفرد)",
      ep: 7,
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      quality: "720p HD",
      sizeMb: 238,
      date: "اليوم",
      progress: 100,
      status: "completed",
      savedToGallery: true,
    },
    {
      id: "dl-jjk-1",
      animeId: "jujutsu-kaisen",
      title: "جوجوتسو كايسن",
      ep: 1,
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
      quality: "720p HD",
      sizeMb: 194,
      date: "أمس",
      progress: 100,
      status: "completed",
      savedToGallery: false,
    },
    {
      id: "dl-jjk-2",
      animeId: "jujutsu-kaisen",
      title: "جوجوتسو كايسن",
      ep: 2,
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
      quality: "720p HD",
      sizeMb: 198,
      date: "اليوم",
      progress: 100,
      status: "completed",
      savedToGallery: true,
    },
    {
      id: "dl-opm-1",
      animeId: "one-punch-man",
      title: "ون بنش مان",
      ep: 1,
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg",
      quality: "720p HD",
      sizeMb: 180,
      date: "أمس",
      progress: 100,
      status: "completed",
      savedToGallery: false,
    },
    {
      id: "dl-opm-4",
      animeId: "one-punch-man",
      title: "ون بنش مان",
      ep: 4,
      poster:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg",
      quality: "720p HD",
      sizeMb: 185,
      date: "الآن",
      progress: 68,
      status: "downloading",
    },
  ]);

  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, []);

  const handleOpenWatch = (
    anime: Anime,
    epNumber = 1,
    mode: "anime" | "aw-dubbed" = "anime",
    seasonLabel?: string,
    autoStartPlayer = false,
    initialPositionSec = 0
  ) => {
    setWatchHistory((prev) => {
      const existing = prev.find(
        (h) => h.animeId === anime.id && h.ep === epNumber
      );
      const filtered = prev.filter((h) => h.animeId !== anime.id);
      return [
        {
          animeId: anime.id,
          title: anime.titleAr || anime.title,
          english: anime.title,
          ep: epNumber,
          thumbnail: anime.bannerImage || anime.coverImage || "",
          position: initialPositionSec || existing?.position || 0,
          duration: existing?.duration || 1440,
          updatedAt: Date.now(),
        },
        ...filtered,
      ];
    });
    pushRoute({
      type: "watch",
      anime,
      episodeNumber: epNumber,
      mode,
      seasonLabel,
      autoStartPlayer,
      initialPositionSec,
    });
  };

  const handleTriggerDownload = (anime: Anime, epNumber: number) => {
    const id = `dl-${anime.id}-${epNumber}`;
    setDownloads((prev) => {
      if (prev.some((d) => d.id === id)) return prev;
      return [
        {
          id,
          animeId: anime.id,
          title: anime.titleAr || anime.title,
          ep: epNumber,
          poster: anime.coverImage || "",
          quality: "1080p FHD",
          sizeMb: 310,
          date: "الآن",
          progress: 100,
          status: "completed" as const,
          savedToGallery: false,
        },
        ...prev,
      ];
    });
    setRouteStack([{ type: "tabs" }]);
    setActiveTab("downloads");
  };

  const handleDrawerNavigate = (route: string) => {
    if (route.startsWith("tab:")) {
      const parts = route.split(":");
      const tab = parts[1] as TabId;
      const sub = parts[2];
      setRouteStack([{ type: "tabs" }]);
      setActiveTab(tab);
      if (tab === "library") {
        setLibrarySubTab(sub === "favs" ? 2 : sub === "history" ? 1 : 0);
      }
      return;
    }
    if (route === "/schedule") {
      pushRoute({ type: "schedule" });
    } else if (route === "/seasons") {
      pushRoute({ type: "seasons" });
    } else if (route === "/manga") {
      pushRoute({ type: "manga" });
    } else if (route === "/global-stats") {
      pushRoute({ type: "global-stats" });
    } else if (route === "/coming-soon") {
      pushRoute({ type: "coming-soon" });
    } else if (route === "/settings") {
      pushRoute({ type: "settings" });
    } else if (route === "/tv-link") {
      pushRoute({ type: "tv-link" });
    }
  };

  // Bottom tabs definition (Search moved to top header next to ANIME NOVA)
  const TABS: { id: TabId; title: string; icon: React.ComponentType<any> }[] = [
    { id: "index", title: "الرئيسية", icon: Home },
    { id: "browse", title: "تصفح", icon: Compass },
    { id: "aw-dubbed", title: "مدبلج", icon: Film },
    { id: "downloads", title: "تنزيلاتي", icon: Download },
    { id: "library", title: "قائمتي", icon: Bookmark },
  ];

  return (
    <div
      dir="rtl"
      className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden font-['Cairo'] select-none"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
      }}
    >
      {/* BrandSplash startup screen */}
      {showSplash && (
        <BrandSplash
          colors={colors}
          onFinish={() => {
            setShowSplash(false);
            try {
              sessionStorage.setItem("nova_splash_shown_v3", "1");
              if (!sessionStorage.getItem("nova_tg_shown")) {
                sessionStorage.setItem("nova_tg_shown", "1");
                setShowTelegramModal(true);
              }
            } catch {
              setShowTelegramModal(true);
            }
          }}
        />
      )}

      {/* Telegram Announcement Modal */}
      <TelegramAnnouncementModal
        visible={showTelegramModal}
        colors={colors}
        onDismiss={() => setShowTelegramModal(false)}
      />

      {/* DrawerMenu (1:1 from components/DrawerMenu.tsx) */}
      <NovaDrawerMenu
        open={drawerOpen}
        colors={colors}
        onClose={() => setDrawerOpen(false)}
        watchHistoryCount={watchHistory.length}
        favoritesCount={favorites.length}
        onNavigate={handleDrawerNavigate}
      />

      {/* Main Screen Content (automatically adapts to Phone, Tablet, and TV width) */}
      <main
        ref={mainRef}
        className="flex-1 min-h-0 flex flex-col w-full mx-auto relative overflow-hidden"
        style={{ maxWidth: contentWidth }}
      >
        <div
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
          style={
            currentRoute.type === "tabs"
              ? undefined
              : {
                  position: "absolute",
                  inset: 0,
                  visibility: "hidden",
                  pointerEvents: "none",
                }
          }
        >
          {/* Keep NovaHomeTab mounted so Home scroll position is preserved across stack & tab navigation */}
          <div
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
            style={
              activeTab === "index"
                ? undefined
                : {
                    position: "absolute",
                    inset: 0,
                    visibility: "hidden",
                    pointerEvents: "none",
                  }
            }
          >
            <NovaHomeTab
              animeList={animeList}
              colors={colors}
              favorites={favorites}
              watchHistory={watchHistory}
              onOpenDrawer={() => setDrawerOpen(true)}
              onOpenDetails={(anime) =>
                pushRoute({ type: "anime", anime })
              }
              onOpenEpisodes={(anime) =>
                pushRoute({ type: "episodes", anime })
              }
              onPlayEpisode={(anime, ep) =>
                handleOpenWatch(anime, ep?.number || 1)
              }
              onToggleFav={toggleFavorite}
              onSwitchTab={(tab, sub) => {
                if (tab === "aw-dubbed" && sub) {
                  setDubbedSubTab(sub as any);
                }
                setActiveTab(tab as TabId);
              }}
              onOpenSchedule={() => pushRoute({ type: "schedule" })}
              onOpenLatestEpisodes={() => pushRoute({ type: "latest-episodes" })}
              onOpenAwDubbed={(series) =>
                pushRoute({ type: "aw-dubbed-detail", series })
              }
              onOpenDubbed={(series) =>
                pushRoute({ type: "dubbed-detail", series })
              }
              onOpenStardima={(series) =>
                pushRoute({ type: "stardima-title", series })
              }
            />
          </div>

            {activeTab === "search" && (
              <NovaSearchTab
                animeList={animeList}
                colors={colors}
                favorites={favorites}
                onBack={handleBackPress}
                onSwitchTab={(tab) => setActiveTab(tab as TabId)}
                onOpenDetails={(anime) =>
                  pushRoute({ type: "anime", anime })
                }
                onToggleFav={toggleFavorite}
              />
            )}

            {activeTab === "browse" && (
              <NovaBrowseTab
                animeList={animeList}
                colors={colors}
                favorites={favorites}
                onBack={handleBackPress}
                onSwitchTab={(tab) => setActiveTab(tab as TabId)}
                onOpenDetails={(anime) =>
                  pushRoute({ type: "anime", anime })
                }
                onToggleFav={toggleFavorite}
              />
            )}

            {activeTab === "aw-dubbed" && (
              <NovaDubbedTab
                colors={colors}
                initialSubTab={dubbedSubTab}
                onBack={handleBackPress}
                onOpenAwDubbed={(series) =>
                  pushRoute({ type: "aw-dubbed-detail", series })
                }
                onOpenDubbed={(series) =>
                  pushRoute({ type: "dubbed-detail", series })
                }
                onOpenStardima={(series) =>
                  pushRoute({ type: "stardima-title", series })
                }
              />
            )}

            {activeTab === "downloads" && (
              <NovaDownloadsTab
                downloads={downloads}
                colors={colors}
                onBack={handleBackPress}
                onPlayDownload={(d) => {
                  const found =
                    animeList.find((a) => a.id === d.animeId) || animeList[0];
                  handleOpenWatch(found, d.ep, "anime", undefined, true, 0);
                }}
                onDeleteDownload={(id) =>
                  setDownloads((prev) => prev.filter((d) => d.id !== id))
                }
                onTogglePauseDownload={(id) =>
                  setDownloads((prev) =>
                    prev.map((d) =>
                      d.id === id
                        ? {
                            ...d,
                            status:
                              d.status === "paused" ? "downloading" : "paused",
                          }
                        : d
                    )
                  )
                }
                onClearAll={() => setDownloads([])}
                onToggleGallerySave={(id) =>
                  setDownloads((prev) =>
                    prev.map((d) =>
                      d.id === id
                        ? { ...d, savedToGallery: !d.savedToGallery }
                        : d
                    )
                  )
                }
              />
            )}

            {activeTab === "library" && (
              <NovaLibraryTab
                animeList={animeList}
                colors={colors}
                favorites={favorites}
                watchHistory={watchHistory}
                initialSubTab={librarySubTab}
                onBack={handleBackPress}
                onOpenDetails={(anime) =>
                  pushRoute({ type: "anime", anime })
                }
                onPlayHistory={(h) => {
                  const found =
                    animeList.find((a) => a.id === h.animeId) || animeList[0];
                  handleOpenWatch(
                    found,
                    h.ep,
                    "anime",
                    undefined,
                    true,
                    h.position
                  );
                }}
                onRemoveHistory={(animeId) =>
                  setWatchHistory((prev) =>
                    prev.filter((h) => h.animeId !== animeId)
                  )
                }
                onToggleFav={toggleFavorite}
                onBrowse={() => setActiveTab("browse")}
              />
            )}

            {/* ── Redesigned Luxury Bottom Navigation Bar ── */}
            <nav
              aria-label="التنقل السفلي"
              className="fixed bottom-0 left-0 right-0 z-40 mx-auto px-2.5 pb-2 pt-1"
              style={{
                maxWidth: contentWidth,
                background:
                  theme === "white"
                    ? "linear-gradient(180deg, rgba(248, 250, 252, 0) 0%, rgba(248, 250, 252, 0.92) 35%, #F8FAFC 100%)"
                    : "linear-gradient(180deg, rgba(7, 9, 14, 0) 0%, rgba(7, 9, 14, 0.92) 35%, #07090E 100%)",
              }}
            >
              <div
                className="flex items-center justify-around px-1.5"
                style={{
                  height: tvMode ? 88 : 66,
                  borderRadius: 22,
                  backgroundColor:
                    theme === "white"
                      ? "rgba(255, 255, 255, 0.96)"
                      : "rgba(13, 17, 26, 0.94)",
                  backdropFilter: "blur(18px)",
                  border:
                    theme === "white"
                      ? "1px solid rgba(15, 23, 42, 0.12)"
                      : "1px solid rgba(255, 255, 255, 0.14)",
                  boxShadow:
                    theme === "white"
                      ? "0 10px 28px -6px rgba(15, 23, 42, 0.12)"
                      : "0 14px 34px -6px rgba(0, 0, 0, 0.82)",
                }}
              >
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const focused = activeTab === t.id;
                  const activeColor =
                    theme === "white" ? "#0F172A" : "#FFFFFF";
                  const inactiveColor =
                    theme === "white" ? "#64748B" : "#94A3B8";
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (focused) {
                          scrollToTop();
                        } else {
                          setActiveTab(t.id);
                        }
                      }}
                      className="relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      {/* Top Glowing Active Pill Indicator */}
                      {focused && (
                        <span
                          style={{
                            position: "absolute",
                            top: 2,
                            width: 20,
                            height: 3,
                            borderRadius: 999,
                            backgroundColor:
                              theme === "white" ? "#0F172A" : "#FFFFFF",
                            boxShadow:
                              theme === "white"
                                ? "none"
                                : "0 0 10px rgba(255, 255, 255, 0.75)",
                          }}
                        />
                      )}

                      {/* Icon Capsule */}
                      <div
                        className="flex items-center justify-center transition-all"
                        style={{
                          width: tvMode ? 52 : 44,
                          height: tvMode ? 36 : 30,
                          borderRadius: 12,
                          background: focused
                            ? theme === "white"
                              ? "rgba(15, 23, 42, 0.09)"
                              : "rgba(255, 255, 255, 0.14)"
                            : "transparent",
                          border: focused
                            ? theme === "white"
                              ? "1px solid rgba(15, 23, 42, 0.18)"
                              : "1px solid rgba(255, 255, 255, 0.28)"
                            : "1px solid transparent",
                        }}
                      >
                        <Icon
                          size={tvMode ? 23 : 19}
                          color={focused ? activeColor : inactiveColor}
                          strokeWidth={focused ? 2.5 : 2}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: tvMode ? 14 : 10.5,
                          fontWeight: focused ? 900 : 700,
                          color: focused ? activeColor : inactiveColor,
                          letterSpacing: "0.1px",
                        }}
                      >
                        {t.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
        </div>

        {/* Stack Route: /anime/[id] (animation: fade_from_bottom) */}
        {currentRoute.type === "anime" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-fade-bottom">
            <NovaAnimeDetailScreen
              anime={currentRoute.anime}
              allAnime={animeList}
              colors={colors}
              isFav={favorites.includes(currentRoute.anime.id)}
              onBack={popRoute}
              onToggleFav={toggleFavorite}
              onOpenEpisodes={(anime) => pushRoute({ type: "episodes", anime })}
              onSelectSimilar={(anime) => pushRoute({ type: "anime", anime })}
              onOpenComments={(anime) => pushRoute({ type: "comments", anime })}
            />
          </div>
        )}

        {/* Stack Route: /episodes/[id] (animation: slide_from_bottom) */}
        {currentRoute.type === "episodes" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaEpisodeListScreen
              anime={currentRoute.anime}
              colors={colors}
              onBack={popRoute}
              onSelectEpisode={(anime, epNum) => handleOpenWatch(anime, epNum)}
              onOpenComments={(anime, epNum) =>
                pushRoute({ type: "comments", anime, episodeNumber: epNum })
              }
            />
          </div>
        )}

        {/* Stack Route: /watch (animation: fade) */}
        {currentRoute.type === "watch" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-fade">
            <NovaWatchScreen
              anime={currentRoute.anime}
              episodeNumber={currentRoute.episodeNumber}
              mode={currentRoute.mode}
              seasonLabel={currentRoute.seasonLabel}
              autoStartPlayer={currentRoute.autoStartPlayer}
              initialPositionSec={currentRoute.initialPositionSec}
              colors={colors}
              onBack={popRoute}
              onChangeEpisode={(epNum) =>
                setRouteStack((prev) => [
                  ...prev.slice(0, prev.length - 1),
                  {
                    type: "watch",
                    anime: currentRoute.anime,
                    episodeNumber: epNum,
                    mode: currentRoute.mode,
                    seasonLabel: currentRoute.seasonLabel,
                    autoStartPlayer: currentRoute.autoStartPlayer,
                    initialPositionSec: 0,
                  },
                ])
              }
              onTriggerDownload={handleTriggerDownload}
              onProgressUpdate={(posSec, durSec) => {
                setWatchHistory((prev) =>
                  prev.map((h) =>
                    h.animeId === currentRoute.anime.id
                      ? {
                          ...h,
                          ep: currentRoute.episodeNumber,
                          position: posSec,
                          duration: durSec || h.duration,
                          updatedAt: Date.now(),
                        }
                      : h
                  )
                );
              }}
            />
          </div>
        )}

        {/* Stack Route: /aw-dubbed/[key] (1:1 from artifacts/nova-mobile/app/aw-dubbed/[key].tsx) */}
        {currentRoute.type === "aw-dubbed-detail" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-fade-bottom">
            <NovaAwDubbedDetailScreen
              series={currentRoute.series}
              colors={colors}
              onBack={popRoute}
              onSelectEpisode={(series, season, epNumber) => {
                const pseudoAnime: Anime = {
                  ...animeList[0],
                  id: `aw-${series.key}`,
                  title: series.title,
                  titleAr: series.titleAr || series.title,
                  synopsis: `${series.titleAr || series.title} — ${season.label}`,
                  synopsisAr: `${series.titleAr || series.title} — ${season.label}`,
                  coverImage: series.poster,
                  bannerImage: series.poster,
                  episodesCount: season.episodes.length,
                  episodes: season.episodes.map((e) => ({
                    id: `aw-${series.key}-${e.number}`,
                    number: e.number,
                    title: e.title || `الحلقة ${e.number}`,
                    titleAr: e.title || `الحلقة ${e.number}`,
                    duration: "24:00",
                    videoUrl: e.videoUrl,
                    thumbnail: series.poster,
                  })),
                };
                handleOpenWatch(pseudoAnime, epNumber, "aw-dubbed", season.label);
              }}
            />
          </div>
        )}

        {/* Stack Route: /dubbed/[id] (1:1 from artifacts/nova-mobile/app/dubbed/[id].tsx) */}
        {currentRoute.type === "dubbed-detail" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-fade-bottom">
            <NovaDubbedDetailScreen
              series={currentRoute.series}
              colors={colors}
              onBack={popRoute}
              onSelectEpisode={(series, season, epNumber) =>
                pushRoute({
                  type: "dubbed-watch",
                  series,
                  season,
                  episodeNumber: epNumber,
                })
              }
            />
          </div>
        )}

        {/* Stack Route: /dubbed/watch (1:1 from artifacts/nova-mobile/app/dubbed/watch.tsx) */}
        {currentRoute.type === "dubbed-watch" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-fade">
            <NovaDubbedWatchScreen
              series={currentRoute.series}
              season={currentRoute.season}
              episodeNumber={currentRoute.episodeNumber}
              colors={colors}
              onBack={popRoute}
              onChangeEpisode={(epNum) =>
                setRouteStack((prev) => [
                  ...prev.slice(0, prev.length - 1),
                  {
                    type: "dubbed-watch",
                    series: currentRoute.series,
                    season: currentRoute.season,
                    episodeNumber: epNum,
                  },
                ])
              }
            />
          </div>
        )}

        {/* Stack Route: /stardima-title (1:1 from artifacts/nova-mobile/app/stardima-title.tsx) */}
        {currentRoute.type === "stardima-title" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-fade-bottom">
            <NovaStardimaTitleScreen
              series={currentRoute.series}
              colors={colors}
              onBack={popRoute}
              onSelectEpisode={(series, episode) =>
                pushRoute({
                  type: "stardima-servers",
                  series,
                  episode,
                })
              }
            />
          </div>
        )}

        {/* Stack Route: /stardima-servers (1:1 from artifacts/nova-mobile/app/stardima-servers.tsx) */}
        {currentRoute.type === "stardima-servers" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaStardimaServersScreen
              series={currentRoute.series}
              episode={currentRoute.episode}
              colors={colors}
              onBack={popRoute}
              onSelectServer={(series, episode, quality, serverLabel, videoUrl) =>
                pushRoute({
                  type: "stardima-player",
                  series,
                  episode,
                  quality,
                  serverLabel,
                  videoUrl,
                })
              }
            />
          </div>
        )}

        {/* Stack Route: /stardima-player (1:1 from artifacts/nova-mobile/app/stardima-player.tsx) */}
        {currentRoute.type === "stardima-player" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-fade">
            <NovaStardimaPlayerScreen
              series={currentRoute.series}
              episode={currentRoute.episode}
              quality={currentRoute.quality}
              serverLabel={currentRoute.serverLabel}
              videoUrl={currentRoute.videoUrl}
              colors={colors}
              onBack={popRoute}
            />
          </div>
        )}

        {/* Stack Route: /comments (animation: slide_from_bottom) */}
        {currentRoute.type === "comments" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaCommentsScreen
              anime={currentRoute.anime}
              episodeNumber={currentRoute.episodeNumber}
              colors={colors}
              onBack={popRoute}
            />
          </div>
        )}

        {/* Stack Route: /schedule (animation: slide_from_bottom) */}
        {currentRoute.type === "schedule" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaScheduleScreen
              animeList={animeList}
              colors={colors}
              onBack={popRoute}
              onOpenDetails={(anime) => pushRoute({ type: "anime", anime })}
              onPlayEpisode={(anime) => handleOpenWatch(anime, 1)}
            />
          </div>
        )}

        {/* Stack Route: /settings (animation: slide_from_bottom) */}
        {currentRoute.type === "settings" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaSettingsScreen
              theme={theme}
              colors={colors}
              animeList={animeList}
              favorites={favorites}
              watchHistoryCount={watchHistory.length}
              favoritesCount={favorites.length}
              onSetTheme={setTheme}
              onBack={popRoute}
              onClearHistory={() => setWatchHistory([])}
              onReplaySplash={() => setShowSplash(true)}
              onOpenTelegramModal={() => setShowTelegramModal(true)}
              onOpenKotlinExporter={() => setShowKotlinExporter(true)}
              onOpenTvLink={() => pushRoute({ type: "tv-link" })}
              onToggleFav={toggleFavorite}
              onOpenDetails={(anime) => pushRoute({ type: "anime", anime })}
              onOpenComments={(anime, epNum) =>
                pushRoute({ type: "comments", anime, episodeNumber: epNum })
              }
            />
          </div>
        )}

        {/* Stack Route: /tv-link (animation: slide_from_bottom) */}
        {currentRoute.type === "tv-link" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaTvLinkScreen colors={colors} onBack={popRoute} />
          </div>
        )}

        {/* Stack Route: /global-stats (الإحصائيات العالمية) */}
        {currentRoute.type === "global-stats" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaGlobalStatsScreen
              animeList={animeList}
              colors={colors}
              onBack={popRoute}
              onOpenDrawer={() => setDrawerOpen(true)}
              onOpenDetails={(anime) => pushRoute({ type: "anime", anime })}
            />
          </div>
        )}

        {/* Stack Route: /coming-soon (قادم قريبا) */}
        {currentRoute.type === "coming-soon" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaComingSoonScreen
              animeList={animeList}
              colors={colors}
              onBack={popRoute}
              onOpenDrawer={() => setDrawerOpen(true)}
              onOpenDetails={(anime) => pushRoute({ type: "anime", anime })}
            />
          </div>
        )}

        {/* Stack Route: /latest-episodes (أحدث الحلقات) */}
        {currentRoute.type === "latest-episodes" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaLatestEpisodesScreen
              animeList={animeList}
              colors={colors}
              onBack={popRoute}
              onOpenDrawer={() => setDrawerOpen(true)}
              onPlayEpisode={(anime, epNum) => handleOpenWatch(anime, epNum)}
              onOpenDetails={(anime) => pushRoute({ type: "anime", anime })}
            />
          </div>
        )}

        {/* Stack Route: /seasons (المواسم) */}
        {currentRoute.type === "seasons" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaSeasonsScreen
              animeList={animeList}
              colors={colors}
              onBack={popRoute}
              onOpenDrawer={() => setDrawerOpen(true)}
              onOpenDetails={(anime) => pushRoute({ type: "anime", anime })}
            />
          </div>
        )}

        {/* Stack Route: /manga (المانجا) */}
        {currentRoute.type === "manga" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden nova-anim-slide-bottom">
            <NovaMangaScreen
              colors={colors}
              onBack={popRoute}
              onOpenDrawer={() => setDrawerOpen(true)}
            />
          </div>
        )}
      </main>

      {/* TV Exit Hint (1:1 from artifacts/nova-mobile/app/_layout.tsx lines 187-191) */}
      {tvMode && showTvExitHint && (
        <div
          className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
          style={{ bottom: 34 }}
        >
          <div
            style={{
              paddingLeft: 18,
              paddingRight: 18,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 18,
              backgroundColor: colors.surfaceElevated,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            اضغط مرة أخرى للخروج
          </div>
        </div>
      )}

      {/* Native Android Kotlin Source Code Exporter Modal */}
      {showKotlinExporter && (
        <KotlinCodeExporter
          language="ar"
          onClose={() => setShowKotlinExporter(false)}
        />
      )}
    </div>
  );
}
