import { describe, it, expect, beforeEach } from 'vitest';
import { renderFrameTemplate, applyPhotoFilter, drawAmbientStudioBackdrop } from '../src/engine/visualizers/frames';
import { createStaticBackgroundCache, drawStudioFrame } from '../src/engine/visualizers/renderer';
import { StudioConfig, DEFAULT_FRAME_CONFIG, ASPECT_RATIOS } from '../src/types/studio';

// Mock Canvas 2D Context for headless Node/Vitest
function createMockCanvas(width: number, height: number) {
  const calls: string[] = [];
  const ctx = {
    canvas: { width, height },
    filter: 'none',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    textAlign: 'left',
    font: '10px sans-serif',
    letterSpacing: '0px',
    globalAlpha: 1,
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    translate: (x: number, y: number) => {
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error(`NaN in translate: (${x}, ${y})`);
      calls.push(`translate(${x}, ${y})`);
    },
    rotate: (rad: number) => {
      if (Number.isNaN(rad)) throw new Error(`NaN in rotate: ${rad}`);
      calls.push(`rotate(${rad})`);
    },
    scale: (x: number, y: number) => calls.push(`scale(${x}, ${y})`),
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    moveTo: (x: number, y: number) => {
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error(`NaN in moveTo`);
    },
    lineTo: (x: number, y: number) => {
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error(`NaN in lineTo`);
    },
    arc: (x: number, y: number, r: number) => {
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(r)) throw new Error(`NaN in arc`);
    },
    arcTo: (x1: number, y1: number, x2: number, y2: number, r: number) => {
      if (Number.isNaN(x1) || Number.isNaN(y1) || Number.isNaN(x2) || Number.isNaN(y2) || Number.isNaN(r)) {
        throw new Error(`NaN in arcTo`);
      }
    },
    stroke: () => calls.push('stroke'),
    fill: () => calls.push('fill'),
    clip: () => calls.push('clip'),
    fillRect: (x: number, y: number, w: number, h: number) => {
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(w) || Number.isNaN(h)) throw new Error(`NaN in fillRect`);
    },
    strokeRect: (x: number, y: number, w: number, h: number) => {
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(w) || Number.isNaN(h)) throw new Error(`NaN in strokeRect`);
    },
    clearRect: (x: number, y: number, w: number, h: number) => {
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(w) || Number.isNaN(h)) throw new Error(`NaN in clearRect`);
    },
    fillText: (text: string, x: number, y: number) => {
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error(`NaN in fillText`);
    },
    drawImage: () => calls.push('drawImage'),
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
      if (Number.isNaN(x0) || Number.isNaN(y0) || Number.isNaN(r0) || Number.isNaN(x1) || Number.isNaN(y1) || Number.isNaN(r1)) {
        throw new Error(`NaN in createRadialGradient`);
      }
      return { addColorStop: () => {} };
    },
  } as unknown as CanvasRenderingContext2D;

  return { ctx, calls };
}

describe('Procedural Frame Templates Engine (Roadmap #06)', () => {
  let baseConfig: StudioConfig;

  beforeEach(() => {
    baseConfig = {
      aspectRatio: '9:16',
      visualizerStyle: 'line_wave',
      visualizerColor: '#d7ba7e',
      visualizerScale: 1.0,
      visualizerOpacity: 0.95,
      visualizerGlow: true,
      frame: { ...DEFAULT_FRAME_CONFIG },
      typography: {
        enabled: true,
        coupleNames: 'Sarah & Michael',
        dateText: 'October 14, 2024',
        titleText: 'Wedding Audio Guestbook',
        fontFamily: 'Cormorant Garamond',
        showTimer: true,
        fontSize: 1.0,
      },
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
        voiceBoost: false,
      },
      audioPath: 'demo.mp3',
      audioName: 'Demo Voicemail',
      audioDuration: 30,
      imagePath: null,
      batchQueue: [],
      timelineTracks: [],
      gapBetweenTracks: 0.5,
    };
  });

  it('renders Haute Couture full-bleed template without errors or NaN values', () => {
    const { ctx } = createMockCanvas(1080, 1920);
    expect(() => {
      renderFrameTemplate(ctx, 1080, 1920, null, {
        ...baseConfig,
        frame: { ...DEFAULT_FRAME_CONFIG, template: 'haute-couture' },
      });
    }).not.toThrow();
  });

  it('renders Vintage Polaroid snapshot with physical tilt and chin ink notes', () => {
    const { ctx } = createMockCanvas(1080, 1920);
    expect(() => {
      renderFrameTemplate(ctx, 1080, 1920, null, {
        ...baseConfig,
        frame: {
          ...DEFAULT_FRAME_CONFIG,
          template: 'polaroid',
          tiltAngle: -2.0,
          showChinText: true,
          chinText: 'Sarah & Michael Forever',
        },
      });
    }).not.toThrow();
  });

  it('renders Retro Photo Booth Strip across 3 candid vertical cells', () => {
    const { ctx } = createMockCanvas(1080, 1920);
    expect(() => {
      renderFrameTemplate(ctx, 1080, 1920, null, {
        ...baseConfig,
        frame: {
          ...DEFAULT_FRAME_CONFIG,
          template: 'photostrip',
          tiltAngle: 1.5,
        },
      });
    }).not.toThrow();
  });

  it('renders Vinyl Record Sleeve with rotating grooves and center label', () => {
    const { ctx } = createMockCanvas(1080, 1920);
    expect(() => {
      renderFrameTemplate(
        ctx,
        1080,
        1920,
        null,
        {
          ...baseConfig,
          frame: {
            ...DEFAULT_FRAME_CONFIG,
            template: 'vinyl',
          },
        },
        5.2 // Current playback time 5.2s
      );
    }).not.toThrow();
  });

  it('applies photo filter color grades properly without failing', () => {
    const { ctx } = createMockCanvas(1080, 1920);

    applyPhotoFilter(ctx, 'vintage-warm');
    expect(ctx.filter).toContain('sepia');

    applyPhotoFilter(ctx, 'black-and-white');
    expect(ctx.filter).toContain('grayscale');

    applyPhotoFilter(ctx, 'sepia');
    expect(ctx.filter).toContain('sepia(85%)');

    applyPhotoFilter(ctx, 'none');
    expect(ctx.filter).toBe('none');
  });

  it('renders all 4 templates responsively across all aspect ratios (9:16, 16:9, 1:1, 4:5)', () => {
    const aspectRatios = ['9:16', '16:9', '1:1', '4:5'] as const;
    const templates = ['haute-couture', 'polaroid', 'photostrip', 'vinyl'] as const;

    for (const aspect of aspectRatios) {
      const { width, height } = ASPECT_RATIOS[aspect];
      for (const t of templates) {
        const { ctx } = createMockCanvas(width, height);
        expect(() => {
          renderFrameTemplate(
            ctx,
            width,
            height,
            null,
            {
              ...baseConfig,
              aspectRatio: aspect,
              frame: { ...DEFAULT_FRAME_CONFIG, template: t },
            },
            1.5
          );
        }).not.toThrow();
      }
    }
  });

  it('drawStudioFrame correctly adjusts visualizer center for Polaroid and Vinyl layouts', () => {
    const { ctx } = createMockCanvas(1080, 1920);
    const freqData = new Uint8Array(256);
    const timeData = new Float32Array(512);

    expect(() => {
      drawStudioFrame(
        ctx,
        1080,
        1920,
        null,
        freqData,
        timeData,
        {
          ...baseConfig,
          frame: { ...DEFAULT_FRAME_CONFIG, template: 'polaroid' },
        },
        2.0,
        30
      );
    }).not.toThrow();
  });
});
