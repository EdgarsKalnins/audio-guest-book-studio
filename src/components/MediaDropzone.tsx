import React, { useRef, useState } from 'react';
import { Music, Image as ImageIcon, Sparkles, FolderUp, RefreshCw, UploadCloud, Plus, Trash2, ListMusic } from 'lucide-react';
import { StudioConfig } from '../types/studio';

interface MediaDropzoneProps {
  config: StudioConfig;
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
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181c] border border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">Quick Start Demo</span>
        </div>
        <button
          onClick={onLoadDemo}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition-all font-medium flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <RefreshCw className="w-3 h-3" />
          Load Sample Guestbook
        </button>
      </div>

      {/* Audio Sequence Dropzone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <ListMusic className="w-3.5 h-3.5 text-zinc-400" />
            1. Audio Timeline Sequence
          </label>
          {tracks.length > 0 && (
            <span className="text-[11px] text-zinc-400 font-mono">
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
              ? 'border-white/50 bg-[#1f1f24] ring-2 ring-white/10 scale-[1.005]'
              : config.audioPath
              ? 'border-white/20 bg-[#18181c] hover:border-white/30'
              : 'border-white/[0.12] bg-[#141417] hover:border-white/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-zinc-300 shadow-sm">
            {isAudioDragOver ? (
              <UploadCloud className="w-5 h-5 animate-bounce" />
            ) : (
              <Music className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {config.audioName ? (
              <>
                <p className="text-sm font-medium text-zinc-100 truncate">
                  {tracks.length > 1
                    ? `${tracks.length} Recordings Sequenced on Timeline`
                    : config.audioName}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Click or drag files to append to sequence
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-200">Import audio recording(s)</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  WAV, MP3, M4A, etc. (auto-concatenates into continuous video)
                </p>
              </>
            )}
          </div>
          <FolderUp className="w-4 h-4 text-zinc-400 shrink-0" />
        </div>

        {/* Timeline Sequence Track List */}
        {tracks.length > 1 && (
          <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar p-2 rounded-xl bg-[#141417] border border-white/[0.06]">
            {tracks.map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#18181c] border border-white/[0.06] text-xs hover:border-white/20 hover:bg-[#1e1e23] transition-all group"
              >
                <button
                  type="button"
                  onClick={() => onSeekTrack && onSeekTrack(t.startTime)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  title="Click to jump to this recording"
                >
                  <span className="w-4 text-zinc-500 font-mono text-[11px] shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="truncate text-zinc-200 font-medium group-hover:text-white">
                    {t.name}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {formatSec(t.duration)}
                  </span>
                  {onRemoveTrack && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(t.id);
                      }}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                      title="Remove from sequence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 flex items-center gap-1 transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                Add more files to sequence
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Background Image Dropzone */}
      <div>
        <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
          2. Background Wedding Photo
        </label>
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
              ? 'border-white/50 bg-[#1f1f24] ring-2 ring-white/10 scale-[1.005]'
              : config.imagePath
              ? 'border-white/20 bg-[#18181c] hover:border-white/30'
              : 'border-white/[0.12] bg-[#141417] hover:border-white/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden text-zinc-300 shadow-sm">
            {isImageDragOver ? (
              <UploadCloud className="w-5 h-5 animate-bounce" />
            ) : config.imagePath ? (
              <img
                src={getDisplayThumbnail()}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {config.imagePath ? (
              <>
                <p className="text-sm font-medium text-zinc-100 truncate">Custom Background Photo</p>
                <p className="text-xs text-zinc-400 mt-0.5">Click or drag image to change</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-200">Import wedding photo</p>
                <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG, WEBP (auto-scales to frame)</p>
              </>
            )}
          </div>
          <FolderUp className="w-4 h-4 text-zinc-400 shrink-0" />
        </div>
      </div>
    </div>
  );
};
