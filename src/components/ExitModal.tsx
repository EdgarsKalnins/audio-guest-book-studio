import React, { useEffect } from 'react';
import { LogOut, AlertTriangle, Music, X } from 'lucide-react';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  isExporting: boolean;
  exportPercentage?: number;
  tracksCount: number;
  audioName?: string;
}

export const ExitModal: React.FC<ExitModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  isExporting,
  exportPercentage = 0,
  tracksCount,
  audioName,
}) => {
  // Handle Escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        // Dismiss if clicking backdrop and not actively rendering
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[440px] bg-[#181513] border border-[#38302a] rounded-2xl p-6 shadow-2xl overflow-hidden animate-scale-up">
        {/* Subtle Luxury Champagne/Amber Rim Accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
            isExporting ? 'via-amber-500/60' : 'via-gold-500/40'
          } to-transparent`}
        />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#2b2520]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isExporting
                  ? 'bg-amber-500/15 border border-amber-500/35 text-amber-400'
                  : 'bg-gold-500/15 border border-gold-500/35 text-gold-400'
              }`}
            >
              {isExporting ? (
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f5ebd7] tracking-tight">
                {isExporting ? 'Cancel Export & Exit Studio?' : 'Exit Wedding Audio Studio?'}
              </h3>
              <p className="text-xs text-[#8c8276] mt-0.5">
                {isExporting
                  ? 'Active 1080p video compilation in progress'
                  : 'Confirm closing your studio session'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c8276] hover:text-[#ded8cf] hover:bg-[#25201c] transition-colors"
            title="Cancel & Stay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 mb-6">
          {isExporting ? (
            <div className="p-4 rounded-xl bg-[#1d1610] border border-amber-500/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[#dcd1c4] leading-relaxed">
                  A 1080p MP4 video is currently being generated. If you exit now, the encoder will
                  stop immediately and the export will be discarded.
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-1 border-t border-[#34271c]">
                <div className="flex items-center justify-between text-xs text-[#a89f91]">
                  <span>Encoding progress</span>
                  <span className="font-mono text-amber-300 font-semibold">{exportPercentage}%</span>
                </div>
                <div className="h-1.5 bg-[#2a2017] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-gold-400 transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.max(0, exportPercentage))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : tracksCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-[#12100f] border border-[#28221d] space-y-2">
              <div className="flex items-start gap-2.5">
                <Music className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <div className="text-xs text-[#c4bbb0] space-y-1 leading-relaxed">
                  <p>
                    You currently have{' '}
                    <span className="text-[#f5ebd7] font-medium">
                      {tracksCount} guest recording{tracksCount > 1 ? 's' : ''}
                    </span>{' '}
                    in your timeline.
                  </p>
                  {audioName && (
                    <p className="text-[11px] text-[#8c8276] truncate font-mono">
                      Active: {audioName}
                    </p>
                  )}
                  <p className="text-[11px] text-[#8c8276]">
                    Exiting will reset this session and clear the continuous audio arrangement.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#a89f91] leading-relaxed">
              Are you sure you want to close Wedding Audio Studio? Any temporary changes will be
              closed.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#221e1b] hover:bg-[#2c2622] text-[#e8e4df] border border-[#3b332d] text-xs font-medium transition-all"
          >
            Stay in Studio
          </button>

          {isExporting ? (
            <button
              onClick={onConfirmExit}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Discard & Exit
            </button>
          ) : (
            <button
              onClick={onConfirmExit}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black text-xs font-semibold shadow-lg shadow-gold-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-black" />
              Exit Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
