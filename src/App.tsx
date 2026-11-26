import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { AboutSection } from './components/AboutSection';
import { AdminGateModal } from './components/AdminGateModal';
import { AdminPanel } from './components/AdminPanel';
import { BookingForm } from './components/BookingForm';
import { Footer } from './components/Footer';
import { GallerySection } from './components/GallerySection';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { PackageCatalog } from './components/PackageCatalog';
import { ScheduleBoard } from './components/ScheduleBoard';
import { useLenisSmoothScroll } from './hooks/useLenis';
import {
  clearCustomStudioSettings,
  isUsingDefaultDemoPin,
  loadStudioSettings,
  resolveDataMode,
  saveStudioSettings,
} from './services/config';
import { resetPreviewDatabase } from './services/previewStore';
import {
  StudioApiError,
  createPackageRequest,
  createPhotographerRequest,
  createScheduleSlotRequest,
  deletePackageRequest,
  deletePhotographerRequest,
  deleteScheduleSlotRequest,
  fetchStudioSnapshot,
  submitBookingRequest,
  updateBookingStatusRequest,
  updatePackageRequest,
  updatePhotographerRequest,
  updateScheduleStatusRequest,
} from './services/studioApi';
import type {
  BookingSubmissionPayload,
  BookingSubmissionResult,
  PackageInput,
  PackageItem,
  PhotographerInput,
  ScheduleSlot,
  ScheduleSlotInput,
  SlotStatus,
  StudioSettings,
  StudioSnapshot,
} from './types/studio';

export function App() {
  const { scrollToTarget } = useLenisSmoothScroll();

  const [settings, setSettings] = useState<StudioSettings>(() => loadStudioSettings());
  const [snapshot, setSnapshot] = useState<StudioSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'booking' | 'admin'>('booking');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<BookingSubmissionResult | null>(null);

  const mode = snapshot?.mode ?? resolveDataMode(settings);

  const loadSnapshot = useCallback(async (activeSettings: StudioSettings, throwOnError = false) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchStudioSnapshot(activeSettings);
      setSnapshot(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi gangguan saat memuat data Vegas Studio.';
      setLoadError(message);
      if (throwOnError) {
        throw error instanceof Error ? error : new Error(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot(settings);
  }, [loadSnapshot, settings]);

  const slots = snapshot?.jadwal ?? [];
  const packages = snapshot?.paket ?? [];
  const photographers = snapshot?.fotografer ?? [];
  const rekap = snapshot?.rekap ?? [];

  const availableSlots = slots.filter((slot) => slot.status === 'Kosong');
  const activePackages = packages.filter((pkg) => pkg.aktif);

  const selectedSlot =
    slots.find((slot) => slot.id === selectedSlotId && slot.status === 'Kosong') ?? null;

  useEffect(() => {
    if (selectedPackageId && !activePackages.some((pkg) => pkg.id === selectedPackageId)) {
      setSelectedPackageId('');
    }
  }, [activePackages, selectedPackageId]);

  const handleSelectSlot = (slot: ScheduleSlot) => {
    if (slot.status !== 'Kosong') {
      return;
    }
    setLastSubmission(null);
    setSubmitError(null);
    setSelectedSlotId(slot.id);
    scrollToTarget('#booking-form');
    window.setTimeout(() => {
      document.getElementById('booking-fg')?.focus();
    }, 350);
  };

  const handleSelectPackageFromCatalog = (pkg: PackageItem) => {
    setLastSubmission(null);
    setSelectedPackageId(pkg.id);
    scrollToTarget('#booking-form');
  };

  const handleSubmitBooking = async (
    payload: BookingSubmissionPayload,
  ): Promise<BookingSubmissionResult | null> => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitBookingRequest(settings, payload);
      setLastSubmission(result);
      setSelectedSlotId('');
      setSelectedPackageId('');
      await loadSnapshot(settings);
      return result;
    } catch (error) {
      if (error instanceof StudioApiError && error.code === 'SLOT_ALREADY_BOOKED') {
        setSubmitError(error.message);
        setSelectedSlotId('');
        await loadSnapshot(settings);
      } else {
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Booking gagal disimpan. Periksa koneksi Anda lalu coba lagi.',
        );
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAdmin = () => {
    if (activeView === 'admin') {
      setActiveView('booking');
      return;
    }
    if (isAdminUnlocked) {
      setActiveView('admin');
      return;
    }
    setIsGateModalOpen(true);
  };

  const handleCreatePackage = async (input: PackageInput) => {
    await createPackageRequest(settings, input);
    await loadSnapshot(settings);
  };

  const handleUpdatePackage = async (id: string, input: PackageInput) => {
    await updatePackageRequest(settings, id, input);
    await loadSnapshot(settings);
  };

  const handleDeletePackage = async (id: string) => {
    await deletePackageRequest(settings, id);
    await loadSnapshot(settings);
  };

  const handleCreatePhotographer = async (input: PhotographerInput) => {
    await createPhotographerRequest(settings, input);
    await loadSnapshot(settings);
  };

  const handleUpdatePhotographer = async (id: string, input: PhotographerInput) => {
    await updatePhotographerRequest(settings, id, input);
    await loadSnapshot(settings);
  };

  const handleDeletePhotographer = async (id: string) => {
    await deletePhotographerRequest(settings, id);
    await loadSnapshot(settings);
  };

  const handleCreateScheduleSlot = async (input: ScheduleSlotInput) => {
    await createScheduleSlotRequest(settings, input);
    await loadSnapshot(settings);
  };

  const handleUpdateScheduleStatus = async (id: string, status: SlotStatus) => {
    await updateScheduleStatusRequest(settings, id, status);
    await loadSnapshot(settings);
  };

  const handleDeleteScheduleSlot = async (id: string) => {
    await deleteScheduleSlotRequest(settings, id);
    await loadSnapshot(settings);
  };

  const handleUpdateBookingStatus = async (no: number, status: string) => {
    await updateBookingStatusRequest(settings, no, status);
    await loadSnapshot(settings);
  };

  const handleSaveSettings = async (next: StudioSettings) => {
    const saved = saveStudioSettings(next);
    setSettings(saved);
    await loadSnapshot(saved, true);
  };

  const handleResetSettings = async () => {
    const defaults = clearCustomStudioSettings();
    setSettings(defaults);
    await loadSnapshot(defaults, true);
  };

  const handleResetPreviewData = () => {
    const fresh = resetPreviewDatabase();
    setSnapshot(fresh);
    setSelectedSlotId('');
    setSelectedPackageId('');
    setLastSubmission(null);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col bg-paper text-ink">
        <Navbar
          activeView={activeView}
          mode={mode}
          isAdminUnlocked={isAdminUnlocked}
          onNavigateSection={(selector) => scrollToTarget(selector)}
          onToggleAdmin={handleToggleAdmin}
        />

        <main id="main-content" className="flex-1">
          <AnimatePresence mode="wait">
            {activeView === 'booking' ? (
              <motion.div
                key="view-booking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <HeroSection
                  mode={mode}
                  whatsappAdminNumber={settings.whatsappNumber}
                  availableCount={availableSlots.length}
                  nextAvailableSlot={availableSlots[0] ?? null}
                  isLoading={isLoading}
                  onJumpToBooking={() => scrollToTarget('#booking-form')}
                  onJumpToSchedule={() => scrollToTarget('#jadwal')}
                  onQuickPickSlot={handleSelectSlot}
                />

                <GallerySection />

                <AboutSection />

                <ScheduleBoard
                  slots={slots}
                  selectedSlotId={selectedSlotId}
                  isLoading={isLoading}
                  errorMessage={loadError}
                  onSelectSlot={handleSelectSlot}
                  onRetry={() => void loadSnapshot(settings)}
                />

                <PackageCatalog
                  packages={packages}
                  selectedPackageId={selectedPackageId}
                  isLoading={isLoading}
                  onSelectPackage={handleSelectPackageFromCatalog}
                />

                <BookingForm
                  mode={mode}
                  whatsappAdminNumber={settings.whatsappNumber}
                  selectedSlot={selectedSlot}
                  packages={packages}
                  photographers={photographers}
                  selectedPackageId={selectedPackageId}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  lastSubmission={lastSubmission}
                  onSelectPackageId={setSelectedPackageId}
                  onJumpToSchedule={() => scrollToTarget('#jadwal')}
                  onSubmitBooking={handleSubmitBooking}
                  onResetReceipt={() => setLastSubmission(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="view-admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <AdminPanel
                  mode={mode}
                  settings={settings}
                  packages={packages}
                  photographers={photographers}
                  slots={slots}
                  rekap={rekap}
                  isRefreshing={isLoading}
                  onRefresh={() => loadSnapshot(settings, true)}
                  onExitAdmin={() => setActiveView('booking')}
                  onLockAdmin={() => {
                    setIsAdminUnlocked(false);
                    setActiveView('booking');
                  }}
                  onCreatePackage={handleCreatePackage}
                  onUpdatePackage={handleUpdatePackage}
                  onDeletePackage={handleDeletePackage}
                  onCreatePhotographer={handleCreatePhotographer}
                  onUpdatePhotographer={handleUpdatePhotographer}
                  onDeletePhotographer={handleDeletePhotographer}
                  onCreateScheduleSlot={handleCreateScheduleSlot}
                  onUpdateScheduleStatus={handleUpdateScheduleStatus}
                  onDeleteScheduleSlot={handleDeleteScheduleSlot}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                  onSaveSettings={handleSaveSettings}
                  onResetSettings={handleResetSettings}
                  onResetPreviewData={handleResetPreviewData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer
          mode={mode}
          activeView={activeView}
          onNavigateSection={(selector) => scrollToTarget(selector)}
          onToggleAdmin={handleToggleAdmin}
        />

        <AdminGateModal
          open={isGateModalOpen}
          expectedPin={settings.adminPin}
          showDefaultPinHint={isUsingDefaultDemoPin(settings)}
          onClose={() => setIsGateModalOpen(false)}
          onUnlock={() => {
            setIsAdminUnlocked(true);
            setIsGateModalOpen(false);
            setActiveView('admin');
          }}
        />
      </div>
    </MotionConfig>
  );
}

export default App;
