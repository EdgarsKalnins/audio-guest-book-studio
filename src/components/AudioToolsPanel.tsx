import React from 'react';
import { SpeakerHigh, Scissors, ArrowCounterClockwise, Sparkle } from '@phosphor-icons/react';
import { StudioConfig } from '../types/studio';

interface AudioToolsPanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
  onVoiceBoostChange: (enabled: boolean) => void;
  onSpeechClarifierChange?: (enabled: boolean, sensitivity?: number) => void;
}

export const AudioToolsPanel: React.FC<AudioToolsPanelProps> = ({
  config,
  updateConfig,
  onVoiceBoostChange,
  onSpeechClarifierChange,
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
    <div className="space-y-4">
      {/* Voice Boost Auto-Gain */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between shadow-sm">
        <div className="pr-3">
          <div className="flex items-center gap-1.5">
            <SpeakerHigh weight="light" className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Voice Boost (Auto-Gain)</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
            Normalizes guest speech so whispers and quiet messages sound loud and clear.
          </p>
        </div>
        <button
          onClick={handleVoiceBoostToggle}
          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
            voiceBoost ? 'bg-[#dfc596]' : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
              voiceBoost ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-white dark:bg-zinc-400'
            }`}
          />
        </button>
      </div>

      {/* Speech Clarifier & Noise Filter (Feature #03) */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="pr-3">
            <div className="flex items-center gap-1.5">
              <Sparkle weight="light" className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Speech Clarifier & Noise Filter
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Cuts 50/60Hz line hum, silences pauses, and boosts vintage phone presence.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClarifierToggle}
            className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
              speechClarifier
                ? 'bg-[#dfc596]'
                : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                speechClarifier ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-white dark:bg-zinc-400'
              }`}
            />
          </button>
        </div>

        {speechClarifier && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/[0.06] space-y-3 animate-fade-in">
            {/* DSP Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                80Hz Hum Cut
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                3.0kHz Presence
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                Dynamic Gate
              </span>
            </div>

            {/* Vocal Presence Boost Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Vocal Clarity Boost</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">
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
                className="w-full accent-[#dfc596] cursor-pointer"
              />
            </div>

            {/* Noise Gate Sensitivity */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Noise Gate Threshold</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">
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
                className="w-full accent-[#dfc596] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Audio Trim Controls */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Scissors weight="light" className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            Voice Trimmer
          </span>
          {(trimStart > 0 || (trimEnd > 0 && trimEnd < dur)) && (
            <button
              onClick={resetTrim}
              className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <ArrowCounterClockwise weight="light" className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {dur > 0 ? (
          <div className="space-y-3">
            {/* Start Trim Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Trim Start (Cut Phone Pickup Click)</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">{format(trimStart)}</span>
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
                className="w-full accent-[#dfc596] cursor-pointer"
              />
            </div>

            {/* End Trim Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Trim End (Cut Hangup Noise)</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">{format(trimEnd || dur)}</span>
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
                className="w-full accent-[#dfc596] cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-2">
            Load an audio guest record to adjust trimming and cut phone clicks.
          </p>
        )}
      </div>

      {/* Gap Between Consecutive Recordings (Multi-Track) */}
      {config.timelineTracks && config.timelineTracks.length > 1 && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 mb-1">
            <span>Silence Gap Between Guests</span>
            <span className="font-mono text-zinc-500 dark:text-zinc-400">{config.gapBetweenTracks ?? 0.5}s</span>
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
            className="w-full accent-[#dfc596] cursor-pointer"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Gentle pause inserted between consecutive voicemails in continuous timeline.
          </p>
        </div>
      )}
    </div>
  );
};
