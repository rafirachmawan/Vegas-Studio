import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';

interface GalleryPlaceholderItem {
  slot: string;
  code: string;
  tag: string;
  title: string;
  caption: string;
  src: string;
  alt: string;
}

const AUTOPLAY_INTERVAL_MS = 2400;

const GALLERY_PLACEHOLDERS: GalleryPlaceholderItem[] = [
  {
    slot: 'gallery-1',
    code: '01',
    tag: 'Arsitektur Klasik',
    title: 'Placeholder Foto 1',
    caption: 'Komposisi lorong bertekstur dengan kedalaman perspektif natural untuk sesi outdoor.',
    src: '/placeholders/alley-in-gamla-stan-stockholm-1920.jpg',
    alt: 'Placeholder galeri foto studio pertama bernuansa arsitektur jalan klasik',
  },
  {
    slot: 'gallery-2',
    code: '02',
    tag: 'Minimalis Urban',
    title: 'Placeholder Foto 2',
    caption: 'Pencahayaan garis simetris di ruang publik untuk gaya potret modern dan bersih.',
    src: '/placeholders/akalla-metro-station-august-2014-01-1920.jpg',
    alt: 'Placeholder galeri foto studio kedua di ruang stasiun bawah tanah',
  },
  {
    slot: 'gallery-3',
    code: '03',
    tag: 'Warm Low-Light',
    title: 'Placeholder Foto 3',
    caption: 'Kontras cahaya hangat berkarakter dramatis untuk konsep editorial malam.',
    src: '/placeholders/oriental-hanging-lanterns-souk-haddadine-marrakech-medina-mo-1920.jpg',
    alt: 'Placeholder galeri foto studio ketiga dengan pencahayaan lentera gelap',
  },
  {
    slot: 'gallery-4',
    code: '04',
    tag: 'Senja Kota',
    title: 'Placeholder Foto 4',
    caption: 'Tone warna senja perkotaan dengan nuansa biru lembut dan cahaya lampu kota.',
    src: '/placeholders/globen-metro-station-may-2016-1920.jpg',
    alt: 'Placeholder galeri foto studio keempat suasana senja perkotaan',
  },
];

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useGsapTextReveal(sectionRef, { triggerOnScroll: true, stagger: 0.05 });

  const [reducedMotion, setReducedMotion] = useState<boolean>(getPrefersReducedMotion);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPausedByUser, setIsPausedByUser] = useState<boolean>(getPrefersReducedMotion);
  const [isPointerPaused, setIsPointerPaused] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);

  const totalSlides = GALLERY_PLACEHOLDERS.length;
  const activeItem = GALLERY_PLACEHOLDERS[activeIndex] ?? GALLERY_PLACEHOLDERS[0]!;
  const isAutoPlaying = !isPausedByUser && !isPointerPaused && !isFocusPaused && !reducedMotion;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setReducedMotion(media.matches);
      if (media.matches) {
        setIsPausedByUser(true);
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const goToIndex = useCallback(
    (nextIdx: number, nextDir?: 1 | -1) => {
      const normalized = ((nextIdx % totalSlides) + totalSlides) % totalSlides;
      setDirection(nextDir ?? (normalized >= activeIndex ? 1 : -1));
      setActiveIndex(normalized);
    },
    [activeIndex, totalSlides],
  );

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (!isAutoPlaying) {
      return;
    }
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isAutoPlaying, totalSlides]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0];
    if (!firstTouch) {
      return;
    }
    touchStartX.current = firstTouch.clientX;
    touchStartY.current = firstTouch.clientY;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }
    const changed = event.changedTouches[0];
    if (!changed) {
      return;
    }
    const deltaX = changed.clientX - touchStartX.current;
    const deltaY = changed.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  return (
    <section
      id="gallery"
      ref={sectionRef}
      aria-labelledby="heading-gallery"
      className="border-b border-rule bg-paper py-5 sm:py-7"
    >
      <div
        className="container flex flex-col gap-4 sm:gap-5"
        onMouseEnter={() => setIsPointerPaused(true)}
        onMouseLeave={() => setIsPointerPaused(false)}
        onFocusCapture={(event) => {
          if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
            setIsFocusPaused(true);
          }
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsFocusPaused(false);
          }
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2
              id="heading-gallery"
              data-gsap-text
              className="font-display text-2xl font-semibold text-ink sm:text-3xl"
            >
              My Gallery
            </h2>
            <p className="max-w-2xl text-xs text-ink-2 sm:text-sm">
              Slot foto contoh sementara sebagai placeholder portofolio Vegas Studio dan siap diganti dengan hasil pemotretan asli Anda.
            </p>
          </div>

          <div
            role="group"
            aria-label="Kontrol tampilan slide galeri"
            className="flex shrink-0 items-center justify-between gap-2.5 sm:justify-end"
          >
            <span
              aria-live="polite"
              className="num inline-flex items-center gap-1.5 rounded-pill border border-rule bg-card px-2.5 py-1 text-xs font-medium text-ink-2"
            >
              <span className="text-accent">{activeItem.code}</span>
              <span className="text-muted">/</span>
              <span>0{totalSlides}</span>
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Foto galeri sebelumnya"
                className="btn btn--quiet min-h-9 min-w-9 px-2.5 sm:min-h-10 sm:min-w-10"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                aria-pressed={!isPausedByUser}
                onClick={() => setIsPausedByUser((prev) => !prev)}
                aria-label={isPausedByUser ? 'Putar slide otomatis' : 'Jeda slide otomatis'}
                className="btn btn--quiet min-h-9 gap-1.5 px-2.5 text-xs sm:min-h-10 sm:px-3"
              >
                {isPausedByUser ? (
                  <>
                    <Play className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span>Putar</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span>Jeda</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Foto galeri berikutnya"
                className="btn btn--quiet min-h-9 min-w-9 px-2.5 sm:min-h-10 sm:min-w-10"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:items-stretch">
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-roledescription="carousel"
            aria-label="Sorotan foto portofolio Vegas Studio"
            className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] border border-rule bg-card shadow-[var(--shadow-card)] lg:col-span-7 lg:aspect-auto lg:h-[360px]"
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={activeItem.slot}
                custom={direction}
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: direction * 36, scale: 1.03 }
                }
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, x: 0, scale: 1 }
                }
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: direction * -28, scale: 0.99 }
                }
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 h-full w-full"
              >
                <motion.img
                  src={activeItem.src}
                  width="1920"
                  height="2560"
                  decoding="async"
                  alt={activeItem.alt}
                  initial={reducedMotion ? undefined : { scale: 1.02 }}
                  animate={
                    reducedMotion
                      ? undefined
                      : { scale: isAutoPlaying ? 1.07 : 1.02 }
                  }
                  transition={
                    reducedMotion
                      ? undefined
                      : { duration: AUTOPLAY_INTERVAL_MS / 1000, ease: 'linear' }
                  }
                  className="h-full w-full object-cover"
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/55 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3.5 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num rounded-pill bg-accent px-2 py-0.5 text-xs font-medium text-accent-ink">
                      {activeItem.code}
                    </span>
                    <span className="rounded-pill border border-rule bg-card/85 px-2.5 py-0.5 text-xs font-medium text-ink">
                      {activeItem.tag}
                    </span>
                  </div>

                  <p className="max-w-xl text-xs leading-relaxed text-ink-2 sm:text-sm">
                    {activeItem.caption}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 z-10 h-0.5 bg-rule/50"
            >
              {isAutoPlaying ? (
                <motion.div
                  key={`progress-${activeItem.slot}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTOPLAY_INTERVAL_MS / 1000, ease: 'linear' }}
                  className="h-full w-full origin-left bg-accent"
                />
              ) : (
                <div
                  className="h-full w-full origin-left bg-accent/65 transition-transform duration-[var(--dur-short)]"
                  style={{ transform: `scaleX(${(activeIndex + 1) / totalSlides})` }}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:col-span-5 lg:h-[360px] lg:grid-rows-2">
            {GALLERY_PLACEHOLDERS.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <motion.button
                  key={item.slot}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => goToIndex(idx)}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative flex h-full flex-col gap-1.5 rounded-[var(--radius-card)] border p-1.5 text-left transition-colors duration-[var(--dur-short)] sm:p-2 ${
                    isSelected
                      ? 'border-accent bg-accent-soft/55'
                      : 'border-rule bg-card hover:border-field-border'
                  }`}
                >
                  <div
                    data-slot={item.slot}
                    data-alt={item.alt}
                    className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] bg-paper-2 lg:aspect-auto lg:min-h-0 lg:flex-1"
                  >
                    <img
                      src={item.src}
                      width="1920"
                      height="2560"
                      decoding="async"
                      alt={item.alt}
                      className={`h-full w-full object-cover transition-opacity duration-[var(--dur-short)] ${
                        isSelected
                          ? 'opacity-100'
                          : 'opacity-75 group-hover:opacity-100'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`num absolute top-2 left-2 rounded-pill px-2 py-0.5 text-xs font-medium ${
                        isSelected
                          ? 'bg-accent text-accent-ink'
                          : 'border border-rule bg-card/85 text-ink-2'
                      }`}
                    >
                      {item.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-0.5 pb-0.5">
                    <span
                      className={`truncate text-xs font-medium sm:text-sm ${
                        isSelected ? 'text-accent' : 'text-ink-2 group-hover:text-ink'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
