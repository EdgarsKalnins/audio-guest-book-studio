/**
 * Audio Denoise & Speech Clarifier DSP Engine
 * 100% Offline & Zero-Telemetry:
 * - 2nd-Order Butterworth High-Pass Filter (80Hz) eliminates AC mains hum (50/60Hz) and handling rumble.
 * - Formant Presence Peaking EQ (+3.5dB at 3.0kHz) restores speech intimacy and intelligibility.
 * - Dynamic Noise Gate with smooth attack/release hysteresis mutes room chatter and microphone hiss in silent pauses.
 * - DC offset normalization to prevent asymmetric clipping.
 */

export interface SpeechClarifierOptions {
  enabled: boolean;
  highPassCutoffHz: number; // default: 80
  presenceCenterHz: number; // default: 3000
  presenceGainDb: number; // default: 3.5
  noiseGateThresholdDb: number; // default: -42
  noiseGateHysteresisDb: number; // default: 4
}

export const DEFAULT_CLARIFIER_OPTIONS: SpeechClarifierOptions = {
  enabled: true,
  highPassCutoffHz: 80,
  presenceCenterHz: 3000,
  presenceGainDb: 3.5,
  noiseGateThresholdDb: -42,
  noiseGateHysteresisDb: 4,
};

/**
 * Removes DC bias/offset from audio samples.
 */
export function removeDCOffset(input: Float32Array): Float32Array {
  const n = input.length;
  if (n === 0) return new Float32Array(0);

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += input[i];
  }
  const mean = sum / n;

  const output = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    output[i] = input[i] - mean;
  }
  return output;
}

/**
 * 2nd-order Butterworth High-Pass Filter.
 * Cuts sub-bass rumble, DC offset, and 50Hz/60Hz electrical hum.
 */
export function applyHighPassFilter(
  input: Float32Array,
  sampleRate: number,
  cutoffHz = 80,
  q = 0.7071
): Float32Array {
  const n = input.length;
  if (n === 0) return new Float32Array(0);

  const omega = (2 * Math.PI * cutoffHz) / sampleRate;
  const alpha = Math.sin(omega) / (2 * q);
  const cosW = Math.cos(omega);

  const b0 = (1 + cosW) / 2;
  const b1 = -(1 + cosW);
  const b2 = (1 + cosW) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosW;
  const a2 = 1 - alpha;

  // Normalized coefficients
  const nb0 = b0 / a0;
  const nb1 = b1 / a0;
  const nb2 = b2 / a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;

  const output = new Float32Array(n);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;

  for (let i = 0; i < n; i++) {
    const x0 = input[i];
    const y0 = nb0 * x0 + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    output[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }

  return output;
}

/**
 * Peaking Parametric EQ filter (presence boost at 2.5kHz - 3.5kHz).
 * Enhances vintage phone vocal clarity and consonant articulation.
 */
export function applyPeakingFilter(
  input: Float32Array,
  sampleRate: number,
  centerFreqHz = 3000,
  gainDb = 3.5,
  q = 1.414
): Float32Array {
  const n = input.length;
  if (n === 0) return new Float32Array(0);

  const A = Math.pow(10, gainDb / 40);
  const omega = (2 * Math.PI * centerFreqHz) / sampleRate;
  const alpha = Math.sin(omega) / (2 * q);
  const cosW = Math.cos(omega);

  const b0 = 1 + alpha * A;
  const b1 = -2 * cosW;
  const b2 = 1 - alpha * A;
  const a0 = 1 + alpha / A;
  const a1 = -2 * cosW;
  const a2 = 1 - alpha / A;

  const nb0 = b0 / a0;
  const nb1 = b1 / a0;
  const nb2 = b2 / a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;

  const output = new Float32Array(n);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;

  for (let i = 0; i < n; i++) {
    const x0 = input[i];
    const y0 = nb0 * x0 + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    output[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }

  return output;
}

/**
 * Dynamic Noise Gate with smooth envelope and hysteresis.
 * Mutes silent pauses and background mic hiss without chopping word endings.
 */
export function applyNoiseGate(
  input: Float32Array,
  sampleRate: number,
  thresholdDb = -42,
  hysteresisDb = 4
): Float32Array {
  const n = input.length;
  if (n === 0) return new Float32Array(0);

  const openThreshold = Math.pow(10, thresholdDb / 20);
  const closeThreshold = Math.pow(10, (thresholdDb - hysteresisDb) / 20);

  // Attack: 5ms, Release: 80ms
  const attackAlpha = Math.exp(-1 / (0.005 * sampleRate));
  const releaseAlpha = Math.exp(-1 / (0.08 * sampleRate));

  const output = new Float32Array(n);
  let isOpen = false;
  let envelopeGain = 0;
  let rmsTracker = 0;
  const rmsWindow = Math.max(1, Math.floor(sampleRate * 0.01)); // 10ms window

  for (let i = 0; i < n; i++) {
    const sample = input[i];
    const absVal = Math.abs(sample);
    // Simple 1-pole RMS tracker
    rmsTracker = 0.99 * rmsTracker + 0.01 * absVal;

    // Hysteresis decision
    if (!isOpen && rmsTracker >= openThreshold) {
      isOpen = true;
    } else if (isOpen && rmsTracker < closeThreshold) {
      isOpen = false;
    }

    const targetGain = isOpen ? 1.0 : 0.0;
    const alpha = targetGain > envelopeGain ? attackAlpha : releaseAlpha;
    envelopeGain = alpha * envelopeGain + (1 - alpha) * targetGain;

    output[i] = sample * envelopeGain;
  }

  return output;
}

/**
 * Full Offline Multi-Stage Voice Clarifier Pipeline.
 */
export function applySpeechClarifier(
  input: Float32Array,
  sampleRate: number,
  options: Partial<SpeechClarifierOptions> = {}
): Float32Array {
  const opts = { ...DEFAULT_CLARIFIER_OPTIONS, ...options };
  if (!opts.enabled || input.length === 0) {
    return new Float32Array(input);
  }

  // Stage 1: DC offset removal
  let samples = removeDCOffset(input);

  // Stage 2: 80Hz High-Pass Rumble & Hum Filter
  samples = applyHighPassFilter(samples, sampleRate, opts.highPassCutoffHz);

  // Stage 3: Formant Presence Clarity Boost (3.0kHz)
  samples = applyPeakingFilter(
    samples,
    sampleRate,
    opts.presenceCenterHz,
    opts.presenceGainDb
  );

  // Stage 4: Dynamic Noise Gate
  samples = applyNoiseGate(
    samples,
    sampleRate,
    opts.noiseGateThresholdDb,
    opts.noiseGateHysteresisDb
  );

  return samples;
}

/**
 * Real-time Web Audio API node graph for live playback in AudioEngine.
 */
export function createSpeechClarifierNodes(
  ctx: AudioContext,
  options: Partial<SpeechClarifierOptions> = {}
): {
  inputNode: AudioNode;
  outputNode: AudioNode;
  setEnabled: (enabled: boolean) => void;
  setSensitivity: (sensitivity: number) => void;
} {
  const opts = { ...DEFAULT_CLARIFIER_OPTIONS, ...options };

  // 1. 80Hz High-Pass Filter Node
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = opts.highPassCutoffHz;
  highpass.Q.value = 0.7071;

  // 2. Presence Peaking EQ Node
  const peaking = ctx.createBiquadFilter();
  peaking.type = 'peaking';
  peaking.frequency.value = opts.presenceCenterHz;
  peaking.gain.value = opts.presenceGainDb;
  peaking.Q.value = 1.414;

  // 3. Dynamic Compressor for speech leveling
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -28;
  compressor.knee.value = 10;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.2;

  // Dry / Wet crossfade
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const input = ctx.createGain();
  const output = ctx.createGain();

  // Connect Dry path
  input.connect(dryGain);
  dryGain.connect(output);

  // Connect Wet path
  input.connect(highpass);
  highpass.connect(peaking);
  peaking.connect(compressor);
  compressor.connect(wetGain);
  wetGain.connect(output);

  const applyState = (enabled: boolean) => {
    const t = ctx.currentTime;
    if (enabled) {
      dryGain.gain.setValueAtTime(0, t);
      wetGain.gain.setValueAtTime(1, t);
    } else {
      dryGain.gain.setValueAtTime(1, t);
      wetGain.gain.setValueAtTime(0, t);
    }
  };

  applyState(opts.enabled);

  return {
    inputNode: input,
    outputNode: output,
    setEnabled: (enabled: boolean) => applyState(enabled),
    setSensitivity: (sens: number) => {
      // Scale presence gain between +1.5dB and +6dB based on sensitivity (0 to 1)
      const clamped = Math.max(0, Math.min(1, sens));
      peaking.gain.value = 1.5 + clamped * 4.5;
    },
  };
}
