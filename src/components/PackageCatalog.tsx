import { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Camera, Check } from 'lucide-react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';
import type { PackageItem } from '../types/studio';
import { formatRupiah } from '../utils/formatters';

interface PackageCatalogProps {
  packages: PackageItem[];
  selectedPackageId: string;
  isLoading: boolean;
  onSelectPackage: (pkg: PackageItem) => void;
}

function getPackageGridClass(packageCount: number): string {
  if (packageCount === 1) {
    return 'grid grid-cols-1 gap-4 md:max-w-xl';
  }
  if (packageCount === 2 || packageCount === 4) {
    return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5';
  }
  return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5';
}

export function PackageCatalog({
  packages,
  selectedPackageId,
  isLoading,
  onSelectPackage,
}: PackageCatalogProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapTextReveal(sectionRef, { triggerOnScroll: true, stagger: 0.05 });

  const activePackages = packages.filter((pkg) => pkg.aktif);
  const gridClass = getPackageGridClass(activePackages.length);

  return (
    <section
      id="paket"
      ref={sectionRef}
      aria-labelledby="heading-paket"
      className="border-b border-rule bg-paper py-10 sm:py-16"
    >
      <div className="container flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-4 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="heading-paket" data-gsap-text className="font-display font-semibold text-ink">
              Daftar paket foto
            </h2>
            <p className="max-w-2xl text-sm text-ink-2 sm:text-base">
              Pilih paket yang sesuai dengan kebutuhan sesi Anda untuk otomatis terisi di formulir booking.
            </p>
          </div>

          {!isLoading && activePackages.length > 0 && (
            <span className="num inline-flex w-fit shrink-0 items-center gap-1.5 rounded-pill border border-rule bg-card px-3 py-1.5 text-xs font-medium text-ink-2">
              <Camera className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>{activePackages.length} paket tersedia</span>
            </span>
          )}
        </div>

        {isLoading && activePackages.length === 0 ? (
          <div
            aria-label="Memuat daftar paket foto"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-56 animate-pulse flex-col justify-between rounded-card border border-rule bg-card p-5 sm:p-6"
              >
                <div>
                  <div className="h-4 w-20 rounded bg-paper-2" />
                  <div className="mt-2 h-6 w-40 rounded bg-paper-2" />
                  <div className="mt-4 h-8 w-32 rounded bg-paper-2" />
                  <div className="mt-4 h-4 w-full rounded bg-paper-2" />
                </div>
                <div className="h-11 w-full rounded bg-paper-2" />
              </div>
            ))}
          </div>
        ) : activePackages.length === 0 ? (
          <div className="rounded-card border border-rule bg-card p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink">
              Belum ada paket aktif tersedia
            </h3>
            <p className="mt-1 text-sm text-ink-2 sm:text-base">
              Tambahkan atau aktifkan paket foto melalui Panel Admin agar klien dapat memilih paket saat booking.
            </p>
          </div>
        ) : (
          <div className={gridClass}>
            {activePackages.map((pkg, index) => {
              const isSelected = pkg.id === selectedPackageId;
              const code = String(index + 1).padStart(2, '0');

              return (
                <motion.article
                  key={pkg.id}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  className={`group flex flex-col justify-between rounded-card border p-5 transition-colors duration-[var(--dur-short)] sm:p-6 ${
                    isSelected
                      ? 'border-accent bg-accent-soft/75 shadow-[var(--shadow-card)]'
                      : 'border-rule bg-card hover:border-field-border'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="num text-xs font-medium text-muted">Paket {code}</p>
                        <h3 className="mt-1 font-display text-2xl font-semibold text-ink">
                          {pkg.nama_paket}
                        </h3>
                      </div>

                      {isSelected ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-accent/50 bg-card px-2.5 py-1 text-xs font-medium text-accent">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Terpilih</span>
                        </span>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="num inline-flex shrink-0 items-center rounded-pill bg-paper-2 px-2.5 py-1 text-xs font-medium text-muted"
                        >
                          {code}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-baseline gap-1.5 border-b border-rule/80 pb-4">
                      <p className="num font-display text-3xl font-semibold text-ink">
                        {formatRupiah(pkg.harga)}
                      </p>
                      <span className="text-xs font-medium text-muted">/ sesi</span>
                    </div>

                    <div className="mt-4 flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-relaxed text-ink-2 sm:text-base">
                        {pkg.deskripsi}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-2">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectPackage(pkg)}
                      className={`btn w-full justify-between px-4 ${
                        isSelected
                          ? 'btn--primary'
                          : 'btn--quiet group-hover:border-accent/60 group-hover:text-ink'
                      }`}
                    >
                      <span>{isSelected ? 'Paket dipilih' : 'Pilih paket ini'}</span>
                      {isSelected ? (
                        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-muted transition-transform duration-[var(--dur-short)] group-hover:translate-x-0.5 group-hover:text-accent"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
