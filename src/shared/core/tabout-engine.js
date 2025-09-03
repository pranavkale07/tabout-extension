/**
 * Universal tabout logic that works across all editors and sites
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
 * Core tabout decision logic
 * @param {string} lineText - Current line text
 * @param {number} column1Based - Cursor column position (1-based)
 * @param {Array<{open: string, close: string}>} pairs - Bracket pairs
 * @returns {number|null} - New cursor position (1-based) or null if no tabout
 */
export function shouldTabout(lineText, column1Based, pairs) {
  const col0 = column1Based - 1; // Convert to 0-based
  
  // Don't tabout if at beginning of line
  if (col0 <= 0) return null;
  
  // Don't tabout if only whitespace before cursor
  const before = lineText.slice(0, col0);
  if (/^\s*$/.test(before)) return null;
  
  const nextChar = lineText[col0] || '';
  
  // Simple rule: If cursor is directly before a special character, skip it
  // Examples: func(param|) -> func(param)|, func(|) -> func()|, array[i|] -> array[i]|
  if (isSpecialChar(nextChar, pairs)) {
    return col0 + 2; // Skip just one character (1-based position)
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
