/**
 * Utility to concatenate multiple AudioBuffers into a single continuous timeline
 * and export an AudioBuffer as a standard 16-bit PCM WAV.
 */
import { applySpeechClarifier } from './audioDenoise';

export interface SequencedTrack {
  id: string;
  name: string;
  path: string;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface ConcatenateOptions {
  greetingBuffer?: AudioBuffer | null;
  greetingName?: string;
  includeBeep?: boolean;
}

/**
 * Scans an AudioBuffer evaluating RMS energy blocks to detect exact speech boundaries.
 * Automatically avoids clipping initial consonants or trailing voice breaths.
 */
export function detectSpeechBoundaries(
  buffer: AudioBuffer,
  thresholdDb = -45,
  paddingSec = 0.08
): { speechStart: number; speechEnd: number } {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const totalSamples = buffer.length;
  const duration = buffer.duration;

  if (totalSamples === 0 || duration <= 0) {
    return { speechStart: 0, speechEnd: 0 };
  }

  const thresholdLinear = Math.pow(10, thresholdDb / 20);
  const blockSize = Math.max(1, Math.floor(sampleRate * 0.02)); // 20ms blocks
  const numBlocks = Math.floor(totalSamples / blockSize);

  let firstSpeechBlock = -1;
  let lastSpeechBlock = -1;

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  for (let b = 0; b < numBlocks; b++) {
    const startIdx = b * blockSize;
    const endIdx = Math.min(totalSamples, startIdx + blockSize);
    let sumSquares = 0;
    const count = endIdx - startIdx;

    for (let i = startIdx; i < endIdx; i++) {
      let maxSample = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        const val = Math.abs(channels[ch][i]);
        if (val > maxSample) maxSample = val;
      }
      sumSquares += maxSample * maxSample;
    }

    const rms = Math.sqrt(sumSquares / count);

    if (rms >= thresholdLinear) {
      if (firstSpeechBlock === -1) {
        firstSpeechBlock = b;
      }
      lastSpeechBlock = b;
    }
  }

  if (firstSpeechBlock === -1 || lastSpeechBlock === -1) {
    return { speechStart: 0, speechEnd: duration };
  }

  const rawStart = (firstSpeechBlock * blockSize) / sampleRate;
  const rawEnd = Math.min(duration, ((lastSpeechBlock + 1) * blockSize) / sampleRate);

  const speechStart = Math.max(0, rawStart - paddingSec);
  const speechEnd = Math.min(duration, rawEnd + paddingSec);

  return { speechStart, speechEnd };
}

/**
 * Synthesizes an authentic 800Hz vintage telephone prompt BEEP tone.
 */
export function generateTelephoneBeep(
  ctx: AudioContext,
  frequency = 800,
  durationSec = 0.3
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channel = buffer.getChannelData(0);

  const rampSamples = Math.floor(sampleRate * 0.01); // 10ms smooth ramp

  for (let i = 0; i < numSamples; i++) {
    let env = 1.0;
    if (i < rampSamples) {
      env = i / rampSamples;
    } else if (i > numSamples - rampSamples) {
      env = (numSamples - i) / rampSamples;
    }
    channel[i] = 0.45 * env * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }

  return buffer;
}

export function concatenateAudioBuffers(
  ctx: AudioContext,
  buffers: AudioBuffer[],
  gapSeconds = 0.5,
  options?: ConcatenateOptions
): { masterBuffer: AudioBuffer; tracks: SequencedTrack[] } {
  if (buffers.length === 0 && !options?.greetingBuffer) {
    throw new Error('No audio buffers provided for sequence');
  }

  const allBuffers: AudioBuffer[] = [];
  const trackLabels: string[] = [];

  // 1. Prepend couple's greeting audio if provided
  if (options?.greetingBuffer) {
    allBuffers.push(options.greetingBuffer);
    trackLabels.push(options.greetingName || 'Outgoing Greeting');

    // Add vintage 800Hz telephone beep
    if (options.includeBeep !== false) {
      const beepBuffer = generateTelephoneBeep(ctx, 800, 0.3);
      allBuffers.push(beepBuffer);
      trackLabels.push('Telephone Prompt Beep');
    }
  }

  // 2. Append guest recordings
  for (let i = 0; i < buffers.length; i++) {
    allBuffers.push(buffers[i]);
    trackLabels.push(`Guest Recording #${i + 1}`);
  }

  // Find sample rate and max channel count
  const sampleRate = allBuffers[0].sampleRate;
  let numChannels = 1;
  for (const b of allBuffers) {
    if (b.numberOfChannels > numChannels) {
      numChannels = b.numberOfChannels;
    }
  }

  // Calculate track timings and total duration
  let currentTime = 0;
  const tracks: SequencedTrack[] = [];

  for (let i = 0; i < allBuffers.length; i++) {
    const b = allBuffers[i];
    const dur = b.duration;
    const start = currentTime;
    const end = start + dur;

    tracks.push({
      id: `track-${i}-${Date.now()}`,
      name: trackLabels[i] || `Track ${i + 1}`,
      path: '',
      duration: dur,
      startTime: start,
      endTime: end,
    });

    // Spacing: standard gap between tracks, 0.25s after beep
    const isBeep = trackLabels[i] === 'Telephone Prompt Beep';
    const isGreeting = trackLabels[i].includes('Greeting');
    const interTrackGap = isBeep ? 0.3 : isGreeting ? 0.2 : gapSeconds;

    currentTime = end + (i < allBuffers.length - 1 ? interTrackGap : 0);
  }

  const totalDuration = currentTime;
  const totalSamples = Math.max(1, Math.ceil(totalDuration * sampleRate));

  const masterBuffer = ctx.createBuffer(numChannels, totalSamples, sampleRate);

  // Copy each buffer's samples into the master buffer
  for (let i = 0; i < allBuffers.length; i++) {
    const b = allBuffers[i];
    const trackInfo = tracks[i];
    const startSample = Math.floor(trackInfo.startTime * sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const srcCh = Math.min(ch, b.numberOfChannels - 1);
      const srcData = b.getChannelData(srcCh);
      const destData = masterBuffer.getChannelData(ch);

      const copyLen = Math.min(srcData.length, totalSamples - startSample);
      for (let s = 0; s < copyLen; s++) {
        destData[startSample + s] = srcData[s];
      }
    }
  }

  return { masterBuffer, tracks };
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV binary format,
 * with optional start/end trimming and a smooth gentle fade-out at the tail.
 */
export function encodeAudioBufferToWav(
  buffer: AudioBuffer,
  trimStart = 0,
  trimEnd = 0,
  applyFadeOut = true,
  clarifierOptions?: { enabled: boolean; sensitivity?: number; noiseGateThresholdDb?: number }
): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;

  const startSample = Math.max(0, Math.floor(trimStart * sampleRate));
  const maxEndSample = buffer.length;
  const endSample =
    trimEnd > 0 && Math.floor(trimEnd * sampleRate) <= maxEndSample
      ? Math.floor(trimEnd * sampleRate)
      : maxEndSample;

  const length = Math.max(1, endSample - startSample);
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = length * blockAlign;
  const totalByteLength = 44 + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  // fmt Sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data Sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Interleave channel samples and convert to 16-bit signed PCM
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    const raw = buffer.getChannelData(ch);
    const chData =
      clarifierOptions && clarifierOptions.enabled
        ? applySpeechClarifier(raw, sampleRate, {
            enabled: true,
            presenceGainDb: 1.5 + (clarifierOptions.sensitivity ?? 0.6) * 4.5,
            noiseGateThresholdDb: clarifierOptions.noiseGateThresholdDb ?? -42,
          })
        : raw;
    channels.push(chData as Float32Array);
  }

  // 0.3s smooth gentle sinusoidal fade-out window at the end
  const fadeOutDuration = 0.3;
  const fadeOutSamples = Math.min(Math.floor(length / 2), Math.floor(fadeOutDuration * sampleRate));
  const fadeOutStartIndex = length - fadeOutSamples;

  for (let i = 0; i < length; i++) {
    const srcIndex = startSample + i;
    let fadeMultiplier = 1.0;
    if (applyFadeOut && fadeOutSamples > 0 && i >= fadeOutStartIndex) {
      const progress = (length - 1 - i) / fadeOutSamples; // 1.0 down to 0.0
      fadeMultiplier = Math.sin((progress * Math.PI) / 2); // Smooth cosine/sine curve
    }

    for (let ch = 0; ch < numChannels; ch++) {
      let rawSample = channels[ch][srcIndex] || 0;
      rawSample *= fadeMultiplier;
      const sample = Math.max(-1, Math.min(1, rawSample));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Uint8Array(arrayBuffer);
}
