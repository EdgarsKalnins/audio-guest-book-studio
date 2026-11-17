import React, { useState, useRef, useEffect } from 'react';
import { Activity, Sparkles, Sliders, Palette, ChevronDown, Check } from 'lucide-react';
import { StudioConfig, VISUALIZER_PRESETS, COLOR_OPTIONS, VisualizerStyle } from '../types/studio';

interface VisualizerPanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({ config, updateConfig }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const setStyle = (style: VisualizerStyle) => {
    updateConfig((prev) => ({ ...prev, visualizerStyle: style }));
    setIsDropdownOpen(false);
  };

  const setColor = (hex: string) => {
    updateConfig((prev) => ({ ...prev, visualizerColor: hex }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const currentPreset = VISUALIZER_PRESETS.find((p) => p.id === config.visualizerStyle) || VISUALIZER_PRESETS[0];

  return (
    <div className="space-y-4">
      {/* Studio Dropdown Selector */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            Visualizer Effect Style
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">
            {VISUALIZER_PRESETS.length} Styles
          </span>
        </div>

        {/* Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
            isDropdownOpen
              ? 'border-white/30 bg-[#1f1f24] text-white ring-1 ring-white/10 shadow-lg'
              : 'border-white/[0.08] bg-[#18181c] text-zinc-200 hover:border-white/20 hover:bg-[#1f1f24]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-zinc-200">
              <Activity className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">{currentPreset.name}</p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{currentPreset.description}</p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Popover Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-[#18181c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1.5 max-h-80 overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-500 border-b border-white/[0.06]">
              Select Studio Visualizer
            </div>
            {VISUALIZER_PRESETS.map((preset) => {
              const isSelected = config.visualizerStyle === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setStyle(preset.id)}
                  className={`w-full px-3.5 py-2.5 text-left transition-all flex items-center justify-between border-l-2 ${
                    isSelected
                      ? 'border-[#dfc596] bg-white/[0.05] text-white font-medium'
                      : 'border-transparent text-zinc-300 hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <p className={`text-xs ${isSelected ? 'text-white font-semibold' : 'text-zinc-200'}`}>
                      {preset.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{preset.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#dfc596]/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#dfc596]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Waveform Color Palette */}
      <div>
        <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-zinc-400" />
          Waveform Color & Aura
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
                    ? 'border-white/30 bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                    : 'border-white/[0.08] bg-[#18181c] text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f24]'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/40 shadow-inner"
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

        {/* Ambient Glow Toggle */}
        <div className="mt-2.5 flex items-center justify-between p-3 rounded-xl bg-[#18181c] border border-white/[0.08]">
          <span className="text-xs text-zinc-200 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Soft Ambient Glow
          </span>
          <button
            onClick={() =>
              updateConfig((prev) => ({ ...prev, visualizerGlow: !prev.visualizerGlow }))
            }
            className={`w-9 h-5 rounded-full transition-colors relative ${
              config.visualizerGlow ? 'bg-[#dfc596]' : 'bg-zinc-800 border border-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                config.visualizerGlow ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-zinc-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Scale & Opacity Sliders */}
      <div>
        <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
          Size & Transparency
        </label>
        <div className="space-y-3 bg-[#18181c] p-3.5 rounded-xl border border-white/[0.08]">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 text-zinc-300">
              <span>Visualizer Scale</span>
              <span className="font-mono text-zinc-400">{Math.round(config.visualizerScale * 100)}%</span>
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
              className="w-full accent-[#dfc596] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 text-zinc-300">
              <span>Opacity</span>
              <span className="font-mono text-zinc-400">{Math.round(config.visualizerOpacity * 100)}%</span>
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
              className="w-full accent-[#dfc596] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
