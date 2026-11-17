import React from 'react';
import { CheckCircle2, AlertCircle, Folder, X, Play, Loader2, Sparkles, Layers } from 'lucide-react';
import { ExportProgress, BatchItem } from '../types/studio';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ExportProgress;
  onCancel: () => void;
  onShowInFolder: (path: string) => void;
  batchQueue: BatchItem[];
  isBatchMode: boolean;
  onStartBatch: () => void;
  onRemoveBatchItem: (id: string) => void;
  onClearBatch: () => void;
  onSelectBatchFolder: () => void;
  batchOutputDir: string | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  progress,
  onCancel,
  onShowInFolder,
  batchQueue,
  isBatchMode,
  onStartBatch,
  onRemoveBatchItem,
  onClearBatch,
  onSelectBatchFolder,
  batchOutputDir,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#181513] border border-[#38302a] rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2b2520]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f5ebd7]">
                {isBatchMode ? 'Batch Audio Export Queue' : 'Exporting 1080p MP4 Video'}
              </h3>
              <p className="text-xs text-[#8c8276]">
                {isBatchMode
                  ? `${batchQueue.length} guest records ready to compile`
                  : 'Compiling audio, background photo & centered visualizer'}
              </p>
            </div>
          </div>
          {progress.status !== 'rendering' && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#8c8276] hover:text-[#ded8cf] hover:bg-[#25201c] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* BATCH MODE VIEW */}
        {isBatchMode ? (
          <div className="space-y-4">
            {/* Output Directory Picker */}
            <div className="p-3 rounded-xl bg-[#12100f] border border-[#26211d] flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-xs text-[#9c9389]">Output Destination:</span>
                <p className="text-xs font-mono text-gold-300 truncate mt-0.5">
                  {batchOutputDir || 'Default: ~/Downloads/Wedding-Guestbook-Videos'}
                </p>
              </div>
              <button
                onClick={onSelectBatchFolder}
                className="px-2.5 py-1.5 rounded-lg bg-[#221e1b] hover:bg-[#2e2824] text-xs text-[#e8e4df] border border-[#3b332d] shrink-0 flex items-center gap-1.5"
              >
                <Folder className="w-3.5 h-3.5 text-gold-400" />
                Change Folder
              </button>
            </div>

            {/* Queue List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {batchQueue.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#12100f] border border-[#26211d] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-[#6b6258] text-right font-mono">#{index + 1}</span>
                    <span className="text-[#e8e4df] truncate font-medium">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'idle' && (
                      <span className="text-[#8c8276] text-[11px]">Ready</span>
                    )}
                    {item.status === 'rendering' && (
                      <span className="text-gold-400 flex items-center gap-1 text-[11px]">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {item.progress || 0}%
                      </span>
                    )}
                    {item.status === 'done' && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Error
                      </span>
                    )}

                    {progress.status !== 'rendering' && (
                      <button
                        onClick={() => onRemoveBatchItem(item.id)}
                        className="text-[#6e645a] hover:text-rose-400 transition-colors p-1"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onClearBatch}
                disabled={progress.status === 'rendering'}
                className="text-xs text-[#8c8276] hover:text-[#ded8cf] transition-colors"
              >
                Clear Queue
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#b5aca1] hover:bg-[#25201c] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={onStartBatch}
                  disabled={batchQueue.length === 0 || progress.status === 'rendering'}
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-xs transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {progress.status === 'rendering' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Rendering Batch...
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      Export All ({batchQueue.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SINGLE EXPORT VIEW */
          <div className="space-y-5">
            {/* Rendering Progress */}
            {progress.status === 'rendering' || progress.status === 'preparing' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#ded8cf]">
                  <span className="flex items-center gap-2 font-medium">
                    <Loader2 className="w-4 h-4 text-gold-400 animate-spin" />
                    {progress.status === 'preparing' ? 'Preparing audio & encoder...' : 'Rendering 1080p frames...'}
                  </span>
                  <span className="font-mono text-gold-300 font-semibold">{progress.percentage}%</span>
                </div>

                {/* Progress bar track */}
                <div className="w-full h-3 bg-[#12100f] rounded-full overflow-hidden border border-[#2b2520] p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(215,186,126,0.5)]"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#786e64]">
                  <span>Frame: {progress.currentFrame || 0} / {progress.totalFrames || 0}</span>
                  <span>Preset: 1080p @ 30 FPS</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={onCancel}
                    className="px-4 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 transition-colors"
                  >
                    Cancel Export
                  </button>
                </div>
              </div>
            ) : null}

            {/* Completion View */}
            {progress.status === 'completed' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-[#f5ebd7]">Video Export Complete!</h4>
                  <p className="text-xs text-[#9c9389] mt-1 max-w-sm mx-auto truncate font-mono">
                    {progress.outputFilePath}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => progress.outputFilePath && onShowInFolder(progress.outputFilePath)}
                    className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Folder className="w-4 h-4" />
                    Show in Finder
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[#25201c] hover:bg-[#302a25] text-[#ded8cf] text-xs font-medium border border-[#3b332d] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Error View */}
            {progress.status === 'error' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#f5ebd7]">Export Failed</h4>
                  <p className="text-xs text-rose-300/80 mt-1 max-w-sm mx-auto">
                    {progress.error || 'An unexpected error occurred while compiling the video.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[#25201c] hover:bg-[#302a25] text-[#ded8cf] text-xs font-medium border border-[#3b332d] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
