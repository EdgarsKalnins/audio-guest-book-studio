import { StudioConfig, ASPECT_RATIOS } from '../types/studio';
import { AudioEngine } from './audioEngine';
import { drawStudioFrame } from './visualizers/renderer';

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

export async function runExportPipeline(options: RenderPipelineOptions): Promise<string> {
  const { audioEngine, bgImage, config, audioFilePath, outputPath, onProgress, onStatus, isCancelledRef } = options;

  const aspect = ASPECT_RATIOS[config.aspectRatio];
  const width = aspect.width;
  const height = aspect.height;
  const fps = 30;

  const trimStart = Math.max(0, config.audioSettings.trimStart);
  const maxDur = config.audioDuration || audioEngine.duration;
  const trimEnd = config.audioSettings.trimEnd > 0 && config.audioSettings.trimEnd <= maxDur
    ? config.audioSettings.trimEnd
    : maxDur;
  const exportDuration = Math.max(0.1, trimEnd - trimStart);
  const totalFrames = Math.ceil(exportDuration * fps);

  onStatus('Initializing encoder...');

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
      trimStart,
      trimEnd,
      voiceBoost: config.audioSettings.voiceBoost,
    });
  }

  // 2. Offscreen rendering canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  const freqData = new Uint8Array(256);
  const timeData = new Float32Array(512);

  onStatus('Rendering frames...');

  // 3. Render frame by frame
  for (let frame = 0; frame < totalFrames; frame++) {
    if (isCancelledRef.current) {
      if (window.electronAPI) {
        await window.electronAPI.cancelExport();
      }
      throw new Error('Export cancelled');
    }

    const currentOffset = frame / fps;
    const currentAudioTime = trimStart + currentOffset;

    // Get exact offline audio frequency & waveform slice
    audioEngine.getOfflineFrameData(currentAudioTime, freqData, timeData);

    // Render frame
    drawStudioFrame(
      ctx,
      width,
      height,
      bgImage,
      freqData,
      timeData,
      config,
      currentOffset,
      exportDuration
    );

    // Extract JPEG frame
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.86);
    });

    if (!blob) throw new Error('Failed to capture frame blob');

    const buf = await blob.arrayBuffer();
    const uint8 = new Uint8Array(buf);

    if (window.electronAPI) {
      await window.electronAPI.sendFrame(uint8);
    }

    const pct = Math.round(((frame + 1) / totalFrames) * 95);
    onProgress(pct, frame + 1, totalFrames);

    // Yield to keep UI responsive every 10 frames
    if (frame % 10 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onStatus('Finalizing MP4 video...');

  // 4. Signal FFmpeg that frame streaming is done
  if (window.electronAPI) {
    await window.electronAPI.finishExport();
  }

  return new Promise((resolve, reject) => {
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
}
