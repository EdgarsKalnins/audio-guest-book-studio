import React from 'react';
import { Type, Clock } from 'lucide-react';
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
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#141211] border border-[#2a2420]">
        <div>
          <span className="text-sm font-medium text-[#f0ebe3] flex items-center gap-1.5">
            <Type className="w-4 h-4 text-gold-400" />
            Wedding Typography Overlay
          </span>
          <p className="text-xs text-[#8c8276] mt-0.5">Show couple names, wedding date & title</p>
        </div>
        <button
          onClick={() => updateTypo({ enabled: !typo.enabled })}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            typo.enabled ? 'bg-gold-500' : 'bg-[#332b25]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              typo.enabled ? 'right-0.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {typo.enabled && (
        <div className="space-y-3 p-3.5 rounded-xl bg-[#141211] border border-[#2a2420]">
          {/* Couple Names */}
          <div>
            <label className="block text-xs font-medium text-[#a89f94] mb-1">
              Couple Names
            </label>
            <input
              type="text"
              value={typo.coupleNames}
              onChange={(e) => updateTypo({ coupleNames: e.target.value })}
              placeholder="e.g. Sarah & Michael"
              className="w-full px-3 py-2 rounded-lg bg-[#1c1917] border border-[#332c26] text-sm text-[#f5ebd7] placeholder-[#665e55] focus:outline-none focus:border-gold-400 font-serif"
            />
          </div>

          {/* Wedding Date */}
          <div>
            <label className="block text-xs font-medium text-[#a89f94] mb-1">
              Wedding Date
            </label>
            <input
              type="text"
              value={typo.dateText}
              onChange={(e) => updateTypo({ dateText: e.target.value })}
              placeholder="e.g. October 14, 2024"
              className="w-full px-3 py-2 rounded-lg bg-[#1c1917] border border-[#332c26] text-sm text-[#f5ebd7] placeholder-[#665e55] focus:outline-none focus:border-gold-400"
            />
          </div>

          {/* Subtitle / Header */}
          <div>
            <label className="block text-xs font-medium text-[#a89f94] mb-1">
              Header Title
            </label>
            <input
              type="text"
              value={typo.titleText}
              onChange={(e) => updateTypo({ titleText: e.target.value })}
              placeholder="e.g. Wedding Audio Guestbook"
              className="w-full px-3 py-2 rounded-lg bg-[#1c1917] border border-[#332c26] text-sm text-[#f5ebd7] placeholder-[#665e55] focus:outline-none focus:border-gold-400"
            />
          </div>

          {/* Font Family Selector */}
          <div>
            <label className="block text-xs font-medium text-[#a89f94] mb-1">
              Serif Font Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateTypo({ fontFamily: 'Cormorant Garamond' })}
                className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                  typo.fontFamily === 'Cormorant Garamond'
                    ? 'border-gold-500 bg-[#251f1b] text-gold-200'
                    : 'border-[#332c26] text-[#9c9389] hover:bg-[#1c1917]'
                }`}
              >
                <span className="font-serif text-sm block">Cormorant</span>
                <span className="text-[10px] opacity-75">Classic Romance</span>
              </button>

              <button
                type="button"
                onClick={() => updateTypo({ fontFamily: 'Playfair Display' })}
                className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                  typo.fontFamily === 'Playfair Display'
                    ? 'border-gold-500 bg-[#251f1b] text-gold-200'
                    : 'border-[#332c26] text-[#9c9389] hover:bg-[#1c1917]'
                }`}
              >
                <span className="font-serif text-sm block">Playfair</span>
                <span className="text-[10px] opacity-75">Editorial Elegance</span>
              </button>
            </div>
          </div>

          {/* Show Audio Timestamp Toggle */}
          <div className="pt-2 border-t border-[#26211d] flex items-center justify-between">
            <span className="text-xs text-[#cfc8c0] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              Show Audio Timestamp Bar
            </span>
            <button
              onClick={() => updateTypo({ showTimer: !typo.showTimer })}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                typo.showTimer ? 'bg-gold-500' : 'bg-[#332b25]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  typo.showTimer ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
