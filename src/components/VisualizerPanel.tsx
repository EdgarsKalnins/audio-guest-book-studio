import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Palette, Sparkle, CaretDown, Check } from '@phosphor-icons/react';
import { StudioConfig, VISUALIZER_PRESETS, COLOR_OPTIONS, VisualizerStyle } from '../types/studio';

interface VisualizerPanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
}

export const VisualizerGlyph: React.FC<{ styleId: VisualizerStyle; className?: string }> = ({
  styleId,
  className = 'w-4 h-4',
}) => {
  switch (styleId) {
    case 'line_wave':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 12c3-6 5 6 8 0s5-6 8 0 4 6 4 0" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'line_mirror':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
          <line x1="2" y1="12" x2="22" y2="12" strokeOpacity="0.25" />
          <line x1="6" y1="8" x2="6" y2="16" />
          <line x1="9" y1="5" x2="9" y2="19" />
          <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2" />
          <line x1="15" y1="5" x2="15" y2="19" />
          <line x1="18" y1="8" x2="18" y2="16" />
        </svg>
      );
    case 'line_horizon':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 12h5l2-5 3 10 3-8 2 3h5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'bars':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <rect x="3" y="10" width="2" height="4" rx="1" />
          <rect x="7" y="7" width="2" height="10" rx="1" />
          <rect x="11" y="4" width="2" height="16" rx="1" />
          <rect x="15" y="7" width="2" height="10" rx="1" />
          <rect x="19" y="10" width="2" height="4" rx="1" />
        </svg>
      );
    case 'wave':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
          <path d="M2 10c4-4 8 4 12 0s6-4 8 0" />
          <path d="M2 14c4 4 8-4 12 0s6 4 8 0" strokeOpacity="0.45" strokeWidth="1.2" />
        </svg>
      );
    case 'ring':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="5" y1="5" x2="7.5" y2="7.5" strokeOpacity="0.4" />
          <line x1="16.5" y1="16.5" x2="19" y2="19" strokeOpacity="0.4" />
        </svg>
      );
    case 'mirror':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
          <rect x="6" y="8" width="1.8" height="3.5" rx="0.9" />
          <rect x="6" y="12.5" width="1.8" height="3.5" rx="0.9" />
          <rect x="11.1" y="4.5" width="1.8" height="7" rx="0.9" />
          <rect x="11.1" y="12.5" width="1.8" height="7" rx="0.9" />
          <rect x="16.2" y="8" width="1.8" height="3.5" rx="0.9" />
          <rect x="16.2" y="12.5" width="1.8" height="3.5" rx="0.9" />
        </svg>
      );
    case 'particles':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="6" cy="9" r="1.2" opacity="0.7" />
          <circle cx="18" cy="8" r="1.4" opacity="0.8" />
          <circle cx="8" cy="16" r="1.3" opacity="0.6" />
          <circle cx="17" cy="15" r="1.1" opacity="0.75" />
          <circle cx="12" cy="5" r="1.1" opacity="0.5" />
          <circle cx="12" cy="19" r="1" opacity="0.6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M2 12h20" />
        </svg>
      );
  }
};

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
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <VisualizerGlyph styleId={config.visualizerStyle} className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
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
              ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-[#1f1f24] text-zinc-950 dark:text-white ring-1 ring-black/5 dark:ring-white/10 shadow-lg'
              : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-[#1f1f24] shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 text-zinc-700 dark:text-zinc-200 shadow-sm">
              <VisualizerGlyph styleId={currentPreset.id} className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{currentPreset.name}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{currentPreset.description}</p>
            </div>
          </div>
          <CaretDown
            weight="bold"
            className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Popover Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1.5 max-h-80 overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-white/[0.06]">
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
                      ? 'border-[#dfc596] bg-zinc-100 dark:bg-white/[0.05] text-zinc-950 dark:text-white font-medium'
                      : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.03] hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0">
                      <VisualizerGlyph styleId={preset.id} className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs ${isSelected ? 'text-zinc-950 dark:text-white font-semibold' : 'text-zinc-700 dark:text-zinc-200'}`}>
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{preset.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#dfc596]/20 flex items-center justify-center shrink-0">
                      <Check weight="bold" className="w-3 h-3 text-[#dfc596]" />
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
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Palette weight="light" className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
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
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1f1f24]'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/20 dark:border-black/40 shadow-inner"
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
        <div className="mt-2.5 flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm">
          <span className="text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-medium">
            <Sparkle weight="light" className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            Soft Ambient Glow
          </span>
          <button
            onClick={() =>
              updateConfig((prev) => ({ ...prev, visualizerGlow: !prev.visualizerGlow }))
            }
            className={`w-9 h-5 rounded-full transition-colors relative ${
              config.visualizerGlow ? 'bg-[#dfc596]' : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                config.visualizerGlow ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-white dark:bg-zinc-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Scale & Opacity Sliders */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <SlidersHorizontal weight="light" className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          Size & Transparency
        </label>
        <div className="space-y-3 bg-white dark:bg-[#18181c] p-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 text-zinc-700 dark:text-zinc-300">
              <span>Visualizer Scale</span>
              <span className="font-mono text-zinc-500 dark:text-zinc-400">{Math.round(config.visualizerScale * 100)}%</span>
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
            <div className="flex items-center justify-between text-xs mb-1.5 text-zinc-700 dark:text-zinc-300">
              <span>Opacity</span>
              <span className="font-mono text-zinc-500 dark:text-zinc-400">{Math.round(config.visualizerOpacity * 100)}%</span>
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
