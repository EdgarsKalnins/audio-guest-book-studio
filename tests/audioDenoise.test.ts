import { describe, it, expect } from 'vitest';
import {
  removeDCOffset,
  applyHighPassFilter,
  applyPeakingFilter,
  applyNoiseGate,
  applySpeechClarifier,
} from '../src/engine/audioDenoise';

describe('Audio Denoise & Speech Clarifier DSP', () => {
  const sampleRate = 44100;

  // Helper: generates sine wave
  function generateSine(freq: number, durationSec: number, amplitude = 0.5): Float32Array {
    const totalSamples = Math.floor(sampleRate * durationSec);
    const buf = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      buf[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }
    return buf;
  }

  // Helper: calculates RMS
  function calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  it('removes DC offset completely from biased signal', () => {
    const biased = new Float32Array([0.5, 0.6, 0.4, 0.5, 0.5]);
    const cleaned = removeDCOffset(biased);

    let sum = 0;
    for (let i = 0; i < cleaned.length; i++) {
      sum += cleaned[i];
    }
    expect(Math.abs(sum)).toBeLessThan(1e-6);
  });

  it('heavily attenuates sub-80Hz mechanical rumble while preserving speech frequencies', () => {
    // 30Hz sub-rumble
    const rumble = generateSine(30, 0.2, 0.8);
    const filteredRumble = applyHighPassFilter(rumble, sampleRate, 80);
    const rumbleRmsBefore = calculateRMS(rumble);
    const rumbleRmsAfter = calculateRMS(filteredRumble);

    // 30Hz should be attenuated by more than 50%
    expect(rumbleRmsAfter).toBeLessThan(rumbleRmsBefore * 0.4);

    // 1000Hz vocal tone should pass through virtually unaffected
    const voice = generateSine(1000, 0.2, 0.8);
    const filteredVoice = applyHighPassFilter(voice, sampleRate, 80);
    const voiceRmsBefore = calculateRMS(voice);
    const voiceRmsAfter = calculateRMS(filteredVoice);

    expect(Math.abs(voiceRmsAfter - voiceRmsBefore)).toBeLessThan(0.02);
  });

  it('boosts 3.0kHz presence formant frequency', () => {
    const tone = generateSine(3000, 0.2, 0.5);
    const boosted = applyPeakingFilter(tone, sampleRate, 3000, 4.0);

    const rmsBefore = calculateRMS(tone);
    const rmsAfter = calculateRMS(boosted);

    // +4dB gain is approximately 1.58x amplitude
    expect(rmsAfter).toBeGreaterThan(rmsBefore * 1.3);
  });

  it('attenuates quiet background noise below noise gate threshold', () => {
    // Extremely quiet background hiss (-54dB -> ~0.002 amplitude)
    const silence = generateSine(400, 0.2, 0.002);
    const gated = applyNoiseGate(silence, sampleRate, -40);

    const rmsBefore = calculateRMS(silence);
    const rmsAfter = calculateRMS(gated.slice(Math.floor(sampleRate * 0.05))); // after gate closes

    expect(rmsAfter).toBeLessThan(rmsBefore * 0.3);
  });

  it('processes speech through the full clarifier pipeline safely without NaNs or overflows', () => {
    const mixed = generateSine(1200, 0.3, 0.4);
    // Add DC offset and low hum
    for (let i = 0; i < mixed.length; i++) {
      mixed[i] += 0.2 + 0.3 * Math.sin((2 * Math.PI * 40 * i) / sampleRate);
    }

    const output = applySpeechClarifier(mixed, sampleRate);
    expect(output.length).toBe(mixed.length);

    let hasNan = false;
    for (let i = 0; i < output.length; i++) {
      if (isNaN(output[i]) || !isFinite(output[i])) {
        hasNan = true;
        break;
      }
    }
    expect(hasNan).toBe(false);
  });

  it('handles empty input arrays gracefully', () => {
    const empty = new Float32Array(0);
    const res = applySpeechClarifier(empty, sampleRate);
    expect(res.length).toBe(0);
  });
});
