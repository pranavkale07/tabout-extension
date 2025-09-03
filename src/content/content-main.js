import { StorageManager } from '../shared/utils/storage.js';
import { MessageBus, MESSAGE_TYPES } from '../shared/utils/messaging.js';
import { getSiteConfig, isSupportedSite } from '../shared/constants/sites.js';

/**
 * Main content script - runs in isolated world
 */
class ContentScript {
  constructor() {
    this.currentSite = window.location.hostname;
    this.siteConfig = getSiteConfig(this.currentSite);
    this.pageScriptInjected = false;
    this.isUnloading = false;

    // Avoid work during unload/navigation where extension context may be invalid
    window.addEventListener('beforeunload', () => {
      this.isUnloading = true;
    });
  }
  
  /**
   * Initialize the content script
   */
  async initialize() {
    if (this.isUnloading) return;
    // Check if this site is supported
    if (!isSupportedSite(this.currentSite)) {
      console.log('[Tabout] Site not supported:', this.currentSite);
      return;
    }
    
    console.log('[Tabout] Initializing on:', this.currentSite);
    
    // Inject page script
    await this.injectPageScript();
    
    // Send initial settings to page
    await this.sendInitialSettings();
    
    // Listen for settings changes
    this.listenForSettingsChanges();
    
    // Listen for messages from page script
    this.listenForPageMessages();
  }
  
  /**
   * Inject the page script into the page context
   */
  async injectPageScript() {
    if (this.pageScriptInjected) return;
    if (this.isUnloading) return;
    
    try {
      // Wait for document head to be available
      await this.waitForDocumentHead();
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('page-script.js');
      script.type = 'text/javascript';
      script.onload = () => {
        this.pageScriptInjected = true;
        console.log('[Tabout] Page script injected successfully');
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
   * Wait for document.head to be available
   */
  async waitForDocumentHead() {
    let attempts = 0;
    const MAX_HEAD_WAIT_ATTEMPTS = 20; // 2 seconds max (20 * 100ms)
    const HEAD_WAIT_INTERVAL_MS = 100; // Check every 100ms
    
    while (!document.head && attempts < MAX_HEAD_WAIT_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, HEAD_WAIT_INTERVAL_MS));
      attempts++;
    }
    
    if (!document.head) {
      throw new Error('document.head not available after 2 seconds');
    }
  }
  
  /**
   * Send initial settings to the page script
   */
  async sendInitialSettings() {
    try {
      if (this.isUnloading) return;
      const settings = await StorageManager.getSettings();
      const siteEnabled = await StorageManager.isEnabledForSite(this.currentSite);
      
      // Send settings to page
      MessageBus.sendToPage(MESSAGE_TYPES.SET_ENABLED, {
        globalEnabled: settings.enabled,
        siteEnabled,
        site: this.currentSite
      });
      
      MessageBus.sendToPage(MESSAGE_TYPES.SET_DEBUG_MODE, {
        debugMode: settings.debugMode
      });
      
      console.log('[Tabout] Initial settings sent:', { 
        enabled: settings.enabled && siteEnabled,
        debugMode: settings.debugMode 
      });
    } catch (error) {
      console.error('[Tabout] Failed to send initial settings:', error);
    }
  }
  
  /**
   * Listen for storage changes and forward to page
   */
  listenForSettingsChanges() {
    StorageManager.onSettingsChanged(async (changes) => {
      try {
        if (this.isUnloading) return;
        if (changes.enabled || changes.siteEnabled) {
          const siteEnabled = await StorageManager.isEnabledForSite(this.currentSite);
          
          // Fixed: Get current settings instead of assuming defaults to prevent race conditions
          const currentSettings = await StorageManager.getSettings();
          const globalEnabled = changes.enabled?.newValue ?? currentSettings.enabled;
          
          console.log('[Tabout][Content] Settings change:', { 
            changes, 
            globalEnabled, 
            siteEnabled, 
            site: this.currentSite 
          });
          
          MessageBus.sendToPage(MESSAGE_TYPES.SET_ENABLED, {
            globalEnabled,
            siteEnabled,
            site: this.currentSite
          });
        }
        
        if (changes.debugMode) {
          MessageBus.sendToPage(MESSAGE_TYPES.SET_DEBUG_MODE, {
            debugMode: changes.debugMode.newValue
          });
        }
      } catch (error) {
        console.error('[Tabout] Failed to handle settings change:', error);
      }
    });
  }
  
  /**
   * Listen for messages from page script
   */
  listenForPageMessages() {
    MessageBus.onMessageFromPage(async (message) => {
      switch (message.type) {
        case MESSAGE_TYPES.EDITOR_DETECTED:
          console.log('[Tabout] Editor detected on page:', message.payload);
          break;
          
        case MESSAGE_TYPES.TABOUT_APPLIED:
          console.log('[Tabout] Tabout applied:', message.payload);
          break;
          
        case MESSAGE_TYPES.PING:
          // CRITICAL FIX: If page script requests settings, send current settings
          if (message.payload?.requestSettings) {
            console.log('[Tabout][Content] Page script requesting current settings for cross-tab sync');
            if (!this.isUnloading) {
              await this.sendCurrentSettingsToPage();
            }
          }
          if (!this.isUnloading) {
            MessageBus.sendToPage(MESSAGE_TYPES.PONG);
          }
          break;
          
        default:
          console.log('[Tabout] Unknown message from page:', message);
      }
    });
  }
  
  /**
   * Send current settings to page script (for cross-tab synchronization)
   */
  async sendCurrentSettingsToPage() {
    try {
      const settings = await StorageManager.getSettings();
      const siteEnabled = await StorageManager.isEnabledForSite(this.currentSite);
      
      console.log('[Tabout][Content] Sending current settings to page script:', {
        globalEnabled: settings.enabled,
        siteEnabled,
        debugMode: settings.debugMode
      });
      
      // Send current enabled state
      MessageBus.sendToPage(MESSAGE_TYPES.SET_ENABLED, {
        globalEnabled: settings.enabled,
        siteEnabled,
        site: this.currentSite
      });
      
      // Send current debug mode
      MessageBus.sendToPage(MESSAGE_TYPES.SET_DEBUG_MODE, {
        debugMode: settings.debugMode
      });
    } catch (error) {
      console.error('[Tabout][Content] Failed to send current settings:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript().initialize();
  });
} else {
  new ContentScript().initialize();
}
