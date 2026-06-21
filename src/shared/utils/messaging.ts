/**
 * Messaging utilities for communication between the content script (isolated
 * world) and the page script (page context), exchanged via `window.postMessage`.
 */

/** Message source markers. */
export type MessageSource = 'tabout-extension' | 'tabout-page';

export interface TaboutMessage<T = unknown> {
  type: string;
  payload?: T;
  source: MessageSource;
  timestamp: number;
  origin: string;
}

/**
 * Message types for communication between extension parts.
 */
export const MESSAGE_TYPES = {
  // Content script -> Page script
  SET_ENABLED: 'TABOUT_SET_ENABLED',
  SET_DEBUG_MODE: 'TABOUT_SET_DEBUG_MODE',

  // Page script -> Content script
  EDITOR_DETECTED: 'TABOUT_EDITOR_DETECTED',
  TABOUT_APPLIED: 'TABOUT_APPLIED',

  // General
  PING: 'TABOUT_PING',
  PONG: 'TABOUT_PONG',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

type MessageHandler = (message: TaboutMessage) => void;

/** Maximum allowed age of a message (replay-attack guard). */
const MAX_MESSAGE_AGE_MS = 30000;

/**
 * Messaging utilities for extension communication.
 */
export class MessageBus {
  /**
   * Send a message from the content script to the page script.
   */
  static sendToPage(type: string, payload: unknown = null): void {
    try {
      const message: TaboutMessage = {
        type,
        payload,
        source: 'tabout-extension',
        timestamp: Date.now(),
        origin: window.location.origin,
      };
      // Use the current origin instead of '*' for better security.
      window.postMessage(message, window.location.origin);
    } catch (error) {
      console.error('[Tabout] Failed to send message to page:', error);
    }
  }

  /**
   * Send a message from the page script to the content script.
   */
  static sendToContent(type: string, payload: unknown = null): void {
    try {
      const message: TaboutMessage = {
        type,
        payload,
        source: 'tabout-page',
        timestamp: Date.now(),
        origin: window.location.origin,
      };
      // Use the current origin instead of '*' for better security.
      window.postMessage(message, window.location.origin);
    } catch (error) {
      console.error('[Tabout] Failed to send message to content:', error);
    }
  }

  /**
   * Listen for messages from the page script (in the content script).
   * @returns A cleanup function.
   */
  static onMessageFromPage(callback: MessageHandler): () => void {
    return this.listen('tabout-page', callback);
  }

  /**
   * Listen for messages from the content script (in the page script).
   * @returns A cleanup function.
   */
  static onMessageFromContent(callback: MessageHandler): () => void {
    return this.listen('tabout-extension', callback);
  }

  private static listen(source: MessageSource, callback: MessageHandler): () => void {
    const listener = (event: MessageEvent) => {
      // Basic source validation
      if (event.source !== window) return;
      if (!event.data || event.data.source !== source) return;

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

      callback(event.data as TaboutMessage);
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }

  /**
   * Validate message structure and content.
   */
  static isValidMessage(message: unknown): message is TaboutMessage {
    // Check required fields
    if (!message || typeof message !== 'object') return false;
    const msg = message as Record<string, unknown>;
    if (typeof msg.type !== 'string') return false;
    if (msg.source !== 'tabout-extension' && msg.source !== 'tabout-page') return false;

    // Check timestamp (prevent replay attacks with old messages)
    if (typeof msg.timestamp !== 'number') return false;
    const now = Date.now();
    if (Math.abs(now - msg.timestamp) > MAX_MESSAGE_AGE_MS) {
      console.warn('[Tabout] Message too old:', now - msg.timestamp, 'ms');
      return false;
    }

    // Validate message type is one of our known types
    const validTypes: string[] = Object.values(MESSAGE_TYPES);
    if (!validTypes.includes(msg.type)) {
      console.warn('[Tabout] Unknown message type:', msg.type);
      return false;
    }

    return true;
  }

  /**
   * Create a simple ping-pong test.
   * @returns Whether communication works.
   */
  static async testCommunication(): Promise<boolean> {
    const COMMUNICATION_TEST_TIMEOUT_MS = 1000;

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
