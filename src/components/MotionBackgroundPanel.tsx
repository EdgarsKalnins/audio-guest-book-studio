import React from 'react';
import {
  StudioConfig,
  MotionShaderPreset,
  MOTION_SHADER_OPTIONS,
} from '../types/studio';
import {
  FilmReel,
  Sparkle,
  Flame,
  ShootingStar,
  ArrowCounterClockwise,
  Check,
} from '@phosphor-icons/react';

interface MotionBackgroundPanelProps {
  config: StudioConfig;
  onChange: (updater: (prev: StudioConfig) => StudioConfig) => void;
}

export const MotionBackgroundPanel: React.FC<MotionBackgroundPanelProps> = ({ config, onChange }) => {
  const currentPreset = config.motion?.preset || 'none';
  const speed = config.motion?.speed ?? 1.0;
  const intensity = config.motion?.intensity ?? 0.8;

  const handleSelectPreset = (preset: MotionShaderPreset) => {
    onChange((prev) => ({
      ...prev,
      motion: {
        ...prev.motion,
        preset,
      },
    }));
  };

  const handleSpeedChange = (newSpeed: number) => {
    onChange((prev) => ({
      ...prev,
      motion: {
        ...prev.motion,
        speed: newSpeed,
      },
    }));
  };

  const handleIntensityChange = (newIntensity: number) => {
    onChange((prev) => ({
      ...prev,
      motion: {
        ...prev.motion,
        intensity: newIntensity,
      },
    }));
  };

  const getPresetIcon = (id: MotionShaderPreset) => {
    switch (id) {
      case 'candlelight-bokeh':
        return <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" weight="fill" />;
      case 'vintage-film-dust':
        return <FilmReel className="w-4 h-4 text-amber-500 dark:text-amber-400" weight="fill" />;
      case 'stardust-drift':
        return <ShootingStar className="w-4 h-4 text-amber-500 dark:text-amber-400" weight="fill" />;
      case 'none':
      default:
        return <Sparkle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" weight="regular" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <FilmReel weight="light" className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            Animated Motion & B-Roll Shaders
          </label>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Procedurally animate subtle candlelight bokeh or vintage 8mm celluloid film dust behind the waveform.
        </p>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MOTION_SHADER_OPTIONS.map((item) => {
          const isSelected = currentPreset === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectPreset(item.id)}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-amber-400/80 dark:border-amber-400/60 bg-amber-500/10 text-zinc-950 dark:text-white shadow-sm ring-1 ring-amber-400/30'
                  : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-[#1f1f24] shadow-sm'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/40'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/10'
                }`}
              >
                {getPresetIcon(item.id)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-zinc-950 dark:text-white' : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {item.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" weight="bold" />}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                  {item.subtitle}
                </div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-snug line-clamp-2">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Motion Controls (visible when a shader is active) */}
      {currentPreset !== 'none' && (
        <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-white/[0.08] animate-fade-in">
          {/* Intensity Slider */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">Motion Intensity</span>
              <span className="text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                {Math.round(intensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={intensity}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
              className="w-full accent-[#dfc596] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              <span>Subtle (20%)</span>
              <span>Balanced (80%)</span>
              <span>Intense (100%)</span>
            </div>
          </div>

          {/* Drift Speed Slider */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">Drift & Animation Speed</span>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                  {speed.toFixed(1)}x
                </span>
                {speed !== 1.0 && (
                  <button
                    type="button"
                    onClick={() => handleSpeedChange(1.0)}
                    title="Reset speed to 1.0x"
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 transition"
                  >
                    <ArrowCounterClockwise className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full accent-[#dfc596] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              <span>0.4x (Dreamy Slow)</span>
              <span>1.0x (Standard)</span>
              <span>2.0x (Energetic)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
