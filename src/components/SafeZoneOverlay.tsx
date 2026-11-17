import React from 'react';
import { SafeZoneMode, AspectRatioPreset } from '../types/studio';
import {
  Heart,
  ChatCircle,
  ShareFat,
  Disc,
  BookmarkSimple,
  User,
  MagnifyingGlass,
  MusicNotes,
} from '@phosphor-icons/react';

interface SafeZoneOverlayProps {
  mode: SafeZoneMode;
  aspectRatio: AspectRatioPreset;
}

export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({ mode, aspectRatio }) => {
  if (mode === 'off') return null;

  const isVertical = aspectRatio === '9:16' || aspectRatio === '4:5';

  // For 16:9 or 1:1, show broadcast / feed standard title & action safe zones
  if (!isVertical) {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-10 flex items-center justify-center">
        {/* Action Safe (90%) */}
        <div className="absolute inset-[5%] border border-dashed border-amber-400/40 rounded-lg flex items-start justify-end p-2">
          <span className="text-[10px] font-mono tracking-wider text-amber-300/80 uppercase bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[2px]">
            Action Safe (90%)
          </span>
        </div>
        {/* Title Safe (80%) */}
        <div className="absolute inset-[10%] border border-amber-400/60 rounded-md flex items-end justify-start p-2">
          <span className="text-[10px] font-mono tracking-wider text-amber-300/90 uppercase bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[2px]">
            Title Safe (80%)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans text-white">
      {/* 1. Instagram Reels Overlay */}
      {(mode === 'reels' || mode === 'combined') && (
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            mode === 'combined' ? 'opacity-40' : 'opacity-90'
          }`}
        >
          {/* Top Bar Header Area */}
          <div className="absolute top-0 inset-x-0 h-[11%] bg-gradient-to-b from-black/50 via-black/20 to-transparent flex items-center justify-between px-4 pt-2">
            <span className="text-[11px] font-semibold tracking-wide text-white/90 drop-shadow-md">
              Reels
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-amber-300 border border-amber-400/30">
              IG Safe Top
            </span>
          </div>

          {/* Right Action Icons Column */}
          <div className="absolute right-3 bottom-[22%] flex flex-col items-center gap-3.5 text-white/80 drop-shadow-md">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-[2px] flex items-center justify-center border border-white/20">
                <Heart weight="bold" className="w-4 h-4 text-white" />
              </div>
              <span className="text-[9px] font-medium">8.4k</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-[2px] flex items-center justify-center border border-white/20">
                <ChatCircle weight="bold" className="w-4 h-4 text-white" />
              </div>
              <span className="text-[9px] font-medium">124</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-[2px] flex items-center justify-center border border-white/20">
                <ShareFat weight="bold" className="w-4 h-4 text-white" />
              </div>
              <span className="text-[9px] font-medium">Share</span>
            </div>
            <div className="w-7 h-7 rounded-full border-2 border-white/60 bg-black/40 flex items-center justify-center mt-1 animate-spin" style={{ animationDuration: '6s' }}>
              <Disc className="w-4 h-4 text-amber-300" />
            </div>
          </div>

          {/* Bottom Caption & Audio Ticker Zone */}
          <div className="absolute bottom-0 inset-x-0 h-[24%] bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4 pr-16">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-zinc-700 border border-white/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-zinc-300" />
              </div>
              <span className="text-xs font-semibold text-white drop-shadow">momentbox.lv</span>
            </div>
            <p className="text-[11px] text-white/90 line-clamp-2 leading-tight drop-shadow">
              Wedding voicemails & audio memories... #audioguestbook #wedding
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/80">
              <MusicNotes className="w-3 h-3 text-amber-300" />
              <span className="truncate">Original Audio — Guest Voicemails</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. TikTok Overlay */}
      {(mode === 'tiktok' || mode === 'combined') && (
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            mode === 'combined' ? 'opacity-40' : 'opacity-90'
          }`}
        >
          {/* Top Bar Tabs & Search */}
          <div className="absolute top-0 inset-x-0 h-[12%] bg-gradient-to-b from-black/50 via-black/20 to-transparent flex items-center justify-between px-4 pt-2">
            <div className="flex items-center gap-3 text-xs font-semibold text-white/80">
              <span className="text-white/60">Following</span>
              <span className="text-white border-b-2 border-white pb-0.5">For You</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center border border-white/20">
              <MagnifyingGlass className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Right Action Icons Column */}
          <div className="absolute right-2.5 bottom-[16%] flex flex-col items-center gap-3 text-white/90 drop-shadow-md">
            <div className="w-9 h-9 rounded-full bg-zinc-700 border-2 border-white flex items-center justify-center mb-1">
              <User className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                <Heart weight="fill" className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-[9px] font-semibold">12.5K</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                <ChatCircle weight="fill" className="w-5 h-5 text-white" />
              </div>
              <span className="text-[9px] font-semibold">348</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                <BookmarkSimple weight="fill" className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[9px] font-semibold">892</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                <ShareFat weight="fill" className="w-5 h-5 text-white" />
              </div>
              <span className="text-[9px] font-semibold">Share</span>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center mt-1 animate-spin" style={{ animationDuration: '4s' }}>
              <Disc className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Bottom Caption & Audio Pill */}
          <div className="absolute bottom-0 inset-x-0 h-[22%] bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4 pr-16">
            <span className="text-xs font-bold text-white drop-shadow mb-1">@momentbox.lv</span>
            <p className="text-[11px] text-white/90 line-clamp-2 leading-tight drop-shadow">
              Vintage telephone audio guestbook memories ✨
            </p>
            <div className="flex items-center gap-1.5 mt-2 bg-black/40 px-2 py-0.5 rounded-full w-max text-[10px] text-white/80 border border-white/10">
              <MusicNotes className="w-3 h-3 text-white" />
              <span className="truncate max-w-[140px]">Audio Guestbook Live</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Combined / Universal Golden Safe Zone Box */}
      {mode === 'combined' && (
        <div className="absolute top-[12%] bottom-[24%] left-[4%] right-[18%] border-2 border-dashed border-amber-400/90 rounded-2xl pointer-events-none flex items-start justify-start p-2.5 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
          <div className="bg-black/75 backdrop-blur-sm border border-amber-400/50 rounded-md px-2 py-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono font-medium tracking-wide text-amber-300 uppercase">
              100% Guaranteed Safe Zone
            </span>
          </div>
        </div>
      )}

      {/* Mode Badge in Corner */}
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-300 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>
          Guide: {mode === 'reels' ? 'Instagram Reels' : mode === 'tiktok' ? 'TikTok UI' : 'Universal Safe'}
        </span>
      </div>
    </div>
  );
};
