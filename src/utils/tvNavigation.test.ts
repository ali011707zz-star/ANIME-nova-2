import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextTvFocus,
  verifySafeHandover,
  formatAnimeTime,
  filterAnimeList,
  GridBounds
} from './tvNavigation';
import { ANIME_DATABASE } from '../data/animeData';

test('TV D-Pad movement stays clamped within grid boundaries', () => {
  const bounds: GridBounds = {
    totalRows: 3,
    getColsInRow: (row) => (row === 0 ? 1 : 4) // Hero row has 1 action, category rows have 4 items
  };

  // Start at Hero (row 0, col 0)
  let focus = { row: 0, col: 0 };

  // Press UP when already at top -> remains row 0, col 0
  focus = calculateNextTvFocus(focus, 'UP', bounds);
  assert.deepEqual(focus, { row: 0, col: 0 });

  // Press DOWN -> moves to row 1, col 0
  focus = calculateNextTvFocus(focus, 'DOWN', bounds);
  assert.deepEqual(focus, { row: 1, col: 0 });

  // Press RIGHT 3 times -> moves across columns in row 1
  focus = calculateNextTvFocus(focus, 'RIGHT', bounds);
  assert.deepEqual(focus, { row: 1, col: 1 });
  focus = calculateNextTvFocus(focus, 'RIGHT', bounds);
  assert.deepEqual(focus, { row: 1, col: 2 });
  focus = calculateNextTvFocus(focus, 'RIGHT', bounds);
  assert.deepEqual(focus, { row: 1, col: 3 });

  // Press RIGHT again at boundary -> stays at col 3
  focus = calculateNextTvFocus(focus, 'RIGHT', bounds);
  assert.deepEqual(focus, { row: 1, col: 3 });

  // Move UP to row 0 (which has only 1 column) -> col should clamp to 0
  focus = calculateNextTvFocus(focus, 'UP', bounds);
  assert.deepEqual(focus, { row: 0, col: 0 });
});

test('Safe playback handover preserves timestamp and playing state between phone and TV', () => {
  const initialSession = {
    animeId: 'solo-leveling',
    episodeNumber: 1,
    currentTimeSeconds: 615, // 10 min 15 sec
    durationSeconds: 1425,
    isPlaying: true,
    audioTrack: 'Japanese',
    subtitleTrack: 'Arabic',
    volume: 0.8
  };

  const result = verifySafeHandover(initialSession, 'tv');
  assert.equal(result.success, true);
  assert.equal(result.state.currentTimeSeconds, 615);
  assert.equal(result.state.isPlaying, true);
  assert.equal(result.state.subtitleTrack, 'Arabic');
  assert.equal(result.state.audioTrack, 'Japanese');
});

test('formatAnimeTime accurately displays minutes and seconds', () => {
  assert.equal(formatAnimeTime(0), '00:00');
  assert.equal(formatAnimeTime(75), '01:15');
  assert.equal(formatAnimeTime(3665), '1:01:05');
});

test('filterAnimeList filters by genre and search text', () => {
  const actionAnime = filterAnimeList(ANIME_DATABASE, 'Action', '');
  assert.ok(actionAnime.length >= 3);

  const searchSolo = filterAnimeList(ANIME_DATABASE, 'all', 'سولو');
  assert.equal(searchSolo.length, 1);
  assert.equal(searchSolo[0].id, 'solo-leveling');
});
