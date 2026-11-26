import { useRef } from 'react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';
import type { DataMode, ScheduleSlot } from '../types/studio';
import { formatJamSlot, formatTanggalSpreadsheet } from '../utils/formatters';

interface HeroSectionProps {
  mode: DataMode;
  whatsappAdminNumber: string;
  availableCount: number;
  nextAvailableSlot: ScheduleSlot | null;
  isLoading: boolean;
  onJumpToBooking: () => void;
  onJumpToSchedule: () => void;
  onQuickPickSlot: (slot: ScheduleSlot) => void;
}

export function HeroSection({
  mode,
  whatsappAdminNumber,
  availableCount,
  nextAvailableSlot,
  isLoading,
  onJumpToBooking,
  onJumpToSchedule,
  onQuickPickSlot,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  useGsapTextReveal(heroRef, { triggerOnScroll: false, stagger: 0.06 });

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative flex items-center overflow-hidden border-b border-rule bg-card py-10 sm:min-h-[72dvh] sm:py-16"
    >
      <figure
        data-slot="hero-camera"
        data-alt="Placeholder foto kamera studio Vegas Studio"
        className="pointer-events-none absolute inset-0 m-0"
      >
        <img
          src="/placeholders/hero-camera.jpg"
          width="1920"
          height="1080"
          alt="Kamera studio monokrom sebagai placeholder visual hero Vegas Studio"
          fetchPriority="high"
          className="h-full w-full object-cover object-[64%_28%] opacity-75 sm:object-[72%_50%] sm:opacity-85"
        />
      </figure>

      {/* Lapisan gradasi gelap agar tipografi tetap kontras baik di mobile portrait maupun desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/50 sm:bg-gradient-to-r sm:from-card sm:via-card/85 sm:to-card/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-card/45"
      />

      <div className="container relative z-10 flex flex-col justify-between gap-8 sm:min-h-[52dvh] sm:gap-10">
        <div className="flex max-w-2xl flex-col gap-4 sm:my-auto sm:gap-5">
          <h1 data-gsap-text className="font-display font-semibold text-ink">
            Capture The Moments
          </h1>

          <p data-gsap-text className="lead">
            Bersama Vegas Studio, cek jadwal kosong dan booking sesi foto otomatis.
          </p>

          {mode === 'preview' && (
            <p className="w-fit border-l-2 border-accent bg-card/85 px-3 py-1.5 text-xs text-ink-2 sm:text-sm">
              Mode Preview Lokal aktif: data contoh tersimpan di browser hingga URL Apps Script diisi.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-rule/80 pt-5 sm:gap-5 sm:pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1 text-sm text-ink-2">
            <p>
              {whatsappAdminNumber.trim()
                ? `Call Center WhatsApp: ${whatsappAdminNumber.trim()}`
                : 'Konfirmasi booking diarahkan langsung ke WhatsApp admin & Google Sheets'}
            </p>
            <p className="num text-muted">
              {isLoading
                ? 'Memuat ketersediaan slot jadwal…'
                : nextAvailableSlot
                  ? `${availableCount} slot Kosong tersedia (terdekat ${formatTanggalSpreadsheet(nextAvailableSlot.tanggal)}, ${formatJamSlot(nextAvailableSlot.jam)})`
                  : `${availableCount} slot Kosong tersedia`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={nextAvailableSlot ? () => onQuickPickSlot(nextAvailableSlot) : onJumpToBooking}
              className="btn btn--primary w-full sm:w-auto"
            >
              Booking Sekarang
            </button>
            <button
              type="button"
              onClick={onJumpToSchedule}
              className="btn btn--quiet w-full bg-card/60 sm:w-auto"
            >
              Lihat Jadwal
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
