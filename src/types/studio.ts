export type SlotStatus = 'Kosong' | 'Booked';

export interface ScheduleSlot {
  id: string;
  tanggal: string; // Format YYYY-MM-DD
  jam: string;
  status: SlotStatus;
  catatan: string;
}

export interface PackageItem {
  id: string;
  nama_paket: string;
  harga: number;
  deskripsi: string;
  aktif: boolean;
}

export interface Photographer {
  id: string;
  nama_fotografer: string;
  spesialisasi: string;
  aktif: boolean;
}

/**
 * Representasi baris rekap pada sheet Jadwal_Wisuda dengan 10 header operasional persis seperti spreadsheet:
 * No | Tanggal | FG | Jam | Paket | Nama Klien | Username IG | Kampus & Lokasi | No. WA & Bayar | Status
 */
export interface BookingRecord {
  no: number;
  tanggal: string; // Format DD/MM/YYYY sesuai kolom Tanggal spreadsheet
  fg: string;
  jam: string;
  paket: string;
  nama_klien: string;
  username_ig: string;
  kampus_lokasi: string;
  no_wa_bayar: string;
  status: string;
  harga_paket?: number;
}

export interface BookingFormInput {
  scheduleId: string;
  tanggalIso: string;
  fgId: string;
  jam: string;
  paketId: string;
  nama_klien: string;
  username_ig: string;
  kampus_lokasi: string;
  no_wa_klien: string;
  bayar_dp: string;
}

export interface BookingSubmissionPayload {
  scheduleId: string;
  tanggal: string; // DD/MM/YYYY
  fg: string;
  jam: string;
  paket: string;
  nama_klien: string;
  username_ig: string;
  kampus_lokasi: string;
  no_wa_bayar: string;
  status: string;
  harga_paket: number;
}

export interface BookingSubmissionResult {
  record: BookingRecord;
  updatedSlot: ScheduleSlot;
  mode: DataMode;
}

export type DataMode = 'live' | 'preview';

export interface StudioSnapshot {
  jadwal: ScheduleSlot[];
  paket: PackageItem[];
  fotografer: Photographer[];
  rekap: BookingRecord[];
  mode: DataMode;
  fetchedAt: string;
}

export interface StudioSettings {
  gasUrl: string;
  whatsappNumber: string;
  adminPin: string;
}

export interface PackageInput {
  nama_paket: string;
  harga: number;
  deskripsi: string;
  aktif: boolean;
}

export interface PhotographerInput {
  nama_fotografer: string;
  spesialisasi: string;
  aktif: boolean;
}

export interface ScheduleSlotInput {
  tanggal: string;
  jam: string;
  catatan: string;
  status?: SlotStatus;
}
