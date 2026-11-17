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
        return <Camera className="w-5 h-5 text-amber-300" weight="fill" />;
      case 'photostrip':
        return <FilmStrip className="w-5 h-5 text-amber-300" weight="fill" />;
      case 'vinyl':
        return <Disc className="w-5 h-5 text-amber-300" weight="fill" />;
      case 'haute-couture':
      default:
        return <Sparkle className="w-5 h-5 text-amber-300" weight="fill" />;
    }
  };

  const photoFilterOptions: Array<{ id: PhotoFilter; label: string; previewColor: string }> = [
    { id: 'none', label: 'Natural', previewColor: 'bg-stone-500' },
    { id: 'vintage-warm', label: 'Warm Glow', previewColor: 'bg-amber-600' },
    { id: 'black-and-white', label: 'B & W Film', previewColor: 'bg-stone-200' },
    { id: 'sepia', label: 'Vintage Sepia', previewColor: 'bg-yellow-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold tracking-wider text-stone-200 uppercase flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" />
          Photo Collage & Frame Templates
        </h3>
        <p className="text-xs text-stone-400 mt-1">
          Choose a physical photo frame style. Procedurally rendered at 60 FPS in 1080p.
        </p>
      </div>

      {/* Template Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {FRAME_TEMPLATE_OPTIONS.map((item) => {
          const isSelected = currentTemplate === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTemplate(item.id)}
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
                {getTemplateIcon(item.id)}
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

      {/* Customization Options for Physical Frames */}
      {currentTemplate !== 'haute-couture' && (
        <div className="space-y-4 pt-2 border-t border-stone-800/80">
          {/* Tilt Angle Slider */}
          {(currentTemplate === 'polaroid' || currentTemplate === 'photostrip') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-medium flex items-center gap-1.5">
                  Physical Tilt Angle
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-300/90 font-mono text-[11px]">{tiltAngle.toFixed(1)}°</span>
                  {tiltAngle !== 0 && (
                    <button
                      onClick={() => handleTiltChange(0)}
                      title="Reset tilt to 0°"
                      className="text-stone-500 hover:text-stone-300 p-0.5 transition"
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
                className="w-full accent-amber-500 bg-stone-800 rounded-lg h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>-4.0° (Left)</span>
                <span>0.0° (Straight)</span>
                <span>+4.0° (Right)</span>
              </div>
            </div>
          )}

          {/* Photo Filter Tone Selector */}
          <div className="space-y-2">
            <span className="text-xs text-stone-300 font-medium block">
              Photo Tone & Color Grade
            </span>
            <div className="grid grid-cols-4 gap-2">
              {photoFilterOptions.map((f) => {
                const isActive = currentFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-medium border flex flex-col items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${f.previewColor} border border-stone-700/60`} />
                    <span className="truncate w-full text-center">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Polaroid / Photostrip Chin Handwritten Notes */}
          {(currentTemplate === 'polaroid' || currentTemplate === 'photostrip') && (
            <div className="space-y-2 pt-2 border-t border-stone-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-300 font-medium">Handwritten Chin Note</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showChinText}
                    onChange={(e) => handleToggleChinText(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {showChinText && (
                <div>
                  <input
                    type="text"
                    value={chinText}
                    placeholder={config.typography.coupleNames || 'e.g. Sarah & Michael'}
                    onChange={(e) => handleChinTextChange(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Rendered in organic cursive fountain pen ink on the lower white chin.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
