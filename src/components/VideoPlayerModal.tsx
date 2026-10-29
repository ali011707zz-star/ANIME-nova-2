import React, { useRef, useState, useEffect } from 'react';
import { Anime, Episode, Language, ViewMode } from '../types/anime';
import { formatAnimeTime } from '../utils/tvNavigation';
import { AnimeMascot } from './AnimeMascot';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  FastForward,
  Rewind,
  X,
  Settings,
  Tv,
  Smartphone,
  ListVideo,
  Subtitles,
  AudioLines,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

interface VideoPlayerModalProps {
  anime: Anime;
  initialEpisode: Episode;
  language: Language;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  onClose: () => void;
  savedTimeSeconds?: number;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  anime,
  initialEpisode,
  language,
  viewMode,
  onToggleViewMode,
  onClose,
  savedTimeSeconds = 0
}) => {
  const isAr = language === 'ar';
  const videoRef = useRef<HTMLVideoElement>(null);

  // Preparation screen state matching Screenshot_20260727-223002
  const [isPreparing, setIsPreparing] = useState(true);

  const [currentEpisode, setCurrentEpisode] = useState<Episode>(initialEpisode);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(savedTimeSeconds);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState<'1080p' | '720p' | '4K HDR'>('1080p');
  const [subtitle, setSubtitle] = useState<'Arabic' | 'English' | 'Off'>('Arabic');
  const [audioTrack, setAudioTrack] = useState<'Japanese' | 'Arabic Dub' | 'English Dub'>('Japanese');
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modeSwitchNotice, setModeSwitchNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preparation loading timer (1.8s for smooth authentic feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPreparing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentEpisode]);

  // Initialize playback time if transferred
  useEffect(() => {
    if (videoRef.current && savedTimeSeconds > 0 && !isPreparing) {
      videoRef.current.currentTime = savedTimeSeconds;
    }
  }, [savedTimeSeconds, isPreparing]);

  // Autohide controls on inactivity
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettingsMenu(false);
      }
    }, 3500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const seekRelative = (seconds: number) => {
    if (!videoRef.current) return;
    const target = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSwitchEpisode = (ep: Episode) => {
    setCurrentEpisode(ep);
    setIsPreparing(true);
    setCurrentTime(0);
    setIsPlaying(true);
    setShowEpisodeList(false);
  };

  // Keyboard navigation for TV & Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekRelative(isAr ? -10 : 10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(isAr ? 10 : -10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume((v) => Math.min(1, v + 0.1));
        if (videoRef.current) videoRef.current.volume = Math.min(1, volume + 0.1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume((v) => Math.max(0, v - 0.1));
        if (videoRef.current) videoRef.current.volume = Math.max(0, volume - 0.1);
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isFullscreen, isAr, duration]);

  // Poster URI
  const coverUrl = anime.coverImage || (anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : '');

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="fixed inset-0 z-50 bg-[#090A0C] flex items-center justify-center select-none overflow-hidden font-['Cairo']"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ===================================================================
          AUTHENTIC PREPARATION SCREEN matching Screenshot_20260727-223002
         =================================================================== */}
      {isPreparing ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#090A0C] z-30 animate-in fade-in duration-150">
          {/* Blurred Backdrop of Poster */}
          {coverUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-3xl scale-125 pointer-events-none"
              style={{ backgroundImage: `url(${coverUrl})` }}
            />
          )}

          {/* Close button (X) top right */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-[#14171C]/90 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors z-40 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Centered Preparation Content Container */}
          <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto space-y-3.5">
            {/* Islamic Prayer Text above poster */}
            <p className="text-white/90 text-sm sm:text-base font-extrabold font-['Cairo'] tracking-wide text-center">
              اللهم صلِّ وسلِّم على نبينا محمد ﷺ
            </p>

            {/* Poster Image with exact rounded corners and shadow */}
            <div className="relative w-40 sm:w-44 aspect-[1/1.4] rounded-2xl overflow-hidden shadow-2xl border border-white/15 my-1 bg-[#14171C]">
              <img
                src={coverUrl}
                alt={anime.title}
                onError={(e) => {
                  if (anime.anilistId) {
                    e.currentTarget.src = `https://img.anili.st/media/${anime.anilistId}`;
                  }
                }}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Anime Title */}
            <h2 className="text-white text-base sm:text-lg font-black font-['Cairo'] leading-tight drop-shadow-md">
              {anime.title}
            </h2>

            {/* Episode Badge in Violet Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7654C8]/25 border border-[#7654C8]/50 text-[#C4B5FD] text-xs font-bold">
              <span>{isAr ? `الحلقة ${currentEpisode.number}` : `Episode ${currentEpisode.number}`}</span>
            </div>

            {/* Spinning Ring Loader */}
            <div className="relative w-10 h-10 my-1">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7654C8] border-r-[#7654C8]/60 animate-spin" />
            </div>

            {/* Waiting Notice Text */}
            <p className="text-neutral-300 text-xs sm:text-sm font-normal font-['Cairo'] text-center px-4 leading-relaxed">
              ⏳ {isAr ? 'جاري تجهيز الحلقة، قد يستغرق ذلك بضع ثوانٍ. شكراً لصبرك.' : 'Preparing episode stream. This takes only a few seconds. Thank you!'}
            </p>

            {/* Sukuna Mascot Component with "ينتظر بنفاد صبر..." */}
            <div className="pt-2">
              <AnimeMascot mood="loading" />
            </div>

            {/* Skip / Fast Play Button */}
            <button
              onClick={() => setIsPreparing(false)}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-[#B8BDC7] hover:text-white transition-colors"
            >
              {isAr ? 'تخطي والتشغيل الفوري ←' : 'Start Playback Immediately →'}
            </button>
          </div>
        </div>
      ) : (
        /* ===================================================================
            AUTHENTIC VIDEO PLAYER STREAM & CONTROLS
           =================================================================== */
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* HTML5 Native Video Tag */}
          <video
            ref={videoRef}
            src={currentEpisode.videoUrl}
            autoPlay
            playsInline
            onTimeUpdate={() => {
              if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                if (savedTimeSeconds > 0) videoRef.current.currentTime = savedTimeSeconds;
              }
            }}
            onEnded={() => {
              const nextEp = anime.episodes.find((e) => e.number === currentEpisode.number + 1);
              if (nextEp) handleSwitchEpisode(nextEp);
            }}
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />

          {/* Subtitles Overlay */}
          {subtitle !== 'Off' && (
            <div className="absolute bottom-20 inset-x-8 text-center pointer-events-none z-20">
              <span className="inline-block px-4 py-1.5 rounded-lg bg-black/85 text-white font-bold text-sm sm:text-base border border-white/10 shadow-xl backdrop-blur-md">
                {subtitle === 'Arabic'
                  ? `[ترجمة عربية احترافية] - ${currentEpisode.titleAr || currentEpisode.title}`
                  : `[English Subtitles] - ${currentEpisode.title}`}
              </span>
            </div>
          )}

          {/* Mode Switch Notification Banner */}
          {modeSwitchNotice && (
            <div className="absolute top-20 inset-x-0 flex justify-center z-40 pointer-events-none">
              <div className="px-5 py-2.5 rounded-2xl bg-violet-950/90 border border-violet-500/60 text-white text-xs font-bold shadow-2xl backdrop-blur-md">
                {modeSwitchNotice}
              </div>
            </div>
          )}

          {/* TOP OVERLAY BAR */}
          <div
            className={`absolute top-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-30 flex items-center justify-between ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                title={isAr ? 'إغلاق المشغل' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {anime.title}
                </h1>
                <p className="text-xs text-[#9299A5]">
                  {isAr ? currentEpisode.titleAr : currentEpisode.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* TV Mode Switch Pill */}
              <button
                onClick={() => {
                  onToggleViewMode();
                  setModeSwitchNotice(
                    viewMode === 'phone'
                      ? (isAr ? 'تم حفظ موضع المشاهدة والتحويل لوضع التلفاز الذكي!' : 'Session preserved! Switched to TV Mode')
                      : (isAr ? 'تم حفظ موضع المشاهدة والتحويل لوضع الهاتف المحمول!' : 'Session preserved! Switched to Phone Mode')
                  );
                  setTimeout(() => setModeSwitchNotice(null), 3000);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  viewMode === 'tv'
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-[#14171C] border-white/20 text-neutral-200 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4 text-violet-400" />
                <span>{viewMode === 'tv' ? (isAr ? 'تلفاز 10-foot' : 'TV') : (isAr ? 'اقلب للتلفاز' : 'Switch to TV')}</span>
              </button>

              {/* Episode list button */}
              <button
                onClick={() => {
                  setShowEpisodeList(!showEpisodeList);
                  setShowSettingsMenu(false);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                title={isAr ? 'قائمة الحلقات' : 'Episodes'}
              >
                <ListVideo className="w-4 h-4" />
              </button>

              {/* Settings button */}
              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setShowEpisodeList(false);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                title={isAr ? 'الإعدادات والصوت' : 'Settings'}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BOTTOM OVERLAY BAR */}
          <div
            className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-30 space-y-3 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Scrubber Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {formatAnimeTime(currentTime)}
              </span>

              <div className="relative flex-1 group py-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#7654C8]"
                />
              </div>

              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {formatAnimeTime(duration)}
              </span>
            </div>

            {/* Playback Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-[#7654C8] hover:bg-[#6744b8] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => seekRelative(-10)}
                  className="p-2 text-neutral-300 hover:text-white"
                  title="Rewind 10s"
                >
                  <Rewind className="w-5 h-5" />
                </button>

                <button
                  onClick={() => seekRelative(10)}
                  className="p-2 text-neutral-300 hover:text-white"
                  title="Forward 10s"
                >
                  <FastForward className="w-5 h-5" />
                </button>

                {/* Volume */}
                <div className="hidden sm:flex items-center gap-2 ml-2">
                  <button onClick={toggleMute} className="text-neutral-300 hover:text-white">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      setIsMuted(false);
                      if (videoRef.current) {
                        videoRef.current.volume = v;
                        videoRef.current.muted = false;
                      }
                    }}
                    className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#7654C8]"
                  />
                </div>
              </div>

              {/* Quick Tags and Fullscreen */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/40 text-[10px] font-bold">
                  {quality}
                </span>

                <span className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  {audioTrack === 'Japanese' ? 'ياباني' : 'مدبلج'}
                </span>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Episode List Drawer */}
          {showEpisodeList && (
            <div className="absolute inset-y-0 right-0 w-80 max-w-[80vw] bg-[#090A0C]/95 border-l border-white/10 p-5 z-40 overflow-y-auto backdrop-blur-xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-[#7654C8]" />
                  <span>{isAr ? 'حلقات الأنمي' : 'Episodes'}</span>
                </h3>
                <button
                  onClick={() => setShowEpisodeList(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {anime.episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => handleSwitchEpisode(ep)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-right transition-colors ${
                      ep.number === currentEpisode.number
                        ? 'bg-[#7654C8]/20 border-[#7654C8] text-white'
                        : 'bg-[#14171C] border-white/5 text-[#9299A5] hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {isAr ? ep.titleAr : ep.title}
                      </div>
                      <div className="text-[10px] text-[#9299A5] mt-0.5">{ep.duration}</div>
                    </div>
                    {ep.number === currentEpisode.number && (
                      <span className="w-2 h-2 rounded-full bg-[#7654C8]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings Panel Modal */}
          {showSettingsMenu && (
            <div className="absolute inset-y-0 right-0 w-80 max-w-[80vw] bg-[#090A0C]/95 border-l border-white/10 p-5 z-40 overflow-y-auto backdrop-blur-xl animate-in slide-in-from-right duration-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#7654C8]" />
                  <span>{isAr ? 'خيارات المشغل والجودة' : 'Playback Settings'}</span>
                </h3>
                <button
                  onClick={() => setShowSettingsMenu(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quality */}
              <div>
                <label className="text-xs font-bold text-[#9299A5] block mb-2">
                  {isAr ? 'دقة الفيديو (Quality)' : 'Video Quality'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['720p', '1080p', '4K HDR'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        quality === q
                          ? 'bg-[#7654C8] text-white border-transparent'
                          : 'bg-[#14171C] border-white/10 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Track */}
              <div>
                <label className="text-xs font-bold text-[#9299A5] block mb-2">
                  {isAr ? 'المسار الصوتي (Audio)' : 'Audio Track'}
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'Japanese', label: isAr ? 'اليابانية الأصلية' : 'Original Japanese' },
                    { id: 'Arabic Dub', label: isAr ? 'الدبلجة العربية' : 'Arabic Dub' },
                    { id: 'English Dub', label: isAr ? 'الدبلجة الإنجليزية' : 'English Dub' }
                  ].map((track) => (
                    <button
                      key={track.id}
                      onClick={() => setAudioTrack(track.id as any)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-between text-right ${
                        audioTrack === track.id
                          ? 'bg-[#7654C8]/20 border-[#7654C8] text-white'
                          : 'bg-[#14171C] border-white/10 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <span>{track.label}</span>
                      {audioTrack === track.id && <span className="w-1.5 h-1.5 rounded-full bg-[#7654C8]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitles */}
              <div>
                <label className="text-xs font-bold text-[#9299A5] block mb-2">
                  {isAr ? 'الترجمة (Subtitles)' : 'Subtitles'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Arabic', 'English', 'Off'] as const).map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSubtitle(sub)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        subtitle === sub
                          ? 'bg-[#7654C8] text-white border-transparent'
                          : 'bg-[#14171C] border-white/10 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {sub === 'Arabic' ? 'العربية' : sub === 'English' ? 'English' : 'إيقاف'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback Speed */}
              <div>
                <label className="text-xs font-bold text-[#9299A5] block mb-2">
                  {isAr ? 'سرعة التشغيل' : 'Playback Speed'}
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[0.75, 1, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-[#7654C8] text-white border-transparent'
                          : 'bg-[#14171C] border-white/10 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
