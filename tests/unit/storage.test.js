import { StorageManager } from '../../src/shared/utils/storage.js';
import { STORAGE_TEST_CASES } from '../fixtures/test-data.js';

describe('storage', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Mock isExtensionContextValid to return true for tests
    jest.spyOn(StorageManager, 'isExtensionContextValid').mockReturnValue(true);
  });

  describe('getSettings', () => {
    test('should return default settings when no data exists', async () => {
      chrome.storage.sync.get.mockResolvedValue({});

      const settings = await StorageManager.getSettings();
      
      expect(settings).toEqual({
        enabled: true,
        siteEnabled: {
          'leetcode.com': true
        },
        customPairs: {},
        debugMode: false
      });
    });

    test('should return stored settings when data exists', async () => {
      const storedData = {
        enabled: false,
        siteEnabled: {
          'leetcode.com': false
        }
      };

      chrome.storage.sync.get.mockResolvedValue(storedData);

      const settings = await StorageManager.getSettings();
      
      expect(settings).toEqual({
        ...storedData,
        customPairs: {},
        debugMode: false
      });
    });

    test('should handle storage errors gracefully', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));

      const settings = await StorageManager.getSettings();
      
      expect(settings).toEqual({
        enabled: true,
        siteEnabled: {
          'leetcode.com': true
        },
        customPairs: {},
        debugMode: false
      });
    });
  });

  describe('setSettings', () => {
    test('should save settings successfully', async () => {
      const settings = {
        enabled: false,
        siteEnabled: {
          'leetcode.com': false
        }
      };

      chrome.storage.sync.set.mockResolvedValue();

      await StorageManager.updateSettings(settings);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(settings);
    });

    test('should handle storage errors during save', async () => {
      const settings = {
        enabled: false,
        siteEnabled: {
          'leetcode.com': false
        }
      };

      chrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));

      // The actual implementation doesn't throw errors, it just logs them
      await StorageManager.updateSettings(settings);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(settings);
    });
  });

  describe('isEnabledForSite', () => {
    test('should return true when globally enabled and site enabled', async () => {
      chrome.storage.sync.get.mockResolvedValue({ 
        enabled: true,
        siteEnabled: { 'leetcode.com': true }
      });

      const enabled = await StorageManager.isEnabledForSite('leetcode.com');
      expect(enabled).toBe(true);
    });

    test('should return false when globally disabled', async () => {
      chrome.storage.sync.get.mockResolvedValue({ 
        enabled: false,
        siteEnabled: { 'leetcode.com': true }
      });

      const enabled = await StorageManager.isEnabledForSite('leetcode.com');
      expect(enabled).toBe(false);
    });

    test('should return false when site is disabled', async () => {
      chrome.storage.sync.get.mockResolvedValue({ 
        enabled: true,
        siteEnabled: { 'leetcode.com': false }
      });

      const enabled = await StorageManager.isEnabledForSite('leetcode.com');
      expect(enabled).toBe(false);
    });

    test('should return false for unknown site', async () => {
      chrome.storage.sync.get.mockResolvedValue({ 
        enabled: true,
        siteEnabled: { 'leetcode.com': true }
      });

      const enabled = await StorageManager.isEnabledForSite('unknown.com');
      expect(enabled).toBe(false);
    });
  });

  describe('updateSetting', () => {
    test('should update a single setting', async () => {
      chrome.storage.sync.set.mockResolvedValue();

      await StorageManager.updateSetting('enabled', false);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { enabled: false }
      );
    });
  });

  describe('data validation', () => {
    test('should merge with default settings for invalid data', async () => {
      const invalidSettings = {
        enabled: 'not a boolean',
        siteEnabled: 'not an object'
      };

      chrome.storage.sync.get.mockResolvedValue(invalidSettings);

      const settings = await StorageManager.getSettings();
      
      // Should merge invalid data with defaults (no validation)
      expect(settings).toEqual({
        enabled: 'not a boolean', // Invalid data is preserved
        siteEnabled: 'not an object', // Invalid data is preserved
        customPairs: {},
        debugMode: false
      });
    });
  });
});
