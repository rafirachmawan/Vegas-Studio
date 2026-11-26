import { describe, expect, it } from 'vitest';
import {
  formatBayarDpLabel,
  formatInstagramHandle,
  formatJamSlot,
  formatNoWaBayarCell,
  formatRupiah,
  formatTanggalIndonesia,
  formatTanggalSpreadsheet,
  formatThousandsInput,
  parseRupiahInput,
} from './formatters';

describe('formatters', () => {
  it('memformat Rupiah tanpa spasi setelah Rp dan tanpa desimal', () => {
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(350000)).toBe('Rp350.000');
    expect(formatRupiah(1250000)).toBe('Rp1.250.000');
    expect(formatRupiah(-50000)).toBe('-Rp50.000');
    expect(formatRupiah(Number.NaN)).toBe('Rp0');
  });

  it('mem-parse dan memformat ribuan dari input nominal', () => {
    expect(parseRupiahInput('Rp 250.000')).toBe(250000);
    expect(parseRupiahInput('abc')).toBe(0);
    expect(formatThousandsInput('250000')).toBe('250.000');
    expect(formatThousandsInput('')).toBe('');
  });

  it('mengonversi tanggal ISO ke DD/MM/YYYY spreadsheet dan notasi baca Indonesia', () => {
    expect(formatTanggalSpreadsheet('2026-12-16')).toBe('16/12/2026');
    expect(formatTanggalSpreadsheet('16/12/2026')).toBe('16/12/2026');
    expect(formatTanggalIndonesia('2026-12-16')).toBe('Rabu, 16 Des 2026');
    expect(formatTanggalIndonesia('16/12/2026', false)).toBe('16 Des 2026');
    expect(formatTanggalIndonesia('2026-02-31')).toBe('2026-02-31');
  });

  it('menormalkan jam sesi, username IG, dan kolom No. WA & Bayar', () => {
    expect(formatJamSlot('09:00')).toBe('09.00 WIB');
    expect(formatJamSlot('3 sore')).toBe('3 sore');
    expect(formatJamSlot('')).toBe('Sesi fleksibel');

    expect(formatInstagramHandle('amtriwuln_')).toBe('@amtriwuln_');
    expect(formatInstagramHandle('@amtriwuln_')).toBe('@amtriwuln_');

    expect(formatBayarDpLabel('250000')).toBe('dp Rp250.000');
    expect(formatBayarDpLabel('50%')).toBe('dp 50%');
    expect(formatBayarDpLabel('dp 60%')).toBe('dp 60%');

    expect(formatNoWaBayarCell('0812-5554-5565', '50%')).toBe('0812-5554-5565 (dp 50%)');
    expect(formatNoWaBayarCell('0812-5554-5565', '250000')).toBe(
      '0812-5554-5565 (dp Rp250.000)',
    );
  });
});
