import { describe, it, expect } from 'vitest';
import { isWebCodecsSupported } from '../src/engine/webCodecsExporter';

describe('WebCodecs Hardware Engine', () => {
  it('detects WebCodecs environment cleanly', () => {
    // In Node test environment, VideoEncoder is undefined unless polyfilled/in browser
    const supported = isWebCodecsSupported();
    expect(typeof supported).toBe('boolean');
  });
});
