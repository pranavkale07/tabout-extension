import { shouldTabout } from '../../src/shared/core/tabout-engine.js';
import { CHARACTER_SETS } from '../../src/shared/constants/character-sets.js';
import { BRACKET_TEST_CASES } from '../fixtures/test-data.js';

describe('tabout-engine', () => {
  describe('shouldTabout', () => {
    // Test all bracket and quote scenarios
    BRACKET_TEST_CASES.forEach(({ input, cursor, expected, description }) => {
      test(`should handle ${description}: "${input}" at cursor ${cursor}`, () => {
        const result = shouldTabout(input, cursor, CHARACTER_SETS);
        expect(result).toBe(expected);
      });
    });

    // Additional edge cases
    test('should handle undefined input', () => {
      expect(shouldTabout(undefined, 0, CHARACTER_SETS)).toBe(null);
    });

    test('should handle null input', () => {
      expect(shouldTabout(null, 0, CHARACTER_SETS)).toBe(null);
    });

    test('should handle negative cursor position', () => {
      expect(shouldTabout('()', -1, CHARACTER_SETS)).toBe(null);
    });

    test('should handle cursor beyond string length', () => {
      expect(shouldTabout('()', 10, CHARACTER_SETS)).toBe(null);
    });

    test('should handle cursor at string boundary', () => {
      expect(shouldTabout('()', 2, CHARACTER_SETS)).toBe(3);
    });

    // Test specific complex scenarios
    test('should handle mixed brackets and quotes', () => {
      expect(shouldTabout('("test")', 7, CHARACTER_SETS)).toBe(8);
      expect(shouldTabout('("test")', 1, CHARACTER_SETS)).toBe(null);
    });

    test('should handle nested mixed brackets', () => {
      expect(shouldTabout('([{', 2, CHARACTER_SETS)).toBe(3);
      expect(shouldTabout('([{', 3, CHARACTER_SETS)).toBe(4);
    });

    test('should handle quotes within brackets', () => {
      expect(shouldTabout('("")', 3, CHARACTER_SETS)).toBe(4);
      expect(shouldTabout('("")', 2, CHARACTER_SETS)).toBe(3);
    });

    test('should handle brackets within quotes', () => {
      expect(shouldTabout('"()"', 3, CHARACTER_SETS)).toBe(4);
      expect(shouldTabout('"()"', 2, CHARACTER_SETS)).toBe(3);
    });

    // Test whitespace handling
    test('should handle leading whitespace', () => {
      expect(shouldTabout('  ()', 3, CHARACTER_SETS)).toBe(null);
      expect(shouldTabout('  ()', 2, CHARACTER_SETS)).toBe(null);
    });

    test('should handle trailing whitespace', () => {
      expect(shouldTabout('()  ', 1, CHARACTER_SETS)).toBe(null);
      expect(shouldTabout('()  ', 2, CHARACTER_SETS)).toBe(3);
    });

    test('should handle whitespace before closer', () => {
      expect(shouldTabout('( )', 2, CHARACTER_SETS)).toBe(null);
      expect(shouldTabout('( )', 1, CHARACTER_SETS)).toBe(null);
    });

    // Test special characters
    test('should handle semicolon', () => {
      expect(shouldTabout('a;', 1, CHARACTER_SETS)).toBe(null);
    });

    test('should handle comma', () => {
      expect(shouldTabout('a,', 1, CHARACTER_SETS)).toBe(null);
    });

    // Test performance with long strings
    test('should handle long strings efficiently', () => {
      const longString = 'a'.repeat(100) + '()' + 'b'.repeat(100);
      const start = Date.now();
      const result = shouldTabout(longString, 101, CHARACTER_SETS);
      const end = Date.now();
      
      expect(result).toBe(102);
      expect(end - start).toBeLessThan(50); // Should complete in under 50ms
    });
  });
});
