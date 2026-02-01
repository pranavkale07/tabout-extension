import { StorageManager } from '../shared/utils/storage.js';
import { getSupportedDomains, getSiteConfig } from '../shared/constants/sites.js';
import { DEFAULT_JUMP_MARKERS, JUMP_TEMPLATES } from '../shared/constants/jump-points.js';

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
      status: document.getElementById('status'),
      statusPill: document.getElementById('statusPill'),
      linkGithub: document.getElementById('linkGithub'),
      linkReport: document.getElementById('linkReport'),
      linkFeature: document.getElementById('linkFeature'),
      linkDonate: document.getElementById('linkDonate'),
      linkRequestPlatform: document.getElementById('linkRequestPlatform'),
      // Jump points elements
      jumpPointsEnabled: document.getElementById('jumpPointsEnabled'),
      jumpPointsWrap: document.getElementById('jumpPointsWrap'),
      jumpPointsCaseSensitive: document.getElementById('jumpPointsCaseSensitive'),
      markersGrid: document.getElementById('markersGrid'),
      customMarkerInput: document.getElementById('customMarkerInput'),
      addMarkerBtn: document.getElementById('addMarkerBtn'),
      templateCopied: document.getElementById('templateCopied')
    };
  }
  
  /**
   * Dynamically generate site settings from supported domains
   * Single source of truth from SITE_CONFIGS
   */
  generateSiteSettings() {
    const container = document.querySelector('.supported-sites');
    if (!container) return;
    
    const supportedDomains = getSupportedDomains();
    
    // For now, we only support LeetCode and it's already in the HTML
    // When adding more sites, we can dynamically add them here
    if (supportedDomains.length <= 1) {
      return; // LeetCode is already displayed in HTML
    }
    
    // Future: Add more sites dynamically
    supportedDomains.forEach(domain => {
      if (domain === 'leetcode.com') return; // Already in HTML
      
      const siteConfig = getSiteConfig(domain);
      const siteName = this.formatSiteName(domain);
      
      // Create site item
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      
      const siteNameSpan = document.createElement('span');
      siteNameSpan.className = 'site-name';
      siteNameSpan.textContent = siteName;
      
      const siteStatusSpan = document.createElement('span');
      siteStatusSpan.className = 'site-status';
      siteStatusSpan.textContent = 'Active';
      
      siteItem.appendChild(siteNameSpan);
      siteItem.appendChild(siteStatusSpan);
      
      // Insert before the CTA paragraph
      const ctaParagraph = container.querySelector('.site-cta');
      container.insertBefore(siteItem, ctaParagraph);
    });
  }
  
  /**
   * Format domain name for display
   * @param {string} domain - Domain name
   * @returns {string} - Formatted site name
   */
  formatSiteName(domain) {
    const nameMap = {
      'leetcode.com': 'LeetCode',
      'leetcode.cn': 'LeetCode (CN)'
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
      
      // Set jump points settings
      const jumpPoints = settings.jumpPoints || {};
      this.elements.jumpPointsEnabled.checked = jumpPoints.enabled !== false;
      this.elements.jumpPointsWrap.checked = jumpPoints.wrapAround !== false;
      this.elements.jumpPointsCaseSensitive.checked = jumpPoints.caseSensitive === true;
      
      // Load markers
      this.loadMarkers(jumpPoints);
      
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
    
    // Jump points settings
    this.elements.jumpPointsEnabled.addEventListener('change', () => {
      this.saveJumpPointsSetting('enabled', this.elements.jumpPointsEnabled.checked);
    });
    
    this.elements.jumpPointsWrap.addEventListener('change', () => {
      this.saveJumpPointsSetting('wrapAround', this.elements.jumpPointsWrap.checked);
    });
    
    this.elements.jumpPointsCaseSensitive.addEventListener('change', () => {
      this.saveJumpPointsSetting('caseSensitive', this.elements.jumpPointsCaseSensitive.checked);
    });
    
    // Custom marker input
    this.elements.addMarkerBtn.addEventListener('click', () => this.addCustomMarker());
    this.elements.customMarkerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addCustomMarker();
      }
    });
    
    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const template = btn.dataset.template;
        this.copyTemplate(template);
      });
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
    if (this.elements.linkRequestPlatform) {
      const platformUrl = `${repo}/issues/new?labels=enhancement&title=%5BPlatform%20Support%5D%3A%20&body=Which%20platform%20should%20TabOut%20support%3F%20Please%20add%20links%20and%20details.`;
      this.elements.linkRequestPlatform.href = platformUrl;
    }
    if (this.elements.linkDonate) {
      // Temporary donation link
      this.elements.linkDonate.href = 'https://www.buymeacoffee.com/prxnav';
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
  
  /**
   * Load markers grid
   * @param {Object} jumpPoints - Jump points settings
   */
  loadMarkers(jumpPoints) {
    const activeMarkers = jumpPoints.activeMarkers || DEFAULT_JUMP_MARKERS;
    const customMarkers = jumpPoints.customMarkers || [];
    
    const grid = this.elements.markersGrid;
    grid.innerHTML = '';
    
    // Add default markers
    DEFAULT_JUMP_MARKERS.forEach(marker => {
      const chip = this.createMarkerChip(marker, activeMarkers.includes(marker), false);
      grid.appendChild(chip);
    });
    
    // Add custom markers
    customMarkers.forEach(marker => {
      const chip = this.createMarkerChip(marker, activeMarkers.includes(marker), true);
      grid.appendChild(chip);
    });
  }
  
  /**
   * Create a marker chip element
   * @param {string} marker - Marker text
   * @param {boolean} isActive - Whether marker is active
   * @param {boolean} isCustom - Whether marker is custom
   * @returns {HTMLElement} - Marker chip element
   */
  createMarkerChip(marker, isActive, isCustom) {
    const chip = document.createElement('div');
    chip.className = `marker-chip ${isActive ? 'active' : ''} ${isCustom ? 'custom' : ''}`;
    chip.textContent = marker;
    
    if (isCustom) {
      const removeBtn = document.createElement('span');
      removeBtn.className = 'remove-marker';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeCustomMarker(marker);
      });
      chip.appendChild(removeBtn);
    }
    
    chip.addEventListener('click', () => this.toggleMarker(marker));
    
    return chip;
  }
  
  /**
   * Toggle a marker active/inactive
   * @param {string} marker - Marker to toggle
   */
  async toggleMarker(marker) {
    try {
      const settings = await StorageManager.getSettings();
      const jumpPoints = settings.jumpPoints || {};
      let activeMarkers = jumpPoints.activeMarkers || DEFAULT_JUMP_MARKERS.slice();
      
      const index = activeMarkers.indexOf(marker);
      if (index > -1) {
        activeMarkers = activeMarkers.filter(m => m !== marker);
      } else {
        activeMarkers.push(marker);
      }
      
      await this.saveJumpPointsSetting('activeMarkers', activeMarkers);
      this.loadMarkers({...jumpPoints, activeMarkers});
    } catch (error) {
      console.error('Failed to toggle marker:', error);
    }
  }
  
  /**
   * Add a custom marker
   */
  async addCustomMarker() {
    const input = this.elements.customMarkerInput;
    const marker = input.value.trim();
    
    if (!marker) return;
    
    if (marker.length > 30) {
      this.showStatus('Marker too long (max 30 chars)', 'error');
      return;
    }
    
    try {
      const settings = await StorageManager.getSettings();
      const jumpPoints = settings.jumpPoints || {};
      const customMarkers = jumpPoints.customMarkers || [];
      const activeMarkers = jumpPoints.activeMarkers || DEFAULT_JUMP_MARKERS.slice();
      
      if (customMarkers.includes(marker) || DEFAULT_JUMP_MARKERS.includes(marker)) {
        this.showStatus('Marker already exists', 'error');
        return;
      }
      
      const newCustomMarkers = [...customMarkers, marker];
      const newActiveMarkers = [...activeMarkers, marker];
      
      await this.saveJumpPointsSetting('customMarkers', newCustomMarkers);
      await this.saveJumpPointsSetting('activeMarkers', newActiveMarkers);
      
      input.value = '';
      this.loadMarkers({...jumpPoints, customMarkers: newCustomMarkers, activeMarkers: newActiveMarkers});
      this.showStatus('Marker added!', 'success');
    } catch (error) {
      console.error('Failed to add marker:', error);
      this.showStatus('Failed to add marker', 'error');
    }
  }
  
  /**
   * Remove a custom marker
   * @param {string} marker - Marker to remove
   */
  async removeCustomMarker(marker) {
    try {
      const settings = await StorageManager.getSettings();
      const jumpPoints = settings.jumpPoints || {};
      const customMarkers = (jumpPoints.customMarkers || []).filter(m => m !== marker);
      const activeMarkers = (jumpPoints.activeMarkers || DEFAULT_JUMP_MARKERS.slice()).filter(m => m !== marker);
      
      await this.saveJumpPointsSetting('customMarkers', customMarkers);
      await this.saveJumpPointsSetting('activeMarkers', activeMarkers);
      
      this.loadMarkers({...jumpPoints, customMarkers, activeMarkers});
      this.showStatus('Marker removed!', 'success');
    } catch (error) {
      console.error('Failed to remove marker:', error);
      this.showStatus('Failed to remove marker', 'error');
    }
  }
  
  /**
   * Save a jump points setting
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   */
  async saveJumpPointsSetting(key, value) {
    try {
      const settings = await StorageManager.getSettings();
      const jumpPoints = {
        ...settings.jumpPoints,
        [key]: value
      };
      
      await StorageManager.updateSetting('jumpPoints', jumpPoints);
      this.showStatus('Settings saved!', 'success');
    } catch (error) {
      console.error('Failed to save jump points setting:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }
  
  /**
   * Copy a template to clipboard
   * @param {string} templateName - Template name
   */
  copyTemplate(templateName) {
    const template = JUMP_TEMPLATES[templateName];
    if (!template) return;
    
    navigator.clipboard.writeText(template).then(() => {
      const copyIndicator = this.elements.templateCopied;
      copyIndicator.classList.add('show');
      
      setTimeout(() => {
        copyIndicator.classList.remove('show');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy template:', err);
      this.showStatus('Failed to copy template', 'error');
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage().initialize();
});
