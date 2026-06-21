import { LeetCodeHandler } from './sites/leetcode';
import { GeeksForGeeksHandler } from './sites/geeksforgeeks';
import { MessageBus, MESSAGE_TYPES, type TaboutMessage } from '../shared/utils/messaging';
import { getSiteConfig } from '../shared/constants/sites';
import type { TaboutHandler } from '../types/globals';

/**
 * Page script - runs in the page context to access editor APIs.
 */
(function () {
  'use strict';

  let debugMode = false;
  let currentHandler: TaboutHandler | null = null;

  // Mark for detection
  window.__TABOUT_EXTENSION_LOADED = true;

  interface SetEnabledPayload {
    globalEnabled?: boolean;
    siteEnabled?: boolean;
  }
  interface SetDebugPayload {
    debugMode?: boolean;
  }

  /**
   * Initialize the appropriate site handler.
   */
  async function initializeHandler(): Promise<void> {
    const hostname = window.location.hostname;
    const siteConfig = getSiteConfig(hostname);

    if (!siteConfig) {
      console.warn('[Tabout][Page] No configuration for site:', hostname);
      return;
    }

    // Prevent multiple handler instances
    if (currentHandler && window.__TABOUT_HANDLER_INSTANCE) {
      if (debugMode) {
        console.log('[Tabout][Page] Handler already initialized, skipping');
      }
      return;
    }

    try {
      switch (siteConfig.editor) {
        case 'monaco':
          if (!currentHandler) {
            currentHandler = new LeetCodeHandler();
            await currentHandler.initialize();
            if (debugMode) {
              console.log('[Tabout][Page] New handler created and initialized');
            }
          }

          // After initialization, ensure currentHandler points to the global instance
          if (window.__TABOUT_HANDLER_INSTANCE && window.__TABOUT_HANDLER_INSTANCE !== currentHandler) {
            currentHandler = window.__TABOUT_HANDLER_INSTANCE;
          }

          MessageBus.sendToContent(MESSAGE_TYPES.EDITOR_DETECTED, {
            site: hostname,
            editor: siteConfig.editor,
            ready: currentHandler.isReady(),
          });
          break;

        case 'ace':
          if (!currentHandler) {
            currentHandler = new GeeksForGeeksHandler();
            await currentHandler.initialize();
            if (debugMode) {
              console.log('[Tabout][Page] New Ace handler created and initialized');
            }
          }

          if (window.__TABOUT_HANDLER_INSTANCE && window.__TABOUT_HANDLER_INSTANCE !== currentHandler) {
            currentHandler = window.__TABOUT_HANDLER_INSTANCE;
          }

          MessageBus.sendToContent(MESSAGE_TYPES.EDITOR_DETECTED, {
            site: hostname,
            editor: siteConfig.editor,
            ready: currentHandler.isReady(),
          });
          break;

        default:
          console.log('[Tabout][Page] Handler not implemented for editor:', siteConfig.editor);
      }
    } catch (error) {
      console.error('[Tabout][Page] Failed to initialize handler:', error);
    }
  }

  /**
   * Handle messages from the content script.
   */
  MessageBus.onMessageFromContent((message: TaboutMessage) => {
    switch (message.type) {
      case MESSAGE_TYPES.SET_ENABLED:
        handleSetEnabled(message.payload as SetEnabledPayload);
        break;

      case MESSAGE_TYPES.SET_DEBUG_MODE:
        handleSetDebugMode(message.payload as SetDebugPayload);
        break;

      case MESSAGE_TYPES.PING:
        MessageBus.sendToContent(MESSAGE_TYPES.PONG);
        break;

      default:
        if (debugMode) {
          console.log('[Tabout][Page] Unknown message:', message);
        }
    }
  });

  /**
   * Handle an enable/disable message.
   */
  function handleSetEnabled(payload: SetEnabledPayload): void {
    const { globalEnabled: global, siteEnabled: site } = payload;
    const globalEnabled = Boolean(global && site);

    // Always use the global handler instance for setEnabled
    const handlerToUpdate = window.__TABOUT_HANDLER_INSTANCE || currentHandler;

    if (handlerToUpdate && typeof handlerToUpdate.setEnabled === 'function') {
      handlerToUpdate.setEnabled(globalEnabled);

      // Also update currentHandler if it's a different instance (for consistency)
      if (currentHandler && currentHandler !== handlerToUpdate && typeof currentHandler.setEnabled === 'function') {
        currentHandler.setEnabled(globalEnabled);
      }
    } else if (debugMode) {
      console.warn('[Tabout][Page] Cannot set enabled - no handler or setEnabled method');
    }
  }

  /**
   * Handle a debug-mode change.
   */
  function handleSetDebugMode(payload: SetDebugPayload): void {
    debugMode = Boolean(payload.debugMode);

    // Propagate to the active global handler instance (falls back to local).
    const handler = window.__TABOUT_HANDLER_INSTANCE || currentHandler;
    if (handler && typeof handler.setDebugMode === 'function') {
      handler.setDebugMode(debugMode);
    }

    if (debugMode) {
      console.log('[Tabout][Page] Debug mode:', debugMode);
    }
  }

  // Initialize when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHandler);
  } else {
    initializeHandler();
  }

  // Request current settings from the content script when the page script loads.
  // This ensures cross-tab synchronization works even if storage changes happened
  // before this tab was active.
  MessageBus.sendToContent(MESSAGE_TYPES.PING, { requestSettings: true });

  // Sync settings when the tab becomes visible (user switches back to this tab).
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      if (debugMode) {
        console.log('[Tabout][Page] Tab became visible, requesting current settings');
      }
      MessageBus.sendToContent(MESSAGE_TYPES.PING, { requestSettings: true });
    }
  });

  // Retry initialization after delays (in case editors load late)
  const INIT_RETRY_DELAY_1 = 1000; // 1 second
  const INIT_RETRY_DELAY_2 = 3000; // 3 seconds

  setTimeout(initializeHandler, INIT_RETRY_DELAY_1);
  setTimeout(initializeHandler, INIT_RETRY_DELAY_2);

  // Cleanup on page unload to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    if (currentHandler && typeof currentHandler.cleanup === 'function') {
      currentHandler.cleanup();
    }

    window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
    window.__TABOUT_HANDLER_INSTANCE = null;
  });
})();
