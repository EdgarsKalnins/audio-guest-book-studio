import React from 'react';
import { Activity, Sparkles, Sliders, Palette } from 'lucide-react';
import { StudioConfig, VISUALIZER_PRESETS, COLOR_OPTIONS, VisualizerStyle } from '../types/studio';

interface VisualizerPanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({ config, updateConfig }) => {
  const setStyle = (style: VisualizerStyle) => {
    updateConfig((prev) => ({ ...prev, visualizerStyle: style }));
  };

  const setColor = (hex: string) => {
    updateConfig((prev) => ({ ...prev, visualizerColor: hex }));
  };

  return (
    <div className="space-y-5">
      {/* Visualizer Preset Cards */}
      <div>
        <label className="block text-xs font-semibold text-[#a89f94] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-gold-400" />
          Centered Visualizer Style
        </label>
        <div className="grid grid-cols-1 gap-2">
          {VISUALIZER_PRESETS.map((preset) => {
            const isSelected = config.visualizerStyle === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setStyle(preset.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-gold-500/60 bg-[#211c19] text-[#f7f3ee] shadow-md ring-1 ring-gold-500/30'
                    : 'border-[#2d2722] bg-[#141211] text-[#9c9389] hover:bg-[#1a1715] hover:text-[#d4ccc2]'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-xs opacity-75 mt-0.5">{preset.description}</p>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-gold-400 bg-gold-400' : 'border-[#4a4038]'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wedding Color Palette */}
      <div>
        <label className="block text-xs font-semibold text-[#a89f94] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-gold-400" />
          Color & Glow
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_OPTIONS.map((col) => {
            const isSelected = config.visualizerColor.toLowerCase() === col.hex.toLowerCase();
            return (
              <button
                key={col.hex}
                onClick={() => setColor(col.hex)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-gold-400 bg-[#241f1a] text-[#fbf8f5] shadow-sm'
                    : 'border-[#2d2722] bg-[#141211] text-[#9c9389] hover:bg-[#1c1917]'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-inner"
                  style={{ backgroundColor: col.hex }}
                />
                {col.name}
              </button>
            );
          })}

          {/* Custom Hex Color Input */}
          <div className="flex items-center gap-1.5 pl-1">
            <input
              type="color"
              value={config.visualizerColor}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              title="Custom Color"
            />
          </div>
        </div>

        {/* Glow Toggle */}
        <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-[#141211] border border-[#2a2420]">
          <span className="text-xs text-[#ded8d0] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            Soft Ambient Glow
          </span>
          <button
            onClick={() =>
              updateConfig((prev) => ({ ...prev, visualizerGlow: !prev.visualizerGlow }))
            }
            className={`w-9 h-5 rounded-full transition-colors relative ${
              config.visualizerGlow ? 'bg-gold-500' : 'bg-[#332b25]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                config.visualizerGlow ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Scale & Opacity Sliders */}
      <div>
        <label className="block text-xs font-semibold text-[#a89f94] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-gold-400" />
          Size & Transparency
        </label>
        <div className="space-y-3 bg-[#141211] p-3 rounded-xl border border-[#2a2420]">
          <div>
            <div className="flex items-center justify-between text-xs mb-1 text-[#b5aca1]">
              <span>Scale</span>
              <span>{Math.round(config.visualizerScale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.5"
              step="0.05"
              value={config.visualizerScale}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  visualizerScale: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-gold-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1 text-[#b5aca1]">
              <span>Opacity</span>
              <span>{Math.round(config.visualizerOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={config.visualizerOpacity}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  visualizerOpacity: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-gold-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
