import { StorageManager } from '../shared/utils/storage.js';
import { getSupportedDomains, getSiteConfig } from '../shared/constants/sites.js';

/**
 * Options page controller
 */
class OptionsPage {
  constructor() {
    this.elements = {};
    this.siteElements = new Map(); // Map to store dynamically created site elements
    this.statusTimeout = null;
  }
  
  /**
   * Initialize the options page
   */
  async initialize() {
    this.bindElements();
    this.generateSiteSettings();
    this.bindEventListeners();
    await this.loadSettings();
  }
  
  /**
   * Bind static DOM elements
   */
  bindElements() {
    this.elements = {
      globalEnabled: document.getElementById('globalEnabled'),
      debugMode: document.getElementById('debugMode'),
      siteSettings: document.getElementById('siteSettings'),
      status: document.getElementById('status'),
      statusPill: document.getElementById('statusPill'),
      linkGithub: document.getElementById('linkGithub'),
      linkReport: document.getElementById('linkReport'),
      linkFeature: document.getElementById('linkFeature'),
      linkDonate: document.getElementById('linkDonate')
    };
  }
  
  /**
   * Dynamically generate site settings from supported domains
   * Single source of truth from SITE_CONFIGS
   */
  generateSiteSettings() {
    const supportedDomains = getSupportedDomains();
    
    // Hide site settings section since we only support LeetCode for now
    // TODO: Remove this when adding more sites
    if (supportedDomains.length <= 1) {
      this.elements.siteSettings.innerHTML = '<p style="color: #666; font-style: italic; text-align: center; padding: 20px;">Site-specific settings will appear here when more platforms are supported.</p>';
      return;
    }
    
    supportedDomains.forEach(domain => {
      const siteConfig = getSiteConfig(domain);
      const siteName = this.formatSiteName(domain);
      
      // Create setting container
      const settingDiv = document.createElement('div');
      settingDiv.className = 'setting';
      
      // Create setting info
      const settingInfo = document.createElement('div');
      settingInfo.className = 'setting-info';
      
      const titleElement = document.createElement('h3');
      titleElement.textContent = siteName;
      
      const descElement = document.createElement('p');
      descElement.textContent = `Enable tabout on ${domain} (${siteConfig.editor} editor)`;
      
      settingInfo.appendChild(titleElement);
      settingInfo.appendChild(descElement);
      
      // Create toggle
      const toggleLabel = document.createElement('label');
      toggleLabel.className = 'toggle';
      
      const toggleInput = document.createElement('input');
      toggleInput.type = 'checkbox';
      toggleInput.id = `${domain.replace('.', '')}Enabled`;
      
      const slider = document.createElement('span');
      slider.className = 'slider';
      
      toggleLabel.appendChild(toggleInput);
      toggleLabel.appendChild(slider);
      
      // Assemble setting
      settingDiv.appendChild(settingInfo);
      settingDiv.appendChild(toggleLabel);
      
      // Add to container
      this.elements.siteSettings.appendChild(settingDiv);
      
      // Store reference for easy access
      this.siteElements.set(domain, toggleInput);
    });
  }
  
  /**
   * Format domain name for display
   * @param {string} domain - Domain name
   * @returns {string} - Formatted site name
   */
  formatSiteName(domain) {
    const nameMap = {
      'leetcode.com': 'LeetCode'
      // Future sites can be added here automatically
    };
    return nameMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1).replace('.com', '');
  }
  
  /**
   * Load current settings from storage
   */
  async loadSettings() {
    try {
      const settings = await StorageManager.getSettings();
      
      // Set global settings
      this.elements.globalEnabled.checked = settings.enabled;
      this.elements.debugMode.checked = settings.debugMode;
      
      // Update header status pill
      if (this.elements.statusPill) {
        this.elements.statusPill.textContent = settings.enabled ? 'Enabled' : 'Disabled';
        this.elements.statusPill.classList.toggle('enabled', !!settings.enabled);
        this.elements.statusPill.classList.toggle('disabled', !settings.enabled);
      }
      
      // Set site-specific settings dynamically
      this.siteElements.forEach((element, domain) => {
        element.checked = settings.siteEnabled[domain] ?? true;
      });
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }
  
  /**
   * Bind event listeners for all elements
   */
  bindEventListeners() {
    // Global settings
    this.elements.globalEnabled.addEventListener('change', () => {
      this.saveSetting('enabled', this.elements.globalEnabled.checked);
      // Reflect immediately on status pill
      if (this.elements.statusPill) {
        const enabled = this.elements.globalEnabled.checked;
        this.elements.statusPill.textContent = enabled ? 'Enabled' : 'Disabled';
        this.elements.statusPill.classList.toggle('enabled', enabled);
        this.elements.statusPill.classList.toggle('disabled', !enabled);
      }
    });
    
    this.elements.debugMode.addEventListener('change', () => {
      this.saveSetting('debugMode', this.elements.debugMode.checked);
    });
    
    // Dynamic site settings - single source of truth
    this.siteElements.forEach((element, domain) => {
      element.addEventListener('change', () => {
        this.saveSiteSetting(domain, element.checked);
      });
    });
    
    // External links
    const repo = 'https://github.com/pranavkale07/tabout-extension';
    if (this.elements.linkGithub) {
      this.elements.linkGithub.href = repo;
    }
    if (this.elements.linkReport) {
      const issueUrl = `${repo}/issues/new?labels=bug&title=%5BBug%5D%3A%20&body=Describe%20the%20bug%20with%20steps%20to%20reproduce%2C%20expected%20vs%20actual%2C%20and%20environment.`;
      this.elements.linkReport.href = issueUrl;
    }
    if (this.elements.linkFeature) {
      const featureUrl = `${repo}/issues/new?labels=enhancement&title=%5BFeature%5D%3A%20&body=Describe%20the%20use%20case%20and%20benefit.`;
      this.elements.linkFeature.href = featureUrl;
    }
    if (this.elements.linkDonate) {
      // Temporary donation link
      this.elements.linkDonate.href = 'https://www.buymeacoffee.com/';
    }
  }
  
  /**
   * Save a general setting
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   */
  async saveSetting(key, value) {
    try {
      await StorageManager.updateSetting(key, value);
      this.showStatus('Settings saved!', 'success');
    } catch (error) {
      console.error('Failed to save setting:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }
  
  /**
   * Save a site-specific setting
   * @param {string} site - Site domain
   * @param {boolean} enabled - Whether enabled for this site
   */
  async saveSiteSetting(site, enabled) {
    try {
      const settings = await StorageManager.getSettings();
      const updatedSiteEnabled = {
        ...settings.siteEnabled,
        [site]: enabled
      };
      
      await StorageManager.updateSetting('siteEnabled', updatedSiteEnabled);
      this.showStatus('Settings saved!', 'success');
    } catch (error) {
      console.error('Failed to save site setting:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }
  
  /**
   * Show status message
   * @param {string} message - Status message
   * @param {string} type - Status type (success, error)
   */
  showStatus(message, type = 'success') {
    const statusEl = this.elements.status;
    
    // Clear existing timeout
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }
    
    // Set message and style
    statusEl.textContent = message;
    statusEl.className = `status ${type} show`;
    
    // Hide after 3 seconds  
    const STATUS_DISPLAY_DURATION_MS = 3000;
    this.statusTimeout = setTimeout(() => {
      statusEl.classList.remove('show');
    }, STATUS_DISPLAY_DURATION_MS);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage().initialize();
});