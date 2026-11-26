import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppBookingUrl,
  isMobileUserAgent,
  normalizeWhatsAppNumber,
} from './whatsapp';

describe('whatsapp utilities', () => {
  it('menormalkan format nomor Indonesia (+62, 08xx, spasi, tanda hubung)', () => {
    expect(normalizeWhatsAppNumber('+62 812-3456-7890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('081234567890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('81234567890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('')).toBe('');
  });

  it('menyusun pesan terstruktur rapi, URL wa.me, dan URL web.whatsapp.com dengan baris baru %0A', () => {
    const result = buildWhatsAppBookingUrl('0812-9988-7766', {
      no: 1,
      tanggal: '16/12/2026',
      fg: 'Vegas',
      jam: '3 sore',
      paket: 'Basic Foto',
      namaKlien: 'Amanda tri Wulandari',
      usernameIg: '@amtriwuln_',
      kampusLokasi: 'UIN Tulungagung',
      noWaBayar: '0812-5554-5565 (dp 50%)',
      status: 'Belum',
      hargaPaket: 350000,
      mode: 'live',
    });

    expect(result.normalizedPhone).toBe('6281299887766');
    expect(result.url).toMatch(/^https:\/\/wa\.me\/6281299887766\?text=/);
    expect(result.webUrl).toMatch(/^https:\/\/web\.whatsapp\.com\/send\?phone=6281299887766&text=/);
    expect(result.url).toContain('%0A');
    expect(result.webUrl).toContain('%0A');
    expect(result.message).not.toContain('•');

    const decoded = decodeURIComponent(result.webUrl!.split('text=')[1] ?? '');
    expect(decoded).toContain('*Vegas Studio*');
    expect(decoded).toContain('*DETAIL JADWAL & PAKET*');
    expect(decoded).toContain('*No. Rekap:* #1');
    expect(decoded).toContain('*Tanggal:* 16/12/2026');
    expect(decoded).toContain('*FG (Fotografer):* Vegas');
    expect(decoded).toContain('*Jam:* 3 sore');
    expect(decoded).toContain('*Paket:* Basic Foto (Rp350.000)');
    expect(decoded).toContain('*DATA KLIEN & PEMBAYARAN*');
    expect(decoded).toContain('*Nama Klien:* Amanda tri Wulandari');
    expect(decoded).toContain('*Username IG:* @amtriwuln_');
    expect(decoded).toContain('*Kampus & Lokasi:* UIN Tulungagung');
    expect(decoded).toContain('*No. WA & Bayar:* 0812-5554-5565 (dp 50%)');
    expect(decoded).toContain('*Status:* Belum');
    expect(decoded.split('\n').length).toBeGreaterThan(12);
  });

  it('membedakan user-agent mobile dan desktop dengan benar', () => {
    expect(
      isMobileUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile'),
    ).toBe(true);
    expect(
      isMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'),
    ).toBe(true);
    expect(
      isMobileUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36'),
    ).toBe(false);
  });

  it('mengembalikan url dan webUrl null jika nomor WhatsApp admin belum valid', () => {
    const result = buildWhatsAppBookingUrl('', {
      tanggal: '16/12/2026',
      fg: 'Age',
      jam: '2 siang',
      paket: 'Basic Foto',
      namaKlien: 'Budi',
      usernameIg: '@budi',
      kampusLokasi: 'Tropical house',
      noWaBayar: '0812-0000-1111 (dp 50%)',
      status: 'Belum',
    });
    expect(result.url).toBeNull();
    expect(result.webUrl).toBeNull();
    expect(result.message).toContain('Budi');
  });
});
