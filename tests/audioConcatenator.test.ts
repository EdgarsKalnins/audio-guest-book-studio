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
});
