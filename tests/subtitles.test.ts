import { describe, it, expect } from 'vitest';
import {
  parseTimestampToSeconds,
  formatSecondsToSrtTimestamp,
  computeWordTimings,
  parseSrtOrVtt,
  parseWhisperJson,
  findActiveSubtitle,
} from '../src/engine/subtitleEngine';
import { drawSubtitles } from '../src/engine/visualizers/subtitleRenderer';
import { SubtitleConfig, DEFAULT_SUBTITLE_CONFIG } from '../src/types/studio';

function createMockCanvas(width: number, height: number) {
  const calls: string[] = [];
  const ctx = {
    canvas: { width, height },
    font: '10px sans-serif',
    textAlign: 'left',
    textBaseline: 'middle',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetY: 0,
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    moveTo: (x: number, y: number) => {
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error('NaN in moveTo');
    },
    arcTo: (x1: number, y1: number, x2: number, y2: number, r: number) => {
      if (Number.isNaN(x1) || Number.isNaN(y1) || Number.isNaN(x2) || Number.isNaN(y2) || Number.isNaN(r)) {
        throw new Error('NaN in arcTo');
      }
    },
    stroke: () => calls.push('stroke'),
    fill: () => calls.push('fill'),
    fillText: (text: string, x: number, y: number) => {
      if (Number.isNaN(x) || Number.isNaN(y)) throw new Error('NaN in fillText');
      calls.push(`fillText(${text})`);
    },
    measureText: (text: string) => ({
      width: text.length * 12,
    }),
  } as unknown as CanvasRenderingContext2D;

  return { ctx, calls };
}

describe('Speech Subtitles Engine & Karaoke Renderer (Roadmap #08)', () => {
  it('parses timestamps with comma and dot decimals correctly to seconds', () => {
    expect(parseTimestampToSeconds('00:01:23,456')).toBeCloseTo(83.456, 3);
    expect(parseTimestampToSeconds('00:00:05.200')).toBeCloseTo(5.2, 3);
    expect(parseTimestampToSeconds('02:15.500')).toBeCloseTo(135.5, 3);
  });

  it('formats seconds back into SRT timestamp strings accurately', () => {
    expect(formatSecondsToSrtTimestamp(83.456)).toBe('00:01:23,456');
    expect(formatSecondsToSrtTimestamp(5.2)).toBe('00:00:05,200');
  });

  it('computes word-level timings proportionally across segment duration', () => {
    const text = 'Congratulations Sarah and Michael';
    const words = computeWordTimings(text, 2.0, 6.0);

    expect(words.length).toBe(4);
    expect(words[0].word).toBe('Congratulations');
    expect(words[0].start).toBe(2.0);
    expect(words[words.length - 1].word).toBe('Michael');
    expect(words[words.length - 1].end).toBeLessThanOrEqual(6.01);
  });

  it('parses multi-segment SRT subtitle file with word timings', () => {
    const srtSample = `
1
00:00:01,000 --> 00:00:04,500
We love you so much!

2
00:00:05,200 --> 00:00:08,800
Happy wedding day from Latvia!
`;

    const segments = parseSrtOrVtt(srtSample);
    expect(segments.length).toBe(2);

    expect(segments[0].start).toBe(1.0);
    expect(segments[0].end).toBe(4.5);
    expect(segments[0].text).toBe('We love you so much!');
    expect(segments[0].words.length).toBe(5);

    expect(segments[1].start).toBe(5.2);
    expect(segments[1].end).toBe(8.8);
    expect(segments[1].text).toBe('Happy wedding day from Latvia!');
  });

  it('parses WebVTT file format seamlessly', () => {
    const vttSample = `WEBVTT

00:00:02.000 --> 00:00:05.000
Best wishes to the newlyweds!
`;

    const segments = parseSrtOrVtt(vttSample);
    expect(segments.length).toBe(1);
    expect(segments[0].start).toBe(2.0);
    expect(segments[0].end).toBe(5.0);
    expect(segments[0].text).toBe('Best wishes to the newlyweds!');
  });

  it('parses Whisper JSON structured output', () => {
    const jsonSample = JSON.stringify({
      segments: [
        {
          start: 0.5,
          end: 3.2,
          text: 'Cheers to forever!',
          words: [
            { word: 'Cheers', start: 0.5, end: 1.2 },
            { word: 'to', start: 1.3, end: 1.6 },
            { word: 'forever!', start: 1.7, end: 3.2 },
          ],
        },
      ],
    });

    const segments = parseWhisperJson(jsonSample);
    expect(segments.length).toBe(1);
    expect(segments[0].words.length).toBe(3);
    expect(segments[0].words[0].word).toBe('Cheers');
    expect(segments[0].words[2].word).toBe('forever!');
  });

  it('finds active subtitle segment and active word index at current playback time', () => {
    const text = 'Here is to a lifetime of joy';
    const words = computeWordTimings(text, 2.0, 5.0);
    const segments = [
      {
        id: '1',
        start: 2.0,
        end: 5.0,
        text,
        words,
      },
    ];

    // At 1.0s (before speech): none
    expect(findActiveSubtitle(segments, 1.0).activeSegment).toBeNull();

    // At 2.2s (first word): active segment with activeWordIndex = 0
    const active = findActiveSubtitle(segments, 2.2);
    expect(active.activeSegment).not.toBeNull();
    expect(active.activeWordIndex).toBe(0);

    // At 4.5s (late word): active word index should be near the end
    const late = findActiveSubtitle(segments, 4.5);
    expect(late.activeWordIndex).toBeGreaterThan(1);
  });

  it('drawSubtitles renders on Canvas across all subtitle styles without errors or NaN', () => {
    const { ctx } = createMockCanvas(1080, 1920);
    const words = computeWordTimings('Best wedding ever Sarah and Michael', 2.0, 6.0);
    const config: SubtitleConfig = {
      ...DEFAULT_SUBTITLE_CONFIG,
      enabled: true,
      segments: [
        {
          id: 'sub-1',
          start: 2.0,
          end: 6.0,
          text: 'Best wedding ever Sarah and Michael',
          words,
        },
      ],
    };

    const styles: SubtitleConfig['style'][] = [
      'karaoke-gold',
      'minimal-pill',
      'classic-serif',
      'cinematic-caps',
    ];

    for (const style of styles) {
      expect(() => {
        drawSubtitles(ctx, 1080, 1920, { ...config, style }, 3.5);
      }).not.toThrow();
    }
  });
});
