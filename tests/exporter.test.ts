import { describe, it, expect } from 'vitest';
import { VideoExporter } from '../electron/exporter';
import fs from 'node:fs';

describe('VideoExporter', () => {
  it('instantiates cleanly and can resolve an existing ffmpeg binary', () => {
    const exporter = new VideoExporter();
    expect(exporter).toBeDefined();

    // Access private resolveFfmpegPath via prototype or cast
    const resolvedPath = (exporter as unknown as { resolveFfmpegPath: () => string }).resolveFfmpegPath();
    expect(resolvedPath).toBeTruthy();
    expect(fs.existsSync(resolvedPath) || resolvedPath === 'ffmpeg').toBe(true);
  });

  it('cancel handles an idle exporter without error', () => {
    const exporter = new VideoExporter();
    expect(() => exporter.cancel()).not.toThrow();
  });
});
