/**
 * Utility to concatenate multiple AudioBuffers into a single continuous timeline
 * and export an AudioBuffer as a standard 16-bit PCM WAV.
 */

export interface SequencedTrack {
  id: string;
  name: string;
  path: string;
  duration: number;
  startTime: number;
  endTime: number;
}

export function concatenateAudioBuffers(
  ctx: AudioContext,
  buffers: AudioBuffer[],
  gapSeconds = 0.5
): { masterBuffer: AudioBuffer; tracks: SequencedTrack[] } {
  if (buffers.length === 0) {
    throw new Error('No audio buffers provided for sequence');
  }

  // Find sample rate and max channel count
  const sampleRate = buffers[0].sampleRate;
  let numChannels = 1;
  for (const b of buffers) {
    if (b.numberOfChannels > numChannels) {
      numChannels = b.numberOfChannels;
    }
  }

  // Calculate track timings and total duration
  let currentTime = 0;
  const tracks: SequencedTrack[] = [];

  for (let i = 0; i < buffers.length; i++) {
    const b = buffers[i];
    const dur = b.duration;
    const start = currentTime;
    const end = start + dur;

    tracks.push({
      id: `track-${i}-${Date.now()}`,
      name: `Track ${i + 1}`,
      path: '',
      duration: dur,
      startTime: start,
      endTime: end,
    });

    currentTime = end + (i < buffers.length - 1 ? gapSeconds : 0);
  }

  const totalDuration = currentTime;
  const totalSamples = Math.max(1, Math.ceil(totalDuration * sampleRate));

  const masterBuffer = ctx.createBuffer(numChannels, totalSamples, sampleRate);

  // Copy each buffer's samples into the master buffer
  for (let i = 0; i < buffers.length; i++) {
    const b = buffers[i];
    const trackInfo = tracks[i];
    const startSample = Math.floor(trackInfo.startTime * sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      // Use ch if source has it, or channel 0 if source is mono
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
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV binary format.
 */
export function encodeAudioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
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
    channels.push(buffer.getChannelData(ch));
  }

  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Uint8Array(arrayBuffer);
}
