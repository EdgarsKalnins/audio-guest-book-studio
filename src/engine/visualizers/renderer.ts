import { StudioConfig, VisualizerStyle } from '../../types/studio';

export function drawStudioFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: HTMLImageElement | null,
  frequencyData: Uint8Array,
  timeDomainData: Float32Array,
  config: StudioConfig,
  currentTime: number,
  duration: number
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Background Image (Cover mode)
  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
    const canvasRatio = width / height;
    let renderW = width;
    let renderH = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      renderW = height * imgRatio;
      offsetX = -(renderW - width) / 2;
    } else {
      renderH = width / imgRatio;
      offsetY = -(renderH - height) / 2;
    }

    ctx.drawImage(bgImage, offsetX, offsetY, renderW, renderH);

    // Subtle dark cinematic vignette overlay
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.25,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    vignette.addColorStop(0, 'rgba(10, 8, 7, 0.25)');
    vignette.addColorStop(1, 'rgba(10, 8, 7, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Elegant fallback gradient if no image
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      100,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    grad.addColorStop(0, '#2b1f1a');
    grad.addColorStop(1, '#0e0b09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Wedding Typography Overlay (Top / Header)
  if (config.typography.enabled) {
    drawTypography(ctx, width, height, config.typography);
  }

  // 3. Draw Centered Audio Visualizer
  const centerY = config.typography.enabled ? height * 0.52 : height * 0.5;
  const centerX = width * 0.5;

  ctx.save();
  ctx.globalAlpha = config.visualizerOpacity;

  if (config.visualizerGlow) {
    ctx.shadowColor = config.visualizerColor;
    ctx.shadowBlur = 18;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  switch (config.visualizerStyle) {
    case 'bars':
      drawCenteredBars(ctx, centerX, centerY, width, height, frequencyData, config);
      break;
    case 'wave':
      drawSineRibbon(ctx, centerX, centerY, width, height, timeDomainData, config, currentTime);
      break;
    case 'ring':
      drawCircularHalo(ctx, centerX, centerY, width, height, frequencyData, config);
      break;
    case 'mirror':
      drawSymmetricalMirror(ctx, centerX, centerY, width, height, frequencyData, config);
      break;
    case 'particles':
      drawStardust(ctx, centerX, centerY, width, height, frequencyData, config, currentTime);
      break;
  }

  ctx.restore();

  // 4. Draw Audio Playback Timer & Progress below visualizer (if enabled)
  if (config.typography.enabled && config.typography.showTimer) {
    drawTimer(ctx, centerX, centerY + (height * 0.18 * config.visualizerScale), currentTime, duration, config);
  }
}

function drawTypography(ctx: CanvasRenderingContext2D, width: number, height: number, typo: StudioConfig['typography']) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  const baseScale = width / 1080;
  const fontFam = typo.fontFamily;

  // Title / Subtitle
  if (typo.titleText) {
    ctx.font = `italic 300 ${Math.round(24 * baseScale * typo.fontSize)}px "${fontFam}", serif`;
    ctx.fillStyle = 'rgba(235, 225, 215, 0.75)';
    ctx.letterSpacing = `${Math.round(4 * baseScale)}px`;
    ctx.fillText(typo.titleText.toUpperCase(), width / 2, height * 0.16);
  }

  // Couple Names
  if (typo.coupleNames) {
    ctx.font = `600 ${Math.round(54 * baseScale * typo.fontSize)}px "${fontFam}", serif`;
    ctx.fillStyle = '#fbf7f2';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;
    ctx.fillText(typo.coupleNames, width / 2, height * 0.22);
  }

  // Date
  if (typo.dateText) {
    ctx.font = `400 ${Math.round(22 * baseScale * typo.fontSize)}px "${fontFam}", serif`;
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
  config: StudioConfig
) {
  const barCount = 42;
  const totalWidth = width * 0.65 * config.visualizerScale;
  const barWidth = (totalWidth / barCount) * 0.55;
  const spacing = totalWidth / barCount;
  const startX = cx - totalWidth / 2;
  const maxBarHeight = height * 0.22 * config.visualizerScale;

  ctx.fillStyle = config.visualizerColor;

  for (let i = 0; i < barCount; i++) {
    // Symmetrical index mapping (highest in center)
    const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
    const dataIndex = Math.floor((1 - distFromCenter * 0.7) * (data.length * 0.45));
    const rawVal = data[dataIndex] || 0;
    const normVal = Math.min(1, Math.max(0.08, rawVal / 255));
    const h = normVal * maxBarHeight;

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
  currentTime: number
) {
  const totalWidth = width * 0.75 * config.visualizerScale;
  const startX = cx - totalWidth / 2;
  const maxAmp = height * 0.16 * config.visualizerScale;

  ctx.strokeStyle = config.visualizerColor;
  ctx.lineWidth = 3.5 * (width / 1080);
  ctx.lineCap = 'round';
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
    const wave = Math.sin(i * 0.25 + currentTime * 5) * 15 * taper;
    const y = cy + (audioVal * maxAmp + wave) * taper;

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
    const wave = Math.sin(i * 0.35 - currentTime * 4.2) * 18 * taper;
    const y = cy + (audioVal * maxAmp * 0.7 - wave) * taper;

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
  config: StudioConfig
) {
  const baseRadius = width * 0.16 * config.visualizerScale;
  const maxSpike = width * 0.12 * config.visualizerScale;
  const segments = 60;

  ctx.strokeStyle = config.visualizerColor;
  ctx.lineWidth = 2.5 * (width / 1080);
  ctx.lineCap = 'round';

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  // Radiating rays
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const dataIdx = Math.floor((Math.abs(Math.sin(angle)) * 0.5) * (data.length * 0.5));
    const val = (data[dataIdx] || 0) / 255;
    const len = baseRadius + Math.max(6, val * maxSpike);

    const x1 = cx + Math.cos(angle) * baseRadius;
    const y1 = cy + Math.sin(angle) * baseRadius;
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
  config: StudioConfig
) {
  const barCount = 36;
  const totalWidth = width * 0.65 * config.visualizerScale;
  const barWidth = (totalWidth / barCount) * 0.5;
  const spacing = totalWidth / barCount;
  const startX = cx - totalWidth / 2;
  const maxBarHeight = height * 0.14 * config.visualizerScale;

  ctx.fillStyle = config.visualizerColor;

  for (let i = 0; i < barCount; i++) {
    const distCenter = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
    const dataIdx = Math.floor(distCenter * (data.length * 0.4));
    const val = (data[dataIdx] || 0) / 255;
    const halfH = Math.max(3, val * maxBarHeight);

    const x = startX + i * spacing + (spacing - barWidth) / 2;

    // Top half
    drawPill(ctx, x, cy - halfH, barWidth, halfH);
    // Bottom mirror half
    drawPill(ctx, x, cy, barWidth, halfH);
  }

  // Thin center divider line
  ctx.strokeStyle = config.visualizerColor;
  ctx.lineWidth = 1 * (width / 1080);
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
  currentTime: number
) {
  const particleCount = 48;
  const avgEnergy = (data[4] + data[10] + data[18] || 0) / (3 * 255);
  const maxRadius = width * 0.28 * config.visualizerScale;

  ctx.fillStyle = config.visualizerColor;

  for (let i = 0; i < particleCount; i++) {
    const seed = i * 137.5; // Golden angle distribution
    const baseDist = (Math.sqrt(i / particleCount)) * maxRadius;
    const angle = seed + currentTime * (0.2 + (i % 5) * 0.05);

    const dist = baseDist * (1 + avgEnergy * 0.4);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const pSize = (1.5 + (i % 4) * 1.5 + avgEnergy * 3.5) * (width / 1080);

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
  config: StudioConfig
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

  ctx.strokeStyle = config.visualizerColor;
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
