import type {
  BookingRecord,
  BookingSubmissionPayload,
  BookingSubmissionResult,
  PackageInput,
  PackageItem,
  Photographer,
  PhotographerInput,
  ScheduleSlot,
  ScheduleSlotInput,
  SlotStatus,
  StudioSnapshot,
} from '../types/studio';
import { formatTanggalSpreadsheet } from '../utils/formatters';

const PREVIEW_STORAGE_KEY = 'vegas_studio_preview_v2';

interface PreviewDatabase {
  jadwal: ScheduleSlot[];
  paket: PackageItem[];
  fotografer: Photographer[];
  rekap: BookingRecord[];
}

function addDaysIso(offsetDays: number): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + offsetDays);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createInitialPreviewDatabase(): PreviewDatabase {
  const day1 = addDaysIso(1);
  const day2 = addDaysIso(2);
  const day3 = addDaysIso(3);
  const day4 = addDaysIso(5);
  const day5 = addDaysIso(6);

  return {
    jadwal: [
      {
        id: 'jdw-101',
        tanggal: day1,
        jam: '6 pagi',
        status: 'Booked',
        catatan: 'Sesi wisuda pagi (contoh)',
      },
      {
        id: 'jdw-102',
        tanggal: day1,
        jam: '3 sore',
        status: 'Kosong',
        catatan: 'Sesi sore outdoor / studio',
      },
      {
        id: 'jdw-103',
        tanggal: day2,
        jam: '1 Siang',
        status: 'Kosong',
        catatan: 'Tersedia sesi wisuda atau portrait',
      },
      {
        id: 'jdw-104',
        tanggal: day2,
        jam: '2 siang',
        status: 'Kosong',
        catatan: 'Sesi siang studio atau kampus',
      },
      {
        id: 'jdw-105',
        tanggal: day3,
        jam: '6 pagi',
        status: 'Booked',
        catatan: 'Sesi wisuda kampus (contoh)',
      },
      {
        id: 'jdw-106',
        tanggal: day3,
        jam: '4 sore',
        status: 'Kosong',
        catatan: 'Sesi sore golden hour',
      },
      {
        id: 'jdw-107',
        tanggal: day4,
        jam: '1 Siang',
        status: 'Kosong',
        catatan: 'Slot akhir pekan siang',
      },
      {
        id: 'jdw-108',
        tanggal: day5,
        jam: '3 sore',
        status: 'Kosong',
        catatan: 'Slot akhir pekan sore',
      },
    ],
    paket: [
      {
        id: 'pkt-01',
        nama_paket: 'Basic Foto',
        harga: 350000,
        deskripsi: 'Sesi foto wisuda/portrait 60 menit, file edit warna & mentahan (contoh preview).',
        aktif: true,
      },
      {
        id: 'pkt-02',
        nama_paket: 'Bundling Foto dan Video',
        harga: 650000,
        deskripsi: 'Sesi foto sekaligus video reels dokumentasi berdurasi 90 menit (contoh preview).',
        aktif: true,
      },
      {
        id: 'pkt-03',
        nama_paket: 'Couple & Keluarga Studio',
        harga: 550000,
        deskripsi: 'Sesi berdua atau keluarga hingga 5 orang, termasuk edit pilihan (contoh preview).',
        aktif: true,
      },
    ],
    fotografer: [
      {
        id: 'ftg-01',
        nama_fotografer: 'Vegas',
        spesialisasi: 'Wisuda & Portrait',
        aktif: true,
      },
      {
        id: 'ftg-02',
        nama_fotografer: 'Age',
        spesialisasi: 'Wisuda & Video',
        aktif: true,
      },
      {
        id: 'ftg-03',
        nama_fotografer: 'Vegas dan Age',
        spesialisasi: 'Bundling Tim Lengkap',
        aktif: true,
      },
    ],
    rekap: [
      {
        no: 1,
        tanggal: formatTanggalSpreadsheet(day1),
        fg: 'Vegas',
        jam: '6 pagi',
        paket: 'Basic Foto',
        nama_klien: 'Contoh Klien 1 (Preview)',
        username_ig: '@contohklien1',
        kampus_lokasi: 'UIN Tulungagung',
        no_wa_bayar: '0812-0000-0001 (dp 50%)',
        status: 'Belum',
      },
      {
        no: 2,
        tanggal: formatTanggalSpreadsheet(day3),
        fg: 'Vegas dan Age',
        jam: '6 pagi',
        paket: 'Bundling Foto dan Video',
        nama_klien: 'Contoh Klien 2 (Preview)',
        username_ig: '@contohklien2',
        kampus_lokasi: 'Tropical house',
        no_wa_bayar: '0812-0000-0002 (dp 50%)',
        status: 'Belum',
      },
    ],
  };
}

function readDb(): PreviewDatabase {
  if (typeof window === 'undefined') {
    return createInitialPreviewDatabase();
  }
  try {
    const raw = window.localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialPreviewDatabase();
      window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<PreviewDatabase>;
    if (
      !Array.isArray(parsed.jadwal) ||
      !Array.isArray(parsed.paket) ||
      !Array.isArray(parsed.fotografer) ||
      !Array.isArray(parsed.rekap)
    ) {
      const initial = createInitialPreviewDatabase();
      window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed as PreviewDatabase;
  } catch {
    return createInitialPreviewDatabase();
  }
}

function writeDb(db: PreviewDatabase): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(db));
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getPreviewSnapshot(): StudioSnapshot {
  const db = readDb();
  return {
    jadwal: [...db.jadwal].sort((a, b) => `${a.tanggal} ${a.jam}`.localeCompare(`${b.tanggal} ${b.jam}`)),
    paket: [...db.paket],
    fotografer: [...db.fotografer],
    rekap: [...db.rekap].sort((a, b) => a.no - b.no),
    mode: 'preview',
    fetchedAt: new Date().toISOString(),
  };
}

export function resetPreviewDatabase(): StudioSnapshot {
  const fresh = createInitialPreviewDatabase();
  writeDb(fresh);
  return getPreviewSnapshot();
}

export class PreviewSlotConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreviewSlotConflictError';
  }
}

export function createPreviewBooking(payload: BookingSubmissionPayload): BookingSubmissionResult {
  const db = readDb();
  const slotIndex = db.jadwal.findIndex((item) => item.id === payload.scheduleId);
  if (slotIndex === -1) {
    throw new PreviewSlotConflictError('Slot jadwal tidak ditemukan. Muat ulang jadwal terbaru.');
  }
  const targetSlot = db.jadwal[slotIndex];
  if (!targetSlot || targetSlot.status === 'Booked') {
    throw new PreviewSlotConflictError(
      'Slot jadwal ini baru saja terisi oleh pemesan lain. Pilih slot berstatus Kosong lainnya.',
    );
  }

  const updatedSlot: ScheduleSlot = {
    ...targetSlot,
    status: 'Booked',
  };
  db.jadwal[slotIndex] = updatedSlot;

  const maxNo = db.rekap.reduce((acc, row) => Math.max(acc, row.no || 0), 0);
  const record: BookingRecord = {
    no: maxNo + 1,
    tanggal: payload.tanggal,
    fg: payload.fg,
    jam: payload.jam,
    paket: payload.paket,
    nama_klien: payload.nama_klien.trim(),
    username_ig: payload.username_ig.trim(),
    kampus_lokasi: payload.kampus_lokasi.trim(),
    no_wa_bayar: payload.no_wa_bayar.trim(),
    status: payload.status || 'Belum',
    harga_paket: payload.harga_paket,
  };

  db.rekap = [...db.rekap, record];
  writeDb(db);

  return {
    record,
    updatedSlot,
    mode: 'preview',
  };
}

export function updatePreviewBookingStatus(no: number, status: string): BookingRecord {
  const db = readDb();
  const idx = db.rekap.findIndex((row) => row.no === no);
  if (idx === -1) {
    throw new Error('Baris booking tidak ditemukan.');
  }
  const updated: BookingRecord = { ...db.rekap[idx]!, status: status.trim() || 'Belum' };
  db.rekap[idx] = updated;
  writeDb(db);
  return updated;
}

export function createPreviewPackage(input: PackageInput): PackageItem {
  const db = readDb();
  const created: PackageItem = {
    id: createId('pkt'),
    nama_paket: input.nama_paket.trim(),
    harga: Math.round(input.harga),
    deskripsi: input.deskripsi.trim(),
    aktif: input.aktif,
  };
  db.paket.push(created);
  writeDb(db);
  return created;
}

export function updatePreviewPackage(id: string, input: PackageInput): PackageItem {
  const db = readDb();
  const idx = db.paket.findIndex((item) => item.id === id);
  if (idx === -1) {
    throw new Error('Data paket tidak ditemukan.');
  }
  const updated: PackageItem = {
    id,
    nama_paket: input.nama_paket.trim(),
    harga: Math.round(input.harga),
    deskripsi: input.deskripsi.trim(),
    aktif: input.aktif,
  };
  db.paket[idx] = updated;
  writeDb(db);
  return updated;
}

export function deletePreviewPackage(id: string): void {
  const db = readDb();
  db.paket = db.paket.filter((item) => item.id !== id);
  writeDb(db);
}

export function createPreviewPhotographer(input: PhotographerInput): Photographer {
  const db = readDb();
  const created: Photographer = {
    id: createId('ftg'),
    nama_fotografer: input.nama_fotografer.trim(),
    spesialisasi: input.spesialisasi.trim(),
    aktif: input.aktif,
  };
  db.fotografer.push(created);
  writeDb(db);
  return created;
}

export function updatePreviewPhotographer(id: string, input: PhotographerInput): Photographer {
  const db = readDb();
  const idx = db.fotografer.findIndex((item) => item.id === id);
  if (idx === -1) {
    throw new Error('Data fotografer tidak ditemukan.');
  }
  const updated: Photographer = {
    id,
    nama_fotografer: input.nama_fotografer.trim(),
    spesialisasi: input.spesialisasi.trim(),
    aktif: input.aktif,
  };
  db.fotografer[idx] = updated;
  writeDb(db);
  return updated;
}

export function deletePreviewPhotographer(id: string): void {
  const db = readDb();
  db.fotografer = db.fotografer.filter((item) => item.id !== id);
  writeDb(db);
}

export function createPreviewScheduleSlot(input: ScheduleSlotInput): ScheduleSlot {
  const db = readDb();
  const created: ScheduleSlot = {
    id: createId('jdw'),
    tanggal: input.tanggal.trim(),
    jam: input.jam.trim(),
    status: input.status ?? 'Kosong',
    catatan: input.catatan.trim(),
  };
  db.jadwal.push(created);
  writeDb(db);
  return created;
}

export function updatePreviewScheduleStatus(id: string, status: SlotStatus): ScheduleSlot {
  const db = readDb();
  const idx = db.jadwal.findIndex((item) => item.id === id);
  if (idx === -1) {
    throw new Error('Slot jadwal tidak ditemukan.');
  }
  const existing = db.jadwal[idx]!;
  const updated: ScheduleSlot = { ...existing, status };
  db.jadwal[idx] = updated;
  writeDb(db);
  return updated;
}

export function deletePreviewScheduleSlot(id: string): void {
  const db = readDb();
  db.jadwal = db.jadwal.filter((item) => item.id !== id);
  writeDb(db);
}
