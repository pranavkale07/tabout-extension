import { StorageManager, type ExtensionSettings } from '../shared/utils/storage';
import { getSiteConfig, isSupportedSite, getSupportedDomains, type SiteConfig } from '../shared/constants/sites';

interface PopupElements {
  currentSite: HTMLElement;
  globalEnabled: HTMLInputElement;
  siteEnabled: HTMLInputElement;
  siteToggle: HTMLElement;
  siteToggleLabel: HTMLElement;
  siteStatusIcon: HTMLElement;
  siteStatusText: HTMLElement;
  editorStatusIcon: HTMLElement;
  editorStatusText: HTMLElement;
  openOptions: HTMLElement;
  mainToggle: HTMLElement;
}

/**
 * Popup controller for quick actions and status.
 */
class PopupController {
  private currentTab: { id?: number; url?: string } | null = null;
  private elements!: PopupElements;
  private settings: ExtensionSettings | { enabled: boolean; siteEnabled: Record<string, boolean> } = {
    enabled: false,
    siteEnabled: {},
  };

  /**
   * Initialize the popup.
   */
  async initialize(): Promise<void> {
    this.bindElements();
    this.bindEventListeners();
    await this.getCurrentTab();
    await this.loadCurrentState();
    await this.updateUI();
  }

  /**
   * Bind DOM elements.
   */
  bindElements(): void {
    const byId = <T extends HTMLElement = HTMLElement>(id: string): T =>
      document.getElementById(id) as T;

    this.elements = {
      currentSite: byId('currentSite'),
      globalEnabled: byId<HTMLInputElement>('globalEnabled'),
      siteEnabled: byId<HTMLInputElement>('siteEnabled'),
      siteToggle: byId('siteToggle'),
      siteToggleLabel: byId('siteToggleLabel'),
      siteStatusIcon: byId('siteStatusIcon'),
      siteStatusText: byId('siteStatusText'),
      editorStatusIcon: byId('editorStatusIcon'),
      editorStatusText: byId('editorStatusText'),
      openOptions: byId('openOptions'),
      mainToggle: byId('mainToggle'),
    };
  }

  /**
   * Bind event listeners.
   */
  bindEventListeners(): void {
    this.elements.globalEnabled.addEventListener('change', () => {
      this.handleGlobalToggle();
    });

    this.elements.siteEnabled.addEventListener('change', () => {
      this.handleSiteToggle();
    });

    this.elements.openOptions.addEventListener('click', () => {
      browser.runtime.openOptionsPage();
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
   * Get the current active tab.
   */
  async getCurrentTab(): Promise<void> {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab ?? null;
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  }

  /**
   * Load the current extension state.
   */
  async loadCurrentState(): Promise<void> {
    try {
      this.settings = await StorageManager.getSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { enabled: false, siteEnabled: {} };
    }
  }

  /**
   * Update the UI based on the current state.
   */
  async updateUI(): Promise<void> {
    if (!this.currentTab || !this.currentTab.url) {
      this.showError('Unable to detect current tab');
      return;
    }

    let hostname: string;
    try {
      hostname = new URL(this.currentTab.url).hostname;
    } catch {
      this.showError('Unable to detect current tab');
      return;
    }

    const siteConfig = getSiteConfig(hostname);
    const isSupported = isSupportedSite(hostname);

    this.elements.currentSite.textContent = hostname;
    this.elements.globalEnabled.checked = this.settings.enabled;

    if (isSupported) {
      this.elements.siteStatusIcon.className = 'status-icon active';
      this.elements.siteStatusText.textContent = this.formatSiteName(hostname);

      // Site-specific toggle is hidden for now (single global control).
      this.elements.siteToggle.style.display = 'none';

      // Still track the setting internally for future use
      const siteEnabled = await this.getSiteEnabledStatus(hostname);
      this.elements.siteEnabled.checked = siteEnabled;

      if (siteConfig) {
        this.updateEditorStatus(siteConfig.editor, true);
        await this.checkEditorPresence(siteConfig);
      }
    } else {
      this.elements.siteStatusIcon.className = 'status-icon inactive';
      this.elements.siteStatusText.textContent = 'Not Supported';
      this.elements.siteToggle.style.display = 'none';
      this.updateEditorStatus('Unknown', false);
    }
  }

  /**
   * Format a domain name for display.
   */
  formatSiteName(hostname: string): string {
    const nameMap: Record<string, string> = {
      'leetcode.com': 'LeetCode',
      'leetcode.cn': 'LeetCode (CN)',
      'takeuforward.org': 'TakeUForward',
      'geeksforgeeks.org': 'GeeksForGeeks',
    };

    for (const [domain, displayName] of Object.entries(nameMap)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return displayName;
      }
    }

    return hostname.charAt(0).toUpperCase() + hostname.slice(1).replace('.com', '');
  }

  /**
   * Get the site-enabled status for a hostname.
   */
  async getSiteEnabledStatus(hostname: string): Promise<boolean> {
    const siteEnabled = this.settings.siteEnabled || {};

    for (const domain of Object.keys(siteEnabled)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return siteEnabled[domain];
      }
    }

    return true; // Default enabled for supported sites
  }

  /**
   * Update the editor status display.
   */
  updateEditorStatus(editorType: string, isActive = false): void {
    const displayName = this.formatEditorName(editorType);
    this.elements.editorStatusText.textContent = isActive ? `${displayName} (Active)` : displayName;
    this.elements.editorStatusIcon.className = isActive ? 'status-icon active' : 'status-icon unknown';
  }

  /**
   * Format an editor type for display.
   */
  formatEditorName(editorType: string): string {
    const nameMap: Record<string, string> = {
      monaco: 'Monaco',
      ace: 'Ace',
      codemirror: 'CodeMirror',
    };
    return nameMap[editorType?.toLowerCase()] || editorType || 'Unknown';
  }

  /**
   * Check if the editor is present on the current page.
   * (Optional verification - doesn't override the status set by updateEditorStatus.)
   */
  async checkEditorPresence(siteConfig: SiteConfig): Promise<void> {
    if (!this.currentTab || this.currentTab.id == null) return;

    try {
      const results = await browser.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: this.detectEditorOnPage,
      });

      const result = results?.[0]?.result as { detected: boolean } | undefined;
      if (result && !result.detected) {
        // Only show warning if the editor is not detected at all
        const editorName = this.formatEditorName(siteConfig.editor);
        this.elements.editorStatusIcon.className = 'status-icon inactive';
        this.elements.editorStatusText.textContent = `${editorName} (Loading...)`;
      }
    } catch (error) {
      // Silently fail - might not have permission on this tab
      console.log('Could not check editor presence:', (error as Error).message);
    }
  }

  /**
   * Function injected into the page to detect the editor.
   * (Runs in the page's DOM.)
   */
  detectEditorOnPage(): { detected: boolean } {
    const monacoElement = document.querySelector('.monaco-editor');
    const aceElement = document.querySelector('.ace_editor');
    return { detected: !!(monacoElement || aceElement) };
  }

  /**
   * Handle a global toggle change.
   */
  async handleGlobalToggle(): Promise<void> {
    try {
      const enabled = this.elements.globalEnabled.checked;
      await StorageManager.updateSetting('enabled', enabled);
      this.settings.enabled = enabled;
      console.log('Global tabout:', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Failed to update global setting:', error);
      this.elements.globalEnabled.checked = !this.elements.globalEnabled.checked;
    }
  }

  /**
   * Handle a site-specific toggle change.
   */
  async handleSiteToggle(): Promise<void> {
    if (!this.currentTab || !this.currentTab.url) return;

    try {
      const hostname = new URL(this.currentTab.url).hostname;
      const enabled = this.elements.siteEnabled.checked;

      let domainKey: string | null = null;
      const supportedDomains = getSupportedDomains();
      for (const domain of supportedDomains) {
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          domainKey = domain;
          break;
        }
      }

      if (domainKey) {
        const updatedSiteEnabled = {
          ...this.settings.siteEnabled,
          [domainKey]: enabled,
        };

        await StorageManager.updateSetting('siteEnabled', updatedSiteEnabled);
        this.settings.siteEnabled = updatedSiteEnabled;
        console.log(`${domainKey} tabout:`, enabled ? 'enabled' : 'disabled');
      }
    } catch (error) {
      console.error('Failed to update site setting:', error);
      this.elements.siteEnabled.checked = !this.elements.siteEnabled.checked;
    }
  }

  /**
   * Show an error state.
   */
  showError(message: string): void {
    this.elements.currentSite.textContent = message;
    this.elements.siteStatusText.textContent = 'Error';
    this.elements.editorStatusText.textContent = 'Error';
  }
}

// Initialize popup when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController().initialize();
});
