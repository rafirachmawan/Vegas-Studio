import { useRef } from 'react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapTextReveal(sectionRef, { triggerOnScroll: true, stagger: 0.06 });

  return (
    <section
      id="tentang-kami"
      ref={sectionRef}
      aria-labelledby="heading-tentang"
      className="relative overflow-hidden border-b border-rule bg-card py-12 sm:py-20"
    >
      <figure
        data-slot="about-studio"
        data-alt="Placeholder foto peralatan studio dan catatan kamera Vegas Studio"
        className="pointer-events-none absolute inset-0 m-0"
      >
        <img
          src="/placeholders/about-studio.jpg"
          width="1920"
          height="1080"
          decoding="async"
          alt="Meja kerja studio fotografi dengan kamera analog sebagai latar placeholder"
          className="h-full w-full object-cover opacity-55"
        />
      </figure>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-card/80 sm:bg-card/70"
      />

      <div className="container relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <blockquote data-gsap-text className="m-0 flex flex-col gap-2.5 sm:gap-3">
            <p className="font-display text-2xl font-semibold leading-tight text-ink sm:text-4xl">
              “Karya yang bagus adalah karya yang kau sukai”
            </p>
            <cite className="not-italic text-sm font-medium text-ink-2">
              Vegas Studio
            </cite>
          </blockquote>
        </div>

        <div className="flex flex-col gap-3.5 sm:gap-4 lg:col-span-6">
          <h2
            id="heading-tentang"
            data-gsap-text
            className="font-display text-xl font-semibold text-ink sm:text-3xl"
          >
            Sekilas Tentang Kami
          </h2>
          <p className="text-sm leading-relaxed text-ink-2 sm:text-base">
            Vegas Studio melayani jasa fotografi dan video untuk sesi wisuda, portrait, pasangan, hingga dokumentasi acara. Seluruh proses penjadwalan disusun transparan agar calon klien mudah mengecek slot kosong dan memilih fotografer sesuai kebutuhan.
          </p>
          <p className="text-sm leading-relaxed text-ink-2 sm:text-base">
            File mentahan serta hasil edit warna disiapkan rapi sesuai paket yang Anda pilih pada formulir pemesanan di bawah.
          </p>
        </div>
      </div>
    </section>
  );
}
