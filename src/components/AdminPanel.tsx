import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Edit3,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type {
  BookingRecord,
  DataMode,
  PackageInput,
  PackageItem,
  Photographer,
  PhotographerInput,
  ScheduleSlot,
  ScheduleSlotInput,
  SlotStatus,
  StudioSettings,
} from '../types/studio';
import {
  formatJamSlot,
  formatRupiah,
  formatTanggalIndonesia,
  formatThousandsInput,
  parseRupiahInput,
} from '../utils/formatters';
import { normalizeWhatsAppNumber } from '../utils/whatsapp';
import {
  validatePackageInput,
  validatePhotographerInput,
  validateScheduleSlotInput,
} from '../utils/validation';
import { SelectDropdown, type SelectDropdownOption } from './SelectDropdown';

type AdminTabId = 'paket' | 'fotografer' | 'jadwal' | 'koneksi';

const BOOKING_STATUS_OPTIONS: SelectDropdownOption[] = [
  { value: 'Belum', label: 'Belum', dotColorClass: 'bg-error' },
  { value: 'DP Masuk', label: 'DP Masuk', dotColorClass: 'bg-accent' },
  { value: 'Lunas', label: 'Lunas', dotColorClass: 'bg-success' },
  { value: 'Selesai', label: 'Selesai', dotColorClass: 'bg-ink-2' },
];

function getBookingStatusOptions(currentStatus: string): SelectDropdownOption[] {
  if (!currentStatus || BOOKING_STATUS_OPTIONS.some((opt) => opt.value === currentStatus)) {
    return BOOKING_STATUS_OPTIONS;
  }
  return [
    ...BOOKING_STATUS_OPTIONS,
    { value: currentStatus, label: currentStatus, dotColorClass: 'bg-muted' },
  ];
}

interface AdminPanelProps {
  mode: DataMode;
  settings: StudioSettings;
  packages: PackageItem[];
  photographers: Photographer[];
  slots: ScheduleSlot[];
  rekap: BookingRecord[];
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onExitAdmin: () => void;
  onLockAdmin: () => void;
  onCreatePackage: (input: PackageInput) => Promise<void>;
  onUpdatePackage: (id: string, input: PackageInput) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
  onCreatePhotographer: (input: PhotographerInput) => Promise<void>;
  onUpdatePhotographer: (id: string, input: PhotographerInput) => Promise<void>;
  onDeletePhotographer: (id: string) => Promise<void>;
  onCreateScheduleSlot: (input: ScheduleSlotInput) => Promise<void>;
  onUpdateScheduleStatus: (id: string, status: SlotStatus) => Promise<void>;
  onDeleteScheduleSlot: (id: string) => Promise<void>;
  onUpdateBookingStatus: (no: number, status: string) => Promise<void>;
  onSaveSettings: (next: StudioSettings) => Promise<void>;
  onResetSettings: () => Promise<void>;
  onResetPreviewData: () => void;
}

const ADMIN_TABS: { id: AdminTabId; label: string }[] = [
  { id: 'paket', label: 'Paket' },
  { id: 'fotografer', label: 'Fotografer' },
  { id: 'jadwal', label: 'Jadwal & Rekap' },
  { id: 'koneksi', label: 'Koneksi & Setup' },
];

export function AdminPanel({
  mode,
  settings,
  packages,
  photographers,
  slots,
  rekap,
  isRefreshing,
  onRefresh,
  onExitAdmin,
  onLockAdmin,
  onCreatePackage,
  onUpdatePackage,
  onDeletePackage,
  onCreatePhotographer,
  onUpdatePhotographer,
  onDeletePhotographer,
  onCreateScheduleSlot,
  onUpdateScheduleStatus,
  onDeleteScheduleSlot,
  onUpdateBookingStatus,
  onSaveSettings,
  onResetSettings,
  onResetPreviewData,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>('paket');
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // State CRUD Paket
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgPriceRaw, setPkgPriceRaw] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgActive, setPkgActive] = useState(true);
  const [pkgErrors, setPkgErrors] = useState<
    Partial<Record<'nama_paket' | 'harga' | 'deskripsi', string>>
  >({});
  const [confirmDeletePkgId, setConfirmDeletePkgId] = useState<string | null>(null);

  // State CRUD Fotografer
  const [editingPhotographerId, setEditingPhotographerId] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [photoSpec, setPhotoSpec] = useState('');
  const [photoActive, setPhotoActive] = useState(true);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);

  // State Jadwal
  const [slotTanggal, setSlotTanggal] = useState('');
  const [slotJam, setSlotJam] = useState('');
  const [slotCatatan, setSlotCatatan] = useState('');
  const [slotError, setSlotError] = useState<string | null>(null);
  const [confirmDeleteSlotId, setConfirmDeleteSlotId] = useState<string | null>(null);

  // State Koneksi
  const [gasUrlInput, setGasUrlInput] = useState(settings.gasUrl);
  const [waNumberInput, setWaNumberInput] = useState(settings.whatsappNumber);
  const [pinInput, setPinInput] = useState(settings.adminPin);

  useEffect(() => {
    setGasUrlInput(settings.gasUrl);
    setWaNumberInput(settings.whatsappNumber);
    setPinInput(settings.adminPin);
  }, [settings]);

  const showFeedback = (message: string) => {
    setActionError(null);
    setStatusFeedback(message);
    window.setTimeout(() => {
      setStatusFeedback((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    event.preventDefault();
    const nextIndex =
      event.key === 'ArrowRight'
        ? (currentIndex + 1) % ADMIN_TABS.length
        : (currentIndex - 1 + ADMIN_TABS.length) % ADMIN_TABS.length;
    const targetTab = ADMIN_TABS[nextIndex];
    if (targetTab) {
      setActiveTab(targetTab.id);
      document.getElementById(`admin-tab-${targetTab.id}`)?.focus();
    }
  };

  const resetPackageForm = () => {
    setEditingPackageId(null);
    setPkgName('');
    setPkgPriceRaw('');
    setPkgDesc('');
    setPkgActive(true);
    setPkgErrors({});
  };

  const handlePackageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: PackageInput = {
      nama_paket: pkgName,
      harga: parseRupiahInput(pkgPriceRaw),
      deskripsi: pkgDesc,
      aktif: pkgActive,
    };
    const validation = validatePackageInput(input);
    setPkgErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    setBusyKey('package-form');
    setActionError(null);
    try {
      if (editingPackageId) {
        await onUpdatePackage(editingPackageId, input);
        showFeedback(`Paket "${input.nama_paket.trim()}" diperbarui.`);
      } else {
        await onCreatePackage(input);
        showFeedback(`Paket "${input.nama_paket.trim()}" ditambahkan.`);
      }
      resetPackageForm();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Gagal menyimpan data paket.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeletePackageConfirmed = async (pkg: PackageItem) => {
    setBusyKey(`del-pkg-${pkg.id}`);
    setActionError(null);
    try {
      await onDeletePackage(pkg.id);
      setConfirmDeletePkgId(null);
      if (editingPackageId === pkg.id) {
        resetPackageForm();
      }
      showFeedback(`Paket "${pkg.nama_paket}" dihapus.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Gagal menghapus paket.');
    } finally {
      setBusyKey(null);
    }
  };

  const resetPhotographerForm = () => {
    setEditingPhotographerId(null);
    setPhotoName('');
    setPhotoSpec('');
    setPhotoActive(true);
    setPhotoError(null);
  };

  const handlePhotographerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: PhotographerInput = {
      nama_fotografer: photoName,
      spesialisasi: photoSpec,
      aktif: photoActive,
    };
    const validation = validatePhotographerInput(input);
    if (validation.nama_fotografer) {
      setPhotoError(validation.nama_fotografer);
      return;
    }
    setPhotoError(null);
    setBusyKey('photographer-form');
    setActionError(null);
    try {
      if (editingPhotographerId) {
        await onUpdatePhotographer(editingPhotographerId, input);
        showFeedback(`Data fotografer "${input.nama_fotografer.trim()}" diperbarui.`);
      } else {
        await onCreatePhotographer(input);
        showFeedback(`Fotografer "${input.nama_fotografer.trim()}" ditambahkan.`);
      }
      resetPhotographerForm();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Gagal menyimpan data fotografer.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeletePhotographerConfirmed = async (person: Photographer) => {
    setBusyKey(`del-photo-${person.id}`);
    setActionError(null);
    try {
      await onDeletePhotographer(person.id);
      setConfirmDeletePhotoId(null);
      if (editingPhotographerId === person.id) {
        resetPhotographerForm();
      }
      showFeedback(`Fotografer "${person.nama_fotografer}" dihapus.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Gagal menghapus fotografer.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateSlotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: ScheduleSlotInput = {
      tanggal: slotTanggal,
      jam: slotJam,
      catatan: slotCatatan,
      status: 'Kosong',
    };
    const validation = validateScheduleSlotInput(input);
    if (validation.tanggal) {
      setSlotError(validation.tanggal);
      return;
    }
    setSlotError(null);
    setBusyKey('slot-form');
    setActionError(null);
    try {
      await onCreateScheduleSlot(input);
      setSlotTanggal('');
      setSlotJam('');
      setSlotCatatan('');
      showFeedback('Slot jadwal baru ditambahkan.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Gagal menambah slot jadwal.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveSettingsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUrl = gasUrlInput.trim();
    const trimmedWa = waNumberInput.trim();

    if (trimmedUrl) {
      if (trimmedUrl.includes('docs.google.com/spreadsheets')) {
        setActionError(
          'URL yang Anda masukkan adalah tautan file Google Sheets, bukan URL Web App Google Apps Script (/exec). Buka Extensions > Apps Script lalu Deploy sebagai Web App.',
        );
        return;
      }
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        setActionError('URL Google Apps Script harus diawali https://.');
        return;
      }
    }

    if (trimmedWa && normalizeWhatsAppNumber(trimmedWa).length < 8) {
      setActionError('Nomor WhatsApp admin minimal 8 digit (contoh: 081234567890 atau 6281234567890).');
      return;
    }

    setBusyKey('settings-form');
    setActionError(null);
    try {
      await onSaveSettings({
        gasUrl: trimmedUrl,
        whatsappNumber: trimmedWa,
        adminPin: pinInput.trim() || '2468',
      });
      showFeedback(
        trimmedUrl
          ? 'Terhubung ke Google Apps Script dan konfigurasi WhatsApp tersimpan.'
          : 'Pengaturan WhatsApp & PIN tersimpan (berjalan di Mode Preview Lokal).',
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Gagal menghubungkan ke URL Google Apps Script.',
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleChangeBookingStatus = async (rowNo: number, nextStatus: string) => {
    setBusyKey(`booking-status-${rowNo}`);
    setActionError(null);
    try {
      await onUpdateBookingStatus(rowNo, nextStatus);
      showFeedback(`Status booking #${rowNo} diubah ke ${nextStatus}.`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Gagal mengubah status booking.',
      );
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section aria-labelledby="admin-panel-title" className="bg-paper py-8 sm:py-12">
      <div className="container flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-rule pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 id="admin-panel-title" className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Panel Admin Vegas Studio
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              {mode === 'live'
                ? 'Perubahan Paket, Fotografer, Jadwal, dan Status langsung tersimpan ke Google Sheets.'
                : 'Berjalan di Mode Preview Lokal (disimpan di browser). Hubungkan URL Apps Script di tab Koneksi & Setup.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:shrink-0 sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isRefreshing}
              className="btn btn--quiet min-h-10 w-full px-3 text-sm sm:w-auto sm:px-4"
            >
              <RefreshCw
                className={`h-4 w-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Sinkronkan</span>
            </button>
            <button
              type="button"
              onClick={onLockAdmin}
              className="btn btn--quiet min-h-10 w-full px-3 text-sm sm:w-auto sm:px-4"
            >
              <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Kunci Admin</span>
            </button>
            <button
              type="button"
              onClick={onExitAdmin}
              className="btn btn--quiet col-span-2 min-h-10 w-full px-4 text-sm sm:col-span-1 sm:w-auto"
            >
              Lihat Halaman Booking
            </button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Bagian pengelolaan admin"
          className="flex flex-nowrap gap-1 overflow-x-auto whitespace-nowrap border-b border-rule pb-px"
        >
          {ADMIN_TABS.map((tab, index) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`admin-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActionError(null);
                }}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`relative min-h-11 shrink-0 px-3.5 text-sm font-medium transition-colors duration-[var(--dur-short)] sm:px-4 ${
                  selected ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                {selected && (
                  <motion.span
                    layoutId="admin-tab-indicator"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                  />
                )}
              </button>
            );
          })}
        </div>

        {actionError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 border-l-4 border-error bg-error-bg p-4 text-sm text-error"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        )}

        {statusFeedback && (
          <div
            role="status"
            className="flex items-center gap-2.5 border-l-4 border-success bg-success-bg p-4 text-sm text-success"
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{statusFeedback}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'paket' && (
            <motion.div
              key="tab-paket"
              id="admin-panel-paket"
              role="tabpanel"
              aria-labelledby="admin-tab-paket"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-12"
            >
              <form
                onSubmit={handlePackageSubmit}
                noValidate
                className="flex flex-col gap-4 rounded-card border border-rule bg-card p-4 sm:p-6 lg:col-span-5"
              >
                <h2 className="font-display text-xl font-semibold text-ink">
                  {editingPackageId ? 'Edit paket' : 'Tambah paket baru'}
                </h2>

                <div>
                  <label htmlFor="admin-pkg-name" className="mb-1.5 block text-sm font-medium text-ink">
                    Nama paket
                  </label>
                  <input
                    id="admin-pkg-name"
                    type="text"
                    value={pkgName}
                    onChange={(event) => setPkgName(event.target.value)}
                    placeholder="Contoh: Basic Foto"
                    aria-invalid={pkgErrors.nama_paket ? 'true' : undefined}
                    className="field-control"
                  />
                  <p className="field-help text-error">{pkgErrors.nama_paket ?? ''}</p>
                </div>

                <div>
                  <label htmlFor="admin-pkg-price" className="mb-1.5 block text-sm font-medium text-ink">
                    Harga (Rp)
                  </label>
                  <input
                    id="admin-pkg-price"
                    type="text"
                    inputMode="numeric"
                    value={pkgPriceRaw}
                    onChange={(event) => setPkgPriceRaw(formatThousandsInput(event.target.value))}
                    placeholder="350.000"
                    aria-invalid={pkgErrors.harga ? 'true' : undefined}
                    className="field-control num"
                  />
                  <p className="field-help text-error">{pkgErrors.harga ?? ''}</p>
                </div>

                <div>
                  <label htmlFor="admin-pkg-desc" className="mb-1.5 block text-sm font-medium text-ink">
                    Durasi / keterangan
                  </label>
                  <textarea
                    id="admin-pkg-desc"
                    value={pkgDesc}
                    onChange={(event) => setPkgDesc(event.target.value)}
                    placeholder="Durasi sesi, jumlah file edit, dan catatan paket."
                    aria-invalid={pkgErrors.deskripsi ? 'true' : undefined}
                    className="field-control"
                  />
                  <p className="field-help text-error">{pkgErrors.deskripsi ?? ''}</p>
                </div>

                <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={pkgActive}
                    onChange={(event) => setPkgActive(event.target.checked)}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  <span>Tampilkan paket ini pada form booking klien</span>
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={busyKey === 'package-form'}
                    className="btn btn--primary min-h-10 px-5 text-sm"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {busyKey === 'package-form'
                        ? 'Menyimpan…'
                        : editingPackageId
                          ? 'Simpan perubahan'
                          : 'Tambah paket'}
                    </span>
                  </button>

                  {editingPackageId && (
                    <button
                      type="button"
                      onClick={resetPackageForm}
                      className="btn btn--quiet min-h-10 px-4 text-sm"
                    >
                      Batal edit
                    </button>
                  )}
                </div>
              </form>

              <div className="flex flex-col gap-4 lg:col-span-7">
                <h2 className="font-display text-xl font-semibold text-ink">
                  Daftar paket ({packages.length})
                </h2>

                {packages.length === 0 ? (
                  <div className="rounded-card border border-rule bg-card p-6 text-sm text-ink-2">
                    Belum ada paket terdaftar.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-rule rounded-card border border-rule bg-card">
                    {packages.map((pkg) => {
                      const confirmingDelete = confirmDeletePkgId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-lg font-semibold text-ink">
                                {pkg.nama_paket}
                              </h3>
                              <span
                                className={`rounded-pill border px-2 py-0.5 text-xs font-medium ${
                                  pkg.aktif
                                    ? 'border-success/40 bg-success-bg text-success'
                                    : 'border-rule bg-paper-2 text-muted'
                                }`}
                              >
                                {pkg.aktif ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                            <p className="num mt-1 font-medium text-ink">{formatRupiah(pkg.harga)}</p>
                            <p className="mt-1 text-sm text-ink-2">{pkg.deskripsi}</p>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {confirmingDelete ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busyKey === `del-pkg-${pkg.id}`}
                                  onClick={() => void handleDeletePackageConfirmed(pkg)}
                                  className="btn btn--danger min-h-9 px-3 text-xs"
                                >
                                  Hapus {pkg.nama_paket}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeletePkgId(null)}
                                  className="btn btn--quiet min-h-9 px-3 text-xs"
                                >
                                  Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPackageId(pkg.id);
                                    setPkgName(pkg.nama_paket);
                                    setPkgPriceRaw(formatThousandsInput(String(pkg.harga)));
                                    setPkgDesc(pkg.deskripsi);
                                    setPkgActive(pkg.aktif);
                                    setPkgErrors({});
                                  }}
                                  className="btn btn--quiet min-h-9 px-3 text-xs"
                                >
                                  <Edit3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeletePkgId(pkg.id)}
                                  className="btn btn--danger min-h-9 px-3 text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                  <span>Hapus</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'fotografer' && (
            <motion.div
              key="tab-fotografer"
              id="admin-panel-fotografer"
              role="tabpanel"
              aria-labelledby="admin-tab-fotografer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-12"
            >
              <form
                onSubmit={handlePhotographerSubmit}
                noValidate
                className="flex flex-col gap-4 rounded-card border border-rule bg-card p-4 sm:p-6 lg:col-span-5"
              >
                <h2 className="font-display text-xl font-semibold text-ink">
                  {editingPhotographerId ? 'Edit fotografer' : 'Tambah fotografer baru'}
                </h2>

                <div>
                  <label htmlFor="admin-photo-name" className="mb-1.5 block text-sm font-medium text-ink">
                    Nama fotografer (FG)
                  </label>
                  <input
                    id="admin-photo-name"
                    type="text"
                    value={photoName}
                    onChange={(event) => setPhotoName(event.target.value)}
                    placeholder="Contoh: Vegas"
                    aria-invalid={photoError ? 'true' : undefined}
                    className="field-control"
                  />
                  <p className="field-help text-error">{photoError ?? ''}</p>
                </div>

                <div>
                  <label htmlFor="admin-photo-spec" className="mb-1.5 block text-sm font-medium text-ink">
                    Spesialisasi (opsional)
                  </label>
                  <input
                    id="admin-photo-spec"
                    type="text"
                    value={photoSpec}
                    onChange={(event) => setPhotoSpec(event.target.value)}
                    placeholder="Contoh: Wisuda & Portrait"
                    className="field-control"
                  />
                </div>

                <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={photoActive}
                    onChange={(event) => setPhotoActive(event.target.checked)}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  <span>Tampilkan fotografer ini di pilihan booking</span>
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={busyKey === 'photographer-form'}
                    className="btn btn--primary min-h-10 px-5 text-sm"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {busyKey === 'photographer-form'
                        ? 'Menyimpan…'
                        : editingPhotographerId
                          ? 'Simpan perubahan'
                          : 'Tambah fotografer'}
                    </span>
                  </button>

                  {editingPhotographerId && (
                    <button
                      type="button"
                      onClick={resetPhotographerForm}
                      className="btn btn--quiet min-h-10 px-4 text-sm"
                    >
                      Batal edit
                    </button>
                  )}
                </div>
              </form>

              <div className="flex flex-col gap-4 lg:col-span-7">
                <h2 className="font-display text-xl font-semibold text-ink">
                  Daftar fotografer ({photographers.length})
                </h2>

                {photographers.length === 0 ? (
                  <div className="rounded-card border border-rule bg-card p-6 text-sm text-ink-2">
                    Belum ada fotografer terdaftar.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-rule rounded-card border border-rule bg-card">
                    {photographers.map((person) => {
                      const confirmingDelete = confirmDeletePhotoId === person.id;
                      return (
                        <div
                          key={person.id}
                          className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-lg font-semibold text-ink">
                                {person.nama_fotografer}
                              </h3>
                              <span
                                className={`rounded-pill border px-2 py-0.5 text-xs font-medium ${
                                  person.aktif
                                    ? 'border-success/40 bg-success-bg text-success'
                                    : 'border-rule bg-paper-2 text-muted'
                                }`}
                              >
                                {person.aktif ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-ink-2">
                              {person.spesialisasi || 'Tanpa spesialisasi khusus'}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {confirmingDelete ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busyKey === `del-photo-${person.id}`}
                                  onClick={() => void handleDeletePhotographerConfirmed(person)}
                                  className="btn btn--danger min-h-9 px-3 text-xs"
                                >
                                  Hapus {person.nama_fotografer}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeletePhotoId(null)}
                                  className="btn btn--quiet min-h-9 px-3 text-xs"
                                >
                                  Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPhotographerId(person.id);
                                    setPhotoName(person.nama_fotografer);
                                    setPhotoSpec(person.spesialisasi);
                                    setPhotoActive(person.aktif);
                                    setPhotoError(null);
                                  }}
                                  className="btn btn--quiet min-h-9 px-3 text-xs"
                                >
                                  <Edit3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeletePhotoId(person.id)}
                                  className="btn btn--danger min-h-9 px-3 text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                  <span>Hapus</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'jadwal' && (
            <motion.div
              key="tab-jadwal"
              id="admin-panel-jadwal"
              role="tabpanel"
              aria-labelledby="admin-tab-jadwal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-10"
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <form
                  onSubmit={handleCreateSlotSubmit}
                  noValidate
                  className="flex flex-col gap-4 rounded-card border border-rule bg-card p-4 sm:p-6 lg:col-span-4"
                >
                  <h2 className="font-display text-xl font-semibold text-ink">
                    Tambah slot jadwal
                  </h2>

                  <div>
                    <label htmlFor="admin-slot-date" className="mb-1.5 block text-sm font-medium text-ink">
                      Tanggal
                    </label>
                    <input
                      id="admin-slot-date"
                      type="date"
                      value={slotTanggal}
                      onChange={(event) => setSlotTanggal(event.target.value)}
                      aria-invalid={slotError ? 'true' : undefined}
                      className="field-control num"
                    />
                    <p className="field-help text-error">{slotError ?? ''}</p>
                  </div>

                  <div>
                    <label htmlFor="admin-slot-time" className="mb-1.5 block text-sm font-medium text-ink">
                      Jam sesi (opsional)
                    </label>
                    <input
                      id="admin-slot-time"
                      type="text"
                      value={slotJam}
                      onChange={(event) => setSlotJam(event.target.value)}
                      placeholder="Contoh: 3 sore atau 1 Siang"
                      className="field-control num"
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-slot-note" className="mb-1.5 block text-sm font-medium text-ink">
                      Catatan (opsional)
                    </label>
                    <input
                      id="admin-slot-note"
                      type="text"
                      value={slotCatatan}
                      onChange={(event) => setSlotCatatan(event.target.value)}
                      placeholder="Contoh: Sesi wisuda sore"
                      className="field-control"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busyKey === 'slot-form'}
                    className="btn btn--primary min-h-10 text-sm"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{busyKey === 'slot-form' ? 'Menyimpan…' : 'Tambah slot Kosong'}</span>
                  </button>
                </form>

                <div className="flex flex-col gap-4 lg:col-span-8">
                  <h2 className="font-display text-xl font-semibold text-ink">
                    Manajemen slot jadwal ({slots.length})
                  </h2>

                  {slots.length === 0 ? (
                    <div className="rounded-card border border-rule bg-card p-6 text-sm text-ink-2">
                      Belum ada slot jadwal di tab Jadwal.
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-rule rounded-card border border-rule bg-card">
                      {slots.map((slot) => {
                        const nextStatus: SlotStatus = slot.status === 'Kosong' ? 'Booked' : 'Kosong';
                        const confirmingDelete = confirmDeleteSlotId === slot.id;
                        return (
                          <div
                            key={slot.id}
                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="num font-medium text-ink">
                                  {formatTanggalIndonesia(slot.tanggal)} ({formatJamSlot(slot.jam)})
                                </span>
                                <span
                                  className={`rounded-pill border px-2 py-0.5 text-xs font-medium ${
                                    slot.status === 'Kosong'
                                      ? 'border-success/40 bg-success-bg text-success'
                                      : 'border-rule bg-paper-2 text-muted'
                                  }`}
                                >
                                  {slot.status}
                                </span>
                              </div>
                              {slot.catatan && (
                                <p className="mt-0.5 text-sm text-ink-2">{slot.catatan}</p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={busyKey === `toggle-slot-${slot.id}`}
                                onClick={async () => {
                                  setBusyKey(`toggle-slot-${slot.id}`);
                                  setActionError(null);
                                  try {
                                    await onUpdateScheduleStatus(slot.id, nextStatus);
                                    showFeedback(`Status jadwal diubah menjadi ${nextStatus}.`);
                                  } catch (error) {
                                    setActionError(
                                      error instanceof Error
                                        ? error.message
                                        : 'Gagal mengubah status jadwal.',
                                    );
                                  } finally {
                                    setBusyKey(null);
                                  }
                                }}
                                className="btn btn--quiet min-h-9 px-3 text-xs"
                              >
                                Tandai {nextStatus}
                              </button>

                              {confirmingDelete ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={busyKey === `del-slot-${slot.id}`}
                                    onClick={async () => {
                                      setBusyKey(`del-slot-${slot.id}`);
                                      setActionError(null);
                                      try {
                                        await onDeleteScheduleSlot(slot.id);
                                        setConfirmDeleteSlotId(null);
                                        showFeedback('Slot jadwal dihapus.');
                                      } catch (error) {
                                        setActionError(
                                          error instanceof Error
                                            ? error.message
                                            : 'Gagal menghapus slot.',
                                        );
                                      } finally {
                                        setBusyKey(null);
                                      }
                                    }}
                                    className="btn btn--danger min-h-9 px-3 text-xs"
                                  >
                                    Konfirmasi hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteSlotId(null)}
                                    className="btn btn--quiet min-h-9 px-3 text-xs"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSlotId(slot.id)}
                                  className="btn btn--danger min-h-9 px-3 text-xs"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="font-display text-xl font-semibold text-ink">
                  Rekap Jadwal Wisuda ({rekap.length})
                </h2>

                {rekap.length === 0 ? (
                  <div className="rounded-card border border-rule bg-card p-6 text-sm text-ink-2">
                    Belum ada catatan pemesanan di sheet Jadwal_Wisuda.
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto rounded-card border border-rule bg-card lg:block">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-rule bg-paper-2 text-ink">
                            <th className="px-3 py-3 font-medium">No</th>
                            <th className="px-3 py-3 font-medium">Tanggal</th>
                            <th className="px-3 py-3 font-medium">FG</th>
                            <th className="px-3 py-3 font-medium">Jam</th>
                            <th className="px-3 py-3 font-medium">Paket</th>
                            <th className="px-3 py-3 font-medium">Nama Klien</th>
                            <th className="px-3 py-3 font-medium">Username IG</th>
                            <th className="px-3 py-3 font-medium">Kampus &amp; Lokasi</th>
                            <th className="px-3 py-3 font-medium">No. WA &amp; Bayar</th>
                            <th className="px-3 py-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rule">
                          {rekap.map((row) => (
                            <tr key={`${row.no}-${row.nama_klien}`}>
                              <td className="num px-3 py-3 font-medium text-ink">{row.no}</td>
                              <td className="num px-3 py-3 text-ink-2">{row.tanggal}</td>
                              <td className="px-3 py-3 text-ink">{row.fg}</td>
                              <td className="num px-3 py-3 text-ink-2">{row.jam}</td>
                              <td className="px-3 py-3 text-ink-2">{row.paket}</td>
                              <td className="px-3 py-3 font-medium text-ink">{row.nama_klien}</td>
                              <td className="px-3 py-3 text-ink-2">{row.username_ig}</td>
                              <td className="px-3 py-3 text-ink-2">{row.kampus_lokasi}</td>
                              <td className="num px-3 py-3 text-ink-2">{row.no_wa_bayar}</td>
                              <td className="px-3 py-3">
                                <SelectDropdown
                                  size="compact"
                                  title={`Ubah Status Booking #${row.no}`}
                                  ariaLabel={`Ubah status booking nomor ${row.no}`}
                                  value={row.status}
                                  options={getBookingStatusOptions(row.status)}
                                  disabled={busyKey === `booking-status-${row.no}`}
                                  className="min-w-32"
                                  onChange={(nextStatus) => {
                                    void handleChangeBookingStatus(row.no, nextStatus);
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-3 lg:hidden">
                      {rekap.map((row) => (
                        <div
                          key={`${row.no}-${row.nama_klien}`}
                          className="rounded-card border border-rule bg-card p-4 text-sm"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="font-display text-base font-semibold text-ink">
                              #{row.no} {row.nama_klien}
                            </p>
                            <span className="num text-xs text-muted">{row.tanggal}</span>
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-rule pt-3 text-xs">
                            <div className="min-w-0">
                              <dt className="text-muted">FG / Jam</dt>
                              <dd className="mt-0.5 [overflow-wrap:anywhere] font-medium text-ink">
                                {row.fg} ({row.jam})
                              </dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="text-muted">Paket</dt>
                              <dd className="mt-0.5 [overflow-wrap:anywhere] font-medium text-ink">
                                {row.paket}
                              </dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="text-muted">Kampus &amp; Lokasi</dt>
                              <dd className="mt-0.5 [overflow-wrap:anywhere] text-ink-2">
                                {row.kampus_lokasi}
                              </dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="text-muted">Instagram</dt>
                              <dd className="mt-0.5 [overflow-wrap:anywhere] text-ink-2">
                                {row.username_ig}
                              </dd>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <dt className="text-muted">No. WA &amp; Bayar</dt>
                              <dd className="num mt-0.5 [overflow-wrap:anywhere] font-medium text-ink">
                                {row.no_wa_bayar}
                              </dd>
                            </div>
                          </dl>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-2.5">
                            <span className="text-xs text-muted">Status</span>
                            <div className="w-36 shrink-0">
                              <SelectDropdown
                                size="compact"
                                title={`Ubah Status Booking #${row.no}`}
                                ariaLabel={`Ubah status booking nomor ${row.no}`}
                                value={row.status}
                                options={getBookingStatusOptions(row.status)}
                                disabled={busyKey === `booking-status-${row.no}`}
                                onChange={(nextStatus) => {
                                  void handleChangeBookingStatus(row.no, nextStatus);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'koneksi' && (
            <motion.div
              key="tab-koneksi"
              id="admin-panel-koneksi"
              role="tabpanel"
              aria-labelledby="admin-tab-koneksi"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-12"
            >
              <form
                onSubmit={handleSaveSettingsSubmit}
                noValidate
                className="flex flex-col gap-4 rounded-card border border-rule bg-card p-4 sm:p-6 lg:col-span-7"
              >
                <h2 className="font-display text-xl font-semibold text-ink">
                  Koneksi Google Apps Script &amp; WhatsApp
                </h2>
                <p className="text-sm text-ink-2">
                  Pengaturan di bawah tersimpan di browser Anda untuk pengujian koneksi langsung. Untuk produksi permanen, isi nilai yang sama pada file .env.
                </p>

                <div>
                  <label htmlFor="cfg-gas-url" className="mb-1.5 block text-sm font-medium text-ink">
                    URL Web App Google Apps Script
                  </label>
                  <input
                    id="cfg-gas-url"
                    type="url"
                    value={gasUrlInput}
                    onChange={(event) => setGasUrlInput(event.target.value)}
                    placeholder="https://script.google.com/macros/s/…/exec"
                    className="field-control"
                  />
                  <p className="field-help text-muted">
                    Kosongkan jika ingin menjalankan Mode Preview Lokal.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cfg-wa-number" className="mb-1.5 block text-sm font-medium text-ink">
                      Nomor WhatsApp Admin
                    </label>
                    <input
                      id="cfg-wa-number"
                      type="text"
                      inputMode="tel"
                      value={waNumberInput}
                      onChange={(event) => setWaNumberInput(event.target.value)}
                      placeholder="6281234567890"
                      className="field-control num"
                    />
                    <p className="field-help num text-muted">
                      {waNumberInput.trim() && normalizeWhatsAppNumber(waNumberInput).length >= 8
                        ? `Target WA: wa.me/${normalizeWhatsAppNumber(waNumberInput)}`
                        : 'Menerima format 08xx atau 628xx.'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="cfg-admin-pin" className="mb-1.5 block text-sm font-medium text-ink">
                      PIN Panel Admin
                    </label>
                    <input
                      id="cfg-admin-pin"
                      type="text"
                      inputMode="numeric"
                      value={pinInput}
                      onChange={(event) => setPinInput(event.target.value)}
                      placeholder="2468"
                      className="field-control num"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={busyKey === 'settings-form'}
                    className="btn btn--primary min-h-10 px-5 text-sm"
                  >
                    {busyKey === 'settings-form' ? 'Menyimpan…' : 'Simpan & Uji Koneksi'}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await onResetSettings();
                      showFeedback('Pengaturan dikembalikan ke bawaan .env.');
                    }}
                    className="btn btn--quiet min-h-10 px-4 text-sm"
                  >
                    Kembalikan bawaan .env
                  </button>

                  {mode === 'preview' && (
                    <button
                      type="button"
                      onClick={() => {
                        onResetPreviewData();
                        showFeedback('Data contoh Mode Preview Lokal dikembalikan ke awal.');
                      }}
                      className="btn btn--quiet min-h-10 px-4 text-sm"
                    >
                      <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Reset data preview</span>
                    </button>
                  )}
                </div>
              </form>

              <aside className="flex flex-col gap-4 rounded-card border border-rule bg-card p-4 sm:p-6 lg:col-span-5">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Struktur tab Google Sheets
                </h3>
                <p className="text-sm text-ink-2">
                  Script gas/Code.gs otomatis menulis ke tab Jadwal_Wisuda (atau sheet JADWAL WISUDA yang sudah ada) dengan header berikut:
                </p>
                <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-ink-2">
                  <li>
                    <strong className="text-ink">Jadwal_Wisuda:</strong> No, Tanggal, FG, Jam, Paket, Nama Klien, Username IG, Kampus &amp; Lokasi, No. WA &amp; Bayar, Status
                  </li>
                  <li>
                    <strong className="text-ink">Jadwal:</strong> id, tanggal, jam, status (Kosong/Booked), catatan
                  </li>
                  <li>
                    <strong className="text-ink">Paket:</strong> id, nama_paket, harga, deskripsi, aktif
                  </li>
                  <li>
                    <strong className="text-ink">Fotografer:</strong> id, nama_fotografer, spesialisasi, aktif
                  </li>
                </ol>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
