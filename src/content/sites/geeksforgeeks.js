import { shouldTabout } from '../../shared/core/tabout-engine.js';
import { CHARACTER_SETS } from '../../shared/constants/character-sets.js';

/**
 * GeeksForGeeks-specific handler for Ace editor
 */
export class GeeksForGeeksHandler {
  constructor() {
    this.ace = null;
    this.globalHandlerBound = false;
    this.enabled = true;
    this.debugMode = false;
    this.mutationObserver = null;
  }

  /**
   * Initialize the handler
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.waitForAce();
    this.bindGlobalHandler();
    this.observeNewEditors();
  }

  /**
   * Wait for Ace editor to be available
   * @returns {Promise<void>}
   */
  async waitForAce() {
    let attempts = 0;
    const MAX_WAIT_ATTEMPTS = 20; // 10 seconds max (20 * 500ms)
    const WAIT_INTERVAL_MS = 500;

    while (!window.ace && attempts < MAX_WAIT_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL_MS));
      attempts++;
    }

    if (window.ace) {
      this.ace = window.ace;
      if (this.debugMode) {
        console.log('[Tabout][GFG] Ace editor detected');
      }
    } else {
      console.warn('[Tabout][GFG] Ace editor not found after 10 seconds');
    }
  }

  /**
   * Bind single global Tab handler that works with any active editor
   */
  bindGlobalHandler() {
    // Atomic check-and-set to avoid race conditions
    if (window.__TABOUT_GLOBAL_HANDLER_BOUND) {
      if (this.debugMode) {
        console.log('[Tabout][GFG] Global handler already bound by another instance');
      }
      return;
    }
    window.__TABOUT_GLOBAL_HANDLER_BOUND = true;

    try {
      const globalTabHandler = (event) => {
        if (event.key !== 'Tab') return;
        if (!window.ace) return;

        const enabledHandler = this.findEnabledHandler();

        if (enabledHandler && enabledHandler.debugMode) {
          console.log('[Tabout][GFG] Global Tab handler triggered', {
            hasHandler: !!enabledHandler,
            handlerEnabled: enabledHandler?.enabled
          });
        }

        if (!enabledHandler || !enabledHandler.enabled) {
          if (enabledHandler && enabledHandler.debugMode) {
            console.log('[Tabout][GFG] Global handler skipping - handler disabled or not found');
          }
          return;
        }

        const activeEditor = enabledHandler.getActiveEditor();
        if (activeEditor) {
          enabledHandler.handleTabKey(activeEditor, event);
        }
      };

      document.addEventListener('keydown', globalTabHandler, true);
      window.__TABOUT_GLOBAL_TAB_HANDLER = globalTabHandler;
      window.__TABOUT_HANDLER_INSTANCE = this;

      if (this.debugMode) {
        console.log('[Tabout][GFG] Global handler instance set');
      }

      this.globalHandlerBound = true;

      if (this.debugMode) {
        console.log('[Tabout][GFG] Global Tab handler bound (singleton)');
      }
    } catch (error) {
      console.error('[Tabout][GFG] Failed to bind global handler:', error);
      window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
    }
  }

  /**
   * Find an enabled handler instance (could be this or another instance)
   */
  findEnabledHandler() {
    if (window.__TABOUT_HANDLER_INSTANCE) {
      return window.__TABOUT_HANDLER_INSTANCE;
    }
    return this;
  }

  /**
   * Find the currently active/focused Ace editor
   * @returns {Object|null} - Active editor instance or null
   */
  getActiveEditor() {
    try {
      const editorElements = document.querySelectorAll('.ace_editor');

      for (const el of editorElements) {
        const editor = this.ace.edit(el);
        if (editor && editor.isFocused()) {
          return editor;
        }
      }

      // Fallback: find editor containing the focused element
      const focusedElement = document.activeElement;
      if (focusedElement) {
        for (const el of editorElements) {
          if (el.contains(focusedElement)) {
            return this.ace.edit(el);
          }
        }
      }

      if (this.debugMode && editorElements.length > 0) {
        console.log('[Tabout][GFG] No active editor found among', editorElements.length, 'editors');
      }

      return null;
    } catch (error) {
      console.error('[Tabout][GFG] Error finding active editor:', error);
      return null;
    }
  }

  /**
   * Handle Tab key press in editor
   * @param {Object} editor - Ace editor instance
   * @param {Object} event - Keyboard event
   */
  handleTabKey(editor, event) {
    if (!this.enabled) {
      if (this.debugMode) {
        console.log('[Tabout][GFG] Tab ignored - handler disabled');
      }
      return;
    }

    if (this.debugMode) {
      console.log('[Tabout][GFG] Processing Tab key - handler ENABLED');
    }

    try {
      const session = editor.getSession();
      const selection = editor.getSelection();

      // Skip if there's a text selection (not just cursor)
      if (!selection.isEmpty()) return;

      const cursor = editor.getCursorPosition(); // { row, column } (0-based)
      const lineText = session.getLine(cursor.row) || '';

      // Use universal character sets
      const pairs = CHARACTER_SETS;

      // Ace uses 0-based columns, shouldTabout expects 1-based
      const newColumn = shouldTabout(lineText, cursor.column + 1, pairs);

      if (this.debugMode) {
        console.log('[Tabout][GFG] Tab decision:', {
          line: lineText,
          column: cursor.column,
          newColumn,
          charBefore: lineText[cursor.column - 1],
          charAt: lineText[cursor.column],
          charAfter: lineText[cursor.column + 1]
        });
      }

      if (newColumn !== null) {
        event.preventDefault();
        event.stopPropagation();

        // Convert back to 0-based for Ace
        editor.moveCursorTo(cursor.row, newColumn - 1);
        selection.clearSelection();

        if (this.debugMode) {
          console.log('[Tabout][GFG] Tabout applied');
        }
      }
    } catch (error) {
      console.error('[Tabout][GFG] Error handling tab key:', error);
    }
  }

  /**
   * Observe DOM for new editors with throttling
   */
  observeNewEditors() {
    let lastCheck = 0;
    const THROTTLE_DELAY = 1000;

    this.mutationObserver = new MutationObserver(() => {
      const now = Date.now();
      if (now - lastCheck < THROTTLE_DELAY) return;
      lastCheck = now;

      if (this.debugMode) {
        const editors = document.querySelectorAll('.ace_editor');
        if (editors.length > 0) {
          console.log(`[Tabout][GFG] Found ${editors.length} editors available`);
        }
      }
    });

    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Update enabled state
   * @param {boolean} enabled - Whether tabout is enabled
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;

    if (this.debugMode) {
      console.log(`[Tabout][GFG] setEnabled called: ${enabled}`, {
        isGlobalInstance: window.__TABOUT_HANDLER_INSTANCE === this
      });
    }
  }

  /**
   * Update debug mode
   * @param {boolean} debug - Whether debug mode is enabled
   */
  setDebugMode(debug) {
    this.debugMode = !!debug;
  }

  /**
   * Check if Ace is available
   * @returns {boolean} - Whether Ace is ready
   */
  isReady() {
    return !!(this.ace && window.ace);
  }

  /**
   * Cleanup resources to prevent memory leaks
   */
  cleanup() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (window.__TABOUT_GLOBAL_TAB_HANDLER) {
      document.removeEventListener('keydown', window.__TABOUT_GLOBAL_TAB_HANDLER, true);
      window.__TABOUT_GLOBAL_TAB_HANDLER = null;
    }
    window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
    window.__TABOUT_HANDLER_INSTANCE = null;
    if (this.debugMode) {
      console.log('[Tabout][GFG] Handler cleaned up');
    }
  }
}
