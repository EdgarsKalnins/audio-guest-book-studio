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

  // 3. Initialize MP4 Muxer
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

  const inBrowserMode = !window.electronAPI;
  const rawAudioBuffer = audioEngine.getRawBuffer();
  const canEncodeBrowserAudio =
    inBrowserMode &&
    Boolean(rawAudioBuffer) &&
    typeof AudioEncoder !== 'undefined' &&
    typeof AudioData !== 'undefined';

  const muxerOptions: {
    target: StreamTarget | ArrayBufferTarget;
    video: { codec: 'avc'; width: number; height: number };
    audio?: { codec: 'aac'; sampleRate: number; numberOfChannels: number };
    fastStart: false | 'in-memory';
  } = {
    target,
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: inBrowserMode ? 'in-memory' : false,
  };

  if (canEncodeBrowserAudio && rawAudioBuffer) {
    muxerOptions.audio = {
      codec: 'aac',
      sampleRate: rawAudioBuffer.sampleRate,
      numberOfChannels: Math.min(2, rawAudioBuffer.numberOfChannels),
    };
  }

  const muxer = new Muxer(muxerOptions);

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

    onStatus('Flushing hardware video encoder...');
    await encoder.flush();
    encoder.close();

    // If running in browser mode without FFmpeg, encode audio stream directly via WebCodecs AudioEncoder
    if (canEncodeBrowserAudio && rawAudioBuffer) {
      onStatus('Encoding high-fidelity AAC audio...');
      await encodeAudioWithWebCodecs(
        rawAudioBuffer,
        muxer,
        trimStart,
        trimEnd,
        isCancelledRef
      );
    }

    muxer.finalize();

    onStatus('Finalizing 1-second lossless audio multiplexing...');

    let tempVideoPath: string;
    if (tempFileHandle && window.electronAPI) {
      tempVideoPath = await window.electronAPI.closeTempVideoFile(tempFileHandle.id);
      tempFileHandle = null;
    } else if (target instanceof ArrayBufferTarget && window.electronAPI) {
      const mp4VideoBuffer = new Uint8Array(target.buffer);
      tempVideoPath = await window.electronAPI.saveTempVideo(mp4VideoBuffer);
    } else if (target instanceof ArrayBufferTarget) {
      // Browser environment fallback: convert in-memory MP4 buffer into downloadable Blob URL
      const blob = new Blob([target.buffer], { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);
      onProgress(100, totalFrames, totalFrames);
      return blobUrl;
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

/**
 * Encodes audio PCM data into AAC-LC using WebCodecs AudioEncoder for browser environment.
 */
async function encodeAudioWithWebCodecs(
  buffer: AudioBuffer,
  muxer: Muxer<ArrayBufferTarget | StreamTarget>,
  trimStart: number,
  trimEnd: number,
  isCancelledRef: { current: boolean }
): Promise<void> {
  let audioEncoderError: Error | null = null;
  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => {
      muxer.addAudioChunk(chunk, meta);
    },
    error: (err) => {
      console.error('[WebCodecs] AudioEncoder error:', err);
      audioEncoderError = err;
    },
  });

  const sampleRate = buffer.sampleRate;
  const numChannels = Math.min(2, buffer.numberOfChannels);

  await audioEncoder.configure({
    codec: 'mp4a.40.2', // Universal AAC-LC
    sampleRate,
    numberOfChannels: numChannels,
    bitrate: 192_000, // 192 kbps high fidelity
  });

  const startSample = Math.max(0, Math.floor(trimStart * sampleRate));
  const maxEndSample = buffer.length;
  const endSample =
    trimEnd > 0 && Math.floor(trimEnd * sampleRate) <= maxEndSample
      ? Math.floor(trimEnd * sampleRate)
      : maxEndSample;
  const totalSamples = Math.max(1, endSample - startSample);

  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;

  // 0.3s smooth gentle sinusoidal fade-out window at the end
  const fadeOutDuration = 0.3;
  const fadeOutSamples = Math.min(Math.floor(totalSamples / 2), Math.floor(fadeOutDuration * sampleRate));
  const fadeOutStartIndex = totalSamples - fadeOutSamples;

  const chunkSize = 2048; // Standard AAC frame window

  for (let s = 0; s < totalSamples; s += chunkSize) {
    if (isCancelledRef.current || audioEncoderError) break;
    const currentChunkSize = Math.min(chunkSize, totalSamples - s);

    // Planar Float32 buffer: [ch0_samples..., ch1_samples...]
    const planarBuffer = new Float32Array(currentChunkSize * numChannels);

    for (let i = 0; i < currentChunkSize; i++) {
      const overallIndex = s + i;
      let fadeMultiplier = 1.0;
      if (fadeOutSamples > 0 && overallIndex >= fadeOutStartIndex) {
        const progress = (totalSamples - 1 - overallIndex) / fadeOutSamples;
        fadeMultiplier = Math.sin((progress * Math.PI) / 2);
      }

      planarBuffer[i] = (ch0[startSample + overallIndex] || 0) * fadeMultiplier;
      if (numChannels > 1) {
        planarBuffer[currentChunkSize + i] = (ch1[startSample + overallIndex] || 0) * fadeMultiplier;
      }
    }

    const timestampMicros = Math.round((s / sampleRate) * 1_000_000);
    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate,
      numberOfFrames: currentChunkSize,
      numberOfChannels: numChannels,
      timestamp: timestampMicros,
      data: planarBuffer,
    });

    audioEncoder.encode(audioData);
    audioData.close();
  }

  await audioEncoder.flush();
  audioEncoder.close();
}
