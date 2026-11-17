import { describe, it, expect } from 'vitest';
import { computeFFT } from '../src/engine/fft';

describe('Fast Fourier Transform (computeFFT)', () => {
  it('returns an array of 256 frequency bins with values in [0, 255]', () => {
    const samples = new Float32Array(512);
    // Silence
    const result = computeFFT(samples);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(256);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(255);
    }
  });

  it('detects a pure tone and places peak in the expected frequency bin', () => {
    const N = 512;
    const samples = new Float32Array(N);
    // Generate a tone that completes exactly 16 cycles in 512 samples -> should peak around bin 16
    const targetCycle = 16;
    for (let i = 0; i < N; i++) {
      samples[i] = Math.sin((2 * Math.PI * targetCycle * i) / N);
    }

    const spectrum = computeFFT(samples);
    
    // Find the bin with the highest magnitude
    let maxBin = 0;
    let maxVal = 0;
    for (let i = 0; i < spectrum.length; i++) {
      if (spectrum[i] > maxVal) {
        maxVal = spectrum[i];
        maxBin = i;
      }
    }

    expect(Math.abs(maxBin - targetCycle)).toBeLessThanOrEqual(1);
    expect(maxVal).toBeGreaterThan(150); // Strong peak
  });

  it('handles partial sample arrays shorter than 512 without throwing', () => {
    const shortSamples = new Float32Array(128);
    shortSamples.fill(0.5);
    const result = computeFFT(shortSamples);
    expect(result.length).toBe(256);
  });
});
