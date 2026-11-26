import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import { useGsapTextReveal } from '../hooks/useGsapTextReveal';
import type {
  BookingFormInput,
  BookingSubmissionPayload,
  BookingSubmissionResult,
  DataMode,
  PackageItem,
  Photographer,
  ScheduleSlot,
} from '../types/studio';
import {
  formatInstagramHandle,
  formatNoWaBayarCell,
  formatRupiah,
  formatTanggalIndonesia,
  formatTanggalSpreadsheet,
} from '../utils/formatters';
import {
  validateBookingInput,
  type BookingFieldName,
  type BookingValidationErrors,
} from '../utils/validation';
import { buildWhatsAppBookingUrl, isMobileUserAgent } from '../utils/whatsapp';
import { SelectDropdown, type SelectDropdownOption } from './SelectDropdown';

interface BookingFormProps {
  mode: DataMode;
  whatsappAdminNumber: string;
  selectedSlot: ScheduleSlot | null;
  packages: PackageItem[];
  photographers: Photographer[];
  selectedPackageId: string;
  isSubmitting: boolean;
  submitError: string | null;
  lastSubmission: BookingSubmissionResult | null;
  onSelectPackageId: (packageId: string) => void;
  onJumpToSchedule: () => void;
  onSubmitBooking: (payload: BookingSubmissionPayload) => Promise<BookingSubmissionResult | null>;
  onResetReceipt: () => void;
}

export function BookingForm({
  mode,
  whatsappAdminNumber,
  selectedSlot,
  packages,
  photographers,
  selectedPackageId,
  isSubmitting,
  submitError,
  lastSubmission,
  onSelectPackageId,
  onJumpToSchedule,
  onSubmitBooking,
  onResetReceipt,
}: BookingFormProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const slotInputRef = useRef<HTMLInputElement>(null);
  const fgSelectRef = useRef<HTMLButtonElement>(null);
  const jamInputRef = useRef<HTMLInputElement>(null);
  const packageSelectRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const igInputRef = useRef<HTMLInputElement>(null);
  const lokasiInputRef = useRef<HTMLInputElement>(null);
  const waKlienInputRef = useRef<HTMLInputElement>(null);
  const bayarDpInputRef = useRef<HTMLInputElement>(null);

  useGsapTextReveal(sectionRef, { triggerOnScroll: true, stagger: 0.05 });

  const activePackages = packages.filter((pkg) => pkg.aktif);
  const activePhotographers = photographers.filter((item) => item.aktif);

  const photographerOptions: SelectDropdownOption[] = activePhotographers.map((person) => ({
    value: person.id,
    label: person.nama_fotografer,
    description: person.spesialisasi || undefined,
  }));

  const packageOptions: SelectDropdownOption[] = activePackages.map((pkg) => ({
    value: pkg.id,
    label: pkg.nama_paket,
    badge: formatRupiah(pkg.harga),
    description: pkg.deskripsi || undefined,
  }));

  const [fgId, setFgId] = useState('');
  const [jam, setJam] = useState('');
  const [namaKlien, setNamaKlien] = useState('');
  const [usernameIg, setUsernameIg] = useState('');
  const [kampusLokasi, setKampusLokasi] = useState('');
  const [noWaKlien, setNoWaKlien] = useState('');
  const [bayarDp, setBayarDp] = useState('');
  const [touched, setTouched] = useState<Partial<Record<BookingFieldName, boolean>>>({});
  const [errors, setErrors] = useState<BookingValidationErrors>({});
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Sinkronkan pilihan FG jika daftar fotografer aktif berubah.
  useEffect(() => {
    if (fgId && !activePhotographers.some((item) => item.id === fgId)) {
      setFgId('');
    }
  }, [activePhotographers, fgId]);

  // Auto-fill jam & hapus error tanggal ketika slot Kosong dipilih.
  useEffect(() => {
    if (selectedSlot) {
      if (selectedSlot.jam.trim()) {
        setJam(selectedSlot.jam.trim());
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next.tanggalIso;
        if (selectedSlot.jam.trim()) {
          delete next.jam;
        }
        return next;
      });
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (selectedPackageId) {
      setErrors((prev) => {
        if (!prev.paketId) {
          return prev;
        }
        const next = { ...prev };
        delete next.paketId;
        return next;
      });
    }
  }, [selectedPackageId]);

  const currentFormInput: BookingFormInput = {
    scheduleId: selectedSlot?.id ?? '',
    tanggalIso: selectedSlot?.tanggal ?? '',
    fgId,
    jam,
    paketId: selectedPackageId,
    nama_klien: namaKlien,
    username_ig: usernameIg,
    kampus_lokasi: kampusLokasi,
    no_wa_klien: noWaKlien,
    bayar_dp: bayarDp,
  };

  const selectedPackage = activePackages.find((pkg) => pkg.id === selectedPackageId) ?? null;
  const selectedPhotographer = activePhotographers.find((item) => item.id === fgId) ?? null;

  const validateSingleField = (field: BookingFieldName, override?: Partial<BookingFormInput>) => {
    const candidate = { ...currentFormInput, ...override };
    const allErrors = validateBookingInput(candidate);
    setErrors((prev) => ({
      ...prev,
      [field]: allErrors[field],
    }));
  };

  const focusFirstInvalidField = (validationErrors: BookingValidationErrors) => {
    if (validationErrors.tanggalIso) {
      slotInputRef.current?.focus();
      return;
    }
    if (validationErrors.fgId) {
      fgSelectRef.current?.focus();
      return;
    }
    if (validationErrors.jam) {
      jamInputRef.current?.focus();
      return;
    }
    if (validationErrors.paketId) {
      packageSelectRef.current?.focus();
      return;
    }
    if (validationErrors.nama_klien) {
      nameInputRef.current?.focus();
      return;
    }
    if (validationErrors.username_ig) {
      igInputRef.current?.focus();
      return;
    }
    if (validationErrors.kampus_lokasi) {
      lokasiInputRef.current?.focus();
      return;
    }
    if (validationErrors.no_wa_klien) {
      waKlienInputRef.current?.focus();
      return;
    }
    if (validationErrors.bayar_dp) {
      bayarDpInputRef.current?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const allErrors = validateBookingInput(currentFormInput);
    setTouched({
      tanggalIso: true,
      fgId: true,
      jam: true,
      paketId: true,
      nama_klien: true,
      username_ig: true,
      kampus_lokasi: true,
      no_wa_klien: true,
      bayar_dp: true,
    });
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      focusFirstInvalidField(allErrors);
      return;
    }

    if (!selectedSlot || !selectedPackage || !selectedPhotographer) {
      return;
    }

    const tanggalSlash = formatTanggalSpreadsheet(selectedSlot.tanggal);
    const formattedIg = formatInstagramHandle(usernameIg);
    const formattedNoWaBayar = formatNoWaBayarCell(noWaKlien, bayarDp);

    const payload: BookingSubmissionPayload = {
      scheduleId: selectedSlot.id,
      tanggal: tanggalSlash,
      fg: selectedPhotographer.nama_fotografer,
      jam: jam.trim(),
      paket: selectedPackage.nama_paket,
      nama_klien: namaKlien.trim(),
      username_ig: formattedIg,
      kampus_lokasi: kampusLokasi.trim(),
      no_wa_bayar: formattedNoWaBayar,
      status: 'Belum',
      harga_paket: selectedPackage.harga,
    };

    const result = await onSubmitBooking(payload);
    if (result) {
      const waResult = buildWhatsAppBookingUrl(whatsappAdminNumber, {
        no: result.record.no,
        tanggal: result.record.tanggal,
        fg: result.record.fg,
        jam: result.record.jam,
        paket: result.record.paket,
        namaKlien: result.record.nama_klien,
        usernameIg: result.record.username_ig,
        kampusLokasi: result.record.kampus_lokasi,
        noWaBayar: result.record.no_wa_bayar,
        status: result.record.status,
        hargaPaket: result.record.harga_paket,
        mode: result.mode,
      });

      const targetWaUrl = isMobileUserAgent()
        ? waResult.url
        : (waResult.webUrl ?? waResult.url);
      if (targetWaUrl) {
        window.open(targetWaUrl, '_blank', 'noopener,noreferrer');
      }

      setFgId('');
      setJam('');
      setNamaKlien('');
      setUsernameIg('');
      setKampusLokasi('');
      setNoWaKlien('');
      setBayarDp('');
      setTouched({});
      setErrors({});
    }
  };

  const tanggalDisplay = selectedSlot
    ? `${formatTanggalSpreadsheet(selectedSlot.tanggal)} (${formatTanggalIndonesia(selectedSlot.tanggal)})`
    : '';
  const combinedNoWaBayarPreview = formatNoWaBayarCell(noWaKlien, bayarDp);
  const normalizedIgPreview = formatInstagramHandle(usernameIg);

  const isMobile = isMobileUserAgent();

  const receiptWhatsApp = lastSubmission
    ? buildWhatsAppBookingUrl(whatsappAdminNumber, {
        no: lastSubmission.record.no,
        tanggal: lastSubmission.record.tanggal,
        fg: lastSubmission.record.fg,
        jam: lastSubmission.record.jam,
        paket: lastSubmission.record.paket,
        namaKlien: lastSubmission.record.nama_klien,
        usernameIg: lastSubmission.record.username_ig,
        kampusLokasi: lastSubmission.record.kampus_lokasi,
        noWaBayar: lastSubmission.record.no_wa_bayar,
        status: lastSubmission.record.status,
        hargaPaket: lastSubmission.record.harga_paket,
        mode: lastSubmission.mode,
      })
    : null;

  const handleCopyMessage = async () => {
    if (!receiptWhatsApp) {
      return;
    }
    try {
      await navigator.clipboard.writeText(receiptWhatsApp.message);
      setCopiedMessage(true);
      window.setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      setCopiedMessage(false);
    }
  };

  return (
    <section
      id="booking-form"
      ref={sectionRef}
      aria-labelledby="heading-booking"
      className="border-b border-rule bg-paper-2 py-10 sm:py-16"
    >
      <div className="container flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-2">
          <h2 id="heading-booking" data-gsap-text className="font-display font-semibold text-ink">
            Formulir booking sesi foto
          </h2>
          <p className="max-w-2xl text-sm text-ink-2 sm:text-base">
            Isi seluruh data berikut. Data dikirim ke WhatsApp admin sekaligus masuk otomatis ke Spreadsheet dengan header kolom Jadwal Wisuda.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {lastSubmission && receiptWhatsApp ? (
            <motion.div
              key="booking-receipt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-card border border-rule bg-card p-4 sm:p-8"
            >
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="flex flex-col gap-4 lg:col-span-7">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-1 h-6 w-6 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                        {lastSubmission.mode === 'live'
                          ? `Booking #${lastSubmission.record.no} tersimpan ke Spreadsheet`
                          : `Booking #${lastSubmission.record.no} tersimpan di Mode Preview Lokal`}
                      </h3>
                      <p className="mt-1 text-sm text-ink-2 sm:text-base">
                        {lastSubmission.mode === 'live'
                          ? 'Baris baru otomatis tercatat pada kolom No, Tanggal, FG, Jam, Paket, Nama Klien, Username IG, Kampus & Lokasi, No. WA & Bayar, Status.'
                          : 'Data contoh disimpan di browser lokal dan belum dikirim ke Google Sheets. Format baris & pesan WhatsApp siap diuji.'}
                      </p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 gap-3 border-y border-rule py-4 sm:grid-cols-2 sm:gap-4 sm:py-5">
                    <div>
                      <dt className="text-sm text-muted">No / Tanggal</dt>
                      <dd className="num mt-0.5 font-medium text-ink">
                        #{lastSubmission.record.no} ({lastSubmission.record.tanggal})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">FG / Jam</dt>
                      <dd className="mt-0.5 font-medium text-ink">
                        {lastSubmission.record.fg} ({lastSubmission.record.jam})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">Paket</dt>
                      <dd className="mt-0.5 font-medium text-ink">
                        {lastSubmission.record.paket}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">Nama Klien</dt>
                      <dd className="mt-0.5 font-medium text-ink">
                        {lastSubmission.record.nama_klien}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">Username IG</dt>
                      <dd className="mt-0.5 font-medium text-ink">
                        {lastSubmission.record.username_ig}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">Kampus &amp; Lokasi</dt>
                      <dd className="mt-0.5 font-medium text-ink">
                        {lastSubmission.record.kampus_lokasi}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">No. WA &amp; Bayar</dt>
                      <dd className="num mt-0.5 font-medium text-ink">
                        {lastSubmission.record.no_wa_bayar}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">Status</dt>
                      <dd className="mt-0.5 font-medium text-ink">
                        {lastSubmission.record.status}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    {receiptWhatsApp.url ? (
                      <a
                        href={
                          isMobile
                            ? receiptWhatsApp.url
                            : (receiptWhatsApp.webUrl ?? receiptWhatsApp.url)
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--primary w-full sm:w-auto"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{isMobile ? 'Lanjut ke WhatsApp' : 'Lanjut ke WhatsApp Web'}</span>
                      </a>
                    ) : (
                      <p className="border-l-4 border-error bg-error-bg px-4 py-2.5 text-sm text-error">
                        Nomor WhatsApp admin belum diisi di konfigurasi. Salin teks di samping atau lengkapi nomor WhatsApp di Panel Admin.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="btn btn--quiet w-full sm:w-auto"
                    >
                      <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{copiedMessage ? 'Pesan tersalin' : 'Salin pesan booking'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onResetReceipt}
                      className="btn btn--quiet w-full sm:w-auto"
                    >
                      <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Buat booking baru</span>
                    </button>
                  </div>

                  {!isMobile && receiptWhatsApp.url && (
                    <p className="text-sm text-muted">
                      Menggunakan aplikasi WhatsApp Desktop?{' '}
                      <a
                        href={receiptWhatsApp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline underline-offset-4 hover:text-accent-hover"
                      >
                        Buka lewat tautan wa.me
                      </a>
                    </p>
                  )}
                </div>

                <div className="min-w-0 border-t border-rule pt-5 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                  <p className="text-sm font-medium text-muted">Pratinjau pesan WhatsApp</p>
                  <pre className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere] font-body text-sm leading-relaxed text-ink">
                    {receiptWhatsApp.message}
                  </pre>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="booking-form-fields"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSubmit}
              noValidate
              className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8"
            >
              <div className="flex flex-col gap-5 rounded-card border border-rule bg-card p-4 sm:p-8 lg:col-span-7">
                {submitError && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 border-l-4 border-error bg-error-bg p-4 text-sm text-error"
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-ink">Booking belum dapat diproses</p>
                      <p className="mt-0.5 text-ink-2">{submitError}</p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                    <label htmlFor="booking-tanggal" className="text-sm font-medium text-ink">
                      Tanggal <span className="text-muted">(Wajib)</span>
                    </label>
                    <button
                      type="button"
                      onClick={onJumpToSchedule}
                      className="text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
                    >
                      {selectedSlot ? 'Ganti slot jadwal' : 'Pilih dari daftar jadwal'}
                    </button>
                  </div>
                  <input
                    ref={slotInputRef}
                    id="booking-tanggal"
                    name="tanggal"
                    type="text"
                    readOnly
                    value={tanggalDisplay}
                    placeholder="Klik salah satu slot Kosong pada daftar jadwal"
                    aria-required="true"
                    aria-invalid={errors.tanggalIso ? 'true' : undefined}
                    aria-describedby="booking-tanggal-help"
                    className="field-control num"
                  />
                  <p
                    id="booking-tanggal-help"
                    className={`field-help ${errors.tanggalIso ? 'text-error' : 'text-muted'}`}
                  >
                    {errors.tanggalIso ??
                      (selectedSlot?.catatan ||
                        'Otomatis terisi format DD/MM/YYYY sesuai kolom Tanggal spreadsheet.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="booking-fg" className="mb-1.5 block text-sm font-medium text-ink">
                      FG (Fotografer) <span className="text-muted">(Wajib)</span>
                    </label>
                    <SelectDropdown
                      triggerRef={fgSelectRef}
                      id="booking-fg"
                      name="fg"
                      value={fgId}
                      options={photographerOptions}
                      placeholder="Pilih FG…"
                      title="Pilih FG (Fotografer)"
                      ariaRequired
                      ariaInvalid={Boolean(errors.fgId)}
                      ariaDescribedBy="booking-fg-help"
                      onChange={(nextValue) => {
                        setFgId(nextValue);
                        setTouched((prev) => ({ ...prev, fgId: true }));
                        validateSingleField('fgId', { fgId: nextValue });
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, fgId: true }));
                        validateSingleField('fgId');
                      }}
                    />
                    <p
                      id="booking-fg-help"
                      className={`field-help ${errors.fgId ? 'text-error' : 'text-muted'}`}
                    >
                      {errors.fgId ?? 'Mengisi kolom FG pada spreadsheet.'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="booking-jam" className="mb-1.5 block text-sm font-medium text-ink">
                      Jam <span className="text-muted">(Wajib)</span>
                    </label>
                    <input
                      ref={jamInputRef}
                      id="booking-jam"
                      name="jam"
                      type="text"
                      value={jam}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setJam(nextValue);
                        if (touched.jam) {
                          validateSingleField('jam', { jam: nextValue });
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, jam: true }));
                        validateSingleField('jam');
                      }}
                      placeholder="Contoh: 3 sore atau 1 Siang"
                      aria-required="true"
                      aria-invalid={errors.jam ? 'true' : undefined}
                      aria-describedby="booking-jam-help"
                      className="field-control num"
                    />
                    <p
                      id="booking-jam-help"
                      className={`field-help ${errors.jam ? 'text-error' : 'text-muted'}`}
                    >
                      {errors.jam ?? 'Terisi otomatis dari slot atau sesuaikan jam sesi.'}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="booking-paket" className="mb-1.5 block text-sm font-medium text-ink">
                    Paket <span className="text-muted">(Wajib)</span>
                  </label>
                  <SelectDropdown
                    triggerRef={packageSelectRef}
                    id="booking-paket"
                    name="paket"
                    value={selectedPackageId}
                    options={packageOptions}
                    placeholder="Pilih paket foto…"
                    title="Pilih Paket Foto"
                    ariaRequired
                    ariaInvalid={Boolean(errors.paketId)}
                    ariaDescribedBy="booking-paket-help"
                    className="num"
                    onChange={(nextValue) => {
                      onSelectPackageId(nextValue);
                      setTouched((prev) => ({ ...prev, paketId: true }));
                      validateSingleField('paketId', { paketId: nextValue });
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, paketId: true }));
                      validateSingleField('paketId');
                    }}
                  />
                  <p
                    id="booking-paket-help"
                    className={`field-help ${errors.paketId ? 'text-error' : 'text-muted'}`}
                  >
                    {errors.paketId ??
                      (selectedPackage
                        ? selectedPackage.deskripsi
                        : 'Pilih paket sesuai katalog aktif.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="booking-nama" className="mb-1.5 block text-sm font-medium text-ink">
                      Nama Klien <span className="text-muted">(Wajib)</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      id="booking-nama"
                      name="nama_klien"
                      type="text"
                      autoComplete="name"
                      value={namaKlien}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setNamaKlien(nextValue);
                        if (touched.nama_klien) {
                          validateSingleField('nama_klien', { nama_klien: nextValue });
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, nama_klien: true }));
                        validateSingleField('nama_klien');
                      }}
                      placeholder="Contoh: Amanda tri Wulandari"
                      aria-required="true"
                      aria-invalid={errors.nama_klien ? 'true' : undefined}
                      aria-describedby="booking-nama-help"
                      className="field-control"
                    />
                    <p
                      id="booking-nama-help"
                      className={`field-help ${errors.nama_klien ? 'text-error' : 'text-muted'}`}
                    >
                      {errors.nama_klien ?? 'Mengisi kolom Nama Klien pada spreadsheet.'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="booking-ig" className="mb-1.5 block text-sm font-medium text-ink">
                      Username IG <span className="text-muted">(Wajib)</span>
                    </label>
                    <input
                      ref={igInputRef}
                      id="booking-ig"
                      name="username_ig"
                      type="text"
                      value={usernameIg}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setUsernameIg(nextValue);
                        if (touched.username_ig) {
                          validateSingleField('username_ig', { username_ig: nextValue });
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, username_ig: true }));
                        validateSingleField('username_ig');
                      }}
                      placeholder="@amtriwuln_"
                      aria-required="true"
                      aria-invalid={errors.username_ig ? 'true' : undefined}
                      aria-describedby="booking-ig-help"
                      className="field-control"
                    />
                    <p
                      id="booking-ig-help"
                      className={`field-help ${errors.username_ig ? 'text-error' : 'text-muted'}`}
                    >
                      {errors.username_ig ?? 'Mengisi kolom Username IG (otomatis diawali @).'}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="booking-lokasi" className="mb-1.5 block text-sm font-medium text-ink">
                    Kampus &amp; Lokasi <span className="text-muted">(Wajib)</span>
                  </label>
                  <input
                    ref={lokasiInputRef}
                    id="booking-lokasi"
                    name="kampus_lokasi"
                    type="text"
                    value={kampusLokasi}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setKampusLokasi(nextValue);
                      if (touched.kampus_lokasi) {
                        validateSingleField('kampus_lokasi', { kampus_lokasi: nextValue });
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, kampus_lokasi: true }));
                      validateSingleField('kampus_lokasi');
                    }}
                    placeholder="Contoh: UIN Tulungagung atau Tropical house"
                    aria-required="true"
                    aria-invalid={errors.kampus_lokasi ? 'true' : undefined}
                    aria-describedby="booking-lokasi-help"
                    className="field-control"
                  />
                  <p
                    id="booking-lokasi-help"
                    className={`field-help ${errors.kampus_lokasi ? 'text-error' : 'text-muted'}`}
                  >
                    {errors.kampus_lokasi ?? 'Mengisi kolom Kampus & Lokasi pada spreadsheet.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="booking-wa-klien" className="mb-1.5 block text-sm font-medium text-ink">
                      No. WA Klien <span className="text-muted">(Wajib)</span>
                    </label>
                    <input
                      ref={waKlienInputRef}
                      id="booking-wa-klien"
                      name="no_wa_klien"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={noWaKlien}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setNoWaKlien(nextValue);
                        if (touched.no_wa_klien) {
                          validateSingleField('no_wa_klien', { no_wa_klien: nextValue });
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, no_wa_klien: true }));
                        validateSingleField('no_wa_klien');
                      }}
                      placeholder="0812-5554-5565"
                      aria-required="true"
                      aria-invalid={errors.no_wa_klien ? 'true' : undefined}
                      aria-describedby="booking-wa-klien-help"
                      className="field-control num"
                    />
                    <p
                      id="booking-wa-klien-help"
                      className={`field-help ${errors.no_wa_klien ? 'text-error' : 'text-muted'}`}
                    >
                      {errors.no_wa_klien ?? 'Nomor WhatsApp aktif Anda untuk dihubungi FG.'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="booking-dp" className="mb-1.5 block text-sm font-medium text-ink">
                      DP / Bayar <span className="text-muted">(Wajib)</span>
                    </label>
                    <input
                      ref={bayarDpInputRef}
                      id="booking-dp"
                      name="bayar_dp"
                      type="text"
                      value={bayarDp}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setBayarDp(nextValue);
                        if (touched.bayar_dp) {
                          validateSingleField('bayar_dp', { bayar_dp: nextValue });
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, bayar_dp: true }));
                        validateSingleField('bayar_dp');
                      }}
                      placeholder="dp 50% atau 250000"
                      aria-required="true"
                      aria-invalid={errors.bayar_dp ? 'true' : undefined}
                      aria-describedby="booking-dp-help"
                      className="field-control num"
                    />
                    <p
                      id="booking-dp-help"
                      className={`field-help num ${errors.bayar_dp ? 'text-error' : 'text-muted'}`}
                    >
                      {errors.bayar_dp ??
                        (combinedNoWaBayarPreview
                          ? `Format kolom No. WA & Bayar: ${combinedNoWaBayarPreview}`
                          : 'Bisa diisi nominal rupiah (250000) atau persentase (dp 50%).')}
                    </p>
                  </div>
                </div>
              </div>

              <aside
                aria-label="Pratinjau baris spreadsheet"
                className="flex flex-col justify-between rounded-card border border-rule bg-card p-4 sm:p-8 lg:col-span-5"
              >
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">
                    Ringkasan ke Spreadsheet &amp; WA
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Kolom berikut akan otomatis terisi saat Anda mengirim booking.
                  </p>

                  <dl className="mt-5 flex flex-col gap-3 border-y border-rule py-5 text-sm">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-muted">Tanggal</dt>
                      <dd className="num min-w-0 break-words text-right font-medium text-ink">
                        {selectedSlot ? formatTanggalSpreadsheet(selectedSlot.tanggal) : 'Belum dipilih'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-muted">FG</dt>
                      <dd className="min-w-0 break-words text-right font-medium text-ink">
                        {selectedPhotographer?.nama_fotografer || 'Belum dipilih'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-muted">Jam</dt>
                      <dd className="num min-w-0 break-words text-right font-medium text-ink">
                        {jam.trim() || 'Belum diisi'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-muted">Paket</dt>
                      <dd className="min-w-0 break-words text-right font-medium text-ink">
                        {selectedPackage
                          ? `${selectedPackage.nama_paket} (${formatRupiah(selectedPackage.harga)})`
                          : 'Belum dipilih'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-muted">Nama Klien</dt>
                      <dd className="min-w-0 break-words text-right font-medium text-ink">
                        {namaKlien.trim() || 'Belum diisi'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-muted">Username IG</dt>
                      <dd className="min-w-0 break-words text-right font-medium text-ink">
                        {normalizedIgPreview || 'Belum diisi'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-muted">Kampus &amp; Lokasi</dt>
                      <dd className="min-w-0 break-words text-right font-medium text-ink">
                        {kampusLokasi.trim() || 'Belum diisi'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-muted">No. WA &amp; Bayar</dt>
                      <dd className="num min-w-0 break-words text-right font-medium text-ink">
                        {combinedNoWaBayarPreview || 'Belum diisi'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 border-t border-rule pt-3">
                      <dt className="shrink-0 text-muted">Status awal</dt>
                      <dd className="text-right font-medium text-error">Belum</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="btn btn--primary w-full"
                  >
                    {isSubmitting ? 'Menyimpan booking…' : 'Simpan & Konfirmasi via WhatsApp'}
                  </button>

                  <p className="text-xs leading-relaxed text-muted">
                    {mode === 'live'
                      ? 'Booking otomatis tercatat ke Spreadsheet Jadwal_Wisuda dan langsung membuka WhatsApp admin.'
                      : 'Saat ini berada di Mode Preview Lokal: data disimpan sementara di browser Anda sebelum URL Apps Script dipasang.'}
                  </p>
                </div>
              </aside>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
