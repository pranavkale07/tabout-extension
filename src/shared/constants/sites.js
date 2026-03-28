/**
 * @typedef {Object} SiteConfig
 * @property {string} editor - Type of editor used
 * @property {string[]} selectors - CSS selectors to find editor
 * @property {string} waitStrategy - How to wait for editor to load
 * @property {Object} editorApi - Editor-specific API information
 */

/**
 * Configuration for supported coding sites
 * Currently supports: LeetCode
 * Architecture allows easy addition of new sites in the future
 */
const LEETCODE_CONFIG = {
  editor: 'monaco',
  selectors: ['.monaco-editor'],
  waitStrategy: 'mutation-observer',
  editorApi: {
    namespace: 'monaco',
    getEditors: () => window.monaco?.editor?.getEditors?.() || [],
    keyCode: {
      Tab: 3  // monaco.KeyCode.Tab
    }
  }
};

const GFG_CONFIG = {
  editor: 'ace',
  selectors: [
    '.ace_editor',
  ],
  waitStrategy: 'mutation-observer',
  editorApi: {
    namespace: 'monaco',
    
    getEditors: () =>{
      //if monaco exists in current window
    //get editors, if editors found return them
    if(window.monaco?.editor){
      const editors = window.monaco.editor.getEditors()
        if(editors.length) return editors;
    }
    //check editor inside frame
    //check for all iframes
    //const iframes = document.querySelectorAll('iframe');

    //for every iframe 
    //access window
    // for (const iframe of iframes){
    //   try{
    //     const iframeWindow = iframe.contentWindow; //get iframe's window
    //     //return editor API if iframeWindow exists, monaco is loaded and editor is available
    //     if(iframeWindow?.monaco?.editor){
    //   const editors = iframeWindow.monaco.editor.getEditors()
    //     if(editors.length) return editors;
    //     }
    // } catch(e){
    //   // cross origin iframe =>ignore
    // }
    // }

    //load window Ace
    if(window.ace) {
      //intialize code editor instance 
      // returns API object
      const el = document.querySelector('.ace_editor');
      if (el && el.env && el.env.editor) {
        return [el.env.editor];
      }
    }
    //CodeMirror
    const cm = document.querySelector('.CodeMirror');
    if (cm) return [cm]

    return [];
    },
    keyCode: {
      Tab: 3  // monaco.KeyCode.Tab
    }
  }
};

export const SITE_CONFIGS = {
  'leetcode.com': LEETCODE_CONFIG,
  'leetcode.cn': LEETCODE_CONFIG,
  // Future sites can be added here:
  'geeksforgeeks.org': GFG_CONFIG,
  // 'takeuforward.org': { ... }
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
