/**
 * Universal tabout logic that works across all editors and sites.
 */
import type { CharacterPair } from '../constants/character-sets';

/**
 * Check if a character is a special bracket/quote character.
 */
function isSpecialChar(char: string, pairs: readonly CharacterPair[]): boolean {
  if (!char) return false;
  return pairs.some((pair) => pair.open === char || pair.close === char);
}

/**
 * Core tabout decision logic.
 *
 * @param lineText - Current line text
 * @param column1Based - Cursor column position (1-based)
 * @param pairs - Bracket pairs
 * @returns New cursor position (1-based) or null if no tabout
 */
export function shouldTabout(
  lineText: string | null | undefined,
  column1Based: number,
  pairs: readonly CharacterPair[],
): number | null {
  // Guard against null/undefined line text (e.g. empty model).
  if (typeof lineText !== 'string') return null;

  const col0 = column1Based - 1; // Convert to 0-based

  // Don't tabout if at beginning of line
  if (col0 <= 0) return null;

  // Don't tabout if only whitespace before cursor
  const before = lineText.slice(0, col0);
  if (/^\s*$/.test(before)) return null;

  const nextChar = lineText[col0] || '';

  // Simple rule: If cursor is directly before a special character, skip it.
  // Examples: func(param|) -> func(param)|, func(|) -> func()|, array[i|] -> array[i]|
  if (isSpecialChar(nextChar, pairs)) {
    return col0 + 2; // Skip just one character (1-based position)
  }

  return null; // No tabout applicable
}

/** Debug information explaining a tabout decision. */
export interface TaboutDebugInfo {
  lineText: string;
  cursorPos: number;
  before: string;
  nextChar: string;
  result: number | null;
  reason: string;
  beforeIsWhitespace: boolean;
  nextIsSpecial: boolean;
}

/**
 * Debug helper to explain a tabout decision.
 */
export function debugTabout(
  lineText: string,
  column1Based: number,
  pairs: readonly CharacterPair[],
): TaboutDebugInfo {
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
    nextIsSpecial: isSpecialChar(nextChar, pairs),
  };
}
