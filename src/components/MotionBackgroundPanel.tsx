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
        return <Flame className="w-5 h-5 text-amber-300" weight="fill" />;
      case 'vintage-film-dust':
        return <FilmReel className="w-5 h-5 text-amber-300" weight="fill" />;
      case 'stardust-drift':
        return <ShootingStar className="w-5 h-5 text-amber-300" weight="fill" />;
      case 'none':
      default:
        return <Sparkle className="w-5 h-5 text-stone-400" weight="regular" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold tracking-wider text-stone-200 uppercase flex items-center gap-2">
          <FilmReel className="w-4 h-4 text-amber-400" />
          Animated Motion & B-Roll Shaders
        </h3>
        <p className="text-xs text-stone-400 mt-1">
          Procedurally animate subtle candlelight bokeh or vintage 8mm celluloid film dust behind the waveform.
        </p>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {MOTION_SHADER_OPTIONS.map((item) => {
          const isSelected = currentPreset === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectPreset(item.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-950/20'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40 text-stone-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/40'
                    : 'bg-stone-800 border-stone-700/60'
                }`}
              >
                {getPresetIcon(item.id)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-amber-200' : 'text-stone-200'
                    }`}
                  >
                    {item.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" weight="bold" />}
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{item.subtitle}</div>
                <div className="text-[10px] text-stone-500 mt-1 leading-snug line-clamp-2">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Motion Controls (visible when a shader is active) */}
      {currentPreset !== 'none' && (
        <div className="space-y-4 pt-2 border-t border-stone-800/80">
          {/* Intensity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300 font-medium">Motion Intensity</span>
              <span className="text-amber-300/90 font-mono text-[11px]">{Math.round(intensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={intensity}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-stone-800 rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>Subtle (20%)</span>
              <span>Balanced (80%)</span>
              <span>Intense (100%)</span>
            </div>
          </div>

          {/* Drift Speed Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300 font-medium">Drift & Animation Speed</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-300/90 font-mono text-[11px]">{speed.toFixed(1)}x</span>
                {speed !== 1.0 && (
                  <button
                    onClick={() => handleSpeedChange(1.0)}
                    title="Reset speed to 1.0x"
                    className="text-stone-500 hover:text-stone-300 p-0.5 transition"
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
              className="w-full accent-amber-500 bg-stone-800 rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
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
