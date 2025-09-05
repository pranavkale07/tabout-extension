import { LeetCodeHandler } from './sites/leetcode.js';
import { MessageBus, MESSAGE_TYPES } from '../shared/utils/messaging.js';
import { getSiteConfig } from '../shared/constants/sites.js';

/**
 * Page script - runs in page context to access editor APIs
 */
(function() {
  'use strict';
  
  const DEBUG = false;
  let globalEnabled = true;
  let debugMode = false;
  let currentHandler = null;
  
  // Mark for detection
  window.__TABOUT_EXTENSION_LOADED = true;
  
  if (DEBUG) console.log('[Tabout][Page] Page script loaded');
  
  /**
   * Initialize the appropriate site handler
   */
  async function initializeHandler() {
    const hostname = window.location.hostname;
    const siteConfig = getSiteConfig(hostname);
    
    if (!siteConfig) {
      console.warn('[Tabout][Page] No configuration for site:', hostname);
      return;
    }
    
    // CRITICAL FIX: Prevent multiple handler instances
    if (currentHandler && window.__TABOUT_HANDLER_INSTANCE) {
      if (debugMode) {
        console.log('[Tabout][Page] Handler already initialized, skipping');
      }
      return;
    }
    
    try {
      // Initialize site-specific handler based on site config (single source of truth)
      switch (siteConfig.editor) {
        case 'monaco':
          // Create handler only if none exists
          if (!currentHandler) {
            currentHandler = new LeetCodeHandler();
            await currentHandler.initialize();
            if (debugMode) {
              console.log('[Tabout][Page] New handler created and initialized');
            }
          }
          
          // After initialization, ensure currentHandler points to global instance
          if (window.__TABOUT_HANDLER_INSTANCE && window.__TABOUT_HANDLER_INSTANCE !== currentHandler) {
            if (debugMode) {
              console.log('[Tabout][Page] Updating currentHandler to point to global instance');
            }
            currentHandler = window.__TABOUT_HANDLER_INSTANCE;
          }
          
          MessageBus.sendToContent(MESSAGE_TYPES.EDITOR_DETECTED, {
            site: hostname,
            editor: siteConfig.editor,
            ready: currentHandler.isReady()
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
   * Handle messages from content script
   */
  MessageBus.onMessageFromContent((message) => {
    switch (message.type) {
      case MESSAGE_TYPES.SET_ENABLED:
        handleSetEnabled(message.payload);
        break;
        
      case MESSAGE_TYPES.SET_DEBUG_MODE:
        handleSetDebugMode(message.payload);
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
   * Handle enable/disable message
   * @param {Object} payload - Message payload
   */
  function handleSetEnabled(payload) {
    const { globalEnabled: global, siteEnabled: site } = payload;
    const wasGlobalEnabled = globalEnabled;
    globalEnabled = global && site;
    
    // Only log page-level enable changes in debug mode
    if (debugMode) {
      console.log(`[Tabout][Page] handleSetEnabled called: ${wasGlobalEnabled} -> ${globalEnabled}`, {
        payload,
        hasHandler: !!currentHandler,
        handlerType: currentHandler?.constructor?.name,
        handlerSetEnabledExists: !!(currentHandler && typeof currentHandler.setEnabled === 'function')
      });
    }
    
    // CRITICAL FIX: Always use the global handler instance for setEnabled
    const handlerToUpdate = window.__TABOUT_HANDLER_INSTANCE || currentHandler;
    
    if (debugMode) {
      console.log('[Tabout][Page] Handler instances:', {
        currentHandler: currentHandler,
        globalHandler: window.__TABOUT_HANDLER_INSTANCE,
        willUpdateGlobal: handlerToUpdate === window.__TABOUT_HANDLER_INSTANCE,
        usingFallback: handlerToUpdate === currentHandler && !window.__TABOUT_HANDLER_INSTANCE
      });
    }
    
    if (handlerToUpdate && typeof handlerToUpdate.setEnabled === 'function') {
      if (debugMode) {
        console.log('[Tabout][Page] Calling setEnabled on', handlerToUpdate === window.__TABOUT_HANDLER_INSTANCE ? 'GLOBAL' : 'LOCAL', 'handler with:', globalEnabled);
      }
      handlerToUpdate.setEnabled(globalEnabled);
      
      // Also update currentHandler if it's different (for consistency)
      if (currentHandler && currentHandler !== handlerToUpdate && typeof currentHandler.setEnabled === 'function') {
        if (debugMode) {
          console.log('[Tabout][Page] Also updating local handler for consistency');
        }
        currentHandler.setEnabled(globalEnabled);
      }
    } else {
      if (debugMode) {
        console.warn('[Tabout][Page] Cannot set enabled - no handler or setEnabled method', {
          hasCurrentHandler: !!currentHandler,
          hasGlobalHandler: !!window.__TABOUT_HANDLER_INSTANCE,
          handlerToUpdate: handlerToUpdate
        });
      }
    }
    
    if (debugMode) {
      // Debug: Detect rapid state changes
      if (wasGlobalEnabled === globalEnabled && globalEnabled !== undefined) {
        console.warn('[Tabout][Page] Redundant enable message - possible duplicate handlers');
      }
    }
  }
  
  /**
   * Handle debug mode change
   * @param {Object} payload - Message payload
   */
  function handleSetDebugMode(payload) {
    debugMode = payload.debugMode;
    
    if (currentHandler && typeof currentHandler.setDebugMode === 'function') {
      currentHandler.setDebugMode(debugMode);
    }
    
    if (debugMode) {
      console.log('[Tabout][Page] Debug mode:', debugMode);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHandler);
  } else {
    initializeHandler();
  }
  
  // CRITICAL FIX: Request current settings from content script when page script loads
  // This ensures cross-tab synchronization works even if storage changes happened before this tab was active
  MessageBus.sendToContent(MESSAGE_TYPES.PING, { requestSettings: true });
  
  // ADDITIONAL FIX: Sync settings when tab becomes visible (user switches back to this tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Tab became visible - request current settings in case we missed storage changes
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
    
    // Clean up global markers
    window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
    window.__TABOUT_HANDLER_INSTANCE = null;
  });
  
})();
