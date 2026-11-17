import { describe, it, expect } from 'vitest';
import { VideoExporter } from '../electron/exporter';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('VideoExporter', () => {
  it('instantiates cleanly and can resolve an existing ffmpeg binary', () => {
    const exporter = new VideoExporter();
    expect(exporter).toBeDefined();

    const resolvedPath = exporter.resolveFfmpegPath();
    expect(resolvedPath).toBeTruthy();
    expect(fs.existsSync(resolvedPath) || resolvedPath === 'ffmpeg').toBe(true);
  });

  it('cancel handles an idle exporter without error', () => {
    const exporter = new VideoExporter();
    expect(() => exporter.cancel()).not.toThrow();
  });

  it('supports setting drain backpressure callback', () => {
    const exporter = new VideoExporter();
    let drainCalled = false;
    exporter.setDrainCallback(() => {
      drainCalled = true;
    });
    expect((exporter as unknown as { onDrainCallback: unknown }).onDrainCallback).toBeDefined();
  });

  it('auto-creates destination directories that do not exist yet', () => {
    const exporter = new VideoExporter();
    const tempDir = path.join(os.tmpdir(), `wedding-test-${Date.now()}`, 'nested');
    const tempOut = path.join(tempDir, 'output.mp4');

    expect(fs.existsSync(tempDir)).toBe(false);

    // Call start with dummy options to trigger directory creation
    exporter.start(
      {
        outputPath: tempOut,
        audioPath: 'dummy.mp3',
        width: 1081, // Odd dimension test
        height: 1919, // Odd dimension test
        fps: 30,
        duration: 1,
        totalFrames: 30,
        trimStart: 0,
        trimEnd: 1,
        voiceBoost: false,
      },
      () => {},
      () => {},
      () => {}
    );

    // Directory must now exist
    expect(fs.existsSync(tempDir)).toBe(true);
    exporter.cancel();

    // Clean up
    fs.rmSync(path.dirname(tempDir), { recursive: true, force: true });
  });

  it('constructs correct FFmpeg flags for transparent Apple ProRes 4444 export', () => {
    const exporter = new VideoExporter();
    const args = exporter.buildFfmpegArgs(
      {
        outputPath: 'output.mov',
        audioPath: 'dummy.mp3',
        width: 1080,
        height: 1920,
        fps: 30,
        duration: 1,
        totalFrames: 30,
        trimStart: 0,
        trimEnd: 1,
        voiceBoost: false,
        format: 'prores',
        transparent: true,
      },
      1080,
      1920
    );

    // Must use PNG pipe for true RGBA alpha input
    expect(args).toContain('image2pipe');
    expect(args[args.indexOf('-vcodec') + 1]).toBe('png');

    // Must use prores_ks with profile 4 and yuva444p10le pixel format
    expect(args).toContain('prores_ks');
    expect(args).toContain('yuva444p10le');
    expect(args).toContain('pcm_s16le');
  });

  it('constructs correct FFmpeg flags for transparent WebM VP9 export', () => {
    const exporter = new VideoExporter();
    const args = exporter.buildFfmpegArgs(
      {
        outputPath: 'output.webm',
        audioPath: 'dummy.mp3',
        width: 1080,
        height: 1920,
        fps: 30,
        duration: 1,
        totalFrames: 30,
        trimStart: 0,
        trimEnd: 1,
        voiceBoost: false,
        format: 'webm',
        transparent: true,
      },
      1080,
      1920
    );

    expect(args[args.indexOf('-vcodec') + 1]).toBe('png');
    expect(args).toContain('libvpx-vp9');
    expect(args).toContain('yuva420p');
    expect(args).toContain('libopus');
  });

  it('omits -ss seek argument when trimStart is 0 (pre-trimmed audio protection)', () => {
    const exporter = new VideoExporter();
    const args = exporter.buildFfmpegArgs(
      {
        outputPath: 'output.mp4',
        audioPath: 'wedding_sequence_12345.wav',
        width: 1080,
        height: 1920,
        fps: 30,
        duration: 10,
        totalFrames: 300,
        trimStart: 0,
        trimEnd: 10,
        voiceBoost: false,
      },
      1080,
      1920
    );

    expect(args).not.toContain('-ss');
    expect(args).toContain('-t');
    expect(args[args.indexOf('-t') + 1]).toBe('10');
  });

  it('includes -ss seek argument when trimStart is greater than 0', () => {
    const exporter = new VideoExporter();
    const args = exporter.buildFfmpegArgs(
      {
        outputPath: 'output.mp4',
        audioPath: 'raw_recording.mp3',
        width: 1080,
        height: 1920,
        fps: 30,
        duration: 10,
        totalFrames: 300,
        trimStart: 4.5,
        trimEnd: 14.5,
        voiceBoost: false,
      },
      1080,
      1920
    );

    expect(args).toContain('-ss');
    expect(args[args.indexOf('-ss') + 1]).toBe('4.5');
  });
});

  it('performs real end-to-end video compilation with FFmpeg', async () => {
    const exporter = new VideoExporter();
    const tempDir = path.join(os.tmpdir(), `wedding-e2e-${Date.now()}`);
    const outPath = path.join(tempDir, 'test_export.mp4');
    const audioPath = path.resolve('src/assets/demo-audio.mp3');

    // Create a 1080x1920 test JPEG frame buffer using ffmpeg
    const framePath = path.join(tempDir, 'frame.jpg');
    fs.mkdirSync(tempDir, { recursive: true });
    
    const ffmpegBin = exporter.resolveFfmpegPath();
    const { execSync } = await import('node:child_process');
    execSync(`"${ffmpegBin}" -y -f lavfi -i color=c=0x1E1510:s=1080x1920 -frames:v 1 "${framePath}"`);
    const frameBuffer = fs.readFileSync(framePath);

    const exportPromise = new Promise<string>((resolve, reject) => {
      exporter.start(
        {
          outputPath: outPath,
          audioPath,
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 1,
          totalFrames: 30,
          trimStart: 0,
          trimEnd: 1,
          voiceBoost: false,
        },
        () => {},
        (finalPath) => resolve(finalPath),
        (err) => reject(new Error(err))
      );
    });

    // Write 30 frames
    for (let i = 0; i < 30; i++) {
      exporter.writeFrame(frameBuffer, () => {});
    }
    exporter.finish();

    const resultPath = await exportPromise;
    expect(fs.existsSync(resultPath)).toBe(true);

    const stats = fs.statSync(resultPath);
    expect(stats.size).toBeGreaterThan(1000); // Valid MP4 file generated

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  }, 15000);
