/**
 * @typedef {Object} SiteConfig
 * @property {string} editor - Type of editor used
 * @property {string[]} selectors - CSS selectors to find editor
 * @property {string} waitStrategy - How to wait for editor to load
 * @property {Object} editorApi - Editor-specific API information
 */

/**
 * Configuration for supported coding sites
 * Currently supports: LeetCode, TakeUForward
 * Architecture allows easy addition of new sites in the future
 */
const MONACO_CONFIG = {
  editor: 'monaco',
  selectors: ['.monaco-editor'],
  waitStrategy: 'mutation-observer',
  editorApi: {
    namespace: 'monaco',
    getEditors: () => window.monaco?.editor?.getEditors?.() || [],
    keyCode: {
      Tab: 2 // monaco.KeyCode.Tab
    }
  }
};
const LEETCODE_CONFIG = {
  ...MONACO_CONFIG,
};

const TAKEUFORWARD_CONFIG = {
  ...MONACO_CONFIG,
};

const ACE_CONFIG = {
  editor: 'ace',
  selectors: ['.ace_editor'],
  waitStrategy: 'mutation-observer',
  editorApi: {
    namespace: 'ace',
    getEditor: () => {
      const el = document.querySelector('.ace_editor');
      return el && window.ace?.edit?.(el);
    }
  }
};

const GFG_CONFIG = {
  ...ACE_CONFIG,
};

export const SITE_CONFIGS = {
  'leetcode.com': LEETCODE_CONFIG,
  'leetcode.cn': LEETCODE_CONFIG,
  'takeuforward.org': TAKEUFORWARD_CONFIG,
  'geeksforgeeks.org': GFG_CONFIG,
};

/**
 * Get site configuration for current domain
 * @param {string} hostname - Current site hostname
 * @returns {SiteConfig|null} - Site configuration or null if not supported
 */
export function getSiteConfig(hostname) {
  // Handle null/undefined hostnames
  if (!hostname || typeof hostname !== 'string') {
    return null;
  }
  
  // Convert to lowercase for case-insensitive domain matching (RFC 1035)
  const normalizedHostname = hostname.toLowerCase();
  
  // Handle subdomains (e.g., cn.leetcode.com -> leetcode.com) 
  // Use secure domain matching to prevent malicious domain attacks
  for (const domain of Object.keys(SITE_CONFIGS)) {
    if (normalizedHostname === domain || normalizedHostname.endsWith('.' + domain)) {
      return SITE_CONFIGS[domain];
    }
  }
  return null;
}

/**
 * Get list of all supported domains
 * @returns {string[]} - Array of supported domain names
 */
export function getSupportedDomains() {
  return Object.keys(SITE_CONFIGS);
}

/**
 * Check if current site is supported
 * @param {string} hostname - Current site hostname
 * @returns {boolean} - Whether site is supported
 */
export function isSupportedSite(hostname) {
  return getSiteConfig(hostname) !== null;
}
