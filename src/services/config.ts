import type { DataMode, StudioSettings } from '../types/studio';

const SETTINGS_STORAGE_KEY = 'vegas_studio_settings_v1';
const DEFAULT_PREVIEW_PIN = '2468';

function getEnvDefaults(): StudioSettings {
  return {
    gasUrl: (import.meta.env.VITE_GAS_WEB_APP_URL ?? '').trim(),
    whatsappNumber: (import.meta.env.VITE_WHATSAPP_ADMIN ?? '').trim(),
    adminPin: (import.meta.env.VITE_ADMIN_PIN ?? DEFAULT_PREVIEW_PIN).trim() || DEFAULT_PREVIEW_PIN,
  };
}

export function loadStudioSettings(): StudioSettings {
  const defaults = getEnvDefaults();
  if (typeof window === 'undefined') {
    return defaults;
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<StudioSettings>;
    return {
      gasUrl: typeof parsed.gasUrl === 'string' ? parsed.gasUrl.trim() : defaults.gasUrl,
      whatsappNumber:
        typeof parsed.whatsappNumber === 'string'
          ? parsed.whatsappNumber.trim()
          : defaults.whatsappNumber,
      adminPin:
        typeof parsed.adminPin === 'string' && parsed.adminPin.trim()
          ? parsed.adminPin.trim()
          : defaults.adminPin,
    };
  } catch {
    return defaults;
  }
}

export function saveStudioSettings(next: StudioSettings): StudioSettings {
  const sanitized: StudioSettings = {
    gasUrl: next.gasUrl.trim(),
    whatsappNumber: next.whatsappNumber.trim(),
    adminPin: next.adminPin.trim() || DEFAULT_PREVIEW_PIN,
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  }
  return sanitized;
}

export function clearCustomStudioSettings(): StudioSettings {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }
  return getEnvDefaults();
}

export function isValidHttpUrl(url: string): boolean {
  if (!url.trim()) {
    return false;
  }
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function resolveDataMode(settings: StudioSettings): DataMode {
  return isValidHttpUrl(settings.gasUrl) ? 'live' : 'preview';
}

export function isUsingDefaultDemoPin(settings: StudioSettings): boolean {
  return settings.adminPin === DEFAULT_PREVIEW_PIN;
}
