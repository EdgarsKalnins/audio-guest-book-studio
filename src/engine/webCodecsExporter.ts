import { Muxer, StreamTarget, ArrayBufferTarget } from 'mp4-muxer';
import { StudioConfig, ASPECT_RATIOS } from '../types/studio';
import { AudioEngine } from './audioEngine';
import { drawStudioFrame, createStaticBackgroundCache } from './visualizers/renderer';

export interface WebCodecsExportOptions {
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
 * Checks if Chromium hardware WebCodecs VideoEncoder is available.
 */
export function isWebCodecsSupported(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
}

/**
 * High-speed hardware-accelerated video export using Chromium WebCodecs (VideoToolbox / NVENC).
 * Encodes directly from Canvas GPU textures with strict hardware backpressure & zero-memory disk streaming.
 */
export async function runWebCodecsHardwareExport(
  options: WebCodecsExportOptions
): Promise<string> {
  const {
    audioEngine,
    bgImage,
    config,
    audioFilePath,
    outputPath,
    onProgress,
    onStatus,
    isCancelledRef,
  } = options;

  const aspect = ASPECT_RATIOS[config.aspectRatio];
  const width = aspect.width - (aspect.width % 2);
  const height = aspect.height - (aspect.height % 2);
  const fps = 30;

  const trimStart = Math.max(0, config.audioSettings.trimStart);
  const maxDur = config.audioDuration || audioEngine.duration;
  const trimEnd =
    config.audioSettings.trimEnd > 0 && config.audioSettings.trimEnd <= maxDur
      ? config.audioSettings.trimEnd
      : maxDur;
  const exportDuration = Math.max(0.1, trimEnd - trimStart);
  const totalFrames = Math.ceil(exportDuration * fps);

  onStatus('Pre-rendering static layers & initializing hardware encoder...');

  // 1. Pre-render static background photo, vignette, and typography once
  const staticCache = createStaticBackgroundCache(width, height, bgImage, config);

  // 2. Offscreen rendering canvas with hardware acceleration
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // 3. Initialize MP4 Muxer with streaming disk target (zero memory buildup)
  let tempFileHandle: { id: string; tempPath: string } | null = null;
  let target: StreamTarget | ArrayBufferTarget;

  if (window.electronAPI && typeof window.electronAPI.initTempVideoFile === 'function') {
    tempFileHandle = await window.electronAPI.initTempVideoFile();
    target = new StreamTarget({
      onData: (data, position) => {
        if (tempFileHandle) {
          window.electronAPI?.writeTempVideoChunk(tempFileHandle.id, data, position);
        }
      },
    });
  } else {
    target = new ArrayBufferTarget();
  }

  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: false, // Streamed chunk writing: zero in-memory buffer duplication!
  });

  // 4. Initialize Chromium WebCodecs VideoEncoder with strict backpressure
  let encoderError: Error | null = null;
  let dequeueResolve: (() => void) | null = null;

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (err) => {
      console.error('[WebCodecs] Encoder error:', err);
      encoderError = err;
      if (dequeueResolve) {
        dequeueResolve();
        dequeueResolve = null;
      }
    },
  });

  // W3C WebCodecs backpressure signal: fires when GPU encoder consumes a frame
  encoder.ondequeue = () => {
    if (dequeueResolve) {
      const resolve = dequeueResolve;
      dequeueResolve = null;
      resolve();
    }
  };

  // Configure for Apple Silicon M4 / Universal GPU hardware acceleration
  await encoder.configure({
    codec: 'avc1.640028', // H.264 High Profile Level 4.0
    width,
    height,
    bitrate: 6_500_000, // 6.5 Mbps crisp 1080p
    framerate: fps,
    hardwareAcceleration: 'prefer-hardware', // Dedicated M4 VideoToolbox / NVENC chip
    latencyMode: 'realtime',
  });

  onStatus('Hardware rendering frames at 200+ FPS...');

  const freqData = new Uint8Array(256);
  const timeData = new Float32Array(512);

  try {
    // 5. High-speed render loop
    for (let frame = 0; frame < totalFrames; frame++) {
      if (isCancelledRef.current) {
        encoder.close();
        throw new Error('Export cancelled');
      }
      if (encoderError) {
        throw encoderError;
      }

      // Strict hardware backpressure: maintain at most 3-4 frames in GPU memory
      // Prevents GPU texture mailbox exhaustion (exit_code=512)
      while (encoder.encodeQueueSize >= 4) {
        if (isCancelledRef.current || encoderError) break;
        await new Promise<void>((resolve) => {
          dequeueResolve = resolve;
        });
      }

      const currentOffset = frame / fps;
      const currentAudioTime = trimStart + currentOffset;

      // Fast offline audio frequency sample (zero heap allocation)
      audioEngine.getOfflineFrameData(currentAudioTime, freqData, timeData);

      // Fast frame draw using cached static layer
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

      // Zero-copy GPU VideoFrame from canvas
      const timestampMicros = Math.round(currentOffset * 1_000_000);
      const videoFrame = new VideoFrame(canvas, { timestamp: timestampMicros });

      // Keyframe every 2 seconds (60 frames)
      encoder.encode(videoFrame, { keyFrame: frame % 60 === 0 });
      videoFrame.close(); // Immediate release of GPU texture

      if (frame % 30 === 0 || frame === totalFrames - 1) {
        const pct = Math.round(((frame + 1) / totalFrames) * 92);
        onProgress(pct, frame + 1, totalFrames);
      }
    }

    onStatus('Flushing hardware encoder...');
    await encoder.flush();
    muxer.finalize();
    encoder.close();

    onStatus('Finalizing 1-second lossless audio multiplexing...');

    let tempVideoPath: string;
    if (tempFileHandle && window.electronAPI) {
      tempVideoPath = await window.electronAPI.closeTempVideoFile(tempFileHandle.id);
      tempFileHandle = null;
    } else if (target instanceof ArrayBufferTarget && window.electronAPI) {
      const mp4VideoBuffer = new Uint8Array(target.buffer);
      tempVideoPath = await window.electronAPI.saveTempVideo(mp4VideoBuffer);
    } else {
      tempVideoPath = outputPath;
    }

    if (window.electronAPI && typeof window.electronAPI.muxVideoAndAudio === 'function') {
      const finalPath = await window.electronAPI.muxVideoAndAudio({
        videoPath: tempVideoPath,
        audioPath: audioFilePath,
        outputPath,
        voiceBoost: config.audioSettings.voiceBoost,
      });

      onProgress(100, totalFrames, totalFrames);
      return finalPath;
    }

    onProgress(100, totalFrames, totalFrames);
    return outputPath;
  } catch (err) {
    if (tempFileHandle && window.electronAPI) {
      try {
        await window.electronAPI.closeTempVideoFile(tempFileHandle.id);
      } catch {
        // Ignored
      }
    }
    throw err;
  }
}
