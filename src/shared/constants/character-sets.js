/**
 * @typedef {Object} CharacterSet
 * @property {string} open - Opening character
 * @property {string} close - Closing character
 */

/**
 * Universal character sets that work across all programming languages
 * Note: For single characters like ';' and ',', open === close (tab past the character)
 */
export const CHARACTER_SETS = [
  { open: '(', close: ')' },
  { open: '[', close: ']' },
  { open: '{', close: '}' },
  { open: "'", close: "'" },
  { open: '"', close: '"' },
  { open: ';', close: ';' },  // Semicolon - tab past it
  { open: ',', close: ',' },  // Comma - tab past it
  { open: '<', close: '>' },  // Generics, templates, comparisons
  { open: '`', close: '`' }   // Template literals (JS/TS)
];
