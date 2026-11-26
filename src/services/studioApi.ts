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
  StudioSettings,
  StudioSnapshot,
} from '../types/studio';
import { isValidHttpUrl, resolveDataMode } from './config';
import {
  PreviewSlotConflictError,
  createPreviewBooking,
  createPreviewPackage,
  createPreviewPhotographer,
  createPreviewScheduleSlot,
  deletePreviewPackage,
  deletePreviewPhotographer,
  deletePreviewScheduleSlot,
  getPreviewSnapshot,
  updatePreviewBookingStatus,
  updatePreviewPackage,
  updatePreviewPhotographer,
  updatePreviewScheduleStatus,
} from './previewStore';

export type StudioApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'SLOT_ALREADY_BOOKED'
  | 'INVALID_RESPONSE'
  | 'CONFIG_ERROR';

export class StudioApiError extends Error {
  readonly code: StudioApiErrorCode;

  constructor(code: StudioApiErrorCode, message: string) {
    super(message);
    this.name = 'StudioApiError';
    this.code = code;
  }
}

interface GasApiEnvelope<T> {
  ok: boolean;
  data?: T;
  code?: string;
  message?: string;
}

const REQUEST_TIMEOUT_MS = 15000;

function parseBooleanCell(raw: unknown): boolean {
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (typeof raw === 'number') {
    return raw !== 0;
  }
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'ya' || normalized === 'aktif';
  }
  return false;
}

function normalizeSnapshot(raw: Partial<StudioSnapshot>): StudioSnapshot {
  const jadwal: ScheduleSlot[] = Array.isArray(raw.jadwal)
    ? raw.jadwal.map((item) => ({
        id: String(item.id ?? ''),
        tanggal: String(item.tanggal ?? '').slice(0, 10),
        jam: String(item.jam ?? ''),
        status: String(item.status ?? '').trim().toLowerCase() === 'booked' ? 'Booked' : 'Kosong',
        catatan: String(item.catatan ?? ''),
      }))
    : [];

  const paket: PackageItem[] = Array.isArray(raw.paket)
    ? raw.paket.map((item) => ({
        id: String(item.id ?? ''),
        nama_paket: String(item.nama_paket ?? ''),
        harga: Number(item.harga ?? 0) || 0,
        deskripsi: String(item.deskripsi ?? ''),
        aktif: parseBooleanCell(item.aktif),
      }))
    : [];

  const fotografer: Photographer[] = Array.isArray(raw.fotografer)
    ? raw.fotografer.map((item) => ({
        id: String(item.id ?? ''),
        nama_fotografer: String(item.nama_fotografer ?? ''),
        spesialisasi: String(item.spesialisasi ?? ''),
        aktif: parseBooleanCell(item.aktif),
      }))
    : [];

  const rekap: BookingRecord[] = Array.isArray(raw.rekap)
    ? raw.rekap.map((item, idx) => ({
        no: Number(item.no ?? idx + 1) || idx + 1,
        tanggal: String(item.tanggal ?? ''),
        fg: String(item.fg ?? ''),
        jam: String(item.jam ?? ''),
        paket: String(item.paket ?? ''),
        nama_klien: String(item.nama_klien ?? ''),
        username_ig: String(item.username_ig ?? ''),
        kampus_lokasi: String(item.kampus_lokasi ?? ''),
        no_wa_bayar: String(item.no_wa_bayar ?? ''),
        status: String(item.status ?? 'Belum'),
      }))
    : [];

  return {
    jadwal: jadwal.sort((a, b) => `${a.tanggal} ${a.jam}`.localeCompare(`${b.tanggal} ${b.jam}`)),
    paket,
    fotografer,
    rekap: rekap.sort((a, b) => a.no - b.no),
    mode: 'live',
    fetchedAt: new Date().toISOString(),
  };
}

async function requestGas<T>(url: string, init: RequestInit): Promise<T> {
  if (!isValidHttpUrl(url)) {
    throw new StudioApiError('CONFIG_ERROR', 'URL Google Apps Script belum valid.');
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new StudioApiError(
        'HTTP_ERROR',
        `Server Google Apps Script merespons kode ${response.status}. Periksa akses Web App (Anyone).`,
      );
    }

    let envelope: GasApiEnvelope<T>;
    try {
      envelope = (await response.json()) as GasApiEnvelope<T>;
    } catch {
      throw new StudioApiError(
        'INVALID_RESPONSE',
        'Respons server bukan JSON yang valid. Pastikan Google Apps Script sudah di-deploy sebagai Web App.',
      );
    }

    if (!envelope.ok) {
      if (envelope.code === 'SLOT_ALREADY_BOOKED') {
        throw new StudioApiError(
          'SLOT_ALREADY_BOOKED',
          envelope.message || 'Slot jadwal ini baru saja terisi pemesan lain. Pilih jadwal Kosong lainnya.',
        );
      }
      throw new StudioApiError(
        'HTTP_ERROR',
        envelope.message || 'Permintaan tidak dapat diproses oleh Google Apps Script.',
      );
    }

    return envelope.data as T;
  } catch (error) {
    if (error instanceof StudioApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new StudioApiError(
        'TIMEOUT',
        'Koneksi ke Google Apps Script terlalu lama. Periksa jaringan lalu coba muat ulang.',
      );
    }
    throw new StudioApiError(
      'NETWORK_ERROR',
      'Gagal menghubungi Google Apps Script. Periksa koneksi internet atau URL Web App Anda.',
    );
  } finally {
    window.clearTimeout(timer);
  }
}

async function postGas<T>(
  settings: StudioSettings,
  action: string,
  payload: Record<string, unknown>,
): Promise<T> {
  // Mengirim text/plain agar Google Apps Script tidak menolak CORS preflight OPTIONS.
  return requestGas<T>(settings.gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action, payload }),
  });
}

export async function fetchStudioSnapshot(settings: StudioSettings): Promise<StudioSnapshot> {
  if (resolveDataMode(settings) === 'preview') {
    return getPreviewSnapshot();
  }
  const separator = settings.gasUrl.includes('?') ? '&' : '?';
  const raw = await requestGas<Partial<StudioSnapshot>>(
    `${settings.gasUrl}${separator}action=bootstrap&t=${Date.now()}`,
    { method: 'GET' },
  );
  return normalizeSnapshot(raw);
}

export async function submitBookingRequest(
  settings: StudioSettings,
  payload: BookingSubmissionPayload,
): Promise<BookingSubmissionResult> {
  if (resolveDataMode(settings) === 'preview') {
    try {
      return createPreviewBooking(payload);
    } catch (error) {
      if (error instanceof PreviewSlotConflictError) {
        throw new StudioApiError('SLOT_ALREADY_BOOKED', error.message);
      }
      throw error;
    }
  }
  const data = await postGas<Omit<BookingSubmissionResult, 'mode'>>(settings, 'createBooking', {
    ...payload,
  });
  return { ...data, mode: 'live' };
}

export async function updateBookingStatusRequest(
  settings: StudioSettings,
  no: number,
  status: string,
): Promise<BookingRecord> {
  if (resolveDataMode(settings) === 'preview') {
    return updatePreviewBookingStatus(no, status);
  }
  return postGas<BookingRecord>(settings, 'updateBookingStatus', { no, status });
}

export async function createPackageRequest(
  settings: StudioSettings,
  input: PackageInput,
): Promise<PackageItem> {
  if (resolveDataMode(settings) === 'preview') {
    return createPreviewPackage(input);
  }
  return postGas<PackageItem>(settings, 'createPackage', { ...input });
}

export async function updatePackageRequest(
  settings: StudioSettings,
  id: string,
  input: PackageInput,
): Promise<PackageItem> {
  if (resolveDataMode(settings) === 'preview') {
    return updatePreviewPackage(id, input);
  }
  return postGas<PackageItem>(settings, 'updatePackage', { id, ...input });
}

export async function deletePackageRequest(settings: StudioSettings, id: string): Promise<void> {
  if (resolveDataMode(settings) === 'preview') {
    deletePreviewPackage(id);
    return;
  }
  await postGas<{ deleted: boolean }>(settings, 'deletePackage', { id });
}

export async function createPhotographerRequest(
  settings: StudioSettings,
  input: PhotographerInput,
): Promise<Photographer> {
  if (resolveDataMode(settings) === 'preview') {
    return createPreviewPhotographer(input);
  }
  return postGas<Photographer>(settings, 'createPhotographer', { ...input });
}

export async function updatePhotographerRequest(
  settings: StudioSettings,
  id: string,
  input: PhotographerInput,
): Promise<Photographer> {
  if (resolveDataMode(settings) === 'preview') {
    return updatePreviewPhotographer(id, input);
  }
  return postGas<Photographer>(settings, 'updatePhotographer', { id, ...input });
}

export async function deletePhotographerRequest(settings: StudioSettings, id: string): Promise<void> {
  if (resolveDataMode(settings) === 'preview') {
    deletePreviewPhotographer(id);
    return;
  }
  await postGas<{ deleted: boolean }>(settings, 'deletePhotographer', { id });
}

export async function createScheduleSlotRequest(
  settings: StudioSettings,
  input: ScheduleSlotInput,
): Promise<ScheduleSlot> {
  if (resolveDataMode(settings) === 'preview') {
    return createPreviewScheduleSlot(input);
  }
  return postGas<ScheduleSlot>(settings, 'createScheduleSlot', { ...input });
}

export async function updateScheduleStatusRequest(
  settings: StudioSettings,
  id: string,
  status: SlotStatus,
): Promise<ScheduleSlot> {
  if (resolveDataMode(settings) === 'preview') {
    return updatePreviewScheduleStatus(id, status);
  }
  return postGas<ScheduleSlot>(settings, 'updateScheduleStatus', { id, status });
}

export async function deleteScheduleSlotRequest(
  settings: StudioSettings,
  id: string,
): Promise<void> {
  if (resolveDataMode(settings) === 'preview') {
    deletePreviewScheduleSlot(id);
    return;
  }
  await postGas<{ deleted: boolean }>(settings, 'deleteScheduleSlot', { id });
}
