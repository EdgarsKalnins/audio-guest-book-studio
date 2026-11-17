import { MotionShaderPreset, MotionBackgroundConfig } from '../../types/studio';

/**
 * Procedural Motion & B-Roll Background Engine:
 * Renders romantic candlelight bokeh, vintage 8mm celluloid film dust/grain,
 * and stardust drift 100% procedurally on HTML5 Canvas at 60 FPS.
 * Also supports seeking and synchronizing live HTMLVideoElement B-roll loops.
 */

interface BokehOrb {
  seedX: number;
  seedY: number;
  radiusFactor: number;
  speedFactor: number;
  swayFactor: number;
  hueShift: number;
  baseAlpha: number;
}

// Pre-seeded deterministic bokeh orbs (zero runtime allocations)
const BOKEH_ORBS: BokehOrb[] = Array.from({ length: 28 }, (_, i) => ({
  seedX: (i * 137.5) % 1.0, // Golden ratio distribution
  seedY: (i * 269.3) % 1.0,
  radiusFactor: 0.35 + ((i * 7) % 10) * 0.08,
  speedFactor: 0.6 + ((i * 13) % 10) * 0.09,
  swayFactor: 1.0 + (i % 5) * 0.4,
  hueShift: (i % 3) * 12,
  baseAlpha: 0.18 + ((i * 11) % 10) * 0.03,
}));

interface StardustParticle {
  seedX: number;
  seedY: number;
  depth: number;
  speed: number;
  phase: number;
  size: number;
}

const STARDUST_PARTICLES: StardustParticle[] = Array.from({ length: 55 }, (_, i) => ({
  seedX: (i * 193.7) % 1.0,
  seedY: (i * 317.1) % 1.0,
  depth: 0.2 + (i % 10) * 0.08,
  speed: 0.4 + (i % 7) * 0.12,
  phase: (i * 1.3) % (Math.PI * 2),
  size: 1.2 + (i % 4) * 0.8,
}));

/**
 * Renders romantic, glowing candlelight bokeh orbs drifting organically upwards.
 */
export function renderCandlelightBokeh(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  intensity = 0.8,
  speed = 1.0
) {
  const baseScale = width / 1080;
  const loopPeriod = 40 / speed;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = 0; i < BOKEH_ORBS.length; i++) {
    const orb = BOKEH_ORBS[i];
    const r = orb.radiusFactor * 130 * baseScale;

    // Organic upward drift with smooth wrap-around
    const progress = ((currentTime * orb.speedFactor * 0.04 * speed) + orb.seedY) % 1.0;
    const y = (1.0 - progress) * (height + r * 2) - r;

    // Gentle sinusoidal horizontal sway
    const sway = Math.sin(currentTime * 0.7 * orb.swayFactor + orb.seedX * 10) * (35 * baseScale);
    const x = orb.seedX * width + sway;

    // Soft organic breathing pulse
    const pulse = 0.85 + Math.sin(currentTime * 1.8 + i) * 0.25;
    const alpha = Math.max(0, Math.min(1, orb.baseAlpha * intensity * pulse));

    if (alpha <= 0.01) continue;

    // Multi-stop warm candlelight radial gradient
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    // Gold / amber candlelight tones with subtle champagne highlights
    grad.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.95})`); // Pale gold core
    grad.addColorStop(0.35, `rgba(245, 158, 11, ${alpha * 0.55})`); // Rich warm amber
    grad.addColorStop(0.7, `rgba(217, 119, 6, ${alpha * 0.22})`);  // Deep sunset orange
    grad.addColorStop(1, 'rgba(180, 83, 9, 0)');                    // Fade to transparent

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders vintage 8mm celluloid film dust specks, micro-scratches & warm film grain.
 */
export function renderVintageFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  intensity = 0.8
) {
  const baseScale = width / 1080;
  const frameTick = Math.floor(currentTime * 18); // 18 FPS authentic Super-8 cadence

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // 1. Random organic dust specks (flickering with frame tick)
  const speckCount = Math.round(16 * intensity);
  for (let s = 0; s < speckCount; s++) {
    // Pseudo-random deterministic placement based on frameTick and speck index
    const seed = (frameTick * 9301 + s * 49297) % 233280;
    const randX = (seed % 1000) / 1000;
    const randY = ((seed * 7) % 1000) / 1000;
    const size = (1.5 + (seed % 4)) * baseScale;
    const alpha = (0.2 + ((seed % 10) / 25)) * intensity;

    ctx.fillStyle = `rgba(255, 250, 240, ${alpha})`;
    ctx.beginPath();
    ctx.arc(randX * width, randY * height, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Faint vertical hairline film scratch drifting across periodically
  const scratchPeriod = 6.0;
  const scratchPhase = (currentTime % scratchPeriod) / scratchPeriod;
  if (scratchPhase < 0.35) {
    const scratchX = width * (0.25 + Math.sin(scratchPhase * 20) * 0.05);
    const scratchAlpha = (0.08 + Math.sin(currentTime * 30) * 0.04) * intensity;
    ctx.strokeStyle = `rgba(255, 248, 235, ${scratchAlpha})`;
    ctx.lineWidth = 1 * baseScale;
    ctx.beginPath();
    ctx.moveTo(scratchX, 0);
    ctx.lineTo(scratchX + Math.sin(currentTime * 15) * 3, height);
    ctx.stroke();
  }

  // 3. Subtle vintage celluloid sepia color wash
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = `rgba(215, 175, 110, ${0.05 * intensity})`;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * Renders shimmering golden stardust floating in 3D parallax depth.
 */
export function renderStardustDrift(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  intensity = 0.8,
  speed = 1.0,
  voiceAvg = 0
) {
  const baseScale = width / 1080;
  const voiceBoost = 1.0 + (voiceAvg / 255) * 0.8;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = 0; i < STARDUST_PARTICLES.length; i++) {
    const p = STARDUST_PARTICLES[i];

    // Floating upward drift
    const yProg = ((currentTime * p.speed * 0.05 * speed) + p.seedY) % 1.0;
    const y = (1.0 - yProg) * height;
    const x = (p.seedX * width + Math.sin(currentTime * 0.9 + p.phase) * (20 * baseScale * p.depth)) % width;

    // Twinkling sparkle phase
    const twinkle = Math.pow(Math.max(0, Math.sin(currentTime * 3.5 + p.phase)), 3);
    const size = p.size * baseScale * (0.8 + twinkle * 0.8) * voiceBoost;
    const alpha = (0.25 + twinkle * 0.65) * intensity * p.depth;

    if (alpha <= 0.02) continue;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.3, `rgba(253, 224, 71, ${alpha * 0.8})`);
    grad.addColorStop(0.8, `rgba(245, 158, 11, ${alpha * 0.3})`);
    grad.addColorStop(1, 'rgba(217, 119, 6, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders background video element in cover aspect ratio in lockstep with export clock.
 */
export function renderVideoFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  videoEl: HTMLVideoElement,
  currentTime: number,
  videoDuration = 0
) {
  if (!videoEl || videoEl.videoWidth <= 0 || videoEl.videoHeight <= 0) return;

  const vW = videoEl.videoWidth;
  const vH = videoEl.videoHeight;
  const vRatio = vW / vH;
  const canvasRatio = width / height;

  let rW = width;
  let rH = height;
  let oX = 0;
  let oY = 0;

  if (vRatio > canvasRatio) {
    rW = height * vRatio;
    oX = -(rW - width) / 2;
  } else {
    rH = width / vRatio;
    oY = -(rH - height) / 2;
  }

  // Synchronize playback position
  const dur = videoDuration || videoEl.duration || 5.0;
  if (dur > 0 && Math.abs(videoEl.currentTime - (currentTime % dur)) > 0.08) {
    try {
      videoEl.currentTime = currentTime % dur;
    } catch {
      // Ignored
    }
  }

  ctx.drawImage(videoEl, oX, oY, rW, rH);
}

/**
 * Master dispatcher for motion shaders and video background loops.
 */
export function renderMotionBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  motionConfig: MotionBackgroundConfig | undefined,
  currentTime: number,
  voiceAvg = 0,
  videoEl?: HTMLVideoElement | null
) {
  if (!motionConfig) return;

  // 1. Video Element Pass
  if (videoEl && videoEl.readyState >= 2) {
    renderVideoFrame(ctx, width, height, videoEl, currentTime, motionConfig.videoDuration);
  }

  // 2. Procedural Motion Shaders Pass
  const preset = motionConfig.preset;
  if (!preset || preset === 'none') return;

  const speed = motionConfig.speed ?? 1.0;
  const intensity = motionConfig.intensity ?? 0.8;

  switch (preset) {
    case 'candlelight-bokeh':
      renderCandlelightBokeh(ctx, width, height, currentTime, intensity, speed);
      break;
    case 'vintage-film-dust':
      renderVintageFilmGrain(ctx, width, height, currentTime, intensity);
      break;
    case 'stardust-drift':
      renderStardustDrift(ctx, width, height, currentTime, intensity, speed, voiceAvg);
      break;
  }
}
