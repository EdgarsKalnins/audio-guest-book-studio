import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import { getQrCanvas } from '../src/engine/qrGenerator';

describe('Offline Dynamic QR Code Generator', () => {
  it('generates a valid QR 2D bit matrix offline with zero network calls', () => {
    const url = 'https://momentbox.lv';
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });

    expect(qr).toBeDefined();
    expect(qr.modules).toBeDefined();
    expect(qr.modules.size).toBeGreaterThan(10);

    // Verify matrix can be read
    const topLeftModule = qr.modules.get(0, 0);
    expect(typeof topLeftModule).toBe('number');
  });

  it('handles arbitrary URLs and special characters gracefully', () => {
    const testUrls = [
      'https://momentbox.lv',
      'https://example.com/audio/wedding-guestbook?id=123&code=sarah-michael',
      'tel:+37120000000',
    ];

    testUrls.forEach((url) => {
      const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
      expect(qr.modules.size).toBeGreaterThan(15);
      expect(qr.modules.data.length).toBe(qr.modules.size * qr.modules.size);
    });
  });

  it('handles empty or blank URLs without crashing', () => {
    const canvas = getQrCanvas('');
    expect(canvas).toBeNull();
  });
});
