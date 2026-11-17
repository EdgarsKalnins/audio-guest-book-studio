import React from 'react';
import {
  FrameTemplate,
  PhotoFilter,
  FRAME_TEMPLATE_OPTIONS,
  StudioConfig,
} from '../types/studio';
import {
  FilmStrip,
  Camera,
  Disc,
  Sparkle,
  ArrowCounterClockwise,
  Check,
} from '@phosphor-icons/react';

interface FrameTemplatePanelProps {
  config: StudioConfig;
  onChange: (updater: (prev: StudioConfig) => StudioConfig) => void;
}

export const FrameTemplatePanel: React.FC<FrameTemplatePanelProps> = ({ config, onChange }) => {
  const currentTemplate = config.frame?.template || 'haute-couture';
  const currentFilter = config.frame?.photoFilter || 'none';
  const tiltAngle = config.frame?.tiltAngle ?? -1.2;
  const showChinText = config.frame?.showChinText !== false;
  const chinText = config.frame?.chinText ?? '';

  const handleSelectTemplate = (templateId: FrameTemplate) => {
    onChange((prev) => ({
      ...prev,
      frame: {
        ...prev.frame,
        template: templateId,
      },
    }));
  };

  const handleFilterChange = (filter: PhotoFilter) => {
    onChange((prev) => ({
      ...prev,
      frame: {
        ...prev.frame,
        photoFilter: filter,
      },
    }));
  };

  const handleTiltChange = (angle: number) => {
    onChange((prev) => ({
      ...prev,
      frame: {
        ...prev.frame,
        tiltAngle: angle,
      },
    }));
  };

  const handleToggleChinText = (enabled: boolean) => {
    onChange((prev) => ({
      ...prev,
      frame: {
        ...prev.frame,
        showChinText: enabled,
      },
    }));
  };

  const handleChinTextChange = (text: string) => {
    onChange((prev) => ({
      ...prev,
      frame: {
        ...prev.frame,
        chinText: text,
      },
    }));
  };

  const getTemplateIcon = (id: FrameTemplate) => {
    switch (id) {
      case 'polaroid':
        return <Camera className="w-4 h-4 text-amber-500 dark:text-amber-400" weight="fill" />;
      case 'photostrip':
        return <FilmStrip className="w-4 h-4 text-amber-500 dark:text-amber-400" weight="fill" />;
      case 'vinyl':
        return <Disc className="w-4 h-4 text-amber-500 dark:text-amber-400" weight="fill" />;
      case 'haute-couture':
      default:
        return <Sparkle className="w-4 h-4 text-amber-500 dark:text-amber-400" weight="fill" />;
    }
  };

  const photoFilterOptions: Array<{ id: PhotoFilter; label: string; previewColor: string }> = [
    { id: 'none', label: 'Natural', previewColor: 'bg-zinc-400 dark:bg-zinc-500' },
    { id: 'vintage-warm', label: 'Warm Glow', previewColor: 'bg-amber-500' },
    { id: 'black-and-white', label: 'B & W Film', previewColor: 'bg-zinc-800 dark:bg-zinc-200' },
    { id: 'sepia', label: 'Sepia', previewColor: 'bg-amber-700' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Camera weight="regular" className="w-3.5 h-3.5 text-amber-500" />
            Photo Collage & Frame Templates
          </label>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Select a physical frame design or retro photo layout. Procedurally rendered at 60 FPS in 1080p.
        </p>
      </div>

      {/* Template Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FRAME_TEMPLATE_OPTIONS.map((item) => {
          const isSelected = currentTemplate === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTemplate(item.id)}
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
                {getTemplateIcon(item.id)}
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

      {/* Customization Options for Physical Frames */}
      {currentTemplate !== 'haute-couture' && (
        <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-white/[0.08] animate-fade-in">
          {/* Tilt Angle Slider */}
          {(currentTemplate === 'polaroid' || currentTemplate === 'photostrip') && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                  Physical Tilt Angle
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                    {tiltAngle > 0 ? `+${tiltAngle.toFixed(1)}°` : `${tiltAngle.toFixed(1)}°`}
                  </span>
                  {tiltAngle !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleTiltChange(0)}
                      title="Reset tilt to 0°"
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 transition"
                    >
                      <ArrowCounterClockwise className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="-4.0"
                max="4.0"
                step="0.2"
                value={tiltAngle}
                onChange={(e) => handleTiltChange(parseFloat(e.target.value))}
                className="w-full accent-[#dfc596] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                <span>-4.0° (Left)</span>
                <span>0.0° (Straight)</span>
                <span>+4.0° (Right)</span>
              </div>
            </div>
          )}

          {/* Photo Filter Tone Selector */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
              Photo Tone & Color Grade
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {photoFilterOptions.map((f) => {
                const isActive = currentFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFilterChange(f.id)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-medium border flex flex-col items-center gap-1.5 transition-all ${
                      isActive
                        ? 'border-amber-400/80 dark:border-amber-400/60 bg-amber-500/10 text-zinc-950 dark:text-white shadow-sm ring-1 ring-amber-400/30 font-semibold'
                        : 'border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#141417] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1e1e23]'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${f.previewColor} border border-black/10 dark:border-white/10 shadow-inner`} />
                    <span className="truncate w-full text-center">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Polaroid / Photostrip Chin Handwritten Notes */}
          {(currentTemplate === 'polaroid' || currentTemplate === 'photostrip') && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                    Handwritten Chin Note
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Organic cursive script on the lower Polaroid margin
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChinText(!showChinText)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                    showChinText ? 'bg-[#dfc596]' : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10'
                  }`}
                  aria-label="Toggle handwritten chin note"
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                      showChinText ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-white dark:bg-zinc-400'
                    }`}
                  />
                </button>
              </div>

              {showChinText && (
                <div className="pt-1 space-y-1.5 animate-fade-in">
                  <input
                    type="text"
                    value={chinText}
                    placeholder={config.typography.coupleNames || 'e.g. Sarah & Michael'}
                    onChange={(e) => handleChinTextChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#dfc596]/40 focus:border-[#dfc596]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
