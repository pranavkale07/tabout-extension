/**
 * @typedef {Object} ExtensionSettings
 * @property {boolean} enabled - Whether tabout is globally enabled
 * @property {Object<string, boolean>} siteEnabled - Per-site enable/disable
 * @property {Object<string, Array>} customPairs - Custom pairs per language
 * @property {boolean} debugMode - Whether to log debug information
 */

import { getSupportedDomains } from '../constants/sites.js';

/**
 * Generate default site settings from supported domains
 * @returns {Object<string, boolean>} - Default site enabled settings
 */
function generateDefaultSiteSettings() {
  const siteEnabled = {};
  getSupportedDomains().forEach(domain => {
    siteEnabled[domain] = true; // Enable all supported sites by default
  });
  return siteEnabled;
}

/**
 * Default extension settings
 */
export const DEFAULT_SETTINGS = {
  enabled: true,
  siteEnabled: generateDefaultSiteSettings(), // Single source of truth
  customPairs: {},
  debugMode: false
};

/**
 * Validate and sanitize settings data
 * @param {any} data - Raw data from storage
 * @returns {ExtensionSettings} - Validated settings
 */
function validateSettings(data) {
  const validated = { ...DEFAULT_SETTINGS };
  
  // Validate enabled (must be boolean)
  if (typeof data.enabled === 'boolean') {
    validated.enabled = data.enabled;
  }
  
  // Validate siteEnabled (must be object with boolean values)
  if (data.siteEnabled && typeof data.siteEnabled === 'object' && !Array.isArray(data.siteEnabled)) {
    validated.siteEnabled = {};
    for (const [domain, enabled] of Object.entries(data.siteEnabled)) {
      if (typeof domain === 'string' && typeof enabled === 'boolean') {
        validated.siteEnabled[domain] = enabled;
      }
    }
  }
  
  // Validate customPairs (must be object)
  if (data.customPairs && typeof data.customPairs === 'object' && !Array.isArray(data.customPairs)) {
    validated.customPairs = data.customPairs;
  }
  
  // Validate debugMode (must be boolean)
  if (typeof data.debugMode === 'boolean') {
    validated.debugMode = data.debugMode;
  }
  
  return validated;
}

/**
 * Storage manager for extension settings
 */
export class StorageManager {
  static isExtensionContextValid() {
    try {
      // chrome and chrome.runtime.id are undefined when the extension is reloading/unloaded
      return typeof chrome !== 'undefined' && chrome?.runtime?.id;
    } catch (_) {
      return false;
    }
  }

  /**
   * Get all settings with defaults
   * @returns {Promise<ExtensionSettings>} - Current settings
   */
  static async getSettings() {
    try {
      if (!this.isExtensionContextValid()) {
        // Avoid calling chrome APIs when context is invalid (e.g., during reload)
        return DEFAULT_SETTINGS;
      }
      const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      return validateSettings(stored);
    } catch (error) {
      console.error('[Tabout] Failed to get settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  
  /**
   * Update a specific setting
   * @param {string} key - Setting key
   * @param {any} value - New value
   * @returns {Promise<void>}
   */
  static async updateSetting(key, value) {
    try {
      if (!this.isExtensionContextValid()) {
        return; // Silently ignore updates during invalid context
      }
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error('[Tabout] Failed to update setting:', error);
    }
  }
  
  /**
   * Update multiple settings at once
   * @param {Object} updates - Settings to update
   * @returns {Promise<void>}
   */
  static async updateSettings(updates) {
    try {
      if (!this.isExtensionContextValid()) {
        return; // Silently ignore updates during invalid context
      }
      await chrome.storage.sync.set(updates);
    } catch (error) {
      console.error('[Tabout] Failed to update settings:', error);
    }
  }
  
  /**
   * Check if tabout is enabled for a specific site
   * @param {string} hostname - Site hostname
   * @returns {Promise<boolean>} - Whether enabled for this site
   */
  static async isEnabledForSite(hostname) {
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
   * Listen for storage changes
   * @param {function} callback - Called when settings change
   * @returns {function} - Cleanup function
   */
  static onSettingsChanged(callback) {
    if (!this.isExtensionContextValid()) {
      return () => {};
    }

    const listener = (changes, area) => {
      if (area !== 'sync') return;
      callback(changes);
    };

    chrome.storage.onChanged.addListener(listener);

    // Return cleanup function
    return () => chrome.storage.onChanged.removeListener(listener);
  }
}
