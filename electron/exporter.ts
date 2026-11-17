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
}

export class VideoExporter {
  private ffmpegProcess: ChildProcessWithoutNullStreams | null = null;
  private currentOptions: ExportStartOptions | null = null;
  private frameCount = 0;
  private isCanceled = false;

  private resolveFfmpegPath(): string {
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

  public start(
    options: ExportStartOptions,
    onProgress: (percent: number, frame: number) => void,
    onComplete: (outputPath: string) => void,
    onError: (err: string) => void
  ) {
    this.currentOptions = options;
    this.frameCount = 0;
    this.isCanceled = false;

    const ffmpegPath = this.resolveFfmpegPath();
    console.log('[Exporter] Using FFmpeg path:', ffmpegPath);

    // Audio arguments: trimming
    const audioArgs: string[] = [];
    if (options.trimStart > 0) {
      audioArgs.push('-ss', options.trimStart.toString());
    }
    const effEnd = options.trimEnd > 0 ? options.trimEnd : options.duration;
    if (effEnd > options.trimStart) {
      audioArgs.push('-to', effEnd.toString());
    }
    audioArgs.push('-i', options.audioPath);

    // Audio filter: Voice Boost volume normalization
    const audioFilterArgs: string[] = [];
    if (options.voiceBoost) {
      audioFilterArgs.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
    }

    const args = [
      '-y',
      // Video input from stdin pipe
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-r', options.fps.toString(),
      '-i', 'pipe:0',
      // Audio input
      ...audioArgs,
      ...audioFilterArgs,
      // Video encoding settings
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
      '-crf', '19',
      // Audio encoding
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      options.outputPath,
    ];

    console.log('[Exporter] Spawning FFmpeg with args:', args.join(' '));

    try {
      this.ffmpegProcess = spawn(ffmpegPath, args);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onError(`Failed to spawn FFmpeg: ${msg}`);
      return;
    }

    this.ffmpegProcess.stdin.on('error', (err) => {
      console.warn('[Exporter] stdin error (expected if aborted):', err.message);
    });

    let stderrBuffer = '';
    this.ffmpegProcess.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
      // Keep last 1000 chars of stderr for diagnostics
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
