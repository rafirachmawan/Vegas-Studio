import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Check, Clock, Lock, RefreshCw } from 'lucide-react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';
import type { ScheduleSlot } from '../types/studio';
import { formatJamSlot, formatTanggalIndonesia, formatTanggalSpreadsheet } from '../utils/formatters';

interface ScheduleBoardProps {
  slots: ScheduleSlot[];
  selectedSlotId: string;
  isLoading: boolean;
  errorMessage: string | null;
  onSelectSlot: (slot: ScheduleSlot) => void;
  onRetry: () => void;
}

type StatusFilter = 'semua' | 'Kosong' | 'Booked';

export function ScheduleBoard({
  slots,
  selectedSlotId,
  isLoading,
  errorMessage,
  onSelectSlot,
  onRetry,
}: ScheduleBoardProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<StatusFilter>('semua');
  useGsapTextReveal(sectionRef, { triggerOnScroll: true, stagger: 0.05 });

  const filteredSlots = useMemo(() => {
    if (filter === 'semua') {
      return slots;
    }
    return slots.filter((slot) => slot.status === filter);
  }, [slots, filter]);

  const counts = useMemo(() => {
    const empty = slots.filter((slot) => slot.status === 'Kosong').length;
    const booked = slots.length - empty;
    return { total: slots.length, empty, booked };
  }, [slots]);

  return (
    <section
      id="jadwal"
      ref={sectionRef}
      aria-labelledby="heading-jadwal"
      className="border-b border-rule bg-paper-2 py-10 sm:py-16"
    >
      <div className="container flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="heading-jadwal" data-gsap-text className="font-display font-semibold text-ink">
              Jadwal tersedia
            </h2>
            <p className="max-w-2xl text-sm text-ink-2 sm:text-base">
              Klik slot berstatus Kosong untuk mengisi Tanggal dan Jam otomatis pada formulir booking. Slot Booked tidak dapat dipilih ulang.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div
              role="group"
              aria-label="Filter status jadwal"
              className="grid w-full grid-cols-3 rounded-[var(--radius-input)] border border-rule bg-card p-1 sm:inline-flex sm:w-auto"
            >
              {(
                [
                  { id: 'semua', label: `Semua (${counts.total})` },
                  { id: 'Kosong', label: `Kosong (${counts.empty})` },
                  { id: 'Booked', label: `Booked (${counts.booked})` },
                ] as const
              ).map((option) => {
                const active = filter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(option.id)}
                    className={`num relative min-h-10 rounded-[3px] px-2 text-center text-xs font-medium transition-colors duration-[var(--dur-short)] sm:min-h-9 sm:px-3 sm:text-sm ${
                      active
                        ? 'bg-accent text-accent-ink'
                        : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="btn btn--quiet min-h-11 w-full px-4 text-sm sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Muat ulang</span>
            </button>
          </div>
        </div>

        {isLoading && slots.length === 0 ? (
          <div
            aria-label="Memuat daftar jadwal"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-card border border-rule bg-card p-5"
              >
                <div className="h-4 w-24 rounded bg-paper-2" />
                <div className="mt-3 h-6 w-48 rounded bg-paper-2" />
                <div className="mt-4 h-4 w-36 rounded bg-paper-2" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-4 border-l-4 border-error bg-error-bg p-6"
          >
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                Gagal memuat jadwal terbaru
              </h3>
              <p className="mt-1 text-ink-2">{errorMessage}</p>
            </div>
            <button type="button" onClick={onRetry} className="btn btn--quiet">
              Coba muat ulang
            </button>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-card border border-rule bg-card p-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                {slots.length === 0
                  ? 'Belum ada jadwal yang terdaftar'
                  : `Tidak ada jadwal dengan status ${filter}`}
              </h3>
              <p className="mt-1 text-ink-2">
                {slots.length === 0
                  ? 'Admin dapat menambahkan slot tanggal pada tab Jadwal atau melalui Panel Admin.'
                  : 'Ubah filter status untuk melihat jadwal lain yang tersedia.'}
              </p>
            </div>
            {filter !== 'semua' && (
              <button
                type="button"
                onClick={() => setFilter('semua')}
                className="btn btn--quiet"
              >
                Tampilkan semua jadwal
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSlots.map((slot) => {
              const isBooked = slot.status === 'Booked';
              const isSelected = !isBooked && slot.id === selectedSlotId;

              return (
                <motion.button
                  key={slot.id}
                  type="button"
                  disabled={isBooked}
                  aria-pressed={isBooked ? undefined : isSelected}
                  whileTap={isBooked ? undefined : { scale: 0.985 }}
                  transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => {
                    if (!isBooked) {
                      onSelectSlot(slot);
                    }
                  }}
                  className={`group flex min-h-28 flex-col justify-between rounded-card border p-4 text-left transition-colors duration-[var(--dur-short)] sm:min-h-36 sm:p-5 ${
                    isBooked
                      ? 'cursor-not-allowed border-rule bg-paper opacity-55'
                      : isSelected
                        ? 'border-accent bg-accent-soft text-ink'
                        : 'cursor-pointer border-rule bg-card text-ink hover:border-field-border'
                  }`}
                >
                  <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium ${
                        isBooked
                          ? 'border-rule bg-paper-2 text-muted'
                          : isSelected
                            ? 'border-accent/50 bg-card text-accent'
                            : 'border-success/40 bg-success-bg text-success'
                      }`}
                    >
                      {isBooked ? (
                        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : isSelected ? (
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isBooked ? 'Booked' : isSelected ? 'Dipilih' : 'Kosong'}
                      </span>
                    </span>

                    <span className="num inline-flex items-center gap-1 text-sm text-ink-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                      <span>{formatJamSlot(slot.jam)}</span>
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="num font-body text-base font-medium text-ink">
                      {formatTanggalIndonesia(slot.tanggal)} ({formatTanggalSpreadsheet(slot.tanggal)})
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {slot.catatan || (isBooked ? 'Slot sudah terisi' : 'Siap untuk pemesanan')}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
