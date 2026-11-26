import { ArrowUp, ExternalLink, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { DataMode } from '../types/studio';
import { normalizeWhatsAppNumber } from '../utils/whatsapp';

interface FooterProps {
  mode: DataMode;
  activeView: 'booking' | 'admin';
  whatsappAdminNumber?: string;
  onNavigateSection: (selector: string) => void;
  onToggleAdmin: () => void;
}

const BOOKING_LINKS = [
  { href: '#top', label: 'Beranda' },
  { href: '#gallery', label: 'My Gallery' },
  { href: '#tentang-kami', label: 'Tentang Kami' },
  { href: '#jadwal', label: 'Jadwal tersedia' },
  { href: '#paket', label: 'Daftar paket' },
  { href: '#booking-form', label: 'Formulir booking' },
] as const;

export function Footer({
  mode,
  activeView,
  whatsappAdminNumber = '',
  onNavigateSection,
  onToggleAdmin,
}: FooterProps) {
  const cleanWaDisplay = whatsappAdminNumber.trim();
  const normalizedWa = cleanWaDisplay ? normalizeWhatsAppNumber(cleanWaDisplay) : '';
  const waDirectUrl =
    normalizedWa.length >= 8 ? `https://wa.me/${normalizedWa}` : null;

  return (
    <footer className="border-t border-rule bg-card py-10 sm:py-12">
      <div className="container flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-8">
          <div className="flex flex-col gap-3 md:col-span-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-2xl font-semibold text-ink">Vegas Studio</p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium ${
                  mode === 'live'
                    ? 'border-success/40 bg-success-bg text-success'
                    : 'border-rule bg-paper-2 text-ink-2'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{mode === 'live' ? 'Spreadsheet Live' : 'Mode Preview Lokal'}</span>
              </span>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-ink-2">
              Layanan fotografi dan video untuk wisuda, portrait, pasangan, hingga dokumentasi acara dengan pengecekan jadwal transparan.
            </p>
          </div>

          <nav
            aria-label="Navigasi footer"
            className="flex flex-col gap-3 md:col-span-4"
          >
            <p className="text-sm font-medium text-ink">Navigasi</p>
            {activeView === 'booking' ? (
              <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-1 p-0 text-sm text-ink-2">
                {BOOKING_LINKS.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={(event) => {
                        event.preventDefault();
                        onNavigateSection(item.href);
                      }}
                      className="inline-flex min-h-10 items-center no-underline transition-colors duration-[var(--dur-short)] hover:text-ink hover:underline"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onClick={onToggleAdmin}
                className="inline-flex min-h-10 w-fit items-center whitespace-nowrap text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
              >
                Kembali ke Booking
              </button>
            )}
          </nav>

          <div className="flex flex-col gap-3 md:col-span-3">
            <p className="text-sm font-medium text-ink">Kontak &amp; Pengelolaan</p>

            {waDirectUrl ? (
              <a
                href={waDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="num inline-flex min-h-10 w-fit items-center gap-1.5 text-sm text-ink-2 no-underline transition-colors duration-[var(--dur-short)] hover:text-accent"
              >
                <span>WhatsApp Admin: {cleanWaDisplay}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              </a>
            ) : (
              <p className="text-sm text-muted">
                Nomor WhatsApp admin dapat diatur pada tab Koneksi &amp; Setup di Panel Admin.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onToggleAdmin}
                className="btn btn--quiet min-h-10 px-3.5 text-xs sm:text-sm"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {activeView === 'admin' ? 'Kembali ke Booking' : 'Panel Admin'}
                </span>
              </button>

              {activeView === 'booking' && (
                <button
                  type="button"
                  onClick={() => onNavigateSection('#top')}
                  aria-label="Kembali ke atas halaman"
                  className="btn btn--quiet min-h-10 px-3 text-xs sm:text-sm"
                >
                  <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Ke atas</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-rule pt-6 text-xs text-muted">
          <p>
            {mode === 'live'
              ? 'Terhubung langsung ke Google Sheets Jadwal_Wisuda dan konfirmasi WhatsApp.'
              : 'Berjalan dalam Mode Preview Lokal sebelum deployment Google Apps Script.'}
          </p>

          <p data-credits className="leading-relaxed [overflow-wrap:anywhere]">
            Photographs (placeholders):{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Alley_in_Gamla_Stan,_Stockholm.jpg">
              OleNeitzel
            </a>{' '}
            (CC BY 4.0, Wikimedia Commons),{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Akalla_metro_station_August_2014_01.jpg">
              Arild Vågen
            </a>{' '}
            (CC BY-SA 4.0, Wikimedia Commons),{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Oriental_hanging_lanterns._Souk_Haddadine,_Marrakech_Medina,_Morocco.jpg">
              Petar Milošević
            </a>{' '}
            (CC BY-SA 4.0, Wikimedia Commons),{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Globen_metro_station_May_2016.jpg">
              Arild Vågen
            </a>{' '}
            (CC BY-SA 4.0, Wikimedia Commons).
          </p>
        </div>
      </div>
    </footer>
  );
}
