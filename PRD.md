# Product Requirements Document (PRD): Vegas Studio — Sistem Booking & Manajemen Jadwal Fotografi

## 1. Ringkasan Produk (Product Overview)

**Vegas Studio** adalah aplikasi web booking jadwal untuk fotografer _freelance_ yang terhubung langsung ke **Google Sheets** (via **Google Apps Script**) sebagai sumber data utama dan rekapitulasi pemesanan, dilengkapi alur konfirmasi otomatis ke WhatsApp fotografer/admin melalui _redirect_ `wa.me`.

Tujuan utama produk ini adalah memudahkan calon klien melihat jadwal kosong, melakukan booking mandiri dengan data terstruktur, serta memberi fotografer/admin kendali penuh atas daftar **Paket** dan **Fotografer** tanpa biaya server bulanan.

---

## 2. Target Pengguna & Peran (User Roles)

1. **Calon Klien (Public User)**
   - Melihat daftar jadwal yang tersedia (`Kosong`) dan yang sudah terisi (`Booked`).
   - Memilih jadwal kosong untuk mengisi formulir pemesanan.
   - Mengirim booking dan diarahkan ke WhatsApp dengan format pesan yang sudah tersusun rapi.
2. **Fotografer / Admin (Manage Mode)**
   - Mengelola data **Paket** (Create, Read, Update, Delete).
   - Mengelola data **Fotografer** (Create, Read, Update, Delete) yang dapat dipilih saat booking.
   - Memantau jadwal dan rekap booking langsung di Google Sheets (serta menambah/mengatur slot jadwal).

---

## 3. Scope & Kebutuhan Fitur (Functional Requirements)

### 3.1 Halaman Utama / Booking Flow (Klien)

- **Hero, Galeri Placeholder & Tentang Kami:**
  - **Hero Full-Bleed Dark Editorial:** Navigasi atas minimalis, judul utama editorial, visual kamera studio placeholder, info kontak WhatsApp admin, serta tombol aksi menuju form booking dan jadwal.
  - **My Gallery (Placeholder):** Grid/deret 4 kartu foto portrait placeholder beserta judul masing-masing (siap diganti dengan portofolio asli Vegas Studio).
  - **Quote & Sekilas Tentang Kami:** Bagian pengenalan singkat studio di atas latar foto studio placeholder dengan lapisan gelap agar teks tetap terbaca jelas.
- **Tampilan Jadwal Real-Time:**
  - Mengambil data jadwal dari Google Sheets (`Jadwal`).
  - Jadwal dengan status `Kosong` dapat diklik; jadwal dengan status `Booked` tampil non-aktif (_disabled_) agar tidak dipilih ulang.
  - **Auto-fill Tanggal & Jam:** Saat klien mengklik salah satu jadwal kosong, tanggal (format `DD/MM/YYYY` seperti `16/12/2026`) dan slot jam otomatis terisi ke dalam form booking.
- **Form Pemesanan Wajib (Menyesuaikan Header Spreadsheet `JADWAL WISUDA`):**
  1. **Tanggal:** Terisi otomatis dari slot kosong yang diklik klien (bisa juga disesuaikan via pemilih jadwal).
  2. **FG (Fotografer):** Pilihan wajib dari data Fotografer aktif (misalnya `Vegas`, `Age`, `Vegas dan Age`).
  3. **Jam:** Terisi dari slot atau dipilih/diisi sesuai sesi (misalnya `6 pagi`, `1 Siang`, `2 siang`, `3 sore`, `4 sore`).
  4. **Paket:** Pilihan wajib dari data Paket aktif (misalnya `Basic Foto`, `Bundling Foto dan Video`) beserta harga & deskripsi.
  5. **Nama Klien:** Input teks wajib diisi.
  6. **Username IG:** Input username Instagram klien (misalnya `@amtriwuln_`).
  7. **Kampus & Lokasi:** Input lokasi/kampus pemotretan (misalnya `UIN Tulungagung`, `Tropical house`).
  8. **No. WA & Bayar:** Input **Nomor WhatsApp Klien** dan **Nominal / Keterangan DP** (digabung otomatis menjadi format seperti `0812-5554-5565 (dp 50%)` atau `0812-5554-5565 (dp Rp250.000)`).
- **Submit, Rekap Spreadsheet Otomatis & Redirect WhatsApp:**
  - Validasi seluruh field wajib sebelum dikirim.
  - Mengirim data ke Google Apps Script untuk dicatat otomatis ke sheet `Jadwal_Wisuda` dengan **header yang sama persis seperti spreadsheet operasional** (`No`, `Tanggal`, `FG`, `Jam`, `Paket`, `Nama Klien`, `Username IG`, `Kampus & Lokasi`, `No. WA & Bayar`, `Status` otomatis `Belum`), serta menandai slot jadwal terkait jika berasal dari slot `Jadwal`.
  - Setelah penyimpanan sukses, membuka link `https://wa.me/<NOMOR_WA>?text=<ENCODED_MESSAGE>` berisi ringkasan booking lengkap.
  - Menangani _race condition_ sederhana jika slot mendadak terisi saat proses submit berlangsung.

### 3.2 Panel Admin (CRUD Paket & Fotografer)

- **Akses Admin:**
  - Tersedia akses khusus ke mode/halaman Admin (dilindungi PIN/passcode sederhana di sisi klien/konfigurasi agar tidak sembarang orang mengubah data).
- **CRUD Paket:**
  - **Create:** Tambah paket baru (misalnya: Nama Paket, Durasi/Keterangan, Harga).
  - **Read:** Tampilkan daftar seluruh paket.
  - **Update:** Edit data paket yang sudah ada.
  - **Delete:** Hapus paket yang tidak lagi dipakai.
- **CRUD Fotografer:**
  - **Create:** Tambah nama/profil fotografer baru.
  - **Read:** Tampilkan daftar fotografer.
  - **Update:** Edit informasi fotografer.
  - **Delete:** Hapus fotografer dari daftar pilihan.
- **Sinkronisasi Langsung:** Perubahan pada Paket dan Fotografer tersimpan ke Google Sheets dan langsung tercermin pada form booking klien.

---

## 4. Struktur Data Google Sheets

Satu spreadsheet memuat minimal 4 tab:

1. `Jadwal`: `id`, `tanggal`, `jam` (opsional), `status` (`Kosong` / `Booked`), `catatan`.
2. `Paket`: `id`, `nama_paket`, `harga`, `deskripsi`, `aktif`.
3. `Fotografer`: `id`, `nama_fotografer`, `spesialisasi` (opsional), `aktif`.
4. `Jadwal_Wisuda` (Rekap Booking otomatis sesuai format operasional): `No`, `Tanggal`, `FG`, `Jam`, `Paket`, `Nama Klien`, `Username IG`, `Kampus & Lokasi`, `No. WA & Bayar`, `Status`.

---

## 5. Tech Stack & Arsitektur Teknis (Clean Code)

- **Frontend:** **Vite + React + TypeScript** dengan **Tailwind CSS**.
  - **Animasi & Smooth Scroll:**
    - **GSAP** (`gsap`) untuk animasi teks.
    - **Motion** (`motion`) untuk animasi komponen UI.
    - **Lenis** (`lenis`) untuk _smooth scrolling_ agar scroll terasa halus.
  - Struktur folder modular dan terpisah jelas: `components/`, `pages/` atau `views/`, `services/` (API layer ke Google Apps Script), `types/` (interface data), dan `utils/` (formatter rupiah, tanggal, dan builder URL `wa.me`).
  - Komponen kecil, _reusable_, _state_ terprediksi, dan tanpa logika bisnis berserakan di dalam JSX.
- **Backend / API Layer:** **Google Apps Script (Web App)** sebagai endpoint REST-like (`doGet` & `doPost`) terhubung ke Spreadsheet aktif.
- **Deployment:** Static hosting gratis (Vercel / Netlify / Cloudflare Pages).

---

## 6. Prinsip Desain & Layout (Anti-AI Slop)

- **Visual & Layout:**
  - Tata letak bersih, terstruktur, dan fungsional dengan hierarki visual yang jelas (jadwal di area utama, form booking terarah, panel admin terpisah rapi).
  - Hindari klise visual generik _"AI slop"_: jangan gunakan _gradient_ ungu-biru berlebihan, _glow_ neon tidak relevan, kartu mengambang berlebihan dengan bayangan berat, ikon/dekorasi berlebih, atau _copywriting_ klise/berbunga.
- **Tipografi & Warna:**
  - Gunakan kombinasi **serif editorial** (`Playfair Display`) untuk headline utama/galeri dan **sans-serif bersih** (`Hanken Grotesk`) untuk UI, form, serta `tabular-nums` untuk tanggal, jam, dan nominal DP/harga.
  - Palet gelap arang (*dark charcoal* editorial) dengan kontras teks terang yang nyaman dibaca, satu warna aksen utama (*olive-gold*) pada tombol CTA, serta indikator status yang jelas (`Kosong` vs `Booked`).
- **Responsivitas & UX:**
  - Nyaman digunakan di _mobile_ maupun _desktop_.
  - Animasi teks (**GSAP**), transisi komponen (**Motion**), dan _smooth scroll_ (**Lenis**) diterapkan secara halus dan terukur agar tidak mengganggu keterbacaan maupun alur booking.
  - Tampilkan _loading state_, _empty state_, dan pesan _error_ yang lugas dan informatif.

---

## 7. Out of Scope (Tahap Awal)

- _Payment gateway_ otomatis / verifikasi mutasi bank otomatis.
- Pengiriman pesan WhatsApp otomatis _background_ via API pihak ketiga berbayar (menggunakan redirect `wa.me`).
- Sistem _login_ multi-user kompleks dengan database SQL terpisah.
- Fitur galeri foto klien / _client proofing_.

---

## 8. Acceptance Criteria (Kriteria Selesai)

- [ ] Jadwal kosong tampil dan bisa diklik; jadwal `Booked` tidak bisa diklik.
- [ ] Klik jadwal kosong otomatis mengisi field **Tanggal** pada form booking.
- [ ] Form memvalidasi seluruh field wajib sesuai header spreadsheet: **Tanggal**, **FG**, **Jam**, **Paket**, **Nama Klien**, **Username IG**, **Kampus & Lokasi**, dan **No. WA & Bayar**.
- [ ] Submit booking menyimpan data otomatis ke spreadsheet dengan header `No | Tanggal | FG | Jam | Paket | Nama Klien | Username IG | Kampus & Lokasi | No. WA & Bayar | Status` dan mengarahkan ke WhatsApp dengan teks terisi lengkap.
- [ ] Admin dapat melakukan **Create, Read, Update, Delete** untuk **Paket** dan **Fotografer**, dan hasilnya muncul di form booking.
- [ ] Animasi teks menggunakan **GSAP**, animasi komponen menggunakan **Motion**, dan _smooth scroll_ menggunakan **Lenis** berjalan halus tanpa mengganggu UX.
- [ ] Kode tersusun rapi, _type-safe_ (TypeScript), dan bebas _AI slop_ pada tampilan maupun struktur.
