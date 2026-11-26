import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

function selectComboboxOption(comboboxName: RegExp, optionName: RegExp) {
  fireEvent.click(screen.getByRole('combobox', { name: comboboxName }));
  fireEvent.click(screen.getByRole('option', { name: optionName }));
}

describe('Vegas Studio integration flow', () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('menampilkan Hero, My Gallery 4 placeholder, Tentang Kami, serta auto-fill Tanggal dan Jam dari slot Kosong', async () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /Capture The Moments/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /My Gallery/i })).toBeInTheDocument();
    expect(screen.getByText('Placeholder Foto 1')).toBeInTheDocument();
    expect(screen.getByText('Placeholder Foto 4')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Sekilas Tentang Kami/i }),
    ).toBeInTheDocument();

    const bookedSlots = await screen.findAllByRole('button', { name: /Booked.*202/i });
    expect(bookedSlots[0]).toBeDisabled();

    const emptySlots = await screen.findAllByRole('button', { name: /Kosong.*202/i });
    expect(emptySlots.length).toBeGreaterThan(0);

    fireEvent.click(emptySlots[0]!);

    const tanggalInput = screen.getByLabelText(/^Tanggal/i) as HTMLInputElement;
    const jamInput = screen.getByLabelText(/^Jam/i) as HTMLInputElement;
    expect(tanggalInput.value).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(jamInput.value).not.toBe('');
  });

  it('memvalidasi form, mencatat seluruh 10 header ke rekap, menandai slot Booked, dan mengarahkan ke WhatsApp', async () => {
    window.localStorage.setItem(
      'vegas_studio_settings_v1',
      JSON.stringify({ gasUrl: '', whatsappNumber: '0812-3456-7890', adminPin: '2468' }),
    );
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<App />);

    const submitButton = await screen.findByRole('button', {
      name: /Simpan & Konfirmasi via WhatsApp/i,
    });
    fireEvent.click(submitButton);
    expect(
      await screen.findByText(/Pilih salah satu slot jadwal berstatus Kosong/i),
    ).toBeInTheDocument();

    const emptySlots = await screen.findAllByRole('button', { name: /Kosong.*202/i });
    fireEvent.click(emptySlots[0]!);

    selectComboboxOption(/FG \(Fotografer\)/i, /^Vegas\b(?!\s+dan)/i);
    selectComboboxOption(/^Paket/i, /Basic Foto/i);
    fireEvent.change(screen.getByLabelText(/Nama Klien/i), {
      target: { value: 'Amanda tri Wulandari' },
    });
    fireEvent.change(screen.getByLabelText(/Username IG/i), {
      target: { value: 'amtriwuln_' },
    });
    fireEvent.change(screen.getByLabelText(/Kampus & Lokasi/i), {
      target: { value: 'UIN Tulungagung' },
    });
    fireEvent.change(screen.getByLabelText(/No\. WA Klien/i), {
      target: { value: '0812-5554-5565' },
    });
    fireEvent.change(screen.getByLabelText(/DP \/ Bayar/i), {
      target: { value: '50%' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Simpan & Konfirmasi via WhatsApp/i }));

    await waitFor(() => {
      expect(screen.getByText(/Booking #3 tersimpan di Mode Preview Lokal/i)).toBeInTheDocument();
    });

    const stored = JSON.parse(window.localStorage.getItem('vegas_studio_preview_v2')!) as {
      rekap: Array<{
        no: number;
        tanggal: string;
        fg: string;
        jam: string;
        paket: string;
        nama_klien: string;
        username_ig: string;
        kampus_lokasi: string;
        no_wa_bayar: string;
        status: string;
      }>;
    };
    const latest = stored.rekap[stored.rekap.length - 1]!;
    expect(latest.no).toBe(3);
    expect(latest.tanggal).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(latest.fg).toBe('Vegas');
    expect(latest.paket).toBe('Basic Foto');
    expect(latest.nama_klien).toBe('Amanda tri Wulandari');
    expect(latest.username_ig).toBe('@amtriwuln_');
    expect(latest.kampus_lokasi).toBe('UIN Tulungagung');
    expect(latest.no_wa_bayar).toBe('0812-5554-5565 (dp 50%)');
    expect(latest.status).toBe('Belum');

    const waWebLink = screen.getByRole('link', { name: /Lanjut ke WhatsApp Web/i });
    expect(waWebLink.getAttribute('href')).toContain(
      'https://web.whatsapp.com/send?phone=6281234567890&text=',
    );
    const waAppLink = screen.getByRole('link', { name: /Buka lewat tautan wa\.me/i });
    expect(waAppLink.getAttribute('href')).toContain('https://wa.me/6281234567890?text=');

    const decodedWa = decodeURIComponent(waWebLink.getAttribute('href')!);
    expect(decodedWa).toContain('*DETAIL JADWAL & PAKET*');
    expect(decodedWa).toContain('*No. Rekap:* #3');
    expect(decodedWa).toContain('Amanda tri Wulandari');
    expect(decodedWa).toContain('@amtriwuln_');
    expect(decodedWa).toContain('UIN Tulungagung');
    expect(decodedWa).toContain('0812-5554-5565 (dp 50%)');
    expect(openSpy).toHaveBeenCalledOnce();
    expect(openSpy.mock.calls[0]?.[0]).toContain(
      'https://web.whatsapp.com/send?phone=6281234567890&text=',
    );
  });

  it('tetap menyimpan booking dan memberi opsi salin pesan saat nomor WhatsApp admin belum diisi', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<App />);

    const emptySlots = await screen.findAllByRole('button', { name: /Kosong.*202/i });
    fireEvent.click(emptySlots[0]!);

    selectComboboxOption(/FG \(Fotografer\)/i, /^Age/i);
    selectComboboxOption(/^Paket/i, /Bundling Foto/i);
    fireEvent.change(screen.getByLabelText(/Nama Klien/i), { target: { value: 'Qintana Belqis' } });
    fireEvent.change(screen.getByLabelText(/Username IG/i), { target: { value: '@qintana.zaa' } });
    fireEvent.change(screen.getByLabelText(/Kampus & Lokasi/i), {
      target: { value: 'Tropical house' },
    });
    fireEvent.change(screen.getByLabelText(/No\. WA Klien/i), {
      target: { value: '085812038896' },
    });
    fireEvent.change(screen.getByLabelText(/DP \/ Bayar/i), {
      target: { value: '250000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Simpan & Konfirmasi via WhatsApp/i }));

    expect(
      await screen.findByText(/Nomor WhatsApp admin belum diisi di konfigurasi/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salin pesan booking/i })).toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('menangani race condition saat slot mendadak Booked sebelum submit dan menjaga input client', async () => {
    render(<App />);

    const emptySlots = await screen.findAllByRole('button', { name: /Kosong.*202/i });
    fireEvent.click(emptySlots[0]!);

    selectComboboxOption(/FG \(Fotografer\)/i, /^Vegas\b(?!\s+dan)/i);
    selectComboboxOption(/^Paket/i, /Basic Foto/i);
    fireEvent.change(screen.getByLabelText(/Nama Klien/i), { target: { value: 'Rona Mahmudah' } });
    fireEvent.change(screen.getByLabelText(/Username IG/i), { target: { value: '@ronamhmdh' } });
    fireEvent.change(screen.getByLabelText(/Kampus & Lokasi/i), {
      target: { value: 'Lojika Hotel' },
    });
    fireEvent.change(screen.getByLabelText(/No\. WA Klien/i), {
      target: { value: '08567234461' },
    });
    fireEvent.change(screen.getByLabelText(/DP \/ Bayar/i), {
      target: { value: 'dp 50%' },
    });

    const raw = window.localStorage.getItem('vegas_studio_preview_v2')!;
    const db = JSON.parse(raw) as { jadwal: Array<{ status: string }> };
    db.jadwal.forEach((slot) => {
      slot.status = 'Booked';
    });
    window.localStorage.setItem('vegas_studio_preview_v2', JSON.stringify(db));

    fireEvent.click(screen.getByRole('button', { name: /Simpan & Konfirmasi via WhatsApp/i }));

    expect(await screen.findByText(/Booking belum dapat diproses/i)).toBeInTheDocument();
    expect(screen.getByText(/baru saja terisi oleh pemesan lain/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/Nama Klien/i) as HTMLInputElement).value).toBe('Rona Mahmudah');
  });

  it('membuka Panel Admin dengan PIN, mendukung CRUD Paket, Fotografer, serta melihat tabel 10 header', async () => {
    render(<App />);

    const adminButton = (await screen.findAllByRole('button', { name: /Mode Admin/i }))[0]!;
    fireEvent.click(adminButton);

    const dialog = screen.getByRole('dialog', { hidden: true });
    const pinInput = within(dialog).getByLabelText(/PIN Admin/i);

    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Buka Panel Admin/i }));
    expect(within(dialog).getByText(/PIN tidak sesuai/i)).toBeInTheDocument();

    fireEvent.change(pinInput, { target: { value: '2468' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Buka Panel Admin/i }));

    expect(await screen.findByRole('heading', { name: /Panel Admin Vegas Studio/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nama paket/i), {
      target: { value: 'Outdoor Editorial' },
    });
    fireEvent.change(screen.getByLabelText(/Harga \(Rp\)/i), {
      target: { value: '850000' },
    });
    fireEvent.change(screen.getByLabelText(/Durasi \/ keterangan/i), {
      target: { value: 'Sesi outdoor dengan 40 file edit.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tambah paket/i }));
    expect(await screen.findByRole('heading', { name: /Outdoor Editorial/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Fotografer/i }));
    fireEvent.change(await screen.findByLabelText(/Nama fotografer/i), {
      target: { value: 'Dimas' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tambah fotografer/i }));
    expect(await screen.findByRole('heading', { name: /^Dimas$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Jadwal & Rekap/i }));
    expect(await screen.findByRole('columnheader', { name: /^No$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^FG$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Username IG$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Kampus & Lokasi/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /No\. WA & Bayar/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Lihat Halaman Booking/i }));
    const paketCombo = await screen.findByRole('combobox', { name: /^Paket/i });
    fireEvent.click(paketCombo);
    expect(await screen.findByRole('option', { name: /Outdoor Editorial/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });

    const fgCombo = screen.getByRole('combobox', { name: /FG \(Fotografer\)/i });
    fireEvent.click(fgCombo);
    expect(await screen.findByRole('option', { name: /^Dimas/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
  });

  it('mengatur Nomor WhatsApp Admin dan memvalidasi URL Apps Script via tab Koneksi & Setup (Opsi B)', async () => {
    render(<App />);

    const adminButton = (await screen.findAllByRole('button', { name: /Mode Admin/i }))[0]!;
    fireEvent.click(adminButton);

    const dialog = screen.getByRole('dialog', { hidden: true });
    fireEvent.change(within(dialog).getByLabelText(/PIN Admin/i), { target: { value: '2468' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Buka Panel Admin/i }));

    fireEvent.click(await screen.findByRole('tab', { name: /Koneksi & Setup/i }));

    const urlInput = await screen.findByLabelText(/URL Web App Google Apps Script/i);
    fireEvent.change(urlInput, {
      target: { value: 'https://docs.google.com/spreadsheets/d/12345/edit' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Simpan & Uji Koneksi/i }));
    expect(
      await screen.findByText(/tautan file Google Sheets, bukan URL Web App Google Apps Script/i),
    ).toBeInTheDocument();

    fireEvent.change(urlInput, { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp Admin/i), {
      target: { value: '0812-7777-8888' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Simpan & Uji Koneksi/i }));

    expect(
      await screen.findByText(/Pengaturan WhatsApp & PIN tersimpan/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Lihat Halaman Booking/i }));
    expect(await screen.findByText(/Call Center WhatsApp: 0812-7777-8888/i)).toBeInTheDocument();
  });
});
