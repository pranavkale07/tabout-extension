import { getSiteConfig, isSupportedSite } from '../../src/shared/constants/sites.js';
import { SITES_TEST_CASES } from '../fixtures/test-data.js';

describe('sites', () => {
  describe('getSiteConfig', () => {
    test('should return leetcode config for leetcode.com', () => {
      const config = getSiteConfig('leetcode.com');
      
      expect(config).toBeDefined();
      expect(config.editor).toBe('monaco');
      expect(config.selectors).toEqual(['.monaco-editor']);
      expect(config.waitStrategy).toBe('mutation-observer');
    });

    test('should return leetcode config for www.leetcode.com', () => {
      const config = getSiteConfig('www.leetcode.com');
      
      expect(config).toBeDefined();
      expect(config.editor).toBe('monaco');
      expect(config.selectors).toEqual(['.monaco-editor']);
    });

    test('should return leetcode config for contest.leetcode.com', () => {
      const config = getSiteConfig('contest.leetcode.com');
      
      expect(config).toBeDefined();
      expect(config.editor).toBe('monaco');
      expect(config.selectors).toEqual(['.monaco-editor']);
    });

    test('should return leetcode config for leetcode.cn', () => {
      const config = getSiteConfig('leetcode.cn');
      
      expect(config).toBeDefined();
      expect(config.editor).toBe('monaco');
      expect(config.selectors).toEqual(['.monaco-editor']);
      expect(config.waitStrategy).toBe('mutation-observer');
    });

    test('should return leetcode config for www.leetcode.cn', () => {
      const config = getSiteConfig('www.leetcode.cn');
      
      expect(config).toBeDefined();
      expect(config.editor).toBe('monaco');
      expect(config.selectors).toEqual(['.monaco-editor']);
    });

    test('should return null for unsupported domain', () => {
      const config = getSiteConfig('example.com');
      
      expect(config).toBeNull();
    });

    test('should return null for empty hostname', () => {
      const config = getSiteConfig('');
      
      expect(config).toBeNull();
    });

    test('should return null for undefined hostname', () => {
      const config = getSiteConfig(undefined);
      
      expect(config).toBeNull();
    });

    test('should return null for null hostname', () => {
      const config = getSiteConfig(null);
      
      expect(config).toBeNull();
    });

    // Test all cases from fixtures
    SITES_TEST_CASES.forEach(({ hostname, expected, description }) => {
      test(`should handle ${description}: "${hostname}"`, () => {
        const isSupported = isSupportedSite(hostname);
        
        expect(isSupported).toBe(expected);
      });
    });
  });

  describe('isSupportedSite', () => {
    test('should return true for leetcode.com', () => {
      expect(isSupportedSite('leetcode.com')).toBe(true);
    });

    test('should return true for www.leetcode.com', () => {
      expect(isSupportedSite('www.leetcode.com')).toBe(true);
    });

    test('should return true for contest.leetcode.com', () => {
      expect(isSupportedSite('contest.leetcode.com')).toBe(true);
    });

    test('should return true for leetcode.cn', () => {
      expect(isSupportedSite('leetcode.cn')).toBe(true);
    });

    test('should return true for www.leetcode.cn', () => {
      expect(isSupportedSite('www.leetcode.cn')).toBe(true);
    });

    test('should return false for example.com', () => {
      expect(isSupportedSite('example.com')).toBe(false);
    });

    test('should return false for empty hostname', () => {
      expect(isSupportedSite('')).toBe(false);
    });

    test('should return false for undefined hostname', () => {
      expect(isSupportedSite(undefined)).toBe(false);
    });

    test('should return false for null hostname', () => {
      expect(isSupportedSite(null)).toBe(false);
    });

    // Test edge cases
    test('should handle case sensitivity', () => {
      expect(isSupportedSite('LEETCODE.COM')).toBe(true);
      expect(isSupportedSite('LeetCode.Com')).toBe(true);
      expect(isSupportedSite('LEETCODE.CN')).toBe(true);
      expect(isSupportedSite('LeetCode.Cn')).toBe(true);
    });

    test('should handle malformed hostnames', () => {
      expect(isSupportedSite('leetcode.com.')).toBe(false);
      expect(isSupportedSite('.leetcode.com')).toBe(true); // This is actually a valid subdomain
      expect(isSupportedSite('leetcode..com')).toBe(false);
    });

    test('should handle special characters', () => {
      expect(isSupportedSite('leetcode.com:8080')).toBe(false);
      expect(isSupportedSite('leetcode.com/path')).toBe(false);
      expect(isSupportedSite('leetcode.com?query=test')).toBe(false);
    });
  });

  describe('domain matching logic', () => {
    test('should not match partial domains', () => {
      expect(isSupportedSite('leetcode')).toBe(false);
      expect(isSupportedSite('leetcode.co')).toBe(false);
      expect(isSupportedSite('leetcode.comm')).toBe(false);
    });

    test('should handle subdomains correctly', () => {
      expect(isSupportedSite('a.leetcode.com')).toBe(true);
      expect(isSupportedSite('a.b.leetcode.com')).toBe(true);
      expect(isSupportedSite('a.b.c.leetcode.com')).toBe(true);
      expect(isSupportedSite('a.leetcode.cn')).toBe(true);
      expect(isSupportedSite('a.b.leetcode.cn')).toBe(true);
    });

    test('should handle edge cases with dots', () => {
      expect(isSupportedSite('leetcode.com.')).toBe(false);
      expect(isSupportedSite('.leetcode.com')).toBe(true); // This is actually a valid subdomain
      expect(isSupportedSite('leetcode..com')).toBe(false);
    });
  });
});
