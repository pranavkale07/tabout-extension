/**
 * Universal tabout logic that works across all editors and sites
 * Enhanced with Smart Jump Points feature
 */

/**
 * Check if a character is a special bracket/quote character
 * @param {string} char - Character to check
 * @param {Array<{open: string, close: string}>} pairs - Bracket pairs
 * @returns {boolean} - Whether character is special
 */
function isSpecialChar(char, pairs) {
  if (!char) return false;
  return pairs.some(pair => pair.open === char || pair.close === char);
}

/**
 * Find the next jump point marker in the document
 * @param {Array<string>} lines - All lines in the document
 * @param {number} currentLine - Current line number (0-based)
 * @param {number} currentCol - Current column (0-based)
 * @param {Array<string>} markers - Jump point markers to search for
 * @param {boolean} caseSensitive - Whether search is case sensitive
 * @param {boolean} wrapAround - Whether to wrap to beginning when reaching end
 * @returns {Object|null} - {line, column, marker} or null if not found
 */
export function findNextJumpPoint(lines, currentLine, currentCol, markers, caseSensitive = false, wrapAround = true) {
  if (!markers || markers.length === 0 || !lines || lines.length === 0) {
    return null;
  }

  const totalLines = lines.length;
  let searchStartCol = currentCol + 1; // Start searching from next character
  
  // First, search from current position to end of document
  for (let lineIdx = currentLine; lineIdx < totalLines; lineIdx++) {
    const line = lines[lineIdx];
    const searchFrom = lineIdx === currentLine ? searchStartCol : 0;
    
    const result = findMarkerInLine(line, markers, searchFrom, caseSensitive);
    if (result) {
      return {
        line: lineIdx,
        column: result.column,
        marker: result.marker,
        endColumn: result.endColumn
      };
    }
  }
  
  // If wrapAround is enabled, search from beginning to current position
  if (wrapAround) {
    for (let lineIdx = 0; lineIdx <= currentLine; lineIdx++) {
      const line = lines[lineIdx];
      const searchTo = lineIdx === currentLine ? currentCol : line.length;
      
      const result = findMarkerInLine(line, markers, 0, caseSensitive, searchTo);
      if (result) {
        return {
          line: lineIdx,
          column: result.column,
          marker: result.marker,
          endColumn: result.endColumn
        };
      }
    }
  }
  
  return null;
}

/**
 * Find a marker in a single line
 * @param {string} line - Line text to search
 * @param {Array<string>} markers - Markers to find
 * @param {number} startCol - Column to start searching from
 * @param {boolean} caseSensitive - Case sensitive search
 * @param {number} endCol - Column to end searching (exclusive)
 * @returns {Object|null} - {column, marker, endColumn} or null
 */
function findMarkerInLine(line, markers, startCol = 0, caseSensitive = false, endCol = null) {
  const searchText = line.slice(startCol, endCol || line.length);
  const searchIn = caseSensitive ? searchText : searchText.toLowerCase();
  
  let closestMatch = null;
  let closestIndex = Infinity;
  
  for (const marker of markers) {
    const searchMarker = caseSensitive ? marker : marker.toLowerCase();
    const index = searchIn.indexOf(searchMarker);
    
    if (index !== -1 && index < closestIndex) {
      closestIndex = index;
      closestMatch = {
        column: startCol + index,
        marker: marker,
        endColumn: startCol + index + marker.length
      };
    }
  }
  
  return closestMatch;
}

/**
 * Core tabout decision logic - Enhanced with jump points
 * @param {string} lineText - Current line text
 * @param {number} column1Based - Cursor column position (1-based)
 * @param {Array<{open: string, close: string}>} pairs - Bracket pairs
 * @param {Object} jumpPointConfig - Jump point configuration (optional)
 * @returns {number|null} - New cursor position (1-based) or null if no tabout
 */
export function shouldTabout(lineText, column1Based, pairs, jumpPointConfig = null) {
  const col0 = column1Based - 1; // Convert to 0-based
  
  // Don't tabout if at beginning of line
  if (col0 <= 0) return null;
  
  // Don't tabout if only whitespace before cursor
  const before = lineText.slice(0, col0);
  if (/^\s*$/.test(before)) return null;
  
  const nextChar = lineText[col0] || '';
  
  // Priority 1: If cursor is directly before a special character, skip it
  // Examples: func(param|) -> func(param)|, func(|) -> func()|, array[i|] -> array[i]|
  if (isSpecialChar(nextChar, pairs)) {
    return col0 + 2; // Skip just one character (1-based position)
  }
  
  // Priority 2: Check for jump point markers on current line (if enabled)
  if (jumpPointConfig && jumpPointConfig.enabled && jumpPointConfig.markers) {
    const result = findMarkerInLine(
      lineText, 
      jumpPointConfig.markers, 
      col0 + 1, 
      jumpPointConfig.caseSensitive || false
    );
    
    if (result) {
      // Position cursor at the start of the marker for easy replacement
      return result.column + 1; // Convert to 1-based
    }
  }
  
  return null; // No tabout applicable
}

/**
 * Debug helper to explain tabout decision
 * @param {string} lineText - Current line text
 * @param {number} column1Based - Cursor column position (1-based)
 * @param {Array<{open: string, close: string}>} pairs - Bracket pairs
 * @returns {Object} - Debug information
 */
export function debugTabout(lineText, column1Based, pairs) {
  const col0 = column1Based - 1;
  const before = lineText.slice(0, col0);
  const nextChar = lineText[col0] || '';
  const result = shouldTabout(lineText, column1Based, pairs);
  
  return {
    lineText,
    cursorPos: column1Based,
    before,
    nextChar,
    result,
    reason: result ? 'Tabout applied' : 'No tabout needed',
    beforeIsWhitespace: /^\s*$/.test(before),
    nextIsSpecial: isSpecialChar(nextChar, pairs)
  };
}
