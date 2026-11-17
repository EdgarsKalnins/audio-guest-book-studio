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
  QrCode,
  Stack,
  Camera,
  FilmReel,
  ChatCenteredText,
} from '@phosphor-icons/react';
import {
  StudioConfig,
  ExportProgress,
  BatchItem,
  ASPECT_RATIOS,
  AspectRatioPreset,
  TimelineTrack,
  DEFAULT_FRAME_CONFIG,
  DEFAULT_MOTION_CONFIG,
  DEFAULT_SUBTITLE_CONFIG,
} from './types/studio';
import { AudioEngine } from './engine/audioEngine';
import { runExportPipeline } from './engine/frameGenerator';
import { detectSpeechBoundaries } from './engine/audioConcatenator';
import { BatchQueueManager } from './engine/batchExporter';
import { CanvasStage } from './components/CanvasStage';
import { MediaDropzone } from './components/MediaDropzone';
import { VisualizerPanel } from './components/VisualizerPanel';
import { FrameTemplatePanel } from './components/FrameTemplatePanel';
import { MotionBackgroundPanel } from './components/MotionBackgroundPanel';
import { SubtitlePanel } from './components/SubtitlePanel';
import { TypographyPanel } from './components/TypographyPanel';
import { QrWatermarkPanel } from './components/QrWatermarkPanel';
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
    gradientPreset: null,
    strokeWidth: 1.0,
    lineCap: 'round',
    particleDensity: 1.0,
    frame: DEFAULT_FRAME_CONFIG,
    motion: DEFAULT_MOTION_CONFIG,
    typography: {
      enabled: false, // Disabled by default per user request
      coupleNames: 'Sarah & Michael',
      dateText: 'October 14, 2024',
      titleText: 'Wedding Audio Guestbook',
      fontFamily: 'Cormorant Garamond',
      showTimer: true,
      fontSize: 1.0,
    },
    subtitles: DEFAULT_SUBTITLE_CONFIG,
    qrWatermark: {
      enabled: false,
      url: 'https://momentbox.lv',
      position: 'bottom-right',
      opacity: 0.9,
      label: 'Scan to listen',
      size: 130,
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

  const [activeTab, setActiveTab] = useState<'visualizer' | 'frames' | 'motion' | 'subtitles' | 'typography' | 'qr' | 'audio'>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && ['visualizer', 'frames', 'motion', 'subtitles', 'typography', 'qr', 'audio'].includes(p)) {
        return p as any;
      }
    } catch {
      // ignore
    }
    return 'visualizer';
  });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchOutputDir, setBatchOutputDir] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: 'idle',
    percentage: 0,
  });

  const [expandedBlocks, setExpandedBlocks] = useState<{ 1: boolean; 2: boolean; 3: boolean }>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('compact');
      if (p === 'all' || p === '1,2,3') return { 1: false, 2: false, 3: false };
      if (p === '1,2') return { 1: false, 2: false, 3: true };
      if (p === '3') return { 1: true, 2: true, 3: false };
    } catch {
      // ignore
    }
    return { 1: true, 2: true, 3: true };
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('theme');
      if (p === 'light' || p === 'dark') return p;
      const saved = localStorage.getItem('wedding_studio_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [mobileTab, setMobileTab] = useState<'stage' | 'controls'>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('mobileTab');
      if (p === 'controls' || p === 'stage') return p;
    } catch {
      // ignore
    }
    return 'stage';
  });

  // Resizable Right Sidebar State (persisted to localStorage)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('sidebarWidth');
      if (p) {
        const val = parseInt(p, 10);
        if (!isNaN(val) && val >= 320 && val <= 720) return val;
      }
      const saved = localStorage.getItem('wedding_studio_sidebar_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 320 && val <= 720) return val;
      }
    } catch {
      // ignore
    }
    return 420;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const minW = 320;
      const maxW = Math.max(380, Math.min(window.innerWidth - 450, 720));
      const calculated = window.innerWidth - e.clientX;
      const clamped = Math.min(Math.max(calculated, minW), maxW);
      setSidebarWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('wedding_studio_sidebar_width', sidebarWidth.toString());
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResetSidebarWidth = () => {
    setSidebarWidth(420);
    try {
      localStorage.setItem('wedding_studio_sidebar_width', '420');
    } catch {
      // ignore
    }
  };

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
      } else if (ratio >= 0.7 && ratio < 0.85) {
        detectedAspect = '4:5';
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

  const handleSpeechClarifierChange = (enabled: boolean, sensitivity?: number) => {
    audioEngineRef.current.setSpeechClarifier(enabled, sensitivity);
  };

  const handleAutoTrimSilence = () => {
    const rawBuf = audioEngineRef.current.getRawBuffer();
    if (!rawBuf) return;
    const { speechStart, speechEnd } = detectSpeechBoundaries(
      rawBuf,
      config.audioSettings.noiseGateThresholdDb ?? -45
    );
    setConfig((prev) => ({
      ...prev,
      audioSettings: {
        ...prev.audioSettings,
        trimStart: Math.round(speechStart * 10) / 10,
        trimEnd: Math.round(speechEnd * 10) / 10,
      },
    }));
  };

  // Video Export for the complete continuous timeline sequence
  const handleStartSingleExport = async () => {
    if (!config.audioPath || config.audioDuration <= 0) {
      alert('Please add audio recording(s) to the timeline first.');
      return;
    }

    let outPath = '';
    const isTransparent = config.backgroundMode === 'transparent';
    const defaultExt = isTransparent ? (config.exportFormat === 'webm' ? 'webm' : 'mov') : 'mp4';

    if (window.electronAPI) {
      const defaultName = `${(config.audioName || 'wedding-audio-sequence')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')}_continuous.${defaultExt}`;
      const selected = await window.electronAPI.selectSavePath(defaultName);
      if (!selected) return;
      outPath = selected;
    } else {
      outPath = `export.${defaultExt}`;
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

  const handleOpenBatchModal = () => {
    const tracks = config.timelineTracks && config.timelineTracks.length > 0
      ? config.timelineTracks
      : config.audioPath
        ? [{ id: '1', name: config.audioName || 'Guest Recording', path: config.audioPath, duration: config.audioDuration, startTime: 0, endTime: config.audioDuration }]
        : [];

    const jobs: BatchItem[] = tracks.map((t) => ({
      id: t.id,
      name: t.name,
      path: t.path,
      status: 'idle',
      progress: 0,
    }));

    setConfig((prev) => ({ ...prev, batchQueue: jobs }));
    setIsBatchMode(true);
    setIsExportModalOpen(true);
  };

  const handleStartBatch = async () => {
    if (config.batchQueue.length === 0) return;

    let destDir = batchOutputDir;
    if (!destDir && window.electronAPI) {
      destDir = await window.electronAPI.selectFolder();
      if (!destDir) return;
      setBatchOutputDir(destDir);
    }
    if (!destDir) destDir = 'Wedding_Guestbook_Clips';

    const queueManager = new BatchQueueManager();
    const isTransparent = config.backgroundMode === 'transparent';
    const ext = isTransparent ? (config.exportFormat === 'webm' ? 'webm' : 'mov') : 'mp4';

    for (const item of config.batchQueue) {
      queueManager.addJob({
        fileId: item.id,
        fileName: item.name,
        inputPath: item.path,
        outputPath: BatchQueueManager.sanitizeOutputName(item.name, destDir, ext),
      });
    }

    setExportProgress({ status: 'rendering', percentage: 0 });
    isCancelledRef.current = false;

    await queueManager.processQueue(
      async (job, onProgress) => {
        // Isolate audio buffer for each batch item so waveforms and duration strictly match this single recording
        const matchingSource = loadedTrackSourcesRef.current.find(
          (t) => t.id === job.fileId || t.path === job.inputPath
        );

        let itemBuffer: AudioBuffer | null = matchingSource ? matchingSource.buffer : null;
        if (!itemBuffer) {
          try {
            itemBuffer = await decodeAudioSource(job.inputPath);
          } catch (decodeErr) {
            console.warn(`[Batch] Failed to decode audio for ${job.fileName}:`, decodeErr);
          }
        }

        const batchAudioEngine = new AudioEngine();
        if (itemBuffer) {
          batchAudioEngine.setBuffer(itemBuffer);
        }
        if (config.audioSettings.voiceBoost) {
          batchAudioEngine.setVoiceBoost(true);
        }
        if (config.audioSettings.speechClarifier) {
          batchAudioEngine.setSpeechClarifier(true, config.audioSettings.clarifierSensitivity);
        }

        const itemDuration = itemBuffer ? itemBuffer.duration : config.audioDuration;

        const finalPath = await runExportPipeline({
          audioEngine: batchAudioEngine,
          bgImage,
          config: {
            ...config,
            audioPath: job.inputPath,
            audioName: job.fileName,
            audioDuration: itemDuration,
            audioSettings: {
              ...config.audioSettings,
              trimStart: 0,
              trimEnd: itemDuration,
            },
          },
          audioFilePath: job.inputPath,
          outputPath: job.outputPath,
          onProgress: (pct) => onProgress(pct),
          onStatus: (st) => console.log(`[Batch ${job.fileName}]`, st),
          isCancelledRef,
        });
        return finalPath;
      },
      (job, index, total) => {
        setConfig((prev) => ({
          ...prev,
          batchQueue: prev.batchQueue.map((item) =>
            item.id === job.fileId
              ? {
                ...item,
                status: job.status,
                progress: job.progress,
                error: job.error,
                outputPath: job.outputPath,
              }
              : item
          ),
        }));

        setExportProgress({
          status: 'rendering',
          percentage: Math.round(((index + (job.progress / 100)) / total) * 100),
          currentItemName: job.fileName,
        });
      }
    );

    setExportProgress({
      status: 'completed',
      percentage: 100,
      outputFilePath: destDir,
    });
  };

  const handleRemoveBatchItem = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      batchQueue: prev.batchQueue.filter((item) => item.id !== id),
    }));
  };

  const handleClearBatch = () => {
    setConfig((prev) => ({
      ...prev,
      batchQueue: [],
    }));
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
    <div
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
      className="flex flex-col lg:flex-row h-screen w-screen bg-[#f4f4f6] dark:bg-[#0d0d0f] text-zinc-900 dark:text-[#f4f4f5] font-sans overflow-hidden select-none transition-colors duration-200"
    >
      {/* Mobile & Tablet Header Bar (< 1024px: lg:hidden) */}
      <div className="lg:hidden flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-[#131316] border-b border-zinc-200 dark:border-white/[0.08] shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-1.5 min-w-0 pr-1">
          <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0">
            <Sparkle className="w-3 h-3" weight="fill" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            <span className="hidden sm:inline">Audio </span>Guest Book Studio
          </span>
        </div>

        {/* Mobile View Switcher Pill & Theme Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setMobileTab('stage')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${mobileTab === 'stage'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
            >
              Stage
            </button>
            <button
              onClick={() => setMobileTab('controls')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${mobileTab === 'controls'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
            >
              Controls
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/[0.06] transition-all shadow-sm"
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
        className={`flex-1 min-w-0 h-full flex flex-col ${mobileTab === 'stage' ? 'flex' : 'hidden lg:flex'
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

      {/* DRAGGABLE RESIZER DIVIDER (Desktop only: lg and above) */}
      <div
        onMouseDown={handleMouseDownResize}
        onDoubleClick={handleResetSidebarWidth}
        title="Drag to resize controls panel (Double-click to reset width)"
        className={`hidden lg:flex items-center justify-center w-2 -ml-1 z-30 cursor-col-resize select-none group transition-colors ${isResizing ? 'bg-amber-400/30' : 'hover:bg-amber-400/20 active:bg-amber-400/30'
          }`}
      >
        <div
          className={`w-1 h-9 rounded-full transition-all ${isResizing
              ? 'bg-amber-500 scale-y-125 shadow-sm'
              : 'bg-zinc-300 dark:bg-zinc-700 group-hover:bg-amber-400 dark:group-hover:bg-amber-400 group-hover:scale-y-110'
            }`}
        />
      </div>

      {/* RIGHT AREA: Studio Controls Side Panel */}
      <div
        className={`w-full lg:w-[var(--sidebar-width)] shrink-0 h-full flex flex-col bg-white dark:bg-[#131316] border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-white/[0.08] overflow-hidden transition-colors duration-200 ${mobileTab === 'controls' ? 'flex' : 'hidden lg:flex'
          }`}
      >
        {/* Desktop Title Bar Header (hidden on mobile, visible on lg screens) */}
        <div
          className="hidden lg:flex px-4 py-2.5 border-b border-zinc-200 dark:border-white/[0.08] items-center justify-between app-drag-region bg-white dark:bg-[#131316] transition-colors shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shadow-2xs text-zinc-700 dark:text-zinc-200 shrink-0">
              <Sparkle className="w-3 h-3 text-amber-500" weight="fill" />
            </div>
            <div className="min-w-0 flex items-baseline gap-1.5">
              <h1 className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                Audio Guest Book Studio
              </h1>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden xl:inline">
                v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 app-no-drag shrink-0 ml-2">
            {config.timelineTracks && config.timelineTracks.length > 1 && (
              <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-[10px] font-medium flex items-center gap-1 shadow-2xs">
                <Playlist className="w-3 h-3 text-amber-500" />
                {config.timelineTracks.length} Clips
              </span>
            )}
            {/* Day / Night Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-7 px-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/[0.06] transition-all flex items-center gap-1 text-[11px] font-medium shadow-2xs"
              title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 h-3 text-amber-400" weight="regular" />
                  <span>Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-indigo-500" weight="regular" />
                  <span>Night</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation: Compact 2-Row Segmented Deck (100% visible, zero truncation) */}
        <div className="mx-3 my-2 p-1 rounded-xl bg-zinc-100/90 dark:bg-[#141418] border border-zinc-200/80 dark:border-white/[0.08] transition-colors shrink-0 shadow-2xs space-y-1">
          {/* Row 1: Visual & Scene Effects (3 columns: Visualizer, Frames, Motion) */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`h-8 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 select-none ${activeTab === 'visualizer'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.12] font-semibold ring-1 ring-black/[0.04] dark:ring-white/[0.04]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.04]'
                }`}
              title="Audio Visualizer Style & Waveform"
            >
              <Waveform className="w-3.5 h-3.5 shrink-0 text-amber-500" weight={activeTab === 'visualizer' ? 'bold' : 'regular'} />
              <span className="truncate">Visualizer</span>
            </button>
            <button
              onClick={() => setActiveTab('frames')}
              className={`h-8 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 select-none ${activeTab === 'frames'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.12] font-semibold ring-1 ring-black/[0.04] dark:ring-white/[0.04]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.04]'
                }`}
              title="Polaroid, Photostrip & Retro Templates"
            >
              <Camera className="w-3.5 h-3.5 shrink-0 text-amber-500" weight={activeTab === 'frames' ? 'bold' : 'regular'} />
              <span className="truncate">Frames</span>
              {config.frame?.template !== 'haute-couture' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('motion')}
              className={`h-8 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 select-none ${activeTab === 'motion'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.12] font-semibold ring-1 ring-black/[0.04] dark:ring-white/[0.04]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.04]'
                }`}
              title="Procedural Motion Backgrounds & Shaders"
            >
              <FilmReel className="w-3.5 h-3.5 shrink-0 text-amber-500" weight={activeTab === 'motion' ? 'bold' : 'regular'} />
              <span className="truncate">Motion</span>
              {(config.motion?.preset !== 'none' || Boolean(config.motion?.videoUrl)) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>
          </div>

          {/* Row 2: Editorial & Sound Processing (4 columns: Titles, Captions, QR Code, Audio) */}
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setActiveTab('typography')}
              className={`h-8 px-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 select-none ${activeTab === 'typography'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.12] font-semibold ring-1 ring-black/[0.04] dark:ring-white/[0.04]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.04]'
                }`}
              title="Couple Names, Wedding Date & Fonts"
            >
              <TextT className="w-3.5 h-3.5 shrink-0 text-amber-500" weight={activeTab === 'typography' ? 'bold' : 'regular'} />
              <span className="truncate">Titles</span>
            </button>
            <button
              onClick={() => setActiveTab('subtitles')}
              className={`h-8 px-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 select-none ${activeTab === 'subtitles'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.12] font-semibold ring-1 ring-black/[0.04] dark:ring-white/[0.04]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.04]'
                }`}
              title="AI Speech-to-Text & Karaoke Subtitles"
            >
              <ChatCenteredText className="w-3.5 h-3.5 shrink-0 text-amber-500" weight={activeTab === 'subtitles' ? 'bold' : 'regular'} />
              <span className="truncate">Captions</span>
              {config.subtitles?.enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`h-8 px-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 select-none ${activeTab === 'qr'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.12] font-semibold ring-1 ring-black/[0.04] dark:ring-white/[0.04]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.04]'
                }`}
              title="Dynamic Scannable Audio QR Code Watermark"
            >
              <QrCode className="w-3.5 h-3.5 shrink-0 text-amber-500" weight={activeTab === 'qr' ? 'bold' : 'regular'} />
              <span className="truncate">QR Code</span>
              {config.qrWatermark?.enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`h-8 px-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 select-none ${activeTab === 'audio'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.12] font-semibold ring-1 ring-black/[0.04] dark:ring-white/[0.04]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.04]'
                }`}
              title="Voice Boost, Noise Gate & Speech Clarifier"
            >
              <SpeakerHigh className="w-3.5 h-3.5 shrink-0 text-amber-500" weight={activeTab === 'audio' ? 'bold' : 'regular'} />
              <span className="truncate">Audio</span>
              {(config.audioSettings?.voiceBoost || config.audioSettings?.speechClarifier) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content (Compact & polished by groups) */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-2 space-y-3 custom-scrollbar">
          {activeTab === 'visualizer' && (
            <>
              {/* Step Navigator & Compact/Unpack Bar */}
              <div className="flex items-center justify-between px-1 py-0.5 text-xs">
                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Steps
                  </span>
                  <div className="flex items-center gap-1">
                    {([1, 2, 3] as const).map((stepNum) => {
                      const isExp = expandedBlocks[stepNum];
                      const stepTitles = {
                        1: '1. Audio Timeline',
                        2: '2. Canvas Background',
                        3: '3. Visualizer & Styling',
                      };
                      return (
                        <button
                          key={stepNum}
                          type="button"
                          onClick={() =>
                            setExpandedBlocks((prev) => ({
                              ...prev,
                              [stepNum]: !prev[stepNum],
                            }))
                          }
                          className={`h-5 px-1.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 transition-all ${
                            isExp
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs font-bold'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-200/60 dark:border-white/[0.06]'
                          }`}
                          title={`${stepTitles[stepNum]}: Click to ${isExp ? 'compact' : 'unpack'}`}
                        >
                          <span>{stepNum}</span>
                          <span className={`text-[8px] transition-transform duration-200 ${isExp ? 'text-amber-500' : 'text-zinc-400'}`}>
                            {isExp ? '▼' : '▶'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedBlocks({ 1: true, 2: true, 3: true })}
                    className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                  >
                    Unpack All
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={() => setExpandedBlocks({ 1: false, 2: false, 3: false })}
                    className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                  >
                    Compact All
                  </button>
                </div>
              </div>

              <MediaDropzone
                config={config}
                updateConfig={setConfig}
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
                isAudioExpanded={expandedBlocks[1]}
                onToggleAudioExpanded={() =>
                  setExpandedBlocks((prev) => ({ ...prev, 1: !prev[1] }))
                }
                isBgExpanded={expandedBlocks[2]}
                onToggleBgExpanded={() =>
                  setExpandedBlocks((prev) => ({ ...prev, 2: !prev[2] }))
                }
              />
              <VisualizerPanel
                config={config}
                updateConfig={setConfig}
                isExpanded={expandedBlocks[3]}
                onToggleExpanded={() =>
                  setExpandedBlocks((prev) => ({ ...prev, 3: !prev[3] }))
                }
              />
            </>
          )}

          {activeTab === 'frames' && (
            <FrameTemplatePanel config={config} onChange={setConfig} />
          )}

          {activeTab === 'motion' && (
            <MotionBackgroundPanel config={config} onChange={setConfig} />
          )}

          {activeTab === 'subtitles' && (
            <SubtitlePanel config={config} updateConfig={setConfig} />
          )}

          {activeTab === 'typography' && (
            <TypographyPanel config={config} updateConfig={setConfig} />
          )}

          {activeTab === 'qr' && (
            <QrWatermarkPanel config={config} updateConfig={setConfig} />
          )}

          {activeTab === 'audio' && (
            <AudioToolsPanel
              config={config}
              updateConfig={setConfig}
              onVoiceBoostChange={handleVoiceBoostChange}
              onSpeechClarifierChange={handleSpeechClarifierChange}
              onAutoTrimSilence={handleAutoTrimSilence}
            />
          )}
        </div>

        {/* Sticky Bottom Export Action Bar */}
        <div className="p-3 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/90 dark:bg-[#101013] space-y-1.5 transition-colors shrink-0">
          <button
            onClick={handleStartSingleExport}
            disabled={!config.audioPath || config.audioDuration <= 0}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 active:scale-[0.99] font-semibold text-xs sm:text-sm transition-all shadow-xs border border-zinc-800 dark:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <DownloadSimple className="w-4 h-4" weight="bold" />
            {config.timelineTracks && config.timelineTracks.length > 1
              ? `Export Master Video (${config.timelineTracks.length} Clips)`
              : 'Export 1080p MP4 Video'}
          </button>

          {config.timelineTracks && config.timelineTracks.length > 1 && (
            <button
              type="button"
              onClick={handleOpenBatchModal}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 font-medium text-xs transition-all shadow-2xs border border-zinc-200 dark:border-white/10 flex items-center justify-center gap-1.5 active:scale-[0.99]"
            >
              <Stack className="w-3.5 h-3.5 text-amber-500" weight="bold" />
              Batch Export Individual Clips ({config.timelineTracks.length} Files)
            </button>
          )}

          <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 font-mono">
            Hardware H.264 @ 30 FPS • Studio Master 1080p
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
        onStartBatch={handleStartBatch}
        onRemoveBatchItem={handleRemoveBatchItem}
        onClearBatch={handleClearBatch}
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
        onClose={() => {
          setIsExitModalOpen(false);
          if (window.electronAPI && typeof window.electronAPI.dismissClose === 'function') {
            window.electronAPI.dismissClose();
          }
        }}
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
