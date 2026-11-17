import React from 'react';
import { Music, Image as ImageIcon, Sparkles, FolderUp, RefreshCw } from 'lucide-react';
import { StudioConfig } from '../types/studio';

interface MediaDropzoneProps {
  config: StudioConfig;
  onPickAudio: () => void;
  onPickImage: () => void;
  onLoadDemo: () => void;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  config,
  onPickAudio,
  onPickImage,
  onLoadDemo,
}) => {
  return (
    <div className="space-y-4">
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
          onClick={onPickAudio}
          className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4 ${
            config.audioPath
              ? 'border-gold-500/40 bg-[#1a1715] hover:border-gold-500/60'
              : 'border-[#332b25] bg-[#141211] hover:border-[#4d4239]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/25 flex items-center justify-center shrink-0">
            <Music className="w-6 h-6 text-gold-400" />
          </div>
          <div className="flex-1 min-w-0">
            {config.audioName ? (
              <>
                <p className="text-sm font-medium text-[#f0ebe3] truncate">{config.audioName}</p>
                <p className="text-xs text-gold-400 mt-0.5">Click to replace audio file</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[#e0dad2]">Choose or drop audio file</p>
                <p className="text-xs text-[#8c8276] mt-0.5">Supports WAV, MP3, M4A, AAC, OGG</p>
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
          onClick={onPickImage}
          className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4 ${
            config.imagePath
              ? 'border-gold-500/40 bg-[#1a1715] hover:border-gold-500/60'
              : 'border-[#332b25] bg-[#141211] hover:border-[#4d4239]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/25 flex items-center justify-center shrink-0 overflow-hidden">
            {config.imagePath ? (
              <img
                src={config.imagePath}
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
                <p className="text-xs text-gold-400 mt-0.5">Click to change background image</p>
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
