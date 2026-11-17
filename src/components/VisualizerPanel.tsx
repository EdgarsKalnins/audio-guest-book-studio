import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Palette, Sparkle, CaretDown, CaretUp, Check, Faders, PaintBrush } from '@phosphor-icons/react';
import { StudioConfig, VISUALIZER_PRESETS, COLOR_OPTIONS, GRADIENT_PRESETS, VisualizerStyle } from '../types/studio';

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

  const [isCraftOpen, setIsCraftOpen] = useState(false);

  const setStyle = (style: VisualizerStyle) => {
    updateConfig((prev) => ({ ...prev, visualizerStyle: style }));
    setIsDropdownOpen(false);
  };

  const setColor = (hex: string) => {
    updateConfig((prev) => ({
      ...prev,
      visualizerColor: hex,
      gradientPreset: null,
    }));
  };

  const setGradient = (gradId: string) => {
    const preset = GRADIENT_PRESETS.find((p) => p.id === gradId);
    if (!preset) return;
    updateConfig((prev) => ({
      ...prev,
      gradientPreset: gradId,
      visualizerColor: preset.stops[1].color,
    }));
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
    <div className="space-y-3">
      {/* Group 1: Studio Visualizer Effect Style */}
      <div className="p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <VisualizerGlyph styleId={config.visualizerStyle} className="w-3.5 h-3.5 text-amber-500" />
            3. Visualizer Effect
          </label>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            {VISUALIZER_PRESETS.length} Styles
          </span>
        </div>

        {/* Dropdown Trigger Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
              isDropdownOpen
                ? 'border-amber-400/80 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-950 dark:text-white ring-1 ring-amber-400/30 shadow-xs'
                : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 text-amber-500 shadow-2xs">
                <VisualizerGlyph styleId={currentPreset.id} className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{currentPreset.name}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{currentPreset.description}</p>
              </div>
            </div>
            <CaretDown
              weight="bold"
              className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Popover Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden py-1 max-h-72 overflow-y-auto custom-scrollbar animate-fade-in">
              <div className="px-3 py-1 text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-white/[0.06]">
                Select Visualizer Style
              </div>
              {VISUALIZER_PRESETS.map((preset) => {
                const isSelected = config.visualizerStyle === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setStyle(preset.id)}
                    className={`w-full px-3 py-2 text-left transition-all flex items-center justify-between border-l-2 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-zinc-950 dark:text-white font-medium'
                        : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.03] hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0">
                        <VisualizerGlyph styleId={preset.id} className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs ${isSelected ? 'text-zinc-950 dark:text-white font-semibold' : 'text-zinc-700 dark:text-zinc-200'}`}>
                          {preset.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{preset.description}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Check weight="bold" className="w-2.5 h-2.5 text-amber-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Group 2: Palette & Gradients */}
      <div className="p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Palette weight="regular" className="w-3.5 h-3.5 text-amber-500" />
            4. Palette & Gradients
          </label>
        </div>

        {/* Gradient Presets (2-column compact grid) */}
        <div className="grid grid-cols-2 gap-1.5">
          {GRADIENT_PRESETS.map((grad) => {
            const isSelected = config.gradientPreset === grad.id;
            return (
              <button
                key={grad.id}
                type="button"
                onClick={() => setGradient(grad.id)}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs font-medium transition-all text-left ${
                  isSelected
                    ? 'border-amber-400/80 dark:border-amber-400/60 bg-amber-500/10 text-zinc-950 dark:text-white shadow-2xs ring-1 ring-amber-400/30'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#1f1f24]'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shrink-0 shadow-2xs"
                  style={{ background: grad.previewCss }}
                />
                <span className="truncate text-[11px]">{grad.name}</span>
              </button>
            );
          })}
        </div>

        {/* Classic Solid Chips & Hex Picker */}
        <div className="flex items-center gap-1 pt-1 flex-wrap">
          {COLOR_OPTIONS.map((col) => {
            const isSelected = !config.gradientPreset && config.visualizerColor.toLowerCase() === col.hex.toLowerCase();
            return (
              <button
                key={col.hex}
                type="button"
                onClick={() => setColor(col.hex)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs font-semibold'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-black/40 shadow-inner"
                  style={{ backgroundColor: col.hex }}
                />
                {col.name}
              </button>
            );
          })}

          {/* Custom Hex Color Picker */}
          <div className="flex items-center pl-1" title="Custom Hex Color">
            <input
              type="color"
              value={config.visualizerColor}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              title="Custom Color"
            />
          </div>
        </div>
      </div>

      {/* Group 3: Waveform Geometry & Dynamics */}
      <div className="p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal weight="regular" className="w-3.5 h-3.5 text-amber-500" />
            5. Waveform Dynamics & Glow
          </label>
        </div>

        {/* Ambient Glow Switch Row */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/[0.06]">
          <span className="text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-medium">
            <Sparkle weight="regular" className="w-3.5 h-3.5 text-amber-500" />
            Soft Ambient Glow
          </span>
          <button
            type="button"
            onClick={() =>
              updateConfig((prev) => ({ ...prev, visualizerGlow: !prev.visualizerGlow }))
            }
            className={`w-8 h-4.5 rounded-full transition-colors relative ${
              config.visualizerGlow ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-transform ${
                config.visualizerGlow ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-white dark:bg-zinc-400'
              }`}
            />
          </button>
        </div>

        {/* Scale & Opacity Sliders */}
        <div className="space-y-2 pt-0.5">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1 text-zinc-700 dark:text-zinc-300">
              <span>Scale</span>
              <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[10px]">{Math.round(config.visualizerScale * 100)}%</span>
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
              className="w-full accent-amber-500 cursor-pointer h-1.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1 text-zinc-700 dark:text-zinc-300">
              <span>Opacity</span>
              <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[10px]">{Math.round(config.visualizerOpacity * 100)}%</span>
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
              className="w-full accent-amber-500 cursor-pointer h-1.5"
            />
          </div>
        </div>

        {/* Expandable Advanced Stroke Weight Drawer */}
        <div className="pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setIsCraftOpen(!isCraftOpen)}
            className="w-full flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors py-0.5"
          >
            <span className="flex items-center gap-1.5">
              <Faders className="w-3 h-3 text-amber-500" />
              Advanced Stroke & Cap Styling
            </span>
            {isCraftOpen ? (
              <CaretUp className="w-3 h-3 text-zinc-400" />
            ) : (
              <CaretDown className="w-3 h-3 text-zinc-400" />
            )}
          </button>

          {isCraftOpen && (
            <div className="pt-2 space-y-2 animate-fade-in text-xs">
              <div>
                <div className="flex items-center justify-between mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                  <span>Stroke Weight</span>
                  <span className="font-mono text-zinc-500 text-[10px]">
                    {((config.strokeWidth ?? 1.0)).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={config.strokeWidth ?? 1.0}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      strokeWidth: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
              </div>

              <div>
                <span className="block mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">Line Cap</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['round', 'butt', 'square'] as const).map((cap) => {
                    const isSelected = (config.lineCap ?? 'round') === cap;
                    return (
                      <button
                        key={cap}
                        type="button"
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            lineCap: cap,
                          }))
                        }
                        className={`py-1 px-1.5 rounded text-[11px] border text-center capitalize transition-all ${
                          isSelected
                            ? 'border-amber-400/80 bg-amber-500/10 text-zinc-950 dark:text-white font-semibold'
                            : 'border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#202026]'
                        }`}
                      >
                        {cap}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                  <span>Particle Density</span>
                  <span className="font-mono text-zinc-500 text-[10px]">
                    {((config.particleDensity ?? 1.0)).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={config.particleDensity ?? 1.0}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      particleDensity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
