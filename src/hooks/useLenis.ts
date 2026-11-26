import { useCallback, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useLenisSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    const onLenisScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on('scroll', onLenisScroll);

    let frameId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = window.requestAnimationFrame(raf);
    };
    frameId = window.requestAnimationFrame(raf);

    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        window.cancelAnimationFrame(frameId);
        lenis.destroy();
        lenisRef.current = null;
      }
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      window.cancelAnimationFrame(frameId);
      lenis.off('scroll', onLenisScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToTarget = useCallback((target: string | HTMLElement) => {
    if (target === '#top') {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { duration: 0.55 });
      } else if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      return;
    }

    const element =
      typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!element) {
      return;
    }

    const headerHeight =
      document.querySelector('header')?.getBoundingClientRect().height ||
      (typeof window !== 'undefined' && window.innerWidth < 640 ? 56 : 64);
    const targetY = Math.max(0, element.getBoundingClientRect().top + window.scrollY - headerHeight);

    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(targetY, { duration: 0.55 });
      return;
    }
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      return;
    }
    if (typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, []);

  return { scrollToTarget };
}
