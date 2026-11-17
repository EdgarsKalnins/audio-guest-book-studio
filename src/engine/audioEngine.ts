import { computeFFT } from './fft';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private voiceBoostEnabled = false;

  public duration = 0;
  public onTimeUpdate: ((time: number) => void) | null = null;
  public onEnded: (() => void) | null = null;

  private animFrameId: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode = this.ctx.createGain();
      this.updateGain();

      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public async loadAudioFromBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    this.initContext();
    if (!this.ctx) throw new Error('AudioContext unavailable');

    this.stop();
    this.pauseOffset = 0;

    // Decode copy of buffer
    const decoded = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
    this.audioBuffer = decoded;
    this.duration = decoded.duration;

    return decoded;
  }

  public setVoiceBoost(enabled: boolean) {
    this.voiceBoostEnabled = enabled;
    this.updateGain();
  }

  private updateGain() {
    if (!this.gainNode) return;
    // Boost gain by +6dB (~2x) if Voice Boost is enabled
    this.gainNode.gain.value = this.voiceBoostEnabled ? 1.85 : 1.0;
  }

  public play(fromTime?: number, trimStart = 0, trimEnd = 0) {
    this.initContext();
    if (!this.ctx || !this.audioBuffer) return;

    if (this.isPlaying) {
      this.stop();
    }

    const maxEnd = trimEnd > 0 && trimEnd <= this.duration ? trimEnd : this.duration;
    let offset = fromTime !== undefined ? fromTime : this.pauseOffset;
    if (offset < trimStart) offset = trimStart;
    if (offset >= maxEnd) offset = trimStart;

    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode!);

    this.startTime = this.ctx.currentTime - offset;
    this.pauseOffset = offset;
    this.isPlaying = true;

    this.sourceNode.start(0, offset);

    this.sourceNode.onended = () => {
      if (this.isPlaying && this.getCurrentTime() >= maxEnd - 0.05) {
        this.pause();
        this.pauseOffset = trimStart;
        if (this.onEnded) this.onEnded();
      }
    };

    this.startProgressLoop(trimStart, maxEnd);
  }

  public pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime();
    this.stopSource();
    this.isPlaying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public seek(time: number) {
    const wasPlaying = this.isPlaying;
    if (this.isPlaying) {
      this.pause();
    }
    this.pauseOffset = Math.max(0, Math.min(this.duration, time));
    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.pauseOffset);
    }
    if (wasPlaying) {
      this.play(this.pauseOffset);
    }
  }

  public stop() {
    this.stopSource();
    this.pauseOffset = 0;
    this.isPlaying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Ignored if already ended
      }
      this.sourceNode = null;
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset;
    const cur = this.ctx.currentTime - this.startTime;
    return Math.max(0, Math.min(this.duration, cur));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Retrieves live frequency & time-domain analysis during normal playback
   */
  public getLiveAudioData(freqOut: Uint8Array, timeOut: Float32Array) {
    if (this.analyserNode && this.isPlaying) {
      (this.analyserNode.getByteFrequencyData as (arr: any) => void)(freqOut);
      (this.analyserNode.getFloatTimeDomainData as (arr: any) => void)(timeOut);
    } else {
      freqOut.fill(0);
      timeOut.fill(0);
    }
  }

  /**
   * Generates a downsampled waveform peaks array for the UI scrubber/trimmer
   */
  public getWaveformPeaks(points = 120): number[] {
    if (!this.audioBuffer) return new Array(points).fill(0.05);

    const channelData = this.audioBuffer.getChannelData(0);
    const step = Math.floor(channelData.length / points);
    const peaks: number[] = [];

    for (let i = 0; i < points; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      for (let j = start; j < end; j += 4) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1, Math.max(0.05, max)));
    }

    return peaks;
  }

  /**
   * Offline audio frame data retrieval for frame-perfect video rendering
   */
  public getOfflineFrameData(time: number, freqOut: Uint8Array, timeOut: Float32Array) {
    if (!this.audioBuffer) {
      freqOut.fill(0);
      timeOut.fill(0);
      return;
    }

    const sampleRate = this.audioBuffer.sampleRate;
    const centerSample = Math.floor(time * sampleRate);
    const channelData = this.audioBuffer.getChannelData(0);
    const N = timeOut.length; // 512
    const halfN = N / 2;

    const startIdx = centerSample - halfN;
    const rawTimeSlice = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const idx = startIdx + i;
      if (idx >= 0 && idx < channelData.length) {
        let sample = channelData[idx];
        if (this.voiceBoostEnabled) {
          sample *= 1.85;
        }
        rawTimeSlice[i] = sample;
        timeOut[i] = sample;
      } else {
        rawTimeSlice[i] = 0;
        timeOut[i] = 0;
      }
    }

    const fftMagnitudes = computeFFT(rawTimeSlice);
    freqOut.set(fftMagnitudes.subarray(0, freqOut.length));
  }

  public getRawBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  private startProgressLoop(trimStart: number, maxEnd: number) {
    const loop = () => {
      if (!this.isPlaying) return;
      const cur = this.getCurrentTime();
      if (this.onTimeUpdate) {
        this.onTimeUpdate(cur);
      }
      if (cur >= maxEnd) {
        this.pause();
        this.pauseOffset = trimStart;
        if (this.onEnded) this.onEnded();
        return;
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
