import { StorageManager } from '../shared/utils/storage';
import { getSupportedDomains } from '../shared/constants/sites';

interface OptionsElements {
  globalEnabled: HTMLInputElement;
  debugMode: HTMLInputElement;
  status: HTMLElement;
  statusPill: HTMLElement | null;
  linkGithub: HTMLAnchorElement | null;
  linkReport: HTMLAnchorElement | null;
  linkFeature: HTMLAnchorElement | null;
  linkDonate: HTMLAnchorElement | null;
  linkRequestPlatform: HTMLAnchorElement | null;
}

/**
 * Options page controller.
 */
class OptionsPage {
  private elements!: OptionsElements;
  /** Per-site toggle inputs, keyed by domain (reserved for future use). */
  private siteElements = new Map<string, HTMLInputElement>();
  private statusTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize the options page.
   */
  async initialize(): Promise<void> {
    this.bindElements();
    this.generateSiteSettings();
    this.bindEventListeners();
    await this.loadSettings();
  }

  /**
   * Bind static DOM elements.
   */
  bindElements(): void {
    this.elements = {
      globalEnabled: document.getElementById('globalEnabled') as HTMLInputElement,
      debugMode: document.getElementById('debugMode') as HTMLInputElement,
      status: document.getElementById('status') as HTMLElement,
      statusPill: document.getElementById('statusPill'),
      linkGithub: document.getElementById('linkGithub') as HTMLAnchorElement | null,
      linkReport: document.getElementById('linkReport') as HTMLAnchorElement | null,
      linkFeature: document.getElementById('linkFeature') as HTMLAnchorElement | null,
      linkDonate: document.getElementById('linkDonate') as HTMLAnchorElement | null,
      linkRequestPlatform: document.getElementById('linkRequestPlatform') as HTMLAnchorElement | null,
    };
  }

  /**
   * Dynamically generate the supported-sites list from supported domains.
   * Single source of truth from SITE_CONFIGS.
   */
  generateSiteSettings(): void {
    const container = document.querySelector('.supported-sites');
    if (!container) return;

    const supportedDomains = getSupportedDomains();

    // LeetCode (leetcode.com) is already hardcoded in the HTML.
    // Skip leetcode.cn as it's the same platform.
    supportedDomains.forEach((domain) => {
      if (domain === 'leetcode.com' || domain === 'leetcode.cn') return;

      const siteName = this.formatSiteName(domain);

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
   * Format a domain name for display.
   */
  formatSiteName(domain: string): string {
    const nameMap: Record<string, string> = {
      'leetcode.com': 'LeetCode',
      'leetcode.cn': 'LeetCode (CN)',
      'takeuforward.org': 'TakeUForward',
      'geeksforgeeks.org': 'GeeksForGeeks',
    };
    return nameMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1).replace('.com', '');
  }

  /**
   * Load current settings from storage.
   */
  async loadSettings(): Promise<void> {
    try {
      const settings = await StorageManager.getSettings();

      this.elements.globalEnabled.checked = settings.enabled;
      this.elements.debugMode.checked = settings.debugMode;

      if (this.elements.statusPill) {
        this.elements.statusPill.textContent = settings.enabled ? 'Enabled' : 'Disabled';
        this.elements.statusPill.classList.toggle('enabled', !!settings.enabled);
        this.elements.statusPill.classList.toggle('disabled', !settings.enabled);
      }

      this.siteElements.forEach((element, domain) => {
        element.checked = settings.siteEnabled[domain] ?? true;
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }

  /**
   * Bind event listeners for all elements.
   */
  bindEventListeners(): void {
    this.elements.globalEnabled.addEventListener('change', () => {
      this.saveSetting('enabled', this.elements.globalEnabled.checked);
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
      this.elements.linkReport.href = `${repo}/issues/new?labels=bug&title=%5BBug%5D%3A%20&body=Describe%20the%20bug%20with%20steps%20to%20reproduce%2C%20expected%20vs%20actual%2C%20and%20environment.`;
    }
    if (this.elements.linkFeature) {
      this.elements.linkFeature.href = `${repo}/issues/new?labels=enhancement&title=%5BFeature%5D%3A%20&body=Describe%20the%20use%20case%20and%20benefit.`;
    }
    if (this.elements.linkRequestPlatform) {
      this.elements.linkRequestPlatform.href = `${repo}/issues/new?labels=enhancement&title=%5BPlatform%20Support%5D%3A%20&body=Which%20platform%20should%20TabOut%20support%3F%20Please%20add%20links%20and%20details.`;
    }
    if (this.elements.linkDonate) {
      this.elements.linkDonate.href = 'https://www.buymeacoffee.com/prxnav';
    }
  }

  /**
   * Save a general setting.
   */
  async saveSetting(key: string, value: unknown): Promise<void> {
    try {
      await StorageManager.updateSetting(key, value);
      this.showStatus('Settings saved!', 'success');
    } catch (error) {
      console.error('Failed to save setting:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  /**
   * Save a site-specific setting.
   */
  async saveSiteSetting(site: string, enabled: boolean): Promise<void> {
    try {
      const settings = await StorageManager.getSettings();
      const updatedSiteEnabled = {
        ...settings.siteEnabled,
        [site]: enabled,
      };

      await StorageManager.updateSetting('siteEnabled', updatedSiteEnabled);
      this.showStatus('Settings saved!', 'success');
    } catch (error) {
      console.error('Failed to save site setting:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  /**
   * Show a status message.
   */
  showStatus(message: string, type: 'success' | 'error' = 'success'): void {
    const statusEl = this.elements.status;

    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    statusEl.textContent = message;
    statusEl.className = `status ${type} show`;

    const STATUS_DISPLAY_DURATION_MS = 3000;
    this.statusTimeout = setTimeout(() => {
      statusEl.classList.remove('show');
    }, STATUS_DISPLAY_DURATION_MS);
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage().initialize();
});
