import { describe, expect, it } from 'vitest';
import {
  validateBookingInput,
  validatePackageInput,
  validatePhotographerInput,
  validateScheduleSlotInput,
} from './validation';

describe('validation', () => {
  it('menolak form booking kosong dan memvalidasi seluruh field header spreadsheet', () => {
    const errors = validateBookingInput({
      scheduleId: '',
      tanggalIso: '',
      fgId: '',
      jam: '',
      paketId: '',
      nama_klien: '',
      username_ig: '',
      kampus_lokasi: '',
      no_wa_klien: '',
      bayar_dp: '',
    });

    expect(errors.tanggalIso).toBeDefined();
    expect(errors.fgId).toBeDefined();
    expect(errors.jam).toBeDefined();
    expect(errors.paketId).toBeDefined();
    expect(errors.nama_klien).toBeDefined();
    expect(errors.username_ig).toBeDefined();
    expect(errors.kampus_lokasi).toBeDefined();
    expect(errors.no_wa_klien).toBeDefined();
    expect(errors.bayar_dp).toBeDefined();
  });

  it('menerima nama tunggal Indonesia, apostrof, tanda hubung, serta DP persentase atau rupiah', () => {
    const errors = validateBookingInput({
      scheduleId: 'jdw-102',
      tanggalIso: '2026-12-16',
      fgId: 'ftg-01',
      jam: '3 sore',
      paketId: 'pkt-01',
      nama_klien: "Ma'ruf-Suharto",
      username_ig: 'maruf.id',
      kampus_lokasi: 'UIN Tulungagung',
      no_wa_klien: '0812-5554-5565',
      bayar_dp: 'dp 50%',
    });

    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('menolak nomor WA klien terlalu pendek atau DP kosong', () => {
    const errors = validateBookingInput({
      scheduleId: 'jdw-102',
      tanggalIso: '2026-12-16',
      fgId: 'ftg-01',
      jam: '3 sore',
      paketId: 'pkt-01',
      nama_klien: 'Sukarno',
      username_ig: '@sukarno',
      kampus_lokasi: 'Tropical house',
      no_wa_klien: '123',
      bayar_dp: '0',
    });

    expect(errors.no_wa_klien).toBeDefined();
    expect(errors.bayar_dp).toBeDefined();
  });

  it('memvalidasi input CRUD admin untuk Paket, Fotografer, dan Jadwal', () => {
    expect(
      validatePackageInput({ nama_paket: '', harga: 0, deskripsi: '', aktif: true }),
    ).toHaveProperty('nama_paket');
    expect(
      validatePhotographerInput({ nama_fotografer: '', spesialisasi: '', aktif: true }),
    ).toHaveProperty('nama_fotografer');
    expect(validateScheduleSlotInput({ tanggal: 'invalid', jam: '', catatan: '' })).toHaveProperty(
      'tanggal',
    );
  });
});
