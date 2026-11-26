import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SelectDropdown, type SelectDropdownOption } from './SelectDropdown';

const SAMPLE_OPTIONS: SelectDropdownOption[] = [
  {
    value: 'pkt-01',
    label: 'Basic Foto',
    badge: 'Rp350.000',
    description: 'Sesi wisuda 1 jam dengan 25 file edit.',
  },
  {
    value: 'pkt-02',
    label: 'Bundling Foto & Video',
    badge: 'Rp650.000',
    description: 'Foto plus video reel wisuda.',
  },
];

describe('SelectDropdown component', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('membuka popover pada mode desktop, memilih opsi, dan memperbarui nilai terpilih', async () => {
    const handleChange = vi.fn();
    render(
      <div>
        <label htmlFor="demo-paket">Paket</label>
        <SelectDropdown
          id="demo-paket"
          value=""
          options={SAMPLE_OPTIONS}
          placeholder="Pilih paket foto…"
          title="Pilih Paket Foto"
          onChange={handleChange}
        />
      </div>,
    );

    const trigger = screen.getByRole('combobox', { name: /Paket/i });
    expect(trigger).toHaveTextContent('Pilih paket foto…');

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Basic Foto/i })).toBeInTheDocument();
    expect(screen.getByText('Rp350.000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: /Bundling Foto & Video/i }));
    expect(handleChange).toHaveBeenCalledWith('pkt-02');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('mendukung navigasi keyboard ArrowDown, Enter, dan Escape', async () => {
    const handleChange = vi.fn();
    render(
      <SelectDropdown
        ariaLabel="Pilih fotografer"
        value=""
        options={[
          { value: 'ftg-01', label: 'Vegas', description: 'Wisuda' },
          { value: 'ftg-02', label: 'Age', description: 'Editorial' },
        ]}
        onChange={handleChange}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: /Pilih fotografer/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith('ftg-02');

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('menampilkan bottom sheet dengan tombol tutup pada viewport mobile', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('max-width: 639px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const handleChange = vi.fn();
    render(
      <SelectDropdown
        ariaLabel="Pilih status"
        title="Pilih Status"
        value="Belum"
        options={[
          { value: 'Belum', label: 'Belum', dotColorClass: 'bg-error' },
          { value: 'Lunas', label: 'Lunas', dotColorClass: 'bg-success' },
        ]}
        onChange={handleChange}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: /Pilih status/i });
    fireEvent.click(trigger);

    expect(screen.getByText('Pilih Status')).toBeInTheDocument();
    const closeBtn = screen.getByRole('button', { name: /Tutup daftar Pilih Status/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: /Lunas/i }));
    expect(handleChange).toHaveBeenCalledWith('Lunas');
  });
});
