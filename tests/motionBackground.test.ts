import { describe, it, expect } from 'vitest';
import {
  renderCandlelightBokeh,
  renderVintageFilmGrain,
  renderStardustDrift,
  renderVideoFrame,
  renderMotionBackground,
} from '../src/engine/visualizers/motionBackground';
import { StudioConfig, DEFAULT_FRAME_CONFIG, DEFAULT_MOTION_CONFIG } from '../src/types/studio';

function createMockCanvas(width: number, height: number) {
  const calls: string[] = [];
  const ctx = {
    canvas: { width, height },
    globalCompositeOperation: 'source-over',
    filter: 'none',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    arc: (x: number, y: number, r: number) => {
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(r)) throw new Error('NaN in arc');
      calls.push(`arc(${x},${y},${r})`);
    },
    moveTo: (x: number, y: number) => {
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error('NaN in moveTo');
    },
    lineTo: (x: number, y: number) => {
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error('NaN in lineTo');
    },
    stroke: () => calls.push('stroke'),
    fill: () => calls.push('fill'),
    fillRect: (x: number, y: number, w: number, h: number) => {
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(w) || Number.isNaN(h)) {
        throw new Error('NaN in fillRect');
      }
      calls.push('fillRect');
    },
    drawImage: () => calls.push('drawImage'),
    createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
      if (
        Number.isNaN(x0) ||
        Number.isNaN(y0) ||
        Number.isNaN(r0) ||
        Number.isNaN(x1) ||
        Number.isNaN(y1) ||
        Number.isNaN(r1)
      ) {
        throw new Error('NaN in createRadialGradient');
      }
      return { addColorStop: () => {} };
    },
  } as unknown as CanvasRenderingContext2D;

  return { ctx, calls };
}

describe('Procedural Motion & B-Roll Shaders (Roadmap #07)', () => {
  it('renders Candlelight Bokeh orbs smoothly without NaN coordinates', () => {
    const { ctx } = createMockCanvas(1080, 1920);

    expect(() => {
      renderCandlelightBokeh(ctx, 1080, 1920, 0, 0.8, 1.0);
      renderCandlelightBokeh(ctx, 1080, 1920, 5.5, 0.8, 1.0);
      renderCandlelightBokeh(ctx, 1080, 1920, 25.0, 1.0, 1.5);
    }).not.toThrow();
  });

  it('renders Vintage 8mm Film Dust & Grain without errors', () => {
    const { ctx } = createMockCanvas(1080, 1920);

    expect(() => {
      renderVintageFilmGrain(ctx, 1080, 1920, 0.1, 0.8);
      renderVintageFilmGrain(ctx, 1080, 1920, 3.4, 1.0);
      renderVintageFilmGrain(ctx, 1080, 1920, 12.8, 0.5);
    }).not.toThrow();
  });

  it('renders Stardust Drift with voice amplitude reactivity', () => {
    const { ctx } = createMockCanvas(1080, 1920);

    expect(() => {
      // Voice at rest
      renderStardustDrift(ctx, 1080, 1920, 1.0, 0.8, 1.0, 0);
      // Voice active
      renderStardustDrift(ctx, 1080, 1920, 1.5, 0.8, 1.0, 180);
    }).not.toThrow();
  });

  it('synchronizes and draws HTMLVideoElement frame in cover aspect ratio', () => {
    const { ctx, calls } = createMockCanvas(1080, 1920);
    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      duration: 8.0,
      currentTime: 0,
      readyState: 4,
    } as unknown as HTMLVideoElement;

    expect(() => {
      renderVideoFrame(ctx, 1080, 1920, mockVideo, 10.5, 8.0);
    }).not.toThrow();

    // Verify currentTime was looped (10.5 % 8.0 = 2.5)
    expect(mockVideo.currentTime).toBeCloseTo(2.5, 1);
    expect(calls).toContain('drawImage');
  });

  it('master dispatcher safely handles all presets and disabled state', () => {
    const { ctx } = createMockCanvas(1080, 1920);

    // Disabled preset
    expect(() => {
      renderMotionBackground(ctx, 1080, 1920, { ...DEFAULT_MOTION_CONFIG, preset: 'none' }, 2.0);
    }).not.toThrow();

    // Bokeh preset
    expect(() => {
      renderMotionBackground(
        ctx,
        1080,
        1920,
        { ...DEFAULT_MOTION_CONFIG, preset: 'candlelight-bokeh', speed: 1.2, intensity: 0.9 },
        3.5
      );
    }).not.toThrow();

    // Film dust preset
    expect(() => {
      renderMotionBackground(
        ctx,
        1080,
        1920,
        { ...DEFAULT_MOTION_CONFIG, preset: 'vintage-film-dust' },
        4.0
      );
    }).not.toThrow();

    // Stardust drift preset
    expect(() => {
      renderMotionBackground(
        ctx,
        1080,
        1920,
        { ...DEFAULT_MOTION_CONFIG, preset: 'stardust-drift' },
        4.5,
        120
      );
    }).not.toThrow();
  });
});
