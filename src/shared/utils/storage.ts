/**
 * Storage manager for extension settings.
 */
import { getSupportedDomains } from '../constants/sites';

export interface ExtensionSettings {
  /** Whether tabout is globally enabled. */
  enabled: boolean;
  /** Per-site enable/disable. */
  siteEnabled: Record<string, boolean>;
  /** Custom pairs per language. */
  customPairs: Record<string, unknown[]>;
  /** Whether to log debug information. */
  debugMode: boolean;
}

/** A subset of `browser.storage.onChanged` changes. */
export type StorageChanges = Record<string, { oldValue?: unknown; newValue?: unknown }>;

/**
 * Generate default site settings from supported domains.
 */
function generateDefaultSiteSettings(): Record<string, boolean> {
  const siteEnabled: Record<string, boolean> = {};
  getSupportedDomains().forEach((domain) => {
    siteEnabled[domain] = true; // Enable all supported sites by default
  });
  return siteEnabled;
}

/**
 * Default extension settings.
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  siteEnabled: generateDefaultSiteSettings(), // Single source of truth
  customPairs: {},
  debugMode: false,
};

/**
 * Validate and sanitize settings data.
 */
function validateSettings(data: Record<string, unknown>): ExtensionSettings {
  const validated: ExtensionSettings = { ...DEFAULT_SETTINGS };
  const validatedSiteEnabled = generateDefaultSiteSettings(); // Keep new supported domains enabled by default

  // Validate enabled (must be boolean)
  if (typeof data.enabled === 'boolean') {
    validated.enabled = data.enabled;
  }

  // Validate siteEnabled (must be object with boolean values)
  if (data.siteEnabled && typeof data.siteEnabled === 'object' && !Array.isArray(data.siteEnabled)) {
    for (const [domain, enabled] of Object.entries(data.siteEnabled)) {
      if (typeof domain === 'string' && typeof enabled === 'boolean') {
        validatedSiteEnabled[domain] = enabled;
      }
    }
  }
  validated.siteEnabled = validatedSiteEnabled;

  // Validate customPairs (must be object with string keys and array values)
  if (data.customPairs && typeof data.customPairs === 'object' && !Array.isArray(data.customPairs)) {
    validated.customPairs = {};
    for (const [lang, pairs] of Object.entries(data.customPairs)) {
      // lang must be a non-empty, non-numeric string and pairs an array
      if (typeof lang === 'string' && lang.length > 0 && isNaN(Number(lang)) && Array.isArray(pairs)) {
        validated.customPairs[lang] = pairs;
      }
    }
  }

  // Validate debugMode (must be boolean)
  if (typeof data.debugMode === 'boolean') {
    validated.debugMode = data.debugMode;
  }

  return validated;
}

/**
 * Storage manager for extension settings.
 */
export class StorageManager {
  static isExtensionContextValid(): boolean {
    try {
      // browser and browser.runtime.id are undefined when the extension is reloading/unloaded
      return typeof browser !== 'undefined' && Boolean(browser?.runtime?.id);
    } catch {
      return false;
    }
  }

  /**
   * Get all settings with defaults applied.
   */
  static async getSettings(): Promise<ExtensionSettings> {
    try {
      if (!this.isExtensionContextValid()) {
        // Avoid calling browser APIs when context is invalid (e.g., during reload)
        return DEFAULT_SETTINGS;
      }
      const stored = await browser.storage.sync.get(
        DEFAULT_SETTINGS as unknown as Record<string, unknown>,
      );
      return validateSettings(stored as Record<string, unknown>);
    } catch (error) {
      console.error('[Tabout] Failed to get settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Update a specific setting.
   */
  static async updateSetting(key: string, value: unknown): Promise<void> {
    try {
      if (!this.isExtensionContextValid()) {
        return; // Silently ignore updates during invalid context
      }
      await browser.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error('[Tabout] Failed to update setting:', error);
    }
  }

  /**
   * Update multiple settings at once.
   */
  static async updateSettings(updates: Record<string, unknown>): Promise<void> {
    try {
      if (!this.isExtensionContextValid()) {
        return; // Silently ignore updates during invalid context
      }
      await browser.storage.sync.set(updates);
    } catch (error) {
      console.error('[Tabout] Failed to update settings:', error);
    }
  }

  /**
   * Check if tabout is enabled for a specific site.
   */
  static async isEnabledForSite(hostname: string): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      if (!settings.enabled) return false;

      // Check site-specific setting with secure domain matching
      for (const domain of Object.keys(settings.siteEnabled)) {
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          return settings.siteEnabled[domain];
        }
      }

      return false; // Unknown site, disabled by default
    } catch (error) {
      console.error('[Tabout] Failed to check site enabled:', error);
      return false;
    }
  }

  /**
   * Listen for storage changes.
   * @returns A cleanup function.
   */
  static onSettingsChanged(callback: (changes: StorageChanges) => void): () => void {
    if (!this.isExtensionContextValid()) {
      return () => {};
    }

    const listener = (changes: StorageChanges, area: string) => {
      if (area !== 'sync') return;
      callback(changes);
    };

    browser.storage.onChanged.addListener(listener);

    // Return cleanup function
    return () => browser.storage.onChanged.removeListener(listener);
  }
}
