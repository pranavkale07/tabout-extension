import { StorageManager } from '../shared/utils/storage.js';
import { getSiteConfig, isSupportedSite, getSupportedDomains } from '../shared/constants/sites.js';

/**
 * Popup controller for quick actions and status
 */
class PopupController {
  constructor() {
    this.currentTab = null;
    this.elements = {};
  }
  
  /**
   * Initialize the popup
   */
  async initialize() {
    this.bindElements();
    this.bindEventListeners();
    await this.getCurrentTab();
    await this.loadCurrentState();
    await this.updateUI();
  }
  
  /**
   * Bind DOM elements
   */
  bindElements() {
    this.elements = {
      currentSite: document.getElementById('currentSite'),
      globalEnabled: document.getElementById('globalEnabled'),
      siteEnabled: document.getElementById('siteEnabled'),
      siteToggle: document.getElementById('siteToggle'),
      siteToggleLabel: document.getElementById('siteToggleLabel'),
      siteStatusIcon: document.getElementById('siteStatusIcon'),
      siteStatusText: document.getElementById('siteStatusText'),
      editorStatusIcon: document.getElementById('editorStatusIcon'),
      editorStatusText: document.getElementById('editorStatusText'),
      openOptions: document.getElementById('openOptions'),
      mainToggle: document.getElementById('mainToggle')
    };
  }
  
  /**
   * Bind event listeners
   */
  bindEventListeners() {
    // Global toggle
    this.elements.globalEnabled.addEventListener('change', () => {
      this.handleGlobalToggle();
    });
    
    // Site-specific toggle
    this.elements.siteEnabled.addEventListener('change', () => {
      this.handleSiteToggle();
    });
    
    // Open full options
    this.elements.openOptions.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
      window.close();
    });
    
    // Main toggle click area
    this.elements.mainToggle.addEventListener('click', (e) => {
      if (e.target === this.elements.mainToggle) {
        this.elements.globalEnabled.click();
      }
    });
  }
  
  /**
   * Get current active tab
   */
  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  }
  
  /**
   * Load current extension state
   */
  async loadCurrentState() {
    try {
      this.settings = await StorageManager.getSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { enabled: false, siteEnabled: {} };
    }
  }
  
  /**
   * Update UI based on current state
   */
  async updateUI() {
    if (!this.currentTab) {
      this.showError('Unable to detect current tab');
      return;
    }
    
    const hostname = new URL(this.currentTab.url).hostname;
    const siteConfig = getSiteConfig(hostname);
    const isSupported = isSupportedSite(hostname);
    
    // Update site display
    this.elements.currentSite.textContent = hostname;
    
    // Update global toggle
    this.elements.globalEnabled.checked = this.settings.enabled;
    
    // Update site status
    if (isSupported) {
      this.elements.siteStatusIcon.className = 'status-icon active';
      this.elements.siteStatusText.textContent = this.formatSiteName(hostname);
      
      // Hide site-specific toggle since we only support LeetCode for now
      // TODO: Re-enable when adding more sites
      this.elements.siteToggle.style.display = 'none';
      
      // Still track the setting internally for future use
      const siteEnabled = await this.getSiteEnabledStatus(hostname);
      this.elements.siteEnabled.checked = siteEnabled;
      
      // Update editor status based on site config (more reliable than detection)
      if (siteConfig) {
        this.updateEditorStatus(siteConfig.editor, true); // Pass true to indicate it's active
        await this.checkEditorPresence();
      }
    } else {
      this.elements.siteStatusIcon.className = 'status-icon inactive';
      this.elements.siteStatusText.textContent = 'Not Supported';
      this.elements.siteToggle.style.display = 'none';
      this.updateEditorStatus('Unknown', false);
    }
  }
  
  /**
   * Format domain name for display
   * @param {string} hostname - Hostname to format
   * @returns {string} - Formatted site name
   */
  formatSiteName(hostname) {
    const nameMap = {
      'leetcode.com': 'LeetCode'
      // Future sites can be added here automatically
    };
    
    // Find matching domain (handle subdomains)
    for (const [domain, displayName] of Object.entries(nameMap)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return displayName;
      }
    }
    
    // Fallback: capitalize first letter
    return hostname.charAt(0).toUpperCase() + hostname.slice(1).replace('.com', '');
  }

  /**
   * Get site-enabled status for hostname
   */
  async getSiteEnabledStatus(hostname) {
    const siteEnabled = this.settings.siteEnabled || {};
    
    // Check for exact match or domain match with secure matching
    for (const domain of Object.keys(siteEnabled)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return siteEnabled[domain];
      }
    }
    
    return true; // Default enabled for supported sites
  }
  
  /**
   * Update editor status display
   */
  updateEditorStatus(editorType, isActive = false) {
    const displayName = this.formatEditorName(editorType);
    this.elements.editorStatusText.textContent = isActive ? `${displayName} (Active)` : displayName;
    this.elements.editorStatusIcon.className = isActive ? 'status-icon active' : 'status-icon unknown';
  }
  
  /**
   * Format editor type for display
   */
  formatEditorName(editorType) {
    const nameMap = {
      'monaco': 'Monaco',
      'codemirror': 'CodeMirror'
    };
    return nameMap[editorType?.toLowerCase()] || editorType || 'Unknown';
  }
  
  /**
   * Check if editor is present on current page
   * (Optional verification - doesn't override the status set by updateEditorStatus)
   */
  async checkEditorPresence() {
    if (!this.currentTab) return;
    
    try {
      // Only perform verification, don't override the display
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: this.detectEditorOnPage
      });
      
      if (results && results[0] && results[0].result) {
        const { detected } = results[0].result;
        if (!detected) {
          // Only show warning if editor is not detected at all
          this.elements.editorStatusIcon.className = 'status-icon inactive';
          this.elements.editorStatusText.textContent = 'Monaco (Loading...)';
        }
        // If detected, keep the existing status from updateEditorStatus
      }
    } catch (error) {
      // Silently fail - might not have permission on this tab
      console.log('Could not check editor presence:', error.message);
    }
  }
  
  /**
   * Function injected into page to detect editor
   * (This runs in the page context)
   */
  detectEditorOnPage() {
    // Simple detection - just check if any editor infrastructure is present
    
    // Check for Monaco
    if (window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getEditors();
      if (editors && editors.length > 0) {
        return { detected: true };
      }
    }
    
    // Check for CodeMirror
    if (document.querySelector('.CodeMirror') || document.querySelector('.cm-editor')) {
      return { detected: true };
    }
    
    // Check for our extension marker  
    if (window.__TABOUT_EXTENSION_LOADED) {
      return { detected: true };
    }
    
    return { detected: false };
  }
  
  /**
   * Handle global toggle change
   */
  async handleGlobalToggle() {
    try {
      const enabled = this.elements.globalEnabled.checked;
      await StorageManager.updateSetting('enabled', enabled);
      
      // Update local state
      this.settings.enabled = enabled;
      
      console.log('Global tabout:', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Failed to update global setting:', error);
      // Revert checkbox on error
      this.elements.globalEnabled.checked = !this.elements.globalEnabled.checked;
    }
  }
  
  /**
   * Handle site-specific toggle change
   */
  async handleSiteToggle() {
    if (!this.currentTab) return;
    
    try {
      const hostname = new URL(this.currentTab.url).hostname;
      const enabled = this.elements.siteEnabled.checked;
      
      // Find the domain key for this hostname with secure matching
      let domainKey = null;
      const supportedDomains = getSupportedDomains(); // Single source of truth
      for (const domain of supportedDomains) {
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          domainKey = domain;
          break;
        }
      }
      
      if (domainKey) {
        const updatedSiteEnabled = {
          ...this.settings.siteEnabled,
          [domainKey]: enabled
        };
        
        await StorageManager.updateSetting('siteEnabled', updatedSiteEnabled);
        
        // Update local state
        this.settings.siteEnabled = updatedSiteEnabled;
        
        console.log(`${domainKey} tabout:`, enabled ? 'enabled' : 'disabled');
      }
    } catch (error) {
      console.error('Failed to update site setting:', error);
      // Revert checkbox on error
      this.elements.siteEnabled.checked = !this.elements.siteEnabled.checked;
    }
  }
  
  /**
   * Show error state
   */
  showError(message) {
    this.elements.currentSite.textContent = message;
    this.elements.siteStatusText.textContent = 'Error';
    this.elements.editorStatusText.textContent = 'Error';
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController().initialize();
});
