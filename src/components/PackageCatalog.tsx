import { useRef } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';
import type { PackageItem } from '../types/studio';
import { formatRupiah } from '../utils/formatters';

interface PackageCatalogProps {
  packages: PackageItem[];
  selectedPackageId: string;
  isLoading: boolean;
  onSelectPackage: (pkg: PackageItem) => void;
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

  return (
    <section
      id="paket"
      ref={sectionRef}
      aria-labelledby="heading-paket"
      className="border-b border-rule bg-paper py-10 sm:py-16"
    >
      <div className="container flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-2">
          <h2 id="heading-paket" data-gsap-text className="font-display font-semibold text-ink">
            Daftar paket foto
          </h2>
          <p className="max-w-2xl text-sm text-ink-2 sm:text-base">
            Pilih paket yang sesuai dengan kebutuhan sesi Anda untuk otomatis terisi di formulir booking.
          </p>
        </div>

        {isLoading && activePackages.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-44 animate-pulse rounded-card border border-rule bg-card p-5 sm:p-6"
              >
                <div className="h-5 w-40 rounded bg-paper-2" />
                <div className="mt-3 h-7 w-28 rounded bg-paper-2" />
                <div className="mt-4 h-4 w-full rounded bg-paper-2" />
              </div>
            ))}
          </div>
        ) : activePackages.length === 0 ? (
          <div className="rounded-card border border-rule bg-card p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink">
              Belum ada paket aktif tersedia
            </h3>
            <p className="mt-1 text-ink-2">
              Tambahkan atau aktifkan paket foto melalui Panel Admin agar klien dapat memilih paket saat booking.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePackages.map((pkg) => {
              const isSelected = pkg.id === selectedPackageId;
              return (
                <motion.div
                  key={pkg.id}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col justify-between rounded-card border p-5 transition-colors duration-[var(--dur-short)] sm:p-6 ${
                    isSelected
                      ? 'border-accent bg-accent-soft'
                      : 'border-rule bg-card'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-xl font-semibold text-ink">
                        {pkg.nama_paket}
                      </h3>
                      {isSelected && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-accent/50 bg-card px-2.5 py-0.5 text-xs font-medium text-accent">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Terpilih</span>
                        </span>
                      )}
                    </div>

                    <p className="num mt-3 font-body text-2xl font-medium text-ink">
                      {formatRupiah(pkg.harga)}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-ink-2">
                      {pkg.deskripsi}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-rule pt-4">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectPackage(pkg)}
                      className={`btn btn--quiet w-full ${
                        isSelected ? 'border-accent bg-card text-accent' : ''
                      }`}
                    >
                      {isSelected ? 'Paket dipilih' : 'Pilih paket ini'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
