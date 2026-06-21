import { describe, test, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../../src/shared/utils/storage';

describe('storage', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    // Mock isExtensionContextValid to return true for tests
    vi.spyOn(StorageManager, 'isExtensionContextValid').mockReturnValue(true);
  });

  describe('getSettings', () => {
    test('should return default settings when no data exists', async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({});

      const settings = await StorageManager.getSettings();
      
      expect(settings).toEqual({
        enabled: true,
        siteEnabled: {
          'leetcode.com': true,
          'leetcode.cn': true,
          'takeuforward.org': true,
          'geeksforgeeks.org': true
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

      vi.mocked(browser.storage.sync.get).mockResolvedValue(storedData);

      const settings = await StorageManager.getSettings();
      
      expect(settings).toEqual({
        enabled: false,
        siteEnabled: {
          'leetcode.com': false,
          'leetcode.cn': true,
          'takeuforward.org': true,
          'geeksforgeeks.org': true
        },
        customPairs: {},
        debugMode: false
      });
    });

    test('should handle storage errors gracefully', async () => {
      vi.mocked(browser.storage.sync.get).mockRejectedValue(new Error('Storage error'));

      const settings = await StorageManager.getSettings();
      
      expect(settings).toEqual({
        enabled: true,
        siteEnabled: {
          'leetcode.com': true,
          'leetcode.cn': true,
          'takeuforward.org': true,
          'geeksforgeeks.org': true
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

      vi.mocked(browser.storage.sync.set).mockResolvedValue();

      await StorageManager.updateSettings(settings);
      
      expect(browser.storage.sync.set).toHaveBeenCalledWith(settings);
    });

    test('should handle storage errors during save', async () => {
      const settings = {
        enabled: false,
        siteEnabled: {
          'leetcode.com': false
        }
      };

      vi.mocked(browser.storage.sync.set).mockRejectedValue(new Error('Storage error'));

      // The actual implementation doesn't throw errors, it just logs them
      await StorageManager.updateSettings(settings);
      
      expect(browser.storage.sync.set).toHaveBeenCalledWith(settings);
    });
  });

  describe('isEnabledForSite', () => {
    test('should return true when globally enabled and site enabled', async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({ 
        enabled: true,
        siteEnabled: { 'leetcode.com': true }
      });

      const enabled = await StorageManager.isEnabledForSite('leetcode.com');
      expect(enabled).toBe(true);
    });

    test('should return true for leetcode.cn when default settings are applied', async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({ 
        enabled: true,
        siteEnabled: { 'leetcode.com': true } // Missing leetcode.cn to ensure defaults are merged
      });

      const enabled = await StorageManager.isEnabledForSite('leetcode.cn');
      expect(enabled).toBe(true);
    });

    test('should return false when globally disabled', async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({ 
        enabled: false,
        siteEnabled: { 'leetcode.com': true }
      });

      const enabled = await StorageManager.isEnabledForSite('leetcode.com');
      expect(enabled).toBe(false);
    });

    test('should return false when site is disabled', async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({ 
        enabled: true,
        siteEnabled: { 'leetcode.com': false }
      });

      const enabled = await StorageManager.isEnabledForSite('leetcode.com');
      expect(enabled).toBe(false);
    });

    test('should return false for unknown site', async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({ 
        enabled: true,
        siteEnabled: { 'leetcode.com': true }
      });

      const enabled = await StorageManager.isEnabledForSite('unknown.com');
      expect(enabled).toBe(false);
    });
  });

  describe('updateSetting', () => {
    test('should update a single setting', async () => {
      vi.mocked(browser.storage.sync.set).mockResolvedValue();

      await StorageManager.updateSetting('enabled', false);
      
      expect(browser.storage.sync.set).toHaveBeenCalledWith(
        { enabled: false }
      );
    });
  });

  describe('data validation', () => {
    test('should validate and sanitize invalid data', async () => {
      const invalidSettings = {
        enabled: 'not a boolean',
        siteEnabled: 'not an object',
        customPairs: 'not an object',
        debugMode: 'not a boolean'
      };

      vi.mocked(browser.storage.sync.get).mockResolvedValue(invalidSettings);

      const settings = await StorageManager.getSettings();
      
      // Should fall back to default values for invalid data
      expect(settings).toEqual({
        enabled: true, // Default value for invalid boolean
        siteEnabled: {
          'leetcode.com': true, // Default value for invalid object
          'leetcode.cn': true,
          'takeuforward.org': true,
          'geeksforgeeks.org': true
        },
        customPairs: {}, // Default value for invalid object
        debugMode: false // Default value for invalid boolean
      });
    });

    test('should preserve valid data', async () => {
      const validSettings = {
        enabled: false,
        siteEnabled: {
          'leetcode.com': false,
          'leetcode.cn': true,
          'takeuforward.org': true,
          'geeksforgeeks.org': true,
          'example.com': true
        },
        customPairs: { 'python': [['(', ')']] },
        debugMode: true
      };

      vi.mocked(browser.storage.sync.get).mockResolvedValue(validSettings);

      const settings = await StorageManager.getSettings();
      
      // Should preserve all valid data
      expect(settings).toEqual(validSettings);
    });

    test('should handle mixed valid and invalid data', async () => {
      const mixedSettings = {
        enabled: false, // Valid
        siteEnabled: 'not an object', // Invalid
        customPairs: { 'python': [['(', ')']] }, // Valid
        debugMode: 'not a boolean' // Invalid
      };

      vi.mocked(browser.storage.sync.get).mockResolvedValue(mixedSettings);

      const settings = await StorageManager.getSettings();
      
      // Should preserve valid data and use defaults for invalid data
      expect(settings).toEqual({
        enabled: false, // Preserved valid value
        siteEnabled: {
          'leetcode.com': true, // Default for invalid object
          'leetcode.cn': true,
          'takeuforward.org': true,
          'geeksforgeeks.org': true
        },
        customPairs: { 'python': [['(', ')']] }, // Preserved valid value
        debugMode: false // Default for invalid boolean
      });
    });

    test('should validate customPairs structure', async () => {
      const settingsWithInvalidCustomPairs = {
        enabled: true,
        siteEnabled: { 'leetcode.com': true },
        customPairs: {
          'python': [['(', ')']], // Valid
          'javascript': 'not an array', // Invalid
          'java': { 'invalid': 'structure' }, // Invalid
          123: [['[', ']']], // Invalid key type
          'typescript': [['{', '}']] // Valid
        },
        debugMode: false
      };

      vi.mocked(browser.storage.sync.get).mockResolvedValue(settingsWithInvalidCustomPairs);

      const settings = await StorageManager.getSettings();
      
      // Should only preserve valid customPairs entries
      expect(settings).toEqual({
        enabled: true,
        siteEnabled: { 'leetcode.com': true, 'leetcode.cn': true, 'takeuforward.org': true, 'geeksforgeeks.org': true },
        customPairs: {
          'python': [['(', ')']], // Preserved valid entry
          'typescript': [['{', '}']] // Preserved valid entry
          // Invalid entries (javascript, java, 123) are filtered out
        },
        debugMode: false
      });
    });
  });
});
