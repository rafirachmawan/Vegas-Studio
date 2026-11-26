import { useRef } from 'react';
import { motion } from 'motion/react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';

interface GalleryPlaceholderItem {
  slot: string;
  title: string;
  src: string;
  alt: string;
}

const GALLERY_PLACEHOLDERS: GalleryPlaceholderItem[] = [
  {
    slot: 'gallery-1',
    title: 'Placeholder Foto 1',
    src: '/placeholders/alley-in-gamla-stan-stockholm-1920.jpg',
    alt: 'Placeholder galeri foto studio pertama bernuansa arsitektur jalan klasik',
  },
  {
    slot: 'gallery-2',
    title: 'Placeholder Foto 2',
    src: '/placeholders/akalla-metro-station-august-2014-01-1920.jpg',
    alt: 'Placeholder galeri foto studio kedua di ruang stasiun bawah tanah',
  },
  {
    slot: 'gallery-3',
    title: 'Placeholder Foto 3',
    src: '/placeholders/oriental-hanging-lanterns-souk-haddadine-marrakech-medina-mo-1920.jpg',
    alt: 'Placeholder galeri foto studio ketiga dengan pencahayaan lentera gelap',
  },
  {
    slot: 'gallery-4',
    title: 'Placeholder Foto 4',
    src: '/placeholders/globen-metro-station-may-2016-1920.jpg',
    alt: 'Placeholder galeri foto studio keempat suasana senja perkotaan',
  },
];

export function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapTextReveal(sectionRef, { triggerOnScroll: true, stagger: 0.05 });

  return (
    <section
      id="gallery"
      ref={sectionRef}
      aria-labelledby="heading-gallery"
      className="border-b border-rule bg-paper py-10 sm:py-16"
    >
      <div className="container flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-2">
          <h2 id="heading-gallery" data-gsap-text className="font-display font-semibold text-ink">
            My Gallery
          </h2>
          <p className="max-w-2xl text-sm text-ink-2 sm:text-base">
            Slot foto contoh sementara sebagai placeholder portofolio Vegas Studio dan siap diganti dengan hasil pemotretan asli Anda.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
          {GALLERY_PLACEHOLDERS.map((item) => (
            <motion.figure
              key={item.slot}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="m-0 flex flex-col gap-2"
            >
              <div
                data-slot={item.slot}
                data-alt={item.alt}
                className="aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-card)] border border-rule bg-card"
              >
                <img
                  src={item.src}
                  width="1920"
                  height="2560"
                  decoding="async"
                  alt={item.alt}
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="text-xs font-medium text-ink-2 sm:text-sm">
                {item.title}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
