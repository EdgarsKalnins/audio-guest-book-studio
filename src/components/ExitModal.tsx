import React, { useEffect } from 'react';
import { SignOut, Warning, MusicNotesSimple, X } from '@phosphor-icons/react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        // Dismiss if clicking backdrop and not actively rendering
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[420px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden animate-scale-up transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isExporting
                  ? 'bg-amber-500/15 border border-amber-500/35 text-amber-500 dark:text-amber-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 shadow-sm'
              }`}
            >
              {isExporting ? (
                <Warning className="w-4 h-4 animate-pulse" weight="fill" />
              ) : (
                <SignOut className="w-4 h-4" weight="regular" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {isExporting ? 'Cancel Export & Exit Studio?' : 'Exit Audio Guest Book Studio?'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isExporting
                  ? 'Active 1080p video compilation in progress'
                  : 'Confirm closing your studio session'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Cancel & Stay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 mb-6">
          {isExporting ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <Warning className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" weight="fill" />
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  A 1080p MP4 video is currently being generated. If you exit now, the encoder will
                  stop immediately and the export will be discarded.
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-1 border-t border-amber-200 dark:border-amber-500/20">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Encoding progress</span>
                  <span className="font-mono text-amber-600 dark:text-amber-300 font-semibold">{exportPercentage}%</span>
                </div>
                <div className="h-1.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-300 dark:border-white/5">
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.max(0, exportPercentage))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : tracksCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/[0.08] space-y-2">
              <div className="flex items-start gap-2.5">
                <MusicNotesSimple className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1 leading-relaxed">
                  <p>
                    You currently have{' '}
                    <span className="text-zinc-900 dark:text-white font-medium">
                      {tracksCount} guest recording{tracksCount > 1 ? 's' : ''}
                    </span>{' '}
                    in your timeline.
                  </p>
                  {audioName && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                      Active: {audioName}
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Exiting will reset this session and clear the continuous audio arrangement.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to close Audio Guest Book Studio? Any temporary changes will be
              closed.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 text-xs font-medium transition-all shadow-sm"
          >
            Stay in Studio
          </button>

          {isExporting ? (
            <button
              onClick={onConfirmExit}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Warning className="w-3.5 h-3.5" weight="bold" />
              Discard & Exit
            </button>
          ) : (
            <button
              onClick={onConfirmExit}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-medium shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <SignOut className="w-3.5 h-3.5" weight="bold" />
              Exit Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
