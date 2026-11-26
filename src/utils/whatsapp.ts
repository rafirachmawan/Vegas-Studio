import { formatRupiah } from './formatters';

export interface WhatsAppBookingMessageParams {
  no?: number;
  tanggal: string; // DD/MM/YYYY
  fg: string;
  jam: string;
  paket: string;
  namaKlien: string;
  usernameIg: string;
  kampusLokasi: string;
  noWaBayar: string;
  status: string;
  hargaPaket?: number;
  mode?: 'live' | 'preview';
}

export interface WhatsAppBookingOutput {
  normalizedPhone: string;
  message: string;
  /** Tautan universal wa.me (disarankan untuk HP / aplikasi WhatsApp Desktop). */
  url: string | null;
  /** Tautan langsung web.whatsapp.com/send agar browser desktop melewati halaman Bagikan di WhatsApp dan mempertahankan baris baru. */
  webUrl: string | null;
}

/**
 * Mendeteksi apakah browser berjalan di perangkat seluler sehingga tautan wa.me membuka aplikasi WhatsApp native langsung.
 */
export function isMobileUserAgent(
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Menormalkan input nomor WhatsApp (+62, 08xx, spasi, tanda hubung) menjadi digit internasional tanpa "+".
 */
export function normalizeWhatsAppNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/[^\d]/g, '');
  if (!digits) {
    return '';
  }
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('8')) {
    return `62${digits}`;
  }
  return digits;
}

/**
 * Menyusun pesan booking terstruktur sesuai 10 kolom spreadsheet dan URL redirect wa.me untuk Vegas Studio.
 */
export function buildWhatsAppBookingUrl(
  rawAdminPhone: string,
  params: WhatsAppBookingMessageParams,
): WhatsAppBookingOutput {
  const normalizedPhone = normalizeWhatsAppNumber(rawAdminPhone);
  const paketLine =
    typeof params.hargaPaket === 'number' && params.hargaPaket > 0
      ? `${params.paket} (${formatRupiah(params.hargaPaket)})`
      : params.paket;

  const detailLines = [
    '*DETAIL JADWAL & PAKET*',
    ...(typeof params.no === 'number' && params.no > 0
      ? [`*No. Rekap:* #${params.no}`]
      : []),
    `*Tanggal:* ${params.tanggal}`,
    `*Jam:* ${params.jam}`,
    `*FG (Fotografer):* ${params.fg}`,
    `*Paket:* ${paketLine}`,
    `*Kampus & Lokasi:* ${params.kampusLokasi}`,
  ];

  const clientLines = [
    '*DATA KLIEN & PEMBAYARAN*',
    `*Nama Klien:* ${params.namaKlien}`,
    `*Username IG:* ${params.usernameIg}`,
    `*No. WA & Bayar:* ${params.noWaBayar}`,
    `*Status:* ${params.status}`,
  ];

  const closingLine =
    params.mode === 'preview'
      ? '[Catatan: Pengujian format pesan dari Mode Preview Lokal]'
      : 'Data sudah masuk ke rekap jadwal. Mohon konfirmasi selanjutnya, terima kasih.';

  const message = [
    'Halo Admin *Vegas Studio*,',
    'Saya ingin konfirmasi booking sesi foto dengan rincian berikut:',
    '',
    ...detailLines,
    '',
    ...clientLines,
    '',
    closingLine,
  ].join('\n');

  const encodedMessage = encodeURIComponent(message);
  const hasValidPhone = normalizedPhone.length >= 8;

  return {
    normalizedPhone,
    message,
    url: hasValidPhone ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}` : null,
    webUrl: hasValidPhone
      ? `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedMessage}`
      : null,
  };
}
