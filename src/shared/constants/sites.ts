/**
 * Configuration for supported coding sites.
 * Currently supports: LeetCode, TakeUForward, GeeksForGeeks.
 * Architecture allows easy addition of new sites in the future.
 */

/** Editor type used by a site. */
export type EditorType = 'monaco' | 'ace';

export interface SiteConfig {
  /** Type of editor used. */
  editor: EditorType;
  /** CSS selectors to find the editor. */
  selectors: string[];
  /** How to wait for the editor to load. */
  waitStrategy: string;
  /** Editor-specific API information. */
  editorApi: Record<string, unknown>;
}

const MONACO_CONFIG: SiteConfig = {
  editor: 'monaco',
  selectors: ['.monaco-editor'],
  waitStrategy: 'mutation-observer',
  editorApi: {
    namespace: 'monaco',
    getEditors: () => window.monaco?.editor?.getEditors?.() || [],
    keyCode: {
      Tab: 2, // monaco.KeyCode.Tab
    },
  },
};

const LEETCODE_CONFIG: SiteConfig = { ...MONACO_CONFIG };
const TAKEUFORWARD_CONFIG: SiteConfig = { ...MONACO_CONFIG };

const ACE_CONFIG: SiteConfig = {
  editor: 'ace',
  selectors: ['.ace_editor'],
  waitStrategy: 'mutation-observer',
  editorApi: {
    namespace: 'ace',
    getEditor: () => {
      const el = document.querySelector('.ace_editor');
      return el && window.ace?.edit?.(el);
    },
  },
};

const GFG_CONFIG: SiteConfig = { ...ACE_CONFIG };

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  'leetcode.com': LEETCODE_CONFIG,
  'leetcode.cn': LEETCODE_CONFIG,
  'takeuforward.org': TAKEUFORWARD_CONFIG,
  'geeksforgeeks.org': GFG_CONFIG,
};

/**
 * Get site configuration for the current domain.
 */
export function getSiteConfig(hostname: string | null | undefined): SiteConfig | null {
  // Handle null/undefined hostnames
  if (!hostname || typeof hostname !== 'string') {
    return null;
  }

  // Convert to lowercase for case-insensitive domain matching (RFC 1035)
  const normalizedHostname = hostname.toLowerCase();

  // Handle subdomains (e.g., cn.leetcode.com -> leetcode.com) using secure
  // domain matching to prevent malicious domain attacks.
  for (const domain of Object.keys(SITE_CONFIGS)) {
    if (normalizedHostname === domain || normalizedHostname.endsWith('.' + domain)) {
      return SITE_CONFIGS[domain];
    }
  }
  return null;
}

/**
 * Get the list of all supported domains.
 */
export function getSupportedDomains(): string[] {
  return Object.keys(SITE_CONFIGS);
}

/**
 * Check if the current site is supported.
 */
export function isSupportedSite(hostname: string | null | undefined): boolean {
  return getSiteConfig(hostname) !== null;
}
