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

      {/* Demo Loader Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gold-500/10 via-[#1f1b18] to-gold-500/10 border border-gold-500/25">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span className="text-xs font-medium text-gold-200">First time here?</span>
        </div>
        <button
          onClick={onLoadDemo}
          className="text-xs px-2.5 py-1 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/35 transition-colors font-medium flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          Try Sample Wedding Demo
        </button>
      </div>

      {/* Audio Sequence Dropzone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[#a89f94] uppercase tracking-wider flex items-center gap-1.5">
            <ListMusic className="w-3.5 h-3.5 text-gold-400" />
            1. Audio Timeline Sequence
          </label>
          {tracks.length > 0 && (
            <span className="text-[11px] text-gold-300 font-medium">
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
          className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4 ${
            isAudioDragOver
              ? 'border-gold-400 bg-[#251e18] ring-2 ring-gold-400/30 scale-[1.01]'
              : config.audioPath
              ? 'border-gold-500/40 bg-[#1a1715] hover:border-gold-500/60'
              : 'border-[#332b25] bg-[#141211] hover:border-[#4d4239]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/25 flex items-center justify-center shrink-0">
            {isAudioDragOver ? (
              <UploadCloud className="w-6 h-6 text-gold-400 animate-bounce" />
            ) : (
              <Music className="w-6 h-6 text-gold-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {config.audioName ? (
              <>
                <p className="text-sm font-medium text-[#f0ebe3] truncate">
                  {tracks.length > 1
                    ? `${tracks.length} Recordings Sequenced on Timeline`
                    : config.audioName}
                </p>
                <p className="text-xs text-gold-400 mt-0.5">
                  Click or drop to add more WAV, MP3, M4A recordings
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[#e0dad2]">Choose or drop audio recording(s)</p>
                <p className="text-xs text-[#8c8276] mt-0.5">
                  Takes WAV, MP3, M4A, etc. (auto-adds into one timeline sequence)
                </p>
              </>
            )}
          </div>
          <FolderUp className="w-5 h-5 text-[#8c8276]" />
        </div>

        {/* Timeline Sequence Track List */}
        {tracks.length > 1 && (
          <div className="mt-2.5 space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar p-2 rounded-xl bg-[#12100f] border border-[#26211d]">
            {tracks.map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#181513] border border-[#2b2520] text-xs hover:border-gold-500/30 transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => onSeekTrack && onSeekTrack(t.startTime)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  title="Click to jump to this recording"
                >
                  <span className="w-4 text-[#756c62] font-mono text-[11px] shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="truncate text-[#e8e4df] font-medium group-hover:text-gold-200">
                    {t.name}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[11px] text-[#8e857c] font-mono">
                    {formatSec(t.duration)}
                  </span>
                  {onRemoveTrack && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(t.id);
                      }}
                      className="p-1 rounded text-[#6a6055] hover:text-rose-400 transition-colors"
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
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1e1a17] hover:bg-[#28221e] text-gold-300 border border-[#3b332d] flex items-center gap-1 transition-colors"
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
        <label className="block text-xs font-semibold text-[#a89f94] uppercase tracking-wider mb-2">
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
          className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4 ${
            isImageDragOver
              ? 'border-gold-400 bg-[#251e18] ring-2 ring-gold-400/30 scale-[1.01]'
              : config.imagePath
              ? 'border-gold-500/40 bg-[#1a1715] hover:border-gold-500/60'
              : 'border-[#332b25] bg-[#141211] hover:border-[#4d4239]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/25 flex items-center justify-center shrink-0 overflow-hidden">
            {isImageDragOver ? (
              <UploadCloud className="w-6 h-6 text-gold-400 animate-bounce" />
            ) : config.imagePath ? (
              <img
                src={getDisplayThumbnail()}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gold-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {config.imagePath ? (
              <>
                <p className="text-sm font-medium text-[#f0ebe3] truncate">Custom Background Photo</p>
                <p className="text-xs text-gold-400 mt-0.5">Click or drop to change image</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[#e0dad2]">Choose or drop wedding photo</p>
                <p className="text-xs text-[#8c8276] mt-0.5">JPG, PNG, WEBP (auto-matches ratio)</p>
              </>
            )}
          </div>
          <FolderUp className="w-5 h-5 text-[#8c8276]" />
        </div>
      </div>
    </div>
  );
};
