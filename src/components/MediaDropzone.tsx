import React, { useRef, useState } from 'react';
import { Music, Image as ImageIcon, Sparkles, FolderUp, RefreshCw, UploadCloud } from 'lucide-react';
import { StudioConfig } from '../types/studio';

interface MediaDropzoneProps {
  config: StudioConfig;
  onPickAudio: () => void;
  onPickImage: () => void;
  onLoadDemo: () => void;
  onAudioFileSelected: (files: FileList) => void;
  onImageFileSelected: (file: File) => void;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  config,
  onPickAudio,
  onPickImage,
  onLoadDemo,
  onAudioFileSelected,
  onImageFileSelected,
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

  return (
    <div className="space-y-4">
      {/* Hidden fallback file inputs */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac"
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

      {/* Audio Dropzone */}
      <div>
        <label className="block text-xs font-semibold text-[#a89f94] uppercase tracking-wider mb-2">
          1. Guest Audio Recording
        </label>
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
                <p className="text-sm font-medium text-[#f0ebe3] truncate">{config.audioName}</p>
                <p className="text-xs text-gold-400 mt-0.5">Click or drop to replace audio file</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[#e0dad2]">Choose or drop audio file(s)</p>
                <p className="text-xs text-[#8c8276] mt-0.5">WAV, MP3, M4A, AAC, OGG (Single or Batch)</p>
              </>
            )}
          </div>
          <FolderUp className="w-5 h-5 text-[#8c8276]" />
        </div>
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
