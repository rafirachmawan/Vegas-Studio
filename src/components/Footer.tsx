import type { DataMode } from '../types/studio';

interface FooterProps {
  mode: DataMode;
  activeView: 'booking' | 'admin';
  onNavigateSection: (selector: string) => void;
  onToggleAdmin: () => void;
}

export function Footer({
  mode,
  activeView,
  onNavigateSection,
  onToggleAdmin,
}: FooterProps) {
  return (
    <footer className="bg-card py-10">
      <div className="container flex flex-col gap-6 border-t border-rule pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Vegas Studio</p>
            <p className="mt-1 text-sm text-muted">
              {mode === 'live'
                ? 'Terhubung langsung ke Google Sheets Jadwal_Wisuda dan konfirmasi WhatsApp.'
                : 'Berjalan dalam Mode Preview Lokal sebelum deployment Google Apps Script.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-2">
            {activeView === 'booking' && (
              <>
                <a
                  href="#gallery"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigateSection('#gallery');
                  }}
                  className="inline-flex min-h-10 items-center no-underline hover:text-ink hover:underline"
                >
                  Gallery
                </a>
                <a
                  href="#jadwal"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigateSection('#jadwal');
                  }}
                  className="inline-flex min-h-10 items-center no-underline hover:text-ink hover:underline"
                >
                  Jadwal
                </a>
                <a
                  href="#paket"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigateSection('#paket');
                  }}
                  className="inline-flex min-h-10 items-center no-underline hover:text-ink hover:underline"
                >
                  Paket
                </a>
                <a
                  href="#booking-form"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigateSection('#booking-form');
                  }}
                  className="inline-flex min-h-10 items-center no-underline hover:text-ink hover:underline"
                >
                  Form Booking
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onToggleAdmin}
              className="inline-flex min-h-10 items-center text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              {activeView === 'admin' ? 'Kembali ke Booking' : 'Panel Admin'}
            </button>
          </div>
        </div>

        <p data-credits className="text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">
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
    </footer>
  );
}
