import { StudioConfig, VisualizerStyle, GRADIENT_PRESETS } from '../../types/studio';
import { drawQrBadge } from '../qrGenerator';
import { renderFrameTemplate } from './frames';
import { renderMotionBackground } from './motionBackground';
import { drawSubtitles } from './subtitleRenderer';

export function getVisualizerPattern(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  config: StudioConfig
): string | CanvasGradient {
  if (config.gradientPreset) {
    const preset = GRADIENT_PRESETS.find((p) => p.id === config.gradientPreset);
    if (preset) {
      const totalWidth = width * 0.75 * config.visualizerScale;
      const grad = ctx.createLinearGradient(cx - totalWidth / 2, cy, cx + totalWidth / 2, cy);
      preset.stops.forEach((stop) => {
        grad.addColorStop(stop.offset, stop.color);
      });
      return grad;
    }
  }
  return config.visualizerColor;
}

/**
 * Pre-renders the static background photo, dark vignette, and wedding typography once
 * into a cached offscreen canvas to achieve 300+ FPS during video export.
 */
export function createStaticBackgroundCache(
  width: number,
  height: number,
  bgImage: HTMLImageElement | null,
  config: StudioConfig
): HTMLCanvasElement {
  const isTransparent = config.backgroundMode === 'transparent';
  const cacheCanvas = document.createElement('canvas');
  cacheCanvas.width = width;
  cacheCanvas.height = height;
  const ctx = cacheCanvas.getContext('2d', { alpha: isTransparent });
  if (!ctx) return cacheCanvas;

  // 1. Draw Frame Template (Haute Couture, Vintage Polaroid, Photo Strip, Vinyl)
  if (isTransparent) {
    ctx.clearRect(0, 0, width, height);
  } else {
    renderFrameTemplate(ctx, width, height, bgImage, config, 0);
  }

  // 2. Draw Wedding Typography Overlay
  if (config.typography.enabled) {
    drawTypography(ctx, width, height, config.typography);
  }

  return cacheCanvas;
}

export function drawStudioFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: HTMLImageElement | null,
  frequencyData: Uint8Array,
  timeDomainData: Float32Array,
  config: StudioConfig,
  currentTime: number,
  duration: number,
  staticBackgroundCache?: HTMLCanvasElement | null
) {
  const isVinyl = config.frame?.template === 'vinyl';

  // If static layer cache is available and template is not dynamically rotating (vinyl):
  if (staticBackgroundCache && !isVinyl) {
    ctx.drawImage(staticBackgroundCache, 0, 0, width, height);
  } else {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Frame Template
    if (config.backgroundMode !== 'transparent') {
      renderFrameTemplate(ctx, width, height, bgImage, config, currentTime);
    }

    // 2. Draw Wedding Typography Overlay
    if (config.typography.enabled) {
      drawTypography(ctx, width, height, config.typography);
    }
  }

  // 3. Compute Vocal Speech Intensity in Human Voice Band (150Hz - 2800Hz, bins 2 to 32)
  let voiceSum = 0;
  for (let b = 2; b <= 32; b++) {
    voiceSum += frequencyData[b] || 0;
  }
  const voiceAvg = voiceSum / 31; // 0 to 255
  // Dynamic Vocal Punch: 1.0x at rest up to 2.5x during spoken words
  const vocalPunch = 1.0 + Math.pow(Math.min(1.0, voiceAvg / 130), 1.1) * 1.5;

  // 4. Draw Procedural Motion & B-Roll Shaders (Candlelight Bokeh, 8mm Film Dust, Stardust)
  if (config.backgroundMode !== 'transparent') {
    renderMotionBackground(ctx, width, height, config.motion, currentTime, voiceAvg);
  }

  // Draw Audio Visualizer positioned harmoniously with active frame template
  const isLandscape = width > height;
  const template = config.frame?.template || 'haute-couture';
  let centerY = config.typography.enabled ? height * 0.52 : height * 0.5;
  let centerX = width * 0.5;

  if (template === 'polaroid') {
    if (isLandscape) {
      centerX = width * 0.72;
      centerY = height * 0.5;
    } else {
      centerY = height * 0.75;
    }
  } else if (template === 'photostrip') {
    if (isLandscape) {
      centerX = width * 0.68;
      centerY = height * 0.5;
    } else {
      centerY = height * 0.78;
    }
  } else if (template === 'vinyl') {
    if (isLandscape) {
      centerX = width * 0.74;
      centerY = height * 0.5;
    } else {
      centerY = height * 0.74;
    }
  }

  const pattern = getVisualizerPattern(ctx, centerX, centerY, width, height, config);
  const strokeMultiplier = config.strokeWidth ?? 1.0;
  const lineCap: CanvasLineCap = config.lineCap ?? 'round';
  const particleDensity = config.particleDensity ?? 1.0;

  ctx.save();
  ctx.globalAlpha = config.visualizerOpacity;

  if (config.visualizerGlow) {
    ctx.shadowColor = config.visualizerColor;
    ctx.shadowBlur = 14 + (voiceAvg / 255) * 22; // Glow expands intensely during speech!
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  switch (config.visualizerStyle) {
    case 'line_wave':
      drawClassicHairlineWave(ctx, centerX, centerY, width, height, timeDomainData, config, currentTime, vocalPunch, voiceAvg, pattern, strokeMultiplier, lineCap);
      break;
    case 'line_mirror':
      drawMirroredCenterLine(ctx, centerX, centerY, width, height, frequencyData, config, vocalPunch, voiceAvg, pattern, strokeMultiplier, lineCap);
      break;
    case 'line_horizon':
      drawCleanPulseHorizon(ctx, centerX, centerY, width, height, timeDomainData, config, currentTime, vocalPunch, voiceAvg, pattern, strokeMultiplier, lineCap);
      break;
    case 'bars':
      drawCenteredBars(ctx, centerX, centerY, width, height, frequencyData, config, vocalPunch, voiceAvg, pattern, strokeMultiplier);
      break;
    case 'wave':
      drawSineRibbon(ctx, centerX, centerY, width, height, timeDomainData, config, currentTime, vocalPunch, voiceAvg, pattern, strokeMultiplier, lineCap);
      break;
    case 'ring':
      drawCircularHalo(ctx, centerX, centerY, width, height, frequencyData, config, vocalPunch, voiceAvg, pattern, strokeMultiplier, lineCap);
      break;
    case 'mirror':
      drawSymmetricalMirror(ctx, centerX, centerY, width, height, frequencyData, config, vocalPunch, voiceAvg, pattern, strokeMultiplier);
      break;
    case 'particles':
      drawStardust(ctx, centerX, centerY, width, height, frequencyData, config, currentTime, vocalPunch, voiceAvg, pattern, particleDensity);
      break;
  }

  ctx.restore();

  // 4. Draw Audio Playback Timer & Progress below visualizer (if enabled)
  if (config.typography.enabled && config.typography.showTimer) {
    drawTimer(ctx, centerX, centerY + (height * 0.18 * config.visualizerScale), currentTime, duration, config, pattern);
  }

  // 5. Draw Dynamic QR Code Watermark (always on top of visualizer and background)
  if (config.qrWatermark && config.qrWatermark.enabled) {
    drawQrBadge(ctx, width, height, config.qrWatermark);
  }

  // 6. Draw Animated Karaoke Subtitles
  if (config.subtitles && config.subtitles.enabled) {
    drawSubtitles(ctx, width, height, config.subtitles, currentTime);
  }
}

function drawTypography(ctx: CanvasRenderingContext2D, width: number, height: number, typo: StudioConfig['typography']) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  const baseScale = width / 1080;
  const fontFam = typo.fontFamily || 'Cormorant Garamond';
  const fallback = fontFam === 'Plus Jakarta Sans' ? 'sans-serif' : 'serif';

  // Title / Subtitle
  if (typo.titleText) {
    ctx.font = `italic 300 ${Math.round(24 * baseScale * typo.fontSize)}px "${fontFam}", ${fallback}`;
    ctx.fillStyle = 'rgba(235, 225, 215, 0.75)';
    ctx.letterSpacing = `${Math.round(4 * baseScale)}px`;
    ctx.fillText(typo.titleText.toUpperCase(), width / 2, height * 0.16);
  }

  // Couple Names
  if (typo.coupleNames) {
    ctx.font = `600 ${Math.round(54 * baseScale * typo.fontSize)}px "${fontFam}", ${fallback}`;
    ctx.fillStyle = '#fbf7f2';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;
    ctx.fillText(typo.coupleNames, width / 2, height * 0.22);
  }

  // Date
  if (typo.dateText) {
    ctx.font = `400 ${Math.round(22 * baseScale * typo.fontSize)}px "${fontFam}", ${fallback}`;
    ctx.fillStyle = 'rgba(215, 186, 126, 0.9)'; // Champagne gold
    ctx.letterSpacing = `${Math.round(3 * baseScale)}px`;
    ctx.fillText(typo.dateText, width / 2, height * 0.26);
  }

  // Thin gold divider ornament
  ctx.strokeStyle = 'rgba(215, 186, 126, 0.35)';
  ctx.lineWidth = 1.5 * baseScale;
  const lineHalf = 80 * baseScale;
  ctx.beginPath();
  ctx.moveTo(width / 2 - lineHalf, height * 0.285);
  ctx.lineTo(width / 2 + lineHalf, height * 0.285);
  ctx.stroke();

  // Little diamond in center of divider
  ctx.fillStyle = 'rgba(215, 186, 126, 0.75)';
  ctx.beginPath();
  const dSize = 4 * baseScale;
  const dY = height * 0.285;
  ctx.moveTo(width / 2, dY - dSize);
  ctx.lineTo(width / 2 + dSize, dY);
  ctx.lineTo(width / 2, dY + dSize);
  ctx.lineTo(width / 2 - dSize, dY);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCenteredBars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  data: Uint8Array,
  config: StudioConfig,
  vocalPunch: number = 1.0,
  voiceAvg: number = 0,
  pattern?: string | CanvasGradient,
  strokeMultiplier: number = 1.0
) {
  const barCount = 42;
  const totalWidth = width * 0.65 * config.visualizerScale;
  const barWidth = (totalWidth / barCount) * 0.55 * strokeMultiplier;
  const spacing = totalWidth / barCount;
  const startX = cx - totalWidth / 2;
  const maxBarHeight = height * 0.22 * config.visualizerScale;

  ctx.fillStyle = pattern || config.visualizerColor;

  for (let i = 0; i < barCount; i++) {
    // Symmetrical index mapping (highest in center)
    const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
    const dataIndex = Math.floor((1 - distFromCenter * 0.7) * (data.length * 0.45));
    const rawVal = data[dataIndex] || 0;
    const normVal = Math.min(1, Math.max(0.08, rawVal / 255));
    
    // Vocal speech punch concentrated at center (mono voice enhancement)
    const centerWeight = Math.pow(Math.cos(distFromCenter * (Math.PI / 2)), 1.8);
    const dynamicPunch = 1.0 + (vocalPunch - 1.0) * centerWeight;
    const h = normVal * maxBarHeight * dynamicPunch;

    const x = startX + i * spacing + (spacing - barWidth) / 2;
    const y = cy - h / 2;

    // Draw rounded pill bar
    drawPill(ctx, x, y, barWidth, Math.max(barWidth, h));
  }
}

function drawSineRibbon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  timeData: Float32Array,
  config: StudioConfig,
  currentTime: number,
  vocalPunch: number = 1.0,
  voiceAvg: number = 0,
  pattern?: string | CanvasGradient,
  strokeMultiplier: number = 1.0,
  lineCap: CanvasLineCap = 'round'
) {
  const totalWidth = width * 0.75 * config.visualizerScale;
  const startX = cx - totalWidth / 2;
  const maxAmp = height * 0.16 * config.visualizerScale;

  ctx.strokeStyle = pattern || config.visualizerColor;
  ctx.lineWidth = 3.5 * (width / 1080) * strokeMultiplier;
  ctx.lineCap = lineCap;
  ctx.lineJoin = 'round';

  // Layer 1 - Primary wave
  ctx.beginPath();
  const step = totalWidth / 64;
  for (let i = 0; i <= 64; i++) {
    const x = startX + i * step;
    const sampleIdx = Math.floor((i / 64) * timeData.length);
    const audioVal = timeData[sampleIdx] || 0;
    // Window function to taper at edges
    const taper = Math.sin((i / 64) * Math.PI);
    const normalizedDist = Math.abs(i - 32) / 32;
    const centerWeight = Math.pow(Math.cos(normalizedDist * (Math.PI / 2)), 1.6);
    const dynamicPunch = 1.0 + (vocalPunch - 1.0) * centerWeight;

    const wave = Math.sin(i * 0.25 + currentTime * 5) * 15 * taper;
    const y = cy + (audioVal * maxAmp * dynamicPunch + wave) * taper;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Layer 2 - Harmonized subtle secondary ribbon
  ctx.save();
  ctx.globalAlpha = config.visualizerOpacity * 0.45;
  ctx.lineWidth = 2 * (width / 1080);
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const x = startX + i * step;
    const sampleIdx = Math.floor(((64 - i) / 64) * timeData.length);
    const audioVal = timeData[sampleIdx] || 0;
    const taper = Math.sin((i / 64) * Math.PI);
    const normalizedDist = Math.abs(i - 32) / 32;
    const centerWeight = Math.pow(Math.cos(normalizedDist * (Math.PI / 2)), 1.6);
    const dynamicPunch = 1.0 + (vocalPunch - 1.0) * centerWeight;

    const wave = Math.sin(i * 0.35 - currentTime * 4.2) * 18 * taper;
    const y = cy + (audioVal * maxAmp * 0.7 * dynamicPunch - wave) * taper;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCircularHalo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  data: Uint8Array,
  config: StudioConfig,
  vocalPunch: number = 1.0,
  voiceAvg: number = 0,
  pattern?: string | CanvasGradient,
  strokeMultiplier: number = 1.0,
  lineCap: CanvasLineCap = 'round'
) {
  const baseRadius = width * 0.16 * config.visualizerScale;
  const maxSpike = width * 0.12 * config.visualizerScale;
  const segments = 60;
  const voiceBoost = (voiceAvg / 255);

  ctx.strokeStyle = pattern || config.visualizerColor;
  ctx.lineWidth = 2.5 * (width / 1080) * strokeMultiplier;
  ctx.lineCap = lineCap;

  // Inner ring dynamically breathes when speaking
  const activeRadius = baseRadius * (1.0 + voiceBoost * 0.18);
  ctx.beginPath();
  ctx.arc(cx, cy, activeRadius * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  // Radiating rays with vocal punch
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const dataIdx = Math.floor((Math.abs(Math.sin(angle)) * 0.5) * (data.length * 0.5));
    const val = (data[dataIdx] || 0) / 255;
    const verticalWeight = Math.pow(Math.abs(Math.sin(angle)), 1.2);
    const dynamicPunch = 1.0 + (vocalPunch - 1.0) * verticalWeight;
    const len = activeRadius + Math.max(6, val * maxSpike * dynamicPunch);

    const x1 = cx + Math.cos(angle) * activeRadius;
    const y1 = cy + Math.sin(angle) * activeRadius;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawSymmetricalMirror(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  data: Uint8Array,
  config: StudioConfig,
  vocalPunch: number = 1.0,
  voiceAvg: number = 0,
  pattern?: string | CanvasGradient,
  strokeMultiplier: number = 1.0
) {
  const barCount = 36;
  const totalWidth = width * 0.65 * config.visualizerScale;
  const barWidth = (totalWidth / barCount) * 0.5 * strokeMultiplier;
  const spacing = totalWidth / barCount;
  const startX = cx - totalWidth / 2;
  const maxBarHeight = height * 0.14 * config.visualizerScale;

  ctx.fillStyle = pattern || config.visualizerColor;

  for (let i = 0; i < barCount; i++) {
    const distCenter = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
    const dataIdx = Math.floor(distCenter * (data.length * 0.4));
    const val = (data[dataIdx] || 0) / 255;

    // Center vocal punch: mono voice amplifies center bars prominently
    const centerWeight = Math.pow(distCenter, 1.4);
    const dynamicPunch = 1.0 + (vocalPunch - 1.0) * centerWeight;
    const halfH = Math.max(3, val * maxBarHeight * dynamicPunch);

    const x = startX + i * spacing + (spacing - barWidth) / 2;

    // Top half
    drawPill(ctx, x, cy - halfH, barWidth, halfH);
    // Bottom mirror half
    drawPill(ctx, x, cy, barWidth, halfH);
  }

  // Thin center divider line
  ctx.strokeStyle = pattern || config.visualizerColor;
  ctx.lineWidth = 1 * (width / 1080) * strokeMultiplier;
  ctx.beginPath();
  ctx.moveTo(startX - 15, cy);
  ctx.lineTo(startX + totalWidth + 15, cy);
  ctx.stroke();
}

function drawStardust(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  data: Uint8Array,
  config: StudioConfig,
  currentTime: number,
  vocalPunch: number = 1.0,
  voiceAvg: number = 0,
  pattern?: string | CanvasGradient,
  particleDensity: number = 1.0
) {
  const particleCount = Math.round(48 * particleDensity);
  const avgEnergy = (data[4] + data[10] + data[18] || 0) / (3 * 255);
  const maxRadius = width * 0.28 * config.visualizerScale;

  ctx.fillStyle = pattern || config.visualizerColor;

  for (let i = 0; i < particleCount; i++) {
    const seed = i * 137.5; // Golden angle distribution
    const baseDist = (Math.sqrt(i / particleCount)) * maxRadius;
    const angle = seed + currentTime * (0.2 + (i % 5) * 0.05);

    const dist = baseDist * (1 + avgEnergy * vocalPunch * 0.45);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const pSize = (1.5 + (i % 4) * 1.5 + (voiceAvg / 255) * 4.0) * (width / 1080);

    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTimer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  currentTime: number,
  duration: number,
  config: StudioConfig,
  pattern?: string | CanvasGradient
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const baseScale = ctx.canvas.width / 1080;
  ctx.font = `500 ${Math.round(18 * baseScale)}px "Inter", sans-serif`;
  ctx.letterSpacing = '1px';

  const format = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const text = `${format(currentTime)} / ${format(duration)}`;
  ctx.fillText(text, cx, y);

  // Subtle mini progress line under timer
  const barW = 120 * baseScale;
  const prog = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2 * baseScale;
  ctx.beginPath();
  ctx.moveTo(cx - barW / 2, y + 10 * baseScale);
  ctx.lineTo(cx + barW / 2, y + 10 * baseScale);
  ctx.stroke();

  ctx.strokeStyle = pattern || config.visualizerColor;
  ctx.beginPath();
  ctx.moveTo(cx - barW / 2, y + 10 * baseScale);
  ctx.lineTo(cx - barW / 2 + barW * prog, y + 10 * baseScale);
  ctx.stroke();

  ctx.restore();
}

function drawPill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawClassicHairlineWave(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  timeData: Float32Array,
  config: StudioConfig,
  currentTime: number,
  vocalPunch: number = 1.0,
  voiceAvg: number = 0,
  pattern?: string | CanvasGradient,
  strokeMultiplier: number = 1.0,
  lineCap: CanvasLineCap = 'round'
) {
  const baseScale = width / 1080;
  const totalWidth = width * 0.72 * config.visualizerScale;
  const startX = cx - totalWidth / 2;
  const maxAmp = height * 0.14 * config.visualizerScale;
  const points = 120;
  const step = totalWidth / points;

  ctx.save();
  ctx.strokeStyle = pattern || config.visualizerColor;
  ctx.lineWidth = 1.8 * baseScale * strokeMultiplier;
  ctx.lineCap = lineCap;
  ctx.lineJoin = 'round';

  // Hairline guide baseline
  ctx.beginPath();
  ctx.strokeStyle = `${config.visualizerColor}28`;
  ctx.moveTo(startX - 20 * baseScale, cy);
  ctx.lineTo(startX + totalWidth + 20 * baseScale, cy);
  ctx.stroke();

  // Active wave curve with intense center vocal punch
  ctx.strokeStyle = pattern || config.visualizerColor;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const x = startX + i * step;
    const sampleIdx = Math.floor((i / points) * (timeData.length - 1));
    const audioVal = timeData[sampleIdx] || 0;
    const taper = Math.sin((i / points) * Math.PI);
    const normalizedDist = Math.abs(i - points / 2) / (points / 2);
    const centerWeight = Math.pow(Math.cos(normalizedDist * (Math.PI / 2)), 1.8);
    const dynamicPunch = 1.0 + (vocalPunch - 1.0) * centerWeight;

    const ambient = Math.sin(i * 0.18 + currentTime * 3) * 6 * taper;
    const y = cy + (audioVal * maxAmp * dynamicPunch + ambient) * taper;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Dynamic center anchor pip - expands with speech
  ctx.fillStyle = pattern || config.visualizerColor;
  ctx.beginPath();
  const pipRadius = (2.5 + (voiceAvg / 255) * 4.5) * baseScale * Math.min(2.0, strokeMultiplier);
  ctx.arc(cx, cy, pipRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMirroredCenterLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  data: Uint8Array,
  config: StudioConfig,
  vocalPunch: number = 1.0,
  voiceAvg: number = 0,
  pattern?: string | CanvasGradient,
  strokeMultiplier: number = 1.0,
  lineCap: CanvasLineCap = 'round'
) {
  const baseScale = width / 1080;
  const lineCount = 64;
  const totalWidth = width * 0.70 * config.visualizerScale;
  const spacing = totalWidth / lineCount;
  const startX = cx - totalWidth / 2;
  const maxHalfHeight = height * 0.12 * config.visualizerScale;

  ctx.save();
  ctx.strokeStyle = pattern || config.visualizerColor;
  ctx.lineWidth = 1.4 * baseScale * strokeMultiplier;
  ctx.lineCap = lineCap;

  // Center horizon hairline
  ctx.beginPath();
  ctx.strokeStyle = `${config.visualizerColor}33`;
  ctx.moveTo(startX - 15 * baseScale, cy);
  ctx.lineTo(startX + totalWidth + 15 * baseScale, cy);
  ctx.stroke();

  ctx.strokeStyle = pattern || config.visualizerColor;

  for (let i = 0; i < lineCount; i++) {
    const distFromCenter = Math.abs(i - lineCount / 2) / (lineCount / 2);
    const dataIdx = Math.floor((1 - distFromCenter * 0.75) * (data.length * 0.42));
    const val = (data[dataIdx] || 0) / 255;
    const taper = Math.sin(((i + 0.5) / lineCount) * Math.PI);

    // Center vocal punch: mono voice amplifies center lines prominently
    const centerWeight = Math.pow(1 - distFromCenter, 1.5);
    const dynamicPunch = 1.0 + (vocalPunch - 1.0) * centerWeight;
    const h = Math.max(3 * baseScale, val * maxHalfHeight * taper * dynamicPunch);

    const x = startX + i * spacing + spacing / 2;

    ctx.beginPath();
    ctx.moveTo(x, cy - h);
    ctx.lineTo(x, cy + h);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCleanPulseHorizon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  timeData: Float32Array,
  config: StudioConfig,
  currentTime: number,
  vocalPunch: number = 1.0,
  voiceAvg: number = 0,
  pattern?: string | CanvasGradient,
  strokeMultiplier: number = 1.0,
  lineCap: CanvasLineCap = 'round'
) {
  const baseScale = width / 1080;
  const totalWidth = width * 0.75 * config.visualizerScale;
  const startX = cx - totalWidth / 2;
  const maxAmp = height * 0.15 * config.visualizerScale;
  const steps = 140;
  const dx = totalWidth / steps;

  ctx.save();
  ctx.strokeStyle = pattern || config.visualizerColor;
  ctx.lineWidth = 1.6 * baseScale * strokeMultiplier;
  ctx.lineCap = lineCap;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = startX + i * dx;
    const progress = i / steps; // 0 to 1
    let envelope = 0;
    if (progress >= 0.2 && progress <= 0.8) {
      const pNorm = (progress - 0.2) / 0.6;
      envelope = Math.pow(Math.sin(pNorm * Math.PI), 2.5);
    }

    const sampleIdx = Math.floor(progress * (timeData.length - 1));
    const audioVal = timeData[sampleIdx] || 0;
    const normalizedDist = Math.abs(progress - 0.5) / 0.5;
    const centerWeight = Math.pow(Math.cos(normalizedDist * (Math.PI / 2)), 1.6);
    const dynamicPunch = 1.0 + (vocalPunch - 1.0) * centerWeight;

    const ripple = Math.sin(progress * 28 + currentTime * 4) * 4 * envelope;
    const y = cy + (audioVal * maxAmp * dynamicPunch + ripple) * envelope;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Dynamic center marker - radiates when speaking
  ctx.fillStyle = pattern || config.visualizerColor;
  ctx.beginPath();
  const markerRadius = (3.0 + (voiceAvg / 255) * 5.0) * baseScale * Math.min(2.0, strokeMultiplier);
  ctx.arc(cx, cy, markerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
