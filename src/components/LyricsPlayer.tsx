/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { LyricLine } from "../types";
import { Music, Clock } from "lucide-react";

interface LyricsPlayerProps {
  lyrics: LyricLine[];
  currentTime: number;
  onSeek?: (time: number) => void;
  isPlaying: boolean;
}

export function LyricsPlayer({ lyrics, currentTime, onSeek, isPlaying }: LyricsPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  // Find index of currently active lyric line
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth scroll to the active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeLineRef.current;

      const containerHeight = container.clientHeight;
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;

      // Scroll so active element is centered in the list
      container.scrollTo({
        top: elementTop - containerHeight / 2 + elementHeight / 2,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  // Format time (seconds to mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] border border-[#1e1e24] rounded-2xl overflow-hidden shadow-2xl" id="lyrics-player-container">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e24] bg-[#16161a]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Synchronized Lyrics</h3>
            <p className="text-xs text-gray-400">Scrolls in real-time with track playback</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-black/30 px-2.5 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Lyrics Scrollable Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-12 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent select-none relative"
        style={{ scrollSnapType: "y mandatory" }}
        id="lyrics-scroller"
      >
        {lyrics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <p className="text-sm italic">No lyrics generated for this project</p>
            <p className="text-xs text-gray-600 mt-1">Try generating a song with "Generate Lyrics" enabled!</p>
          </div>
        ) : (
          <div className="space-y-6 pb-24 pt-12">
            {lyrics.map((line, index) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;

              return (
                <button
                  key={index}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek && onSeek(line.time)}
                  className={`w-full text-left transition-all duration-300 py-2.5 px-3.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-purple-500/50 cursor-pointer block ${
                    isActive
                      ? "text-white text-lg md:text-xl font-bold bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/30 shadow-md scale-[1.02] translate-x-1"
                      : isPast
                      ? "text-gray-400 text-base md:text-md font-medium bg-transparent border-transparent opacity-80 hover:text-gray-200"
                      : "text-gray-600 text-base md:text-md font-medium bg-transparent border-transparent hover:text-gray-400"
                  }`}
                  style={{ scrollSnapAlign: "center" }}
                  id={`lyric-line-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`text-xs font-mono py-1 px-1.5 rounded bg-black/40 ${
                        isActive ? "text-purple-400 font-bold border border-purple-500/20" : "text-gray-600"
                      }`}
                    >
                      {formatTime(line.time)}
                    </span>
                    <span className="flex-1 leading-relaxed break-words">{line.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="px-6 py-3 border-t border-[#1e1e24] bg-[#0c0c0e] text-[11px] text-gray-500 flex items-center justify-between">
        <span>Click any lyric line to skip or replay that section</span>
        {isPlaying && <span className="animate-pulse text-purple-400">● LIVE SYNC</span>}
      </div>
    </div>
  );
}
