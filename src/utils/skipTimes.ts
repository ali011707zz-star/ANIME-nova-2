/**
 * Skip Intro / Outro interval calculation & validation
 * Adapted 1:1 from artifacts/nova-mobile/lib/skipTimes.mjs & nova2-android/core/playback/PlaybackModels.kt
 */

export interface SkipInterval {
  startSeconds: number;
  endSeconds: number;
  label?: string;
}

export interface EpisodeSkipTimes {
  intro: SkipInterval | null;
  outro: SkipInterval | null;
}

export function isValidSkipInterval(
  interval: SkipInterval | null | undefined,
  durationSeconds = 0
): interval is SkipInterval {
  if (!interval) return false;
  const { startSeconds, endSeconds } = interval;
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
    return false;
  }
  const length = endSeconds - startSeconds;
  if (startSeconds < 0 || endSeconds <= startSeconds) return false;
  if (length < 15 || length > 240) return false;
  if (durationSeconds > 0 && startSeconds >= durationSeconds) return false;
  return true;
}

export function isPositionInSkipInterval(
  interval: SkipInterval | null | undefined,
  positionSeconds: number
): boolean {
  if (!interval) return false;
  return (
    positionSeconds >= interval.startSeconds &&
    positionSeconds < interval.endSeconds - 0.5
  );
}

export function parseRawSkipInterval(raw: unknown): SkipInterval | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const start = Number(
    obj.start ?? obj.startTime ?? obj.startSeconds ?? (obj.interval as any)?.startTime
  );
  const end = Number(
    obj.end ?? obj.endTime ?? obj.endSeconds ?? (obj.interval as any)?.endTime
  );
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return { startSeconds: start, endSeconds: end };
}

/**
 * Resolves intro/outro skip times from:
 * 1. Source-embedded skipIntro / skipOutro
 * 2. Remote /api/anime/skip-times response (if available)
 * 3. Standard anime OP/ED timing window when duration >= 15 minutes (900s)
 */
export function resolveEpisodeSkipTimes(options: {
  sourceIntro?: SkipInterval | null;
  sourceOutro?: SkipInterval | null;
  apiSkipTimes?: EpisodeSkipTimes | null;
  durationSeconds?: number;
  enableStandardFallback?: boolean;
}): EpisodeSkipTimes {
  const duration = options.durationSeconds || 0;

  const candidateIntro =
    (isValidSkipInterval(options.sourceIntro, duration)
      ? options.sourceIntro
      : null) ||
    (isValidSkipInterval(options.apiSkipTimes?.intro, duration)
      ? options.apiSkipTimes?.intro
      : null);

  const candidateOutro =
    (isValidSkipInterval(options.sourceOutro, duration)
      ? options.sourceOutro
      : null) ||
    (isValidSkipInterval(options.apiSkipTimes?.outro, duration)
      ? options.apiSkipTimes?.outro
      : null);

  // If no explicit API/source timestamps were returned and standard fallback is enabled
  // for full-length episodes (>= 15 min) or short demo streams
  if (!candidateIntro && !candidateOutro && options.enableStandardFallback !== false) {
    if (duration >= 900) {
      return {
        intro: { startSeconds: 65, endSeconds: 155, label: "تخطي المقدمة" },
        outro: {
          startSeconds: Math.max(duration - 135, 720),
          endSeconds: Math.max(duration - 15, 810),
          label: "تخطي النهاية",
        },
      };
    }
    if (duration >= 180) {
      return {
        intro: { startSeconds: 15, endSeconds: 65, label: "تخطي المقدمة" },
        outro: {
          startSeconds: Math.max(duration - 55, 110),
          endSeconds: Math.max(duration - 5, 160),
          label: "تخطي النهاية",
        },
      };
    }
  }

  return {
    intro: candidateIntro ?? null,
    outro: candidateOutro ?? null,
  };
}

export async function fetchRemoteSkipTimes(params: {
  anilistId?: number | string;
  malId?: number | string;
  episode: number;
  durationSeconds?: number;
  signal?: AbortSignal;
}): Promise<EpisodeSkipTimes | null> {
  try {
    const query = new URLSearchParams();
    if (params.anilistId) query.set("anilistId", String(params.anilistId));
    if (params.malId) query.set("malId", String(params.malId));
    query.set("ep", String(params.episode));
    if (params.durationSeconds && params.durationSeconds > 0) {
      query.set("duration", String(Math.round(params.durationSeconds)));
    }

    const res = await fetch(`/api/anime/skip-times?${query.toString()}`, {
      signal: params.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const intro = parseRawSkipInterval(data?.op ?? data?.intro);
    const outro = parseRawSkipInterval(data?.ed ?? data?.outro);
    return {
      intro: isValidSkipInterval(intro, params.durationSeconds) ? intro : null,
      outro: isValidSkipInterval(outro, params.durationSeconds) ? outro : null,
    };
  } catch {
    return null;
  }
}
