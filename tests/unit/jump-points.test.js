import { findNextJumpPoint } from '../../src/shared/core/tabout-engine.js';

describe('Jump Points Feature', () => {
  describe('findNextJumpPoint', () => {
    const markers = ['TODO', 'FIXME', '___', 'null'];

    test('should find marker on same line after cursor', () => {
      const lines = ['int x = ___; // TODO: fix this'];
      const result = findNextJumpPoint(lines, 0, 0, markers);
      
      expect(result).not.toBeNull();
      expect(result.line).toBe(0);
      expect(result.column).toBe(8);
      expect(result.marker).toBe('___');
    });

    test('should find marker on next line when not found on current line', () => {
      const lines = [
        'int x = 5;',
        'int y = ___;'
      ];
      const result = findNextJumpPoint(lines, 0, 5, markers);
      
      expect(result).not.toBeNull();
      expect(result.line).toBe(1);
      expect(result.column).toBe(8);
      expect(result.marker).toBe('___');
    });

    test('should wrap around to beginning when wrapAround is true', () => {
      const lines = [
        'int x = ___;',
        'int y = 5;'
      ];
      const result = findNextJumpPoint(lines, 1, 5, markers, false, true);
      
      expect(result).not.toBeNull();
      expect(result.line).toBe(0);
      expect(result.column).toBe(8);
      expect(result.marker).toBe('___');
    });

    test('should not wrap around when wrapAround is false', () => {
      const lines = [
        'int x = ___;',
        'int y = 5;'
      ];
      const result = findNextJumpPoint(lines, 1, 5, markers, false, false);
      
      expect(result).toBeNull();
    });

    test('should find closest marker when multiple markers on same line', () => {
      const lines = ['int x = ___; int y = TODO;'];
      const result = findNextJumpPoint(lines, 0, 0, markers);
      
      expect(result).not.toBeNull();
      expect(result.column).toBe(8); // Should find ___ first
      expect(result.marker).toBe('___');
    });

    test('should skip current position and find next occurrence', () => {
      const lines = ['int x = ___; int y = ___;'];
      const result = findNextJumpPoint(lines, 0, 8, markers);
      
      expect(result).not.toBeNull();
      expect(result.column).toBe(21); // Should find second ___
      expect(result.marker).toBe('___');
    });

    test('should be case sensitive when specified', () => {
      const lines = ['// todo something', '// TODO something'];
      const result = findNextJumpPoint(lines, 0, 0, ['TODO'], true);
      
      expect(result).not.toBeNull();
      expect(result.line).toBe(1); // Should skip lowercase 'todo'
      expect(result.marker).toBe('TODO');
    });

    test('should be case insensitive when specified', () => {
      const lines = ['// todo something'];
      const result = findNextJumpPoint(lines, 0, 0, ['TODO'], false);
      
      expect(result).not.toBeNull();
      expect(result.line).toBe(0);
      expect(result.marker).toBe('TODO');
    });

    test('should return null when no markers found', () => {
      const lines = ['int x = 5;', 'int y = 10;'];
      const result = findNextJumpPoint(lines, 0, 0, markers);
      
      expect(result).toBeNull();
    });

    test('should return null for empty document', () => {
      const lines = [];
      const result = findNextJumpPoint(lines, 0, 0, markers);
      
      expect(result).toBeNull();
    });

    test('should return null for empty markers array', () => {
      const lines = ['int x = ___;'];
      const result = findNextJumpPoint(lines, 0, 0, []);
      
      expect(result).toBeNull();
    });

    test('should find marker at beginning of line', () => {
      const lines = ['TODO: implement this'];
      const result = findNextJumpPoint(lines, 0, 0, ['TODO']);
      
      expect(result).not.toBeNull();
      expect(result.column).toBe(0);
      expect(result.marker).toBe('TODO');
    });

    test('should find marker at end of line', () => {
      const lines = ['int x = null'];
      const result = findNextJumpPoint(lines, 0, 0, ['null']);
      
      expect(result).not.toBeNull();
      expect(result.column).toBe(8);
      expect(result.marker).toBe('null');
    });

    test('should handle multiline code with multiple markers', () => {
      const lines = [
        '// TODO: part 1',
        'int x = ___;',
        '// FIXME: bug here',
        'int y = null;'
      ];
      
      // Find first marker
      let result = findNextJumpPoint(lines, 0, 0, markers);
      expect(result.marker).toBe('TODO');
      expect(result.line).toBe(0);
      
      // Find second marker
      result = findNextJumpPoint(lines, result.line, result.endColumn, markers);
      expect(result.marker).toBe('___');
      expect(result.line).toBe(1);
      
      // Find third marker
      result = findNextJumpPoint(lines, result.line, result.endColumn, markers);
      expect(result.marker).toBe('FIXME');
      expect(result.line).toBe(2);
      
      // Find fourth marker
      result = findNextJumpPoint(lines, result.line, result.endColumn, markers);
      expect(result.marker).toBe('null');
      expect(result.line).toBe(3);
    });

    test('should handle complex LeetCode template', () => {
      const lines = [
        'int left = 0, right = ___-1;',
        'while (left < right) {',
        '    // TODO: Add logic',
        '    if (___) {',
        '        left++;',
        '    }',
        '}'
      ];
      
      // Should find markers in order: ___, TODO, ___
      let result = findNextJumpPoint(lines, 0, 0, markers);
      expect(result.marker).toBe('___');
      expect(result.line).toBe(0);
      
      result = findNextJumpPoint(lines, result.line, result.endColumn, markers);
      expect(result.marker).toBe('TODO');
      expect(result.line).toBe(2);
      
      result = findNextJumpPoint(lines, result.line, result.endColumn, markers);
      expect(result.marker).toBe('___');
      expect(result.line).toBe(3);
    });

    test('should handle custom markers', () => {
      const customMarkers = ['@JUMP@', '###', 'COMPLETE'];
      const lines = [
        'int x = @JUMP@;',
        'int y = ###;',
        '// COMPLETE this'
      ];
      
      let result = findNextJumpPoint(lines, 0, 0, customMarkers);
      expect(result.marker).toBe('@JUMP@');
      
      result = findNextJumpPoint(lines, result.line, result.endColumn, customMarkers);
      expect(result.marker).toBe('###');
      
      result = findNextJumpPoint(lines, result.line, result.endColumn, customMarkers);
      expect(result.marker).toBe('COMPLETE');
    });
  });
});
