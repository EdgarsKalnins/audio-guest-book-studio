import React from 'react';
import { SpeakerHigh, Scissors, ArrowCounterClockwise, Sparkle } from '@phosphor-icons/react';
import { StudioConfig } from '../types/studio';

interface AudioToolsPanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
  onVoiceBoostChange: (enabled: boolean) => void;
  onSpeechClarifierChange?: (enabled: boolean, sensitivity?: number) => void;
  onAutoTrimSilence?: () => void;
}

export const AudioToolsPanel: React.FC<AudioToolsPanelProps> = ({
  config,
  updateConfig,
  onVoiceBoostChange,
  onSpeechClarifierChange,
  onAutoTrimSilence,
}) => {
  const dur = config.audioDuration || 0;
  const {
    trimStart,
    trimEnd,
    voiceBoost,
    speechClarifier,
    clarifierSensitivity = 0.6,
    noiseGateThresholdDb = -42,
  } = config.audioSettings;

  const handleVoiceBoostToggle = () => {
    const nextVal = !voiceBoost;
    updateConfig((prev) => ({
      ...prev,
      audioSettings: { ...prev.audioSettings, voiceBoost: nextVal },
    }));
    onVoiceBoostChange(nextVal);
  };

  const handleClarifierToggle = () => {
    const nextVal = !speechClarifier;
    updateConfig((prev) => ({
      ...prev,
      audioSettings: { ...prev.audioSettings, speechClarifier: nextVal },
    }));
    onSpeechClarifierChange?.(nextVal, clarifierSensitivity);
  };

  const resetTrim = () => {
    updateConfig((prev) => ({
      ...prev,
      audioSettings: { ...prev.audioSettings, trimStart: 0, trimEnd: dur },
    }));
  };

  const format = (s: number) => {
    if (isNaN(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${sec < 10 ? '0' : ''}${sec}.${ms}s`;
  };

  return (
    <div className="space-y-3">
      {/* Group 1: Voice Clarification & DSP */}
      <div className="p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2.5">
        <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <SpeakerHigh weight="regular" className="w-3.5 h-3.5 text-amber-500" />
          Voice Clean-up & Auto-Gain
        </label>

        {/* Voice Boost Auto-Gain Switch */}
        <div className="p-2.5 rounded-lg bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between">
          <div className="pr-2">
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Voice Boost (Auto-Gain)</span>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Normalizes quiet guest whispers to clear speech volume.
            </p>
          </div>
          <button
            type="button"
            onClick={handleVoiceBoostToggle}
            className={`w-8 h-4.5 rounded-full transition-colors relative shrink-0 ${
              voiceBoost ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-transform ${
                voiceBoost ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-white dark:bg-zinc-400'
              }`}
            />
          </button>
        </div>

        {/* Speech Clarifier & Noise Filter Switch */}
        <div className="p-2.5 rounded-lg bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <div className="pr-2">
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                <Sparkle weight="regular" className="w-3.5 h-3.5 text-amber-500" />
                Telephone Clarifier (80Hz Hum Cut)
              </span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Cuts AC line hum and enhances formant presence.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClarifierToggle}
              className={`w-8 h-4.5 rounded-full transition-colors relative shrink-0 ${
                speechClarifier ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-transform ${
                  speechClarifier ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-white dark:bg-zinc-400'
                }`}
              />
            </button>
          </div>

          {speechClarifier && (
            <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.06] space-y-2 animate-fade-in text-[11px]">
              <div>
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Presence Boost</span>
                  <span className="font-mono text-zinc-500 text-[10px]">
                    {Math.round((clarifierSensitivity ?? 0.6) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={clarifierSensitivity ?? 0.6}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateConfig((prev) => ({
                      ...prev,
                      audioSettings: { ...prev.audioSettings, clarifierSensitivity: val },
                    }));
                    onSpeechClarifierChange?.(true, val);
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Noise Gate</span>
                  <span className="font-mono text-zinc-500 text-[10px]">
                    {noiseGateThresholdDb ?? -42} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="-24"
                  step="1"
                  value={noiseGateThresholdDb ?? -42}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateConfig((prev) => ({
                      ...prev,
                      audioSettings: { ...prev.audioSettings, noiseGateThresholdDb: val },
                    }));
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group 2: Audio Trimmer & Speech Boundaries */}
      <div className="p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Scissors weight="regular" className="w-3.5 h-3.5 text-amber-500" />
            Trimming & Silence
          </label>
          <div className="flex items-center gap-1.5">
            {dur > 0 && onAutoTrimSilence && (
              <button
                type="button"
                onClick={onAutoTrimSilence}
                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 flex items-center gap-1 transition-all shadow-2xs font-medium"
                title="Automatically cut leading & trailing silence"
              >
                <Sparkle weight="bold" className="w-2.5 h-2.5 text-amber-500" />
                Auto-Trim
              </button>
            )}
            {(trimStart > 0 || (trimEnd > 0 && trimEnd < dur)) && (
              <button
                onClick={resetTrim}
                className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                <ArrowCounterClockwise weight="regular" className="w-2.5 h-2.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {dur > 0 ? (
          <div className="space-y-2 pt-0.5">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Start (Pickup Click)</span>
                <span className="font-mono text-zinc-500 text-[10px]">{format(trimStart)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, dur - 0.5)}
                step="0.1"
                value={trimStart}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateConfig((prev) => ({
                    ...prev,
                    audioSettings: {
                      ...prev.audioSettings,
                      trimStart: Math.min(val, (trimEnd || dur) - 0.5),
                    },
                  }));
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-700 dark:text-zinc-300 mb-1">
                <span>End (Hangup Noise)</span>
                <span className="font-mono text-zinc-500 text-[10px]">{format(trimEnd || dur)}</span>
              </div>
              <input
                type="range"
                min={Math.min(dur, trimStart + 0.5)}
                max={dur}
                step="0.1"
                value={trimEnd || dur}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateConfig((prev) => ({
                    ...prev,
                    audioSettings: {
                      ...prev.audioSettings,
                      trimEnd: Math.max(val, trimStart + 0.5),
                    },
                  }));
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5"
              />
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 py-1">
            Load an audio guest record to adjust trimming.
          </p>
        )}

        {/* Inter-Track Silence Gap */}
        {config.timelineTracks && config.timelineTracks.length > 1 && (
          <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-[11px] text-zinc-700 dark:text-zinc-300 mb-1">
              <span>Gap Between Recordings</span>
              <span className="font-mono text-zinc-500 text-[10px]">{config.gapBetweenTracks ?? 0.5}s</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={config.gapBetweenTracks ?? 0.5}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                updateConfig((prev) => ({ ...prev, gapBetweenTracks: val }));
              }}
              className="w-full accent-amber-500 cursor-pointer h-1.5"
            />
          </div>
        )}
      </div>
    </div>
  );
};
