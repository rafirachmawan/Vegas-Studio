import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Lock, X } from 'lucide-react';

interface AdminGateModalProps {
  open: boolean;
  expectedPin: string;
  showDefaultPinHint: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export function AdminGateModal({
  open,
  expectedPin,
  showDefaultPinHint,
  onClose,
  onUnlock,
}: AdminGateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setPin('');
      setError(null);
      window.requestAnimationFrame(() => {
        pinInputRef.current?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin.trim() !== expectedPin) {
      setError('PIN tidak sesuai. Periksa kembali kode akses admin.');
      pinInputRef.current?.focus();
      pinInputRef.current?.select();
      return;
    }
    setError(null);
    setPin('');
    onUnlock();
  };

  return (
    <dialog
      ref={dialogRef}
      data-lenis-prevent
      aria-labelledby="admin-gate-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className="fixed inset-0 m-auto w-[min(92%,26rem)] rounded-card border border-rule bg-card p-5 text-ink shadow-[var(--shadow-card)] backdrop:bg-ink/40 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
        <div className="flex items-center gap-2.5">
          <Lock className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <h2 id="admin-gate-title" className="font-display text-xl font-bold text-ink">
            Akses Panel Admin
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog akses admin"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-input)] border border-rule text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
        <p className="text-sm text-ink-2">
          Masukkan PIN admin untuk mengelola daftar Paket, Fotografer, Jadwal, dan pengaturan koneksi Vegas Studio.
        </p>

        <div>
          <label htmlFor="admin-pin-input" className="mb-1.5 block text-sm font-medium text-ink">
            PIN Admin
          </label>
          <input
            ref={pinInputRef}
            id="admin-pin-input"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby="admin-pin-help"
            className="field-control num"
            placeholder="Masukkan PIN"
          />
          <p
            id="admin-pin-help"
            className={`field-help ${error ? 'text-error' : 'text-muted'}`}
          >
            {error ??
              (showDefaultPinHint
                ? 'PIN bawaan preview: 2468 (dapat diganti di tab Koneksi & Setup).'
                : 'Gunakan PIN sesuai konfigurasi VITE_ADMIN_PIN atau pengaturan tersimpan.')}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button type="button" onClick={onClose} className="btn btn--quiet w-full sm:w-auto">
            Batal
          </button>
          <button type="submit" className="btn btn--primary w-full sm:w-auto">
            Buka Panel Admin
          </button>
        </div>
      </form>
    </dialog>
  );
}
