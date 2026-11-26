import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, X } from 'lucide-react';

export interface SelectDropdownOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  dotColorClass?: string;
}

interface SelectDropdownProps {
  id?: string;
  name?: string;
  value: string;
  options: SelectDropdownOption[];
  placeholder?: string;
  title?: string;
  ariaLabel?: string;
  ariaRequired?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  disabled?: boolean;
  size?: 'default' | 'compact';
  className?: string;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onChange: (nextValue: string) => void;
  onBlur?: () => void;
}

interface FloatingPosition {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

const MOBILE_MEDIA_QUERY = '(max-width: 639px)';

function getIsMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export function SelectDropdown({
  id,
  name,
  value,
  options,
  placeholder = 'Pilih opsi…',
  title = 'Pilih opsi',
  ariaLabel,
  ariaRequired,
  ariaInvalid,
  ariaDescribedBy,
  disabled = false,
  size = 'default',
  className = '',
  triggerRef: externalTriggerRef,
  onChange,
  onBlur,
}: SelectDropdownProps) {
  const generatedId = useId();
  const controlId = id ?? `select-${generatedId}`;
  const listboxId = `${controlId}-listbox`;

  const internalTriggerRef = useRef<HTMLButtonElement>(null);
  const triggerRef = externalTriggerRef ?? internalTriggerRef;
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobileViewport);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [position, setPosition] = useState<FloatingPosition>({
    top: 0,
    left: 0,
    width: 240,
    openUpward: false,
  });

  const selectedOption = options.find((opt) => opt.value === value) ?? null;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const updateMatch = () => setIsMobile(media.matches);
    updateMatch();
    media.addEventListener('change', updateMatch);
    return () => media.removeEventListener('change', updateMatch);
  }, []);

  const updateFloatingPosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) {
      return;
    }
    const rect = triggerEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 768;
    const viewportWidth = window.innerWidth || 1024;
    const minMenuWidth = size === 'compact' ? Math.max(rect.width, 148) : rect.width;
    const clampedWidth = Math.min(minMenuWidth, Math.max(180, viewportWidth - 24));
    const maxLeft = Math.max(12, viewportWidth - clampedWidth - 12);
    const left = Math.min(Math.max(12, rect.left), maxLeft);
    const spaceBelow = viewportHeight - rect.bottom;
    const openUpward = spaceBelow < 240 && rect.top > spaceBelow;

    setPosition({
      top: openUpward ? Math.max(12, rect.top - 6) : Math.min(viewportHeight - 12, rect.bottom + 6),
      left,
      width: clampedWidth,
      openUpward,
    });
  }, [size, triggerRef]);

  useLayoutEffect(() => {
    if (!isOpen || isMobile) {
      return;
    }
    updateFloatingPosition();
    window.addEventListener('resize', updateFloatingPosition);
    window.addEventListener('scroll', updateFloatingPosition, true);
    return () => {
      window.removeEventListener('resize', updateFloatingPosition);
      window.removeEventListener('scroll', updateFloatingPosition, true);
    };
  }, [isOpen, isMobile, updateFloatingPosition]);

  const closeMenu = useCallback(
    (restoreFocus = false) => {
      setIsOpen(false);
      onBlur?.();
      if (restoreFocus) {
        window.requestAnimationFrame(() => {
          triggerRef.current?.focus();
        });
      }
    },
    [onBlur, triggerRef],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const selectedIdx = options.findIndex((opt) => opt.value === value);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [isOpen, options, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu, isOpen, triggerRef]);

  const handleSelectValue = (selectedVal: string) => {
    onChange(selectedVal);
    setIsOpen(false);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (options.length === 0 ? -1 : (prev + 1) % options.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        options.length === 0 ? -1 : (prev - 1 + options.length) % options.length,
      );
      return;
    }
    if (event.key === 'Home' && options.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End' && options.length > 0) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && activeIndex >= 0 && options[activeIndex]) {
      event.preventDefault();
      handleSelectValue(options[activeIndex]!.value);
      return;
    }
    if (event.key === 'Tab') {
      closeMenu(false);
    }
  };

  const activeDescendantId =
    isOpen && activeIndex >= 0 && options[activeIndex]
      ? `${controlId}-opt-${activeIndex}`
      : undefined;

  const triggerClasses =
    size === 'compact'
      ? `flex min-h-9 w-full items-center justify-between gap-2 rounded-[var(--radius-input)] border border-field-border bg-paper px-2.5 text-left text-xs font-medium text-ink transition-colors duration-[var(--dur-short)] hover:border-ink-2 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55 ${className}`
      : `field-control flex items-center justify-between gap-2 text-left ${className}`;

  const renderOptionsList = (mobileSheet: boolean) => (
    <ul
      id={listboxId}
      role="listbox"
      data-lenis-prevent
      aria-labelledby={ariaLabel ? undefined : controlId}
      aria-label={ariaLabel}
      className={`m-0 flex list-none flex-col gap-1 overflow-y-auto overscroll-contain p-1.5 ${
        mobileSheet ? 'max-h-[55dvh] px-3 py-2' : 'max-h-64'
      }`}
    >
      {options.length === 0 ? (
        <li className="px-3 py-2.5 text-sm text-muted">Belum ada pilihan tersedia.</li>
      ) : (
        options.map((opt, idx) => {
          const isSelected = opt.value === value;
          const isActive = idx === activeIndex;
          return (
            <li key={opt.value} role="presentation">
              <button
                id={`${controlId}-opt-${idx}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleSelectValue(opt.value)}
                className={`flex w-full items-center justify-between gap-3 rounded-[4px] px-3 text-left transition-colors duration-[var(--dur-micro)] ${
                  mobileSheet ? 'min-h-12 py-2.5' : 'min-h-10 py-2'
                } ${
                  isSelected
                    ? 'bg-accent-soft text-accent'
                    : isActive
                      ? 'bg-paper-2 text-ink'
                      : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  {opt.dotColorClass && (
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${opt.dotColorClass}`}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <span
                        className={`truncate text-sm ${
                          isSelected ? 'font-medium text-accent' : 'font-medium text-ink'
                        }`}
                      >
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="num shrink-0 text-xs font-medium text-muted">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">{opt.description}</p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })
      )}
    </ul>
  );

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendantId}
        aria-label={ariaLabel}
        aria-required={ariaRequired ? 'true' : undefined}
        aria-invalid={ariaInvalid ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => {
              if (prev) {
                onBlur?.();
              }
              return !prev;
            });
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClasses}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selectedOption?.dotColorClass && (
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${selectedOption.dotColorClass}`}
            />
          )}
          <span
            className={`min-w-0 truncate ${
              selectedOption ? 'text-ink' : 'text-muted'
            }`}
          >
            {selectedOption
              ? selectedOption.badge
                ? `${selectedOption.label} (${selectedOption.badge})`
                : selectedOption.label
              : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-[var(--dur-short)] ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen &&
              (isMobile ? (
                <div
                  key={`${controlId}-mobile-overlay`}
                  className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center sm:hidden"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    aria-hidden="true"
                    onClick={() => closeMenu(true)}
                    className="fixed inset-0 bg-backdrop backdrop-blur-[1px]"
                  />

                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 w-full rounded-t-[14px] border-t border-field-border bg-card pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
                      <span className="font-display text-base font-semibold text-ink">{title}</span>
                      <button
                        type="button"
                        aria-label={`Tutup daftar ${title}`}
                        onClick={() => closeMenu(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] border border-rule text-ink-2 hover:bg-paper-2 hover:text-ink"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    {renderOptionsList(true)}
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  ref={menuRef}
                  key={`${controlId}-desktop-popover`}
                  initial={{ opacity: 0, y: position.openUpward ? 4 : -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: position.openUpward ? 4 : -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'fixed',
                    left: `${position.left}px`,
                    width: `${position.width}px`,
                    ...(position.openUpward
                      ? { bottom: `${window.innerHeight - position.top}px` }
                      : { top: `${position.top}px` }),
                  }}
                  className="z-[var(--z-modal)] rounded-card border border-field-border bg-card shadow-[var(--shadow-card)]"
                >
                  {renderOptionsList(false)}
                </motion.div>
              ))}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
