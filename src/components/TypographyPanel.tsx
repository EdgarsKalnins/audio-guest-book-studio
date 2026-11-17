import React from 'react';
import { TextT, Clock } from '@phosphor-icons/react';
import { StudioConfig } from '../types/studio';

interface TypographyPanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
}

export const TypographyPanel: React.FC<TypographyPanelProps> = ({ config, updateConfig }) => {
  const typo = config.typography;

  const updateTypo = (updates: Partial<typeof typo>) => {
    updateConfig((prev) => ({
      ...prev,
      typography: { ...prev.typography, ...updates },
    }));
  };

  return (
    <div className="space-y-4">
      {/* Enable / Disable Typography */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <TextT weight="regular" className="w-4 h-4 text-amber-500" />
            Wedding Typography Overlay
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Display couple names, wedding date & subtitle</p>
        </div>
        <button
          onClick={() => updateTypo({ enabled: !typo.enabled })}
          className={`w-9 h-5 rounded-full transition-colors relative ${
            typo.enabled ? 'bg-[#dfc596]' : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
              typo.enabled ? 'right-0.5 bg-zinc-950' : 'left-0.5 bg-white dark:bg-zinc-400'
            }`}
          />
        </button>
      </div>

      {typo.enabled && (
        <div className="space-y-3.5 p-3.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm animate-fade-in">
          {/* Couple Names */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Couple Names
            </label>
            <input
              type="text"
              value={typo.coupleNames}
              onChange={(e) => updateTypo({ coupleNames: e.target.value })}
              placeholder="e.g. Sarah & Michael"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 font-serif"
            />
          </div>

          {/* Wedding Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Wedding Date
            </label>
            <input
              type="text"
              value={typo.dateText}
              onChange={(e) => updateTypo({ dateText: e.target.value })}
              placeholder="e.g. October 14, 2024"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
            />
          </div>

          {/* Subtitle / Header */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Header Subtitle
            </label>
            <input
              type="text"
              value={typo.titleText}
              onChange={(e) => updateTypo({ titleText: e.target.value })}
              placeholder="e.g. Wedding Audio Guestbook"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
            />
          </div>

          {/* Font Family Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Typography Font Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateTypo({ fontFamily: 'Italiana' })}
                className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                  typo.fontFamily === 'Italiana'
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141417] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1a1a1e]'
                }`}
              >
                <span className="font-serif block text-sm" style={{ fontFamily: 'Italiana, serif' }}>Italiana</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Haute Couture</span>
              </button>

              <button
                type="button"
                onClick={() => updateTypo({ fontFamily: 'Cinzel' })}
                className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                  typo.fontFamily === 'Cinzel'
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141417] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1a1a1e]'
                }`}
              >
                <span className="font-serif block text-sm" style={{ fontFamily: 'Cinzel, serif' }}>Cinzel</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Classical Roman</span>
              </button>

              <button
                type="button"
                onClick={() => updateTypo({ fontFamily: 'Cormorant Garamond' })}
                className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                  typo.fontFamily === 'Cormorant Garamond'
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141417] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1a1a1e]'
                }`}
              >
                <span className="font-serif block text-sm" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Cormorant</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Venetian Antique</span>
              </button>

              <button
                type="button"
                onClick={() => updateTypo({ fontFamily: 'Playfair Display' })}
                className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                  typo.fontFamily === 'Playfair Display'
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141417] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1a1a1e]'
                }`}
              >
                <span className="font-serif block text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>Playfair</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Editorial Vogue</span>
              </button>

              <button
                type="button"
                onClick={() => updateTypo({ fontFamily: 'Plus Jakarta Sans' })}
                className={`col-span-2 px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                  typo.fontFamily === 'Plus Jakarta Sans'
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141417] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#1a1a1e]'
                }`}
              >
                <span className="block text-sm" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Plus Jakarta Sans</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Modern Architectural Minimalist</span>
              </button>
            </div>
          </div>

          {/* Show Playback Timer Checkbox */}
          <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
            <label className="text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer">
              <Clock weight="regular" className="w-3.5 h-3.5 text-amber-500" />
              Display Playback Timestamp
            </label>
            <input
              type="checkbox"
              checked={typo.showTimer}
              onChange={(e) => updateTypo({ showTimer: e.target.checked })}
              className="w-4 h-4 rounded accent-[#dfc596] cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
