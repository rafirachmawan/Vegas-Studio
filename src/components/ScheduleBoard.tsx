import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CalendarDays, Check, Clock, Lock, RefreshCw } from 'lucide-react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';
import type { ScheduleSlot } from '../types/studio';
import {
  formatJamSlot,
  formatTanggalIndonesia,
  formatTanggalSpreadsheet,
  getDateParts,
} from '../utils/formatters';

interface ScheduleBoardProps {
  slots: ScheduleSlot[];
  selectedSlotId: string;
  isLoading: boolean;
  errorMessage: string | null;
  onSelectSlot: (slot: ScheduleSlot) => void;
  onRetry: () => void;
}

type StatusFilter = 'semua' | 'Kosong' | 'Booked';

function getAdaptiveGridClass(slotCount: number): string {
  if (slotCount === 1) {
    return 'grid grid-cols-1 gap-4 md:max-w-xl';
  }
  if (slotCount === 2 || slotCount === 4) {
    return 'grid grid-cols-1 gap-4 sm:grid-cols-2';
  }
  return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
}

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

  const gridClass = getAdaptiveGridClass(filteredSlots.length);

  return (
    <section
      id="jadwal"
      ref={sectionRef}
      aria-labelledby="heading-jadwal"
      className="border-b border-rule bg-paper-2 py-10 sm:py-16"
    >
      <div className="container flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-4 border-b border-rule pb-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="heading-jadwal" data-gsap-text className="font-display font-semibold text-ink">
              Jadwal tersedia
            </h2>
            <p className="max-w-2xl text-sm text-ink-2 sm:text-base">
              Klik slot berstatus Kosong untuk mengisi Tanggal dan Jam otomatis pada formulir booking. Slot Booked tidak dapat dipilih ulang.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:justify-end lg:gap-3">
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
                    className={`num relative min-h-10 whitespace-nowrap rounded-[3px] px-2 text-center text-xs font-medium transition-colors duration-[var(--dur-short)] sm:min-h-9 sm:px-3.5 sm:text-sm ${
                      active ? 'text-accent-ink' : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="schedule-filter-pill"
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-[3px] bg-accent"
                      />
                    )}
                    <span className="relative z-10">{option.label}</span>
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
                className="flex h-36 animate-pulse items-stretch gap-4 rounded-card border border-rule bg-card p-4 sm:p-5"
              >
                <div className="w-16 shrink-0 rounded-[6px] bg-paper-2 sm:w-18" />
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div className="h-4 w-28 rounded bg-paper-2" />
                  <div className="h-5 w-44 rounded bg-paper-2" />
                  <div className="h-3.5 w-32 rounded bg-paper-2" />
                </div>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={gridClass}
            >
              {filteredSlots.map((slot) => {
                const isBooked = slot.status === 'Booked';
                const isSelected = !isBooked && slot.id === selectedSlotId;
                const dateParts = getDateParts(slot.tanggal);
                const fullDateText = formatTanggalIndonesia(slot.tanggal);
                const spreadsheetDate = formatTanggalSpreadsheet(slot.tanggal);

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
                    className={`group flex w-full items-stretch gap-3.5 rounded-card border p-4 text-left transition-colors duration-[var(--dur-short)] sm:gap-4 sm:p-5 ${
                      isBooked
                        ? 'cursor-not-allowed border-rule/80 bg-paper opacity-60'
                        : isSelected
                          ? 'border-accent bg-accent-soft/75 text-ink shadow-[var(--shadow-card)]'
                          : 'cursor-pointer border-rule bg-card text-ink hover:border-field-border hover:bg-card/90'
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-[6px] px-2 py-2.5 text-center transition-colors duration-[var(--dur-short)] sm:w-[4.5rem] ${
                        isBooked
                          ? 'bg-paper-2 text-muted'
                          : isSelected
                            ? 'bg-accent text-accent-ink'
                            : 'bg-paper-2 text-ink group-hover:bg-paper-3'
                      }`}
                    >
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? 'text-accent-ink/85' : 'text-muted'
                        }`}
                      >
                        {dateParts?.monthShort ?? 'Tgl'}
                      </span>
                      <span className="num my-0.5 font-display text-2xl font-semibold leading-none sm:text-3xl">
                        {dateParts?.dayNumber ?? '--'}
                      </span>
                      <span
                        className={`num text-xs ${
                          isSelected ? 'text-accent-ink/85' : 'text-ink-2'
                        }`}
                      >
                        {dateParts?.year ?? ''}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="num inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                          <Clock
                            className={`h-4 w-4 shrink-0 ${
                              isBooked ? 'text-muted' : 'text-accent'
                            }`}
                            aria-hidden="true"
                          />
                          <span>{formatJamSlot(slot.jam)}</span>
                        </span>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium ${
                            isBooked
                              ? 'border-rule bg-paper-2 text-muted'
                              : isSelected
                                ? 'border-accent/50 bg-card text-accent'
                                : 'border-success/40 bg-success-bg text-success'
                          }`}
                        >
                          {isBooked ? (
                            <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          ) : isSelected ? (
                            <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                          ) : (
                            <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>
                            {isBooked ? 'Booked' : isSelected ? 'Dipilih' : 'Kosong'}
                          </span>
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="num text-sm font-medium text-ink sm:text-base">
                          {dateParts?.weekday
                            ? `${dateParts.weekday} · ${spreadsheetDate}`
                            : fullDateText}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-2 sm:text-sm">
                          {slot.catatan ||
                            (isBooked ? 'Slot sudah terisi' : 'Siap untuk pemesanan')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-rule/70 pt-2 text-xs">
                        <span
                          className={
                            isBooked
                              ? 'text-muted'
                              : isSelected
                                ? 'font-medium text-accent'
                                : 'text-muted group-hover:text-ink-2'
                          }
                        >
                          {isBooked
                            ? 'Tidak tersedia'
                            : isSelected
                              ? 'Terpasang di formulir'
                              : 'Pilih tanggal & jam'}
                        </span>
                        {!isBooked && (
                          <ArrowRight
                            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-[var(--dur-short)] ${
                              isSelected
                                ? 'text-accent'
                                : 'text-muted group-hover:translate-x-0.5 group-hover:text-accent'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
