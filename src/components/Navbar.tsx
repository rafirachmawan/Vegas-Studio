import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import type { DataMode } from '../types/studio';

interface NavbarProps {
  activeView: 'booking' | 'admin';
  mode: DataMode;
  isAdminUnlocked: boolean;
  onNavigateSection: (selector: string) => void;
  onToggleAdmin: () => void;
}

export function Navbar({
  activeView,
  mode,
  isAdminUnlocked,
  onNavigateSection,
  onToggleAdmin,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLinkClick = (selector: string) => {
    setMobileMenuOpen(false);
    onNavigateSection(selector);
  };

  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-rule bg-card/92 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm">
      <a className="skip-link" href="#main-content">
        Langsung ke konten utama
      </a>

      <div className="container flex min-h-14 items-center justify-between gap-3 sm:min-h-16 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              handleLinkClick('#top');
            }}
            className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-ink no-underline sm:text-xl"
          >
            Website Resmi Vegas Studio
          </a>

          <span
            role="status"
            className={`hidden shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium md:inline-flex ${
              mode === 'live'
                ? 'border-success/40 bg-success-bg text-success'
                : 'border-rule bg-paper-2 text-ink-2'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{mode === 'live' ? 'Spreadsheet Live' : 'Mode Preview Lokal'}</span>
          </span>
        </div>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 lg:flex">
          {activeView === 'booking' && (
            <>
              <a
                href="#gallery"
                onClick={(event) => {
                  event.preventDefault();
                  handleLinkClick('#gallery');
                }}
                className="text-sm font-medium text-ink-2 no-underline transition-colors duration-[var(--dur-short)] hover:text-ink"
              >
                Gallery
              </a>
              <a
                href="#tentang-kami"
                onClick={(event) => {
                  event.preventDefault();
                  handleLinkClick('#tentang-kami');
                }}
                className="text-sm font-medium text-ink-2 no-underline transition-colors duration-[var(--dur-short)] hover:text-ink"
              >
                Tentang Kami
              </a>
              <a
                href="#jadwal"
                onClick={(event) => {
                  event.preventDefault();
                  handleLinkClick('#jadwal');
                }}
                className="text-sm font-medium text-ink-2 no-underline transition-colors duration-[var(--dur-short)] hover:text-ink"
              >
                Jadwal
              </a>
              <a
                href="#paket"
                onClick={(event) => {
                  event.preventDefault();
                  handleLinkClick('#paket');
                }}
                className="text-sm font-medium text-ink-2 no-underline transition-colors duration-[var(--dur-short)] hover:text-ink"
              >
                Paket
              </a>
              <a
                href="#booking-form"
                onClick={(event) => {
                  event.preventDefault();
                  handleLinkClick('#booking-form');
                }}
                className="text-sm font-medium text-ink-2 no-underline transition-colors duration-[var(--dur-short)] hover:text-ink"
              >
                Booking
              </a>
            </>
          )}

          <button
            type="button"
            onClick={onToggleAdmin}
            className="btn btn--quiet min-h-10 px-4 text-sm"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {activeView === 'admin'
                ? 'Kembali ke Booking'
                : isAdminUnlocked
                  ? 'Panel Admin'
                  : 'Mode Admin'}
            </span>
          </button>
        </nav>

        <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-panel"
          aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="btn btn--quiet min-h-11 min-w-11 shrink-0 px-3 lg:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-rule bg-card lg:hidden"
          >
            <div className="container flex flex-col gap-3 py-4">
              <div
                role="status"
                className={`inline-flex w-fit items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium ${
                  mode === 'live'
                    ? 'border-success/40 bg-success-bg text-success'
                    : 'border-rule bg-paper-2 text-ink-2'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{mode === 'live' ? 'Spreadsheet Live' : 'Mode Preview Lokal'}</span>
              </div>

              {activeView === 'booking' && (
                <div className="flex flex-col gap-1 border-t border-rule pt-2">
                  <a
                    href="#gallery"
                    onClick={(event) => {
                      event.preventDefault();
                      handleLinkClick('#gallery');
                    }}
                    className="flex min-h-11 items-center text-base font-medium text-ink no-underline"
                  >
                    My Gallery
                  </a>
                  <a
                    href="#tentang-kami"
                    onClick={(event) => {
                      event.preventDefault();
                      handleLinkClick('#tentang-kami');
                    }}
                    className="flex min-h-11 items-center text-base font-medium text-ink no-underline"
                  >
                    Tentang Kami
                  </a>
                  <a
                    href="#jadwal"
                    onClick={(event) => {
                      event.preventDefault();
                      handleLinkClick('#jadwal');
                    }}
                    className="flex min-h-11 items-center text-base font-medium text-ink no-underline"
                  >
                    Jadwal tersedia
                  </a>
                  <a
                    href="#paket"
                    onClick={(event) => {
                      event.preventDefault();
                      handleLinkClick('#paket');
                    }}
                    className="flex min-h-11 items-center text-base font-medium text-ink no-underline"
                  >
                    Daftar paket
                  </a>
                  <a
                    href="#booking-form"
                    onClick={(event) => {
                      event.preventDefault();
                      handleLinkClick('#booking-form');
                    }}
                    className="flex min-h-11 items-center text-base font-medium text-ink no-underline"
                  >
                    Formulir booking
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onToggleAdmin();
                }}
                className="btn btn--quiet w-full justify-center"
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {activeView === 'admin'
                    ? 'Kembali ke Halaman Booking'
                    : isAdminUnlocked
                      ? 'Buka Panel Admin'
                      : 'Masuk Mode Admin'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
