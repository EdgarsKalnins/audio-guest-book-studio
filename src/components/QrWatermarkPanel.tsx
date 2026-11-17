import React from 'react';
import {
  QrCode,
  Link,
  BoundingBox,
  SlidersHorizontal,
  TextT,
  Check,
} from '@phosphor-icons/react';
import { StudioConfig, QrPosition } from '../types/studio';

interface QrWatermarkPanelProps {
  config: StudioConfig;
  updateConfig: (updater: (prev: StudioConfig) => StudioConfig) => void;
}

const POSITIONS: { id: QrPosition; label: string; desc: string }[] = [
  { id: 'top-left', label: 'Top Left', desc: 'Discreet upper corner' },
  { id: 'top-right', label: 'Top Right', desc: 'Classic upper right' },
  { id: 'bottom-left', label: 'Bottom Left', desc: 'Lower left margin' },
  { id: 'bottom-right', label: 'Bottom Right', desc: 'Recommended default' },
];

export const QrWatermarkPanel: React.FC<QrWatermarkPanelProps> = ({
  config,
  updateConfig,
}) => {
  const qr = config.qrWatermark;

  const toggleEnabled = () => {
    updateConfig((prev) => ({
      ...prev,
      qrWatermark: {
        ...prev.qrWatermark,
        enabled: !prev.qrWatermark.enabled,
      },
    }));
  };

  const updateQr = (fields: Partial<typeof qr>) => {
    updateConfig((prev) => ({
      ...prev,
      qrWatermark: {
        ...prev.qrWatermark,
        ...fields,
      },
    }));
  };

  return (
    <div className="space-y-4">
      {/* 1. Master Enable / Disable Toggle */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            qr.enabled
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
              : 'bg-zinc-100 dark:bg-zinc-800 text-amber-500 border border-zinc-200 dark:border-white/10'
          }`}>
            <QrCode weight="bold" className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Dynamic QR Watermark
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Offline scannable gallery link on video
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleEnabled}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            qr.enabled
              ? 'bg-amber-500'
              : 'bg-zinc-300 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
              qr.enabled ? 'right-0.5 bg-zinc-950 shadow-sm' : 'left-0.5 bg-white dark:bg-zinc-400'
            }`}
          />
        </button>
      </div>

      {qr.enabled && (
        <div className="space-y-4 animate-fade-in">
          {/* 2. Target URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link weight="regular" className="w-3.5 h-3.5 text-amber-500" />
              Target Website / Gallery URL
            </label>
            <div className="space-y-1.5">
              <input
                type="url"
                value={qr.url}
                onChange={(e) => updateQr({ url: e.target.value })}
                placeholder="https://momentbox.lv or audio link"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#dfc596]/40 focus:border-[#dfc596]"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateQr({ url: 'https://momentbox.lv' })}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  momentbox.lv
                </button>
              </div>
            </div>
          </div>

          {/* 3. Corner Positioning */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BoundingBox weight="regular" className="w-3.5 h-3.5 text-amber-500" />
              Corner Placement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.map((pos) => {
                const isSelected = qr.position === pos.id;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => updateQr({ position: pos.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-400/80 bg-amber-500/10 text-zinc-950 dark:text-white shadow-sm ring-1 ring-amber-400/30'
                        : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#1f1f24]'
                    }`}
                  >
                    <div>
                      <p className={`text-xs ${isSelected ? 'font-semibold text-zinc-950 dark:text-white' : 'font-medium'}`}>
                        {pos.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{pos.desc}</p>
                    </div>
                    {isSelected && (
                      <Check weight="bold" className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Opacity & Badge Size Sliders */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <SlidersHorizontal weight="regular" className="w-3.5 h-3.5 text-amber-500" />
              Opacity & Badge Scaling
            </label>
            <div className="space-y-3 bg-white dark:bg-[#18181c] p-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] shadow-sm">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 text-zinc-700 dark:text-zinc-300">
                  <span>Badge Opacity</span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">
                    {Math.round(qr.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={qr.opacity}
                  onChange={(e) => updateQr({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 text-zinc-700 dark:text-zinc-300">
                  <span>QR Code Scale</span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">
                    {qr.size}px
                  </span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="190"
                  step="5"
                  value={qr.size}
                  onChange={(e) => updateQr({ size: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5"
                />
              </div>
            </div>
          </div>

          {/* 5. Optional Micro-Label */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TextT weight="regular" className="w-3.5 h-3.5 text-amber-500" />
              Badge Subtitle / Call-to-Action
            </label>
            <input
              type="text"
              value={qr.label}
              onChange={(e) => updateQr({ label: e.target.value })}
              placeholder="e.g. Scan to listen, Audio Guestbook"
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#dfc596]/40 focus:border-[#dfc596]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
