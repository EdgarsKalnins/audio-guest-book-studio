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
    <div className="space-y-5">
      {/* Custom Luxury Dropdown Selector */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-xs font-semibold text-[#a89f94] uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-gold-400" />
            Visualizer Effect Style
          </span>
          <span className="text-[10px] text-gold-400/80 font-normal">
            {VISUALIZER_PRESETS.length} Styles
          </span>
        </label>

        {/* Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
            isDropdownOpen
              ? 'border-gold-500 bg-[#211c19] text-[#f7f3ee] ring-1 ring-gold-500/40 shadow-lg'
              : 'border-[#2d2722] bg-[#141211] text-[#e8e4df] hover:border-gold-500/40 hover:bg-[#1a1715]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-gold-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#f8f5f0] truncate">{currentPreset.name}</p>
              <p className="text-[11px] text-[#9c9389] truncate mt-0.5">{currentPreset.description}</p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gold-400 shrink-0 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Popover Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-[#171413] border border-[#3b332d] rounded-2xl shadow-2xl overflow-hidden py-1.5 max-h-80 overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#7d746a] border-b border-[#26211d]">
              Choose Visualizer Style
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
                      ? 'border-gold-400 bg-gold-500/10 text-gold-200 font-medium'
                      : 'border-transparent text-[#d4ccc2] hover:bg-[#221d1a] hover:text-[#f8f5f0]'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <p className={`text-xs ${isSelected ? 'text-gold-300 font-semibold' : 'text-[#e8e4df]'}`}>
                      {preset.name}
                    </p>
                    <p className="text-[10px] text-[#8e8478] truncate mt-0.5">{preset.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-gold-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
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
