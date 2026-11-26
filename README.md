# Vegas Studio — Sistem Booking & Manajemen Jadwal Fotografi

Aplikasi web booking jadwal untuk **Vegas Studio** menggunakan **Vite + React + TypeScript + Tailwind CSS**, animasi teks **GSAP**, transisi komponen **Motion**, *smooth scroll* **Lenis**, backend **Google Sheets + Google Apps Script**, serta konfirmasi otomatis ke **WhatsApp** (`wa.me`).

## Fitur Utama

- **Layout Editorial Gelap + Placeholder Siap Ganti:** Hero visual kamera, bagian **My Gallery** (4 foto placeholder di `public/placeholders/`), serta bagian **Quote & Sekilas Tentang Kami**.
- **Tampilan Jadwal Real-Time:** Mengambil slot dari tab `Jadwal`. Slot `Kosong` dapat diklik untuk mengisi **Tanggal** (`DD/MM/YYYY`) dan **Jam** otomatis pada form booking; slot `Booked` nonaktif.
- **Form Booking Sesuai Header Spreadsheet (`Jadwal_Wisuda`):**
  Mengisi dan mengirim 10 kolom operasional secara otomatis ke Google Sheets dan WhatsApp:
  `No` | `Tanggal` | `FG` | `Jam` | `Paket` | `Nama Klien` | `Username IG` | `Kampus & Lokasi` | `No. WA & Bayar` | `Status` (`Belum`).
- **Panel Admin (PIN-Protected):** CRUD **Paket**, CRUD **Fotografer**, manajemen slot **Jadwal**, pemantauan & ubah status rekap `Jadwal_Wisuda`, serta pengaturan koneksi.
- **Mode Preview Lokal:** Sebelum URL Google Apps Script di-deploy, aplikasi dapat diuji di browser menggunakan penyimpanan lokal (`localStorage`).

## Menjalankan Secara Lokal

1. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Pasang dependensi dan jalankan server pengembangan:
   ```bash
   npm install
   npm run dev
   ```
3. Jalankan typecheck, unit/integration test, dan production build:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

## Menghubungkan ke Google Sheets (Google Apps Script)

1. Buka Google Spreadsheet baru atau spreadsheet `JADWAL WISUDA` yang sudah ada.
2. Buka menu **Extensions > Apps Script**.
3. Tempel isi file `gas/Code.gs` ke editor Apps Script, lalu simpan.
4. *(Opsional jika spreadsheet masih kosong)* Jalankan fungsi `setupSpreadsheet` satu kali agar 4 tab terbuat otomatis:
   - `Jadwal_Wisuda` (`No`, `Tanggal`, `FG`, `Jam`, `Paket`, `Nama Klien`, `Username IG`, `Kampus & Lokasi`, `No. WA & Bayar`, `Status`)
   - `Jadwal` (`id`, `tanggal`, `jam`, `status`, `catatan`)
   - `Paket` (`id`, `nama_paket`, `harga`, `deskripsi`, `aktif`)
   - `Fotografer` (`id`, `nama_fotografer`, `spesialisasi`, `aktif`)
   *(Catatan: Jika Anda sudah memiliki sheet dengan judul `JADWAL WISUDA` di baris 1 dan 10 header tersebut di baris 2, `gas/Code.gs` otomatis mendeteksi baris header tersebut dan langsung menambahkan data ke baris berikutnya).*
5. Klik **Deploy > New deployment**, pilih jenis **Web app**:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
6. Salin URL Web App (`https://script.google.com/macros/s/.../exec`), lalu isi ke `.env` (`VITE_GAS_WEB_APP_URL`, `VITE_WHATSAPP_ADMIN`, `VITE_ADMIN_PIN`) atau melalui **Panel Admin > Koneksi & Setup** (PIN default preview: `2468`).

## Mengganti Gambar Placeholder

Ganti file di folder `public/placeholders/` dengan foto asli Vegas Studio Anda (gunakan nama file yang sama atau perbarui path di `HeroSection.tsx`, `GallerySection.tsx`, dan `AboutSection.tsx`):
- `hero-camera.jpg`
- `about-studio.jpg`
- `alley-in-gamla-stan-stockholm-1920.jpg` (atau ganti ke foto studio 1–4 Anda)
"# Vegas-Studio" 
