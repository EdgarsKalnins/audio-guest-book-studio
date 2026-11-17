import { SubtitleConfig } from '../../types/studio';
import { findActiveSubtitle } from '../subtitleEngine';

/**
 * Animated Karaoke-Style Subtitle Canvas Renderer:
 * Renders synchronized speech captions with word-level highlight illumination at 60 FPS.
 */
export function drawSubtitles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: SubtitleConfig | undefined,
  currentTime: number
) {
  if (!config || !config.enabled || !config.segments || config.segments.length === 0) {
    return;
  }

  const { activeSegment, activeWordIndex } = findActiveSubtitle(config.segments, currentTime);
  if (!activeSegment || !activeSegment.words || activeSegment.words.length === 0) {
    return;
  }

  const baseScale = width / 1080;
  const fontScale = config.fontSize || 1.0;
  const style = config.style || 'karaoke-gold';
  const highlightColor = config.highlightColor || '#d7ba7e';
  const textColor = config.textColor || '#ffffff';

  // 1. Determine font style
  let fontFam = '"Plus Jakarta Sans", sans-serif';
  let isCaps = false;
  let isItalic = false;

  switch (style) {
    case 'classic-serif':
      fontFam = '"Cormorant Garamond", serif';
      isItalic = true;
      break;
    case 'cinematic-caps':
      fontFam = '"Cinzel", "Plus Jakarta Sans", sans-serif';
      isCaps = true;
      break;
    case 'minimal-pill':
    case 'karaoke-gold':
    default:
      fontFam = '"Plus Jakarta Sans", sans-serif';
      break;
  }

  const fontSize = Math.round(32 * baseScale * fontScale);
  ctx.save();
  ctx.font = `${isItalic ? 'italic ' : ''}600 ${fontSize}px ${fontFam}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // 2. Measure full phrase and word widths
  const words = activeSegment.words;
  const wordMetrics = words.map((w) => {
    const wordText = isCaps ? w.word.toUpperCase() : w.word;
    return {
      text: wordText,
      width: ctx.measureText(wordText).width,
    };
  });

  const spaceWidth = ctx.measureText(' ').width;
  const totalTextWidth = wordMetrics.reduce((sum, m) => sum + m.width, 0) + spaceWidth * (words.length - 1);

  // 3. Determine vertical position
  let posY = height * 0.85;
  if (config.position === 'center') {
    posY = height * 0.5;
  } else if (config.position === 'top') {
    posY = height * 0.14;
  }

  const centerX = width / 2;

  // 4. Draw Frosted Dark Pill Background
  const padX = 24 * baseScale;
  const padY = 14 * baseScale;
  const pillW = totalTextWidth + padX * 2;
  const pillH = fontSize + padY * 2;
  const pillX = centerX - pillW / 2;
  const pillY = posY - pillH / 2;
  const pillRadius = pillH / 2;

  ctx.save();
  // Ambient drop shadow for high legibility over both dark and bright backgrounds
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 24 * baseScale;
  ctx.shadowOffsetY = 6 * baseScale;

  ctx.fillStyle = 'rgba(15, 12, 10, 0.78)'; // Translucent espresso tint
  ctx.beginPath();
  ctx.moveTo(pillX + pillRadius, pillY);
  ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, pillRadius);
  ctx.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, pillRadius);
  ctx.arcTo(pillX, pillY + pillH, pillX, pillY, pillRadius);
  ctx.arcTo(pillX, pillY, pillX + pillW, pillY, pillRadius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Subtle glass hairline border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1 * baseScale;
  ctx.stroke();

  // 5. Draw words with Karaoke Active-Word Highlight
  let curX = centerX - totalTextWidth / 2;

  for (let i = 0; i < wordMetrics.length; i++) {
    const m = wordMetrics[i];
    const isCurrent = i === activeWordIndex;
    const isPast = activeWordIndex >= 0 && i < activeWordIndex;

    ctx.save();
    if (isCurrent) {
      // Radiant Champagne Gold Glow for spoken word!
      ctx.fillStyle = highlightColor;
      ctx.shadowColor = highlightColor;
      ctx.shadowBlur = 14 * baseScale;
      // Slight optical scale boost on current spoken word
      ctx.font = `${isItalic ? 'italic ' : ''}700 ${Math.round(fontSize * 1.05)}px ${fontFam}`;
    } else if (isPast) {
      // Spoken words remain clear white
      ctx.fillStyle = textColor;
      ctx.shadowBlur = 0;
    } else {
      // Upcoming words in soft translucent silver/ivory
      ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.shadowBlur = 0;
    }

    ctx.fillText(m.text, curX, posY);
    ctx.restore();

    curX += m.width + spaceWidth;
  }

  ctx.restore();
}
