import React, { useRef } from 'react';
import {
  StudioConfig,
  SubtitleStyle,
  SubtitleSegment,
} from '../types/studio';
import {
  ChatCenteredText,
  UploadSimple,
  Plus,
  Trash,
  Sparkle,
  Quotes,
  Check,
} from '@phosphor-icons/react';
import { parseSrtOrVtt, computeWordTimings } from '../engine/subtitleEngine';

interface SubtitlePanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
}

export const SubtitlePanel: React.FC<SubtitlePanelProps> = ({ config, updateConfig }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subtitles = config.subtitles;
  const isEnabled = subtitles?.enabled ?? false;
  const currentStyle = subtitles?.style || 'karaoke-gold';
  const position = subtitles?.position || 'bottom';
  const fontSize = subtitles?.fontSize || 1.0;
  const segments = subtitles?.segments || [];

  const handleToggle = (enabled: boolean) => {
    updateConfig((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        enabled,
      },
    }));
  };

  const handleStyleChange = (style: SubtitleStyle) => {
    updateConfig((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        style,
      },
    }));
  };

  const handlePositionChange = (pos: 'bottom' | 'center' | 'top') => {
    updateConfig((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        position: pos,
      },
    }));
  };

  const handleFontSizeChange = (size: number) => {
    updateConfig((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        fontSize: size,
      },
    }));
  };

  const handleImportSrtFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseSrtOrVtt(text);
        if (parsed.length > 0) {
          updateConfig((prev) => ({
            ...prev,
            subtitles: {
              ...prev.subtitles,
              enabled: true,
              segments: parsed,
            },
          }));
        } else {
          alert('Could not detect valid SRT / VTT timestamps in this file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddSampleGreeting = () => {
    const duration = config.audioDuration || 15;
    const couple = config.typography.coupleNames || 'Sarah & Michael';
    const sampleSegments: SubtitleSegment[] = [
      {
        id: `sub-1-${Date.now()}`,
        start: 0.5,
        end: Math.min(duration, 4.5),
        text: `Congratulations to the beautiful couple, ${couple}!`,
        words: computeWordTimings(`Congratulations to the beautiful couple, ${couple}!`, 0.5, Math.min(duration, 4.5)),
      },
      {
        id: `sub-2-${Date.now()}`,
        start: 4.8,
        end: Math.min(duration, 9.5),
        text: 'Wishing you a lifetime of endless love, joy, and laughter.',
        words: computeWordTimings('Wishing you a lifetime of endless love, joy, and laughter.', 4.8, Math.min(duration, 9.5)),
      },
    ];

    if (duration > 10) {
      sampleSegments.push({
        id: `sub-3-${Date.now()}`,
        start: 9.8,
        end: Math.min(duration, duration - 0.5),
        text: 'So honored to celebrate this unforgettable day with you!',
        words: computeWordTimings('So honored to celebrate this unforgettable day with you!', 9.8, Math.min(duration, duration - 0.5)),
      });
    }

    updateConfig((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        enabled: true,
        segments: sampleSegments,
      },
    }));
  };

  const handleAddSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const newStart = lastSeg ? Math.round((lastSeg.end + 0.3) * 10) / 10 : 0;
    const newEnd = Math.round((newStart + 3.0) * 10) / 10;
    const defaultText = 'We love you so much!';

    const newSeg: SubtitleSegment = {
      id: `sub-${Date.now()}`,
      start: newStart,
      end: newEnd,
      text: defaultText,
      words: computeWordTimings(defaultText, newStart, newEnd),
    };

    updateConfig((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        segments: [...prev.subtitles.segments, newSeg],
      },
    }));
  };

  const handleUpdateSegment = (id: string, text: string, start?: number, end?: number) => {
    updateConfig((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        segments: prev.subtitles.segments.map((seg) => {
          if (seg.id !== id) return seg;
          const s = start !== undefined ? start : seg.start;
          const e = end !== undefined ? end : seg.end;
          return {
            ...seg,
            text,
            start: s,
            end: e,
            words: computeWordTimings(text, s, e),
          };
        }),
      },
    }));
  };

  const handleRemoveSegment = (id: string) => {
    updateConfig((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        segments: prev.subtitles.segments.filter((s) => s.id !== id),
      },
    }));
  };

  const styleOptions: Array<{ id: SubtitleStyle; name: string; subtitle: string }> = [
    { id: 'karaoke-gold', name: 'Karaoke Gold', subtitle: 'Word-by-word champagne glow' },
    { id: 'minimal-pill', name: 'Minimal Pill', subtitle: 'Modern frosted glass badge' },
    { id: 'classic-serif', name: 'Classic Serif', subtitle: 'Romantic editorial script' },
    { id: 'cinematic-caps', name: 'Cinematic Caps', subtitle: 'Wide-tracking uppercase' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Master Enable / Disable Toggle Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            isEnabled
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-white/10'
          }`}>
            <ChatCenteredText weight="bold" className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Synchronized Subtitles
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Karaoke word-by-word active highlighting
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleToggle(!isEnabled)}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            isEnabled
              ? 'bg-[#dfc596]'
              : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10'
          }`}
          aria-label="Toggle subtitles"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
              isEnabled ? 'right-0.5 bg-zinc-950 shadow-sm' : 'left-0.5 bg-white dark:bg-zinc-400'
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-4 animate-fade-in">
          {/* Style Presets */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Subtitle Visual Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {styleOptions.map((st) => {
                const isSelected = currentStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStyleChange(st.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-400/80 dark:border-amber-400/60 bg-amber-500/10 text-zinc-950 dark:text-white shadow-sm ring-1 ring-amber-400/30 font-semibold'
                        : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-[#1f1f24] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isSelected ? 'font-semibold text-zinc-950 dark:text-white' : 'font-medium'}`}>
                        {st.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" weight="bold" />}
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                      {st.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                Position
              </span>
              <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-white/[0.06]">
                {(['bottom', 'center', 'top'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handlePositionChange(pos)}
                    className={`py-1 text-xs font-medium rounded-md capitalize transition-all ${
                      position === pos
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm font-semibold'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-2">
              <div className="flex justify-between text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Scale</span>
                <span className="text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                  {Math.round(fontSize * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
                className="w-full accent-[#dfc596] cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Action Bar (Import & Quick Generate) */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".srt,.vtt,.txt"
              className="hidden"
              onChange={handleImportSrtFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99]"
            >
              <UploadSimple className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              Import SRT / VTT
            </button>
            <button
              type="button"
              onClick={handleAddSampleGreeting}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-zinc-900 dark:text-amber-200 border border-amber-400/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99]"
            >
              <Sparkle className="w-3.5 h-3.5 text-amber-500" />
              Auto-Align Sample
            </button>
          </div>

          {/* Subtitle Segments List */}
          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Dialogue Lines ({segments.length})
              </span>
              <button
                type="button"
                onClick={handleAddSegment}
                className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line
              </button>
            </div>

            {segments.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 text-center space-y-1.5 bg-zinc-50 dark:bg-[#141417]">
                <Quotes className="w-5 h-5 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-600 dark:text-zinc-400">No subtitles added yet</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Import an SRT file or click "Auto-Align Sample" to generate instant captions.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {segments.map((seg, idx) => (
                  <div
                    key={seg.id}
                    className="p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-2 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">#{idx + 1}</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <input
                          type="number"
                          step="0.1"
                          value={seg.start}
                          onChange={(e) => handleUpdateSegment(seg.id, seg.text, parseFloat(e.target.value) || 0, seg.end)}
                          className="w-14 px-1.5 py-0.5 bg-zinc-50 dark:bg-[#141417] rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-center focus:outline-none focus:border-amber-400"
                        />
                        <span>→</span>
                        <input
                          type="number"
                          step="0.1"
                          value={seg.end}
                          onChange={(e) => handleUpdateSegment(seg.id, seg.text, seg.start, parseFloat(e.target.value) || 0)}
                          className="w-14 px-1.5 py-0.5 bg-zinc-50 dark:bg-[#141417] rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-center focus:outline-none focus:border-amber-400"
                        />
                        <span>s</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSegment(seg.id)}
                        className="text-zinc-400 hover:text-rose-500 p-1 transition-colors rounded"
                        title="Delete line"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={seg.text}
                      rows={2}
                      onChange={(e) => handleUpdateSegment(seg.id, e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/10 rounded-xl p-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#dfc596]/40 focus:border-[#dfc596] resize-none font-sans"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
