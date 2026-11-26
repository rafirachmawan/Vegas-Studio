const BULAN_PENDEK = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

const HARI_PENUH = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

/**
 * Format angka ke notasi Rupiah Indonesia tanpa spasi setelah "Rp" (contoh: Rp1.250.000).
 */
export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount)) {
    return 'Rp0';
  }
  const rounded = Math.round(amount);
  const absFormatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));
  return rounded < 0 ? `-Rp${absFormatted}` : `Rp${absFormatted}`;
}

export function parseRupiahInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) {
    return 0;
  }
  const parsed = Number.parseInt(digits, 10);
  return Number.isSafeInteger(parsed) ? parsed : 0;
}

export function formatThousandsInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) {
    return '';
  }
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) {
    return '';
  }
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(parsed);
}

/**
 * Memformat tanggal YYYY-MM-DD ke notasi DD/MM/YYYY sesuai kolom "Tanggal" di spreadsheet operasional.
 */
export function formatTanggalSpreadsheet(dateInput: string): string {
  const trimmed = dateInput.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (slashMatch) {
    return trimmed;
  }
  return trimmed;
}

export interface DateParts {
  dayNumber: string;
  monthShort: string;
  year: string;
  weekday: string;
}

/**
 * Mengurai tanggal YYYY-MM-DD atau DD/MM/YYYY menjadi bagian hari, tanggal, bulan, dan tahun Indonesia.
 */
export function getDateParts(dateStr: string): DateParts | null {
  const trimmed = dateStr.trim();
  let year = 0;
  let monthIndex = -1;
  let day = 0;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(trimmed);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    monthIndex = Number(isoMatch[2]) - 1;
    day = Number(isoMatch[3]);
  } else if (slashMatch) {
    day = Number(slashMatch[1]);
    monthIndex = Number(slashMatch[2]) - 1;
    year = Number(slashMatch[3]);
  } else {
    return null;
  }

  const dateObj = new Date(Date.UTC(year, monthIndex, day));
  if (
    Number.isNaN(dateObj.getTime()) ||
    monthIndex < 0 ||
    monthIndex > 11 ||
    dateObj.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    dayNumber: String(day).padStart(2, '0'),
    monthShort: BULAN_PENDEK[monthIndex] ?? '',
    year: String(year),
    weekday: HARI_PENUH[dateObj.getUTCDay()] ?? '',
  };
}

/**
 * Memformat tanggal YYYY-MM-DD atau DD/MM/YYYY ke notasi baca Indonesia (contoh: Rabu, 16 Des 2026).
 */
export function formatTanggalIndonesia(dateStr: string, includeDay = true): string {
  const parts = getDateParts(dateStr);
  if (!parts) {
    return dateStr;
  }
  const dayInt = Number.parseInt(parts.dayNumber, 10);
  if (!includeDay) {
    return `${dayInt} ${parts.monthShort} ${parts.year}`;
  }
  return `${parts.weekday}, ${dayInt} ${parts.monthShort} ${parts.year}`;
}

export function formatJamSlot(jam: string): string {
  const trimmed = jam.trim();
  if (!trimmed) {
    return 'Sesi fleksibel';
  }
  if (/^\d{1,2}[:.]\d{2}$/.test(trimmed)) {
    return `${trimmed.replace(':', '.')} WIB`;
  }
  return trimmed;
}

export function formatInstagramHandle(rawHandle: string): string {
  const trimmed = rawHandle.trim().replace(/\s+/g, '');
  if (!trimmed) {
    return '';
  }
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

/**
 * Menormalkan label nominal DP/bayar agar konsisten untuk kolom "No. WA & Bayar"
 * (contoh input: "50%" -> "dp 50%", "250000" -> "dp Rp250.000", "dp 60%" -> "dp 60%").
 */
export function formatBayarDpLabel(rawBayar: string): string {
  const trimmed = rawBayar.trim();
  if (!trimmed) {
    return '';
  }
  if (/^\d[\d.]*$/.test(trimmed)) {
    const numeric = parseRupiahInput(trimmed);
    return numeric > 0 ? `dp ${formatRupiah(numeric)}` : '';
  }
  if (/^\d{1,3}%$/.test(trimmed)) {
    return `dp ${trimmed}`;
  }
  if (/^dp\b/i.test(trimmed)) {
    const rest = trimmed.slice(2).trim();
    if (/^\d[\d.]*$/.test(rest)) {
      const numeric = parseRupiahInput(rest);
      return numeric > 0 ? `dp ${formatRupiah(numeric)}` : trimmed.toLowerCase();
    }
    return `dp ${rest}`;
  }
  return trimmed;
}

/**
 * Menggabungkan nomor WA klien dan nominal DP ke format sel spreadsheet "No. WA & Bayar"
 * (contoh: "0812-5554-5565 (dp 50%)").
 */
export function formatNoWaBayarCell(rawPhone: string, rawBayar: string): string {
  const cleanPhone = rawPhone.trim();
  const bayarLabel = formatBayarDpLabel(rawBayar);
  if (!cleanPhone) {
    return bayarLabel;
  }
  return bayarLabel ? `${cleanPhone} (${bayarLabel})` : cleanPhone;
}
