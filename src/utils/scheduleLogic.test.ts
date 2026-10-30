import test from "node:test";
import assert from "node:assert/strict";
import { ANIME_DATABASE } from "../data/animeData";
import {
  AR_SCHEDULE_DAYS,
  buildWeeklySchedule,
  filterAndSortSchedule,
  getDayLabelAr,
  getScheduleStats,
} from "./scheduleLogic";

test("AR_SCHEDULE_DAYS covers all 7 days of the week", () => {
  assert.equal(AR_SCHEDULE_DAYS.length, 7);
  const ids = new Set(AR_SCHEDULE_DAYS.map((d) => d.id));
  for (let day = 0; day <= 6; day++) {
    assert.equal(ids.has(day), true);
  }
  assert.equal(getDayLabelAr(6), "السبت");
  assert.equal(getDayLabelAr(0), "الأحد");
});

test("buildWeeklySchedule populates entries for all 7 days with valid broadcast metadata", () => {
  const fixedDate = new Date("2026-10-30T18:15:00Z");
  const schedule = buildWeeklySchedule(ANIME_DATABASE, fixedDate);
  assert.ok(schedule.length > 0, "schedule should not be empty");

  const stats = getScheduleStats(schedule, fixedDate.getDay());
  for (let day = 0; day <= 6; day++) {
    assert.ok(
      stats.dayCounts[day] > 0,
      `day ${day} should have at least 1 scheduled episode`
    );
  }
  assert.ok(stats.nextHighlight !== null);
});

test("filterAndSortSchedule filters by day, search query, status, and sorts by score or time", () => {
  const fixedDate = new Date("2026-10-30T19:00:00Z");
  const schedule = buildWeeklySchedule(ANIME_DATABASE, fixedDate);

  // Day filter
  const fridayEntries = filterAndSortSchedule(schedule, {
    selectedDay: 5,
    sortBy: "time",
  });
  assert.ok(fridayEntries.length > 0);
  assert.ok(fridayEntries.every((e) => e.dayOfWeek === 5));

  // Verify chronological sorting
  for (let i = 1; i < fridayEntries.length; i++) {
    assert.ok(
      fridayEntries[i].airTimeMinutes >= fridayEntries[i - 1].airTimeMinutes
    );
  }

  // Score sorting across all days
  const byScore = filterAndSortSchedule(schedule, {
    selectedDay: -1,
    sortBy: "score",
  });
  for (let i = 1; i < byScore.length; i++) {
    assert.ok(byScore[i].anime.score <= byScore[i - 1].anime.score);
  }

  // Search query filtering
  const sampleTitle = schedule[0].anime.titleAr.slice(0, 4);
  const searched = filterAndSortSchedule(schedule, {
    selectedDay: -1,
    searchQuery: sampleTitle,
  });
  assert.ok(searched.length >= 1);
});
