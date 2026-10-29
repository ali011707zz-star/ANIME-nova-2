export interface Episode {
  id: string;
  number: number;
  title: string;
  titleAr: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  synopsis: string;
  synopsisAr: string;
}

export interface Character {
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  imageUrl: string;
}

export interface Anime {
  id: string;
  title: string;
  titleAr: string;
  titleJp: string;
  synopsis: string;
  synopsisAr: string;
  score: number;
  year: number;
  status: 'Airing' | 'Completed' | 'Upcoming';
  statusAr: string;
  genres: string[];
  genresAr: string[];
  episodesCount: number;
  durationPerEp: string;
  bannerColor: string;
  posterBg: string;
  accentColor: string;
  rating: string;
  studio: string;
  episodes: Episode[];
  characters: Character[];
  featured?: boolean;
  coverImage?: string;
  bannerImage?: string;
  anilistId?: number;
  progress?: number;
  format?: string;
  provider?: 'anilist' | 'aw' | 'carateen' | 'spacetoon';
  badge?: string;
  trailerYtId?: string;
}

export interface AwDubbedEpisode {
  number: number;
  title?: string;
  videoUrl?: string;
}

export interface AwDubbedSeason {
  key: string;
  label: string;
  seasonNumber: number;
  poster?: string;
  episodes: AwDubbedEpisode[];
}

export interface AwDubbedSeries {
  key: string;
  title: string;
  titleAr: string;
  poster: string;
  badge: 'مدبلج' | 'مترجم';
  seasons: AwDubbedSeason[];
}

export interface DubbedSeason {
  key: string;
  label: string;
  seasonNumber: number;
  episodes: { number: number; title?: string; videoUrl?: string }[];
}

export interface DubbedSeries {
  id: string;
  provider: 'sp' | 'ct';
  title: string;
  poster: string;
  badge: 'مدبلج' | 'مترجم' | 'سبيستون';
  isMovie?: boolean;
  year?: number;
  seasons: DubbedSeason[];
}

export interface StardimaEpisodeItem {
  provider_episode_id: string;
  season_number: number;
  episode_number: number;
  title_raw: string;
  qualities: {
    quality: '1080p' | '720p' | '480p';
    servers: {
      server_key: string;
      label: string;
      verified: boolean;
      videoUrl: string;
    }[];
  }[];
}

export interface StardimaSeries {
  provider_title_id: string;
  slug: string;
  title_ar: string;
  poster_url: string;
  media_type: 'series' | 'movie';
  release_year: number;
  episode_count: number;
  badge: 'مدبلج' | 'مترجم';
  category: 'animation' | 'cartoon';
  seasons: {
    season_number: number;
    episode_count: number;
    episodes: StardimaEpisodeItem[];
  }[];
}

export interface PlaybackState {
  anime: Anime | null;
  episode: Episode | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackSpeed: number;
  quality: '1080p' | '720p' | '4K HDR';
  audioTrack: 'Japanese' | 'Arabic Dub' | 'English Dub';
  subtitle: 'Arabic' | 'English' | 'None';
  isFullscreen: boolean;
}

export type ViewMode = 'phone' | 'tv';

export type Language = 'ar' | 'en';

