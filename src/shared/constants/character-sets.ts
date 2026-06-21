/**
 * A pair of characters the tabout engine can skip past.
 * For single characters like `;` and `,`, `open === close` (tab past the char).
 */
export interface CharacterPair {
  /** Opening character. */
  open: string;
  /** Closing character. */
  close: string;
}

/**
 * Universal character sets that work across all programming languages.
 */
export const CHARACTER_SETS: readonly CharacterPair[] = [
  { open: '(', close: ')' },
  { open: '[', close: ']' },
  { open: '{', close: '}' },
  { open: "'", close: "'" },
  { open: '"', close: '"' },
  { open: ';', close: ';' }, // Semicolon - tab past it
  { open: ',', close: ',' }, // Comma - tab past it
  { open: '<', close: '>' }, // Generics, templates, comparisons
  { open: '`', close: '`' }, // Template literals (JS/TS)
];
