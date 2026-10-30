import { Anime } from "../types/anime";

export interface ScheduleDayInfo {
  id: number; // 0 = Sunday ... 6 = Saturday, -1 = All Week
  label: string;
  shortLabel: string;
}

export const AR_SCHEDULE_DAYS: ScheduleDayInfo[] = [
  { id: 6, label: "السبت", shortLabel: "سبت" },
  { id: 0, label: "الأحد", shortLabel: "أحد" },
  { id: 1, label: "الاثنين", shortLabel: "اثنين" },
  { id: 2, label: "الثلاثاء", shortLabel: "ثلاثاء" },
  { id: 3, label: "الأربعاء", shortLabel: "أربعاء" },
  { id: 4, label: "الخميس", shortLabel: "خميس" },
  { id: 5, label: "الجمعة", shortLabel: "جمعة" },
];

export type AiringSlotStatus = "live" | "upcoming" | "aired";

export type ScheduleStatusFilter = "all" | "upcoming" | "aired";
export type ScheduleSortBy = "time" | "score";

export interface EnrichedScheduleEntry {
  id: string;
  anime: Anime;
  dayOfWeek: number; // 0..6
  dayLabel: string;
  episodeNumber: number;
  episodeTitleAr: string;
  airTime24: string; // e.g. "20:30"
  airTimeLabelAr: string; // e.g. "08:30 مساءً"
  airTimeMinutes: number; // minutes from midnight for sorting
  slotStatus: AiringSlotStatus;
  countdownLabelAr: string;
  studio: string;
  genreLabelAr: string;
  formatLabel: string;
  qualityBadge: string;
}

export interface ScheduleStats {
  totalWeeklyEpisodes: number;
  todayCount: number;
  liveOrUpcomingCount: number;
  dayCounts: Record<number, number>;
  nextHighlight: EnrichedScheduleEntry | null;
}

const BROADCAST_SLOTS: {
  hour: number;
  minute: number;
  labelAr: string;
}[] = [
  { hour: 16, minute: 30, labelAr: "04:30 مساءً" },
  { hour: 17, minute: 30, labelAr: "05:30 مساءً" },
  { hour: 18, minute: 0, labelAr: "06:00 مساءً" },
  { hour: 19, minute: 0, labelAr: "07:00 مساءً" },
  { hour: 19, minute: 30, labelAr: "07:30 مساءً" },
  { hour: 20, minute: 0, labelAr: "08:00 مساءً" },
  { hour: 20, minute: 30, labelAr: "08:30 مساءً" },
  { hour: 21, minute: 0, labelAr: "09:00 مساءً" },
  { hour: 21, minute: 30, labelAr: "09:30 مساءً" },
  { hour: 22, minute: 0, labelAr: "10:00 مساءً" },
  { hour: 22, minute: 30, labelAr: "10:30 مساءً" },
  { hour: 23, minute: 0, labelAr: "11:00 مساءً" },
];

export function getDayLabelAr(dayOfWeek: number): string {
  const found = AR_SCHEDULE_DAYS.find((d) => d.id === dayOfWeek);
  return found ? found.label : "كل الأسبوع";
}

/**
 * Deterministically builds a rich 7-day anime broadcast schedule from the catalog
 * so every day of the week has realistic broadcast slots, episode numbers, and statuses.
 */
export function buildWeeklySchedule(
  animeList: Anime[],
  nowDate: Date = new Date()
): EnrichedScheduleEntry[] {
  if (!Array.isArray(animeList) || animeList.length === 0) {
    return [];
  }

  const episodicList = animeList.filter(
    (a) => a.format !== "MOVIE" && (a.episodesCount || 0) > 1
  );
  const pool = episodicList.length > 0 ? episodicList : animeList;

  const currentDay = nowDate.getDay();
  const currentMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  // Ensure every day (0..6) has multiple entries by distributing the catalog across the week
  const entries: EnrichedScheduleEntry[] = [];
  const totalPasses = Math.max(28, pool.length * 3);

  for (let i = 0; i < totalPasses; i++) {
    const anime = pool[i % pool.length];
    const dayOfWeek = i % 7;
    const slot = BROADCAST_SLOTS[(i * 3 + dayOfWeek) % BROADCAST_SLOTS.length];
    const airTimeMinutes = slot.hour * 60 + slot.minute;
    const airTime24 = `${String(slot.hour).padStart(2, "0")}:${String(
      slot.minute
    ).padStart(2, "0")}`;

    const baseEpCount = Math.max(1, anime.episodesCount || 12);
    const episodeNumber = ((i + dayOfWeek * 2) % Math.min(baseEpCount, 24)) + 1;
    const matchedEp = anime.episodes?.find((e) => e.number === episodeNumber);
    const episodeTitleAr =
      matchedEp?.titleAr ||
      matchedEp?.title ||
      `الحلقة ${episodeNumber} — بث أسبوعي مترجم`;

    let slotStatus: AiringSlotStatus = "upcoming";
    let countdownLabelAr = "يُعرض قريباً";

    if (dayOfWeek === currentDay) {
      const diffMinutes = airTimeMinutes - currentMinutes;
      if (Math.abs(diffMinutes) <= 35) {
        slotStatus = "live";
        countdownLabelAr = "يُعرض الآن مباشر";
      } else if (diffMinutes > 35) {
        slotStatus = "upcoming";
        const hoursLeft = Math.max(1, Math.round(diffMinutes / 60));
        countdownLabelAr = `بعد ${hoursLeft} ساعة`;
      } else {
        slotStatus = "aired";
        countdownLabelAr = "عُرضت اليوم";
      }
    } else {
      const daysAhead = (dayOfWeek - currentDay + 7) % 7;
      if (daysAhead <= 3) {
        slotStatus = "upcoming";
        countdownLabelAr =
          daysAhead === 1 ? "غداً" : `بعد ${daysAhead} أيام`;
      } else {
        slotStatus = "aired";
        countdownLabelAr = `عُرضت يوم ${getDayLabelAr(dayOfWeek)}`;
      }
    }

    // Avoid duplicate anime on the exact same day
    if (
      entries.some(
        (existing) =>
          existing.dayOfWeek === dayOfWeek && existing.anime.id === anime.id
      )
    ) {
      continue;
    }

    entries.push({
      id: `sched-${dayOfWeek}-${anime.id}-ep${episodeNumber}`,
      anime,
      dayOfWeek,
      dayLabel: getDayLabelAr(dayOfWeek),
      episodeNumber,
      episodeTitleAr,
      airTime24,
      airTimeLabelAr: slot.labelAr,
      airTimeMinutes,
      slotStatus,
      countdownLabelAr,
      studio: anime.studio || "MAPPA",
      genreLabelAr:
        anime.genresAr?.[0] || anime.genres?.[0] || "أكشن وفانتازيا",
      formatLabel: anime.format || "TV",
      qualityBadge: "1080p FHD",
    });
  }

  return entries.sort((a, b) => a.airTimeMinutes - b.airTimeMinutes);
}

export function filterAndSortSchedule(
  entries: EnrichedScheduleEntry[],
  options: {
    selectedDay: number; // -1 for all days, 0..6 for specific day
    searchQuery?: string;
    statusFilter?: ScheduleStatusFilter;
    sortBy?: ScheduleSortBy;
  }
): EnrichedScheduleEntry[] {
  const {
    selectedDay,
    searchQuery = "",
    statusFilter = "all",
    sortBy = "time",
  } = options;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    if (selectedDay !== -1 && entry.dayOfWeek !== selectedDay) {
      return false;
    }

    if (statusFilter === "upcoming") {
      if (entry.slotStatus !== "upcoming" && entry.slotStatus !== "live") {
        return false;
      }
    } else if (statusFilter === "aired") {
      if (entry.slotStatus !== "aired") {
        return false;
      }
    }

    if (normalizedQuery.length > 0) {
      const titleAr = (entry.anime.titleAr || "").toLowerCase();
      const titleEn = (entry.anime.title || "").toLowerCase();
      const studio = (entry.studio || "").toLowerCase();
      const genre = (entry.genreLabelAr || "").toLowerCase();
      if (
        !titleAr.includes(normalizedQuery) &&
        !titleEn.includes(normalizedQuery) &&
        !studio.includes(normalizedQuery) &&
        !genre.includes(normalizedQuery)
      ) {
        return false;
      }
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === "score") {
      const scoreDiff = (b.anime.score || 0) - (a.anime.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
    }
    if (a.dayOfWeek !== b.dayOfWeek && selectedDay === -1) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return a.airTimeMinutes - b.airTimeMinutes;
  });
}

export function getScheduleStats(
  entries: EnrichedScheduleEntry[],
  todayDayOfWeek: number
): ScheduleStats {
  const dayCounts: Record<number, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };

  let todayCount = 0;
  let liveOrUpcomingCount = 0;

  for (const entry of entries) {
    dayCounts[entry.dayOfWeek] = (dayCounts[entry.dayOfWeek] || 0) + 1;
    if (entry.dayOfWeek === todayDayOfWeek) {
      todayCount += 1;
    }
    if (entry.slotStatus === "live" || entry.slotStatus === "upcoming") {
      liveOrUpcomingCount += 1;
    }
  }

  const todayEntries = entries.filter((e) => e.dayOfWeek === todayDayOfWeek);
  const nextHighlight =
    todayEntries.find((e) => e.slotStatus === "live") ||
    todayEntries.find((e) => e.slotStatus === "upcoming") ||
    todayEntries[0] ||
    entries[0] ||
    null;

  return {
    totalWeeklyEpisodes: entries.length,
    todayCount,
    liveOrUpcomingCount,
    dayCounts,
    nextHighlight,
  };
}
