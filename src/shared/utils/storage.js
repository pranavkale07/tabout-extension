/**
 * @typedef {Object} ExtensionSettings
 * @property {boolean} enabled - Whether tabout is globally enabled
 * @property {Object<string, boolean>} siteEnabled - Per-site enable/disable
 * @property {Object<string, Array>} customPairs - Custom pairs per language
 * @property {boolean} debugMode - Whether to log debug information
 * @property {Object} jumpPoints - Jump points configuration
 */

import { getSupportedDomains } from '../constants/sites.js';
import { DEFAULT_JUMP_MARKERS } from '../constants/jump-points.js';

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
  debugMode: false,
  jumpPoints: {
    enabled: true,
    caseSensitive: false,
    wrapAround: true,
    activeMarkers: DEFAULT_JUMP_MARKERS.slice(),
    customMarkers: []
  }
};

/**
 * Validate and sanitize settings data
 * @param {any} data - Raw data from storage
 * @returns {ExtensionSettings} - Validated settings
 */
function validateSettings(data) {
  const validated = { ...DEFAULT_SETTINGS };
  const validatedSiteEnabled = generateDefaultSiteSettings(); // Ensure new supported domains stay enabled by default

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
      // Check that lang is a non-empty string (not a numeric string) and pairs is an array
      if (typeof lang === 'string' && lang.length > 0 && isNaN(Number(lang)) && Array.isArray(pairs)) {
        validated.customPairs[lang] = pairs;
      }
    }
  }

  // Validate debugMode (must be boolean)
  if (typeof data.debugMode === 'boolean') {
    validated.debugMode = data.debugMode;
  }

  // Validate jumpPoints settings
  if (data.jumpPoints && typeof data.jumpPoints === 'object') {
    validated.jumpPoints = { ...DEFAULT_SETTINGS.jumpPoints };
    
    if (typeof data.jumpPoints.enabled === 'boolean') {
      validated.jumpPoints.enabled = data.jumpPoints.enabled;
    }
    if (typeof data.jumpPoints.caseSensitive === 'boolean') {
      validated.jumpPoints.caseSensitive = data.jumpPoints.caseSensitive;
    }
    if (typeof data.jumpPoints.wrapAround === 'boolean') {
      validated.jumpPoints.wrapAround = data.jumpPoints.wrapAround;
    }
    if (Array.isArray(data.jumpPoints.activeMarkers)) {
      validated.jumpPoints.activeMarkers = data.jumpPoints.activeMarkers.filter(m => typeof m === 'string');
    }
    if (Array.isArray(data.jumpPoints.customMarkers)) {
      validated.jumpPoints.customMarkers = data.jumpPoints.customMarkers.filter(m => typeof m === 'string');
    }
  }

  return validated;
}

/**
 * Storage manager for extension settings
 */
export class StorageManager {
  static isExtensionContextValid() {
    try {
      // browser and browser.runtime.id are undefined when the extension is reloading/unloaded
      return typeof browser !== 'undefined' && browser?.runtime?.id;
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
        // Avoid calling browser APIs when context is invalid (e.g., during reload)
        return DEFAULT_SETTINGS;
      }
      const stored = await browser.storage.sync.get(DEFAULT_SETTINGS);
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
      await browser.storage.sync.set({ [key]: value });
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
      await browser.storage.sync.set(updates);
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
      return () => { };
    }

    const listener = (changes, area) => {
      if (area !== 'sync') return;
      callback(changes);
    };

    browser.storage.onChanged.addListener(listener);

    // Return cleanup function
    return () => browser.storage.onChanged.removeListener(listener);
  }
}
