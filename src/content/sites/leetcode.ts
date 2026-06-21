import { shouldTabout } from '../../shared/core/tabout-engine';
import { CHARACTER_SETS } from '../../shared/constants/character-sets';
import type { MonacoEditor, MonacoNamespace, TaboutHandler } from '../../types/globals';

/**
 * LeetCode-specific handler for the Monaco editor.
 */
export class LeetCodeHandler implements TaboutHandler {
  private monaco: MonacoNamespace | null = null;
  enabled = true;
  debugMode = false;
  private mutationObserver: MutationObserver | null = null;

  /**
   * Initialize the handler.
   */
  async initialize(): Promise<void> {
    await this.waitForMonaco();
    this.bindGlobalHandler();
    this.observeNewEditors();
  }

  /**
   * Wait for the Monaco editor to be available.
   */
  async waitForMonaco(): Promise<void> {
    let attempts = 0;
    const MAX_WAIT_ATTEMPTS = 20; // 10 seconds max (20 * 500ms)
    const WAIT_INTERVAL_MS = 500;

    while (!window.monaco && attempts < MAX_WAIT_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL_MS));
      attempts++;
    }

    if (window.monaco) {
      this.monaco = window.monaco;
      if (this.debugMode) {
        console.log('[Tabout][LeetCode] Monaco editor detected');
      }
    } else {
      console.warn('[Tabout][LeetCode] Monaco editor not found after 10 seconds');
    }
  }

  /**
   * Bind a single global Tab handler that works with any active editor.
   */
  bindGlobalHandler(): void {
    // Atomic check-and-set to avoid race conditions
    if (window.__TABOUT_GLOBAL_HANDLER_BOUND) {
      if (this.debugMode) {
        console.log('[Tabout][LeetCode] Global handler already bound by another instance');
      }
      return;
    }
    window.__TABOUT_GLOBAL_HANDLER_BOUND = true;

    try {
      const globalTabHandler = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;
        if (!window.monaco?.editor) return;

        // Find ANY enabled LeetCode handler instance
        const enabledHandler = this.findEnabledHandler();

        if (enabledHandler && enabledHandler.debugMode) {
          console.log('[Tabout][LeetCode] Global Tab handler triggered', {
            hasHandler: !!enabledHandler,
            handlerEnabled: enabledHandler?.enabled,
          });
        }

        if (!enabledHandler || !enabledHandler.enabled) {
          if (enabledHandler && enabledHandler.debugMode) {
            console.log('[Tabout][LeetCode] Global handler skipping - handler disabled or not found');
          }
          return;
        }

        // Find the currently focused editor
        const activeEditor = enabledHandler.getActiveEditor();
        if (activeEditor) {
          enabledHandler.handleTabKey(activeEditor, event);
        }
      };

      // Bind to document with capture and retain reference for cleanup
      document.addEventListener('keydown', globalTabHandler, true);
      window.__TABOUT_GLOBAL_TAB_HANDLER = globalTabHandler;

      // Mark global handler instance
      window.__TABOUT_HANDLER_INSTANCE = this;

      if (this.debugMode) {
        console.log('[Tabout][LeetCode] Global Tab handler bound (singleton)');
      }
    } catch (error) {
      console.error('[Tabout][LeetCode] Failed to bind global handler:', error);
      // Revert flag on failure
      window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
    }
  }

  /**
   * Find an enabled handler instance (could be this or another instance).
   */
  findEnabledHandler(): LeetCodeHandler {
    if (window.__TABOUT_HANDLER_INSTANCE) {
      return window.__TABOUT_HANDLER_INSTANCE as unknown as LeetCodeHandler;
    }
    return this;
  }

  /**
   * Find the currently active/focused Monaco editor.
   */
  getActiveEditor(): MonacoEditor | null {
    try {
      const editors = this.monaco?.editor.getEditors() || [];

      // Find editor with focus
      for (const editor of editors) {
        if (editor.hasTextFocus && editor.hasTextFocus()) {
          return editor;
        }
      }

      // Fallback: find editor containing the focused element
      const focusedElement = document.activeElement;
      if (focusedElement) {
        for (const editor of editors) {
          const editorElement = editor.getDomNode && editor.getDomNode();
          if (editorElement && editorElement.contains(focusedElement)) {
            return editor;
          }
        }
      }

      if (this.debugMode && editors.length > 0) {
        console.log('[Tabout][LeetCode] No active editor found among', editors.length, 'editors');
      }

      return null;
    } catch (error) {
      console.error('[Tabout][LeetCode] Error finding active editor:', error);
      return null;
    }
  }

  /**
   * Handle a Tab key press in the editor.
   */
  handleTabKey(editor: MonacoEditor, event: KeyboardEvent): void {
    // CRITICAL: Check if tabout is enabled before processing
    if (!this.enabled) {
      if (this.debugMode) {
        console.log('[Tabout][LeetCode] Tab ignored - handler disabled');
      }
      return;
    }

    if (this.debugMode) {
      console.log('[Tabout][LeetCode] Processing Tab key - handler ENABLED');
    }

    try {
      const monaco = this.monaco;
      if (!monaco) return;

      const model = editor.getModel();
      const selections = editor.getSelections();

      if (!model || !selections || selections.length === 0) return;

      const pairs = CHARACTER_SETS;

      const updatedSelections: unknown[] = [];
      let anyTaboutApplied = false;

      for (const selection of selections) {
        // Skip if there's a text selection (not just cursor)
        if (!selection.isEmpty()) {
          updatedSelections.push(selection);
          continue;
        }

        const position = selection.getPosition();
        const lineText = model.getLineContent(position.lineNumber) || '';
        const newColumn = shouldTabout(lineText, position.column, pairs);

        if (this.debugMode) {
          console.log('[Tabout][LeetCode] Tab decision:', {
            line: lineText,
            column: position.column,
            newColumn,
          });
        }

        if (newColumn !== null) {
          // Create a new selection at the tabout position
          const newSelection = new monaco.Selection(
            position.lineNumber,
            newColumn,
            position.lineNumber,
            newColumn,
          );
          updatedSelections.push(newSelection);
          anyTaboutApplied = true;
        } else {
          // Keep original selection
          updatedSelections.push(selection);
        }
      }

      if (anyTaboutApplied) {
        event.preventDefault();
        event.stopPropagation();
        editor.setSelections(updatedSelections);

        if (this.debugMode) {
          console.log('[Tabout][LeetCode] Tabout applied');
        }
      }
    } catch (error) {
      console.error('[Tabout][LeetCode] Error handling tab key:', error);
    }
  }

  /**
   * Observe the DOM for new editors (for logging/debugging) with throttling.
   */
  observeNewEditors(): void {
    let lastCheck = 0;
    const THROTTLE_DELAY = 1000; // Check at most once per second

    this.mutationObserver = new MutationObserver(() => {
      const now = Date.now();
      if (now - lastCheck < THROTTLE_DELAY) return; // Throttle to prevent performance issues
      lastCheck = now;

      if (this.debugMode && this.monaco?.editor) {
        const editors = this.monaco.editor.getEditors() || [];
        if (editors.length > 0) {
          console.log(`[Tabout][LeetCode] Found ${editors.length} editors available`);
        }
      }
    });

    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Update the enabled state.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = !!enabled;

    if (this.debugMode) {
      console.log(`[Tabout][LeetCode] setEnabled called: ${enabled}`, {
        isGlobalInstance: window.__TABOUT_HANDLER_INSTANCE === this,
      });
    }
  }

  /**
   * Update debug mode.
   */
  setDebugMode(debug: boolean): void {
    this.debugMode = !!debug;
  }

  /**
   * Check if Monaco is available.
   */
  isReady(): boolean {
    return !!(this.monaco && window.monaco);
  }

  /**
   * Cleanup resources to prevent memory leaks.
   */
  cleanup(): void {
    // Disconnect MutationObserver
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Cleanup global listener if this instance owns it
    if (window.__TABOUT_GLOBAL_TAB_HANDLER) {
      document.removeEventListener('keydown', window.__TABOUT_GLOBAL_TAB_HANDLER, true);
      window.__TABOUT_GLOBAL_TAB_HANDLER = null;
    }
    window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
    window.__TABOUT_HANDLER_INSTANCE = null;
    if (this.debugMode) {
      console.log('[Tabout][LeetCode] Handler cleaned up');
    }
  }
}
