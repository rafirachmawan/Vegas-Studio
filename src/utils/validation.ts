import type {
  BookingFormInput,
  PackageInput,
  PhotographerInput,
  ScheduleSlotInput,
} from '../types/studio';
import { formatBayarDpLabel, formatInstagramHandle } from './formatters';

export type BookingFieldName =
  | 'tanggalIso'
  | 'fgId'
  | 'jam'
  | 'paketId'
  | 'nama_klien'
  | 'username_ig'
  | 'kampus_lokasi'
  | 'no_wa_klien'
  | 'bayar_dp';

export type BookingValidationErrors = Partial<Record<BookingFieldName, string>>;

/**
 * Memvalidasi seluruh field wajib formulir booking sesuai kolom spreadsheet operasional.
 */
export function validateBookingInput(input: BookingFormInput): BookingValidationErrors {
  const errors: BookingValidationErrors = {};

  if (!input.scheduleId.trim() || !input.tanggalIso.trim()) {
    errors.tanggalIso = 'Pilih salah satu slot jadwal berstatus Kosong terlebih dahulu.';
  }

  if (!input.fgId.trim()) {
    errors.fgId = 'Pilih fotografer (FG) yang bertugas.';
  }

  if (!input.jam.trim()) {
    errors.jam = 'Isi jam sesi (contoh: 6 pagi, 1 Siang, 3 sore).';
  }

  if (!input.paketId.trim()) {
    errors.paketId = 'Pilih paket foto yang diinginkan.';
  }

  const trimmedName = input.nama_klien.trim();
  if (!trimmedName) {
    errors.nama_klien = 'Nama klien wajib diisi.';
  } else if (trimmedName.length < 2) {
    errors.nama_klien = 'Nama klien minimal 2 karakter.';
  }

  const ig = formatInstagramHandle(input.username_ig);
  if (!ig || ig === '@') {
    errors.username_ig = 'Username IG wajib diisi (contoh: @amtriwuln_).';
  }

  if (!input.kampus_lokasi.trim()) {
    errors.kampus_lokasi = 'Kampus & lokasi wajib diisi.';
  }

  const waDigits = input.no_wa_klien.replace(/[^\d]/g, '');
  if (!waDigits) {
    errors.no_wa_klien = 'Nomor WhatsApp klien wajib diisi.';
  } else if (waDigits.length < 9) {
    errors.no_wa_klien = 'Nomor WhatsApp tampak terlalu pendek.';
  }

  if (!formatBayarDpLabel(input.bayar_dp)) {
    errors.bayar_dp = 'Isi nominal atau keterangan DP (contoh: dp 50% atau 250000).';
  }

  return errors;
}

export function validatePackageInput(
  input: PackageInput,
): Partial<Record<'nama_paket' | 'harga' | 'deskripsi', string>> {
  const errors: Partial<Record<'nama_paket' | 'harga' | 'deskripsi', string>> = {};
  if (!input.nama_paket.trim()) {
    errors.nama_paket = 'Nama paket wajib diisi.';
  }
  if (!Number.isFinite(input.harga) || input.harga <= 0) {
    errors.harga = 'Harga paket harus lebih dari Rp0.';
  }
  if (!input.deskripsi.trim()) {
    errors.deskripsi = 'Keterangan atau durasi paket wajib diisi.';
  }
  return errors;
}

export function validatePhotographerInput(
  input: PhotographerInput,
): Partial<Record<'nama_fotografer', string>> {
  const errors: Partial<Record<'nama_fotografer', string>> = {};
  if (!input.nama_fotografer.trim()) {
    errors.nama_fotografer = 'Nama fotografer wajib diisi.';
  }
  return errors;
}

export function validateScheduleSlotInput(
  input: ScheduleSlotInput,
): Partial<Record<'tanggal', string>> {
  const errors: Partial<Record<'tanggal', string>> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.tanggal.trim())) {
    errors.tanggal = 'Pilih tanggal dengan format kalender yang valid.';
  }
  return errors;
}
