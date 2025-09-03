/**
 * @typedef {Object} TaboutMessage
 * @property {string} type - Message type
 * @property {any} [payload] - Message payload
 * @property {string} [site] - Target site
 */

/**
 * Message types for communication between extension parts
 */
export const MESSAGE_TYPES = {
  // Content script -> Page script
  SET_ENABLED: 'TABOUT_SET_ENABLED',
  SET_SITE_ENABLED: 'TABOUT_SET_SITE_ENABLED',
  SET_DEBUG_MODE: 'TABOUT_SET_DEBUG_MODE',
  
  // Page script -> Content script
  EDITOR_DETECTED: 'TABOUT_EDITOR_DETECTED',
  TABOUT_APPLIED: 'TABOUT_APPLIED',
  
  // General
  PING: 'TABOUT_PING',
  PONG: 'TABOUT_PONG'
};

/**
 * Messaging utilities for extension communication
 */
export class MessageBus {
  /**
   * Send message from content script to page script
   * @param {string} type - Message type
   * @param {any} [payload] - Message payload
   */
  static sendToPage(type, payload = null) {
    try {
      const message = { 
        type, 
        payload, 
        source: 'tabout-extension',
        timestamp: Date.now(),
        origin: window.location.origin
      };
      // Use current origin instead of '*' for better security
      window.postMessage(message, window.location.origin);
    } catch (error) {
      console.error('[Tabout] Failed to send message to page:', error);
    }
  }
  
  /**
   * Send message from page script to content script
   * @param {string} type - Message type
   * @param {any} [payload] - Message payload
   */
  static sendToContent(type, payload = null) {
    try {
      const message = { 
        type, 
        payload, 
        source: 'tabout-page',
        timestamp: Date.now(),
        origin: window.location.origin
      };
      // Use current origin instead of '*' for better security
      window.postMessage(message, window.location.origin);
    } catch (error) {
      console.error('[Tabout] Failed to send message to content:', error);
    }
  }
  
  /**
   * Listen for messages from page script (in content script)
   * @param {function} callback - Message handler
   * @returns {function} - Cleanup function
   */
  static onMessageFromPage(callback) {
    const listener = (event) => {
      // Basic source validation
      if (event.source !== window) return;
      if (!event.data || event.data.source !== 'tabout-page') return;
      
      // Enhanced security validation
      if (event.origin !== window.location.origin) {
        console.warn('[Tabout] Message from different origin rejected:', event.origin);
        return;
      }
      
      // Validate message structure
      if (!this.isValidMessage(event.data)) {
        console.warn('[Tabout] Invalid message structure rejected:', event.data);
        return;
      }
      
      callback(event.data);
    };
    
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }
  
  /**
   * Listen for messages from content script (in page script)
   * @param {function} callback - Message handler
   * @returns {function} - Cleanup function
   */
  static onMessageFromContent(callback) {
    const listener = (event) => {
      // Basic source validation
      if (event.source !== window) return;
      if (!event.data || event.data.source !== 'tabout-extension') return;
      
      // Enhanced security validation
      if (event.origin !== window.location.origin) {
        console.warn('[Tabout] Message from different origin rejected:', event.origin);
        return;
      }
      
      // Validate message structure
      if (!this.isValidMessage(event.data)) {
        console.warn('[Tabout] Invalid message structure rejected:', event.data);
        return;
      }
      
      callback(event.data);
    };
    
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }
  
  /**
   * Validate message structure and content
   * @param {Object} message - Message to validate
   * @returns {boolean} - Whether message is valid
   */
  static isValidMessage(message) {
    // Check required fields
    if (!message || typeof message !== 'object') return false;
    if (typeof message.type !== 'string') return false;
    if (!['tabout-extension', 'tabout-page'].includes(message.source)) return false;
    
    // Check timestamp (prevent replay attacks with old messages)
    if (typeof message.timestamp !== 'number') return false;
    const now = Date.now();
    const MAX_MESSAGE_AGE_MS = 30000; // 30 seconds max message age
    if (Math.abs(now - message.timestamp) > MAX_MESSAGE_AGE_MS) {
      console.warn('[Tabout] Message too old:', now - message.timestamp, 'ms');
      return false;
    }
    
    // Validate message type is from our known types
    const validTypes = Object.values(MESSAGE_TYPES);
    if (!validTypes.includes(message.type)) {
      console.warn('[Tabout] Unknown message type:', message.type);
      return false;
    }
    
    return true;
  }
  
  /**
   * Create a simple ping-pong test
   * @returns {Promise<boolean>} - Whether communication works
   */
  static async testCommunication() {
    const COMMUNICATION_TEST_TIMEOUT_MS = 1000; // 1 second timeout
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), COMMUNICATION_TEST_TIMEOUT_MS);
      
      const cleanup = this.onMessageFromPage((message) => {
        if (message.type === MESSAGE_TYPES.PONG) {
          clearTimeout(timeout);
          cleanup();
          resolve(true);
        }
      });
      
      this.sendToPage(MESSAGE_TYPES.PING);
    });
  }
}
