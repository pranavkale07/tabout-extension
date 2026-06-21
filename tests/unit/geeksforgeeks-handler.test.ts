import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GeeksForGeeksHandler } from '../../src/content/sites/geeksforgeeks';

/** Build a minimal fake Ace editor around a single line of text (0-based cols). */
function makeAceEditor(line: string, column: number) {
  const moveCursorTo = vi.fn();
  const clearSelection = vi.fn();
  const editor = {
    getSession: () => ({ getLine: () => line }),
    getSelection: () => ({ isEmpty: () => true, clearSelection }),
    getCursorPosition: () => ({ row: 0, column }),
    isFocused: () => true,
    moveCursorTo,
  };
  return { editor, moveCursorTo, clearSelection };
}

describe('GeeksForGeeksHandler', () => {
  beforeEach(() => {
    window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
    window.__TABOUT_HANDLER_INSTANCE = null;
    window.ace = { edit: vi.fn() } as never;
  });

  test('moves cursor past a closing bracket (0-based conversion)', () => {
    const handler = new GeeksForGeeksHandler();
    (handler as unknown as { ace: typeof window.ace }).ace = window.ace;

    const { editor, moveCursorTo, clearSelection } = makeAceEditor('foo()', 4); // before ')'
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent;

    handler.handleTabKey(editor as never, event);

    expect(event.preventDefault).toHaveBeenCalled();
    // shouldTabout('foo()', 5) -> 6 (1-based); Ace gets 6-1 = 5
    expect(moveCursorTo).toHaveBeenCalledWith(0, 5);
    expect(clearSelection).toHaveBeenCalled();
  });

  test('does nothing when no tabout applies', () => {
    const handler = new GeeksForGeeksHandler();
    (handler as unknown as { ace: typeof window.ace }).ace = window.ace;

    const { editor, moveCursorTo } = makeAceEditor('foo', 3);
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent;

    handler.handleTabKey(editor as never, event);

    expect(moveCursorTo).not.toHaveBeenCalled();
  });
});
