import { describe, it, expect } from 'vitest';
import {
  ASPECT_RATIOS,
  VISUALIZER_PRESETS,
  COLOR_OPTIONS,
  GRADIENT_PRESETS,
  AspectRatioPreset,
} from '../src/types/studio';

describe('Studio Configurations & Presets', () => {
  it('defines 9:16, 4:5, 1:1, and 16:9 aspect ratios correctly', () => {
    expect(ASPECT_RATIOS['9:16']).toEqual({
      id: '9:16',
      label: 'Story / Reel',
      width: 1080,
      height: 1920,
      subtitle: '9:16 Mobile Vertical',
    });

    expect(ASPECT_RATIOS['4:5']).toEqual({
      id: '4:5',
      label: 'Portrait Feed',
      width: 1080,
      height: 1350,
      subtitle: '4:5 Social Feed',
    });

    expect(ASPECT_RATIOS['1:1']).toEqual({
      id: '1:1',
      label: 'Square Post',
      width: 1080,
      height: 1080,
      subtitle: '1:1 Instagram Square',
    });

    expect(ASPECT_RATIOS['16:9']).toEqual({
      id: '16:9',
      label: 'Landscape',
      width: 1920,
      height: 1080,
      subtitle: '16:9 Widescreen / TV',
    });
  });

  it('includes centered wedding visualizers including 3 classic line styles', () => {
    const ids = VISUALIZER_PRESETS.map((p) => p.id);
    expect(ids).toContain('bars');
    expect(ids).toContain('wave');
    expect(ids).toContain('ring');
    expect(ids).toContain('mirror');
    expect(ids).toContain('particles');
    expect(ids).toContain('line_wave');
    expect(ids).toContain('line_mirror');
    expect(ids).toContain('line_horizon');
    expect(VISUALIZER_PRESETS.length).toBe(8);
  });

  it('contains wedding color options with valid hex codes', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    COLOR_OPTIONS.forEach((col) => {
      expect(col.name).toBeTruthy();
      expect(col.hex).toMatch(hexPattern);
    });
  });

  it('provides multi-stop cinematic gradient presets with valid color stops and CSS', () => {
    expect(GRADIENT_PRESETS.length).toBeGreaterThanOrEqual(4);
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    GRADIENT_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.previewCss).toContain('linear-gradient');
      expect(preset.stops.length).toBeGreaterThanOrEqual(2);
      preset.stops.forEach((stop) => {
        expect(stop.offset).toBeGreaterThanOrEqual(0);
        expect(stop.offset).toBeLessThanOrEqual(1);
        expect(stop.color).toMatch(hexPattern);
      });
    });
  });
});
