import QRCode from 'qrcode';
import { QrWatermarkConfig } from '../types/studio';

const qrCanvasCache = new Map<string, HTMLCanvasElement>();

/**
 * Generates an offline offscreen canvas containing the QR code.
 * Cached in-memory by url + size so 30/60 FPS video frame loops incur 0 rendering overhead.
 */
export function getQrCanvas(url: string, size: number = 200): HTMLCanvasElement | null {
  if (!url || typeof document === 'undefined') return null;
  const cacheKey = `${url}_${size}`;
  if (qrCanvasCache.has(cacheKey)) {
    return qrCanvasCache.get(cacheKey)!;
  }

  try {
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Clear transparent
    ctx.clearRect(0, 0, size, size);

    const margin = 2; // quiet zone in module units
    const totalUnits = moduleCount + margin * 2;
    const unitSize = size / totalUnits;

    // Crisp black modules with slight rounded corners
    ctx.fillStyle = '#0a0a0c';

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          const x = (c + margin) * unitSize;
          const y = (r + margin) * unitSize;
          ctx.fillRect(x, y, unitSize + 0.5, unitSize + 0.5);
        }
      }
    }

    qrCanvasCache.set(cacheKey, canvas);
    return canvas;
  } catch (err) {
    console.error('[QRGenerator] Failed to generate QR matrix:', err);
    return null;
  }
}

/**
 * Draws the luxury QR Watermark badge at the configured corner.
 */
export function drawQrBadge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: QrWatermarkConfig
) {
  if (!config.enabled || !config.url) return;

  const baseScale = width / 1080;
  const qrPixelSize = Math.round(config.size * baseScale);
  const qrCanvas = getQrCanvas(config.url, qrPixelSize);
  if (!qrCanvas) return;

  const margin = Math.round(36 * baseScale);
  const badgePadding = Math.round(12 * baseScale);
  const hasLabel = Boolean(config.label && config.label.trim());
  const labelHeight = hasLabel ? Math.round(20 * baseScale) : 0;

  const badgeWidth = qrPixelSize + badgePadding * 2;
  const badgeHeight = qrPixelSize + badgePadding * 2 + labelHeight;

  let badgeX = margin;
  let badgeY = margin;

  switch (config.position) {
    case 'top-left':
      badgeX = margin;
      badgeY = margin;
      break;
    case 'top-right':
      badgeX = width - badgeWidth - margin;
      badgeY = margin;
      break;
    case 'bottom-left':
      badgeX = margin;
      badgeY = height - badgeHeight - margin;
      break;
    case 'bottom-right':
      badgeX = width - badgeWidth - margin;
      badgeY = height - badgeHeight - margin;
      break;
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0.1, Math.min(1.0, config.opacity));

  // 1. Frosted white/cream pill badge background
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = Math.round(16 * baseScale);
  ctx.shadowOffsetY = Math.round(4 * baseScale);

  const radius = Math.round(16 * baseScale);
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, radius);
  ctx.fill();

  // Reset shadow for crisp rendering inside
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Thin champagne gold / neutral border
  ctx.strokeStyle = 'rgba(215, 186, 126, 0.4)';
  ctx.lineWidth = 1.5 * baseScale;
  ctx.stroke();

  // 2. Stamp QR Code Canvas
  ctx.drawImage(qrCanvas, badgeX + badgePadding, badgeY + badgePadding);

  // 3. Optional Micro-Label
  if (hasLabel) {
    ctx.fillStyle = '#1c1917'; // warm charcoal
    ctx.textAlign = 'center';
    ctx.font = `600 ${Math.round(10.5 * baseScale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.letterSpacing = `${Math.round(1.5 * baseScale)}px`;
    ctx.fillText(
      config.label.toUpperCase(),
      badgeX + badgeWidth / 2,
      badgeY + badgePadding + qrPixelSize + Math.round(13 * baseScale)
    );
  }

  ctx.restore();
}
