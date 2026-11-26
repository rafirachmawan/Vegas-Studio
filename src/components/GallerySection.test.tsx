import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { GallerySection } from './GallerySection';

function mockReducedMotion(enabled: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query.includes('prefers-reduced-motion') ? enabled : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('GallerySection showcase & auto-slide', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('memajukan slide galeri secara otomatis sesuai interval dan mendukung kontrol Jeda/Putar', () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    render(<GallerySection />);

    expect(screen.getByText('Arsitektur Klasik')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Placeholder Foto 1/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    act(() => {
      vi.advanceTimersByTime(2400);
    });

    expect(screen.getByText('Minimalis Urban')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Placeholder Foto 2/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const pauseBtn = screen.getByRole('button', { name: /Jeda slide otomatis/i });
    fireEvent.click(pauseBtn);
    expect(screen.getByRole('button', { name: /Putar slide otomatis/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    // Tetap di slide 02 selama dijeda
    expect(screen.getByText('Minimalis Urban')).toBeInTheDocument();
  });

  it('mendukung tombol Berikutnya, Sebelumnya, dan klik langsung kartu thumbnail', () => {
    mockReducedMotion(false);
    render(<GallerySection />);

    fireEvent.click(screen.getByRole('button', { name: /Foto galeri berikutnya/i }));
    expect(screen.getByText('Minimalis Urban')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Foto galeri sebelumnya/i }));
    expect(screen.getByText('Arsitektur Klasik')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Placeholder Foto 4/i }));
    expect(screen.getByText('Senja Kota')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Placeholder Foto 4/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('menghormati prefers-reduced-motion dengan memulai slide otomatis dalam kondisi dijeda', () => {
    mockReducedMotion(true);
    vi.useFakeTimers();
    render(<GallerySection />);

    expect(screen.getByRole('button', { name: /Putar slide otomatis/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(screen.getByText('Arsitektur Klasik')).toBeInTheDocument();
  });
});
