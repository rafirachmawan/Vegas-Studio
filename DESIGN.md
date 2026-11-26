# Vegas Studio — Design System & Product Direction

<!-- ryux-context:start -->
- **Audience**: Calon klien yang mencari jadwal pemotretan, melihat galeri contoh studio, dan mengisi formulir booking untuk dikirim ke WhatsApp serta Spreadsheet; serta fotografer/admin yang mengelola jadwal, paket, fotografer, dan rekap `Jadwal_Wisuda`. (Observed: PRD.md & user layout references)
- **Why choose it**: Tampilan editorial gelap yang menonjolkan karya fotografi studio sekaligus terhubung langsung dengan form booking terstruktur yang menulis otomatis ke Google Sheets dengan header operasional yang sama dan mengarahkan konfirmasi ke WhatsApp. (Observed: PRD.md)
- **UI direction**: Dark Charcoal Editorial — hero gelap penuh dengan visual kamera placeholder, blok *My Gallery* 4 foto portrait, bagian *Quote & Sekilas Tentang Kami*, serta panel jadwal & formulir booking dengan tombol aksen olive-gold. (Chosen by user via reference image 1, 2026-11-26)
- **Motion direction**: Halus dan terukur — GSAP untuk animasi teks judul, Motion (`motion/react`) untuk transisi komponen & tab, dan Lenis untuk *smooth scrolling* dengan fallback `prefers-reduced-motion`. (Chosen by user & PRD.md)
- **Voice and tone**: Hangat, lugas, dan autentik ala studio fotografi independen tanpa klise pemasaran atau urgensi palsu. (Inferred from PRD.md & reference image)
- **Design intent**: Menghadirkan identitas editorial fotografi sekaligus memudahkan klien memilih slot jadwal `Kosong`, mengisi seluruh data header spreadsheet (`Tanggal`, `FG`, `Jam`, `Paket`, `Nama Klien`, `Username IG`, `Kampus & Lokasi`, `No. WA & Bayar`), lalu mengirim ke Google Sheets & WhatsApp.
<!-- ryux-context:end -->

## Visual and motion language

```yaml
direction:
  id: dark-charcoal-editorial
  name: Dark Charcoal Editorial
  status: chosen
  philosophy: atmospheric-editorial-plus-task-workbench
  grammar:
    philosophy: expressive-editorial
    grounding: darkroom & camera studio portfolio
    movement: editorial
    type: serif-display (Playfair Display 600) + grotesk-sans (Hanken Grotesk 400/500, tabular-nums)
    colour_behaviour: dark-charcoal-monochrome-plus-olive-gold-cta
    shape: crisp-editorial (radius 4-8px on gallery placeholders & cards, 4px on inputs/buttons)
    layout: full-bleed-hero-gallery-about-plus-booking-workbench
    density: spacious (hero/gallery/about), balanced (booking/admin)
    material: matte-charcoal-surfaces-with-photographic-scrims
    imagery: local placeholder studio photographs in swappable data-slot frames
    motion: calm-measured (GSAP text reveal, Motion UI transitions, Lenis smooth scroll)
  type:
    display: "Playfair Display", Georgia, serif
    body: "Hanken Grotesk", ui-sans-serif, system-ui, sans-serif
    weights: [400, 500, 600]
    figures: tabular-nums
    scale:
      display: clamp(2.5rem, 4.5vw + 0.75rem, 4.25rem)
      section: clamp(1.75rem, 2.2vw + 0.9rem, 2.75rem)
      title: clamp(1.1875rem, 0.7vw + 0.85rem, 1.5rem)
      lead: clamp(1.0625rem, 0.35vw + 0.95rem, 1.25rem)
      body: 1rem
      small: 0.875rem
  colour:
    scheme: dark-charcoal-plus-olive-gold-accent
    neutrals_source: warm-charcoal hue 70 (oklch low chroma 0.008-0.010)
    roles:
      paper: oklch(22% 0.008 70)
      paper_2: oklch(27% 0.009 70)
      paper_3: oklch(32% 0.010 70)
      card: oklch(18% 0.008 70)
      ink: oklch(96% 0.006 80)
      ink_2: oklch(85% 0.008 80)
      muted: oklch(71% 0.010 78)
      rule: oklch(38% 0.010 70)
      field_border: oklch(54% 0.010 75)
      accent: oklch(76% 0.145 92)
      accent_hover: oklch(70% 0.155 92)
      accent_soft: oklch(30% 0.040 92)
      accent_ink: oklch(17% 0.018 85)
      focus: oklch(82% 0.145 92)
      success: oklch(76% 0.125 152)
      success_bg: oklch(25% 0.040 152)
      error: oklch(76% 0.145 26)
      error_bg: oklch(25% 0.045 26)
  shape:
    radius: [4, 8, 999]
  motion:
    personality: calm
    easing: cubic-bezier(0.16, 1, 0.3, 1)
    durations: [120, 220, 420]
    libraries:
      text: gsap
      components: motion
      scroll: lenis
```

## Business Rules

- **Decided (`PRD.md` & User Spreadsheet Screenshot)**:
  - Spreadsheet otomatis memakai 10 kolom operasional `Jadwal_Wisuda`: `No`, `Tanggal`, `FG`, `Jam`, `Paket`, `Nama Klien`, `Username IG`, `Kampus & Lokasi`, `No. WA & Bayar`, `Status`.
  - Nilai default `Status` saat booking baru masuk adalah `Belum`; format tanggal operasional spreadsheet `DD/MM/YYYY`.
  - Gambar hero, galeri (4 kartu), dan latar *Tentang Kami* memakai placeholder lokal di `public/placeholders/` (`data-slot`) siap diganti foto asli studio.
- **Not decided (Open rules)**:
  - Foto asli Vegas Studio (pengganti file placeholder), nomor WhatsApp admin produksi (`VITE_WHATSAPP_ADMIN`), URL Google Apps Script (`VITE_GAS_WEB_APP_URL`), dan PIN Admin (`VITE_ADMIN_PIN`).
