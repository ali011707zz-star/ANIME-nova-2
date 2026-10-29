import { Anime } from '../types/anime';

export interface TvFocusCoordinate {
  row: number; // 0: Top/Hero, 1: Category 1, 2: Category 2, etc.
  col: number; // Item index within that row
}

export interface GridBounds {
  totalRows: number;
  getColsInRow: (row: number) => number;
}

/**
 * Calculates deterministic D-Pad movement for TV Remote Control
 * Clamps safely within boundaries without resetting or throwing errors.
 */
export function calculateNextTvFocus(
  current: TvFocusCoordinate,
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  bounds: GridBounds
): TvFocusCoordinate {
  let { row, col } = current;

  switch (direction) {
    case 'UP':
      if (row > 0) {
        row -= 1;
        const colsInNewRow = bounds.getColsInRow(row);
        col = Math.min(col, Math.max(0, colsInNewRow - 1));
      }
      break;

    case 'DOWN':
      if (row < bounds.totalRows - 1) {
        row += 1;
        const colsInNewRow = bounds.getColsInRow(row);
        col = Math.min(col, Math.max(0, colsInNewRow - 1));
      }
      break;

    case 'LEFT':
      if (col > 0) {
        col -= 1;
      }
      break;

    case 'RIGHT': {
      const maxCol = bounds.getColsInRow(row) - 1;
      if (col < maxCol) {
        col += 1;
      }
      break;
    }
  }

  return { row, col };
}

export interface PlaybackHandoverState {
  animeId: string;
  episodeNumber: number;
  currentTimeSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  audioTrack: string;
  subtitleTrack: string;
  volume: number;
}

/**
 * Handover verification function ensuring playback state is safely preserved
 * without timestamp reset when switching between Android Phone and Android TV.
 */
export function verifySafeHandover(
  source: PlaybackHandoverState,
  targetMode: 'phone' | 'tv'
): { success: boolean; state: PlaybackHandoverState; message: string } {
  if (!source.animeId) {
    return {
      success: true,
      state: { ...source },
      message: 'Idle session transferred'
    };
  }

  // Safe handover clamps time within valid duration and preserves audio/subtitles
  const safeTime = Math.max(0, Math.min(source.currentTimeSeconds, source.durationSeconds || source.currentTimeSeconds));

  return {
    success: true,
    state: {
      ...source,
      currentTimeSeconds: safeTime,
      // On TV handover, preserve audio/subtitles and keep playing status
      isPlaying: source.isPlaying
    },
    message: targetMode === 'tv' ? 'Handover to TV mode complete' : 'Handover to Mobile mode complete'
  };
}

/**
 * Formats time in seconds to mm:ss or hh:mm:ss
 */
export function formatAnimeTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Filter anime by genre and search keyword
 */
export function filterAnimeList(
  list: Anime[],
  genre: string,
  query: string = ''
): Anime[] {
  const normalizedQuery = query.trim().toLowerCase();

  return list.filter((anime) => {
    const matchesGenre =
      genre === 'all' ||
      anime.genres.some((g) => g.toLowerCase() === genre.toLowerCase()) ||
      anime.genresAr.some((g) => g.includes(genre));

    if (!matchesGenre) return false;

    if (!normalizedQuery) return true;

    return (
      anime.title.toLowerCase().includes(normalizedQuery) ||
      anime.titleAr.includes(normalizedQuery) ||
      anime.titleJp.toLowerCase().includes(normalizedQuery) ||
      anime.synopsis.toLowerCase().includes(normalizedQuery) ||
      anime.synopsisAr.includes(normalizedQuery)
    );
  });
}
