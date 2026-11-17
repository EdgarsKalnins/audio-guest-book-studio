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
import { parseSrtOrVtt, computeWordTimings, formatSecondsToSrtTimestamp } from '../engine/subtitleEngine';

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
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-stone-200 uppercase flex items-center gap-2">
            <ChatCenteredText className="w-4 h-4 text-amber-400" />
            Animated Speech Subtitles (Whisper AI)
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Display synchronized karaoke-style subtitles highlighting word-by-word as guests speak.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-5">
          {/* Style Presets */}
          <div className="space-y-2">
            <span className="text-xs text-stone-300 font-medium block">Subtitle Style</span>
            <div className="grid grid-cols-2 gap-2">
              {styleOptions.map((st) => {
                const isSelected = currentStyle === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleStyleChange(st.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-amber-200' : 'text-stone-200'}`}>
                        {st.name}
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-amber-400" weight="bold" />}
                    </div>
                    <span className="text-[10px] text-stone-500 block mt-0.5">{st.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-stone-300 font-medium block">Vertical Position</span>
              <div className="grid grid-cols-3 gap-1 bg-stone-900 p-1 rounded-lg border border-stone-800">
                {(['bottom', 'center', 'top'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => handlePositionChange(pos)}
                    className={`py-1 text-[11px] font-medium rounded capitalize transition ${
                      position === pos
                        ? 'bg-amber-500/20 text-amber-200 font-semibold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-stone-300 font-medium">
                <span>Font Size</span>
                <span className="text-amber-300/90 font-mono text-[11px]">{Math.round(fontSize * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-stone-800 rounded-lg h-1.5 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Action Bar (Import & Quick Generate) */}
          <div className="flex items-center gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".srt,.vtt,.txt"
              className="hidden"
              onChange={handleImportSrtFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
            >
              <UploadSimple className="w-3.5 h-3.5 text-stone-400" />
              Import SRT / VTT
            </button>
            <button
              onClick={handleAddSampleGreeting}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
            >
              <Sparkle className="w-3.5 h-3.5 text-amber-400" />
              Auto-Align Sample
            </button>
          </div>

          {/* Subtitle Segments List */}
          <div className="space-y-2.5 pt-2 border-t border-stone-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300 font-medium">
                Dialogue Lines ({segments.length})
              </span>
              <button
                onClick={handleAddSegment}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-medium"
              >
                <Plus className="w-3 h-3" />
                Add Line
              </button>
            </div>

            {segments.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-stone-800 text-center space-y-1.5">
                <Quotes className="w-5 h-5 text-stone-500 mx-auto" />
                <p className="text-xs text-stone-400">No subtitles added yet</p>
                <p className="text-[10px] text-stone-500">
                  Import an SRT file or click "Auto-Align Sample" to generate instant captions.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {segments.map((seg, idx) => (
                  <div
                    key={seg.id}
                    className="p-2.5 rounded-lg bg-stone-900 border border-stone-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-mono text-amber-400/90 font-medium">#{idx + 1}</span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <input
                          type="number"
                          step="0.1"
                          value={seg.start}
                          onChange={(e) => handleUpdateSegment(seg.id, seg.text, parseFloat(e.target.value) || 0, seg.end)}
                          className="w-14 px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200 text-center"
                        />
                        <span>→</span>
                        <input
                          type="number"
                          step="0.1"
                          value={seg.end}
                          onChange={(e) => handleUpdateSegment(seg.id, seg.text, seg.start, parseFloat(e.target.value) || 0)}
                          className="w-14 px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-200 text-center"
                        />
                        <span>s</span>
                      </div>
                      <button
                        onClick={() => handleRemoveSegment(seg.id)}
                        className="text-stone-500 hover:text-rose-400 p-0.5 transition"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={seg.text}
                      rows={2}
                      onChange={(e) => handleUpdateSegment(seg.id, e.target.value)}
                      className="w-full text-xs bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 focus:outline-none focus:border-amber-500/50 resize-none font-sans"
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
