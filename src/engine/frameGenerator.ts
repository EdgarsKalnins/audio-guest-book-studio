import { StudioConfig, ASPECT_RATIOS } from '../types/studio';
import { AudioEngine } from './audioEngine';
import { drawStudioFrame, createStaticBackgroundCache } from './visualizers/renderer';
import { isWebCodecsSupported, runWebCodecsHardwareExport } from './webCodecsExporter';

export interface RenderPipelineOptions {
  audioEngine: AudioEngine;
  bgImage: HTMLImageElement | null;
  config: StudioConfig;
  audioFilePath: string;
  outputPath: string;
  onProgress: (percent: number, frame: number, total: number) => void;
  onStatus: (statusText: string) => void;
  isCancelledRef: { current: boolean };
}

/**
 * Unified Video Export Pipeline:
 * Prioritizes high-speed WebCodecs hardware acceleration (200+ FPS on M4 / modern OS) for opaque MP4s,
 * with automatic routing to FFmpeg streaming pipe for transparent alpha video (ProRes 4444 / WebM)
 * or when hardware encoding is unavailable.
 */
export async function runExportPipeline(options: RenderPipelineOptions): Promise<string> {
  const isTransparent = options.config.backgroundMode === 'transparent';
  const chosenFormat = options.config.exportFormat || (isTransparent ? 'prores' : 'mp4');
  const requiresAlpha = isTransparent || chosenFormat === 'prores' || chosenFormat === 'webm';

  // Hardware WebCodecs (mp4-muxer) is strictly H.264 AVC (opaque only).
  // Alpha transparent channels MUST stream through the lossless PNG FFmpeg pipe.
  if (!requiresAlpha && isWebCodecsSupported()) {
    try {
      console.log('[Export] Using high-speed WebCodecs hardware acceleration engine...');
      return await runWebCodecsHardwareExport(options);
    } catch (hwErr: unknown) {
      if (options.isCancelledRef.current) throw hwErr;
      console.warn('[Export] WebCodecs failed, falling back to FFmpeg streaming pipe:', hwErr);
    }
  }

  return await runFfmpegPipeExport(options);
}

/**
 * Fallback FFmpeg pipe export (used if WebCodecs is unsupported or disabled)
 */
async function runFfmpegPipeExport(options: RenderPipelineOptions): Promise<string> {
  const { audioEngine, bgImage, config, audioFilePath, outputPath, onProgress, onStatus, isCancelledRef } = options;

  const aspect = ASPECT_RATIOS[config.aspectRatio];
  const width = aspect.width - (aspect.width % 2);
  const height = aspect.height - (aspect.height % 2);
  const fps = 30;

  const trimStart = Math.max(0, config.audioSettings.trimStart);
  const maxDur = config.audioDuration || audioEngine.duration;
  const trimEnd = config.audioSettings.trimEnd > 0 && config.audioSettings.trimEnd <= maxDur
    ? config.audioSettings.trimEnd
    : maxDur;
  const exportDuration = Math.max(0.1, trimEnd - trimStart);
  const totalFrames = Math.ceil(exportDuration * fps);

  onStatus('Initializing encoder fallback...');

  // Ensure typography fonts are fully loaded before capturing static canvas
  if (typeof document !== 'undefined' && document.fonts && typeof document.fonts.ready?.then === 'function') {
    try {
      await document.fonts.ready;
    } catch {
      // Ignored
    }
  }

  // Pre-render static background & typography once
  const staticCache = createStaticBackgroundCache(width, height, bgImage, config);

  const isTransparent = config.backgroundMode === 'transparent';
  const chosenFormat = config.exportFormat || (isTransparent ? 'prores' : 'mp4');

  // Master sequence audio produced by getMasterWavBytes() is already pre-trimmed to start at 0s.
  // Avoid double-trimming in FFmpeg by normalizing trimStart to 0 for generated sequence WAVs.
  const isPreTrimmedMaster = audioFilePath.includes('wedding_sequence_');
  const ffmpegAudioTrimStart = isPreTrimmedMaster ? 0 : trimStart;

  // 1. Tell Electron main to start FFmpeg
  if (window.electronAPI) {
    await window.electronAPI.startExport({
      outputPath,
      audioPath: audioFilePath,
      width,
      height,
      fps,
      duration: exportDuration,
      totalFrames,
      trimStart: ffmpegAudioTrimStart,
      trimEnd,
      voiceBoost: config.audioSettings.voiceBoost,
      format: chosenFormat,
      transparent: isTransparent,
    });
  }

  // 2. Offscreen rendering canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: isTransparent, desynchronized: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  try {
    const freqData = new Uint8Array(256);
    const timeData = new Float32Array(512);

    // Wire backpressure drain listener
    let drainPromise: Promise<void> | null = null;
    let drainResolver: (() => void) | null = null;

    const cleanupDrain = window.electronAPI?.onExportDrain(() => {
      if (drainResolver) {
        drainResolver();
        drainResolver = null;
        drainPromise = null;
      }
    });

    onStatus('Rendering frames...');

    // 3. Render frame by frame
    for (let frame = 0; frame < totalFrames; frame++) {
      if (isCancelledRef.current) {
        if (cleanupDrain) cleanupDrain();
        if (window.electronAPI) {
          await window.electronAPI.cancelExport();
        }
        throw new Error('Export cancelled');
      }

      if (drainPromise) {
        await drainPromise;
      }

      const currentOffset = frame / fps;
      const currentAudioTime = trimStart + currentOffset;

      audioEngine.getOfflineFrameData(currentAudioTime, freqData, timeData);

      drawStudioFrame(
        ctx,
        width,
        height,
        bgImage,
        freqData,
        timeData,
        config,
        currentOffset,
        exportDuration,
        staticCache
      );

      const mimeType = isTransparent ? 'image/png' : 'image/jpeg';
      const quality = isTransparent ? undefined : 0.86;
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), mimeType, quality);
      });

      if (!blob) throw new Error('Failed to capture frame blob');

      const buf = await blob.arrayBuffer();
      const uint8 = new Uint8Array(buf);

      if (window.electronAPI) {
        window.electronAPI.sendFrame(uint8);
      }

      const pct = Math.round(((frame + 1) / totalFrames) * 95);
      onProgress(pct, frame + 1, totalFrames);

      if (frame % 8 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    if (cleanupDrain) cleanupDrain();

    onStatus('Finalizing MP4 video...');

    if (window.electronAPI) {
      await window.electronAPI.finishExport();
    }

    return await new Promise((resolve, reject) => {
      if (!window.electronAPI) {
        resolve(outputPath);
        return;
      }

      const cleanupComplete = window.electronAPI.onExportComplete((data) => {
        cleanupComplete();
        cleanupError();
        resolve(data.outputPath);
      });

      const cleanupError = window.electronAPI.onExportError((data) => {
        cleanupComplete();
        cleanupError();
        reject(new Error(data.error));
      });
    });
  } finally {
    // Explicitly release GPU texture buffers from VRAM
    try {
      canvas.width = 0;
      canvas.height = 0;
      staticCache.width = 0;
      staticCache.height = 0;
    } catch {
      // Ignored
    }
  }
}
