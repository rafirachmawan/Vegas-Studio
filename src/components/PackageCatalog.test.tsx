import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PackageCatalog } from './PackageCatalog';
import type { PackageItem } from '../types/studio';

const SAMPLE_TWO_PACKAGES: PackageItem[] = [
  {
    id: 'pkt-01',
    nama_paket: 'Basic',
    harga: 100000,
    deskripsi: 'durasi 1 jam 10 poto',
    aktif: true,
  },
  {
    id: 'pkt-02',
    nama_paket: 'pro',
    harga: 200000,
    deskripsi: 'durasi 1 jam 20 poto',
    aktif: true,
  },
];

describe('PackageCatalog modern responsive layout', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('menyeimbangkan grid menjadi 2 kolom saat hanya ada 2 paket aktif', () => {
    const { container } = render(
      <PackageCatalog
        packages={SAMPLE_TWO_PACKAGES}
        selectedPackageId=""
        isLoading={false}
        onSelectPackage={vi.fn()}
      />,
    );

    const grid = container.querySelector('.sm\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).not.toContain('lg:grid-cols-3');
    expect(screen.getByText('2 paket tersedia')).toBeInTheDocument();
    expect(screen.getByText('Rp100.000')).toBeInTheDocument();
    expect(screen.getByText('Rp200.000')).toBeInTheDocument();
  });

  it('menandai paket terpilih dan menyembunyikan paket nonaktif', () => {
    const onSelect = vi.fn();
    render(
      <PackageCatalog
        packages={[
          ...SAMPLE_TWO_PACKAGES,
          {
            id: 'pkt-03',
            nama_paket: 'Arsip Lama',
            harga: 90000,
            deskripsi: 'nonaktif',
            aktif: false,
          },
        ]}
        selectedPackageId="pkt-02"
        isLoading={false}
        onSelectPackage={onSelect}
      />,
    );

    expect(screen.queryByText('Arsip Lama')).not.toBeInTheDocument();
    expect(screen.getByText('Terpilih')).toBeInTheDocument();

    const selectedBtn = screen.getByRole('button', { name: /Paket dipilih/i });
    expect(selectedBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Pilih paket ini/i }));
    expect(onSelect).toHaveBeenCalledWith(SAMPLE_TWO_PACKAGES[0]);
  });
});
