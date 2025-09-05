import { shouldTabout } from '../../shared/core/tabout-engine.js';
import { CHARACTER_SETS } from '../../shared/constants/character-sets.js';

/**
 * LeetCode-specific handler for Monaco editor
 */
export class LeetCodeHandler {
  constructor() {
    this.monaco = null;
    this.globalHandlerBound = false;
    this.enabled = true;
    this.debugMode = false; // Fixed: Use user setting instead of hardcoded
    this.mutationObserver = null; // Track observer for cleanup
  }
  
  /**
   * Initialize the handler
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.waitForMonaco();
    this.bindGlobalHandler();
    this.observeNewEditors();
  }
  
  /**
   * Wait for Monaco editor to be available
   * @returns {Promise<void>}
   */
  async waitForMonaco() {
    let attempts = 0;
    const MAX_WAIT_ATTEMPTS = 20; // 10 seconds max (20 * 500ms)
    const WAIT_INTERVAL_MS = 500; // Check every 500ms
    
    while (!window.monaco && attempts < MAX_WAIT_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL_MS));
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
   * Bind single global Tab handler that works with any active editor
   */
  bindGlobalHandler() {
    // Atomic check-and-set to avoid race conditions
    if (window.__TABOUT_GLOBAL_HANDLER_BOUND) {
      if (this.debugMode) {
        console.log('[Tabout][LeetCode] Global handler already bound by another instance');
      }
      return;
    }
    window.__TABOUT_GLOBAL_HANDLER_BOUND = true;

    try {
      // Create the handler function
      const globalTabHandler = (event) => {
        if (event.key !== 'Tab') return;
        if (!window.monaco?.editor) return;
        
        // Find ANY enabled LeetCode handler instance
        const enabledHandler = this.findEnabledHandler();
        
        // Enhanced debugging
        if (enabledHandler && enabledHandler.debugMode) {
          console.log('[Tabout][LeetCode] Global Tab handler triggered', {
            hasHandler: !!enabledHandler,
            handlerEnabled: enabledHandler?.enabled,
            handlerInstance: enabledHandler
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
      
      // Debug: Confirm global instance assignment
      if (this.debugMode) {
        console.log('[Tabout][LeetCode] Global handler instance set', {
          globalInstance: window.__TABOUT_HANDLER_INSTANCE,
          thisInstance: this,
          areEqual: window.__TABOUT_HANDLER_INSTANCE === this
        });
      }
      
      this.globalHandlerBound = true;
      
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
   * Find an enabled handler instance (could be this or another instance)
   */
  findEnabledHandler() {
    // Return the main handler instance if available
    if (window.__TABOUT_HANDLER_INSTANCE) {
      if (this.debugMode) {
        console.log('[Tabout][LeetCode] Using global handler instance', {
          globalInstance: window.__TABOUT_HANDLER_INSTANCE,
          globalEnabled: window.__TABOUT_HANDLER_INSTANCE.enabled,
          thisInstance: this,
          thisEnabled: this.enabled
        });
      }
      return window.__TABOUT_HANDLER_INSTANCE;
    }
    // Fallback to this instance
    if (this.debugMode) {
      console.log('[Tabout][LeetCode] Using fallback handler instance', {
        thisInstance: this,
        thisEnabled: this.enabled
      });
    }
    return this;
  }
  
  /**
   * Find the currently active/focused Monaco editor
   * @returns {Object|null} - Active editor instance or null
   */
  getActiveEditor() {
    try {
      const editors = this.monaco.editor.getEditors() || [];
      
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
   * Handle Tab key press in editor
   * @param {Object} editor - Monaco editor instance
   * @param {Object} event - Keyboard event
   */
  handleTabKey(editor, event) {
    // CRITICAL: Check if tabout is enabled before processing
    if (!this.enabled) {
      if (this.debugMode) {
        console.log('[Tabout][LeetCode] Tab ignored - handler disabled', {
          enabled: this.enabled,
          handlerInstance: this,
          editorId: editor.getId?.() || 'unknown'
        });
      }
      return; // Don't process if disabled
    }
    
    // Debug: Log when tabout processing starts
    if (this.debugMode) {
      console.log('[Tabout][LeetCode] Processing Tab key - handler ENABLED', {
        enabled: this.enabled,
        handlerInstance: this,
        editorId: editor.getId?.() || 'unknown'
      });
    }
    
    try {
      const model = editor.getModel();
      const selections = editor.getSelections();
      
      if (!model || !selections || selections.length === 0) return;
      
            // Use universal character sets
      const pairs = CHARACTER_SETS;
      
      const updatedSelections = [];
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
            charBefore: lineText[position.column - 2],
            charAt: lineText[position.column - 1],
            charAfter: lineText[position.column],
            editorId: editor.getId ? editor.getId() : 'unknown'
          });
        }
        
        if (newColumn !== null) {
          // Create new selection at tabout position
          const newPosition = new this.monaco.Position(position.lineNumber, newColumn);
          const newSelection = new this.monaco.Selection(
            newPosition.lineNumber, newPosition.column,
            newPosition.lineNumber, newPosition.column
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
   * Observe DOM for new editors (for logging/debugging) with throttling
   */
  observeNewEditors() {
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
      subtree: true
    });
  }
  
  /**
   * Update enabled state
   * @param {boolean} enabled - Whether tabout is enabled
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    
    // Only log setEnabled calls in debug mode
    if (this.debugMode) {
      console.log(`[Tabout][LeetCode] setEnabled called: ${enabled}`, {
        handlerInstance: this,
        isGlobalInstance: window.__TABOUT_HANDLER_INSTANCE === this,
        timestamp: Date.now()
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
   * Check if Monaco is available
   * @returns {boolean} - Whether Monaco is ready
   */
  isReady() {
    return !!(this.monaco && window.monaco);
  }
  
  /**
   * Cleanup resources to prevent memory leaks
   */
  cleanup() {
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
