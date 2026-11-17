import { SubtitleSegment, SubtitleWord } from '../types/studio';

/**
 * Parses timestamp string "00:01:23.456" or "00:01:23,456" to seconds.
 */
export function parseTimestampToSeconds(ts: string): number {
  const clean = ts.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const mins = parseFloat(parts[1]) || 0;
    const secs = parseFloat(parts[2]) || 0;
    return hours * 3600 + mins * 60 + secs;
  }
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(clean) || 0;
}

/**
 * Formats seconds to SRT timestamp: "00:00:05,200"
 */
export function formatSecondsToSrtTimestamp(secs: number): string {
  const safeSecs = Math.max(0, secs);
  const h = Math.floor(safeSecs / 3600);
  const m = Math.floor((safeSecs % 3600) / 60);
  const s = Math.floor(safeSecs % 60);
  const ms = Math.floor((safeSecs % 1) * 1000);
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Computes word-level timings proportionally across segment duration.
 */
export function computeWordTimings(
  text: string,
  start: number,
  end: number
): SubtitleWord[] {
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const duration = Math.max(0.1, end - start);
  const totalChars = rawWords.reduce((sum, w) => sum + w.length, 0);

  let curTime = start;
  const words: SubtitleWord[] = [];

  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];
    const weight = totalChars > 0 ? word.length / totalChars : 1 / rawWords.length;
    const wordDur = duration * weight;
    const wordStart = curTime;
    const wordEnd = Math.min(end, curTime + wordDur);

    words.push({
      word,
      start: Math.round(wordStart * 100) / 100,
      end: Math.round(wordEnd * 100) / 100,
    });

    curTime += wordDur;
  }

  return words;
}

/**
 * Parses SubRip (.srt) or WebVTT (.vtt) file content into SubtitleSegments with word timings.
 */
export function parseSrtOrVtt(content: string): SubtitleSegment[] {
  if (!content || typeof content !== 'string') return [];

  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const segments: SubtitleSegment[] = [];

  let currentStart = 0;
  let currentEnd = 0;
  let currentTextLines: string[] = [];
  let isCollectingText = false;

  const timeRegex = /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}|\d{1,2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}|\d{1,2}:\d{2}[,.]\d{1,3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line contains timestamp arrow
    const match = line.match(timeRegex);
    if (match) {
      // If we were already collecting a segment, save it
      if (isCollectingText && currentTextLines.length > 0) {
        const fullText = currentTextLines.join(' ').replace(/<[^>]+>/g, '').trim();
        if (fullText && currentEnd > currentStart) {
          segments.push({
            id: `sub-${segments.length + 1}-${Date.now()}`,
            start: currentStart,
            end: currentEnd,
            text: fullText,
            words: computeWordTimings(fullText, currentStart, currentEnd),
          });
        }
      }

      currentStart = parseTimestampToSeconds(match[1]);
      currentEnd = parseTimestampToSeconds(match[2]);
      currentTextLines = [];
      isCollectingText = true;
      continue;
    }

    // Blank line indicates segment delimiter
    if (line === '' && isCollectingText) {
      const fullText = currentTextLines.join(' ').replace(/<[^>]+>/g, '').trim();
      if (fullText && currentEnd > currentStart) {
        segments.push({
          id: `sub-${segments.length + 1}-${Date.now()}`,
          start: currentStart,
          end: currentEnd,
          text: fullText,
          words: computeWordTimings(fullText, currentStart, currentEnd),
        });
      }
      isCollectingText = false;
      currentTextLines = [];
      continue;
    }

    // Collect subtitle dialogue text lines (skipping number identifiers or WEBVTT header)
    if (isCollectingText && !/^\d+$/.test(line) && !line.startsWith('WEBVTT') && !line.startsWith('NOTE')) {
      currentTextLines.push(line);
    }
  }

  // Trailing segment
  if (isCollectingText && currentTextLines.length > 0) {
    const fullText = currentTextLines.join(' ').replace(/<[^>]+>/g, '').trim();
    if (fullText && currentEnd > currentStart) {
      segments.push({
        id: `sub-${segments.length + 1}-${Date.now()}`,
        start: currentStart,
        end: currentEnd,
        text: fullText,
        words: computeWordTimings(fullText, currentStart, currentEnd),
      });
    }
  }

  return segments;
}

/**
 * Parses Whisper structured JSON output into SubtitleSegments.
 */
export function parseWhisperJson(jsonContent: string): SubtitleSegment[] {
  try {
    const data = JSON.parse(jsonContent);
    const segments: SubtitleSegment[] = [];

    // Whisper output format with segments array
    if (Array.isArray(data.segments)) {
      data.segments.forEach((seg: { start: number; end: number; text: string; words?: Array<{ word: string; start: number; end: number }> }, idx: number) => {
        const text = (seg.text || '').trim();
        const start = typeof seg.start === 'number' ? seg.start : 0;
        const end = typeof seg.end === 'number' ? seg.end : start + 2;

        const words: SubtitleWord[] = Array.isArray(seg.words) && seg.words.length > 0
          ? seg.words.map((w) => ({
              word: (w.word || '').trim(),
              start: w.start,
              end: w.end,
            }))
          : computeWordTimings(text, start, end);

        segments.push({
          id: `whisper-${idx + 1}`,
          start,
          end,
          text,
          words,
        });
      });
      return segments;
    }

    // Flat words array output format
    if (Array.isArray(data.words)) {
      const words = data.words as Array<{ word: string; start: number; end: number }>;
      // Group words into natural sentence chunks of ~6-8 words
      const chunkSize = 6;
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize);
        const start = chunk[0].start;
        const end = chunk[chunk.length - 1].end;
        const text = chunk.map((c) => c.word).join(' ').trim();
        segments.push({
          id: `whisper-chunk-${Math.floor(i / chunkSize) + 1}`,
          start,
          end,
          text,
          words: chunk.map((c) => ({ word: c.word.trim(), start: c.start, end: c.end })),
        });
      }
      return segments;
    }
  } catch (err) {
    console.warn('[SubtitleEngine] JSON parsing failed:', err);
  }
  return [];
}

/**
 * Finds the currently active subtitle segment and active word index at the given audio clock.
 */
export function findActiveSubtitle(
  segments: SubtitleSegment[],
  currentTime: number
): {
  activeSegment: SubtitleSegment | null;
  activeWordIndex: number;
} {
  if (!segments || segments.length === 0) {
    return { activeSegment: null, activeWordIndex: -1 };
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (currentTime >= seg.start && currentTime <= seg.end) {
      let wordIdx = -1;
      if (seg.words && seg.words.length > 0) {
        for (let w = 0; w < seg.words.length; w++) {
          if (currentTime >= seg.words[w].start && currentTime <= seg.words[w].end) {
            wordIdx = w;
            break;
          }
        }
        // If between words within segment, pick the latest passed word
        if (wordIdx === -1) {
          for (let w = seg.words.length - 1; w >= 0; w--) {
            if (currentTime >= seg.words[w].start) {
              wordIdx = w;
              break;
            }
          }
        }
      }
      return { activeSegment: seg, activeWordIndex: wordIdx };
    }
  }

  return { activeSegment: null, activeWordIndex: -1 };
}
