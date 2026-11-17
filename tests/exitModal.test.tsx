import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ExitModal } from '../src/components/ExitModal';

describe('ExitModal Confirmation Component', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToString(
      <ExitModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirmExit={vi.fn()}
        isExporting={false}
        tracksCount={0}
      />
    );
    expect(html).toBe('');
  });

  it('renders standard exit dialog when idle with loaded tracks', () => {
    const html = renderToString(
      <ExitModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirmExit={vi.fn()}
        isExporting={false}
        tracksCount={3}
        audioName="Sarah & Michael - Voicemail.mp3"
      />
    );

    expect(html).toContain('Exit Audio Guest Book Studio?');
    expect(html).toContain('3');
    expect(html).toContain('guest recording');
    expect(html).toContain('Sarah &amp; Michael - Voicemail.mp3');
    expect(html).toContain('Stay in Studio');
    expect(html).toContain('Exit Studio');
  });

  it('renders high-warning dialog with progress bar when export is actively running', () => {
    const html = renderToString(
      <ExitModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirmExit={vi.fn()}
        isExporting={true}
        exportPercentage={54}
        tracksCount={1}
      />
    );

    expect(html).toContain('Cancel Export &amp; Exit Studio?');
    expect(html).toContain('Active 1080p video compilation in progress');
    expect(html).toContain('54%');
    expect(html).toContain('Stay in Studio');
    expect(html).toContain('Discard &amp; Exit');
  });
});
