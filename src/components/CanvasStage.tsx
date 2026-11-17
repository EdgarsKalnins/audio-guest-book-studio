import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { StudioConfig, AspectRatioPreset, ASPECT_RATIOS } from '../types/studio';
import { AudioEngine } from '../engine/audioEngine';
import { drawStudioFrame } from '../engine/visualizers/renderer';

interface CanvasStageProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
  audioEngine: AudioEngine;
  bgImage: HTMLImageElement | null;
  onFileDrop: (files: FileList) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  config,
  updateConfig,
  audioEngine,
  bgImage,
  onFileDrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const aspect = ASPECT_RATIOS[config.aspectRatio];

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
        // Subtle ambient idle motion if paused
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
  }, [config, aspect, bgImage, audioEngine, currentTime]);

  const togglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play(currentTime, config.audioSettings.trimStart, config.audioSettings.trimEnd);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const dur = config.audioDuration || audioEngine.duration || 1;
    const newTime = pct * dur;
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

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 flex flex-col items-center justify-between p-6 bg-[#0c0b0a] border-r border-[#26221f] overflow-hidden transition-colors ${
        isDraggingOver ? 'bg-[#1c1815] ring-2 ring-gold-400/40' : ''
      }`}
    >
      {/* Top Bar: Aspect Ratio Switcher */}
      <div className="w-full flex items-center justify-between z-10 px-2 mb-2">
        <div className="flex items-center gap-1.5 bg-[#171514] p-1 rounded-xl border border-[#2d2824] shadow-inner">
          {(['9:16', '1:1', '16:9'] as AspectRatioPreset[]).map((r) => {
            const isSelected = config.aspectRatio === r;
            const rData = ASPECT_RATIOS[r];
            return (
              <button
                key={r}
                onClick={() => setRatio(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                  isSelected
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30 shadow-sm'
                    : 'text-[#9c958e] hover:text-[#e8e4df] hover:bg-[#201d1b]'
                }`}
              >
                {rData.label} <span className="opacity-60 text-[10px]">({r})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8c857e]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#171514] border border-[#2d2824]">
            <Sparkles className="w-3 h-3 text-gold-400" />
            Live Preview ({aspect.width}x{aspect.height})
          </span>
        </div>
      </div>

      {/* Center Stage: Viewport Container with Canvas */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-0 my-2">
        <div
          className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-2xl border border-[#332c27] flex items-center justify-center bg-black transition-all"
          style={{
            aspectRatio: `${aspect.width} / ${aspect.height}`,
            height: config.aspectRatio === '9:16' ? '100%' : 'auto',
            width: config.aspectRatio === '16:9' ? '100%' : 'auto',
            maxHeight: 'calc(100vh - 240px)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={aspect.width}
            height={aspect.height}
            className="w-full h-full object-contain pointer-events-none"
          />

          {isDraggingOver && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gold-400 rounded-2xl z-20">
              <Sparkles className="w-10 h-10 text-gold-400 mb-2 animate-bounce" />
              <p className="text-base font-medium text-[#f5ebd7]">Drop Audio or Background Image here</p>
              <p className="text-xs text-[#a89f94] mt-1">Accepts MP3, WAV, M4A, PNG, JPG</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Audio Scrubber & Controls Bar */}
      <div className="w-full max-w-3xl bg-[#171514] border border-[#2d2824] rounded-2xl p-4 shadow-xl z-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={dur === 0}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                dur === 0
                  ? 'bg-[#24201e] text-[#554e49] cursor-not-allowed'
                  : 'bg-gold-500 hover:bg-gold-400 text-[#120e0a] shadow-lg shadow-gold-500/20 active:scale-95'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
            </button>

            <button
              onClick={() => {
                audioEngine.seek(trimStart);
                setCurrentTime(trimStart);
              }}
              className="p-2 rounded-lg text-[#8e857c] hover:text-[#e8e4df] hover:bg-[#221f1d] transition-colors"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#e8e4df] truncate max-w-[220px]">
                {config.audioName || 'No audio loaded'}
              </span>
              <span className="text-[11px] text-[#8e857c]">
                {formatTime(currentTime)} / {formatTime(dur)}
              </span>
            </div>
          </div>

          {/* Voice Boost Badge */}
          {config.audioSettings.voiceBoost && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30">
              Voice Boost ON
            </span>
          )}
        </div>

        {/* Interactive Waveform Scrubber with Trim region */}
        <div
          onClick={handleSeek}
          className="relative h-14 bg-[#100e0d] border border-[#24201d] rounded-xl overflow-hidden cursor-pointer flex items-center px-2 select-none group"
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
                        ? 'bg-[#2b2520] opacity-40'
                        : isPlayed
                        ? 'bg-gold-400'
                        : 'bg-[#403831] group-hover:bg-[#524941]'
                    }`}
                  />
                );
              })
            ) : (
              <div className="w-full text-center text-xs text-[#5a524a]">Drop audio to display waveform</div>
            )}
          </div>

          {/* Playhead Indicator Line */}
          {dur > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10 pointer-events-none transition-all duration-75"
              style={{ left: `${(currentTime / dur) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rounded-full shadow" />
            </div>
          )}
        </div>

        {/* Trim handles display */}
        {dur > 0 && (
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#7d756d]">
            <span>Trim Start: {formatTime(trimStart)}</span>
            <span>Duration: {formatTime(Math.max(0, trimEnd - trimStart))}</span>
            <span>Trim End: {formatTime(trimEnd)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
