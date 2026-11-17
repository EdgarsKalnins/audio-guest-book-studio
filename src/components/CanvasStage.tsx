import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, ArrowCounterClockwise, Sparkle, SlidersHorizontal } from '@phosphor-icons/react';
import { StudioConfig, AspectRatioPreset, ASPECT_RATIOS } from '../types/studio';
import { AudioEngine } from '../engine/audioEngine';
import { drawStudioFrame } from '../engine/visualizers/renderer';

interface CanvasStageProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
  audioEngine: AudioEngine;
  bgImage: HTMLImageElement | null;
  onFileDrop: (files: FileList) => void;
  isExporting?: boolean;
  onSwitchToControls?: () => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  config,
  updateConfig,
  audioEngine,
  bgImage,
  onFileDrop,
  isExporting = false,
  onSwitchToControls,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const aspect = ASPECT_RATIOS[config.aspectRatio];

  // If exporting starts while audio is playing, pause audio immediately to save resources
  useEffect(() => {
    if (isExporting && isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    }
  }, [isExporting, isPlaying, audioEngine]);

  // Keep track of audio engine callbacks
  useEffect(() => {
    audioEngine.onTimeUpdate = (time) => {
      setCurrentTime(time);
    };
    audioEngine.onEnded = () => {
      setIsPlaying(false);
    };
    return () => {
      audioEngine.onTimeUpdate = null;
      audioEngine.onEnded = null;
    };
  }, [audioEngine]);

  // Update waveform peaks whenever audio is loaded
  useEffect(() => {
    setWaveformPeaks(audioEngine.getWaveformPeaks(140));
  }, [config.audioPath, config.audioDuration]);

  // Main Render Loop for Canvas Preview
  useEffect(() => {
    if (isExporting) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const freqData = new Uint8Array(256);
    const timeData = new Float32Array(512);

    const render = () => {
      if (audioEngine.getIsPlaying()) {
        audioEngine.getLiveAudioData(freqData, timeData);
      } else {
        freqData.fill(0);
        timeData.fill(0);
      }

      drawStudioFrame(
        ctx,
        aspect.width,
        aspect.height,
        bgImage,
        freqData,
        timeData,
        config,
        currentTime,
        config.audioDuration || audioEngine.duration
      );

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [aspect, bgImage, config, currentTime, isExporting, audioEngine]);

  const togglePlay = () => {
    if (dur === 0 || isExporting) return;
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExporting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const totalD = config.audioDuration || audioEngine.duration || 1;
    const newTime = pct * totalD;
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
  };

  const setRatio = (ratio: AspectRatioPreset) => {
    updateConfig((prev) => ({ ...prev, aspectRatio: ratio }));
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const dur = config.audioDuration || audioEngine.duration || 0;
  const trimStart = config.audioSettings.trimStart;
  const trimEnd = config.audioSettings.trimEnd > 0 ? config.audioSettings.trimEnd : dur;

  // Drag and drop handlers on canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files);
    }
  };

  const isMacElectron = Boolean(window.electronAPI && window.electronAPI.platform === 'darwin');

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 flex flex-col items-center justify-between p-3 sm:p-4 lg:p-6 bg-zinc-200/70 dark:bg-[#0a0a0c] border-r border-zinc-200 dark:border-white/[0.08] overflow-hidden transition-colors ${
        isDraggingOver ? 'bg-zinc-300 dark:bg-[#141418] ring-2 ring-black/10 dark:ring-white/20' : ''
      }`}
    >
      {/* Top Bar: Aspect Ratio Switcher + Window Drag Area + Controls Switch */}
      <div
        className={`w-full flex items-center justify-between flex-wrap gap-2 z-10 px-1 sm:px-2 mb-2 app-drag-region ${
          isMacElectron ? 'pl-20 sm:pl-24 pt-1' : ''
        }`}
      >
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900/90 p-1 rounded-xl border border-zinc-200 dark:border-white/[0.08] shadow-sm app-no-drag">
          {(['9:16', '1:1', '16:9'] as AspectRatioPreset[]).map((r) => {
            const isSelected = config.aspectRatio === r;
            const rData = ASPECT_RATIOS[r];
            return (
              <button
                key={r}
                onClick={() => setRatio(r)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm border border-zinc-300 dark:border-white/10 font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                {rData.label} <span className="opacity-60 text-[10px]">({r})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs app-no-drag">
          {isExporting ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 shadow-sm animate-pulse text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Exporting (Preview Suspended)
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-[11px] font-mono shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Stage ({aspect.width}x{aspect.height})
            </span>
          )}

          {/* Tablet & Mobile Switch to Controls Pill */}
          {onSwitchToControls && (
            <button
              onClick={onSwitchToControls}
              className="lg:hidden px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-medium shadow-md transition-all flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Controls & Export →</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Stage: Viewport Container with Canvas */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-0 my-1 sm:my-2">
        <div
          className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-300 dark:border-white/10 flex items-center justify-center bg-black transition-all"
          style={{
            aspectRatio: `${aspect.width} / ${aspect.height}`,
            height: config.aspectRatio === '9:16' ? '100%' : 'auto',
            width: config.aspectRatio === '16:9' ? '100%' : 'auto',
            maxHeight: 'calc(100vh - 200px)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={aspect.width}
            height={aspect.height}
            className="w-full h-full object-contain pointer-events-none"
          />

          {isExporting && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 rounded-2xl z-20 animate-fade-in pointer-events-none select-none">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/15 flex items-center justify-center mb-3 shadow-lg text-zinc-200">
                <Sparkle weight="light" className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-zinc-100 tracking-wide">
                Preview Paused During Export
              </p>
              <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
                Live rendering and audio playback are suspended to allocate 100% hardware encoding power to MP4 export.
              </p>
            </div>
          )}

          {isDraggingOver && !isExporting && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/40 rounded-2xl z-20">
              <Sparkle weight="light" className="w-10 h-10 text-zinc-300 mb-2 animate-bounce" />
              <p className="text-base font-medium text-white">Drop Audio or Background Image here</p>
              <p className="text-xs text-zinc-400 mt-1">Accepts MP3, WAV, M4A, PNG, JPG</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Audio Scrubber & Controls Bar */}
      <div className="w-full max-w-3xl bg-white dark:bg-[#131316] border border-zinc-200 dark:border-white/[0.08] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xl z-10 transition-colors">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3 px-1">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={togglePlay}
              disabled={dur === 0 || isExporting}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                dur === 0 || isExporting
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-md shadow-black/20 active:scale-95'
              }`}
              title={isExporting ? 'Playback paused during export' : isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause weight="fill" className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play weight="fill" className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                audioEngine.seek(trimStart);
                setCurrentTime(trimStart);
              }}
              className="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              title="Restart from beginning"
            >
              <ArrowCounterClockwise weight="light" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[150px] sm:max-w-[260px] md:max-w-[380px]">
                {config.timelineTracks && config.timelineTracks.length > 1 ? (
                  <>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium mr-1.5">
                      Sequence ({config.timelineTracks.length}):
                    </span>
                    {config.timelineTracks.find(
                      (t) => currentTime >= t.startTime && currentTime <= t.endTime + 0.1
                    )?.name || config.audioName}
                  </>
                ) : (
                  config.audioName || 'No audio loaded'
                )}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                {formatTime(currentTime)} / {formatTime(dur)}
                {config.timelineTracks && config.timelineTracks.length > 1 && (
                  <span className="ml-2 text-zinc-400 dark:text-zinc-500">
                    • Continuous Video
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Voice Boost Badge */}
          {config.audioSettings.voiceBoost && (
            <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shadow-sm shrink-0">
              Voice Boost ON
            </span>
          )}
        </div>

        {/* Interactive Waveform Scrubber with Trim region */}
        <div
          onClick={handleSeek}
          className="relative h-10 sm:h-12 md:h-14 bg-zinc-100 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/[0.06] rounded-lg sm:rounded-xl overflow-hidden cursor-pointer flex items-center px-2 select-none group"
        >
          {/* Waveform Bars */}
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
            {waveformPeaks.length > 0 ? (
              waveformPeaks.map((peak, idx) => {
                const barPct = idx / waveformPeaks.length;
                const barTime = barPct * dur;
                const isPlayed = barTime <= currentTime;
                const isTrimmedOut = barTime < trimStart || (trimEnd > 0 && barTime > trimEnd);

                return (
                  <div
                    key={idx}
                    style={{ height: `${Math.max(12, peak * 88)}%` }}
                    className={`w-[2.5px] rounded-full transition-colors ${
                      isTrimmedOut
                        ? 'bg-zinc-300/50 dark:bg-zinc-800/40 opacity-40'
                        : isPlayed
                        ? 'bg-[#cba86e] dark:bg-[#dfc596]'
                        : 'bg-zinc-300 dark:bg-zinc-700/60 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-600'
                    }`}
                  />
                );
              })
            ) : (
              <div className="w-full text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">Drop audio to display waveform</div>
            )}
          </div>

          {/* Track Division Markers if multiple tracks are sequenced */}
          {dur > 0 && config.timelineTracks && config.timelineTracks.length > 1 && (
            config.timelineTracks.map((t, idx) => {
              if (idx === 0) return null;
              const pct = (t.startTime / dur) * 100;
              return (
                <div
                  key={t.id}
                  style={{ left: `${pct}%` }}
                  className="absolute top-0 bottom-0 w-[1.5px] bg-zinc-400/60 dark:bg-white/40 z-10 pointer-events-none"
                  title={`${t.name} (starts at ${formatTime(t.startTime)})`}
                >
                  <div className="w-1.5 h-1.5 -ml-[2px] bg-zinc-600 dark:bg-white rounded-full" />
                </div>
              );
            })
          )}

          {/* Playhead Indicator Line */}
          {dur > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-zinc-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10 pointer-events-none transition-all duration-75"
              style={{ left: `${(currentTime / dur) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-zinc-900 dark:bg-white rounded-full shadow" />
            </div>
          )}
        </div>

        {/* Trim handles display */}
        {dur > 0 && (
          <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-500 font-mono">
            <span>Trim Start: {formatTime(trimStart)}</span>
            <span>Duration: {formatTime(Math.max(0, trimEnd - trimStart))}</span>
            <span>Trim End: {formatTime(trimEnd)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
