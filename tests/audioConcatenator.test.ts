import { describe, it, expect } from 'vitest';
import {
  encodeAudioBufferToWav,
  detectSpeechBoundaries,
  generateTelephoneBeep,
  concatenateAudioBuffers,
} from '../src/engine/audioConcatenator';

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

  it('accurately detects speech boundaries and skips leading/trailing silence', () => {
    const sampleRate = 44100;
    // 3.5 seconds total: 1.0s silence, 1.5s speech (tone), 1.0s silence
    const totalSamples = Math.floor(sampleRate * 3.5);
    const data = new Float32Array(totalSamples);

    const speechStartSample = sampleRate * 1.0;
    const speechEndSample = sampleRate * 2.5;
    for (let i = speechStartSample; i < speechEndSample; i++) {
      data[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }

    const mockBuffer = {
      numberOfChannels: 1,
      sampleRate,
      length: totalSamples,
      duration: 3.5,
      getChannelData: () => data,
    } as unknown as AudioBuffer;

    const { speechStart, speechEnd } = detectSpeechBoundaries(mockBuffer, -40, 0.05);

    // speechStart should be ~0.95 - 1.0s (due to 0.05s safety padding)
    expect(speechStart).toBeGreaterThanOrEqual(0.9);
    expect(speechStart).toBeLessThanOrEqual(1.05);

    // speechEnd should be ~2.5 - 2.6s
    expect(speechEnd).toBeGreaterThanOrEqual(2.45);
    expect(speechEnd).toBeLessThanOrEqual(2.65);
  });

  it('synthesizes an authentic 800Hz telephone beep tone without artifacts', () => {
    const mockCtx = {
      sampleRate: 44100,
      createBuffer: (channels: number, length: number, sampleRate: number) => {
        const data = new Float32Array(length);
        return {
          numberOfChannels: channels,
          length,
          sampleRate,
          duration: length / sampleRate,
          getChannelData: () => data,
        };
      },
    } as unknown as AudioContext;

    const beep = generateTelephoneBeep(mockCtx, 800, 0.3);
    expect(beep.duration).toBeCloseTo(0.3, 2);

    const data = beep.getChannelData(0);
    expect(data.length).toBe(Math.floor(44100 * 0.3));

    // Verify first and last samples are 0 (smooth ramp)
    expect(data[0]).toBe(0);
    expect(Math.abs(data[data.length - 1])).toBeLessThan(0.01);
  });

  it('prepends greeting prompt and telephone beep seamlessly in sequence', () => {
    const sampleRate = 44100;
    const makeBuf = (dur: number) => {
      const len = Math.floor(sampleRate * dur);
      const d = new Float32Array(len).fill(0.3);
      return {
        numberOfChannels: 1,
        sampleRate,
        length: len,
        duration: dur,
        getChannelData: () => d,
      } as unknown as AudioBuffer;
    };

    const mockCtx = {
      sampleRate: 44100,
      createBuffer: (channels: number, length: number, sampleRate: number) => {
        const data = new Float32Array(length);
        return {
          numberOfChannels: channels,
          length,
          sampleRate,
          duration: length / sampleRate,
          getChannelData: () => data,
        };
      },
    } as unknown as AudioContext;

    const greeting = makeBuf(1.5);
    const guest1 = makeBuf(2.0);

    const { masterBuffer, tracks } = concatenateAudioBuffers(mockCtx, [guest1], 0.5, {
      greetingBuffer: greeting,
      includeBeep: true,
      greetingName: 'Our Voicemail Prompt',
    });

    // 3 tracks: Greeting, Telephone Prompt Beep, Guest Recording #1
    expect(tracks.length).toBe(3);
    expect(tracks[0].name).toBe('Our Voicemail Prompt');
    expect(tracks[1].name).toBe('Telephone Prompt Beep');
    expect(tracks[2].name).toBe('Guest Recording #1');

    expect(masterBuffer.duration).toBeGreaterThan(3.5);
  });
});
