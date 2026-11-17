import { StudioConfig, PhotoFilter } from '../../types/studio';

/**
 * Procedural Frame Templates Engine:
 * Renders high-fidelity physical photographic layouts (Haute Couture, Vintage Polaroid,
 * Photo Booth Strip, Vinyl Record Sleeve) with 100% offline procedural Canvas rendering.
 */

export function applyPhotoFilter(ctx: CanvasRenderingContext2D, filter: PhotoFilter) {
  switch (filter) {
    case 'vintage-warm':
      ctx.filter = 'sepia(38%) contrast(106%) brightness(103%) saturate(118%)';
      break;
    case 'black-and-white':
      ctx.filter = 'grayscale(100%) contrast(112%) brightness(102%)';
      break;
    case 'sepia':
      ctx.filter = 'sepia(85%) contrast(108%) brightness(96%) saturate(110%)';
      break;
    case 'none':
    default:
      ctx.filter = 'none';
      break;
  }
}

/**
 * Draws a dark ambient cinematic studio backdrop behind floating physical frames.
 */
export function drawAmbientStudioBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: HTMLImageElement | null
) {
  // 1. Dark ambient gradient foundation
  const baseGrad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.15,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.8
  );
  baseGrad.addColorStop(0, '#241c17');
  baseGrad.addColorStop(0.6, '#130f0c');
  baseGrad.addColorStop(1, '#090706');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. If photo is present, paint heavily blurred soft ambient color wash behind the frame
  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.save();
    try {
      ctx.filter = 'blur(45px) brightness(28%) saturate(120%)';
      const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
      const canvasRatio = width / height;
      let rW = width;
      let rH = height;
      let oX = 0;
      let oY = 0;
      if (imgRatio > canvasRatio) {
        rW = height * imgRatio;
        oX = -(rW - width) / 2;
      } else {
        rH = width / imgRatio;
        oY = -(rH - height) / 2;
      }
      ctx.drawImage(bgImage, oX, oY, rW, rH);
    } catch {
      // Fallback if filter is unsupported
    } finally {
      ctx.restore();
    }
  }

  // 3. Ambient warm vignette pass
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.3,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draws rounded rectangle path.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Helper to draw an image centered and cropped ("cover") within specified rectangle.
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scaleBoost = 1.0,
  yOffsetRatio = 0.5
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sW = img.naturalWidth;
  let sH = img.naturalHeight;
  let sX = 0;
  let sY = 0;

  if (imgRatio > targetRatio) {
    sW = (img.naturalHeight * targetRatio) / scaleBoost;
    sX = (img.naturalWidth - sW) / 2;
  } else {
    sH = (img.naturalWidth / targetRatio) / scaleBoost;
    sY = (img.naturalHeight - sH) * yOffsetRatio;
  }

  ctx.drawImage(img, Math.max(0, sX), Math.max(0, sY), sW, sH, x, y, w, h);
}

/**
 * Renders the chosen frame template into the canvas context.
 */
export function renderFrameTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: HTMLImageElement | null,
  config: StudioConfig,
  currentTime = 0
) {
  const template = config.frame?.template || 'haute-couture';
  const filter = config.frame?.photoFilter || 'none';
  const isLandscape = width > height;
  const baseScale = width / 1080;

  switch (template) {
    case 'polaroid':
      renderPolaroidFrame(ctx, width, height, bgImage, config, isLandscape, baseScale, filter);
      break;

    case 'photostrip':
      renderPhotostripFrame(ctx, width, height, bgImage, config, isLandscape, baseScale, filter);
      break;

    case 'vinyl':
      renderVinylFrame(ctx, width, height, bgImage, config, isLandscape, baseScale, filter, currentTime);
      break;

    case 'haute-couture':
    default:
      renderHauteCoutureFrame(ctx, width, height, bgImage, config, filter);
      break;
  }
}

/**
 * Haute Couture: Borderless Full-Bleed Cinematic layout
 */
function renderHauteCoutureFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: HTMLImageElement | null,
  config: StudioConfig,
  filter: PhotoFilter
) {
  if (config.backgroundMode === 'transparent') {
    ctx.clearRect(0, 0, width, height);
    return;
  }

  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0 && config.backgroundMode !== 'solid') {
    ctx.save();
    applyPhotoFilter(ctx, filter);

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
    ctx.restore();

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
}

/**
 * Vintage Polaroid Instant Print: Realistic paper card with physical tilt, 3D shadow & chin ink text
 */
function renderPolaroidFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: HTMLImageElement | null,
  config: StudioConfig,
  isLandscape: boolean,
  baseScale: number,
  filter: PhotoFilter
) {
  // 1. Draw ambient studio background
  drawAmbientStudioBackdrop(ctx, width, height, bgImage);

  // 2. Calculate responsive Polaroid dimensions
  const tiltDeg = config.frame?.tiltAngle ?? -1.4;
  let cardW: number;
  let cardH: number;
  let cx: number;
  let cy: number;

  if (isLandscape) {
    // 16:9 Landscape: Polaroid card sits comfortably on the left 42%
    cardH = height * 0.78;
    cardW = cardH / 1.22;
    cx = width * 0.32;
    cy = height * 0.5;
  } else {
    // Portrait (9:16, 4:5) or Square (1:1): Center-top card placement
    const isSquare = Math.abs(width - height) < 20;
    const maxW = width * (isSquare ? 0.64 : 0.76);
    cardW = Math.min(maxW, 820 * baseScale);
    cardH = cardW * 1.22;
    cx = width / 2;
    cy = isSquare ? height * 0.44 : height * 0.40;
  }

  const borderMargin = cardW * 0.075;
  const innerW = cardW - borderMargin * 2;
  const innerH = innerW; // Authentic square photo window
  const chinH = cardH - (borderMargin + innerH);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((tiltDeg * Math.PI) / 180);

  // 3. Layered realistic 3D drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 42 * baseScale;
  ctx.shadowOffsetX = 4 * baseScale;
  ctx.shadowOffsetY = 24 * baseScale;

  // Polaroid white paper card
  ctx.fillStyle = '#fbfaf8';
  roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 7 * baseScale);
  ctx.fill();
  ctx.restore();

  // Subtle paper edge border
  ctx.strokeStyle = 'rgba(210, 205, 195, 0.4)';
  ctx.lineWidth = 1.2 * baseScale;
  roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 7 * baseScale);
  ctx.stroke();

  // 4. Inner Photo Window with Bevel
  const photoX = -cardW / 2 + borderMargin;
  const photoY = -cardH / 2 + borderMargin;

  // Bevel shadow inside photo cavity
  ctx.save();
  ctx.fillStyle = '#11100e';
  roundRect(ctx, photoX, photoY, innerW, innerH, 3 * baseScale);
  ctx.fill();

  // Clip photo inside window
  ctx.clip();

  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.save();
    applyPhotoFilter(ctx, filter);
    drawCoverImage(ctx, bgImage, photoX, photoY, innerW, innerH, 1.0, 0.4);
    ctx.restore();

    // Subtle gloss / optical highlight overlay across photo top-left
    const gloss = ctx.createLinearGradient(photoX, photoY, photoX + innerW * 0.8, photoY + innerH * 0.8);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    gloss.addColorStop(0.4, 'rgba(255, 255, 255, 0.02)');
    gloss.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
    ctx.fillStyle = gloss;
    ctx.fillRect(photoX, photoY, innerW, innerH);
  } else {
    // Elegant warm placeholder
    const placeholderGrad = ctx.createRadialGradient(
      photoX + innerW / 2,
      photoY + innerH / 2,
      20,
      photoX + innerW / 2,
      photoY + innerH / 2,
      innerW * 0.6
    );
    placeholderGrad.addColorStop(0, '#352b24');
    placeholderGrad.addColorStop(1, '#1a1410');
    ctx.fillStyle = placeholderGrad;
    ctx.fillRect(photoX, photoY, innerW, innerH);
  }
  ctx.restore();

  // Inner window hairline stroke
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 1.5 * baseScale;
  roundRect(ctx, photoX, photoY, innerW, innerH, 3 * baseScale);
  ctx.stroke();

  // 5. Bottom Chin Handwritten Ink Notes
  const showChin = config.frame?.showChinText !== false;
  const chinText = config.frame?.chinText || config.typography.coupleNames;

  if (showChin && chinText) {
    const chinCenterY = photoY + innerH + chinH * 0.42;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#262220'; // Organic dark fountain pen ink

    // Couple names / headline script
    const fontSize = Math.round(30 * baseScale * (config.typography.fontSize || 1.0));
    ctx.font = `italic 500 ${fontSize}px "Cormorant Garamond", "Playfair Display", serif`;
    ctx.fillText(chinText, 0, chinCenterY);

    // Date or secondary line
    if (config.typography.dateText) {
      const dateSize = Math.round(15 * baseScale * (config.typography.fontSize || 1.0));
      ctx.font = `400 ${dateSize}px "Cormorant Garamond", "Playfair Display", serif`;
      ctx.fillStyle = 'rgba(45, 38, 35, 0.72)';
      ctx.fillText(config.typography.dateText, 0, chinCenterY + fontSize * 0.75);
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Photo Booth Strip: Retro vertical 3-shot photo booth strip
 */
function renderPhotostripFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: HTMLImageElement | null,
  config: StudioConfig,
  isLandscape: boolean,
  baseScale: number,
  filter: PhotoFilter
) {
  // 1. Ambient backdrop
  drawAmbientStudioBackdrop(ctx, width, height, bgImage);

  // 2. Geometry
  let stripW: number;
  let stripH: number;
  let cx: number;
  let cy: number;
  const tiltDeg = config.frame?.tiltAngle ?? -1.0;

  if (isLandscape) {
    stripH = height * 0.86;
    stripW = stripH * 0.38;
    cx = width * 0.28;
    cy = height * 0.5;
  } else {
    stripH = height * 0.62;
    stripW = stripH * 0.42;
    cx = width * 0.5;
    cy = height * 0.37;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((tiltDeg * Math.PI) / 180);

  // 3. Drop shadow & white strip background
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 38 * baseScale;
  ctx.shadowOffsetY = 18 * baseScale;

  ctx.fillStyle = '#fcfbfa';
  roundRect(ctx, -stripW / 2, -stripH / 2, stripW, stripH, 5 * baseScale);
  ctx.fill();
  ctx.restore();

  // Strip border stroke
  ctx.strokeStyle = 'rgba(215, 210, 200, 0.5)';
  ctx.lineWidth = 1.2 * baseScale;
  roundRect(ctx, -stripW / 2, -stripH / 2, stripW, stripH, 5 * baseScale);
  ctx.stroke();

  // 4. Three Vertical Photo Cells
  const marginH = stripW * 0.07;
  const cellW = stripW - marginH * 2;
  const cellH = cellW * 0.88;
  const gap = stripH * 0.022;
  const totalCellsH = cellH * 3 + gap * 2;
  const startY = -stripH / 2 + (stripH - totalCellsH) * 0.35;

  const yOffsets = [0.3, 0.5, 0.65]; // Progressive zooms / crops for candid motion feel
  const scales = [1.15, 1.0, 1.1];

  for (let i = 0; i < 3; i++) {
    const cY = startY + i * (cellH + gap);
    const cX = -stripW / 2 + marginH;

    ctx.save();
    ctx.fillStyle = '#1a1512';
    roundRect(ctx, cX, cY, cellW, cellH, 2 * baseScale);
    ctx.fill();
    ctx.clip();

    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      ctx.save();
      applyPhotoFilter(ctx, filter);
      drawCoverImage(ctx, bgImage, cX, cY, cellW, cellH, scales[i], yOffsets[i]);
      ctx.restore();
    }
    ctx.restore();

    // Hairline cell border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = 1 * baseScale;
    roundRect(ctx, cX, cY, cellW, cellH, 2 * baseScale);
    ctx.stroke();
  }

  // 5. Bottom Photobooth stamp text
  const chinText = config.frame?.chinText || config.typography.coupleNames;
  if (chinText) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(40, 35, 32, 0.85)';
    const stampSize = Math.round(14 * baseScale * (config.typography.fontSize || 1.0));
    ctx.font = `600 ${stampSize}px "Cinzel", "Cormorant Garamond", serif`;
    ctx.letterSpacing = `${Math.round(2 * baseScale)}px`;
    ctx.fillText(chinText.toUpperCase(), 0, stripH / 2 - stripH * 0.045);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Vinyl Record Sleeve: Spun glossy vinyl disc peeking from 12" album cover with rotation
 */
function renderVinylFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: HTMLImageElement | null,
  config: StudioConfig,
  isLandscape: boolean,
  baseScale: number,
  filter: PhotoFilter,
  currentTime = 0
) {
  // 1. Ambient backdrop
  drawAmbientStudioBackdrop(ctx, width, height, bgImage);

  // 2. Geometry
  let jacketSize: number;
  let cx: number;
  let cy: number;

  if (isLandscape) {
    jacketSize = height * 0.72;
    cx = width * 0.36;
    cy = height * 0.5;
  } else {
    jacketSize = Math.min(width * 0.65, 700 * baseScale);
    cx = width * 0.44;
    cy = height * 0.38;
  }

  const vinylRadius = jacketSize * 0.48;
  const vinylCx = cx + jacketSize * 0.34; // Peeking out to the right
  const vinylCy = cy;
  const rotation = (currentTime * 0.6) % (Math.PI * 2);

  // 3. Draw Vinyl Record Disc (behind the jacket cover)
  ctx.save();
  ctx.translate(vinylCx, vinylCy);
  ctx.rotate(rotation);

  // Deep shadow behind vinyl disc
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 32 * baseScale;
  ctx.shadowOffsetX = 8 * baseScale;
  ctx.shadowOffsetY = 12 * baseScale;
  ctx.fillStyle = '#0f0f10';
  ctx.beginPath();
  ctx.arc(0, 0, vinylRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Glossy vinyl grooves with radial sheen
  const sheen = ctx.createRadialGradient(0, 0, vinylRadius * 0.2, 0, 0, vinylRadius);
  sheen.addColorStop(0, '#151517');
  sheen.addColorStop(0.3, '#1d1d20');
  sheen.addColorStop(0.5, '#121214');
  sheen.addColorStop(0.75, '#1a1a1d');
  sheen.addColorStop(1, '#0e0e0f');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(0, 0, vinylRadius, 0, Math.PI * 2);
  ctx.fill();

  // Realistic micro sound grooves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const numGrooves = 18;
  for (let g = 0; g < numGrooves; g++) {
    const r = vinylRadius * 0.36 + (vinylRadius * 0.6 * (g / numGrooves));
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center Paper Label
  const labelRadius = vinylRadius * 0.34;
  ctx.fillStyle = '#d7ba7e'; // Champagne gold paper label
  ctx.beginPath();
  ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
  ctx.fill();

  // Center label ring
  ctx.strokeStyle = '#b8995a';
  ctx.lineWidth = 1.5 * baseScale;
  ctx.beginPath();
  ctx.arc(0, 0, labelRadius * 0.88, 0, Math.PI * 2);
  ctx.stroke();

  // Center spindle hole
  ctx.fillStyle = '#0a0a0b';
  ctx.beginPath();
  ctx.arc(0, 0, 6 * baseScale, 0, Math.PI * 2);
  ctx.fill();

  // Label text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1c1710';
  const labelFontSize = Math.max(9, Math.round(11 * baseScale));
  ctx.font = `600 ${labelFontSize}px "Cinzel", "Cormorant Garamond", serif`;
  ctx.fillText('SIDE A • 33 RPM', 0, -labelRadius * 0.42);

  const titleText = config.typography.coupleNames || 'Wedding Voicemails';
  ctx.font = `italic 500 ${labelFontSize + 1}px "Cormorant Garamond", serif`;
  ctx.fillText(titleText, 0, labelRadius * 0.45);

  ctx.restore();

  // 4. Draw Album Jacket (Cover) overlapping left half of vinyl
  const jacketX = cx - jacketSize / 2;
  const jacketY = cy - jacketSize / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 42 * baseScale;
  ctx.shadowOffsetX = 4 * baseScale;
  ctx.shadowOffsetY = 20 * baseScale;

  ctx.fillStyle = '#1a1614';
  roundRect(ctx, jacketX, jacketY, jacketSize, jacketSize, 4 * baseScale);
  ctx.fill();
  ctx.restore();

  // Draw photo onto album jacket
  ctx.save();
  roundRect(ctx, jacketX, jacketY, jacketSize, jacketSize, 4 * baseScale);
  ctx.clip();

  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.save();
    applyPhotoFilter(ctx, filter);
    drawCoverImage(ctx, bgImage, jacketX, jacketY, jacketSize, jacketSize, 1.0, 0.5);
    ctx.restore();

    // Subtle cardboard spine line on left edge
    const spine = ctx.createLinearGradient(jacketX, jacketY, jacketX + 18 * baseScale, jacketY);
    spine.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    spine.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
    spine.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spine;
    ctx.fillRect(jacketX, jacketY, 18 * baseScale, jacketSize);
  } else {
    const sleeveGrad = ctx.createLinearGradient(jacketX, jacketY, jacketX + jacketSize, jacketY + jacketSize);
    sleeveGrad.addColorStop(0, '#2e241e');
    sleeveGrad.addColorStop(1, '#15100d');
    ctx.fillStyle = sleeveGrad;
    ctx.fillRect(jacketX, jacketY, jacketSize, jacketSize);
  }
  ctx.restore();

  // Subtle album jacket rim stroke
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.2 * baseScale;
  roundRect(ctx, jacketX, jacketY, jacketSize, jacketSize, 4 * baseScale);
  ctx.stroke();
}
