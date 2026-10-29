import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CornerDownLeft,
  Home,
  Play,
  Pause,
  FastForward,
  Rewind,
  Tv,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

interface TvRemoteControllerProps {
  onDirection: (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void;
  onSelect: () => void;
  onBack: () => void;
  onHome: () => void;
  onTogglePlayPause: () => void;
  onFastForward: () => void;
  onRewind: () => void;
  isPlaying: boolean;
  isTvMode: boolean;
  onToggleTvMode: () => void;
}

export const TvRemoteController: React.FC<TvRemoteControllerProps> = ({
  onDirection,
  onSelect,
  onBack,
  onHome,
  onTogglePlayPause,
  onFastForward,
  onRewind,
  isPlaying,
  isTvMode,
  onToggleTvMode
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 left-4 z-50 px-3 py-2 rounded-xl bg-neutral-900/90 border border-violet-500/40 text-violet-400 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2 hover:bg-neutral-800"
      >
        <Tv className="w-4 h-4" />
        <span>ريموت التلفاز الذكي (D-Pad)</span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Android TV Remote Control"
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 select-none ${
        isMinimized ? 'w-44' : 'w-56'
      }`}
    >
      <div className="rounded-3xl bg-neutral-900/95 border border-white/15 p-4 shadow-2xl backdrop-blur-xl text-white">
        {/* Remote Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-300">
              Android TV Remote
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? "Maximize Remote" : "Minimize Remote"}
              className="p-1 text-neutral-400 hover:text-white rounded"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Close Remote"
              className="p-1 text-neutral-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* D-Pad (Directional Pad with Center OK Button) */}
            <div className="relative w-36 h-36 mx-auto my-2 rounded-full bg-neutral-800/80 border border-white/10 shadow-inner flex items-center justify-center">
              {/* UP */}
              <button
                onClick={() => onDirection('UP')}
                aria-label="TV Remote Direction Up"
                className="absolute top-1 inset-x-0 mx-auto w-10 h-9 flex items-center justify-center text-neutral-300 hover:text-violet-400 active:scale-90 transition-all"
              >
                <ChevronUp className="w-6 h-6" />
              </button>

              {/* DOWN */}
              <button
                onClick={() => onDirection('DOWN')}
                aria-label="TV Remote Direction Down"
                className="absolute bottom-1 inset-x-0 mx-auto w-10 h-9 flex items-center justify-center text-neutral-300 hover:text-violet-400 active:scale-90 transition-all"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              {/* LEFT */}
              <button
                onClick={() => onDirection('LEFT')}
                aria-label="TV Remote Direction Left"
                className="absolute left-1 inset-y-0 my-auto w-9 h-10 flex items-center justify-center text-neutral-300 hover:text-violet-400 active:scale-90 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* RIGHT */}
              <button
                onClick={() => onDirection('RIGHT')}
                aria-label="TV Remote Direction Right"
                className="absolute right-1 inset-y-0 my-auto w-9 h-10 flex items-center justify-center text-neutral-300 hover:text-violet-400 active:scale-90 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* CENTER / OK */}
              <button
                onClick={onSelect}
                aria-label="TV Remote OK / Select"
                className="w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 active:scale-90 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-violet-950/60 border border-violet-400/40 transition-all"
              >
                <span>OK</span>
              </button>
            </div>

            {/* TV Navigation Function Row (Back, Home, TV Switch) */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
              <button
                onClick={onBack}
                title="رجوع (Escape / Back)"
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 flex flex-col items-center gap-1 text-[10px] text-neutral-300 transition-colors"
              >
                <CornerDownLeft className="w-4 h-4 text-amber-400" />
                <span>رجوع</span>
              </button>

              <button
                onClick={onHome}
                title="الرئيسية (Home)"
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 flex flex-col items-center gap-1 text-[10px] text-neutral-300 transition-colors"
              >
                <Home className="w-4 h-4 text-sky-400" />
                <span>الرئيسية</span>
              </button>

              <button
                onClick={onToggleTvMode}
                title="تبديل وضع التلفاز / الهاتف"
                className={`p-2 rounded-xl active:scale-95 flex flex-col items-center gap-1 text-[10px] transition-colors ${
                  isTvMode
                    ? 'bg-violet-600/30 border border-violet-500 text-violet-300'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                <Tv className="w-4 h-4 text-violet-400" />
                <span>{isTvMode ? 'تلفاز' : 'هاتف'}</span>
              </button>
            </div>

            {/* Media Playback Controls Row */}
            <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-white/10">
              <button
                onClick={onRewind}
                title="ترجيع 10 ثواني"
                aria-label="Rewind 10 seconds"
                className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-white/5 active:scale-90 transition-all"
              >
                <Rewind className="w-4 h-4" />
              </button>

              <button
                onClick={onTogglePlayPause}
                title="تشغيل / إيقاف مؤقت"
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="p-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-90 transition-all shadow"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={onFastForward}
                title="تقديم 10 ثواني"
                aria-label="Fast forward 10 seconds"
                className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-white/5 active:scale-90 transition-all"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Keyboard hint info */}
        <div className="mt-3 text-[10px] text-neutral-400 text-center font-mono">
          يمكنك أيضاً استخدام أسهم لوحة المفاتيح ↑ ↓ ← → و Enter
        </div>
      </div>
    </aside>
  );
};
