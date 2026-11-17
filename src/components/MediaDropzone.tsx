import React, { useRef, useState } from 'react';
import {
  MusicNotes,
  Image as ImageIcon,
  UploadSimple,
  CloudArrowUp,
  Plus,
  Trash,
  Queue,
  CaretDown,
} from '@phosphor-icons/react';
import { StudioConfig } from '../types/studio';

interface MediaDropzoneProps {
  config: StudioConfig;
  updateConfig?: (updater: (prev: StudioConfig) => StudioConfig) => void;
  onPickAudio: () => void;
  onPickImage: () => void;
  onLoadDemo?: () => void;
  onAudioFileSelected: (files: FileList) => void;
  onImageFileSelected: (file: File) => void;
  onRemoveTrack?: (id: string) => void;
  onSeekTrack?: (startTime: number) => void;
  isAudioExpanded?: boolean;
  onToggleAudioExpanded?: () => void;
  isBgExpanded?: boolean;
  onToggleBgExpanded?: () => void;
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
  isAudioExpanded,
  onToggleAudioExpanded,
  isBgExpanded,
  onToggleBgExpanded,
}) => {
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [localAudioExpanded, setLocalAudioExpanded] = useState(true);
  const [localBgExpanded, setLocalBgExpanded] = useState(true);

  const audioExpanded = isAudioExpanded !== undefined ? isAudioExpanded : localAudioExpanded;
  const toggleAudio = onToggleAudioExpanded || (() => setLocalAudioExpanded((prev) => !prev));

  const bgExpanded = isBgExpanded !== undefined ? isBgExpanded : localBgExpanded;
  const toggleBg = onToggleBgExpanded || (() => setLocalBgExpanded((prev) => !prev));

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
    <div className="space-y-3">
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
        accept="image/*,video/*,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onImageFileSelected(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Group 1: Audio Timeline Sequence */}
      <div className="p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2 transition-all">
        <div
          onClick={toggleAudio}
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
            <Queue weight="regular" className="w-3.5 h-3.5 text-amber-500" />
            1. Audio Timeline
          </label>
          <div className="flex items-center gap-1.5">
            {tracks.length > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono border border-zinc-200/60 dark:border-white/[0.06]">
                {tracks.length} {tracks.length === 1 ? 'file' : 'files'} • {formatSec(config.audioDuration)}
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-mono border border-zinc-200/60 dark:border-white/[0.06]">
                Empty
              </span>
            )}
            <button
              type="button"
              className="p-0.5 rounded text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors"
              title={audioExpanded ? 'Compact block 1' : 'Unpack block 1'}
              aria-label={audioExpanded ? 'Compact block 1' : 'Unpack block 1'}
            >
              <CaretDown
                weight="bold"
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  audioExpanded ? '' : '-rotate-90'
                }`}
              />
            </button>
          </div>
        </div>

        {audioExpanded && (
          <div className="space-y-2 pt-0.5">
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
              className={`relative border border-dashed rounded-lg p-2.5 cursor-pointer transition-all flex items-center gap-2.5 ${
                isAudioDragOver
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                  : config.audioPath
                  ? 'border-zinc-300 dark:border-white/20 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-white/30'
                  : 'border-zinc-200 dark:border-white/10 bg-zinc-50/30 dark:bg-zinc-900/20 hover:border-zinc-300 dark:hover:border-white/20'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 text-zinc-700 dark:text-zinc-300 shadow-xs">
                {isAudioDragOver ? (
                  <CloudArrowUp weight="regular" className="w-4 h-4 text-amber-500 animate-bounce" />
                ) : (
                  <MusicNotes weight="regular" className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {config.audioName ? (
                  <>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {tracks.length > 1
                        ? `${tracks.length} Voicemails on Timeline`
                        : config.audioName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      Click or drop files to append to sequence
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Import audio recording(s)</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                      WAV, MP3, M4A, AAC, FLAC (auto-sequenced)
                    </p>
                  </>
                )}
              </div>
              <UploadSimple weight="regular" className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            </div>

            {/* Timeline Sequence Track List */}
            {tracks.length > 1 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto custom-scrollbar p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.06]">
                {tracks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white dark:bg-[#18181c] border border-zinc-200/60 dark:border-white/[0.06] text-xs hover:border-zinc-300 dark:hover:border-white/20 transition-all group shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => onSeekTrack && onSeekTrack(t.startTime)}
                      className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
                      title="Click to jump to this recording"
                    >
                      <span className="w-3.5 text-zinc-400 dark:text-zinc-500 font-mono text-[10px] shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="truncate text-zinc-800 dark:text-zinc-200 text-xs font-medium group-hover:text-amber-500 transition-colors">
                        {t.name}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
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
                          <Trash weight="regular" className="w-3 h-3" />
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
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 flex items-center gap-1 transition-all shadow-xs font-medium"
                  >
                    <Plus weight="bold" className="w-2.5 h-2.5" />
                    Add more files
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group 2: Background Canvas & Photo */}
      <div className="p-3 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2 transition-all">
        <div
          onClick={toggleBg}
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
            <ImageIcon weight="regular" className="w-3.5 h-3.5 text-amber-500" />
            2. Canvas Background
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium border border-zinc-200/60 dark:border-white/[0.06] capitalize">
              {config.backgroundMode === 'transparent'
                ? 'Alpha'
                : config.backgroundMode === 'solid'
                ? 'Solid'
                : (config.imagePath ? 'Photo' : 'Default')}
            </span>
            <button
              type="button"
              className="p-0.5 rounded text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors"
              title={bgExpanded ? 'Compact block 2' : 'Unpack block 2'}
              aria-label={bgExpanded ? 'Compact block 2' : 'Unpack block 2'}
            >
              <CaretDown
                weight="bold"
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  bgExpanded ? '' : '-rotate-90'
                }`}
              />
            </button>
          </div>
        </div>

        {bgExpanded && (
          <div className="space-y-2 pt-0.5">
            {/* Background Style Mode Chips (Photo, Solid, Transparent) */}
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => updateConfig?.((prev) => ({ ...prev, backgroundMode: 'photo' }))}
                className={`py-1 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  (config.backgroundMode ?? 'photo') === 'photo'
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#1f1f24]'
                }`}
              >
                Photo
              </button>
              <button
                type="button"
                onClick={() => updateConfig?.((prev) => ({ ...prev, backgroundMode: 'solid' }))}
                className={`py-1 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  config.backgroundMode === 'solid'
                    ? 'border-zinc-400 dark:border-white/30 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#1f1f24]'
                }`}
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() => updateConfig?.((prev) => ({ ...prev, backgroundMode: 'transparent' }))}
                className={`py-1 px-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1.5 ${
                  config.backgroundMode === 'transparent'
                    ? 'border-amber-400/80 dark:border-amber-400/60 bg-amber-500/10 text-zinc-950 dark:text-white shadow-xs font-semibold ring-1 ring-amber-400/30'
                    : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#1f1f24]'
                }`}
              >
                <span className="w-2 h-2 rounded-full border border-black/20 dark:border-white/20 bg-[linear-gradient(45deg,#888_25%,transparent_25%),linear-gradient(-45deg,#888_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#888_75%),linear-gradient(-45deg,transparent_75%,#888_75%)] bg-[size:4px_4px]" />
                Alpha
              </button>
            </div>

            {config.backgroundMode === 'transparent' ? (
              <div className="p-2.5 rounded-lg border border-amber-400/30 dark:border-amber-400/20 bg-amber-500/5 dark:bg-amber-400/5 text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">
                  Transparent Alpha Active
                </span>
                Renders with transparent background. Overlay directly onto 4K wedding films in Premiere Pro or DaVinci Resolve.
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
                className={`relative border border-dashed rounded-lg p-2.5 cursor-pointer transition-all flex items-center gap-2.5 ${
                  isImageDragOver
                    ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                    : config.imagePath
                    ? 'border-zinc-300 dark:border-white/20 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-white/30'
                    : 'border-zinc-200 dark:border-white/10 bg-zinc-50/30 dark:bg-zinc-900/20 hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden text-zinc-700 dark:text-zinc-300 shadow-xs">
                  {isImageDragOver ? (
                    <CloudArrowUp weight="regular" className="w-4 h-4 text-amber-500 animate-bounce" />
                  ) : config.imagePath ? (
                    <img
                      src={getDisplayThumbnail()}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon weight="regular" className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {config.imagePath ? (
                    <>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">Custom Photo Loaded</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Click or drag image to replace</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Import wedding photo</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">JPG, PNG, WEBP (auto-scales)</p>
                    </>
                  )}
                </div>
                <UploadSimple weight="regular" className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
