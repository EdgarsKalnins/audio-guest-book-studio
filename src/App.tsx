import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkle,
  DownloadSimple,
  SpeakerHigh,
  TextT,
  Waveform,
  Playlist,
  SignOut,
  Sun,
  Moon,
} from '@phosphor-icons/react';
import {
  StudioConfig,
  ExportProgress,
  BatchItem,
  ASPECT_RATIOS,
  AspectRatioPreset,
  TimelineTrack,
} from './types/studio';
import { AudioEngine } from './engine/audioEngine';
import { runExportPipeline } from './engine/frameGenerator';
import { CanvasStage } from './components/CanvasStage';
import { MediaDropzone } from './components/MediaDropzone';
import { VisualizerPanel } from './components/VisualizerPanel';
import { TypographyPanel } from './components/TypographyPanel';
import { AudioToolsPanel } from './components/AudioToolsPanel';
import { ExportModal } from './components/ExportModal';
import { ExitModal } from './components/ExitModal';

import demoAudioUrl from './assets/demo-audio.mp3';
import demoPhotoUrl from './assets/demo-photo.jpg';

export const App: React.FC = () => {
  const [config, setConfig] = useState<StudioConfig>({
    aspectRatio: '9:16',
    visualizerStyle: 'line_wave', // Classic hairline wave default
    visualizerColor: '#d7ba7e',
    visualizerScale: 1.0,
    visualizerOpacity: 0.95,
    visualizerGlow: true,
    typography: {
      enabled: false, // Disabled by default per user request
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
      voiceBoost: false, // Enhancements only on request (OFF by default)
    },
    audioPath: null,
    audioName: null,
    audioDuration: 0,
    imagePath: null,
    batchQueue: [],
    timelineTracks: [],
    gapBetweenTracks: 0.5,
  });

  const [activeTab, setActiveTab] = useState<'visualizer' | 'typography' | 'audio'>('visualizer');
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchOutputDir, setBatchOutputDir] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: 'idle',
    percentage: 0,
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('wedding_studio_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [mobileTab, setMobileTab] = useState<'stage' | 'controls'>('stage');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('wedding_studio_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const isCancelledRef = useRef<boolean>(false);
  // Store all decoded track sources for seamless sequence re-concatenation
  const loadedTrackSourcesRef = useRef<Array<{ id: string; name: string; path: string; buffer: AudioBuffer }>>([]);

  // Electron window close interceptor
  useEffect(() => {
    if (window.electronAPI && typeof window.electronAPI.onRequestClose === 'function') {
      const cleanup = window.electronAPI.onRequestClose(() => {
        setIsExitModalOpen(true);
      });
      return () => cleanup();
    }
  }, []);

  // Web browser beforeunload warning when exporting
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (exportProgress.status === 'rendering' || exportProgress.status === 'preparing') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [exportProgress.status]);

  // 1. Initial Load: Auto-load bundled demo wedding assets for immediate testing
  useEffect(() => {
    // Prevent default browser navigation when dropping files anywhere on the window
    const preventDrag = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventDrag);
    window.addEventListener('drop', preventDrag);

    loadDemoAssets();
    return () => {
      window.removeEventListener('dragover', preventDrag);
      window.removeEventListener('drop', preventDrag);
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

      const demoTrack = {
        id: 'demo-track-1',
        name: 'Sarah & Michael - Wedding Message #1',
        path: resolvedAudioDiskPath,
        buffer: decoded,
      };

      loadedTrackSourcesRef.current = [demoTrack];

      const demoTimeline: TimelineTrack = {
        id: demoTrack.id,
        name: demoTrack.name,
        path: demoTrack.path,
        duration: decoded.duration,
        startTime: 0,
        endTime: decoded.duration,
      };

      setConfig((prev) => ({
        ...prev,
        audioPath: resolvedAudioDiskPath,
        audioName: demoTrack.name,
        audioDuration: decoded.duration,
        timelineTracks: [demoTimeline],
        audioSettings: {
          ...prev.audioSettings,
          trimStart: 0,
          trimEnd: decoded.duration,
          voiceBoost: false, // Enhancements only on request
        },
      }));
    } catch (err) {
      console.warn('Could not auto-load demo assets:', err);
    }
  };

  // Decode audio buffer from file, URL, or transcode fallback for any exotic format
  const decodeAudioSource = async (fileOrPath: string, fileBlob?: File): Promise<AudioBuffer> => {
    let arrayBuffer: ArrayBuffer;
    if (fileBlob) {
      arrayBuffer = await fileBlob.arrayBuffer();
    } else if (fileOrPath.startsWith('blob:') || fileOrPath.startsWith('http')) {
      const res = await fetch(fileOrPath);
      arrayBuffer = await res.arrayBuffer();
    } else if (window.electronAPI) {
      arrayBuffer = await window.electronAPI.readFile(fileOrPath);
    } else {
      const res = await fetch(fileOrPath);
      arrayBuffer = await res.arrayBuffer();
    }

    // Try native Web Audio API decoding
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const tempCtx = new AudioCtx();

    try {
      const decoded = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
      tempCtx.close();
      return decoded;
    } catch (nativeErr) {
      tempCtx.close();
      // If Web Audio API fails on an exotic audio format (e.g. vintage telecom audio, WMA, AIFF):
      if (window.electronAPI && typeof window.electronAPI.transcodeToWav === 'function' && fileOrPath) {
        console.log('[Audio] Native decode failed, transcoding via FFmpeg fallback:', fileOrPath);
        const pcmBuf = await window.electronAPI.transcodeToWav(fileOrPath);
        const retryCtx = new AudioCtx();
        const decoded = await retryCtx.decodeAudioData(pcmBuf.slice(0));
        retryCtx.close();
        return decoded;
      }
      throw nativeErr;
    }
  };

  // Adds one or multiple audio recordings directly into the ONE continuous timeline sequence
  const addAudioTracksToSequence = async (
    filesToAdd: Array<{ path: string; name: string; fileBlob?: File }>,
    replaceExisting = false
  ) => {
    try {
      const newDecodedSources: Array<{ id: string; name: string; path: string; buffer: AudioBuffer }> = [];

      for (let i = 0; i < filesToAdd.length; i++) {
        const item = filesToAdd[i];
        try {
          const buffer = await decodeAudioSource(item.path, item.fileBlob);
          newDecodedSources.push({
            id: `track-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            name: item.name.replace(/\.[^/.]+$/, ''),
            path: item.path,
            buffer,
          });
        } catch (itemErr) {
          console.error(`Could not decode audio track ${item.name}:`, itemErr);
        }
      }

      if (newDecodedSources.length === 0) {
        alert('Could not decode any of the selected audio files.');
        return;
      }

      // Combine with existing sequence or replace
      const combinedSources = replaceExisting
        ? newDecodedSources
        : [...loadedTrackSourcesRef.current, ...newDecodedSources];

      loadedTrackSourcesRef.current = combinedSources;

      // Stitches all tracks into one continuous timeline sequence in the audio engine
      const { masterBuffer, tracks } = await audioEngineRef.current.loadSequencedTracks(
        combinedSources,
        config.gapBetweenTracks
      );

      const summaryName =
        tracks.length > 1
          ? `${tracks.length} Wedding Voicemails (${tracks[0].name} + ${tracks.length - 1} more)`
          : tracks[0].name;

      setConfig((prev) => ({
        ...prev,
        audioPath: tracks[0].path || 'sequence',
        audioName: summaryName,
        audioDuration: masterBuffer.duration,
        timelineTracks: tracks,
        audioSettings: {
          ...prev.audioSettings,
          trimStart: 0,
          trimEnd: masterBuffer.duration,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error adding audio to timeline sequence: ${msg}`);
    }
  };

  // Remove a track from the timeline sequence
  const handleRemoveTrack = async (trackId: string) => {
    loadedTrackSourcesRef.current = loadedTrackSourcesRef.current.filter((t) => t.id !== trackId);

    if (loadedTrackSourcesRef.current.length === 0) {
      audioEngineRef.current.stop();
      setConfig((prev) => ({
        ...prev,
        audioPath: null,
        audioName: null,
        audioDuration: 0,
        timelineTracks: [],
        audioSettings: {
          ...prev.audioSettings,
          trimStart: 0,
          trimEnd: 0,
        },
      }));
      return;
    }

    const { masterBuffer, tracks } = await audioEngineRef.current.loadSequencedTracks(
      loadedTrackSourcesRef.current,
      config.gapBetweenTracks
    );

    const summaryName =
      tracks.length > 1
        ? `${tracks.length} Wedding Voicemails (${tracks[0].name} + ${tracks.length - 1} more)`
        : tracks[0].name;

    setConfig((prev) => ({
      ...prev,
      audioPath: tracks[0].path,
      audioName: summaryName,
      audioDuration: masterBuffer.duration,
      timelineTracks: tracks,
      audioSettings: {
        ...prev.audioSettings,
        trimStart: 0,
        trimEnd: masterBuffer.duration,
      },
    }));
  };

  // Jump playhead directly to the start of a specific track in the sequence
  const handleSeekTrack = (startTime: number) => {
    audioEngineRef.current.seek(startTime);
  };

  // Helper to load background photo
  const loadImageSource = (imageDiskOrUrl: string, fileBlob?: File) => {
    let streamUrl = imageDiskOrUrl;
    if (fileBlob) {
      streamUrl = URL.createObjectURL(fileBlob);
    } else if (window.electronAPI) {
      streamUrl = window.electronAPI.getMediaUrl(imageDiskOrUrl);
    }

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
      const ext = (f.name.toLowerCase().split('.').pop() || '').toLowerCase();
      const isAudio =
        f.type.startsWith('audio/') ||
        ['wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'aiff', 'aif', 'wma', 'opus', 'webm', 'amr'].includes(ext);
      const isImage =
        f.type.startsWith('image/') ||
        ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext);

      if (isAudio) {
        audioFiles.push(f);
      } else if (isImage) {
        imageFile = f;
      }
    }

    // If an image was dropped
    if (imageFile) {
      let imgPath = '';
      if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
        imgPath = window.electronAPI.getPathForFile(imageFile);
      }
      if (!imgPath) {
        const anyFile = imageFile as unknown as { path?: string };
        imgPath = anyFile.path || '';
      }
      loadImageSource(imgPath || URL.createObjectURL(imageFile), imageFile);
    }

    // If audio file(s) were dropped: add ALL of them into ONE timeline sequence!
    if (audioFiles.length > 0) {
      const itemsToAdd = audioFiles.map((f) => {
        let p = '';
        if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
          p = window.electronAPI.getPathForFile(f);
        }
        if (!p) {
          const anyFile = f as unknown as { path?: string };
          p = anyFile.path || '';
        }
        return {
          path: p || URL.createObjectURL(f),
          name: f.name,
          fileBlob: f,
        };
      });

      addAudioTracksToSequence(itemsToAdd, false);
    }
  };

  // Pick audio file(s) dialog: adds them to the timeline sequence automatically
  const handlePickAudio = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openAudioFiles();
      if (result && result.length > 0) {
        const items = (result as Array<{ path: string; name: string }>).map((item) => ({
          path: item.path,
          name: item.name,
        }));
        addAudioTracksToSequence(items, false);
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

  // Video Export for the complete continuous timeline sequence
  const handleStartSingleExport = async () => {
    if (!config.audioPath || config.audioDuration <= 0) {
      alert('Please add audio recording(s) to the timeline first.');
      return;
    }

    let outPath = '';
    if (window.electronAPI) {
      const defaultName = `${(config.audioName || 'wedding-audio-sequence')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')}_continuous.mp4`;
      const selected = await window.electronAPI.selectSavePath(defaultName);
      if (!selected) return;
      outPath = selected;
    } else {
      outPath = 'export.mp4';
    }

    // Immediately stop live preview audio to free audio device & system resources
    audioEngineRef.current.pause();

    // Generate the concatenated master WAV file matching the exact video frame trim range
    let audioExportPath = config.audioPath;
    const masterWavBytes = audioEngineRef.current.getMasterWavBytes(
      config.audioSettings.trimStart,
      config.audioSettings.trimEnd
    );
    if (masterWavBytes && window.electronAPI && typeof window.electronAPI.writeWavFile === 'function') {
      audioExportPath = await window.electronAPI.writeWavFile(
        masterWavBytes,
        `wedding_sequence_${Date.now()}.wav`
      );
    }

    setIsBatchMode(false);
    setIsExportModalOpen(true);
    setExportProgress({
      status: 'preparing',
      percentage: 0,
      currentItemName: config.audioName || 'Wedding Voicemail Sequence',
    });

    isCancelledRef.current = false;

    try {
      const finalPath = await runExportPipeline({
        audioEngine: audioEngineRef.current,
        bgImage,
        config,
        audioFilePath: audioExportPath,
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

      // If running in browser without Electron, trigger instant browser file download
      if (!window.electronAPI && finalPath && finalPath.startsWith('blob:')) {
        const downloadName = `${(config.audioName || 'wedding-audio-video')
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
        const a = document.createElement('a');
        a.href = finalPath;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
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
    } else if (path && path.startsWith('blob:')) {
      const downloadName = `${(config.audioName || 'wedding-audio-video')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
      const a = document.createElement('a');
      a.href = path;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleConfirmExit = () => {
    if (isExporting) {
      handleCancelExport();
    }
    if (window.electronAPI && typeof window.electronAPI.exitApp === 'function') {
      window.electronAPI.exitApp();
    } else {
      setIsExitModalOpen(false);
      window.close();
    }
  };

  const isExporting = exportProgress.status === 'preparing' || exportProgress.status === 'rendering';
  const isMac = window.electronAPI?.platform === 'darwin';

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-[#f4f4f6] dark:bg-[#0d0d0f] text-zinc-900 dark:text-[#f4f4f5] font-sans overflow-hidden select-none transition-colors duration-200">
      {/* Mobile & Tablet Header Bar (< 1024px: lg:hidden) */}
      <div className="lg:hidden flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-white dark:bg-[#131316] border-b border-zinc-200 dark:border-white/[0.08] shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0">
            <Sparkle className="w-3.5 h-3.5" weight="fill" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            Audio Guest Book Studio
          </span>
        </div>

        {/* Mobile View Switcher Pill & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setMobileTab('stage')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mobileTab === 'stage'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Stage
            </button>
            <button
              onClick={() => setMobileTab('controls')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mobileTab === 'controls'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Controls
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/[0.06] transition-all shadow-sm"
            title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" weight="regular" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-500" weight="regular" />
            )}
          </button>
        </div>
      </div>

      {/* LEFT AREA: Canvas Stage & Live Audio Scrubber */}
      <div
        className={`flex-1 min-w-0 h-full flex flex-col ${
          mobileTab === 'stage' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <CanvasStage
          config={config}
          updateConfig={setConfig}
          audioEngine={audioEngineRef.current}
          bgImage={bgImage}
          onFileDrop={handleFileDrop}
          isExporting={isExporting}
          onSwitchToControls={() => setMobileTab('controls')}
        />
      </div>

      {/* RIGHT AREA: Studio Controls Side Panel */}
      <div
        className={`w-full lg:w-[380px] xl:w-[430px] shrink-0 h-full flex flex-col bg-white dark:bg-[#131316] border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-white/[0.08] overflow-hidden transition-colors duration-200 ${
          mobileTab === 'controls' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Desktop Title Bar Header (hidden on mobile, visible on lg screens) */}
        <div
          className="hidden lg:flex pt-4 px-6 pb-3.5 border-b border-zinc-200 dark:border-white/[0.08] items-center justify-between app-drag-region bg-white dark:bg-[#131316] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shadow-sm text-zinc-700 dark:text-zinc-200">
              <Sparkle className="w-3.5 h-3.5" weight="fill" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Audio Guest Book Studio</h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Guest Record Video Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 app-no-drag">
            {config.timelineTracks && config.timelineTracks.length > 1 && (
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 shadow-sm">
                <Playlist className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                {config.timelineTracks.length} in Sequence
              </span>
            )}
            {/* Day / Night Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 px-2.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/[0.06] transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm"
              title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" weight="regular" />
                  <span className="text-[11px]">Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" weight="regular" />
                  <span className="text-[11px]">Night</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation: Segmented Studio Control */}
        <div className="flex items-center mx-4 sm:mx-6 my-2.5 sm:my-3 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] gap-1 transition-colors">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'visualizer'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-white/[0.08]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <Waveform className="w-3.5 h-3.5" weight="regular" />
            Style & Media
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'typography'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-white/[0.08]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <TextT className="w-3.5 h-3.5" weight="regular" />
            Typography
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-white/[0.08]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <SpeakerHigh className="w-3.5 h-3.5" weight="regular" />
            Voice Clean-up
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-4 sm:space-y-5 custom-scrollbar">
          {activeTab === 'visualizer' && (
            <>
              <MediaDropzone
                config={config}
                onPickAudio={handlePickAudio}
                onPickImage={handlePickImage}
                onLoadDemo={loadDemoAssets}
                onAudioFileSelected={(files) => handleFileDrop(files)}
                onImageFileSelected={(file) => {
                  let imgPath = '';
                  if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
                    imgPath = window.electronAPI.getPathForFile(file);
                  }
                  if (!imgPath) {
                    const anyFile = file as unknown as { path?: string };
                    imgPath = anyFile.path || '';
                  }
                  loadImageSource(imgPath || URL.createObjectURL(file), file);
                }}
                onRemoveTrack={handleRemoveTrack}
                onSeekTrack={handleSeekTrack}
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
        <div className="p-3.5 sm:p-5 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#101013] space-y-2 sm:space-y-2.5 transition-colors">
          <button
            onClick={handleStartSingleExport}
            disabled={!config.audioPath || config.audioDuration <= 0}
            className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 active:scale-[0.99] font-medium text-sm transition-all shadow-md border border-zinc-800 dark:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <DownloadSimple className="w-4 h-4" weight="bold" />
            {config.timelineTracks && config.timelineTracks.length > 1
              ? `Export Continuous 1080p Video (${config.timelineTracks.length} Tracks)`
              : 'Export 1080p MP4 Video'}
          </button>

          <p className="text-[11px] text-center text-zinc-500 font-mono">
            Hardware-accelerated H.264 @ 30 FPS • Studio Master
          </p>
        </div>
      </div>

      {/* Export / Progress Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        progress={exportProgress}
        onCancel={handleCancelExport}
        onShowInFolder={handleShowInFolder}
        batchQueue={config.batchQueue}
        isBatchMode={isBatchMode}
        onStartBatch={() => {}}
        onRemoveBatchItem={() => {}}
        onClearBatch={() => {}}
        onSelectBatchFolder={async () => {
          if (window.electronAPI) {
            const chosen = await window.electronAPI.selectFolder();
            if (chosen) setBatchOutputDir(chosen);
          }
        }}
        batchOutputDir={batchOutputDir}
      />

      {/* Exit Confirmation Modal */}
      <ExitModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
        isExporting={isExporting}
        exportPercentage={exportProgress.percentage}
        tracksCount={config.timelineTracks?.length || (config.audioPath ? 1 : 0)}
        audioName={config.audioName || undefined}
      />
    </div>
  );
};

export default App;
