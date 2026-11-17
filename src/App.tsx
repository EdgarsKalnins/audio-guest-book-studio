import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Layers,
  Download,
  FolderOpen,
  Volume2,
  Type,
  Activity,
  FolderArchive,
} from 'lucide-react';
import {
  StudioConfig,
  ExportProgress,
  BatchItem,
  ASPECT_RATIOS,
  AspectRatioPreset,
} from './types/studio';
import { AudioEngine } from './engine/audioEngine';
import { runExportPipeline } from './engine/frameGenerator';
import { CanvasStage } from './components/CanvasStage';
import { MediaDropzone } from './components/MediaDropzone';
import { VisualizerPanel } from './components/VisualizerPanel';
import { TypographyPanel } from './components/TypographyPanel';
import { AudioToolsPanel } from './components/AudioToolsPanel';
import { ExportModal } from './components/ExportModal';

import demoAudioUrl from './assets/demo-audio.mp3';
import demoPhotoUrl from './assets/demo-photo.jpg';

export const App: React.FC = () => {
  const [config, setConfig] = useState<StudioConfig>({
    aspectRatio: '9:16',
    visualizerStyle: 'bars',
    visualizerColor: '#d7ba7e',
    visualizerScale: 1.0,
    visualizerOpacity: 0.95,
    visualizerGlow: true,
    typography: {
      enabled: true,
      coupleNames: 'Sarah & Michael',
      dateText: 'October 14, 2024',
      titleText: 'Wedding Audio Guestbook',
      fontFamily: 'Cormorant Garamond',
      showTimer: true,
      fontSize: 1.0,
    },
    audioSettings: {
      trimStart: 0,
      trimEnd: 0,
      voiceBoost: true,
    },
    audioPath: null,
    audioName: null,
    audioDuration: 0,
    imagePath: null,
    batchQueue: [],
  });

  const [activeTab, setActiveTab] = useState<'visualizer' | 'typography' | 'audio'>('visualizer');
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchOutputDir, setBatchOutputDir] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: 'idle',
    percentage: 0,
  });

  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const isCancelledRef = useRef<boolean>(false);

  // 1. Initial Load: Auto-load bundled demo wedding assets for immediate testing
  useEffect(() => {
    loadDemoAssets();
    return () => {
      audioEngineRef.current.destroy();
    };
  }, []);

  const loadDemoAssets = async () => {
    try {
      let resolvedPhotoUrl = demoPhotoUrl;
      let resolvedAudioUrl = demoAudioUrl;
      let resolvedAudioDiskPath = demoAudioUrl;

      if (window.electronAPI) {
        try {
          const demoInfo = await window.electronAPI.getDemoAssets();
          if (demoInfo) {
            resolvedPhotoUrl = demoInfo.photoUrl;
            resolvedAudioUrl = demoInfo.audioUrl;
            resolvedAudioDiskPath = demoInfo.audioPath;
          }
        } catch (e) {
          console.warn('[Demo] getDemoAssets fallback:', e);
        }
      }

      // Load demo background photo
      const img = new Image();
      img.src = resolvedPhotoUrl;
      img.onload = () => {
        setBgImage(img);
        setConfig((prev) => ({ ...prev, imagePath: resolvedPhotoUrl }));
      };

      // Load demo audio voicemail
      const response = await fetch(resolvedAudioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await audioEngineRef.current.loadAudioFromBuffer(arrayBuffer);

      setConfig((prev) => ({
        ...prev,
        audioPath: resolvedAudioDiskPath,
        audioName: 'Sarah & Michael - Wedding Message #1.mp3',
        audioDuration: decoded.duration,
        audioSettings: {
          ...prev.audioSettings,
          trimStart: 0,
          trimEnd: decoded.duration,
        },
      }));
    } catch (err) {
      console.warn('Could not auto-load demo assets:', err);
    }
  };

  // Helper to load audio from a local file path or File object
  const loadAudioSource = async (filePath: string, fileName: string) => {
    try {
      let arrayBuffer: ArrayBuffer;
      if (window.electronAPI) {
        arrayBuffer = await window.electronAPI.readFile(filePath);
      } else {
        const res = await fetch(filePath);
        arrayBuffer = await res.arrayBuffer();
      }

      const decoded = await audioEngineRef.current.loadAudioFromBuffer(arrayBuffer);

      setConfig((prev) => ({
        ...prev,
        audioPath: filePath,
        audioName: fileName,
        audioDuration: decoded.duration,
        audioSettings: {
          ...prev.audioSettings,
          trimStart: 0,
          trimEnd: decoded.duration,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not load audio file: ${msg}`);
    }
  };

  // Helper to load background photo
  const loadImageSource = (imageDiskOrUrl: string) => {
    const streamUrl = window.electronAPI
      ? window.electronAPI.getMediaUrl(imageDiskOrUrl)
      : imageDiskOrUrl;

    const img = new Image();
    img.src = streamUrl;
    img.onload = () => {
      setBgImage(img);
      // Auto-detect aspect ratio based on image dimensions
      const ratio = img.naturalWidth / img.naturalHeight;
      let detectedAspect: AspectRatioPreset = '9:16';
      if (ratio > 1.3) {
        detectedAspect = '16:9';
      } else if (ratio >= 0.85 && ratio <= 1.25) {
        detectedAspect = '1:1';
      } else {
        detectedAspect = '9:16';
      }

      setConfig((prev) => ({
        ...prev,
        imagePath: imageDiskOrUrl,
        aspectRatio: detectedAspect,
      }));
    };
  };

  // Handle Drag & Drop of one or multiple files
  const handleFileDrop = (files: FileList) => {
    const audioFiles: File[] = [];
    let imageFile: File | null = null;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.toLowerCase().split('.').pop();
      if (['wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac'].includes(ext || '')) {
        audioFiles.push(f);
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        imageFile = f;
      }
    }

    // If an image was dropped
    if (imageFile) {
      let imgPath = '';
      if (window.electronAPI) {
        imgPath = window.electronAPI.getPathForFile(imageFile);
      }
      if (!imgPath) {
        const anyFile = imageFile as unknown as { path?: string };
        imgPath = anyFile.path || URL.createObjectURL(imageFile);
      }
      loadImageSource(imgPath);
    }

    // If audio file(s) were dropped
    if (audioFiles.length === 1) {
      const single = audioFiles[0];
      let p = '';
      if (window.electronAPI) {
        p = window.electronAPI.getPathForFile(single);
      }
      if (!p) {
        const anyFile = single as unknown as { path?: string };
        p = anyFile.path || URL.createObjectURL(single);
      }
      loadAudioSource(p, single.name);
    } else if (audioFiles.length > 1) {
      // Multiple audio files -> Add to batch queue
      const newItems: BatchItem[] = audioFiles.map((f, idx) => {
        let p = '';
        if (window.electronAPI) {
          p = window.electronAPI.getPathForFile(f);
        }
        if (!p) {
          const anyF = f as unknown as { path?: string };
          p = anyF.path || URL.createObjectURL(f);
        }
        return {
          id: `${Date.now()}-${idx}`,
          name: f.name,
          path: p,
          status: 'idle',
        };
      });

      setConfig((prev) => ({
        ...prev,
        batchQueue: [...prev.batchQueue, ...newItems],
      }));

      // Also load the first one into the live preview
      loadAudioSource(newItems[0].path, newItems[0].name);

      setIsBatchMode(true);
      setIsExportModalOpen(true);
    }
  };

  // Pick audio file dialog
  const handlePickAudio = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openAudioFiles();
      if (result && result.length > 0) {
        if (result.length === 1) {
          loadAudioSource(result[0].path, result[0].name);
        } else {
          // Multiple files selected
          const newItems: BatchItem[] = (result as Array<{ path: string; name: string }>).map((item, idx) => ({
            id: `${Date.now()}-${idx}`,
            name: item.name,
            path: item.path,
            status: 'idle',
          }));
          setConfig((prev) => ({
            ...prev,
            batchQueue: [...prev.batchQueue, ...newItems],
          }));
          loadAudioSource(result[0].path, result[0].name);
          setIsBatchMode(true);
          setIsExportModalOpen(true);
        }
      }
    }
  };

  // Pick image file dialog
  const handlePickImage = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openImageFile();
      if (result) {
        loadImageSource(result.path);
      }
    }
  };

  // Voice Boost handler
  const handleVoiceBoostChange = (enabled: boolean) => {
    audioEngineRef.current.setVoiceBoost(enabled);
  };

  // Single Video Export
  const handleStartSingleExport = async () => {
    if (!config.audioPath) {
      alert('Please load an audio file first.');
      return;
    }

    let outPath = '';
    if (window.electronAPI) {
      const defaultName = `${(config.audioName || 'wedding-message')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')}_visualizer.mp4`;
      const selected = await window.electronAPI.selectSavePath(defaultName);
      if (!selected) return; // User cancelled dialog
      outPath = selected;
    } else {
      outPath = 'export.mp4';
    }

    setIsBatchMode(false);
    setIsExportModalOpen(true);
    setExportProgress({
      status: 'preparing',
      percentage: 0,
      currentItemName: config.audioName || 'Audio Message',
    });

    isCancelledRef.current = false;

    try {
      const finalPath = await runExportPipeline({
        audioEngine: audioEngineRef.current,
        bgImage,
        config,
        audioFilePath: config.audioPath,
        outputPath: outPath,
        onProgress: (pct, frame, total) => {
          setExportProgress((prev) => ({
            ...prev,
            status: 'rendering',
            percentage: pct,
            currentFrame: frame,
            totalFrames: total,
          }));
        },
        onStatus: (st) => console.log('[Export Status]', st),
        isCancelledRef,
      });

      setExportProgress({
        status: 'completed',
        percentage: 100,
        outputFilePath: finalPath,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== 'Export cancelled') {
        setExportProgress({
          status: 'error',
          percentage: 0,
          error: msg,
        });
      } else {
        setIsExportModalOpen(false);
      }
    }
  };

  // Batch Export All
  const handleStartBatchExport = async () => {
    if (config.batchQueue.length === 0) return;

    let targetDir = batchOutputDir;
    if (!targetDir && window.electronAPI) {
      const chosen = await window.electronAPI.selectFolder();
      if (!chosen) return;
      targetDir = chosen;
      setBatchOutputDir(chosen);
    }
    if (!targetDir) {
      targetDir = '/tmp';
    }

    setExportProgress({ status: 'rendering', percentage: 0 });

    for (let i = 0; i < config.batchQueue.length; i++) {
      if (isCancelledRef.current) {
        break; // Clean batch abort
      }
      const item = config.batchQueue[i];

      // Update status to rendering
      setConfig((prev) => ({
        ...prev,
        batchQueue: prev.batchQueue.map((q) =>
          q.id === item.id ? { ...q, status: 'rendering', progress: 0 } : q
        ),
      }));

      try {
        // Load and decode item audio
        let arrayBuf: ArrayBuffer;
        if (window.electronAPI) {
          arrayBuf = await window.electronAPI.readFile(item.path);
        } else {
          const res = await fetch(item.path);
          arrayBuf = await res.arrayBuffer();
        }

        await audioEngineRef.current.loadAudioFromBuffer(arrayBuf);

        const safeBase = item.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanDir = targetDir.endsWith('/') ? targetDir.slice(0, -1) : targetDir;
        const outFilePath = `${cleanDir}/${safeBase}_visualizer.mp4`;

        isCancelledRef.current = false;

        await runExportPipeline({
          audioEngine: audioEngineRef.current,
          bgImage,
          config: {
            ...config,
            audioDuration: audioEngineRef.current.duration,
            audioSettings: {
              ...config.audioSettings,
              trimStart: 0,
              trimEnd: audioEngineRef.current.duration,
            },
          },
          audioFilePath: item.path,
          outputPath: outFilePath,
          onProgress: (pct) => {
            setConfig((prev) => ({
              ...prev,
              batchQueue: prev.batchQueue.map((q) =>
                q.id === item.id ? { ...q, progress: pct } : q
              ),
            }));
          },
          onStatus: () => {},
          isCancelledRef,
        });

        // Mark done
        setConfig((prev) => ({
          ...prev,
          batchQueue: prev.batchQueue.map((q) =>
            q.id === item.id ? { ...q, status: 'done', outputPath: outFilePath } : q
          ),
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setConfig((prev) => ({
          ...prev,
          batchQueue: prev.batchQueue.map((q) =>
            q.id === item.id ? { ...q, status: 'error', error: msg } : q
          ),
        }));
      }
    }

    setExportProgress({ status: 'completed', percentage: 100, outputFilePath: targetDir });
  };

  const handleCancelExport = () => {
    isCancelledRef.current = true;
    if (window.electronAPI) {
      window.electronAPI.cancelExport();
    }
    setExportProgress({ status: 'idle', percentage: 0 });
    setIsExportModalOpen(false);
  };

  const handleShowInFolder = (path: string) => {
    if (window.electronAPI) {
      window.electronAPI.showInFolder(path);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0f0e0d] text-[#e8e4df] font-sans overflow-hidden select-none">
      {/* LEFT AREA: Canvas Stage & Live Audio Scrubber */}
      <CanvasStage
        config={config}
        updateConfig={setConfig}
        audioEngine={audioEngineRef.current}
        bgImage={bgImage}
        onFileDrop={handleFileDrop}
      />

      {/* RIGHT AREA: Studio Controls Side Panel */}
      <div className="w-[430px] shrink-0 h-full flex flex-col bg-[#141211] border-l border-[#24201d] overflow-hidden">
        {/* Title Bar Header */}
        <div className="pt-8 px-6 pb-4 border-b border-[#24201d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/35 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-wide text-[#fdfaf5]">Wedding Audio Studio</h1>
              <p className="text-[11px] text-[#8e857c]">Guest Record Video Generator</p>
            </div>
          </div>

          {/* Batch Queue Trigger Badge */}
          {config.batchQueue.length > 0 && (
            <button
              onClick={() => {
                setIsBatchMode(true);
                setIsExportModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              Batch ({config.batchQueue.length})
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 pb-2 gap-2 border-b border-[#201c1a]">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'visualizer'
                ? 'bg-[#221d19] text-gold-300 border border-gold-500/30 shadow-sm'
                : 'text-[#8c8276] hover:text-[#ded8cf]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Style & Media
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'typography'
                ? 'bg-[#221d19] text-gold-300 border border-gold-500/30 shadow-sm'
                : 'text-[#8c8276] hover:text-[#ded8cf]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Typography
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-[#221d19] text-gold-300 border border-gold-500/30 shadow-sm'
                : 'text-[#8c8276] hover:text-[#ded8cf]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Voice Clean-up
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
          {activeTab === 'visualizer' && (
            <>
              <MediaDropzone
                config={config}
                onPickAudio={handlePickAudio}
                onPickImage={handlePickImage}
                onLoadDemo={loadDemoAssets}
              />
              <VisualizerPanel config={config} updateConfig={setConfig} />
            </>
          )}

          {activeTab === 'typography' && (
            <TypographyPanel config={config} updateConfig={setConfig} />
          )}

          {activeTab === 'audio' && (
            <AudioToolsPanel
              config={config}
              updateConfig={setConfig}
              onVoiceBoostChange={handleVoiceBoostChange}
            />
          )}
        </div>

        {/* Sticky Bottom Export Action Bar */}
        <div className="p-5 border-t border-[#24201d] bg-[#12100f] space-y-2.5">
          <button
            onClick={handleStartSingleExport}
            disabled={!config.audioPath}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 hover:brightness-105 active:scale-[0.99] text-black font-semibold text-sm transition-all shadow-xl shadow-gold-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-black" />
            Export 1080p MP4 Video
          </button>

          <p className="text-[11px] text-center text-[#7a7269]">
            Instant H.264 compile at 30 FPS • Bundled FFmpeg
          </p>
        </div>
      </div>

      {/* Export / Progress / Batch Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        progress={exportProgress}
        onCancel={handleCancelExport}
        onShowInFolder={handleShowInFolder}
        batchQueue={config.batchQueue}
        isBatchMode={isBatchMode}
        onStartBatch={handleStartBatchExport}
        onRemoveBatchItem={(id) =>
          setConfig((prev) => ({
            ...prev,
            batchQueue: prev.batchQueue.filter((q) => q.id !== id),
          }))
        }
        onClearBatch={() =>
          setConfig((prev) => ({
            ...prev,
            batchQueue: [],
          }))
        }
        onSelectBatchFolder={async () => {
          if (window.electronAPI) {
            const chosen = await window.electronAPI.selectFolder();
            if (chosen) setBatchOutputDir(chosen);
          }
        }}
        batchOutputDir={batchOutputDir}
      />
    </div>
  );
};

export default App;
