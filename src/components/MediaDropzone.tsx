import React, { useRef, useState } from 'react';
import {
  MusicNotes,
  Image as ImageIcon,
  Sparkle,
  UploadSimple,
  ArrowsClockwise,
  CloudArrowUp,
  Plus,
  Trash,
  Queue,
} from '@phosphor-icons/react';
import { StudioConfig } from '../types/studio';

interface MediaDropzoneProps {
  config: StudioConfig;
  updateConfig?: (updater: (prev: StudioConfig) => StudioConfig) => void;
  onPickAudio: () => void;
  onPickImage: () => void;
  onLoadDemo: () => void;
  onAudioFileSelected: (files: FileList) => void;
  onImageFileSelected: (file: File) => void;
  onRemoveTrack?: (id: string) => void;
  onSeekTrack?: (startTime: number) => void;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  config,
  updateConfig,
  onPickAudio,
  onPickImage,
  onLoadDemo,
  onAudioFileSelected,
  onImageFileSelected,
  onRemoveTrack,
  onSeekTrack,
}) => {
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [isAudioDragOver, setIsAudioDragOver] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAudioDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAudioFileSelected(e.dataTransfer.files);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageFileSelected(e.dataTransfer.files[0]);
    }
  };

  const triggerAudioPicker = () => {
    if (window.electronAPI && typeof window.electronAPI.openAudioFiles === 'function') {
      onPickAudio();
    } else if (audioInputRef.current) {
      audioInputRef.current.click();
    }
  };

  const triggerImagePicker = () => {
    if (window.electronAPI && typeof window.electronAPI.openImageFile === 'function') {
      onPickImage();
    } else if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const getDisplayThumbnail = () => {
    if (!config.imagePath) return '';
    if (window.electronAPI) {
      return window.electronAPI.getMediaUrl(config.imagePath);
    }
    return config.imagePath;
  };

  const formatSec = (s: number) => {
    if (isNaN(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const tracks = config.timelineTracks || [];

  return (
    <div className="space-y-4">
      {/* Hidden fallback file inputs */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac,.aiff,.aif,.wma,.opus,.webm"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAudioFileSelected(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onImageFileSelected(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Pro Studio Demo Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkle weight="light" className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-300">Quick Start Demo</span>
        </div>
        <button
          onClick={onLoadDemo}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition-all font-medium flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <ArrowsClockwise weight="light" className="w-3.5 h-3.5" />
          Load Sample Guestbook
        </button>
      </div>

      {/* Audio Sequence Dropzone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Queue weight="light" className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            1. Audio Timeline Sequence
          </label>
          {tracks.length > 0 && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              {tracks.length} {tracks.length === 1 ? 'recording' : 'recordings'} • {formatSec(config.audioDuration)}
            </span>
          )}
        </div>

        <div
          onClick={triggerAudioPicker}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsAudioDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsAudioDragOver(false);
          }}
          onDrop={handleAudioDrop}
          className={`relative border-2 border-dashed rounded-xl p-3.5 cursor-pointer transition-all flex items-center gap-3.5 ${
            isAudioDragOver
              ? 'border-zinc-500 dark:border-white/50 bg-zinc-100 dark:bg-[#1f1f24] ring-2 ring-black/5 dark:ring-white/10 scale-[1.005]'
              : config.audioPath
              ? 'border-zinc-300 dark:border-white/20 bg-white dark:bg-[#18181c] hover:border-zinc-400 dark:hover:border-white/30 shadow-sm'
              : 'border-zinc-200 dark:border-white/[0.12] bg-zinc-50 dark:bg-[#141417] hover:border-zinc-300 dark:hover:border-white/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 text-zinc-700 dark:text-zinc-300 shadow-sm">
            {isAudioDragOver ? (
              <CloudArrowUp weight="light" className="w-5 h-5 animate-bounce" />
            ) : (
              <MusicNotes weight="light" className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {config.audioName ? (
              <>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {tracks.length > 1
                    ? `${tracks.length} Recordings Sequenced on Timeline`
                    : config.audioName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Click or drag files to append to sequence
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Import audio recording(s)</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  WAV, MP3, M4A, etc. (auto-concatenates into continuous video)
                </p>
              </>
            )}
          </div>
          <UploadSimple weight="light" className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
        </div>

        {/* Timeline Sequence Track List */}
        {tracks.length > 1 && (
          <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar p-2 rounded-xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-white/[0.06]">
            {tracks.map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.06] text-xs hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-[#1e1e23] transition-all group shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onSeekTrack && onSeekTrack(t.startTime)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  title="Click to jump to this recording"
                >
                  <span className="w-4 text-zinc-400 dark:text-zinc-500 font-mono text-[11px] shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="truncate text-zinc-800 dark:text-zinc-200 font-medium group-hover:text-zinc-950 dark:group-hover:text-white">
                    {t.name}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {formatSec(t.duration)}
                  </span>
                  {onRemoveTrack && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(t.id);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-rose-500 transition-colors"
                      title="Remove from sequence"
                    >
                      <Trash weight="light" className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Add More button */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={triggerAudioPicker}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 flex items-center gap-1 transition-all shadow-sm font-medium"
              >
                <Plus weight="bold" className="w-3 h-3" />
                Add more files to sequence
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Background Image / Canvas Mode Dropzone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            2. Background Canvas & Photo
          </label>
        </div>

        {/* Background Style Mode Chips (Photo, Solid, Transparent) */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          <button
            type="button"
            onClick={() => updateConfig?.((prev) => ({ ...prev, backgroundMode: 'photo' }))}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
              (config.backgroundMode ?? 'photo') === 'photo'
                ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-semibold'
                : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#1f1f24]'
            }`}
          >
            Photo
          </button>
          <button
            type="button"
            onClick={() => updateConfig?.((prev) => ({ ...prev, backgroundMode: 'solid' }))}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
              config.backgroundMode === 'solid'
                ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-semibold'
                : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#1f1f24]'
            }`}
          >
            Solid
          </button>
          <button
            type="button"
            onClick={() => updateConfig?.((prev) => ({ ...prev, backgroundMode: 'transparent' }))}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1.5 ${
              config.backgroundMode === 'transparent'
                ? 'border-amber-400/80 dark:border-amber-400/60 bg-amber-500/10 text-zinc-950 dark:text-white shadow-sm font-semibold ring-1 ring-amber-400/30'
                : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#1f1f24]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20 bg-[linear-gradient(45deg,#888_25%,transparent_25%),linear-gradient(-45deg,#888_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#888_75%),linear-gradient(-45deg,transparent_75%,#888_75%)] bg-[size:4px_4px]" />
            Transparent
          </button>
        </div>

        {config.backgroundMode === 'transparent' ? (
          <div className="p-3.5 rounded-xl border border-amber-400/30 dark:border-amber-400/20 bg-amber-500/5 dark:bg-amber-400/5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed shadow-sm">
            <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">
              Genuine Alpha Channel Active
            </span>
            Canvas renders with complete transparency. Perfect for dragging directly onto wedding videos in Premiere Pro, DaVinci Resolve, and Final Cut Pro.
          </div>
        ) : (
          <div
            onClick={triggerImagePicker}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsImageDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsImageDragOver(false);
            }}
            onDrop={handleImageDrop}
            className={`relative border-2 border-dashed rounded-xl p-3.5 cursor-pointer transition-all flex items-center gap-3.5 ${
              isImageDragOver
                ? 'border-zinc-500 dark:border-white/50 bg-zinc-100 dark:bg-[#1f1f24] ring-2 ring-black/5 dark:ring-white/10 scale-[1.005]'
                : config.imagePath
                ? 'border-zinc-300 dark:border-white/20 bg-white dark:bg-[#18181c] hover:border-zinc-400 dark:hover:border-white/30 shadow-sm'
                : 'border-zinc-200 dark:border-white/[0.12] bg-zinc-50 dark:bg-[#141417] hover:border-zinc-300 dark:hover:border-white/20'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden text-zinc-700 dark:text-zinc-300 shadow-sm">
              {isImageDragOver ? (
                <CloudArrowUp weight="light" className="w-5 h-5 animate-bounce" />
              ) : config.imagePath ? (
                <img
                  src={getDisplayThumbnail()}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon weight="light" className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {config.imagePath ? (
                <>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">Custom Background Photo</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Click or drag image to change</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Import wedding photo</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">JPG, PNG, WEBP (auto-scales to frame)</p>
                </>
              )}
            </div>
            <UploadSimple weight="light" className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
};
