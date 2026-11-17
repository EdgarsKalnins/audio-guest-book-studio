import { describe, it, expect } from 'vitest';
import { encodeAudioBufferToWav } from '../src/engine/audioConcatenator';

describe('AudioConcatenator', () => {
  it('encodes an AudioBuffer into a valid 16-bit PCM WAV binary format', () => {
    // Create a mock AudioBuffer
    const sampleRate = 44100;
    const length = sampleRate; // 1 second
    const channelData = new Float32Array(length);
    // Fill with 440Hz sine wave
    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }

    const mockBuffer = {
      numberOfChannels: 1,
      sampleRate,
      length,
      duration: 1.0,
      getChannelData: () => channelData,
    } as unknown as AudioBuffer;

    const wavBytes = encodeAudioBufferToWav(mockBuffer);
    expect(wavBytes).toBeInstanceOf(Uint8Array);
    // 44 bytes header + 44100 * 2 bytes = 88244 bytes
    expect(wavBytes.length).toBe(44 + 44100 * 2);

    // Verify RIFF header
    const headerStr = String.fromCharCode(...wavBytes.subarray(0, 4));
    expect(headerStr).toBe('RIFF');
    const waveStr = String.fromCharCode(...wavBytes.subarray(8, 12));
    expect(waveStr).toBe('WAVE');
    const fmtStr = String.fromCharCode(...wavBytes.subarray(12, 16));
    expect(fmtStr).toBe('fmt ');
    const dataStr = String.fromCharCode(...wavBytes.subarray(36, 40));
    expect(dataStr).toBe('data');
  });

  it('correctly trims audio and applies gentle fade-out at the tail end', () => {
    const sampleRate = 44100;
    const length = sampleRate * 2; // 2 seconds
    const channelData = new Float32Array(length).fill(0.8); // Constant loud signal

    const mockBuffer = {
      numberOfChannels: 1,
      sampleRate,
      length,
      duration: 2.0,
      getChannelData: () => channelData,
    } as unknown as AudioBuffer;

    // Trim from 0.5s to 1.5s (1.0 second duration)
    const trimmedBytes = encodeAudioBufferToWav(mockBuffer, 0.5, 1.5, true);
    expect(trimmedBytes.length).toBe(44 + 44100 * 2);

    // Read the last samples from the DataView
    const view = new DataView(trimmedBytes.buffer, trimmedBytes.byteOffset, trimmedBytes.byteLength);
    // Last sample offset: total length - 2 bytes
    const lastSampleOffset = trimmedBytes.length - 2;
    const lastSampleInt16 = view.getInt16(lastSampleOffset, true);
    // Fade out means the very last sample should be near 0 (smooth fade out)
    expect(Math.abs(lastSampleInt16)).toBeLessThan(100);

    // Mid sample before fade-out should be around 0.8 * 32767 = ~26213
    const midSampleOffset = 44 + Math.floor(44100 * 0.2) * 2;
    const midSampleInt16 = view.getInt16(midSampleOffset, true);
    expect(midSampleInt16).toBeGreaterThan(25000);
  });
});
