import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer modern editorial layout', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('menampilkan navigasi 2 kolom, tautan WhatsApp Admin valid, dan aksi ke atas/panel admin', () => {
    const onNavigate = vi.fn();
    const onToggleAdmin = vi.fn();

    render(
      <Footer
        mode="live"
        activeView="booking"
        whatsappAdminNumber="0812-3456-7890"
        onNavigateSection={onNavigate}
        onToggleAdmin={onToggleAdmin}
      />,
    );

    expect(screen.getByText('Spreadsheet Live')).toBeInTheDocument();

    const waLink = screen.getByRole('link', { name: /WhatsApp Admin: 0812-3456-7890/i });
    expect(waLink).toHaveAttribute('href', 'https://wa.me/6281234567890');

    fireEvent.click(screen.getByRole('link', { name: /Jadwal tersedia/i }));
    expect(onNavigate).toHaveBeenCalledWith('#jadwal');

    fireEvent.click(screen.getByRole('button', { name: /Kembali ke atas halaman/i }));
    expect(onNavigate).toHaveBeenCalledWith('#top');

    fireEvent.click(screen.getByRole('button', { name: /Panel Admin/i }));
    expect(onToggleAdmin).toHaveBeenCalledOnce();
  });

  it('menampilkan petunjuk pengaturan saat nomor WhatsApp belum diisi', () => {
    render(
      <Footer
        mode="preview"
        activeView="admin"
        whatsappAdminNumber=""
        onNavigateSection={vi.fn()}
        onToggleAdmin={vi.fn()}
      />,
    );

    expect(screen.getByText('Mode Preview Lokal')).toBeInTheDocument();
    expect(
      screen.getByText(/Nomor WhatsApp admin dapat diatur pada tab Koneksi & Setup/i),
    ).toBeInTheDocument();
  });
});
