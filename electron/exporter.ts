import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

export interface ExportStartOptions {
  outputPath: string;
  audioPath: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  totalFrames: number;
  trimStart: number;
  trimEnd: number;
  voiceBoost: boolean;
  format?: 'mp4' | 'prores' | 'webm';
  transparent?: boolean;
}

export class VideoExporter {
  private ffmpegProcess: ChildProcessWithoutNullStreams | null = null;
  private currentOptions: ExportStartOptions | null = null;
  private frameCount = 0;
  private isCanceled = false;
  private onDrainCallback: (() => void) | null = null;
  public onSpawnCallback: ((proc: ChildProcessWithoutNullStreams) => void) | null = null;

  public resolveFfmpegPath(): string {
    // 1. Try bundled installer path
    if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
      return ffmpegInstaller.path;
    }
    // 2. Try common system paths on macOS / Linux
    const commonPaths = [
      '/opt/homebrew/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      '/usr/bin/ffmpeg',
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }
    return 'ffmpeg';
  }

  public setDrainCallback(cb: () => void) {
    this.onDrainCallback = cb;
  }

  public buildFfmpegArgs(options: ExportStartOptions, exportWidth: number, exportHeight: number): string[] {
    const isTransparent = Boolean(
      options.transparent ||
      options.format === 'prores' ||
      options.format === 'webm' ||
      options.outputPath.endsWith('.mov') ||
      options.outputPath.endsWith('.webm')
    );

    const inputPipeCodec = isTransparent ? 'png' : 'mjpeg';

    const audioArgs: string[] = [];
    if (options.trimStart > 0) {
      audioArgs.push('-ss', options.trimStart.toString());
    }
    if (options.duration > 0) {
      audioArgs.push('-t', options.duration.toString());
    }
    audioArgs.push('-i', options.audioPath);

    const audioFilterArgs: string[] = [];
    if (options.voiceBoost) {
      audioFilterArgs.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
    }

    let videoCodecArgs: string[];
    let audioCodecArgs: string[];

    if (options.format === 'prores' || options.outputPath.endsWith('.mov')) {
      // Apple ProRes 4444 with genuine 10-bit alpha for DaVinci Resolve, Premiere & Final Cut
      videoCodecArgs = [
        '-c:v', 'prores_ks',
        '-profile:v', '4',
        '-pix_fmt', 'yuva444p10le',
      ];
      audioCodecArgs = ['-c:a', 'pcm_s16le'];
    } else if (options.format === 'webm' || options.outputPath.endsWith('.webm')) {
      // Google VP9 with alpha channel
      videoCodecArgs = [
        '-c:v', 'libvpx-vp9',
        '-pix_fmt', 'yuva420p',
        '-b:v', '0',
        '-crf', '22',
      ];
      audioCodecArgs = ['-c:a', 'libopus', '-b:a', '128k'];
    } else {
      // Universal H.264 MP4
      videoCodecArgs = [
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-crf', '19',
      ];
      audioCodecArgs = ['-c:a', 'aac', '-b:a', '192k'];
    }

    return [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', inputPipeCodec,
      '-r', options.fps.toString(),
      '-s', `${exportWidth}x${exportHeight}`,
      '-i', 'pipe:0',
      ...audioArgs,
      ...audioFilterArgs,
      ...videoCodecArgs,
      ...audioCodecArgs,
      '-shortest',
      options.outputPath,
    ];
  }

  public start(
    options: ExportStartOptions,
    onProgress: (percent: number, frame: number) => void,
    onComplete: (outputPath: string) => void,
    onError: (err: string) => void
  ) {
    this.currentOptions = options;
    this.frameCount = 0;
    this.isCanceled = false;

    // Robustness 1: Ensure destination directory exists
    try {
      const outDir = path.dirname(options.outputPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
    } catch (dirErr: unknown) {
      const msg = dirErr instanceof Error ? dirErr.message : String(dirErr);
      onError(`Failed to create export directory: ${msg}`);
      return;
    }

    // Robustness 2: Enforce even pixel dimensions for H.264
    const exportWidth = options.width - (options.width % 2);
    const exportHeight = options.height - (options.height % 2);

    const ffmpegPath = this.resolveFfmpegPath();
    console.log('[Exporter] Using FFmpeg path:', ffmpegPath);

    const args = this.buildFfmpegArgs(options, exportWidth, exportHeight);
    console.log('[Exporter] Spawning FFmpeg with args:', args.join(' '));

    try {
      this.ffmpegProcess = spawn(ffmpegPath, args);
      if (this.onSpawnCallback) {
        this.onSpawnCallback(this.ffmpegProcess);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onError(`Failed to spawn FFmpeg: ${msg}`);
      return;
    }

    this.ffmpegProcess.stdin.on('error', (err) => {
      console.warn('[Exporter] stdin error (expected if aborted):', err.message);
    });

    // Handle backpressure drain
    this.ffmpegProcess.stdin.on('drain', () => {
      if (this.onDrainCallback) {
        this.onDrainCallback();
      }
    });

    let stderrBuffer = '';
    this.ffmpegProcess.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
      if (stderrBuffer.length > 2000) {
        stderrBuffer = stderrBuffer.substring(stderrBuffer.length - 2000);
      }
    });

    this.ffmpegProcess.on('close', (code) => {
      console.log(`[Exporter] FFmpeg process exited with code ${code}`);
      if (this.isCanceled) {
        onError('Export was cancelled by user');
        return;
      }
      if (code === 0) {
        onComplete(options.outputPath);
      } else {
        onError(`FFmpeg export failed (exit code ${code}): ${stderrBuffer.slice(-300)}`);
      }
      this.ffmpegProcess = null;
    });

    this.ffmpegProcess.on('error', (err) => {
      onError(`FFmpeg process error: ${err.message}`);
      this.ffmpegProcess = null;
    });
  }

  public writeFrame(chunk: Buffer, onProgress: (percent: number, frame: number) => void): boolean {
    if (!this.ffmpegProcess || !this.ffmpegProcess.stdin.writable || this.isCanceled) {
      return false;
    }

    this.frameCount++;
    const total = this.currentOptions?.totalFrames || 1;
    const pct = Math.min(99, Math.round((this.frameCount / total) * 100));
    onProgress(pct, this.frameCount);

    return this.ffmpegProcess.stdin.write(chunk);
  }

  public finish() {
    if (this.ffmpegProcess && this.ffmpegProcess.stdin.writable) {
      this.ffmpegProcess.stdin.end();
    }
  }

  public cancel() {
    this.isCanceled = true;
    if (this.ffmpegProcess) {
      try {
        this.ffmpegProcess.kill('SIGKILL');
      } catch {
        // Ignored
      }
      this.ffmpegProcess = null;
    }
  }
}
