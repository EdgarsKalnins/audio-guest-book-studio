import React from 'react';
import { CheckCircle2, AlertCircle, Folder, Download, X, Loader2, Sparkles, Layers } from 'lucide-react';
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

  const isMac = window.electronAPI?.platform === 'darwin';
  const isWindows = window.electronAPI?.platform === 'win32';
  const showFolderText = isMac ? 'Show in Finder' : isWindows ? 'Show in Explorer' : 'Show in Folder';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#18181c] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                {isBatchMode ? 'Batch Audio Export Queue' : 'Exporting 1080p MP4 Video'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isBatchMode
                  ? `${batchQueue.length} guest records ready to compile`
                  : 'Compiling audio, background photo & centered visualizer'}
              </p>
            </div>
          </div>
          {progress.status !== 'rendering' && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* BATCH MODE VIEW */}
        {isBatchMode ? (
          <div className="space-y-4">
            {/* Output Directory Picker */}
            <div className="p-3 rounded-xl bg-[#141417] border border-white/[0.08] flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-xs text-zinc-400">Output Destination:</span>
                <p className="text-xs font-mono text-zinc-200 truncate mt-0.5">
                  {batchOutputDir || 'Default: ~/Downloads/Wedding-Guestbook-Videos'}
                </p>
              </div>
              <button
                onClick={onSelectBatchFolder}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-white/10 shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Folder className="w-3.5 h-3.5 text-zinc-400" />
                Change Folder
              </button>
            </div>

            {/* Queue List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {batchQueue.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141417] border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-zinc-500 text-right font-mono">#{index + 1}</span>
                    <span className="text-zinc-200 truncate font-medium">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'idle' && (
                      <span className="text-zinc-500 text-[11px] font-mono">Ready</span>
                    )}
                    {item.status === 'rendering' && (
                      <span className="text-zinc-300 flex items-center gap-1 text-[11px] font-mono">
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
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
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
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Clear Queue
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={onStartBatch}
                  disabled={batchQueue.length === 0 || progress.status === 'rendering'}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all shadow-md disabled:opacity-40 flex items-center gap-1.5"
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
                <div className="flex items-center justify-between text-xs text-zinc-200">
                  <span className="flex items-center gap-2 font-medium">
                    <Loader2 className="w-4 h-4 text-zinc-300 animate-spin" />
                    {progress.status === 'preparing' ? 'Preparing audio & encoder...' : 'Rendering 1080p frames...'}
                  </span>
                  <span className="font-mono text-zinc-100 font-semibold">{progress.percentage}%</span>
                </div>

                {/* Progress bar track */}
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#cba86e] to-[#dfc596] rounded-full transition-all duration-150"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Frame: {progress.currentFrame || 0} / {progress.totalFrames || 0}</span>
                  <span>Preset: 1080p @ 30 FPS</span>
                </div>

                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141417] border border-white/[0.08] text-[11px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Preview suspended to allocate 100% GPU power to video compilation</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={onCancel}
                    className="px-3.5 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-950/30 border border-rose-500/25 transition-colors"
                  >
                    Cancel Export
                  </button>
                </div>
              </div>
            ) : null}

            {/* Completion View */}
            {progress.status === 'completed' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-zinc-100">Video Export Complete!</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto truncate font-mono">
                    {progress.outputFilePath?.startsWith('blob:')
                      ? `${progress.currentItemName || 'wedding_audio_video'}.mp4`
                      : progress.outputFilePath}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => progress.outputFilePath && onShowInFolder(progress.outputFilePath)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    {window.electronAPI ? (
                      <>
                        <Folder className="w-4 h-4" />
                        {showFolderText}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Video
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/10 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Error View */}
            {progress.status === 'error' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-zinc-100">Export Failed</h4>
                  <p className="text-xs text-rose-300/80 mt-1 max-w-sm mx-auto">
                    {progress.error || 'An unexpected error occurred while compiling the video.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/10 transition-colors"
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
