import { StorageManager } from '../shared/utils/storage';
import { MessageBus, MESSAGE_TYPES, type TaboutMessage } from '../shared/utils/messaging';
import { isSupportedSite } from '../shared/constants/sites';

/**
 * Main content script - runs in the isolated world.
 */
class ContentScript {
  private currentSite: string;
  private pageScriptInjected = false;
  private isUnloading = false;
  private debugMode = false;

  constructor() {
    this.currentSite = window.location.hostname;

    // Avoid work during unload/navigation where the extension context may be invalid
    window.addEventListener('beforeunload', () => {
      this.isUnloading = true;
    });
  }

  /**
   * Initialize the content script.
   */
  async initialize(): Promise<void> {
    if (this.isUnloading) return;

    if (!isSupportedSite(this.currentSite)) {
      if (this.debugMode) {
        console.log('[Tabout] Site not supported:', this.currentSite);
      }
      return;
    }

    if (this.debugMode) {
      console.log('[Tabout] Initializing on:', this.currentSite);
    }

    await this.injectPageScript();
    await this.sendInitialSettings();
    this.listenForSettingsChanges();
    this.listenForPageMessages();
  }

  /**
   * Inject the page script into the page context.
   */
  async injectPageScript(): Promise<void> {
    if (this.pageScriptInjected) return;
    if (this.isUnloading) return;

    try {
      await this.waitForDocumentHead();

      const script = document.createElement('script');
      script.src = browser.runtime.getURL('page-script.js');
      script.type = 'text/javascript';
      script.onload = () => {
        this.pageScriptInjected = true;
        if (this.debugMode) {
          console.log('[Tabout] Page script injected successfully');
        }
        script.remove(); // Clean up
      };
      script.onerror = () => {
        console.error('[Tabout] Failed to inject page script');
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('[Tabout] Error injecting page script:', error);
    }
  }

  /**
   * Wait for document.head to be available.
   */
  async waitForDocumentHead(): Promise<void> {
    let attempts = 0;
    const MAX_HEAD_WAIT_ATTEMPTS = 20; // 2 seconds max (20 * 100ms)
    const HEAD_WAIT_INTERVAL_MS = 100;

    while (!document.head && attempts < MAX_HEAD_WAIT_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, HEAD_WAIT_INTERVAL_MS));
      attempts++;
    }

    if (!document.head) {
      throw new Error('document.head not available after 2 seconds');
    }
  }

  /**
   * Send initial settings to the page script.
   */
  async sendInitialSettings(): Promise<void> {
    try {
      if (this.isUnloading) return;
      const settings = await StorageManager.getSettings();
      const siteEnabled = await StorageManager.isEnabledForSite(this.currentSite);

      // Store debug mode for this instance
      this.debugMode = settings.debugMode;

      MessageBus.sendToPage(MESSAGE_TYPES.SET_ENABLED, {
        globalEnabled: settings.enabled,
        siteEnabled,
        site: this.currentSite,
      });

      MessageBus.sendToPage(MESSAGE_TYPES.SET_DEBUG_MODE, {
        debugMode: settings.debugMode,
      });

      if (this.debugMode) {
        console.log('[Tabout] Initial settings sent:', {
          enabled: settings.enabled && siteEnabled,
          debugMode: settings.debugMode,
        });
      }
    } catch (error) {
      console.error('[Tabout] Failed to send initial settings:', error);
    }
  }

  /**
   * Listen for storage changes and forward them to the page.
   */
  listenForSettingsChanges(): void {
    StorageManager.onSettingsChanged(async (changes) => {
      try {
        if (this.isUnloading) return;
        if (changes.enabled || changes.siteEnabled) {
          const siteEnabled = await StorageManager.isEnabledForSite(this.currentSite);

          // Get current settings instead of assuming defaults to prevent race conditions
          const currentSettings = await StorageManager.getSettings();
          const globalEnabled =
            (changes.enabled?.newValue as boolean | undefined) ?? currentSettings.enabled;

          if (this.debugMode) {
            console.log('[Tabout][Content] Settings change:', {
              changes,
              globalEnabled,
              siteEnabled,
              site: this.currentSite,
            });
          }

          MessageBus.sendToPage(MESSAGE_TYPES.SET_ENABLED, {
            globalEnabled,
            siteEnabled,
            site: this.currentSite,
          });
        }

        if (changes.debugMode) {
          this.debugMode = Boolean(changes.debugMode.newValue);
          MessageBus.sendToPage(MESSAGE_TYPES.SET_DEBUG_MODE, {
            debugMode: changes.debugMode.newValue,
          });
        }
      } catch (error) {
        console.error('[Tabout] Failed to handle settings change:', error);
      }
    });
  }

  /**
   * Listen for messages from the page script.
   */
  listenForPageMessages(): void {
    MessageBus.onMessageFromPage(async (message: TaboutMessage) => {
      const payload = message.payload as { requestSettings?: boolean } | undefined;
      switch (message.type) {
        case MESSAGE_TYPES.EDITOR_DETECTED:
          if (this.debugMode) {
            console.log('[Tabout] Editor detected on page:', message.payload);
          }
          break;

        case MESSAGE_TYPES.TABOUT_APPLIED:
          if (this.debugMode) {
            console.log('[Tabout] Tabout applied:', message.payload);
          }
          break;

        case MESSAGE_TYPES.PING:
          // If the page script requests settings, send the current settings
          if (payload?.requestSettings) {
            if (this.debugMode) {
              console.log('[Tabout][Content] Page script requesting current settings for cross-tab sync');
            }
            if (!this.isUnloading) {
              await this.sendCurrentSettingsToPage();
            }
          }
          if (!this.isUnloading) {
            MessageBus.sendToPage(MESSAGE_TYPES.PONG);
          }
          break;

        default:
          if (this.debugMode) {
            console.log('[Tabout] Unknown message from page:', message);
          }
      }
    });
  }

  /**
   * Send current settings to the page script (for cross-tab synchronization).
   */
  async sendCurrentSettingsToPage(): Promise<void> {
    try {
      const settings = await StorageManager.getSettings();
      const siteEnabled = await StorageManager.isEnabledForSite(this.currentSite);

      if (this.debugMode) {
        console.log('[Tabout][Content] Sending current settings to page script:', {
          globalEnabled: settings.enabled,
          siteEnabled,
          debugMode: settings.debugMode,
        });
      }

      MessageBus.sendToPage(MESSAGE_TYPES.SET_ENABLED, {
        globalEnabled: settings.enabled,
        siteEnabled,
        site: this.currentSite,
      });

      MessageBus.sendToPage(MESSAGE_TYPES.SET_DEBUG_MODE, {
        debugMode: settings.debugMode,
      });
    } catch (error) {
      console.error('[Tabout][Content] Failed to send current settings:', error);
    }
  }
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript().initialize();
  });
} else {
  new ContentScript().initialize();
}
