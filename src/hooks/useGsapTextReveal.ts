import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface UseGsapTextRevealOptions {
  selector?: string;
  triggerOnScroll?: boolean;
  stagger?: number;
}

/**
 * Menganimasikan teks/heading dengan GSAP tanpa menyembunyikan konten pada CSS awal (patuh reduced-motion & fallback no-script).
 */
export function useGsapTextReveal(
  containerRef: RefObject<HTMLElement | null>,
  options: UseGsapTextRevealOptions = {},
) {
  const {
    selector = '[data-gsap-text]',
    triggerOnScroll = false,
    stagger = 0.06,
  } = options;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      return;
    }

    const targets = root.querySelectorAll<HTMLElement>(selector);
    if (targets.length === 0) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y: 14,
        opacity: 0.01,
        duration: 0.45,
        stagger,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        ...(triggerOnScroll
          ? {
              scrollTrigger: {
                trigger: root,
                start: 'top 86%',
                once: true,
              },
            }
          : {}),
      });
    }, root);

    return () => {
      ctx.revert();
    };
  }, [containerRef, selector, triggerOnScroll, stagger]);
}
