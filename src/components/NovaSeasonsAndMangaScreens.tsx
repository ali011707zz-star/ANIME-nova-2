import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Star,
  Play,
  BookOpen,
} from "lucide-react";
import { Anime } from "../types/anime";
import { ThemePalette } from "../constants/novaColors";
import {
  RiftPlayer,
  RiftPlayerServerItem,
  RiftPlayerEpisodeItem,
} from "./RiftPlayer";

/* ══════════════════════════════════════════════════════════════════════════
   1. NovaInternalVideoPlayer — Authentic Nova Mobile RiftPlayer Bridge
      Delegates directly to `src/components/RiftPlayer.tsx` (1:1 port of
      artifacts/nova-mobile/components/RiftPlayer.tsx + skipTimes.ts +
      watchOrientation.ts + volumeManager.ts).
   ══════════════════════════════════════════════════════════════════════════ */
export type InternalPlayerServerItem = RiftPlayerServerItem;
export type InternalPlayerEpisodeItem = RiftPlayerEpisodeItem;
export const NovaInternalVideoPlayer = RiftPlayer;
export { RiftPlayer };


/* ══════════════════════════════════════════════════════════════════════════
   2. NovaSeasonsScreen (المواسم)
      - Opens by default on "current" (الموسم الحالي) per user request
      - Fixed RTL header order: Back Arrow (ChevronRight) + Title on Right,
        Search + Drawer Menu (☰) on Left
   ══════════════════════════════════════════════════════════════════════════ */
type SeasonsTabId = "all" | "upcoming" | "current" | "previous";

const ALL_SEASONS_LIST = Array.from({ length: 2026 - 1990 + 1 }, (_, idx) => {
  const year = 2026 - idx;
  return [
    { id: `fall-${year}`, label: `خريف عام ${year}`, year, season: "خريف" },
    { id: `summer-${year}`, label: `صيف عام ${year}`, year, season: "صيف" },
    { id: `spring-${year}`, label: `ربيع عام ${year}`, year, season: "ربيع" },
    { id: `winter-${year}`, label: `شتاء عام ${year}`, year, season: "شتاء" },
  ];
}).flat();

export function NovaSeasonsScreen({
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
  // Default tab is "current" (الموسم الحالي) per user request
  const [activeTab, setActiveTab] = useState<SeasonsTabId>("current");
  const [selectedSeasonLabel, setSelectedSeasonLabel] = useState<string | null>(
    null
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isLight =
    colors.background === "#F8FAFC" || colors.background === "#FFFFFF";

  const SEASONS_TABS: { id: SeasonsTabId; label: string }[] = [
    { id: "all", label: "جميع المواسم" },
    { id: "upcoming", label: "الموسم القادم" },
    { id: "current", label: "الموسم الحالي" },
    { id: "previous", label: "الموسم السابق" },
  ];

  const filteredSeasons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ALL_SEASONS_LIST;
    return ALL_SEASONS_LIST.filter((s) => s.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const seasonAnimeItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let base = [...animeList];
    if (activeTab === "upcoming") {
      base = [...animeList].reverse();
    } else if (activeTab === "previous") {
      base = animeList
        .filter((_, i) => i % 2 === 0)
        .concat(animeList.filter((_, i) => i % 2 !== 0));
    }
    if (q) {
      base = base.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.titleAr && a.titleAr.toLowerCase().includes(q))
      );
    }
    return base;
  }, [animeList, activeTab, searchQuery]);

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar select-none"
      style={{
        backgroundColor: isLight ? colors.background : "#121212",
        paddingBottom: 48,
      }}
    >
      {/* ── Top App Bar + 4 Tabs ── */}
      <div
        className="sticky top-0 z-30 shrink-0"
        style={{
          backgroundColor: isLight ? colors.surface : "#212124",
          borderBottom: `1px solid ${
            isLight ? colors.border : "rgba(255,255,255,0.08)"
          }`,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 14,
            paddingBottom: 12,
          }}
        >
          {/* Right side in RTL: Back Arrow Button (ChevronRight) + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedSeasonLabel) {
                  setSelectedSeasonLabel(null);
                } else {
                  onBack();
                }
              }}
              aria-label="رجوع"
              className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
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
                fontSize: 19,
                fontWeight: 800,
                color: colors.textPrimary,
              }}
            >
              {selectedSeasonLabel ? selectedSeasonLabel : "المواسم"}
            </h1>
          </div>

          {/* Left side in RTL: Search + Drawer Menu Button (☰) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearchQuery("");
              }}
              aria-label="بحث"
              className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
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
              className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
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

        {/* Optional Search Input */}
        {searchOpen && (
          <div className="px-4 pb-3">
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
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
                placeholder="ابحث عن موسم أو أنمي..."
                className="flex-1 bg-transparent outline-none text-right"
                style={{ fontSize: 13, color: colors.textPrimary }}
              />
            </div>
          </div>
        )}

        {/* 4 Tabs Row with Amber/Gold Active Indicator (#F59E0B) */}
        <div className="grid grid-cols-4">
          {SEASONS_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedSeasonLabel(null);
                }}
                className="relative py-3 text-center cursor-pointer transition-colors"
              >
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: active ? 800 : 700,
                    color: active
                      ? "#F59E0B"
                      : isLight
                      ? colors.textSecondary
                      : "#9CA3AF",
                  }}
                >
                  {tab.label}
                </span>
                {active && (
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: 3,
                      backgroundColor: "#F59E0B",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content Area ── */}
      {activeTab === "all" && !selectedSeasonLabel ? (
        /* Vertical Seasons List (1:1 from Screenshot_20261028-133902_cfaea5be.png) */
        <div className="flex flex-col pt-2">
          {filteredSeasons.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeasonLabel(s.label)}
              className="relative flex items-center justify-center px-6 py-5 cursor-pointer active:opacity-75 transition-opacity"
              style={{
                borderBottom: isLight
                  ? `1px solid ${colors.border}`
                  : "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  textAlign: "center",
                }}
              >
                {s.label}
              </span>
              <div className="absolute left-5 flex items-center justify-center">
                <ChevronLeft size={24} color={colors.textPrimary} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Season Anime Grid (Opens by default for الموسم الحالي) */
        <div className="flex flex-col p-3.5 gap-3">
          <div className="flex items-center justify-between px-1">
            <span
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: colors.textPrimary,
              }}
            >
              {selectedSeasonLabel
                ? `أنميات ${selectedSeasonLabel}`
                : activeTab === "current"
                ? "أنميات الموسم الحالي (ربيع 2026)"
                : activeTab === "upcoming"
                ? "أنميات الموسم القادم (صيف 2026)"
                : "أنميات الموسم السابق (شتاء 2026)"}
            </span>
            {selectedSeasonLabel && (
              <button
                onClick={() => setSelectedSeasonLabel(null)}
                className="flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  color: "#F59E0B",
                  fontSize: 11.5,
                  fontWeight: 800,
                }}
              >
                <ChevronRight size={14} color="#F59E0B" />
                <span>كل المواسم</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {seasonAnimeItems.map((anime) => (
              <div
                key={anime.id}
                onClick={() => onOpenDetails(anime)}
                className="flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    aspectRatio: "2 / 2.9",
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <img
                    src={anime.coverImage}
                    alt={anime.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 pointer-events-none"
                    style={{
                      height: "40%",
                      background:
                        "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.82) 100%)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      padding: "2px 7px",
                      borderRadius: 999,
                      backgroundColor: "rgba(16, 185, 129, 0.92)",
                      color: "#FFFFFF",
                      fontSize: 8.5,
                      fontWeight: 900,
                    }}
                  >
                    {anime.status === "airing" ? "يُعرض" : "مكتمل"}
                  </span>
                  <span
                    dir="ltr"
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: 7,
                      fontSize: 10.5,
                      fontWeight: 900,
                      color: "#FBBF24",
                    }}
                  >
                    ★ {anime.score.toFixed(1)}
                  </span>
                </div>
                <span
                  className="line-clamp-1 mt-1.5"
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    textAlign: "right",
                  }}
                >
                  {anime.titleAr || anime.title}
                </span>
                <span
                  dir="ltr"
                  className="line-clamp-1"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: colors.textMuted,
                    textAlign: "right",
                  }}
                >
                  {anime.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. NovaMangaScreen (قسم المانجا المترجمة — مع قارئ الفصول الداخلي)
      - Fixed RTL header order: Back Arrow (ChevronRight) + Title on Right,
        Search + Drawer Menu (☰) on Left
   ══════════════════════════════════════════════════════════════════════════ */
interface MangaItem {
  id: string;
  title: string;
  titleAr: string;
  cover: string;
  type: "مانجا يابانية" | "مانهوا كورية";
  status: "مستمرة" | "مكتملة";
  score: number;
  chaptersCount: number;
  genres: string[];
  synopsis: string;
}

const MANGA_DATABASE: MangaItem[] = [
  {
    id: "manga-solo-leveling",
    title: "Solo Leveling",
    titleAr: "سولو ليفلينغ — الارتقاء المنفرد",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
    type: "مانهوا كورية",
    status: "مكتملة",
    score: 9.4,
    chaptersCount: 200,
    genres: ["أكشن", "خيال", "مغامرة"],
    synopsis:
      "من أضعف صياد في العالم إلى عاهل الظلال الأعظم؛ رحلة سونغ جين وو الكاملة بالألوان الكاملة ومترجمة للعربية.",
  },
  {
    id: "manga-one-piece",
    title: "One Piece",
    titleAr: "ون بيس (مانجا ملونة ورسمية)",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
    type: "مانجا يابانية",
    status: "مستمرة",
    score: 9.5,
    chaptersCount: 1142,
    genres: ["مغامرة", "أكشن", "خيال"],
    synopsis:
      "مغامرة مونكي دي لوفي وطاقم قبعة القش في العالم الجديد بحثاً عن الكنز الأسطوري ون بيس.",
  },
  {
    id: "manga-jjk",
    title: "Jujutsu Kaisen",
    titleAr: "جوجوتسو كايسن",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
    type: "مانجا يابانية",
    status: "مكتملة",
    score: 9.1,
    chaptersCount: 271,
    genres: ["أكشن", "خارق للطبيعة", "شياطين"],
    synopsis:
      "معارك مستخدمي الجوجوتسو ضد اللعنات الخاصة وملك اللعنات ريوين سوكونا في طوكيو وشيبويا.",
  },
  {
    id: "manga-frieren",
    title: "Sousou no Frieren",
    titleAr: "فريرن: ما وراء نهاية الرحلة",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg",
    type: "مانجا يابانية",
    status: "مستمرة",
    score: 9.3,
    chaptersCount: 138,
    genres: ["خيال", "دراما", "مغامرة"],
    synopsis:
      "رحلة الساحرة الخالدة فريرن لاكتشاف معنى الروابط الإنسانية بعد هزيمة ملك الشياطين.",
  },
  {
    id: "manga-aot",
    title: "Attack on Titan",
    titleAr: "هجوم العمالقة",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg",
    type: "مانجا يابانية",
    status: "مكتملة",
    score: 9.2,
    chaptersCount: 139,
    genres: ["أكشن", "دراما", "غموض"],
    synopsis:
      "ملحمة إيرين ييغر وفيلق الاستطلاع في مواجهة العمالقة وكشف أسرار العالم خلف الأسوار.",
  },
  {
    id: "manga-demon-slayer",
    title: "Kimetsu no Yaiba",
    titleAr: "قاتل الشياطين: قلعة اللانهاية",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
    type: "مانجا يابانية",
    status: "مكتملة",
    score: 9.0,
    chaptersCount: 205,
    genres: ["أكشن", "تاريخي", "خارق للطبيعة"],
    synopsis:
      "الفصول الكاملة لمعركة تانجيرو والهاشيرا الحاسمة داخل قلعة اللانهاية ضد كيبوتسوجي موزان.",
  },
  {
    id: "manga-blue-lock",
    title: "Blue Lock",
    titleAr: "بلو لوك — القفل الأزرق",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png",
    type: "مانجا يابانية",
    status: "مستمرة",
    score: 8.9,
    chaptersCount: 295,
    genres: ["رياضة", "أكشن", "نفسي"],
    synopsis:
      "منافسات دوري الأنانية الجديد لصناعة أفضل مهاجم في العالم بقيادة يويتشي إيساغي.",
  },
  {
    id: "manga-hxh",
    title: "Hunter x Hunter",
    titleAr: "القناص — القارة المظلمة",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png",
    type: "مانجا يابانية",
    status: "مستمرة",
    score: 9.3,
    chaptersCount: 410,
    genres: ["أكشن", "مغامرة", "خيال"],
    synopsis:
      "أحدث فصول حرب الخلافة والرحلة نحو القارة المظلمة بترجمة عربية احترافية.",
  },
  {
    id: "manga-opm",
    title: "One-Punch Man",
    titleAr: "ون بنش مان (رسم موراتا)",
    cover:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg",
    type: "مانجا يابانية",
    status: "مستمرة",
    score: 9.1,
    chaptersCount: 252,
    genres: ["أكشن", "كوميديا", "أبطال خارقين"],
    synopsis:
      "معارك سايتاما وجمعية الأبطال برسوم يوسوكي موراتا فائقة الدقة.",
  },
];

export function NovaMangaScreen({
  colors,
  onBack,
  onOpenDrawer,
}: {
  colors: ThemePalette;
  onBack: () => void;
  onOpenDrawer: () => void;
}) {
  const [filterTab, setFilterTab] = useState<
    "all" | "ongoing" | "completed" | "manhwa"
  >("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedManga, setSelectedManga] = useState<MangaItem | null>(null);
  const [readingChapter, setReadingChapter] = useState<number | null>(null);
  const [chapterSortAsc, setChapterSortAsc] = useState<boolean>(true);
  const [chapterDropdownOpen, setChapterDropdownOpen] = useState<boolean>(false);
  const [chapterDropdownQuery, setChapterDropdownQuery] = useState<string>("");
  const readerScrollRef = useRef<HTMLDivElement | null>(null);

  const getChapterSubtitleAr = (chNum: number): string => {
    const map: Record<number, string> = {
      1: "بداية الرحلة واليقظة الأولى",
      2: "المواجهة الثانية: اختبار القوة الحقيقية",
      3: "أسرار الطابق المظلم والعدو الخفي",
      4: "تحالف غير متوقع في قلب المعركة",
      5: "ظهور القائد الأعلى وبداية الاختبار",
      6: "انكسار الختم وتحرر الطاقة الكامنة",
      7: "معركة القلعة الحاسمة",
    };
    return map[chNum] || `أحداث الفصل ${chNum}: تصاعد المواجهة الحاسمة`;
  };

  // Scroll reader container to top whenever chapter changes
  useEffect(() => {
    setChapterDropdownOpen(false);
    setChapterDropdownQuery("");
    if (readingChapter !== null && readerScrollRef.current) {
      readerScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [readingChapter, selectedManga]);

  const isLight =
    colors.background === "#F8FAFC" || colors.background === "#FFFFFF";

  const filteredList = useMemo(() => {
    let list = MANGA_DATABASE;
    if (filterTab === "ongoing") {
      list = list.filter((m) => m.status === "مستمرة");
    } else if (filterTab === "completed") {
      list = list.filter((m) => m.status === "مكتملة");
    } else if (filterTab === "manhwa") {
      list = list.filter((m) => m.type === "مانهوا كورية");
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.titleAr.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filterTab, searchQuery]);

  /* ── Interactive Chapter Reader View ── */
  if (selectedManga && readingChapter !== null) {
    const maxCh = Math.max(1, selectedManga.chaptersCount);
    const hasPrevChapter = readingChapter > 1;
    const hasNextChapter = readingChapter < maxCh;
    const dropdownTotal = Math.min(60, maxCh);
    const allDropdownChapters = Array.from(
      { length: dropdownTotal },
      (_, idx) => idx + 1
    ).filter((chNum) => {
      const q = chapterDropdownQuery.trim();
      if (!q) return true;
      return (
        String(chNum).includes(q) ||
        `الفصل ${chNum}`.includes(q) ||
        getChapterSubtitleAr(chNum).includes(q)
      );
    });

    const chapterPoolImages = [
      selectedManga.cover,
      "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg",
      "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg",
      "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg",
      "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21087-sHb9zUZFsHe1.jpg",
      "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKBUDDS6L.jpg",
    ];

    const chapterTitleAr = getChapterSubtitleAr(readingChapter);

    const pages = [0, 1, 2, 3].map((pageIdx) => {
      const imgUrl =
        chapterPoolImages[(readingChapter + pageIdx - 1) % chapterPoolImages.length];
      const pageCaptions = [
        `الفصل ${readingChapter} (${chapterTitleAr}) — تبدأ المشاهد الأولى بتوتر عالٍ مع دخول البطل إلى منطقة الخطر الجديدة.`,
        `الفصل ${readingChapter} · مشهد القتال — تشتد المواجهة وتظهر مهارات جديدة لم تُكشف في الفصول السابقة!`,
        `الفصل ${readingChapter} · نقطة التحول — انكشاف سر خطير يقلب موازين القوة في هذا الفصل.`,
        `نهاية الفصل ${readingChapter} — تشويق ناري يمهد لأحداث الفصل ${Math.min(
          maxCh,
          readingChapter + 1
        )} القادم!`,
      ];
      return {
        imgUrl,
        caption: pageCaptions[pageIdx] || selectedManga.synopsis,
      };
    });

    const goToChapter = (targetChapter: number) => {
      const clamped = Math.max(1, Math.min(maxCh, targetChapter));
      setReadingChapter(clamped);
      setChapterDropdownOpen(false);
      if (readerScrollRef.current) {
        readerScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    return (
      <div
        ref={readerScrollRef}
        dir="rtl"
        data-testid="manga-reader-screen"
        className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar select-none relative"
        style={{ backgroundColor: "#090D16" }}
      >
        {/* Reader Top Bar */}
        <div
          className="sticky top-0 z-40 flex flex-col"
          style={{
            backgroundColor: "rgba(9, 13, 22, 0.96)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                data-testid="manga-reader-back-btn"
                onClick={() => setReadingChapter(null)}
                className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer shrink-0 active:scale-95 transition-transform"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <ChevronRight size={19} color="#FFFFFF" />
              </button>
              <div className="min-w-0">
                <div
                  className="line-clamp-1"
                  style={{
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {selectedManga.titleAr}
                </div>
                <div
                  data-testid="manga-reader-chapter-indicator"
                  className="line-clamp-1"
                  style={{
                    color: "#F59E0B",
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                >
                  الفصل {readingChapter} · {chapterTitleAr}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                data-testid="manga-prev-chapter-btn"
                disabled={!hasPrevChapter}
                onClick={() => goToChapter(readingChapter - 1)}
                className="px-2.5 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-transform"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 800,
                  opacity: !hasPrevChapter ? 0.4 : 1,
                }}
              >
                السابق
              </button>

              {/* Elegant Custom Chapter Dropdown Trigger Button */}
              <button
                type="button"
                data-testid="manga-chapter-dropdown-btn"
                onClick={() => setChapterDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-all"
                style={{
                  background: chapterDropdownOpen
                    ? "linear-gradient(135deg, rgba(245, 158, 11, 0.28) 0%, rgba(217, 119, 6, 0.22) 100%)"
                    : "rgba(245, 158, 11, 0.14)",
                  border: "1px solid rgba(245, 158, 11, 0.55)",
                  boxShadow: chapterDropdownOpen
                    ? "0 0 16px rgba(245, 158, 11, 0.35)"
                    : "none",
                }}
              >
                <BookOpen size={13} color="#FBBF24" />
                <span
                  style={{
                    color: "#FBBF24",
                    fontSize: 11.5,
                    fontWeight: 900,
                  }}
                >
                  الفصل {readingChapter}
                </span>
                {chapterDropdownOpen ? (
                  <ChevronUp size={14} color="#FBBF24" />
                ) : (
                  <ChevronDown size={14} color="#FBBF24" />
                )}
              </button>

              <button
                type="button"
                data-testid="manga-next-chapter-btn"
                disabled={!hasNextChapter}
                onClick={() => goToChapter(readingChapter + 1)}
                className="px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  color: "#090D16",
                  fontSize: 11,
                  fontWeight: 900,
                  opacity: !hasNextChapter ? 0.4 : 1,
                }}
              >
                الفصل التالي
              </button>
            </div>
          </div>

          {/* Elegant Floating Chapter Dropdown Menu inside Reader */}
          {chapterDropdownOpen && (
            <div
              data-testid="manga-chapter-dropdown-menu"
              className="mx-3.5 mb-3 rounded-2xl overflow-hidden nova-anim-fade"
              style={{
                backgroundColor: "#0F172A",
                border: "1.5px solid rgba(245, 158, 11, 0.45)",
                boxShadow: "0 20px 44px rgba(0, 0, 0, 0.88)",
              }}
            >
              <div
                className="px-3.5 py-2.5 flex items-center justify-between gap-2"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.10)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={14} color="#F59E0B" />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#FFFFFF",
                    }}
                  >
                    اختر الفصل للانتقال السريع
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#FBBF24",
                    padding: "2px 8px",
                    borderRadius: 999,
                    backgroundColor: "rgba(245, 158, 11, 0.16)",
                  }}
                >
                  {maxCh} فصل متاح
                </span>
              </div>

              {/* Search inside Dropdown */}
              <div className="p-2.5 pb-1.5">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                  }}
                >
                  <Search size={13} color="#94A3B8" />
                  <input
                    type="text"
                    data-testid="manga-dropdown-search-input"
                    value={chapterDropdownQuery}
                    onChange={(e) => setChapterDropdownQuery(e.target.value)}
                    placeholder="ابحث عن رقم أو عنوان الفصل..."
                    className="flex-1 bg-transparent outline-none text-right"
                    style={{ fontSize: 11.5, color: "#FFFFFF" }}
                  />
                  {chapterDropdownQuery && (
                    <button
                      type="button"
                      onClick={() => setChapterDropdownQuery("")}
                      className="cursor-pointer"
                    >
                      <X size={13} color="#94A3B8" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chapters List inside Dropdown */}
              <div
                className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1.5"
              >
                {allDropdownChapters.map((chNum) => {
                  const active = chNum === readingChapter;
                  return (
                    <button
                      key={chNum}
                      type="button"
                      data-testid={`manga-dropdown-item-${chNum}`}
                      onClick={() => goToChapter(chNum)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-right transition-all"
                      style={{
                        backgroundColor: active
                          ? "rgba(245, 158, 11, 0.18)"
                          : "rgba(255, 255, 255, 0.03)",
                        border: active
                          ? "1px solid rgba(245, 158, 11, 0.55)"
                          : "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          dir="ltr"
                          className="shrink-0 flex items-center justify-center rounded-lg"
                          style={{
                            width: 30,
                            height: 26,
                            backgroundColor: active
                              ? "#F59E0B"
                              : "rgba(255, 255, 255, 0.08)",
                            color: active ? "#090D16" : "#E2E8F0",
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          #{chNum}
                        </span>
                        <div className="min-w-0">
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: active ? "#FBBF24" : "#FFFFFF",
                            }}
                          >
                            الفصل {chNum}
                          </div>
                          <div
                            className="line-clamp-1"
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "rgba(203, 213, 225, 0.72)",
                            }}
                          >
                            {getChapterSubtitleAr(chNum)}
                          </div>
                        </div>
                      </div>

                      {active ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: "rgba(245, 158, 11, 0.22)",
                            color: "#FBBF24",
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          <Check size={11} color="#FBBF24" />
                          <span>يُقرأ الآن</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: "#94A3B8",
                          }}
                        >
                          قراءة ←
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reader Pages */}
        <div
          key={`chapter-pages-${readingChapter}`}
          className="flex flex-col items-center gap-3 p-3 pb-20"
        >
          {pages.map((page, i) => (
            <div
              key={`${readingChapter}-page-${i}`}
              className="relative w-full overflow-hidden rounded-xl"
              style={{
                backgroundColor: "#111827",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <img
                src={page.imgUrl}
                alt={`صفحة ${i + 1} - الفصل ${readingChapter}`}
                className="w-full object-cover"
                style={{ minHeight: 210, maxHeight: 340 }}
              />
              <div
                className="p-4 text-right"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.96)",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    color: "#F59E0B",
                    fontSize: 11,
                    fontWeight: 900,
                    marginBottom: 4,
                  }}
                >
                  صفحة {i + 1} من {pages.length} — الفصل {readingChapter}
                </div>
                <p
                  className="m-0"
                  style={{
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: "22px",
                  }}
                >
                  {page.caption}
                </p>
              </div>
            </div>
          ))}

          {/* End-of-Chapter Navigation Card for Smooth Transition to Chapter 2 / Next Chapter */}
          <div
            className="w-full p-4 rounded-2xl flex items-center justify-between gap-3 mt-2"
            style={{
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
            }}
          >
            <div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                أكملت قراءة الفصل {readingChapter}
              </div>
              <div
                style={{
                  color: "#94A3B8",
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {hasNextChapter
                  ? `جاهز للانتقال مباشرة إلى الفصل ${readingChapter + 1}`
                  : "وصلت إلى آخر فصل متاح حالياً"}
              </div>
            </div>

            {hasNextChapter && (
              <button
                type="button"
                data-testid="manga-bottom-next-chapter-btn"
                onClick={() => goToChapter(readingChapter + 1)}
                className="px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform shrink-0"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#090D16",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                انتقل للفصل {readingChapter + 1} ←
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Manga Detail & Chapters List View (with Elegant Chapter Dropdown) ── */
  if (selectedManga) {
    const count = Math.min(30, selectedManga.chaptersCount);
    const chapterNumbers = Array.from({ length: count }, (_, idx) =>
      chapterSortAsc ? idx + 1 : Math.max(1, selectedManga.chaptersCount - idx)
    );
    const detailDropdownChapters = Array.from(
      { length: Math.min(50, selectedManga.chaptersCount) },
      (_, idx) => idx + 1
    ).filter((chNum) => {
      const q = chapterDropdownQuery.trim();
      if (!q) return true;
      return (
        String(chNum).includes(q) ||
        `الفصل ${chNum}`.includes(q) ||
        getChapterSubtitleAr(chNum).includes(q)
      );
    });

    return (
      <div
        dir="rtl"
        className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar select-none"
        style={{ backgroundColor: colors.background, paddingBottom: 48 }}
      >
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedManga(null)}
              className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer"
              style={{
                backgroundColor: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <ChevronRight size={19} color={colors.textPrimary} />
            </button>
            <span
              className="line-clamp-1"
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: colors.textPrimary,
              }}
            >
              {selectedManga.titleAr}
            </span>
          </div>
          <span
            style={{
              padding: "3px 9px",
              borderRadius: 999,
              backgroundColor: "rgba(245, 158, 11, 0.16)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "#F59E0B",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {selectedManga.type}
          </span>
        </div>

        {/* Hero Summary Card */}
        <div className="p-4">
          <div
            className="p-4 rounded-2xl flex gap-3.5 items-start"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <img
              src={selectedManga.cover}
              alt={selectedManga.title}
              className="shrink-0 object-cover"
              style={{
                width: 112,
                height: 162,
                borderRadius: 14,
                border: `1px solid ${colors.border}`,
              }}
            />
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <h2
                className="m-0"
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: colors.textPrimary,
                }}
              >
                {selectedManga.titleAr}
              </h2>
              <span
                dir="ltr"
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: colors.textMuted,
                  textAlign: "right",
                }}
              >
                {selectedManga.title}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 8,
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10B981",
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                >
                  {selectedManga.status}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 8,
                    backgroundColor: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                >
                  {selectedManga.chaptersCount} فصل
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 8,
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    color: "#F59E0B",
                    fontSize: 10.5,
                    fontWeight: 900,
                  }}
                >
                  ★ {selectedManga.score}
                </span>
              </div>
              <p
                className="m-0 mt-1 line-clamp-3"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.textSecondary,
                  lineHeight: "19px",
                }}
              >
                {selectedManga.synopsis}
              </p>
            </div>
          </div>
        </div>

        {/* Elegant Chapter Dropdown Selector Bar on Manga Detail Screen */}
        <div className="px-4 mb-3">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: colors.card,
              border: "1.5px solid rgba(245, 158, 11, 0.4)",
            }}
          >
            <button
              type="button"
              data-testid="manga-detail-chapter-dropdown-btn"
              onClick={() => setChapterDropdownOpen((o) => !o)}
              className="w-full px-4 py-3.5 flex items-center justify-between cursor-pointer text-right"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.06) 100%)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: "rgba(245, 158, 11, 0.2)",
                    border: "1px solid rgba(245, 158, 11, 0.45)",
                  }}
                >
                  <BookOpen size={16} color="#F59E0B" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: colors.textPrimary,
                    }}
                  >
                    قائمة اختيار فصول المانجا المنسدلة
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: colors.textSecondary,
                    }}
                  >
                    اختر أي فصل من (الفصل 1 إلى {selectedManga.chaptersCount}) للانتقال الفوري
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#090D16",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                <span>اختر الفصل</span>
                {chapterDropdownOpen ? (
                  <ChevronUp size={14} color="#090D16" />
                ) : (
                  <ChevronDown size={14} color="#090D16" />
                )}
              </div>
            </button>

            {chapterDropdownOpen && (
              <div
                data-testid="manga-detail-chapter-dropdown-menu"
                className="p-3 flex flex-col gap-2"
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: colors.input,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Search size={14} color={colors.textMuted} />
                  <input
                    type="text"
                    value={chapterDropdownQuery}
                    onChange={(e) => setChapterDropdownQuery(e.target.value)}
                    placeholder="ابحث برقم الفصل (مثال: 2، 5، 10)..."
                    className="flex-1 bg-transparent outline-none text-right"
                    style={{ fontSize: 12, color: colors.textPrimary }}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5">
                  {detailDropdownChapters.map((chNum) => (
                    <button
                      key={chNum}
                      type="button"
                      data-testid={`manga-detail-dropdown-item-${chNum}`}
                      onClick={() => setReadingChapter(chNum)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-right transition-all"
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          dir="ltr"
                          className="shrink-0 flex items-center justify-center rounded-lg"
                          style={{
                            width: 30,
                            height: 26,
                            backgroundColor: "rgba(245, 158, 11, 0.18)",
                            color: "#F59E0B",
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          #{chNum}
                        </span>
                        <div className="min-w-0">
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 900,
                              color: colors.textPrimary,
                            }}
                          >
                            الفصل {chNum}
                          </div>
                          <div
                            className="line-clamp-1"
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: colors.textMuted,
                            }}
                          >
                            {getChapterSubtitleAr(chNum)}
                          </div>
                        </div>
                      </div>

                      <span
                        className="px-2.5 py-1 rounded-lg shrink-0"
                        style={{
                          backgroundColor: "rgba(245, 158, 11, 0.16)",
                          color: "#F59E0B",
                          fontSize: 10.5,
                          fontWeight: 900,
                        }}
                      >
                        قراءة الفصل ←
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chapters List */}
        <div className="px-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 900,
                color: colors.textPrimary,
              }}
            >
              قائمة الفصول المترجمة
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setChapterSortAsc((v) => !v)}
                className="px-2.5 py-1.5 rounded-xl cursor-pointer"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  color: colors.textSecondary,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {chapterSortAsc ? "الترتيب: من الفصل 1 ↑" : "الترتيب: الأحدث ↓"}
              </button>
              <button
                type="button"
                data-testid="start-chapter-1-btn"
                onClick={() => setReadingChapter(1)}
                className="px-3.5 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-transform"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#090D16",
                  fontSize: 11.5,
                  fontWeight: 900,
                }}
              >
                ابدأ من الفصل 1
              </button>
            </div>
          </div>

          {chapterNumbers.map((ch) => (
            <button
              key={ch}
              type="button"
              data-testid={`manga-chapter-btn-${ch}`}
              onClick={() => setReadingChapter(ch)}
              className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer active:scale-[0.99] transition-transform"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen size={16} color="#F59E0B" className="shrink-0" />
                <div className="text-right min-w-0">
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: colors.textPrimary,
                    }}
                  >
                    الفصل {ch}
                  </div>
                  <div
                    className="line-clamp-1"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: colors.textMuted,
                    }}
                  >
                    {getChapterSubtitleAr(ch)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#F59E0B",
                  }}
                >
                  مترجم عربي
                </span>
                <ChevronLeft size={16} color={colors.textMuted} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Main Manga Catalog View ── */
  const TABS = [
    { id: "all", label: "جميع المانجا" },
    { id: "ongoing", label: "مستمرة" },
    { id: "completed", label: "مكتملة" },
    { id: "manhwa", label: "مانهوا ملونة" },
  ] as const;

  return (
    <div
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar select-none"
      style={{ backgroundColor: colors.background, paddingBottom: 48 }}
    >
      {/* Top Bar */}
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
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 14,
            paddingBottom: 12,
          }}
        >
          {/* Right side in RTL: Back Arrow Button (ChevronRight) + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="رجوع"
              className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
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
                fontSize: 19,
                fontWeight: 800,
                color: colors.textPrimary,
              }}
            >
              المانجا
            </h1>
          </div>

          {/* Left side in RTL: Search + Drawer Menu Button (☰) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearchQuery("");
              }}
              aria-label="بحث"
              className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
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
              className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
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
          <div className="px-4 pb-3">
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
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
                placeholder="ابحث في المانجا والمانهوا..."
                className="flex-1 bg-transparent outline-none text-right"
                style={{ fontSize: 13, color: colors.textPrimary }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-4">
          {TABS.map((t) => {
            const active = filterTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id)}
                className="relative py-3 text-center cursor-pointer"
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 800 : 700,
                    color: active
                      ? "#F59E0B"
                      : isLight
                      ? colors.textSecondary
                      : "#9CA3AF",
                  }}
                >
                  {t.label}
                </span>
                {active && (
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: 3, backgroundColor: "#F59E0B" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Manga Poster Grid */}
      <div className="grid grid-cols-3 gap-3 p-3.5">
        {filteredList.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedManga(item)}
            className="flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "2 / 2.95",
                borderRadius: 12,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <img
                src={item.cover}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: "45%",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.86) 100%)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  padding: "2px 7px",
                  borderRadius: 999,
                  backgroundColor:
                    item.status === "مستمرة"
                      ? "rgba(16, 185, 129, 0.92)"
                      : "rgba(245, 158, 11, 0.92)",
                  color: "#FFFFFF",
                  fontSize: 8.5,
                  fontWeight: 900,
                }}
              >
                {item.status}
              </span>
              <span
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 7,
                  fontSize: 10,
                  fontWeight: 900,
                  color: "#FFFFFF",
                }}
              >
                {item.chaptersCount} فصل
              </span>
            </div>

            <span
              className="line-clamp-1 mt-1.5"
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: colors.textPrimary,
                textAlign: "right",
              }}
            >
              {item.titleAr}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: colors.textMuted,
                textAlign: "right",
              }}
            >
              {item.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
