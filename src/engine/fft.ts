/**
 * Fast Fourier Transform (Cooley-Tukey Radix-2) for real-time and offline audio spectrum analysis.
 * Uses pre-allocated scratch buffers to achieve zero allocations during high-speed video export.
 */

const N = 512;
const halfN = N / 2;
const scratchReal = new Float32Array(N);
const scratchImag = new Float32Array(N);
const scratchMagnitudes = new Uint8Array(halfN);

// Precompute Hann window once
const hannWindow = new Float32Array(N);
for (let i = 0; i < N; i++) {
  hannWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
}

export function computeFFT(timeSamples: Float32Array, targetOut?: Uint8Array): Uint8Array {
  const real = scratchReal;
  const imag = scratchImag;
  const magnitudes = targetOut || scratchMagnitudes;

  // Apply Hann window and copy samples (zero Math.cos per frame!)
  const len = Math.min(timeSamples.length, N);
  for (let i = 0; i < N; i++) {
    if (i < len) {
      real[i] = timeSamples[i] * hannWindow[i];
    } else {
      real[i] = 0;
    }
    imag[i] = 0;
  }

  // Bit reversal permutation
  let j = 0;
  for (let i = 0; i < N - 1; i++) {
    if (i < j) {
      const tempR = real[i];
      real[i] = real[j];
      real[j] = tempR;
      const tempI = imag[i];
      imag[i] = imag[j];
      imag[j] = tempI;
    }
    let k = N >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Cooley-Tukey radix-2 computation
  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < N; i += len) {
      let wR = 1;
      let wI = 0;
      for (let k = 0; k < half; k++) {
        const uR = real[i + k];
        const uI = imag[i + k];
        const vR = real[i + k + half] * wR - imag[i + k + half] * wI;
        const vI = real[i + k + half] * wI + imag[i + k + half] * wR;

        real[i + k] = uR + vR;
        imag[i + k] = uI + vI;
        real[i + k + half] = uR - vR;
        imag[i + k + half] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        const nextWI = wR * wStepI + wI * wStepR;
        wR = nextWR;
        wI = nextWI;
      }
    }
  }

  // Convert to 0-255 magnitude array (first half N/2 = 256 bins)
  const maxBins = Math.min(halfN, magnitudes.length);
  for (let i = 0; i < maxBins; i++) {
    const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) * 4;
    // Logarithmic perceptual scale
    const val = Math.min(255, Math.max(0, Math.round(Math.log10(1 + mag) * 120)));
    magnitudes[i] = val;
  }

  return magnitudes;
}
