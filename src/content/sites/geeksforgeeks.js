import { shouldTabout } from '../../shared/core/tabout-engine.js';
import { CHARACTER_SETS } from '../../shared/constants/character-sets.js';

/**
 * GeeksforGeeks-specific handler for Ace editor
 */
export class GFGHandler {
  constructor() {
    this.ace = null;
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
    await this.waitForAce();

    let attempts = 0;

    while(attempts < 20) {
    const editor = this.getActiveEditor();

    if(editor) {
      this.attachCommand(editor);
      return;
    }
    await new Promise(r=> setTimeout(r,300));
    attempts++;
  }
  console.warn('[Tabout][GFG] Editor not found for command binding');
  }
    attachCommand(editor) {
      //editor.setBehavioursEnabled(false); //enable {}
      // editor.commands.removeCommand('indent'); //override Tab
      // editor.commands.removeCommand('insertTab');

      //editor.commands.addCommand({
        // name: "tabout",
        // bindKey: {win: "Tab", mac: "Tab"},
        // exec: (editor) =>{
        //   const handled = this.handleTabKey(editor);
        //   if(!handled) {
        //     //fallback -> normal tab
        //     if(editor.session.getUseSoftTabs()) {
        //       const size = editor.session.getTabSize();
        //       editor.insert(" ".repeat(size));
        //     } else {
        //       editor.insert("\t");
        //     }
        //   }
        // }
        const originalHandler = editor.keyBinding.getKeyboardHandler();

        editor.keyBinding.setKeyboardHandler({
        handleKeyboard: (data, hashId, keyString, keyCode, event) =>{
          if(keyString === 'Tab' || keyCode === 9) {
            //const activeEditor = this.getActiveEditor();
            //if(!activeEditor) return null;
           //const handled = this.handleTabKey(editor);

           //if(handled){
          //   tabout applied 
          // return null;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          const pos = editor.getCursorPosition();
          const line = editor.session.getLine(pos.row);

          let i = pos.column;
          while(i<line.length && /\s/.test(line[i])) i++;

          const char = line[i];
          const closing = new Set([")", "]", "}", '"', "'"]);
          if(closing.has(char)){
            editor.moveCursorTo(pos.row, i+1);
            editor.clearSelection();

          // event.preventDefault();
          // event.stopPropagation();
          // event.stopImmediatePropagation();

            return {
            command: "null" // block Ace
          };

          }
          const size = editor.session.getTabSize();
          editor.insert(" ".repeat(size));

          // event.preventDefault();
          // event.stopPropagation();
          // event.stopImmediatePropagation();
          return {
            command: "null" // block Ace
          };
        }
          //  no tabout - Ace handle tab/indent normally
          // let ace handle tab normally
          //  }
          //fallback: insert tab/spaces
          // if(editor.session.getUseSoftTabs()){
          //   const size = editor.session.getTabSize();
          //   editor.insert(" ".repeat(size));
          // }
          // else {
          //   editor.insert("\t");
          // }
          //  return {command: "null"};
        
          // }

        //stop ace completely
        // event.preventDefault();
        // event.stopPropagation();
        // event.stopImmediatePropagation();
        
        
        //}
        //multiSelectAction: "forEach",
        // scrollIntoView: "cursor",
        // readOnly: false

        //fallback to original
        return originalHandler.handleKeyboard(
          data,
          hashId,
          keyString,
          keyCode,
          event
        );
      }
      });
    }
    //this.bindGlobalHandler();
    //this.observeNewEditors();
  //}
  
  /**
   * Wait for GFG editor to be available
   * @returns {Promise<void>}
   */
  async waitForAce() {
    let attempts = 0;
    const MAX_WAIT_ATTEMPTS = 20; // 10 seconds max (20 * 500ms)
    const WAIT_INTERVAL_MS = 500; // Check every 500ms
    
    while (attempts < MAX_WAIT_ATTEMPTS) {
      const el = document.querySelector('.ace_editor');

      if(el && el.env && el.env.editor) {
        //const el = document.querySelector('.ace_editor');

        //if(el && el.env && el.env.editor.editor) {
          this.ace = el.env.editor;
          //.constructor;
          if(this.debugMode) {
            console.log('[Tabout][GFG] Ace editor detected via DOM');
          }
          return;
        }
      //}
      await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL_MS));
      attempts++;
    }
    
    // if (window.ace) {
    //   this.ace = window.ace;
    //   if (this.debugMode) {
    //     console.log('[Tabout][GFG] Ace editor detected');
    //   }
    // } else {
      console.warn('[Tabout][GFG] Ace editor not found after 10 seconds');
    //}
  }
  
  /**
   * Bind single global Tab handler that works with any active editor
   */
  // bindGlobalHandler() {
  //   // Atomic check-and-set to avoid race conditions
  //   if (window.__TABOUT_GLOBAL_HANDLER_BOUND) {
  //     if (this.debugMode) {
  //       console.log('[Tabout][LeetCode] Global handler already bound by another instance');
  //     }
  //     return;
  //   }
  //   window.__TABOUT_GLOBAL_HANDLER_BOUND = true;

  //   try {
  //     // Create the handler function
  //     const globalTabHandler = (event) => {
  //       if (event.key !== 'Tab') return;

  //       console.log("TAB PRESSED");

  //       if (!window.ace) return;
        
  //       // Find ANY enabled GeeksForGeeks handler instance
  //       const enabledHandler = this.findEnabledHandler();
        
  //       // Enhanced debugging
  //       if (enabledHandler && enabledHandler.debugMode) {
  //         console.log('[Tabout][GFG] Global Tab handler triggered', {
  //           hasHandler: !!enabledHandler,
  //           handlerEnabled: enabledHandler?.enabled,
  //           handlerInstance: enabledHandler
  //         });
  //       }
        
  //       if (!enabledHandler || !enabledHandler.enabled) {
  //         if (enabledHandler && enabledHandler.debugMode) {
  //           console.log('[Tabout][GFG] Global handler skipping - handler disabled or not found');
  //         }
  //         return;
  //       }
        
  //       // Find the currently focused editor
  //       const activeEditor = enabledHandler.getActiveEditor();
        
  //       console.log("Editor:", activeEditor);

  //       if (activeEditor) {
  //         enabledHandler.handleTabKey(activeEditor, event);
  //       }
  //     };
      
  //     // Bind to document with capture and retain reference for cleanup
  //     document.addEventListener('keydown', globalTabHandler, true);
  //     window.__TABOUT_GLOBAL_TAB_HANDLER = globalTabHandler;
      
  //     // Mark global handler instance
  //     window.__TABOUT_HANDLER_INSTANCE = this;
      
  //     // Debug: Confirm global instance assignment
  //     if (this.debugMode) {
  //       console.log('[Tabout][GFG] Global handler instance set', {
  //         globalInstance: window.__TABOUT_HANDLER_INSTANCE,
  //         thisInstance: this,
  //         areEqual: window.__TABOUT_HANDLER_INSTANCE === this
  //       });
  //     }
      
  //     this.globalHandlerBound = true;
      
  //     if (this.debugMode) {
  //       console.log('[Tabout][GFG] Global Tab handler bound (singleton)');
  //     }
  //   } catch (error) {
  //     console.error('[Tabout][GFG] Failed to bind global handler:', error);
  //     // Revert flag on failure
  //     window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
  //   }
  // }
  
  /**
   * Find an enabled handler instance (could be this or another instance)
   */
  findEnabledHandler() {
    // Return the main handler instance if available
    if (window.__TABOUT_HANDLER_INSTANCE) {
      if (this.debugMode) {
        console.log('[Tabout][GFG] Using global handler instance', {
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
      console.log('[Tabout][GFG] Using fallback handler instance', {
        thisInstance: this,
        thisEnabled: this.enabled
      });
    }
    return this;
  }
  
  /**
   * Find the currently active/focused Ace editor
   * @returns {Object|null} - Active editor instance or null
   */
  getActiveEditor() {
    //try {
      // const editors = this.ace.editor.getEditors() || [];
      
      // // Find editor with focus
      // for (const editor of editors) {
      //   if (editor.hasTextFocus && editor.hasTextFocus()) {
      //     return editor;
      //   }
      // }
      
      // // Fallback: find editor containing the focused element
      // const focusedElement = document.activeElement;
      // if (focusedElement) {
      //   for (const editor of editors) {
      //     const editorElement = editor.getDomNode && editor.getDomNode();
      //     if (editorElement && editorElement.contains(focusedElement)) {
      //       return editor;
      //     }
      //   }
      // }
      
      // if (this.debugMode && editors.length > 0) {
      //   console.log('[Tabout][GFG] No active editor found among', editors.length, 'editors');
      // }
      
      try {
        const editors = [];

        document.querySelectorAll('.ace_editor').forEach(el =>{
          if(el.env && el.env.editor) {
            editors.push(el.env.editor);
          }
        });
        //Iframe support
        document.querySelectorAll('iframe').forEach(frame => {
          try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if(!doc) return;

            doc.querySelectorAll('.ace_editor').forEach(el => {
              if(el.env?.editor) editors.push(el.env.editor);
            });
          } catch(e) {
            //cross-origin -> ignore
          }
        });
        for(const ed of editors) {
          if (ed.isFocused()) return ed;
        }
        return editors[0] || null;
        // el = document.querySelector('.ace_editor');
        // if(!el) return null;
        // return this.ace.edit(el.id);
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
    // CRITICAL: Check if tabout is enabled before processing
    if (!this.enabled) {
      if (this.debugMode) {
        console.log('[Tabout][GFG] Tab ignored - handler disabled', {
          enabled: this.enabled,
          handlerInstance: this,
          editorId: editor.getId?.() || 'unknown'
        });
      }
      return false; // Don't process if disabled
    }
    
    // Debug: Log when tabout processing starts
    if (this.debugMode) {
      console.log('[Tabout][GFG] Processing Tab key - handler ENABLED', {
        enabled: this.enabled,
        handlerInstance: this,
        editorId: editor.getId?.() || 'unknown'
      });
    }
    
    try {
      //const editor = ace.edit(document.querySelector('.ace_editor').id);
      const cursor = editor.getCursorPosition();
      const line = editor.session.getLine(cursor.row);
      // console.log({
      //   line,
      //   cursorCol: cursor.column,
      //   charAtCursor: line[cursor.column]
      // });
      
      //if (!model || !selections || selections.length === 0) return;
      
            // Use universal character sets
      //const pairs = CHARACTER_SETS;
      
    //   const updatedSelections = [];
    //   let anyTaboutApplied = false;
      
    //   for (const selection of selections) {
    //     // Skip if there's a text selection (not just cursor)
    //     if (!selection.isEmpty()) {
    //       updatedSelections.push(selection);
    //       continue;
    //     }
        
    //     const position = selection.getPosition();
    //     const lineText = model.getLineContent(position.lineNumber) || '';

    //build closing set
    const closingSet = new Set(CHARACTER_SETS.map(p => p.close));

    // for(let row = cursor.row; row<totalLines; row++){

    // const line = editor.session.getLine(row);

    //find next meaningful character on current line only
    let scanColumn = cursor.column;
    
    //peak ahead without modifying cursor
    //let scanColumn = originalColumn;

    //skip whitespaces to find next "meaningful" char
    //if(!closingSet.has(line[scanColumn])){
      //look ahead
    while(scanColumn< line.length && /\s/.test(line[scanColumn])){
      scanColumn++;
    }
  //}

    // if we reached end => no tabout
    // if(scanColumn >=line.length) {
    //   editor.insert("     ");
    //   event.preventDefault();
    //   return;
    // }

    

    const charAhead = line[scanColumn];

    //if no character or not a closing bracket -> normal tab
    if(!charAhead || !closingSet.has(charAhead)){
      return false; //let Ace handle tab normally 
    }

      //move one step back if we are on closing bracket
      // if(){
        // const char = line[cursor.column]
        //scan column points at closing bracket
        const result = shouldTabout(line,scanColumn, CHARACTER_SETS);
        if (typeof result !== "number") {
          //const newColumn = scanColumn + 1;
          return false; //not a valid tabout -> normal tab
        }
        // Create new selection at tabout position
      //   const newPosition = new this.ace.Position(position.lineNumber, newColumn);
      //   const newSelection = new this.ace.Selection(
      //     newPosition.lineNumber, newPosition.column,
      //     newPosition.lineNumber, newPosition.column
      //   );
      //   updatedSelections.push(newSelection);
      //   anyTaboutApplied = true;
      // } else {
      //   // Keep original selection
      //   updatedSelections.push(selection);
      // }

      //cancel Ace's default tab/space insertion
      // if(event && typeof event.preventDefault === 'function')
      // event.preventDefault();
      //event.stopPropagation();
      //event.stopImmediatePropagation();

      // move cursor PAST the closing bracket
      const newColumn = scanColumn + 1;
      //move immediately
      editor.moveCursorTo(cursor.row, newColumn) // shift forward
      editor.clearSelection(); 
      editor.renderer.scrollCursorIntoView();
      //force it again after Ace finishes its async stuff
     
        //editor.moveCursorTo(cursor.row, newColumn) // shift forward
        //editor.clearSelection(); 
        //ensure renderer updates cursor position
        //force cursor to be shown in right place
        // requestAnimationFrame(() =>{
        //   editor.renderer.updateCursor();
    
        //   editor.renderer.scrollCursorIntoView();
        // });
        // setTimeout(() => {
        //   editor.moveCursorTo(cursor.row, newColumn);
        //   editor.clearSelection();
          
        // },0);
        
        return true;
        //{command: "null"}; //Tell Ace "I handled Tab"
        // if(closingSet.includes(char)) {

          //column--; //simulate cursor before closing bracket
        //}
        //}
      // }
        //fallback for normal tab 
        // event.preventDefault();
        // // use Ace's internal logic for string insertion
        
        // if (editor.session.getUseSoftTabs()) {
        //   const tabSize = editor.session.getTabSize();
        //   const spaces = " ".repeat(tabSize - (cursor.column % tabSize));
        //   editor.insert(spaces);
        // } else {
        //   editor.insert("\t");
        // }
        //break;
        // }
        // return false;
        //return;
        

        //console.log(CHARACTER_SETS);

        //console.log({line, cursor: column, charAhead: line[column], newColumn});
 
        // if (this.debugMode) {
        //   console.log('[Tabout][GFG] Tab decision:', {
        //     line,
        //     column: column,
        //     newColumn,
        //     // charBefore: lineText[position.column - 2],
        //     // charAt: lineText[position.column - 1],
        //     // charAfter: lineText[position.column],
        //     // editorId: editor.getId ? editor.getId() : 'unknown'
        //   });
        
        
        
      
      
    //   if (anyTaboutApplied) {
    //     event.preventDefault();
    //     event.stopPropagation();
    //     editor.setSelections(updatedSelections);
        
    //     if (this.debugMode) {
    //       console.log('[Tabout][GFG] Tabout applied');
    //     }
    //   }
    } catch (error) {
      console.error('[Tabout][GFG] Error handling tab key:', error);
      return false;
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
      
      if (this.debugMode && this.ace?.editor) {
        const editors = this.ace.editor.getEditors() || [];
        if (editors.length > 0) {
          console.log(`[GFG][LeetCode] Found ${editors.length} editors available`);
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
      console.log(`[Tabout][GFG] setEnabled called: ${enabled}`, {
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
      console.log('[Tabout][GFG] Handler cleaned up');
    }
  }
}
