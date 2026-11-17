import React from 'react';
import { Volume2, Scissors, RotateCcw } from 'lucide-react';
import { StudioConfig } from '../types/studio';

interface AudioToolsPanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
  onVoiceBoostChange: (enabled: boolean) => void;
}

export const AudioToolsPanel: React.FC<AudioToolsPanelProps> = ({
  config,
  updateConfig,
  onVoiceBoostChange,
}) => {
  const dur = config.audioDuration || 0;
  const { trimStart, trimEnd, voiceBoost } = config.audioSettings;

  const handleVoiceBoostToggle = () => {
    const nextVal = !voiceBoost;
    updateConfig((prev) => ({
      ...prev,
      audioSettings: { ...prev.audioSettings, voiceBoost: nextVal },
    }));
    onVoiceBoostChange(nextVal);
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
      <div className="p-3.5 rounded-xl bg-[#141211] border border-[#2a2420] flex items-center justify-between">
        <div className="pr-2">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-medium text-[#f0ebe3]">Voice Boost (Auto-Gain)</span>
          </div>
          <p className="text-xs text-[#8c8276] mt-0.5">
            Normalizes guest speech so whispers and quiet messages sound loud and clear.
          </p>
        </div>
        <button
          onClick={handleVoiceBoostToggle}
          className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
            voiceBoost ? 'bg-gold-500' : 'bg-[#332b25]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              voiceBoost ? 'right-0.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Audio Trim Controls */}
      <div className="p-3.5 rounded-xl bg-[#141211] border border-[#2a2420]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#f0ebe3] flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-gold-400" />
            Voice Trimmer
          </span>
          {(trimStart > 0 || (trimEnd > 0 && trimEnd < dur)) && (
            <button
              onClick={resetTrim}
              className="text-[11px] text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {dur > 0 ? (
          <div className="space-y-3">
            {/* Start Trim Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#b5aca1] mb-1">
                <span>Trim Start (Cut Phone Pickup Click)</span>
                <span>{format(trimStart)}</span>
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
                      trimStart: Math.min(val, (prev.audioSettings.trimEnd || dur) - 0.5),
                    },
                  }));
                }}
                className="w-full accent-gold-500 cursor-pointer"
              />
            </div>

            {/* End Trim Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#b5aca1] mb-1">
                <span>Trim End (Cut Silence / Hangup)</span>
                <span>{format(trimEnd > 0 ? trimEnd : dur)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max={dur}
                step="0.1"
                value={trimEnd > 0 ? trimEnd : dur}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateConfig((prev) => ({
                    ...prev,
                    audioSettings: {
                      ...prev.audioSettings,
                      trimEnd: Math.max(val, prev.audioSettings.trimStart + 0.5),
                    },
                  }));
                }}
                className="w-full accent-gold-500 cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#736a61]">Load an audio file to adjust trim handles.</p>
        )}
      </div>
    </div>
  );
};
