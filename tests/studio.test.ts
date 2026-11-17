import { describe, it, expect } from 'vitest';
import {
  ASPECT_RATIOS,
  VISUALIZER_PRESETS,
  COLOR_OPTIONS,
  AspectRatioPreset,
} from '../src/types/studio';

describe('Studio Configurations & Presets', () => {
  it('defines 9:16, 1:1, and 16:9 aspect ratios correctly', () => {
    expect(ASPECT_RATIOS['9:16']).toEqual({
      id: '9:16',
      label: 'Story / Reel',
      width: 1080,
      height: 1920,
      subtitle: '9:16 Mobile Vertical',
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
});
